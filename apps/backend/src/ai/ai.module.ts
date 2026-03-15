import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import * as path from 'path';

@Module({
  imports: [
    MulterModule.register({
      dest: path.join(process.cwd(), 'uploads/ai-temp'),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'image/gif',
          'image/webp',
        ];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('PDF 또는 이미지 파일만 업로드할 수 있습니다.'), false);
        }
      },
    }),
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
