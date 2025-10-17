// public/firebase-messaging-sw.js
// This file should be placed in your public directory

// Import Firebase scripts using importScripts (Service Worker compatible)
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
		measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
	  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
	
	
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
		
	}
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
	
});