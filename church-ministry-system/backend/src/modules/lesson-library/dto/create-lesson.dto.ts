import { IsUUID, IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

export class CreateLessonDto {
  @IsUUID()
  serviceYearId: string;

  @IsUUID()
  serviceId: string;

  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsUUID()
  @IsOptional()
  stageGroupId?: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['bible','hymn','catechism','liturgy','spiritual','activity','other'])
  @IsOptional()
  category?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  fileUrl?: string;
}
