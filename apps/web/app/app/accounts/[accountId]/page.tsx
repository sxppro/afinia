import AccountTypeIcon from '@/components/icons/account-type-icon';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { getAccount } from '@/lib/db/account';
import { capitalise } from '@/lib/string';
import { format, formatDistanceToNowStrict } from 'date-fns';
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
  const [account] = await getAccount(Number(accountId));

  if (!account) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <AccountPageHeader accountName={account.display_name} />
      <div className="flex items-center gap-4">
        <span className="flex aspect-square size-16 items-center justify-center rounded-2xl bg-fuchsia-400 text-white">
          <AccountTypeIcon type={account.type} className="size-8" />
        </span>
        <div className="flex-1">
          <h2 className="text-muted-foreground font-medium">Balance</h2>
          <Suspense fallback={<Skeleton className="h-9 w-full" />}>
            <AccountBalance accountId={account.account_id} />
          </Suspense>
        </div>
      </div>
      <Accordion>
        <AccordionItem value="more-info">
          <AccordionTrigger className="text-muted-foreground items-center justify-start gap-1 py-0 text-lg font-normal **:data-[slot=accordion-trigger-icon]:ml-0 **:data-[slot=accordion-trigger-icon]:size-5">
            More information
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-2">
            <div className="flex justify-between">
              <p className="text-muted-foreground">Account created</p>
              <p className="text-end">
                {format(account.created_at, "do MMM yyyy 'at' h:mm aaa")}
                <br />({formatDistanceToNowStrict(account.created_at)} ago)
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-muted-foreground">Ownership type</p>
              <p className="text-end">{capitalise(account.ownership_type)}</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Transactions</h2>
        <div className="flex flex-col gap-2">
          <AccountTransactions accountId={account.account_id} />
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
