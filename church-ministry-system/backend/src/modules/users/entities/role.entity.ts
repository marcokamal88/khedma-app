import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({ tableName: 'roles', timestamps: false })
export class Role extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ type: DataType.ENUM('servant','served_member','parent','sector_leader','priest','service_leader','assistant_service_leader','class_leader'), unique: true, allowNull: false })
  name: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  label: string;
}
