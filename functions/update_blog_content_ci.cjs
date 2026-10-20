// 블로그 글 본문 교체 (GitHub Actions 「블로그 본문 수정 (수동)」 전용, 2026-10-01).
// 사용: node functions/update_blog_content_ci.cjs <postId> <spec.json> <expectedLength> [--swap-cover]   (저장소 루트에서)
//   --swap-cover: spec 의 coverFile 을 coverDest(새 파일명이어야 함 — 같은 경로 덮어쓰기는 CDN 캐시에 막힌다)로 올리고
//                 imageUrl 과 본문 속 표지 주소를 함께 바꾼다. 2026-10-20 수채화 표지 교체용.
// CLAUDE.md 2026-09-24 규칙을 코드로 지킨다:
//   ① 교체 전 기존 본문을 backups/post-content/ 에 파일로 남긴다(워크플로가 아티팩트로 보관)
//   ② 지금 본문 길이가 내가 마지막으로 올린 길이(expectedLength)와 다르면 사용자가 고친 것 → 덮어쓰지 않고 멈춘다
// content 필드만 updateDoc 한다. 글 ID·제목·표지·조회수는 그대로다. 삭제 없음.
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BUCKET = 'siminbupjung-blog.firebasestorage.app';
const serviceAccount = require(path.join(ROOT, 'serviceAccountKey.json'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), storageBucket: BUCKET });

async function main() {
    const args = process.argv.slice(2);
    const swapCover = args.includes('--swap-cover');
    const [postId, specPath, expectedArg] = args.filter((a) => !a.startsWith('--'));
    if (!postId || !specPath || !expectedArg) throw new Error('인자: <postId> <spec.json> <expectedLength> [--swap-cover]');
    const expected = Number(expectedArg);
    const spec = JSON.parse(fs.readFileSync(path.join(ROOT, specPath), 'utf-8'));

    const ref = admin.firestore().collection('posts').doc(postId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('글이 없습니다: ' + postId);
    const cur = snap.data();
    if (cur.title !== spec.title) throw new Error(`제목이 다릅니다 (글: ${cur.title} / 명세: ${spec.title}) — 다른 글을 가리키는지 확인하세요`);

    const dir = path.join(ROOT, 'backups', 'post-content');
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const bak = path.join(dir, `${postId}_${stamp}.html`);
    fs.writeFileSync(bak, cur.content || '', 'utf-8');
    console.log('기존 본문 백업:', path.relative(ROOT, bak), '길이=', (cur.content || '').length);

    if ((cur.content || '').length !== expected) {
        throw new Error(`지금 본문 길이 ${(cur.content || '').length} ≠ 마지막으로 올린 길이 ${expected}. 관리자 화면에서 누군가 고친 것으로 보여 덮어쓰지 않습니다. 사용자에게 먼저 물으세요.`);
    }

    let content = fs.readFileSync(path.join(ROOT, spec.htmlFile), 'utf-8');
    if (!content.trim().startsWith('<')) throw new Error('본문은 HTML 이어야 합니다');
    for (const bad of ['확인할 것', '블로그 게시본', '초안', '미게시']) if (content.includes(bad)) throw new Error('본문에 금지 문구: ' + bad);
    let imageUrl = cur.imageUrl;
    if (swapCover) {
        if (!spec.coverFile || !spec.coverDest) throw new Error('--swap-cover 에는 spec.coverFile·coverDest 가 필요합니다');
        const bucket = admin.storage().bucket();
        const [exists] = await bucket.file(spec.coverDest).exists();
        if (exists) throw new Error(`Storage 에 ${spec.coverDest} 가 이미 있습니다 — 같은 경로 덮어쓰기는 캐시 때문에 화면에 안 바뀝니다. 새 파일명을 쓰세요.`);
        const ext = path.extname(spec.coverFile).toLowerCase();
        const contentType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        await bucket.upload(path.join(ROOT, spec.coverFile), { destination: spec.coverDest, metadata: { contentType, cacheControl: 'public, max-age=31536000' } });
        await bucket.file(spec.coverDest).makePublic();
        imageUrl = `https://storage.googleapis.com/${bucket.name}/${spec.coverDest}`;
        console.log('새 표지 업로드:', imageUrl, '(옛 표지:', cur.imageUrl, ')');
    }
    if (!imageUrl) throw new Error('글에 imageUrl 이 없어 표지 자리를 채울 수 없습니다');
    content = content.split('__IMAGE_URL__').join(imageUrl);
    if (cur.imageUrl && imageUrl !== cur.imageUrl) content = content.split(cur.imageUrl).join(imageUrl);

    await ref.update(swapCover ? { content, imageUrl } : { content });
    console.log('본문 교체 완료 id=', postId, '새 길이=', content.length, swapCover ? '· 표지 교체됨' : '');
    if (process.env.GITHUB_STEP_SUMMARY) {
        fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### 블로그 본문 수정 완료\n- 제목: ${spec.title}\n- 주소: https://xn--lg3b0kt4n41f.kr/blog/${postId}\n- 길이: ${expected} → ${content.length} (다음 수정 때 expected_length 로 쓴다)\n`);
    }
}
main().then(() => process.exit(0)).catch(e => { console.error(e.message || e); process.exit(1); });
