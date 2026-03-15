'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pencil, Trash2, GripVertical, Copy, MoreVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { QUESTION_TYPE_LABELS } from './question-form';
import { QuestionType } from '@survey/shared';
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

function getTypeBorderColor(type: QuestionType): string {
  switch (type) {
    case QuestionType.SHORT_TEXT:
    case QuestionType.LONG_TEXT:
      return 'border-l-blue-500';
    case QuestionType.RADIO:
    case QuestionType.CHECKBOX:
    case QuestionType.DROPDOWN:
      return 'border-l-green-500';
    case QuestionType.LINEAR_SCALE:
    case QuestionType.DATE:
      return 'border-l-amber-500';
    case QuestionType.FILE_UPLOAD:
    case QuestionType.MATRIX:
    case QuestionType.RANKING:
      return 'border-l-purple-500';
    default:
      return 'border-l-gray-400';
  }
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id, disabled: !isEditable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const choices = question.options?.choices;
  const linearScale = question.options?.linearScale;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-3 p-4 border rounded-lg bg-card hover:border-foreground/20 transition-colors border-l-4 ${getTypeBorderColor(question.type)}`}
    >
      <div className="flex flex-col items-center gap-0.5 pt-1">
        <button
          className={`touch-none ${isEditable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
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

        {/* Inline preview for choice questions */}
        {choices && choices.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {choices.slice(0, 3).map((choice) => (
              <span
                key={choice.id}
                className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
              >
                {choice.label}
              </span>
            ))}
            {choices.length > 3 && (
              <span className="text-xs text-muted-foreground px-1">
                +{choices.length - 3}개 더
              </span>
            )}
          </div>
        )}

        {/* Linear scale range preview */}
        {linearScale && (
          <p className="mt-2 text-xs text-muted-foreground">
            {linearScale.min}~{linearScale.max}점
            {linearScale.minLabel && ` (${linearScale.minLabel}`}
            {linearScale.minLabel && linearScale.maxLabel && ' ~ '}
            {!linearScale.minLabel && linearScale.maxLabel && ' ('}
            {linearScale.maxLabel && `${linearScale.maxLabel})`}
          </p>
        )}
      </div>

      {isEditable && (
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onMoveUp} disabled={index === 0}>
                <ChevronUp className="h-4 w-4 mr-2" />
                위로 이동
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onMoveDown} disabled={index === total - 1}>
                <ChevronDown className="h-4 w-4 mr-2" />
                아래로 이동
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                복제
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
