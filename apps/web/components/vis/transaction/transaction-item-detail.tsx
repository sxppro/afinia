'use client';

import CategoryIconOrInitial from '@/components/category-icon-or-initial';
import CurrencyFlow from '@/components/currency-flow';
import CurrencySwitch from '@/components/currency-switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { siteConfig } from '@/lib/siteConfig';
import { cn, colours } from '@/lib/ui';
import { transactionExternalTable } from 'afinia-common/schema';
import { ExternalLink, SquarePen } from 'lucide-react';
import Link from 'next/link';
import { CSSProperties, PropsWithChildren, useState } from 'react';

const TransactionItemDetail = ({
  children,
  transaction,
}: {
  transaction: typeof transactionExternalTable.$inferSelect;
} & PropsWithChildren) => {
  const [open, setOpen] = useState(false);
  const [showForeignAmount, setShowForeignAmount] = useState(false);
  const {
    deep_link_url,
    category_id,
    category_parent_id,
    currency_code,
    description,
    value_in_base_units,
    raw_text,
    foreign_currency_code,
    foreign_value_in_base_units,
    note,
  } = transaction;

  const isForeignTxn =
    foreign_currency_code !== null && foreign_value_in_base_units !== null;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="font-sans">
        <div className="w-full">
          <DrawerHeader className="gap-2">
            <div className="flex justify-between gap-2">
              <Link
                href={
                  category_id
                    ? `${siteConfig.baseLinks.spending}/${category_id}`
                    : '#'
                }
              >
                <span
                  className={cn(
                    'flex aspect-square size-16 items-center justify-center rounded-2xl text-xl font-semibold text-white',
                    category_parent_id
                      ? colours[category_parent_id].background
                      : 'bg-up-uncategorised'
                  )}
                >
                  <CategoryIconOrInitial
                    category_id={category_id}
                    description={description}
                    className="size-8 text-2xl"
                  />
                </span>
              </Link>
              <div className="-mt-2 flex flex-col items-end">
                <CurrencyFlow
                  className="text-4xl font-semibold"
                  value={
                    showForeignAmount && isForeignTxn
                      ? foreign_value_in_base_units
                      : value_in_base_units
                  }
                  currency={
                    showForeignAmount && isForeignTxn
                      ? foreign_currency_code
                      : currency_code
                  }
                />
                {isForeignTxn ? (
                  <CurrencySwitch
                    checked={showForeignAmount}
                    onCheckedChange={setShowForeignAmount}
                    baseCurrency={currency_code}
                    foreignCurrency={foreign_currency_code}
                  />
                ) : (
                  <Badge variant="secondary">{currency_code}</Badge>
                )}
              </div>
            </div>
            <div>
              <DrawerTitle className="text-start text-xl">
                {description}
              </DrawerTitle>
              <DrawerDescription className="text-start font-mono">
                {raw_text}
              </DrawerDescription>
            </div>
          </DrawerHeader>
        </div>
        <div className="flex flex-col gap-2 px-4">
          {note ? (
            <Alert className="border-none bg-lime-50 dark:bg-lime-950/70">
              <SquarePen className="size-4" />
              <AlertTitle>Notes</AlertTitle>
              <AlertDescription>{note}</AlertDescription>
            </Alert>
          ) : null}
          <div className="border-muted-foreground/20 rounded-md border"></div>
        </div>
        {deep_link_url && (
          <DrawerFooter>
            <div
              className="rounded-lg transition"
              style={
                {
                  // A purplish colour
                  '--highlight': 'oklch(0.69 0.3 329.98)',
                  '--bg-color':
                    'linear-gradient(var(--background), var(--background))',
                  '--border-color': `conic-gradient(
                      from var(--border-angle),
                      var(--highlight) 0%,
                      color-mix(in oklch, var(--highlight) 20%, transparent) 25%,
                      color-mix(in oklch, var(--highlight) 80%, transparent) 50%,
                      color-mix(in oklch, var(--highlight) 20%, transparent) 75%,
                      var(--highlight) 100%
                    )`,
                  animation: 'border-rotate 10s linear infinite',
                  backgroundImage:
                    'linear-gradient(var(--background), var(--background)), var(--border-color)',
                  backgroundOrigin: 'padding-box, border-box',
                  backgroundClip: 'padding-box, border-box',
                  borderColor: 'transparent',
                  borderWidth: '2px',
                } as CSSProperties
              }
            >
              <Button variant="secondary" asChild>
                <Link href={deep_link_url} className="w-full">
                  Open in app
                  <ExternalLink aria-hidden="true" className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default TransactionItemDetail;
