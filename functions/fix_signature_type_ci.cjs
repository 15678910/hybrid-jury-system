// 서명 구분(type) 바로잡기 — GitHub Actions 「서명 구분 수정 (수동)」 전용 (2026-10-20).
// 사용: node functions/fix_signature_type_ci.cjs <docId> <expectedName> <fromType> <toType>   (저장소 루트에서)
// 배경: 개인이 「단체」로 잘못 등록돼 메인 화면 「실시간 참가 현황」의 단체 목록에 개인 이름이 올라왔다.
// 안전장치: ① 워크플로가 이 스크립트 전에 Firestore 전체 백업을 받는다 ② 문서의 name·type 이 인자와 정확히 같을 때만 고친다
//           ③ type 한 필드만 update 한다 — 삭제·재생성 없음(ID 유지). 비공개 signature_private 는 건드리지 않는다.
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const serviceAccount = require(path.join(ROOT, 'serviceAccountKey.json'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const ALLOWED = ['individual', 'organization'];

async function main() {
    const [docId, expectedName, fromType, toType] = process.argv.slice(2);
    if (!docId || !expectedName || !fromType || !toType) throw new Error('인자: <docId> <expectedName> <fromType> <toType>');
    if (!ALLOWED.includes(fromType) || !ALLOWED.includes(toType)) throw new Error('type 은 individual / organization 만 허용');
    if (fromType === toType) throw new Error('fromType 과 toType 이 같습니다');

    const db = admin.firestore();
    const ref = db.collection('signatures').doc(docId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('서명 문서가 없습니다: ' + docId);
    const cur = snap.data();
    const curName = String(cur.name || '').trim();
    if (curName !== expectedName.trim()) throw new Error(`이름이 다릅니다 (문서: ${curName} / 인자: ${expectedName}) — 다른 문서를 가리키는지 확인하세요`);
    if (cur.type !== fromType) throw new Error(`지금 type 이 ${cur.type} 이라 ${fromType} 이 아닙니다 — 이미 고쳐졌거나 다른 문서입니다. 멈춥니다.`);

    await ref.update({ type: toType });

    const before = (await db.collection('signatures').where('type', '==', fromType).get()).size;
    const after = (await db.collection('signatures').where('type', '==', toType).get()).size;
    const msg = `서명 구분 수정 완료 id=${docId} name=${curName} ${fromType} → ${toType} · 현재 ${fromType} ${before}건 / ${toType} ${after}건`;
    console.log(msg);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### ${msg}\n`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
