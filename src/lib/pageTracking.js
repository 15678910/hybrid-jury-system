import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, increment } from 'firebase/firestore';

// 분석 전용 Firebase 인스턴스 (App Check 없음)
// 메인 앱의 App Check 토큰 교환 실패 시 Firestore 쓰기가 영원히 대기하는 문제 우회
let analyticsDb = null;
const getAnalyticsDb = () => {
    if (analyticsDb) return analyticsDb;
    try {
        const config = {
            apiKey: "AIzaSyA9zBNz9R4Y5rVRhPGZoCHqsPC9wRne5uk",
            authDomain: "siminbupjung-blog.firebaseapp.com",
            projectId: "siminbupjung-blog",
            storageBucket: "siminbupjung-blog.firebasestorage.app",
        };
        // 기존 앱과 이름이 겹치지 않도록 별도 이름 사용
        const app = initializeApp(config, 'analytics-tracker');
        analyticsDb = getFirestore(app);
    } catch (e) {
        // 이미 초기화된 경우 기존 인스턴스 사용
        const existing = getApps().find(a => a.name === 'analytics-tracker');
        if (existing) analyticsDb = getFirestore(existing);
    }
    return analyticsDb;
};

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
const getTodayKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Firestore 필드 키로 사용할 수 있도록 경로 변환
// 주의: Firestore는 __로 시작하고 끝나는 필드명을 예약어로 거부함
// "/" -> "home", "/blog" -> "blog", "/blog/abc" -> "blog_abc"
const sanitizePath = (path) => {
    if (path === '/') return 'home';
    return path.replace(/^\//, '').replace(/\//g, '_');
};

// 새 세션인지 확인 (sessionStorage 기반 — 탭 닫으면 리셋)
const isNewSession = () => {
    const key = 'analytics_session_id';
    const existing = sessionStorage.getItem(key);
    if (existing) return false;
    sessionStorage.setItem(key, Date.now().toString());
    return true;
};

/**
 * 페이지뷰를 Firestore dailyStats에 기록
 * - /admin/* 경로는 제외
 * - increment() 기반 원자적 카운터 업데이트
 * - 세션당 uniqueVisitors 1회만 증가
 * - setDoc(merge: true) + 중첩 객체로 원자적 업서트
 *   (updateDoc은 존재하지 않는 문서에서 permission-denied 반환 문제)
 */
export const recordPageview = async (path) => {
    // 관리자 페이지 제외
    if (path.startsWith('/admin')) return;

    try {
        const db = getAnalyticsDb();
        if (!db) return; // Firebase 초기화 실패 시 조용히 종료

        const dateKey = getTodayKey();
        const docRef = doc(db, 'dailyStats', dateKey);
        const sanitizedPath = sanitizePath(path);
        const newSession = isNewSession();

        // setDoc(merge: true) + 중첩 객체 = 문서 생성/업데이트 겸용
        // 중요: dot-separated 키가 아닌 실제 중첩 객체를 사용해야 nested map이 됨
        const data = {
            date: dateKey,
            totalViews: increment(1),
            pages: {
                [sanitizedPath]: increment(1),
            },
        };

        if (newSession) {
            data.uniqueVisitors = increment(1);
        }

        await setDoc(docRef, data, { merge: true });
    } catch (error) {
        // 분석 오류가 앱 기능에 영향을 주지 않도록 silent fail
        console.warn('Pageview tracking error:', error.message);
    }
};
