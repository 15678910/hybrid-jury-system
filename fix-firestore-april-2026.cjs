// 2026.04 항소심/구형 데이터 Firestore 일괄 업데이트
// - 윤석열 (2026.04.29 항소심 징역 7년)
// - 박성재 (2026.04.27 특검 징역 20년 구형, 선고 2026.06.09 예정)
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function updateYoon() {
    const docRef = db.collection('sentencingData').doc('윤석열');
    await docRef.update({
        verdict: '체포방해 항소심 징역 7년 (1심 5년에서 2년 가중) + 내란수괴 1심 무기징역 (2026.02.19)',
        verdictDate: '2026.04.29',
        trialStatus: '체포방해 항소심 선고 완료 (서울고법 형사1부) + 내란수괴 1심 (대법원 진행)',
        appealVerdict: {
            date: '2026.04.29',
            court: '서울고법 형사1부',
            judge: '윤성식 부장판사',
            sentence: '징역 7년 (체포방해, 직권남용, 허위공문서 작성 등)',
            firstSentence: '징역 5년 (1심)',
            change: '1심 5년 → 항소심 7년 (2년 증가)',
            details: [
                '1심: 체포방해 등 징역 5년 (2026.01.16)',
                '항소심: 1심보다 2년 가중된 징역 7년 (2026.04.29)',
                '특검 구형: 징역 10년',
                '재판부: "현직 대통령으로서 헌법을 준수하고 국가를 보위하며 국민의 자유와 권리를 증진해야 할 막중한 책임을 부담했음에도, 사회적 혼란을 더욱 가중하는 등 대통령으로서의 책무를 저버린 것으로 볼 수밖에 없다"',
                '변호인단: "대법원에서 치열하게 다툴 것" — 상고 진행'
            ]
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ 윤석열 항소심 데이터 업데이트 완료');
}

async function updatePark() {
    const docRef = db.collection('sentencingData').doc('박성재');
    await docRef.update({
        verdict: '특검 징역 20년 구형 (2026.04.27) — 선고 예정',
        verdictDate: null,
        trialStatus: '1심 결심 완료, 선고 예정 (2026.06.09 오후 2시)',
        prosecutionFinalRequest: {
            date: '2026.04.27',
            court: '서울중앙지법',
            sentence: '징역 20년',
            details: [
                '특검 (조은석): 위법한 계엄을 합법처럼 보이도록 법기술적 아이디어 제공',
                '특검: "국무회의 직후 참석자 명단 작성과 서명을 언급해 사후적으로 합법성을 갖추도록 함"',
                '박성재 최후진술: "그 상황을 막지 못하고 대통령 설득에 실패한 데 대해 많은 책임감을 느끼고 있다. 국민께 충격과 실망을 드려 대단히 죄송하다"',
                '선고 예정일: 2026.06.09 오후 2시'
            ]
        },
        keyFacts: [
            '비상계엄 당시 법무부 장관, 내란중요임무종사 혐의 기소 (2025.12.11)',
            '12.4 안가회동(삼청동 안전가옥) 참석 — 계엄 사후 수습 논의',
            '구치소 수용 확보: 체포 대상자 수용 지시 의혹',
            '특검 징역 20년 구형 (2026.04.27)',
            '최후진술에서 눈물 흘리며 사죄: "대통령 설득 실패에 책임감"',
            '선고 예정: 2026.06.09 오후 2시'
        ],
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ 박성재 구형 데이터 업데이트 완료');
}

(async () => {
    try {
        await updateYoon();
        await updatePark();
        console.log('\n=== 모든 업데이트 완료 ===');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
