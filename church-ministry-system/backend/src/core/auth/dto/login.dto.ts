import { IsString, IsOptional, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeUsername } from '../../utils/username.util';

export class LoginDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizeUsername(value))
  username?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizeUsername(value))
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(6)
  password: string;
}
