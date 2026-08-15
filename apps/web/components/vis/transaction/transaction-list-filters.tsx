'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getStartOfDay } from '@/lib/dateTime';
import {
  DEFAULT_TRANSACTION_SORT,
  isTransactionSort,
  transactionSortValues,
  type TransactionSort,
} from '@/lib/transaction-sort';
import {
  categoryTable,
  tagTable,
  transactionTable,
} from 'afinia-common/schema';
import { format, isValid, parse } from 'date-fns';
import { ArrowUpDown, Loader2, SlidersHorizontal, X } from 'lucide-react';
import {
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from 'nuqs';
import { use, useState, useTransition } from 'react';
import type { Matcher } from 'react-day-picker';

const DatePickerFilter = ({
  label,
  value,
  onChange,
  container,
  disabled,
}: {
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  container: HTMLDivElement | null;
  disabled?: Matcher | Matcher[];
}) => {
  const [open, setOpen] = useState(false);
  const id = `date-picker-${label.toLowerCase().replace(' ', '-')}`;

  return (
    <Field
      orientation="horizontal"
      className="has-[>[data-slot=field-content]]:items-center"
    >
      <FieldContent>
        <FieldLabel htmlFor={id} className="text-muted-foreground text-base">
          {label}
        </FieldLabel>
      </FieldContent>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              variant="outline"
              className="min-w-24 justify-center font-normal"
              aria-label={`${label} date: ${
                value ? format(value, 'dd/MM/yyyy') : 'any date'
              }`}
            >
              {value ? format(value, 'dd/MM/yyyy') : 'Any date'}
            </Button>
          }
        />
        <PopoverContent
          className="w-auto overflow-hidden p-0"
          align="start"
          container={container}
        >
          <Calendar
            mode="single"
            selected={value}
            defaultMonth={value}
            captionLayout="dropdown"
            disabled={disabled}
            onSelect={(date) => {
              onChange(date);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
};

const sortLabels: Record<TransactionSort, string> = {
  'date-desc': 'Date (newest first)',
  'date-asc': 'Date (oldest first)',
  'amount-desc': 'Amount (highest first)',
  'amount-asc': 'Amount (lowest first)',
};
const ANY_FILTER_VALUE = '__any__';

const parseFilterDate = (value: string | null) => {
  if (!value) return undefined;

  const date = parse(value, 'yyyy-MM-dd', getStartOfDay());
  return isValid(date) ? date : undefined;
};

interface TransactionListFiltersProps {
  categoriesFetch: Promise<(typeof categoryTable.$inferSelect)[]>;
  tagsFetch: Promise<(typeof tagTable.$inferSelect)[]>;
  transactionTypesFetch: Promise<
    Pick<typeof transactionTable.$inferSelect, 'type'>[]
  >;
}

const TransactionListFilters = ({
  categoriesFetch,
  tagsFetch,
  transactionTypesFetch,
}: TransactionListFiltersProps) => {
  const categories = use(categoriesFetch);
  const tags = use(tagsFetch);
  const transactionTypes = use(transactionTypesFetch);
  const [isLoading, startTransition] = useTransition();

  // State
  const [category, setCategory] = useQueryState('category', {
    defaultValue: 'all',
    shallow: false,
    startTransition,
  });
  const [sort, setSort] = useQueryState(
    'sort',
    parseAsStringLiteral(transactionSortValues)
      .withDefault(DEFAULT_TRANSACTION_SORT)
      .withOptions({ shallow: false, startTransition })
  );
  // Filter state from query params
  const [filters, setFilters] = useQueryStates(
    {
      from: parseAsString,
      to: parseAsString,
      tag: parseAsString,
      type: parseAsString,
      has_note: parseAsBoolean,
      has_attachment: parseAsBoolean,
    },
    {
      shallow: false,
      startTransition,
    }
  );
  // Filter state from unsubmitted inputs
  const [draftFilters, setDraftFilters] = useState(filters);
  const [drawer, setDrawer] = useState<HTMLDivElement | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = [
    parseFilterDate(filters.from) || parseFilterDate(filters.to),
    filters.tag,
    filters.type,
    filters.has_note === true,
    filters.has_attachment === true,
  ].filter(Boolean).length;
  const hasFilters = [
    draftFilters.from,
    draftFilters.to,
    draftFilters.tag,
    draftFilters.type,
    draftFilters.has_note === true,
    draftFilters.has_attachment === true,
  ].some(Boolean);
  const draftFrom = parseFilterDate(draftFilters.from);
  const draftTo = parseFilterDate(draftFilters.to);

  const handleFilterChange = async () => {
    await setFilters(draftFilters);
    setFiltersOpen(false);
  };
  const handleFiltersOpenChange = (open: boolean) => {
    if (open) {
      setDraftFilters(filters);
    }
    setFiltersOpen(open);
  };
  const handleReset = () => {
    setDraftFilters({
      from: null,
      to: null,
      tag: null,
      type: null,
      has_note: null,
      has_attachment: null,
    });
  };

  return (
    <div className="grid grid-cols-2 gap-1">
      <Select value={category ?? 'all'} onValueChange={setCategory}>
        <SelectTrigger className="w-full max-w-48 text-base">
          <SelectValue placeholder="Category">
            {category === 'all'
              ? 'All Categories'
              : category === 'uncategorised'
                ? 'Uncategorised'
                : categories.find((c) => c.category_id === category)
                    ?.category_name}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Category</SelectLabel>
            <SelectItem className="text-base" value="all">
              All Categories
            </SelectItem>
            {categories.map((category) => (
              <SelectItem
                key={category.category_id}
                className="text-base"
                value={category.category_id}
              >
                {category.category_name}
              </SelectItem>
            ))}
            <SelectItem className="text-base" value="uncategorised">
              Uncategorised
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Drawer
        open={filtersOpen}
        onOpenChange={handleFiltersOpenChange}
        repositionInputs={false}
      >
        <DrawerTrigger asChild>
          <Button variant="outline" className="bg-transparent">
            <SlidersHorizontal className="size-4" />
            More filters
            {activeFilterCount > 0 && <Badge>{activeFilterCount}</Badge>}
          </Button>
        </DrawerTrigger>
        <DrawerContent ref={setDrawer} className="overflow-y-auto font-sans">
          <DrawerHeader className="flex-row items-center justify-between">
            <DrawerTitle className="min-h-8 text-start text-xl font-bold">
              Filters
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Refine transactions by date, tag, type, note, or attachment.
            </DrawerDescription>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-muted-foreground"
              >
                <X className="size-4" />
                Clear filters
              </Button>
            )}
          </DrawerHeader>
          <div className="flex flex-col gap-4 px-4">
            <div className="flex flex-col gap-2">
              <DatePickerFilter
                label="From"
                value={draftFrom}
                onChange={(date) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    from: date ? format(date, 'yyyy-MM-dd') : null,
                  }))
                }
                container={drawer}
                disabled={draftTo ? { after: draftTo } : undefined}
              />
              <DatePickerFilter
                label="To"
                value={draftTo}
                onChange={(date) => {
                  setDraftFilters((prev) => ({
                    ...prev,
                    to: date ? format(date, 'yyyy-MM-dd') : null,
                  }));
                }}
                container={drawer}
                disabled={draftFrom ? { before: draftFrom } : undefined}
              />
            </div>
            <Field
              orientation="horizontal"
              className="has-[>[data-slot=field-content]]:items-center"
            >
              <FieldContent>
                <FieldLabel
                  htmlFor="tag"
                  className="text-muted-foreground text-base"
                >
                  Tag
                </FieldLabel>
              </FieldContent>
              <Select
                value={draftFilters.tag ?? ANY_FILTER_VALUE}
                onValueChange={(value) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    tag: value === ANY_FILTER_VALUE ? null : value,
                  }))
                }
              >
                <SelectTrigger id="tag" className="min-w-32">
                  <SelectValue placeholder="Select a tag">
                    {draftFilters.tag ?? 'Any tag'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="font-sans">
                  <SelectGroup>
                    <SelectLabel>Tag</SelectLabel>
                    <SelectItem value={ANY_FILTER_VALUE}>Any tag</SelectItem>
                    {tags.map(({ tag_id }) => (
                      <SelectItem key={tag_id} value={tag_id}>
                        {tag_id}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field
              orientation="horizontal"
              className="has-[>[data-slot=field-content]]:items-center"
            >
              <FieldContent>
                <FieldLabel
                  htmlFor="type"
                  className="text-muted-foreground text-base"
                >
                  Transaction Type
                </FieldLabel>
              </FieldContent>
              <Select
                value={draftFilters.type ?? ANY_FILTER_VALUE}
                onValueChange={(value) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    type: value === ANY_FILTER_VALUE ? null : value,
                  }))
                }
              >
                <SelectTrigger id="type" className="min-w-32">
                  <SelectValue placeholder="Select a type">
                    {draftFilters.type ?? 'Any type'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="font-sans">
                  <SelectGroup>
                    <SelectLabel>Transaction Type</SelectLabel>
                    <SelectItem value={ANY_FILTER_VALUE}>Any type</SelectItem>
                    {transactionTypes.map(({ type }) =>
                      type ? (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ) : null
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field orientation="horizontal">
              <FieldContent className="gap-1">
                <FieldLabel htmlFor="has-note" className="text-base">
                  Has note
                </FieldLabel>
                <FieldDescription>
                  Show only transactions with a note.
                </FieldDescription>
              </FieldContent>
              <Checkbox
                id="has-note"
                checked={draftFilters.has_note ?? false}
                onCheckedChange={(checked) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    has_note: checked ? checked : null,
                  }))
                }
                className="size-5"
              />
            </Field>
            <Field orientation="horizontal">
              <FieldContent className="gap-1">
                <FieldLabel htmlFor="has-attachment" className="text-base">
                  Has attachment
                </FieldLabel>
                <FieldDescription>
                  Show only transactions with an attachment.
                </FieldDescription>
              </FieldContent>
              <Checkbox
                id="has-attachment"
                checked={draftFilters.has_attachment ?? false}
                onCheckedChange={(checked) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    has_attachment: checked ? checked : null,
                  }))
                }
                className="size-5"
              />
            </Field>
          </div>
          <DrawerFooter className="grid">
            <Button onClick={handleFilterChange} disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span>Applying filters...</span>
                  <Loader2 className="size-4 animate-spin" />
                </div>
              ) : (
                'Apply filters'
              )}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <Select
        value={sort}
        onValueChange={(value) => {
          if (isTransactionSort(value)) {
            void setSort(value);
          }
        }}
        disabled={isLoading}
      >
        <SelectTrigger
          className="col-span-2 w-full bg-transparent text-base"
          aria-label="Sort transactions"
        >
          <ArrowUpDown className="size-4" />
          <SelectValue>{sortLabels[sort]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Sort transactions</SelectLabel>
            {transactionSortValues.map((value) => (
              <SelectItem className="text-base" key={value} value={value}>
                {sortLabels[value]}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default TransactionListFilters;
