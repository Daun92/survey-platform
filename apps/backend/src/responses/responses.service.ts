import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveyResponse } from '../entities/response.entity';

@Injectable()
export class ResponsesService {
  constructor(
    @InjectRepository(SurveyResponse)
    private readonly responsesRepo: Repository<SurveyResponse>,
  ) {}

  async findBySurvey(
    surveyId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    data: SurveyResponse[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const [data, total] = await this.responsesRepo.findAndCount({
      where: { surveyId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async countBySurvey(surveyId: string): Promise<{ count: number }> {
    const count = await this.responsesRepo.count({ where: { surveyId } });
    return { count };
  }

  async findById(id: string): Promise<SurveyResponse> {
    const response = await this.responsesRepo.findOne({ where: { id } });
    if (!response) {
      throw new NotFoundException('응답을 찾을 수 없습니다.');
    }
    return response;
  }

  async remove(id: string): Promise<void> {
    const response = await this.findById(id);
    await this.responsesRepo.remove(response);
  }
}
