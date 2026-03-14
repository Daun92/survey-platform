'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { QuestionCard } from '@/components/survey-editor/question-card';
import { QuestionForm } from '@/components/survey-editor/question-form';
import { ArrowLeft, Plus } from 'lucide-react';
import { SurveyStatus } from '@survey/shared';
import type { SurveyResponse, QuestionResponse, QuestionType, QuestionOptions, ValidationRule } from '@survey/shared';

const STATUS_LABELS: Record<SurveyStatus, string> = {
  [SurveyStatus.DRAFT]: '초안',
  [SurveyStatus.ACTIVE]: '진행 중',
  [SurveyStatus.CLOSED]: '마감',
  [SurveyStatus.ARCHIVED]: '보관',
};

export default function SurveyEditorPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<SurveyResponse | null>(null);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuestionResponse | null>(null);

  const isDraft = survey?.status === SurveyStatus.DRAFT;

  const loadData = useCallback(async () => {
    try {
      const [surveyData, questionsData] = await Promise.all([
        api<SurveyResponse>(`/surveys/${surveyId}`),
        api<QuestionResponse[]>(`/surveys/${surveyId}/questions`),
      ]);
      setSurvey(surveyData);
      setQuestions(questionsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddQuestion = async (data: {
    type: QuestionType;
    title: string;
    description: string;
    required: boolean;
    options: QuestionOptions;
    validation: Partial<ValidationRule>;
  }) => {
    setSaving(true);
    try {
      const created = await api<QuestionResponse>(`/surveys/${surveyId}/questions`, {
        method: 'POST',
        body: {
          type: data.type,
          title: data.title,
          description: data.description || undefined,
          required: data.required,
          options: data.options,
          validation: data.validation,
        },
      });
      setQuestions((prev) => [...prev, created]);
      setIsAdding(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : '질문 추가 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateQuestion = async (
    questionId: string,
    data: {
      type: QuestionType;
      title: string;
      description: string;
      required: boolean;
      options: QuestionOptions;
      validation: Partial<ValidationRule>;
    },
  ) => {
    setSaving(true);
    try {
      const updated = await api<QuestionResponse>(
        `/surveys/${surveyId}/questions/${questionId}`,
        {
          method: 'PUT',
          body: {
            title: data.title,
            description: data.description || undefined,
            required: data.required,
            options: data.options,
            validation: data.validation,
          },
        },
      );
      setQuestions((prev) => prev.map((q) => (q.id === questionId ? updated : q)));
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '질문 수정 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteTarget) return;
    try {
      await api(`/surveys/${surveyId}/questions/${deleteTarget.id}`, { method: 'DELETE' });
      setQuestions((prev) => prev.filter((q) => q.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '질문 삭제 실패');
    }
  };

  const handleReorder = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const updated = [...questions];
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    const questionOrders = updated.map((q, i) => ({ id: q.id, order: i }));

    setQuestions(updated);
    try {
      await api(`/surveys/${surveyId}/questions/reorder`, {
        method: 'PATCH',
        body: { questionOrders },
      });
    } catch (err) {
      await loadData();
      alert(err instanceof Error ? err.message : '순서 변경 실패');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">{error ?? '설문을 찾을 수 없습니다.'}</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/surveys')}>
          설문 목록으로
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/surveys">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{survey.title}</h1>
            <Badge variant={isDraft ? 'secondary' : 'outline'}>
              {STATUS_LABELS[survey.status]}
            </Badge>
          </div>
          {survey.description && (
            <p className="text-muted-foreground mt-1">{survey.description}</p>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          질문 {questions.length}개
        </div>
      </div>

      {!isDraft && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 text-sm">
          이 설문은 <strong>{STATUS_LABELS[survey.status]}</strong> 상태입니다.
          질문을 수정하려면 초안(draft) 상태여야 합니다.
        </div>
      )}

      {/* Question List */}
      <div className="space-y-3">
        {questions.length === 0 && !isAdding ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground mb-3">아직 질문이 없습니다.</p>
            {isDraft && (
              <Button onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4 mr-1" />
                첫 질문 추가
              </Button>
            )}
          </div>
        ) : (
          questions.map((question, index) =>
            editingId === question.id ? (
              <QuestionForm
                key={question.id}
                initialData={question}
                onSubmit={(data) => handleUpdateQuestion(question.id, data)}
                onCancel={() => setEditingId(null)}
                isLoading={saving}
              />
            ) : (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                total={questions.length}
                isEditable={isDraft}
                onEdit={() => {
                  setEditingId(question.id);
                  setIsAdding(false);
                }}
                onDelete={() => setDeleteTarget(question)}
                onMoveUp={() => handleReorder(index, -1)}
                onMoveDown={() => handleReorder(index, 1)}
              />
            ),
          )
        )}

        {/* Add Question */}
        {isAdding ? (
          <QuestionForm
            onSubmit={handleAddQuestion}
            onCancel={() => setIsAdding(false)}
            isLoading={saving}
          />
        ) : (
          isDraft &&
          questions.length > 0 && (
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => {
                setIsAdding(true);
                setEditingId(null);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              질문 추가
            </Button>
          )
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>질문 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.title}&quot; 질문을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuestion}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
