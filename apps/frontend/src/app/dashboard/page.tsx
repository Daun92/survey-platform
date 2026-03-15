'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FolderOpen,
  ClipboardList,
  Radio,
  MessageSquare,
  FileText,
  Sparkles,
  Plus,
  ArrowRight,
} from 'lucide-react';
import type { ProjectResponse, DashboardStats, RecentActivity } from '@survey/shared';

const ACTIVITY_ICONS: Record<string, typeof ClipboardList> = {
  survey_created: ClipboardList,
  survey_published: Radio,
  response_received: MessageSquare,
  template_created: FileText,
};

const ACTIVITY_COLORS: Record<string, string> = {
  survey_created: 'text-blue-500',
  survey_published: 'text-green-500',
  response_received: 'text-orange-500',
  template_created: 'text-purple-500',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<DashboardStats>('/dashboard/stats').catch(() => null),
      api<RecentActivity[]>('/dashboard/recent').catch(() => []),
      api<ProjectResponse[]>('/projects').catch(() => []),
    ]).then(([s, a, p]) => {
      setStats(s);
      setActivities(a);
      setProjects(p);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  const statCards = [
    { label: '전체 프로젝트', value: stats?.totalProjects ?? 0, icon: FolderOpen, href: '/dashboard/projects' },
    { label: '전체 설문', value: stats?.totalSurveys ?? 0, icon: ClipboardList, href: '/dashboard/surveys' },
    { label: '진행 중 설문', value: stats?.activeSurveys ?? 0, icon: Radio, href: '/dashboard/surveys' },
    { label: '총 응답 수', value: stats?.totalResponses ?? 0, icon: MessageSquare, href: '/dashboard/surveys' },
    { label: '템플릿', value: stats?.totalTemplates ?? 0, icon: FileText, href: '/dashboard/templates' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/dashboard/surveys">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Plus className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-sm">새 설문 만들기</p>
                <p className="text-xs text-muted-foreground">직접 설문을 구성합니다</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/ai">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="rounded-lg bg-orange-500/10 p-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="font-medium text-sm">AI 설문 생성</p>
                <p className="text-xs text-muted-foreground">AI가 맞춤형 설문을 만듭니다</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/templates">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <FileText className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="font-medium text-sm">템플릿 찾기</p>
                <p className="text-xs text-muted-foreground">기존 템플릿을 활용합니다</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold mb-3">최근 활동</h2>
          {activities.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">아직 활동이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="divide-y p-0">
                {activities.map((activity) => {
                  const Icon = ACTIVITY_ICONS[activity.type] ?? ClipboardList;
                  const color = ACTIVITY_COLORS[activity.type] ?? 'text-muted-foreground';
                  return (
                    <div key={activity.id} className="flex items-start gap-3 px-4 py-3">
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {timeAgo(activity.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">최근 프로젝트</h2>
            <Link href="/dashboard/projects">
              <Button variant="ghost" size="sm">
                전체 보기 <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          {projects.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">아직 프로젝트가 없습니다.</p>
                <Link href="/dashboard/projects" className="text-sm text-primary hover:underline mt-1 inline-block">
                  첫 프로젝트 만들기
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="divide-y p-0">
                {projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{project.title}</p>
                      <p className="text-xs text-muted-foreground">
                        설문 {project.surveyCount}개 · {project.ownerName}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(project.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
