import { Skeleton } from '@/components/ui/skeleton';
import TransactionList from '@/components/vis/transaction/transaction-list';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { Suspense } from 'react';

const AccountTransactions = async ({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) => {
  const { accountId } = await params;

  return (
    <Suspense
      fallback={
        <>
          {[...Array(DEFAULT_PAGE_SIZE)].map((_, i) => (
            <Skeleton className="h-12 w-full" key={i} />
          ))}
        </>
      }
    >
      <TransactionList
        options={{
          limit: DEFAULT_PAGE_SIZE,
          filters: { account_id: Number(accountId), include_transfers: true },
        }}
        isInfinite
      />
    </Suspense>
  );
};

export default AccountTransactions;
