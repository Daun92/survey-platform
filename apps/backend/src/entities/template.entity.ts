import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TemplateCategory } from '@survey/shared';
import type { TemplateQuestion } from '@survey/shared';
import { User } from './user.entity';

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: TemplateCategory, default: TemplateCategory.GENERAL })
  category: TemplateCategory;

  @Column({ type: 'jsonb', default: [] })
  questions: TemplateQuestion[];

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ default: false })
  isSystem: boolean;

  @Column({ type: 'uuid', nullable: true })
  createdById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User | null;

  @CreateDateColumn()
  createdAt: Date;
}
