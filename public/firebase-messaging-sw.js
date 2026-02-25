/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyA9zBNz9R4Y5rVRhPGZoCHqsPC9wRne5uk",
    authDomain: "siminbupjung-blog.firebaseapp.com",
    projectId: "siminbupjung-blog",
    storageBucket: "siminbupjung-blog.firebasestorage.app",
    messagingSenderId: "68915786798",
    appId: "1:68915786798:web:ec7ba2cfab6c5338629bbf",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const { title, body, icon, click_action } = payload.notification || {};
    const notificationTitle = title || '시민법정 알림';
    const notificationOptions = {
        body: body || '새 소식이 있습니다.',
        icon: icon || '/vite.svg',
        badge: '/vite.svg',
        data: { url: click_action || '/' },
        tag: 'siminbupjung-notification',
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url.includes('xn--lg3b0kt4n41f.kr') && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            return clients.openWindow(url);
        })
    );
});
