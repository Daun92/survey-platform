import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { nanoid } from 'nanoid';
import { Distribution } from '../entities/distribution.entity';
import { Survey } from '../entities/survey.entity';
import { SurveyStatus, DistributionChannel, DistributionConfig } from '@survey/shared';
import { CreateDistributionDto } from './dto/create-distribution.dto';
import { UpdateDistributionDto } from './dto/update-distribution.dto';

const DEFAULT_CONFIG: DistributionConfig = {
  allowDuplicate: false,
  maxResponses: null,
  welcomeMessage: null,
  completionMessage: null,
};

@Injectable()
export class DistributionsService {
  constructor(
    @InjectRepository(Distribution)
    private readonly distributionsRepo: Repository<Distribution>,
    @InjectRepository(Survey)
    private readonly surveysRepo: Repository<Survey>,
  ) {}

  async create(surveyId: string, dto: CreateDistributionDto): Promise<Distribution> {
    const survey = await this.surveysRepo.findOne({ where: { id: surveyId } });
    if (!survey) {
      throw new NotFoundException('설문을 찾을 수 없습니다.');
    }
    if (survey.status !== SurveyStatus.ACTIVE) {
      throw new BadRequestException('발행된(ACTIVE) 설문에만 배포 링크를 생성할 수 있습니다.');
    }

    const distribution = this.distributionsRepo.create({
      surveyId,
      channel: dto.channel ?? DistributionChannel.LINK,
      token: nanoid(21),
      config: { ...DEFAULT_CONFIG, ...dto.config },
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });

    return this.distributionsRepo.save(distribution);
  }

  async findAll(surveyId: string): Promise<Distribution[]> {
    return this.distributionsRepo.find({
      where: { surveyId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(surveyId: string, id: string, dto: UpdateDistributionDto): Promise<Distribution> {
    const distribution = await this.distributionsRepo.findOne({
      where: { id, surveyId },
    });
    if (!distribution) {
      throw new NotFoundException('배포 링크를 찾을 수 없습니다.');
    }

    if (dto.config) {
      distribution.config = { ...distribution.config, ...dto.config };
    }
    if (dto.isActive !== undefined) {
      distribution.isActive = dto.isActive;
    }
    if (dto.expiresAt !== undefined) {
      distribution.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    }

    return this.distributionsRepo.save(distribution);
  }

  async remove(surveyId: string, id: string): Promise<void> {
    const distribution = await this.distributionsRepo.findOne({
      where: { id, surveyId },
    });
    if (!distribution) {
      throw new NotFoundException('배포 링크를 찾을 수 없습니다.');
    }

    distribution.isActive = false;
    await this.distributionsRepo.save(distribution);
  }
}
