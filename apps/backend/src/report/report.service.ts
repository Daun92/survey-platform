import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from '../entities/survey.entity';
import { Question } from '../entities/question.entity';
import { SurveyResponse } from '../entities/response.entity';
import {
  ResponseStatus,
  QuestionType,
  type AggregationData,
  type QuestionAggregation,
  type SurveyReportResponse,
  type AnswerValue,
} from '@survey/shared';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepo: Repository<Survey>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(SurveyResponse)
    private readonly responseRepo: Repository<SurveyResponse>,
  ) {}

  async getSurveyReport(surveyId: string): Promise<SurveyReportResponse> {
    const survey = await this.surveyRepo.findOne({ where: { id: surveyId } });
    if (!survey) throw new NotFoundException('Survey not found');

    const questions = await this.questionRepo.find({
      where: { surveyId },
      order: { order: 'ASC' },
    });

    const responses = await this.responseRepo.find({
      where: { surveyId, status: ResponseStatus.COMPLETED },
    });

    const aggregations: QuestionAggregation[] = [];
    for (const question of questions) {
      if (question.type === QuestionType.FILE_UPLOAD) continue;

      const data = this.aggregateQuestion(question, responses);
      aggregations.push({
        questionId: question.id,
        questionTitle: question.title,
        questionType: question.type,
        totalResponses: responses.length,
        data,
      });
    }

    return {
      surveyId,
      surveyTitle: survey.title,
      totalResponses: responses.length,
      aggregations,
    };
  }

  async getQuestionReport(
    surveyId: string,
    questionId: string,
  ): Promise<QuestionAggregation> {
    const question = await this.questionRepo.findOne({
      where: { id: questionId, surveyId },
    });
    if (!question) throw new NotFoundException('Question not found');

    const responses = await this.responseRepo.find({
      where: { surveyId, status: ResponseStatus.COMPLETED },
    });

    return {
      questionId: question.id,
      questionTitle: question.title,
      questionType: question.type,
      totalResponses: responses.length,
      data: this.aggregateQuestion(question, responses),
    };
  }

  private aggregateQuestion(
    question: Question,
    responses: SurveyResponse[],
  ): AggregationData {
    const answers = responses
      .map((r) => r.answers.find((a: AnswerValue) => a.questionId === question.id))
      .filter((a): a is AnswerValue => !!a && a.value !== null && a.value !== undefined);

    switch (question.type) {
      case QuestionType.RADIO:
      case QuestionType.CHECKBOX:
      case QuestionType.DROPDOWN:
        return this.aggregateChoice(question, answers);

      case QuestionType.SHORT_TEXT:
      case QuestionType.LONG_TEXT:
      case QuestionType.DATE:
        return this.aggregateText(answers);

      case QuestionType.LINEAR_SCALE:
        return this.aggregateNumeric(answers);

      case QuestionType.MATRIX:
        return this.aggregateMatrix(question, answers);

      case QuestionType.RANKING:
        return this.aggregateRanking(question, answers);

      default:
        return this.aggregateText(answers);
    }
  }

  private aggregateChoice(
    question: Question,
    answers: AnswerValue[],
  ): AggregationData {
    const choices = question.options?.choices ?? [];
    const countMap = new Map<string, number>();
    choices.forEach((c) => countMap.set(c.value, 0));

    let totalSelections = 0;
    for (const answer of answers) {
      const vals = Array.isArray(answer.value)
        ? answer.value
        : [String(answer.value)];
      for (const v of vals) {
        countMap.set(v, (countMap.get(v) ?? 0) + 1);
        totalSelections++;
      }
    }

    const denominator = totalSelections || 1;
    return {
      type: 'choice' as const,
      options: choices.map((c) => {
        const count = countMap.get(c.value) ?? 0;
        return {
          label: c.label,
          count,
          percentage: Math.round((count / denominator) * 1000) / 10,
        };
      }),
    };
  }

  private aggregateText(answers: AnswerValue[]): AggregationData {
    const textValues = answers
      .map((a) => String(a.value))
      .filter((v) => v.length > 0);

    return {
      type: 'text' as const,
      responses: textValues.slice(0, 20),
      totalCount: textValues.length,
    };
  }

  private aggregateNumeric(answers: AnswerValue[]): AggregationData {
    const nums = answers
      .map((a) => Number(a.value))
      .filter((n) => !isNaN(n));

    if (nums.length === 0) {
      return {
        type: 'numeric' as const,
        average: 0,
        median: 0,
        min: 0,
        max: 0,
        distribution: [],
      };
    }

    nums.sort((a, b) => a - b);
    const sum = nums.reduce((s, n) => s + n, 0);
    const mid = Math.floor(nums.length / 2);
    const median =
      nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];

    const distMap = new Map<number, number>();
    for (const n of nums) {
      distMap.set(n, (distMap.get(n) ?? 0) + 1);
    }

    return {
      type: 'numeric' as const,
      average: Math.round((sum / nums.length) * 100) / 100,
      median,
      min: nums[0],
      max: nums[nums.length - 1],
      distribution: Array.from(distMap.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value - b.value),
    };
  }

  private aggregateMatrix(
    question: Question,
    answers: AnswerValue[],
  ): AggregationData {
    const matrix = question.options?.matrix;
    if (!matrix) {
      return { type: 'matrix' as const, rows: [] };
    }

    const rows = matrix.rows.map((row) => {
      const colCounts = new Map<string, number>();
      matrix.columns.forEach((col) => colCounts.set(col.value, 0));

      for (const answer of answers) {
        const val = answer.value as Record<string, string>;
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          const selected = val[row.value];
          if (selected) {
            colCounts.set(selected, (colCounts.get(selected) ?? 0) + 1);
          }
        }
      }

      const totalForRow = Array.from(colCounts.values()).reduce(
        (s, c) => s + c,
        0,
      );
      const denominator = totalForRow || 1;

      return {
        label: row.label,
        columns: matrix.columns.map((col) => {
          const count = colCounts.get(col.value) ?? 0;
          return {
            label: col.label,
            count,
            percentage: Math.round((count / denominator) * 1000) / 10,
          };
        }),
      };
    });

    return { type: 'matrix' as const, rows };
  }

  private aggregateRanking(
    question: Question,
    answers: AnswerValue[],
  ): AggregationData {
    const choices = question.options?.choices ?? [];
    if (choices.length === 0) {
      return { type: 'ranking' as const, items: [] };
    }

    const rankSums = new Map<string, number[]>();
    choices.forEach((c) => rankSums.set(c.value, []));

    for (const answer of answers) {
      const val = answer.value;
      if (Array.isArray(val)) {
        val.forEach((v, idx) => {
          const ranks = rankSums.get(v);
          if (ranks) ranks.push(idx + 1);
        });
      }
    }

    return {
      type: 'ranking' as const,
      items: choices.map((c) => {
        const ranks = rankSums.get(c.value) ?? [];
        const avg =
          ranks.length > 0
            ? Math.round(
                (ranks.reduce((s, r) => s + r, 0) / ranks.length) * 100,
              ) / 100
            : 0;

        const distribution = new Array(choices.length).fill(0);
        for (const r of ranks) {
          if (r >= 1 && r <= choices.length) {
            distribution[r - 1]++;
          }
        }

        return {
          label: c.label,
          averageRank: avg,
          rankDistribution: distribution,
        };
      }),
    };
  }
}
