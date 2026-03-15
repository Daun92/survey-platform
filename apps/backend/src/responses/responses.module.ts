import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyResponse } from '../entities/response.entity';
import { ResponsesController } from './responses.controller';
import { ResponsesService } from './responses.service';

@Module({
  imports: [TypeOrmModule.forFeature([SurveyResponse])],
  controllers: [ResponsesController],
  providers: [ResponsesService],
})
export class ResponsesModule {}
