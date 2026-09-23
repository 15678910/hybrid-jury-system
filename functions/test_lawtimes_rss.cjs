// 법률신문 RSS 수집기 로컬 확인. 사용: cd functions && node test_lawtimes_rss.cjs [hours]
// Firestore·배포와 무관하게 RSS만 읽어 어떤 기사가 사법뉴스에 실릴지 미리 본다.
const { fetchLawtimesNews, parseLawtimesRss, filterIssueItems } = require('./lawtimesNews');
const fetch = require('node-fetch');

(async () => {
    const hours = Number(process.argv[2] || 24);
    const xml = await (await fetch('https://www.lawtimes.co.kr/rss/allArticle.xml', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
    const all = parseLawtimesRss(xml);
    const news = all.filter(i => i.section1 === '뉴스');
    console.log(`RSS 전체 ${all.size || all.length}건 / 뉴스 섹션 ${news.length}건 / 최근 ${hours}h 뉴스 ${news.filter(i => i.pubDateObj && Date.now() - i.pubDateObj < hours * 3600e3).length}건`);
    console.log('\n[제외된 최근 뉴스 — 키워드 미매치]');
    const picked = new Set(filterIssueItems(all, { hours, maxItems: 100 }).map(i => i.link));
    news.filter(i => i.pubDateObj && Date.now() - i.pubDateObj < hours * 3600e3 && !picked.has(i.link))
        .forEach(i => console.log(' -', i.pubDateRaw, '|', i.title));
    console.log('\n[사법뉴스에 실릴 항목]');
    const items = await fetchLawtimesNews({ hours, maxItems: 12 });
    items.forEach((i, n) => console.log(`${n + 1}. ${i.title}\n    ${i.link} | ${i.pubDate}`));
})().catch(e => { console.error(e); process.exit(1); });
