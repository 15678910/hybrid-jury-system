// 일회성: 검찰개혁 칼럼 블로그 게시 (이미지 Storage 업로드 + posts addDoc)
// 삭제 없음. 신규 생성만. (CLAUDE.md 규칙 준수)
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../serviceAccountKey.json');

const BUCKET = 'siminbupjung-blog.firebasestorage.app';
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: BUCKET,
});

const SCRATCH = 'C:/Users/lacoi/AppData/Local/Temp/claude/C--Users-lacoi-Desktop-hybrid-jury-system/a0f44c8a-d2cf-422b-87ab-f4b889e470d7/scratchpad';
const HTML_PATH = path.join(SCRATCH, 'blog_post.html');
const IMG_PATH = path.join(SCRATCH, 'blog_card.png');
const STORAGE_DEST = 'blog-images/mdp-reform-column-20260711.png';

async function main() {
    const content = fs.readFileSync(HTML_PATH, 'utf-8');
    if (!content.trim().startsWith('<')) throw new Error('content must be HTML (starts with <)');

    // 1) 이미지 Storage 업로드 + 공개
    const bucket = admin.storage().bucket();
    await bucket.upload(IMG_PATH, {
        destination: STORAGE_DEST,
        metadata: { contentType: 'image/png', cacheControl: 'public, max-age=31536000' },
    });
    await bucket.file(STORAGE_DEST).makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${STORAGE_DEST}`;
    console.log('IMAGE_URL', imageUrl);

    // 2) 중복 방지: 동일 제목 존재 확인
    const title = '더불어민주당은 검찰개혁 의지가 있는가';
    const dup = await admin.firestore().collection('posts').where('title', '==', title).limit(1).get();
    if (!dup.empty) {
        console.log('ALREADY EXISTS, skip. id=', dup.docs[0].id);
        return;
    }

    // 3) 새 글 생성 (addDoc)
    const docRef = await admin.firestore().collection('posts').add({
        title,
        content,
        summary: '공소청·중수청 출범을 앞둔 지금, 더불어민주당의 검찰개혁에는 정작 「주권자 통제」가 빠져 있다. 그나마 김용민·박은정 의원안이 낫지만, 헌법 제1조와 민주주의에 부합하려면 핀란드식 2중·3중 감시·견제 시스템이 필요하다.',
        author: '주권자사법개혁추진준비위원회',
        imageUrl,
        category: '칼럼/논평',
        views: 0,
        likes: 0,
        likedIPs: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('CREATED post id=', docRef.id);
    console.log('URL: https://siminbupjung-blog.web.app/blog/' + docRef.id);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
