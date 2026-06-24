import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { AchievementDefinition } from './entities/achievement-definition.entity';
import { MemberAchievement } from './entities/member-achievement.entity';
import { AttendanceRecord } from '../../modules/attendance/entities/attendance-record.entity';
import { TaskAssignment } from '../../modules/tasks/entities/task-assignment.entity';

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    @InjectModel(AchievementDefinition) private achievementModel: typeof AchievementDefinition,
    @InjectModel(MemberAchievement) private memberAchievementModel: typeof MemberAchievement,
    @InjectModel(AttendanceRecord) private attendanceModel: typeof AttendanceRecord,
    @InjectModel(TaskAssignment) private taskAssignmentModel: typeof TaskAssignment,
  ) {}

  async create(churchId: string, dto: Partial<AchievementDefinition>) {
    return this.achievementModel.create({ ...dto, churchId } as any);
  }

  async findAll(churchId: string) {
    return this.achievementModel.findAll({ where: { churchId, isActive: true } });
  }

  async getMemberAchievements(churchId: string, memberId: string) {
    return this.memberAchievementModel.findAll({
      where: { churchId, churchMemberId: memberId },
      include: [{ association: 'achievement' }],
      order: [['awardedAt', 'DESC']],
    });
  }

  async checkAndAward(churchId: string, memberId: string): Promise<MemberAchievement[]> {
    const achievements = await this.achievementModel.findAll({ where: { churchId, isActive: true } });
    const earned: MemberAchievement[] = [];

    for (const a of achievements) {
      const alreadyEarned = await this.memberAchievementModel.findOne({
        where: { achievementId: a.id, churchMemberId: memberId },
      });
      if (alreadyEarned) continue;

      let qualifies = false;
      const cfg = a.triggerConfig || {};
      const threshold = cfg.value || 1;

      switch (a.triggerType) {
        case 'attendance_streak': {
          const records = await this.attendanceModel.findAll({
            where: { churchMemberId: memberId },
            order: [['recordedAt', 'DESC']],
            limit: threshold,
          });
          qualifies = records.length >= threshold;
          break;
        }
        case 'task_count': {
          const count = await this.taskAssignmentModel.count({
            where: { churchMemberId: memberId, status: 'completed' },
          });
          qualifies = count >= threshold;
          break;
        }
        case 'memorization':
        case 'participation':
        case 'custom':
          qualifies = false;
          break;
      }

      if (qualifies) {
        const record = await this.memberAchievementModel.create({
          churchId, achievementId: a.id, churchMemberId: memberId,
        } as any);
        earned.push(record);
        this.logger.log(`Achievement earned: ${a.name} for member ${memberId}`);
      }
    }

    return earned;
  }

  async remove(churchId: string, id: string) {
    await this.achievementModel.destroy({ where: { id, churchId } });
    return { success: true };
  }
}
