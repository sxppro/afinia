import { siteConfig } from '@/lib/siteConfig';
import { ChartNoAxesCombined, LayoutGrid } from 'lucide-react';

/**
 * Order by position
 */
export const VIEWS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutGrid,
    href: siteConfig.baseLinks.spending,
  },
  {
    id: 'trends',
    label: 'Trends',
    icon: ChartNoAxesCombined,
    href: `${siteConfig.baseLinks.spending}/trends`,
  },
] as const;
