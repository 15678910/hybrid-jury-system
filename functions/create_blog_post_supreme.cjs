// 일회성: 칼럼 「대법관 한 자리는 누구의 것인가」 블로그 게시 (애니메이션 GIF 표지 + 포스터 PNG Storage 업로드 + posts addDoc). 삭제 없음, 신규 생성만.
// 실행 전 백업: cd functions && node backup_firestore.js  (2026-09-23T15-18-46 완료)
// 표지 원본: scratchpad/cover_supreme_anim.html → render_cover_gif.mjs (헤드리스 크롬 프레임 → ffmpeg GIF 1200×900, 12fps, 9.5초)
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../serviceAccountKey.json');
const BUCKET = 'siminbupjung-blog.firebasestorage.app';
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), storageBucket: BUCKET });

const SCRATCH = 'C:/Users/lacoi/AppData/Local/Temp/claude/C--Users-lacoi-Desktop-hybrid-jury-system/da59800c-4141-4bad-befe-989bf4ce34bd/scratchpad';
const HTML_PATH = path.join(SCRATCH, 'blog_post_supreme.html');
const GIF_PATH = path.join(SCRATCH, 'cover_supreme.gif');
const POSTER_PATH = path.join(SCRATCH, 'cover_supreme_poster.png');
const GIF_DEST = 'blog-images/supreme-court-seat-column-20260924.gif';      // 4:3 1200×900 애니메이션 — 목록·본문·OG 공용
const POSTER_DEST = 'blog-images/supreme-court-seat-column-20260924.png';   // 마지막 프레임 정지 이미지(예비)
const title = '대법관 한 자리는 누구의 것인가 — 도장 두 개의 싸움과 5천만 명의 재판';

async function upload(bucket, src, dest, contentType) {
    await bucket.upload(src, { destination: dest, metadata: { contentType, cacheControl: 'public, max-age=31536000' } });
    await bucket.file(dest).makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${dest}`;
}

async function main() {
    let content = fs.readFileSync(HTML_PATH, 'utf-8');
    if (!content.trim().startsWith('<')) throw new Error('content must be HTML');
    const dup = await admin.firestore().collection('posts').where('title', '==', title).limit(1).get();
    if (!dup.empty) { console.log('ALREADY EXISTS, skip. id=', dup.docs[0].id); return; }

    const bucket = admin.storage().bucket();
    const gifUrl = await upload(bucket, GIF_PATH, GIF_DEST, 'image/gif');
    const posterUrl = await upload(bucket, POSTER_PATH, POSTER_DEST, 'image/png');
    console.log('GIF_URL', gifUrl); console.log('POSTER_URL', posterUrl);
    content = content.replace('__IMAGE_URL__', gifUrl);
    if (content.includes('__IMAGE_URL__')) throw new Error('placeholder left');

    const docRef = await admin.firestore().collection('posts').add({
        title,
        content,
        summary: '대법관 한 자리가 여섯 달째 비어 있다. 대법원장은 8월 18일 사전 협의 없이 제청했고, 청와대는 「다시 제청하라」고 했으며, 대법원장은 9월 22일 「헌법적 근거가 없다」며 거부했다. 헌법 제104조가 정한 것과 정하지 않은 것을 읽고, 「독립」이라는 낱말이 어디까지 방패가 되는지 가르고, 미국·독일·일본·영국·이탈리아는 이 자리를 누가 채우는지 본 뒤, 지금 국회가 법원조직법으로 할 수 있는 여섯 줄과 헌법으로 바꿀 한 줄을 적는다. 재판은 독립되어야 한다. 인사는 독점되어서는 안 된다.',
        author: '주권자사법개혁추진준비위원회',
        imageUrl: gifUrl,
        category: '칼럼/논평',
        views: 0, likes: 0, likedIPs: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('CREATED post id=', docRef.id);
    console.log('URL: https://xn--lg3b0kt4n41f.kr/blog/' + docRef.id);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
