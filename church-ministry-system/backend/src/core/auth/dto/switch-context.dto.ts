import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

export class SwitchContextDto {
  @IsString()
  role: string;

  @IsOptional()
  @IsObject()
  scope?: {
    sectorId?: number;
    serviceId?: number;
    stageGroupId?: number;
    classId?: number;
  };
}
