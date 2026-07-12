import { IsString, IsDateString, IsOptional, IsIn } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  serviceId: string;

  @IsString()
  serviceYearId: string;

  @IsDateString()
  sessionDate: string;

  @IsString()
  @IsIn(['service', 'event', 'meeting', 'activity'])
  sessionType: string;

  @IsString()
  classId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
