self.addEventListener('push', (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  const title = payload.notification?.title || 'SalonOS';
  const options = {
    body: payload.notification?.body || 'You have a new update.',
    icon: '/favicon.ico',
    data: payload.data || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
