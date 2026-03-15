import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from '../entities/survey.entity';
import { Question } from '../entities/question.entity';
import { SurveyStatus } from '@survey/shared';

@Injectable()
export class SurveysService {
  constructor(
    @InjectRepository(Survey)
    private surveysRepo: Repository<Survey>,
    @InjectRepository(Question)
    private questionsRepo: Repository<Question>,
  ) {}

  async findByProject(projectId: string): Promise<Survey[]> {
    return this.surveysRepo.find({
      where: { projectId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Survey> {
    const survey = await this.surveysRepo.findOne({
      where: { id },
      relations: ['createdBy', 'project'],
    });
    if (!survey) throw new NotFoundException('설문을 찾을 수 없습니다.');
    return survey;
  }

  async create(data: {
    projectId: string;
    title: string;
    description?: string;
    createdById: string;
  }): Promise<Survey> {
    const survey = this.surveysRepo.create({
      ...data,
      status: SurveyStatus.DRAFT,
    });
    const saved = await this.surveysRepo.save(survey);
    return this.findById(saved.id);
  }

  async update(
    id: string,
    data: { title?: string; description?: string; startsAt?: Date; endsAt?: Date },
  ): Promise<Survey> {
    const survey = await this.findById(id);
    Object.assign(survey, data);
    await this.surveysRepo.save(survey);
    return this.findById(id);
  }

  async updateStatus(id: string, status: SurveyStatus): Promise<Survey> {
    const survey = await this.findById(id);
    survey.status = status;
    await this.surveysRepo.save(survey);
    return this.findById(id);
  }

  async publish(id: string): Promise<Survey> {
    const survey = await this.findById(id);
    if (survey.status !== SurveyStatus.DRAFT) {
      throw new BadRequestException('DRAFT 상태의 설문만 발행할 수 있습니다.');
    }
    const questionCount = await this.questionsRepo.count({ where: { surveyId: id } });
    if (questionCount === 0) {
      throw new BadRequestException('질문이 최소 1개 이상 필요합니다.');
    }
    survey.status = SurveyStatus.ACTIVE;
    await this.surveysRepo.save(survey);
    return this.findById(id);
  }

  async close(id: string): Promise<Survey> {
    const survey = await this.findById(id);
    if (survey.status !== SurveyStatus.ACTIVE) {
      throw new BadRequestException('진행 중인 설문만 마감할 수 있습니다.');
    }
    survey.status = SurveyStatus.CLOSED;
    await this.surveysRepo.save(survey);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const survey = await this.findById(id);
    await this.surveysRepo.remove(survey);
  }
}
