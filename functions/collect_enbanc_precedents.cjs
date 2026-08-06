/**
 * 전원합의체 판례 수집기 — 기저 파기율을 직접 집계한다.
 *
 * 남이 만든 데이터셋을 쓰지 않는 이유: 집계 기준(기간·사건종류·파기의 정의)을
 * 우리가 설명할 수 없으면, 우리가 내는 숫자도 출처 불명이 되기 때문이다.
 *
 * 동작
 *   1) lawSearch.do 로 목록을 페이징 (search=2 본문검색)
 *   2) 판결유형="전원합의체 판결" + 사건종류코드 로 필터
 *   3) 각 건의 상세(lawService.do)를 받아 【주 문】을 파싱
 *   4) 파기율 집계 — 판정 신뢰도가 낮은 건은 따로 센다
 *
 * 사용법
 *   cd functions
 *   node collect_enbanc_precedents.cjs                      # 형사(400102) 전체
 *   node collect_enbanc_precedents.cjs --caseType 400101    # 민사
 *   node collect_enbanc_precedents.cjs --maxPages 5         # 시험 삼아 조금만
 *   node collect_enbanc_precedents.cjs --compare            # 소부 비교군도 함께 수집
 *
 * 출력: docs/stats/enbanc_<사건종류>_<날짜>.json  +  콘솔 요약
 *
 * ⚠️ 표본의 성격: 이 수집은 「본문에 '전원합의체'가 언급된 판례」에서 출발한다.
 *    법제처 API 가 판결유형만으로 목록을 뽑는 기능을 제공하지 않기 때문이다.
 *    따라서 전합 판례의 전수가 아닐 수 있으며, 결과를 쓸 때 이 사실을 함께 밝혀야 한다.
 */

const fs = require('fs');
const path = require('path');
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
const has = (n) => argv.includes(`--${n}`);

const caseType = arg('caseType', '400102'); // 기본 형사
const maxPages = parseInt(arg('maxPages', '100'), 10);
const delayMs = parseInt(arg('delay', '250'), 10);
const withCompare = has('compare');

const BASE = 'https://www.law.go.kr/DRF';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fetchJson = async (url, label) => {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        throw new Error(`${label} JSON 파싱 실패 (HTTP ${res.status}): ${text.slice(0, 120)}`);
    }
};

/** 목록 한 페이지 */
const fetchListPage = async (page) => {
    const p = new URLSearchParams({
        OC, target: 'prec', type: 'JSON',
        query: '전원합의체', search: '2',
        display: '100', page: String(page),
    });
    const json = await fetchJson(`${BASE}/lawSearch.do?${p}`, `목록 ${page}쪽`);
    const s = json.PrecSearch || {};
    const list = Array.isArray(s.prec) ? s.prec : s.prec ? [s.prec] : [];
    return { list, totalCnt: parseInt(s.totalCnt || '0', 10) };
};

/** 상세 1건 */
const fetchDetail = async (id) => {
    const p = new URLSearchParams({ OC, target: 'prec', type: 'JSON', ID: String(id) });
    const json = await fetchJson(`${BASE}/lawService.do?${p}`, `상세 ${id}`);
    return json.PrecService || null;
};

