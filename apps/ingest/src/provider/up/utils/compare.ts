/**
 * Compares data from an external provider with database records and synchronizes any differences.
 *
 * @template T - The type of data being compared and synchronized
 * @param {Object} params
 * @param {T[]} params.providerData - Data from the external provider
 * @param {T[]} params.dbData - Data currently stored in database
 * @param {Function} params.insertToDb - Function to insert data from provider to database
 * @param {Function} params.deleteFromDb - Function to delete data from database
 *
 * @example
 * const { inserted, deleted } = await compareProviderAndDb({
      providerData: externalTransactionsByTag?.map((t) => t.id),
      dbData: transactionsByTag?.map((t) => t.providerId),
      insertToDb: (providerId) => tagTransaction(providerId, tagId),
      deleteFromDb: (providerId) => untagTransaction(providerId, tagId),
  });
 */
export const compareProviderAndDb = async <T>({
  providerData,
  dbData,
  insertToDb,
  deleteFromDb,
}: {
  providerData: T[];
  dbData: T[];
  insertToDb: (data: T) => Promise<unknown>;
  deleteFromDb: (data: T) => Promise<unknown>;
}) => {
  if (providerData.length === 0 && dbData.length === 0) {
    return { inserted: 0, deleted: 0 };
  }
  const providerSet = new Set(providerData);
  const dbSet = new Set(dbData);

  // Data present in provider but missing in DB
  const toInsert = Array.from(providerSet.difference(dbSet));
  const insertResponse = await Promise.allSettled(
    toInsert.map((data) => insertToDb(data))
  );
  const insertCount = insertResponse.filter(
    (res) => res.status === 'fulfilled'
  ).length;

  // Data present in DB but not in provider
  const toDelete = Array.from(dbSet.difference(providerSet));
  const deleteResponse = await Promise.allSettled(
    toDelete.map((data) => deleteFromDb(data))
  );
  const deleteCount = deleteResponse.filter(
    (res) => res.status === 'fulfilled'
  ).length;

  return { inserted: insertCount, deleted: deleteCount };
};
