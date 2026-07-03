import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/siteConfig';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const AccountPageHeader = ({ accountName }: { accountName: string }) => {
  return (
    <div className="flex justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <Button
          className="shrink-0 rounded-full"
          variant="outline"
          size="icon-xl"
          nativeButton={false}
          render={
            <Link href={siteConfig.baseLinks.appHome}>
              <ArrowLeft className="size-5" />
            </Link>
          }
        />
        <h1 className="min-w-0 truncate text-2xl/tight font-bold">
          {accountName}
        </h1>
      </div>
    </div>
  );
};

export default AccountPageHeader;
