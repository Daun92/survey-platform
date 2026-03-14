import { IsEmail, IsString, MinLength } from 'class-validator';
import { APP_CONSTANTS } from '@survey/shared';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(APP_CONSTANTS.MIN_PASSWORD_LENGTH)
  password: string;
}
