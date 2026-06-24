import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { ServiceYear } from '../../service-year/entities/service-year.entity';

@Table({ tableName: 'taio_transactions', timestamps: false })
export class TaioTransaction extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => ServiceYear)
  @Column({ field: 'service_year_id', type: DataType.INTEGER, allowNull: false })
  serviceYearId: number;

  @Column({ field: 'church_member_id', type: DataType.INTEGER, allowNull: false })
  churchMemberId: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  points: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  reason: string;

  @Column({
    field: 'source_type',
    type: DataType.ENUM('task','attendance','manual','redemption','adjustment'),
    allowNull: false,
  })
  sourceType: string;

  @Column({ field: 'source_id', type: DataType.INTEGER, allowNull: true })
  sourceId: number;

  @Column({ field: 'assigned_by', type: DataType.INTEGER, allowNull: true })
  assignedBy: number;

  @Column({ field: 'created_at', type: DataType.DATE, allowNull: true })
  createdAt: Date;

  @BelongsTo(() => ServiceYear)
  serviceYear: ServiceYear;
}
