import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({ tableName: 'sibling_pairs', timestamps: false })
export class SiblingPair extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ field: 'church_id', type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @Column({ field: 'church_member_id_a', type: DataType.INTEGER, allowNull: false })
  churchMemberIdA: number;

  @Column({ field: 'church_member_id_b', type: DataType.INTEGER, allowNull: false })
  churchMemberIdB: number;
}
