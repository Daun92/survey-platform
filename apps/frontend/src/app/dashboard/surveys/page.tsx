'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, MoreVertical, Trash2, Search, MessageSquare, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ProjectResponse, SurveyResponse, SurveyStatus } from '@survey/shared';

const STATUS_LABELS: Record<SurveyStatus, string> = {
  draft: '초안',
  active: '진행 중',
  closed: '마감',
  archived: '보관',
};

const STATUS_VARIANTS: Record<SurveyStatus, 'secondary' | 'default' | 'outline' | 'destructive'> = {
  draft: 'secondary',
  active: 'default',
  closed: 'outline',
  archived: 'destructive',
};

type FilterStatus = 'all' | 'draft' | 'active' | 'closed' | 'archived';

const filterTabs: { label: string; value: FilterStatus }[] = [
  { label: '전체', value: 'all' },
  { label: '초안', value: 'draft' },
  { label: '진행 중', value: 'active' },
  { label: '마감', value: 'closed' },
];

interface ProjectWithSurveys {
  project: ProjectResponse;
  surveys: SurveyResponse[];
}

export default function SurveysPage() {
  const [data, setData] = useState<ProjectWithSurveys[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSurvey, setNewSurvey] = useState({ projectId: '', title: '', description: '' });

  // Filters
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<SurveyResponse | null>(null);

  const loadData = async () => {
    try {
      const projects = await api<ProjectResponse[]>('/projects');
      const results = await Promise.all(
        projects.map(async (project) => {
          const surveys = await api<SurveyResponse[]>(`/surveys?projectId=${project.id}`);
          return { project, surveys };
        }),
      );
      setData(results);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredData = useMemo(() => {
    return data.map(({ project, surveys }) => ({
      project,
      surveys: surveys.filter((s) => {
        if (statusFilter !== 'all' && s.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            s.title.toLowerCase().includes(q) ||
            (s.description ?? '').toLowerCase().includes(q)
          );
        }
        return true;
      }),
    })).filter(({ surveys }) => surveys.length > 0 || (!searchQuery.trim() && statusFilter === 'all'));
  }, [data, statusFilter, searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurvey.projectId || !newSurvey.title.trim()) return;
    setCreating(true);
    try {
      await api('/surveys', {
        method: 'POST',
        body: {
          projectId: newSurvey.projectId,
          title: newSurvey.title,
          description: newSurvey.description || undefined,
        },
      });
      setDialogOpen(false);
      setNewSurvey({ projectId: '', title: '', description: '' });
      toast.success('설문이 생성되었습니다');
      setLoading(true);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '설문 생성 실패');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api(`/surveys/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      toast.success('설문이 삭제되었습니다');
      setLoading(true);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '설문 삭제 실패');
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">설문 관리</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              새 설문
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>새 설문 만들기</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>프로젝트</Label>
                <Select
                  value={newSurvey.projectId}
                  onValueChange={(v) => setNewSurvey((p) => ({ ...p, projectId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="프로젝트 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.map(({ project }) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>설문 제목</Label>
                <Input
                  value={newSurvey.title}
                  onChange={(e) => setNewSurvey((p) => ({ ...p, title: e.target.value }))}
                  placeholder="설문 제목 입력"
                  maxLength={200}
                  required
                />
              </div>
              <div>
                <Label>설명 (선택)</Label>
                <Textarea
                  value={newSurvey.description}
                  onChange={(e) => setNewSurvey((p) => ({ ...p, description: e.target.value }))}
                  placeholder="설문에 대한 설명"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  취소
                </Button>
                <Button type="submit" disabled={creating || !newSurvey.projectId || !newSurvey.title.trim()}>
                  {creating ? '생성 중...' : '생성'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Filter Tabs + Search */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1 border rounded-lg p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                statusFilter === tab.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="설문 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-40" />
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            {data.length === 0
              ? '프로젝트가 없습니다. 먼저 프로젝트를 생성하세요.'
              : '조건에 맞는 설문이 없습니다.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredData.map(({ project, surveys }) => (
            <div key={project.id} className="space-y-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {project.title}
                <span className="text-sm font-normal text-muted-foreground">
                  설문 {surveys.length}개
                </span>
              </h2>

              {surveys.length === 0 ? (
                <p className="text-sm text-muted-foreground pl-4">설문이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {surveys.map((survey) => (
                    <div
                      key={survey.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/surveys/${survey.id}/edit`}
                            className="font-medium hover:underline truncate"
                          >
                            {survey.title}
                          </Link>
                          <Badge variant={STATUS_VARIANTS[survey.status]}>
                            {STATUS_LABELS[survey.status]}
                          </Badge>
                        </div>
                        {survey.description && (
                          <p className="text-sm text-muted-foreground mt-0.5 truncate">
                            {survey.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            응답 {survey.responseCount}건
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(survey.updatedAt).toLocaleDateString('ko-KR')}
                          </span>
                          <span>{survey.createdByName}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/surveys/${survey.id}/edit`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              편집
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteTarget(survey)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>설문 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.title}&quot; 설문을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
