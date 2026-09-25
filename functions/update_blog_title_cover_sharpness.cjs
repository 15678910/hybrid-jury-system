// 일회성: jRdIwotc7JGxFdF4vKjk 제목을 「선명성이 문제인가, 대통령의 의지가 문제인가」로 바꾸고 표지 GIF 를 새 제목판(v3)으로 교체. updateDoc 만.
// 본문은 이미지 주소·대체 글자만 치환하므로 관리자 화면에서 고친 오탈자는 그대로 남는다. 덮어쓰기 전 본문 백업.
// 표지는 1년 캐시 때문에 새 파일명으로 올린다(2026-09-08 규칙).
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const BUCKET = 'siminbupjung-blog.firebasestorage.app';
admin.initializeApp({ credential: admin.credential.cert(require('../serviceAccountKey.json')), storageBucket: BUCKET });

const POST_ID = 'jRdIwotc7JGxFdF4vKjk';
const NEW_TITLE = '선명성이 문제인가, 대통령의 의지가 문제인가';
const OLD_ALT = 'alt="선명성이 문제인가, 조문이 문제인가"';
const NEW_ALT = `alt="${NEW_TITLE}"`;
const SCRATCH = 'C:/Users/lacoi/AppData/Local/Temp/claude/C--Users-lacoi-Desktop-hybrid-jury-system/da59800c-4141-4bad-befe-989bf4ce34bd/scratchpad';
const GIF_PATH = path.join(SCRATCH, 'cover_sharp3_v2.gif');
const POSTER_PATH = path.join(SCRATCH, 'cover_sharp3_poster.png');
const GIF_DEST = 'blog-images/sharpness-vs-will-column-20260925-v3.gif';
const POSTER_DEST = 'blog-images/sharpness-vs-will-column-20260925-v3.png';

(async () => {
    const ref = admin.firestore().collection('posts').doc(POST_ID);
    const post = (await ref.get()).data();
    const bakDir = path.join(__dirname, '..', 'backups', 'post-content');
    fs.mkdirSync(bakDir, { recursive: true });
    const bak = path.join(bakDir, `${POST_ID}_${new Date().toISOString().replace(/[:.]/g, '-')}.html`);
    fs.writeFileSync(bak, post.content, 'utf-8');
    console.log('backup:', bak, '| old title:', post.title);

    const oldUrl = post.imageUrl;
    if (post.content.split(oldUrl).length - 1 !== 1) throw new Error('old image url not found exactly once in content');
    const bucket = admin.storage().bucket();
    for (const [src, dest, type] of [[GIF_PATH, GIF_DEST, 'image/gif'], [POSTER_PATH, POSTER_DEST, 'image/png']]) {
        await bucket.upload(src, { destination: dest, metadata: { contentType: type, cacheControl: 'public, max-age=31536000' } });
        await bucket.file(dest).makePublic();
    }
    const newUrl = `https://storage.googleapis.com/${bucket.name}/${GIF_DEST}`;
    let content = post.content.replace(oldUrl, newUrl);
    if (content.includes(OLD_ALT)) content = content.replace(OLD_ALT, NEW_ALT);
    await ref.update({ title: NEW_TITLE, imageUrl: newUrl, content, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log('UPDATED title →', NEW_TITLE, '| image →', newUrl);
})().then(() => process.exit(0)).catch(e => { console.error(e.message || e); process.exit(1); });
