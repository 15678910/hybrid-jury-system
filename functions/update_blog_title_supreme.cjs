// 일회성: 「대법관 한 자리는 누구의 것인가」(dOZI7HRDnDewpsTUspcM) 제목을 본제·부제로 분리. updateDoc 만 사용.
// title → 「대법관 한 자리는 누구의 것인가」, subtitle(새 필드, BlogPost.jsx 가 제목 아래 작은 글씨로 렌더) → 「도장 두 개의 싸움과 5천만 명의 재판」
// 본문 첫 줄의 중복 부제도 정리한다.
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const POST_ID = process.argv[2] || 'dOZI7HRDnDewpsTUspcM';
const TITLE = '대법관 한 자리는 누구의 것인가';
const SUBTITLE = '도장 두 개의 싸움과 5천만 명의 재판';

async function main() {
    const ref = admin.firestore().collection('posts').doc(POST_ID);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('post not found: ' + POST_ID);
    const post = snap.data();
    const oldLead = '<p style="color:#5C6470;font-size:0.95em">헌법 제104조 읽기 — 도장 두 개의 싸움과 5천만 명의 재판</p>';
    const newLead = '<p style="color:#5C6470;font-size:0.95em">헌법 제104조 읽기</p>';
    if (!post.content.includes(oldLead)) throw new Error('lead paragraph not found');
    const content = post.content.replace(oldLead, newLead);
    console.log('title:', post.title, '→', TITLE, '| subtitle:', SUBTITLE);
    await ref.update({ title: TITLE, subtitle: SUBTITLE, content, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log('UPDATED', POST_ID);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
