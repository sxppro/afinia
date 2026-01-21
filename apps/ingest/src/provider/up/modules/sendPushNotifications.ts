import { db } from '@/src/db/client';
import {
  notificationTable,
  transactionExternalTable,
  transactionTable,
} from 'afinia-common/schema';
import { count, eq } from 'drizzle-orm';
import { Resource } from 'sst';
import webpush from 'web-push';

if (
  !Resource.VAPID_PRIVATE_KEY.value ||
  !Resource.VAPID_PUBLIC_KEY.value ||
  !Resource.BASE_URL.value
) {
  throw new Error(
    'VAPID keys or base URL not provided. Please set them in .env and run load-env'
  );
}

webpush.setVapidDetails(
  `${Resource.BASE_URL.value}/contact`,
  Resource.VAPID_PUBLIC_KEY.value,
  Resource.VAPID_PRIVATE_KEY.value
);

export const sendTestPushNotification = async () => {
  const subscriptions = await db.select().from(notificationTable);
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify({
          title: 'Afinia',
          body: 'Hello from Afinia 👋',
          icon: '/icon-256x256@1x.png',
          url: '/app',
        })
      );
    } catch (error) {
      console.error('Error sending test push notification: ', error);
    }
  }
};

export const sendPushNotifications = async (transactionId: string) => {
  // Fetch transaction data
  const transaction = await db
    .select()
    .from(transactionExternalTable)
    .where(eq(transactionExternalTable.provider_id, transactionId));
  if (transaction.length === 0) {
    console.error(
      `Error in sendPushNotifications: transaction ${transactionId} not found`
    );
    return;
  }

  // Check if merchant is unique
  if (transaction[0]?.description) {
    const result = await db
      .select({ count: count() })
      .from(transactionTable)
      .where(eq(transactionTable.description, transaction[0].description));
    const isUnique = result.at(0)?.count === 1;

    // Send push notifications
    if (isUnique) {
      const subscriptions = await db
        .select()
        .from(notificationTable)
        .where(eq(notificationTable.notify_new_merchant, true));
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            JSON.stringify({
              title: 'New Merchant',
              body: `This is the first time you've transacted with "${transaction[0].description}"`,
              icon: '/icon-256x256@1x.png',
              url: '/app',
            })
          );
        } catch (error) {
          console.error('Error sending push notification: ', error);
        }
      }
    }
  }
};
