'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Plus, X, Sparkles, FileText } from 'lucide-react';

const actions = [
  { href: '/dashboard/surveys/new', label: '새 설문 만들기', icon: Plus },
  { href: '/dashboard/surveys/ai', label: 'AI로 생성', icon: Sparkles },
  { href: '/dashboard/templates', label: '템플릿에서 선택', icon: FileText },
];

export function FAB() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-2">
      {open &&
        actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-full bg-card border px-4 py-2.5 text-sm font-medium shadow-lg transition-all hover:shadow-xl"
            >
              <Icon size={16} />
              {action.label}
            </Link>
          );
        })}

      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-all hover:shadow-xl hover:scale-105',
          open && 'rotate-45',
        )}
        title="빠른 작업"
      >
        {open ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
}
