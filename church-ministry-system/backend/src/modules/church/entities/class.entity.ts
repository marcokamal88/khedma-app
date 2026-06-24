import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { Service } from './service.entity';
import { StageGroup } from './stage-group.entity';

@Table({ tableName: 'classes', timestamps: false })
export class Class extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => Service)
  @Column({ field: 'service_id', type: DataType.INTEGER, allowNull: false })
  serviceId: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => StageGroup)
  @Column({ field: 'stage_group_id', type: DataType.INTEGER, allowNull: true })
  stageGroupId: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  capacity: number;

  @Column({ field: 'is_active', type: DataType.BOOLEAN, defaultValue: true })
  isActive: boolean;

  @BelongsTo(() => Service)
  service: Service;

  @BelongsTo(() => StageGroup)
  stageGroup: StageGroup;
}
