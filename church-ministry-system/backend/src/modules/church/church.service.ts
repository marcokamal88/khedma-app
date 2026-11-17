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
import { MemberProfile } from '../users/entities/member-profile.entity';
import { SectorAssignment } from '../users/entities/sector-assignment.entity';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity';
import { ServiceYear } from '../service-year/entities/service-year.entity';
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
    @InjectModel(AttendanceRecord) private attendanceRecordModel: typeof AttendanceRecord,
    @InjectModel(MemberRole) private memberRoleModel: typeof MemberRole,
    @InjectModel(MemberProfile) private profileModel: typeof MemberProfile,
    @InjectModel(SectorAssignment) private sectorAssignmentModel: typeof SectorAssignment,
    @InjectModel(ServiceYear) private serviceYearModel: typeof ServiceYear,
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

  async getMySectorOverview(churchId: string, user: any) {
    let sectorId: number | null = null;
    const scopeSectorId = user?.activeContext?.scope?.sectorId;
    if (scopeSectorId) {
      sectorId = Number(scopeSectorId);
    } else if (user?.memberId) {
      const sa: any = await this.sectorAssignmentModel.findOne({
        where: { churchId, churchMemberId: user.memberId, isActive: true } as any,
        attributes: ['sectorId'],
      });
      if (sa) {
        sectorId = Number(sa.sectorId);
      }
    }

    if (!sectorId) {
      // Fallback for priest or admin without specific sector in scope: pick first active sector
      const firstSector = await this.sectorModel.findOne({
        where: { churchId, isActive: true } as any,
        order: [['id', 'ASC']],
      });
      if (firstSector) {
        sectorId = firstSector.id;
      }
    }

    if (!sectorId) {
      throw new NotFoundException('No active sector found for user or church');
    }

    return this.getSectorOverview(churchId, String(sectorId));
  }

  async getSectorOverview(churchId: string, sectorId: string) {
    const sector = await this.sectorModel.findOne({
      where: { id: sectorId, churchId, isActive: true } as any,
    });
    if (!sector) throw new NotFoundException('Sector not found');

    const currentYear = await this.serviceYearModel.findOne({
      where: { churchId, isCurrent: true } as any,
    });
    const serviceYearId = currentYear ? currentYear.id : undefined;

    const services = await this.serviceModel.findAll({
      where: { churchId, sectorId: sector.id, isActive: true } as any,
      order: [['id', 'ASC']],
    });

    if (services.length === 0) {
      return {
        sector: {
          id: sector.id,
          name: sector.name,
          type: (sector as any).type || null,
          description: (sector as any).description || null,
        },
        totalServices: 0,
        totalServants: 0,
        totalStudents: 0,
        averageAttendance: 0,
        services: [],
      };
    }

    const serviceIds = services.map((s) => s.id);

    // 1. Classes counts per service
    const classes = await this.classModel.findAll({
      where: { churchId, serviceId: { [Op.in]: serviceIds }, isActive: true } as any,
      attributes: ['id', 'serviceId'],
    });
    const classesCountMap = new Map<number, number>();
    for (const c of classes) {
      const sid = (c as any).serviceId;
      classesCountMap.set(sid, (classesCountMap.get(sid) || 0) + 1);
    }

    // 2. Servant assignments per service
    const servantWhere: any = {
      churchId,
      serviceId: { [Op.in]: serviceIds },
      isActive: true,
    };
    if (serviceYearId) servantWhere.serviceYearId = serviceYearId;

    const servantAssignments = await this.servantAssignmentModel.findAll({
      where: servantWhere,
      include: [
        {
          model: ChurchMember,
          include: [{ model: User, attributes: ['id', 'fullName', 'phone', 'email'] }],
        },
      ],
    });

    const servantsByServiceMap = new Map<number, Set<number>>();
    const leadersByServiceMap = new Map<number, any[]>();
    const allSectorServantIds = new Set<number>();

    for (const sa of servantAssignments as any[]) {
      const sid = sa.serviceId;
      if (!servantsByServiceMap.has(sid)) servantsByServiceMap.set(sid, new Set());
      servantsByServiceMap.get(sid)!.add(sa.churchMemberId);
      allSectorServantIds.add(sa.churchMemberId);

      if (sa.leaderRole === 'service_leader' || sa.leaderRole === 'assistant_service_leader') {
        if (!leadersByServiceMap.has(sid)) leadersByServiceMap.set(sid, []);
        const existing = leadersByServiceMap.get(sid)!.some((l) => l.id === sa.churchMemberId && l.role === sa.leaderRole);
        if (!existing) {
          leadersByServiceMap.get(sid)!.push({
            id: sa.churchMemberId,
            role: sa.leaderRole,
            fullName: sa.churchMember?.user?.fullName || '',
            phone: sa.churchMember?.user?.phone || '',
          });
        }
      }
    }

    // 3. Enrollments (students) per service
    const enrollWhere: any = {
      churchId,
      serviceId: { [Op.in]: serviceIds },
      isActive: true,
    };
    if (serviceYearId) enrollWhere.serviceYearId = serviceYearId;

    const enrollments = await this.enrollmentModel.findAll({
      where: enrollWhere,
      attributes: ['churchMemberId', 'serviceId'],
    });

    const studentsByServiceMap = new Map<number, Set<number>>();
    const allSectorStudentIds = new Set<number>();

    for (const e of enrollments as any[]) {
      const sid = e.serviceId;
      if (!studentsByServiceMap.has(sid)) studentsByServiceMap.set(sid, new Set());
      studentsByServiceMap.get(sid)!.add(e.churchMemberId);
      allSectorStudentIds.add(e.churchMemberId);
    }

    // 4. Attendance per service
    const sessionWhere: any = {
      churchId,
      serviceId: { [Op.in]: serviceIds },
    };
    if (serviceYearId) sessionWhere.serviceYearId = serviceYearId;

    const sessions = await this.sessionModel.findAll({
      where: sessionWhere,
      attributes: ['id', 'serviceId'],
    });

    const sessionsByServiceMap = new Map<number, number[]>();
    const allSessionIds: number[] = [];
    for (const s of sessions as any[]) {
      const sid = s.serviceId;
      if (!sessionsByServiceMap.has(sid)) sessionsByServiceMap.set(sid, []);
      sessionsByServiceMap.get(sid)!.push(s.id);
      allSessionIds.push(s.id);
    }

    const attendanceRateMap = new Map<number, number>();
    if (allSessionIds.length > 0) {
      const records = await this.attendanceRecordModel.findAll({
        where: {
          churchId,
          attendanceSessionId: { [Op.in]: allSessionIds },
        },
        attributes: [
          'attendanceSessionId',
          'status',
          [this.attendanceRecordModel.sequelize!.fn('COUNT', this.attendanceRecordModel.sequelize!.col('id')), 'count'],
        ],
        group: ['attendanceSessionId', 'status'],
        raw: true,
      }) as any[];

      const sessionToServiceMap = new Map<number, number>();
      for (const [sid, sids] of sessionsByServiceMap.entries()) {
        for (const id of sids) sessionToServiceMap.set(id, sid);
      }

      const serviceCounts = new Map<number, { present: number; total: number }>();
      for (const r of records) {
        const sid = sessionToServiceMap.get(Number(r.attendanceSessionId));
        if (sid) {
          if (!serviceCounts.has(sid)) serviceCounts.set(sid, { present: 0, total: 0 });
          const count = parseInt(r.count, 10) || 0;
          serviceCounts.get(sid)!.total += count;
          if (r.status === 'present') {
            serviceCounts.get(sid)!.present += count;
          }
        }
      }

      for (const [sid, c] of serviceCounts.entries()) {
        const rate = c.total > 0 ? Math.round((c.present / c.total) * 100) : 0;
        attendanceRateMap.set(sid, rate);
      }
    }

    let totalRateSum = 0;
    let servicesWithAttendance = 0;

    const servicesList = services.map((s) => {
      const sid = s.id;
      const rate = attendanceRateMap.get(sid) || 0;
      if (attendanceRateMap.has(sid)) {
        totalRateSum += rate;
        servicesWithAttendance++;
      }
      return {
        id: s.id,
        name: s.name,
        description: (s as any).description || null,
        sectorId: s.sectorId,
        classesCount: classesCountMap.get(sid) || 0,
        servantsCount: servantsByServiceMap.get(sid)?.size || 0,
        studentsCount: studentsByServiceMap.get(sid)?.size || 0,
        attendanceRate: rate,
        leaders: leadersByServiceMap.get(sid) || [],
      };
    });

    const averageAttendance = servicesWithAttendance > 0 ? Math.round(totalRateSum / servicesWithAttendance) : 0;

    return {
      sector: {
        id: sector.id,
        name: sector.name,
        type: (sector as any).type || null,
        description: (sector as any).description || null,
      },
      totalServices: servicesList.length,
      totalServants: allSectorServantIds.size,
      totalStudents: allSectorStudentIds.size,
      averageAttendance,
      services: servicesList,
    };
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

    const profiles = await this.profileModel.findAll({
      where: { churchId, churchMemberId: studentEnrollments.map((e) => e.churchMemberId) } as any,
      attributes: ['churchMemberId', 'address', 'birthDate', 'notes', 'gender', 'schoolGrade'],
      raw: true,
    } as any);
    const profileMap = new Map<number, any>(profiles.map((p: any) => [Number(p.churchMemberId), p]));
    const balances = await this.taioService.getBalances(churchId, studentEnrollments.map((e) => String(e.churchMemberId)));
    return studentEnrollments.map((e) => {
      const p: any = profileMap.get(Number(e.churchMemberId));
      return {
        enrollmentId: e.id,
        classId: (e as any).classId,
        id: e.churchMemberId,
        userId: (e as any).churchMember?.userId,
        fullName: (e as any).churchMember?.user?.fullName,
        email: (e as any).churchMember?.user?.email,
        phone: (e as any).churchMember?.user?.phone,
        avatarUrl: (e as any).churchMember?.user?.avatarUrl,
        address: p?.address || null,
        birthDate: p?.birthDate || null,
        notes: p?.notes || null,
        gender: p?.gender || null,
        schoolGrade: p?.schoolGrade ?? null,
        taioBalance: balances[e.churchMemberId] || 0,
      };
    });
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

  async unenrollMember(churchId: string, id: string, user?: any) {
    const enrollment: any = await this.enrollmentModel.findOne({ where: { id, churchId } as any });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (user && this.isServiceLeaderRole(user)) {
      const resolved = await this.resolveServiceIdForLeader(user, churchId);
      if (!resolved || Number(enrollment.serviceId) !== resolved) throw new ForbiddenException('Not allowed for this service');
    }
    await this.enrollmentModel.update({ isActive: false } as any, { where: { id } } as any);
    return { success: true };
  }
}
