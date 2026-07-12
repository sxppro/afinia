'use client';

import { useBalanceVisibility } from '@/components/balance-visibility';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

const ToggleBalanceVisibility = () => {
  const { isVisible, toggle } = useBalanceVisibility();

  return (
    <Button
      className="rounded-full"
      variant="outline"
      size="icon-xl"
      aria-label={isVisible ? 'Hide balances' : 'Show balances'}
      onClick={toggle}
    >
      {isVisible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
    </Button>
  );
};

export default ToggleBalanceVisibility;
