'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Drawer,
  DrawerContent,
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
import { getEndOfDay, getStartOfDay } from '@/lib/dateTime';
import {
  categoryTable,
  tagTable,
  transactionTable,
} from 'afinia-common/schema';
import { format, parse } from 'date-fns';
import { Loader2, SlidersHorizontal, X } from 'lucide-react';
import {
  parseAsBoolean,
  parseAsString,
  useQueryState,
  useQueryStates,
} from 'nuqs';
import { use, useState, useTransition } from 'react';

const DatePickerFilter = ({
  label,
  value,
  onChange,
  container,
}: {
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  container: HTMLDivElement | null;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Field
      orientation="horizontal"
      className="has-[>[data-slot=field-content]]:items-center"
    >
      <FieldContent>
        <FieldLabel
          htmlFor={`date-picker-${label.toLowerCase().replace(' ', '-')}`}
          className="text-muted-foreground text-base"
        >
          {label}
        </FieldLabel>
      </FieldContent>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className="min-w-24 justify-center font-normal"
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
  });
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

  const hasFilters = Object.values(draftFilters).some(
    (value) => value !== null
  );

  const handleFilterChange = async () => {
    await setFilters(draftFilters);
    setFiltersOpen(false);
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
        onOpenChange={setFiltersOpen}
        repositionInputs={false}
      >
        <DrawerTrigger asChild>
          <Button variant="outline" className="bg-transparent">
            <SlidersHorizontal className="size-4" />
            More filters
          </Button>
        </DrawerTrigger>
        <DrawerContent ref={setDrawer} className="font-sans">
          <DrawerHeader className="flex-row items-center justify-between">
            <DrawerTitle className="min-h-8 text-start text-xl font-bold">
              Filters
            </DrawerTitle>
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
                value={
                  draftFilters.from
                    ? parse(draftFilters.from, 'yyyy-MM-dd', getStartOfDay())
                    : undefined
                }
                onChange={(date) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    from: date ? format(date, 'yyyy-MM-dd') : null,
                  }))
                }
                container={drawer}
              />
              <DatePickerFilter
                label="To"
                value={
                  draftFilters.to
                    ? parse(draftFilters.to, 'yyyy-MM-dd', getEndOfDay())
                    : undefined
                }
                onChange={(date) => {
                  setDraftFilters((prev) => ({
                    ...prev,
                    to: date ? format(date, 'yyyy-MM-dd') : null,
                  }));
                }}
                container={drawer}
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
                value={draftFilters.tag ?? undefined}
                onValueChange={(value) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    tag: value ?? null,
                  }))
                }
              >
                <SelectTrigger id="tag" className="min-w-32">
                  <SelectValue placeholder="Select a tag">
                    {draftFilters.tag}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="font-sans">
                  <SelectGroup>
                    <SelectLabel>Tag</SelectLabel>
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
                value={draftFilters.type ?? undefined}
                onValueChange={(value) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    type: value ?? null,
                  }))
                }
              >
                <SelectTrigger id="type" className="min-w-32">
                  <SelectValue placeholder="Select a type">
                    {draftFilters.type}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="font-sans">
                  <SelectGroup>
                    <SelectLabel>Transaction Type</SelectLabel>
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
    </div>
  );
};

export default TransactionListFilters;
