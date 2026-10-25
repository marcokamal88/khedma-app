import { IsString, IsNotEmpty } from 'class-validator';

export class AssignServiceLeaderDto {
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsString()
  @IsNotEmpty()
  leaderRole: 'service_leader' | 'assistant_service_leader';
}
