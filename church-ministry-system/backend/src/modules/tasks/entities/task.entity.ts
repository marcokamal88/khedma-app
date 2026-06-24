import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { Service } from '../../church/entities/service.entity';
import { Class } from '../../church/entities/class.entity';
import { ServiceYear } from '../../service-year/entities/service-year.entity';
import { TaskAssignment } from './task-assignment.entity';

@Table({ tableName: 'tasks', timestamps: true })
export class Task extends Model {
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

  @ForeignKey(() => Class)
  @Column({ field: 'class_id', type: DataType.INTEGER, allowNull: true })
  classId: number;

  @Column({ field: 'assigned_by', type: DataType.INTEGER, allowNull: false })
  assignedBy: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  title: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Column({
    field: 'task_type',
    type: DataType.ENUM('memorization','reading','hymn','assignment','other'),
    allowNull: false,
  })
  taskType: string;

  @Column({ field: 'due_date', type: DataType.DATEONLY, allowNull: true })
  dueDate: string;

  @Column({ field: 'taio_points', type: DataType.INTEGER, defaultValue: 0 })
  taioPoints: number;

  @BelongsTo(() => Service)
  service: Service;

  @HasMany(() => TaskAssignment)
  assignments: TaskAssignment[];
}
