import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { TaioTransaction } from './entities/taio-transaction.entity';
import { StoreItem } from './entities/store-item.entity';
import { StoreRedemption } from './entities/store-redemption.entity';

@Injectable()
export class TaioService {
  private readonly logger = new Logger(TaioService.name);

  constructor(
    @InjectModel(TaioTransaction) private txModel: typeof TaioTransaction,
    @InjectModel(StoreItem) private itemModel: typeof StoreItem,
    @InjectModel(StoreRedemption) private redemptionModel: typeof StoreRedemption,
  ) {}

  async getBalance(churchId: string, memberId: string, serviceYearId?: string) {
    const where: any = { churchId, churchMemberId: memberId };
    if (serviceYearId) where.serviceYearId = serviceYearId;
    const txs = await this.txModel.findAll({ where, attributes: ['points'] });
    const balance = txs.reduce((sum, t) => sum + t.points, 0);
    return { balance };
  }

  async getTransactions(churchId: string, memberId: string, serviceYearId?: string) {
    const where: any = { churchId, churchMemberId: memberId };
    if (serviceYearId) where.serviceYearId = serviceYearId;
    return this.txModel.findAll({ where, order: [['createdAt', 'DESC']], limit: 100 });
  }

  async awardPoints(churchId: string, body: any, awardedBy: string) {
    const { churchMemberId, points, reason, sourceType, sourceId, serviceYearId } = body;
    return this.txModel.create({
      churchId, churchMemberId, points, reason, sourceType, sourceId, assignedBy: awardedBy, serviceYearId,
    } as any);
  }

  async getLeaderboard(churchId: string, serviceId?: string, serviceYearId?: string) {
    const where: any = { churchId };
    if (serviceYearId) where.serviceYearId = serviceYearId;
    const rows = await this.txModel.findAll({
      where,
      attributes: [
        'churchMemberId',
        [this.txModel.sequelize!.fn('SUM', this.txModel.sequelize!.col('points')), 'balance'],
      ],
      group: ['churchMemberId'],
      order: [[this.txModel.sequelize!.literal('SUM(points)'), 'DESC']],
      limit: 50,
    });
    return rows;
  }

  async getStoreItems(churchId: string) {
    return this.itemModel.findAll({ where: { churchId, isActive: true } });
  }

  async redeemItem(churchId: string, body: any, memberId: string) {
    const { storeItemId, quantity } = body;
    const item = await this.itemModel.findByPk(storeItemId);
    if (!item) throw new NotFoundException('Store item not found');
    if (item.stockQuantity < (quantity || 1)) throw new NotFoundException('Insufficient stock');

    const { balance } = await this.getBalance(churchId, memberId);
    const cost = item.pointCost * (quantity || 1);
    if (balance < cost) throw new NotFoundException('Insufficient taio points');

    const txRecord = await this.txModel.create({
      churchId, churchMemberId: memberId, points: -cost, reason: `Store redemption - ${item.name}`,
      sourceType: 'redemption', sourceId: null, assignedBy: null, serviceYearId: body.serviceYearId,
    } as any);

    return this.redemptionModel.create({
      churchId, churchMemberId: memberId, storeItemId, quantity: quantity || 1,
      taioTransactionId: txRecord.id, status: 'pending',
    } as any);
  }

  async getMyRedemptions(churchId: string, memberId: string) {
    return this.redemptionModel.findAll({
      where: { churchId, churchMemberId: memberId },
      include: [{ association: 'item' }],
      order: [['redeemedAt', 'DESC']],
    });
  }

  async fulfillRedemption(churchId: string, id: string) {
    const redemption = await this.redemptionModel.findOne({ where: { id, churchId } });
    if (!redemption) throw new NotFoundException('Redemption not found');
    await redemption.update({ status: 'fulfilled', fulfilledAt: new Date() } as any);
    await this.itemModel.decrement('stockQuantity', { by: redemption.quantity, where: { id: redemption.storeItemId } });
    return redemption;
  }
}
