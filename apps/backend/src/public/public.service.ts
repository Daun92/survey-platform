import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Distribution } from '../entities/distribution.entity';
import { Survey } from '../entities/survey.entity';
import { Question } from '../entities/question.entity';
import { SurveyResponse } from '../entities/response.entity';
import { SurveyStatus, ResponseStatus, PublicSurveyData } from '@survey/shared';
import { SubmitResponseDto } from './dto/submit-response.dto';

@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(Distribution)
    private readonly distributionsRepo: Repository<Distribution>,
    @InjectRepository(Survey)
    private readonly surveysRepo: Repository<Survey>,
    @InjectRepository(Question)
    private readonly questionsRepo: Repository<Question>,
    @InjectRepository(SurveyResponse)
    private readonly responsesRepo: Repository<SurveyResponse>,
  ) {}

  private async validateDistribution(token: string): Promise<{ distribution: Distribution; survey: Survey }> {
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

    return { distribution, survey };
  }

  async getSurveyByToken(token: string): Promise<PublicSurveyData> {
    const { distribution, survey } = await this.validateDistribution(token);

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

  async submitResponse(
    token: string,
    dto: SubmitResponseDto,
    ip: string,
    userAgent: string,
  ): Promise<{ id: string }> {
    const { distribution, survey } = await this.validateDistribution(token);

    // Duplicate IP check
    if (!distribution.config.allowDuplicate) {
      const existing = await this.responsesRepo
        .createQueryBuilder('r')
        .where('r.distributionId = :did', { did: distribution.id })
        .andWhere("r.\"respondentInfo\"->>'ipAddress' = :ip", { ip })
        .getOne();

      if (existing) {
        throw new BadRequestException('이미 응답을 제출하셨습니다.');
      }
    }

    // Max responses check
    if (distribution.config.maxResponses !== null && distribution.config.maxResponses !== undefined) {
      const count = await this.responsesRepo.count({
        where: { distributionId: distribution.id },
      });
      if (count >= distribution.config.maxResponses) {
        throw new BadRequestException('최대 응답 수에 도달하여 더 이상 응답을 받을 수 없습니다.');
      }
    }

    // Required question validation
    const questions = await this.questionsRepo.find({
      where: { surveyId: survey.id },
    });
    const answeredMap = new Map(dto.answers.map((a) => [a.questionId, a.value]));

    for (const question of questions) {
      if (!question.required) continue;
      const val = answeredMap.get(question.id);
      if (
        val === null ||
        val === undefined ||
        val === '' ||
        (Array.isArray(val) && val.length === 0)
      ) {
        throw new BadRequestException(`필수 질문에 답변해주세요: ${question.title}`);
      }
    }

    // Save response
    const response = this.responsesRepo.create({
      surveyId: survey.id,
      distributionId: distribution.id,
      status: ResponseStatus.COMPLETED,
      answers: dto.answers,
      respondentInfo: { ipAddress: ip, userAgent },
      submittedAt: new Date(),
    });

    const saved = await this.responsesRepo.save(response);
    return { id: saved.id };
  }
}
