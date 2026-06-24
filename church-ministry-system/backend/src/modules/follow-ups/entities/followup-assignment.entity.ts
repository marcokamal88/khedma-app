import { Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { FollowupFamily } from './followup-family.entity';
import { ChurchMember } from '../../users/entities/church-member.entity';

@Table({ tableName: 'followup_assignments', timestamps: false })
export class FollowupAssignment extends Model {
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

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isActive: boolean;

  @Column({ field: 'assigned_at', type: DataType.DATE, defaultValue: DataType.NOW })
  assignedAt: Date;

  @BelongsTo(() => FollowupFamily)
  followupFamily: FollowupFamily;

  @BelongsTo(() => ChurchMember)
  churchMember: ChurchMember;
}
