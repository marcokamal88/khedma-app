import { Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { Preparation } from './preparation.entity';
import { User } from '../../users/entities/user.entity';

@Table({ tableName: 'preparation_comments', timestamps: true, paranoid: true })
export class PreparationComment extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => Preparation)
  @Column({ type: DataType.INTEGER, allowNull: false })
  preparationId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  authorId: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  body: string;

  @BelongsTo(() => Preparation)
  preparation: Preparation;

  @BelongsTo(() => User)
  author: User;
}
