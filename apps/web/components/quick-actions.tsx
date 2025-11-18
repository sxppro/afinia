import { getStartOfDay } from '@/lib/constants';
import { db } from '@/lib/db/client';
import { cn, colours, formatValueInBaseUnits } from '@/lib/ui';
import NumberFlow from '@number-flow/react';
import { categoryTable, transactionTable } from 'afinia-ingest/schema';
import { endOfMonth, startOfMonth } from 'date-fns';
import { and, eq, gte, isNull, lte, sum } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import Link from 'next/link';
import { Card, CardContent } from './ui/card';

const QuickActions = async () => {
  const range = {
    from: startOfMonth(getStartOfDay()),
    to: endOfMonth(getStartOfDay()),
  };
  // Category parent alias
  const categoryParent = alias(categoryTable, 'category_parent');
  // Category spending
  const spending = await db
    .select({
      id: categoryParent.category_id,
      name: categoryParent.category_name,
      value: sum(transactionTable.value_in_base_units).mapWith(Number),
    })
    .from(transactionTable)
    .innerJoin(
      categoryTable,
      eq(categoryTable.category_id, transactionTable.category_id)
    )
    .innerJoin(
      categoryParent,
      eq(categoryParent.category_id, categoryTable.category_parent_id)
    )
    .where(
      and(
        gte(transactionTable.created_at, range.from),
        lte(transactionTable.created_at, range.to)
      )
    )
    .groupBy(categoryParent.category_id, categoryParent.category_name);
  // All parent categories
  const categories = await db
    .select()
    .from(categoryTable)
    .where(isNull(categoryTable.category_parent_id));
  /**
   * Merge results to include all categories,
   * including those with no spending & sort
   * by alphabetical order
   */
  const spendingMap = new Map(spending.map((item) => [item.id, item.value]));
  const allSpending = categories
    .map((category) => ({
      id: category.category_id,
      name: category.category_name,
      value: spendingMap.get(category.category_id) ?? 0,
    }))
    .sort((a, b) => (a.id > b.id ? 1 : -1));

  return (
    <div className="grid grid-cols-2 gap-2">
      {allSpending.map(({ id, name, value }) => (
        <Link href={`/category/${id}`} key={id}>
          <Card className={cn('border-0', colours[id]?.background)}>
            <CardContent>
              <p>{name}</p>
              <NumberFlow
                value={formatValueInBaseUnits(value)}
                format={{
                  style: 'currency',
                  currency: 'AUD',
                  currencyDisplay: 'narrowSymbol',
                }}
              />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default QuickActions;
