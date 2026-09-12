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
import { Service } from '../church/entities/service.entity';
import { Sector } from '../church/entities/sector.entity';
import { ServiceYear } from '../service-year/entities/service-year.entity';
import { Enrollment } from '../users/entities/enrollment.entity';
import { ChurchMember } from '../users/entities/church-member.entity';
import { User } from '../users/entities/user.entity';
import { MemberProfile } from '../users/entities/member-profile.entity';
import { FollowupFamily } from '../follow-ups/entities/followup-family.entity';
import { FollowupAssignment } from '../follow-ups/entities/followup-assignment.entity';
import { FollowupLog } from '../follow-ups/entities/followup-log.entity';

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
    @InjectModel(FollowupFamily) private followupFamilyModel: typeof FollowupFamily,
    @InjectModel(FollowupAssignment) private followupAssignmentModel: typeof FollowupAssignment,
    @InjectModel(FollowupLog) private followupLogModel: typeof FollowupLog,
    @InjectModel(Service) private serviceModel: typeof Service,
    @InjectModel(Sector) private sectorModel: typeof Sector,
    @InjectModel(ServiceYear) private serviceYearModel: typeof ServiceYear,
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

  async taioExcel(
    churchId: string,
    filters: { serviceId?: string; serviceYearId?: string },
  ): Promise<Buffer> {
    let serviceYearId = filters.serviceYearId;
    if (!serviceYearId) {
      const sy: any = await this.sequelize.query('SELECT id FROM service_years WHERE church_id = :churchId AND is_current = 1 LIMIT 1', {
        replacements: { churchId },
        type: 'SELECT',
      });
      const row: any = Array.isArray(sy) ? sy[0] : null;
      if (row?.id) serviceYearId = String(row.id);
    }
    const classWhere: any = { churchId, isActive: true };
    if (filters.serviceId) classWhere.serviceId = filters.serviceId;
    const classes = await this.classModel.findAll({
      where: classWhere,
      attributes: ['id', 'name', 'serviceId'],
      order: [['name', 'ASC']],
    });

    const headers = ['الفصل', 'الاسم', 'النوع', 'إجمالي طايو'];
    const headerFill: any = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF192F5F' } };
    const headerFont: any = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    const sanitize = (n: string) => n.replace(/[:\\/?*\[\]]/g, ' ').slice(0, 31) || 'فصل';

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Khedma';
    workbook.created = new Date();

    if (classes.length === 0) {
      const ws = workbook.addWorksheet('ملخص', { views: [{ rightToLeft: true }] as any });
      ws.columns = headers.map((h) => ({ header: h, key: h, width: 16 }));
      ws.getRow(1).eachCell((c) => { c.fill = headerFill; c.font = headerFont; c.alignment = { vertical: 'middle', horizontal: 'center' } as any; });
      ws.addRow(['لا توجد فصول في هذه الخدمة']);
    } else {
      // bulk enrollments and taio per class
      for (const cls of classes as any[]) {
        const ws = workbook.addWorksheet(sanitize(cls.name), { views: [{ rightToLeft: true }] as any });
        ws.columns = [
          { header: headers[0], key: 'cls', width: 18 },
          { header: headers[1], key: 'name', width: 28 },
          { header: headers[2], key: 'gender', width: 12 },
          { header: headers[3], key: 'points', width: 16 },
        ];
        ws.getRow(1).eachCell((c) => { c.fill = headerFill; c.font = headerFont; c.alignment = { vertical: 'middle', horizontal: 'center', readingOrder: 2 } as any; });

        const enrollments: any[] = await this.enrollmentModel.findAll({
          where: { churchId, classId: cls.id, serviceId: cls.serviceId, serviceYearId, isActive: true } as any,
          include: [{ model: ChurchMember, include: [{ model: User, attributes: ['fullName'] }] }],
          attributes: ['churchMemberId'],
        });
        if (enrollments.length === 0) {
          ws.addRow([cls.name, 'لا يوجد مخدومين', '', '']);
          continue;
        }
        const memberIds = enrollments.map((e: any) => e.churchMemberId);
        const [profiles, balances] = await Promise.all([
          this.profileModel.findAll({ where: { churchId, churchMemberId: memberIds } as any, attributes: ['churchMemberId', 'gender'], raw: true }) as any,
          this.txModel.findAll({
            where: { churchId, serviceYearId, churchMemberId: memberIds } as any,
            attributes: ['churchMemberId', [this.sequelize.fn('COALESCE', this.sequelize.fn('SUM', this.sequelize.col('points')), 0), 'total']],
            group: ['churchMemberId'],
            raw: true,
          }) as any,
        ]);
        const profMap = new Map<number, any>(profiles.map((p: any) => [Number(p.churchMemberId), p]));
        const balMap = new Map<number, number>(balances.map((b: any) => [Number(b.churchMemberId), Number(b.total) || 0]));

        for (const e of enrollments as any[]) {
          const mid = Number(e.churchMemberId);
          const fullName = e.churchMember?.user?.fullName || `عضو ${mid}`;
          const prof = profMap.get(mid);
          const genderLabel = prof?.gender === 'male' ? 'ذكر' : prof?.gender === 'female' ? 'أنثى' : 'غير محدد';
          const total = balMap.get(mid) ?? 0;
          const row = ws.addRow([cls.name, fullName, genderLabel, total]);
          row.eachCell((c) => { c.alignment = { vertical: 'middle', horizontal: 'center' } as any; });
          // highlight high balances
          if (total > 100) row.getCell(4).font = { bold: true, color: { argb: 'FF2E7D32' } } as any;
        }
        ws.autoFilter = { from: 'A1', to: 'D1' } as any;
        ws.views = [{ rightToLeft: true } as any];
      }
      const sum = workbook.addWorksheet('ملخص', { views: [{ rightToLeft: true }] as any });
      sum.columns = headers.map((h) => ({ header: h, key: h, width: 16 }));
      sum.getRow(1).eachCell((c) => { c.fill = headerFill; c.font = headerFont; c.alignment = { vertical: 'middle', horizontal: 'center' } as any; });
      const totalStudents = await this.enrollmentModel.count({ where: { churchId, serviceId: filters.serviceId, serviceYearId, isActive: true } as any });
      sum.addRow(['الإجمالي', `${totalStudents} مخدوم`, '', '']);
    }

    const buf: any = await workbook.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  private getWeekBounds(week?: string) {
    const base = week ? new Date(week + 'T12:00:00') : new Date();
    const day = base.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const mon = new Date(base); mon.setDate(base.getDate() + diffToMon); mon.setHours(0, 0, 0, 0);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59, 999);
    return { start: mon, end: sun };
  }

  async followUpServantReport(churchId: string, responsibleId: string, week?: string, serviceYearId?: string) {
    let syId = serviceYearId;
    if (!syId) {
      const sy: any = await this.sequelize.query('SELECT id FROM service_years WHERE church_id = :churchId AND is_current = 1 LIMIT 1', { replacements: { churchId }, type: 'SELECT' });
      const row: any = Array.isArray(sy) ? sy[0] : null;
      if (row?.id) syId = String(row.id);
    }
    const { start, end } = this.getWeekBounds(week);
    const families: any[] = await this.followupFamilyModel.findAll({ where: { churchId: Number(churchId), responsibleMemberId: Number(responsibleId), ...(syId ? { serviceYearId: Number(syId) } : {}) } as any, attributes: ['id'] });
    const familyIds = families.map((f: any) => f.id);
    if (familyIds.length === 0) return { assigned: 0, completed: 0, missing: 0, rate: 0, lastLog: null, assignedIds: [], completedIds: [], missingIds: [] };
    const assignments: any[] = await this.followupAssignmentModel.findAll({
      where: { followupFamilyId: { [Op.in]: familyIds }, assignedAt: { [Op.lte]: end }, [Op.or]: [{ unassignedAt: { [Op.is]: null } as any }, { unassignedAt: { [Op.gt]: start } }] } as any,
      attributes: ['targetMemberId'], paranoid: false,
    });
    const assignedIds = [...new Set(assignments.map((a: any) => Number(a.targetMemberId)))];
    const logs: any[] = await this.followupLogModel.findAll({
      where: { followupFamilyId: { [Op.in]: familyIds }, loggedAt: { [Op.between]: [start, end] } } as any,
      attributes: ['targetMemberId', 'loggedAt'],
    });
    const completedIds = [...new Set(logs.map((l: any) => Number(l.targetMemberId)))].filter((id) => assignedIds.includes(id));
    const missingIds = assignedIds.filter((id) => !completedIds.includes(id));
    const lastLog: any = await this.followupLogModel.findOne({ where: { followupFamilyId: { [Op.in]: familyIds } } as any, order: [['loggedAt', 'DESC']], attributes: ['loggedAt'] });
    return { assigned: assignedIds.length, completed: completedIds.length, missing: missingIds.length, rate: assignedIds.length ? Math.round((completedIds.length / assignedIds.length) * 100) : 0, lastLog: lastLog ? (lastLog as any).loggedAt : null, assignedIds, completedIds, missingIds };
  }

  async followUpClassReport(churchId: string, classId: string, week?: string, serviceYearId?: string) {
    const cls: any = await this.classModel.findOne({ where: { id: Number(classId), churchId: Number(churchId) } as any, attributes: ['id', 'serviceId'] });
    if (!cls) throw new Error('Class not found');
    const families: any[] = await this.followupFamilyModel.findAll({ where: { churchId: Number(churchId), classId: Number(classId), ...(serviceYearId ? { serviceYearId: Number(serviceYearId) } : {}) } as any, attributes: ['id', 'responsibleMemberId'] });
    const familyIds = families.map((f: any) => f.id);
    const servantIds = [...new Set(families.map((f: any) => Number(f.responsibleMemberId)))];
    const servedWhere: any = { churchId: Number(churchId), classId: Number(classId), isActive: true };
    if (serviceYearId) servedWhere.serviceYearId = Number(serviceYearId);
    const servedCount = await this.enrollmentModel.count({ where: servedWhere });
    const { start, end } = this.getWeekBounds(week);
    let coverage = 0; let notFollowed = servedCount;
    let missingIds: number[] = [];
    if (familyIds.length) {
      const assignments: any[] = await this.followupAssignmentModel.findAll({ where: { followupFamilyId: { [Op.in]: familyIds }, assignedAt: { [Op.lte]: end }, [Op.or]: [{ unassignedAt: { [Op.is]: null } as any }, { unassignedAt: { [Op.gt]: start } }] } as any, attributes: ['targetMemberId'], paranoid: false });
      const assignedIds = [...new Set(assignments.map((a: any) => Number(a.targetMemberId)))];
      const logs: any[] = await this.followupLogModel.findAll({ where: { followupFamilyId: { [Op.in]: familyIds }, loggedAt: { [Op.between]: [start, end] } } as any, attributes: ['targetMemberId'] });
      const loggedIds = [...new Set(logs.map((l: any) => Number(l.targetMemberId)))];
      const completed = assignedIds.filter((id) => loggedIds.includes(id));
      coverage = assignedIds.length ? Math.round((completed.length / assignedIds.length) * 100) : 0;
      // members not followed = assigned but no log
      missingIds = assignedIds.filter((id) => !loggedIds.includes(id));
      notFollowed = missingIds.length;
      // also include enrolled but never assigned
      const allEnrolled: any[] = await this.enrollmentModel.findAll({ where: servedWhere, attributes: ['churchMemberId'] });
      const enrolledIds = allEnrolled.map((e: any) => Number(e.churchMemberId));
      const neverAssigned = enrolledIds.filter((id) => !assignedIds.includes(id));
      notFollowed += neverAssigned.length;
    }
    return { servedCount, servantCount: servantIds.length, coverage, notFollowed, missingIds };
  }

  async followUpServiceReport(churchId: string, serviceId: string, week?: string, serviceYearId?: string) {
    const classes: any[] = await this.classModel.findAll({ where: { churchId: Number(churchId), serviceId: Number(serviceId), isActive: true } as any, attributes: ['id'] });
    const classIds = classes.map((c: any) => c.id);
    const families: any[] = await this.followupFamilyModel.findAll({ where: { churchId: Number(churchId), serviceId: Number(serviceId), ...(serviceYearId ? { serviceYearId: Number(serviceYearId) } : {}) } as any, attributes: ['id', 'responsibleMemberId', 'classId'] });
    const perServant: any[] = [];
    const uniqueServants = [...new Set(families.map((f: any) => Number(f.responsibleMemberId)))];
    for (const sid of uniqueServants) {
      const rep: any = await this.followUpServantReport(churchId, String(sid), week, serviceYearId);
      perServant.push({ servantId: sid, ...rep });
    }
    // members requiring attention: nextActionDate overdue or never followed
    const overdueLogs: any[] = await this.followupLogModel.findAll({
      where: { followupFamilyId: { [Op.in]: families.map((f: any) => f.id) }, nextActionDate: { [Op.lt]: new Date().toISOString().split('T')[0] }, nextAction: { [Op.ne]: null } } as any,
      attributes: ['targetMemberId', 'nextActionDate'],
    });
    return { classCount: classIds.length, servantCount: uniqueServants.length, perServant, overdue: overdueLogs, totalFamilies: families.length };
  }

  async followUpIndividualServedReport(churchId: string, memberId: string, serviceYearId?: string) {
    const where: any = { targetMemberId: Number(memberId), churchId: Number(churchId) };
    if (serviceYearId) where.serviceYearId = Number(serviceYearId);
    const assignments: any[] = await this.followupAssignmentModel.findAll({ where, order: [['assignedAt', 'ASC']], paranoid: false, include: [{ association: 'followupFamily', attributes: ['responsibleMemberId', 'serviceYearId'] }] } as any);
    const logs: any[] = await this.followupLogModel.findAll({ where: { targetMemberId: Number(memberId), churchId: Number(churchId) } as any, order: [['loggedAt', 'DESC']], include: [{ association: 'followupFamily', attributes: ['responsibleMemberId'] }] });
    const current = assignments.find((a: any) => a.isActive);
    const previous = assignments.filter((a: any) => !a.isActive).map((a: any) => a.followupFamily?.responsibleMemberId).filter(Boolean);
    const last = logs[0] || null;
    const next = logs.find((l: any) => l.nextActionDate) || null;
    return { assignments, logs, currentResponsible: current ? (current as any).followupFamily?.responsibleMemberId : null, previousResponsibles: [...new Set(previous)], lastContact: last?.loggedAt || null, nextPlanned: next?.nextActionDate || null };
  }

  async followUpIndividualServantReport(churchId: string, servantId: string, serviceYearId?: string) {
    const where: any = { responsibleMemberId: Number(servantId), churchId: Number(churchId) };
    if (serviceYearId) where.serviceYearId = Number(serviceYearId);
    const families: any[] = await this.followupFamilyModel.findAll({ where, include: [{ association: 'assignments' }] });
    const familyIds = families.map((f: any) => f.id);
    const logsCreated: any[] = await this.followupLogModel.findAll({ where: { createdBy: Number(servantId), churchId: Number(churchId) } as any, order: [['loggedAt', 'DESC']], limit: 50 });
    const logsReceived: any[] = await this.followupLogModel.findAll({ where: { targetMemberId: Number(servantId), churchId: Number(churchId) } as any, order: [['loggedAt', 'DESC']], limit: 50 });
    return { families, logsCreated, logsReceived, familyCount: families.length };
  }

  async followUpExcel(churchId: string, filters: { serviceId?: string; week?: string; serviceYearId?: string }): Promise<Buffer> {
    const serviceId = filters.serviceId;
    const { start, end } = this.getWeekBounds(filters.week);
    const syId = filters.serviceYearId;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Khedma';
    workbook.created = new Date();
    const headers = ['الفصل', 'الخادم المسؤول', 'المخدوم', 'النوع', 'الحالة', 'آخر تواصل', 'التواصل القادم'];
    const headerFill: any = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF192F5F' } };
    const headerFont: any = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    const families: any[] = await this.followupFamilyModel.findAll({
      where: { churchId: Number(churchId), ...(serviceId ? { serviceId: Number(serviceId) } : {}), ...(syId ? { serviceYearId: Number(syId) } : {}) } as any,
      include: [{ association: 'servant', attributes: ['id'] }, { association: 'class', attributes: ['name'] }],
    });
    const ws = workbook.addWorksheet('افتقاد', { views: [{ rightToLeft: true }] as any });
    ws.columns = headers.map((h) => ({ header: h, key: h, width: 16 }));
    ws.getRow(1).eachCell((c) => { c.fill = headerFill; c.font = headerFont; c.alignment = { vertical: 'middle', horizontal: 'center' } as any; });
    for (const fam of families as any[]) {
      const assigns: any[] = await this.followupAssignmentModel.findAll({ where: { followupFamilyId: fam.id, assignedAt: { [Op.lte]: end }, [Op.or]: [{ unassignedAt: { [Op.is]: null } as any }, { unassignedAt: { [Op.gt]: start } }] } as any, paranoid: false });
      for (const a of assigns as any[]) {
        const logs: any[] = await this.followupLogModel.findAll({ where: { followupFamilyId: fam.id, targetMemberId: a.targetMemberId } as any, order: [['loggedAt', 'DESC']], limit: 1 });
        const last = logs[0];
        const row = ws.addRow([fam.class?.name || fam.serviceId || '', `مسؤول ${fam.responsibleMemberId}`, `مخدوم ${a.targetMemberId}`, a.isActive ? 'نشط' : 'غير نشط', last ? last.logType : '—', last ? new Date(last.loggedAt).toISOString().split('T')[0] : '—', last?.nextActionDate || '—']);
        row.eachCell((c) => { c.alignment = { vertical: 'middle', horizontal: 'center' } as any; });
      }
    }
    if (families.length === 0) ws.addRow(['لا توجد مجموعات افتقاد']);
    const buf: any = await workbook.xlsx.writeBuffer();
    return Buffer.from(buf);
  }
}
