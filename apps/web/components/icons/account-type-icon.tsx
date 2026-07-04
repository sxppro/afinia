import { cn } from '@/lib/ui';
import { AccountTypeEnum } from 'afinia-common/providers/up';
import { CircleQuestionMark, Landmark, PiggyBank, Wallet } from 'lucide-react';
import { createElement } from 'react';

const getAccountTypeIcon = (type: string) => {
  switch (type) {
    case AccountTypeEnum.SAVER:
      return PiggyBank;
    case AccountTypeEnum.TRANSACTIONAL:
      return Wallet;
    case AccountTypeEnum.HOME_LOAN:
      return Landmark;
    default:
      return CircleQuestionMark;
  }
};

const AccountTypeIcon = ({
  type,
  className,
}: {
  type: string;
  className?: string;
}) => {
  const icon = getAccountTypeIcon(type);
  return createElement(icon, { className: cn('size-6', className) });
};

export default AccountTypeIcon;
