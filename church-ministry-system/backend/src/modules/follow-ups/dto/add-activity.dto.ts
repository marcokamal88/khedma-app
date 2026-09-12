import { IsNumber, IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';

export class AddActivityDto {
  @IsEnum(['call', 'visit', 'meeting', 'message', 'other'])
  logType: string;

  @IsString()
  notes: string;

  @IsString()
  @IsOptional()
  nextAction?: string;

  @IsDateString()
  @IsOptional()
  nextActionDate?: string;

  @IsNumber()
  @IsOptional()
  churchMemberId?: number;

  @IsNumber()
  @IsOptional()
  targetMemberId?: number;

  @IsString()
  @IsOptional()
  loggedAt?: string;
}
