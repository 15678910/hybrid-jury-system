/**
 * 김태효 sentencingData 오염 문서 삭제 (일회성)
 * - keyFacts가 양문석 사건으로 오염 + claudePrediction이 영장청구 이전 stale 상태
 * - 삭제 시 SentencingAnalysis가 정적(뉴스검증) 데이터로 폴백함
 * 사용법: node delete_kimtaehyo_sentencingdata.cjs          (확인만)
 *        node delete_kimtaehyo_sentencingdata.cjs --commit  (삭제)
 */
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const COMMIT = process.argv.includes('--commit');
const DOC_ID = '김태효';

async function main() {
    const ref = db.collection('sentencingData').doc(DOC_ID);
    const snap = await ref.get();
    if (!snap.exists) {
        console.log(`sentencingData/${DOC_ID} 문서 없음 (이미 삭제되었거나 미존재)`);
        process.exit(0);
    }
    const d = snap.data();
    console.log(`대상 문서: sentencingData/${DOC_ID}`);
    console.log('name:', d.name, '| position:', d.position, '| status:', d.status);
    console.log('오염된 keyFacts:', JSON.stringify(d.keyFacts));
    if (COMMIT) {
        await ref.delete();
        console.log(`\n✅ 삭제 완료: sentencingData/${DOC_ID}`);
    } else {
        console.log('\n(확인 모드) 실제 삭제하려면 --commit 추가');
    }
    process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
