// 라이브 블로그 카드 이미지만 교체 (Storage 업로드 + imageUrl updateDoc)
const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require('../serviceAccountKey.json');
const BUCKET = 'siminbupjung-blog.firebasestorage.app';
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), storageBucket: BUCKET });

const POST_ID = 'l5Sb12frQxrpGpv7wShG';
const SCRATCH = 'C:/Users/lacoi/AppData/Local/Temp/claude/C--Users-lacoi-Desktop-hybrid-jury-system/a0f44c8a-d2cf-422b-87ab-f4b889e470d7/scratchpad';
const IMG_PATH = path.join(SCRATCH, 'blog_card.png');
const DEST = 'blog-images/mdp-reform-column-20260711-v4.png';

(async () => {
    const bucket = admin.storage().bucket();
    await bucket.upload(IMG_PATH, { destination: DEST, metadata: { contentType: 'image/png', cacheControl: 'public, max-age=31536000' } });
    await bucket.file(DEST).makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${DEST}`;
    await admin.firestore().collection('posts').doc(POST_ID).update({ imageUrl, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log('이미지 교체 완료:', imageUrl);
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
