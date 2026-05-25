// /public/firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCO7PQPGFi5K9Zk2CxagmvTXZzwNPk_Ag8",
  authDomain: "apni-desi-dukaan.firebaseapp.com",
  projectId: "apni-desi-dukaan",
  storageBucket: "apni-desi-dukaan.firebasestorage.app",
  messagingSenderId: "6007497115",
  appId: "1:6007497115:web:0dd75c47b96fad0248013e",
  measurementId: "G-N1DYCXV0PD"
});

// Background notifications
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "New Notification";
  const body = payload?.notification?.body || "";
  const icon = payload?.notification?.icon || "/icons/icon-512x512.png";
  const url = payload?.fcmOptions?.link || payload?.data?.url || "/";

  self.registration.showNotification(title, {
    body,
    icon,
    data: { url },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if ("navigate" in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
