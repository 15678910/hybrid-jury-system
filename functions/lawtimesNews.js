// 법률신문(lawtimes.co.kr) 전체기사 RSS에서 사법제도·사회 이슈 기사만 골라 사법뉴스에 넣는다.
// [2026-09-23] 사법뉴스(구글뉴스 RSS 키워드 검색)에 법률신문 기사가 자주 빠지고, 검사 파견·법관 파견처럼
//   법조 전문지만 다루는 제도 이슈가 누락된다는 지적 → 법률신문 RSS를 직접 읽어 맨 앞 섹션으로 싣는다.
// 의존성: node-fetch(이미 functions에 있음)만 사용. XML 파서 없이 정규식으로 <item>을 읽는다(피드 구조가 단순).
const fetch = require('node-fetch');

const LAWTIMES_RSS = 'https://www.lawtimes.co.kr/rss/allArticle.xml';
const LAWTIMES_SOURCE = '법률신문';
const LAWTIMES_KEYWORD = '법률신문 · 사법제도 이슈';

// 사회 이슈 중심 — 제도·인사·권한 배분에 관한 낱말. 판례 해설·세미나·학술 논문은 이 목록에 걸리지 않는 한 제외.
const LAWTIMES_ISSUE_KEYWORDS = [
    // 인력·조직
    '파견', '정원', '증원', '감축', '직제', '인사', '전보', '승진', '임기', '결원', '공석',
    // 기관
    '공소청', '중수청', '중대범죄수사청', '공수처', '고위공직자범죄수사처', '검찰청', '대검', '법원행정처', '헌법재판소', '헌재',
    '대법관', '대법원장', '검찰총장', '법무부', '행안부', '행정안전부', '국가수사본부', '경찰청장', '특검', '특별검사',
    // 제도·입법
    '검찰개혁', '사법개혁', '법원개혁', '수사·기소', '수사기소', '수사권', '기소권', '보완수사', '수사준칙', '형사소송법',
    '법사위', '법제사법위원회', '국회', '입법예고', '국무회의', '시행령', '개정안', '탄핵', '재제청', '제청',
    // 시민 참여·재판 운영
    '참심', '배심', '국민참여재판', '재판 지연', '재판지연', '판결문 공개', '법왜곡', '전관', '영장', '구속기간',
    // 사건 축
    '내란', '계엄', '김건희', '윤석열', '조희대', '지귀연'
];

// 법률신문 pubDate('2026-09-23 18:53:22', KST) → ISO(UTC 기준 문자열)
const parseLawtimesDate = (s) => {
    if (!s) return null;
    const m = String(s).trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
    if (!m) return null;
    const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+09:00`);
    return isNaN(d.getTime()) ? null : d;
};

const pick = (xml, tag) => {
    const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    if (!m) return '';
    return m[1]
        .replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '')
        .replace(/<[^>]*>/g, '')
        .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
};

// RSS 본문 → 항목 배열 (필터 전)
const parseLawtimesRss = (xmlText) => {
    const items = [];
    const re = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = re.exec(xmlText)) !== null) {
        const it = m[1];
        const title = pick(it, 'title');
        const link = pick(it, 'link');
        if (!title || !link) continue;
        items.push({
            title,
            link,
            description: pick(it, 'description'),
            section1: pick(it, 'section1'),
            section2: pick(it, 'section2'),
            author: pick(it, 'author'),
            pubDateRaw: pick(it, 'pubDate'),
            pubDateObj: parseLawtimesDate(pick(it, 'pubDate'))
        });
    }
    return items;
};

// 필터: (1) 뉴스 섹션 (2) 최근 hours 시간 이내 (3) 이슈 키워드가 제목 또는 본문에 있음
const filterIssueItems = (items, { hours = 24, now = new Date(), maxItems = 12 } = {}) => {
    const since = now.getTime() - hours * 60 * 60 * 1000;
    const out = [];
    for (const it of items) {
        if (it.section1 && it.section1 !== '뉴스') continue;
        if (!it.pubDateObj || it.pubDateObj.getTime() < since) continue;
        const hay = `${it.title} ${it.description}`;
        const hits = LAWTIMES_ISSUE_KEYWORDS.filter(k => hay.includes(k));
        if (hits.length === 0) continue;
        // 제목에 걸린 키워드가 있으면 앞으로. 【오늘의 법조】【오늘의 국회일정】 같은 일정 기사는 유용하지만 기사 뒤에 둔다.
        const isDaily = /^【오늘의/.test(it.title);
        const titleHit = !isDaily && LAWTIMES_ISSUE_KEYWORDS.some(k => it.title.includes(k));
        out.push({ ...it, matched: hits, titleHit, isDaily });
    }
    out.sort((a, b) => (a.isDaily - b.isDaily) || (b.titleHit - a.titleHit) || (b.pubDateObj - a.pubDateObj));
    return out.slice(0, maxItems);
};

// 사법뉴스 파이프라인이 쓰는 모양으로 변환 {title, link, pubDate, source, keyword, description, isLawtimes}
const toNewsItems = (filtered) => filtered.map(it => ({
    title: it.title,
    link: it.link,
    pubDate: it.pubDateObj.toISOString(),
    source: LAWTIMES_SOURCE,
    keyword: LAWTIMES_KEYWORD,
    description: it.description,
    isLawtimes: true
}));

const fetchLawtimesNews = async ({ hours = 24, maxItems = 12 } = {}) => {
    const response = await fetch(LAWTIMES_RSS, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        },
        timeout: 15000
    });
    if (!response.ok) {
        console.error('[lawtimes] RSS response not OK:', response.status);
        return [];
    }
    const xml = await response.text();
    const items = parseLawtimesRss(xml);
    const filtered = filterIssueItems(items, { hours, maxItems });
    console.log(`[lawtimes] parsed ${items.length}, issue-matched ${filtered.length}`);
    return toNewsItems(filtered);
};

module.exports = { fetchLawtimesNews, parseLawtimesRss, filterIssueItems, toNewsItems, LAWTIMES_ISSUE_KEYWORDS, LAWTIMES_KEYWORD, LAWTIMES_SOURCE };
