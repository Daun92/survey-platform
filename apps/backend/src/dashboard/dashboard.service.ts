import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { Survey } from '../entities/survey.entity';
import { SurveyResponse } from '../entities/response.entity';
import { Template } from '../entities/template.entity';
import { SurveyStatus, ResponseStatus } from '@survey/shared';
import type { DashboardStats, RecentActivity } from '@survey/shared';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Survey)
    private readonly surveyRepo: Repository<Survey>,
    @InjectRepository(SurveyResponse)
    private readonly responseRepo: Repository<SurveyResponse>,
    @InjectRepository(Template)
    private readonly templateRepo: Repository<Template>,
  ) {}

  async getStats(): Promise<DashboardStats> {
    const [totalProjects, totalSurveys, activeSurveys, totalResponses, totalTemplates] =
      await Promise.all([
        this.projectRepo.count(),
        this.surveyRepo.count(),
        this.surveyRepo.count({ where: { status: SurveyStatus.ACTIVE } }),
        this.responseRepo.count({ where: { status: ResponseStatus.COMPLETED } }),
        this.templateRepo.count(),
      ]);

    return { totalProjects, totalSurveys, activeSurveys, totalResponses, totalTemplates };
  }

  async getRecentActivity(): Promise<RecentActivity[]> {
    const [recentSurveys, recentResponses, recentTemplates] = await Promise.all([
      this.surveyRepo.find({
        order: { createdAt: 'DESC' },
        take: 5,
        relations: ['createdBy'],
      }),
      this.responseRepo.find({
        order: { createdAt: 'DESC' },
        take: 5,
        relations: ['survey'],
      }),
      this.templateRepo.find({
        order: { createdAt: 'DESC' },
        take: 3,
        relations: ['createdBy'],
      }),
    ]);

    const activities: RecentActivity[] = [];

    for (const s of recentSurveys) {
      const isPublished = s.status === SurveyStatus.ACTIVE || s.status === SurveyStatus.CLOSED;
      activities.push({
        id: `survey-${s.id}`,
        type: isPublished ? 'survey_published' : 'survey_created',
        title: s.title,
        description: isPublished
          ? `설문이 발행되었습니다`
          : `새 설문이 생성되었습니다`,
        createdAt: s.createdAt.toISOString(),
      });
    }

    for (const r of recentResponses) {
      activities.push({
        id: `response-${r.id}`,
        type: 'response_received',
        title: r.survey?.title ?? '설문',
        description: '새 응답이 접수되었습니다',
        createdAt: r.createdAt.toISOString(),
      });
    }

    for (const t of recentTemplates) {
      activities.push({
        id: `template-${t.id}`,
        type: 'template_created',
        title: t.title,
        description: '새 템플릿이 생성되었습니다',
        createdAt: t.createdAt.toISOString(),
      });
    }

    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return activities.slice(0, 10);
  }
}
