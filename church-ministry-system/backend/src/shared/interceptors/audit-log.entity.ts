import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({ tableName: 'audit_logs', timestamps: false })
export class AuditLog extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  actorId: number;

  @Column({ type: DataType.ENUM('create','update','delete','login','logout','context_switch'), allowNull: false })
  action: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  entityType: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  entityId: number;

  @Column({ type: DataType.JSON, allowNull: true })
  beforeSnapshot: any;

  @Column({ type: DataType.JSON, allowNull: true })
  afterSnapshot: any;

  @Column({ type: DataType.STRING(45), allowNull: true })
  ipAddress: string;
}
