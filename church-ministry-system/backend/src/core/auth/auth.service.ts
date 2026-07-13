import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { User } from '../../modules/users/entities/user.entity';
import { ChurchMember } from '../../modules/users/entities/church-member.entity';
import { MemberRole } from '../../modules/users/entities/member-role.entity';
import { Role } from '../../modules/users/entities/role.entity';
import { ServantAssignment } from '../../modules/users/entities/servant-assignment.entity';
import { Enrollment } from '../../modules/users/entities/enrollment.entity';
import { SectorAssignment } from '../../modules/users/entities/sector-assignment.entity';
import { Sector } from '../../modules/church/entities/sector.entity';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { SwitchContextDto } from './dto/switch-context.dto';
import { MemberProfile } from '../../modules/users/entities/member-profile.entity';
import { JwtPayload, ActiveContext } from './jwt.strategy';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(ChurchMember) private memberModel: typeof ChurchMember,
    @InjectModel(MemberRole) private memberRoleModel: typeof MemberRole,
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(ServantAssignment) private servantAssignmentModel: typeof ServantAssignment,
    @InjectModel(Enrollment) private enrollmentModel: typeof Enrollment,
    @InjectModel(MemberProfile) private profileModel: typeof MemberProfile,
    @InjectModel(SectorAssignment) private sectorAssignmentModel: typeof SectorAssignment,
    private sequelize: Sequelize,
  ) {}

  async login(dto: LoginDto, churchId: number) {
    const identifier = dto.email || dto.phone;

    const user = await this.userModel.findOne({
      where: {
        ...(dto.email ? { email: dto.email } : { phone: dto.phone }),
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const member = await this.memberModel.findOne({
      where: { churchId, userId: user.id, isActive: true },
    });

    if (!member) {
      throw new UnauthorizedException('Not a member of this church');
    }

    const roles = await this.getMemberRoles(member.id);
    const contexts = await this.getAvailableContexts(member.id, churchId);
    const defaultContext = this.resolveDefaultContext(contexts);

    const payload: JwtPayload = {
      sub: user.id,
      churchId,
      memberId: member.id,
      roles,
      activeContext: defaultContext,
    };

    const accessToken = this.jwtService.sign({ ...payload });

    return {
      accessToken,
      refreshToken: uuidv4(),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
      memberId: member.id,
      roles,
      contexts,
      activeContext: defaultContext,
    };
  }

  async getContexts(userId: number, churchId: number) {
    const member = await this.memberModel.findOne({
      where: { churchId, userId, isActive: true },
    });

    if (!member) {
      throw new UnauthorizedException('Not a member of this church');
    }

    const roles = await this.getMemberRoles(member.id);
    const contexts = await this.getAvailableContexts(member.id, churchId);

    return { roles, contexts, currentMemberId: member.id };
  }

  async switchContext(
    userId: number,
    churchId: number,
    memberId: number,
    dto: SwitchContextDto,
  ) {
    const contexts = await this.getAvailableContexts(memberId, churchId);

    const isValid = contexts.some((c) => {
      if (c.role !== dto.role) return false;
      if (!dto.scope) return true;
      return Object.entries(dto.scope).every(
        ([key, val]) => val === undefined || (c.scope as any)[key] === val,
      );
    });

    if (!isValid) {
      throw new BadRequestException('Invalid context switch request');
    }

    const roles = await this.getMemberRoles(memberId);

    const matched = contexts.find((c) => {
      if (c.role !== dto.role) return false;
      if (!dto.scope) return true;
      return Object.entries(dto.scope).every(
        ([key, val]) => val === undefined || (c.scope as any)[key] === val,
      );
    });

    const payload: JwtPayload = {
      sub: userId,
      churchId,
      memberId,
      roles,
      activeContext: matched!,
    };

    return {
      accessToken: this.jwtService.sign({ ...payload }),
      activeContext: payload.activeContext,
    };
  }

  async signup(dto: SignupDto, churchId: number) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email or phone is required');
    }
    const existing = await this.userModel.findOne({
      where: {
        ...(dto.email ? { email: dto.email } : { phone: dto.phone }),
      },
    });
    if (existing) {
      throw new BadRequestException('Account already exists with this email/phone');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      fullName: dto.fullName,
      email: dto.email || null,
      phone: dto.phone || null,
      passwordHash,
    } as any);

    const member = await this.memberModel.create({
      churchId,
      userId: user.id,
      isActive: true,
    } as any);

    await this.profileModel.create({
      churchId,
      churchMemberId: member.id,
    } as any);

    const servedMemberRole = await this.roleModel.findOne({ where: { name: 'served_member' } });
    if (servedMemberRole) {
      await this.memberRoleModel.create({
        churchMemberId: member.id,
        roleId: servedMemberRole.id,
        churchId,
      } as any);
    }

    const roles = ['served_member'];
    const defaultContext: ActiveContext = { role: 'served_member', churchId, scope: {}, displayLabel: 'Served Member' };
    const contexts = [defaultContext];

    const payload: JwtPayload = {
      sub: user.id,
      churchId,
      memberId: member.id,
      roles,
      activeContext: defaultContext,
    };

    return {
      accessToken: this.jwtService.sign({ ...payload }),
      refreshToken: uuidv4(),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
      memberId: member.id,
      roles,
      contexts,
      activeContext: defaultContext,
    };
  }

  private async getMemberRoles(memberId: number): Promise<string[]> {
    const memberRoles = await this.memberRoleModel.findAll({
      where: { churchMemberId: memberId },
      include: [{ model: Role, attributes: ['name'] }],
    });

    return memberRoles.map((mr) => (mr as any).role.name);
  }

  private async getAvailableContexts(memberId: number, churchId: number): Promise<ActiveContext[]> {
    const contexts: ActiveContext[] = [];
    const roles = await this.getMemberRoles(memberId);

    // Priest — from sector_assignments or church-wide
    if (roles.includes('priest')) {
      const sectorAssignments = await this.sectorAssignmentModel.findAll({
        where: { churchMemberId: memberId, isActive: true },
        include: [{ model: Sector, attributes: ['name'] }],
      });
      if (sectorAssignments.length > 0) {
        for (const sa of sectorAssignments) {
          contexts.push({
            role: 'priest',
            churchId,
            scope: { sectorId: sa.sectorId },
            displayLabel: `Priest - ${(sa as any).sector?.name || ''}`,
          });
        }
      } else {
        contexts.push({
          role: 'priest',
          churchId,
          scope: {},
          displayLabel: 'Priest',
        });
      }
    }

    // Sector leader — from sector_assignments
    if (roles.includes('sector_leader')) {
      const sectorAssignments = await this.sectorAssignmentModel.findAll({
        where: { churchMemberId: memberId, isActive: true },
        include: [{ model: Sector, attributes: ['name'] }],
      });
      for (const sa of sectorAssignments) {
        contexts.push({
          role: 'sector_leader',
          churchId,
          scope: { sectorId: sa.sectorId },
          displayLabel: (sa as any).sector?.name || 'Sector Leader',
        });
      }
    }

    // Service-level roles (service_leader / assistant_service_leader) — from servant_assignments with serviceId + no classId
    const leaderRoles: string[] = [];
    if (roles.includes('service_leader')) leaderRoles.push('service_leader');
    if (roles.includes('assistant_service_leader')) leaderRoles.push('assistant_service_leader');

    if (leaderRoles.length > 0) {
      const assignments = await this.servantAssignmentModel.findAll({
        where: {
          churchMemberId: memberId,
          isActive: true,
          classId: null,
          leaderRole: { [Op.in]: leaderRoles },
        },
        include: [{ association: 'service', attributes: ['name'] }],
      });
      for (const a of assignments) {
        contexts.push({
          role: a.leaderRole as string,
          churchId,
          scope: { serviceId: a.serviceId },
          displayLabel: (a as any).service?.name || '',
        });
      }
    }

    // Class-level roles (servant / class_leader) — from servant_assignments with classId
    const classRoles: string[] = [];
    if (roles.includes('servant')) classRoles.push('servant');
    if (roles.includes('class_leader')) classRoles.push('class_leader');

    if (classRoles.length > 0) {
      const whereClause: any = {
        churchMemberId: memberId,
        isActive: true,
        classId: { [Op.ne]: null },
      };

      const assignments = await this.servantAssignmentModel.findAll({
        where: whereClause,
        include: [
          { association: 'service', attributes: ['name'] },
          { association: 'class', attributes: ['name'] },
        ],
      });
      for (const a of assignments) {
        const role = a.leaderRole === 'class_leader' ? 'class_leader' : 'servant';
        contexts.push({
          role,
          churchId,
          scope: { classId: a.classId! },
          displayLabel: `${(a as any).service?.name || ''} - ${(a as any).class?.name || ''}`,
        });
      }
    }

    // Served member — from enrollments
    if (roles.includes('served_member')) {
      const enrollments = await this.enrollmentModel.findAll({
        where: { churchMemberId: memberId, isActive: true },
        include: [{ association: 'service', attributes: ['name'] }],
      });
      for (const e of enrollments) {
        contexts.push({
          role: 'served_member',
          churchId,
          scope: {},
          displayLabel: (e as any).service?.name || 'Served Member',
        });
      }
    }

    // Parent
    if (roles.includes('parent')) {
      contexts.push({
        role: 'parent',
        churchId,
        scope: {},
        displayLabel: 'Parent',
      });
    }

    // Fallback if no contexts resolved
    if (contexts.length === 0 && roles.length > 0) {
      contexts.push({
        role: roles[0],
        churchId,
        scope: {},
        displayLabel: roles[0],
      });
    }

    return contexts;
  }

  private resolveDefaultContext(contexts: ActiveContext[]): ActiveContext {
    const priority = ['priest', 'sector_leader', 'service_leader', 'assistant_service_leader', 'class_leader', 'servant', 'parent', 'served_member'];
    for (const p of priority) {
      const match = contexts.find((c) => c.role === p);
      if (match) return match;
    }
    return contexts[0] || { role: 'served_member', churchId: 0, scope: {}, displayLabel: 'Served Member' };
  }
}
