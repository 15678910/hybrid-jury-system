// 읽기 전용: 블로그 글 본문을 파일로 내려받는다(수정 없음). 관리자 화면에서 사용자가 고친 내용을 원고(md)에 옮길 때 쓴다.
// 사용: node dump_blog_post.cjs <postId> <out.html>
const admin = require('firebase-admin');
const fs = require('fs');
admin.initializeApp({ credential: admin.credential.cert(require('../serviceAccountKey.json')) });
const [POST_ID, OUT] = process.argv.slice(2);
(async () => {
    const d = (await admin.firestore().collection('posts').doc(POST_ID).get()).data();
    fs.writeFileSync(OUT, d.content, 'utf-8');
    console.log('title:', d.title, '| subtitle:', d.subtitle || '-', '| length:', d.content.length, '| updatedAt:', d.updatedAt && d.updatedAt.toDate().toISOString());
})().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
