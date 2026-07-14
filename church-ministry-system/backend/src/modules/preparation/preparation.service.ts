import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Preparation } from './entities/preparation.entity';
import { PreparationFile } from './entities/preparation-file.entity';
import { PreparationComment } from './entities/preparation-comment.entity';
import { ChurchMember } from '../users/entities/church-member.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PreparationService {
  constructor(
    @InjectModel(Preparation) private prepModel: typeof Preparation,
    @InjectModel(PreparationFile) private fileModel: typeof PreparationFile,
    @InjectModel(PreparationComment) private commentModel: typeof PreparationComment,
  ) {}

  private defaultIncludes = [
    { model: PreparationFile },
    { model: ChurchMember, as: 'servant', include: [{ model: User, attributes: ['id', 'fullName'] }] },
  ];

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
      include: this.defaultIncludes,
      order: [['lessonDate', 'DESC']],
    });
  }

  async findOne(churchId: number, id: number) {
    const prep = await this.prepModel.findOne({
      where: { id, churchId },
      include: this.defaultIncludes,
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

  async getComments(churchId: number, preparationId: number) {
    return this.commentModel.findAll({
      where: { churchId, preparationId },
      include: [{ model: User, as: 'author', attributes: ['id', 'fullName'] }],
      order: [['createdAt', 'ASC']],
    });
  }

  async addComment(churchId: number, preparationId: number, authorId: number, body: string) {
    return this.commentModel.create({
      churchId,
      preparationId,
      authorId,
      body,
    } as any);
  }
}