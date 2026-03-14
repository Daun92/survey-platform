import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from '../entities/survey.entity';
import { SurveyStatus } from '@survey/shared';

@Injectable()
export class SurveysService {
  constructor(
    @InjectRepository(Survey)
    private surveysRepo: Repository<Survey>,
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

  async remove(id: string): Promise<void> {
    const survey = await this.findById(id);
    await this.surveysRepo.remove(survey);
  }
}
