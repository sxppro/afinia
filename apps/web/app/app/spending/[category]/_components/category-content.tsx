import CategoryIcon from '@/components/icons/category-icon';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import SpendingAverage from '@/components/vis/category/spending-average';
import SpendingByCategory from '@/components/vis/category/spending-by-category';
import SpendingByDay from '@/components/vis/category/spending-by-day';
import SpendingTotal from '@/components/vis/category/spending-total';
import TransactionList from '@/components/vis/transaction/transaction-list';
import { SMALL_PAGE_SIZE } from '@/lib/constants';
import { getEarliestAccountCreatedAt } from '@/lib/db/account';
import { getCategoryDetails } from '@/lib/db/category';
import { getSpendingTimeSeries } from '@/lib/db/spending';
import { getExternalTransactions } from '@/lib/db/transaction';
import { siteConfig } from '@/lib/siteConfig';
import { cn, colours } from '@/lib/ui';
import { transactionExternalTable } from 'afinia-common/schema';
import { endOfMonth } from 'date-fns';
import { lt, sql, sum } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import SpendingHourly from '../../_components/trends/spending-hourly';
import { monthLoader, resolveSpendingMonth } from '../../_lib/month';
import CategoryMonthCarousel from './category-month-carousel';

const CategoryContent = async ({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{
    month?: string | string[];
    heatmap?: string | string[];
    heatmapView?: string | string[];
  }>;
}) => {
  const { category: categoryId } = await params;
  const categoryDetails = categoryId
    ? await getCategoryDetails(categoryId)
    : null;

  if (!categoryDetails) {
    return redirect(siteConfig.baseLinks.appHome);
  }

  // Fetch spending data at request time
  await connection();

  const { category, category_parent } = categoryDetails;
  const [{ month }, earliest] = await Promise.all([
    monthLoader(searchParams),
    getEarliestAccountCreatedAt(),
  ]);
  const {
    months,
    currentMonth,
    selectedMonth,
    range: { start: monthStart },
  } = resolveSpendingMonth(month, earliest?.date);
  const range = { start: monthStart, end: endOfMonth(monthStart) }; // Get end of month so chart shows future days

  const categorySpendingFetch = getSpendingTimeSeries({
    category: category.category_id,
    interval: 'day',
    range,
  });
  // Only fetch sub-category data for parent categories
  const subCategorySpendingFetch = category_parent
    ? Promise.resolve([])
    : getExternalTransactions({
        select: {
          href: sql<string>`CONCAT('${sql.raw(
            siteConfig.baseLinks.spending
          )}/', ${transactionExternalTable.category_id}, '?month=${sql.raw(
            selectedMonth
          )}')`,
          name: transactionExternalTable.category,
          value: sql<number>`abs(${sum(
            transactionExternalTable.value_in_base_units
          )})`
            .mapWith(Number)
            .as('value'),
        },
        range,
        category: category.category_id,
      })
        .groupBy(
          transactionExternalTable.category_id,
          transactionExternalTable.category
        )
        .having(lt(sum(transactionExternalTable.value_in_base_units), 0))
        .orderBy(sql`value`);

  return (
    <>
      <div className="flex items-center gap-4">
        <span
          className={cn(
            'flex aspect-square size-16 items-center justify-center rounded-2xl text-white',
            category_parent?.category_id
              ? colours[category_parent.category_id].background
              : colours[category.category_id].background ||
                  'bg-up-uncategorised'
          )}
        >
          <CategoryIcon category={category.category_id} className="size-8" />
        </span>
        <div className="flex-1">
          <p className="text-muted-foreground font-medium">Average per month</p>
          <Suspense fallback={<Skeleton className="h-9 w-32" />}>
            <SpendingAverage category={category.category_id} />
          </Suspense>
        </div>
      </div>
      <Separator />
      <CategoryMonthCarousel
        months={months}
        selected={selectedMonth}
        currentMonth={currentMonth}
        total={
          <Suspense fallback={<Skeleton className="h-full w-24" />}>
            <SpendingTotal category={category.category_id} range={range} />
          </Suspense>
        }
        chart={
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <SpendingByDay dataFetch={categorySpendingFetch} />
          </Suspense>
        }
        categories={
          category_parent ? null : (
            <Suspense fallback={<Skeleton className="h-24 w-full" />}>
              <SpendingByCategory
                category={category.category_id}
                dataFetch={subCategorySpendingFetch}
              />
            </Suspense>
          )
        }
      />
      <Separator />
      <div className="flex flex-col gap-2">
        <div>
          <h2 className="text-xl font-semibold">Spending patterns</h2>
          <p className="text-muted-foreground text-sm">
            By hour and day of week
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-105 w-full" />}>
          <SpendingHourly
            searchParams={searchParams}
            category={category.category_id}
            colour={category_parent?.category_id ?? category.category_id}
          />
        </Suspense>
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Transactions</h2>
        <Suspense
          fallback={
            <>
              {[...Array(SMALL_PAGE_SIZE)].map((_, i) => (
                <Skeleton className="h-12 w-full" key={i} />
              ))}
            </>
          }
        >
          <TransactionList
            options={{
              filters: { category_id: category.category_id },
              limit: SMALL_PAGE_SIZE,
            }}
            isInfinite
          />
        </Suspense>
      </div>
    </>
  );
};

export default CategoryContent;
