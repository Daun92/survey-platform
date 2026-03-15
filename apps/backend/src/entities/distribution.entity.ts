import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DistributionChannel, DistributionConfig } from '@survey/shared';
import { Survey } from './survey.entity';

@Entity('distributions')
export class Distribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  surveyId: string;

  @ManyToOne(() => Survey, (survey) => survey.distributions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'surveyId' })
  survey: Survey;

  @Column({ type: 'enum', enum: DistributionChannel, default: DistributionChannel.LINK })
  channel: DistributionChannel;

  @Column({ type: 'varchar', length: 21, unique: true })
  token: string;

  @Column({ type: 'jsonb', default: { allowDuplicate: false, maxResponses: null, welcomeMessage: null, completionMessage: null } })
  config: DistributionConfig;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
