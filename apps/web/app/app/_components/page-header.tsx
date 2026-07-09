import OptionsDropdown from '@/components/misc/options-dropdown';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { Suspense } from 'react';
import UserInfo from './user-info';

const AppHomePageHeader = () => {
  return (
    <div className="flex items-center justify-between">
      <Suspense
        fallback={
          <div className="flex items-center gap-2">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-7 w-32" />
            </div>
          </div>
        }
      >
        <UserInfo />
      </Suspense>
      <div className="flex gap-2">
        <Button className="rounded-full" variant="outline" size="icon-xl">
          <Search className="size-5" />
        </Button>
        <OptionsDropdown />
      </div>
    </div>
  );
};

export default AppHomePageHeader;
