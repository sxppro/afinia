import CurrencyFlow from '@/components/currency-flow';
import { getTotalAccountBalance } from '@/lib/db/account';

const AccountBalanceTotal = async () => {
  const balance = await getTotalAccountBalance();

  return (
    <CurrencyFlow
      className="text-4xl/tight font-semibold"
      value={balance[0]?.value}
      signDisplay="auto"
    />
  );
};

export default AccountBalanceTotal;
