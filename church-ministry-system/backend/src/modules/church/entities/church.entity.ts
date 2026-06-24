import { Table, Column, Model, DataType, HasMany, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { Sector } from './sector.entity';

@Table({ tableName: 'churches' })
export class Church extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  @Column({ type: DataType.STRING(100), unique: true, allowNull: false })
  subdomain: string;

  @Column({ type: DataType.JSON, allowNull: true })
  settings: any;

  @Column({ field: 'is_active', type: DataType.BOOLEAN, defaultValue: true })
  isActive: boolean;

  @HasMany(() => Sector)
  sectors: Sector[];
}
