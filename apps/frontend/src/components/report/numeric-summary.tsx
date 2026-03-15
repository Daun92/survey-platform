'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { NumericAggregation } from '@survey/shared';

interface NumericSummaryProps {
  data: NumericAggregation;
}

export function NumericSummary({ data }: NumericSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '평균', value: data.average },
          { label: '중간값', value: data.median },
          { label: '최소', value: data.min },
          { label: '최대', value: data.max },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border p-3 text-center"
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {data.distribution.length > 0 && (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.distribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="value" />
            <YAxis allowDecimals={false} />
            <Tooltip
              formatter={(value) => [`${value}건`, '응답 수']}
            />
            <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
