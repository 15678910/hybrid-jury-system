import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyA9zBNz9R4Y5rVRhPGZoCHqsPC9wRne5uk",
    authDomain: "siminbupjung-blog.firebaseapp.com",
    projectId: "siminbupjung-blog",
    storageBucket: "siminbupjung-blog.firebasestorage.app",
    messagingSenderId: "68915786798",
    appId: "1:68915786798:web:ec7ba2cfab6c5338629bbf",
    measurementId: "G-PYFSV2BN8L"
};

const app = initializeApp(firebaseConfig);

// Firestore (기본 설정 - 안정성 + 속도)
export const db = getFirestore(app);

export const auth = getAuth(app);
export const storage = getStorage(app);

// FCM 메시징 (브라우저 환경에서만)
let messaging = null;
try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
        messaging = getMessaging(app);
    }
} catch (e) {
    console.log('FCM not available:', e.message);
}

export { RecaptchaVerifier, signInWithPhoneNumber, messaging, getToken, onMessage };
