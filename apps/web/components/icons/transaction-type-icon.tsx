import { cn } from '@/lib/ui';
import {
  ArrowLeftRight,
  BanknoteArrowDown,
  BanknoteArrowUp,
  ChevronsUp,
  CircleQuestionMark,
  CreditCard,
  Gift,
  HandCoins,
  Landmark,
  Percent,
} from 'lucide-react';
import { createElement } from 'react';

const getTransactionTypeIcon = (type: string) => {
  switch (type) {
    case 'ATM Cash Out':
      return BanknoteArrowDown;
    case 'ATM Operator Fee':
      return Landmark;
    case 'Bonus Payment':
      return Gift;
    case 'BPay Payment':
      return BanknoteArrowDown;
    case 'Deposit':
      return BanknoteArrowUp;
    case 'Direct Credit':
      return BanknoteArrowUp;
    case 'Direct Debit':
      return BanknoteArrowDown;
    case 'Dividend':
      return HandCoins;
    case 'EFTPOS Deposit':
      return BanknoteArrowUp;
    case 'EFTPOS Purchase':
      return CreditCard;
    case 'EFTPOS Withdrawal':
      return BanknoteArrowDown;
    case 'Interest':
      return Percent;
    case 'International ATM Cash Out':
      return BanknoteArrowDown;
    case 'International Purchase':
      return CreditCard;
    case 'Osko Payment Received':
      return BanknoteArrowUp;
    case 'Pay Anyone':
      return BanknoteArrowDown;
    case 'Payment':
      return BanknoteArrowDown;
    case 'Payment Received':
      return BanknoteArrowUp;
    case 'PayTo Payment':
      return BanknoteArrowDown;
    case 'Purchase':
      return CreditCard;
    case 'Refund':
      return BanknoteArrowUp;
    case 'Round Up':
      return ChevronsUp;
    case 'Salary':
      return BanknoteArrowUp;
    case 'Scheduled Transfer':
      return ArrowLeftRight;
    case 'Transfer':
      return ArrowLeftRight;
    default:
      return CircleQuestionMark;
  }
};

const TransactionTypeIcon = ({
  type,
  className,
}: {
  type: string;
  className?: string;
}) => {
  const icon = getTransactionTypeIcon(type);
  return createElement(icon, { className: cn('size-6', className) });
};

export default TransactionTypeIcon;
