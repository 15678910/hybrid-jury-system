// 김건희 Firestore 항소심 결과 반영 (2026.04.28 서울고법 형사15-2부)
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function fix() {
    const docRef = db.collection('sentencingData').doc('김건희');
    const doc = await docRef.get();
    if (!doc.exists) { console.log('NO DOC'); process.exit(1); }

    const updated = {
        verdict: '항소심 징역 4년 (벌금 5천만원, 추징금 2,094만원) — 1심 1년 8개월에서 가중',
        verdictDate: '2026.04.28',
        trialStatus: '항소심 선고 완료 (서울고법 형사15-2부) — 상고심 진행 가능',
        appealVerdict: {
            date: '2026.04.28',
            court: '서울고법 형사15-2부',
            sentence: '징역 4년 + 벌금 5,000만원 + 추징금 2,094만원',
            firstSentence: '징역 1년 8개월',
            change: '대폭 가중 (1년 8개월 → 4년)',
            details: [
                '도이치모터스 주가조작: 1심 무죄 → 항소심 일부 유죄 (판단 뒤집음)',
                '통일교 금품수수: 1심 일부 유죄 → 항소심 전부 유죄 (확대)',
                '정치자금법 위반: 무죄 유지',
                '그라프 목걸이(약 6,220만원 상당) 몰수'
            ]
        },
        charges: [
            {
                id: 1,
                name: '자본시장법 위반',
                verdict: '항소심 일부 유죄 (1심 무죄 뒤집음)',
                sentence: null,
                law: '자본시장법'
            },
            {
                id: 2,
                name: '정치자금법 위반',
                verdict: '무죄 유지 (1심·항소심 동일)',
                sentence: null,
                law: '정치자금법'
            },
            {
                id: 3,
                name: '특정범죄가중처벌법 알선수재',
                verdict: '항소심 전부 유죄 (1심 일부 유죄에서 확대)',
                sentence: '항소심 형량에 반영',
                law: '특정범죄가중처벌법'
            },
            {
                id: 4,
                name: '도이치모터스 주가조작',
                verdict: '항소심 일부 유죄 (1심 무죄 뒤집음)',
                sentence: null,
                law: '자본시장법 위반'
            },
            {
                id: 5,
                name: '통일교 금품수수',
                verdict: '항소심 전부 유죄 (1심 일부 유죄에서 확대)',
                sentence: '항소심 형량에 반영',
                law: '특정범죄가중처벌법 알선수재'
            },
            {
                id: 6,
                name: '공천개입',
                verdict: '무죄 유지',
                sentence: null,
                law: '공직선거법'
            }
        ],
        keyFacts: [
            '대한민국 역사상 최초로 영부인 실형 선고 (1심 1년 8개월 → 항소심 4년)',
            '항소심에서 도이치모터스 주가조작 일부 유죄 (1심 무죄 뒤집음)',
            '통일교 금품수수 1심 일부 유죄 → 항소심 전부 유죄 확대',
            '정치자금법 무죄 유지로 윤석열 당선무효 차단 효과 지속',
            '그라프 목걸이(약 6,220만원) 몰수 결정',
            '서울고법 형사15-2부 (2026.04.28)'
        ],
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await docRef.update(updated);
    console.log('✅ 김건희 항소심 데이터 Firestore 업데이트 완료');

    // 검증
    const after = (await docRef.get()).data();
    console.log('\n=== 수정 후 ===');
    console.log('verdict:', after.verdict);
    console.log('verdictDate:', after.verdictDate);
    console.log('trialStatus:', after.trialStatus);
    after.charges.forEach((c, i) => console.log((i + 1) + '.', c.name, '|', c.verdict));
    process.exit(0);
}

fix().catch(err => { console.error(err); process.exit(1); });
