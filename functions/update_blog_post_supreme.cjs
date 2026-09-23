// 일회성: 「대법관 한 자리는 누구의 것인가」(dOZI7HRDnDewpsTUspcM) 본문 교체. updateDoc 만 사용(삭제·재생성 금지 — 2026-07-07 규칙).
// 사유: 첫 게시본에 md 의 배너 줄(「> 2026-09-24 블로그 게시본」)과 자료의 「(원문 확인)」 메모가 섞여 들어감.
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const POST_ID = process.argv[2] || 'dOZI7HRDnDewpsTUspcM';
const SCRATCH = 'C:/Users/lacoi/AppData/Local/Temp/claude/C--Users-lacoi-Desktop-hybrid-jury-system/da59800c-4141-4bad-befe-989bf4ce34bd/scratchpad';
const HTML_PATH = path.join(SCRATCH, 'blog_post_supreme.html');

async function main() {
    const ref = admin.firestore().collection('posts').doc(POST_ID);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('post not found: ' + POST_ID);
    const post = snap.data();
    if (!post.imageUrl) throw new Error('post has no imageUrl');
    let content = fs.readFileSync(HTML_PATH, 'utf-8');
    if (!content.trim().startsWith('<')) throw new Error('content must be HTML');
    content = content.replace('__IMAGE_URL__', post.imageUrl);
    if (content.includes('__IMAGE_URL__')) throw new Error('placeholder left');
    for (const bad of ['블로그 게시본', '원문 확인', '확인할 것']) if (content.includes(bad)) throw new Error('bad token: ' + bad);
    console.log('before:', post.content.length, 'chars → after:', content.length, 'chars; title:', post.title);
    await ref.update({ content, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log('UPDATED', POST_ID, 'https://xn--lg3b0kt4n41f.kr/blog/' + POST_ID);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
