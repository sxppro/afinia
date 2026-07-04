import CategoryIconOrInitial from '@/components/icons/category-icon-or-initial';
import { TZ } from '@/lib/constants';
import { siteConfig } from '@/lib/siteConfig';
import { TransactionRow } from '@/lib/types';
import { cn, colours, formatCurrency } from '@/lib/ui';
import { TZDateMini } from '@date-fns/tz';
import { format, isThisYear } from 'date-fns';
import Link from 'next/link';
import TransactionItemDetails from './transaction-item-details';

const TransactionItem = ({ transaction }: { transaction: TransactionRow }) => {
  const {
    description,
    card_number_suffix,
    category_id,
    category_parent_id,
    created_at,
    currency_code,
    is_categorizable,
    type,
    value_in_base_units,
  } = transaction;

  // Format timestamp in timezone
  const tzCreatedAt = new TZDateMini(created_at, TZ);

  return (
    <div className="flex items-center gap-2">
      <Link
        href={
          category_id ? `${siteConfig.baseLinks.spending}/${category_id}` : '#'
        }
      >
        <span
          className={cn(
            'flex aspect-square size-12 items-center justify-center rounded-xl text-xl font-semibold text-white',
            is_categorizable
              ? category_parent_id
                ? colours[category_parent_id].background
                : 'bg-up-uncategorised'
              : 'bg-teal-600/40'
          )}
        >
          <CategoryIconOrInitial
            category_id={category_id}
            description={description}
            type={type}
          />
        </span>
      </Link>
      <TransactionItemDetails transaction={transaction}>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex gap-4">
            <p className="truncate font-medium">{description}</p>
            <p className="ml-auto shrink-0 font-medium">
              {formatCurrency(value_in_base_units, {
                absolute: true,
                baseUnits: true,
                decimals: 2,
                currency: currency_code,
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
      </TransactionItemDetails>
    </div>
  );
};

export default TransactionItem;
