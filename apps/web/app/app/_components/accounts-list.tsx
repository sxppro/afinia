import CurrencyFlow from '@/components/currency-flow';
import { Card, CardContent } from '@/components/ui/card';
import { db } from '@/lib/db/client';
import { AccountTypeEnum } from 'afinia-common/providers/up';
import { accountTable } from 'afinia-common/schema';
import { desc } from 'drizzle-orm';
import { CircleQuestionMark, Landmark, PiggyBank, Wallet } from 'lucide-react';

const AccountsList = async () => {
  const accounts = await db
    .select({
      id: accountTable.account_id,
      name: accountTable.display_name,
      value: accountTable.value_in_base_units,
      type: accountTable.type,
    })
    .from(accountTable)
    .orderBy(accountTable.display_name, desc(accountTable.value_in_base_units));

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
        <Card className="w-44 shrink-0 rounded-3xl p-4" key={id}>
          <CardContent className="flex flex-col items-start justify-start p-0 font-medium">
            <div className="mb-6 rounded-lg bg-fuchsia-400/40 p-2">
              {type === AccountTypeEnum.SAVER ? (
                <PiggyBank className="size-6" />
              ) : type === AccountTypeEnum.TRANSACTIONAL ? (
                <Wallet className="size-6" />
              ) : type === AccountTypeEnum.HOME_LOAN ? (
                <Landmark className="size-6" />
              ) : (
                <CircleQuestionMark className="size-6" />
              )}
            </div>
            <p className="w-full min-w-0 truncate">{name}</p>
            <CurrencyFlow
              className="text-xl font-bold"
              value={value}
              signDisplay="auto"
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AccountsList;
