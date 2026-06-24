import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { Church } from './church.entity';
import { Service } from './service.entity';

@Table({ tableName: 'sectors' })
export class Sector extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => Church)
  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  @Column({ type: DataType.ENUM('primary','preparatory','secondary','general'), defaultValue: 'general' })
  type: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Column({ field: 'is_active', type: DataType.BOOLEAN, defaultValue: true })
  isActive: boolean;

  @BelongsTo(() => Church)
  church: Church;

  @HasMany(() => Service)
  services: Service[];
}
