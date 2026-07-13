import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { ChurchMember } from './church-member.entity';
import { Sector } from '../../church/entities/sector.entity';

@Table({ tableName: 'sector_assignments' })
export class SectorAssignment extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => ChurchMember)
  @Column({ field: 'church_member_id', type: DataType.INTEGER, allowNull: false })
  churchMemberId: number;

  @ForeignKey(() => Sector)
  @Column({ field: 'sector_id', type: DataType.INTEGER, allowNull: false })
  sectorId: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @Column({ field: 'is_active', type: DataType.BOOLEAN, defaultValue: true })
  isActive: boolean;

  @Column({ field: 'assigned_at', type: DataType.DATE, defaultValue: DataType.NOW })
  assignedAt: Date;

  @BelongsTo(() => ChurchMember)
  churchMember: ChurchMember;

  @BelongsTo(() => Sector)
  sector: Sector;
}
