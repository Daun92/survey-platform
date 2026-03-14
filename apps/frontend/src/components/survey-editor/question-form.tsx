'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QuestionTypeConfig } from './question-type-config';
import { QuestionType } from '@survey/shared';
import type { QuestionOptions, ValidationRule, QuestionResponse } from '@survey/shared';

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

export function QuestionForm({ initialData, onSubmit, onCancel, isLoading }: QuestionFormProps) {
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
    return {
      type: QuestionType.SHORT_TEXT,
      title: '',
      description: '',
      required: false,
      options: {},
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>질문 유형</Label>
          <Select
            value={form.type}
            onValueChange={(v) => handleTypeChange(v as QuestionType)}
            disabled={!!initialData}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2 pb-0.5">
          <Switch
            checked={form.required}
            onCheckedChange={(checked) => setForm((prev) => ({ ...prev, required: checked }))}
          />
          <Label>필수 응답</Label>
        </div>
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
