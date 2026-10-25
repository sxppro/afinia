import { RecurringPayment } from '@/lib/recurring-spending';
import { siteConfig } from '@/lib/siteConfig';
import { cn, colours, formatCurrency } from '@/lib/ui';
import { format } from 'date-fns';
import Link from 'next/link';

const RecurringPaymentsList = ({
  payments,
}: {
  payments: RecurringPayment[];
}) =>
  payments.length > 0 ? (
    <div className="flex flex-col gap-3">
      {payments.map(
        ({
          merchant,
          categoryId,
          frequency,
          lastAmount,
          nextChargeAt,
          monthlyCost,
        }) => (
          <div
            key={merchant}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  'size-2 shrink-0 rounded-full',
                  colours[categoryId]?.background ?? 'bg-up-uncategorised'
                )}
              />
              <div className="min-w-0">
                <Link
                  className="min-w-0"
                  href={`${siteConfig.baseLinks.merchants}/${encodeURIComponent(merchant)}`}
                >
                  <p className="truncate font-medium underline underline-offset-4">
                    {merchant}
                  </p>
                </Link>
                <p className="text-muted-foreground text-xs">
                  {formatCurrency(lastAmount, { baseUnits: true, decimals: 2 })}{' '}
                  · {frequency}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <p className="font-semibold">
                {formatCurrency(monthlyCost, { baseUnits: true })}
                <span className="text-muted-foreground text-xs font-normal">
                  /month
                </span>
              </p>
              <p className="text-muted-foreground text-xs">
                Next: ~{format(nextChargeAt, 'd MMM')}
              </p>
            </div>
          </div>
        )
      )}
    </div>
  ) : (
    <div className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
      No recurring payments found
    </div>
  );

export default RecurringPaymentsList;
