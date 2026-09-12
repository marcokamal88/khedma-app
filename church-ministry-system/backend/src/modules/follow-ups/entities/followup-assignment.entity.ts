import { Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { FollowupFamily } from './followup-family.entity';
import { ChurchMember } from '../../users/entities/church-member.entity';
import { ServiceYear } from '../../service-year/entities/service-year.entity';
import { Class } from '../../church/entities/class.entity';

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
  @Column({ field: 'target_member_id', type: DataType.INTEGER, allowNull: false })
  targetMemberId: number;

  // Backward compat alias
  get churchMemberId(): number { return (this as any).targetMemberId; }
  set churchMemberId(v: number) { (this as any).targetMemberId = v; }

  @ForeignKey(() => ServiceYear)
  @Column({ field: 'service_year_id', type: DataType.INTEGER, allowNull: true })
  serviceYearId: number;

  @ForeignKey(() => Class)
  @Column({ field: 'class_id', type: DataType.INTEGER, allowNull: true })
  classId: number | null;

  @ForeignKey(() => ChurchMember)
  @Column({ field: 'assigned_by', type: DataType.INTEGER, allowNull: true })
  assignedBy: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isActive: boolean;

  @Column({ field: 'assigned_at', type: DataType.DATE, defaultValue: DataType.NOW })
  assignedAt: Date;

  @Column({ field: 'unassigned_at', type: DataType.DATE, allowNull: true })
  unassignedAt: Date | null;

  @BelongsTo(() => FollowupFamily)
  followupFamily: FollowupFamily;

  @BelongsTo(() => ChurchMember, 'targetMemberId')
  target: ChurchMember;

  @BelongsTo(() => ChurchMember, 'targetMemberId')
  churchMember: ChurchMember;

  @BelongsTo(() => ServiceYear)
  serviceYear: ServiceYear;

  @BelongsTo(() => Class)
  class: Class;
}
