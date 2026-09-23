// 일회성: 「대법관 한 자리는 누구의 것인가」(dOZI7HRDnDewpsTUspcM) 맺는말 마지막 문장 교체. updateDoc 만 사용.
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const POST_ID = process.argv[2] || 'dOZI7HRDnDewpsTUspcM';
const OLD = '그 둘을 구분하는 것이 이번 사건이 국민에게 남긴 숙제다.';
const NEW = '그 둘을 구분하는 것은 두 대리인의 숙제이고, 숙제를 시키는 것은 주권자의 권리다.';
(async () => {
    const ref = admin.firestore().collection('posts').doc(POST_ID);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('post not found');
    const c = snap.data().content;
    if (c.split(OLD).length !== 2) throw new Error('old sentence count != 1');
    await ref.update({ content: c.replace(OLD, NEW), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log('UPDATED', POST_ID);
})().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
