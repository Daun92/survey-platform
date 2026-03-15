'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { QuestionType } from '@survey/shared';
import type { QuestionResponse } from '@survey/shared';

interface QuestionPreviewProps {
  question: QuestionResponse;
  index: number;
}

export function QuestionPreview({ question, index }: QuestionPreviewProps) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <span className="text-sm font-medium text-muted-foreground">{index + 1}.</span>
          <div className="flex-1">
            <p className="font-medium">
              {question.title}
              {question.required && <span className="text-destructive ml-1">*</span>}
            </p>
            {question.description && (
              <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="pl-6">
        <QuestionInputPreview question={question} />
      </div>
    </div>
  );
}

function QuestionInputPreview({ question }: { question: QuestionResponse }) {
  switch (question.type) {
    case QuestionType.SHORT_TEXT:
      return (
        <Input
          placeholder={question.options.placeholder || '답변을 입력하세요'}
          disabled
          className="max-w-md"
        />
      );

    case QuestionType.LONG_TEXT:
      return (
        <Textarea
          placeholder={question.options.placeholder || '답변을 입력하세요'}
          rows={question.options.maxRows || 4}
          disabled
          className="max-w-lg"
        />
      );

    case QuestionType.RADIO:
      return (
        <div className="space-y-2">
          {(question.options.choices ?? []).map((choice) => (
            <label key={choice.id} className="flex items-center gap-3 cursor-pointer">
              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/50" />
              <span className="text-sm">{choice.label}</span>
            </label>
          ))}
        </div>
      );

    case QuestionType.CHECKBOX:
      return (
        <div className="space-y-2">
          {(question.options.choices ?? []).map((choice) => (
            <label key={choice.id} className="flex items-center gap-3 cursor-pointer">
              <div className="h-4 w-4 rounded-sm border-2 border-muted-foreground/50" />
              <span className="text-sm">{choice.label}</span>
            </label>
          ))}
        </div>
      );

    case QuestionType.DROPDOWN:
      return (
        <div className="max-w-xs rounded-md border px-3 py-2 text-sm text-muted-foreground">
          선택하세요...
        </div>
      );

    case QuestionType.LINEAR_SCALE: {
      const config = question.options.linearScale;
      if (!config) return null;
      const values = [];
      for (let i = config.min; i <= config.max; i += config.step) {
        values.push(i);
      }
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            {config.minLabel && (
              <span className="text-sm text-muted-foreground">{config.minLabel}</span>
            )}
            <div className="flex gap-2">
              {values.map((val) => (
                <div
                  key={val}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/50 flex items-center justify-center text-xs">
                    {val}
                  </div>
                </div>
              ))}
            </div>
            {config.maxLabel && (
              <span className="text-sm text-muted-foreground">{config.maxLabel}</span>
            )}
          </div>
        </div>
      );
    }

    case QuestionType.DATE:
      return (
        <Input
          type="date"
          disabled
          className="max-w-xs"
        />
      );

    case QuestionType.FILE_UPLOAD: {
      const fileConfig = question.options.fileUpload;
      return (
        <div className="space-y-2">
          <div className="rounded-lg border-2 border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              파일을 드래그하거나 클릭하여 업로드
            </p>
            {fileConfig && (
              <p className="text-xs text-muted-foreground mt-1">
                최대 {fileConfig.maxFileSize}MB, {fileConfig.maxFileCount}개
                {fileConfig.allowedTypes.length > 0 && ` (${fileConfig.allowedTypes.join(', ')})`}
              </p>
            )}
          </div>
        </div>
      );
    }

    case QuestionType.MATRIX: {
      const matrix = question.options.matrix;
      if (!matrix) return null;
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2" />
                {matrix.columns.map((col) => (
                  <th key={col.id} className="p-2 text-center font-normal text-muted-foreground">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-2">{row.label}</td>
                  {matrix.columns.map((col) => (
                    <td key={col.id} className="p-2 text-center">
                      {matrix.allowMultiple ? (
                        <div className="h-4 w-4 rounded-sm border-2 border-muted-foreground/50 mx-auto" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/50 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case QuestionType.RANKING: {
      const choices = question.options.choices ?? [];
      return (
        <div className="space-y-2 max-w-md">
          {choices.map((choice, i) => (
            <div
              key={choice.id}
              className="flex items-center gap-3 rounded-md border bg-muted/30 p-3"
            >
              <Badge variant="outline" className="text-xs shrink-0">
                {i + 1}
              </Badge>
              <span className="text-sm">{choice.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">드래그하여 순서 변경</span>
            </div>
          ))}
        </div>
      );
    }

    default:
      return <p className="text-sm text-muted-foreground">미지원 질문 타입</p>;
  }
}
