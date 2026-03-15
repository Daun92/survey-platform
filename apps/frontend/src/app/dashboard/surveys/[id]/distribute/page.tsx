'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Copy, Link as LinkIcon, Check } from 'lucide-react';
import type { SurveyResponse } from '@survey/shared';
import { DistributionChannel } from '@survey/shared';
import type { DistributionResponse, DistributionConfig } from '@survey/shared';

export default function DistributePage() {
  const params = useParams();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<SurveyResponse | null>(null);
  const [distributions, setDistributions] = useState<DistributionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create form state
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [maxResponses, setMaxResponses] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [completionMessage, setCompletionMessage] = useState('');
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [surveyData, distData] = await Promise.all([
        api<SurveyResponse>(`/surveys/${surveyId}`),
        api<DistributionResponse[]>(`/surveys/${surveyId}/distributions`),
      ]);
      setSurvey(surveyData);
      setDistributions(distData);
    } catch (err) {
      alert(err instanceof Error ? err.message : '데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getPublicUrl = (token: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/s/${token}`;
  };

  const copyLink = async (dist: DistributionResponse) => {
    try {
      await navigator.clipboard.writeText(getPublicUrl(dist.token));
      setCopiedId(dist.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert('링크 복사에 실패했습니다.');
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const config: Partial<DistributionConfig> = {
        allowDuplicate,
        maxResponses: maxResponses ? parseInt(maxResponses, 10) : null,
        welcomeMessage: welcomeMessage || null,
        completionMessage: completionMessage || null,
      };

      const created = await api<DistributionResponse>(
        `/surveys/${surveyId}/distributions`,
        {
          method: 'POST',
          body: {
            channel: DistributionChannel.LINK,
            config,
          },
        },
      );

      setDistributions((prev) => [created, ...prev]);
      setShowCreate(false);
      resetForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : '생성 실패');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (dist: DistributionResponse) => {
    try {
      const updated = await api<DistributionResponse>(
        `/surveys/${surveyId}/distributions/${dist.id}`,
        {
          method: 'PATCH',
          body: { isActive: !dist.isActive },
        },
      );
      setDistributions((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d)),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '상태 변경 실패');
    }
  };

  const resetForm = () => {
    setAllowDuplicate(false);
    setMaxResponses('');
    setWelcomeMessage('');
    setCompletionMessage('');
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
      {/* Actions */}
      <div className="flex items-center justify-end">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" />
          링크 생성
        </Button>
      </div>

      {/* Distribution List */}
      {distributions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <LinkIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-3">
              아직 배포 링크가 없습니다.
            </p>
            <Button variant="outline" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1" />
              첫 링크 생성
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {distributions.map((dist) => (
            <Card key={dist.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={dist.isActive ? 'default' : 'secondary'}>
                        {dist.isActive ? '활성' : '비활성'}
                      </Badge>
                      <Badge variant="outline">{dist.channel.toUpperCase()}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded truncate block">
                        {getPublicUrl(dist.token)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8"
                        onClick={() => copyLink(dist)}
                      >
                        {copiedId === dist.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground space-x-4">
                      <span>중복 응답: {dist.config.allowDuplicate ? '허용' : '불가'}</span>
                      <span>
                        최대 응답: {dist.config.maxResponses ?? '무제한'}
                      </span>
                      {dist.expiresAt && (
                        <span>
                          만료: {new Date(dist.expiresAt).toLocaleDateString('ko-KR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={dist.isActive}
                      onCheckedChange={() => toggleActive(dist)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>배포 링크 생성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="allowDuplicate">중복 응답 허용</Label>
              <Switch
                id="allowDuplicate"
                checked={allowDuplicate}
                onCheckedChange={setAllowDuplicate}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxResponses">최대 응답 수 (비워두면 무제한)</Label>
              <Input
                id="maxResponses"
                type="number"
                placeholder="무제한"
                value={maxResponses}
                onChange={(e) => setMaxResponses(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">환영 메시지</Label>
              <Input
                id="welcomeMessage"
                placeholder="설문 시작 전 표시할 메시지"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="completionMessage">완료 메시지</Label>
              <Input
                id="completionMessage"
                placeholder="설문 완료 후 표시할 메시지"
                value={completionMessage}
                onChange={(e) => setCompletionMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreate(false);
                resetForm();
              }}
            >
              취소
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? '생성 중...' : '생성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
