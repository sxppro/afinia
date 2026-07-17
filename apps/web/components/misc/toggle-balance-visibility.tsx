'use client';

import { useBalanceVisibility } from '@/components/balance-visibility';
import { Button, buttonVariants } from '@/components/ui/button';
import { VariantProps } from 'class-variance-authority';
import { Eye, EyeOff } from 'lucide-react';

const ToggleBalanceVisibility = ({
  size,
}: {
  size: VariantProps<typeof buttonVariants>['size'];
}) => {
  const { isVisible, toggle } = useBalanceVisibility();

  return (
    <Button
      className="rounded-full"
      variant="outline"
      size={size}
      aria-label={isVisible ? 'Hide balances' : 'Show balances'}
      onClick={toggle}
    >
      {isVisible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
    </Button>
  );
};

export default ToggleBalanceVisibility;
