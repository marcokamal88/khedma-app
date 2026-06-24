import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { ChurchMember } from './church-member.entity';
import { Role } from './role.entity';

@Table({ tableName: 'member_roles', timestamps: false })
export class MemberRole extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => ChurchMember)
  @Column({ field: 'church_member_id', type: DataType.INTEGER, allowNull: false })
  churchMemberId: number;

  @ForeignKey(() => Role)
  @Column({ field: 'role_id', type: DataType.INTEGER, allowNull: false })
  roleId: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @Column({ field: 'assigned_at', type: DataType.DATE, defaultValue: DataType.NOW })
  assignedAt: Date;

  @BelongsTo(() => ChurchMember)
  churchMember: ChurchMember;

  @BelongsTo(() => Role)
  role: Role;
}
