import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
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
import { UpdateUserDto, UpdateMemberDto } from './dto/update-user.dto';

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
  ) {}

  async create(dto: CreateUserDto, churchId: string) {
    const existing = await this.userModel.findOne({
      where: {
        ...(dto.email ? { email: dto.email } : {}),
        ...(dto.phone ? { phone: dto.phone } : {}),
      },
    });

    if (existing) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      fullName: dto.fullName,
      email: dto.email || null,
      phone: dto.phone || null,
      passwordHash,
    } as any);

    await this.memberModel.create({
      userId: user.id,
      churchId,
      isActive: true,
    } as any);

    return { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone };
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

  async searchMembers(churchId: string, query: string) {
    return this.memberModel.findAll({
      where: { churchId, isActive: true },
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

  async registerMember(dto: CreateUserDto & {
    serviceId?: string;
    classId?: string;
    serviceYearId?: string;
    address?: string;
    birthDate?: string;
    notes?: string;
    gender?: string;
    schoolGrade?: number;
  }, churchId: string) {
    const existing = await this.userModel.findOne({
      where: {
        ...(dto.email ? { email: dto.email } : {}),
        ...(dto.phone ? { phone: dto.phone } : {}),
      },
    });

    if (existing) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      fullName: dto.fullName,
      email: dto.email || null,
      phone: dto.phone || null,
      passwordHash,
    } as any);

    const member = await this.memberModel.create({
      userId: user.id,
      churchId,
      isActive: true,
    } as any);

    if (dto.serviceId && dto.classId && dto.serviceYearId) {
      await this.enrollmentModel.create({
        churchId,
        churchMemberId: member.id,
        serviceId: dto.serviceId,
        classId: dto.classId,
        serviceYearId: dto.serviceYearId,
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

    return { id: user.id, memberId: member.id, fullName: user.fullName, email: user.email, phone: user.phone };
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

    const [assignment] = await this.servantAssignmentModel.upsert({
      churchId,
      churchMemberId: data.churchMemberId,
      serviceId: data.serviceId,
      classId: data.classId,
      serviceYearId: serviceYear.id,
      leaderRole: data.leaderRole || 'servant',
      isActive: true,
    } as any);

    await this.assignRole(data.churchMemberId, 'servant', churchId);

    return assignment;
  }

  async getServantAssignments(churchId: string, serviceId: string) {
    const serviceYear = await this.serviceYearModel.findOne({
      where: { churchId, isCurrent: true },
    });
    if (!serviceYear) throw new NotFoundException('No active service year');

    const assignments = await this.servantAssignmentModel.findAll({
      where: { churchId, serviceId, serviceYearId: serviceYear.id, isActive: true },
      include: [
        { model: ChurchMember, include: [{ model: User, attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl'] }] },
        { model: Class, attributes: ['id', 'name'] },
      ],
    });

    return assignments.map((a) => ({
      id: a.id,
      churchMemberId: a.churchMemberId,
      fullName: (a as any).churchMember?.user?.fullName,
      email: (a as any).churchMember?.user?.email,
      phone: (a as any).churchMember?.user?.phone,
      avatarUrl: (a as any).churchMember?.user?.avatarUrl,
      classId: a.classId,
      className: (a as any).class?.name || '',
      leaderRole: a.leaderRole || 'servant',
    }));
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
