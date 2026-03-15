'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Users } from 'lucide-react';
import { QuestionReportCard } from '@/components/report/question-report-card';
import type { SurveyReportResponse } from '@survey/shared';

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: surveyId } = use(params);
  const [report, setReport] = useState<SurveyReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<SurveyReportResponse>(`/surveys/${surveyId}/report`)
      .then(setReport)
      .catch((err) => setError(err instanceof Error ? err.message : '리포트 로드 실패'))
      .finally(() => setLoading(false));
  }, [surveyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">리포트를 생성하는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/surveys/${surveyId}/edit`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">리포트</h1>
          <p className="text-muted-foreground">{report.surveyTitle}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">총 응답: {report.totalResponses}건</span>
        </div>
      </div>

      {/* Report Content */}
      {report.totalResponses === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              아직 완료된 응답이 없습니다. 응답이 수집되면 리포트가 표시됩니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {report.aggregations.map((agg, i) => (
            <QuestionReportCard key={agg.questionId} aggregation={agg} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
