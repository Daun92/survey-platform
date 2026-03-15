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
import type { RankingAggregation } from '@survey/shared';

interface RankingChartProps {
  data: RankingAggregation;
}

export function RankingChart({ data }: RankingChartProps) {
  if (data.items.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">순위 데이터가 없습니다.</p>;
  }

  const chartData = [...data.items]
    .sort((a, b) => a.averageRank - b.averageRank)
    .map((item) => ({
      name: item.label,
      avgRank: item.averageRank,
    }));

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 40)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 'auto']} label={{ value: '평균 순위', position: 'bottom', offset: 0 }} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => [`${value}위`, '평균 순위']} />
          <Bar dataKey="avgRank" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground text-center">
        * 순위가 낮을수록(1에 가까울수록) 더 선호됨
      </p>
    </div>
  );
}
