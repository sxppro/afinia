'use client';

import { AreaChart } from '@/components/ui/area-chart';
import { BarChart } from '@/components/ui/bar-chart';
import { formatCurrency } from '@/lib/ui';
import type { ComponentProps } from 'react';

const baseCurrency = (value: number) =>
  formatCurrency(value, { baseUnits: true, absolute: true });

export const CurrencyBarChart = (
  props: Omit<ComponentProps<typeof BarChart>, 'valueFormatter'>
) => <BarChart {...props} valueFormatter={baseCurrency} />;

export const CurrencyAreaChart = (
  props: Omit<ComponentProps<typeof AreaChart>, 'valueFormatter'>
) => <AreaChart {...props} valueFormatter={baseCurrency} />;
