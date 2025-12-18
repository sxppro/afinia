'use client';

import { debounce } from '@/lib/ui';
import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { Input } from '../ui/input';

const SearchInput = ({ placeholder }: { placeholder?: string }) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useMemo(
    () =>
      debounce((term: string) => {
        const params = new URLSearchParams(searchParams);
        console.log(term, params.toString());
        if (term) {
          params.set('query', term);
        } else {
          params.delete('query');
        }
        replace(`${pathname}?${params.toString()}`, { scroll: false });
      }, 300),
    [searchParams, pathname, replace]
  );

  return (
    <div className="relative w-full">
      <Search className='absolute left-3 top-1/2 h-[18px] w-[18px] stroke-muted-foreground -translate-y-1/2 peer-focus:text-gray-900"' />
      <Input
        className="pl-10"
        type="text"
        defaultValue={searchParams.get('query')?.toString()}
        placeholder={placeholder}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
};

export default SearchInput;
