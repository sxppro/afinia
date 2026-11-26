'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/ui';
import { parseAsString, useQueryState } from 'nuqs';
import { ReactNode, useTransition } from 'react';

const SpendingHourlyTabs = ({
  queryKey,
  defaultValue,
  options,
  children,
}: {
  queryKey: string;
  defaultValue: string;
  options: { label: string; value: string }[];
  children: ReactNode;
}) => {
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useQueryState(
    queryKey,
    parseAsString
      .withOptions({
        history: 'replace',
        scroll: false,
        shallow: false,
        clearOnDefault: true,
        startTransition,
      })
      .withDefault(defaultValue)
  );
  const activeTab = options.some((option) => option.value === tab)
    ? tab
    : defaultValue;

  return (
    <Tabs value={activeTab} onValueChange={(value) => setTab(value)}>
      <TabsList className="w-full">
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value}>
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent
        value={activeTab}
        className={cn('transition-opacity', isPending && 'opacity-60')}
      >
        {children}
      </TabsContent>
    </Tabs>
  );
};

export default SpendingHourlyTabs;
