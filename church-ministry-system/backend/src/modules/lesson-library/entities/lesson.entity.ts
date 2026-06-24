import { Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { ServiceYear } from '../../service-year/entities/service-year.entity';
import { Service } from '../../church/entities/service.entity';
import { Class } from '../../church/entities/class.entity';
import { StageGroup } from '../../church/entities/stage-group.entity';

@Table({ tableName: 'lesson_library', timestamps: true, paranoid: true })
export class Lesson extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  preparationId: number;

  @ForeignKey(() => ServiceYear)
  @Column({ type: DataType.INTEGER, allowNull: false })
  serviceYearId: number;

  @ForeignKey(() => Service)
  @Column({ type: DataType.INTEGER, allowNull: false })
  serviceId: number;

  @ForeignKey(() => Class)
  @Column({ type: DataType.INTEGER, allowNull: true })
  classId: number;

  @ForeignKey(() => StageGroup)
  @Column({ type: DataType.INTEGER, allowNull: true })
  stageGroupId: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  title: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Column({ type: DataType.ENUM('bible','hymn','catechism','liturgy','spiritual','activity','other'), defaultValue: 'other' })
  category: string;

  @Column({ type: DataType.JSON, allowNull: true })
  tags: string[];

  @Column({ type: DataType.STRING(500), allowNull: true })
  fileUrl: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  createdBy: number;

  @Column({ field: 'published_at', type: DataType.DATE, allowNull: true })
  publishedAt: Date;

  @BelongsTo(() => ServiceYear)
  serviceYear: ServiceYear;

  @BelongsTo(() => Service)
  service: Service;

  @BelongsTo(() => Class)
  class: Class;

  @BelongsTo(() => StageGroup)
  stageGroup: StageGroup;
}
