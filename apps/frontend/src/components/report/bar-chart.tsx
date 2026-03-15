'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ChoiceAggregation } from '@survey/shared';

const COLORS = [
  '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444',
  '#f59e0b', '#06b6d4', '#ec4899', '#6366f1', '#14b8a6',
];

interface BarChartViewProps {
  data: ChoiceAggregation;
}

export function BarChartView({ data }: BarChartViewProps) {
  const chartData = data.options.map((opt) => ({
    name: opt.label,
    count: opt.count,
    percentage: opt.percentage,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 40)}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) => [`${value}건`, '응답 수']}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
