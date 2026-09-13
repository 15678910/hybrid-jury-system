// 현재 라이브 글 상태 읽기 (수정 전 확인용, 쓰기 없음)
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const POST_ID = 'l5Sb12frQxrpGpv7wShG';
(async () => {
    const snap = await admin.firestore().collection('posts').doc(POST_ID).get();
    const d = snap.data();
    const c = d.content || '';
    console.log('TITLE:', d.title);
    console.log('category:', d.category, '| author:', d.author);
    console.log('content startsWith <:', c.trim().startsWith('<'));
    console.log('content length:', c.length);
    console.log('has <a :', c.includes('<a '));
    console.log('has reform-analysis href:', c.includes('reform-analysis'));
    console.log('has 1중수정:', c.includes('검찰총장 산하가 아니라'));
    console.log('has 2중수정:', c.includes('국회 소속」으로 두는 방안'));
    console.log('--- 마지막 260자 ---');
    console.log(c.slice(-260));
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
