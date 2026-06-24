import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export class SwitchContextDto {
  @IsString()
  @IsIn(['servant', 'served_member', 'parent', 'sector_leader', 'priest'])
  role: string;

  @IsOptional()
  @IsNumber()
  serviceId?: number;

  @IsOptional()
  @IsNumber()
  classId?: number;
}
