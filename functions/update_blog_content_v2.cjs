// 라이브 글 본문만 갱신 (회원님 수정본 반영). content만 updateDoc — 제목·이미지·ID 유지.
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const POST_ID = 'l5Sb12frQxrpGpv7wShG';
const SCRATCH = 'C:/Users/lacoi/AppData/Local/Temp/claude/C--Users-lacoi-Desktop-hybrid-jury-system/a0f44c8a-d2cf-422b-87ab-f4b889e470d7/scratchpad';
const HTML = path.join(SCRATCH, 'blog_post.html');

(async () => {
    const content = fs.readFileSync(HTML, 'utf-8');
    if (!content.trim().startsWith('<')) throw new Error('content must be HTML');
    if (!/reform-analysis/.test(content)) throw new Error('signature link missing');

    const ref = admin.firestore().collection('posts').doc(POST_ID);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('post not found');

    const NEW_TITLE = '권력을 검찰청에서 공소청으로 옮기려는 더불어민주당?';
    await ref.update({ title: NEW_TITLE, content, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log('본문+제목 갱신 완료. length =', content.length);
    console.log('제목(변경):', snap.data().title, '→', NEW_TITLE);
    console.log('URL: https://siminbupjung-blog.web.app/blog/' + POST_ID);
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
