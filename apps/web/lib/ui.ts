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
 * @param decimals include decimals
 * @returns number formatted in AUD
 */
export const formatCurrency = (
  number: number,
  decimals: number = 0,
  compact: boolean = false,
  signDisplay: 'auto' | 'never' = 'auto'
) =>
  Intl.NumberFormat('default', {
    style: 'currency',
    currency: 'AUD',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: decimals,
    signDisplay,
    ...(compact && { notation: 'compact', compactDisplay: 'short' }),
  })
    .format(number ?? 0)
    .toString();
