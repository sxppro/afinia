import CurrencyFlow from '@/components/currency-flow';
import { getAccountBalance } from '@/lib/db/account';

const AccountBalance = async ({ accountId }: { accountId: number }) => {
  const [balance] = await getAccountBalance(accountId);

  return (
    <CurrencyFlow
      className="text-4xl/tight font-semibold"
      value={balance?.value ?? 0}
      signDisplay="auto"
    />
  );
};

export default AccountBalance;
