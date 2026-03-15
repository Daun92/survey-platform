'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
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
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { QuestionCard } from '@/components/survey-editor/question-card';
import { QuestionForm } from '@/components/survey-editor/question-form';
import { SurveyPreview } from '@/components/survey-editor/survey-preview';
import { EmptyState } from '@/components/survey-editor/empty-state';
import { AiChatPanel } from '@/components/ai-chat/ai-chat-panel';
import { Plus, Eye, Send, Square, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { SurveyStatus, QuestionType } from '@survey/shared';
import type { SurveyResponse, QuestionResponse, QuestionOptions, ValidationRule, TemplateQuestion } from '@survey/shared';

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
  const [defaultType, setDefaultType] = useState<QuestionType | undefined>();
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuestionResponse | null>(null);

  // Preview
  const [showPreview, setShowPreview] = useState(false);

  // AI Chat
  const [showAiChat, setShowAiChat] = useState(false);

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
      toast.success('제목이 저장되었습니다');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '제목 저장 실패');
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
      toast.success('설명이 저장되었습니다');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '설명 저장 실패');
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
      toast.success('설문이 발행되었습니다');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '발행 실패');
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
      toast.success('설문이 마감되었습니다');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '마감 실패');
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
      setDefaultType(undefined);
      toast.success('질문이 추가되었습니다');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '질문 추가 실패');
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
      toast.success('질문이 수정되었습니다');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '질문 수정 실패');
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
      toast.success('질문이 삭제되었습니다');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '질문 삭제 실패');
    }
  };

  const handleDuplicateQuestion = async (questionId: string) => {
    try {
      await api<QuestionResponse>(
        `/surveys/${surveyId}/questions/${questionId}/duplicate`,
        { method: 'POST' },
      );
      await loadData();
      toast.success('질문이 복제되었습니다');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '질문 복제 실패');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const updated = arrayMove(questions, oldIndex, newIndex);
    const questionOrders = updated.map((q, i) => ({ id: q.id, order: i }));

    setQuestions(updated);
    try {
      await api(`/surveys/${surveyId}/questions/reorder`, {
        method: 'PATCH',
        body: { questionOrders },
      });
    } catch (err) {
      await loadData();
      toast.error(err instanceof Error ? err.message : '순서 변경 실패');
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
      toast.error(err instanceof Error ? err.message : '순서 변경 실패');
    }
  };

  // Empty state handlers
  const handleQuickAdd = (type: QuestionType) => {
    setDefaultType(type);
    setIsAdding(true);
    setEditingId(null);
  };

  const handlePresetSelect = async (presetQuestions: TemplateQuestion[]) => {
    try {
      const payload = presetQuestions.map((q, i) => ({
        type: q.type,
        title: q.title,
        description: q.description,
        required: q.required,
        order: questions.length + i,
        options: q.options,
        validation: q.validation,
      }));
      await api(`/surveys/${surveyId}/questions/bulk`, {
        method: 'POST',
        body: { questions: payload },
      });
      await loadData();
      toast.success(`${presetQuestions.length}개 질문이 추가되었습니다`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '프리셋 추가 실패');
    }
  };

  // AI questions generated callback
  const handleAiQuestionsGenerated = async (generatedQuestions: TemplateQuestion[]) => {
    try {
      const payload = generatedQuestions.map((q, i) => ({
        type: q.type,
        title: q.title,
        description: q.description,
        required: q.required,
        order: questions.length + i,
        options: q.options,
        validation: q.validation,
      }));
      await api(`/surveys/${surveyId}/questions/bulk`, {
        method: 'POST',
        body: { questions: payload },
      });
      await loadData();
      toast.success(`${generatedQuestions.length}개 질문이 AI로 생성되었습니다`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI 질문 추가 실패');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-4 border rounded-lg">
              <Skeleton className="h-6 w-6" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
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
      {/* Inline Title/Description Editing + Actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1">
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
              className="text-lg font-semibold h-auto py-1 px-2"
              maxLength={200}
            />
          ) : (
            <h2
              className={`text-lg font-semibold ${isDraft ? 'cursor-pointer hover:bg-accent/50 rounded px-2 -mx-2 py-1' : ''}`}
              onClick={startEditingTitle}
              title={isDraft ? '클릭하여 제목 편집' : undefined}
            >
              {survey.title}
            </h2>
          )}
          {editingDescription ? (
            <Textarea
              ref={descriptionRef}
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              onBlur={saveDescription}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setEditingDescription(false);
              }}
              className="text-sm"
              rows={2}
              placeholder="설문 설명을 입력하세요"
            />
          ) : (
            <p
              className={`text-sm text-muted-foreground ${isDraft ? 'cursor-pointer hover:bg-accent/50 rounded px-2 -mx-2 py-0.5' : ''}`}
              onClick={startEditingDescription}
              title={isDraft ? '클릭하여 설명 편집' : undefined}
            >
              {survey.description || (isDraft ? '설명을 추가하세요...' : '')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-muted-foreground">
            질문 {questions.length}개
          </span>
          {isDraft && (
            <Button variant="outline" size="sm" onClick={() => setShowAiChat(true)}>
              <Sparkles className="h-4 w-4 mr-1" />
              AI 어시스턴트
            </Button>
          )}
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
          이 설문은 <strong>{survey.status === SurveyStatus.ACTIVE ? '진행 중' : survey.status === SurveyStatus.CLOSED ? '마감' : survey.status}</strong> 상태입니다.
          질문을 수정하려면 초안(draft) 상태여야 합니다.
        </div>
      )}

      {/* Questions */}
      <TooltipProvider delayDuration={300}>
      <div className="space-y-3">
        {questions.length === 0 && !isAdding ? (
          isDraft ? (
            <EmptyState onQuickAdd={handleQuickAdd} onPresetSelect={handlePresetSelect} />
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">아직 질문이 없습니다.</p>
            </div>
          )
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              {questions.map((question, index) =>
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
              )}
            </SortableContext>
          </DndContext>
        )}

        {/* Add Question */}
        {isAdding ? (
          <QuestionForm
            defaultType={defaultType}
            onSubmit={handleAddQuestion}
            onCancel={() => { setIsAdding(false); setDefaultType(undefined); }}
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
                setDefaultType(undefined);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              질문 추가
            </Button>
          )
        )}
      </div>
      </TooltipProvider>

      {/* Preview Sheet */}
      <SurveyPreview
        survey={survey}
        questions={questions}
        open={showPreview}
        onClose={() => setShowPreview(false)}
      />

      {/* AI Chat Panel */}
      <AiChatPanel
        surveyId={surveyId}
        existingQuestions={questions}
        onQuestionsGenerated={handleAiQuestionsGenerated}
        open={showAiChat}
        onOpenChange={setShowAiChat}
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
