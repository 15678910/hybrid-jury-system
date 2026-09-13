// 라이브 블로그 본문에서 「」 뒤 공백 사례 찾기 (읽기 전용)
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const POST_ID = 'l5Sb12frQxrpGpv7wShG';
(async () => {
    const snap = await admin.firestore().collection('posts').doc(POST_ID).get();
    const c = snap.data().content || '';
    const fs = require('fs');
    // 」 뒤 공백+한글 사례
    const re = /」\s+[가-힣]/g;
    const hits = [];
    let m;
    while ((m = re.exec(c)) !== null) {
        hits.push(c.slice(Math.max(0, m.index - 25), m.index + 15));
    }
    fs.writeFileSync('../check_blog_out.txt', 'TITLE: ' + snap.data().title + '\n\nHITS(' + hits.length + '):\n' + hits.join('\n'));
    console.log('done, hits:', hits.length);
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
