'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react';
import type { QuestionOption } from '@survey/shared';

interface ChoiceEditorProps {
  choices: QuestionOption[];
  onChange: (choices: QuestionOption[]) => void;
  label?: string;
}

export function ChoiceEditor({ choices, onChange, label = '선택지' }: ChoiceEditorProps) {
  const addChoice = () => {
    const newChoice: QuestionOption = {
      id: crypto.randomUUID(),
      label: `선택지 ${choices.length + 1}`,
      value: `option_${choices.length + 1}`,
      order: choices.length,
    };
    onChange([...choices, newChoice]);
  };

  const updateChoice = (index: number, field: 'label' | 'value', val: string) => {
    const updated = choices.map((c, i) =>
      i === index ? { ...c, [field]: val } : c,
    );
    onChange(updated);
  };

  const removeChoice = (index: number) => {
    const updated = choices
      .filter((_, i) => i !== index)
      .map((c, i) => ({ ...c, order: i }));
    onChange(updated);
  };

  const moveChoice = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= choices.length) return;
    const updated = [...choices];
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    onChange(updated.map((c, i) => ({ ...c, order: i })));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {choices.map((choice, index) => (
        <div key={choice.id} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-6 text-center">{index + 1}</span>
          <Input
            value={choice.label}
            onChange={(e) => updateChoice(index, 'label', e.target.value)}
            placeholder="선택지 라벨"
            className="flex-1"
          />
          <Input
            value={choice.value}
            onChange={(e) => updateChoice(index, 'value', e.target.value)}
            placeholder="값"
            className="w-28"
          />
          <div className="flex gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => moveChoice(index, -1)}
              disabled={index === 0}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => moveChoice(index, 1)}
              disabled={index === choices.length - 1}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => removeChoice(index)}
              disabled={choices.length <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addChoice}>
        <Plus className="h-4 w-4 mr-1" />
        선택지 추가
      </Button>
    </div>
  );
}
