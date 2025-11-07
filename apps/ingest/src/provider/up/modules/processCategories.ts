import { db } from '@/src/db/client';
import { categoryTable } from '@/src/db/schema';
import { components } from 'afinia-common/types/up-api';
import { and, eq, InferInsertModel, isNull, ne, or, sql } from 'drizzle-orm';
import { upClient } from '../utils/clients';

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

export const processCategories = async () => {
  try {
    const { data } = await upClient.GET('/categories');

    if (data?.data) {
      await upsertCategories(data.data);
    }
  } catch (error) {
    console.error(`Error in ${PROCESS_NAME}: `, error);
  }
};
