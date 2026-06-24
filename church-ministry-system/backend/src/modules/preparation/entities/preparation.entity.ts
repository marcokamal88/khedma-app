import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { ServiceYear } from '../../service-year/entities/service-year.entity';
import { Service } from '../../church/entities/service.entity';
import { Class } from '../../church/entities/class.entity';
import { PreparationFile } from './preparation-file.entity';

@Table({ tableName: 'preparations', timestamps: true, paranoid: true })
export class Preparation extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => ServiceYear)
  @Column({ field: 'service_year_id', type: DataType.INTEGER, allowNull: false })
  serviceYearId: number;

  @Column({ field: 'servant_id', type: DataType.INTEGER, allowNull: false })
  servantId: number;

  @ForeignKey(() => Service)
  @Column({ field: 'service_id', type: DataType.INTEGER, allowNull: false })
  serviceId: number;

  @ForeignKey(() => Class)
  @Column({ field: 'class_id', type: DataType.INTEGER, allowNull: true })
  classId: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  title: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Column({ field: 'lesson_date', type: DataType.DATEONLY, allowNull: false })
  lessonDate: string;

  @Column({
    type: DataType.ENUM('draft','submitted','under_review','approved','rejected'),
    defaultValue: 'draft',
  })
  status: string;

  @Column({ field: 'reviewer_id', type: DataType.INTEGER, allowNull: true })
  reviewerId: number;

  @Column({ field: 'review_notes', type: DataType.TEXT, allowNull: true })
  reviewNotes: string;

  @Column({ field: 'reviewed_at', type: DataType.DATE, allowNull: true })
  reviewedAt: Date;

  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  version: number;

  @BelongsTo(() => Service)
  service: Service;

  @BelongsTo(() => Class)
  class: Class;

  @HasMany(() => PreparationFile)
  files: PreparationFile[];
}
