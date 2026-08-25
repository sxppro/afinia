import { getMerchantSpending } from '@/lib/db/spending';
import { transactionExternalTable } from 'afinia-common/schema';
import { Interval } from 'date-fns';
import { sum } from 'drizzle-orm';
import { appendFileSync } from 'node:fs';
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

  // #region agent log
  appendFileSync(
    '/opt/cursor/logs/debug.log',
    `${JSON.stringify({
      hypothesisId: 'B,D',
      location: 'spending-total.tsx:query-result',
      message: 'Merchant spending total query resolved',
      data: {
        merchant,
        rangeStart: range.start.toISOString(),
        rangeEnd: range.end.toISOString(),
        value,
      },
      timestamp: Date.now(),
    })}\n`
  );
  // #endregion

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
