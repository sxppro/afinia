import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const AppLoading = () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-12"></div>
      <Skeleton className="h-20" />
      <Separator />
      <Skeleton className="h-96" />
      <Separator />
      <div className="flex flex-col gap-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton className="h-12 w-full" key={i} />
        ))}
      </div>
    </div>
  );
};

export default AppLoading;
