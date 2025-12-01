import { categoryTable } from 'afinia-common/schema';
import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from './client';

export const getCategoryById = (id: string) => {
  const categoryParent = alias(categoryTable, 'category_parent');

  return db
    .select()
    .from(categoryTable)
    .where(eq(categoryTable.category_id, id))
    .leftJoin(
      categoryParent,
      eq(categoryTable.category_parent_id, categoryParent.category_id)
    );
};
