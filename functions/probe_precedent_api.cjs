/**
 * 법제처 국가법령정보 OPEN API — 판례(target=prec) 응답 구조 탐침
 *
 * 목적: 전원합의체 판례를 우리가 직접 수집해 기저율을 만들기 위해,
 *       먼저 실제 응답의 필드 이름과 값을 확인한다.
 *       필드명을 추측해 수집기를 짜면 CLAUDE.md 의 「추론으로 정보 생성」 금지에 어긋난다.
 *
 * 인증: functions/.env 의 LAWAPI_OC (이미 설정돼 있음. 법제처 OPEN API 의 이메일 ID)
 *
 * 사용법:
 *   cd functions
 *   node probe_precedent_api.cjs                          # 기본 질의로 구조 확인
 *   node probe_precedent_api.cjs --query "전원합의체"      # 질의 지정
 *   node probe_precedent_api.cjs --query "내란" --display 20
 *
 * 출력: 응답 키 구조, 판례 1건의 전체 필드, 목록 요약, 그리고
 *       「전원합의체 / 파기 / 상고기각」이 어느 필드에 나타나는지 자동 탐지.
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
    console.error('❌ LAWAPI_OC 가 없습니다. functions/.env 를 확인하세요.');
    console.error('   법제처 OPEN API(https://open.law.go.kr) 의 이메일 ID 앞부분입니다.');
    process.exit(1);
}

const argv = process.argv.slice(2);
const getArg = (n, d) => {
    const i = argv.indexOf(`--${n}`);
    return i >= 0 ? argv[i + 1] : d;
};
const query = getArg('query', '전원합의체');
const display = getArg('display', '10');
const page = getArg('page', '1');

const mask = (s) => String(s).replace(/OC=[^&]*/g, 'OC=***');

/** 관심 키워드가 어느 필드에 들어 있는지 찾는다 */
const KEYWORDS = ['전원합의체', '파기', '환송', '자판', '상고기각', '기각', '대법원', '형사'];

const outline = (obj, prefix = '', depth = 0, acc = []) => {
    if (depth > 3 || obj === null || typeof obj !== 'object') return acc;
    if (Array.isArray(obj)) {
        acc.push(`${prefix}[] (배열, ${obj.length}개)`);
        if (obj.length) outline(obj[0], `${prefix}[0]`, depth + 1, acc);
        return acc;
    }
    for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (v !== null && typeof v === 'object') {
            acc.push(`${prefix}.${k} (${Array.isArray(v) ? 'array' : 'object'})`);
            outline(v, `${prefix}.${k}`, depth + 1, acc);
        } else {
            acc.push(`${prefix}.${k} = ${JSON.stringify(v)}`.slice(0, 140));
        }
    }
    return acc;
};

/** 응답 어디든 있는 판례 배열을 찾는다 */
const findList = (obj, best = { rows: [], path: '' }, prefix = '') => {
    if (obj === null || typeof obj !== 'object') return best;
    if (Array.isArray(obj)) {
        if (obj.length > best.rows.length && typeof obj[0] === 'object') best = { rows: obj, path: prefix };
        return best;
    }
    for (const k of Object.keys(obj)) best = findList(obj[k], best, `${prefix}.${k}`);
    return best;
};

(async () => {
    const p = new URLSearchParams({ OC, target: 'prec', type: 'JSON', query, display, page });
    const url = `https://www.law.go.kr/DRF/lawSearch.do?${p.toString()}`;
    console.log('요청:', mask(url));
    console.log('');

    let res, text;
    try {
        res = await fetch(url, { headers: { Accept: 'application/json' } });
        text = await res.text();
    } catch (e) {
        console.error('❌ 요청 실패:', e.message);
        console.error('   이 컨테이너에서 www.law.go.kr 이 차단돼 있으면 데스크탑에서 실행하세요.');
        process.exit(1);
    }

    console.log('HTTP', res.status, '| 본문 길이', text.length);

    let json;
    try {
        json = JSON.parse(text);
    } catch {
        console.log('\n⚠️ JSON 파싱 실패 (OC 가 잘못되면 HTML 이 옵니다). 앞부분:');
        console.log(mask(text.slice(0, 800)));
        process.exit(1);
    }

    console.log('\n───────── 응답 키 구조 ─────────');
    outline(json).slice(0, 40).forEach((l) => console.log(' ', l));

    const { rows, path: listPath } = findList(json);
    console.log(`\n───────── 판례 목록 (경로: ${listPath || '없음'}) ─────────`);
    console.log('건수:', rows.length);

    if (!rows.length) {
        console.log('목록을 찾지 못했습니다. 전체 응답:');
        console.log(mask(JSON.stringify(json, null, 2).slice(0, 1500)));
        process.exit(0);
    }

    console.log('\n▶ 1건의 전체 필드 (이게 수집기 설계의 근거가 됩니다):');
    Object.entries(rows[0]).forEach(([k, v]) => {
        console.log(`   ${k} = ${JSON.stringify(v)}`.slice(0, 200));
    });

    console.log('\n▶ 목록 요약:');
    rows.forEach((r, i) => {
        const vals = Object.values(r).map(String);
        console.log(`  [${i}] ${vals.slice(0, 5).join(' | ')}`.slice(0, 190));
    });

    console.log('\n───────── 키워드가 어느 필드에 있는가 ─────────');
    const fields = Object.keys(rows[0]);
    for (const kw of KEYWORDS) {
        const hits = fields.filter((f) => rows.some((r) => String(r[f] ?? '').includes(kw)));
        if (hits.length) console.log(` ✓ "${kw}" → ${hits.join(', ')}`);
    }
    console.log('\n(「전원합의체」와 「파기」가 어느 필드에 나타나는지가 핵심입니다.');
    console.log(' 그 두 필드를 알면 전합 사건을 추려 파기율을 직접 집계할 수 있습니다.)');

    // 스텁 테스트가 조작된 값을 functions/ 에 남기면 실제 응답으로 오인될 수 있다.
    // 테스트는 PROBE_OUT_DIR 로 저장 위치를 옮긴다.
    const out = path.join(process.env.PROBE_OUT_DIR || __dirname, `probe_prec_${query.replace(/\s+/g, '_')}.json`);
    fs.writeFileSync(out, JSON.stringify(json, null, 2));
    console.log(`\n💾 전체 응답 저장: ${out}`);
    console.log('   (OC 는 응답 본문에 포함되지 않습니다. 커밋해도 안전합니다.)');
})();
