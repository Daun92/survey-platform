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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { QuestionCard } from '@/components/survey-editor/question-card';
import { QuestionForm } from '@/components/survey-editor/question-form';
import { ArrowLeft, Plus, Eye, ChevronDown } from 'lucide-react';
import { SurveyStatus } from '@survey/shared';
import type { SurveyResponse, QuestionResponse, QuestionType, QuestionOptions, ValidationRule } from '@survey/shared';

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

const STATUS_FLOW: Record<SurveyStatus, SurveyStatus | null> = {
  [SurveyStatus.DRAFT]: SurveyStatus.ACTIVE,
  [SurveyStatus.ACTIVE]: SurveyStatus.CLOSED,
  [SurveyStatus.CLOSED]: SurveyStatus.ARCHIVED,
  [SurveyStatus.ARCHIVED]: null,
};

const STATUS_ACTION_LABELS: Record<SurveyStatus, string> = {
  [SurveyStatus.DRAFT]: '발행하기',
  [SurveyStatus.ACTIVE]: '마감하기',
  [SurveyStatus.CLOSED]: '보관하기',
  [SurveyStatus.ARCHIVED]: '',
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

  // Status change
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<SurveyStatus | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);

  // Inline editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

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

  // Focus inputs when entering edit mode
  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);
  useEffect(() => {
    if (editingDescription) descriptionInputRef.current?.focus();
  }, [editingDescription]);

  // --- Inline editing handlers ---
  const startEditTitle = () => {
    if (!isDraft || !survey) return;
    setTitleDraft(survey.title);
    setEditingTitle(true);
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

  const startEditDescription = () => {
    if (!isDraft || !survey) return;
    setDescriptionDraft(survey.description ?? '');
    setEditingDescription(true);
  };

  const saveDescription = async () => {
    if (!survey) {
      setEditingDescription(false);
      return;
    }
    const newDesc = descriptionDraft.trim() || null;
    if (newDesc === (survey.description ?? null)) {
      setEditingDescription(false);
      return;
    }
    try {
      const updated = await api<SurveyResponse>(`/surveys/${surveyId}`, {
        method: 'PUT',
        body: { description: newDesc ?? undefined },
      });
      setSurvey(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : '설명 저장 실패');
    }
    setEditingDescription(false);
  };

  // --- Status change handlers ---
  const handleStatusChange = (newStatus: SurveyStatus) => {
    if (newStatus === SurveyStatus.ACTIVE) {
      setPendingStatus(newStatus);
      setStatusDialogOpen(true);
    } else {
      confirmStatusChange(newStatus);
    }
  };

  const confirmStatusChange = async (status?: SurveyStatus) => {
    const targetStatus = status ?? pendingStatus;
    if (!targetStatus) return;
    setChangingStatus(true);
    try {
      const updated = await api<SurveyResponse>(`/surveys/${surveyId}/status`, {
        method: 'PATCH',
        body: { status: targetStatus },
      });
      setSurvey(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : '상태 변경 실패');
    } finally {
      setChangingStatus(false);
      setStatusDialogOpen(false);
      setPendingStatus(null);
    }
  };

  // --- Question handlers ---
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

  const handleDuplicateQuestion = async (question: QuestionResponse) => {
    setSaving(true);
    try {
      const created = await api<QuestionResponse>(`/surveys/${surveyId}/questions`, {
        method: 'POST',
        body: {
          type: question.type,
          title: `${question.title} (복사)`,
          description: question.description || undefined,
          required: question.required,
          options: question.options,
          validation: question.validation,
        },
      });
      setQuestions((prev) => [...prev, created]);
    } catch (err) {
      alert(err instanceof Error ? err.message : '질문 복제 실패');
    } finally {
      setSaving(false);
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

  const nextStatus = STATUS_FLOW[survey.status];

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
            {/* Inline Title Editing */}
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
                className="text-2xl font-bold h-auto py-0 px-1 border-primary"
                maxLength={200}
              />
            ) : (
              <h1
                className={`text-2xl font-bold truncate ${isDraft ? 'cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1' : ''}`}
                onClick={startEditTitle}
                title={isDraft ? '클릭하여 편집' : undefined}
              >
                {survey.title}
              </h1>
            )}

            {/* Status Badge + Dropdown */}
            {nextStatus ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-1 cursor-pointer">
                    <Badge variant={STATUS_VARIANTS[survey.status]}>
                      {STATUS_LABELS[survey.status]}
                    </Badge>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(nextStatus)}
                    disabled={changingStatus}
                  >
                    {STATUS_ACTION_LABELS[survey.status]} → {STATUS_LABELS[nextStatus]}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Badge variant={STATUS_VARIANTS[survey.status]}>
                {STATUS_LABELS[survey.status]}
              </Badge>
            )}
          </div>

          {/* Inline Description Editing */}
          {editingDescription ? (
            <Textarea
              ref={descriptionInputRef}
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              onBlur={saveDescription}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setEditingDescription(false);
              }}
              className="mt-1 text-sm border-primary"
              rows={2}
              placeholder="설문 설명 입력"
            />
          ) : (
            <p
              className={`text-muted-foreground mt-1 text-sm ${isDraft ? 'cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1' : ''}`}
              onClick={startEditDescription}
              title={isDraft ? '클릭하여 편집' : undefined}
            >
              {survey.description || (isDraft ? '설문 설명을 추가하세요...' : '')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/dashboard/surveys/${surveyId}/preview`} target="_blank">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              미리보기
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">
            질문 {questions.length}개
          </span>
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
                onDuplicate={() => handleDuplicateQuestion(question)}
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

      {/* Status Change Confirmation (ACTIVE) */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>설문 발행</AlertDialogTitle>
            <AlertDialogDescription>
              설문을 발행하시겠습니까? 발행 후에는 질문을 수정할 수 없습니다.
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changingStatus}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmStatusChange()}
              disabled={changingStatus}
            >
              {changingStatus ? '변경 중...' : '발행'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
