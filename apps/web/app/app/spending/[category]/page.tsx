import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { siteConfig } from '@/lib/siteConfig';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import CategoryContent from './_components/category-content';
import CategoryContentSkeleton from './_components/category-content-skeleton';
import CategoryTitle from './_components/category-title';

const CategorySpendingPage = ({
  params,
}: {
  params: Promise<{ category: string }>;
}) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-4">
      <Button
        className="rounded-full"
        variant="outline"
        size="icon-xl"
        nativeButton={false}
        render={
          <Link href={siteConfig.baseLinks.appHome}>
            <ArrowLeft className="size-5" />
          </Link>
        }
      />
      <Suspense fallback={<Skeleton className="h-8 w-40" />}>
        <CategoryTitle params={params} />
      </Suspense>
    </div>
    <Suspense fallback={<CategoryContentSkeleton />}>
      <CategoryContent params={params} />
    </Suspense>
  </div>
);

export default CategorySpendingPage;
