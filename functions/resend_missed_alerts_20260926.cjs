// 일회성(2026-09-26, 사용자 승인): 봇 토큰 교체 뒤 옛 토큰으로 남아 있던 함수들의 텔레그램 전송이 401 로 실패해 빠진 알림 3건을 재전송.
// 원래 형식(autoCollectNews / notifyNewPostToTelegram)을 따르고 맨 앞에 「지연 알림」 표시만 붙인다. 토큰·채팅 ID 는 .env 에서 읽고 출력하지 않는다.
const fs = require('fs');
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('../serviceAccountKey.json')) });
const env = Object.fromEntries(fs.readFileSync(__dirname + '/.env', 'utf8').split(/\r?\n/).filter(l => /^[A-Z_]+=/.test(l)).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')]; }));
const TOKEN = env.TELEGRAM_BOT_TOKEN;
const CHAT = env.TELEGRAM_GROUP_CHAT_ID || '-1003615735371';

async function send(text, options) {
    const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: CHAT, text, ...options }) });
    const j = await r.json();
    console.log(j.ok ? `sent message_id=${j.result.message_id}` : `FAILED ${j.error_code} ${j.description}`);
    return j.ok;
}

(async () => {
    const db = admin.firestore();
    const note = '🔁 지연 알림 (봇 점검으로 전송이 늦어졌습니다)\n\n';
    // 사법뉴스 2건 — autoCollectNews 형식(HTML)
    for (const id of ['MVdvIVAsnUpdN2GYzQOV', '6IefEdlKe8GlPilmWUvi']) {
        const p = (await db.collection('posts').doc(id).get()).data();
        await send(`${note}📰 <b>${p.title}</b>\n\n👉 https://siminbupjung-blog.web.app/blog/${id}`, { parse_mode: 'HTML' });
    }
    // 칼럼 새 글 1건 — notifyNewPostToTelegram 형식(평문, 미리보기 켬)
    const id = 'jRdIwotc7JGxFdF4vKjk';
    const p = (await db.collection('posts').doc(id).get()).data();
    const summary = (p.summary || '').toString();
    await send(`${note}📰 새 글이 올라왔어요\n\n${p.title}\n\n${summary}\n\nhttps://xn--lg3b0kt4n41f.kr/blog/${id}`, { disable_web_page_preview: false });
})().then(() => process.exit(0)).catch(e => { console.error(e.message || e); process.exit(1); });
