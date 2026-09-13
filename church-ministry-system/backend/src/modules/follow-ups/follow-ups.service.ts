import { Injectable, NotFoundException, Logger, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { FollowupFamily } from './entities/followup-family.entity';
import { FollowupAssignment } from './entities/followup-assignment.entity';
import { FollowupLog } from './entities/followup-log.entity';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { AddActivityDto } from './dto/add-activity.dto';
import { ServiceYear } from '../service-year/entities/service-year.entity';
import { Class } from '../church/entities/class.entity';
import { Service } from '../church/entities/service.entity';
import { Enrollment } from '../users/entities/enrollment.entity';
import { MemberRole } from '../users/entities/member-role.entity';
import { Role } from '../users/entities/role.entity';
import { ChurchMember } from '../users/entities/church-member.entity';
import { User } from '../users/entities/user.entity';
import { ServantAssignment } from '../users/entities/servant-assignment.entity';
import { MemberProfile } from '../users/entities/member-profile.entity';

@Injectable()
export class FollowUpsService {
  private readonly logger = new Logger(FollowUpsService.name);

  constructor(
    @InjectModel(FollowupFamily) private familyModel: typeof FollowupFamily,
    @InjectModel(FollowupAssignment) private assignmentModel: typeof FollowupAssignment,
    @InjectModel(FollowupLog) private logModel: typeof FollowupLog,
    @InjectModel(ServiceYear) private serviceYearModel: typeof ServiceYear,
    @InjectModel(Class) private classModel: typeof Class,
    @InjectModel(Enrollment) private enrollmentModel: typeof Enrollment,
    @InjectModel(MemberRole) private memberRoleModel: typeof MemberRole,
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(ChurchMember) private memberModel: typeof ChurchMember,
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(ServantAssignment) private servantAssignmentModel: typeof ServantAssignment,
    @InjectModel(MemberProfile) private profileModel: typeof MemberProfile,
    private sequelize: Sequelize,
  ) {}

  private async getMemberRoleNames(churchId: number, memberId: number): Promise<string[]> {
    const rows: any[] = await this.memberRoleModel.findAll({
      where: { churchId, churchMemberId: memberId } as any,
      include: [{ model: Role, attributes: ['name'] }],
    });
    return rows.map((r: any) => r.role?.name).filter(Boolean);
  }

  private async resolveLeaderServiceId(churchId: number, memberId: number): Promise<number | null> {
    const a: any = await this.servantAssignmentModel.findOne({
      where: { churchId, churchMemberId: memberId, leaderRole: { [Op.in]: ['service_leader', 'assistant_service_leader'] }, isActive: true } as any,
      attributes: ['serviceId'],
    });
    return a ? Number(a.serviceId) : null;
  }

  private async assertCanManageGroup(churchId: number, family: any, actorId: string | number) {
    if (Number(actorId) === Number(family.responsibleMemberId)) return;
    const names = await this.getMemberRoleNames(Number(churchId), Number(actorId));
    if (!names.includes('service_leader') && !names.includes('assistant_service_leader')) {
      throw new ForbiddenException('Only the responsible servant or service leaders can manage this group');
    }
    const leaderService = await this.resolveLeaderServiceId(Number(churchId), Number(actorId));
    if (family.serviceId && leaderService && Number(family.serviceId) !== leaderService) {
      throw new ForbiddenException('Not allowed for this service');
    }
  }

  private async getCurrentServiceYear(churchId: string | number) {
    return this.serviceYearModel.findOne({ where: { churchId, isCurrent: true } as any });
  }

  private getWeekBounds(weekStr?: string) {
    // weekStr YYYY-MM-DD is Monday, else current week Mon-Sun Africa/Cairo
    const base = weekStr ? new Date(weekStr + 'T12:00:00') : new Date();
    const day = base.getDay(); // 0 Sun
    const diffToMon = day === 0 ? -6 : 1 - day;
    const mon = new Date(base); mon.setDate(base.getDate() + diffToMon); mon.setHours(0,0,0,0);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999);
    return { start: mon, end: sun };
  }

  async create(churchId: string, dto: CreateFollowUpDto, userId: string) {
    const churchIdNum = Number(churchId);
    const responsibleId = Number((dto as any).responsibleMemberId || (dto as any).servantId || userId);
    const targetType = (dto as any).targetType || 'served_member';
    let serviceYearId = (dto as any).serviceYearId;
    if (!serviceYearId) {
      const sy = await this.getCurrentServiceYear(churchId);
      if (!sy) throw new BadRequestException('No active service year');
      serviceYearId = (sy as any).id;
    }
    let classId: number | null = (dto as any).classId ?? null;
    let serviceId: number | null = (dto as any).serviceId ?? null;
    if (classId) {
      const cls: any = await this.classModel.findOne({ where: { id: classId, churchId: churchIdNum } as any });
      if (!cls) throw new NotFoundException('Class not found');
      serviceId = cls.serviceId;
    }
    // collect memberIds: bulk + single legacy
    const memberIds: number[] = [];
    if (Array.isArray((dto as any).memberIds)) memberIds.push(...(dto as any).memberIds.map(Number).filter(Boolean));
    if ((dto as any).servedMemberId) memberIds.push(Number((dto as any).servedMemberId));
    // dedup
    const uniqueIds = [...new Set(memberIds.filter(Boolean))];

    // Validate responsible is a servant/leader of this church (not just any member)
    const respRoles: any[] = await this.memberRoleModel.findAll({
      where: { churchId: churchIdNum, churchMemberId: responsibleId } as any,
      include: [{ model: Role, attributes: ['name'] }],
    });
    const respRoleNames = respRoles.map((r: any) => r.role?.name);
    const allowedResponsible = ['servant', 'class_leader', 'service_leader', 'assistant_service_leader'];
    if (!respRoleNames.some((n) => allowedResponsible.includes(n))) {
      throw new ForbiddenException('Responsible must be a servant of this church');
    }
    // Only service leaders may create a group owned by another servant, scoped to their service
    if (Number(responsibleId) !== Number(userId)) {
      const actorNames = await this.getMemberRoleNames(churchIdNum, Number(userId));
      if (!actorNames.includes('service_leader') && !actorNames.includes('assistant_service_leader')) {
        throw new ForbiddenException('Only service leaders can create a group for another servant');
      }
      const leaderService = await this.resolveLeaderServiceId(churchIdNum, Number(userId));
      const targetService = serviceId ? Number(serviceId) : null;
      if (!leaderService || (targetService && targetService !== leaderService)) {
        throw new ForbiddenException('Not allowed for this service');
      }
    }
    // Flow B (secretary -> servants): classId is meaningless, force null and derive service from leader scope
    if (targetType === 'servant') {
      classId = null;
      if (!serviceId) {
        const ownerService = await this.resolveLeaderServiceId(churchIdNum, responsibleId);
        if (ownerService) serviceId = ownerService;
      }
      // targets must be servants of this church
      for (const mid of uniqueIds) {
        const tRoles = await this.getMemberRoleNames(churchIdNum, mid);
        if (!tRoles.includes('servant') && !tRoles.includes('class_leader')) {
          throw new BadRequestException(`Member ${mid} is not a servant`);
        }
      }
    }
    // Validate targets: served_member must be actively enrolled in this class/year
    if (targetType === 'served_member' && classId) {
      for (const mid of uniqueIds) {
        const en: any = await this.enrollmentModel.findOne({
          where: { churchId: churchIdNum, churchMemberId: mid, classId, serviceYearId, isActive: true } as any,
        });
        if (!en) throw new BadRequestException(`Member ${mid} is not enrolled in this class`);
      }
    }

    // MySQL-compatible uniqueness check: one family per responsible/class/year/target
    const classOrZero = classId || 0;
    // Use findOne with classId handling (null vs value)
    const whereFamily: any = { churchId: churchIdNum, responsibleMemberId: responsibleId, serviceYearId, targetType };
    // For class, need to handle null: use Op.is
    let existing: any = null;
    if (classId) {
      whereFamily.classId = classId;
      existing = await this.familyModel.findOne({ where: whereFamily });
    } else {
      existing = await this.familyModel.findOne({ where: { ...whereFamily, classId: { [Op.is]: null } as any } });
    }

    let family: any;
    if (existing) {
      family = existing;
      if (dto.name) await family.update({ name: dto.name } as any);
    } else {
      // transactional create
      family = await this.sequelize.transaction(async (t) => {
        // double-check inside transaction to avoid race
        const dupCheckWhere: any = { churchId: churchIdNum, responsibleMemberId: responsibleId, serviceYearId, targetType };
        let dup: any;
        if (classId) dupCheckWhere.classId = classId;
        else dupCheckWhere.classId = { [Op.is]: null } as any;
        const dupFound = await this.familyModel.findOne({ where: dupCheckWhere, transaction: t } as any);
        if (dupFound) return dupFound;
        return this.familyModel.create({
          churchId: churchIdNum,
          serviceYearId,
          responsibleMemberId: responsibleId,
          serviceId: serviceId || null,
          classId: classId || null,
          targetType,
          name: dto.name || null,
          status: dto.status || 'active',
          notes: dto.notes || null,
        } as any, { transaction: t });
      });
    }

    // create assignments
    for (const mid of uniqueIds) {
      const existingAssign: any = await this.assignmentModel.findOne({
        where: { followupFamilyId: family.id, targetMemberId: mid } as any,
      });
      if (existingAssign) {
        if (!existingAssign.isActive) {
          await existingAssign.update({ isActive: true, unassignedAt: null, assignedAt: new Date(), assignedBy: Number(userId) } as any);
        }
        continue;
      }
      await this.assignmentModel.create({
        churchId: churchIdNum,
        followupFamilyId: family.id,
        targetMemberId: mid,
        serviceYearId,
        classId: classId || null,
        assignedBy: Number(userId),
        isActive: true,
      } as any);
    }

    return this.findOne(String(churchId), String(family.id));
  }

  async findAll(churchId: string, filters: { servantId?: string; serviceId?: string; classId?: string; status?: string; targetType?: string; scope?: string } & any, requester?: any) {
    const where: any = { churchId: Number(churchId) };
    // scope handling: if requester is servant, restrict to his families unless leader
    // For now support explicit filters; scoping is enforced in controller via Roles + OwnerGuard
    if (filters.serviceId) where.serviceId = Number(filters.serviceId);
    if (filters.classId) where.classId = Number(filters.classId);
    if (filters.status) where.status = filters.status;
    if (filters.targetType) where.targetType = filters.targetType;
    // servantId is legacy: maps to responsibleMemberId
    if (filters.servantId) where.responsibleMemberId = Number(filters.servantId);
    if (filters.responsibleMemberId) where.responsibleMemberId = Number(filters.responsibleMemberId);
    // serviceYear filter
    if (filters.serviceYearId) where.serviceYearId = Number(filters.serviceYearId);
    else if (filters.servantId) {
      // "my families" queries default to the current service year; history via explicit serviceYearId
      const sy = await this.getCurrentServiceYear(churchId);
      if (sy) where.serviceYearId = Number((sy as any).id);
    }

    return this.familyModel.findAll({
      where,
      include: [
        { association: 'servant', attributes: ['id'] },
        { association: 'service', attributes: ['id', 'name'] },
        { association: 'class', attributes: ['id', 'name'] },
        { association: 'assignments', separate: true, where: { isActive: true } as any, required: false },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  private async memberWithUser(memberId: number) {
    if (!memberId) return null;
    const m: any = await this.memberModel.findOne({
      where: { id: memberId } as any,
      include: [{ model: User, attributes: ['id', 'fullName', 'phone', 'avatarUrl'] }],
    });
    if (!m) return null;
    const json = m.toJSON();
    const profile: any = await this.profileModel.findOne({
      where: { churchMemberId: memberId } as any,
      attributes: ['phones'],
    });
    const phones: string[] = Array.isArray((profile as any)?.phones)
      ? (profile as any).phones.filter(Boolean).map(String)
      : [];
    if (json?.user?.phone) phones.unshift(String(json.user.phone));
    json.phones = [...new Set(phones)];
    return json;
  }

  async findOne(churchId: string, id: string) {
    const family: any = await this.familyModel.findOne({
      where: { id: Number(id), churchId: Number(churchId) },
      include: [
        { association: 'servant' },
        { association: 'service' },
        { association: 'class' },
        { association: 'assignments', where: { isActive: true } as any, required: false },
      ],
    });
    if (!family) throw new NotFoundException('Follow-up not found');
    const json: any = family.toJSON();
    const [responsible, targets] = await Promise.all([
      this.memberWithUser(Number(family.responsibleMemberId)),
      Promise.all(
        (json.assignments || []).map((a: any) => this.memberWithUser(Number(a.targetMemberId))),
      ),
    ]);
    json.responsible = responsible;
    const targetMap = new Map<number, any>();
    (json.assignments || []).forEach((a: any, i: number) => {
      if (targets[i]) targetMap.set(Number(a.targetMemberId), targets[i]);
    });
    json.assignments = (json.assignments || []).map((a: any) => ({
      ...a,
      target: targetMap.get(Number(a.targetMemberId)) || null,
    }));
    return json;
  }

  async getActivities(churchId: string, familyId: string) {
    const logs: any[] = await this.logModel.findAll({
      where: { followupFamilyId: Number(familyId), churchId: Number(churchId) },
      order: [['loggedAt', 'DESC']],
      paranoid: false,
    });
    const ids = [...new Set([
      ...logs.map((l: any) => Number(l.targetMemberId)),
      ...logs.map((l: any) => Number(l.createdBy)),
    ].filter(Boolean))];
    const members: any[] = ids.length
      ? await this.memberModel.findAll({
          where: { id: ids } as any,
          include: [{ model: User, attributes: ['id', 'fullName'] }],
        })
      : [];
    const mMap = new Map<number, any>(members.map((m: any) => [Number(m.id), m.toJSON()]));
    return logs.map((l: any) => {
      const j = l.toJSON();
      return {
        ...j,
        target: mMap.get(Number(l.targetMemberId)) || null,
        creator: mMap.get(Number(l.createdBy)) || null,
      };
    });
  }

  async updateStatus(churchId: string, id: string, status: string) {
    const family = await this.familyModel.findOne({ where: { id: Number(id), churchId: Number(churchId) } });
    if (!family) throw new NotFoundException('Follow-up not found');
    await family.update({ status } as any);
    return family;
  }

  async updateFamily(churchId: string, id: string, data: { name?: string; notes?: string }, actorId: string) {
    const family: any = await this.familyModel.findOne({ where: { id: Number(id), churchId: Number(churchId) } });
    if (!family) throw new NotFoundException('Follow-up not found');
    await this.assertCanManageGroup(Number(churchId), family, actorId);
    const patch: any = {};
    if (data.name !== undefined) patch.name = String(data.name).trim() || null;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (Object.keys(patch).length) await family.update(patch);
    return this.findOne(churchId, id);
  }

  async addMembers(churchId: string, familyId: string, memberIds: number[], actorId: string) {
    const family: any = await this.familyModel.findOne({ where: { id: Number(familyId), churchId: Number(churchId) } });
    if (!family) throw new NotFoundException('Follow-up not found');
    await this.assertCanManageGroup(Number(churchId), family, actorId);
    // Validate targets belong to the family's class/year (served_member families only)
    if (family.targetType === 'served_member' && family.classId) {
      for (const mid of memberIds.map(Number).filter(Boolean)) {
        const en: any = await this.enrollmentModel.findOne({
          where: { churchId: Number(churchId), churchMemberId: mid, classId: family.classId, serviceYearId: family.serviceYearId, isActive: true } as any,
        });
        if (!en) throw new BadRequestException(`Member ${mid} is not enrolled in this class`);
      }
    }
    const results = [];
    for (const mid of memberIds) {
      const existing: any = await this.assignmentModel.findOne({ where: { followupFamilyId: family.id, targetMemberId: mid } as any });
      if (existing) {
        if (!existing.isActive) await existing.update({ isActive: true, unassignedAt: null, assignedAt: new Date(), assignedBy: Number(actorId) } as any);
        results.push(existing);
      } else {
        const created: any = await this.assignmentModel.create({
          churchId: Number(churchId),
          followupFamilyId: family.id,
          targetMemberId: mid,
          serviceYearId: family.serviceYearId,
          classId: family.classId,
          assignedBy: Number(actorId),
          isActive: true,
        } as any);
        results.push(created);
      }
    }
    return results;
  }

  async removeMember(churchId: string, familyId: string, memberId: string, actorId: string) {
    const family: any = await this.familyModel.findOne({ where: { id: Number(familyId), churchId: Number(churchId) } });
    if (!family) throw new NotFoundException('Follow-up not found');
    await this.assertCanManageGroup(Number(churchId), family, actorId);
    const assign: any = await this.assignmentModel.findOne({
      where: { followupFamilyId: Number(familyId), targetMemberId: Number(memberId), churchId: Number(churchId) },
    });
    if (!assign) throw new NotFoundException('Assignment not found');
    await assign.update({ isActive: false, unassignedAt: new Date() } as any);
    return { success: true };
  }

  async addActivity(churchId: string, followupFamilyId: string, dto: AddActivityDto, userId: string) {
    const family: any = await this.familyModel.findOne({ where: { id: Number(followupFamilyId), churchId: Number(churchId) } });
    if (!family) throw new NotFoundException('Follow-up not found');

    // Only the responsible servant/secretary may log in this group (secretary is read-only on servant groups)
    if (Number(userId) !== Number(family.responsibleMemberId)) {
      throw new ForbiddenException('Only the responsible servant can add follow-up activities to this group');
    }

    const targetId = Number((dto as any).targetMemberId || (dto as any).churchMemberId);
    if (!targetId) throw new BadRequestException('targetMemberId is required');

    // Security: target must be currently/historically assigned to this family during log week
    // Allow if there exists assignment for this target in this family (even if now inactive, history counts)
    // But for new logs, require isActive at log time (loggedAt or now)
    const loggedAt = (dto as any).loggedAt ? new Date((dto as any).loggedAt) : new Date();
    const assign: any = await this.assignmentModel.findOne({
      where: { followupFamilyId: family.id, targetMemberId: targetId } as any,
      paranoid: false,
    });
    if (!assign) throw new ForbiddenException('Target not in this follow-up group');

    // check assigned period covers loggedAt
    const assignedAt = assign.assignedAt ? new Date(assign.assignedAt) : new Date(0);
    const unassignedAt = assign.unassignedAt ? new Date(assign.unassignedAt) : null;
    if (loggedAt < assignedAt || (unassignedAt && loggedAt >= unassignedAt)) {
      // still allow but warn via log? Enforce: must be assigned at log time
      // For strict security, enforce isActive at log time
      if (!assign.isActive && (!unassignedAt || loggedAt >= unassignedAt)) {
        throw new ForbiddenException('Target not currently assigned to this group at log date');
      }
    }

    // createdBy is kept separate from responsibleMemberId for history
    return this.logModel.create({
      churchId: Number(churchId),
      followupFamilyId: family.id,
      targetMemberId: targetId,
      createdBy: Number(userId),
      logType: dto.logType,
      notes: dto.notes,
      nextAction: dto.nextAction || null,
      nextActionDate: dto.nextActionDate || null,
      loggedAt,
      statusAtLog: family.status,
    } as any);
  }

  async getWeekly(churchId: string, responsibleId: string, week?: string, serviceYearId?: string) {
    const { start, end } = this.getWeekBounds(week);
    // default servant scope to the current service year (history via explicit serviceYearId)
    let syId = serviceYearId ? Number(serviceYearId) : null;
    if (!syId) {
      const sy = await this.getCurrentServiceYear(churchId);
      if (sy) syId = Number((sy as any).id);
    }
    const famWhere: any = { churchId: Number(churchId), responsibleMemberId: Number(responsibleId) };
    if (syId) famWhere.serviceYearId = syId;
    // families for this responsible in current service year (or all)
    const families: any[] = await this.familyModel.findAll({
      where: famWhere,
      attributes: ['id', 'classId', 'serviceId', 'name'],
    });
    const familyIds = families.map((f: any) => f.id);
    if (familyIds.length === 0) return { weekStart: start.toISOString().split('T')[0], weekEnd: end.toISOString().split('T')[0], assigned: [], completed: [], missing: [] };

    // assignments that were active at any point during the week: assignedAt <= weekEnd AND (unassignedAt IS NULL OR unassignedAt > weekStart)
    const assignments: any[] = await this.assignmentModel.findAll({
      where: {
        followupFamilyId: { [Op.in]: familyIds },
        assignedAt: { [Op.lte]: end },
        [Op.or]: [{ unassignedAt: { [Op.is]: null } as any }, { unassignedAt: { [Op.gt]: start } }],
      } as any,
      attributes: ['targetMemberId', 'followupFamilyId', 'assignedAt', 'unassignedAt'],
      paranoid: false,
    });
    const assignedIds = [...new Set(assignments.map((a: any) => Number(a.targetMemberId)))];

    const logs: any[] = await this.logModel.findAll({
      where: {
        followupFamilyId: { [Op.in]: familyIds },
        loggedAt: { [Op.between]: [start, end] },
      } as any,
      attributes: ['id', 'targetMemberId', 'followupFamilyId', 'loggedAt', 'logType', 'notes', 'nextAction', 'createdBy'],
    });
    // only count logs where target was assigned during log week (already filtered via assignments above, but double-check)
    const isAssignedAt = (targetId: number, familyId: number, at: Date) => {
      const a = assignments.find((x: any) => Number(x.targetMemberId) === Number(targetId) && Number(x.followupFamilyId) === Number(familyId));
      if (!a) return false;
      return at >= new Date(a.assignedAt) && (!a.unassignedAt || at < new Date(a.unassignedAt));
    };
    const weekLogs = logs.filter((l: any) => isAssignedAt(Number(l.targetMemberId), Number(l.followupFamilyId), new Date(l.loggedAt)));
    const loggedIds = [...new Set(weekLogs.map((l: any) => Number(l.targetMemberId)))];

    const missing = assignedIds.filter((id) => !loggedIds.includes(id));
    // last log per assigned member within the week (for the worklist UI)
    const lastLogByMember = new Map<number, any>();
    for (const l of logs as any[]) {
      const tid = Number(l.targetMemberId);
      if (!loggedIds.includes(tid)) continue;
      const cur = lastLogByMember.get(tid);
      if (!cur || new Date(l.loggedAt) > new Date(cur.loggedAt)) {
        lastLogByMember.set(tid, { logType: l.logType, loggedAt: l.loggedAt, notes: l.notes });
      }
    }
    const familyByMember = new Map<number, number>();
    for (const a of assignments as any[]) {
      const tid = Number(a.targetMemberId);
      if (!familyByMember.has(tid)) familyByMember.set(tid, Number(a.followupFamilyId));
    }
    const familyById = new Map<number, any>(families.map((f: any) => [Number(f.id), f]));
    const memberNameOf = async (tid: number) => {
      const m: any = await this.memberWithUser(tid);
      return m?.user?.fullName || `عضو ${tid}`;
    };
    // Groups with at least one valid follow-up record this week (activity feed).
    const activeGroupIds = [...new Set(weekLogs.map((l: any) => Number(l.followupFamilyId)))];
    // This week's activity feed, newest first (capped for payload size).
    const feedLogs = [...weekLogs].sort((a: any, b: any) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()).slice(0, 50);
    const creatorIds = [...new Set(feedLogs.map((l: any) => Number((l as any).createdBy)).filter(Boolean))];
    const creatorRows: any[] = creatorIds.length
      ? await this.memberModel.findAll({ where: { id: { [Op.in]: creatorIds } } as any, include: [{ model: User, attributes: ['fullName'] }] })
      : [];
    const creatorNameById = new Map<number, string>(creatorRows.map((r: any) => [Number(r.id), r?.user?.fullName || `خادم ${r.id}`]));
    const recentActivity = await Promise.all(
      feedLogs.map(async (l: any) => ({
        logId: Number(l.id),
        logType: (l as any).logType,
        loggedAt: (l as any).loggedAt,
        notes: (l as any).notes,
        nextAction: (l as any).nextAction || null,
        targetMemberId: Number(l.targetMemberId),
        targetName: await memberNameOf(Number(l.targetMemberId)),
        familyId: Number(l.followupFamilyId),
        familyName: (familyById.get(Number(l.followupFamilyId)) as any)?.name || null,
        createdByName: (l as any).createdBy ? (creatorNameById.get(Number((l as any).createdBy)) || null) : null,
      })),
    );
    // Most recent contact EVER per assigned member (any week) — lastLog above
    // stays "this week's log or null"; lastEverLog fills the UI's "previous
    // contact" line for members missing this week.
    const allLogs: any[] = await this.logModel.findAll({
      where: { followupFamilyId: { [Op.in]: familyIds } } as any,
      attributes: ['targetMemberId', 'followupFamilyId', 'loggedAt', 'logType'],
      order: [['loggedAt', 'DESC']],
    });
    const lastEverByMember = new Map<number, any>();
    for (const l of allLogs as any[]) {
      const tid = Number(l.targetMemberId);
      if (!lastEverByMember.has(tid)) {
        lastEverByMember.set(tid, { logType: l.logType, loggedAt: l.loggedAt });
      }
    }
    const enriched = await Promise.all(
      assignedIds.map(async (tid) => {
        const m: any = await this.memberWithUser(tid);
        const last = lastLogByMember.get(tid) || null;
        return {
          memberId: tid,
          fullName: m?.user?.fullName || `عضو ${tid}`,
          phones: m?.phones || [],
          doneThisWeek: loggedIds.includes(tid),
          lastLog: last,
          lastEverLog: lastEverByMember.get(tid) || null,
          familyId: familyByMember.get(tid) || null,
        };
      }),
    );
    return {
      weekStart: start.toISOString().split('T')[0],
      weekEnd: end.toISOString().split('T')[0],
      assigned: assignedIds,
      completed: loggedIds,
      missing,
      members: enriched,
      families: families.map((f: any) => ({ id: f.id, classId: f.classId, serviceId: f.serviceId })),
      activeGroupIds,
      recentActivity,
    };
  }

  async remove(churchId: string, id: string) {
    const family = await this.familyModel.findOne({ where: { id: Number(id), churchId: Number(churchId) } });
    if (!family) throw new NotFoundException('Follow-up not found');
    await family.destroy();
    return { success: true };
  }

  async getMonitoring(churchId: string, familyId: string, actorId: string, actorRoles: string[]) {
    const family: any = await this.findOne(churchId, familyId);
    const isOwner = Number(actorId) === Number(family.responsibleMemberId);
    const isLeader = actorRoles.some((r) => ['service_leader', 'assistant_service_leader', 'sector_leader', 'priest'].includes(r));
    if (!isOwner && !isLeader) {
      throw new ForbiddenException('Not allowed to view this group');
    }
    if (isLeader && !isOwner && family.serviceId) {
      const leaderService = await this.resolveLeaderServiceId(Number(churchId), Number(actorId));
      if (leaderService && Number(family.serviceId) !== leaderService) {
        throw new ForbiddenException('Not allowed for this service');
      }
    }
    const assignments: any[] = (family.assignments || []).filter((a: any) => a.isActive !== false);
    const targetIds = assignments.map((a: any) => Number(a.targetMemberId)).filter(Boolean);
    const logs: any[] = targetIds.length
      ? await this.logModel.findAll({
          where: { followupFamilyId: family.id, targetMemberId: targetIds } as any,
          order: [['loggedAt', 'DESC']],
        })
      : [];
    const lastByTarget = new Map<number, any>();
    for (const l of logs as any[]) {
      const tid = Number(l.targetMemberId);
      if (!lastByTarget.has(tid)) lastByTarget.set(tid, l.toJSON());
    }
    const members = assignments.map((a: any) => {
      const last = lastByTarget.get(Number(a.targetMemberId)) || null;
      return {
        targetMemberId: a.targetMemberId,
        target: (a as any).target || null,
        isActive: a.isActive,
        assignedAt: a.assignedAt,
        lastLog: last ? { id: last.id, logType: last.logType, notes: last.notes, loggedAt: last.loggedAt, nextAction: last.nextAction, nextActionDate: last.nextActionDate, createdBy: last.createdBy } : null,
      };
    });
    const contacted = members.filter((m: any) => !!m.lastLog).length;
    return {
      familyId: family.id,
      name: family.name,
      status: family.status,
      targetType: family.targetType,
      total: members.length,
      contacted,
      missing: members.length - contacted,
      rate: members.length ? Math.round((contacted / members.length) * 100) : 0,
      members,
    };
  }
}
