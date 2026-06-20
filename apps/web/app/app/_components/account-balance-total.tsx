import CurrencyFlow from '@/components/currency-flow';
import { getAccountBalance } from '@/lib/db/account';

const AccountBalanceTotal = async () => {
  const balance = await getAccountBalance();

  return (
    <CurrencyFlow
      className="text-4xl/tight font-semibold"
      value={balance[0]?.value}
      signDisplay="auto"
    />
  );
};

export default AccountBalanceTotal;
