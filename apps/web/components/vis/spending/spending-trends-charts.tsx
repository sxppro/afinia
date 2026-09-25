'use client';

import { BarChart } from '@/components/ui/bar-chart';
import { formatCurrency } from '@/lib/ui';

type ChartRow = Record<string, string | number>;

const SpendingTrendsCharts = ({
  monthly,
  weekdays,
  categoryMonths,
  categoryNames,
  categoryColors,
}: {
  monthly: ChartRow[];
  weekdays: ChartRow[];
  categoryMonths: ChartRow[];
  categoryNames: string[];
  categoryColors: string[];
}) => (
  <div className="space-y-7">
    <section>
      <h2 className="text-xl font-semibold">12-month rhythm</h2>
      <p className="text-muted-foreground mb-2 text-sm">
        Net spending by month
      </p>
      <BarChart
        className="h-56"
        data={monthly}
        index="month"
        categories={['Spent']}
        colors={['fill-blue-500']}
        showLegend={false}
        showYAxis={false}
        startEndOnly
        valueFormatter={(value) => formatCurrency(value, { baseUnits: true })}
      />
    </section>

    <section>
      <h2 className="text-xl font-semibold">Your spending week</h2>
      <p className="text-muted-foreground mb-2 text-sm">
        Average daily spend by weekday over 12 months
      </p>
      <BarChart
        className="h-56"
        data={weekdays}
        index="day"
        categories={['Average']}
        colors={['fill-violet-500']}
        showLegend={false}
        showYAxis={false}
        valueFormatter={(value) => formatCurrency(value, { baseUnits: true })}
      />
    </section>

    <section>
      <h2 className="text-xl font-semibold">Category mix over time</h2>
      <p className="text-muted-foreground mb-2 text-sm">
        How the shape of your spending changes
      </p>
      {categoryNames.length > 0 ? (
        <BarChart
          className="h-72"
          data={categoryMonths}
          index="month"
          categories={categoryNames}
          colors={categoryColors}
          type="stacked"
          showYAxis={false}
          enableLegendSlider
          startEndOnly
          valueFormatter={(value) =>
            formatCurrency(value, { baseUnits: true })
          }
        />
      ) : (
        <div className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
          No category history yet
        </div>
      )}
    </section>
  </div>
);

export default SpendingTrendsCharts;
