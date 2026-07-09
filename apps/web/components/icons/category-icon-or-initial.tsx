import { TransactionRow } from '@/lib/types';
import { cn } from '@/lib/ui';
import { Ghost } from 'lucide-react';
import CategoryIcon from './category-icon';
import TransactionTypeIcon from './transaction-type-icon';

const CategoryIconOrInitial = ({
  category_id,
  description,
  type,
  className,
}: Partial<Pick<TransactionRow, 'category_id' | 'description' | 'type'>> & {
  className?: string;
}) => {
  if (category_id) {
    return <CategoryIcon category={category_id} className={className} />;
  }
  if (type) {
    return <TransactionTypeIcon type={type} className={className} />;
  }

  return description ? (
    description.charAt(0).toUpperCase()
  ) : (
    <Ghost className={cn('size-6', className)} />
  );
};

export default CategoryIconOrInitial;
