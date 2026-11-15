import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import SpendingOverview from '../_components/overview/spending-overview';
import SpendingViewTransition from '../_components/spending-view-transition';

const SpendingOverviewPage = () => (
  <SpendingViewTransition>
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <SpendingOverview />
    </Suspense>
  </SpendingViewTransition>
);

export default SpendingOverviewPage;
