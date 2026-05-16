'use client';

import CategoryIconOrInitial from '@/components/category-icon-or-initial';
import CurrencyFlow from '@/components/currency-flow';
import CurrencySwitch from '@/components/currency-switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
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
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { PropsWithChildren, useState } from 'react';

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
                  <Badge>{currency_code}</Badge>
                )}
              </div>
            </div>
            <div>
              <DrawerTitle className="text-start text-xl">
                {description}
              </DrawerTitle>
              <DrawerDescription className="text-start">
                {raw_text}
              </DrawerDescription>
            </div>
          </DrawerHeader>
        </div>
        <div className="p-4 pb-0"></div>
        <DrawerFooter className="flex-row">
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1">
              Close
            </Button>
          </DrawerClose>
          {deep_link_url && (
            <Button asChild>
              <Link href={deep_link_url} className="flex-1">
                Open in app
                <ExternalLink aria-hidden="true" className="ml-1 size-4" />
              </Link>
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default TransactionItemDetail;
