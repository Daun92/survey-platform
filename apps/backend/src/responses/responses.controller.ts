import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponsesService } from './responses.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Get('surveys/:surveyId/responses')
  findBySurvey(
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.responsesService.findBySurvey(
      surveyId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('surveys/:surveyId/responses/count')
  countBySurvey(@Param('surveyId', ParseUUIDPipe) surveyId: string) {
    return this.responsesService.countBySurvey(surveyId);
  }

  @Get('responses/:id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.responsesService.findById(id);
  }

  @Delete('responses/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.responsesService.remove(id);
  }
}
