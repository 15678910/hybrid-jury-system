// 일회성: 칼럼 「이것이 더불어민주당의 실체?」 블로그 게시 (이미지 Storage 업로드 + posts addDoc). 삭제 없음, 신규 생성만.
// 실행 전 백업: cd functions && node backup_firestore.js  (2026-09-17T17-59-53 완료)
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../serviceAccountKey.json');
const BUCKET = 'siminbupjung-blog.firebasestorage.app';
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), storageBucket: BUCKET });

const SCRATCH = 'C:/Users/lacoi/AppData/Local/Temp/claude/C--Users-lacoi-Desktop-hybrid-jury-system/da59800c-4141-4bad-befe-989bf4ce34bd/scratchpad';
const HTML_PATH = path.join(SCRATCH, 'blog_post_kim.html');
const IMG_PATH = path.join(SCRATCH, 'blog_cover_kim.png');
const STORAGE_DEST = 'blog-images/kim-hyeongyeon-cppo-column-20260918.png'; // 4:3 1600×1200 — 카카오 말풍선 비율 안
const title = '이것이 더불어민주당의 실체?';

async function main() {
    const content = fs.readFileSync(HTML_PATH, 'utf-8');
    if (!content.trim().startsWith('<')) throw new Error('content must be HTML');
    const dup = await admin.firestore().collection('posts').where('title', '==', title).limit(1).get();
    if (!dup.empty) { console.log('ALREADY EXISTS, skip. id=', dup.docs[0].id); return; }

    const bucket = admin.storage().bucket();
    await bucket.upload(IMG_PATH, { destination: STORAGE_DEST, metadata: { contentType: 'image/png', cacheControl: 'public, max-age=31536000' } });
    await bucket.file(STORAGE_DEST).makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${STORAGE_DEST}`;
    console.log('IMAGE_URL', imageUrl);

    const docRef = await admin.firestore().collection('posts').add({
        title,
        content,
        summary: '9월 17일 본회의를 통과한 공수처법 개정안(2221213). 발의에서 본회의까지 9일, 비교섭단체에는 두 시간 전 통고, 법사위 심사보고서는 대체토론·찬반토론 「특이사항 없음」. 공소청 검사가 공수처 검사에게 보완수사를 요구하고 형사소송법 제197조의2를 준용해 공수처 검사를 「사법경찰관으로 본다」는 제26조 제2항·제3항을 조문으로 읽고, 검토보고서에 이미 적혀 있던 공수처의 대안(요구 대신 의뢰·협조)을 확인한다. 조국혁신당 김형연 의원의 5분 반대토론이 아니었다면 기록되지 않았을 것들.',
        author: '주권자사법개혁추진준비위원회',
        imageUrl,
        category: '칼럼/논평',
        views: 0, likes: 0, likedIPs: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('CREATED post id=', docRef.id);
    console.log('URL: https://xn--lg3b0kt4n41f.kr/blog/' + docRef.id);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
