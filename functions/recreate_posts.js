/**
 * 블로그 글을 날짜 순서대로 재생성
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 블로그 글 목록 (오래된 것부터)
const BLOG_POSTS = [
    {
        title: "독점이 낳은 두개의 재앙",
        date: "2025-08-08",
        imageUrl: "/독점이 낳은 두개의 재앙.png"
    },
    {
        title: "주권자에 의한 시민법관 참심제",
        date: "2025-12-12",
        imageUrl: "/주권자에의한시민법관참심제.png"
    },
    {
        title: "법은 통치자의 검",
        date: "2025-12-22",
        imageUrl: "/법은 통치자의 검.png"
    },
    {
        title: "엘리트들의 DNA와 민주주의",
        date: "2026-01-02",
        imageUrl: "/엘리트들의DNA와 민주주의.png"
    },
    {
        title: "대학제도, 헌법재판소에 묻자!",
        date: "2026-01-16",
        imageUrl: "/대학제도, 헌법재판소에 묻자!.png"
    },
    {
        title: "법해석독점권이 낳은 재앙",
        date: "2026-01-28",
        imageUrl: "/법해석독점권이 낳은재앙.png"
    },
    {
        title: "모든 권력은 국민으로부터 나온다",
        date: "2026-02-05",
        imageUrl: "/모든권력은국민으로부터나온다.png"
    }
];

async function recreatePosts() {
    console.log('===========================================');
    console.log('블로그 글 재생성 시작');
    console.log('===========================================\n');

    // 1. 기존 블로그 글 삭제 (사법뉴스 제외)
    console.log('1. 기존 블로그 글 삭제 중...');
    const snapshot = await db.collection('posts').get();
    let deletedCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.category !== '사법뉴스') {
            await db.collection('posts').doc(doc.id).delete();
            console.log(`   삭제: ${data.title}`);
            deletedCount++;
        }
    }
    console.log(`   ${deletedCount}개 삭제 완료\n`);

    // 2. 새 블로그 글 생성 (오래된 것부터 순서대로)
    console.log('2. 새 블로그 글 생성 중...');

    for (let i = 0; i < BLOG_POSTS.length; i++) {
        const post = BLOG_POSTS[i];
        const createdAt = new Date(post.date + 'T09:00:00+09:00'); // 한국시간 오전 9시

        // 약간의 시간 차이를 두어 순서 보장
        createdAt.setMinutes(i);

        await db.collection('posts').add({
            title: post.title,
            content: '<p>내용을 입력해주세요.</p>',
            summary: '요약을 입력해주세요.',
            author: '시민법정',
            category: '참심제 소개',
            imageUrl: post.imageUrl,
            likes: 0,
            createdAt: admin.firestore.Timestamp.fromDate(createdAt)
        });

        console.log(`   생성: ${post.title} (${post.date})`);
    }

    console.log('\n===========================================');
    console.log('완료! 총 7개 블로그 글 생성됨');
    console.log('가장 최신 글(모든 권력은 국민으로부터 나온다)이 맨 위에 표시됩니다.');
    console.log('===========================================');

    process.exit(0);
}

recreatePosts().catch(error => {
    console.error('오류:', error);
    process.exit(1);
});
