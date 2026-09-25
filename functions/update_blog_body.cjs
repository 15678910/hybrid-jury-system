// 블로그 본문 전체를 변환기 결과로 교체(updateDoc). 표지 주소는 현재 글의 imageUrl 을 그대로 쓴다.
// 사용: node update_blog_body.cjs <postId> <body.html>
// 안전장치: 덮어쓰기 전 본문을 backups/post-content/ 에 저장. 사용자가 관리자 화면에서 고친 문안은 먼저 원고(md)에 옮긴 뒤에 쓸 것(2026-09-24 규칙).
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
admin.initializeApp({ credential: admin.credential.cert(require('../serviceAccountKey.json')) });
const [POST_ID, HTML] = process.argv.slice(2);
(async () => {
    const ref = admin.firestore().collection('posts').doc(POST_ID);
    const post = (await ref.get()).data();
    const bakDir = path.join(__dirname, '..', 'backups', 'post-content');
    fs.mkdirSync(bakDir, { recursive: true });
    const bak = path.join(bakDir, `${POST_ID}_${new Date().toISOString().replace(/[:.]/g, '-')}.html`);
    fs.writeFileSync(bak, post.content, 'utf-8');
    let content = fs.readFileSync(HTML, 'utf-8').replace('__IMAGE_URL__', post.imageUrl);
    if (content.includes('__IMAGE_URL__')) throw new Error('placeholder left');
    for (const bad of ['확인할 것', '블로그 게시본', '미게시']) if (content.includes(bad)) throw new Error('bad token: ' + bad);
    await ref.update({ content, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log('backup:', bak); console.log('UPDATED', POST_ID, post.content.length, '→', content.length);
})().then(() => process.exit(0)).catch(e => { console.error(e.message || e); process.exit(1); });
