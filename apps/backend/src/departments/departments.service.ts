import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../entities/department.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private deptRepo: Repository<Department>,
  ) {}

  async findAll(): Promise<Department[]> {
    return this.deptRepo.find({ order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<Department> {
    const dept = await this.deptRepo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException('부서를 찾을 수 없습니다.');
    return dept;
  }

  async create(data: { name: string; code: string; description?: string }): Promise<Department> {
    const existing = await this.deptRepo.findOne({ where: { code: data.code } });
    if (existing) throw new ConflictException(`부서 코드 '${data.code}'가 이미 존재합니다.`);

    const dept = this.deptRepo.create(data);
    return this.deptRepo.save(dept);
  }
}
