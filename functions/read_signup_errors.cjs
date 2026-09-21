// 서명 절차 실패 진단 로그 조회 (admin SDK 전용, 읽기만). 사용: cd functions && node read_signup_errors.cjs [개수]
// 컬렉션 signup_errors: { stage: 'sms_send'|'sms_verify'|'save', code, message, ua, inApp, createdAt } — 개인정보 없음
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('../serviceAccountKey.json')) });
const n = Number(process.argv[2] || 30);
(async () => {
    const snap = await admin.firestore().collection('signup_errors').orderBy('createdAt', 'desc').limit(n).get();
    console.log(`signup_errors 최근 ${snap.size}건`);
    snap.forEach((d) => {
        const x = d.data();
        const t = x.createdAt && x.createdAt.toDate ? x.createdAt.toDate().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '';
        console.log(`${t} | ${x.stage} | ${x.code} | inApp=${x.inApp} | ${String(x.message).slice(0, 120)} | ${String(x.ua).slice(0, 90)}`);
    });
    process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
