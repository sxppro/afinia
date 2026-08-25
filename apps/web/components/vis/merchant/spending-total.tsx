import { getMerchantSpending } from '@/lib/db/spending';
import { transactionExternalTable } from 'afinia-common/schema';
import { Interval } from 'date-fns';
import { sum } from 'drizzle-orm';
import CurrencyFlow from '../currency-flow';

const MerchantSpendingTotal = async ({
  merchant,
  range,
}: {
  merchant: string;
  range: Interval<Date, Date>;
}) => {
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
