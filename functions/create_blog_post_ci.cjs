// 블로그 새 글 생성 (GitHub Actions 「블로그 글 게시 (수동)」 전용, 2026-10-01).
// 원격 세션에는 서비스 계정 키가 없어 create_blog_post_*.cjs 를 직접 돌릴 수 없다 → 워크플로가 백업 뒤 이 스크립트를 부른다.
// 사용: node functions/create_blog_post_ci.cjs <spec.json>   (저장소 루트에서)
// spec: { title, subtitle?, summary, author, category, htmlFile, coverFile, coverDest }
// 신규 생성만 한다. 같은 제목의 글이 이미 있으면 아무것도 하지 않는다(중복·덮어쓰기 방지). 삭제·수정 없음.
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BUCKET = 'siminbupjung-blog.firebasestorage.app';
const serviceAccount = require(path.join(ROOT, 'serviceAccountKey.json'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), storageBucket: BUCKET });

async function main() {
    const specPath = process.argv[2];
    if (!specPath) throw new Error('spec 파일 경로가 필요합니다');
    const spec = JSON.parse(fs.readFileSync(path.join(ROOT, specPath), 'utf-8'));
    for (const k of ['title', 'summary', 'author', 'category', 'htmlFile', 'coverFile', 'coverDest']) {
        if (!spec[k]) throw new Error(`spec 에 ${k} 가 없습니다`);
    }
    let content = fs.readFileSync(path.join(ROOT, spec.htmlFile), 'utf-8');
    if (!content.trim().startsWith('<')) throw new Error('본문은 HTML 이어야 합니다');
    for (const bad of ['확인할 것', '블로그 게시본', '초안', '미게시']) if (content.includes(bad)) throw new Error('본문에 금지 문구: ' + bad);
    if (!content.includes('__IMAGE_URL__')) throw new Error('본문에 표지 자리표시(__IMAGE_URL__)가 없습니다');

    const db = admin.firestore();
    const dup = await db.collection('posts').where('title', '==', spec.title).limit(1).get();
    if (!dup.empty) {
        console.log('이미 같은 제목의 글이 있어 건너뜁니다. id=', dup.docs[0].id);
        console.log('URL: https://xn--lg3b0kt4n41f.kr/blog/' + dup.docs[0].id);
        return;
    }

    const ext = path.extname(spec.coverFile).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
    const bucket = admin.storage().bucket();
    await bucket.upload(path.join(ROOT, spec.coverFile), { destination: spec.coverDest, metadata: { contentType, cacheControl: 'public, max-age=31536000' } });
    await bucket.file(spec.coverDest).makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${spec.coverDest}`;
    console.log('표지 업로드:', imageUrl);
    content = content.split('__IMAGE_URL__').join(imageUrl);

    const doc = {
        title: spec.title,
        content,
        summary: spec.summary,
        author: spec.author,
        imageUrl,
        category: spec.category,
        views: 0, likes: 0, likedIPs: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (spec.subtitle) doc.subtitle = spec.subtitle;
    const ref = await db.collection('posts').add(doc);
    console.log('글 생성 id=', ref.id, '본문 길이=', content.length);
    console.log('URL: https://xn--lg3b0kt4n41f.kr/blog/' + ref.id);
    if (process.env.GITHUB_STEP_SUMMARY) {
        fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### 블로그 게시 완료\n- 제목: ${spec.title}\n- 주소: https://xn--lg3b0kt4n41f.kr/blog/${ref.id}\n- 표지: ${imageUrl}\n`);
    }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
