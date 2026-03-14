'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Pencil } from 'lucide-react';
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
      setLoading(true);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '설문 생성 실패');
    } finally {
      setCreating(false);
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
          <DialogContent>
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

      {loading ? (
        <p className="text-sm text-muted-foreground">로딩 중...</p>
      ) : data.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">프로젝트가 없습니다. 먼저 프로젝트를 생성하세요.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map(({ project, surveys }) => (
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
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{survey.title}</p>
                          <Badge variant={STATUS_VARIANTS[survey.status]}>
                            {STATUS_LABELS[survey.status]}
                          </Badge>
                        </div>
                        {survey.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {survey.description}
                          </p>
                        )}
                      </div>
                      <Link href={`/dashboard/surveys/${survey.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          편집
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
