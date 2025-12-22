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
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
      },
    };
    event.waitUntil(
      sw.registration.showNotification(data.title, options)
    );
  }
});

sw.addEventListener('notificationclick', (event) => {
  console.log('On notification click: ', event);
  event.notification.close()
  event.waitUntil(sw.clients.openWindow('https://localhost:3000/app'));
})