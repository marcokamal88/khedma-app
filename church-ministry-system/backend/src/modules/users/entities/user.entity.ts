import {
  Table, Column, Model, DataType, HasMany, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { ChurchMember } from './church-member.entity';

@Table({ tableName: 'users' })
export class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ type: DataType.STRING(20), unique: true, allowNull: true })
  phone: string;

  @Column({ type: DataType.STRING(255), unique: true, allowNull: true })
  email: string;

  @Column({ field: 'password_hash', type: DataType.STRING(255), allowNull: false })
  passwordHash: string;

  @Column({ field: 'full_name', type: DataType.STRING(255), allowNull: false })
  fullName: string;

  @Column({ field: 'avatar_url', type: DataType.STRING(500), allowNull: true })
  avatarUrl: string;

  @HasMany(() => ChurchMember)
  churchMembers: ChurchMember[];
}
