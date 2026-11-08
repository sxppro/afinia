import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/siteConfig';
import { ArrowLeft, Ellipsis } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';
import SpendingViewTabs from '../_components/spending-view-tabs';

/**
 * Ensures spending views are fully static. The build will fail
 * if request-time work is added.
 */
export const ensureStatic = 'navigation';

const SpendingViewsLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
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
          <h1 className="text-2xl/tight font-bold">Spending</h1>
        </div>
        <div>
          <Button className="rounded-full" variant="outline" size="icon-xl">
            <Ellipsis className="size-5" />
          </Button>
        </div>
      </div>

      <SpendingViewTabs />

      {children}
    </div>
  );
};

export default SpendingViewsLayout;
