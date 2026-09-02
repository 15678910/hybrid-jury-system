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
    {
        file: '경찰법_원문',
        target: 'law', MST: '268727',
        why: '국가수사본부의 근거법. police-power-concentration 쟁점에서 경찰 쪽 조문의 근거가 된다',
    },
    {
        file: '국유재산법_원문',
        target: 'law', MST: '283349',
        why: '청사ㆍ장비를 기관 사이에 옮기는 절차의 근거. 제16조(관리전환)ㆍ제17조(유상 원칙)ㆍ제22조(총괄청의 용도폐지 요구ㆍ직권). ndfa-transfer 쟁점에서 NDFC 건물의 향방을 따지는 데 쓴다',
    },
    {
        file: '책임운영기관법_원문',
        target: 'law', MST: '276367',
        why: '국과수가 책임운영기관인 근거. 제4조제1항(지정)ㆍ제10조(기본운영규정)ㆍ제15조제2항(하부조직)ㆍ제16조제1항(정원). 지금까지 행안부 직제가 인용한 것을 옮겨 적었을 뿐이라 원문 확인이 필요했다 (nfs-consolidation 쟁점)',
    },
    {
        file: '책임운영기관법_시행령',
        target: 'law', MST: '283467',
        why: '제7조의2 가 법 제10조제2항제2호의 「대통령령으로 정하는 사항」을 「인건비 총액의 변동을 수반하는」 하부기구 설치ㆍ정원 조정으로 한정한다. 기본운영규정 개정에 장관 승인이 언제 필요한지가 여기서 갈린다',
    },
    // ── judgment-disclosure(판결서 공개) 쟁점 검증용 (2026-09-01 추가) ──────────
    // 세 법이 판결서·재판기록의 공개를 각각 다른 자리에서 정한다.
    // 형소법 제59조의3(확정 판결서등의 열람ㆍ복사) / 민소법 제163조의2(판결서의 열람ㆍ복사)
    // / 법원조직법 제57조(재판의 공개). 셋을 나란히 놓고 봐야 쟁점이 성립한다.
    // 조문 제목부터 갈린다 — 형사는 「확정」이 붙고 민사는 안 붙는다. 이름을 옮겨 적을 때
    // 서로 바꿔 쓰기 쉬우니(2026-09-01 실제로 한 번 뒤집어 적었다) 원문을 열어 확인할 것.
    {
        // ⚠️ target=law 로 받으면 안 된다. 제21241호는 단계 시행이라 target=law 가
        //    마지막 시행분(2027-12-31)을 돌려준다 — 2026-09-01 확인.
        //    오늘 시행 중인 판을 받으려면 eflaw + efYd 로 시행일을 못 박아야 한다.
        file: '형사소송법_현행',
        target: 'eflaw', MST: '281865', efYd: '20260701',
        why: 'judgment-disclosure 쟁점의 형사 쪽 근거 — 제59조의3(확정 판결서등의 열람ㆍ복사) — 형사는 「확정된 사건」만이다. 2026-09-01 기준 시행 중인 판(제21241호 중 2026-07-01 시행분)',
    },
    {
        file: '형사소송법_20261002시행',
        target: 'eflaw', MST: '288579', efYd: '20261002',
        why: '같은 법의 2026-10-02 시행분(공포 제21857호). 대조 결과 제59조의3은 이 개정에서 바뀌지 않는다 — 그 사실을 확인해 두려고 받았다. 현행만 보면 「확정 시행」과 「앞으로 바뀔 것」을 섞게 된다',
    },
    {
        file: '민사소송법_원문',
        target: 'law', MST: '252393',
        why: 'judgment-disclosure 쟁점의 민사 쪽 근거 — 제163조의2(판결서의 열람ㆍ복사) — 민사는 「선고된 사건」이면 되고 확정되지 않은 판결서도 포함한다. 형사와 요건이 다른 핵심 대목',
    },
    {
        file: '법원조직법_원문',
        target: 'law', MST: '284023',
        why: 'judgment-disclosure 쟁점의 상위 근거 — 제57조(재판의 공개). 헌법 제109조를 받는 조문',
    },
    {
        // 제21241호의 마지막 시행분. 제59조의3 이 「확정」에서 미확정으로 넓어지는
        // 개정 후 문언이 여기에 있다 (부칙 제1조 시행 2027-12-31, 제2조 소급 적용).
        // target=law 로 받으면 이 버전이 온다 — 「현행」이 아니라는 점에 주의.
        file: '형사소송법_20271231시행',
        target: 'eflaw', MST: '281865', efYd: '20271231',
        why: 'judgment-disclosure 쟁점 — 개정 후 제59조의3(미확정 판결서 공개) 문언 대조용. 2026-09-02 수집',
    },
    {
        file: '법원조직법_20261001시행',
        target: 'eflaw', MST: '285179', efYd: '20261001',
        why: 'judgment-disclosure 쟁점 — 2026-10-01 시행분(제21503호)이 제57조 등에 영향을 주는지 대조용. 2026-09-02 수집',
    },
    {
        file: '소액사건심판법_원문',
        target: 'law', MST: '249281',
        why: 'objection-literacy-threshold 쟁점 — 구술제소(제4조)·진술조력인 등 「글을 못 써도 되는」 절차의 선례 조문. 2026-09-02 수집',
    },
    {
        file: '경찰수사규칙_원문',
        target: 'law', MST: '287735',
        why: 'objection-literacy-threshold 쟁점 — 불송치 이의신청의 서식·방식 근거(행정안전부령). 별지 서식 자체는 API 에 없으므로 조문의 서식 지정만 확인. 2026-09-02 수집',
    },
    {
        file: '성폭력처벌법_원문',
        target: 'law', MST: '277347',
        why: 'objection-literacy-threshold 쟁점 — 진술조력인(제36조 이하)의 근거 조문. 제안 ③ 「절차조력인 확장」이 기대는 선례. 2026-09-02 수집',
    },
];

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/**
 * law.go.kr 이 산발적으로 HTTP 404 / 빈 본문을 돌려주는 문제 대응.
 * 같은 요청을 곧바로 다시 보내면 대체로 정상 응답이 온다 (속도 제한이 아니라 간헐적 오류).
 * fn() 을 최대 3회까지 재시도하고, check(result) 가 실패 사유 문자열을 돌려주면 재시도한다.
 */
