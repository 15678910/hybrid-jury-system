// 블로그 글 표지 교체: 새 파일을 Storage 에 올리고 imageUrl 과 본문 속 옛 표지 주소만 바꾼다(updateDoc). 본문의 다른 글자는 건드리지 않는다.
// 사용: node swap_blog_cover.cjs <postId> <localFile> <storageDest> [contentType]
// 안전장치: 본문 백업, 옛 주소가 본문에 정확히 한 번 있을 때만 진행. 같은 경로 덮어쓰기 금지(1년 캐시) — dest 는 새 이름으로.
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const BUCKET = 'siminbupjung-blog.firebasestorage.app';
admin.initializeApp({ credential: admin.credential.cert(require('../serviceAccountKey.json')), storageBucket: BUCKET });
const [POST_ID, LOCAL, DEST, TYPE] = process.argv.slice(2);
(async () => {
    const ref = admin.firestore().collection('posts').doc(POST_ID);
    const post = (await ref.get()).data();
    const oldUrl = post.imageUrl;
    const n = post.content.split(oldUrl).length - 1;
    if (n !== 1) throw new Error(`옛 표지 주소가 본문에 ${n}번 — 중단`);
    const bucket = admin.storage().bucket();
    const [exists] = await bucket.file(DEST).exists();
    if (exists) throw new Error('같은 경로에 이미 파일이 있음(캐시 문제) — 새 이름을 쓸 것: ' + DEST);
    const bakDir = path.join(__dirname, '..', 'backups', 'post-content');
    fs.mkdirSync(bakDir, { recursive: true });
    fs.writeFileSync(path.join(bakDir, `${POST_ID}_${new Date().toISOString().replace(/[:.]/g, '-')}.html`), post.content, 'utf-8');
    const contentType = TYPE || (LOCAL.endsWith('.jpg') ? 'image/jpeg' : LOCAL.endsWith('.png') ? 'image/png' : 'image/gif');
    await bucket.upload(LOCAL, { destination: DEST, metadata: { contentType, cacheControl: 'public, max-age=31536000' } });
    await bucket.file(DEST).makePublic();
    const newUrl = `https://storage.googleapis.com/${bucket.name}/${DEST}`;
    await ref.update({ imageUrl: newUrl, content: post.content.replace(oldUrl, newUrl), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log('old:', oldUrl); console.log('new:', newUrl);
})().then(() => process.exit(0)).catch(e => { console.error(e.message || e); process.exit(1); });
