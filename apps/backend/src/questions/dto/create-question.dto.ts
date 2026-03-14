import { IsEnum, IsString, MaxLength, IsOptional, IsBoolean, IsInt, IsObject } from 'class-validator';
import { QuestionType, APP_CONSTANTS } from '@survey/shared';
import type { QuestionOptions, ValidationRule } from '@survey/shared';

export class CreateQuestionDto {
  @IsEnum(QuestionType)
  type: QuestionType;

  @IsString()
  @MaxLength(APP_CONSTANTS.MAX_QUESTION_TEXT_LENGTH)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsObject()
  options?: QuestionOptions;

  @IsOptional()
  @IsObject()
  validation?: Partial<ValidationRule>;
}
