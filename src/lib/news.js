// 세계 시민참여재판 뉴스 가져오기 (Google News RSS via rss2json)

const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json';

// 검색 키워드별 Google News RSS URL
const NEWS_FEEDS = {
    nordic: {
        label: '북유럽',
        query: 'Nordic lay judge OR Sweden lay assessor OR Norway lay judge',
        flag: '🇸🇪'
    },
    europe: {
        label: '유럽',
        query: 'European lay judges OR jury system Europe OR Germany lay judge',
        flag: '🇪🇺'
    },
    japan: {
        label: '일본',
        query: '裁判員制度 OR Japan lay judge system',
        flag: '🇯🇵'
    },
    usa: {
        label: '미국',
        query: 'jury trial USA OR American jury system',
        flag: '🇺🇸'
    }
};

// Google News RSS URL 생성 (영문)
const getGoogleNewsRssUrl = (query) => {
    const encodedQuery = encodeURIComponent(query);
    return `https://news.google.com/rss/search?q=${encodedQuery}&hl=en&gl=US&ceid=US:en`;
};

// RSS를 JSON으로 변환하여 가져오기
const fetchRssFeed = async (region) => {
    const feed = NEWS_FEEDS[region];
    if (!feed) return [];

    const rssUrl = getGoogleNewsRssUrl(feed.query);
    const apiUrl = `${RSS2JSON_API}?rss_url=${encodeURIComponent(rssUrl)}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('RSS fetch failed');

        const data = await response.json();

        if (data.status !== 'ok' || !data.items) {
            console.error(`[News] RSS 파싱 실패 (${region}):`, data);
            return [];
        }

        // 뉴스 아이템 가공
        return data.items.slice(0, 3).map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            source: extractSource(item.title),
            region: region,
            regionLabel: feed.label,
            flag: feed.flag
        }));
    } catch (error) {
        console.error(`[News] 뉴스 가져오기 실패 (${region}):`, error);
        return [];
    }
};

// 제목에서 출처 추출 (Google News 형식: "제목 - 출처")
const extractSource = (title) => {
    const parts = title.split(' - ');
    if (parts.length > 1) {
        return parts[parts.length - 1];
    }
    return '';
};

// 제목에서 출처 제거
export const cleanTitle = (title) => {
    const parts = title.split(' - ');
    if (parts.length > 1) {
        return parts.slice(0, -1).join(' - ');
    }
    return title;
};

// 날짜 포맷팅
export const formatDate = (dateString) => {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) return '방금 전';
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;

        return date.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return '';
    }
};

// 모든 지역의 뉴스 가져오기
export const fetchAllNews = async () => {
    try {
        const [nordicNews, europeNews, japanNews, usaNews] = await Promise.all([
            fetchRssFeed('nordic'),
            fetchRssFeed('europe'),
            fetchRssFeed('japan'),
            fetchRssFeed('usa')
        ]);

        // 모든 뉴스를 합치고 날짜순 정렬
        const allNews = [...nordicNews, ...europeNews, ...japanNews, ...usaNews];
        allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

        return {
            all: allNews.slice(0, 6), // 최신 6개
            nordic: nordicNews,
            europe: europeNews,
            japan: japanNews,
            usa: usaNews
        };
    } catch (error) {
        console.error('[News] 전체 뉴스 가져오기 실패:', error);
        return { all: [], nordic: [], europe: [], japan: [], usa: [] };
    }
};

// 특정 지역 뉴스만 가져오기
export const fetchNewsByRegion = async (region) => {
    return fetchRssFeed(region);
};
