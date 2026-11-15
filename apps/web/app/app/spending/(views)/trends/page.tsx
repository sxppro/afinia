import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import SpendingTrends from '../../_components/spending-trends';
import SpendingViewTransition from '../../_components/spending-view-transition';

const SpendingTrendsPage = () => (
  <SpendingViewTransition>
    <Suspense fallback={<Skeleton className="h-72 w-full" />}>
      <SpendingTrends />
    </Suspense>
  </SpendingViewTransition>
);

export default SpendingTrendsPage;
