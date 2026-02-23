const admin = require('firebase-admin');
const serviceAccount = require('C:/Users/lacoi/Desktop/hybrid-jury-system/serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const { FieldValue } = admin.firestore;

(async () => {
    const snapshot = await db.collection('sentencingData').get();
    let count = 0;
    for (const doc of snapshot.docs) {
        if (doc.data().claudePrediction) {
            await doc.ref.update({ claudePrediction: FieldValue.delete() });
            count++;
            console.log(`  삭제: ${doc.id}`);
        }
    }
    console.log(`총 ${count}건 claudePrediction 삭제 완료`);
    process.exit(0);
})();
