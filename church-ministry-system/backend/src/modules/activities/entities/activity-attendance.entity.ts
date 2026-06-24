import { Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { ActivitySession } from './activity-session.entity';

@Table({ tableName: 'activity_attendance', timestamps: true, paranoid: true })
export class ActivityAttendance extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => ActivitySession)
  @Column({ type: DataType.INTEGER, allowNull: false })
  activitySessionId: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  churchMemberId: number;

  @Column({ type: DataType.ENUM('present','absent','excused'), defaultValue: 'present' })
  status: string;

  @BelongsTo(() => ActivitySession)
  activitySession: ActivitySession;
}
