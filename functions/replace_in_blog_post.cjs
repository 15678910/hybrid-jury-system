// 블로그 본문의 특정 문장만 바꾼다(updateDoc). 관리자 화면에서 사용자가 고친 다른 부분은 그대로 둔다.
// 사용: node replace_in_blog_post.cjs <postId> <replacements.json>
//   replacements.json = [{ "old": "바꿀 문장", "new": "새 문장" }, ...]
// 안전장치: ① 덮어쓰기 전 본문을 backups/post-content/ 에 저장 ② 각 old 가 본문에 정확히 한 번 있어야 진행(없거나 여러 번이면 아무것도 바꾸지 않고 중단)
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
admin.initializeApp({ credential: admin.credential.cert(require('../serviceAccountKey.json')) });

const [POST_ID, REPL_PATH] = process.argv.slice(2);
if (!POST_ID || !REPL_PATH) { console.error('사용: node replace_in_blog_post.cjs <postId> <replacements.json>'); process.exit(2); }

(async () => {
    const reps = JSON.parse(fs.readFileSync(REPL_PATH, 'utf-8'));
    const ref = admin.firestore().collection('posts').doc(POST_ID);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('post not found: ' + POST_ID);
    const before = snap.data().content;
    const bakDir = path.join(__dirname, '..', 'backups', 'post-content');
    fs.mkdirSync(bakDir, { recursive: true });
    const bak = path.join(bakDir, `${POST_ID}_${new Date().toISOString().replace(/[:.]/g, '-')}.html`);
    fs.writeFileSync(bak, before, 'utf-8');
    console.log('backup:', bak);
    let after = before;
    for (const { old, new: neu } of reps) {
        const n = after.split(old).length - 1;
        if (n !== 1) throw new Error(`"${old.slice(0, 40)}…" 가 본문에 ${n}번 있음 — 중단(아무것도 바꾸지 않음)`);
        after = after.replace(old, neu);
    }
    await ref.update({ content: after, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log('UPDATED', POST_ID, before.length, '→', after.length, 'chars');
})().then(() => process.exit(0)).catch(e => { console.error(e.message || e); process.exit(1); });
