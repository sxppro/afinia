import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ReactNode, Suspense } from 'react';
import SpendingHourly, {
  SpendingHourlySkeleton,
} from './trends/spending-hourly';
import SpendingMonthly from './trends/spending-monthly';
import SpendingPace from './trends/spending-pace';

const Section = ({
  title,
  description,
  fallbackClassName,
  fallback,
  children,
}: {
  title: string;
  description?: string;
  fallbackClassName?: string;
  fallback?: ReactNode;
  children: ReactNode;
}) => (
  <section>
    <h2 className="text-xl font-semibold">{title}</h2>
    {description && (
      <p className="text-muted-foreground mb-2 text-sm">{description}</p>
    )}
    <Suspense fallback={fallback ?? <Skeleton className={fallbackClassName} />}>
      {children}
    </Suspense>
  </section>
);

const SpendingTrends = ({
  searchParams,
}: {
  searchParams: Promise<{
    heatmap?: string | string[];
    heatmapView?: string | string[];
  }>;
}) => (
  <div className="flex flex-col gap-6">
    <Section
      title="How you're tracking this month"
      fallbackClassName="h-64 w-full"
    >
      <SpendingPace />
    </Section>
    <Separator />
    <Section
      title="Spending patterns"
      description="By time of day and day of week"
      fallback={<SpendingHourlySkeleton />}
    >
      <SpendingHourly searchParams={searchParams} />
    </Section>
    <Separator />
    <Section
      title="Monthly spending"
      description="Net spending over the last 12 months"
      fallbackClassName="h-64 w-full"
    >
      <SpendingMonthly />
    </Section>
  </div>
);

export default SpendingTrends;
