import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { ChurchMember } from '../../users/entities/church-member.entity';
import { ServiceYear } from '../../service-year/entities/service-year.entity';
import { Service } from '../../church/entities/service.entity';
import { Class } from '../../church/entities/class.entity';
import { FollowupAssignment } from './followup-assignment.entity';

@Table({ tableName: 'followup_families', timestamps: true, paranoid: true })
export class FollowupFamily extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => ServiceYear)
  @Column({ type: DataType.INTEGER, allowNull: false })
  serviceYearId: number;

  @ForeignKey(() => ChurchMember)
  @Column({ field: 'responsible_member_id', type: DataType.INTEGER, allowNull: false })
  responsibleMemberId: number;

  // Backward compat alias for existing code using servantId
  get servantId(): number { return (this as any).responsibleMemberId; }
  set servantId(v: number) { (this as any).responsibleMemberId = v; }

  @Column({ type: DataType.STRING(255), allowNull: true })
  name: string;

  @ForeignKey(() => Service)
  @Column({ type: DataType.INTEGER, allowNull: true })
  serviceId: number;

  @ForeignKey(() => Class)
  @Column({ field: 'class_id', type: DataType.INTEGER, allowNull: true })
  classId: number | null;

  @Column({ field: 'target_type', type: DataType.ENUM('served_member', 'servant'), allowNull: false, defaultValue: 'served_member' })
  targetType: string;

  @Column({ field: 'class_id_or_zero', type: DataType.INTEGER, allowNull: true })
  classIdOrZero: number;

  @Column({ type: DataType.ENUM('active','paused','completed'), defaultValue: 'active' })
  status: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string;

  @BelongsTo(() => ChurchMember, 'responsibleMemberId')
  servant: ChurchMember;

  get responsible(): ChurchMember { return (this as any).servant; }
  set responsible(v: ChurchMember) { (this as any).servant = v; }

  @BelongsTo(() => ServiceYear)
  serviceYear: ServiceYear;

  @BelongsTo(() => Service)
  service: Service;

  @BelongsTo(() => Class)
  class: Class;

  @HasMany(() => FollowupAssignment)
  assignments: FollowupAssignment[];
}
