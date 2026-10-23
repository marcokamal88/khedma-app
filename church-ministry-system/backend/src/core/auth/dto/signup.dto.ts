import { IsString, IsOptional, MinLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { USERNAME_MESSAGE, USERNAME_PATTERN, normalizeUsername } from '../../utils/username.util';

export class SignupDto {
  @IsString()
  fullName: string;

  @IsString()
  @Transform(({ value }) => normalizeUsername(value))
  @Matches(USERNAME_PATTERN, { message: USERNAME_MESSAGE })
  username: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(6)
  password: string;
}
