import CategoryIcon from '@/components/category-icon';
import { cn, colours, formatCurrency } from '@/lib/ui';
import { transactionExternalTable } from 'afinia-common/schema';
import { format, isThisYear } from 'date-fns';

const TransactionItem = ({
  transaction,
}: {
  transaction: typeof transactionExternalTable.$inferSelect;
}) => {
  const {
    transaction_id,
    description,
    card_number_suffix,
    category_id,
    category_parent_id,
    created_at,
    type,
    value_in_base_units,
  } = transaction;

  const showCategoryIcon = ({
    category_id,
    description,
  }: Pick<typeof transaction, 'category_id' | 'description'>) => {
    if (category_id) {
      return <CategoryIcon category={category_id} />;
    }
    return description?.charAt(0).toUpperCase();
  };

  return (
    <div className="flex items-center gap-2" key={transaction_id}>
      <span
        className={cn(
          'flex aspect-square items-center justify-center size-12 rounded-full text-white text-xl font-semibold',
          category_parent_id
            ? colours[category_parent_id].background
            : 'bg-up-uncategorised',
        )}
      >
        {showCategoryIcon({ category_id, description })}
      </span>
      <div className="flex flex-col flex-1">
        <div className="flex gap-2">
          <p className="font-medium">{description}</p>
          <p className="font-medium ml-auto">
            {formatCurrency(value_in_base_units, {
              absolute: true,
              baseUnits: true,
              decimals: 2,
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <p className="font-medium text-muted-foreground">
            {isThisYear(created_at)
              ? format(created_at, 'dd MMM')
              : format(created_at, 'dd MMM, yyyy')}
          </p>
          <p className="font-medium text-muted-foreground ml-auto">
            {type
              ? type
              : card_number_suffix
                ? `Card ···· ${card_number_suffix}`
                : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;
