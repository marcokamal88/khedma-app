import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { Enrollment } from '../users/entities/enrollment.entity';
import { ServantAssignment } from '../users/entities/servant-assignment.entity';
import { AttendanceSession } from '../attendance/entities/attendance-session.entity';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity';
import { Task } from '../tasks/entities/task.entity';
import { TaskAssignment } from '../tasks/entities/task-assignment.entity';
import { TaioTransaction } from '../taio/entities/taio-transaction.entity';
import { ServiceYear } from '../service-year/entities/service-year.entity';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private sequelize: Sequelize,
    @InjectModel(Enrollment) private enrollmentModel: typeof Enrollment,
    @InjectModel(ServantAssignment) private servantAssignmentModel: typeof ServantAssignment,
    @InjectModel(AttendanceSession) private sessionModel: typeof AttendanceSession,
    @InjectModel(AttendanceRecord) private recordModel: typeof AttendanceRecord,
    @InjectModel(Task) private taskModel: typeof Task,
    @InjectModel(TaskAssignment) private taskAssignmentModel: typeof TaskAssignment,
    @InjectModel(TaioTransaction) private txModel: typeof TaioTransaction,
    @InjectModel(ServiceYear) private serviceYearModel: typeof ServiceYear,
  ) {}

  private async getCurrentServiceYear(churchId: number): Promise<ServiceYear | null> {
    return this.serviceYearModel.findOne({ where: { churchId, isCurrent: true } as any });
  }

  async servantStats(churchId: number, memberId: number, serviceId: number, classId?: number) {
    const serviceYear = await this.getCurrentServiceYear(churchId);
    if (!serviceYear) {
      return { classSize: 0, attendanceRate: 0, openTasks: 0, totalPoints: 0 };
    }

    const classWhere: any = { churchId, serviceId, serviceYearId: serviceYear.id, isActive: true };
    if (classId) classWhere.classId = classId;

    const classSize = await this.enrollmentModel.count({ where: classWhere });

    const sessionWhere: any = { churchId, serviceId, serviceYearId: serviceYear.id };
    const sessions = await this.sessionModel.findAll({
      where: sessionWhere,
      attributes: ['id'],
    });

    let attendanceRate = 0;
    if (sessions.length > 0) {
      const sessionIds = sessions.map((s: any) => s.id);
      const records = await this.recordModel.findAll({
        where: {
          churchId,
          attendanceSessionId: { [Op.in]: sessionIds },
        },
        attributes: [
          'status',
          [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count'],
        ],
        group: ['status'],
        raw: true,
      }) as any[];

      const summary: any = { present: 0, absent: 0, excused: 0, late: 0 };
      for (const r of records) {
        summary[r.status] = parseInt(r.count) || 0;
      }
      const values = Object.values(summary) as number[];
      const total = values.reduce((a: number, b: number) => a + b, 0);
      attendanceRate = total > 0 ? Math.round((summary.present / total) * 100) : 0;
    }

    const taskWhere: any = {
      churchId,
      serviceYearId: serviceYear.id,
      serviceId,
    };
    if (classId) taskWhere.classId = classId;

    const tasks = await this.taskModel.findAll({
      where: taskWhere,
      attributes: ['id'],
    });

    let openTasks = 0;
    if (tasks.length > 0) {
      const taskIds = tasks.map((t: any) => t.id);
      openTasks = await this.taskAssignmentModel.count({
        where: {
          taskId: { [Op.in]: taskIds },
          status: { [Op.in]: ['pending', 'in_progress'] },
        },
      });
    }

    const memberIdsWhere: any = { churchId, serviceId, serviceYearId: serviceYear.id, isActive: true };
    if (classId) memberIdsWhere.classId = classId;

    const enrolled = await this.enrollmentModel.findAll({
      where: memberIdsWhere,
      attributes: ['churchMemberId'],
    });
    const memberIds = enrolled.map((e: any) => e.churchMemberId);

    let totalPoints = 0;
    if (memberIds.length > 0) {
      const result = await this.txModel.findOne({
        where: { churchId, churchMemberId: { [Op.in]: memberIds } } as any,
        attributes: [[this.sequelize.fn('COALESCE', this.sequelize.fn('SUM', this.sequelize.col('points')), 0), 'total']],
        raw: true,
      }) as any;
      totalPoints = Math.abs(parseInt(result?.total) || 0);
    }

    return { classSize, attendanceRate, openTasks, totalPoints };
  }

  async servantTodaySessions(churchId: number, serviceId: number) {
    const today = new Date().toISOString().split('T')[0];
    const serviceYear = await this.getCurrentServiceYear(churchId);
    if (!serviceYear) return [];

    const sessions = await this.sessionModel.findAll({
      where: {
        churchId,
        serviceId,
        serviceYearId: serviceYear.id,
        sessionDate: today,
      } as any,
      attributes: ['id', 'sessionDate', 'sessionType', 'notes'],
      order: [['sessionDate', 'ASC']],
    });

    return sessions.map((s: any) => ({
      id: s.id,
      type: s.sessionType,
      date: s.sessionDate,
      time: '9:00 ص',
      location: 'غرفة 3',
      title: s.notes || 'تسجيل حضور',
      status: 'due',
    }));
  }

  async servantTasks(churchId: number, memberId: number, serviceId: number, classId?: number) {
    const serviceYear = await this.getCurrentServiceYear(churchId);
    if (!serviceYear) return [];

    const taskWhere: any = {
      churchId,
      serviceYearId: serviceYear.id,
      serviceId,
    };
    if (classId) taskWhere.classId = classId;

    const tasks = await this.taskModel.findAll({
      where: taskWhere,
      attributes: ['id', 'title', 'dueDate', 'taskType'],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    if (tasks.length === 0) return [];

    const taskIds = tasks.map((t: any) => t.id);
    const assignments = await this.taskAssignmentModel.findAll({
      where: {
        taskId: { [Op.in]: taskIds },
        churchMemberId: memberId,
      },
      attributes: ['taskId', 'status'],
      raw: true,
    }) as any[];

    const assignmentMap = new Map(assignments.map((a: any) => [a.taskId, a.status]));

    const todayStr = new Date().toISOString().split('T')[0];
    return tasks.map((t: any) => {
      const status = assignmentMap.get(t.id);
      return {
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        progress: status === 'completed' ? 100 : status === 'in_progress' ? 60 : 0,
        isOverdue: t.dueDate && t.dueDate < todayStr,
      };
    });
  }

  async memberStats(churchId: number, memberId: number) {
    const serviceYear = await this.getCurrentServiceYear(churchId);
    if (!serviceYear) {
      return { myPoints: 0, openTasks: 0 };
    }

    const balanceResult = await this.txModel.findOne({
      where: { churchId, churchMemberId: memberId } as any,
      attributes: [[this.sequelize.fn('COALESCE', this.sequelize.fn('SUM', this.sequelize.col('points')), 0), 'balance']],
      raw: true,
    }) as any;
    const myPoints = Math.abs(parseInt(balanceResult?.balance) || 0);

    const enrollment = await this.enrollmentModel.findOne({
      where: { churchId, churchMemberId: memberId, serviceYearId: serviceYear.id, isActive: true } as any,
      attributes: ['serviceId', 'classId'],
    });

    let openTasks = 0;
    if (enrollment) {
      const taskWhere: any = { churchId, serviceYearId: serviceYear.id, serviceId: (enrollment as any).serviceId };
      if ((enrollment as any).classId) taskWhere.classId = (enrollment as any).classId;

      const tasks = await this.taskModel.findAll({
        where: taskWhere,
        attributes: ['id'],
      });

      if (tasks.length > 0) {
        const taskIds = tasks.map((t: any) => t.id);
        openTasks = await this.taskAssignmentModel.count({
          where: {
            taskId: { [Op.in]: taskIds },
            churchMemberId: memberId,
            status: { [Op.in]: ['pending', 'in_progress'] },
          },
        });
      }
    }

    return { myPoints, openTasks };
  }

  async memberTasks(churchId: number, memberId: number) {
    const serviceYear = await this.getCurrentServiceYear(churchId);
    if (!serviceYear) return [];

    const enrollment = await this.enrollmentModel.findOne({
      where: { churchId, churchMemberId: memberId, serviceYearId: serviceYear.id, isActive: true } as any,
      attributes: ['serviceId', 'classId'],
    });
    if (!enrollment) return [];

    const taskWhere: any = { churchId, serviceYearId: serviceYear.id, serviceId: (enrollment as any).serviceId };
    if ((enrollment as any).classId) taskWhere.classId = (enrollment as any).classId;

    const tasks = await this.taskModel.findAll({
      where: taskWhere,
      attributes: ['id', 'title', 'dueDate', 'taskType'],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    if (tasks.length === 0) return [];

    const taskIds = tasks.map((t: any) => t.id);
    const assignments = await this.taskAssignmentModel.findAll({
      where: {
        taskId: { [Op.in]: taskIds },
        churchMemberId: memberId,
      },
      attributes: ['taskId', 'status'],
      raw: true,
    }) as any[];

    const assignmentMap = new Map(assignments.map((a: any) => [a.taskId, a.status]));

    return tasks.map((t: any) => {
      const status = assignmentMap.get(t.id);
      return {
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        progress: status === 'completed' ? 100 : status === 'in_progress' ? 60 : 0,
        isOverdue: t.dueDate && t.dueDate < new Date().toISOString().split('T')[0],
      };
    });
  }
}
