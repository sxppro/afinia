/// <reference lib="webworker" />

/** @type {ServiceWorkerGlobalScope} */
const sw = /** @type {ServiceWorkerGlobalScope} */ (self);

sw.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    /** @type {NotificationOptions} */
    const options = {
      body: data.body,
      icon: data.icon || '/icon-256x256@1x.png',
      badge: '/icon-256x256@1x.png',
      silent: true,
      data: {
        url: data.url || '/app',
      },
    };
    event.waitUntil(sw.registration.showNotification(data.title, options));
  }
});

sw.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/app';
  event.waitUntil(
    sw.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes('/app') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
