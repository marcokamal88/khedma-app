import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { Preparation } from './preparation.entity';

@Table({ tableName: 'preparation_files', timestamps: false })
export class PreparationFile extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => Preparation)
  @Column({ field: 'preparation_id', type: DataType.INTEGER, allowNull: false })
  preparationId: number;

  @Column({ field: 'file_name', type: DataType.STRING(255), allowNull: false })
  fileName: string;

  @Column({ field: 'file_url', type: DataType.STRING(500), allowNull: false })
  fileUrl: string;

  @Column({
    field: 'file_type',
    type: DataType.ENUM('document','presentation','image','video','audio','other'),
    allowNull: false,
  })
  fileType: string;

  @Column({ field: 'file_size_bytes', type: DataType.INTEGER, allowNull: true })
  fileSizeBytes: number;

  @BelongsTo(() => Preparation)
  preparation: Preparation;
}
