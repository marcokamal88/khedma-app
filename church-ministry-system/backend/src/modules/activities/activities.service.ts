import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Activity } from './entities/activity.entity';
import { ActivityMember } from './entities/activity-member.entity';
import { ActivitySession } from './entities/activity-session.entity';
import { ActivityAttendance } from './entities/activity-attendance.entity';
import { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    @InjectModel(Activity) private activityModel: typeof Activity,
    @InjectModel(ActivityMember) private memberModel: typeof ActivityMember,
    @InjectModel(ActivitySession) private sessionModel: typeof ActivitySession,
    @InjectModel(ActivityAttendance) private attendanceModel: typeof ActivityAttendance,
  ) {}

  async create(churchId: string, dto: CreateActivityDto, userId: string) {
    return this.activityModel.create({ ...dto, churchId, ledBy: userId } as any);
  }

  async findAll(churchId: string, type?: string) {
    const where: any = { churchId };
    if (type) where.activityType = type;
    return this.activityModel.findAll({ where, order: [['createdAt', 'DESC']] });
  }

  async findOne(churchId: string, id: string) {
    const activity = await this.activityModel.findOne({
      where: { id, churchId },
      include: [{ association: 'sessions' }],
    });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async enroll(churchId: string, activityId: string, memberId: string) {
    const activity = await this.activityModel.findOne({ where: { id: activityId, churchId } });
    if (!activity) throw new NotFoundException('Activity not found');
    return this.memberModel.findOrCreate({
      where: { activityId, churchMemberId: memberId },
      defaults: { activityId, churchMemberId: memberId, churchId, joinedAt: new Date().toISOString().split('T')[0], isActive: true } as any,
    });
  }

  async unenroll(churchId: string, activityId: string, memberId: string) {
    await this.memberModel.destroy({ where: { activityId, churchMemberId: memberId, churchId } });
    return { success: true };
  }

  async recordAttendance(churchId: string, activityId: string, records: Array<{
    churchMemberId: string; sessionDate: string; status: string;
  }>, userId: string) {
    const activity = await this.activityModel.findOne({ where: { id: activityId, churchId } });
    if (!activity) throw new NotFoundException('Activity not found');

    const results = [];
    for (const r of records) {
      let session = await this.sessionModel.findOne({
        where: { activityId, sessionDate: r.sessionDate },
      });
      if (!session) {
        session = await this.sessionModel.create({
          churchId, activityId, sessionDate: r.sessionDate, notes: null,
        } as any);
      }
      const [record] = await this.attendanceModel.findOrCreate({
        where: { activitySessionId: session.id, churchMemberId: r.churchMemberId },
        defaults: { activitySessionId: session.id, churchMemberId: r.churchMemberId, churchId, status: r.status } as any,
      });
      results.push(record);
    }
    return results;
  }

  async getAttendance(churchId: string, activityId: string, sessionDate?: string) {
    const whereSession: any = { activityId, churchId };
    if (sessionDate) whereSession.sessionDate = sessionDate;
    const sessions = await this.sessionModel.findAll({ where: whereSession });
    if (sessions.length === 0) return [];
    const sessionIds = sessions.map(s => s.id);
    return this.attendanceModel.findAll({
      where: { activitySessionId: sessionIds },
      include: [{ association: 'activitySession' }],
    });
  }
}
