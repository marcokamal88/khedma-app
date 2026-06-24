import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { ServiceYear } from '../../service-year/entities/service-year.entity';
import { Service } from '../../church/entities/service.entity';
import { ActivitySession } from './activity-session.entity';

@Table({ tableName: 'activities', timestamps: true, paranoid: true })
export class Activity extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => ServiceYear)
  @Column({ type: DataType.INTEGER, allowNull: false })
  serviceYearId: number;

  @ForeignKey(() => Service)
  @Column({ type: DataType.INTEGER, allowNull: true })
  serviceId: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  @Column({ field: 'activity_type', type: DataType.ENUM('choir','theater','sports','festival','educational','coptic','memorization','other'), allowNull: false })
  activityType: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Column({ type: DataType.JSON, allowNull: true })
  schedule: any;

  @Column({ type: DataType.INTEGER, allowNull: true })
  maxCapacity: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isActive: boolean;

  @Column({ type: DataType.INTEGER, allowNull: true })
  ledBy: number;

  @BelongsTo(() => ServiceYear)
  serviceYear: ServiceYear;

  @BelongsTo(() => Service)
  service: Service;

  @HasMany(() => ActivitySession)
  sessions: ActivitySession[];
}
