import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class QuestionOrderItem {
  id: string;
  order: number;
}

class ReorderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOrderItem)
  questionOrders: QuestionOrderItem[];
}

class BulkCreateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}

@Controller('surveys/:surveyId/questions')
@UseGuards(JwtAuthGuard)
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Get()
  findAll(@Param('surveyId', ParseUUIDPipe) surveyId: string) {
    return this.questionsService.findBySurvey(surveyId);
  }

  @Get(':id')
  findOne(
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.questionsService.findById(surveyId, id);
  }

  @Post()
  create(
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionsService.create(surveyId, dto);
  }

  @Put(':id')
  update(
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(surveyId, id, dto);
  }

  @Delete(':id')
  remove(
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.questionsService.remove(surveyId, id);
  }

  @Patch('reorder')
  reorder(
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Body() dto: ReorderDto,
  ) {
    return this.questionsService.reorder(surveyId, dto.questionOrders);
  }

  @Post('bulk')
  bulkCreate(
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Body() dto: BulkCreateDto,
  ) {
    return this.questionsService.bulkCreate(surveyId, dto.questions);
  }

  @Post(':id/duplicate')
  duplicate(
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.questionsService.duplicate(surveyId, id);
  }
}
