import TransactionList from '@/components/vis/transaction/transaction-list';

const AccountTransactions = async ({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) => {
  const { accountId } = await params;

  return (
    <TransactionList
      options={{
        filters: { account_id: Number(accountId), include_transfers: true },
      }}
    />
  );
};

export default AccountTransactions;
