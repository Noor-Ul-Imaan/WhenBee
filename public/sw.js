self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {}

  event.waitUntil(
    self.registration.showNotification(data.title || 'WhenBee 🐝', {
      body: data.body || "Hey, it's time.",
      icon: data.icon || '/bee-icon.png',
      badge: '/bee-icon.png',
      vibrate: [200, 100, 200],
      actions: [
        { action: 'done', title: '✅ Done' },
        { action: 'snooze', title: '⏰ Snooze' }
      ]
    })
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  if (event.action === 'done') {
    clients.openWindow('/?action=done&id=' + event.notification.tag)
  } else {
    clients.openWindow('/')
  }
})