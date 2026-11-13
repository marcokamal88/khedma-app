import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateChurchDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  subdomain: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;
}
