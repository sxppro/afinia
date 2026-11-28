// Tremor chartColors [v0.1.0]

export type ColorUtility = 'bg' | 'stroke' | 'fill' | 'text';

export const chartColors = {
  blue: {
    bg: 'bg-blue-500',
    stroke: 'stroke-blue-500',
    fill: 'fill-blue-500',
    text: 'text-blue-500',
  },
  emerald: {
    bg: 'bg-emerald-500',
    stroke: 'stroke-emerald-500',
    fill: 'fill-emerald-500',
    text: 'text-emerald-500',
  },
  violet: {
    bg: 'bg-violet-500',
    stroke: 'stroke-violet-500',
    fill: 'fill-violet-500',
    text: 'text-violet-500',
  },
  amber: {
    bg: 'bg-amber-500',
    stroke: 'stroke-amber-500',
    fill: 'fill-amber-500',
    text: 'text-amber-500',
  },
  gray: {
    bg: 'bg-gray-500',
    stroke: 'stroke-gray-500',
    fill: 'fill-gray-500',
    text: 'text-gray-500',
  },
  cyan: {
    bg: 'bg-cyan-500',
    stroke: 'stroke-cyan-500',
    fill: 'fill-cyan-500',
    text: 'text-cyan-500',
  },
  pink: {
    bg: 'bg-pink-500',
    stroke: 'stroke-pink-500',
    fill: 'fill-pink-500',
    text: 'text-pink-500',
  },
  lime: {
    bg: 'bg-lime-500',
    stroke: 'stroke-lime-500',
    fill: 'fill-lime-500',
    text: 'text-lime-500',
  },
  fuchsia: {
    bg: 'bg-fuchsia-500',
    stroke: 'stroke-fuchsia-500',
    fill: 'fill-fuchsia-500',
    text: 'text-fuchsia-500',
  },
} as const satisfies {
  [color: string]: {
    [key in ColorUtility]: string;
  };
};

export type AvailableChartColorsKeys = keyof typeof chartColors;

export const AvailableChartColors: AvailableChartColorsKeys[] = Object.keys(
  chartColors
) as Array<AvailableChartColorsKeys>;

export const constructCategoryColors = (
  categories: string[],
  colors: AvailableChartColorsKeys[]
): Map<string, AvailableChartColorsKeys> => {
  const categoryColors = new Map<string, AvailableChartColorsKeys>();
  categories.forEach((category, index) => {
    categoryColors.set(category, colors[index % colors.length]);
  });
  return categoryColors;
};

export const getColorClassName = (
  color: AvailableChartColorsKeys,
  type: ColorUtility
): string => {
  const fallbackColor = {
    bg: 'bg-gray-500',
    stroke: 'stroke-gray-500',
    fill: 'fill-gray-500',
    text: 'text-gray-500',
  };
  return chartColors[color]?.[type] ?? fallbackColor[type];
};

// Tremor getYAxisDomain [v0.0.0]

export const getYAxisDomain = (
  autoMinValue: boolean,
  minValue: number | undefined,
  maxValue: number | undefined
) => {
  const minDomain = autoMinValue ? 'auto' : (minValue ?? 0);
  const maxDomain = maxValue ?? 'auto';
  return [minDomain, maxDomain];
};

// Tremor hasOnlyOneValueForKey [v0.1.0]

export function hasOnlyOneValueForKey(
  array: any[],
  keyToCheck: string
): boolean {
  const val: any[] = [];

  for (const obj of array) {
    if (Object.prototype.hasOwnProperty.call(obj, keyToCheck)) {
      val.push(obj[keyToCheck]);
      if (val.length > 1) {
        return false;
      }
    }
  }

  return true;
}

// Tremor Raw focusRing [v0.0.1]
export const focusRing = [
  // base
  'outline outline-offset-2 outline-0 focus-visible:outline-2',
  // outline color
  'outline-blue-500 dark:outline-blue-500',
];

/**
 * Heatmap colours from lightest to darkest
 */
export const heatmapColours = [
  'bg-blue-200 dark:bg-blue-950',
  'bg-blue-300 dark:bg-blue-900',
  'bg-blue-400 dark:bg-blue-700',
  'bg-blue-500 dark:bg-blue-500',
  'bg-blue-700 dark:bg-blue-300',
] as const;

export const categoryHeatmapColours: Record<string, readonly string[]> = {
  'good-life': [
    'bg-up-good-life/20',
    'bg-up-good-life/40',
    'bg-up-good-life/60',
    'bg-up-good-life/80',
    'bg-up-good-life',
  ],
  home: [
    'bg-up-home/20',
    'bg-up-home/40',
    'bg-up-home/60',
    'bg-up-home/80',
    'bg-up-home',
  ],
  personal: [
    'bg-up-personal/20',
    'bg-up-personal/40',
    'bg-up-personal/60',
    'bg-up-personal/80',
    'bg-up-personal',
  ],
  transport: [
    'bg-up-transport/20',
    'bg-up-transport/40',
    'bg-up-transport/60',
    'bg-up-transport/80',
    'bg-up-transport',
  ],
  uncategorised: [
    'bg-up-uncategorised/20',
    'bg-up-uncategorised/40',
    'bg-up-uncategorised/60',
    'bg-up-uncategorised/80',
    'bg-up-uncategorised',
  ],
};

/**
 * Colour for cells with no value
 */
export const heatmapEmptyColour = 'bg-gray-100 dark:bg-gray-800';

/**
 * Splits the positive values into equal-sized buckets (quantiles)
 * @returns The upper bound of each bucket except the last
 */
export const getHeatmapThresholds = (
  values: number[],
  buckets: number = heatmapColours.length
) => {
  const sorted = values.filter((value) => value > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return [];

  // Value at each 1/buckets quantile, e.g. 20%, 40%, 60%, 80% for 5 buckets
  return Array.from(
    { length: buckets - 1 },
    (_, index) =>
      sorted[Math.floor(((index + 1) / buckets) * (sorted.length - 1))]
  );
};

/**
 * Maps a value to a heatmap colour using thresholds from `getHeatmapThresholds`
 */
export const getHeatmapColour = (
  value: number,
  thresholds: number[],
  palette: readonly string[] = heatmapColours
) => {
  if (value <= 0) return heatmapEmptyColour;
  // Values above every threshold (-1) go in the darkest bucket
  const level = thresholds.findIndex((threshold) => value <= threshold);
  return palette[level === -1 ? thresholds.length : level];
};
