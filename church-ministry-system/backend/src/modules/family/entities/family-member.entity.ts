import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import { Family } from './family.entity';

@Table({ tableName: 'family_members', timestamps: false })
export class FamilyMember extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => Family)
  @Column({ field: 'family_id', type: DataType.INTEGER, allowNull: false })
  familyId: number;

  @Column({ field: 'church_member_id', type: DataType.INTEGER, allowNull: false })
  churchMemberId: number;

  @Column({ type: DataType.ENUM('parent','child','guardian'), allowNull: false })
  relation: string;

  @BelongsTo(() => Family)
  family: Family;
}
