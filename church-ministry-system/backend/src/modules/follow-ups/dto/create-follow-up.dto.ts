import { IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';

export class CreateFollowUpDto {
  @IsNumber()
  @IsOptional()
  serviceYearId?: number;

  @IsNumber()
  servantId: number;

  @IsNumber()
  @IsOptional()
  servedMemberId?: number;

  @IsNumber()
  @IsOptional()
  serviceId?: number;

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
