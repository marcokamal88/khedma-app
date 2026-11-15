import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { ChurchMember } from '../users/entities/church-member.entity';
import { MemberRole } from '../users/entities/member-role.entity';
import { Role } from '../users/entities/role.entity';
import { ServantAssignment } from '../users/entities/servant-assignment.entity';
import { SectorAssignment } from '../users/entities/sector-assignment.entity';
import { Enrollment } from '../users/entities/enrollment.entity';
import { Church } from '../church/entities/church.entity';
import { Service } from '../church/entities/service.entity';
import { Sector } from '../church/entities/sector.entity';
import { Class } from '../church/entities/class.entity';
import { MemberProfile } from '../users/entities/member-profile.entity';
import { ServiceYear } from '../service-year/entities/service-year.entity';
import { CreateChurchDto } from './dto/create-church.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { AssignServiceLeaderDto } from './dto/assign-service-leader.dto';
import { AssignSectorLeaderDto } from './dto/assign-sector-leader.dto';
import { AssignClassDto } from './dto/assign-class.dto';
import { EnrollMemberDto } from './dto/enroll-member.dto';

export interface UserContext {
  role: string;
  scope: { serviceId?: number; classId?: number; sectorId?: number; stageGroupId?: number };
  displayLabel: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(ChurchMember) private memberModel: typeof ChurchMember,
    @InjectModel(MemberRole) private memberRoleModel: typeof MemberRole,
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(ServantAssignment) private servantAssignmentModel: typeof ServantAssignment,
    @InjectModel(SectorAssignment) private sectorAssignmentModel: typeof SectorAssignment,
    @InjectModel(Enrollment) private enrollmentModel: typeof Enrollment,
    @InjectModel(Church) private churchModel: typeof Church,
    @InjectModel(Service) private serviceModel: typeof Service,
    @InjectModel(Sector) private sectorModel: typeof Sector,
    @InjectModel(Class) private classModel: typeof Class,
    @InjectModel(MemberProfile) private profileModel: typeof MemberProfile,
    @InjectModel(ServiceYear) private serviceYearModel: typeof ServiceYear,
  ) {}

  /* ==================== CHURCH MANAGEMENT ==================== */

  async createChurch(dto: CreateChurchDto) {
    const existing = await this.churchModel.findOne({
      where: { subdomain: dto.subdomain },
    });
    if (existing) {
      throw new ConflictException('Church subdomain already exists');
    }

    const church = await this.churchModel.create({
      name: dto.name,
      subdomain: dto.subdomain,
      settings: { contactEmail: dto.contactEmail },
      isActive: true,
    } as any);

    return { id: church.id, name: church.name, subdomain: church.subdomain, isActive: church.isActive };
  }

  async getAllChurches() {
    return this.churchModel.findAll({
      attributes: ['id', 'name', 'subdomain', 'isActive'],
      order: [['id', 'ASC']],
    });
  }

  async getChurchById(churchId: number) {
    const church = await this.churchModel.findByPk(churchId);
    if (!church) throw new NotFoundException('Church not found');
    return church;
  }

  /* ==================== USER CREATION ==================== */

  async createUser(dto: CreateAdminUserDto, churchId: number) {
    const existingUser = await this.userModel.findOne({ where: { email: dto.email } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const church = await this.churchModel.findByPk(churchId);
    if (!church) throw new NotFoundException('Church not found');

    const role = await this.roleModel.findOne({ where: { name: dto.role } });
    if (!role) throw new NotFoundException(`Role '${dto.role}' not found`);

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      fullName: dto.fullName,
      email: dto.email,
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
      gender: dto.gender || null,
    } as any);

    await this.memberRoleModel.create({
      churchMemberId: member.id,
      roleId: role.id,
      churchId,
    } as any);

    if (dto.role === 'service_leader' || dto.role === 'assistant_service_leader') {
      if (!dto.serviceId) throw new BadRequestException('serviceId is required for service leader roles');
      await this.servantAssignmentModel.create({
        churchId,
        churchMemberId: member.id,
        serviceId: Number(dto.serviceId),
        serviceYearId: await this.getDefaultServiceYearId(churchId),
        leaderRole: dto.role,
        isActive: true,
      } as any);
    }

    if (dto.role === 'sector_leader') {
      if (!dto.sectorId) throw new BadRequestException('sectorId is required for sector leader');
      await this.sectorAssignmentModel.create({
        churchMemberId: member.id,
        sectorId: Number(dto.sectorId),
        churchId,
        isActive: true,
      } as any);
    }

    if (dto.role === 'servant' || dto.role === 'class_leader') {
      if (!dto.serviceId || !dto.classId) {
        throw new BadRequestException('serviceId and classId are required for servant/class_leader');
      }
      await this.servantAssignmentModel.create({
        churchId,
        churchMemberId: member.id,
        serviceId: Number(dto.serviceId),
        classId: Number(dto.classId),
        serviceYearId: await this.getDefaultServiceYearId(churchId),
        leaderRole: dto.role,
        isActive: true,
      } as any);
    }

    if (dto.role === 'served_member') {
      if (!dto.serviceId) throw new BadRequestException('serviceId is required for served_member');
      await this.enrollmentModel.create({
        churchId,
        churchMemberId: member.id,
        serviceId: Number(dto.serviceId),
        classId: dto.classId ? Number(dto.classId) : null,
        serviceYearId: await this.getDefaultServiceYearId(churchId),
        stageGroupId: dto.stageGroupId ? Number(dto.stageGroupId) : null,
        isActive: true,
      } as any);
    }

    const createdMember = await this.memberModel.findOne({ where: { id: member.id }, include: [
        { model: User, attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: MemberRole, include: [{ model: Role, attributes: ['name', 'label'] }] },
      ] });

    return createdMember;
  }

  async getUsersByChurch(churchId: number) {
    const members = await this.memberModel.findAll({
      where: { churchId },
      include: [
        { model: User, attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl'] },
        { model: MemberRole, include: [{ model: Role, attributes: ['name', 'label'] }] },
      ],
      order: [['id', 'DESC']],
    });

    return members.map((m: any) => ({
      id: m.id,
      userId: m.userId,
      fullName: m.user?.fullName,
      email: m.user?.email,
      phone: m.user?.phone,
      avatarUrl: m.user?.avatarUrl,
      isActive: m.isActive,
      joinedAt: m.joinedAt,
      roles: m.memberRoles?.map((mr: any) => ({
        roleId: mr.roleId,
        name: mr.role?.name,
        label: mr.role?.label,
      })) || [],
    }));
  }

  async getUserById(memberId: string, churchId: number) {
    const member = await this.memberModel.findOne({ where: { id: Number(memberId), churchId }, include: [
        { model: User, attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl'] },
        { model: MemberRole, include: [{ model: Role, attributes: ['name', 'label'] }] },
      ] });
    if (!member) throw new NotFoundException('User not found');
    return member;
  }

  /* ==================== ROLE & CONTEXT DETECTION ==================== */

  async getUserContexts(memberId: string, churchId: number) {
    const member = await this.memberModel.findOne({ where: { id: Number(memberId), churchId }, include: [
        { model: User, attributes: ['id', 'fullName', 'email'] },
        { model: MemberRole, include: [{ model: Role, attributes: ['name', 'label'] }] },
      ] });
    if (!member) throw new NotFoundException('User not found');

    const roles: string[] = member.memberRoles?.map((mr: any) => mr.role.name) || [];
    const contexts: UserContext[] = [];

    if (roles.includes('sector_leader') || roles.includes('priest')) {
      const sectorAssignments = await this.sectorAssignmentModel.findAll({
        where: { churchMemberId: memberId, churchId, isActive: true },
        include: [{ model: Sector, attributes: ['name'] }],
      });
      for (const a of sectorAssignments) {
        contexts.push({
          role: 'sector_leader',
          scope: { sectorId: a.sectorId },
          displayLabel: (a as any).sector?.name || 'Sector',
        });
      }
    }

    if (roles.includes('service_leader') || roles.includes('assistant_service_leader')) {
      const leaderRoles: string[] = [];
      if (roles.includes('service_leader')) leaderRoles.push('service_leader');
      if (roles.includes('assistant_service_leader')) leaderRoles.push('assistant_service_leader');

      const assignments = await this.servantAssignmentModel.findAll({
        where: {
          churchMemberId: memberId,
          churchId,
          isActive: true,
          classId: null,
          leaderRole: { [Op.in]: leaderRoles },
        },
        include: [{ model: Service, attributes: ['name'] }],
      });
      for (const a of assignments) {
        contexts.push({
          role: a.leaderRole || leaderRoles[0],
          scope: { serviceId: a.serviceId },
          displayLabel: (a as any).service?.name || '',
        });
      }
    }

    const classRoles: string[] = [];
    if (roles.includes('servant')) classRoles.push('servant');
    if (roles.includes('class_leader')) classRoles.push('class_leader');

    if (classRoles.length > 0) {
      const assignments = await this.servantAssignmentModel.findAll({
        where: {
          churchMemberId: memberId,
          churchId,
          isActive: true,
          classId: { [Op.ne]: null },
        },
        include: [
          { model: Service, attributes: ['name'] },
          { model: Class, attributes: ['name'] },
        ],
      });
      for (const a of assignments) {
        const role = a.leaderRole === 'class_leader' ? 'class_leader' : 'servant';
        contexts.push({
          role,
          scope: { serviceId: a.serviceId, classId: a.classId },
          displayLabel: `${(a as any).service?.name || ''} - ${(a as any).class?.name || ''}`,
        });
      }
    }

    if (roles.includes('served_member')) {
      const enrollments = await this.enrollmentModel.findAll({
        where: { churchMemberId: memberId, isActive: true },
        include: [{ model: Service, attributes: ['name'] }],
      });
      for (const e of enrollments) {
        contexts.push({
          role: 'served_member',
          scope: { serviceId: e.serviceId },
          displayLabel: (e as any).service?.name || 'Served Member',
        });
      }
    }

    if (roles.includes('parent')) {
      contexts.push({
        role: 'parent',
        scope: {},
        displayLabel: 'Parent',
      });
    }

    if (roles.includes('priest')) {
      contexts.push({
        role: 'priest',
        scope: {},
        displayLabel: 'Priest',
      });
    }

    return {
      memberId,
      fullName: (member as any).user?.fullName,
      roles,
      contexts,
    };
  }

  /* ==================== ROLE ASSIGNMENT ==================== */

  async assignRole(memberId: string, churchId: number, dto: AssignRoleDto) {
    const member = await this.memberModel.findOne({ where: { id: Number(memberId), churchId } });
    if (!member) throw new NotFoundException('User not found');

    const role = await this.roleModel.findOne({ where: { name: dto.role } });
    if (!role) throw new NotFoundException(`Role '${dto.role}' not found`);

    const existing = await this.memberRoleModel.findOne({
      where: { churchMemberId: memberId, roleId: role.id, churchId },
    });
    if (existing) throw new ConflictException('Role already assigned to this user');

    await this.memberRoleModel.create({
      churchMemberId: member.id,
      roleId: role.id,
      churchId,
    } as any);

    return { success: true, message: `Role '${dto.role}' assigned` };
  }

  async removeRole(memberId: string, churchId: number, roleId: string) {
    const memberRole = await this.memberRoleModel.findOne({
      where: { id: roleId, churchMemberId: memberId, churchId },
    });
    if (!memberRole) throw new NotFoundException('Role assignment not found');

    await memberRole.destroy();
    return { success: true, message: 'Role removed' };
  }

  /* ==================== SERVICE LEADER ASSIGNMENT ==================== */

  async assignServiceLeader(memberId: string, churchId: number, dto: AssignServiceLeaderDto) {
    const member = await this.memberModel.findOne({ where: { id: Number(memberId), churchId } });
    if (!member) throw new NotFoundException('User not found');

    const service = await this.serviceModel.findByPk(Number(dto.serviceId));
    if (!service) throw new NotFoundException('Service not found');
    if (service.churchId !== churchId) throw new BadRequestException('Service does not belong to this church');

    const roleName = dto.leaderRole;
    const role = await this.roleModel.findOne({ where: { name: roleName } });
    if (!role) throw new NotFoundException(`Role '${roleName}' not found`);

    const existingRole = await this.memberRoleModel.findOne({
      where: { churchMemberId: memberId, roleId: role.id, churchId },
    });
    if (!existingRole) {
      await this.memberRoleModel.create({
        churchMemberId: member.id,
        roleId: role.id,
        churchId,
      } as any);
    }

    const existingAssignment = await this.servantAssignmentModel.findOne({
      where: {
        churchMemberId: memberId,
        churchId,
        serviceId: Number(dto.serviceId),
        classId: null,
        leaderRole: dto.leaderRole,
      },
    });

    if (existingAssignment) {
      await existingAssignment.update({ isActive: true } as any);
    } else {
      await this.servantAssignmentModel.create({
        churchId,
        churchMemberId: member.id,
        serviceId: Number(dto.serviceId),
        serviceYearId: await this.getDefaultServiceYearId(churchId),
        leaderRole: dto.leaderRole,
        isActive: true,
      } as any);
    }

    return { success: true, message: `Assigned as ${dto.leaderRole} for service ${service.name}` };
  }

  /* ==================== SECTOR LEADER ASSIGNMENT ==================== */

  async assignSectorLeader(memberId: string, churchId: number, dto: AssignSectorLeaderDto) {
    const member = await this.memberModel.findOne({ where: { id: Number(memberId), churchId } });
    if (!member) throw new NotFoundException('User not found');

    const sector = await this.sectorModel.findByPk(Number(dto.sectorId));
    if (!sector) throw new NotFoundException('Sector not found');
    if (sector.churchId !== churchId) throw new BadRequestException('Sector does not belong to this church');

    const role = await this.roleModel.findOne({ where: { name: 'sector_leader' } });
    if (!role) throw new NotFoundException('Role sector_leader not found');

    const existingRole = await this.memberRoleModel.findOne({
      where: { churchMemberId: memberId, roleId: role.id, churchId },
    });
    if (!existingRole) {
      await this.memberRoleModel.create({
        churchMemberId: member.id,
        roleId: role.id,
        churchId,
      } as any);
    }

    const existingAssignment = await this.sectorAssignmentModel.findOne({
      where: { churchMemberId: memberId, sectorId: Number(dto.sectorId), churchId },
    });

    if (existingAssignment) {
      await existingAssignment.update({ isActive: true } as any);
    } else {
      await this.sectorAssignmentModel.create({
        churchMemberId: member.id,
        sectorId: Number(dto.sectorId),
        churchId,
        isActive: true,
      } as any);
    }

    return { success: true, message: `Assigned as sector leader for ${sector.name}` };
  }

  /* ==================== CLASS ASSIGNMENT (Servant / Class Leader) ==================== */

  async assignClass(memberId: string, churchId: number, dto: AssignClassDto) {
    const member = await this.memberModel.findOne({ where: { id: Number(memberId), churchId } });
    if (!member) throw new NotFoundException('User not found');

    const service = await this.serviceModel.findByPk(Number(dto.serviceId));
    if (!service) throw new NotFoundException('Service not found');
    if (service.churchId !== churchId) throw new BadRequestException('Service does not belong to this church');

    const classEntity = await this.classModel.findByPk(Number(dto.classId));
    if (!classEntity) throw new NotFoundException('Class not found');
    if (classEntity.serviceId !== Number(dto.serviceId)) {
      throw new BadRequestException('Class does not belong to this service');
    }

    const role = await this.roleModel.findOne({ where: { name: dto.leaderRole } });
    if (!role) throw new NotFoundException(`Role '${dto.leaderRole}' not found`);

    const existingRole = await this.memberRoleModel.findOne({
      where: { churchMemberId: memberId, roleId: role.id, churchId },
    });
    if (!existingRole) {
      await this.memberRoleModel.create({
        churchMemberId: member.id,
        roleId: role.id,
        churchId,
      } as any);
    }

    const existingAssignment = await this.servantAssignmentModel.findOne({
      where: {
        churchMemberId: memberId,
        churchId,
        serviceId: Number(dto.serviceId),
        classId: Number(dto.classId),
        leaderRole: dto.leaderRole,
      },
    });

    if (existingAssignment) {
      await existingAssignment.update({ isActive: true } as any);
    } else {
      await this.servantAssignmentModel.create({
        churchId,
        churchMemberId: member.id,
        serviceId: Number(dto.serviceId),
        classId: Number(dto.classId),
        serviceYearId: await this.getDefaultServiceYearId(churchId),
        leaderRole: dto.leaderRole,
        isActive: true,
      } as any);
    }

    return { success: true, message: `Assigned as ${dto.leaderRole} for class ${classEntity.name}` };
  }

  /* ==================== ENROLL SERVED MEMBER ==================== */

  async enrollServedMember(memberId: string, churchId: number, dto: EnrollMemberDto) {
    const member = await this.memberModel.findOne({ where: { id: Number(memberId), churchId } });
    if (!member) throw new NotFoundException('User not found');

    const service = await this.serviceModel.findByPk(Number(dto.serviceId));
    if (!service) throw new NotFoundException('Service not found');
    if (service.churchId !== churchId) throw new BadRequestException('Service does not belong to this church');

    const role = await this.roleModel.findOne({ where: { name: 'served_member' } });
    if (!role) throw new NotFoundException('Role served_member not found');

    const existingRole = await this.memberRoleModel.findOne({
      where: { churchMemberId: memberId, roleId: role.id, churchId },
    });
    if (!existingRole) {
      await this.memberRoleModel.create({
        churchMemberId: member.id,
        roleId: role.id,
        churchId,
      } as any);
    }

    const existingEnrollment = await this.enrollmentModel.findOne({
      where: {
        churchMemberId: memberId,
        churchId,
        serviceId: Number(dto.serviceId),
        classId: dto.classId ? Number(dto.classId) : null,
      },
    });

    if (existingEnrollment) {
      await existingEnrollment.update({ isActive: true } as any);
    } else {
      await this.enrollmentModel.create({
        churchId,
        churchMemberId: member.id,
        serviceId: Number(dto.serviceId),
        classId: dto.classId ? Number(dto.classId) : null,
        serviceYearId: await this.getDefaultServiceYearId(churchId),
        stageGroupId: dto.stageGroupId ? Number(dto.stageGroupId) : null,
        isActive: true,
      } as any);
    }

    return { success: true, message: 'Enrolled as served member' };
  }

  /* ==================== ACTIVATE / DEACTIVATE ==================== */

  async setMemberStatus(memberId: string, churchId: number, isActive: boolean) {
    const member = await this.memberModel.findOne({ where: { id: Number(memberId), churchId } });
    if (!member) throw new NotFoundException('User not found');

    await member.update({ isActive } as any);
    return { success: true, isActive };
  }

  /* ==================== HELPERS ==================== */

  private async getDefaultServiceYearId(churchId: number): Promise<number> {
    const currentYear = await this.serviceYearModel.findOne({
      where: { churchId },
      order: [['id', 'DESC']],
    });
    if (currentYear) return Number(currentYear.id);

    const newYear = await this.serviceYearModel.create({
      churchId,
      label: '2026-2027',
      startDate: '2026-09-15',
      endDate: '2027-09-14',
      isCurrent: true,
    } as any);
    return Number(newYear.id);
  }
}
