'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TargetSummaryCard } from './target-summary-card';
import { Plus, Trash2, Building2, User, Users } from 'lucide-react';
import { toast } from 'sonner';
import { SurveyTargetType } from '@survey/shared';
import type {
  SurveyTargetResponse,
  SurveyTargetSummary,
  UserResponse,
  DepartmentResponse,
} from '@survey/shared';

interface TargetManagerProps {
  surveyId: string;
  isDraft: boolean;
}

export function TargetManager({ surveyId, isDraft }: TargetManagerProps) {
  const [targets, setTargets] = useState<SurveyTargetResponse[]>([]);
  const [summary, setSummary] = useState<SurveyTargetSummary>({
    totalUsers: 0,
    userTargets: 0,
    departmentTargets: 0,
    isAll: false,
  });
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showDeptDialog, setShowDeptDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTargets = useCallback(async () => {
    try {
      const [targetsData, summaryData] = await Promise.all([
        api<SurveyTargetResponse[]>(`/surveys/${surveyId}/targets`),
        api<SurveyTargetSummary>(`/surveys/${surveyId}/targets/summary`),
      ]);
      setTargets(targetsData);
      setSummary(summaryData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '대상자 로드 실패');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  const isAll = targets.some((t) => t.type === SurveyTargetType.ALL);

  const handleToggleAll = async () => {
    setSaving(true);
    try {
      if (isAll) {
        // Remove the ALL target
        const allTarget = targets.find(
          (t) => t.type === SurveyTargetType.ALL,
        );
        if (allTarget) {
          await api(`/surveys/${surveyId}/targets/${allTarget.id}`, {
            method: 'DELETE',
          });
        }
      } else {
        // Set ALL (replace everything)
        await api(`/surveys/${surveyId}/targets`, {
          method: 'PUT',
          body: { targets: [{ type: SurveyTargetType.ALL }] },
        });
      }
      await loadTargets();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '변경 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDepartment = async (deptId: string) => {
    setSaving(true);
    try {
      await api(`/surveys/${surveyId}/targets`, {
        method: 'POST',
        body: { type: SurveyTargetType.DEPARTMENT, departmentId: deptId },
      });
      await loadTargets();
      setShowDeptDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '부서 추가 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async (userId: string) => {
    setSaving(true);
    try {
      await api(`/surveys/${surveyId}/targets`, {
        method: 'POST',
        body: { type: SurveyTargetType.USER, userId },
      });
      await loadTargets();
      setShowUserDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '사용자 추가 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTarget = async (targetId: string) => {
    setSaving(true);
    try {
      await api(`/surveys/${surveyId}/targets/${targetId}`, {
        method: 'DELETE',
      });
      await loadTargets();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '대상 제거 실패');
    } finally {
      setSaving(false);
    }
  };

  const openDeptDialog = async () => {
    try {
      const depts = await api<DepartmentResponse[]>('/departments');
      setDepartments(depts);
      setShowDeptDialog(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '부서 목록 로드 실패');
    }
  };

  const openUserDialog = async () => {
    try {
      const usersData = await api<UserResponse[]>('/users');
      setUsers(usersData);
      setUserSearch('');
      setShowUserDialog(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '사용자 목록 로드 실패');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border p-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="rounded-lg border p-4 flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-7 w-7" />
          </div>
        ))}
      </div>
    );
  }

  const deptTargets = targets.filter(
    (t) => t.type === SurveyTargetType.DEPARTMENT,
  );
  const userTargets = targets.filter(
    (t) => t.type === SurveyTargetType.USER,
  );

  const existingDeptIds = new Set(deptTargets.map((t) => t.departmentId));
  const existingUserIds = new Set(userTargets.map((t) => t.userId));

  const filteredUsers = users.filter((u) => {
    if (existingUserIds.has(u.id)) return false;
    if (!userSearch) return true;
    const term = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
  });

  const availableDepts = departments.filter(
    (d) => !existingDeptIds.has(d.id),
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <TargetSummaryCard summary={summary} />

      {/* All Users Toggle */}
      {isDraft && (
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="all-toggle" className="cursor-pointer">
              전체 사용자에게 배포
            </Label>
          </div>
          <Switch
            id="all-toggle"
            checked={isAll}
            onCheckedChange={handleToggleAll}
            disabled={saving}
          />
        </div>
      )}

      {!isAll && (
        <>
          {/* Department Targets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                부서별 대상
              </h3>
              {isDraft && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openDeptDialog}
                  disabled={saving}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  부서 추가
                </Button>
              )}
            </div>

            {deptTargets.length === 0 ? (
              <p className="text-sm text-muted-foreground pl-5">
                지정된 부서가 없습니다.
              </p>
            ) : (
              <div className="space-y-2">
                {deptTargets.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {t.departmentName}
                      </span>
                    </div>
                    {isDraft && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleRemoveTarget(t.id)}
                        disabled={saving}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Targets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-1.5">
                <User className="h-4 w-4" />
                개별 사용자 대상
              </h3>
              {isDraft && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openUserDialog}
                  disabled={saving}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  사용자 추가
                </Button>
              )}
            </div>

            {userTargets.length === 0 ? (
              <p className="text-sm text-muted-foreground pl-5">
                지정된 사용자가 없습니다.
              </p>
            ) : (
              <div className="space-y-2">
                {userTargets.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium">
                          {t.userName}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {t.userEmail}
                        </span>
                      </div>
                    </div>
                    {isDraft && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleRemoveTarget(t.id)}
                        disabled={saving}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Department Selection Dialog */}
      <Dialog open={showDeptDialog} onOpenChange={setShowDeptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>부서 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availableDepts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                추가할 수 있는 부서가 없습니다.
              </p>
            ) : (
              availableDepts.map((dept) => (
                <button
                  key={dept.id}
                  className="w-full flex items-center gap-3 rounded-lg border p-3 hover:bg-accent text-left"
                  onClick={() => handleAddDepartment(dept.id)}
                  disabled={saving}
                >
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{dept.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {dept.code}
                      {dept.description && ` · ${dept.description}`}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeptDialog(false)}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Selection Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용자 추가</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="이름 또는 이메일로 검색..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {userSearch
                  ? '검색 결과가 없습니다.'
                  : '추가할 수 있는 사용자가 없습니다.'}
              </p>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  className="w-full flex items-center gap-3 rounded-lg border p-3 hover:bg-accent text-left"
                  onClick={() => handleAddUser(user.id)}
                  disabled={saving}
                >
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                      {user.departmentName && ` · ${user.departmentName}`}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUserDialog(false)}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
