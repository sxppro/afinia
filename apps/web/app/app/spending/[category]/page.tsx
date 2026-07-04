import CategoryIcon from '@/components/icons/category-icon';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import SpendingAverage from '@/components/vis/category/spending-average';
import SpendingByCategory from '@/components/vis/category/spending-by-category';
import SpendingByDay from '@/components/vis/category/spending-by-day';
import SpendingTotal from '@/components/vis/category/spending-total';
import TransactionList from '@/components/vis/transaction/transaction-list';
import { SMALL_PAGE_SIZE } from '@/lib/constants';
import { getStartOfDay } from '@/lib/dateTime';
import { getCategoryById } from '@/lib/db/category';
import {
  getCategorySpending,
  getCategorySpendingByTimestamp,
} from '@/lib/db/spending';
import { siteConfig } from '@/lib/siteConfig';
import { cn, colours } from '@/lib/ui';
import { transactionExternalTable } from 'afinia-common/schema';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { lt, sql, sum } from 'drizzle-orm';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

const CategorySpendingPage = async ({
  params,
}: {
  params: Promise<{ category: string }>;
}) => {
  const { category: categoryId } = await params;

  if (!categoryId) {
    return redirect(siteConfig.baseLinks.appHome);
  }

  const [categoryDetails] = await getCategoryById(categoryId);

  if (!categoryDetails) {
    return redirect(siteConfig.baseLinks.appHome);
  }

  const { category, category_parent } = categoryDetails;
  const range = {
    start: startOfMonth(getStartOfDay()),
    end: endOfMonth(getStartOfDay()),
  };
  const categorySpendingFetch = getCategorySpendingByTimestamp({
    category: category.category_id,
    interval: 'day',
    range,
  });
  // Only fetch sub-category data for parent categories
  const subCategorySpendingFetch = category_parent
    ? Promise.resolve([])
    : getCategorySpending({
        select: {
          href: sql<string>`CONCAT('${sql.raw(
            siteConfig.baseLinks.spending
          )}/', ${transactionExternalTable.category_id})`,
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
        <h1 className="text-2xl font-semibold">
          {categoryDetails.category.category_name}
        </h1>
      </div>

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
      <div>
        <div className="flex items-center justify-between">
          <p className="font-medium">{format(range.start, 'MMMM, yyyy')}</p>
          <div>
            <Button variant="ghost" className="has-[>svg]:px-1">
              <ArrowLeft className="size-5" />
            </Button>
            <Button variant="ghost" className="has-[>svg]:px-1">
              <ArrowRight className="size-5" />
            </Button>
          </div>
        </div>
        <div className="flex h-10 items-end gap-1 pb-1">
          <Suspense fallback={<Skeleton className="h-full w-24" />}>
            <SpendingTotal category={category.category_id} />
          </Suspense>
        </div>
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <SpendingByDay dataFetch={categorySpendingFetch} />
        </Suspense>
      </div>
      {category_parent ? null : (
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">Categories</h2>
          <Suspense fallback={<Skeleton className="h-24 w-full" />}>
            <SpendingByCategory
              category={category.category_id}
              dataFetch={subCategorySpendingFetch}
            />
          </Suspense>
        </div>
      )}
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
          />
        </Suspense>
      </div>
    </div>
  );
};

export default CategorySpendingPage;
