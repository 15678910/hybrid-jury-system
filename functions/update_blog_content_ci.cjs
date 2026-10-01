// 블로그 글 본문 교체 (GitHub Actions 「블로그 본문 수정 (수동)」 전용, 2026-10-01).
// 사용: node functions/update_blog_content_ci.cjs <postId> <spec.json> <expectedLength>   (저장소 루트에서)
// CLAUDE.md 2026-09-24 규칙을 코드로 지킨다:
//   ① 교체 전 기존 본문을 backups/post-content/ 에 파일로 남긴다(워크플로가 아티팩트로 보관)
//   ② 지금 본문 길이가 내가 마지막으로 올린 길이(expectedLength)와 다르면 사용자가 고친 것 → 덮어쓰지 않고 멈춘다
// content 필드만 updateDoc 한다. 글 ID·제목·표지·조회수는 그대로다. 삭제 없음.
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const serviceAccount = require(path.join(ROOT, 'serviceAccountKey.json'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function main() {
    const [postId, specPath, expectedArg] = process.argv.slice(2);
    if (!postId || !specPath || !expectedArg) throw new Error('인자: <postId> <spec.json> <expectedLength>');
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
    content = content.split('__IMAGE_URL__').join(cur.imageUrl || '');
    if (!cur.imageUrl) throw new Error('글에 imageUrl 이 없어 표지 자리를 채울 수 없습니다');

    await ref.update({ content });
    console.log('본문 교체 완료 id=', postId, '새 길이=', content.length);
    if (process.env.GITHUB_STEP_SUMMARY) {
        fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### 블로그 본문 수정 완료\n- 제목: ${spec.title}\n- 주소: https://xn--lg3b0kt4n41f.kr/blog/${postId}\n- 길이: ${expected} → ${content.length} (다음 수정 때 expected_length 로 쓴다)\n`);
    }
}
main().then(() => process.exit(0)).catch(e => { console.error(e.message || e); process.exit(1); });
