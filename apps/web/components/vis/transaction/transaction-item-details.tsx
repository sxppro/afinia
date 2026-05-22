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
import { Skeleton } from '@/components/ui/skeleton';
import { getTransactionDetailById } from '@/lib/actions/transaction';
import { siteConfig } from '@/lib/siteConfig';
import { capitalise } from '@/lib/string';
import { cn, colours, formatCurrency } from '@/lib/ui';
import { transactionExternalTable } from 'afinia-common/schema';
import { format } from 'date-fns';
import { ExternalLink, SquarePen } from 'lucide-react';
import Link from 'next/link';
import { CSSProperties, PropsWithChildren, useState } from 'react';

const TransactionItemDetails = ({
  children,
  transaction,
}: {
  transaction: typeof transactionExternalTable.$inferSelect;
} & PropsWithChildren) => {
  const [transactionDetails, setTransactionDetails] =
    useState<Awaited<ReturnType<typeof getTransactionDetailById>>>(null);
  const [open, setOpen] = useState(false);
  const [showForeignAmount, setShowForeignAmount] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const {
    card_purchase_method,
    card_number_suffix,
    category,
    category_id,
    category_parent,
    category_parent_id,
    created_at,
    currency_code,
    deep_link_url,
    description,
    foreign_currency_code,
    foreign_value_in_base_units,
    message,
    note,
    raw_text,
    transaction_id,
    type,
    value_in_base_units,
  } = transaction;

  const isForeignTxn =
    foreign_currency_code !== null && foreign_value_in_base_units !== null;

  const handleOpenChange = async (open: boolean) => {
    setOpen(open);
    if (open && !transactionDetails) {
      /**
       * Not using startTransition here as it causes weird
       * UI behaviour showing a flash of content behind the
       * the drawer when additional details load
       */
      try {
        setIsLoadingDetails(true);
        const details = await getTransactionDetailById(transaction_id);
        setTransactionDetails(details);
      } catch (error) {
        console.error('Error fetching transaction details: ', error);
      } finally {
        setIsLoadingDetails(false);
      }
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="font-sans">
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
                  'flex aspect-square size-16 items-center justify-center rounded-2xl text-2xl font-semibold text-white',
                  category_parent_id
                    ? colours[category_parent_id].background
                    : 'bg-up-uncategorised'
                )}
              >
                <CategoryIconOrInitial
                  category_id={category_id}
                  description={description}
                  className="size-8"
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
            <DrawerTitle className="text-start text-xl font-bold">
              {description}
            </DrawerTitle>
            <DrawerDescription className="text-start font-mono">
              {raw_text}
            </DrawerDescription>
          </div>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-4">
          <div className="flex max-w-full items-center self-center rounded-full border">
            <span
              className={cn(
                'rounded-full px-4 py-1 font-medium',
                category_parent_id
                  ? colours[category_parent_id].background
                  : 'bg-up-uncategorised',
                // Invert text colour for all categories except for Good Life
                category_parent_id !== 'good-life'
                  ? 'text-primary-foreground'
                  : 'text-secondary-foreground'
              )}
            >
              {category_parent || 'Uncategorised'}
            </span>
            {category && (
              <span className="truncate px-4 py-1 font-medium">{category}</span>
            )}
          </div>
          {note ? (
            <Alert className="border-none bg-lime-50 dark:bg-lime-950/70">
              <SquarePen className="size-4" />
              <AlertTitle>Notes</AlertTitle>
              <AlertDescription>{note}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Transaction Details</h2>
            {message && (
              <div className="flex items-start justify-between gap-6">
                <p className="text-muted-foreground">Message</p>
                <p className="text-end font-medium">{message}</p>
              </div>
            )}
            <div className="flex justify-between">
              <p className="text-muted-foreground">When</p>
              <p className="text-end">
                {format(created_at, "do MMM yyyy 'at' h:mm aaa")}
              </p>
            </div>
            {card_number_suffix && (
              <div className="flex justify-between">
                <p className="text-muted-foreground">Which card</p>
                <p>{`· · · ·  ${card_number_suffix}`}</p>
              </div>
            )}
            {card_purchase_method && (
              <div className="flex justify-between">
                <p className="text-muted-foreground">Authorised via</p>
                <p>
                  {capitalise(
                    card_purchase_method.replaceAll('_', ' ').toLowerCase()
                  )}
                </p>
              </div>
            )}
            {type && (
              <div className="flex justify-between">
                <p className="text-muted-foreground">Type</p>
                <p>{type}</p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Additional Details</h2>
            {isLoadingDetails ? (
              <div className="flex flex-col gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton className="h-6 w-full" key={i} />
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">Account</p>
                  <p className="font-medium">
                    {transactionDetails?.account?.display_name ?? '—'}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">Round Up</p>
                  <p className="font-medium tabular-nums">
                    {transactionDetails?.round_up?.value_in_base_units
                      ? formatCurrency(
                          transactionDetails?.round_up?.value_in_base_units,
                          {
                            absolute: true,
                            baseUnits: true,
                            decimals: 2,
                            currency:
                              transactionDetails?.round_up?.currency_code,
                          }
                        )
                      : '—'}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">Cashback</p>
                  <p className="font-medium tabular-nums">
                    {transactionDetails?.cashback?.value_in_base_units
                      ? formatCurrency(
                          transactionDetails?.cashback?.value_in_base_units,
                          {
                            absolute: true,
                            baseUnits: true,
                            decimals: 2,
                            currency:
                              transactionDetails?.cashback?.currency_code,
                          }
                        )
                      : '—'}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">Held Amount</p>
                  <p className="font-medium tabular-nums">
                    {transactionDetails?.hold_info?.value_in_base_units
                      ? formatCurrency(
                          transactionDetails?.hold_info?.value_in_base_units,
                          {
                            absolute: true,
                            baseUnits: true,
                            decimals: 2,
                            currency:
                              transactionDetails?.hold_info?.currency_code,
                          }
                        )
                      : '—'}
                  </p>
                </div>
              </>
            )}
          </div>
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

export default TransactionItemDetails;
