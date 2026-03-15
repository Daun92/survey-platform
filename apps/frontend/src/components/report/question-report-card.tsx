'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import type { QuestionAggregation } from '@survey/shared';
import { BarChartView } from './bar-chart';
import { PieChartView } from './pie-chart';
import { NumericSummary } from './numeric-summary';
import { TextResponses } from './text-responses';
import { MatrixTable } from './matrix-table';
import { RankingChart } from './ranking-chart';

const TYPE_LABELS: Record<string, string> = {
  short_text: '단답형',
  long_text: '장문형',
  radio: '객관식',
  checkbox: '체크박스',
  dropdown: '드롭다운',
  linear_scale: '선형 척도',
  date: '날짜',
  matrix: '매트릭스',
  ranking: '순위',
};

interface QuestionReportCardProps {
  aggregation: QuestionAggregation;
  index: number;
}

export function QuestionReportCard({ aggregation, index }: QuestionReportCardProps) {
  const [chartMode, setChartMode] = useState<'bar' | 'pie'>('bar');
  const { data } = aggregation;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-medium">
            {index + 1}. {aggregation.questionTitle}
          </CardTitle>
          <Badge variant="outline" className="shrink-0">
            {TYPE_LABELS[aggregation.questionType] ?? aggregation.questionType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {data.type === 'choice' && (
          <div className="space-y-2">
            <div className="flex justify-end gap-1">
              <Button
                variant={chartMode === 'bar' ? 'default' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setChartMode('bar')}
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={chartMode === 'pie' ? 'default' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setChartMode('pie')}
              >
                <PieChartIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
            {chartMode === 'bar' ? (
              <BarChartView data={data} />
            ) : (
              <PieChartView data={data} />
            )}
          </div>
        )}

        {data.type === 'numeric' && <NumericSummary data={data} />}

        {data.type === 'text' && <TextResponses data={data} />}

        {data.type === 'matrix' && <MatrixTable data={data} />}

        {data.type === 'ranking' && <RankingChart data={data} />}
      </CardContent>
    </Card>
  );
}
