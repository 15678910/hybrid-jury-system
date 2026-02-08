/**
 * Firestore 데이터 백업 스크립트
 * 사용법: node backup_firestore.js
 *
 * 모든 컬렉션을 JSON 파일로 백업합니다.
 * 백업 파일은 backups/ 폴더에 저장됩니다.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase 초기화
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 백업할 컬렉션 목록
const COLLECTIONS_TO_BACKUP = [
    'posts',           // 블로그 글, 사법뉴스
    'writerCodes',     // 작성자 코드
    'signatures',      // 서명
    'videos',          // 동영상
    'governance',      // 거버넌스
    'cardNews',        // 카드뉴스
    'judges',          // 판사 정보
    'evaluations'      // 판사 평가
];

async function backupCollection(collectionName) {
    try {
        const snapshot = await db.collection(collectionName).get();

        if (snapshot.empty) {
            console.log(`  [${collectionName}] 비어있음`);
            return { name: collectionName, count: 0, data: [] };
        }

        const data = [];
        snapshot.forEach(doc => {
            const docData = doc.data();
            // Timestamp를 ISO 문자열로 변환
            Object.keys(docData).forEach(key => {
                if (docData[key] && docData[key].toDate) {
                    docData[key] = docData[key].toDate().toISOString();
                }
            });
            data.push({
                id: doc.id,
                ...docData
            });
        });

        console.log(`  [${collectionName}] ${data.length}개 문서`);
        return { name: collectionName, count: data.length, data };
    } catch (error) {
        console.error(`  [${collectionName}] 오류:`, error.message);
        return { name: collectionName, count: 0, data: [], error: error.message };
    }
}

async function backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = path.join(__dirname, '..', 'backups');

    // backups 폴더 생성
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log('===========================================');
    console.log('Firestore 백업 시작:', new Date().toLocaleString('ko-KR'));
    console.log('===========================================\n');

    const backupData = {
        timestamp: new Date().toISOString(),
        collections: {}
    };

    let totalDocs = 0;

    for (const collectionName of COLLECTIONS_TO_BACKUP) {
        const result = await backupCollection(collectionName);
        backupData.collections[collectionName] = result.data;
        totalDocs += result.count;
    }

    // JSON 파일로 저장
    const filename = `firestore_backup_${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2), 'utf8');

    console.log('\n===========================================');
    console.log('백업 완료!');
    console.log(`총 문서 수: ${totalDocs}개`);
    console.log(`파일: ${filepath}`);
    console.log('===========================================');

    process.exit(0);
}

backup().catch(error => {
    console.error('백업 실패:', error);
    process.exit(1);
});
