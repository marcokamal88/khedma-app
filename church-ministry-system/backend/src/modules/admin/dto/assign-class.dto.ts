import { IsString, IsNotEmpty } from 'class-validator';

export class AssignClassDto {
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsString()
  @IsNotEmpty()
  leaderRole: 'servant' | 'class_leader';
}
