import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { ChurchMember } from '../../users/entities/church-member.entity';
import { ServiceYear } from '../../service-year/entities/service-year.entity';
import { Service } from '../../church/entities/service.entity';
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
  @Column({ type: DataType.INTEGER, allowNull: false })
  servantId: number;

  @Column({ type: DataType.STRING(255), allowNull: true })
  name: string;

  @ForeignKey(() => Service)
  @Column({ type: DataType.INTEGER, allowNull: true })
  serviceId: number;

  @Column({ type: DataType.ENUM('active','paused','completed'), defaultValue: 'active' })
  status: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string;

  @BelongsTo(() => ChurchMember, 'servantId')
  servant: ChurchMember;

  @BelongsTo(() => ServiceYear)
  serviceYear: ServiceYear;

  @BelongsTo(() => Service)
  service: Service;

  @HasMany(() => FollowupAssignment)
  assignments: FollowupAssignment[];
}
