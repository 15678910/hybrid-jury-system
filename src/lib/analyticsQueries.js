import { collection, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';

// 날짜를 YYYY-MM-DD 형식으로 변환
const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

/**
 * 오늘의 통계 조회 (단일 문서 읽기)
 */
export const getTodayStats = async () => {
    const today = formatDate(new Date());
    const docRef = doc(db, 'dailyStats', today);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return { totalViews: 0, uniqueVisitors: 0, pages: {} };
    return snap.data();
};

/**
 * 날짜 범위의 통계 조회
 */
export const getStatsRange = async (startDate, endDate) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    const q = query(
        collection(db, 'dailyStats'),
        where('date', '>=', start),
        where('date', '<=', end),
        orderBy('date', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
};

/**
 * 이번 주(월~오늘) 합산 통계
 */
export const getWeekStats = async () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=일, 1=월, ...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const docs = await getStatsRange(monday, now);
    return docs.reduce(
        (acc, d) => ({
            totalViews: acc.totalViews + (d.totalViews || 0),
            uniqueVisitors: acc.uniqueVisitors + (d.uniqueVisitors || 0),
        }),
        { totalViews: 0, uniqueVisitors: 0 }
    );
};

/**
 * 이번 달(1일~오늘) 합산 통계
 */
export const getMonthStats = async () => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const docs = await getStatsRange(firstOfMonth, now);
    return docs.reduce(
        (acc, d) => ({
            totalViews: acc.totalViews + (d.totalViews || 0),
            uniqueVisitors: acc.uniqueVisitors + (d.uniqueVisitors || 0),
        }),
        { totalViews: 0, uniqueVisitors: 0 }
    );
};

/**
 * 최근 N일 차트 데이터 (빈 날짜는 0으로 채움)
 */
export const getLastNDays = async (n = 30) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - (n - 1));
    start.setHours(0, 0, 0, 0);

    const docs = await getStatsRange(start, now);

    // 날짜별 데이터 맵 생성
    const dataMap = {};
    docs.forEach(d => { dataMap[d.date] = d; });

    // 빈 날짜를 0으로 채워서 연속 차트 데이터 생성
    const result = [];
    for (let i = 0; i < n; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = formatDate(d);
        result.push({
            date: key,
            label: `${d.getMonth() + 1}/${d.getDate()}`,
            totalViews: dataMap[key]?.totalViews || 0,
            uniqueVisitors: dataMap[key]?.uniqueVisitors || 0,
        });
    }

    return result;
};

/**
 * 페이지별 조회수 (상위 15개, 최근 N일)
 */
export const getPageBreakdown = async (n = 30) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - (n - 1));

    const docs = await getStatsRange(start, now);

    // 모든 pages 맵 합산
    const pageAgg = {};
    docs.forEach(d => {
        if (d.pages) {
            Object.entries(d.pages).forEach(([key, count]) => {
                pageAgg[key] = (pageAgg[key] || 0) + count;
            });
        }
    });

    // Firestore 키를 원래 경로로 복원
    const unsanitize = (key) => {
        if (key === 'home') return '/';
        return '/' + key.replace(/_/g, '/');
    };

    // 경로에 한글 이름 매핑
    const PAGE_NAMES = {
        '/': '홈페이지',
        '/blog': '블로그',
        '/videos': '동영상',
        '/governance': '거버넌스',
        '/news': '사법뉴스',
        '/donate': '후원',
        '/chat': '채팅',
        '/sentencing-analysis': '양형분석',
        '/europe-jury': '유럽 배심제',
        '/reform-analysis': '개혁안 비교',
        '/law-database': '법률정보',
        '/judge-evaluation': '판사평가',
        '/judicial-network': '사법인맥',
        '/trial-analysis': '내란재판 분석',
        '/case-search': '판례검색',
        '/privacy': '개인정보처리방침',
        '/terms': '이용약관',
    };

    return Object.entries(pageAgg)
        .map(([key, views]) => {
            const path = unsanitize(key);
            return {
                page: path,
                name: PAGE_NAMES[path] || path,
                views,
            };
        })
        .sort((a, b) => b.views - a.views)
        .slice(0, 15);
};
