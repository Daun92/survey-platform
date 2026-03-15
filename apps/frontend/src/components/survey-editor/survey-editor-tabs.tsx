'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SurveyEditorTabsProps {
  surveyId: string;
}

const tabs = [
  { label: '질문 편집', segment: 'edit' },
  { label: '배포', segment: 'distribute' },
  { label: '응답', segment: 'responses' },
] as const;

export function SurveyEditorTabs({ surveyId }: SurveyEditorTabsProps) {
  const pathname = usePathname();

  return (
    <div className="border-b">
      <nav className="flex gap-0 -mb-px">
        {tabs.map((tab) => {
          const href = `/dashboard/surveys/${surveyId}/${tab.segment}`;
          const isActive = pathname === href || pathname?.startsWith(href + '/');

          return (
            <Link
              key={tab.segment}
              href={href}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
