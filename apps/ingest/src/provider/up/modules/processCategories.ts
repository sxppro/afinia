import { db } from '@/src/db/client';
import { components } from 'afinia-common/providers/up';
import { categoryTable } from 'afinia-common/schema';
import { and, eq, InferInsertModel, isNull, ne, or, sql } from 'drizzle-orm';
import { upClient } from '../utils/clients';
import { ALERT_LEVEL } from '../utils/constants';
import { notify } from '../utils/notify';

const PROCESS_NAME = 'processCategories';

const upsertCategories = async (
  categories: components['schemas']['CategoryResource'][]
) => {
  const remap = (
    category: components['schemas']['CategoryResource']
  ): InferInsertModel<typeof categoryTable> => {
    return {
      category_id: category.id,
      category_name: category.attributes.name,
    };
  };
  console.log('Processing categories');
  await db
    .insert(categoryTable)
    .values(categories.map(remap))
    .onConflictDoUpdate({
      target: categoryTable.category_id,
      set: {
        category_name: sql`excluded.category_name`,
      },
    });
  console.log('Finished processing categories');

  console.log('Processing category relationships');
  const parentCategories = categories.filter(
    (category) => category.relationships.children.data.length > 0
  );
  for (const parentCategory of parentCategories) {
    const parentId = parentCategory.id;
    const childIds = parentCategory.relationships.children.data.map(
      (child) => child.id
    );
    for (const childId of childIds) {
      await db
        .update(categoryTable)
        .set({
          category_parent_id: parentId,
        })
        .where(
          and(
            eq(categoryTable.category_id, childId),
            or(
              isNull(categoryTable.category_parent_id),
              ne(categoryTable.category_parent_id, parentId)
            )
          )
        );
    }
  }
  console.log('Finished processing category relationships');
};

/**
 * Syncs categories from Up to database
 * @returns whether the sync was completed
 */
export const processCategories = async (): Promise<boolean> => {
  try {
    const { data, error } = await upClient.GET('/categories');
    if (error) {
      console.error(error);
      await notify(
        ALERT_LEVEL.ERROR,
        `[Up] Failed to fetch categories: ${JSON.stringify(error)}`
      );
      return false;
    }
    if (!data) {
      return false;
    }

    // Process data
    if (data.data) {
      await upsertCategories(data.data);
    }

    return true;
  } catch (error) {
    console.error(`Error in ${PROCESS_NAME}: `, error);
    return false;
  }
};
