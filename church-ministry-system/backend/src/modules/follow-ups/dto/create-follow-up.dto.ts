import { IsNumber, IsOptional, IsString, IsEnum, IsArray } from 'class-validator';

export class CreateFollowUpDto {
  @IsNumber()
  @IsOptional()
  serviceYearId?: number;

  @IsNumber()
  @IsOptional()
  servantId?: number;

  @IsNumber()
  @IsOptional()
  responsibleMemberId?: number;

  @IsNumber()
  @IsOptional()
  servedMemberId?: number;

  @IsArray()
  @IsOptional()
  memberIds?: number[];

  @IsNumber()
  @IsOptional()
  serviceId?: number;

  @IsNumber()
  @IsOptional()
  classId?: number;

  @IsEnum(['served_member', 'servant'])
  @IsOptional()
  targetType?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(['active', 'paused', 'completed'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
