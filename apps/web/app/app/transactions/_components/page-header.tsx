import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/siteConfig';
import { ArrowLeft, Ellipsis } from 'lucide-react';
import Link from 'next/link';

const TransactionsPageHeader = () => {
  return (
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
        <h1 className="text-2xl/tight font-bold">Transactions</h1>
      </div>
      <div>
        <Button className="rounded-full" variant="outline" size="icon-xl">
          <Ellipsis className="size-5" />
        </Button>
      </div>
    </div>
  );
};

export default TransactionsPageHeader;
