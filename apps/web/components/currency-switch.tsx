import { cn } from '@/lib/ui';
import { Switch } from './ui/switch';

const CurrencySwitch = ({
  checked,
  onCheckedChange,
  baseCurrency,
  foreignCurrency,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  baseCurrency: string;
  foreignCurrency: string;
}) => {
  return (
    <div className="relative inline-grid h-6 grid-cols-[1fr_1fr] items-center text-xs font-medium">
      <Switch
        checked={!checked}
        onCheckedChange={() => onCheckedChange(!checked)}
        className={cn(
          'peer absolute inset-0 h-[inherit] w-auto rounded-full',
          'data-[state=unchecked]:bg-secondary-foreground data-[state=checked]:bg-secondary-foreground',
          '[&_span]:z-10 [&_span]:h-full [&_span]:w-1/2 [&_span]:rounded-full',
          '[&_span]:transition-transform [&_span]:duration-300 [&_span]:ease-[cubic-bezier(0.16,1,0.3,1)]',
          '[&_span]:data-[state=checked]:translate-x-full'
        )}
      />
      {/* Foreign currency label */}
      <span
        className={cn(
          'pointer-events-none relative z-20 flex items-center justify-center px-2 text-center',
          'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'peer-data-[state=checked]:text-primary-foreground',
          'peer-data-[state=unchecked]:text-secondary-foreground'
        )}
      >
        {foreignCurrency}
      </span>
      {/* Base currency label */}
      <span
        className={cn(
          'pointer-events-none relative z-20 flex items-center justify-center px-2 text-center',
          'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'peer-data-[state=unchecked]:text-primary-foreground',
          'peer-data-[state=checked]:text-secondary-foreground'
        )}
      >
        {baseCurrency}
      </span>
    </div>
  );
};

export default CurrencySwitch;
