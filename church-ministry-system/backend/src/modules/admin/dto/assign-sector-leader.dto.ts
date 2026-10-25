import { IsString, IsNotEmpty } from 'class-validator';

export class AssignSectorLeaderDto {
  @IsString()
  @IsNotEmpty()
  sectorId: string;
}
