import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({ tableName: 'service_years', timestamps: false })
export class ServiceYear extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @Column({ type: DataType.STRING(20), allowNull: false })
  label: string;

  @Column({ field: 'start_date', type: DataType.DATEONLY, allowNull: false })
  startDate: string;

  @Column({ field: 'end_date', type: DataType.DATEONLY, allowNull: false })
  endDate: string;

  @Column({ field: 'is_current', type: DataType.BOOLEAN, defaultValue: false })
  isCurrent: boolean;
}
