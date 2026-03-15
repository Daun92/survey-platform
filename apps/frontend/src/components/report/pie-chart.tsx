'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ChoiceAggregation } from '@survey/shared';

const COLORS = [
  '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444',
  '#f59e0b', '#06b6d4', '#ec4899', '#6366f1', '#14b8a6',
];

interface PieChartViewProps {
  data: ChoiceAggregation;
}

export function PieChartView({ data }: PieChartViewProps) {
  const chartData = data.options
    .filter((opt) => opt.count > 0)
    .map((opt) => ({
      name: opt.label,
      value: opt.count,
      percentage: opt.percentage,
    }));

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">데이터가 없습니다.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(1)}%)`}
          labelLine={{ strokeWidth: 1 }}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${value}건`, '응답 수']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
