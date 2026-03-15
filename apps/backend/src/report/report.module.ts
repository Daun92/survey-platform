import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Survey } from '../entities/survey.entity';
import { Question } from '../entities/question.entity';
import { SurveyResponse } from '../entities/response.entity';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Survey, Question, SurveyResponse])],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
