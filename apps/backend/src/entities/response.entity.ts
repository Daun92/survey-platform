import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ResponseStatus, AnswerValue, RespondentInfo } from '@survey/shared';
import { Survey } from './survey.entity';
import { Distribution } from './distribution.entity';

@Entity('survey_responses')
export class SurveyResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  surveyId: string;

  @ManyToOne(() => Survey, (survey) => survey.responses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'surveyId' })
  survey: Survey;

  @Column({ type: 'uuid', nullable: true })
  distributionId: string | null;

  @ManyToOne(() => Distribution, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'distributionId' })
  distribution: Distribution | null;

  @Column({ type: 'enum', enum: ResponseStatus, default: ResponseStatus.COMPLETED })
  status: ResponseStatus;

  @Column({ type: 'jsonb', default: [] })
  answers: AnswerValue[];

  @Column({ type: 'jsonb', default: { ipAddress: '', userAgent: '' } })
  respondentInfo: RespondentInfo;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
