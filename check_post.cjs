const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function checkPosts() {
    const snapshot = await db.collection('posts')
        .orderBy('createdAt', 'desc')
        .get();

    console.log('Total posts:', snapshot.size);
    console.log('\n--- All posts ---');

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`[${data.category || 'blog'}] ${data.title}`);
    });

    // 특정 제목 검색
    console.log('\n--- Searching for 법 해석 독점 ---');
    const matching = snapshot.docs.filter(doc =>
        doc.data().title && doc.data().title.includes('독점')
    );
    matching.forEach(doc => {
        console.log('Found:', doc.id, '-', doc.data().title);
    });
}

checkPosts().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
