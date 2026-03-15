'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SurveyEditorTabs } from '@/components/survey-editor/survey-editor-tabs';
import { ArrowLeft } from 'lucide-react';
import { SurveyStatus } from '@survey/shared';
import type { SurveyResponse } from '@survey/shared';

const STATUS_LABELS: Record<SurveyStatus, string> = {
  [SurveyStatus.DRAFT]: '초안',
  [SurveyStatus.ACTIVE]: '진행 중',
  [SurveyStatus.CLOSED]: '마감',
  [SurveyStatus.ARCHIVED]: '보관',
};

const STATUS_VARIANTS: Record<SurveyStatus, 'secondary' | 'default' | 'outline' | 'destructive'> = {
  [SurveyStatus.DRAFT]: 'secondary',
  [SurveyStatus.ACTIVE]: 'default',
  [SurveyStatus.CLOSED]: 'outline',
  [SurveyStatus.ARCHIVED]: 'destructive',
};

export default function SurveyDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<SurveyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<SurveyResponse>(`/surveys/${surveyId}`)
      .then(setSurvey)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [surveyId]);

  return (
    <div className="space-y-4">
      {/* Common Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/surveys">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-1">
              <Skeleton className="h-7 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : survey ? (
            <>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold truncate">{survey.title}</h1>
                <Badge variant={STATUS_VARIANTS[survey.status]}>
                  {STATUS_LABELS[survey.status]}
                </Badge>
              </div>
              {survey.description && (
                <p className="text-sm text-muted-foreground truncate">{survey.description}</p>
              )}
            </>
          ) : (
            <h1 className="text-2xl font-bold text-destructive">설문을 찾을 수 없습니다</h1>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <SurveyEditorTabs surveyId={surveyId} />

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
