import CategoryIconOrInitial from '@/components/category-icon-or-initial';
import ScrollableContent from '@/components/misc/scrollable-content';
import { Button } from '@/components/ui/button';
import {
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerNested,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field';
import { RadioGroup, RadioGroupItemTick } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { SMALL_PAGE_SIZE } from '@/lib/constants';
import { cn, colours } from '@/lib/ui';
import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';
import { transactionExternalTable } from 'afinia-common/schema';
import { PencilIcon, X } from 'lucide-react';
import { Fragment, useState } from 'react';

interface TransactionItemCategoryProps {
  transaction: typeof transactionExternalTable.$inferSelect;
}

const TransactionEditCategory = ({
  transaction,
}: TransactionItemCategoryProps) => {
  const { category_id } = transaction;

  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    category_id
  );
  const trpc = useTRPC();

  const {
    data: categoryGroups,
    isLoading,
    isError,
  } = useQuery(
    trpc.category.getCategoriesForReassignment.queryOptions(undefined, {
      enabled: open,
    })
  );

  return (
    <DrawerNested open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="lg" className="rounded-lg">
          Edit Category
          <PencilIcon
            className="size-4"
            aria-hidden="true"
            data-icon="inline-end"
          />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="font-sans">
        <DrawerHeader>
          <DrawerTitle className="text-start text-xl">
            Edit Category
          </DrawerTitle>
        </DrawerHeader>
        <ScrollableContent
          hideScrollbar
          className="flex max-h-128 flex-col gap-2 px-4"
        >
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {[...Array(SMALL_PAGE_SIZE)].map((_, i) => (
                <Skeleton className="h-10 w-full" key={i} />
              ))}
            </div>
          ) : categoryGroups ? (
            <RadioGroup
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              {categoryGroups.map((group) => {
                const categoryColour = colours[group.category_parent_id];

                return (
                  <Fragment key={group.category_parent_id}>
                    <p className="text-muted-foreground text-sm">
                      {group.category_parent_name}
                    </p>
                    <div
                      className={cn(
                        'flex flex-col overflow-hidden rounded-lg border',
                        categoryColour.backgroundMuted,
                        categoryColour.borderMuted
                      )}
                    >
                      {group.categories.map((category) => {
                        const isSelected =
                          category.category_id === selectedCategory;

                        return (
                          <FieldLabel
                            key={category.category_id}
                            htmlFor={category.category_id}
                            className="has-[>[data-slot=field]]:rounded-none has-[>[data-slot=field]]:border-0 [&>[data-slot=field]]:p-2"
                          >
                            <Field
                              orientation="horizontal"
                              className={cn(
                                'transition has-[>[data-slot=field-content]]:items-center',
                                isSelected
                                  ? categoryColour.backgroundAccent
                                  : ''
                              )}
                            >
                              <FieldContent className="flex-row gap-2">
                                <CategoryIconOrInitial
                                  category_id={category.category_id}
                                  description={category.category_name}
                                />
                                <FieldTitle>
                                  {category.category_name}
                                </FieldTitle>
                              </FieldContent>
                              <RadioGroupItemTick
                                value={category.category_id}
                                id={category.category_id}
                              />
                            </Field>
                          </FieldLabel>
                        );
                      })}
                    </div>
                  </Fragment>
                );
              })}
            </RadioGroup>
          ) : (
            <div className="flex h-128 flex-col items-center justify-center gap-2">
              <X className="text-muted-foreground size-8" />
              <p className="text-muted-foreground text-lg tracking-tight">
                Failed to retrieve categories
              </p>
            </div>
          )}
        </ScrollableContent>
        <DrawerFooter>
          <Button size="lg">Save</Button>
        </DrawerFooter>
      </DrawerContent>
    </DrawerNested>
  );
};

export default TransactionEditCategory;
