import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const colours: {
  [key: string]: Record<'background' | 'stroke' | 'fill' | 'text', string>;
} = {
  'good-life': {
    background: 'bg-up-good-life',
    stroke: 'stroke-up-good-life',
    fill: 'fill-up-good-life',
    text: 'text-up-good-life',
  },
  home: {
    background: 'bg-up-home',
    stroke: 'stroke-up-home',
    fill: 'fill-up-home',
    text: 'text-up-home',
  },
  personal: {
    background: 'bg-up-personal',
    stroke: 'stroke-up-personal',
    fill: 'fill-up-personal',
    text: 'text-up-personal',
  },
  transport: {
    background: 'bg-up-transport',
    stroke: 'stroke-up-transport',
    fill: 'fill-up-transport',
    text: 'text-up-transport',
  },
  uncategorised: {
    background: 'bg-up-uncategorised',
    stroke: 'stroke-up-uncategorised',
    fill: 'fill-up-uncategorised',
    text: 'text-up-uncategorised',
  },
};

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

/**
 * Formats integer values in base units (cents)
 * to dollar amounts
 * @param value cents
 * @returns dollars
 */
export const formatValueInBaseUnits = (value: number) => {
  return parseFloat((value / 100).toFixed(2));
};

/**
 * Currency formatter for numbers
 * @param number number to format
 * @returns number formatted in AUD
 */
export const formatCurrency = (
  number: number,
  options?: {
    decimals?: number;
    compact?: boolean;
    absolute?: boolean;
    baseUnits?: boolean;
  }
) => {
  const {
    decimals = 0,
    compact = false,
    absolute = false,
    baseUnits = false,
  } = options ?? {};

  const value = baseUnits ? formatValueInBaseUnits(number) : number;

  return Intl.NumberFormat('default', {
    style: 'currency',
    currency: 'AUD',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: decimals,
    signDisplay: absolute ? (number > 0 ? 'exceptZero' : 'never') : 'auto',
    ...(compact && { notation: 'compact', compactDisplay: 'short' }),
  })
    .format(value)
    .toString();
};
