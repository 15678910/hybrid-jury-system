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

async function backupCollection(collectionName) {
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

    // 컬렉션 목록을 동적으로 조회 (하드코딩 제거)
    console.log('Discovering collections...');
    const collectionRefs = await db.listCollections();
    const collectionNames = collectionRefs.map(c => c.id).sort();
    console.log(`Found ${collectionNames.length} collections: ${collectionNames.join(', ')}\n`);

    if (collectionNames.length === 0) {
        console.error('FATAL: No collections found. Aborting backup.');
        process.exit(1);
    }

    const backupData = {
        timestamp: new Date().toISOString(),
        collections: {}
    };

    let totalDocs = 0;
    const failed = [];

    for (const collectionName of collectionNames) {
        try {
            const result = await backupCollection(collectionName);
            backupData.collections[collectionName] = result.data;
            totalDocs += result.count;
        } catch (error) {
            console.error(`  [${collectionName}] FAILED: ${error.message}`);
            failed.push({ name: collectionName, error: error.message });
        }
    }

    const filename = `firestore_backup_${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    console.log('\n===========================================');
    console.log('Backup Summary');
    console.log('===========================================');
    console.log(`Collections processed: ${collectionNames.length}`);
    console.log(`Collections failed:    ${failed.length}`);
    console.log(`Total documents:       ${totalDocs}`);

    // 어떤 컬렉션이라도 실패하면 백업 실패로 처리 (부분 백업 방지)
    if (failed.length > 0) {
        console.error('\nFAILED collections:');
        failed.forEach(f => console.error(`  - ${f.name}: ${f.error}`));
        console.error('\nFATAL: Backup aborted due to collection failures.');
        console.error('No backup file written.');
        process.exit(1);
    }

    // 0건 백업도 비정상으로 처리
    if (totalDocs === 0) {
        console.error('\nFATAL: Backup contains 0 documents. This is almost certainly an error.');
        console.error('No backup file written.');
        process.exit(1);
    }

    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2), 'utf8');

    console.log(`\nBackup file written: ${filepath}`);
    console.log(`File size: ${(fs.statSync(filepath).size / 1024).toFixed(1)} KB`);
    console.log('===========================================');

    process.exit(0);
}

backup().catch(error => {
    console.error('Backup failed:', error);
    process.exit(1);
});