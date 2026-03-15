'use client';

import type { TextAggregation } from '@survey/shared';

interface TextResponsesProps {
  data: TextAggregation;
}

export function TextResponses({ data }: TextResponsesProps) {
  if (data.responses.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">텍스트 응답이 없습니다.</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        전체 {data.totalCount}건 중 최근 {data.responses.length}건
      </p>
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {data.responses.map((text, i) => (
          <div
            key={i}
            className="rounded border bg-muted/30 px-3 py-2 text-sm"
          >
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}
