import { BarChart } from '@/components/ui/bar-chart';
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
import { addDays, format, subDays } from 'date-fns';
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
  const calendarStart = subDays(today, 34);
  const dailyByDate = new Map(
    insights.dailySpend.map((item) => [item.day, item.value])
  );
  const calendarDays = Array.from({ length: 35 }, (_, index) =>
    addDays(calendarStart, index)
  );
  const maxDaySpend = Math.max(...insights.dailySpend.map(({ value }) => value), 1);
  const maxHourSpend = Math.max(...insights.hourlySpend.map(({ value }) => value), 1);
  const hourByBucket = new Map(
    insights.hourlySpend.map((item) => [`${item.weekday}-${item.hour}`, item.value])
  );
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
            <span className={change > 0 ? 'text-destructive' : 'text-emerald-600'}>
              {change > 0 ? '+' : ''}
              {change.toFixed(0)}%
            </span>{' '}
            versus last month
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
            Your daily spend over the last five weeks. Darker days mean more spend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day) => {
              const date = format(day, 'yyyy-MM-dd');
              const value = dailyByDate.get(date) ?? 0;
              const intensity = value ? 0.15 + (value / maxDaySpend) * 0.85 : 0;
              return (
                <div
                  className="aspect-square rounded-md border border-border/50"
                  key={date}
                  style={{
                    backgroundColor: value
                      ? `rgb(68 123 189 / ${intensity})`
                      : undefined,
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
                </div>
              );
            })}
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            Showing {format(calendarStart, 'd MMM')}–{format(today, 'd MMM')}.
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
                {Array.from({ length: 6 }, (_, bucket) => {
                  const value = Array.from({ length: 4 }, (_, offset) =>
                    hourByBucket.get(`${weekday}-${bucket * 4 + offset}`) ?? 0
                  ).reduce((total, hourValue) => total + hourValue, 0);
                  return (
                    <div
                      className="h-7 rounded-sm"
                      key={bucket}
                      style={{
                        backgroundColor: value
                          ? `rgb(236 119 35 / ${0.15 + (value / maxHourSpend) * 0.85})`
                          : 'rgb(148 163 184 / 0.12)',
                      }}
                      title={`${day}, ${String(bucket * 4).padStart(2, '0')}:00–${String(bucket * 4 + 3).padStart(2, '0')}:59: ${baseCurrency(value)}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Midnight</span>
            <span>Morning</span>
            <span>Afternoon</span>
            <span>Evening</span>
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Likely recurring</CardTitle>
            <CardDescription>Repeated merchants with activity at least 20 days apart.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList data={insights.recurringSpend.map((item) => ({
              name: `${item.name ?? 'Unknown merchant'} · ${item.visits}×`,
              value: item.value,
            }))} valueFormatter={baseCurrency} />
          </CardContent>
        </Card>
      </section>

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
              name: item.name,
              value: item.value,
            }))} valueFormatter={baseCurrency} />
          </CardContent>
        </Card>
      </section>

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
