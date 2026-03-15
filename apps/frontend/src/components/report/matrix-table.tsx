'use client';

import type { MatrixAggregation } from '@survey/shared';

interface MatrixTableProps {
  data: MatrixAggregation;
}

export function MatrixTable({ data }: MatrixTableProps) {
  if (data.rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">매트릭스 데이터가 없습니다.</p>;
  }

  const columns = data.rows[0]?.columns ?? [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-2 font-medium" />
            {columns.map((col) => (
              <th key={col.label} className="text-center p-2 font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.label} className="border-b last:border-0">
              <td className="p-2 font-medium">{row.label}</td>
              {row.columns.map((col) => (
                <td key={col.label} className="text-center p-2">
                  <span className="font-medium">{col.count}</span>
                  <span className="text-muted-foreground text-xs ml-1">
                    ({col.percentage}%)
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
