import { IsString, MaxLength, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { APP_CONSTANTS } from '@survey/shared';
import type { QuestionOptions, ValidationRule } from '@survey/shared';

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  @MaxLength(APP_CONSTANTS.MAX_QUESTION_TEXT_LENGTH)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsObject()
  options?: QuestionOptions;

  @IsOptional()
  @IsObject()
  validation?: Partial<ValidationRule>;
}
