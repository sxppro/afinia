import { db } from '@/lib/db/client';
import { Unpacked } from '@/lib/types';
import { cn, colours } from '@/lib/ui';
import { transactionExternalTable } from 'afinia-ingest/schema';
import { desc } from 'drizzle-orm';
import getCategoryIcon from './category-icon';

const LatestTransactions = async () => {
  const transactions = await db
    .select()
    .from(transactionExternalTable)
    .limit(5)
    .orderBy(desc(transactionExternalTable.created_at));

  const showCategoryIcon = ({
    category_id,
    description,
  }: Pick<Unpacked<typeof transactions>, 'category_id' | 'description'>) => {
    if (category_id) {
      const Icon = getCategoryIcon(category_id);
      return Icon ? (
        <Icon className="size-6" />
      ) : (
        description?.charAt(0).toUpperCase()
      );
    }

    return description?.charAt(0).toUpperCase();
  };

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Latest Transactions</h2>
      {transactions.map(
        ({ transaction_id, description, category_id, category_parent_id }) => (
          <div className="flex items-center gap-2" key={transaction_id}>
            <span
              className={cn(
                'flex aspect-square items-center justify-center size-12 rounded-full text-white font-medium',
                category_parent_id
                  ? colours[category_parent_id].background
                  : 'bg-up-uncategorised'
              )}
            >
              {showCategoryIcon({ category_id, description })}
            </span>
            <p>{description}</p>
          </div>
        )
      )}
    </div>
  );
};

export default LatestTransactions;
