import { Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { FollowupFamily } from './followup-family.entity';
import { ChurchMember } from '../../users/entities/church-member.entity';

@Table({ tableName: 'followup_logs', timestamps: true })
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
  @Column({ type: DataType.INTEGER, allowNull: false })
  churchMemberId: number;

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

  @BelongsTo(() => ChurchMember)
  churchMember: ChurchMember;
}
