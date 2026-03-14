import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsString, MaxLength, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { SurveyStatus, APP_CONSTANTS } from '@survey/shared';

export class CreateSurveyDto {
  @IsString()
  projectId: string;

  @IsString()
  @MaxLength(APP_CONSTANTS.MAX_SURVEY_TITLE_LENGTH)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSurveyDto {
  @IsOptional()
  @IsString()
  @MaxLength(APP_CONSTANTS.MAX_SURVEY_TITLE_LENGTH)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

export class UpdateStatusDto {
  @IsEnum(SurveyStatus)
  status: SurveyStatus;
}

@Controller('surveys')
@UseGuards(JwtAuthGuard)
export class SurveysController {
  constructor(private surveysService: SurveysService) {}

  @Get()
  findByProject(@Query('projectId', ParseUUIDPipe) projectId: string) {
    return this.surveysService.findByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.surveysService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateSurveyDto, @Request() req: { user: { id: string } }) {
    return this.surveysService.create({ ...dto, createdById: req.user.id });
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSurveyDto) {
    return this.surveysService.update(id, {
      ...dto,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
    });
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStatusDto) {
    return this.surveysService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.surveysService.remove(id);
  }
}
