import { getStartOfDay, now } from '@/lib/dateTime';
import { getParentCategories } from '@/lib/db/category';
import { getCategorySpending } from '@/lib/db/spending';
import { siteConfig } from '@/lib/siteConfig';
import { cn, colours } from '@/lib/ui';
import { transactionExternalTable } from 'afinia-common/schema';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { sum } from 'drizzle-orm';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import CategoryIcon from './category-icon';
import CurrencyFlow from './currency-flow';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

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
  const spending = await getCategorySpending({
    select: {
      id: transactionExternalTable.category_parent_id,
      name: transactionExternalTable.category_parent,
      value: sum(transactionExternalTable.value_in_base_units).mapWith(Number),
    },
    range,
  }).groupBy(
    transactionExternalTable.category_parent_id,
    transactionExternalTable.category_parent
  );
  const categories = await getParentCategories();
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
    <div className="flex flex-col gap-2">
      <Button
        variant="link"
        className="justify-start gap-0 has-[>svg]:px-0"
        render={
          <Link href={siteConfig.baseLinks.spending}>
            <h2 className="text-xl font-semibold">Spending</h2>
            <ChevronRight className="size-6" />
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-2">
        <p className="text-muted-foreground col-span-2">
          {format(now(), 'MMMM yyyy')}
        </p>
        {spendingByCategory.map((category) => (
          <QuickAction key={category.id} {...category} />
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
