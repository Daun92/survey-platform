import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { GenerateSurveyDto } from './dto/generate-survey.dto';
import { ChatMessageDto } from './dto/chat-message.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-survey')
  generateSurvey(@Body() dto: GenerateSurveyDto) {
    return this.aiService.generateSurvey(dto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('파일이 업로드되지 않았습니다.');
    }

    // Schedule cleanup after 1 hour
    setTimeout(() => {
      try {
        const fs = require('fs');
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch {
        // ignore cleanup errors
      }
    }, 60 * 60 * 1000);

    return {
      id: file.filename,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  @Post('chat')
  @HttpCode(200)
  async chat(@Body() dto: ChatMessageDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      for await (const event of this.aiService.chatStream(dto)) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    } catch (err) {
      res.write(
        `data: ${JSON.stringify({ type: 'error', data: err instanceof Error ? err.message : 'AI 처리 중 오류가 발생했습니다.' })}\n\n`,
      );
    } finally {
      res.end();
    }
  }
}
