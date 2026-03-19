'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { accountTable, categoryTable } from 'afinia-common/schema';
import { useQueryState } from 'nuqs';
import { use } from 'react';

interface TransactionListFiltersProps {
  accountsFetch?: Promise<(typeof accountTable.$inferSelect)[]>;
  categoriesFetch: Promise<(typeof categoryTable.$inferSelect)[]>;
}

const TransactionListFilters = ({
  categoriesFetch,
}: TransactionListFiltersProps) => {
  const categories = use(categoriesFetch);
  const [category, setCategory] = useQueryState('category', {
    defaultValue: 'all',
    shallow: false,
  });

  return (
    <div className="flex gap-1">
      <Select value={category ?? 'all'} onValueChange={setCategory}>
        <SelectTrigger className="w-full max-w-48">
          <SelectValue placeholder="Category">
            {category === 'all'
              ? 'All Categories'
              : categories.find((c) => c.category_id === category)
                  ?.category_name}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Category</SelectLabel>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem
                key={category.category_id}
                value={category.category_id}
              >
                {category.category_name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default TransactionListFilters;