const withRetry = async (label, fn, check) => {
    const delays = [800, 2000];
    let result;
    let reason = '';
    for (let attempt = 1; attempt <= 3; attempt += 1) {
        result = await fn();
        reason = check(result);
        if (!reason) return { result, attempts: attempt, ok: true };
        if (attempt < 3) {
            console.log(`RETRY ${label} (${attempt + 1}/3) — ${reason}`);
            await sleep(delays[attempt - 1]);
        }
    }
    return { result, attempts: 3, ok: false, reason };
};

const api = async (params) => {
    const p = new URLSearchParams({ OC, type: 'JSON', ...params });
    const url = `https://www.law.go.kr/DRF/lawService.do?${p}`;
    try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        const text = await res.text();
        return { status: res.status, text };
    } catch (e) {
        return { status: 0, text: '', error: e.message };
    }
};

/** api() 결과를 검증한다. 통과하면 res.json 에 파싱된 본문을 실어 둔다. */
const checkApiResult = (res) => {
    if (res.error) return `네트워크 실패: ${res.error}`;
    if (res.status !== 200) return `HTTP ${res.status}, len ${res.text.length}`;
    let json = null;
    try { json = JSON.parse(res.text); } catch { /* noop */ }
    if (!json || !json['법령']) return `HTTP ${res.status}, len ${res.text.length}`;
    res.json = json;
    return null;
};

const searchApi = async (params) => {
    const p = new URLSearchParams({ OC, type: 'JSON', display: '100', ...params });
    const url = `https://www.law.go.kr/DRF/lawSearch.do?${p}`;
    try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        const text = await res.text();
        let json = null;
        try { json = JSON.parse(text); } catch { /* HTML = 인증 실패 */ }
        const body = json ? json[Object.keys(json)[0]] : null;
        return { status: res.status, text, body, rows: body ? [].concat(body.law || []) : [] };
    } catch (e) {
        return {
            status: 0, text: '', body: null, rows: [], error: e.message,
        };
    }
};

const checkSearchResult = (res) => {
    if (res.error) return `네트워크 실패: ${res.error}`;
    if (res.status !== 200) return `HTTP ${res.status}, len ${res.text.length}`;
    if (!res.body) return `HTTP ${res.status}, len ${res.text.length}`;
    return null;
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

/**
 * --only=a,b 로 일부만 다시 받는다.
 * 이미 받아 둔 원문을 통째로 다시 내려받으면 그날의 법령 상태로 전부 덮어써져
 * 「무엇을 이번에 바꿨는지」가 diff 에서 사라진다. 그래서 증분 수집을 기본으로 둔다.
 * 이 경우 _수집로그.json 은 덮어쓰지 않고 같은 file 항목만 갈아 끼운다.
 */
const parseOnly = () => {
    const a = process.argv.find((v) => v.startsWith('--only='));
    if (!a) return null;
    const names = a.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean);
    return names.length ? names : null;
};

