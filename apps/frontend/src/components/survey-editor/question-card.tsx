'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, Pencil, Trash2, GripVertical, Copy } from 'lucide-react';
import { QUESTION_TYPE_LABELS } from './question-form';
import type { QuestionResponse } from '@survey/shared';

interface QuestionCardProps {
  question: QuestionResponse;
  index: number;
  total: number;
  isEditable: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function QuestionCard({
  question,
  index,
  total,
  isEditable,
  onEdit,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: QuestionCardProps) {
  return (
    <div className="flex items-start gap-3 p-4 border rounded-lg bg-card hover:border-foreground/20 transition-colors">
      <div className="flex flex-col items-center gap-0.5 pt-1">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">{index + 1}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary" className="text-xs">
            {QUESTION_TYPE_LABELS[question.type] ?? question.type}
          </Badge>
          {question.required && (
            <Badge variant="destructive" className="text-xs">
              필수
            </Badge>
          )}
        </div>
        <p className="font-medium truncate">{question.title}</p>
        {question.description && (
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{question.description}</p>
        )}
      </div>

      {isEditable && (
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onMoveUp}
            disabled={index === 0}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onMoveDown}
            disabled={index === total - 1}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
