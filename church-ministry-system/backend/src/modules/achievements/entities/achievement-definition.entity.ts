import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({ tableName: 'achievement_definitions', timestamps: true, paranoid: true })
export class AchievementDefinition extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Column({ field: 'badge_url', type: DataType.STRING(500), allowNull: true })
  badgeUrl: string;

  @Column({ field: 'trigger_type', type: DataType.ENUM('attendance_streak','task_count','memorization','participation','custom'), allowNull: false })
  triggerType: string;

  @Column({ field: 'trigger_config', type: DataType.JSON, allowNull: true })
  triggerConfig: any;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isActive: boolean;
}