(async () => {
    const 종류명 = parser.CASE_TYPE[caseType] || caseType;
    console.log(`■ 전원합의체 판례 수집 — 사건종류 ${caseType}(${종류명})`);
    console.log(`  목록 최대 ${maxPages}쪽, 요청 간격 ${delayMs}ms\n`);

    // ── 1) 목록 수집 ────────────────────────────────────
    const enbanc = [];
    const panel = [];  // 비교군(소부)
    let total = 0;

    for (let page = 1; page <= maxPages; page++) {
        let r;
        try {
            r = await fetchListPage(page);
        } catch (e) {
            console.error(`  ⚠️ ${page}쪽 실패: ${e.message} — 중단`);
            break;
        }
        if (page === 1) {
            total = r.totalCnt;
            console.log(`  본문검색 총 ${total.toLocaleString()}건 (전합 판례 수가 아니라 「전원합의체」가 언급된 판례 수)`);
        }
        if (!r.list.length) break;

        for (const rec of r.list) {
            if (rec.사건종류코드 !== caseType) continue;
            const cls = parser.classifyEnBanc(rec);
            if (cls.isEnBanc) enbanc.push(rec);
            else if (withCompare) panel.push(rec);
        }

        process.stdout.write(`\r  목록 ${page}쪽 … 전합 ${enbanc.length}건${withCompare ? ` / 소부 ${panel.length}건` : ''}`);
        if (r.list.length < 100) break;
        await sleep(delayMs);
    }
    console.log('\n');

    if (!enbanc.length) {
        console.log('수집된 전합 판례가 없습니다. --caseType 또는 --maxPages 를 확인하세요.');
        process.exit(0);
    }

    // ── 2) 상세 수집 + 주문 파싱 ─────────────────────────
    const tally = async (rows, label) => {
        const out = [];
        for (let i = 0; i < rows.length; i++) {
            const id = rows[i].판례일련번호;
            try {
                const detail = await fetchDetail(id);
                if (detail) out.push(parser.normalize({ ...rows[i], ...detail }));
            } catch (e) {
                console.error(`\n  ⚠️ 상세 ${id} 실패: ${e.message}`);
            }
            process.stdout.write(`\r  ${label} 상세 ${i + 1}/${rows.length}`);
            await sleep(delayMs);
        }
        console.log('');
        return out;
    };

    const enbancRows = await tally(enbanc, '전합');
    const panelRows = withCompare ? await tally(panel, '소부') : [];

    // ── 3) 집계 ─────────────────────────────────────────
    // 파기를 전부/일부로 나눠 센다. 여러 혐의가 병합된 사건에서는 일부 파기가
    // 오히려 흔한데, 이를 전부 파기와 한 칸에 넣으면 예측이 실제와 어긋난다.
    const summarize = (rows) => {
        const D = parser.DISPOSITION;
        const S = parser.SCOPE;
        const n = rows.length;
        const cnt = (f) => rows.filter(f).length;
        const isReversed = (r) => [D.REVERSED_REMANDED, D.REVERSED_SELF, D.REVERSED_TRANSFERRED].includes(r.disposition);

        const 파기 = cnt(isReversed);
        const 전부파기 = cnt((r) => isReversed(r) && r.scope === S.FULL);
        const 일부파기 = cnt((r) => isReversed(r) && r.scope === S.PARTIAL);
        const 기각 = cnt((r) => r.disposition === D.DISMISSED);
        const 미상 = cnt((r) => [D.UNKNOWN, D.OTHER].includes(r.disposition));
        const 유효 = n - 미상;

        return {
            건수: n,
            파기, 전부파기, 일부파기, 기각, 미상,
            파기율: 유효 > 0 ? 파기 / 유효 : null,
            전부파기율: 유효 > 0 ? 전부파기 / 유효 : null,
            일부파기율: 유효 > 0 ? 일부파기 / 유효 : null,
            기각률: 유효 > 0 ? 기각 / 유효 : null,
            판정불가비율: n ? 미상 / n : null,
            신뢰도낮음: cnt((r) => r.dispositionConfidence === 'low' || r.enBancConfidence === 'low'),
        };
    };

    const s = summarize(enbancRows);
    const pct = (v) => (v === null ? 'N/A' : `${(v * 100).toFixed(1)}%`);

    console.log(`\n───────── 집계 결과 (${종류명} · 전원합의체) ─────────`);
    console.log(`  수집 건수       : ${s.건수}`);
    console.log(`  기각(원심 확정)  : ${s.기각}   (${pct(s.기각률)})`);
    console.log(`  전부 파기        : ${s.전부파기}   (${pct(s.전부파기율)})`);
    console.log(`  일부 파기        : ${s.일부파기}   (${pct(s.일부파기율)})   ← 병합 사건에서 흔한 결론`);
    console.log(`  판정 불가        : ${s.미상}  (${pct(s.판정불가비율)})`);
    console.log(`  ▶ 파기율(전부+일부) : ${pct(s.파기율)}   ← 기저율 후보`);
    console.log(`  신뢰도 낮은 건    : ${s.신뢰도낮음}`);

    let sp = null;
    if (withCompare && panelRows.length) {
        sp = summarize(panelRows);
        console.log(`\n───────── 비교군 (${종류명} · 소부) ─────────`);
        console.log(`  수집 건수 ${sp.건수} / 전부파기 ${sp.전부파기} / 일부파기 ${sp.일부파기} / 기각 ${sp.기각}`);
        console.log(`  ▶ 파기율 : ${pct(sp.파기율)}`);
        if (s.파기율 && sp.파기율) {
            console.log(`\n  ▶▶ 보정계수 (전합 파기율 ÷ 소부 파기율) : ${(s.파기율 / sp.파기율).toFixed(2)}배`);
            console.log('     ※ 이 값이 예측의 보정 인자가 된다.');
        }
    }

    // ── 4) 저장 ─────────────────────────────────────────
    // 스텁 테스트가 조작된 집계를 docs/stats/ 에 남기면 실제 수집 결과로 오인된다.
    // 근거 없는 숫자가 저장소에 남는 것은 이 프로젝트가 가장 경계하는 실패다.
    // 테스트는 COLLECT_OUT_DIR 로 저장 위치를 옮긴다.
    const outDir = process.env.COLLECT_OUT_DIR || path.join(__dirname, '..', 'docs', 'stats');
    fs.mkdirSync(outDir, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 10);
    const outPath = path.join(outDir, `enbanc_${종류명}_${stamp}.json`);
    fs.writeFileSync(outPath, JSON.stringify({
        수집조건: {
            사건종류코드: caseType, 사건종류명: 종류명,
            질의: '전원합의체', 검색방식: 'search=2 (본문검색)',
            목록최대쪽: maxPages, 수집일: stamp,
        },
        표본의성격: '법제처 판례 API 가 판결유형만으로 목록을 뽑는 기능을 제공하지 않아, '
            + '「본문에 전원합의체가 언급된 판례」에서 출발해 판결유형으로 걸러냈다. '
            + '전합 판례의 전수가 아닐 수 있다.',
        집계: s,
        비교군: sp,
        전합: enbancRows,
        소부: panelRows,
    }, null, 2), 'utf8');

    console.log(`\n💾 저장: docs/stats/${path.basename(outPath)}`);
    console.log('   (인증키는 포함되지 않습니다. 커밋해도 안전합니다.)');
    console.log('\n⚠️ 이 파기율을 쓸 때는 위 「표본의성격」을 반드시 함께 밝힐 것.');
})();
