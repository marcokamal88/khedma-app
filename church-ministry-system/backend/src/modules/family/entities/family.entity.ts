import {
  Table, Column, Model, DataType, HasMany, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { FamilyMember } from './family-member.entity';

@Table({ tableName: 'families', timestamps: false })
export class Family extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @Column({ type: DataType.STRING(255), allowNull: true })
  name: string;

  @HasMany(() => FamilyMember)
  members: FamilyMember[];
}
