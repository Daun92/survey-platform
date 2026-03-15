'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus, FileText, Trash2, Play, ClipboardList } from 'lucide-react';
import type {
  TemplateResponse,
  TemplateCategory,
  ProjectResponse,
  SurveyResponse,
} from '@survey/shared';

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  employee_satisfaction: '직원 만족도',
  customer_feedback: '고객 피드백',
  event_feedback: '이벤트 피드백',
  education: '교육',
  general: '일반',
};

const ALL_CATEGORIES: TemplateCategory[] = [
  'employee_satisfaction',
  'customer_feedback',
  'event_feedback',
  'education',
  'general',
] as TemplateCategory[];

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Create from survey dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [surveys, setSurveys] = useState<SurveyResponse[]>([]);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: 'general' as TemplateCategory,
    projectId: '',
    surveyId: '',
  });
  const [creating, setCreating] = useState(false);

  // Use template dialog
  const [useTarget, setUseTarget] = useState<TemplateResponse | null>(null);
  const [useForm, setUseForm] = useState({ projectId: '', title: '' });
  const [using, setUsing] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<TemplateResponse | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      const category = selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
      const data = await api<TemplateResponse[]>(`/templates${category}`);
      setTemplates(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : '템플릿 로드 실패');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const loadProjects = async () => {
    try {
      const data = await api<ProjectResponse[]>('/projects');
      setProjects(data);
    } catch {
      // ignore
    }
  };

  const loadSurveys = async (projectId: string) => {
    try {
      const data = await api<SurveyResponse[]>(`/surveys?projectId=${projectId}`);
      setSurveys(data);
    } catch {
      // ignore
    }
  };

  const handleOpenCreate = () => {
    loadProjects();
    setCreateForm({ title: '', description: '', category: 'general' as TemplateCategory, projectId: '', surveyId: '' });
    setSurveys([]);
    setCreateOpen(true);
  };

  const handleProjectChange = (projectId: string) => {
    setCreateForm((f) => ({ ...f, projectId, surveyId: '' }));
    loadSurveys(projectId);
  };

  const handleCreate = async () => {
    if (!createForm.title || !createForm.surveyId) return;
    setCreating(true);
    try {
      await api('/templates', {
        method: 'POST',
        body: JSON.stringify({
          title: createForm.title,
          description: createForm.description || undefined,
          category: createForm.category,
          surveyId: createForm.surveyId,
        }),
      });
      setCreateOpen(false);
      setLoading(true);
      loadTemplates();
    } catch (err) {
      alert(err instanceof Error ? err.message : '템플릿 생성 실패');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenUse = (template: TemplateResponse) => {
    loadProjects();
    setUseForm({ projectId: '', title: template.title });
    setUseTarget(template);
  };

  const handleUseTemplate = async () => {
    if (!useTarget || !useForm.projectId) return;
    setUsing(true);
    try {
      const result = await api<{ surveyId: string }>(`/templates/${useTarget.id}/use`, {
        method: 'POST',
        body: JSON.stringify({
          projectId: useForm.projectId,
          title: useForm.title || undefined,
        }),
      });
      router.push(`/dashboard/surveys/${result.surveyId}/edit`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '템플릿 사용 실패');
      setUsing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api(`/templates/${deleteTarget.id}`, { method: 'DELETE' });
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 실패');
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">템플릿</h1>
          <p className="text-muted-foreground">설문 템플릿을 관리하고 활용하세요.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-1" />
          설문에서 템플릿 만들기
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setSelectedCategory('all'); setLoading(true); }}
        >
          전체
        </Button>
        {ALL_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setSelectedCategory(cat); setLoading(true); }}
          >
            {CATEGORY_LABELS[cat]}
          </Button>
        ))}
      </div>

      {/* Template Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              아직 템플릿이 없습니다. 기존 설문에서 템플릿을 만들어보세요.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2">{template.title}</CardTitle>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {CATEGORY_LABELS[template.category]}
                  </Badge>
                </div>
                {template.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end gap-3 pt-0">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ClipboardList className="h-3.5 w-3.5" />
                    질문 {template.questionCount ?? template.questions?.length ?? 0}개
                  </span>
                  <span>사용 {template.usageCount}회</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenUse(template)}
                  >
                    <Play className="h-3.5 w-3.5 mr-1" />
                    사용하기
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setDeleteTarget(template)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create from Survey Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>설문에서 템플릿 만들기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>템플릿 이름</Label>
              <Input
                value={createForm.title}
                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="템플릿 이름 입력"
              />
            </div>
            <div className="space-y-2">
              <Label>설명 (선택)</Label>
              <Textarea
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="템플릿 설명"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>카테고리</Label>
              <Select
                value={createForm.category}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, category: v as TemplateCategory }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>프로젝트</Label>
              <Select
                value={createForm.projectId}
                onValueChange={handleProjectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="프로젝트 선택" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {createForm.projectId && (
              <div className="space-y-2">
                <Label>설문</Label>
                <Select
                  value={createForm.surveyId}
                  onValueChange={(v) => setCreateForm((f) => ({ ...f, surveyId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="설문 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {surveys.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              className="w-full"
              disabled={!createForm.title || !createForm.surveyId || creating}
              onClick={handleCreate}
            >
              {creating ? '생성 중...' : '템플릿 생성'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Use Template Dialog */}
      <Dialog open={!!useTarget} onOpenChange={(open) => !open && setUseTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>템플릿으로 설문 생성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              &ldquo;{useTarget?.title}&rdquo; 템플릿을 사용하여 새 설문을 생성합니다.
            </p>
            <div className="space-y-2">
              <Label>프로젝트</Label>
              <Select
                value={useForm.projectId}
                onValueChange={(v) => setUseForm((f) => ({ ...f, projectId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="프로젝트 선택" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>설문 제목 (선택)</Label>
              <Input
                value={useForm.title}
                onChange={(e) => setUseForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="기본값: 템플릿 제목"
              />
            </div>
            <Button
              className="w-full"
              disabled={!useForm.projectId || using}
              onClick={handleUseTemplate}
            >
              {using ? '생성 중...' : '설문 생성'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>템플릿 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; 템플릿을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
