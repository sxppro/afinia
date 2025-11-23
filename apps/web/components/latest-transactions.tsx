import { siteConfig } from '@/lib/siteConfig';
import { Unpacked } from '@/lib/types';
import { cn, colours } from '@/lib/ui';
import { transactionExternalTable } from 'afinia-ingest/schema';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import getCategoryIcon from './category-icon';
import { Button } from './ui/button';

const LatestTransactions = async ({
  transactionsFetch,
}: {
  transactionsFetch: Promise<(typeof transactionExternalTable.$inferSelect)[]>;
}) => {
  const transactions = await transactionsFetch;

  const showCategoryIcon = ({
    category_id,
    description,
  }: Pick<
    Unpacked<Awaited<typeof transactions>>,
    'category_id' | 'description'
  >) => {
    if (category_id) {
      const Icon = getCategoryIcon(category_id);
      return Icon ? (
        <Icon className="size-6" />
      ) : (
        description?.charAt(0).toUpperCase()
      );
    }

    return description?.charAt(0).toUpperCase();
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="link"
        className="justify-start has-[>svg]:px-0 gap-0"
        asChild
      >
        <Link href={siteConfig.baseLinks.transactions}>
          <h2 className="text-xl font-semibold">Transactions</h2>
          <ChevronRight className="size-6" />
        </Link>
      </Button>

      {transactions.map(
        ({ transaction_id, description, category_id, category_parent_id }) => (
          <div className="flex items-center gap-2" key={transaction_id}>
            <span
              className={cn(
                'flex aspect-square items-center justify-center size-12 rounded-full text-white text-xl font-semibold',
                category_parent_id
                  ? colours[category_parent_id].background
                  : 'bg-up-uncategorised'
              )}
            >
              {showCategoryIcon({ category_id, description })}
            </span>
            <p>{description}</p>
          </div>
        )
      )}
    </div>
  );
};

export default LatestTransactions;
