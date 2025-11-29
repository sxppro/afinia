import { categoryTable } from 'afinia-common/schema';
import { eq } from 'drizzle-orm';
import { db } from '../client';

export const getCategoryById = (id: string) =>
  db.select().from(categoryTable).where(eq(categoryTable.category_id, id));
