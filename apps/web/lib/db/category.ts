import { categoryTable } from 'afinia-common/schema';
import { eq, isNotNull, isNull, sql } from 'drizzle-orm';
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

/**
 * Retrieves categories grouped by their parent category
 * @returns
 */
export const getCategoriesGrouped = async () => {
  const categoryParent = alias(categoryTable, 'category_parent');
  return await db
    .select({
      category_parent_id: categoryTable.category_parent_id,
      category_parent_name: categoryParent.category_name,
      category_ids: sql<
        string[]
      >`array_agg(${categoryTable.category_id} ORDER BY ${categoryTable.category_name})`,
      category_names: sql<
        string[]
      >`array_agg(${categoryTable.category_name} ORDER BY ${categoryTable.category_name})`,
    })
    .from(categoryTable)
    .leftJoin(
      categoryParent,
      eq(categoryTable.category_parent_id, categoryParent.category_id)
    )
    .where(isNotNull(categoryTable.category_parent_id))
    .groupBy(categoryTable.category_parent_id, categoryParent.category_name)
    .orderBy(categoryParent.category_name);
};
