import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { ServiceYear } from '../../service-year/entities/service-year.entity';
import { EventRegistration } from './event-registration.entity';

@Table({ tableName: 'events' })
export class Event extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => ServiceYear)
  @Column({ field: 'service_year_id', type: DataType.INTEGER, allowNull: false })
  serviceYearId: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  @Column({
    field: 'event_type',
    type: DataType.ENUM('trip','conference','choir','theater','festival','other'),
    allowNull: false,
  })
  eventType: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Column({ field: 'start_date', type: DataType.DATEONLY, allowNull: false })
  startDate: string;

  @Column({ field: 'end_date', type: DataType.DATEONLY, allowNull: false })
  endDate: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  location: string;

  @Column({ field: 'registration_fee', type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  registrationFee: number;

  @Column({ field: 'max_capacity', type: DataType.INTEGER, allowNull: true })
  maxCapacity: number;

  @Column({ field: 'registration_deadline', type: DataType.DATEONLY, allowNull: true })
  registrationDeadline: string;

  @Column({ field: 'is_active', type: DataType.BOOLEAN, defaultValue: true })
  isActive: boolean;

  @Column({ field: 'created_by', type: DataType.INTEGER, allowNull: false })
  createdBy: number;

  @BelongsTo(() => ServiceYear)
  serviceYear: ServiceYear;

  @HasMany(() => EventRegistration)
  registrations: EventRegistration[];
}
