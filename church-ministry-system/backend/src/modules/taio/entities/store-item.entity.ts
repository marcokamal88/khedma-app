import { Table, Column, Model, DataType, HasMany, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { StoreRedemption } from './store-redemption.entity';

@Table({ tableName: 'store_items' })
export class StoreItem extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Column({ field: 'image_url', type: DataType.STRING(500), allowNull: true })
  imageUrl: string;

  @Column({ field: 'point_cost', type: DataType.INTEGER, allowNull: false })
  pointCost: number;

  @Column({ field: 'stock_quantity', type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  stockQuantity: number;

  @Column({ field: 'is_active', type: DataType.BOOLEAN, defaultValue: true })
  isActive: boolean;

  @HasMany(() => StoreRedemption)
  redemptions: StoreRedemption[];
}
