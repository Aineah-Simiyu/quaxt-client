export async function GET() {
  const cfg = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  };

  const code = `
    importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');
    try {
      firebase.initializeApp(${JSON.stringify(cfg)});
      const messaging = firebase.messaging();
      messaging.onBackgroundMessage((payload) => {
        const notificationTitle = payload.notification?.title || 'New Notification';
        const notificationOptions = {
          body: payload.notification?.body || 'You have a new message',
          icon: payload.notification?.icon || '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: payload.data?.tag || 'general',
          data: payload.data,
          actions: [
            { action: 'open', title: 'Open App' },
            { action: 'dismiss', title: 'Dismiss' }
          ],
          requireInteraction: true,
          silent: false,
        };
        self.registration.showNotification(notificationTitle, notificationOptions);
      });

      self.addEventListener('notificationclick', (event) => {
        event.notification.close();
        if (event.action === 'open' || !event.action) {
          event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clientList) => {
              for (const client of clientList) {
                if (client.url === self.location.origin && 'focus' in client) {
                  return client.focus();
                }
              }
              if (clients.openWindow) {
                return clients.openWindow('/dashboard');
              }
            })
          );
        }
      });

    } catch (e) {
      // swallow
    }
  `;

  return new Response(code, {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    }
  });
}
