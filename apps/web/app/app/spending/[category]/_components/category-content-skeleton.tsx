import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { SMALL_PAGE_SIZE } from '@/lib/constants';

const CategoryContentSkeleton = () => (
  <>
    <div className="flex items-center gap-4">
      <Skeleton className="size-16 rounded-2xl" />
      <div className="flex-1">
        <p className="text-muted-foreground font-medium">Average per month</p>
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
    <Separator />
    <div>
      <div className="flex h-9 items-center">
        <Skeleton className="h-5 w-28" />
      </div>
      <div className="flex h-10 items-end gap-1 pb-1">
        <Skeleton className="h-full w-24" />
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-semibold">Categories</h2>
      <Skeleton className="h-24 w-full" />
    </div>
    <div className="flex flex-col gap-2">
      <div>
        <h2 className="text-xl font-semibold">Spending patterns</h2>
        <p className="text-muted-foreground text-sm">By hour and day of week</p>
      </div>
      <Skeleton className="h-104 w-full" />
    </div>
    <Separator />
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-semibold">Transactions</h2>
      {[...Array(SMALL_PAGE_SIZE)].map((_, i) => (
        <Skeleton className="h-12 w-full" key={i} />
      ))}
    </div>
  </>
);

export default CategoryContentSkeleton;
