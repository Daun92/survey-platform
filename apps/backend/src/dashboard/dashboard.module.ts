import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../entities/project.entity';
import { Survey } from '../entities/survey.entity';
import { SurveyResponse } from '../entities/response.entity';
import { Template } from '../entities/template.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Survey, SurveyResponse, Template])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
