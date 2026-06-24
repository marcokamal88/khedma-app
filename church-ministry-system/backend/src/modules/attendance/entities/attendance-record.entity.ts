import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { AttendanceSession } from './attendance-session.entity';

@Table({ tableName: 'attendance_records', timestamps: false })
export class AttendanceRecord extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => AttendanceSession)
  @Column({ field: 'attendance_session_id', type: DataType.INTEGER, allowNull: false })
  attendanceSessionId: number;

  @Column({ field: 'church_member_id', type: DataType.INTEGER, allowNull: false })
  churchMemberId: number;

  @Column({ type: DataType.ENUM('present','absent','excused','late'), defaultValue: 'present' })
  status: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string;

  @BelongsTo(() => AttendanceSession)
  session: AttendanceSession;
}
