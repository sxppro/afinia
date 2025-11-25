import CategoryIcon from '@/components/category-icon';
import { Unpacked } from '@/lib/types';
import { cn, colours } from '@/lib/ui';
import { transactionExternalTable } from 'afinia-ingest/schema';

const TransactionsList = async ({
  dataFetch,
}: {
  dataFetch: Promise<(typeof transactionExternalTable.$inferSelect)[]>;
}) => {
  const transactions = await dataFetch;

  const showCategoryIcon = ({
    category_id,
    description,
  }: Pick<
    Unpacked<Awaited<typeof transactions>>,
    'category_id' | 'description'
  >) => {
    if (category_id) {
      return <CategoryIcon category={category_id} />;
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

export default TransactionsList;
