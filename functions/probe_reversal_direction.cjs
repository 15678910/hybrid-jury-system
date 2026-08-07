/**
 * 파기의 「방향」을 읽을 수 있는가 — 실제 판결문 문언을 떠서 확인한다.
 *
 * 왜 이 스크립트가 먼저인가: 파기가 피고인 상고를 받아들인 것인지 검사 상고를
 * 받아들인 것인지 가리려면 주문과 이유의 실제 표현을 알아야 한다. 보지도 않은
 * 문장에 정규식을 짜면 그것은 규칙이 아니라 추측이다. 이 저장소의 파서는
 * 「지어낸 픽스처로 통과시키면 파서가 맞는지 알 수 없다」는 원칙으로 만들어졌다.
 *
 * 하는 일: 형사 전원합의체 판례 몇 건의 ① 주문 전문 ② 이유에서 「상고이유」가
 * 나오는 대목의 앞뒤를 잘라 출력한다. 집계도 저장도 하지 않는다. 눈으로 보기 위한 것이다.
 *
 * 사용법
 *   cd functions
 *   node probe_reversal_direction.cjs                 # 형사 전합 6건
 *   node probe_reversal_direction.cjs --samples 10    # 건수 조절
 *   node probe_reversal_direction.cjs --caseType 400102 --maxPages 3
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const parser = require('./lib/precedent_parser.cjs');

// ── 환경 ────────────────────────────────────────────────
const loadEnv = () => {
    const p = path.join(__dirname, '.env');
    if (!fs.existsSync(p)) return;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
};
loadEnv();

const OC = process.env.LAWAPI_OC;
if (!OC) {
    console.error('❌ LAWAPI_OC 가 없습니다. functions/.env 를 확인하세요.');
    process.exit(1);
}

const argv = process.argv.slice(2);
const arg = (n, d) => {
    const i = argv.indexOf(`--${n}`);
    return i >= 0 ? argv[i + 1] : d;
};

const caseType = arg('caseType', '400102');
const maxPages = parseInt(arg('maxPages', '3'), 10);
const samples = parseInt(arg('samples', '6'), 10);
const delayMs = parseInt(arg('delay', '400'), 10);
const timeoutMs = parseInt(arg('timeout', '60000'), 10);

const BASE = 'https://www.law.go.kr/DRF';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * law.go.kr 은 첫 연결이 느려 Node 내장 fetch(연결 제한 10초 고정)로는 자주 끊긴다.
 * 수집기와 같은 이유로 node:https 를 쓴다. 자세한 경위는 collect_enbanc_precedents.cjs 참조.
 */
const agent = new https.Agent({ keepAlive: true, maxSockets: 2 });

const httpGet = (url) => new Promise((resolve, reject) => {
    const req = https.get(url, { agent, headers: { Accept: 'application/json' } }, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (c) => { data += c; });
        res.on('end', () => resolve(data));
        res.on('error', reject);
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`${timeoutMs / 1000}초 안에 응답 없음`)));
    req.on('error', reject);
});

const fetchJson = async (url, label) => {
    for (let attempt = 1; attempt <= 4; attempt++) {
        try {
            return JSON.parse(await httpGet(url));
        } catch (e) {
            if (attempt === 4) throw new Error(`${label} 실패 — ${e.message}`);
            console.error(`  ↻ ${label} ${attempt}차 실패, ${2 * attempt}초 후 재시도`);
            await sleep(2000 * attempt);
        }
    }
    return null;
};

/** 「상고이유」가 나오는 대목의 앞뒤를 잘라 낸다 */
const excerptsAround = (text, keyword, before = 60, after = 160, limit = 6) => {
    const out = [];
    let idx = 0;
    while (out.length < limit) {
        const i = text.indexOf(keyword, idx);
        if (i < 0) break;
        out.push(text.slice(Math.max(0, i - before), i + after).replace(/\s+/g, ' ').trim());
        idx = i + keyword.length;
    }
    return out;
};

(async () => {
    const 종류명 = parser.CASE_TYPE[caseType] || caseType;
    console.log(`■ 파기 방향 문언 조사 — ${종류명} 전원합의체, 최대 ${samples}건\n`);

    // ── 목록에서 전합 골라내기 ────────────────────────────
    const picked = [];
    for (let page = 1; page <= maxPages && picked.length < samples; page++) {
        const p = new URLSearchParams({
            OC, target: 'prec', type: 'JSON',
            query: '전원합의체', search: '2', display: '100', page: String(page),
        });
        const json = await fetchJson(`${BASE}/lawSearch.do?${p}`, `목록 ${page}쪽`);
        const s = json.PrecSearch || {};
        const list = Array.isArray(s.prec) ? s.prec : s.prec ? [s.prec] : [];
        if (!list.length) break;

        for (const rec of list) {
            if (rec.사건종류코드 !== caseType) continue;
            if (!parser.classifyEnBanc(rec).isEnBanc) continue;
            picked.push(rec);
            if (picked.length >= samples) break;
        }
        await sleep(delayMs);
    }

    if (!picked.length) {
        console.error('❌ 표본을 하나도 고르지 못했습니다.');
        process.exit(1);
    }

    console.log(`  ${picked.length}건 선정. 상세를 받아 문언을 확인합니다.\n`);

    // ── 상세를 받아 주문과 「상고이유」 대목 출력 ───────────
    for (let i = 0; i < picked.length; i++) {
        const rec = picked[i];
        const id = rec.판례일련번호;
        let detail;
        try {
            const p = new URLSearchParams({ OC, target: 'prec', type: 'JSON', ID: String(id) });
            const json = await fetchJson(`${BASE}/lawService.do?${p}`, `상세 ${id}`);
            detail = json.PrecService;
        } catch (e) {
            console.error(`  ⚠️ ${id} 실패: ${e.message}`);
            continue;
        }
        if (!detail) continue;

        const body = parser.stripTags(detail.판례내용 || '');
        const 주문 = parser.extractDisposition(detail.판례내용 || '');
        const d = parser.classifyDisposition(detail.판례내용 || '');

        console.log('─'.repeat(78));
        console.log(`[${i + 1}] ${rec.사건번호} · ${rec.선고일자} · ${rec.사건명}`);
        console.log(`    현재 판정: ${d.disposition} / 범위 ${d.scope}`);
        console.log('  【주문】');
        console.log(`    ${주문.replace(/\s+/g, ' ').trim().slice(0, 500)}`);

        for (const kw of ['검사의 상고이유', '피고인의 상고이유', '상고이유']) {
            const ex = excerptsAround(body, kw, 50, 150, kw === '상고이유' ? 3 : 4);
            if (!ex.length) continue;
            console.log(`  【"${kw}" 주변 ${ex.length}곳】`);
            ex.forEach((e) => console.log(`    · …${e}…`));
        }

        await sleep(delayMs);
    }

    console.log('─'.repeat(78));
    console.log('\n위 문언을 보고 방향 판정 규칙을 만든다. 규칙을 먼저 짜고 문언을 맞추지 않는다.');
})();
