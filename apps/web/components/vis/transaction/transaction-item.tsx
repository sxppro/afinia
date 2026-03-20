import CategoryIcon from '@/components/category-icon';
import { siteConfig } from '@/lib/siteConfig';
import { cn, colours, formatCurrency } from '@/lib/ui';
import { transactionExternalTable } from 'afinia-common/schema';
import { format, isThisYear } from 'date-fns';
import Link from 'next/link';

const TransactionItem = ({
  transaction,
}: {
  transaction: typeof transactionExternalTable.$inferSelect;
}) => {
  const {
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
    <div className="flex items-center gap-2">
      <Link
        href={
          category_id ? `${siteConfig.baseLinks.spending}/${category_id}` : '#'
        }
      >
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
      </Link>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex gap-4">
          <p className="font-medium truncate">{description}</p>
          <p className="shrink-0 font-medium ml-auto">
            {formatCurrency(value_in_base_units, {
              absolute: true,
              baseUnits: true,
              decimals: 2,
            })}
          </p>
        </div>
        <div className="flex gap-4">
          <p className="shrink-0 font-medium text-muted-foreground">
            {isThisYear(created_at)
              ? format(created_at, 'd MMM, h:mm aaa')
              : format(created_at, 'd MMM yyyy, h:mm aaa')}
          </p>
          <p className="min-w-8 font-medium text-muted-foreground ml-auto truncate">
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
