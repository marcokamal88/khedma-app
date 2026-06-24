import { Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { ChurchMember } from './church-member.entity';

@Table({ tableName: 'member_profiles', timestamps: true, paranoid: true })
export class MemberProfile extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  churchId: number;

  @ForeignKey(() => ChurchMember)
  @Column({ type: DataType.INTEGER, allowNull: false })
  churchMemberId: number;

  @Column({ type: DataType.ENUM('male','female'), allowNull: true })
  gender: string;

  @Column({ field: 'birth_date', type: DataType.DATEONLY, allowNull: true })
  birthDate: string;

  @Column({ field: 'school_grade', type: DataType.TINYINT, allowNull: true })
  schoolGrade: number;

  @Column({ type: DataType.JSON, allowNull: true })
  phones: string[];

  @Column({ type: DataType.TEXT, allowNull: true })
  address: string;

  @BelongsTo(() => ChurchMember)
  churchMember: ChurchMember;
}
