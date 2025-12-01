import CategoryIcon from '@/components/category-icon';
import SpendingByDayLineChart from '@/components/dashboards/spending/spending-by-day';
import SpendingTotalByCategory from '@/components/dashboards/spending/spending-total-by-category';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getStartOfDay } from '@/lib/constants';
import { getCategoryById } from '@/lib/db/category';
import { getCategorySpendingByTimestamp } from '@/lib/db/spending';
import { siteConfig } from '@/lib/siteConfig';
import { cn, colours } from '@/lib/ui';
import { endOfMonth, format, startOfMonth } from 'date-fns';
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

  const categoryDetails = await getCategoryById(categoryId);

  if (!categoryDetails[0]) {
    return redirect(siteConfig.baseLinks.appHome);
  }

  const { category, category_parent } = categoryDetails[0];
  const range = {
    from: startOfMonth(getStartOfDay()),
    to: endOfMonth(getStartOfDay()),
  };
  const categorySpendingFetch = getCategorySpendingByTimestamp({
    category: category.category_id,
    interval: 'day',
    range,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button
          className="rounded-full"
          variant="outline"
          size="icon-xl"
          asChild
        >
          <Link href={siteConfig.baseLinks.appHome}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">
          {categoryDetails.at(0)?.category.category_name}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <span
          className={cn(
            'flex aspect-square items-center justify-center text-white size-16 rounded-2xl',
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
          <p className="text-3xl/tight font-semibold">$0.00</p>
        </div>
      </div>
      <Separator />
      <div>
        <div className="flex items-center justify-between">
          <p className="font-medium">{format(range.from, 'MMMM, yyyy')}</p>
          <div>
            <Button variant="ghost" className="has-[>svg]:px-1">
              <ArrowLeft className="size-5" />
            </Button>
            <Button variant="ghost" className="has-[>svg]:px-1">
              <ArrowRight className="size-5" />
            </Button>
          </div>
        </div>
        <div className="flex items-end gap-1">
          <Suspense fallback={<Skeleton className="h-8 w-16" />}>
            <SpendingTotalByCategory category={category.category_id} />
          </Suspense>
          <p className="text-muted-foreground font-medium pb-1">Spent</p>
        </div>
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <SpendingByDayLineChart dataFetch={categorySpendingFetch} />
        </Suspense>
      </div>
      <Separator />
    </div>
  );
};

export default CategorySpendingPage;
