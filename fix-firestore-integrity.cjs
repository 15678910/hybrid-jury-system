const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function fix() {
  const docRef = db.collection('sentencingData').doc('한덕수');
  const doc = await docRef.get();
  if (!doc.exists) { console.log('문서 없음'); process.exit(1); }

  const data = doc.data();
  const cp = data.claudePrediction;

  // judicialIntegrity 점수 및 내용 수정
  cp.judicialIntegrity = {
    omittedEvidence: [],
    integrityScore: {
      prosecution: 40,
      judiciary: 75,
      overall: 60,
      reasoning: '재판부는 내란우두머리방조 혐의에 대해 "내란죄는 필요적 공동정범이므로 방조범이 성립할 수 없다"는 독자적 법리를 제시하여 공소장 변경을 유도하고, 12·3 비상계엄을 법원 최초로 "내란"으로 규정한 역사적 판결을 내렸다. 검찰의 보수적 구형(15년)을 독립적으로 판단하여 국무총리의 헌법적 책임에 상응하는 23년을 선고했으나, 검찰의 공소사실 구성과 양형 판단에 심각한 문제가 있다.'
    },
    prosecutorialIssues: [
      {
        title: '내란우두머리방조 혐의 적용의 법리적 오류',
        description: '특검은 한덕수에게 내란우두머리방조 혐의를 적용했으나, 재판부가 내란죄는 필요적 공동정범이므로 방조범 성립 불가라는 법리를 제시. 특검이 이를 수용하여 내란중요임무종사로 공소장 변경.',
        severity: 'critical',
        impact: '검찰의 공소사실 구성 능력에 대한 근본적 의문'
      },
      {
        title: '국무총리 역할의 양형 반영 심각 부족',
        description: '국무총리는 대통령 유고 시 권한대행을 맡는 헌법상 제2인자임에도, 특검은 내란 가담자들과의 관계 등을 고려해 징역 15년만 구형. 헌법적 직위의 중대성을 현저히 과소평가.',
        severity: 'critical',
        impact: '재판부가 독립적 판단으로 구형을 대폭 초과하는 23년 선고 불가피'
      }
    ],
    judicialIssues: [
      {
        title: '내란 첫 판결의 역사적 법리 확립',
        description: '12·3 비상계엄을 "국헌문란 목적의 내란"으로 최초 규정하고, 필요적 공동정범에서 방조범 불성립이라는 중요한 법리적 선례를 수립. 이후 내란 재판의 기준점 역할.',
        severity: 'minor',
        impact: '법리 해석과 국민의 법 감정을 균형있게 반영한 판단'
      },
      {
        title: '구형 초과 선고의 양형 형평성 논란',
        description: '다른 피고인들이 구형의 50~70%를 선고받은 것에 비해 한덕수만 153%. 국무총리 직위의 가중이 합리적이라는 평가와 양형 일관성 우려가 병존.',
        severity: 'minor',
        impact: '검찰의 과소 구형에 대한 사법부의 독립적 교정으로 해석 가능'
      }
    ]
  };

  await docRef.update({ claudePrediction: cp });

  // 검증
  const updated = await docRef.get();
  const ji = updated.data().claudePrediction.judicialIntegrity;
  console.log('=== 수정 후 judicialIntegrity ===');
  console.log('검찰:', ji.integrityScore.prosecution);
  console.log('재판부:', ji.integrityScore.judiciary);
  console.log('종합:', ji.integrityScore.overall);
  console.log('검찰 이슈:', ji.prosecutorialIssues.length + '건');
  console.log('재판부 이슈:', ji.judicialIssues.length + '건');
  console.log('\n✅ 한덕수 사법정의 평가 수정 완료!');
  process.exit(0);
}
fix().catch(err => { console.error(err); process.exit(1); });
