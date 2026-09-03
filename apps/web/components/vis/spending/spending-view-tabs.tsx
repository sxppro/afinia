'use client';

import { cn } from '@/lib/ui';
import { CalendarDays, ChartNoAxesCombined, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

const views = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'trends', label: 'Trends', icon: ChartNoAxesCombined },
] as const;

const SpendingViewTabs = ({ activeView }: { activeView: string }) => (
  <nav
    aria-label="Spending views"
    className="bg-muted grid grid-cols-3 rounded-xl p-1"
  >
    {views.map(({ id, label, icon: Icon }) => (
      <Link
        key={id}
        href={id === 'overview' ? '/app/spending' : `/app/spending?view=${id}`}
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

export default SpendingViewTabs;
