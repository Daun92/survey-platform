import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from '../entities/template.entity';
import { Question } from '../entities/question.entity';
import { SurveysService } from '../surveys/surveys.service';
import { QuestionsService } from '../questions/questions.service';
import type { TemplateCategory, TemplateQuestion } from '@survey/shared';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UseTemplateDto } from './dto/use-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepo: Repository<Template>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    private readonly surveysService: SurveysService,
    private readonly questionsService: QuestionsService,
  ) {}

  async findAll(category?: TemplateCategory): Promise<Template[]> {
    const where = category ? { category } : {};
    return this.templateRepo.find({
      where,
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Template> {
    const template = await this.templateRepo.findOne({
      where: { id },
      relations: ['createdBy'],
    });
    if (!template) throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    return template;
  }

  async create(dto: CreateTemplateDto, userId: string): Promise<Template> {
    let questions: TemplateQuestion[];

    if (dto.surveyId) {
      const surveyQuestions = await this.questionRepo.find({
        where: { surveyId: dto.surveyId },
        order: { order: 'ASC' },
      });
      if (surveyQuestions.length === 0) {
        throw new BadRequestException('해당 설문에 질문이 없습니다.');
      }
      questions = surveyQuestions.map((q) => ({
        type: q.type,
        title: q.title,
        description: q.description,
        required: q.required,
        order: q.order,
        options: q.options,
        validation: q.validation,
      }));
    } else if (dto.questions && dto.questions.length > 0) {
      questions = dto.questions;
    } else {
      throw new BadRequestException('surveyId 또는 questions가 필요합니다.');
    }

    const template = this.templateRepo.create({
      title: dto.title,
      description: dto.description || null,
      category: dto.category,
      questions,
      createdById: userId,
    });

    const saved = await this.templateRepo.save(template);
    return this.findById(saved.id);
  }

  async useTemplate(
    id: string,
    dto: UseTemplateDto,
    userId: string,
  ): Promise<{ surveyId: string }> {
    const template = await this.findById(id);

    const survey = await this.surveysService.create({
      projectId: dto.projectId,
      title: dto.title || template.title,
      description: template.description || undefined,
      createdById: userId,
    });

    if (template.questions.length > 0) {
      await this.questionsService.bulkCreate(
        survey.id,
        template.questions.map((q) => ({
          type: q.type,
          title: q.title,
          description: q.description ?? undefined,
          required: q.required,
          order: q.order,
          options: q.options,
          validation: q.validation,
        })),
      );
    }

    template.usageCount += 1;
    await this.templateRepo.save(template);

    return { surveyId: survey.id };
  }

  async remove(id: string): Promise<void> {
    const template = await this.findById(id);
    await this.templateRepo.remove(template);
  }
}
