const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function fix() {
  const docRef = db.collection('sentencingData').doc('이상민');
  const doc = await docRef.get();
  if (!doc.exists) { console.log('문서 없음'); process.exit(1); }

  const data = doc.data();
  const cp = data.claudePrediction;

  if (!cp) { console.log('claudePrediction 없음'); process.exit(1); }

  console.log('=== 수정 전 ===');
  console.log('검찰:', cp.judicialIntegrity?.integrityScore?.prosecution);
  console.log('재판부:', cp.judicialIntegrity?.integrityScore?.judiciary);
  console.log('종합:', cp.judicialIntegrity?.integrityScore?.overall);

  cp.judicialIntegrity = {
    omittedEvidence: cp.judicialIntegrity?.omittedEvidence || [],
    integrityScore: {
      prosecution: 40,
      judiciary: 35,
      overall: 38,
      reasoning: '행안부 장관은 경찰·소방 등 치안 조직을 관할하는 핵심 국무위원으로, 내란 시 이를 저지할 헌법적 의무가 있음에도 오히려 가담했다. 특검 구형 15년 대비 47%인 징역 7년은 내란중요임무종사자의 법리적 책임과 국민의 법감정에 비추어 지나치게 관대하며, 검찰의 가담 범위 특정도 미흡하다.'
    },
    prosecutorialIssues: [
      {
        title: '행안부 장관 내란 가담 범위 특정 미흡',
        description: '행정안전부 장관은 경찰·소방을 관할하는 치안 핵심 부처의 수장임에도, 특검이 가담 행위를 언론사 단전·단수 지시 전달로 좁게 특정. 경찰력 동원 과정에서의 역할, 내란 인지 후 불작위 등이 충분히 규명되지 않음.',
        severity: 'major',
        impact: '재판부의 감경 판단에 빌미를 제공'
      },
      {
        title: '내란중요임무종사 법리에서 장관급 책임론 부족',
        description: '내란중요임무종사의 "중요임무"에 행안부 장관의 치안 조직 관할 책임이 어떻게 가중되는지에 대한 법리적 주장이 불충분. 한덕수(국무총리)와 동일한 15년 구형도 직위별 차별화 논리 부족.',
        severity: 'critical',
        impact: '동일 구형 15년이나 한덕수 23년 vs 이상민 7년이라는 극단적 격차 초래'
      }
    ],
    judicialIssues: [
      {
        title: '내란중요임무종사 법리해석의 관대함',
        description: '재판부는 이상민의 가담을 "지시 전달" 수준으로 한정 해석하여 직접 실행행위가 아닌 점을 과도하게 감경. 그러나 행안부 장관은 치안 조직의 수장으로서 내란을 저지할 직접적 책임이 있는 직위이며, 불작위 자체가 내란 가담에 해당할 수 있다.',
        severity: 'critical',
        impact: '내란중요임무종사의 "중요임무" 해석이 지나치게 협소'
      },
      {
        title: '구형 대비 47% 선고와 국민의 법감정 괴리',
        description: '특검 구형 15년 대비 47%인 7년 선고는 내란이라는 중대 범죄에 대한 국민의 법감정과 현저히 괴리. 한덕수(구형의 153%)와 비교하면 동일 내란 사건에서 재판부 간 양형 기준이 극단적으로 불일치.',
        severity: 'critical',
        impact: '사법부 내 양형 일관성에 대한 심각한 의문 제기'
      }
    ]
  };

  await docRef.update({ claudePrediction: cp });

  const updated = await docRef.get();
  const ji = updated.data().claudePrediction.judicialIntegrity;
  console.log('\n=== 수정 후 ===');
  console.log('검찰:', ji.integrityScore.prosecution);
  console.log('재판부:', ji.integrityScore.judiciary);
  console.log('종합:', ji.integrityScore.overall);
  console.log('검찰 이슈:', ji.prosecutorialIssues.length + '건');
  console.log('재판부 이슈:', ji.judicialIssues.length + '건');
  console.log('\n✅ 이상민 사법정의 평가 수정 완료!');
  process.exit(0);
}
fix().catch(err => { console.error(err); process.exit(1); });
