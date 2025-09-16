// public/firebase-messaging-sw.js
// This file should be placed in your public directory

// Import Firebase scripts using importScripts (Service Worker compatible)
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
	apiKey: "AIzaSyCBX1SypGgBg3IHeM1CFyuKxVp3NEAeZEw",
	authDomain: "evalura-aac1f.firebaseapp.com",
	projectId: "evalura-aac1f",
	storageBucket: "evalura-aac1f.appspot.com",
	messagingSenderId: "835262431880",
	appId: "1:835262431880:web:89929693e46680cd78153d",
	measurementId: "G-FC6NTNW00W"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
	console.log('Background message received:', payload);
	
	const notificationTitle = payload.notification?.title || 'New Notification';
	const notificationOptions = {
		body: payload.notification?.body || 'You have a new message',
		icon: payload.notification?.icon || '/icons/icon-192x192.png',
		badge: '/icons/badge-72x72.png',
		tag: payload.data?.tag || 'general',
		data: payload.data,
		actions: [
			{
				action: 'open',
				title: 'Open App'
			},
			{
				action: 'dismiss',
				title: 'Dismiss'
			}
		],
		requireInteraction: true, // Keep notification visible until user interacts
		silent: false
	};
	
	// Show the notification
	self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
	console.log('Notification clicked:', event);
	
	event.notification.close();
	
	if (event.action === 'open' || !event.action) {
		// Open or focus the app
		event.waitUntil(
			clients.matchAll({ type: 'window' }).then((clientList) => {
				// If app is already open, focus it
				for (const client of clientList) {
					if (client.url === self.location.origin && 'focus' in client) {
						return client.focus();
					}
				}
				
				// If app is not open, open it
				if (clients.openWindow) {
					return clients.openWindow('/dashboard');
				}
			})
		);
	}
	
	// Handle custom actions
	if (event.action === 'dismiss') {
		// Just close the notification (already done above)
		console.log('Notification dismissed');
	}
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
	console.log('Notification closed:', event);
});