import { IsString, MaxLength, IsOptional, IsEnum, IsUUID, IsArray } from 'class-validator';
import { TemplateCategory } from '@survey/shared';
import type { TemplateQuestion } from '@survey/shared';

export class CreateTemplateDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TemplateCategory)
  category: TemplateCategory;

  @IsOptional()
  @IsUUID()
  surveyId?: string;

  @IsOptional()
  @IsArray()
  questions?: TemplateQuestion[];
}
