import CurrencyFlow from '@/components/currency-flow';
import { getAccountBalance } from '@/lib/db/account';

const AccountBalance = async ({ accountId }: { accountId: number }) => {
  const balance = await getAccountBalance(accountId);

  return (
    <CurrencyFlow
      className="text-4xl/tight font-semibold"
      value={balance[0]?.value}
      signDisplay="auto"
    />
  );
};

export default AccountBalance;
