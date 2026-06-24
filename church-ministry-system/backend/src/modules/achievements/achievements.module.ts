import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { AchievementDefinition } from './entities/achievement-definition.entity';
import { MemberAchievement } from './entities/member-achievement.entity';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity';
import { TaskAssignment } from '../tasks/entities/task-assignment.entity';

@Module({
  imports: [SequelizeModule.forFeature([AchievementDefinition, MemberAchievement, AttendanceRecord, TaskAssignment])],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
