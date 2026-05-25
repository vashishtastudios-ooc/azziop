// import { getApp, getApps, initializeApp } from "firebase/app";
// import { getMessaging, getToken, onMessage } from "firebase/messaging";


// const firebaseConfig = {
//   apiKey: "AIzaSyCO7PQPGFi5K9Zk2CxagmvTXZzwNPk_Ag8",
//   authDomain: "apni-desi-dukaan.firebaseapp.com",
//   projectId: "apni-desi-dukaan",
//   storageBucket: "apni-desi-dukaan.firebasestorage.app",
//   messagingSenderId: "6007497115",
//   appId: "1:6007497115:web:0dd75c47b96fad0248013e",
//   measurementId: "G-N1DYCXV0PD"
// };
// const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
// const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

// export const messaging =
//     typeof window !== "undefined" ? getMessaging(app) : null;

// export async function requestPermission() {
//     if (typeof window === "undefined") return null;
//     if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;
//     if (!messaging) return null;
//     if (!vapidKey) {
//         console.error("Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY. Set Web Push certificate key from Firebase Console for project apni-desi-dukaan.");
//         return null;
//     }

//     const status = await Notification.requestPermission();
//     if (status !== "granted") return null;

//     let serviceWorkerRegistration = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
//     if (!serviceWorkerRegistration) {
//         serviceWorkerRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
//     }

//     try {
//         const token = await getToken(messaging, {
//             vapidKey,
//             serviceWorkerRegistration,
//         });

//         console.log("FCM token=====================", token);
//         return token;
//     } catch (error) {
//         console.error(
//             "FCM token error. Ensure NEXT_PUBLIC_FIREBASE_VAPID_KEY belongs to the same Firebase project as apiKey/projectId/messagingSenderId and that the Web API key is not blocked by referrer restrictions.",
//             error,
//         );
//         throw error;
//     }
// }

// /** @type {(callback: (payload: unknown) => void) => (() => void)} */
// export const foregroundMessage = (callback) => {
//     if (!messaging) {
//         return () => {};
//     }

//     return onMessage(messaging, callback);
// };
