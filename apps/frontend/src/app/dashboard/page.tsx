'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { ProjectResponse } from '@survey/shared';

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<ProjectResponse[]>('/projects')
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">전체 프로젝트</p>
          <p className="text-3xl font-bold mt-1">{loading ? '-' : projects.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">진행 중인 설문</p>
          <p className="text-3xl font-bold mt-1">-</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">총 응답 수</p>
          <p className="text-3xl font-bold mt-1">-</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">최근 프로젝트</h2>
          <Link
            href="/dashboard/projects"
            className="text-sm text-primary hover:underline"
          >
            전체 보기
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">로딩 중...</p>
        ) : projects.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">아직 프로젝트가 없습니다.</p>
            <Link
              href="/dashboard/projects"
              className="mt-2 inline-block text-sm text-primary hover:underline"
            >
              첫 프로젝트 만들기
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.slice(0, 5).map((project) => (
              <div key={project.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{project.title}</p>
                  <p className="text-sm text-muted-foreground">
                    설문 {project.surveyCount}개 · {project.ownerName}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(project.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
