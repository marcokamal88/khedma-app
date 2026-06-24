import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Family } from './entities/family.entity';
import { FamilyMember } from './entities/family-member.entity';
import { SiblingPair } from './entities/sibling-pair.entity';
import { ChurchMember } from '../users/entities/church-member.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FamilyService {
  constructor(
    @InjectModel(Family) private familyModel: typeof Family,
    @InjectModel(FamilyMember) private memberModel: typeof FamilyMember,
    @InjectModel(SiblingPair) private siblingModel: typeof SiblingPair,
    @InjectModel(ChurchMember) private churchMemberModel: typeof ChurchMember,
  ) {}

  async getMyFamily(churchId: string, memberId: string) {
    const member = await this.memberModel.findOne({
      where: { churchId, churchMemberId: memberId },
    });

    if (!member) throw new NotFoundException('Not part of any family');

    const family = await this.familyModel.findOne({
      where: { id: member.familyId, churchId },
      include: [{ model: FamilyMember }],
    });

    return family;
  }

  async createFamily(churchId: string, name: string) {
    return this.familyModel.create({ churchId, name } as any);
  }

  async addMember(churchId: string, familyId: string, data: {
    churchMemberId: string;
    relation: string;
  }) {
    const family = await this.familyModel.findOne({ where: { id: familyId, churchId } });
    if (!family) throw new NotFoundException('Family not found');

    return this.memberModel.create({
      churchId,
      familyId,
      churchMemberId: data.churchMemberId,
      relation: data.relation,
    } as any);
  }

  async getFamilyMembers(churchId: string, familyId: string) {
    const family = await this.familyModel.findOne({ where: { id: familyId, churchId } });
    if (!family) throw new NotFoundException('Family not found');

    return this.memberModel.findAll({
      where: { familyId, churchId },
    });
  }

  async getChildren(churchId: string, parentId: string) {
    const parentMember = await this.memberModel.findOne({
      where: { churchId, churchMemberId: parentId, relation: 'parent' },
    });

    if (!parentMember) throw new NotFoundException('Not a parent');

    const children = await this.memberModel.findAll({
      where: { familyId: parentMember.familyId, churchId, relation: 'child' },
    });

    const enriched = await Promise.all(
      children.map(async (child) => {
        const cm = await this.churchMemberModel.findByPk(child.churchMemberId, {
          include: [{ model: User, attributes: ['fullName', 'avatarUrl'] }],
        });
        return {
          ...child.toJSON(),
          child: cm?.user || null,
        };
      }),
    );

    return enriched;
  }
}
