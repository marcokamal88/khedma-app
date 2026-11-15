import { IsString, IsNotEmpty, IsOptional, MinLength, IsEmail, IsPhoneNumber } from 'class-validator';

export class CreateAdminUserDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @IsPhoneNumber('EG')
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  role: string; // role name e.g. 'priest', 'servant', 'served_member', etc.

  @IsOptional()
  @IsString()
  serviceId?: string; // for service_leader, assistant_service_leader, servant, class_leader, served_member

  @IsOptional()
  @IsString()
  classId?: string; // for servant, class_leader

  @IsOptional()
  @IsString()
  sectorId?: string; // for sector_leader

  @IsOptional()
  @IsString()
  stageGroupId?: string;

  @IsOptional()
  @IsString()
  gender?: 'male' | 'female';
}
