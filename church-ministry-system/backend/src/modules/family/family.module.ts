import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FamilyController } from './family.controller';
import { FamilyService } from './family.service';
import { Family } from './entities/family.entity';
import { FamilyMember } from './entities/family-member.entity';
import { SiblingPair } from './entities/sibling-pair.entity';

@Module({
  imports: [SequelizeModule.forFeature([Family, FamilyMember, SiblingPair])],
  controllers: [FamilyController],
  providers: [FamilyService],
  exports: [FamilyService],
})
export class FamilyModule {}
