// 일회성: 「대법관 한 자리는 누구의 것인가」(dOZI7HRDnDewpsTUspcM) 표지 GIF 를 v2 로 교체. updateDoc 만 사용.
// 사유: 첫 GIF 는 0초 프레임이 거의 빈 화면이라 SNS 미리보기(og:image 첫 프레임)가 검게 나온다 → 완성 화면을 1.5초 먼저 보여 준 뒤 애니메이션이 시작되는 v2 로.
// 같은 경로 덮어쓰기는 1년 캐시 때문에 피하고(2026-09-08 규칙) 새 파일명으로 올린다.
const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require('../serviceAccountKey.json');
const BUCKET = 'siminbupjung-blog.firebasestorage.app';
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), storageBucket: BUCKET });

const POST_ID = process.argv[2] || 'dOZI7HRDnDewpsTUspcM';
const SCRATCH = 'C:/Users/lacoi/AppData/Local/Temp/claude/C--Users-lacoi-Desktop-hybrid-jury-system/da59800c-4141-4bad-befe-989bf4ce34bd/scratchpad';
const GIF_PATH = path.join(SCRATCH, 'cover_supreme_v2.gif');
const GIF_DEST = 'blog-images/supreme-court-seat-column-20260924-v2.gif';

async function main() {
    const ref = admin.firestore().collection('posts').doc(POST_ID);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('post not found: ' + POST_ID);
    const post = snap.data();
    const bucket = admin.storage().bucket();
    await bucket.upload(GIF_PATH, { destination: GIF_DEST, metadata: { contentType: 'image/gif', cacheControl: 'public, max-age=31536000' } });
    await bucket.file(GIF_DEST).makePublic();
    const newUrl = `https://storage.googleapis.com/${bucket.name}/${GIF_DEST}`;
    const oldUrl = post.imageUrl;
    if (!post.content.includes(oldUrl)) throw new Error('old imageUrl not found in content');
    const content = post.content.split(oldUrl).join(newUrl);
    await ref.update({ imageUrl: newUrl, content, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log('old:', oldUrl); console.log('new:', newUrl);
    console.log('UPDATED', POST_ID);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
