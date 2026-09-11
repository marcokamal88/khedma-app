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
import { Enrollment } from '../users/entities/enrollment.entity';
import { MemberProfile } from '../users/entities/member-profile.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      AttendanceSession, AttendanceRecord,
      TaioTransaction, EventRegistration,
      PaymentInstallment, TaskAssignment,
      Class, Enrollment, MemberProfile,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
