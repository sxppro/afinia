import { sql } from 'drizzle-orm';
import { ALERT_LEVEL } from '../provider/up/utils/constants';
import { notify } from '../provider/up/utils/notify';
import { db } from './client';

export const checkDatabaseConnection = async () => {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Failed to connect to database: ', error);
    await notify(
      ALERT_LEVEL.ERROR,
      `Failed to connect to database: ${JSON.stringify(error)}`
    );
    return false;
  }
};
