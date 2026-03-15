import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Distribution } from '../entities/distribution.entity';
import { Survey } from '../entities/survey.entity';
import { Question } from '../entities/question.entity';
import { SurveyStatus, PublicSurveyData } from '@survey/shared';

@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(Distribution)
    private readonly distributionsRepo: Repository<Distribution>,
    @InjectRepository(Survey)
    private readonly surveysRepo: Repository<Survey>,
    @InjectRepository(Question)
    private readonly questionsRepo: Repository<Question>,
  ) {}

  async getSurveyByToken(token: string): Promise<PublicSurveyData> {
    const distribution = await this.distributionsRepo.findOne({
      where: { token },
    });

    if (!distribution) {
      throw new NotFoundException('유효하지 않은 설문 링크입니다.');
    }

    if (!distribution.isActive) {
      throw new BadRequestException('비활성화된 설문 링크입니다.');
    }

    if (distribution.expiresAt && new Date(distribution.expiresAt) < new Date()) {
      throw new BadRequestException('만료된 설문 링크입니다.');
    }

    const survey = await this.surveysRepo.findOne({
      where: { id: distribution.surveyId },
    });

    if (!survey) {
      throw new NotFoundException('설문을 찾을 수 없습니다.');
    }

    if (survey.status !== SurveyStatus.ACTIVE) {
      throw new BadRequestException('현재 응답을 받지 않는 설문입니다.');
    }

    const questions = await this.questionsRepo.find({
      where: { surveyId: survey.id },
      order: { order: 'ASC' },
    });

    return {
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
      },
      questions: questions.map((q) => ({
        id: q.id,
        surveyId: q.surveyId,
        type: q.type,
        title: q.title,
        description: q.description,
        required: q.required,
        order: q.order,
        options: q.options,
        validation: q.validation,
        createdAt: q.createdAt.toISOString(),
        updatedAt: q.updatedAt.toISOString(),
      })),
      config: distribution.config,
    };
  }
}
