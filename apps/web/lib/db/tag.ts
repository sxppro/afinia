import { tagTable } from 'afinia-common/schema';
import { db } from './client';

/**
 * Retrieves all tags
 */
export const getTags = () =>
  db.select().from(tagTable).orderBy(tagTable.tag_id);
