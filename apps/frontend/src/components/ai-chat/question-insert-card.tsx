'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import type { TemplateQuestion } from '@survey/shared';

const TYPE_LABELS: Record<string, string> = {
  short_text: '단답형',
  long_text: '장문형',
  radio: '객관식',
  checkbox: '체크박스',
  dropdown: '드롭다운',
  linear_scale: '선형 척도',
  date: '날짜',
  file_upload: '파일',
  matrix: '행렬형',
  ranking: '순위',
};

interface QuestionInsertCardProps {
  questions: TemplateQuestion[];
}

export function QuestionInsertCard({ questions }: QuestionInsertCardProps) {
  return (
    <div className="rounded-lg border bg-green-50 dark:bg-green-950/30 p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4" />
        {questions.length}개 질문이 추가되었습니다
      </div>

      <div className="space-y-1.5">
        {questions.map((q, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-md bg-background px-2.5 py-2 text-sm"
          >
            <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">
              {TYPE_LABELS[q.type] ?? q.type}
            </Badge>
            <span className="text-sm line-clamp-2">{q.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
