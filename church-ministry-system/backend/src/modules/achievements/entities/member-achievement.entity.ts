import { Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { AchievementDefinition } from './achievement-definition.entity';

@Table({ tableName: 'member_achievements', timestamps: true, paranoid: true })
export class MemberAchievement extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => AchievementDefinition)
  @Column({ type: DataType.INTEGER, allowNull: false })
  achievementId: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  churchMemberId: number;

  @Column({ field: 'awarded_at', type: DataType.DATE })
  awardedAt: Date;

  @BelongsTo(() => AchievementDefinition)
  achievement: AchievementDefinition;
}
