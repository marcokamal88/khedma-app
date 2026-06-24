import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Preparation } from './entities/preparation.entity';
import { PreparationFile } from './entities/preparation-file.entity';

@Injectable()
export class PreparationService {
  constructor(
    @InjectModel(Preparation) private prepModel: typeof Preparation,
    @InjectModel(PreparationFile) private fileModel: typeof PreparationFile,
  ) {}

  async create(churchId: number, data: Partial<Preparation>, servantId: number) {
    return this.prepModel.create({
      ...data,
      churchId,
      servantId,
      status: 'draft',
    } as any);
  }

  async findAll(
    churchId: number,
    filters: { servantId?: number; serviceId?: number; status?: string },
  ) {
    const where: any = { churchId };
    if (filters.servantId) where.servantId = filters.servantId;
    if (filters.serviceId) where.serviceId = filters.serviceId;
    if (filters.status) where.status = filters.status;

    return this.prepModel.findAll({
      where,
      include: [{ model: PreparationFile }],
      order: [['lessonDate', 'DESC']],
    });
  }

  async findOne(churchId: number, id: number) {
    const prep = await this.prepModel.findOne({
      where: { id, churchId },
      include: [{ model: PreparationFile }],
    });
    if (!prep) throw new NotFoundException('Preparation not found');
    return prep;
  }

  async update(churchId: number, id: number, data: Partial<Preparation>, userId: number) {
    const prep = await this.findOne(churchId, id);
    if (prep.servantId !== userId && !data.reviewerId) {
      throw new ForbiddenException('Not authorized to update this preparation');
    }
    await this.prepModel.update(data as any, { where: { id } });
    return this.findOne(churchId, id);
  }

  async submit(churchId: number, id: number, servantId: number) {
    const prep = await this.findOne(churchId, id);
    if (prep.servantId !== servantId) {
      throw new ForbiddenException('Not authorized');
    }
    await this.prepModel.update({ status: 'submitted' } as any, { where: { id } });
    return this.findOne(churchId, id);
  }

  async review(
    churchId: number,
    id: number,
    reviewerId: number,
    data: { status: string; reviewNotes?: string },
  ) {
    const prep = await this.findOne(churchId, id);
    await this.prepModel.update({
      status: data.status,
      reviewerId,
      reviewNotes: data.reviewNotes,
      reviewedAt: new Date(),
    } as any, { where: { id } });
    return this.findOne(churchId, id);
  }

  async addFile(
    churchId: number,
    preparationId: number,
    fileData: Partial<PreparationFile>,
  ) {
    return this.fileModel.create({
      ...fileData,
      churchId,
      preparationId,
    } as any);
  }

  async remove(churchId: number, id: number) {
    const prep = await this.findOne(churchId, id);
    await this.prepModel.destroy({ where: { id } });
    return { success: true };
  }
}
