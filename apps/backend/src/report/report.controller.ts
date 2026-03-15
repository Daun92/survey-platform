import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportService } from './report.service';

@Controller('surveys/:surveyId/report')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get()
  getReport(@Param('surveyId') surveyId: string) {
    return this.reportService.getSurveyReport(surveyId);
  }

  @Get('questions/:questionId')
  getQuestionReport(
    @Param('surveyId') surveyId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.reportService.getQuestionReport(surveyId, questionId);
  }
}
