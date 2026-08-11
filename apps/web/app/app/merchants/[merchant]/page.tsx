import CategoryIconOrInitial from '@/components/icons/category-icon-or-initial';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import SpendingByCategory from '@/components/vis/category/spending-by-category';
import SpendingByDay from '@/components/vis/category/spending-by-day';
import MerchantSpendingAverage from '@/components/vis/merchant/spending-average';
import MerchantSpendingTotal from '@/components/vis/merchant/spending-total';
import TransactionList from '@/components/vis/transaction/transaction-list';
import { SMALL_PAGE_SIZE } from '@/lib/constants';
import { getStartOfDay } from '@/lib/dateTime';
import { getMerchantByName } from '@/lib/db/merchant';
import {
  getMerchantSpending,
  getMerchantSpendingByTimestamp,
} from '@/lib/db/spending';
import { siteConfig } from '@/lib/siteConfig';
import { transactionExternalTable } from 'afinia-common/schema';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { lt, sql, sum } from 'drizzle-orm';
import { appendFileSync } from 'node:fs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

const MerchantInsightsPage = async ({
  params,
}: {
  params: Promise<{ merchant: string }>;
}) => {
  // #region agent log
  appendFileSync('/opt/cursor/logs/debug.log', `${JSON.stringify({ hypothesisId: 'A,B,E', location: 'apps/web/app/app/merchants/[merchant]/page.tsx:entry', message: 'merchant route entered', data: {}, timestamp: Date.now() })}\n`);
  // #endregion
  const { merchant: merchantName } = await params;

  // #region agent log
  appendFileSync('/opt/cursor/logs/debug.log', `${JSON.stringify({ hypothesisId: 'A,B,C', location: 'apps/web/app/app/merchants/[merchant]/page.tsx:params', message: 'resolved merchant route parameter signature', data: { type: typeof merchantName, length: merchantName?.length, codePoints: merchantName ? Array.from(merchantName, (character) => character.codePointAt(0)) : null, hasPercent: merchantName?.includes('%'), hasSlash: merchantName?.includes('/'), hasApostrophe: merchantName?.includes("'") }, timestamp: Date.now() })}\n`);
  // #endregion
  if (!merchantName) {
    // #region agent log
    appendFileSync('/opt/cursor/logs/debug.log', `${JSON.stringify({ hypothesisId: 'A,E', location: 'apps/web/app/app/merchants/[merchant]/page.tsx:empty-redirect', message: 'redirecting because route parameter is empty', data: {}, timestamp: Date.now() })}\n`);
    // #endregion
    return redirect(siteConfig.baseLinks.appHome);
  }

  const [merchant] = await getMerchantByName(decodeURIComponent(merchantName));

  // #region agent log
  appendFileSync('/opt/cursor/logs/debug.log', `${JSON.stringify({ hypothesisId: 'C,D,E', location: 'apps/web/app/app/merchants/[merchant]/page.tsx:query-result', message: 'merchant lookup returned to route', data: { found: Boolean(merchant), nameType: typeof merchant?.name, nameLength: merchant?.name?.length }, timestamp: Date.now() })}\n`);
  // #endregion
  if (!merchant?.name) {
    // #region agent log
    appendFileSync('/opt/cursor/logs/debug.log', `${JSON.stringify({ hypothesisId: 'C,D,E', location: 'apps/web/app/app/merchants/[merchant]/page.tsx:not-found-redirect', message: 'redirecting because merchant lookup has no name', data: { found: Boolean(merchant) }, timestamp: Date.now() })}\n`);
    // #endregion
    return redirect(siteConfig.baseLinks.appHome);
  }

  // #region agent log
  appendFileSync('/opt/cursor/logs/debug.log', `${JSON.stringify({ hypothesisId: 'D,E', location: 'apps/web/app/app/merchants/[merchant]/page.tsx:render', message: 'rendering merchant insights route', data: { nameLength: merchant.name.length }, timestamp: Date.now() })}\n`);
  // #endregion
  const range = {
    start: startOfMonth(getStartOfDay()),
    end: endOfMonth(getStartOfDay()),
  };
  const spendingByDayFetch = getMerchantSpendingByTimestamp({
    merchant: merchant.name,
    interval: 'day',
    range,
  });
  const spendingByCategoryFetch = getMerchantSpending({
    select: {
      key: sql<string>`coalesce(${transactionExternalTable.category_id}, 'uncategorised')`,
      href: sql<string | undefined>`
        CASE
          WHEN ${transactionExternalTable.category_id} IS NULL THEN NULL
          ELSE CONCAT(
            '${sql.raw(siteConfig.baseLinks.spending)}/',
            ${transactionExternalTable.category_id}
          )
        END
      `,
      name: sql<string>`coalesce(${transactionExternalTable.category}, 'Uncategorised')`,
      value: sql<number>`abs(${sum(
        transactionExternalTable.value_in_base_units
      )})`
        .mapWith(Number)
        .as('value'),
    },
    range,
    merchant: merchant.name,
  })
    .groupBy(
      transactionExternalTable.category_id,
      transactionExternalTable.category
    )
    .having(lt(sum(transactionExternalTable.value_in_base_units), 0))
    .orderBy(sql`value`);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button
          className="rounded-full"
          variant="outline"
          size="icon-xl"
          nativeButton={false}
          render={
            <Link href={siteConfig.baseLinks.appHome}>
              <ArrowLeft className="size-5" />
            </Link>
          }
        />
        <h1 className="text-2xl/tight font-bold">{merchant.name}</h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="bg-primary text-primary-foreground flex aspect-square size-16 items-center justify-center rounded-2xl text-2xl font-semibold">
          <CategoryIconOrInitial
            description={merchant.name}
            className="size-8"
          />
        </span>
        <div className="flex-1">
          <p className="text-muted-foreground font-medium">Average per month</p>
          <Suspense fallback={<Skeleton className="h-9 w-32" />}>
            <MerchantSpendingAverage merchant={merchant.name} />
          </Suspense>
        </div>
      </div>

      <Separator />

      <div>
        <p className="font-medium">{format(range.start, 'MMMM, yyyy')}</p>
        <div className="flex h-10 items-end gap-1 pb-1">
          <Suspense fallback={<Skeleton className="h-full w-24" />}>
            <MerchantSpendingTotal merchant={merchant.name} />
          </Suspense>
        </div>
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <SpendingByDay dataFetch={spendingByDayFetch} />
        </Suspense>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Categories</h2>
        <Suspense fallback={<Skeleton className="h-24 w-full" />}>
          <SpendingByCategory dataFetch={spendingByCategoryFetch} />
        </Suspense>
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Transactions</h2>
        <Suspense
          fallback={
            <>
              {[...Array(SMALL_PAGE_SIZE)].map((_, index) => (
                <Skeleton className="h-12 w-full" key={index} />
              ))}
            </>
          }
        >
          <TransactionList
            options={{
              filters: { merchant: merchant.name },
              limit: SMALL_PAGE_SIZE,
            }}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default MerchantInsightsPage;
