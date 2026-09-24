// 읽기 전용: 현재 Firestore 본문을 백업 파일로 저장하고, md 변환본과 텍스트를 비교한다(수정 없음).
const admin = require('firebase-admin'); const fs = require('fs'); const path = require('path');
admin.initializeApp({ credential: admin.credential.cert(require('../serviceAccountKey.json')) });
const POST_ID = process.argv[2] || 'dOZI7HRDnDewpsTUspcM';
const SCRATCH = 'C:/Users/lacoi/AppData/Local/Temp/claude/C--Users-lacoi-Desktop-hybrid-jury-system/da59800c-4141-4bad-befe-989bf4ce34bd/scratchpad';
const strip = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
(async () => {
  const snap = await admin.firestore().collection('posts').doc(POST_ID).get();
  const p = snap.data();
  const bakDir = path.join(__dirname, '..', 'backups', 'post-content'); fs.mkdirSync(bakDir, { recursive: true });
  const bak = path.join(bakDir, `${POST_ID}_${new Date().toISOString().replace(/[:.]/g, '-')}_live.html`);
  fs.writeFileSync(bak, p.content, 'utf-8');
  console.log('live length:', p.content.length, '| has <table>:', p.content.includes('<table'), '| has style=:', p.content.includes('style='), '| updatedAt:', p.updatedAt && p.updatedAt.toDate().toISOString());
  const mine = fs.readFileSync(path.join(SCRATCH, 'blog_post_supreme.html'), 'utf-8');
  const a = strip(p.content), b = strip(mine);
  console.log('text equal:', a === b, '| live text', a.length, 'chars vs mine', b.length);
  if (a !== b) { let i = 0; while (i < a.length && a[i] === b[i]) i++; console.log('first diff at', i, '\n LIVE:', a.slice(Math.max(0,i-40), i+120), '\n MINE:', b.slice(Math.max(0,i-40), i+120)); }
  console.log('backup:', bak);
})().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
