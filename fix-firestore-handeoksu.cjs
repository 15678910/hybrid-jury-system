const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function fixHandeoksu() {
  const docRef = db.collection('sentencingData').doc('한덕수');

  // 현재 오염된 데이터 확인
  const doc = await docRef.get();
  if (!doc.exists) {
    console.log('한덕수 문서가 존재하지 않습니다.');
    process.exit(1);
  }

  const currentData = doc.data();
  console.log('=== 수정 전 (오염된 데이터) ===');
  console.log('verdict:', currentData.verdict);
  console.log('keyFacts:', JSON.stringify(currentData.keyFacts));
  console.log('charges:', JSON.stringify(currentData.charges));
  console.log('');

  // 정확한 한덕수 데이터로 수정
  const correctData = {
    verdict: '징역 23년, 법정구속',
    verdictDate: '2026년 1월 21일',
    trialStatus: '1심 선고 완료, 쌍방 항소',
    keyFacts: [
      '12.3 내란 관련 첫 판결 - 내란죄 법원 첫 판단',
      '구형(15년)보다 8년 높은 징역 23년 선고',
      '전직 국무총리 법정구속 헌정사상 최초',
      '한덕수 측·특검 모두 항소 (쌍방 항소)'
    ],
    charges: [
      {
        name: '내란우두머리방조',
        law: '형법 제87조, 제32조',
        verdict: '무죄',
        sentence: '무죄 - 내란죄는 필요적 공동정범으로 방조 성립 불가'
      },
      {
        name: '내란중요임무종사',
        law: '형법 제87조',
        verdict: '유죄',
        sentence: '징역 23년 - 국무총리로서 헌법 수호 책임 불이행'
      },
      {
        name: '허위공문서 작성',
        law: '형법 제227조',
        verdict: '유죄',
        sentence: '포함 구형'
      },
      {
        name: '대통령기록물법 위반',
        law: '대통령기록물법',
        verdict: '유죄',
        sentence: '포함 구형'
      },
      {
        name: '위증',
        law: '형법 제152조',
        verdict: '유죄',
        sentence: '포함 구형'
      }
    ],
    lastUpdated: new Date().toISOString()
  };

  await docRef.update(correctData);

  // 수정 확인
  const updatedDoc = await docRef.get();
  const updatedData = updatedDoc.data();
  console.log('=== 수정 후 (정확한 데이터) ===');
  console.log('verdict:', updatedData.verdict);
  console.log('verdictDate:', updatedData.verdictDate);
  console.log('trialStatus:', updatedData.trialStatus);
  console.log('keyFacts:', JSON.stringify(updatedData.keyFacts));
  console.log('charges count:', updatedData.charges?.length);
  updatedData.charges.forEach(c => console.log('  charge:', c.name, '| verdict:', c.verdict));

  console.log('\n✅ 한덕수 Firestore 데이터 수정 완료!');
  process.exit(0);
}

fixHandeoksu().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
