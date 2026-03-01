import { messaging, getToken, onMessage } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { trackPushSubscribe } from './analytics';

// FCM VAPID Key - Firebase Console > Cloud Messaging > Web Push certificates에서 발급
const VAPID_KEY = 'BNP59IEMKPVlG_927Yrl8F_LovOvlY85TpwxYxn5UPCGENTQCMNsw0NyHGbU2XT-MuuR6CaWIYRucKqlxX2t8fU';

/**
 * 푸시 알림 구독 요청
 * @returns {Promise<string|null>} FCM 토큰 또는 null
 */
export async function requestPushPermission() {
    if (!messaging) {
        console.log('FCM not supported in this browser');
        return null;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Push notification permission denied');
            return null;
        }

        // Service Worker 등록
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        // FCM 토큰 발급
        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (token) {
            // Firestore에 토큰 저장
            await setDoc(doc(db, 'pushTokens', token), {
                token,
                createdAt: serverTimestamp(),
                userAgent: navigator.userAgent,
                platform: navigator.platform,
            });

            // GA4 이벤트 추적
            trackPushSubscribe();

            console.log('Push notification subscribed successfully');
            return token;
        }

        return null;
    } catch (error) {
        console.error('Push subscription error:', error);
        return null;
    }
}

/**
 * 포그라운드 메시지 수신 핸들러
 * @param {Function} callback - 메시지 수신 시 콜백
 */
export function onForegroundMessage(callback) {
    if (!messaging) return;

    onMessage(messaging, (payload) => {
        console.log('Foreground message:', payload);
        if (callback) callback(payload);
    });
}

/**
 * 브라우저가 푸시 알림을 지원하는지 확인
 */
export function isPushSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator && messaging !== null;
}

/**
 * 현재 푸시 알림 권한 상태
 */
export function getPushPermissionStatus() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission; // 'default', 'granted', 'denied'
}
