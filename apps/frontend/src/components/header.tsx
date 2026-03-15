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
    <div className="flex flex-1 items-center justify-end">
      {user && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{user.name}</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {user.role}
          </span>
        </div>
      )}
    </div>
  );
}
