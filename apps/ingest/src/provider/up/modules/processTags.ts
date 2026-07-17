import { db } from '@/src/db/client';
import { components } from 'afinia-common/providers/up';
import { tagTable } from 'afinia-common/schema';
import { InferInsertModel, notInArray } from 'drizzle-orm';
import { upClient } from '../utils/clients';
import { ALERT_LEVEL } from '../utils/constants';
import { getNextPage, isRateLimitReached } from '../utils/fetch';
import { notify } from '../utils/notify';

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

  const tagIds = Array.from(tagSet);
  const deleteResult = await db
    .delete(tagTable)
    .where(notInArray(tagTable.tag_id, tagIds))
    .returning({ tag_id: tagTable.tag_id });

  if (deleteResult.length > 0) {
    console.log(
      `Deleted ${deleteResult.length} orphaned tags: `,
      deleteResult.map((r) => r.tag_id)
    );
  }
};

/**
 * Syncs tags from Up to database
 * @returns whether the sync was completed in full
 */
export const processTags = async (): Promise<boolean> => {
  try {
    const tagSet = new Set<components['schemas']['TagResource']['id']>();
    const CURRENT_PAGE = 1;
    let paginationComplete = false;
    // Fetch tags from Up API
    const { data, response, error } = await upClient.GET('/tags');

    const collateAndUpsertTags = async (
      tags: components['schemas']['TagResource'][],
      page: number
    ) => {
      tags.forEach((tag) => tagSet.add(tag.id));
      await upsertTags(tags, page);
    };

    if (error) {
      console.error(error);
      await notify(
        ALERT_LEVEL.ERROR,
        `[Up] Failed to fetch tags: ${JSON.stringify(error)}`
      );
      return false;
    }
    if (!data) {
      return false;
    }

    // Process data
    paginationComplete = data.links?.next === null;
    if (data.data) {
      await collateAndUpsertTags(data.data, CURRENT_PAGE);
    }
    // Process subsequent pages if available
    if (data.links?.next) {
      if (isRateLimitReached(response.headers)) {
        console.warn(`[${PROCESS_NAME}] Rate limit reached after page 1`);
      } else {
        const result = await getNextPage<components['schemas']['TagResource']>(
          data.links.next,
          collateAndUpsertTags,
          CURRENT_PAGE + 1
        );
        paginationComplete = result.complete;
      }
    }

    /**
     * Only delete any orphan tags if pagination complete
     * with all tags from provider
     */
    if (paginationComplete) {
      await deleteTags(tagSet);
    } else {
      console.warn(
        `[${PROCESS_NAME}] Unable to retrieve all tags: tag sync incomplete`
      );
    }

    return paginationComplete;
  } catch (error) {
    console.error(`Error in ${PROCESS_NAME}: `, error);
    return false;
  }
};
