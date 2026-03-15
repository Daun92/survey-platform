import { IsArray, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerValueDto {
  @IsString()
  questionId: string;

  @IsOptional()
  value: string | string[] | number | Record<string, string> | null;
}

export class SubmitResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerValueDto)
  answers: AnswerValueDto[];
}
