import { IsNumber, IsString, IsOptional, IsEnum, IsInt, IsJSON } from 'class-validator';

export class CreateActivityDto {
  @IsNumber()
  serviceYearId: number;

  @IsNumber()
  @IsOptional()
  serviceId?: number;

  @IsString()
  name: string;

  @IsEnum(['choir','theater','sports','festival','educational','coptic','memorization','other'])
  activityType: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsJSON()
  @IsOptional()
  schedule?: any;

  @IsInt()
  @IsOptional()
  maxCapacity?: number;
}
