import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({ tableName: 'fcm_tokens', timestamps: true })
export class FcmToken extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  churchMemberId: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  token: string;

  @Column({ field: 'device_type', type: DataType.STRING(20), allowNull: false })
  deviceType: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isActive: boolean;
}
