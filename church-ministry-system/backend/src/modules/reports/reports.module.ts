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

@Module({
  imports: [
    SequelizeModule.forFeature([
      AttendanceSession, AttendanceRecord,
      TaioTransaction, EventRegistration,
      PaymentInstallment, TaskAssignment,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
