/**
 * 중복 사법뉴스 글 정리 스크립트
 * 사용법:
 *   node cleanup_duplicate_news.cjs            # DRY-RUN (삭제 없이 목록만)
 *   node cleanup_duplicate_news.cjs --commit   # 실제 삭제
 *
 * 같은 제목([사법뉴스] YYYY년 M월 D일 주요 소식)의 글이 2개 이상이면,
 * 뉴스가 더 많이 담긴 글 1개만 남기고 나머지를 삭제한다.
 * 삭제된 글의 옛 ID → 남긴 글 ID 매핑을 출력한다(postRedirects.js 등록용).
 */
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const COMMIT = process.argv.includes('--commit');

// 뉴스 건수: summary의 "총 N건" 파싱, 없으면 content 길이를 대리값으로 사용
function newsCountOf(data) {
    const m = (data.summary || '').match(/총\s*(\d+)\s*건/);
    if (m) return parseInt(m[1], 10);
    return null;
}

async function main() {
    const snap = await db.collection('posts').get();
    const newsPosts = [];
    snap.forEach(doc => {
        const d = doc.data();
        const title = d.title || '';
        if (title.startsWith('[사법뉴스]')) {
            newsPosts.push({
                id: doc.id,
                title,
                count: newsCountOf(d),
                contentLen: (d.content || '').length,
                createdAt: d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().getTime() : 0,
            });
        }
    });

    // 제목(=날짜)별 그룹핑
    const groups = {};
    newsPosts.forEach(p => { (groups[p.title] = groups[p.title] || []).push(p); });

    const toDelete = [];
    const redirects = [];
    const report = [];
    Object.entries(groups).forEach(([title, arr]) => {
        if (arr.length <= 1) return;
        // 유지 대상: 뉴스 건수 최다 → content 길이 최다 → 최신 순
        arr.sort((a, b) =>
            (b.count || 0) - (a.count || 0) ||
            b.contentLen - a.contentLen ||
            b.createdAt - a.createdAt
        );
        const keeper = arr[0];
        const dels = arr.slice(1);
        report.push({ title, total: arr.length, keeper, dels });
        dels.forEach(d => { toDelete.push(d.id); redirects.push([d.id, keeper.id]); });
    });

    console.log('=== 중복 사법뉴스 정리 ' + (COMMIT ? '(실제 삭제)' : '(DRY-RUN · 미삭제)') + ' ===');
    console.log(`사법뉴스 글 총 ${newsPosts.length}개 · 중복 발생 날짜 ${report.length}개\n`);
    report.forEach(r => {
        console.log(`[${r.title}] ${r.total}개`);
        console.log(`  ✔ 유지: ${r.keeper.id} (총${r.keeper.count}건, content ${r.keeper.contentLen}자)`);
        r.dels.forEach(d => console.log(`  ✖ 삭제: ${d.id} (총${d.count}건, content ${d.contentLen}자)`));
    });
    console.log(`\n삭제 대상 총 ${toDelete.length}개`);
    console.log('\n=== postRedirects.js 추가용 매핑 (옛ID → 남긴ID) ===');
    redirects.forEach(([oldId, newId]) => console.log(`    '${oldId}': '${newId}',`));

    if (COMMIT) {
        console.log('\n--- 삭제 실행 ---');
        for (const id of toDelete) {
            await db.collection('posts').doc(id).delete();
            console.log('삭제됨: ' + id);
        }
        console.log(`\n✅ 삭제 완료: ${toDelete.length}개`);
    } else {
        console.log('\n(DRY-RUN) 실제 삭제하려면 --commit 플래그를 추가하세요.');
    }
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
