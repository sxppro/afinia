import { TransactionRow } from '@/lib/types';
import CategoryIcon from './category-icon';

const CategoryIconOrInitial = ({
  category_id,
  description,
  className,
}: Pick<TransactionRow, 'category_id' | 'description'> & {
  className?: string;
}) => {
  if (category_id) {
    return <CategoryIcon category={category_id} className={className} />;
  }
  return description?.charAt(0).toUpperCase();
};

export default CategoryIconOrInitial;
