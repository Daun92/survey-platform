import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { GenerateSurveyDto } from './dto/generate-survey.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-survey')
  generateSurvey(@Body() dto: GenerateSurveyDto) {
    return this.aiService.generateSurvey(dto);
  }
}
