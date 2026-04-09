import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import TransactionsPageHeader from './_components/page-header';

const TransactionsPageLoading = () => {
  return (
    <div className="flex flex-col gap-2">
      <TransactionsPageHeader />

      <div className="flex flex-col gap-2">
        {[...Array(DEFAULT_PAGE_SIZE)].map((_, i) => (
          <Skeleton className="h-12 w-full" key={i} />
        ))}
      </div>
    </div>
  );
};

export default TransactionsPageLoading;
