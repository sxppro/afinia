import { db } from '@/src/db/client';
import { tagTable } from '@/src/db/schema';
import { components } from 'afinia-common/types/up-api';
import { InferInsertModel, notInArray } from 'drizzle-orm';
import { upClient } from '../utils/clients';
import { getNextPage } from '../utils/fetch';

const PROCESS_NAME = 'processTags';

const upsertTags = async (
  tags: components['schemas']['TagResource'][],
  page: number
) => {
  const remap = (
    tag: components['schemas']['TagResource']
  ): InferInsertModel<typeof tagTable> => ({
    tag_id: tag.id,
  });
  console.log(`Processing tags: page ${page}`);
  await db.insert(tagTable).values(tags.map(remap)).onConflictDoNothing();
  console.log(`Finished processing tags: page ${page}`);
};

const deleteTags = async (
  tagSet: Set<components['schemas']['TagResource']['id']>
) => {
  if (tagSet.size === 0) {
    return;
  }

  console.log('Deleting orphaned tags ...');
  const tagIds = Array.from(tagSet);
  const deleteResult = await db
    .delete(tagTable)
    .where(notInArray(tagTable.tag_id, tagIds))
    .returning({ tag_id: tagTable.tag_id });
  console.log(
    `Deleted ${deleteResult.length} orphaned tags: `,
    deleteResult.map((r) => r.tag_id)
  );
};

export const processTags = async () => {
  try {
    const { data } = await upClient.GET('/tags');
    const tagSet = new Set<components['schemas']['TagResource']['id']>();
    const CURRENT_PAGE = 1;

    const upsertAndCollateTags = async (
      tags: components['schemas']['TagResource'][],
      page: number
    ) => {
      tags.forEach((tag) => tagSet.add(tag.id));
      await upsertTags(tags, page);
    };

    if (data) {
      // Process initial page
      if (data.data) {
        await upsertAndCollateTags(data.data, CURRENT_PAGE);
      }
      // Process subsequent pages
      if (data.links?.next) {
        await getNextPage<components['schemas']['TagResource']>(
          data.links.next,
          upsertAndCollateTags,
          CURRENT_PAGE + 1
        );
      }

      // Delete orphaned tags
      await deleteTags(tagSet);
    }
  } catch (error) {
    console.error(`Error in ${PROCESS_NAME}: `, error);
  }
};