const runFetch = async () => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const collectedAt = new Date().toISOString().slice(0, 10);
    const log = [];

    const only = parseOnly();
    const targets = only ? TARGETS.filter((t) => only.includes(t.file)) : TARGETS;
    if (only) {
        const missing = only.filter((n) => !TARGETS.some((t) => t.file === n));
        if (missing.length) {
            console.error(`--only 에 없는 대상이 있습니다: ${missing.join(', ')}`);
            process.exit(1);
        }
        console.log(`증분 수집: ${targets.map((t) => t.file).join(', ')}\n`);
    }

    for (let i = 0; i < targets.length; i += 1) {
        const t = targets[i];
        if (i > 0) await sleep(300); // 요청을 몰아치지 않도록 대상 사이에 간격을 둔다

        let MST = t.MST;

        // MST 를 모르는 항목은 먼저 검색해서 확정한다 (추측 금지)
        if (!MST && t.searchName) {
            const { result: sres, attempts: sAttempts, ok: sOk } = await withRetry(
                `${t.file}(검색)`,
                () => searchApi({ target: t.target, query: t.searchName }),
                checkSearchResult,
            );
            if (!sOk) {
                log.push({
                    file: t.file, ok: false, 시도: sAttempts,
                    reason: `${sAttempts}회 시도 후 실패: HTTP ${sres.status}, len ${sres.text.length}`,
                });
                console.log(`SKIP ${t.file}: MST 검색 ${sAttempts}회 시도 후 실패 (HTTP ${sres.status}, len ${sres.text.length})`);
                continue;
            }
            const hit = sres.rows.find((r) => r['법령명한글'] === t.searchName && r['시행일자'] === t.efYd);
            if (!hit) {
                log.push({
                    file: t.file, ok: false, 시도: sAttempts,
                    reason: `검색으로 MST 확정 실패 (${t.searchName}, 시행 ${t.efYd})`,
                });
                console.log(`SKIP ${t.file}: MST 확정 실패`);
                continue;
            }
            MST = hit['법령일련번호'];
        }

        const params = { target: t.target, MST };
        if (t.efYd) params.efYd = t.efYd;

        const { result: res, attempts, ok } = await withRetry(t.file, () => api(params), checkApiResult);
        if (!ok) {
            log.push({
                file: t.file, ok: false, 시도: attempts,
                reason: `${attempts}회 시도 후 실패: HTTP ${res.status}, len ${res.text.length}`,
            });
            console.log(`FAIL ${t.file}: ${attempts}회 시도 후 실패 (HTTP ${res.status}, len ${res.text.length})`);
            continue;
        }

        const json = res.json;
        const body = json['법령'];
        const bi = body['기본정보'] || {};
        const text = renderText(body, { ...t, MST, collectedAt });

        fs.writeFileSync(path.join(OUT_DIR, `${t.file}.txt`), text, 'utf8');
        fs.writeFileSync(path.join(OUT_DIR, `${t.file}.json`), JSON.stringify(json, null, 2), 'utf8');

        const n = arr((body['조문'] || {})['조문단위']).length;
        log.push({
            file: t.file, ok: true, 시도: attempts,
            법령명: bi['법령명_한글'], 법령ID: bi['법령ID'],
            공포일자: ymd(bi['공포일자']), 공포번호: bi['공포번호'],
            시행일자: ymd(bi['시행일자']), 제개정: bi['제개정구분'],
            소관부처: (bi['소관부처'] || {}).content,
            조문수: n, bytes: Buffer.byteLength(text, 'utf8'),
            요청: `target=${t.target} MST=${MST}${t.efYd ? ` efYd=${t.efYd}` : ''}`,
        });
        console.log(`OK   ${t.file}.txt — ${bi['법령명_한글']} | 조문 ${n} | ${Buffer.byteLength(text, 'utf8')} bytes`);
    }

    const logPath = path.join(OUT_DIR, '_수집로그.json');
    let out = { collectedAt, log };
    if (only && fs.existsSync(logPath)) {
        // 증분 수집이면 이번에 받은 항목만 갈아 끼우고 나머지 기록은 남긴다.
        try {
            const prev = JSON.parse(fs.readFileSync(logPath, 'utf8'));
            const kept = (prev.log || []).filter((e) => !log.some((n) => n.file === e.file));
            out = { collectedAt, 이전수집일: prev.collectedAt, log: [...kept, ...log] };
        } catch (e) {
            console.log(`기존 수집로그를 읽지 못해 새로 씁니다: ${e.message}`);
        }
    }
    fs.writeFileSync(logPath, JSON.stringify(out, null, 2), 'utf8');
    console.log('\n수집로그:', logPath);
};

if (process.argv.includes('--fetch')) runFetch();
else if (process.argv.includes('--search')) runSearch();
else console.log('사용법: node collect_reform_laws.cjs --search | --fetch');
