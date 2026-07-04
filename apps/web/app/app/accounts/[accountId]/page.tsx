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
    <div className="flex flex-col gap-2">
      <AccountPageHeader accountName={account.display_name} />
      <h2 className="text-muted-foreground text-xl font-medium">Balance</h2>
      <Suspense fallback={<Skeleton className="h-14 w-full" />}>
        <AccountBalance accountId={account.account_id} />
      </Suspense>
      <Accordion>
        <AccordionItem value="more-info">
          <AccordionTrigger className="text-muted-foreground items-center justify-start gap-1 text-lg font-normal **:data-[slot=accordion-trigger-icon]:ml-0 **:data-[slot=accordion-trigger-icon]:size-5">
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
      <h2 className="text-muted-foreground text-xl font-medium">
        Transactions
      </h2>
      <div className="flex flex-col gap-2">
        <AccountTransactions accountId={account.account_id} />
      </div>
    </div>
  );
};

export default AccountPage;
