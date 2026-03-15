import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Distribution } from '../entities/distribution.entity';
import { Survey } from '../entities/survey.entity';
import { DistributionsController } from './distributions.controller';
import { DistributionsService } from './distributions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Distribution, Survey])],
  controllers: [DistributionsController],
  providers: [DistributionsService],
})
export class DistributionsModule {}
