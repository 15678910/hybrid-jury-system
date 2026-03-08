import { doc, setDoc, increment } from 'firebase/firestore';
import { db } from './firebase';

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
const getTodayKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Firestore 필드 키로 사용할 수 있도록 경로 변환
// "/" -> "__root__", "/blog" -> "__blog", "/blog/abc" -> "__blog__abc"
const sanitizePath = (path) => {
    if (path === '/') return '__root__';
    return path.replace(/\//g, '__');
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
 */
export const recordPageview = async (path) => {
    // 관리자 페이지 제외
    if (path.startsWith('/admin')) return;

    try {
        const dateKey = getTodayKey();
        const docRef = doc(db, 'dailyStats', dateKey);
        const sanitizedPath = sanitizePath(path);
        const newSession = isNewSession();

        const updateData = {
            date: dateKey,
            totalViews: increment(1),
            [`pages.${sanitizedPath}`]: increment(1),
        };

        // 새 세션인 경우에만 uniqueVisitors 증가
        if (newSession) {
            updateData.uniqueVisitors = increment(1);
        }

        await setDoc(docRef, updateData, { merge: true });
    } catch (error) {
        // 분석 오류가 앱 기능에 영향을 주지 않도록 silent fail
        console.warn('Pageview tracking error:', error.message);
    }
};
