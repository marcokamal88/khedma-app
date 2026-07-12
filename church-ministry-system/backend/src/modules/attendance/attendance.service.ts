import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { AttendanceSession } from './entities/attendance-session.entity';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { Class } from '../church/entities/class.entity';
import { Enrollment } from '../users/entities/enrollment.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { RecordAttendanceDto } from './dto/record-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(AttendanceSession) private sessionModel: typeof AttendanceSession,
    @InjectModel(AttendanceRecord) private recordModel: typeof AttendanceRecord,
    @InjectModel(Class) private classModel: typeof Class,
    @InjectModel(Enrollment) private enrollmentModel: typeof Enrollment,
  ) {}

  async createSession(churchId: string, dto: CreateSessionDto, recordedBy: string) {
    if (dto.classId) {
      const existing = await this.sessionModel.findOne({
        where: { churchId, classId: dto.classId, sessionDate: dto.sessionDate },
      });
      if (existing) {
        throw new BadRequestException('A session already exists for this class on this date');
      }
    }
    return this.sessionModel.create({
      serviceId: dto.serviceId,
      serviceYearId: dto.serviceYearId,
      sessionDate: dto.sessionDate,
      sessionType: dto.sessionType,
      classId: dto.classId,
      notes: dto.notes,
      churchId,
      recordedBy,
    } as any);
  }

  async getSessions(
    churchId: string,
    filters: { serviceId?: string; from?: string; to?: string; serviceYearId?: string; classId?: string },
  ) {
    const where: any = { churchId };
    if (filters.serviceId) where.serviceId = filters.serviceId;
    if (filters.serviceYearId) where.serviceYearId = filters.serviceYearId;
    if (filters.classId) where.classId = filters.classId;
    if (filters.from || filters.to) {
      where.sessionDate = {};
      if (filters.from) where.sessionDate[Op.gte] = filters.from;
      if (filters.to) where.sessionDate[Op.lte] = filters.to;
    }

    return this.sessionModel.findAll({
      where,
      order: [['sessionDate', 'DESC']],
      include: [
        {
          model: AttendanceRecord,
          attributes: ['id', 'churchMemberId', 'status'],
        },
      ],
    });
  }

  async getSession(churchId: string, id: string) {
    const session = await this.sessionModel.findOne({
      where: { id, churchId },
      include: [
        { model: AttendanceRecord },
        { model: Class, attributes: ['id', 'name'] },
      ],
    });

    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async recordAttendance(
    churchId: string,
    sessionId: string,
    dto: RecordAttendanceDto,
  ) {
    const session = await this.sessionModel.findOne({
      where: { id: sessionId, churchId },
    });
    if (!session) throw new NotFoundException('Session not found');

    if (session.classId) {
      const enrolled = await this.enrollmentModel.findAll({
        where: {
          churchId,
          classId: session.classId,
          serviceYearId: session.serviceYearId,
          isActive: true,
        },
        attributes: ['churchMemberId'],
      });
      const enrolledIds = new Set(enrolled.map((e) => String(e.churchMemberId)));
      for (const record of dto.records) {
        if (!enrolledIds.has(record.churchMemberId)) {
          throw new NotFoundException(
            `Member ${record.churchMemberId} is not enrolled in class ${session.classId}`,
          );
        }
      }
    }

    const records = [];
    for (const record of dto.records) {
      const [created] = await this.recordModel.upsert({
        churchId,
        attendanceSessionId: sessionId,
        churchMemberId: record.churchMemberId,
        status: record.status,
      } as any);
      records.push(created);
    }

    return records;
  }

  async updateRecord(
    churchId: string,
    recordId: string,
    data: { status: string; notes?: string },
  ) {
    const record = await this.recordModel.findOne({
      where: { id: recordId, churchId },
    });
    if (!record) throw new NotFoundException('Record not found');

    await this.recordModel.update(data as any, { where: { id: recordId } });
    return { success: true };
  }

  async getReport(
    churchId: string,
    filters: {
      memberId?: string;
      serviceId?: string;
      from?: string;
      to?: string;
    },
  ) {
    const where: any = { churchId };
    const sessionWhere: any = { churchId };

    if (filters.serviceId) sessionWhere.serviceId = filters.serviceId;
    if (filters.from || filters.to) {
      sessionWhere.sessionDate = {};
      if (filters.from) sessionWhere.sessionDate[Op.gte] = filters.from;
      if (filters.to) sessionWhere.sessionDate[Op.lte] = filters.to;
    }

    if (filters.memberId) where.churchMemberId = filters.memberId;

    const sessions = await this.sessionModel.findAll({
      where: sessionWhere,
      attributes: ['id', 'sessionDate', 'serviceId'],
    });

    where.attendanceSessionId = { [Op.in]: sessions.map((s) => s.id) };

    const records = await this.recordModel.findAll({
      where,
      include: [
        {
          model: AttendanceSession,
          attributes: ['sessionDate', 'serviceId'],
        },
      ],
      order: [[AttendanceSession, 'sessionDate', 'DESC']],
    });

    return records;
  }
}
