import { categoryTable } from 'afinia-common/schema';
import { eq, isNotNull, isNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { cacheLife } from 'next/cache';
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

/**
 * Retrieves a category and its parent
 * Cached for 1 hour
 * @returns category row, or null if not found
 */
export const getCategoryDetails = async (id: string) => {
  'use cache';
  cacheLife('hours');
  const [row] = await getCategoryById(id);
  return row ?? null;
};

/**
 * Retrieves all parent categories
 * @returns
 */
export const getParentCategories = async () =>
  await db
    .select()
    .from(categoryTable)
    .where(isNull(categoryTable.category_parent_id));

/**
 * Retrieves all categories excluding parent categories
 * @returns
 */
export const getCategories = async () => {
  const categoryParent = alias(categoryTable, 'category_parent');
  return await db
    .select({
      category_id: categoryTable.category_id,
      category_name: categoryTable.category_name,
      category_parent_id: categoryTable.category_parent_id,
      category_parent_name: categoryParent.category_name,
    })
    .from(categoryTable)
    .leftJoin(
      categoryParent,
      eq(categoryTable.category_parent_id, categoryParent.category_id)
    )
    .where(isNotNull(categoryTable.category_parent_id))
    .orderBy(categoryTable.category_name);
};
