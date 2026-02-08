/**
 * 블로그 글의 author를 "시민법정"으로 수정하고
 * summary가 없거나 placeholder인 경우 본문에서 자동 생성
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// HTML 태그 제거 함수
function stripHtml(html) {
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
}

// 요약 생성 (본문 앞 200자)
function generateSummary(content) {
    const text = stripHtml(content);
    if (text.length <= 200) return text;
    return text.substring(0, 200) + '...';
}

async function fixPosts() {
    console.log('===========================================');
    console.log('블로그 글 수정 시작');
    console.log('===========================================\n');

    const snapshot = await db.collection('posts').get();
    let fixedCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();

        // 사법뉴스는 제외
        if (data.category === '사법뉴스') {
            console.log(`[건너뜀] ${data.title} (사법뉴스)`);
            continue;
        }

        const updates = {};
        let needsUpdate = false;

        // author가 "시민법정"이 아니면 수정
        if (data.author !== '시민법정') {
            updates.author = '시민법정';
            needsUpdate = true;
            console.log(`  - author 수정: "${data.author}" → "시민법정"`);
        }

        // summary가 없거나 placeholder인 경우 본문에서 생성
        if (!data.summary ||
            data.summary === '요약을 입력해주세요.' ||
            data.summary === '내용을 입력해주세요.') {

            if (data.content && data.content.length > 0) {
                updates.summary = generateSummary(data.content);
                needsUpdate = true;
                console.log(`  - summary 자동 생성 (${updates.summary.length}자)`);
            }
        }

        if (needsUpdate) {
            await db.collection('posts').doc(doc.id).update(updates);
            console.log(`[수정완료] ${data.title}\n`);
            fixedCount++;
        } else {
            console.log(`[변경없음] ${data.title}`);
        }
    }

    console.log('\n===========================================');
    console.log(`완료! ${fixedCount}개 글 수정됨`);
    console.log('===========================================');

    process.exit(0);
}

fixPosts().catch(error => {
    console.error('오류:', error);
    process.exit(1);
});
