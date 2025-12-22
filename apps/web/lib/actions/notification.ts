'use server';

import webpush from 'web-push';

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

let subscription: PushSubscriptionJSON | null = null;

export const subscribeUser = async (sub: PushSubscriptionJSON) => {
  subscription = sub;
  console.log('User subscribed to push notifications: ', subscription);
  return { success: true };
};

export const unsubscribeUser = async () => {
  subscription = null;
  console.log('User unsubscribed from push notifications');
  return { success: true };
};

export const sendNotification = async (message: string) => {
  if (!subscription) {
    throw new Error('No web push subscription found.');
  }
  console.log(subscription);

  try {
    if (subscription?.endpoint) {
      await webpush.sendNotification(
        subscription as webpush.PushSubscription,
        JSON.stringify({
          title: 'Afinia',
          body: message || 'Hehe',
          icon: '/icon-256x256@1x.png',
        })
      );
    }
  } catch (error) {
    console.error('Failed to send web push notification: ', error);
    return { success: false, error: 'Failed to send notification' };
  }
};
