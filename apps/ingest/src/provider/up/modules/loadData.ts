import { processAccounts } from './processAccounts';
import { processCategories } from './processCategories';
import { processTags } from './processTags';
import { processTransactions } from './processTransactions';

const PROCESS_NAME = 'loadData';

const loadData = async () => {
  console.log(`[${PROCESS_NAME}] Starting`);
  const accountsSynced = await processAccounts();
  const categoriesSynced = await processCategories();
  const tagsSynced = await processTags();
  const transactionsSynced = await processTransactions();

  console.info(`[${PROCESS_NAME}] Sync Status: 
    Accounts: ${accountsSynced ? 'Success' : 'Incomplete'}
    Categories: ${categoriesSynced ? 'Success' : 'Incomplete'}
    Tags: ${tagsSynced ? 'Success' : 'Incomplete'}
    Transactions: ${transactionsSynced ? 'Success' : 'Incomplete'}
  `);
  console.log(`[${PROCESS_NAME}] Finished`);
};

loadData()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error in loadData: ', error);
    process.exit(1);
  });
