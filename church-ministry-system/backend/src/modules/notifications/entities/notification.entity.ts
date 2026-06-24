import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({ tableName: 'notifications', timestamps: false })
export class Notification extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @Column({ field: 'church_member_id', type: DataType.INTEGER, allowNull: false })
  churchMemberId: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  title: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  body: string;

  @Column({
    type: DataType.ENUM('attendance','task','event','payment','general'),
    allowNull: false,
  })
  type: string;

  @Column({ field: 'source_type', type: DataType.STRING(50), allowNull: true })
  sourceType: string;

  @Column({ field: 'source_id', type: DataType.INTEGER, allowNull: true })
  sourceId: number;

  @Column({ field: 'is_read', type: DataType.BOOLEAN, defaultValue: false })
  isRead: boolean;

  @Column({ field: 'sent_at', type: DataType.DATE, defaultValue: DataType.NOW })
  sentAt: Date;

  @Column({ field: 'read_at', type: DataType.DATE, allowNull: true })
  readAt: Date;
}
