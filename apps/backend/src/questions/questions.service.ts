import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Question } from '../entities/question.entity';
import { Survey } from '../entities/survey.entity';
import { SurveyStatus } from '@survey/shared';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private questionsRepo: Repository<Question>,
    @InjectRepository(Survey)
    private surveysRepo: Repository<Survey>,
    private dataSource: DataSource,
  ) {}

  async findBySurvey(surveyId: string): Promise<Question[]> {
    await this.getSurvey(surveyId);
    return this.questionsRepo.find({
      where: { surveyId },
      order: { order: 'ASC' },
    });
  }

  async findById(surveyId: string, id: string): Promise<Question> {
    const question = await this.questionsRepo.findOne({
      where: { id, surveyId },
    });
    if (!question) throw new NotFoundException('질문을 찾을 수 없습니다.');
    return question;
  }

  async create(surveyId: string, dto: CreateQuestionDto): Promise<Question> {
    await this.ensureDraft(surveyId);

    let order = dto.order;
    if (order === undefined) {
      const maxOrder = await this.questionsRepo
        .createQueryBuilder('q')
        .select('MAX(q.order)', 'max')
        .where('q.surveyId = :surveyId', { surveyId })
        .getRawOne();
      order = (maxOrder?.max ?? -1) + 1;
    }

    const question = this.questionsRepo.create({
      surveyId,
      type: dto.type,
      title: dto.title,
      description: dto.description || null,
      required: dto.required ?? false,
      order,
      options: dto.options ?? {},
      validation: { required: dto.required ?? false, ...dto.validation },
    });

    return this.questionsRepo.save(question);
  }

  async update(surveyId: string, id: string, dto: UpdateQuestionDto): Promise<Question> {
    await this.ensureDraft(surveyId);
    const question = await this.findById(surveyId, id);

    if (dto.title !== undefined) question.title = dto.title;
    if (dto.description !== undefined) question.description = dto.description || null;
    if (dto.required !== undefined) {
      question.required = dto.required;
      question.validation = { ...question.validation, required: dto.required };
    }
    if (dto.options !== undefined) question.options = dto.options;
    if (dto.validation !== undefined) {
      question.validation = { ...question.validation, ...dto.validation };
    }

    return this.questionsRepo.save(question);
  }

  async remove(surveyId: string, id: string): Promise<void> {
    await this.ensureDraft(surveyId);
    const question = await this.findById(surveyId, id);
    await this.questionsRepo.remove(question);
  }

  async reorder(
    surveyId: string,
    questionOrders: Array<{ id: string; order: number }>,
  ): Promise<Question[]> {
    await this.ensureDraft(surveyId);

    await this.dataSource.transaction(async (manager) => {
      for (const { id, order } of questionOrders) {
        await manager.update(Question, { id, surveyId }, { order });
      }
    });

    return this.findBySurvey(surveyId);
  }

  async bulkCreate(surveyId: string, dtos: CreateQuestionDto[]): Promise<Question[]> {
    await this.ensureDraft(surveyId);

    const questions = dtos.map((dto, index) =>
      this.questionsRepo.create({
        surveyId,
        type: dto.type,
        title: dto.title,
        description: dto.description || null,
        required: dto.required ?? false,
        order: dto.order ?? index,
        options: dto.options ?? {},
        validation: { required: dto.required ?? false, ...dto.validation },
      }),
    );

    await this.questionsRepo.save(questions);
    return this.findBySurvey(surveyId);
  }

  async duplicate(surveyId: string, id: string): Promise<Question> {
    await this.ensureDraft(surveyId);
    const original = await this.findById(surveyId, id);

    await this.questionsRepo
      .createQueryBuilder()
      .update(Question)
      .set({ order: () => '"order" + 1' })
      .where('surveyId = :surveyId AND "order" > :order', {
        surveyId,
        order: original.order,
      })
      .execute();

    const duplicate = this.questionsRepo.create({
      surveyId,
      type: original.type,
      title: `${original.title} (복사)`,
      description: original.description,
      required: original.required,
      order: original.order + 1,
      options: JSON.parse(JSON.stringify(original.options)),
      validation: JSON.parse(JSON.stringify(original.validation)),
    });

    return this.questionsRepo.save(duplicate);
  }

  private async getSurvey(surveyId: string): Promise<Survey> {
    const survey = await this.surveysRepo.findOne({ where: { id: surveyId } });
    if (!survey) throw new NotFoundException('설문을 찾을 수 없습니다.');
    return survey;
  }

  private async ensureDraft(surveyId: string): Promise<void> {
    const survey = await this.getSurvey(surveyId);
    if (survey.status !== SurveyStatus.DRAFT) {
      throw new BadRequestException('DRAFT 상태의 설문만 수정할 수 있습니다.');
    }
  }
}
