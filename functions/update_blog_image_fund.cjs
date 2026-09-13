// 일회성: 미래대응기금 칼럼 글의 대표 이미지만 교체 (Storage 새 경로 업로드 + imageUrl updateDoc). 삭제 없음.
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), storageBucket: 'siminbupjung-blog.firebasestorage.app' });
const POST_ID = 'K3CrBezeIwWW26k1rSow';
const IMG = 'C:/Users/lacoi/AppData/Local/Temp/claude/C--Users-lacoi-Desktop-hybrid-jury-system/da59800c-4141-4bad-befe-989bf4ce34bd/scratchpad/blog_cover43.png';
const DEST = 'blog-images/future-fund-key-column-20260912.png'; // 새 경로 — 카카오 미리보기 캐시를 피한다. 4:3(1600×1200): 카카오 말풍선 비율(2:1~3:4) 안
(async () => {
    const bucket = admin.storage().bucket();
    await bucket.upload(IMG, { destination: DEST, metadata: { contentType: 'image/png', cacheControl: 'public, max-age=31536000' } });
    await bucket.file(DEST).makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${DEST}`;
    const ref = admin.firestore().collection('posts').doc(POST_ID);
    const snap = await ref.get();
    if (!snap.exists || snap.data().title !== '나라 곳간은 만들되, 열쇠는 입법부가') throw new Error('대상 글 불일치');
    await ref.update({ imageUrl, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log('이미지 교체 완료:', imageUrl);
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
