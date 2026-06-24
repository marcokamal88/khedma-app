import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { EventRegistration } from './event-registration.entity';

@Table({ tableName: 'payment_installments', timestamps: false })
export class PaymentInstallment extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => EventRegistration)
  @Column({ field: 'event_registration_id', type: DataType.INTEGER, allowNull: false })
  eventRegistrationId: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  amount: number;

  @Column({ field: 'due_date', type: DataType.DATEONLY, allowNull: false })
  dueDate: string;

  @Column({ field: 'paid_at', type: DataType.DATE, allowNull: true })
  paidAt: Date;

  @Column({ field: 'payment_method', type: DataType.STRING(100), allowNull: true })
  paymentMethod: string;

  @Column({ field: 'receipt_url', type: DataType.STRING(500), allowNull: true })
  receiptUrl: string;

  @Column({ field: 'recorded_by', type: DataType.INTEGER, allowNull: false })
  recordedBy: number;

  @BelongsTo(() => EventRegistration)
  eventRegistration: EventRegistration;
}
