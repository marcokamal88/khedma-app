import { IsNotEmpty, IsOptional, IsString, Matches, MinLength, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { USERNAME_MESSAGE, USERNAME_PATTERN, normalizeUsername } from '../../../core/utils/username.util';

export class CreateServantDto {
  @IsString()
  @MinLength(2)
  fullName: string;

  @IsString()
  @Transform(({ value }) => normalizeUsername(value))
  @Matches(USERNAME_PATTERN, { message: USERNAME_MESSAGE })
  username: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @IsIn(['male', 'female'])
  gender?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @Transform(({ value }) => (value == null ? value : String(value)))
  classId: string;
}
