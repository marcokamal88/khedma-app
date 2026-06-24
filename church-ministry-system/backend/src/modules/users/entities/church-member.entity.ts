import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { User } from './user.entity';
import { MemberRole } from './member-role.entity';

@Table({ tableName: 'church_members' })
export class ChurchMember extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => User)
  @Column({ field: 'user_id', type: DataType.INTEGER, allowNull: false })
  userId: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @Column({ field: 'is_active', type: DataType.BOOLEAN, defaultValue: true })
  isActive: boolean;

  @Column({ field: 'joined_at', type: DataType.DATE, defaultValue: DataType.NOW })
  joinedAt: Date;

  @BelongsTo(() => User)
  user: User;

  @HasMany(() => MemberRole)
  memberRoles: MemberRole[];
}
