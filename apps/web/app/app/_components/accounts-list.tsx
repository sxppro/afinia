import CurrencyFlow from '@/components/currency-flow';
import AccountTypeIcon from '@/components/icons/account-type-icon';
import { Card, CardContent } from '@/components/ui/card';
import { db } from '@/lib/db/client';
import { siteConfig } from '@/lib/siteConfig';
import { accountTable, transactionTable } from 'afinia-common/schema';
import { and, desc, eq, isNull, max, sql } from 'drizzle-orm';
import Link from 'next/link';

const AccountsList = async () => {
  /**
   * Get accounts sorted by latest activity
   */
  const accounts = await db
    .select({
      id: accountTable.account_id,
      name: accountTable.display_name,
      value: accountTable.value_in_base_units,
      type: accountTable.type,
      latestActivity: max(transactionTable.created_at),
    })
    .from(accountTable)
    .leftJoin(
      transactionTable,
      and(
        eq(transactionTable.account_id, accountTable.account_id),
        isNull(transactionTable.deleted_at)
      )
    )
    .where(isNull(accountTable.deleted_at))
    .groupBy(
      accountTable.account_id,
      accountTable.display_name,
      accountTable.value_in_base_units,
      accountTable.type
    )
    .orderBy(
      sql`max(${transactionTable.created_at}) desc nulls last`,
      accountTable.display_name,
      desc(accountTable.value_in_base_units)
    );

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground w-full rounded border border-dashed p-4 text-center text-sm">
          No accounts found
        </p>
      </div>
    );
  }

  return (
    <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {accounts.map(({ id, name, value, type }) => (
        <Link href={`${siteConfig.baseLinks.accounts}/${id}`} key={id}>
          <Card className="w-44 shrink-0 rounded-3xl p-4">
            <CardContent className="flex flex-col items-start justify-start p-0 font-medium">
              <div className="mb-6 rounded-lg bg-fuchsia-400/40 p-2">
                <AccountTypeIcon type={type} />
              </div>
              <p className="w-full min-w-0 truncate">{name}</p>
              <CurrencyFlow
                className="text-xl font-bold"
                value={value}
                signDisplay="auto"
              />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default AccountsList;
