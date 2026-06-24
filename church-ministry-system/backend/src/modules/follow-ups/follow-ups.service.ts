import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FollowupFamily } from './entities/followup-family.entity';
import { FollowupAssignment } from './entities/followup-assignment.entity';
import { FollowupLog } from './entities/followup-log.entity';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { AddActivityDto } from './dto/add-activity.dto';
import { ServiceYear } from '../service-year/entities/service-year.entity';

@Injectable()
export class FollowUpsService {
  private readonly logger = new Logger(FollowUpsService.name);

  constructor(
    @InjectModel(FollowupFamily) private familyModel: typeof FollowupFamily,
    @InjectModel(FollowupAssignment) private assignmentModel: typeof FollowupAssignment,
    @InjectModel(FollowupLog) private logModel: typeof FollowupLog,
    @InjectModel(ServiceYear) private serviceYearModel: typeof ServiceYear,
  ) {}

  async create(churchId: string, dto: CreateFollowUpDto, userId: string) {
    const serviceYear = await this.serviceYearModel.findOne({
      where: { churchId, isCurrent: true },
    });
    const family = await this.familyModel.create({
      ...dto,
      churchId,
      serviceYearId: dto.serviceYearId || serviceYear?.id,
    } as any);
    if (dto.servedMemberId) {
      await this.assignmentModel.create({
        churchId,
        followupFamilyId: family.id,
        churchMemberId: dto.servedMemberId,
      } as any);
    }
    return family;
  }

  async findAll(churchId: string, servantId?: string) {
    const where: any = { churchId };
    if (servantId) where.servantId = servantId;
    return this.familyModel.findAll({
      where,
      include: [
        { association: 'servant', attributes: ['id'] },
        { association: 'service', attributes: ['id', 'name'] },
        { association: 'assignments', separate: true },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(churchId: string, id: string) {
    const family = await this.familyModel.findOne({
      where: { id, churchId },
      include: [
        { association: 'servant' },
        { association: 'service' },
        { association: 'assignments' },
      ],
    });
    if (!family) throw new NotFoundException('Follow-up not found');
    return family;
  }

  async updateStatus(churchId: string, id: string, status: string) {
    const family = await this.familyModel.findOne({ where: { id, churchId } });
    if (!family) throw new NotFoundException('Follow-up not found');
    await family.update({ status } as any);
    return family;
  }

  async addActivity(churchId: string, followupFamilyId: string, dto: AddActivityDto, userId: string) {
    const family = await this.familyModel.findOne({ where: { id: followupFamilyId, churchId } });
    if (!family) throw new NotFoundException('Follow-up not found');
    return this.logModel.create({
      ...dto,
      churchId,
      followupFamilyId,
      churchMemberId: dto.churchMemberId,
      loggedAt: new Date(),
    } as any);
  }

  async remove(churchId: string, id: string) {
    const family = await this.familyModel.findOne({ where: { id, churchId } });
    if (!family) throw new NotFoundException('Follow-up not found');
    await family.destroy();
    return { success: true };
  }
}
