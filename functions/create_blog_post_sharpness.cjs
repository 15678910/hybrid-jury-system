// 일회성: 칼럼 「선명성이 문제인가, 조문이 문제인가」 블로그 게시 (애니메이션 GIF 표지 + 포스터 PNG Storage 업로드 + posts addDoc). 삭제 없음, 신규 생성만.
// 실행 전 백업 필수: cd functions && node backup_firestore.js
// 본문: python scripts/blog-covers/md2blog.py docs/columns/2026-09-25_선명성이_문제인가_조문이_문제인가.md <scratch>/blog_post_sharp.html "" "선명성이 문제인가, 조문이 문제인가"
// 표지: scripts/blog-covers/sharpness-vs-provisions-20260925.html → render_cover_gif.mjs → 완성 프레임 1.5초 앞에 붙인 v2 GIF
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../serviceAccountKey.json');
const BUCKET = 'siminbupjung-blog.firebasestorage.app';
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), storageBucket: BUCKET });

const SCRATCH = 'C:/Users/lacoi/AppData/Local/Temp/claude/C--Users-lacoi-Desktop-hybrid-jury-system/da59800c-4141-4bad-befe-989bf4ce34bd/scratchpad';
const HTML_PATH = path.join(SCRATCH, 'blog_post_sharp.html');
const GIF_PATH = path.join(SCRATCH, 'cover_sharp_v2.gif');
const POSTER_PATH = path.join(SCRATCH, 'cover_sharp_poster.png');
const GIF_DEST = 'blog-images/sharpness-vs-provisions-column-20260925.gif';
const POSTER_DEST = 'blog-images/sharpness-vs-provisions-column-20260925.png';
const title = '선명성이 문제인가, 조문이 문제인가';
const subtitle = '대통령의 국가보안법 비유에 부쳐';

async function upload(bucket, src, dest, contentType) {
    await bucket.upload(src, { destination: dest, metadata: { contentType, cacheControl: 'public, max-age=31536000' } });
    await bucket.file(dest).makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${dest}`;
}

async function main() {
    let content = fs.readFileSync(HTML_PATH, 'utf-8');
    if (!content.trim().startsWith('<')) throw new Error('content must be HTML');
    for (const bad of ['확인할 것', '블로그 게시본', '초안', '미게시']) if (content.includes(bad)) throw new Error('bad token in content: ' + bad);
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
        subtitle,
        content,
        summary: '9월 24일 멕시코시티에서 이재명 대통령은 2004년 국가보안법 개정 무산을 들어 「선명해서 멋있을지는 몰라도 좋은 결과를 만들기는 쉽지 않다」고 했다. 그 밤 합의를 깬 것은 여당 의총이었다. 그러나 2026년에는 막힌 법안도 타협 상대도 없고, 7월 당론을 비켜 간 9월의 법은 「특이사항 없음」으로 통과했다. 국무회의가 확정한 「불가역적 탈검찰화」는 대통령령으로도 법률로도 움직이지 않았고, 검사정원법의 2,292명은 그대로다. 제 손으로 할 수 있는 국보법 독소조항 삭제는 하지 않으면서 남의 실패를 교훈으로 내미는 것이 온당한가. 모자란 것은 선명성이 아니라 정부와 다른 말을 할 수 있는 여당이다.',
        author: '주권자사법개혁추진준비위원회',
        imageUrl: gifUrl,
        category: '칼럼/논평',
        views: 0, likes: 0, likedIPs: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('CREATED post id=', docRef.id, 'content length=', content.length);
    console.log('URL: https://xn--lg3b0kt4n41f.kr/blog/' + docRef.id);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
