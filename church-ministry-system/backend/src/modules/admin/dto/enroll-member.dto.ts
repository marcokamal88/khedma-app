import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class EnrollMemberDto {
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  stageGroupId?: string;
}
