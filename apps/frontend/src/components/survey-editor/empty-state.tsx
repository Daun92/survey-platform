'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Type,
  CircleDot,
  CheckSquare,
  SlidersHorizontal,
  AlignLeft,
  FileText,
  Sparkles,
  Plus,
} from 'lucide-react';
import { QuestionType } from '@survey/shared';
import type { TemplateQuestion } from '@survey/shared';

interface EmptyStateProps {
  onQuickAdd: (type: QuestionType) => void;
  onPresetSelect: (questions: TemplateQuestion[]) => void;
}

const quickAddTypes = [
  { type: QuestionType.SHORT_TEXT, label: '단답형', icon: Type },
  { type: QuestionType.RADIO, label: '객관식', icon: CircleDot },
  { type: QuestionType.CHECKBOX, label: '체크박스', icon: CheckSquare },
  { type: QuestionType.LINEAR_SCALE, label: '선형배율', icon: SlidersHorizontal },
  { type: QuestionType.LONG_TEXT, label: '장문형', icon: AlignLeft },
] as const;

const presets: { name: string; description: string; questions: TemplateQuestion[] }[] = [
  {
    name: '만족도 조사',
    description: '5점 척도 + 자유 의견',
    questions: [
      {
        type: QuestionType.LINEAR_SCALE,
        title: '전반적인 만족도를 평가해주세요.',
        description: null,
        required: true,
        order: 0,
        options: { linearScale: { min: 1, max: 5, minLabel: '매우 불만족', maxLabel: '매우 만족', step: 1 } },
        validation: { required: true },
      },
      {
        type: QuestionType.RADIO,
        title: '가장 만족스러운 부분은 무엇인가요?',
        description: null,
        required: true,
        order: 1,
        options: {
          choices: [
            { id: 'c1', label: '품질', value: 'quality', order: 0 },
            { id: 'c2', label: '가격', value: 'price', order: 1 },
            { id: 'c3', label: '서비스', value: 'service', order: 2 },
            { id: 'c4', label: '기타', value: 'other', order: 3 },
          ],
        },
        validation: { required: true },
      },
      {
        type: QuestionType.LONG_TEXT,
        title: '추가 의견이 있으시면 자유롭게 작성해주세요.',
        description: null,
        required: false,
        order: 2,
        options: { placeholder: '의견을 입력하세요', maxRows: 5 },
        validation: { required: false },
      },
    ],
  },
  {
    name: '의견 수집',
    description: '자유 텍스트 3개',
    questions: [
      {
        type: QuestionType.SHORT_TEXT,
        title: '현재 가장 큰 어려움은 무엇인가요?',
        description: null,
        required: true,
        order: 0,
        options: {},
        validation: { required: true },
      },
      {
        type: QuestionType.SHORT_TEXT,
        title: '개선이 필요한 점은 무엇인가요?',
        description: null,
        required: true,
        order: 1,
        options: {},
        validation: { required: true },
      },
      {
        type: QuestionType.LONG_TEXT,
        title: '추가로 전달하고 싶은 의견이 있나요?',
        description: null,
        required: false,
        order: 2,
        options: { placeholder: '자유롭게 작성해주세요', maxRows: 5 },
        validation: { required: false },
      },
    ],
  },
  {
    name: 'NPS 조사',
    description: 'NPS 점수 + 추천 이유',
    questions: [
      {
        type: QuestionType.LINEAR_SCALE,
        title: '주변에 추천할 의향이 어느 정도인가요?',
        description: '0점(전혀 추천하지 않음)부터 10점(매우 추천함)까지 선택해주세요.',
        required: true,
        order: 0,
        options: { linearScale: { min: 0, max: 10, minLabel: '전혀 추천하지 않음', maxLabel: '매우 추천함', step: 1 } },
        validation: { required: true },
      },
      {
        type: QuestionType.LONG_TEXT,
        title: '해당 점수를 준 이유를 알려주세요.',
        description: null,
        required: false,
        order: 1,
        options: { placeholder: '이유를 입력해주세요', maxRows: 4 },
        validation: { required: false },
      },
    ],
  },
];

export function EmptyState({ onQuickAdd, onPresetSelect }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed p-8">
      <div className="text-center mb-6">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        <h3 className="text-lg font-semibold">아직 질문이 없습니다</h3>
        <p className="text-sm text-muted-foreground mt-1">
          빠른 추가로 질문을 만들거나, 프리셋 템플릿으로 시작하세요.
        </p>
      </div>

      {/* Quick Add */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">빠른 추가</h4>
        <div className="flex flex-wrap gap-2 justify-center">
          {quickAddTypes.map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => onQuickAdd(type)}
              className="gap-1.5"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Presets */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">프리셋 템플릿</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {presets.map((preset) => (
            <Card
              key={preset.name}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => onPresetSelect(preset.questions)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{preset.name}</p>
                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {preset.questions.length}개 질문
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
