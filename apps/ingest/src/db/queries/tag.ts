import { tagTable } from 'afinia-common/schema';
import { eq } from 'drizzle-orm';
import { db } from '../client';

export const getTag = (id: string) =>
  db.select().from(tagTable).where(eq(tagTable.tag_id, id));
