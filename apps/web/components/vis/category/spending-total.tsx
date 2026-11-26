import { getExternalTransactions } from '@/lib/db/transaction';
import { transactionExternalTable } from 'afinia-common/schema';
import { Interval } from 'date-fns';
import { sum } from 'drizzle-orm';
import CurrencyFlow from '../currency-flow';

const SpendingTotal = async ({
  category,
  range,
}: {
  category?: string;
  range: Interval<Date, Date>;
}) => {
  const [spending] = await getExternalTransactions({
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

export default SpendingTotal;
