import CategoryIcon from '@/components/category-icon';
import CurrencyFlow from '@/components/currency-flow';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getStartOfDay } from '@/lib/dateTime';
import { getParentCategories } from '@/lib/db/category';
import { getCategorySpending } from '@/lib/db/spending';
import { siteConfig } from '@/lib/siteConfig';
import { cn, colours } from '@/lib/ui';
import { transactionExternalTable } from 'afinia-common/schema';
import { endOfMonth, startOfMonth } from 'date-fns';
import { sum } from 'drizzle-orm';
import Link from 'next/link';

export const QuickActionsLoading = () => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[...Array(4)].map((_, i) => (
        <Card className="rounded-3xl bg-gray-50 p-4" key={i}>
          <CardContent className="flex flex-col items-start gap-1 p-0">
            <Skeleton className="mb-4 size-10 rounded-lg" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/**
 * Single quick action tile
 * @param param0 category id, name and amount spent
 */
const QuickAction = ({
  id,
  name,
  value,
}: {
  id: string;
  name: string;
  value: number;
}) => {
  return (
    <Link href={`${siteConfig.baseLinks.spending}/${id}`} key={id}>
      <Card className={cn('rounded-3xl p-4', colours[id]?.background)}>
        <CardContent className="flex flex-col items-start justify-start p-0 font-medium text-white">
          <div className="mb-4 rounded-lg bg-black/20 p-2">
            <CategoryIcon category={id} />
          </div>
          <p>{name}</p>
          <CurrencyFlow className="text-xl font-bold" value={value} />
        </CardContent>
      </Card>
    </Link>
  );
};

const QuickActions = async () => {
  const range = {
    start: startOfMonth(getStartOfDay()),
    end: endOfMonth(getStartOfDay()),
  };
  const [spending, categories] = await Promise.all([
    getCategorySpending({
      select: {
        id: transactionExternalTable.category_parent_id,
        name: transactionExternalTable.category_parent,
        value: sum(transactionExternalTable.value_in_base_units).mapWith(
          Number
        ),
      },
      range,
    }).groupBy(
      transactionExternalTable.category_parent_id,
      transactionExternalTable.category_parent
    ),
    getParentCategories(),
  ]);
  /**
   * Merge results to include all categories,
   * including those with no spending & sort
   * by alphabetical order
   */
  const spendingMap = new Map(spending.map((item) => [item.id, item.value]));
  const spendingByCategory = categories
    .map((category) => ({
      id: category.category_id,
      name: category.category_name,
      value: spendingMap.get(category.category_id) ?? 0,
    }))
    .sort((a, b) => (a.id > b.id ? 1 : -1));

  return (
    <div className="grid grid-cols-2 gap-2">
      {spendingByCategory.map((category) => (
        <QuickAction key={category.id} {...category} />
      ))}
    </div>
  );
};

export default QuickActions;
