'use client';

import TransactionsPageHeader from './_components/page-header';

const TransactionsPageError = () => {
  return (
    <div className="flex flex-col gap-2">
      <TransactionsPageHeader />

      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground w-full rounded border border-dashed p-4 text-center text-sm">
          Failed to load transactions
        </p>
      </div>
    </div>
  );
};

export default TransactionsPageError;
