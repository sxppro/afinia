import CurrencyFlow from '@/components/vis/currency-flow';
import { getTotalAccountBalance } from '@/lib/db/account';

const AccountBalanceTotal = async () => {
  const [balance] = await getTotalAccountBalance();

  return (
    <CurrencyFlow
      className="text-4xl/tight font-semibold"
      value={balance?.value ?? 0}
      signDisplay="auto"
      hideable
    />
  );
};

export default AccountBalanceTotal;
