import { Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { FollowupFamily } from './followup-family.entity';
import { ChurchMember } from '../../users/entities/church-member.entity';

@Table({ tableName: 'followup_logs', timestamps: true, paranoid: true })
export class FollowupLog extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => FollowupFamily)
  @Column({ type: DataType.INTEGER, allowNull: false })
  followupFamilyId: number;

  @ForeignKey(() => ChurchMember)
  @Column({ field: 'target_member_id', type: DataType.INTEGER, allowNull: false })
  targetMemberId: number;

  // Backward compat alias
  get churchMemberId(): number { return (this as any).targetMemberId; }
  set churchMemberId(v: number) { (this as any).targetMemberId = v; }

  @ForeignKey(() => ChurchMember)
  @Column({ field: 'created_by', type: DataType.INTEGER, allowNull: true })
  createdBy: number;

  @Column({ field: 'status_at_log', type: DataType.ENUM('active','paused','completed'), allowNull: true })
  statusAtLog: string;

  @Column({ field: 'log_type', type: DataType.ENUM('call','visit','meeting','message','other'), allowNull: false })
  logType: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  notes: string;

  @Column({ field: 'next_action', type: DataType.TEXT, allowNull: true })
  nextAction: string;

  @Column({ field: 'next_action_date', type: DataType.DATEONLY, allowNull: true })
  nextActionDate: string;

  @Column({ field: 'logged_at', type: DataType.DATE, defaultValue: DataType.NOW })
  loggedAt: Date;

  @BelongsTo(() => FollowupFamily)
  followupFamily: FollowupFamily;

  @BelongsTo(() => ChurchMember, 'targetMemberId')
  target: ChurchMember;

  @BelongsTo(() => ChurchMember, 'targetMemberId')
  churchMember: ChurchMember;

  @BelongsTo(() => ChurchMember, 'createdBy')
  creator: ChurchMember;
}
