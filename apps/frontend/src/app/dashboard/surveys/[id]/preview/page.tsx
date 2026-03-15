'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { QuestionPreview } from '@/components/survey-preview/question-preview';
import { ArrowLeft } from 'lucide-react';
import type { SurveyResponse, QuestionResponse } from '@survey/shared';

export default function SurveyPreviewPage() {
  const params = useParams();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<SurveyResponse | null>(null);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [surveyData, questionsData] = await Promise.all([
        api<SurveyResponse>(`/surveys/${surveyId}`),
        api<QuestionResponse[]>(`/surveys/${surveyId}/questions`),
      ]);
      setSurvey(surveyData);
      setQuestions(questionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="rounded-lg border bg-card p-6 space-y-2">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">{error ?? '설문을 찾을 수 없습니다.'}</p>
        <Link href="/dashboard/surveys">
          <Button variant="outline">설문 목록으로</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Link href={`/dashboard/surveys/${surveyId}/edit`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="text-sm text-muted-foreground">에디터로 돌아가기</span>
      </div>

      {/* Survey Header */}
      <div className="rounded-lg border bg-card p-6 space-y-2">
        <h1 className="text-2xl font-bold">{survey.title}</h1>
        {survey.description && (
          <p className="text-muted-foreground">{survey.description}</p>
        )}
        <p className="text-xs text-muted-foreground">
          * 표시는 필수 질문입니다
        </p>
      </div>

      {/* Questions */}
      {questions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">질문이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <QuestionPreview key={question.id} question={question} index={index} />
          ))}
        </div>
      )}

      {/* Submit Button (disabled preview) */}
      <div className="rounded-lg border bg-card p-6 text-center">
        <Button disabled size="lg">
          제출하기 (미리보기)
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          미리보기 모드에서는 제출할 수 없습니다.
        </p>
      </div>
    </div>
  );
}
