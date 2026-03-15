import { IsString, IsOptional, IsArray, IsUUID, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

class ConversationEntry {
  @IsString()
  role: 'user' | 'assistant';

  @IsString()
  content: string;
}

class ExistingQuestion {
  @IsString()
  type: string;

  @IsString()
  title: string;
}

export class ChatMessageDto {
  @IsString()
  @MaxLength(5000)
  message: string;

  @IsOptional()
  @IsUUID()
  surveyId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversationEntry)
  conversationHistory?: ConversationEntry[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExistingQuestion)
  existingQuestions?: ExistingQuestion[];
}
