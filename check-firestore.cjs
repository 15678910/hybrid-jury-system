const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function checkAll() {
  const snap = await db.collection('sentencingData').get();
  snap.forEach(doc => {
    const d = doc.data();
    console.log('=== ' + doc.id + ' ===');
    console.log('verdict:', d.verdict);
    console.log('verdictDate:', d.verdictDate);
    console.log('trialStatus:', d.trialStatus);
    console.log('keyFacts:', JSON.stringify(d.keyFacts));
    console.log('charges count:', d.charges?.length);
    if (d.charges) {
      d.charges.forEach(c => console.log('  charge:', c.name, '| verdict:', c.verdict, '| sentence:', c.sentence));
    }
    console.log('');
  });
  process.exit(0);
}
checkAll();
