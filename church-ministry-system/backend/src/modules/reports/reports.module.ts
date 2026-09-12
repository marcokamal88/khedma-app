import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
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
import { MemberProfile } from '../users/entities/member-profile.entity';
import { FollowupFamily } from '../follow-ups/entities/followup-family.entity';
import { FollowupAssignment } from '../follow-ups/entities/followup-assignment.entity';
import { FollowupLog } from '../follow-ups/entities/followup-log.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      AttendanceSession, AttendanceRecord,
      TaioTransaction, EventRegistration,
      PaymentInstallment, TaskAssignment,
      Class, Enrollment, MemberProfile,
      FollowupFamily, FollowupAssignment, FollowupLog,
      Service, Sector, ServiceYear,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
