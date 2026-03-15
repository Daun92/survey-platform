'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { QuestionTypeConfig } from './question-type-config';
import { QuestionType } from '@survey/shared';
import type { QuestionOptions, ValidationRule, QuestionResponse } from '@survey/shared';
import {
  Type,
  AlignLeft,
  CircleDot,
  CheckSquare,
  ChevronDown,
  SlidersHorizontal,
  Calendar,
  Paperclip,
  Grid3X3,
  ArrowUpDown,
} from 'lucide-react';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.SHORT_TEXT]: '단답형',
  [QuestionType.LONG_TEXT]: '장문형',
  [QuestionType.RADIO]: '객관식 (단일)',
  [QuestionType.CHECKBOX]: '체크박스 (복수)',
  [QuestionType.DROPDOWN]: '드롭다운',
  [QuestionType.LINEAR_SCALE]: '선형 배율',
  [QuestionType.DATE]: '날짜',
  [QuestionType.FILE_UPLOAD]: '파일 업로드',
  [QuestionType.MATRIX]: '행렬형',
  [QuestionType.RANKING]: '순위',
};

const QUESTION_TYPE_ICONS: Record<QuestionType, React.ComponentType<{ className?: string }>> = {
  [QuestionType.SHORT_TEXT]: Type,
  [QuestionType.LONG_TEXT]: AlignLeft,
  [QuestionType.RADIO]: CircleDot,
  [QuestionType.CHECKBOX]: CheckSquare,
  [QuestionType.DROPDOWN]: ChevronDown,
  [QuestionType.LINEAR_SCALE]: SlidersHorizontal,
  [QuestionType.DATE]: Calendar,
  [QuestionType.FILE_UPLOAD]: Paperclip,
  [QuestionType.MATRIX]: Grid3X3,
  [QuestionType.RANKING]: ArrowUpDown,
};

interface QuestionFormData {
  type: QuestionType;
  title: string;
  description: string;
  required: boolean;
  options: QuestionOptions;
  validation: Partial<ValidationRule>;
}

interface QuestionFormProps {
  initialData?: QuestionResponse;
  defaultType?: QuestionType;
  onSubmit: (data: QuestionFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

function getDefaultOptions(type: QuestionType): QuestionOptions {
  switch (type) {
    case QuestionType.RADIO:
    case QuestionType.CHECKBOX:
    case QuestionType.DROPDOWN:
    case QuestionType.RANKING:
      return {
        choices: [
          { id: crypto.randomUUID(), label: '선택지 1', value: 'option_1', order: 0 },
          { id: crypto.randomUUID(), label: '선택지 2', value: 'option_2', order: 1 },
        ],
      };
    case QuestionType.LINEAR_SCALE:
      return { linearScale: { min: 1, max: 5, step: 1, minLabel: '', maxLabel: '' } };
    case QuestionType.MATRIX:
      return {
        matrix: {
          rows: [{ id: crypto.randomUUID(), label: '행 1', value: 'row_1', order: 0 }],
          columns: [{ id: crypto.randomUUID(), label: '열 1', value: 'col_1', order: 0 }],
          allowMultiple: false,
        },
      };
    case QuestionType.FILE_UPLOAD:
      return { fileUpload: { maxFileSize: 10, maxFileCount: 1, allowedTypes: [] } };
    case QuestionType.LONG_TEXT:
      return { placeholder: '', maxRows: 5 };
    default:
      return {};
  }
}

export function QuestionForm({ initialData, defaultType, onSubmit, onCancel, isLoading }: QuestionFormProps) {
  const [form, setForm] = useState<QuestionFormData>(() => {
    if (initialData) {
      return {
        type: initialData.type,
        title: initialData.title,
        description: initialData.description ?? '',
        required: initialData.required,
        options: initialData.options ?? {},
        validation: initialData.validation ?? { required: initialData.required },
      };
    }
    const type = defaultType ?? QuestionType.SHORT_TEXT;
    return {
      type,
      title: '',
      description: '',
      required: false,
      options: getDefaultOptions(type),
      validation: { required: false },
    };
  });

  const handleTypeChange = (type: QuestionType) => {
    setForm((prev) => ({
      ...prev,
      type,
      options: getDefaultOptions(type),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await onSubmit({
      ...form,
      validation: { ...form.validation, required: form.required },
    });
  };

  const isEditMode = !!initialData;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/30">
      {/* Visual Type Grid */}
      <div>
        <Label className="mb-2 block">질문 유형</Label>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => {
            const Icon = QUESTION_TYPE_ICONS[value as QuestionType];
            const isSelected = form.type === value;
            return (
              <button
                key={value}
                type="button"
                disabled={isEditMode}
                onClick={() => handleTypeChange(value as QuestionType)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                  isEditMode && 'opacity-50 cursor-not-allowed',
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate w-full text-center">{label.replace(/ \(.*\)/, '')}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={form.required}
          onCheckedChange={(checked) => setForm((prev) => ({ ...prev, required: checked }))}
        />
        <Label>필수 응답</Label>
      </div>

      <div>
        <Label>질문 제목</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="질문을 입력하세요"
          maxLength={1000}
          required
        />
      </div>

      <div>
        <Label>설명 (선택)</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="질문에 대한 추가 설명"
          rows={2}
        />
      </div>

      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-3">타입별 설정</h4>
        <QuestionTypeConfig
          type={form.type}
          options={form.options}
          onChange={(options) => setForm((prev) => ({ ...prev, options }))}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          취소
        </Button>
        <Button type="submit" disabled={isLoading || !form.title.trim()}>
          {isLoading ? '저장 중...' : initialData ? '수정' : '추가'}
        </Button>
      </div>
    </form>
  );
}
