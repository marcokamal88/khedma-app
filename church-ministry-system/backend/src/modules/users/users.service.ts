import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { ChurchMember } from './entities/church-member.entity';
import { MemberRole } from './entities/member-role.entity';
import { Role } from './entities/role.entity';
import { ServantAssignment } from './entities/servant-assignment.entity';
import { Enrollment } from './entities/enrollment.entity';
import { MemberProfile } from './entities/member-profile.entity';
import { Class } from '../church/entities/class.entity';
import { StageGroup } from '../church/entities/stage-group.entity';
import { Service } from '../church/entities/service.entity';
import { ServiceYear } from '../service-year/entities/service-year.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateServantDto } from './dto/create-servant.dto';
import { UpdateUserDto, UpdateMemberDto } from './dto/update-user.dto';
import { normalizeUsername } from '../../core/utils/username.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(ChurchMember) private memberModel: typeof ChurchMember,
    @InjectModel(MemberRole) private memberRoleModel: typeof MemberRole,
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(ServantAssignment) private servantAssignmentModel: typeof ServantAssignment,
    @InjectModel(Enrollment) private enrollmentModel: typeof Enrollment,
    @InjectModel(ServiceYear) private serviceYearModel: typeof ServiceYear,
    @InjectModel(MemberProfile) private profileModel: typeof MemberProfile,
    @InjectModel(Class) private classModel: typeof Class,
    private sequelize: Sequelize,
  ) {}

  async create(dto: CreateUserDto, churchId: string) {
    const username = normalizeUsername(dto.username);
    const existing = await this.userModel.findOne({
      where: {
        [Op.or]: [
          { email: username },
          ...(dto.phone ? [{ phone: dto.phone }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Username already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      fullName: dto.fullName,
      email: username,
      phone: dto.phone || null,
      passwordHash,
    } as any);

    const member = await this.memberModel.create({
      userId: user.id,
      churchId,
      isActive: true,
    } as any);

    await this.profileModel.create({
      churchId,
      churchMemberId: member.id,
    } as any);

    return { id: user.id, fullName: user.fullName, username: user.email, phone: user.phone };
  }

  async findByChurch(churchId: string) {
    const members = await this.memberModel.findAll({
      where: { churchId, isActive: true },
      include: [{ model: User, attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl'] }],
    });
    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      fullName: (m as any).user?.fullName,
      email: (m as any).user?.email,
      phone: (m as any).user?.phone,
      avatarUrl: (m as any).user?.avatarUrl,
      joinedAt: m.joinedAt,
    }));
  }

  async getMe(memberId: string, churchId: string) {
    const member = await this.memberModel.findOne({
      where: { id: memberId, churchId, isActive: true },
      include: [{ model: User, attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl'] }],
    });

    if (!member) throw new NotFoundException('Member not found');

    const roles = await this.memberRoleModel.findAll({
      where: { churchMemberId: member.id },
      include: [{ model: Role, attributes: ['name', 'label'] }],
    });

    return {
      id: member.id,
      userId: member.userId,
      fullName: (member as any).user?.fullName,
      email: (member as any).user?.email,
      phone: (member as any).user?.phone,
      avatarUrl: (member as any).user?.avatarUrl,
      roles: roles.map((r) => ({ name: (r as any).role?.name, label: (r as any).role?.label })),
    };
  }

  async updateMe(memberId: string, dto: UpdateUserDto, churchId: string) {
    const member = await this.memberModel.findOne({
      where: { id: memberId, churchId, isActive: true },
    });

    if (!member) throw new NotFoundException('Member not found');

    await this.userModel.update(dto as any, { where: { id: member.userId } });

    return { success: true };
  }

  async updateMember(memberId: string, dto: UpdateMemberDto, churchId: string) {
    const member = await this.memberModel.findOne({
      where: { id: memberId, churchId, isActive: true },
    });
    if (!member) throw new NotFoundException('Member not found');

    if (dto.fullName) {
      await this.userModel.update({ fullName: dto.fullName } as any, { where: { id: member.userId } });
    }

    const profileFields: any = {};
    if (dto.address !== undefined) profileFields.address = dto.address;
    if (dto.birthDate !== undefined) profileFields.birthDate = dto.birthDate;
    if ((dto as any).gender !== undefined) profileFields.gender = (dto as any).gender;
    if (dto.notes !== undefined) profileFields.notes = dto.notes;
    if (dto.phone !== undefined) {
      profileFields.phones = dto.phone ? [dto.phone] : null;
      await this.userModel.update({ phone: dto.phone } as any, { where: { id: member.userId } });
    }

    if (Object.keys(profileFields).length > 0) {
      const [profile] = await this.profileModel.findOrCreate({
        where: { churchMemberId: member.id },
        defaults: { churchId, churchMemberId: member.id } as any,
      });
      await profile.update(profileFields);
    }

    return { success: true };
  }

  async searchMembers(churchId: string, query: string, serviceId?: string) {
    const memberWhere: any = { churchId, isActive: true };

    if (serviceId) {
      const serviceYear = await this.serviceYearModel.findOne({
        where: { churchId, isCurrent: true },
      });
      const serviceMemberIds = serviceYear
        ? await this.getServiceMemberIds(churchId, Number(serviceId), serviceYear.id)
        : [];
      const leaderIds = await this.getServiceLeaderIds(churchId);
      const allowedIds = serviceMemberIds.filter((id) => !leaderIds.includes(id));
      if (allowedIds.length === 0) return [];
      memberWhere.id = { [Op.in]: allowedIds };
    }

    return this.memberModel.findAll({
      where: memberWhere,
      include: [
        {
          model: User,
          where: {
            fullName: { [Op.like]: `%${query}%` },
          },
          attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl'],
        },
      ],
      limit: 20,
    }).then((members) =>
      members.map((m) => ({
        id: m.id,
        userId: m.userId,
        fullName: (m as any).user?.fullName,
        email: (m as any).user?.email,
        phone: (m as any).user?.phone,
        avatarUrl: (m as any).user?.avatarUrl,
      })),
    );
  }

  private async getServiceLeaderIds(churchId: string): Promise<number[]> {
    const memberRoles = await this.memberRoleModel.findAll({
      where: { churchId },
      include: [
        {
          model: Role,
          where: { name: { [Op.in]: ['service_leader', 'assistant_service_leader'] } },
          attributes: [],
        },
      ],
      attributes: ['churchMemberId'],
    });
    return memberRoles.map((mr) => Number((mr as any).churchMemberId));
  }

  private async getServiceMemberIds(
    churchId: string,
    serviceId: number,
    serviceYearId: number,
  ): Promise<number[]> {
    const [enrollments, assignments] = await Promise.all([
      this.enrollmentModel.findAll({
        where: { churchId, serviceId, serviceYearId, isActive: true } as any,
        attributes: ['churchMemberId'],
      }),
      this.servantAssignmentModel.findAll({
        where: { churchId, serviceId, serviceYearId, isActive: true } as any,
        attributes: ['churchMemberId'],
      }),
    ]);
    const ids = new Set<number>();
    for (const e of enrollments) ids.add(Number((e as any).churchMemberId));
    for (const a of assignments) ids.add(Number((a as any).churchMemberId));
    return [...ids];
  }

  async registerMember(dto: CreateUserDto & {
    serviceId?: string;
    classId?: string;
    serviceYearId?: string;
    address?: string;
    birthDate?: string;
    notes?: string;
    gender?: string;
    schoolGrade?: number;
  }, churchId: string, user?: any) {
    const username = normalizeUsername(dto.username);
    const existing = await this.userModel.findOne({
      where: {
        [Op.or]: [
          { email: username },
          ...(dto.phone ? [{ phone: dto.phone }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Username already taken');
    }

    const enrollmentData = await this.resolveEnrollmentScope(dto, churchId, user);

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const userRow = await this.userModel.create({
      fullName: dto.fullName,
      email: username,
      phone: dto.phone || null,
      passwordHash,
    } as any);

    const member = await this.memberModel.create({
      userId: userRow.id,
      churchId,
      isActive: true,
    } as any);

    if (enrollmentData) {
      await this.enrollmentModel.create({
        churchId,
        churchMemberId: member.id,
        ...enrollmentData,
        isActive: true,
      } as any);
    }

    await this.profileModel.create({
      churchId,
      churchMemberId: member.id,
      birthDate: dto.birthDate || null,
      address: dto.address || null,
      notes: dto.notes || null,
      gender: dto.gender || null,
      schoolGrade: dto.schoolGrade || null,
      phones: dto.phone ? [dto.phone] : null,
    } as any);

    const servedMemberRole = await this.roleModel.findOne({ where: { name: 'served_member' } });
    if (servedMemberRole) {
      await this.memberRoleModel.create({
        churchMemberId: member.id,
        roleId: servedMemberRole.id,
        churchId,
      } as any);
    }

    return {
      id: userRow.id,
      memberId: member.id,
      fullName: userRow.fullName,
      username: userRow.email,
      phone: userRow.phone,
    };
  }

  private async resolveEnrollmentScope(
    dto: { serviceId?: string; classId?: string; serviceYearId?: string },
    churchId: string,
    user?: any,
  ) {
    const activeRole = user?.activeContext?.role;
    const isClassScoped = activeRole === 'servant' || activeRole === 'class_leader';
    const isServiceScoped = activeRole === 'service_leader' || activeRole === 'assistant_service_leader';

    if (!isClassScoped && !isServiceScoped && (!dto.serviceId || !dto.classId)) {
      return null;
    }

    let classId = Number(dto.classId);
    let serviceId = Number(dto.serviceId);

    if (isClassScoped) {
      const scopeClassId = Number(user?.activeContext?.scope?.classId);
      if (!scopeClassId) throw new ForbiddenException('No class assignment in active context');
      classId = scopeClassId;
    }

    const cls = await this.classModel.findOne({
      where: { id: classId, churchId, isActive: true } as any,
    });
    if (!cls) throw new BadRequestException('Class not found');

    if (isClassScoped) {
      serviceId = Number(cls.serviceId);
    } else if (isServiceScoped) {
      const scopeServiceId = Number(user?.activeContext?.scope?.serviceId || serviceId);
      if (Number(cls.serviceId) !== scopeServiceId) {
        throw new BadRequestException('Class is not part of your service');
      }
      serviceId = scopeServiceId;
    } else if (serviceId && Number(cls.serviceId) !== serviceId) {
      throw new BadRequestException('Class is not part of the selected service');
    } else {
      serviceId = Number(cls.serviceId);
    }

    let serviceYearId = Number(dto.serviceYearId);
    if (!serviceYearId) {
      const currentYear = await this.serviceYearModel.findOne({
        where: { churchId, isCurrent: true },
      });
      if (!currentYear) throw new NotFoundException('No active service year');
      serviceYearId = Number(currentYear.id);
    }

    return {
      serviceId,
      classId,
      serviceYearId,
      stageGroupId: cls.stageGroupId ?? null,
    };
  }

  async getMyClass(memberId: string, churchId: string) {
    const serviceYear = await this.serviceYearModel.findOne({
      where: { churchId, isCurrent: true },
    });
    if (!serviceYear) throw new NotFoundException('No active service year');

    const assignment = await this.servantAssignmentModel.findOne({
      where: { churchMemberId: memberId, churchId, serviceYearId: serviceYear.id, isActive: true },
      include: [
        { model: Class, include: [{ model: StageGroup }] },
        { model: Service },
      ],
    });

    if (!assignment) throw new NotFoundException('No class assignment found for this servant');
    return assignment;
  }

  async assignRole(memberId: string, roleName: string, churchId: string) {
    const role = await this.roleModel.findOne({ where: { name: roleName } });
    if (!role) throw new NotFoundException('Role not found');

    const member = await this.memberModel.findOne({
      where: { id: memberId, churchId },
    });
    if (!member) throw new NotFoundException('Member not found');

    const existing = await this.memberRoleModel.findOne({
      where: { churchMemberId: memberId, roleId: role.id },
    });

    if (!existing) {
      await this.memberRoleModel.create({
        churchMemberId: memberId,
        roleId: role.id,
        churchId,
      } as any);
    }

    return { success: true };
  }

  async assignServant(data: { churchMemberId: string; serviceId: string; classId: string; leaderRole?: string }, churchId: string) {
    const serviceYear = await this.serviceYearModel.findOne({
      where: { churchId, isCurrent: true },
    });
    if (!serviceYear) throw new NotFoundException('No active service year');

    const targetMemberId = Number(data.churchMemberId);
    const serviceId = Number(data.serviceId);
    const leaderIds = await this.getServiceLeaderIds(churchId);

    const member = await this.memberModel.findOne({
      where: { id: targetMemberId, churchId, isActive: true } as any,
    });
    if (!member) throw new NotFoundException('Member not found');
    if (leaderIds.includes(targetMemberId)) {
      throw new BadRequestException('Service leaders cannot be assigned as servants');
    }

    const cls = await this.classModel.findOne({
      where: { id: Number(data.classId), churchId, serviceId, isActive: true } as any,
    });
    if (!cls) throw new BadRequestException('Class not found in this service');

    const existingEnrollment = await this.enrollmentModel.findOne({
      where: {
        churchId,
        churchMemberId: targetMemberId,
        serviceId,
        serviceYearId: serviceYear.id,
        isActive: true,
      } as any,
    });
    if (existingEnrollment) {
      throw new BadRequestException('Member is already a student in this service');
    }

    const leaderRole = data.leaderRole || 'servant';
    const existing = await this.servantAssignmentModel.findOne({
      where: {
        churchId,
        churchMemberId: targetMemberId,
        serviceId,
        serviceYearId: serviceYear.id,
        isActive: true,
      } as any,
    });

    let assignment: any;
    if (existing) {
      await existing.update({ classId: cls.id, leaderRole } as any);
      assignment = existing;
    } else {
      assignment = await this.servantAssignmentModel.create({
        churchId,
        churchMemberId: targetMemberId,
        serviceId,
        classId: cls.id,
        serviceYearId: serviceYear.id,
        leaderRole,
        isActive: true,
      } as any);
    }

    await this.assignRole(String(targetMemberId), leaderRole === 'class_leader' ? 'class_leader' : 'servant', churchId);

    return assignment;
  }

  async createServant(dto: CreateServantDto, churchId: string, user: any) {
    const serviceId = await this.resolveLeaderServiceId(churchId, user);
    if (!serviceId) throw new ForbiddenException('No service assigned to this leader');

    const serviceYear = await this.serviceYearModel.findOne({
      where: { churchId, isCurrent: true },
    });
    if (!serviceYear) throw new NotFoundException('No active service year');

    const cls = await this.classModel.findOne({
      where: { id: Number(dto.classId), churchId, serviceId, isActive: true } as any,
    });
    if (!cls) throw new BadRequestException('Class not found in your service');

    const username = normalizeUsername(dto.username);
    const existing = await this.userModel.findOne({
      where: {
        [Op.or]: [
          { email: username },
          ...(dto.phone ? [{ phone: dto.phone }] : []),
        ],
      },
    });
    if (existing) {
      throw new ConflictException('Username already taken');
    }

    const role = await this.roleModel.findOne({ where: { name: 'servant' } });
    if (!role) throw new NotFoundException('Servant role is not configured');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.sequelize.transaction(async (transaction) => {
      const userRow = await this.userModel.create({
        fullName: dto.fullName,
        email: username,
        phone: dto.phone || null,
        passwordHash,
      } as any, { transaction });

      const member = await this.memberModel.create({
        userId: userRow.id,
        churchId,
        isActive: true,
      } as any, { transaction });

      await this.profileModel.create({
        churchId,
        churchMemberId: member.id,
        gender: dto.gender || null,
        phones: dto.phone ? [dto.phone] : null,
      } as any, { transaction });

      await this.memberRoleModel.create({
        churchMemberId: member.id,
        roleId: role.id,
        churchId,
      } as any, { transaction });

      const assignment = await this.servantAssignmentModel.create({
        churchId,
        churchMemberId: member.id,
        serviceId,
        classId: cls.id,
        serviceYearId: serviceYear.id,
        leaderRole: 'servant',
        isActive: true,
      } as any, { transaction });

      return {
        memberId: member.id,
        userId: userRow.id,
        fullName: userRow.fullName,
        username: userRow.email,
        phone: userRow.phone,
        serviceId,
        classId: cls.id,
        serviceYearId: Number(serviceYear.id),
        assignmentId: assignment.id,
      };
    });
  }

  private async resolveLeaderServiceId(churchId: string, user: any): Promise<number | null> {
    const scopeId = user?.activeContext?.scope?.serviceId;
    if (scopeId) return Number(scopeId);
    if (!user?.memberId) return null;

    const assignment = await this.servantAssignmentModel.findOne({
      where: {
        churchId,
        churchMemberId: Number(user.memberId),
        leaderRole: { [Op.in]: ['service_leader', 'assistant_service_leader'] },
        isActive: true,
      } as any,
      attributes: ['serviceId'],
    });

    return assignment ? Number((assignment as any).serviceId) : null;
  }

  async getServantAssignments(churchId: string, serviceId: string, currentMemberId?: number) {
    const serviceYear = await this.serviceYearModel.findOne({
      where: { churchId, isCurrent: true },
    });
    if (!serviceYear) throw new NotFoundException('No active service year');

    const allServiceMemberIds = await this.getServiceMemberIds(churchId, Number(serviceId), serviceYear.id);
    const serviceMemberSet = new Set<number>(allServiceMemberIds);

    const SERVANT_ROLES = ['servant', 'class_leader'];
    const servantRoles = await this.roleModel.findAll({
      where: { name: { [Op.in]: SERVANT_ROLES } } as any,
      attributes: ['id'],
    });
    const servantRoleIds = servantRoles.map((r) => r.id);

    const excludeIds = await this.getServiceLeaderIds(churchId);
    if (currentMemberId) excludeIds.push(Number(currentMemberId));
    const excludeSet = new Set<number>(excludeIds.map(Number));

    const memberRoles = await this.memberRoleModel.findAll({
      where: { churchId, roleId: servantRoleIds } as any,
      attributes: ['churchMemberId'],
      group: ['churchMemberId'],
    });

    const memberIds = memberRoles
      .map((mr) => Number((mr as any).churchMemberId))
      .filter((id) => serviceMemberSet.has(id) && !excludeSet.has(id));
    if (memberIds.length === 0) return [];

    const [members, assignments] = await Promise.all([
      this.memberModel.findAll({
        where: { id: memberIds, churchId } as any,
        include: [{ model: User, attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl'] }],
      }),
      this.servantAssignmentModel.findAll({
        where: { churchId, serviceId, serviceYearId: serviceYear.id, isActive: true, churchMemberId: memberIds } as any,
        include: [{ model: Class, attributes: ['id', 'name'] }],
      }),
    ]);

    const assignmentMap = new Map<number, any>();
    for (const a of assignments) assignmentMap.set(Number((a as any).churchMemberId), a);

    return members.map((m) => {
      const a = assignmentMap.get(Number(m.id));
      return {
        id: a ? a.id : null,
        churchMemberId: m.id,
        fullName: (m as any).user?.fullName,
        email: (m as any).user?.email,
        phone: (m as any).user?.phone,
        avatarUrl: (m as any).user?.avatarUrl,
        classId: a ? a.classId : null,
        className: a ? ((a as any).class?.name || '') : '',
        leaderRole: a ? (a.leaderRole || 'servant') : null,
      };
    });
  }

  async updateServantAssignment(churchId: string, id: string, data: { classId?: string; leaderRole?: string }) {
    const assignment = await this.servantAssignmentModel.findOne({
      where: { id, churchId, isActive: true },
    });
    if (!assignment) throw new NotFoundException('Servant assignment not found');

    const updateData: any = {};
    if (data.classId !== undefined) updateData.classId = data.classId;
    if (data.leaderRole !== undefined) updateData.leaderRole = data.leaderRole;

    if (Object.keys(updateData).length > 0) {
      await this.servantAssignmentModel.update(updateData, { where: { id } });
    }

    if (data.leaderRole === 'class_leader') {
      await this.assignRole(String(assignment.churchMemberId), 'class_leader', churchId);
    }

    return this.servantAssignmentModel.findByPk(id, {
      include: [
        { model: ChurchMember, include: [{ model: User, attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl'] }] },
        { model: Class, attributes: ['id', 'name'] },
      ],
    });
  }

  async removeServantAssignment(churchId: string, id: string) {
    const assignment = await this.servantAssignmentModel.findOne({
      where: { id, churchId, isActive: true },
    });
    if (!assignment) throw new NotFoundException('Servant assignment not found');

    await this.servantAssignmentModel.update({ isActive: false } as any, { where: { id } });
    return { success: true };
  }
}
