import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import SpendingCalendar from '@/components/vis/spending/spending-calendar';
import SpendingViewTabs from '@/components/vis/spending/spending-view-tabs';
import { siteConfig } from '@/lib/siteConfig';
import { ArrowLeft, Ellipsis } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import SpendingOverview from './_components/spending-overview';
import SpendingTrends from './_components/spending-trends';

const SpendingPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const params = await searchParams;
  const requestedView = Array.isArray(params.view) ? params.view[0] : params.view;
  const activeView = ['calendar', 'trends'].includes(requestedView ?? '')
    ? requestedView!
    : 'overview';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between">
        <div className="flex items-center gap-4">
          <Button
            className="rounded-full"
            variant="outline"
            size="icon-xl"
            nativeButton={false}
            render={
              <Link href={siteConfig.baseLinks.appHome}>
                <ArrowLeft className="size-5" />
              </Link>
            }
          />
          <h1 className="text-2xl/tight font-bold">Spending</h1>
        </div>
        <div>
          <Button className="rounded-full" variant="outline" size="icon-xl">
            <Ellipsis className="size-5" />
          </Button>
        </div>
      </div>

      <SpendingViewTabs activeView={activeView} />

      {activeView === 'calendar' ? (
        <section>
          <div className="mb-3">
            <h2 className="text-xl font-semibold">Daily spending</h2>
            <p className="text-muted-foreground text-sm">
              Scroll through your history and tap a day for transactions
            </p>
          </div>
          <SpendingCalendar />
        </section>
      ) : activeView === 'trends' ? (
        <Suspense fallback={<Skeleton className="h-72 w-full" />}>
          <SpendingTrends />
        </Suspense>
      ) : (
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <SpendingOverview />
        </Suspense>
      )}
    </div>
  );
};

export default SpendingPage;
