'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QUESTION_TYPE_LABELS } from './question-form';
import type { SurveyResponse, QuestionResponse } from '@survey/shared';

interface SurveyPreviewProps {
  survey: SurveyResponse;
  questions: QuestionResponse[];
  open: boolean;
  onClose: () => void;
}

export function SurveyPreview({ survey, questions, open, onClose }: SurveyPreviewProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[480px] sm:max-w-[480px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-0">
          <SheetTitle>설문 미리보기</SheetTitle>
          <p className="text-sm text-muted-foreground">모바일 화면 기준 미리보기</p>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-6 py-4">
            {/* Survey Header */}
            <div className="text-center space-y-2 pb-4">
              <h2 className="text-xl font-bold">{survey.title}</h2>
              {survey.description && (
                <p className="text-muted-foreground">{survey.description}</p>
              )}
              <Separator />
            </div>

            {/* Questions */}
            {questions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                아직 질문이 없습니다.
              </p>
            ) : (
              questions.map((question, index) => (
                <QuestionPreviewItem
                  key={question.id}
                  question={question}
                  index={index}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function QuestionPreviewItem({
  question,
  index,
}: {
  question: QuestionResponse;
  index: number;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {index + 1}.
          </span>
          <div className="flex-1">
            <p className="font-medium">
              {question.title}
              {question.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </p>
            {question.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {question.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="pl-6">
        <QuestionPreviewInput question={question} />
      </div>
    </div>
  );
}

function QuestionPreviewInput({ question }: { question: QuestionResponse }) {
  const { type, options } = question;

  switch (type) {
    case 'short_text':
      return (
        <Input
          placeholder={options.placeholder || '답변을 입력하세요'}
          disabled
          className="max-w-md"
        />
      );

    case 'long_text':
      return (
        <Textarea
          placeholder={options.placeholder || '답변을 입력하세요'}
          rows={options.maxRows ?? 4}
          disabled
          className="max-w-md"
        />
      );

    case 'radio':
      return (
        <div className="space-y-2">
          {(options.choices ?? []).map((choice) => (
            <label key={choice.id} className="flex items-center gap-2 cursor-default">
              <input
                type="radio"
                name={`preview-${question.id}`}
                disabled
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">{choice.label}</span>
            </label>
          ))}
        </div>
      );

    case 'checkbox':
      return (
        <div className="space-y-2">
          {(options.choices ?? []).map((choice) => (
            <label key={choice.id} className="flex items-center gap-2 cursor-default">
              <input
                type="checkbox"
                disabled
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">{choice.label}</span>
            </label>
          ))}
        </div>
      );

    case 'dropdown':
      return (
        <select
          disabled
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
                disabled
                className="h-9 w-9 rounded-md border text-sm font-medium hover:bg-accent disabled:opacity-70"
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
          disabled
          className="max-w-xs"
        />
      );

    case 'file_upload': {
      const upload = options.fileUpload ?? { maxFileSize: 10, maxFileCount: 1, allowedTypes: [] };
      return (
        <div className="rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
          <p>파일을 드래그하거나 클릭하여 업로드</p>
          <p className="mt-1 text-xs">
            최대 {upload.maxFileSize}MB, {upload.maxFileCount}개
            {upload.allowedTypes.length > 0 && ` (${upload.allowedTypes.join(', ')})`}
          </p>
        </div>
      );
    }

    case 'matrix': {
      const matrix = options.matrix ?? { rows: [], columns: [], allowMultiple: false };
      if (matrix.rows.length === 0 || matrix.columns.length === 0) {
        return <p className="text-sm text-muted-foreground">행/열 항목을 설정하세요.</p>;
      }
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
                        type={matrix.allowMultiple ? 'checkbox' : 'radio'}
                        name={`preview-matrix-${question.id}-${row.id}`}
                        disabled
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

    case 'ranking':
      return (
        <div className="space-y-1.5 max-w-md">
          {(options.choices ?? []).map((choice, i) => (
            <div
              key={choice.id}
              className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
            >
              <span className="font-medium text-muted-foreground">{i + 1}</span>
              <span>{choice.label}</span>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}
