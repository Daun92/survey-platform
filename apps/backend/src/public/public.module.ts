import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Distribution } from '../entities/distribution.entity';
import { Survey } from '../entities/survey.entity';
import { Question } from '../entities/question.entity';
import { SurveyResponse } from '../entities/response.entity';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [TypeOrmModule.forFeature([Distribution, Survey, Question, SurveyResponse])],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
