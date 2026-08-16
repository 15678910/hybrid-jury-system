/**
 * 수사·기소 분리 관련 법령 원문 수집기
 * 설계: docs/analysis/수사기소분리_쟁점분석_설계.md — Ⅵ 작업순서 1단계
 *
 * 목적: 공소청법·중수청법·국과수 근거법령·검찰청법의 **원문**을
 *       국가법령정보센터 OPEN API 에서 받아 docs/bills/ 에 텍스트로 저장한다.
 *
 * 원칙 (CLAUDE.md 2026-03-18 「법률 정보 부정확」 사건 재발 방지):
 *   - 법령ID·공포일·시행일을 추측하지 않는다. 응답의 기본정보에서만 읽는다.
 *   - 조문은 **원문 그대로** 저장한다. 요약하면 나중에 대조가 안 된다.
 *   - 받지 못한 자료는 사유를 기록하고 비워 둔다. 채우지 않는다.
 *
 * MST 는 --search 로 확인한 값이다 (탐침 기록: docs/bills/_수집로그.md).
 *
 * 사용법:
 *   cd functions
 *   node collect_reform_laws.cjs --search    # 어떤 법령이 있는지 확인 (MST 재확인용)
 *   node collect_reform_laws.cjs --fetch     # 원문 수집 → docs/bills/
 */

const fs = require('fs');
const path = require('path');

const loadEnv = () => {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
};
loadEnv();

const OC = process.env.LAWAPI_OC;
if (!OC) {
    console.error('LAWAPI_OC 가 없습니다. functions/.env 를 확인하세요.');
    process.exit(1);
}

const OUT_DIR = process.env.LAW_OUT_DIR || path.join(__dirname, '..', 'docs', 'bills');

/**
 * 수집 대상.
 * 미시행 법령은 target=law 검색에 잡히지 않는다 (2026-08-16 확인).
 * 반드시 target=eflaw 로 찾아야 하며, 본문도 eflaw 로 받아야 조문제목이 함께 온다.
 */
const TARGETS = [
    {
        file: '공소청법_원문',
        target: 'eflaw', MST: '285045', efYd: '20261002',
        why: '검찰청법을 폐지하고 신설되는 공소기관의 조직법',
    },
    {
        file: '중수청법_원문',
        target: 'eflaw', MST: '285131', efYd: '20261002',
        why: '행정안전부장관 소속 중대범죄수사청의 조직법 (1단계 시행분)',
    },
    {
        file: '중수청법_원문_2028시행',
        target: 'eflaw', MST: '285131', efYd: '20281002',
        why: '중수청법 중 2028-10-02 시행분 — 단계적 시행이므로 따로 받는다',
    },
    {
        file: '검찰청법_현행',
        target: 'law', MST: '242095',
        why: '폐지 전 현행법. 조문 대비표의 before 쪽',
    },
    {
        file: '검찰청법_20261002시행',
        target: 'eflaw', MST: '285047', efYd: '20261002',
        why: '검색에 잡힌 2026-10-02 시행 검찰청법. 폐지와의 관계 확인용',
    },
    {
        file: '행정안전부와_그_소속기관_직제',
        target: 'law', MST: '288215',
        why: '국립과학수사연구원의 현행 근거 법령 (국립과학수사연구소직제는 1991년판이 마지막)',
    },
    {
        file: '행정안전부와_그_소속기관_직제_시행규칙',
        target: 'law', MST: '288313',
        why: '국립과학수사연구원의 하부조직·정원을 정하는 부령. 직제(대통령령)와 짝을 이룬다',
    },
    {
        file: '검찰청_사무기구에_관한_규정',
        target: 'law', MST: '286405',
        why: '대검찰청 과학수사부의 현행 근거 규정. 이관 쟁점의 before 쪽',
    },
    {
        file: '정부조직법_20261002시행',
        target: 'eflaw', MST: null, searchName: '정부조직법', efYd: '20261002',
        why: '공소청법 제정이유가 지목한 근거법 (법률 제21065호). 설계문서 목록에는 없으나 조직 개편의 출발점',
    },
];

