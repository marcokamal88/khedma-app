import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import * as ExcelJS from 'exceljs';
import { AttendanceSession } from '../attendance/entities/attendance-session.entity';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity';
import { TaioTransaction } from '../taio/entities/taio-transaction.entity';
import { EventRegistration } from '../events/entities/event-registration.entity';
import { PaymentInstallment } from '../events/entities/payment-installment.entity';
import { TaskAssignment } from '../tasks/entities/task-assignment.entity';
import { Class } from '../church/entities/class.entity';
import { Enrollment } from '../users/entities/enrollment.entity';
import { ChurchMember } from '../users/entities/church-member.entity';
import { User } from '../users/entities/user.entity';
import { MemberProfile } from '../users/entities/member-profile.entity';

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
    @InjectModel(Class) private classModel: typeof Class,
    @InjectModel(Enrollment) private enrollmentModel: typeof Enrollment,
    @InjectModel(MemberProfile) private profileModel: typeof MemberProfile,
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

  async attendanceExcel(
    churchId: string,
    filters: { serviceId?: string; from?: string; to?: string; includeServants?: boolean },
  ): Promise<Buffer> {
    const serviceId = filters.serviceId;
    const classWhere: any = { churchId, isActive: true };
    if (serviceId) classWhere.serviceId = serviceId;

    const classes = await this.classModel.findAll({
      where: classWhere,
      attributes: ['id', 'name', 'serviceId'],
      order: [['name', 'ASC']],
    });

    const sessionWhere: any = { churchId };
    if (serviceId) sessionWhere.serviceId = serviceId;
    if (filters.from || filters.to) {
      sessionWhere.sessionDate = {};
      if (filters.from) sessionWhere.sessionDate[Op.gte] = filters.from;
      if (filters.to) sessionWhere.sessionDate[Op.lte] = filters.to;
    }
    const allSessions: any[] = await this.sessionModel.findAll({
      where: sessionWhere,
      attributes: ['id', 'classId', 'sessionDate', 'serviceId'],
    });
    const sessionIds = allSessions.map((s) => s.id);
    const records: any[] = sessionIds.length
      ? await this.recordModel.findAll({
          where: { churchId, attendanceSessionId: { [Op.in]: sessionIds } },
          attributes: ['attendanceSessionId', 'churchMemberId', 'status'],
          raw: true,
        })
      : [];
    const sessionMap = new Map<number, any>(allSessions.map((s: any) => [s.id, s]));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Khedma';
    workbook.created = new Date();

    const headers = ['الفصل', 'الاسم', 'النوع', 'الدور', 'عدد مرات الحضور', 'عدد مرات الغياب', 'نسبة الحضور', 'اخر تاريخ حضور'];
    const headerFill: any = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF192F5F' } };
    const headerFont: any = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

    const sanitize = (n: string) => n.replace(/[:\\/?*\[\]]/g, ' ').slice(0, 31) || 'فصل';

    if (classes.length === 0) {
      const ws = workbook.addWorksheet('ملخص', { views: [{ rightToLeft: true }] as any });
      ws.columns = headers.map((h) => ({ header: h, key: h, width: 16 }));
      const hr = ws.getRow(1);
      hr.eachCell((c) => { c.fill = headerFill; c.font = headerFont; c.alignment = { vertical: 'middle', horizontal: 'center' } as any; });
      ws.addRow(['لا توجد فصول في هذه الخدمة']);
    } else {
      for (const cls of classes as any[]) {
        const ws = workbook.addWorksheet(sanitize(cls.name), { views: [{ rightToLeft: true }] as any });
        ws.columns = [
          { header: headers[0], key: 'cls', width: 18 },
          { header: headers[1], key: 'name', width: 28 },
          { header: headers[2], key: 'gender', width: 10 },
          { header: headers[3], key: 'role', width: 12 },
          { header: headers[4], key: 'present', width: 14 },
          { header: headers[5], key: 'absent', width: 14 },
          { header: headers[6], key: 'rate', width: 12 },
          { header: headers[7], key: 'last', width: 14 },
        ];
        const hr = ws.getRow(1);
        hr.eachCell((c) => { c.fill = headerFill; c.font = headerFont; c.alignment = { vertical: 'middle', horizontal: 'center', readingOrder: 2 } as any; });

        const enrollments: any[] = await this.enrollmentModel.findAll({
          where: { churchId, classId: cls.id, serviceId: cls.serviceId, isActive: true } as any,
          include: [{ model: ChurchMember, include: [{ model: User, attributes: ['fullName'] }] }],
          attributes: ['churchMemberId'],
        });

        if (enrollments.length === 0) {
          ws.addRow([cls.name, 'لا يوجد مخدومين', '', '', '', '', '', '']);
          continue;
        }

        const memberIds = enrollments.map((e: any) => e.churchMemberId);
        const profiles: any[] = await this.profileModel.findAll({
          where: { churchId, churchMemberId: memberIds } as any,
          attributes: ['churchMemberId', 'gender'],
          raw: true,
        });
        const profMap = new Map<number, any>(profiles.map((p: any) => [Number(p.churchMemberId), p]));

        const classSessionIds = allSessions.filter((s: any) => s.classId === cls.id).map((s: any) => s.id);
        const recByMember = new Map<number, any[]>();
        for (const r of records) {
          if (!classSessionIds.includes(r.attendanceSessionId)) continue;
          const arr = recByMember.get(r.churchMemberId) || [];
          arr.push(r);
          recByMember.set(r.churchMemberId, arr);
        }

        for (const e of enrollments as any[]) {
          const mid = Number(e.churchMemberId);
          const fullName = e.churchMember?.user?.fullName || `عضو ${mid}`;
          const prof = profMap.get(mid);
          const genderLabel = prof?.gender === 'male' ? 'ذكر' : prof?.gender === 'female' ? 'أنثى' : 'غير محدد';
          const roleLabel = 'مخدوم';
          const recs = recByMember.get(mid) || [];
          const present = recs.filter((r: any) => r.status === 'present').length;
          const absent = recs.filter((r: any) => r.status === 'absent' || r.status === 'excused').length;
          const total = present + absent;
          const rate = total ? `${Math.round((present / total) * 100)}%` : '—';
          let last = '—';
          const presentRecs = recs.filter((r: any) => r.status === 'present');
          if (presentRecs.length) {
            const dates = presentRecs.map((r: any) => sessionMap.get(r.attendanceSessionId)?.sessionDate).filter(Boolean).sort();
            last = dates[dates.length - 1] || '—';
          }
          const row = ws.addRow([cls.name, fullName, genderLabel, roleLabel, present, absent, rate, last]);
          row.eachCell((c) => { c.alignment = { vertical: 'middle', horizontal: 'center' } as any; });
        }
        // Note row for servants extensibility
        if (!filters.includeServants) {
          const note = ws.addRow([]);
          note.getCell(1).value = 'ملاحظة: حضور الخدام غير متتبع حالياً — سيُضاف';
          note.font = { italic: true, color: { argb: 'FF5F5F5D' }, size: 9 } as any;
        }
        ws.autoFilter = { from: 'A1', to: 'H1' } as any;
        ws.views = [{ rightToLeft: true } as any];
      }

      // ملخص sheet
      const sum = workbook.addWorksheet('ملخص', { views: [{ rightToLeft: true }] as any });
      sum.columns = headers.map((h) => ({ header: h, key: h, width: 16 }));
      const hr2 = sum.getRow(1);
      hr2.eachCell((c) => { c.fill = headerFill; c.font = headerFont; c.alignment = { vertical: 'middle', horizontal: 'center' } as any; });
      let grandSessions = allSessions.length;
      sum.addRow(['الإجمالي', `${grandSessions} جلسة`, '', '', '', '', '', '']);
    }

    const buf: any = await workbook.xlsx.writeBuffer();
    return Buffer.from(buf);
  }
}
