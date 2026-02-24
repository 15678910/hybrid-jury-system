const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkPosts() {
    const postsRef = db.collection('posts');
    const allPosts = await postsRef.orderBy('createdAt', 'desc').get();

    console.log(`=== 전체 포스트: ${allPosts.size}개 ===\n`);

    const blogPosts = [];
    const newsPosts = [];

    allPosts.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.() || new Date();
        const post = {
            id: doc.id,
            title: data.title,
            category: data.category,
            date: createdAt.toISOString().split('T')[0]
        };

        if (data.category === '사법뉴스' || data.title?.includes('[사법뉴스]')) {
            newsPosts.push(post);
        } else {
            blogPosts.push(post);
        }
    });

    console.log(`=== 블로그 글 (사법뉴스 제외): ${blogPosts.length}개 ===`);
    blogPosts.forEach(p => console.log(`[${p.date}] ${p.category || 'N/A'} - ${p.title}`));

    console.log(`\n=== 사법뉴스: ${newsPosts.length}개 ===`);
    newsPosts.forEach(p => console.log(`[${p.date}] ${p.title}`));

    process.exit(0);
}

checkPosts().catch(e => { console.error(e); process.exit(1); });
