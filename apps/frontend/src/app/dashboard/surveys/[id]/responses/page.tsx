'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
import { ArrowLeft, Eye, Trash2 } from 'lucide-react';
import type {
  SurveyResponse as SurveyResponseType,
  QuestionResponse,
} from '@survey/shared';
import type { SurveyResponseDetail, AnswerValue } from '@survey/shared';

interface PaginatedResponses {
  data: SurveyResponseDetail[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function maskIp(ip: string): string {
  if (!ip) return '-';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  return ip.slice(0, 8) + '***';
}

function formatAnswer(answer: AnswerValue, questions: QuestionResponse[]): string {
  const q = questions.find((q) => q.id === answer.questionId);
  const val = answer.value;

  if (val === null || val === undefined) return '-';
  if (typeof val === 'string') return val || '-';
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    if (q?.options?.choices) {
      const labelMap = new Map(q.options.choices.map((c) => [c.value, c.label]));
      return val.map((v) => labelMap.get(v) ?? v).join(', ');
    }
    return val.join(', ');
  }
  if (typeof val === 'object') {
    return Object.entries(val)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }
  return String(val);
}

export default function ResponsesPage() {
  const params = useParams();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<SurveyResponseType | null>(null);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [responses, setResponses] = useState<SurveyResponseDetail[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  const [selectedResponse, setSelectedResponse] = useState<SurveyResponseDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SurveyResponseDetail | null>(null);

  const loadData = useCallback(async (page = 1) => {
    try {
      const [surveyData, questionsData, responsesData] = await Promise.all([
        api<SurveyResponseType>(`/surveys/${surveyId}`),
        api<QuestionResponse[]>(`/surveys/${surveyId}/questions`),
        api<PaginatedResponses>(`/surveys/${surveyId}/responses?page=${page}&limit=20`),
      ]);
      setSurvey(surveyData);
      setQuestions(questionsData);
      setResponses(responsesData.data);
      setMeta(responsesData.meta);
    } catch (err) {
      alert(err instanceof Error ? err.message : '데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api(`/responses/${deleteTarget.id}`, { method: 'DELETE' });
      setResponses((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setMeta((prev) => ({ ...prev, total: prev.total - 1 }));
      setDeleteTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 실패');
    }
  };

  const goToPage = (page: number) => {
    setLoading(true);
    loadData(page);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold">응답 관리</h1>
          <p className="text-muted-foreground">
            {survey?.title} — 총 {meta.total}건
          </p>
        </div>
      </div>

      {/* Response List */}
      {responses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">아직 응답이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">#</th>
                  <th className="text-left p-3 font-medium">제출 시간</th>
                  <th className="text-left p-3 font-medium">IP</th>
                  <th className="text-left p-3 font-medium">상태</th>
                  <th className="text-right p-3 font-medium">액션</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((resp, i) => (
                  <tr key={resp.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 text-muted-foreground">
                      {(meta.page - 1) * meta.limit + i + 1}
                    </td>
                    <td className="p-3">
                      {resp.submittedAt
                        ? new Date(resp.submittedAt).toLocaleString('ko-KR')
                        : '-'}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {maskIp(resp.respondentInfo?.ipAddress ?? '')}
                    </td>
                    <td className="p-3">
                      <Badge variant={resp.status === 'completed' ? 'default' : 'secondary'}>
                        {resp.status === 'completed' ? '완료' : '진행 중'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedResponse(resp)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteTarget(resp)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => goToPage(meta.page - 1)}
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground">
                {meta.page} / {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => goToPage(meta.page + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}

      {/* Response Detail Dialog */}
      <Dialog
        open={!!selectedResponse}
        onOpenChange={(open) => !open && setSelectedResponse(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle>응답 상세</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedResponse?.submittedAt
                ? new Date(selectedResponse.submittedAt).toLocaleString('ko-KR')
                : ''}
            </p>
          </DialogHeader>
          <ScrollArea className="flex-1 px-6 pb-6">
            <div className="space-y-4 py-4">
              {selectedResponse?.answers.map((answer, i) => {
                const question = questions.find(
                  (q) => q.id === answer.questionId,
                );
                return (
                  <div key={i} className="space-y-1">
                    <p className="text-sm font-medium">
                      {i + 1}. {question?.title ?? '알 수 없는 질문'}
                    </p>
                    <p className="text-sm text-muted-foreground pl-4">
                      {formatAnswer(answer, questions)}
                    </p>
                    {i < (selectedResponse?.answers.length ?? 0) - 1 && (
                      <Separator className="mt-3" />
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>응답 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 응답을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
