import { cn, colours } from '@/lib/ui';
import { transactionExternalTable } from 'afinia-common/schema';

interface TransactionItemCategoryProps {
  transaction: typeof transactionExternalTable.$inferSelect;
}

const TransactionItemCategory = ({
  transaction,
}: TransactionItemCategoryProps) => {
  const { category_parent_id, category_parent, category } = transaction;

  return (
    <div className="flex max-w-full items-center self-center rounded-full border">
      <span
        className={cn(
          'rounded-full px-4 py-1 font-medium',
          category_parent_id
            ? colours[category_parent_id].background
            : 'bg-up-uncategorised',
          // Invert text colour for all categories except for Good Life
          category_parent_id !== 'good-life'
            ? 'text-primary-foreground'
            : 'text-secondary-foreground'
        )}
      >
        {category_parent || 'Uncategorised'}
      </span>
      {category && (
        <span className="truncate px-4 py-1 font-medium">{category}</span>
      )}
    </div>
  );
};

export default TransactionItemCategory;
