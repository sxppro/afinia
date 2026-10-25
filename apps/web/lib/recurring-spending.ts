import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  parseISO,
} from 'date-fns';

type MerchantPayment = {
  merchant: string;
  categoryId: string;
  /**
   * YYYY-MM-DD
   */
  date: string;
  amount: number;
};

export type RecurringPayment = {
  merchant: string;
  categoryId: string;
  frequency: (typeof FREQUENCIES)[number]['label'];
  lastAmount: number;
  lastPaymentAt: Date;
  nextPaymentAt: Date;
  monthlyCost: number;
};

/**
 * Buncha date constants
 */
const DAYS_PER_WEEK = 7;
const DAYS_PER_FORTNIGHT = 14;
const DAYS_PER_MONTH_MIN = 28;
const DAYS_PER_MONTH_MAX = 31;
const DAYS_PER_QUARTER = 91;
const DAYS_PER_YEAR_MIN = 365;
const DAYS_PER_YEAR_MAX = 366;

/**
 * Supported recurring payment frequencies, tried in order.
 * A gap between payments matches when it is within [minDays, maxDays].
 */
export const FREQUENCIES = [
  {
    id: 'weekly',
    label: 'Weekly',
    minDays: DAYS_PER_WEEK - 2,
    maxDays: DAYS_PER_WEEK + 2,
    minPayments: 3,
    perMonth: 52 / 12,
    next: (date: Date) => addWeeks(date, 1),
  },
  {
    id: 'fortnightly',
    label: 'Fortnightly',
    minDays: DAYS_PER_FORTNIGHT - 3,
    maxDays: DAYS_PER_FORTNIGHT + 3,
    minPayments: 3,
    perMonth: 26 / 12,
    next: (date: Date) => addDays(date, 14),
  },
  {
    id: 'monthly',
    label: 'Monthly',
    minDays: DAYS_PER_MONTH_MIN - 5,
    maxDays: DAYS_PER_MONTH_MAX + 5,
    minPayments: 3,
    perMonth: 1,
    next: (date: Date) => addMonths(date, 1),
  },
  {
    id: 'quarterly',
    label: 'Quarterly',
    minDays: DAYS_PER_QUARTER - 5,
    maxDays: DAYS_PER_QUARTER + 5,
    minPayments: 2,
    perMonth: 1 / 3,
    next: (date: Date) => addQuarters(date, 1),
  },
  {
    id: 'yearly',
    label: 'Yearly',
    minDays: DAYS_PER_YEAR_MIN - 7,
    maxDays: DAYS_PER_YEAR_MAX + 7,
    minPayments: 2,
    perMonth: 1 / 12,
    next: (date: Date) => addYears(date, 1),
  },
] as const;

/**
 * Maximum difference of each recent payment from its average
 */
const MAX_AMOUNT_VARIATION = 0.3;

/**
 * Detects recurring payments from each merchant's most recent payments.
 *
 * A merchant is recurring when its latest gaps between payments all match
 * a frequency, payment amounts are similar, and it has been paid
 * within the last period (i.e. it hasn't stopped).
 *
 * @param payments Payments ordered by merchant name and payment date ascending
 * @returns Recurring payments ordered by monthly cost
 */
export const detectRecurringPayments = (
  payments: MerchantPayment[],
  today: Date
): RecurringPayment[] => {
  const merchantPaymentsMap = new Map<string, MerchantPayment[]>();
  for (const payment of payments) {
    merchantPaymentsMap.set(payment.merchant, [
      ...(merchantPaymentsMap.get(payment.merchant) ?? []),
      payment,
    ]);
  }

  const recurringPayments: RecurringPayment[] = [];

  for (const [merchant, merchantPayments] of merchantPaymentsMap) {
    const paymentDates = merchantPayments.map(({ date }) => parseISO(date));
    // ! Assumption: payments are sorted by date ascending
    const lastPaymentAt = paymentDates[paymentDates.length - 1];
    const last = merchantPayments[merchantPayments.length - 1];

    const frequency = FREQUENCIES.find(({ minDays, maxDays, minPayments }) => {
      // Check minimum number of payments
      if (paymentDates.length < minPayments) return false;

      // Check last n payments and their gaps match supported recurring payment frequencies
      const recentPaymentDates = paymentDates.slice(-minPayments);
      const isMatchedFrequency = recentPaymentDates
        .slice(1)
        .every((date, index) => {
          // Compare last or last 2 payments with previous payment date
          const gap = differenceInCalendarDays(date, recentPaymentDates[index]);
          return gap >= minDays && gap <= maxDays;
        });

      // Check last n payments and their amounts are similar
      const recentPaymentAmounts = merchantPayments
        .slice(-minPayments)
        .map(({ amount }) => amount);
      const averagePaymentAmount =
        recentPaymentAmounts.reduce((sum, amount) => sum + amount, 0) /
        recentPaymentAmounts.length;
      const isSimilarAmount = recentPaymentAmounts.every(
        (amount) =>
          Math.abs(amount - averagePaymentAmount) <=
          averagePaymentAmount * MAX_AMOUNT_VARIATION
      );

      // Check recurring payment hasn't been stopped
      const isActive =
        differenceInCalendarDays(today, lastPaymentAt) <= maxDays;

      return isMatchedFrequency && isSimilarAmount && isActive;
    });

    // No matching frequency, go to next merchant
    if (!frequency) continue;

    recurringPayments.push({
      merchant,
      categoryId: last.categoryId,
      frequency: frequency.label,
      lastAmount: last.amount,
      lastPaymentAt: lastPaymentAt,
      nextPaymentAt: frequency.next(lastPaymentAt),
      // Scale last payment amount to a monthly cost
      monthlyCost: Math.round(last.amount * frequency.perMonth),
    });
  }

  return recurringPayments.sort((a, b) => b.monthlyCost - a.monthlyCost);
};
