import { Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { Activity } from './activity.entity';

@Table({ tableName: 'activity_sessions', timestamps: true })
export class ActivitySession extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => Activity)
  @Column({ type: DataType.INTEGER, allowNull: false })
  activityId: number;

  @Column({ field: 'session_date', type: DataType.DATEONLY, allowNull: false })
  sessionDate: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string;

  @BelongsTo(() => Activity)
  activity: Activity;
}
