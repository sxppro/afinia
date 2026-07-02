import AccountTransactions from './_components/account-transactions';
import AccountPageHeader from './_components/page-header';

const AccountPage = ({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) => {
  return (
    <div className="flex flex-col gap-2">
      <AccountPageHeader />
      <h2 className="text-xl font-semibold">Transactions</h2>
      <div className="flex flex-col gap-2">
        <AccountTransactions params={params} />
      </div>
    </div>
  );
};

export default AccountPage;
