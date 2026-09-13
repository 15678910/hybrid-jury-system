// 일회성: 검찰개혁 칼럼 라이브 글 수정 (이미지 교체 + 본문 갱신)
// updateDoc만 사용 — 삭제·재생성 없음, 글 ID/링크 유지 (CLAUDE.md 규칙)
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../serviceAccountKey.json');

const BUCKET = 'siminbupjung-blog.firebasestorage.app';
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), storageBucket: BUCKET });

const POST_ID = 'l5Sb12frQxrpGpv7wShG';
const SCRATCH = 'C:/Users/lacoi/AppData/Local/Temp/claude/C--Users-lacoi-Desktop-hybrid-jury-system/a0f44c8a-d2cf-422b-87ab-f4b889e470d7/scratchpad';
const HTML_PATH = path.join(SCRATCH, 'blog_post.html');
const IMG_PATH = path.join(SCRATCH, 'blog_card.png');
const STORAGE_DEST = 'blog-images/mdp-reform-column-20260711-v2.png'; // 새 파일명(캐시 회피)

async function main() {
    const content = fs.readFileSync(HTML_PATH, 'utf-8');
    if (!content.trim().startsWith('<')) throw new Error('content must be HTML');

    // 대상 글 존재 확인
    const ref = admin.firestore().collection('posts').doc(POST_ID);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('post not found: ' + POST_ID);

    // 1) 새 이미지 업로드 + 공개
    const bucket = admin.storage().bucket();
    await bucket.upload(IMG_PATH, {
        destination: STORAGE_DEST,
        metadata: { contentType: 'image/png', cacheControl: 'public, max-age=31536000' },
    });
    await bucket.file(STORAGE_DEST).makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${STORAGE_DEST}`;
    console.log('NEW_IMAGE_URL', imageUrl);

    // 2) 본문 + 이미지 갱신 (updateDoc)
    await ref.update({
        content,
        imageUrl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('UPDATED post', POST_ID);
    console.log('URL: https://siminbupjung-blog.web.app/blog/' + POST_ID);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
