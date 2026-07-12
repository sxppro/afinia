import CurrencyFlow from '@/components/vis/currency-flow';
import { getAccountBalance } from '@/lib/db/account';

const AccountBalance = async ({ accountId }: { accountId: number }) => {
  const [balance] = await getAccountBalance(accountId);

  return (
    <CurrencyFlow
      className="-mt-1 text-3xl/tight font-semibold"
      value={balance?.value ?? 0}
      signDisplay="auto"
      hideable
    />
  );
};

export default AccountBalance;
