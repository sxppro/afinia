import { Unpacked } from '@/lib/types';
import { cn, colours } from '@/lib/ui';
import { transactionExternalTable } from 'afinia-ingest/schema';
import getCategoryIcon from '../../category-icon';

const LatestTransactions = async ({
  transactionsFetch,
}: {
  transactionsFetch: Promise<(typeof transactionExternalTable.$inferSelect)[]>;
}) => {
  const transactions = await transactionsFetch;

  const showCategoryIcon = ({
    category_id,
    description,
  }: Pick<
    Unpacked<Awaited<typeof transactions>>,
    'category_id' | 'description'
  >) => {
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
    <>
      {transactions.map(
        ({ transaction_id, description, category_id, category_parent_id }) => (
          <div className="flex items-center gap-2" key={transaction_id}>
            <span
              className={cn(
                'flex aspect-square items-center justify-center size-12 rounded-full text-white text-xl font-semibold',
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
    </>
  );
};

export default LatestTransactions;
