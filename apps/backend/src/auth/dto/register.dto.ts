import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsUUID } from 'class-validator';
import { APP_CONSTANTS } from '@survey/shared';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(APP_CONSTANTS.MIN_PASSWORD_LENGTH)
  password: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
