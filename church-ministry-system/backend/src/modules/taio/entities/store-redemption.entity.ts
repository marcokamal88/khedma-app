import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { StoreItem } from './store-item.entity';
import { TaioTransaction } from './taio-transaction.entity';

@Table({ tableName: 'store_redemptions', timestamps: false })
export class StoreRedemption extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @Column({ field: 'church_member_id', type: DataType.INTEGER, allowNull: false })
  churchMemberId: number;

  @ForeignKey(() => StoreItem)
  @Column({ field: 'store_item_id', type: DataType.INTEGER, allowNull: false })
  storeItemId: number;

  @ForeignKey(() => TaioTransaction)
  @Column({ field: 'taio_transaction_id', type: DataType.INTEGER, allowNull: false })
  taioTransactionId: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  quantity: number;

  @Column({
    type: DataType.ENUM('pending', 'fulfilled', 'cancelled'),
    defaultValue: 'pending',
  })
  status: string;

  @Column({ field: 'redeemed_at', type: DataType.DATE, defaultValue: DataType.NOW })
  redeemedAt: Date;

  @Column({ field: 'fulfilled_at', type: DataType.DATE, allowNull: true })
  fulfilledAt: Date;

  @BelongsTo(() => StoreItem)
  item: StoreItem;

  @BelongsTo(() => TaioTransaction)
  taioTransaction: TaioTransaction;
}
