import CurrencyFlow from '@/components/currency-flow';
import { getStartOfDay } from '@/lib/constants';
import { getCategorySpending } from '@/lib/db/spending';
import { transactionExternalTable } from 'afinia-common/schema';
import { endOfMonth, startOfMonth } from 'date-fns';
import { sum } from 'drizzle-orm';

const SpendingTotal = async ({ category }: { category: string }) => {
  const range = {
    start: startOfMonth(getStartOfDay()),
    end: endOfMonth(getStartOfDay()),
  };
  const spending = await getCategorySpending({
    select: {
      id: transactionExternalTable.category_parent_id,
      name: transactionExternalTable.category_parent,
      value: sum(transactionExternalTable.value_in_base_units).mapWith(Number),
    },
    range,
    category,
  }).groupBy(
    transactionExternalTable.category_parent_id,
    transactionExternalTable.category_parent
  );
  const value = spending[0]?.value ?? 0;

  return (
    <>
      <CurrencyFlow value={value} />
      <p className="text-muted-foreground font-medium pb-1">
        {value > 0 ? 'Received' : 'Spent'}
      </p>
    </>
  );
};

export default SpendingTotal;
