'use client';

import { siteConfig } from '@/lib/siteConfig';
import { cn } from '@/lib/ui';
import Link from 'next/link';
import { VIEWS, viewSerializer } from '../_lib/search-params';

const SpendingViewTabs = ({ activeView }: { activeView: string }) => {
  return (
    <nav
      aria-label="Spending views"
      className="bg-muted grid grid-cols-2 rounded-xl p-1"
    >
      {VIEWS.map(({ id, label, icon: Icon }) => (
        <Link
          key={id}
          href={`${siteConfig.baseLinks.spending}${viewSerializer({ view: id })}`}
          aria-current={activeView === id ? 'page' : undefined}
          className={cn(
            'text-muted-foreground flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium transition-colors',
            activeView === id && 'bg-background text-foreground shadow-sm'
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
};

export default SpendingViewTabs;
