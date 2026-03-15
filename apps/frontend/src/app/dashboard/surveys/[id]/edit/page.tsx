'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { SurveyPreview } from '@/components/survey-editor/survey-preview';
import { ArrowLeft, Plus, Eye, Send, Square, Share2, BarChart3, PieChart } from 'lucide-react';
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

  // Preview
  const [showPreview, setShowPreview] = useState(false);

  // Inline editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Publish/Close confirmation
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [closeConfirm, setCloseConfirm] = useState(false);

  const isDraft = survey?.status === SurveyStatus.DRAFT;
  const isActive = survey?.status === SurveyStatus.ACTIVE;

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

  // Inline title editing
  const startEditingTitle = () => {
    if (!isDraft || !survey) return;
    setTitleDraft(survey.title);
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const saveTitle = async () => {
    if (!survey || !titleDraft.trim()) {
      setEditingTitle(false);
      return;
    }
    if (titleDraft.trim() === survey.title) {
      setEditingTitle(false);
      return;
    }
    try {
      const updated = await api<SurveyResponse>(`/surveys/${surveyId}`, {
        method: 'PUT',
        body: { title: titleDraft.trim() },
      });
      setSurvey(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : '제목 저장 실패');
    }
    setEditingTitle(false);
  };

  // Inline description editing
  const startEditingDescription = () => {
    if (!isDraft || !survey) return;
    setDescriptionDraft(survey.description ?? '');
    setEditingDescription(true);
    setTimeout(() => descriptionRef.current?.focus(), 0);
  };

  const saveDescription = async () => {
    if (!survey) {
      setEditingDescription(false);
      return;
    }
    const newDesc = descriptionDraft.trim();
    if (newDesc === (survey.description ?? '')) {
      setEditingDescription(false);
      return;
    }
    try {
      const updated = await api<SurveyResponse>(`/surveys/${surveyId}`, {
        method: 'PUT',
        body: { description: newDesc || '' },
      });
      setSurvey(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : '설명 저장 실패');
    }
    setEditingDescription(false);
  };

  // Publish / Close
  const handlePublish = async () => {
    try {
      const updated = await api<SurveyResponse>(`/surveys/${surveyId}/publish`, {
        method: 'PATCH',
      });
      setSurvey(updated);
      setPublishConfirm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : '발행 실패');
      setPublishConfirm(false);
    }
  };

  const handleClose = async () => {
    try {
      const updated = await api<SurveyResponse>(`/surveys/${surveyId}/close`, {
        method: 'PATCH',
      });
      setSurvey(updated);
      setCloseConfirm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : '마감 실패');
      setCloseConfirm(false);
    }
  };

  // Question handlers
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

  const handleDuplicateQuestion = async (questionId: string) => {
    try {
      await api<QuestionResponse>(
        `/surveys/${surveyId}/questions/${questionId}/duplicate`,
        { method: 'POST' },
      );
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '질문 복제 실패');
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {editingTitle ? (
              <Input
                ref={titleInputRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTitle();
                  if (e.key === 'Escape') setEditingTitle(false);
                }}
                className="text-2xl font-bold h-auto py-0 px-1"
                maxLength={200}
              />
            ) : (
              <h1
                className={`text-2xl font-bold truncate ${isDraft ? 'cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1' : ''}`}
                onClick={startEditingTitle}
                title={isDraft ? '클릭하여 편집' : undefined}
              >
                {survey.title}
              </h1>
            )}
            <Badge variant={isDraft ? 'secondary' : 'outline'}>
              {STATUS_LABELS[survey.status]}
            </Badge>
          </div>
          {editingDescription ? (
            <Textarea
              ref={descriptionRef}
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              onBlur={saveDescription}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setEditingDescription(false);
              }}
              className="mt-1 text-sm"
              rows={2}
              placeholder="설문 설명을 입력하세요"
            />
          ) : (
            <p
              className={`text-muted-foreground mt-1 ${isDraft ? 'cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1' : ''}`}
              onClick={startEditingDescription}
              title={isDraft ? '클릭하여 편집' : undefined}
            >
              {survey.description || (isDraft ? '설명을 추가하세요...' : '')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-muted-foreground">
            질문 {questions.length}개
          </span>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-1" />
            미리보기
          </Button>
          {isDraft && (
            <Button size="sm" onClick={() => setPublishConfirm(true)}>
              <Send className="h-4 w-4 mr-1" />
              발행
            </Button>
          )}
          {(isActive || survey.status === 'closed') && (
            <Link href={`/dashboard/surveys/${surveyId}/distribute`}>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-1" />
                배포
              </Button>
            </Link>
          )}
          {(isActive || survey.status === 'closed') && (
            <Link href={`/dashboard/surveys/${surveyId}/responses`}>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-1" />
                응답
              </Button>
            </Link>
          )}
          {(isActive || survey.status === 'closed') && (
            <Link href={`/dashboard/surveys/${surveyId}/report`}>
              <Button variant="outline" size="sm">
                <PieChart className="h-4 w-4 mr-1" />
                리포트
              </Button>
            </Link>
          )}
          {isActive && (
            <Button variant="secondary" size="sm" onClick={() => setCloseConfirm(true)}>
              <Square className="h-4 w-4 mr-1" />
              마감
            </Button>
          )}
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
                onDuplicate={() => handleDuplicateQuestion(question.id)}
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

      {/* Preview Dialog */}
      <SurveyPreview
        survey={survey}
        questions={questions}
        open={showPreview}
        onClose={() => setShowPreview(false)}
      />

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

      {/* Publish Confirmation */}
      <AlertDialog open={publishConfirm} onOpenChange={setPublishConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>설문 발행</AlertDialogTitle>
            <AlertDialogDescription>
              이 설문을 발행하시겠습니까? 발행 후에는 질문을 수정할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish}>발행</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Confirmation */}
      <AlertDialog open={closeConfirm} onOpenChange={setCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>설문 마감</AlertDialogTitle>
            <AlertDialogDescription>
              이 설문을 마감하시겠습니까? 마감 후에는 더 이상 응답을 받을 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose}>마감</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
