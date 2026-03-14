'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ChoiceEditor } from './choice-editor';
import type { QuestionType, QuestionOptions } from '@survey/shared';

interface QuestionTypeConfigProps {
  type: QuestionType;
  options: QuestionOptions;
  onChange: (options: QuestionOptions) => void;
}

export function QuestionTypeConfig({ type, options, onChange }: QuestionTypeConfigProps) {
  switch (type) {
    case 'short_text':
      return (
        <div className="space-y-3">
          <div>
            <Label>플레이스홀더</Label>
            <Input
              value={options.placeholder ?? ''}
              onChange={(e) => onChange({ ...options, placeholder: e.target.value })}
              placeholder="입력 안내 텍스트"
            />
          </div>
        </div>
      );

    case 'long_text':
      return (
        <div className="space-y-3">
          <div>
            <Label>플레이스홀더</Label>
            <Input
              value={options.placeholder ?? ''}
              onChange={(e) => onChange({ ...options, placeholder: e.target.value })}
              placeholder="입력 안내 텍스트"
            />
          </div>
          <div>
            <Label>최대 줄 수</Label>
            <Input
              type="number"
              value={options.maxRows ?? 5}
              onChange={(e) => onChange({ ...options, maxRows: Number(e.target.value) })}
              min={1}
              max={50}
            />
          </div>
        </div>
      );

    case 'radio':
    case 'checkbox':
    case 'dropdown':
    case 'ranking':
      return (
        <ChoiceEditor
          choices={options.choices ?? []}
          onChange={(choices) => onChange({ ...options, choices })}
        />
      );

    case 'linear_scale': {
      const scale = options.linearScale ?? { min: 1, max: 5, step: 1 };
      const updateScale = (patch: Record<string, unknown>) =>
        onChange({ ...options, linearScale: { ...scale, ...patch } });
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>최솟값</Label>
              <Input
                type="number"
                value={scale.min}
                onChange={(e) => updateScale({ min: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>최댓값</Label>
              <Input
                type="number"
                value={scale.max}
                onChange={(e) => updateScale({ max: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>단계</Label>
              <Input
                type="number"
                value={scale.step}
                onChange={(e) => updateScale({ step: Number(e.target.value) })}
                min={1}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>최솟값 라벨</Label>
              <Input
                value={scale.minLabel ?? ''}
                onChange={(e) => updateScale({ minLabel: e.target.value })}
                placeholder="예: 매우 불만족"
              />
            </div>
            <div>
              <Label>최댓값 라벨</Label>
              <Input
                value={scale.maxLabel ?? ''}
                onChange={(e) => updateScale({ maxLabel: e.target.value })}
                placeholder="예: 매우 만족"
              />
            </div>
          </div>
        </div>
      );
    }

    case 'matrix': {
      const matrix = options.matrix ?? { rows: [], columns: [], allowMultiple: false };
      return (
        <div className="space-y-4">
          <ChoiceEditor
            choices={matrix.rows}
            onChange={(rows) => onChange({ ...options, matrix: { ...matrix, rows } })}
            label="행 항목"
          />
          <ChoiceEditor
            choices={matrix.columns}
            onChange={(columns) => onChange({ ...options, matrix: { ...matrix, columns } })}
            label="열 항목"
          />
          <div className="flex items-center gap-2">
            <Switch
              checked={matrix.allowMultiple}
              onCheckedChange={(checked) =>
                onChange({ ...options, matrix: { ...matrix, allowMultiple: checked } })
              }
            />
            <Label>복수 선택 허용</Label>
          </div>
        </div>
      );
    }

    case 'file_upload': {
      const upload = options.fileUpload ?? { maxFileSize: 10, maxFileCount: 1, allowedTypes: [] };
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>최대 파일 크기 (MB)</Label>
              <Input
                type="number"
                value={upload.maxFileSize}
                onChange={(e) =>
                  onChange({
                    ...options,
                    fileUpload: { ...upload, maxFileSize: Number(e.target.value) },
                  })
                }
                min={1}
              />
            </div>
            <div>
              <Label>최대 파일 수</Label>
              <Input
                type="number"
                value={upload.maxFileCount}
                onChange={(e) =>
                  onChange({
                    ...options,
                    fileUpload: { ...upload, maxFileCount: Number(e.target.value) },
                  })
                }
                min={1}
                max={10}
              />
            </div>
          </div>
          <div>
            <Label>허용 파일 형식 (쉼표 구분)</Label>
            <Input
              value={upload.allowedTypes.join(', ')}
              onChange={(e) =>
                onChange({
                  ...options,
                  fileUpload: {
                    ...upload,
                    allowedTypes: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                  },
                })
              }
              placeholder="예: .pdf, .jpg, .png"
            />
          </div>
        </div>
      );
    }

    case 'date':
      return (
        <p className="text-sm text-muted-foreground">
          날짜 선택 필드입니다. 추가 설정이 필요하지 않습니다.
        </p>
      );

    default:
      return null;
  }
}
