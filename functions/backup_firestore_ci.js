/**
 * Firestore 데이터 백업 스크립트 (CI/GitHub Actions용)
 *
 * GitHub Actions에서 실행될 때 사용됩니다.
 * serviceAccountKey.json이 프로젝트 루트에 있어야 합니다.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase 초기화 (CI 환경: 루트에서 키 파일 읽기)
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error('Error: serviceAccountKey.json not found at', serviceAccountPath);
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 백업할 컬렉션 목록
const COLLECTIONS_TO_BACKUP = [
    'posts',
    'writerCodes',
    'signatures',
    'videos',
    'governance',
    'cardNews',
    'judges',
    'evaluations'
];

async function backupCollection(collectionName) {
    try {
        const snapshot = await db.collection(collectionName).get();

        if (snapshot.empty) {
            console.log(`  [${collectionName}] empty`);
            return { name: collectionName, count: 0, data: [] };
        }

        const data = [];
        snapshot.forEach(doc => {
            const docData = doc.data();
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

        console.log(`  [${collectionName}] ${data.length} documents`);
        return { name: collectionName, count: data.length, data };
    } catch (error) {
        console.error(`  [${collectionName}] error:`, error.message);
        return { name: collectionName, count: 0, data: [], error: error.message };
    }
}

async function backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = path.join(__dirname, '..', 'backups');

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log('===========================================');
    console.log('Firestore Backup Started:', new Date().toISOString());
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

    const filename = `firestore_backup_${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2), 'utf8');

    console.log('\n===========================================');
    console.log('Backup Complete!');
    console.log(`Total documents: ${totalDocs}`);
    console.log(`File: ${filepath}`);
    console.log('===========================================');

    process.exit(0);
}

backup().catch(error => {
    console.error('Backup failed:', error);
    process.exit(1);
});
