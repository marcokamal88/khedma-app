import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/sequelize';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../modules/users/entities/user.entity';
import { ChurchMember } from '../../modules/users/entities/church-member.entity';
import { MemberRole } from '../../modules/users/entities/member-role.entity';
import { Role } from '../../modules/users/entities/role.entity';
import { ServantAssignment } from '../../modules/users/entities/servant-assignment.entity';
import { Enrollment } from '../../modules/users/entities/enrollment.entity';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { SwitchContextDto } from './dto/switch-context.dto';
import { MemberProfile } from '../../modules/users/entities/member-profile.entity';
import { JwtPayload } from './jwt.strategy';
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
    private sequelize: Sequelize,
  ) {}

  async login(dto: LoginDto, churchId: number) {
    const identifier = dto.email || dto.phone;
    this.logger.log(`🔍 Step 1: Looking up user by ${dto.email ? 'email' : 'phone'}: ${identifier}`);

    const user = await this.userModel.findOne({
      where: {
        ...(dto.email ? { email: dto.email } : { phone: dto.phone }),
      },
    });

    if (!user) {
      this.logger.warn(`❌ Step 1 FAILED: User not found for ${identifier}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    this.logger.log(`✅ Step 1: User found | id: ${user.id} | fullName: ${user.fullName}`);

    this.logger.log(`🔍 Step 2: Verifying password`);
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn(`❌ Step 2 FAILED: Invalid password for user ${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    this.logger.log(`✅ Step 2: Password valid`);

    this.logger.log(`🔍 Step 3: Looking up church member | churchId: ${churchId} | userId: ${user.id}`);
    const member = await this.memberModel.findOne({
      where: { churchId, userId: user.id, isActive: true },
    });

    if (!member) {
      this.logger.warn(`❌ Step 3 FAILED: User ${user.id} is not an active member of church ${churchId}`);
      throw new UnauthorizedException('Not a member of this church');
    }
    this.logger.log(`✅ Step 3: Church member found | memberId: ${member.id}`);

    this.logger.log(`🔍 Step 4: Fetching member roles`);
    const roles = await this.getMemberRoles(member.id);
    this.logger.log(`✅ Step 4: Roles: ${JSON.stringify(roles)}`);

    this.logger.log(`🔍 Step 5: Building available contexts`);
    const contexts = await this.getAvailableContexts(member.id, churchId);
    this.logger.log(`✅ Step 5: Contexts: ${JSON.stringify(contexts)}`);

    const defaultContext = this.resolveDefaultContext(contexts, roles);
    this.logger.log(`🔍 Step 6: Resolved default context: ${JSON.stringify(defaultContext)}`);

    this.logger.log(`🔍 Step 7: Signing JWT payload`);
    const payload: JwtPayload = {
      sub: user.id,
      churchId,
      memberId: member.id,
      roles,
      activeContext: defaultContext,
    };
    this.logger.log(`🔍 JWT payload: ${JSON.stringify(payload)}`);

    const accessToken = this.jwtService.sign({ ...payload });
    this.logger.log(`✅ Step 7: JWT signed | token length: ${accessToken.length} | expiresIn configured globally`);

    this.logger.log(`🎉 LOGIN COMPLETE | user: ${user.fullName} | memberId: ${member.id}`);
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

    const isValid = contexts.some(
      (c) => c.role === dto.role && (!dto.serviceId || c.serviceId === dto.serviceId),
    );

    if (!isValid) {
      throw new BadRequestException('Invalid context switch request');
    }

    const roles = await this.getMemberRoles(memberId);

    const payload: JwtPayload = {
      sub: userId,
      churchId,
      memberId,
      roles,
      activeContext: {
        role: dto.role,
        serviceId: dto.serviceId,
        classId: dto.classId,
      },
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
    const contexts = [{ role: 'served_member' }];
    const defaultContext = { role: 'served_member' };

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

  private async getAvailableContexts(memberId: number, churchId: number) {
    const contexts: Array<{
      role: string;
      serviceId?: number;
      serviceName?: string;
      className?: string;
    }> = [];

    const roles = await this.getMemberRoles(memberId);

    if (roles.includes('priest')) {
      contexts.push({ role: 'priest' });
    }

    if (roles.includes('sector_leader')) {
      contexts.push({ role: 'sector_leader' });
    }

    if (roles.includes('service_leader')) {
      contexts.push({ role: 'service_leader' });
    }

    if (roles.includes('assistant_service_leader')) {
      contexts.push({ role: 'assistant_service_leader' });
    }

    if (roles.includes('class_leader')) {
      contexts.push({ role: 'class_leader' });
    }

    if (roles.includes('servant')) {
      const assignments = await this.servantAssignmentModel.findAll({
        where: { churchMemberId: memberId, isActive: true },
        include: [
          { association: 'service', attributes: ['name'] },
          { association: 'class', attributes: ['name'] },
        ],
      });

      for (const a of assignments) {
        contexts.push({
          role: 'servant',
          serviceId: a.serviceId,
          serviceName: (a as any).service?.name,
          className: (a as any).class?.name,
        });
      }
    }

    if (roles.includes('served_member')) {
      const enrollments = await this.enrollmentModel.findAll({
        where: { churchMemberId: memberId, isActive: true },
        include: [{ association: 'service', attributes: ['name'] }],
      });

      for (const e of enrollments) {
        contexts.push({
          role: 'served_member',
          serviceId: e.serviceId,
          serviceName: (e as any).service?.name,
        });
      }
    }

    if (roles.includes('parent')) {
      contexts.push({ role: 'parent' });
    }

    if (contexts.length === 0 && roles.length > 0) {
      contexts.push({ role: roles[0] as any });
    }

    return contexts;
  }

  private resolveDefaultContext(
    contexts: Array<{ role: string; serviceId?: number }>,
    roles: string[],
  ) {
    const priority = ['priest', 'sector_leader', 'service_leader', 'assistant_service_leader', 'class_leader', 'servant', 'parent', 'served_member'];
    for (const p of priority) {
      const match = contexts.find((c) => c.role === p);
      if (match) return match;
    }
    return contexts[0] || { role: 'served_member' };
  }
}
