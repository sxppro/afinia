'use server';

import { notificationTable } from 'afinia-common/schema';
import { and, eq } from 'drizzle-orm';
import webpush, { WebPushError } from 'web-push';
import { getServerSession } from '../auth/session';
import { db } from '../db/client';

if (
  !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  !process.env.VAPID_PRIVATE_KEY
) {
  throw new Error('Please set VAPID keys for web push notifications.');
}

webpush.setVapidDetails(
  process.env.BASE_URL
    ? `${process.env.BASE_URL}/contact`
    : process.env.VERCEL_BRANCH_URL
      ? `https://${process.env.VERCEL_BRANCH_URL}/contact`
      : 'https://localhost:3000/contact',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export const subscribeUser = async (sub: PushSubscriptionJSON) => {
  try {
    const session = await getServerSession();

    const { endpoint, keys } = sub;
    if (session?.user.id && endpoint && keys?.p256dh && keys?.auth) {
      await db
        .insert(notificationTable)
        .values({
          user_id: session.user.id,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          notify_new_merchant: true,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .onConflictDoUpdate({
          target: notificationTable.endpoint,
          set: {
            p256dh: keys.p256dh,
            auth: keys.auth,
            updated_at: new Date(),
          },
        });
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    console.error('Error subscribing user to push notifications: ', error);
    return { success: false };
  }
};

export const unsubscribeUser = async (endpoint: string) => {
  try {
    const session = await getServerSession();

    if (session?.user.id) {
      const deleted = await db
        .delete(notificationTable)
        .where(
          and(
            eq(notificationTable.endpoint, endpoint),
            eq(notificationTable.user_id, session.user.id)
          )
        )
        .returning();
      if (deleted.length > 0) {
        return { success: true };
      }
    }
    return { success: false };
  } catch (error) {
    console.error('Error unsubscribing user from push notifications: ', error);
    return { success: false };
  }
};

export const sendNotification = async (message?: string) => {
  try {
    const session = await getServerSession();

    if (session?.user.id) {
      const subscriptions = await db
        .select()
        .from(notificationTable)
        .where(eq(notificationTable.user_id, session.user.id));
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
              body: message || 'Hello from Afinia 👋',
              icon: '/icon-256x256@1x.png',
              url: '/app',
            })
          );
        } catch (error: unknown) {
          if (error instanceof WebPushError) {
            if (error.statusCode === 410) {
              // Subscription is no longer valid
              const { success } = await unsubscribeUser(sub.endpoint);
              console.info(
                `Attempting to unsubscribe invalid subscription: ${
                  success ? 'success' : 'failed'
                }`
              );
            }
          }
          console.error('Error sending notification: ', error);
        }
      }
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    console.error('Failed to send web push notification: ', error);
    return { success: false };
  }
};
