import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { AttendanceSession } from '../attendance/entities/attendance-session.entity';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity';
import { TaioTransaction } from '../taio/entities/taio-transaction.entity';
import { EventRegistration } from '../events/entities/event-registration.entity';
import { PaymentInstallment } from '../events/entities/payment-installment.entity';
import { TaskAssignment } from '../tasks/entities/task-assignment.entity';

@Injectable()
export class ReportsService {
  constructor(
    private sequelize: Sequelize,
    @InjectModel(AttendanceSession) private sessionModel: typeof AttendanceSession,
    @InjectModel(AttendanceRecord) private recordModel: typeof AttendanceRecord,
    @InjectModel(TaioTransaction) private txModel: typeof TaioTransaction,
    @InjectModel(EventRegistration) private regModel: typeof EventRegistration,
    @InjectModel(PaymentInstallment) private paymentModel: typeof PaymentInstallment,
    @InjectModel(TaskAssignment) private taskAssignmentModel: typeof TaskAssignment,
  ) {}

  async attendanceReport(
    churchId: string,
    filters: { serviceId?: string; from?: string; to?: string },
  ) {
    const sessionWhere: any = { churchId };
    if (filters.serviceId) sessionWhere.serviceId = filters.serviceId;
    if (filters.from || filters.to) {
      sessionWhere.sessionDate = {};
      if (filters.from) sessionWhere.sessionDate[Op.gte] = filters.from;
      if (filters.to) sessionWhere.sessionDate[Op.lte] = filters.to;
    }

    const sessions = await this.sessionModel.findAll({
      where: sessionWhere,
      attributes: ['id', 'sessionDate', 'serviceId'],
    });

    if (sessions.length === 0) return { sessions: 0, totalRecords: 0, summary: {} };

    const records = await this.recordModel.findAll({
      where: {
        churchId,
        attendanceSessionId: { [Op.in]: sessions.map((s) => s.id) },
      },
      attributes: [
        'status',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    const summary: any = { present: 0, absent: 0, excused: 0, late: 0 };
    for (const r of records as any[]) {
      summary[r.status] = parseInt(r.count) || 0;
    }

    return {
      totalSessions: sessions.length,
      totalRecords: Object.values(summary).reduce((a: number, b: any) => a + (b as number), 0),
      summary,
      sessions,
    };
  }

  async engagementReport(
    churchId: string,
    filters: { serviceId?: string; yearId?: string },
  ) {
    const where: any = { churchId };
    if (filters.yearId) where.serviceYearId = filters.yearId;

    const attendanceStats = await this.recordModel.findAll({
      where: { ...where },
      attributes: [
        'churchMemberId',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'totalSessions'],
        [this.sequelize.fn('SUM', this.sequelize.literal("CASE WHEN status = 'present' THEN 1 ELSE 0 END")), 'presentCount'],
      ],
      group: ['churchMemberId'],
      raw: true,
    });

    const taskStats = await this.taskAssignmentModel.findAll({
      where: { ...where },
      attributes: [
        'churchMemberId',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'totalTasks'],
        [this.sequelize.fn('SUM', this.sequelize.literal("CASE WHEN status = 'completed' THEN 1 ELSE 0 END")), 'completedTasks'],
      ],
      group: ['churchMemberId'],
      raw: true,
    });

    return { attendanceStats, taskStats };
  }

  async financialReport(churchId: string, filters: { eventId?: string }) {
    const where: any = { churchId };
    if (filters.eventId) where.eventId = filters.eventId;

    const registrations = await this.regModel.findAll({
      where,
      attributes: [
        [this.sequelize.fn('SUM', this.sequelize.col('total_amount')), 'totalExpected'],
        [this.sequelize.fn('SUM', this.sequelize.col('paid_amount')), 'totalCollected'],
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'totalRegistrations'],
      ],
      raw: true,
    });

    const payments = await this.paymentModel.findAll({
      where: { churchId },
      attributes: [
        [this.sequelize.fn('SUM', this.sequelize.col('amount')), 'totalPayments'],
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'totalInstallments'],
      ],
      raw: true,
    });

    return {
      summary: registrations[0],
      payments: payments[0],
    };
  }

  async taioReport(churchId: string, filters: { serviceYearId?: string }) {
    const where: any = { churchId };
    if (filters.serviceYearId) where.serviceYearId = filters.serviceYearId;

    const results = await this.txModel.findAll({
      where,
      attributes: [
        'churchMemberId',
        [this.sequelize.fn('SUM', this.sequelize.col('points')), 'totalPoints'],
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'transactionCount'],
      ],
      group: ['churchMemberId'],
      order: [[this.sequelize.literal('totalPoints'), 'DESC']],
      raw: true,
    });

    const totalAwarded = await this.txModel.sum('points', {
      where: { ...where, points: { [Op.gt]: 0 } },
    });
    const totalRedeemed = await this.txModel.sum('points', {
      where: { ...where, points: { [Op.lt]: 0 } },
    });

    return {
      participants: results.length,
      topParticipants: results.slice(0, 10),
      totalAwarded: Math.abs(totalAwarded || 0),
      totalRedeemed: Math.abs(totalRedeemed || 0),
    };
  }

  async servantPerformanceReport(churchId: string, filters: { serviceId?: string; yearId?: string }) {
    const where: any = { churchId };
    if (filters.yearId) where.serviceYearId = filters.yearId;

    const prepStats = await this.sequelize.query(`
      SELECT p.servant_id, COUNT(p.id) as total,
             SUM(CASE WHEN p.status = 'approved' THEN 1 ELSE 0 END) as approved
      FROM preparations p
      WHERE p.church_id = :churchId
        ${filters.yearId ? 'AND p.service_year_id = :yearId' : ''}
        ${filters.serviceId ? 'AND p.service_id = :serviceId' : ''}
      GROUP BY p.servant_id
    `, {
      replacements: { churchId, yearId: filters.yearId, serviceId: filters.serviceId },
      type: 'SELECT',
    });

    return {
      preparationStats: prepStats,
    };
  }
}
