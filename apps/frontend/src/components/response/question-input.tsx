'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { QuestionResponse, AnswerValue } from '@survey/shared';

interface QuestionInputProps {
  question: QuestionResponse;
  value: AnswerValue['value'];
  onChange: (value: AnswerValue['value']) => void;
}

export function QuestionInput({ question, value, onChange }: QuestionInputProps) {
  const { type, options } = question;

  switch (type) {
    case 'short_text':
      return (
        <Input
          placeholder={options.placeholder || '답변을 입력하세요'}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-md"
        />
      );

    case 'long_text':
      return (
        <Textarea
          placeholder={options.placeholder || '답변을 입력하세요'}
          rows={options.maxRows ?? 4}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-md"
        />
      );

    case 'radio':
      return (
        <div className="space-y-2">
          {(options.choices ?? []).map((choice) => (
            <label
              key={choice.id}
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => onChange(choice.value)}
            >
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={value === choice.value}
                onChange={() => onChange(choice.value)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">{choice.label}</span>
            </label>
          ))}
        </div>
      );

    case 'checkbox': {
      const selected = (value as string[]) ?? [];
      const toggle = (v: string) => {
        if (selected.includes(v)) {
          onChange(selected.filter((s) => s !== v));
        } else {
          onChange([...selected, v]);
        }
      };
      return (
        <div className="space-y-2">
          {(options.choices ?? []).map((choice) => (
            <label
              key={choice.id}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(choice.value)}
                onChange={() => toggle(choice.value)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">{choice.label}</span>
            </label>
          ))}
        </div>
      );
    }

    case 'dropdown':
      return (
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">선택해주세요</option>
          {(options.choices ?? []).map((choice) => (
            <option key={choice.id} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      );

    case 'linear_scale': {
      const scale = options.linearScale ?? { min: 1, max: 5, step: 1 };
      const values: number[] = [];
      for (let i = scale.min; i <= scale.max; i += scale.step) {
        values.push(i);
      }
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-1 flex-wrap">
            {values.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange(v)}
                className={`h-9 w-9 rounded-md border text-sm font-medium transition-colors ${
                  value === v
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:bg-accent'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          {(scale.minLabel || scale.maxLabel) && (
            <div className="flex justify-between text-xs text-muted-foreground max-w-xs">
              <span>{scale.minLabel}</span>
              <span>{scale.maxLabel}</span>
            </div>
          )}
        </div>
      );
    }

    case 'date':
      return (
        <Input
          type="date"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-xs"
        />
      );

    case 'file_upload':
      return (
        <div className="rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
          <p>파일 업로드는 추후 지원 예정입니다</p>
        </div>
      );

    case 'matrix': {
      const matrix = options.matrix ?? { rows: [], columns: [], allowMultiple: false };
      if (matrix.rows.length === 0 || matrix.columns.length === 0) {
        return <p className="text-sm text-muted-foreground">행/열 항목이 설정되지 않았습니다.</p>;
      }
      const matrixValue = (value as Record<string, string>) ?? {};
      return (
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse">
            <thead>
              <tr>
                <th className="p-2" />
                {matrix.columns.map((col) => (
                  <th key={col.id} className="p-2 text-center font-medium">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-2 font-medium">{row.label}</td>
                  {matrix.columns.map((col) => (
                    <td key={col.id} className="p-2 text-center">
                      <input
                        type="radio"
                        name={`matrix-${question.id}-${row.id}`}
                        checked={matrixValue[row.value] === col.value}
                        onChange={() =>
                          onChange({ ...matrixValue, [row.value]: col.value })
                        }
                        className="h-4 w-4"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'ranking': {
      const items = (value as string[]) ?? [];
      const choices = options.choices ?? [];
      const labelMap = new Map(choices.map((c) => [c.value, c.label]));

      const moveUp = (index: number) => {
        if (index === 0) return;
        const newItems = [...items];
        [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
        onChange(newItems);
      };

      const moveDown = (index: number) => {
        if (index === items.length - 1) return;
        const newItems = [...items];
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        onChange(newItems);
      };

      return (
        <div className="space-y-1.5 max-w-md">
          {items.map((item, i) => (
            <div
              key={item}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <span className="font-medium text-muted-foreground w-6">{i + 1}</span>
              <span className="flex-1">{labelMap.get(item) ?? item}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={i === 0}
                onClick={() => moveUp(i)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={i === items.length - 1}
                onClick={() => moveDown(i)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}
