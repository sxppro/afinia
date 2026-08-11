import { getStartOfDay } from '@/lib/dateTime';
import { getMerchantSpending } from '@/lib/db/spending';
import { transactionExternalTable } from 'afinia-common/schema';
import { endOfMonth, startOfMonth } from 'date-fns';
import { sum } from 'drizzle-orm';
import CurrencyFlow from '../currency-flow';

const MerchantSpendingTotal = async ({ merchant }: { merchant: string }) => {
  const range = {
    start: startOfMonth(getStartOfDay()),
    end: endOfMonth(getStartOfDay()),
  };
  const [spending] = await getMerchantSpending({
    select: {
      value: sum(transactionExternalTable.value_in_base_units).mapWith(Number),
    },
    range,
    merchant,
  });
  const value = spending?.value ?? 0;

  return (
    <>
      <CurrencyFlow value={value} />
      <p className="text-muted-foreground pb-1 font-medium">
        {value > 0 ? 'Received' : 'Spent'}
      </p>
    </>
  );
};

export default MerchantSpendingTotal;
