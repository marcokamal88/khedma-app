import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { Service } from '../../church/entities/service.entity';
import { ServiceYear } from '../../service-year/entities/service-year.entity';
import { AttendanceRecord } from './attendance-record.entity';

@Table({ tableName: 'attendance_sessions', timestamps: false })
export class AttendanceSession extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => ServiceYear)
  @Column({ field: 'service_year_id', type: DataType.INTEGER, allowNull: false })
  serviceYearId: number;

  @ForeignKey(() => Service)
  @Column({ field: 'service_id', type: DataType.INTEGER, allowNull: false })
  serviceId: number;

  @Column({ field: 'session_type', type: DataType.ENUM('service','event','meeting','activity'), allowNull: false })
  sessionType: string;

  @Column({ field: 'session_date', type: DataType.DATEONLY, allowNull: false })
  sessionDate: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string;

  @Column({ field: 'recorded_by', type: DataType.INTEGER, allowNull: false })
  recordedBy: string;

  @BelongsTo(() => Service)
  service: Service;

  @BelongsTo(() => ServiceYear)
  serviceYear: ServiceYear;

  @HasMany(() => AttendanceRecord)
  records: AttendanceRecord[];
}
