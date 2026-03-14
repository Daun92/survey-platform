import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { QuestionType } from '@survey/shared';
import type { QuestionOptions, ValidationRule } from '@survey/shared';
import { Survey } from './survey.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  surveyId: string;

  @ManyToOne(() => Survey, (survey) => survey.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'surveyId' })
  survey: Survey;

  @Column({ type: 'enum', enum: QuestionType })
  type: QuestionType;

  @Column({ length: 1000 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: false })
  required: boolean;

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'jsonb', default: {} })
  options: QuestionOptions;

  @Column({ type: 'jsonb', default: { required: false } })
  validation: ValidationRule;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
