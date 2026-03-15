import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DistributionsService } from './distributions.service';
import { CreateDistributionDto } from './dto/create-distribution.dto';
import { UpdateDistributionDto } from './dto/update-distribution.dto';

@Controller('surveys/:surveyId/distributions')
@UseGuards(JwtAuthGuard)
export class DistributionsController {
  constructor(private readonly distributionsService: DistributionsService) {}

  @Post()
  create(
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Body() dto: CreateDistributionDto,
  ) {
    return this.distributionsService.create(surveyId, dto);
  }

  @Get()
  findAll(@Param('surveyId', ParseUUIDPipe) surveyId: string) {
    return this.distributionsService.findAll(surveyId);
  }

  @Patch(':id')
  update(
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDistributionDto,
  ) {
    return this.distributionsService.update(surveyId, id, dto);
  }

  @Delete(':id')
  remove(
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.distributionsService.remove(surveyId, id);
  }
}
