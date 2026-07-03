import { Skeleton } from '@/components/ui/skeleton';
import { getAccount } from '@/lib/db/account';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import AccountBalance from './_components/account-balance';
import AccountTransactions from './_components/account-transactions';
import AccountPageHeader from './_components/page-header';

const AccountPage = async ({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) => {
  const { accountId } = await params;
  const account = await getAccount(Number(accountId));

  if (!account || account.length !== 1) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-2">
      <AccountPageHeader accountName={account[0].display_name} />
      <h2 className="text-muted-foreground text-xl font-medium">Balance</h2>
      <Suspense fallback={<Skeleton className="h-14 w-full" />}>
        <AccountBalance accountId={account[0].account_id} />
      </Suspense>
      <h2 className="text-muted-foreground text-xl font-medium">
        Transactions
      </h2>
      <div className="flex flex-col gap-2">
        <AccountTransactions accountId={account[0].account_id} />
      </div>
    </div>
  );
};

export default AccountPage;
