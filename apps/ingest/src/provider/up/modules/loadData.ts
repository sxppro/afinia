import { processAccounts } from './processAccounts';
import { processCategories } from './processCategories';
import { processTags } from './processTags';
import { processTransactions } from './processTransactions';

const loadData = async () => {
  console.log('Starting loadData');
  await processAccounts();
  await processCategories();
  await processTags();
  await processTransactions();
  console.log('Finished loadData');
};

loadData()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error in loadData: ', error);
    process.exit(1);
  });
