import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { ProjectsModule } from './projects/projects.module';
import { SurveysModule } from './surveys/surveys.module';
import { QuestionsModule } from './questions/questions.module';
import { DistributionsModule } from './distributions/distributions.module';
import { PublicModule } from './public/public.module';
import { ResponsesModule } from './responses/responses.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    DatabaseModule,
    RedisModule,
    HealthModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    ProjectsModule,
    SurveysModule,
    QuestionsModule,
    DistributionsModule,
    PublicModule,
    ResponsesModule,
    ReportModule,
  ],
})
export class AppModule {}
