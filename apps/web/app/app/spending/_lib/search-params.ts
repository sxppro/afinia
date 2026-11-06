import { ChartNoAxesCombined, LayoutGrid } from 'lucide-react';
import {
  createLoader,
  createSerializer,
  parseAsStringLiteral,
} from 'nuqs/server';

const DEFAULT_VIEW = 'overview';
export const SUPPORTED_VIEWS = ['overview', 'trends'] as const;

export const VIEWS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'trends', label: 'Trends', icon: ChartNoAxesCombined },
] as const satisfies readonly {
  id: (typeof SUPPORTED_VIEWS)[number];
  label: string;
  icon: typeof LayoutGrid;
}[];

export const viewParser =
  parseAsStringLiteral(SUPPORTED_VIEWS).withDefault(DEFAULT_VIEW);

export const viewLoader = createLoader({
  view: viewParser,
});

export const viewSerializer = createSerializer({
  view: viewParser,
});
