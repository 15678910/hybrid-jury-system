// 서명(주권자사법개혁추진준비위원회 · 검찰개혁 심층분석 보기)을 링크로 복원
// content의 다른 부분은 건드리지 않음 (회원님 편집본 유지)
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const POST_ID = 'l5Sb12frQxrpGpv7wShG';
const HREF = '/reform-analysis?tab=prosecution-reform';

(async () => {
    const ref = admin.firestore().collection('posts').doc(POST_ID);
    const snap = await ref.get();
    let c = snap.data().content;

    // 이미 링크가 있으면 종료
    if (/<a[^>]*reform-analysis/.test(c)) { console.log('이미 링크 있음. 종료'); process.exit(0); }

    // '주권자사법개혁추진준비위원회 ... 검찰개혁 심층분석 보기' 텍스트를 <a>로 감싼다 (태그 경계 넘지 않음)
    const re = /주권자사법개혁추진준비위원회[^<]*검찰개혁 심층분석 보기/;
    if (!re.test(c)) { console.log('서명 문구 찾지 못함 — 중단'); process.exit(1); }
    const before = c.length;
    c = c.replace(re, (m) => `<a href="${HREF}">${m}</a>`);

    await ref.update({ content: c, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log('서명 링크 복원 완료. length', before, '->', c.length);
    console.log('URL: https://siminbupjung-blog.web.app/blog/' + POST_ID);
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
