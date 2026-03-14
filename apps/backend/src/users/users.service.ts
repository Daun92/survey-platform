import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '@survey/shared';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { email },
      relations: ['department'],
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: ['department'],
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return user;
  }

  async create(data: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    departmentId: string | null;
  }): Promise<User> {
    const user = this.usersRepo.create(data);
    const saved = await this.usersRepo.save(user);
    return this.findById(saved.id);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepo.update(id, { lastLoginAt: new Date() });
  }
}
