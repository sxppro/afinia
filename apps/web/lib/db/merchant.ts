import { transactionExternalTable } from 'afinia-common/schema';
import { eq } from 'drizzle-orm';
import { appendFileSync } from 'node:fs';
import { db } from './client';

export const getMerchantByName = async (merchant: string) => {
  // #region agent log
  appendFileSync('/opt/cursor/logs/debug.log', `${JSON.stringify({ hypothesisId: 'A,B,C', location: 'apps/web/lib/db/merchant.ts:query-entry', message: 'merchant lookup input signature', data: { length: merchant.length, codePoints: Array.from(merchant, (character) => character.codePointAt(0)), hasPercent: merchant.includes('%'), hasSlash: merchant.includes('/'), hasApostrophe: merchant.includes("'") }, timestamp: Date.now() })}\n`);
  // #endregion
  const result = await db
    .select({ name: transactionExternalTable.description })
    .from(transactionExternalTable)
    .where(eq(transactionExternalTable.description, merchant))
    .limit(1);

  // #region agent log
  appendFileSync('/opt/cursor/logs/debug.log', `${JSON.stringify({ hypothesisId: 'C,D', location: 'apps/web/lib/db/merchant.ts:query-exit', message: 'merchant lookup database result signature', data: { rowCount: result.length, nameLength: result[0]?.name?.length, nameCodePoints: result[0]?.name ? Array.from(result[0].name, (character) => character.codePointAt(0)) : null }, timestamp: Date.now() })}\n`);
  // #endregion
  return result;
};
