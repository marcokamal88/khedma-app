import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Sector } from './entities/sector.entity';
import { Service } from './entities/service.entity';
import { StageGroup } from './entities/stage-group.entity';
import { Class } from './entities/class.entity';
import { Enrollment } from '../users/entities/enrollment.entity';
import { ServantAssignment } from '../users/entities/servant-assignment.entity';
import { AttendanceSession } from '../attendance/entities/attendance-session.entity';
import { User } from '../users/entities/user.entity';
import { ChurchMember } from '../users/entities/church-member.entity';
import { MemberRole } from '../users/entities/member-role.entity';
import { Role } from '../users/entities/role.entity';
import { TaioService } from '../taio/taio.service';

const SERVANT_ROLES = ['servant', 'class_leader', 'service_leader', 'assistant_service_leader', 'sector_leader', 'priest'];

@Injectable()
export class ChurchService {
  constructor(
    @InjectModel(Sector) private sectorModel: typeof Sector,
    @InjectModel(Service) private serviceModel: typeof Service,
    @InjectModel(StageGroup) private stageGroupModel: typeof StageGroup,
    @InjectModel(Class) private classModel: typeof Class,
    @InjectModel(Enrollment) private enrollmentModel: typeof Enrollment,
    @InjectModel(ServantAssignment) private servantAssignmentModel: typeof ServantAssignment,
    @InjectModel(AttendanceSession) private sessionModel: typeof AttendanceSession,
    @InjectModel(MemberRole) private memberRoleModel: typeof MemberRole,
    private taioService: TaioService,
  ) {}

  private isServiceLeaderRole(user: any): boolean {
    const roles: string[] = user?.roles || [];
    return roles.includes('service_leader') || roles.includes('assistant_service_leader');
  }

  private async resolveServiceIdForLeader(user: any, churchId: string): Promise<number | null> {
    const scopeId = user?.activeContext?.scope?.serviceId;
    if (scopeId) return Number(scopeId);
    if (!user?.memberId) return null;
    const assignment: any = await this.servantAssignmentModel.findOne({
      where: {
        churchId,
        churchMemberId: user.memberId,
        leaderRole: { [Op.in]: ['service_leader', 'assistant_service_leader'] },
        isActive: true,
      } as any,
      attributes: ['serviceId'],
    });
    return assignment ? Number((assignment as any).serviceId) : null;
  }

  async getSectors(churchId: string) {
    return this.sectorModel.findAll({ where: { churchId, isActive: true } });
  }

  async getSector(churchId: string, id: string) {
    const sector = await this.sectorModel.findOne({ where: { id, churchId } });
    if (!sector) throw new NotFoundException('Sector not found');
    return sector;
  }

  async getServices(churchId: string, sectorId?: string) {
    const where: any = { churchId, isActive: true };
    if (sectorId) where.sectorId = sectorId;
    return this.serviceModel.findAll({ where });
  }

