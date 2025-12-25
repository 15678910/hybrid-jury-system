// Firebase 데이터 수정 스크립트
// 1. "정영훈, 촛불•빛혁명완성연대" → "정영훈"으로 수정
// 2. "촛불•빛혁명완성연대" 단체 문서 새로 추가

const admin = require('firebase-admin');

// 서비스 계정 키 파일 경로 (Firebase Console에서 다운로드)
// 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixData() {
    try {
        // 1. 기존 문서 수정: "정영훈, 촛불•빛혁명완성연대" → "정영훈"
        const docId = 'r963eTwmBHTe3N0SVCrQ';
        await db.collection('signatures').doc(docId).update({
            name: '정영훈'
        });
        console.log('✅ 정영훈 문서 수정 완료');

        // 2. 새 단체 문서 추가: 촛불•빛혁명완성연대
        const newDoc = await db.collection('signatures').add({
            name: '촛불•빛혁명완성연대',
            type: 'organization',
            phone: '',
            address: '',
            talent: '',
            timestamp: new Date('2025-12-22T13:00:00.000Z')
        });
        console.log('✅ 촛불•빛혁명완성연대 단체 추가 완료, ID:', newDoc.id);

        console.log('\n🎉 모든 작업 완료!');
        process.exit(0);
    } catch (error) {
        console.error('❌ 오류 발생:', error);
        process.exit(1);
    }
}

fixData();
