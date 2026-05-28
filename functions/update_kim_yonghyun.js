/**
 * 김용현 sentencingData 문서 부분 업데이트
 *
 * 목적: keyFacts와 trialStatus를 비워서 정적 데이터의 새 정보(2026.5.14 기피신청 등)가
 *      페이지에서 폴백 표시되도록 함.
 *
 * 변경 내역:
 *   - keyFacts: 3개 항목 (부정확) → [] (빈 배열) → 정적 데이터 사용
 *   - trialStatus: '항소심 진행 중' → '' (빈 문자열) → 정적 데이터 사용
 *
 * 보존되는 필드: verdict('징역 30년'), summary, aiPrediction, claudePrediction,
 *               recentNews, charges, judgeHistory, verdictDate, lastUpdated 등
 *
 * 사용법: node functions/update_kim_yonghyun.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function updateKimYonghyun() {
    const docRef = db.collection('sentencingData').doc('김용현');

    const snap = await docRef.get();
    if (!snap.exists) {
        console.error('❌ 김용현 문서 없음');
        process.exit(1);
    }

    const before = snap.data();
    console.log('===== 업데이트 전 =====');
    console.log('keyFacts:', JSON.stringify(before.keyFacts, null, 2));
    console.log('trialStatus:', before.trialStatus);

    await docRef.update({
        keyFacts: [],
        trialStatus: '',
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });

    const after = (await docRef.get()).data();
    console.log('\n===== 업데이트 후 =====');
    console.log('keyFacts:', JSON.stringify(after.keyFacts));
    console.log('trialStatus:', JSON.stringify(after.trialStatus));
    console.log('\n✅ 업데이트 완료. 정적 데이터의 새 keyFacts가 표시될 것입니다.');
    process.exit(0);
}

updateKimYonghyun().catch(err => {
    console.error('❌ 오류:', err);
    process.exit(1);
});
