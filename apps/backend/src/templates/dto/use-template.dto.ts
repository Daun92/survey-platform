import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UseTemplateDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsString()
  title?: string;
}
