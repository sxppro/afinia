import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import SpendingTrends from '../../_components/spending-trends';
import SpendingViewTransition from '../../_components/spending-view-transition';

const SpendingTrendsPage = ({
  searchParams,
}: {
  searchParams: Promise<{
    heatmap?: string | string[];
    heatmapView?: string | string[];
  }>;
}) => (
  <SpendingViewTransition>
    <Suspense fallback={<Skeleton className="h-72 w-full" />}>
      <SpendingTrends searchParams={searchParams} />
    </Suspense>
  </SpendingViewTransition>
);

export default SpendingTrendsPage;
