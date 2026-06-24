import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { Sector } from './sector.entity';
import { StageGroup } from './stage-group.entity';
import { Class } from './class.entity';

@Table({ tableName: 'services' })
export class Service extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => Sector)
  @Column({ field: 'sector_id', type: DataType.INTEGER, allowNull: false })
  sectorId: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  @Column({ type: DataType.JSON, allowNull: true })
  schedule: any;

  @Column({ field: 'is_active', type: DataType.BOOLEAN, defaultValue: true })
  isActive: boolean;

  @BelongsTo(() => Sector)
  sector: Sector;

  @HasMany(() => StageGroup)
  stageGroups: StageGroup[];

  @HasMany(() => Class)
  classes: Class[];
}
