import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ReactNode, Suspense } from 'react';
import SpendingHourly from './trends/spending-hourly';
import SpendingMonthly from './trends/spending-monthly';
import SpendingPace from './trends/spending-pace';

const Section = ({
  title,
  description,
  fallbackClassName,
  children,
}: {
  title: string;
  description?: string;
  fallbackClassName: string;
  children: ReactNode;
}) => (
  <section>
    <h2 className="text-xl font-semibold">{title}</h2>
    {description && (
      <p className="text-muted-foreground mb-2 text-sm">{description}</p>
    )}
    <Suspense fallback={<Skeleton className={fallbackClassName} />}>
      {children}
    </Suspense>
  </section>
);

const SpendingTrends = () => (
  <div className="flex flex-col gap-6">
    <Section
      title="How you're tracking this month"
      fallbackClassName="h-64 w-full"
    >
      <SpendingPace />
    </Section>
    <Separator />
    <Section
      title="Monthly spending"
      description="Net spending over the last 12 months"
      fallbackClassName="h-64 w-full"
    >
      <SpendingMonthly />
    </Section>
    <Separator />
    <Section
      title="When you spend"
      description="Total spending by weekday and hour over 12 months"
      fallbackClassName="h-80 w-full"
    >
      <SpendingHourly />
    </Section>
  </div>
);

export default SpendingTrends;
