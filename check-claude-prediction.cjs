const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function check() {
  const doc = await db.collection('sentencingData').doc('한덕수').get();
  if (!doc.exists) {
    console.log('문서 없음');
    process.exit(1);
  }
  const d = doc.data();
  console.log('=== 한덕수 claudePrediction ===');
  console.log(JSON.stringify(d.claudePrediction, null, 2));
  console.log('\n=== 한덕수 전체 필드 목록 ===');
  console.log(Object.keys(d));
  process.exit(0);
}
check();
