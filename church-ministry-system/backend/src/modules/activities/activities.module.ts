import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { Activity } from './entities/activity.entity';
import { ActivityMember } from './entities/activity-member.entity';
import { ActivitySession } from './entities/activity-session.entity';
import { ActivityAttendance } from './entities/activity-attendance.entity';

@Module({
  imports: [SequelizeModule.forFeature([Activity, ActivityMember, ActivitySession, ActivityAttendance])],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