  async getService(churchId: string, id: string) {
    const service = await this.serviceModel.findOne({
      where: { id, churchId },
      include: [StageGroup, Class],
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async getServiceStructure(churchId: string, id: string) {
    const service = await this.serviceModel.findOne({
      where: { id, churchId },
      include: [
        {
          model: StageGroup,
          where: { isActive: true },
          required: false,
          order: [['stageOrder', 'ASC']],
          include: [
            {
              model: Class,
              where: { isActive: true },
              required: false,
            },
          ],
        },
      ],
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async getStageGroups(churchId: string, serviceId: string) {
    return this.stageGroupModel.findAll({
      where: { churchId, serviceId, isActive: true },
      order: [['stageOrder', 'ASC']],
    });
  }

  async getStageGroupClasses(churchId: string, stageGroupId: string) {
    return this.classModel.findAll({
      where: { churchId, stageGroupId, isActive: true },
    });
  }

  async getClasses(churchId: string, serviceId: string) {
    return this.classModel.findAll({
      where: { churchId, serviceId, isActive: true },
    });
  }

  async getClassStudents(churchId: string, classId: string) {
    const enrollments = await this.enrollmentModel.findAll({
      where: { churchId, classId, isActive: true },
      order: [['id', 'DESC']],
      include: [
        {
          model: ChurchMember,
          required: true,
          include: [{ model: User, attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl'] }],
        },
      ],
    });
    const memberIds = enrollments.map((e) => e.churchMemberId);
    if (!memberIds.length) return [];

    const memberRoles = await this.memberRoleModel.findAll({
      where: { churchMemberId: memberIds, churchId },
      include: [{ model: Role, attributes: ['name'] }],
    });
    const servantIds = new Set(
      memberRoles
        .filter((mr) => SERVANT_ROLES.includes((mr as any).role?.name))
        .map((mr) => mr.churchMemberId),
    );
    const studentEnrollments = enrollments.filter((e) => !servantIds.has(e.churchMemberId));

    const balances = await this.taioService.getBalances(churchId, studentEnrollments.map((e) => String(e.churchMemberId)));
    return studentEnrollments.map((e) => ({
      enrollmentId: e.id,
      id: e.churchMemberId,
      userId: (e as any).churchMember?.userId,
      fullName: (e as any).churchMember?.user?.fullName,
      email: (e as any).churchMember?.user?.email,
      phone: (e as any).churchMember?.user?.phone,
      avatarUrl: (e as any).churchMember?.user?.avatarUrl,
      taioBalance: balances[e.churchMemberId] || 0,
    }));
  }

  async createSector(churchId: string, data: Partial<Sector>) {
    return this.sectorModel.create({ ...data, churchId } as any);
  }

  async createService(churchId: string, data: Partial<Service>) {
    return this.serviceModel.create({ ...data, churchId } as any);
  }

  async createStageGroup(churchId: string, data: Partial<StageGroup>) {
    return this.stageGroupModel.create({ ...data, churchId } as any);
  }

  async createClass(churchId: string, data: Partial<Class> & { stageGroupId?: number }, user?: any) {
    let serviceId: any = (data as any).serviceId;
    let stageGroupId: any = (data as any).stageGroupId ?? (data as any).stage_group_id;

    if (user && this.isServiceLeaderRole(user)) {
      const resolved = await this.resolveServiceIdForLeader(user, churchId);
      if (!resolved) throw new ForbiddenException('No service assigned to leader');
      serviceId = resolved;
      const sg: any = await this.stageGroupModel.findOne({
        where: { churchId, serviceId, isActive: true } as any,
        order: [['stageOrder', 'ASC']],
        attributes: ['id'],
      });
      stageGroupId = sg ? sg.id : null;
    }

    const name = String((data as any).name || '').trim();
    if (!name || name.length < 2) throw new BadRequestException('Class name is required');
    if (!serviceId) throw new BadRequestException('serviceId is required');
    const capacityRaw = (data as any).capacity;
    let capacity: number | null = null;
    if (capacityRaw !== undefined && capacityRaw !== null && String(capacityRaw).trim() !== '') {
      const n = Number(capacityRaw);
      if (!Number.isInteger(n) || n <= 0) throw new BadRequestException('Capacity must be a positive integer');
      capacity = n;
    }
    const svc = await this.serviceModel.findOne({ where: { id: serviceId, churchId } as any });
    if (!svc) throw new NotFoundException('Service not found');
    const existing = await this.classModel.findOne({
      where: { churchId, serviceId, isActive: true, name } as any,
    } as any);
    if (existing) throw new ConflictException('Class name already exists in this service');

    return this.classModel.create({ name, serviceId, stageGroupId: stageGroupId || null, capacity, churchId, isActive: true } as any);
  }

  async updateClass(churchId: string, id: string, data: Partial<Class>, user?: any) {
    const cls: any = await this.classModel.findOne({ where: { id, churchId } as any });
    if (!cls) throw new NotFoundException('Class not found');
    if (!cls.isActive) throw new BadRequestException('Class is inactive');
    if (user && this.isServiceLeaderRole(user)) {
      const resolved = await this.resolveServiceIdForLeader(user, churchId);
      if (!resolved || Number(cls.serviceId) !== resolved) throw new ForbiddenException('Not allowed for this service');
    }
    const patch: any = {};
    if (data.name !== undefined) {
      const name = String((data as any).name).trim();
      if (!name || name.length < 2) throw new BadRequestException('Class name is required');
      const dup = await this.classModel.findOne({
        where: { churchId, serviceId: cls.serviceId, isActive: true, name, id: { [Op.ne]: id } } as any,
      } as any);
      if (dup) throw new ConflictException('Class name already exists in this service');
      patch.name = name;
    }
    if ((data as any).capacity !== undefined) {
      const raw = (data as any).capacity;
      if (raw === null || raw === '' || raw === undefined) patch.capacity = null;
      else {
        const n = Number(raw);
        if (!Number.isInteger(n) || n <= 0) throw new BadRequestException('Capacity must be a positive integer');
        patch.capacity = n;
      }
    }
    if (Object.keys(patch).length === 0) return cls;
    await this.classModel.update(patch, { where: { id } } as any);
    return this.classModel.findOne({ where: { id, churchId } as any });
  }

  async deleteClass(churchId: string, id: string, user?: any) {
    const cls: any = await this.classModel.findOne({ where: { id, churchId } as any });
    if (!cls) throw new NotFoundException('Class not found');
    if (!cls.isActive) return { success: true };
    if (user && this.isServiceLeaderRole(user)) {
      const resolved = await this.resolveServiceIdForLeader(user, churchId);
      if (!resolved || Number(cls.serviceId) !== resolved) throw new ForbiddenException('Not allowed for this service');
    }
    const [enrollCnt, assignCnt, sessionCnt] = await Promise.all([
      this.enrollmentModel.count({ where: { churchId, classId: id, isActive: true } as any }),
      this.servantAssignmentModel.count({ where: { churchId, classId: id, isActive: true } as any }),
      this.sessionModel.count({ where: { churchId, classId: id } as any }),
    ]);
    if (enrollCnt > 0 || assignCnt > 0 || sessionCnt > 0) {
      throw new ConflictException('Cannot delete class with active students, servants or sessions');
    }
    await this.classModel.update({ isActive: false } as any, { where: { id } } as any);
    return { success: true };
  }

  async enrollMember(churchId: string, data: { churchMemberId: string; serviceId: string; classId: string; serviceYearId: string; stageGroupId?: string }) {
    const existingAssignment = await this.servantAssignmentModel.findOne({
      where: {
        churchId,
        churchMemberId: data.churchMemberId,
        serviceId: data.serviceId,
        serviceYearId: data.serviceYearId,
        isActive: true,
      } as any,
    });
    if (existingAssignment) {
      throw new BadRequestException('Member is already a servant in this service');
    }
    const [enrollment] = await this.enrollmentModel.upsert({
      churchId,
      churchMemberId: data.churchMemberId,
      serviceId: data.serviceId,
      classId: data.classId,
      serviceYearId: data.serviceYearId,
      stageGroupId: data.stageGroupId || null,
      isActive: true,
    } as any);
    return enrollment;
  }
}
