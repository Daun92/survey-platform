import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { UserRole } from '@survey/shared';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepo: Repository<Project>,
  ) {}

  async findAll(): Promise<Project[]> {
    return this.projectsRepo.find({
      relations: ['owner', 'surveys'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Project> {
    const project = await this.projectsRepo.findOne({
      where: { id },
      relations: ['owner', 'surveys'],
    });
    if (!project) throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    return project;
  }

  async create(data: { title: string; description?: string; ownerId: string }): Promise<Project> {
    const project = this.projectsRepo.create(data);
    const saved = await this.projectsRepo.save(project);
    return this.findById(saved.id);
  }

  async update(
    id: string,
    data: { title?: string; description?: string },
    userId: string,
    userRole: string,
  ): Promise<Project> {
    const project = await this.findById(id);
    this.checkOwnership(project, userId, userRole);
    Object.assign(project, data);
    await this.projectsRepo.save(project);
    return this.findById(id);
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const project = await this.findById(id);
    this.checkOwnership(project, userId, userRole);
    await this.projectsRepo.remove(project);
  }

  private checkOwnership(project: Project, userId: string, userRole: string): void {
    if (userRole === UserRole.ADMIN) return;
    if (project.ownerId !== userId) {
      throw new ForbiddenException('이 프로젝트를 수정할 권한이 없습니다.');
    }
  }
}
