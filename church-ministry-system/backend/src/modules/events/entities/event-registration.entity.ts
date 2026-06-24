import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { Event } from './event.entity';
import { PaymentInstallment } from './payment-installment.entity';

@Table({ tableName: 'event_registrations', timestamps: true })
export class EventRegistration extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => Event)
  @Column({ field: 'event_id', type: DataType.INTEGER, allowNull: false })
  eventId: number;

  @Column({ field: 'church_member_id', type: DataType.INTEGER, allowNull: false })
  churchMemberId: number;

  @Column({ field: 'registered_by', type: DataType.INTEGER, allowNull: true })
  registeredBy: number;

  @Column({ type: DataType.ENUM('registered','cancelled','attended'), defaultValue: 'registered' })
  status: string;

  @Column({ field: 'registered_at', type: DataType.DATE, defaultValue: DataType.NOW })
  registeredAt: Date;

  @Column({ field: 'total_amount', type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  totalAmount: number;

  @Column({ field: 'paid_amount', type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  paidAmount: number;

  @BelongsTo(() => Event)
  event: Event;

  @HasMany(() => PaymentInstallment)
  installments: PaymentInstallment[];
}
