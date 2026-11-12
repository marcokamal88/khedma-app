import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { join, basename } from 'path';
import { existsSync, unlinkSync, rmSync } from 'fs';
import { Op } from 'sequelize';
import { Preparation } from './entities/preparation.entity';
import { PreparationFile } from './entities/preparation-file.entity';
import { PreparationComment } from './entities/preparation-comment.entity';
import { ChurchMember } from '../users/entities/church-member.entity';
import { User } from '../users/entities/user.entity';
import { ServiceYear } from '../service-year/entities/service-year.entity';
import { ServantAssignment } from '../users/entities/servant-assignment.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PreparationService {
  constructor(
    @InjectModel(Preparation) private prepModel: typeof Preparation,
    @InjectModel(PreparationFile) private fileModel: typeof PreparationFile,
    @InjectModel(PreparationComment) private commentModel: typeof PreparationComment,
    @InjectModel(ServiceYear) private serviceYearModel: typeof ServiceYear,
    @InjectModel(ServantAssignment) private assignmentModel: typeof ServantAssignment,
    private notifService: NotificationsService,
  ) {}

  /** In-app notification that never fails the calling operation. */
  private notify(n: { churchId: string; churchMemberId: string; title: string; body: string; type: string; sourceType?: string; sourceId?: string }) {
    if (!n.churchMemberId) return;
    this.notifService.send(n).catch(() => {});
  }

  private defaultIncludes = [
    { model: PreparationFile },
    { model: ChurchMember, as: 'servant', include: [{ model: User, attributes: ['id', 'fullName'] }] },
  ];

  async create(churchId: number, data: Partial<Preparation>, servantId: number) {
    const resolved: any = { ...data };
    if (!resolved.serviceYearId) {
      const sy: any = await this.serviceYearModel.findOne({ where: { churchId, isCurrent: true } as any });
      if (!sy) throw new BadRequestException('No active service year');
      resolved.serviceYearId = sy.id;
    }
    if (!resolved.serviceId || !resolved.classId) {
      const a: any = await this.assignmentModel.findOne({
        where: { churchId, churchMemberId: servantId, isActive: true } as any,
        attributes: ['serviceId', 'classId'],
        order: [['id', 'ASC']],
      });
      if (a) {
        if (!resolved.serviceId) resolved.serviceId = a.serviceId;
        if (!resolved.classId) resolved.classId = a.classId;
      }
    }
    if (!resolved.serviceId || !resolved.serviceYearId) {
      throw new BadRequestException('Cannot resolve service for this servant');
    }
    return this.prepModel.create({
      ...resolved,
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

    // Notify service leaders of this service
    try {
      const leaders = await this.assignmentModel.findAll({
        where: {
          churchId,
          serviceId: prep.serviceId,
          isActive: true,
          leaderRole: { [Op.in]: ['service_leader', 'assistant_service_leader'] },
        } as any,
      });

      const servantName = (prep as any).servant?.user?.fullName || 'أحد الخدام';
      for (const leader of leaders) {
        if (Number(leader.churchMemberId) !== Number(servantId)) {
          this.notify({
            churchId: String(churchId),
            churchMemberId: String(leader.churchMemberId),
            title: 'تحضير جديد بانتظار المراجعة',
            body: `قام ${servantName} بتقديم تحضير "${prep.title}" لمراجعته`,
            type: 'general',
            sourceType: 'preparation',
            sourceId: String(id),
          });
        }
      }
    } catch {}

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
    const reviewed = await this.findOne(churchId, id);
    // tell the servant (skip self-review noise); 'general' until the
    // notifications ENUM gains a preparation value (needs a migration).
    if (Number((prep as any).servantId) !== Number(reviewerId)) {
      const approved = String(data.status).toLowerCase() === 'approved';
      this.notify({
        churchId: String(churchId),
        churchMemberId: String((prep as any).servantId),
        title: approved ? 'تم اعتماد التحضير' : 'تم رفض التحضير',
        body: `${(prep as any).title || ''}${data.reviewNotes ? ` — ملاحظة المراجع: ${data.reviewNotes}` : ''}`.trim(),
        type: 'general',
        sourceType: 'preparation',
        sourceId: String(id),
      });
    }
    return reviewed;
  }

  async addFile(
    churchId: number,
    preparationId: number,
    fileData: Partial<PreparationFile>,
    actorMemberId?: number,
  ) {
    const prep = await this.findOne(churchId, preparationId);
    return this.fileModel.create({
      ...fileData,
      churchId,
      preparationId,
    } as any);
  }

  async deleteFile(
    churchId: number,
    preparationId: number,
    fileId: number,
    actor: any,
  ) {
    const prep = await this.findOne(churchId, preparationId);
    const actorMemberId = typeof actor === 'object' ? (actor.memberId || actor.sub) : actor;
    const roles: string[] = typeof actor === 'object' && Array.isArray(actor.roles) ? actor.roles : [];
    const isOwner = Number(prep.servantId) === Number(actorMemberId);
    const isReviewer = Number(prep.reviewerId) === Number(actorMemberId);
    const isLeader = roles.some((r) =>
      ['service_leader', 'assistant_service_leader', 'sector_leader', 'priest', 'admin'].includes(r),
    );
    // Allow owner, reviewer, leader, or any authorized servant when prep is in draft or rejected status
    const canEditFiles = isOwner || isReviewer || isLeader || prep.status === 'draft' || prep.status === 'rejected';
    if (!canEditFiles) {
      throw new ForbiddenException('Not authorized to delete this file');
    }
    const file = await this.fileModel.findOne({
      where: { id: fileId, preparationId, churchId },
    });
    if (!file) throw new NotFoundException('File not found');

    try {
      const filePath = join(process.cwd(), 'uploads', 'preparations', String(preparationId), basename(file.fileUrl));
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch {}

    await file.destroy();
    return { success: true };
  }

  async remove(churchId: number, id: number) {
    const prep = await this.findOne(churchId, id);
    try {
      const dir = join(process.cwd(), 'uploads', 'preparations', String(id));
      if (existsSync(dir)) {
        rmSync(dir, { recursive: true, force: true });
      }
    } catch {}

    await this.fileModel.destroy({ where: { preparationId: id, churchId } });
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