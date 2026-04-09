import CategoryIcon from '@/components/category-icon';
import { TZ } from '@/lib/constants';
import { siteConfig } from '@/lib/siteConfig';
import { cn, colours, formatCurrency } from '@/lib/ui';
import { TZDateMini } from '@date-fns/tz';
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

  // Format timestamp in timezone
  const tzCreatedAt = new TZDateMini(created_at, TZ);

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
            'flex aspect-square size-12 items-center justify-center rounded-full text-xl font-semibold text-white',
            category_parent_id
              ? colours[category_parent_id].background
              : 'bg-up-uncategorised'
          )}
        >
          {showCategoryIcon({ category_id, description })}
        </span>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex gap-4">
          <p className="truncate font-medium">{description}</p>
          <p className="ml-auto shrink-0 font-medium">
            {formatCurrency(value_in_base_units, {
              absolute: true,
              baseUnits: true,
              decimals: 2,
            })}
          </p>
        </div>
        <div className="flex gap-4">
          <p className="text-muted-foreground shrink-0 font-medium">
            {isThisYear(tzCreatedAt)
              ? format(tzCreatedAt, 'd MMM, h:mm aaa')
              : format(tzCreatedAt, 'd MMM yyyy, h:mm aaa')}
          </p>
          <p className="text-muted-foreground ml-auto min-w-8 truncate font-medium">
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
