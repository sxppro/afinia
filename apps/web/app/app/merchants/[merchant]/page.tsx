import CategoryIconOrInitial from '@/components/icons/category-icon-or-initial';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import SpendingByCategory from '@/components/vis/category/spending-by-category';
import SpendingByDay from '@/components/vis/category/spending-by-day';
import MerchantSpendingAverage from '@/components/vis/merchant/spending-average';
import MerchantSpendingMonthNavigation from '@/components/vis/merchant/spending-month-navigation';
import MerchantSpendingTotal from '@/components/vis/merchant/spending-total';
import TransactionList from '@/components/vis/transaction/transaction-list';
import { SMALL_PAGE_SIZE, TZ } from '@/lib/constants';
import { getStartOfDay } from '@/lib/dateTime';
import { getMerchantByName } from '@/lib/db/merchant';
import {
  getMerchantSpending,
  getMerchantSpendingByTimestamp,
} from '@/lib/db/spending';
import { siteConfig } from '@/lib/siteConfig';
import { colours } from '@/lib/ui';
import { TZDateMini } from '@date-fns/tz';
import { transactionExternalTable } from 'afinia-common/schema';
import {
  addMonths,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isMatch,
  max,
  min,
  parse,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { lt, sql, sum } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { appendFileSync } from 'node:fs';
import { Suspense } from 'react';

const MerchantInsightsPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ merchant: string }>;
  searchParams: Promise<{ month?: string }>;
}) => {
  const [{ merchant: merchantName }, { month }] = await Promise.all([
    params,
    searchParams,
  ]);

  // #region agent log
  appendFileSync(
    '/opt/cursor/logs/debug.log',
    `${JSON.stringify({
      hypothesisId: 'A,C,E',
      location: 'merchants/[merchant]/page.tsx:route-entry',
      message: 'Merchant page route inputs resolved',
      data: { merchantName, month: month ?? null },
      timestamp: Date.now(),
    })}\n`
  );
  // #endregion

  if (!merchantName) {
    return redirect(siteConfig.baseLinks.appHome);
  }

  const [merchant] = await getMerchantByName(decodeURIComponent(merchantName));

  if (!merchant?.name || !merchant.firstTransactionAt) {
    return redirect(siteConfig.baseLinks.appHome);
  }

  const currentMonth = startOfMonth(getStartOfDay());
  const requestedMonth =
    month && isMatch(month, 'yyyy-MM')
      ? startOfMonth(parse(month, 'yyyy-MM', currentMonth))
      : currentMonth;
  const earliestMonth = startOfMonth(
    new TZDateMini(merchant.firstTransactionAt, TZ)
  );
  const selectedMonth = max([
    earliestMonth,
    min([requestedMonth, currentMonth]),
  ]);
  const range = {
    start: selectedMonth,
    end: endOfMonth(selectedMonth),
  };
  const previousMonth = isAfter(selectedMonth, earliestMonth)
    ? format(subMonths(selectedMonth, 1), 'yyyy-MM')
    : null;
  const nextMonth = isBefore(selectedMonth, currentMonth)
    ? format(addMonths(selectedMonth, 1), 'yyyy-MM')
    : null;

  // #region agent log
  appendFileSync(
    '/opt/cursor/logs/debug.log',
    `${JSON.stringify({
      hypothesisId: 'C',
      location: 'merchants/[merchant]/page.tsx:month-selection',
      message: 'Merchant month range selected',
      data: {
        rawMonth: month ?? null,
        currentMonth: currentMonth.toISOString(),
        requestedMonth: requestedMonth.toISOString(),
        earliestMonth: earliestMonth.toISOString(),
        selectedMonth: selectedMonth.toISOString(),
        rangeStart: range.start.toISOString(),
        rangeEnd: range.end.toISOString(),
        previousMonth,
        nextMonth,
      },
      timestamp: Date.now(),
    })}\n`
  );
  // #endregion

  const spendingByDayFetch = getMerchantSpendingByTimestamp({
    merchant: merchant.name,
    interval: 'day',
    range,
  }).then((days) => {
    // #region agent log
    appendFileSync(
      '/opt/cursor/logs/debug.log',
      `${JSON.stringify({
        hypothesisId: 'B,D',
        location: 'merchants/[merchant]/page.tsx:day-query',
        message: 'Merchant daily spending query resolved',
        data: {
          selectedMonth: format(selectedMonth, 'yyyy-MM'),
          count: days.length,
          first: days.at(0) ?? null,
          last: days.at(-1) ?? null,
          total: days.reduce((total, day) => total + (day.value ?? 0), 0),
        },
        timestamp: Date.now(),
      })}\n`
    );
    // #endregion
    return days;
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
      categoryParentId: transactionExternalTable.category_parent_id,
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
      transactionExternalTable.category,
      transactionExternalTable.category_parent_id
    )
    .having(lt(sum(transactionExternalTable.value_in_base_units), 0))
    .orderBy(sql`value`)
    .then((categories) => {
      // #region agent log
      appendFileSync(
        '/opt/cursor/logs/debug.log',
        `${JSON.stringify({
          hypothesisId: 'B,D',
          location: 'merchants/[merchant]/page.tsx:category-query',
          message: 'Merchant category spending query resolved',
          data: {
            selectedMonth: format(selectedMonth, 'yyyy-MM'),
            categories: categories.map(({ categoryParentId, ...category }) => ({
              ...category,
              categoryParentId,
            })),
          },
          timestamp: Date.now(),
        })}\n`
      );
      // #endregion
      return categories.map(({ categoryParentId, ...category }) => ({
        ...category,
        barColor:
          colours[categoryParentId ?? category.key]?.background ??
          colours.uncategorised.background,
      }));
    });

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

      <MerchantSpendingMonthNavigation
        monthLabel={format(range.start, 'MMMM, yyyy')}
        previousMonth={previousMonth}
        nextMonth={nextMonth}
      >
        <div className="flex h-10 items-end gap-1 pb-1">
          <Suspense fallback={<Skeleton className="h-full w-24" />}>
            <MerchantSpendingTotal merchant={merchant.name} range={range} />
          </Suspense>
        </div>
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <SpendingByDay dataFetch={spendingByDayFetch} />
        </Suspense>
      </MerchantSpendingMonthNavigation>

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
            isInfinite
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
