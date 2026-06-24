import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { Task } from './task.entity';

@Table({ tableName: 'task_assignments', timestamps: false })
export class TaskAssignment extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => Task)
  @Column({ field: 'task_id', type: DataType.INTEGER, allowNull: false })
  taskId: number;

  @Column({ field: 'church_member_id', type: DataType.INTEGER, allowNull: false })
  churchMemberId: number;

  @Column({
    type: DataType.ENUM('pending','in_progress','completed','skipped'),
    defaultValue: 'pending',
  })
  status: string;

  @Column({ field: 'completed_at', type: DataType.DATE, allowNull: true })
  completedAt: Date;

  @Column({ field: 'verified_by', type: DataType.INTEGER, allowNull: true })
  verifiedBy: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string;

  @BelongsTo(() => Task)
  task: Task;
}
