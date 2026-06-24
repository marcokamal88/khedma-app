import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { ChurchMember } from './entities/church-member.entity';
import { MemberRole } from './entities/member-role.entity';
import { Role } from './entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(ChurchMember) private memberModel: typeof ChurchMember,
    @InjectModel(MemberRole) private memberRoleModel: typeof MemberRole,
    @InjectModel(Role) private roleModel: typeof Role,
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
}
