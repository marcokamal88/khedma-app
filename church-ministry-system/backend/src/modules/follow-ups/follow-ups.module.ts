import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FollowUpsController } from './follow-ups.controller';
import { FollowUpsService } from './follow-ups.service';
import { FollowupFamily } from './entities/followup-family.entity';
import { FollowupAssignment } from './entities/followup-assignment.entity';
import { FollowupLog } from './entities/followup-log.entity';
import { ServiceYear } from '../service-year/entities/service-year.entity';

@Module({
  imports: [SequelizeModule.forFeature([FollowupFamily, FollowupAssignment, FollowupLog, ServiceYear])],
  controllers: [FollowUpsController],
  providers: [FollowUpsService],
  exports: [FollowUpsService],
})
export class FollowUpsModule {}
