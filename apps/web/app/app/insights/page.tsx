import { BarChart } from '@/components/ui/bar-chart';
import { AreaChart } from '@/components/ui/area-chart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BarList } from '@/components/ui/bar-list';
import { getSpendingInsights } from '@/lib/db/insights';
import { siteConfig } from '@/lib/siteConfig';
import { formatCurrency } from '@/lib/ui';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ArrowLeft, CalendarDays, Sparkles } from 'lucide-react';
import Link from 'next/link';

const baseCurrency = (value: number) =>
  formatCurrency(value, { baseUnits: true, absolute: true });

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const InsightsPage = async () => {
  const insights = await getSpendingInsights();
  const today = insights.period.today;
  const calendarStart = startOfWeek(startOfMonth(today));
  const calendarEnd = endOfWeek(endOfMonth(today));
  const dailyByDate = new Map(
    insights.dailySpend.map((item) => [item.day, item.value])
  );
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const maxDaySpend = Math.max(...insights.dailySpend.map(({ value }) => value), 1);
  const maxHourSpend = Math.max(...insights.hourlySpend.map(({ value }) => value), 1);
  const hourByBucket = new Map(
    insights.hourlySpend.map((item) => [`${item.weekday}-${item.hour}`, item.value])
  );
  const dominantCategoryByDay = new Map<string, string>();
  insights.dailyCategorySpend
    .sort((a, b) => b.value - a.value)
    .forEach((item) => {
      if (!dominantCategoryByDay.has(item.day)) {
        dominantCategoryByDay.set(item.day, item.category);
      }
    });
  const monthCashflow = insights.monthlyCashflow.at(-1);
  const previousCashflow = insights.monthlyCashflow.at(-2);
  const monthlySpend = monthCashflow?.spend ?? 0;
  const previousSpend = previousCashflow?.spend ?? 0;
  const change = previousSpend
    ? ((monthlySpend - previousSpend) / previousSpend) * 100
    : 0;
  const savingsRate =
    monthCashflow?.income && monthCashflow.income > 0
      ? ((monthCashflow.income - monthCashflow.spend) / monthCashflow.income) * 100
      : null;
  const paceChange = insights.pace.previous
    ? ((insights.pace.current - insights.pace.previous) / insights.pace.previous) * 100
    : null;
  const quietDays = calendarDays.filter((day) => {
    const date = format(day, 'yyyy-MM-dd');
    return day <= today && !dailyByDate.has(date);
  }).length;
  const topMerchantsValue = insights.merchantSpend.reduce(
    (total, merchant) => total + merchant.value,
    0
  );
  const categoryColours: Record<string, string> = {
    'good-life': '227 196 17',
    home: '175 92 175',
    personal: '236 119 35',
    transport: '68 123 189',
    uncategorised: '145 161 182',
  };
  const daysElapsed = today.getDate();
  const projectedMonthSpend =
    daysElapsed > 0 ? (insights.pace.current / daysElapsed) * endOfMonth(today).getDate() : 0;
  const paceSeries = eachDayOfInterval({
    start: startOfMonth(today),
    end: today,
  }).map((day, index, days) => {
    const runningSpend = days
      .slice(0, index + 1)
      .reduce(
        (total, currentDay) =>
          total + (dailyByDate.get(format(currentDay, 'yyyy-MM-dd')) ?? 0),
        0
      );
    return {
      day: format(day, 'd MMM'),
      spend: runningSpend,
      projection: (projectedMonthSpend / endOfMonth(today).getDate()) * day.getDate(),
    };
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-4">
        <Link
          aria-label="Back to dashboard"
          className="rounded-full border p-3 hover:bg-accent"
          href={siteConfig.baseLinks.appHome}
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <p className="text-muted-foreground text-sm font-medium">Your money, in context</p>
          <h1 className="text-2xl font-bold">Insights</h1>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="gap-2 py-4">
          <CardHeader className="px-4">
            <CardDescription>This month</CardDescription>
            <CardTitle className="text-2xl">{baseCurrency(monthlySpend)}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-sm">
            <span className={paceChange && paceChange > 0 ? 'text-destructive' : 'text-emerald-600'}>
              {paceChange && paceChange > 0 ? '+' : ''}
              {paceChange === null ? '—' : `${paceChange.toFixed(0)}%`}
            </span>{' '}
            versus the same point last month
          </CardContent>
        </Card>
        <Card className="gap-2 py-4">
          <CardHeader className="px-4">
            <CardDescription>Net cash flow</CardDescription>
            <CardTitle className="text-2xl">
              {baseCurrency((monthCashflow?.income ?? 0) - monthlySpend)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-sm">
            {savingsRate === null
              ? 'Income not identified yet'
              : `${savingsRate.toFixed(0)}% of income retained`}
          </CardContent>
        </Card>
        <Card className="gap-2 py-4">
          <CardHeader className="px-4">
            <CardDescription>To review</CardDescription>
            <CardTitle className="text-2xl">{insights.uncategorised.count}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-sm">
            {baseCurrency(insights.uncategorised.value)} uncategorised
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-5" />
            Spending calendar
          </CardTitle>
          <CardDescription>
            {format(today, 'MMMM yyyy')}. Darker days mean more spend; colour shows the
            day&apos;s largest category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day) => {
              const date = format(day, 'yyyy-MM-dd');
              const value = dailyByDate.get(date) ?? 0;
              const intensity = value ? 0.15 + (value / maxDaySpend) * 0.85 : 0;
              return (
                <Link
                  className="aspect-square rounded-md border border-border/50 transition-transform hover:scale-110"
                  href={`${siteConfig.baseLinks.transactions}?date=${date}`}
                  key={date}
                  style={{
                    backgroundColor: value
                      ? `rgb(${categoryColours[dominantCategoryByDay.get(date) ?? 'uncategorised']} / ${intensity})`
                      : undefined,
                    opacity: day.getMonth() === today.getMonth() ? 1 : 0.35,
                  }}
                  title={`${format(day, 'EEE d MMM')}: ${baseCurrency(value)}`}
                >
                  <span
                    className={
                      value > maxDaySpend * 0.5
                        ? 'flex h-full items-center justify-center text-xs font-medium text-white'
                        : 'flex h-full items-center justify-center text-xs text-muted-foreground'
                    }
                  >
                    {format(day, 'd')}
                  </span>
                </Link>
              );
            })}
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            {quietDays} quiet day{quietDays === 1 ? '' : 's'} so far. Select a day to
            view its transactions.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>When you spend</CardTitle>
          <CardDescription>Last three months, grouped by local weekday and time.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, weekday) => (
              <div className="space-y-1" key={day}>
                <p className="text-center text-xs text-muted-foreground">{day}</p>
                {Array.from({ length: 24 }, (_, hour) => {
                  const value = hourByBucket.get(`${weekday}-${hour}`) ?? 0;
                  return (
                    <div
                      className="h-2 rounded-sm sm:h-3"
                      key={hour}
                      style={{
                        backgroundColor: value
                          ? `rgb(236 119 35 / ${0.15 + (value / maxHourSpend) * 0.85})`
                          : 'rgb(148 163 184 / 0.12)',
                      }}
                      title={`${day}, ${String(hour).padStart(2, '0')}:00–${String(hour).padStart(2, '0')}:59: ${baseCurrency(value)}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Midnight</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cash flow and spending pace</CardTitle>
          <CardDescription>Income, spending, and what remains each month.</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            className="h-56"
            colors={['fill-emerald-500', 'fill-chart-1']}
            data={insights.monthlyCashflow}
            index="month"
            categories={['income', 'spend']}
            showLegend
            showYAxis={false}
            valueFormatter={baseCurrency}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Month-end pace</CardTitle>
          <CardDescription>
            Your running spend against a straight-line projection of {baseCurrency(projectedMonthSpend)}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AreaChart
            className="h-56"
            colors={['blue', 'gray']}
            data={paceSeries}
            index="day"
            categories={['spend', 'projection']}
            showYAxis={false}
            valueFormatter={baseCurrency}
          />
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income sources</CardTitle>
            <CardDescription>Positive transactions received this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList
              data={insights.incomeSources.map((item) => ({
                name: item.name,
                value: item.value,
              }))}
              valueFormatter={baseCurrency}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Category movement</CardTitle>
            <CardDescription>How your top category totals changed month over month.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.categoryMixDrift.map((item) => {
              const percent = item.previous
                ? ((item.current - item.previous) / item.previous) * 100
                : null;
              return (
                <div className="flex items-baseline justify-between gap-4" key={item.name}>
                  <p className="truncate text-sm">{item.name}</p>
                  <p
                    className={
                      percent && percent > 0
                        ? 'text-sm text-destructive'
                        : 'text-sm text-emerald-600'
                    }
                  >
                    {percent === null ? 'New' : `${percent > 0 ? '+' : ''}${percent.toFixed(0)}%`}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top merchants</CardTitle>
            <CardDescription>Where your money went in the last three months.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList data={insights.merchantSpend.map((item) => ({
              name: item.name ?? 'Unknown merchant',
              value: item.value,
            }))} valueFormatter={baseCurrency} />
            <p className="text-muted-foreground mt-4 text-sm">
              {insights.merchantTotal
                ? `${((topMerchantsValue / insights.merchantTotal) * 100).toFixed(0)}% of your recent spending is with these five merchants.`
                : 'No merchant data yet.'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Likely recurring</CardTitle>
            <CardDescription>Repeated merchants with activity at least 20 days apart.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList data={insights.recurringSpend.map((item) => ({
              name: `${item.name ?? 'Unknown merchant'} · due around ${item.nextExpected}`,
              value: item.value,
            }))} valueFormatter={baseCurrency} />
          </CardContent>
        </Card>
      </section>

      {insights.newMerchants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>New this month</CardTitle>
            <CardDescription>Merchants appearing in your history for the first time.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {insights.newMerchants.map((merchant) => (
              <span className="rounded-full bg-secondary px-3 py-1.5 text-sm" key={merchant.name}>
                {merchant.name} · {merchant.firstSeen}
              </span>
            ))}
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Category mix</CardTitle>
            <CardDescription>Top parent categories this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList data={insights.categoryMix.map((item) => ({
              name: item.name,
              value: item.value,
            }))} valueFormatter={baseCurrency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tagged spending</CardTitle>
            <CardDescription>Spending you have labelled this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList data={insights.tagSpend.map((item) => ({
              href: `${siteConfig.baseLinks.transactions}?tag=${encodeURIComponent(item.name)}`,
              name: item.name,
              value: item.value,
            }))} valueFormatter={baseCurrency} />
          </CardContent>
        </Card>
      </section>

      {insights.categoryOutliers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unusual category purchases</CardTitle>
            <CardDescription>
              The largest transaction in each category is at least twice its recent average.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarList
              data={insights.categoryOutliers.map((item) => ({
                name: `${item.name} · usual ${baseCurrency(item.average)}`,
                value: item.largest,
              }))}
              valueFormatter={baseCurrency}
            />
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Where you paid from</CardTitle>
            <CardDescription>External spending by account this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList data={insights.accountSpend.map((item) => ({
              name: item.name,
              value: item.value,
            }))} valueFormatter={baseCurrency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment channels</CardTitle>
            <CardDescription>How purchases were made this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList data={insights.channelSpend.map((item) => ({
              name: titleCase(item.name),
              value: item.value,
            }))} valueFormatter={baseCurrency} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Travel and foreign spend</CardTitle>
            <CardDescription>Foreign-currency purchases in the past six months, shown in AUD.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList data={insights.foreignSpend.map((item) => ({
              name: item.name ?? 'Unknown currency',
              value: item.value,
            }))} valueFormatter={baseCurrency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Shared spending</CardTitle>
            <CardDescription>Attribution from 2Up purchases this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList data={insights.payerSpend.map((item) => ({
              name: item.name,
              value: item.value,
            }))} valueFormatter={baseCurrency} />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            Small wins
          </CardTitle>
          <CardDescription>Automatic savings and rewards from this month.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-sm">Round-ups</p>
            <p className="text-2xl font-semibold">{baseCurrency(insights.roundUps.value)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Round-up boosts</p>
            <p className="text-2xl font-semibold">{baseCurrency(insights.roundUps.boost)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Cashback earned</p>
            <p className="text-2xl font-semibold">{baseCurrency(insights.cashback.value)}</p>
          </div>
        </CardContent>
      </Card>

      {insights.settlement.held > 0 && (
        <p className="text-muted-foreground text-center text-sm">
          {insights.settlement.held} purchase{insights.settlement.held === 1 ? '' : 's'} still pending.
          {insights.settlement.averageDays
            ? ` Settled purchases take about ${insights.settlement.averageDays.toFixed(1)} days on average.`
            : ''}
        </p>
      )}
    </div>
  );
};

export default InsightsPage;
