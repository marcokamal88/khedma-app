import { Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { Activity } from './activity.entity';
import { ChurchMember } from '../../users/entities/church-member.entity';

@Table({ tableName: 'activity_members', timestamps: true, paranoid: true })
export class ActivityMember extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => Activity)
  @Column({ type: DataType.INTEGER, allowNull: false })
  activityId: number;

  @ForeignKey(() => ChurchMember)
  @Column({ type: DataType.INTEGER, allowNull: false })
  churchMemberId: number;

  @Column({ field: 'joined_at', type: DataType.DATEONLY, allowNull: false })
  joinedAt: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isActive: boolean;

  @BelongsTo(() => Activity)
  activity: Activity;

  @BelongsTo(() => ChurchMember)
  churchMember: ChurchMember;
}
