import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { ChurchMember } from './church-member.entity';
import { Service } from '../../church/entities/service.entity';
import { Class } from '../../church/entities/class.entity';
import { ServiceYear } from '../../service-year/entities/service-year.entity';

@Table({ tableName: 'servant_assignments', timestamps: true, paranoid: true })
export class ServantAssignment extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => ServiceYear)
  @Column({ field: 'service_year_id', type: DataType.INTEGER, allowNull: false })
  serviceYearId: number;

  @ForeignKey(() => ChurchMember)
  @Column({ field: 'church_member_id', type: DataType.INTEGER, allowNull: false })
  churchMemberId: number;

  @ForeignKey(() => Service)
  @Column({ field: 'service_id', type: DataType.INTEGER, allowNull: false })
  serviceId: number;

  @ForeignKey(() => Class)
  @Column({ field: 'class_id', type: DataType.INTEGER, allowNull: true })
  classId: number;

  @Column({ field: 'leader_role', type: DataType.ENUM('service_leader','assistant_service_leader','class_leader','servant'), allowNull: true })
  leaderRole: string;

  @Column({ field: 'is_active', type: DataType.BOOLEAN, defaultValue: true })
  isActive: boolean;

  @Column({ field: 'assigned_at', type: DataType.DATE, defaultValue: DataType.NOW })
  assignedAt: Date;

  @BelongsTo(() => ChurchMember)
  churchMember: ChurchMember;

  @BelongsTo(() => Service)
  service: Service;

  @BelongsTo(() => Class)
  class: Class;

  @BelongsTo(() => ServiceYear)
  serviceYear: ServiceYear;
}