const api = async (params) => {
    const p = new URLSearchParams({ OC, type: 'JSON', ...params });
    const url = `https://www.law.go.kr/DRF/lawService.do?${p}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const text = await res.text();
    return { status: res.status, text };
};

const searchApi = async (params) => {
    const p = new URLSearchParams({ OC, type: 'JSON', display: '100', ...params });
    const url = `https://www.law.go.kr/DRF/lawSearch.do?${p}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* HTML = 인증 실패 */ }
    const body = json ? json[Object.keys(json)[0]] : null;
    return { status: res.status, body, rows: body ? [].concat(body.law || []) : [] };
};

const arr = (v) => (v == null ? [] : [].concat(v));
const ymd = (s) => (/^\d{8}$/.test(String(s)) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6)}` : (s || ''));

/** 항 → 호 → 목 을 원문 그대로 펼친다. 요약하지 않는다. */
const renderSub = (node, depth = 0) => {
    const out = [];
    const pad = '  '.repeat(depth);
    for (const h of arr(node['항'])) {
        if (h['항내용']) out.push(pad + String(h['항내용']).trim());
        out.push(...renderSub(h, depth + 1));
    }
    for (const h of arr(node['호'])) {
        if (h['호내용']) out.push(pad + String(h['호내용']).trim());
        out.push(...renderSub(h, depth + 1));
    }
    for (const m of arr(node['목'])) {
        const c = m['목내용'];
        if (c) out.push(...String(c).split('\n').map((l) => pad + l.trim()));
        out.push(...renderSub(m, depth + 1));
    }
    return out;
};

const renderText = (body, meta) => {
    const bi = body['기본정보'] || {};
    const L = [];
    L.push('='.repeat(70));
    L.push(`법령명   : ${bi['법령명_한글'] || ''}`);
    L.push(`법종구분 : ${(bi['법종구분'] || {}).content || ''}`);
    L.push(`법령ID   : ${bi['법령ID'] || ''}`);
    L.push(`공포일자 : ${ymd(bi['공포일자'])}`);
    L.push(`공포번호 : 제${bi['공포번호'] || ''}호`);
    L.push(`시행일자 : ${ymd(bi['시행일자'])}`);
    L.push(`제개정   : ${bi['제개정구분'] || ''}`);
    L.push(`소관부처 : ${(bi['소관부처'] || {}).content || ''}`);
    L.push('-'.repeat(70));
    L.push(`출처     : 국가법령정보센터 OPEN API`);
    L.push(`요청      : lawService.do target=${meta.target} MST=${meta.MST}${meta.efYd ? ` efYd=${meta.efYd}` : ''}`);
    L.push(`웹 확인  : https://www.law.go.kr/법령/${encodeURIComponent(bi['법령명_한글'] || '')}`);
    L.push(`수집일시 : ${meta.collectedAt}`);
    L.push(`수집이유 : ${meta.why}`);
    L.push('='.repeat(70));
    L.push('');

    L.push('【 본문 】');
    L.push('');
    for (const jo of arr((body['조문'] || {})['조문단위'])) {
        const head = String(jo['조문내용'] || '').replace(/\s+$/, '');
        if (head.trim()) L.push(head.trim());
        const sub = renderSub(jo, 1);
        if (sub.length) L.push(...sub);
        L.push('');
    }

    const bc = (body['부칙'] || {})['부칙단위'];
    if (bc) {
        L.push('');
        L.push('【 부칙 】');
        L.push('');
        for (const u of arr(bc)) {
            for (const block of arr(u['부칙내용'])) {
                for (const line of arr(block)) L.push(String(line).replace(/\s+$/, ''));
            }
            L.push('');
        }
    }

    const rz = body['제개정이유'];
    if (rz) {
        L.push('');
        L.push('【 제·개정 이유 】');
        L.push('');
        for (const block of arr(rz['제개정이유내용'])) {
            for (const line of arr(block)) L.push(String(line).replace(/\s+$/, ''));
        }
        L.push('');
    }

    return L.join('\n');
};

