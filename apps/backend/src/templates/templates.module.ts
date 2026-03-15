import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Template } from '../entities/template.entity';
import { Question } from '../entities/question.entity';
import { SurveysModule } from '../surveys/surveys.module';
import { QuestionsModule } from '../questions/questions.module';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Template, Question]),
    SurveysModule,
    QuestionsModule,
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
