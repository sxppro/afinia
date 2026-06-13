import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DEFAULT_CURRENCY } from './constants';
import { now } from './dateTime';

export const colours: {
  [key: string]: Record<
    | 'background'
    | 'backgroundMuted'
    | 'border'
    | 'borderMuted'
    | 'stroke'
    | 'fill'
    | 'text',
    string
  >;
} = {
  'good-life': {
    background: 'bg-up-good-life',
    backgroundMuted: 'bg-up-good-life/10',
    border: 'border-up-good-life',
    borderMuted: 'border-up-good-life/20',
    stroke: 'stroke-up-good-life',
    fill: 'fill-up-good-life',
    text: 'text-up-good-life',
  },
  home: {
    background: 'bg-up-home',
    backgroundMuted: 'bg-up-home/10',
    border: 'border-up-home',
    borderMuted: 'border-up-home/20',
    stroke: 'stroke-up-home',
    fill: 'fill-up-home',
    text: 'text-up-home',
  },
  personal: {
    background: 'bg-up-personal',
    backgroundMuted: 'bg-up-personal/10',
    border: 'border-up-personal',
    borderMuted: 'border-up-personal/20',
    stroke: 'stroke-up-personal',
    fill: 'fill-up-personal',
    text: 'text-up-personal',
  },
  transport: {
    background: 'bg-up-transport',
    backgroundMuted: 'bg-up-transport/10',
    border: 'border-up-transport',
    borderMuted: 'border-up-transport/20',
    stroke: 'stroke-up-transport',
    fill: 'fill-up-transport',
    text: 'text-up-transport',
  },
  uncategorised: {
    background: 'bg-up-uncategorised',
    backgroundMuted: 'bg-up-uncategorised/10',
    border: 'border-up-uncategorised',
    borderMuted: 'border-up-uncategorised/20',
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
 * @param currency currency code
 * @returns dollars
 */
export const formatValueInBaseUnits = (value: number, currency: string) => {
  const fractionDigits = new Intl.NumberFormat('en-au', {
    style: 'currency',
    currency,
  }).resolvedOptions().minimumFractionDigits;

  // Don't modify value if unable to lookup fraction
  // digits for currency
  return value / Math.pow(10, fractionDigits ?? 0);
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
    currency?: string;
  }
) => {
  const {
    decimals = 0,
    compact = false,
    absolute = false,
    baseUnits = false,
    currency = DEFAULT_CURRENCY,
  } = options ?? {};

  const value = baseUnits ? formatValueInBaseUnits(number, currency) : number;

  return Intl.NumberFormat('default', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: decimals,
    signDisplay: absolute ? (number > 0 ? 'exceptZero' : 'never') : 'auto',
    ...(compact && { notation: 'compact', compactDisplay: 'short' }),
  })
    .format(value)
    .toString();
};

/**
 * Simple greeting based on time of day
 * @returns
 */
export const getGreeting = () => {
  const time = now();
  const hour = time.getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

/**
 * Extracts first 2 initials
 * @param string
 * @returns undefined if no string
 */
export const getInitials = (string: string | null | undefined) =>
  string
    ? string
        .split(' ')
        .map((substr) => substr.at(0))
        .slice(0, 2)
        .join('')
    : undefined;

/**
 * Debounces a callback
 * @param callback
 * @param wait
 * @returns
 */
export const debounce = (callback: Function, wait: number) => {
  let timeoutId: number | undefined;

  return (...args: any[]) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback(...args);
    }, wait);
  };
};

export const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  // Note: Consider using Uint8Array.fromBase64() in future
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};