const runSearch = async () => {
    const queries = [
        ['eflaw', '공소청법'], ['eflaw', '중대범죄수사청'], ['eflaw', '검찰청법'],
        ['law', '검찰청법'], ['law', '행정안전부와 그 소속기관'], ['eflaw', '정부조직법'],
        ['law', '과학수사'], ['eflaw', '과학수사'],
    ];
    for (const [target, query] of queries) {
        const { rows, body } = await searchApi({ target, query });
        console.log(`[${target}] ${query} → total=${body ? body.totalCnt : '?'}`);
        rows.slice(0, 8).forEach((r) => console.log(
            `   ${r['법령명한글']} | ${r['법령구분명']} | 시행 ${r['시행일자']} | MST ${r['법령일련번호']}`,
        ));
    }
};

const runFetch = async () => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const collectedAt = new Date().toISOString().slice(0, 10);
    const log = [];

    for (const t of TARGETS) {
        let MST = t.MST;

        // MST 를 모르는 항목은 먼저 검색해서 확정한다 (추측 금지)
        if (!MST && t.searchName) {
            const { rows } = await searchApi({ target: t.target, query: t.searchName });
            const hit = rows.find((r) => r['법령명한글'] === t.searchName && r['시행일자'] === t.efYd);
            if (!hit) {
                log.push({ file: t.file, ok: false, reason: `검색으로 MST 확정 실패 (${t.searchName}, 시행 ${t.efYd})` });
                console.log(`SKIP ${t.file}: MST 확정 실패`);
                continue;
            }
            MST = hit['법령일련번호'];
        }

        const params = { target: t.target, MST };
        if (t.efYd) params.efYd = t.efYd;

        let res;
        try {
            res = await api(params);
        } catch (e) {
            log.push({ file: t.file, ok: false, reason: `네트워크 실패: ${e.message}` });
            console.log(`FAIL ${t.file}: ${e.message}`);
            continue;
        }

        let json = null;
        try { json = JSON.parse(res.text); } catch { /* noop */ }
        if (!json || !json['법령']) {
            log.push({ file: t.file, ok: false, reason: `응답이 법령 JSON 이 아님 (HTTP ${res.status}, len ${res.text.length})` });
            console.log(`FAIL ${t.file}: 응답 이상 (len ${res.text.length})`);
            continue;
        }

        const body = json['법령'];
        const bi = body['기본정보'] || {};
        const text = renderText(body, { ...t, MST, collectedAt });

        fs.writeFileSync(path.join(OUT_DIR, `${t.file}.txt`), text, 'utf8');
        fs.writeFileSync(path.join(OUT_DIR, `${t.file}.json`), JSON.stringify(json, null, 2), 'utf8');

        const n = arr((body['조문'] || {})['조문단위']).length;
        log.push({
            file: t.file, ok: true,
            법령명: bi['법령명_한글'], 법령ID: bi['법령ID'],
            공포일자: ymd(bi['공포일자']), 공포번호: bi['공포번호'],
            시행일자: ymd(bi['시행일자']), 제개정: bi['제개정구분'],
            소관부처: (bi['소관부처'] || {}).content,
            조문수: n, bytes: Buffer.byteLength(text, 'utf8'),
            요청: `target=${t.target} MST=${MST}${t.efYd ? ` efYd=${t.efYd}` : ''}`,
        });
        console.log(`OK   ${t.file}.txt — ${bi['법령명_한글']} | 조문 ${n} | ${Buffer.byteLength(text, 'utf8')} bytes`);
    }

    fs.writeFileSync(path.join(OUT_DIR, '_수집로그.json'), JSON.stringify({ collectedAt, log }, null, 2), 'utf8');
    console.log('\n수집로그:', path.join(OUT_DIR, '_수집로그.json'));
};

if (process.argv.includes('--fetch')) runFetch();
else if (process.argv.includes('--search')) runSearch();
else console.log('사용법: node collect_reform_laws.cjs --search | --fetch');
