'use client';

import { cn } from '@/lib/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { VIEWS } from '../_lib/views';

const SpendingViewTabs = () => {
  const pathname = usePathname();
  const activeIndex = VIEWS.findIndex(({ href }) => href === pathname);

  return (
    <nav
      aria-label="Spending views"
      className="bg-muted grid grid-cols-2 rounded-xl p-1"
    >
      {VIEWS.map(({ id, label, icon: Icon, href }, index) => {
        const isActive = index === activeIndex;
        return (
          <Link
            key={id}
            href={href}
            transitionTypes={
              isActive ? [] : [index > activeIndex ? 'nav-forward' : 'nav-back']
            }
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'text-muted-foreground flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium transition-colors',
              isActive && 'bg-background text-foreground shadow-sm'
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default SpendingViewTabs;
