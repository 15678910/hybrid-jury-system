// 일회성: 미래대응기금 칼럼 블로그 게시 (이미지 Storage 업로드 + posts addDoc). 삭제 없음, 신규 생성만.
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../serviceAccountKey.json');
const BUCKET = 'siminbupjung-blog.firebasestorage.app';
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), storageBucket: BUCKET });

const SCRATCH = 'C:/Users/lacoi/AppData/Local/Temp/claude/C--Users-lacoi-Desktop-hybrid-jury-system/da59800c-4141-4bad-befe-989bf4ce34bd/scratchpad';
const HTML_PATH = path.join(SCRATCH, 'blog_post.html');
const IMG_PATH = path.join(SCRATCH, 'blog_cover.png');
const STORAGE_DEST = 'blog-images/future-fund-key-column-20260911.png';
const title = '나라 곳간은 만들되, 열쇠는 입법부가';

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
        summary: '9월 3일 국회에 제출된 2027년 예산안의 162조 미래대응기금. 국가재정법 제70조의 30% 특례와 한도 없는 세입 보전 전출, 제90조 초과세수 순서의 변경, 55년 된 교육교부금 자동 연동 폐지를 조문으로 확인하고, 노르웨이·앨버타·네덜란드의 곳간과 대조한 뒤 열쇠를 국회에 두는 다섯 가지 대안을 제안한다. 감사원을 국회로 옮기겠다는 대통령의 원칙을 대통령의 기금에도 적용하라고 묻는다.',
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
