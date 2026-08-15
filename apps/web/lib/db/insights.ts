import {
  accountTable,
  transactionCashbackTable,
  transactionExternalTable,
  transactionRoundUpTable,
  transactionTable,
  transactionTagTable,
} from 'afinia-common/schema';
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  startOfMonth,
  subMonths,
} from 'date-fns';
import {
  and,
  avg,
  desc,
  eq,
  gte,
  isNotNull,
  isNull,
  lt,
  sql,
  sum,
} from 'drizzle-orm';
import { TZ } from '../constants';
import { getStartOfDay } from '../dateTime';
import { db } from './client';

const spending = lt(transactionExternalTable.value_in_base_units, 0);
const transactionDate = transactionExternalTable.created_at;

export const getSpendingInsights = async () => {
  const today = getStartOfDay();
  const monthStart = startOfMonth(today);
  const previousMonthStart = startOfMonth(subMonths(today, 1));
  const sixMonthsStart = startOfMonth(subMonths(today, 5));
  const calendarStart = startOfMonth(today);
  const previousComparableDay = addDays(
    previousMonthStart,
    differenceInCalendarDays(today, monthStart)
  );

  const [
    dailySpend,
    dailyCategorySpend,
    hourlySpend,
    merchantSpend,
    recurringSpend,
    newMerchants,
    merchantTotal,
    monthlyCashflow,
    incomeSources,
    pace,
    tagSpend,
    categoryMixDrift,
    categoryOutliers,
    accountSpend,
    payerSpend,
    channelSpend,
    foreignSpend,
    uncategorised,
    categoryMix,
    roundUps,
    cashback,
    settlement,
  ] = await Promise.all([
    db
      .select({
        day: sql<string>`to_char(${transactionDate} AT TIME ZONE ${TZ}, 'YYYY-MM-DD')`,
        value: sql<number>`abs(${sum(transactionExternalTable.value_in_base_units)})`
          .mapWith(Number)
          .as('value'),
      })
      .from(transactionExternalTable)
      .where(and(gte(transactionDate, calendarStart), spending))
      .groupBy(sql`date_trunc('day', ${transactionDate} AT TIME ZONE ${TZ})`)
      .orderBy(sql`date_trunc('day', ${transactionDate} AT TIME ZONE ${TZ})`),
    db
      .select({
        day: sql<string>`to_char(${transactionDate} AT TIME ZONE ${TZ}, 'YYYY-MM-DD')`,
        category: sql<string>`coalesce(${transactionExternalTable.category_parent_id}, 'uncategorised')`,
        value: sql<number>`abs(${sum(transactionExternalTable.value_in_base_units)})`
          .mapWith(Number)
          .as('value'),
      })
      .from(transactionExternalTable)
      .where(and(gte(transactionDate, calendarStart), spending))
      .groupBy(
        sql`date_trunc('day', ${transactionDate} AT TIME ZONE ${TZ})`,
        transactionExternalTable.category_parent_id
      ),
    db
      .select({
        weekday: sql<number>`extract(dow from ${transactionDate} AT TIME ZONE ${TZ})`
          .mapWith(Number)
          .as('weekday'),
        hour: sql<number>`extract(hour from ${transactionDate} AT TIME ZONE ${TZ})`
          .mapWith(Number)
          .as('hour'),
        value: sql<number>`abs(${sum(transactionExternalTable.value_in_base_units)})`
          .mapWith(Number)
          .as('value'),
      })
      .from(transactionExternalTable)
      .where(and(gte(transactionDate, subMonths(today, 3)), spending))
      .groupBy(
        sql`extract(dow from ${transactionDate} AT TIME ZONE ${TZ})`,
        sql`extract(hour from ${transactionDate} AT TIME ZONE ${TZ})`
      ),
    db
      .select({
        name: transactionExternalTable.description,
        value: sql<number>`abs(${sum(transactionExternalTable.value_in_base_units)})`
          .mapWith(Number)
          .as('value'),
        visits: sql<number>`count(*)`.mapWith(Number).as('visits'),
      })
      .from(transactionExternalTable)
      .where(
        and(
          gte(transactionDate, subMonths(today, 3)),
          spending,
          isNotNull(transactionExternalTable.description)
        )
      )
      .groupBy(transactionExternalTable.description)
      .orderBy(desc(sql`value`))
      .limit(5),
    db
      .select({
        name: transactionExternalTable.description,
        value: sql<number>`abs(avg(${transactionExternalTable.value_in_base_units}))`
          .mapWith(Number)
          .as('value'),
        visits: sql<number>`count(*)`.mapWith(Number).as('visits'),
        lastSeen: sql<string>`to_char(max(${transactionDate}) AT TIME ZONE ${TZ}, 'DD Mon')`,
      })
      .from(transactionExternalTable)
      .where(
        and(
          gte(transactionDate, subMonths(today, 6)),
          spending,
          isNotNull(transactionExternalTable.description)
        )
      )
      .groupBy(transactionExternalTable.description)
      .having(
        sql`count(*) >= 2
          AND max(${transactionDate}) - min(${transactionDate}) >= interval '20 days'
          AND coalesce(stddev_samp(abs(${transactionExternalTable.value_in_base_units})), 0)
            <= avg(abs(${transactionExternalTable.value_in_base_units})) * 0.2`
      )
      .orderBy(desc(sql`value`))
      .limit(5),
    db
      .select({
        name: transactionExternalTable.description,
        firstSeen: sql<string>`to_char(min(${transactionDate}) AT TIME ZONE ${TZ}, 'DD Mon')`,
      })
      .from(transactionExternalTable)
      .where(and(spending, isNotNull(transactionExternalTable.description)))
      .groupBy(transactionExternalTable.description)
      .having(gte(sql`min(${transactionDate})`, monthStart))
      .orderBy(desc(sql`min(${transactionDate})`))
      .limit(5),
    db
      .select({
        value: sql<number>`abs(coalesce(${sum(transactionExternalTable.value_in_base_units)}, 0))`
          .mapWith(Number)
          .as('value'),
      })
      .from(transactionExternalTable)
      .where(and(gte(transactionDate, subMonths(today, 3)), spending)),
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${transactionDate} AT TIME ZONE ${TZ}), 'Mon')`,
        income: sql<number>`coalesce(sum(${transactionExternalTable.value_in_base_units}) filter (where ${transactionExternalTable.value_in_base_units} > 0), 0)`
          .mapWith(Number)
          .as('income'),
        spend: sql<number>`abs(coalesce(sum(${transactionExternalTable.value_in_base_units}) filter (where ${transactionExternalTable.value_in_base_units} < 0), 0))`
          .mapWith(Number)
          .as('spend'),
      })
      .from(transactionExternalTable)
      .where(gte(transactionDate, sixMonthsStart))
      .groupBy(sql`date_trunc('month', ${transactionDate} AT TIME ZONE ${TZ})`)
      .orderBy(sql`date_trunc('month', ${transactionDate} AT TIME ZONE ${TZ})`),
    db
      .select({
        name: sql<string>`coalesce(${transactionExternalTable.description}, 'Other income')`,
        value: sum(transactionExternalTable.value_in_base_units)
          .mapWith(Number)
          .as('value'),
      })
      .from(transactionExternalTable)
      .where(
        and(
          gte(transactionDate, monthStart),
          sql`${transactionExternalTable.value_in_base_units} > 0`
        )
      )
      .groupBy(transactionExternalTable.description)
      .orderBy(desc(sql`value`))
      .limit(5),
    db
      .select({
        current: sql<number>`abs(coalesce(sum(${transactionExternalTable.value_in_base_units})
          filter (where ${transactionDate} >= ${monthStart}), 0))`
          .mapWith(Number)
          .as('current'),
        previous: sql<number>`abs(coalesce(sum(${transactionExternalTable.value_in_base_units})
          filter (where ${transactionDate} >= ${previousMonthStart}
            and ${transactionDate} <= ${previousComparableDay}), 0))`
          .mapWith(Number)
          .as('previous'),
      })
      .from(transactionExternalTable)
      .where(and(gte(transactionDate, previousMonthStart), spending)),
    db
      .select({
        name: transactionTagTable.tag_id,
        value: sql<number>`abs(${sum(transactionExternalTable.value_in_base_units)})`
          .mapWith(Number)
          .as('value'),
      })
      .from(transactionTagTable)
      .innerJoin(
        transactionExternalTable,
        eq(transactionTagTable.transaction_id, transactionExternalTable.transaction_id)
      )
      .where(and(gte(transactionDate, monthStart), spending))
      .groupBy(transactionTagTable.tag_id)
      .orderBy(desc(sql`value`))
      .limit(5),
    db
      .select({
        name: sql<string>`coalesce(${transactionExternalTable.category_parent}, 'Uncategorised')`,
        current: sql<number>`abs(coalesce(sum(${transactionExternalTable.value_in_base_units})
          filter (where ${transactionDate} >= ${monthStart}), 0))`
          .mapWith(Number)
          .as('current'),
        previous: sql<number>`abs(coalesce(sum(${transactionExternalTable.value_in_base_units})
          filter (where ${transactionDate} >= ${previousMonthStart}
            and ${transactionDate} < ${monthStart}), 0))`
          .mapWith(Number)
          .as('previous'),
      })
      .from(transactionExternalTable)
      .where(and(gte(transactionDate, previousMonthStart), spending))
      .groupBy(transactionExternalTable.category_parent)
      .orderBy(desc(sql`current`))
      .limit(5),
    db
      .select({
        name: sql<string>`coalesce(${transactionExternalTable.category}, 'Uncategorised')`,
        average: sql<number>`abs(avg(${transactionExternalTable.value_in_base_units}))`
          .mapWith(Number)
          .as('average'),
        largest: sql<number>`abs(min(${transactionExternalTable.value_in_base_units}))`
          .mapWith(Number)
          .as('largest'),
      })
      .from(transactionExternalTable)
      .where(and(gte(transactionDate, subMonths(today, 3)), spending))
      .groupBy(transactionExternalTable.category)
      .having(
        sql`abs(min(${transactionExternalTable.value_in_base_units})) > abs(avg(${transactionExternalTable.value_in_base_units})) * 2`
      )
      .orderBy(desc(sql`largest`))
      .limit(5),
    db
      .select({
        name: accountTable.display_name,
        value: sql<number>`abs(${sum(transactionExternalTable.value_in_base_units)})`
          .mapWith(Number)
          .as('value'),
      })
      .from(transactionExternalTable)
      .innerJoin(
        accountTable,
        eq(transactionExternalTable.account_id, accountTable.account_id)
      )
      .where(and(gte(transactionDate, monthStart), spending))
      .groupBy(accountTable.display_name)
      .orderBy(desc(sql`value`)),
    db
      .select({
        name: sql<string>`coalesce(${transactionExternalTable.customer_display_name}, 'Not attributed')`,
        value: sql<number>`abs(${sum(transactionExternalTable.value_in_base_units)})`
          .mapWith(Number)
          .as('value'),
      })
      .from(transactionExternalTable)
      .where(and(gte(transactionDate, monthStart), spending))
      .groupBy(transactionExternalTable.customer_display_name)
      .orderBy(desc(sql`value`)),
    db
      .select({
        name: sql<string>`coalesce(${transactionExternalTable.card_purchase_method}, ${transactionExternalTable.type}, 'Other')`,
        value: sql<number>`abs(${sum(transactionExternalTable.value_in_base_units)})`
          .mapWith(Number)
          .as('value'),
      })
      .from(transactionExternalTable)
      .where(and(gte(transactionDate, monthStart), spending))
      .groupBy(
        transactionExternalTable.card_purchase_method,
        transactionExternalTable.type
      )
      .orderBy(desc(sql`value`))
      .limit(5),
    db
      .select({
        name: transactionExternalTable.foreign_currency_code,
        value: sql<number>`abs(${sum(transactionExternalTable.value_in_base_units)})`
          .mapWith(Number)
          .as('value'),
      })
      .from(transactionExternalTable)
      .where(
        and(
          gte(transactionDate, subMonths(today, 6)),
          spending,
          isNotNull(transactionExternalTable.foreign_currency_code)
        )
      )
      .groupBy(transactionExternalTable.foreign_currency_code)
      .orderBy(desc(sql`value`))
      .limit(5),
    db
      .select({
        value: sql<number>`abs(coalesce(${sum(transactionExternalTable.value_in_base_units)}, 0))`
          .mapWith(Number)
          .as('value'),
        count: sql<number>`count(*)`.mapWith(Number).as('count'),
      })
      .from(transactionExternalTable)
      .where(
        and(
          gte(transactionDate, monthStart),
          spending,
          isNull(transactionExternalTable.category_id)
        )
      ),
    db
      .select({
        name: sql<string>`coalesce(${transactionExternalTable.category_parent}, 'Uncategorised')`,
        value: sql<number>`abs(${sum(transactionExternalTable.value_in_base_units)})`
          .mapWith(Number)
          .as('value'),
      })
      .from(transactionExternalTable)
      .where(and(gte(transactionDate, monthStart), spending))
      .groupBy(transactionExternalTable.category_parent)
      .orderBy(desc(sql`value`))
      .limit(5),
    db
      .select({
        value: sql<number>`coalesce(${sum(transactionRoundUpTable.value_in_base_units)}, 0)`
          .mapWith(Number)
          .as('value'),
        boost: sql<number>`coalesce(${sum(transactionRoundUpTable.boost_value_in_base_units)}, 0)`
          .mapWith(Number)
          .as('boost'),
      })
      .from(transactionRoundUpTable)
      .innerJoin(
        transactionTable,
        eq(transactionRoundUpTable.transaction_id, transactionTable.transaction_id)
      )
      .where(and(gte(transactionTable.created_at, monthStart), isNull(transactionTable.deleted_at))),
    db
      .select({
        value: sql<number>`coalesce(${sum(transactionCashbackTable.value_in_base_units)}, 0)`
          .mapWith(Number)
          .as('value'),
      })
      .from(transactionCashbackTable)
      .innerJoin(
        transactionTable,
        eq(transactionCashbackTable.transaction_id, transactionTable.transaction_id)
      )
      .where(and(gte(transactionTable.created_at, monthStart), isNull(transactionTable.deleted_at))),
    db
      .select({
        held: sql<number>`count(*) filter (where ${transactionExternalTable.status} = 'HELD')`
          .mapWith(Number)
          .as('held'),
        averageDays: sql<number | null>`avg(extract(epoch from (${transactionExternalTable.settled_at} - ${transactionDate})) / 86400.0)`
          .mapWith(Number)
          .as('averageDays'),
      })
      .from(transactionExternalTable)
      .where(and(gte(transactionDate, monthStart), spending)),
  ]);

  return {
    dailySpend,
    dailyCategorySpend,
    hourlySpend,
    merchantSpend: merchantSpend.filter((merchant) => merchant.name),
    recurringSpend: recurringSpend.filter((merchant) => merchant.name),
    newMerchants: newMerchants.filter((merchant) => merchant.name),
    merchantTotal: merchantTotal[0]?.value ?? 0,
    monthlyCashflow,
    incomeSources,
    pace: pace[0] ?? { current: 0, previous: 0 },
    tagSpend,
    accountSpend,
    payerSpend,
    channelSpend,
    foreignSpend: foreignSpend.filter((currency) => currency.name),
    uncategorised: uncategorised[0] ?? { value: 0, count: 0 },
    categoryMix,
    categoryMixDrift,
    categoryOutliers,
    roundUps: roundUps[0] ?? { value: 0, boost: 0 },
    cashback: cashback[0] ?? { value: 0 },
    settlement: settlement[0] ?? { held: 0, averageDays: null },
    period: { monthStart, previousMonthStart, today, end: endOfMonth(today) },
  };
};
