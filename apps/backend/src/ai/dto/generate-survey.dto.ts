import { IsString, IsOptional, IsInt, Min, Max, MaxLength } from 'class-validator';

export class GenerateSurveyDto {
  @IsString()
  @MaxLength(200)
  topic: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  purpose?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetAudience?: string;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(20)
  questionCount?: number;

  @IsOptional()
  @IsString()
  language?: string;
}
