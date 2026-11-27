'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseAsString, useQueryState } from 'nuqs';
import { ReactNode } from 'react';

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
  const [tab, setTab] = useQueryState(
    queryKey,
    parseAsString
      .withOptions({
        history: 'replace',
        scroll: false,
        shallow: false,
        clearOnDefault: true,
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
      <TabsContent value={activeTab}>{children}</TabsContent>
    </Tabs>
  );
};

export default SpendingHourlyTabs;
