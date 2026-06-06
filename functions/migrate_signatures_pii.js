/**
 * 서명자 PII 분리 마이그레이션 (C-1)
 *
 * 목적: 기존 signatures 문서에 평문으로 저장된 PII(phone/email/address 등)를
 *       비공개 컬렉션 signature_private/{id}로 이동하고, 공개 signatures에서 제거.
 *
 * 배경: signatures가 `allow read: if true`라 누구나 전화번호를 추출할 수 있었음(CRITICAL).
 *       공개 signatures에는 이름/구분/재능/SNS/타임스탬프만 남기고, PII는 admin SDK로만
 *       접근 가능한 signature_private로 분리한다.
 *
 * 안전: 멱등(idempotent) — phone이 없는 문서는 이미 마이그레이션된 것으로 보고 스킵.
 *       반드시 backup_firestore.js 실행 후 사용할 것.
 *
 * 사용법: node functions/migrate_signatures_pii.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const PII_FIELDS = ['phone', 'email', 'address', 'userId', 'loginMethod', 'userEmail', 'consents'];

async function migrate() {
    const snap = await db.collection('signatures').get();
    console.log(`총 signatures 문서: ${snap.size}개\n`);

    let migrated = 0;
    let skipped = 0;

    for (const docSnap of snap.docs) {
        const data = docSnap.data();

        // phone이 없으면 이미 마이그레이션됨 (멱등성)
        if (!data.phone) {
            skipped++;
            continue;
        }

        // PII를 signature_private로 복사
        const privateData = {};
        for (const f of PII_FIELDS) {
            if (data[f] !== undefined) privateData[f] = data[f];
        }

        // signatures에서 PII 필드 제거
        const deletions = {};
        for (const f of PII_FIELDS) {
            if (data[f] !== undefined) deletions[f] = admin.firestore.FieldValue.delete();
        }

        const batch = db.batch();
        batch.set(db.collection('signature_private').doc(docSnap.id), privateData, { merge: true });
        batch.update(db.collection('signatures').doc(docSnap.id), deletions);
        await batch.commit();

        migrated++;
        console.log(`  ✓ ${docSnap.id} (${data.name || '?'}) — PII ${Object.keys(privateData).length}개 이동`);
    }

    console.log(`\n===========================================`);
    console.log(`마이그레이션 완료: ${migrated}개 이동, ${skipped}개 스킵(이미 처리됨)`);
    console.log(`===========================================`);

    // 검증: signatures에 phone이 남아있는지
    const verifySnap = await db.collection('signatures').where('phone', '!=', null).get();
    if (verifySnap.empty) {
        console.log('✅ 검증 통과: signatures에 phone이 남아있지 않음');
    } else {
        console.error(`⚠️ 경고: signatures에 phone이 남은 문서 ${verifySnap.size}개`);
    }
}

migrate()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ 마이그레이션 오류:', err);
        process.exit(1);
    });
