'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { UserResponse } from '@survey/shared';

export function Header() {
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api<UserResponse>('/auth/me').then(setUser).catch(() => setUser(null));
    }
  }, []);

  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <h2 className="text-lg font-semibold">
        {/* 페이지별 타이틀은 각 페이지에서 설정 */}
      </h2>

      {user && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{user.name}</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {user.role}
          </span>
        </div>
      )}
    </header>
  );
}
