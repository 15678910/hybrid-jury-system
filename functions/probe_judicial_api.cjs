/**
 * 사법연감 OpenAPI 응답 구조 탐침 스크립트
 * (한국형사법무정책연구원 사법연감정보조회서비스 / 공공데이터포털)
 *
 * 목적: 수집 함수를 짜기 전에 실제 응답의 필드 구조를 확인한다.
 *       필드명을 추측해서 코드를 쓰면 CLAUDE.md의 「추론으로 정보 생성」 금지에 어긋난다.
 *
 * 사용법:
 *   1) functions/.env 에 키를 넣는다 (Encoding 아니라 Decoding 키!)
 *        DATA_GO_KR_KEY=발급받은_디코딩_키
 *   2) 실행
 *        cd functions
 *        node probe_judicial_api.cjs --sht T186083023536704 --year 2024
 *
 *   sht 코드는 데이터조회 화면의 표 제목 옆 [코드 : ...] 값이다.
 *   --year 를 빼면 년도 없이 호출해 본다(년도 목록을 응답에서 찾을 수 있는 경우가 있다).
 *
 * 출력: 응답의 키 구조, 총건수, 샘플 행 3개, 그리고 「파기/기각/심급」 관련 필드 자동 탐지 결과.
 *       인증키는 절대 출력하지 않는다.
 */

const fs = require('fs');
const path = require('path');

// ── .env 로딩 (Firebase가 배포 시 자동 로딩하지만, 로컬 실행에는 직접 읽어야 한다) ──
const loadEnv = () => {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
};
loadEnv();

let SERVICE_KEY = process.env.DATA_GO_KR_KEY;
if (!SERVICE_KEY) {
    console.error('❌ DATA_GO_KR_KEY 가 없습니다. functions/.env 에 추가하세요.');
    console.error('   DATA_GO_KR_KEY=발급받은_디코딩_키');
    process.exit(1);
}

// 자리표시자를 그대로 넣는 실수를 호출 전에 막는다.
// (안내 문구를 복사해 붙여넣으면 값이 치환되지 않은 채 저장되기 쉽다)
const PLACEHOLDER = /여기에|붙여넣|your-|발급받은|<.*>|^\s*$/;
if (PLACEHOLDER.test(SERVICE_KEY) || SERVICE_KEY.length < 30) {
    console.error('❌ DATA_GO_KR_KEY 가 실제 인증키가 아닙니다.');
    console.error(`   현재 값: ${SERVICE_KEY.length}자, 앞 4자 "${SERVICE_KEY.slice(0, 4)}…"`);
    console.error('   실제 인증키는 보통 80자 안팎입니다.\n');
    console.error('   data.go.kr → 마이페이지 → 오픈API → 인증키 발급현황');
    console.error('   → 「일반 인증키(Decoding)」 복사 후 functions/.env 의 해당 줄을 교체하세요.\n');
    console.error('   PowerShell:');
    console.error('     (Get-Content .env) | Where-Object { $_ -notmatch "^DATA_GO_KR_KEY=" } | Set-Content .env -Encoding utf8');
    console.error('     Add-Content -Path .env -Value "DATA_GO_KR_KEY=복사한키" -Encoding utf8');
    process.exit(1);
}

// data.go.kr 은 같은 키를 Encoding/Decoding 두 형태로 제공한다.
// Encoding 키는 Decoding 키를 URL 인코딩한 것일 뿐이므로, %XX 가 보이면 되돌린다.
// (URLSearchParams 가 다시 인코딩하므로, 그대로 두면 이중 인코딩돼 인증에 실패한다)
if (/%[0-9A-Fa-f]{2}/.test(SERVICE_KEY)) {
    try {
        const decoded = decodeURIComponent(SERVICE_KEY);
        console.log('ℹ️  Encoding 키가 감지되어 Decoding 형태로 변환했습니다.');
        console.log(`   ${SERVICE_KEY.length}자 → ${decoded.length}자\n`);
        SERVICE_KEY = decoded;
    } catch {
        console.error('❌ 키에 %XX 가 있으나 디코딩에 실패했습니다.');
        console.error('   마이페이지에서 「일반 인증키(Decoding)」를 직접 복사해 넣으세요.');
        process.exit(1);
    }
}

// ── 인자 파싱 ──
const argv = process.argv.slice(2);
const getArg = (name) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
};
const sht = getArg('sht');
const year = getArg('year');

if (!sht) {
    console.error('❌ --sht 코드가 필요합니다.');
    console.error('   예: node probe_judicial_api.cjs --sht T186083023536704 --year 2024');
    process.exit(1);
}

const BASE = 'https://apis.data.go.kr/B554626/JudicialYearbook/getJudicialYearbook';

const buildUrl = () => {
    // URLSearchParams 가 인코딩을 처리하므로 Decoding 키를 그대로 넣는다.
    // Encoding 키를 넣으면 이중 인코딩으로 SERVICE_KEY_IS_NOT_REGISTERED_ERROR 가 난다.
    const p = new URLSearchParams({ serviceKey: SERVICE_KEY, type: 'JSON', sht });
    if (year) {
        // 년도 파라미터의 정식 이름이 확인되지 않았다. year 로 보냈을 때 응답의
        // statsYr 이 빈 값으로 오는 것을 확인했으므로, 후보를 함께 보내 본다.
        // (서버가 모르는 파라미터는 대개 무시하므로 부작용이 없다)
        // ※ 정식 이름은 공공데이터포털 「활용가이드」 문서로 확정할 것.
        p.set('year', year);
        p.set('statsYr', year);
    }
    return `${BASE}?${p.toString()}`;
};

/** 인증키를 로그에서 가린다 */
const mask = (s) => String(s).replace(/serviceKey=[^&]*/g, 'serviceKey=***MASKED***');

/** 중첩 객체의 키 경로를 나열한다 */
const outline = (obj, prefix = '', depth = 0, acc = []) => {
    if (depth > 4 || obj === null || typeof obj !== 'object') return acc;
    if (Array.isArray(obj)) {
        acc.push(`${prefix}[] (배열, ${obj.length}개)`);
        if (obj.length) outline(obj[0], `${prefix}[0]`, depth + 1, acc);
        return acc;
    }
    for (const k of Object.keys(obj)) {
        const v = obj[k];
        const t = Array.isArray(v) ? 'array' : typeof v;
        if (t === 'object' || t === 'array') {
            acc.push(`${prefix}.${k} (${t})`);
            outline(v, `${prefix}.${k}`, depth + 1, acc);
        } else {
            acc.push(`${prefix}.${k} = ${JSON.stringify(v)}`.slice(0, 160));
        }
    }
    return acc;
};

/** 응답 어디든 들어 있는 배열 중 가장 큰 것을 데이터 행으로 본다 */
const findRows = (obj, best = { rows: [], path: '' }, prefix = '') => {
    if (obj === null || typeof obj !== 'object') return best;
    if (Array.isArray(obj)) {
        if (obj.length > best.rows.length && typeof obj[0] === 'object') {
            best = { rows: obj, path: prefix };
        }
        obj.slice(0, 3).forEach((v, i) => { best = findRows(v, best, `${prefix}[${i}]`); });
        return best;
    }
    for (const k of Object.keys(obj)) best = findRows(obj[k], best, `${prefix}.${k}`);
    return best;
};

const KEYWORDS = ['파기', '기각', '상고', '항소', '심급', '국선', '접수', '처리', '인용', '환송', '자판'];

/** data.go.kr 표준 오류코드 → 원인·조치 */
const REASON = {
    '01': ['APPLICATION_ERROR', '제공기관 서버 오류. 잠시 후 재시도'],
    '04': ['HTTP_ERROR', '요청 형식 오류'],
    '12': ['NO_OPENAPI_SERVICE_ERROR', '해당 오픈API가 없거나 폐기됨 — 엔드포인트 확인'],
    '20': ['SERVICE_ACCESS_DENIED_ERROR', '활용신청이 승인되지 않음 — 마이페이지에서 승인 상태 확인'],
    '22': ['LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR', '일일 호출 한도 초과 — 내일 재시도'],
    '30': ['SERVICE_KEY_IS_NOT_REGISTERED_ERROR', '키가 이 API에 등록되지 않음 — 아래 3가지 확인'],
    '31': ['DEADLINE_HAS_EXPIRED_ERROR', '활용기간 만료 — 연장 신청'],
    '32': ['UNREGISTERED_IP_ERROR', '등록되지 않은 IP'],
    '33': ['UNSIGNED_CALL_ERROR', '서명 미등록 호출'],
};

/** 오류 응답을 진단해 조치를 안내한다 (JSON·XML 공통) */
const diagnose = (raw) => {
    const code = (raw.match(/returnReasonCode["'>\s:]+["']?(\d+)/) || [])[1];
    const msg = (raw.match(/(?:errMsg|returnAuthMsg)["'>\s:]+["']?([^"'<,}]+)/) || [])[1];

    console.log('\n───────── 오류 진단 ─────────');
    if (msg) console.log(' 메시지 :', msg.trim());
    if (code) {
        const hit = REASON[code.padStart(2, '0')];
        console.log(' 코드   :', code, hit ? `— ${hit[0]}` : '');
        if (hit) console.log(' 조치   :', hit[1]);
    }

    if (code === '30' || /NOT_REGISTERED/.test(raw)) {
        // 가장 흔한 원인부터
        const looksEncoded = /%[0-9A-Fa-f]{2}/.test(SERVICE_KEY);
        console.log('\n 확인 순서:');
        console.log(`  1) 키 형식 — 현재 키에 %XX 이스케이프가 ${looksEncoded ? '있습니다 ⚠️' : '없습니다 ✅'}`);
        if (looksEncoded) {
            console.log('     → Encoding 키를 넣으셨습니다. 마이페이지의 「일반 인증키(Decoding)」로 교체하세요.');
        } else {
            console.log('     → Decoding 키가 맞습니다. 아래 2)·3)을 확인하세요.');
        }
        console.log('  2) 활용신청 — 이 API(사법연감정보조회서비스)에 활용신청이 승인됐는지');
        console.log('     data.go.kr → 마이페이지 → 오픈API → 개발계정 → 해당 API');
        console.log('  3) 반영 대기 — 승인 직후에는 키가 바로 동작하지 않습니다.');
        console.log('     보통 수분~1시간 걸립니다. 시간을 두고 재시도하세요.');
        console.log(`\n (참고: 읽어들인 키 길이 ${SERVICE_KEY.length}자, 앞 4자 ${SERVICE_KEY.slice(0, 4)}…)`);
    }
};

(async () => {
    const url = buildUrl();
    console.log('요청:', mask(url));
    console.log('');

    let res, text;
    try {
        res = await fetch(url);
        text = await res.text();
    } catch (e) {
        console.error('❌ 요청 실패:', e.message);
        console.error('   이 컨테이너에서 apis.data.go.kr 이 차단돼 있으면 데스크탑에서 실행하세요.');
        process.exit(1);
    }

    console.log('HTTP', res.status, '| 본문 길이', text.length);

    // 오류는 XML로도 JSON으로도 온다 → 형식과 무관하게 먼저 진단한다
    const isError = /returnReasonCode|errMsg|_ERROR/.test(text);
    if (isError) {
        console.log('\n⚠️ 오류 응답입니다.');
        diagnose(text);
        console.log('\n원문:');
        console.log(mask(text.slice(0, 800)));
        process.exit(1);
    }

    if (text.trim().startsWith('<')) {
        console.log('\n⚠️ XML 응답입니다 (type=JSON 을 보냈는데 XML이면 파라미터 확인). 앞부분:');
        console.log(mask(text.slice(0, 1200)));
        process.exit(1);
    }

    let json;
    try {
        json = JSON.parse(text);
    } catch {
        console.log('\n⚠️ JSON 파싱 실패. 앞부분:');
        console.log(mask(text.slice(0, 1200)));
        process.exit(1);
    }

    console.log('\n───────── 응답 키 구조 ─────────');
    outline(json).slice(0, 80).forEach((l) => console.log(' ', l));

    // ── 사법연감 교차표 전용 렌더링 ──────────────────────────
    // 이 API 는 artcl(행 항목) × clsf(열 분류) = statsVl(값) 구조로 응답한다.
    const item = json?.response?.body?.items?.item;
    if (item && Array.isArray(item.artcl)) {
        const { shtNm, statsYr, artcl = [], clsf = [], statsVl = [] } = item;
        console.log('\n───────── 표 정보 ─────────');
        console.log(' 표 이름 :', shtNm);
        console.log(' 통계연도:', statsYr === '' ? '(빈 값 — year 파라미터가 안 먹었을 수 있음)' : statsYr);
        console.log(` 행(artcl) ${artcl.length} × 열(clsf) ${clsf.length} = 값(statsVl) ${statsVl.length}`);

        console.log('\n 열 분류(clsf) 전체:');
        clsf.forEach((c, i) => console.log(`  [${i}]`, JSON.stringify(c)));

        console.log('\n 값(statsVl) 앞 5개:');
        statsVl.slice(0, 5).forEach((v, i) => console.log(`  [${i}]`, JSON.stringify(v)));

        // 행 × 열 곱이 값 개수와 맞으면 교차표로 복원해 본다
        if (artcl.length && clsf.length && artcl.length * clsf.length === statsVl.length) {
            console.log('\n───────── 교차표 복원 (앞 8행) ─────────');
            const head = clsf.map((c) => (Array.isArray(c) ? c.join('/') : String(c)));
            console.log('  행\\열 |', head.join(' | '));
            artcl.slice(0, 8).forEach((row, r) => {
                const label = Array.isArray(row) ? row.filter(Boolean).join(' > ') : String(row);
                const cells = clsf.map((_, c) => statsVl[r * clsf.length + c]);
                console.log(`  ${label} |`, cells.join(' | '));
            });
            console.log('\n  ✅ 행×열 = 값 개수가 일치합니다 → 파싱 규칙 확정 가능');
        } else if (statsVl.length) {
            console.log(`\n  ⚠️ 행(${artcl.length})×열(${clsf.length})=${artcl.length * clsf.length} 이(가)`
                + ` 값 개수(${statsVl.length})와 다릅니다 → 다른 배치 규칙일 수 있음`);
        }
    }

    const { rows, path: rowsPath } = findRows(json);
    console.log(`\n───────── 데이터 행 (경로: ${rowsPath || '없음'}) ─────────`);
    console.log('행 수:', rows.length);

    if (rows.length) {
        const fields = Object.keys(rows[0]);
        console.log('필드:', fields.join(', '));

        console.log('\n샘플 3행:');
        rows.slice(0, 3).forEach((r, i) => console.log(` [${i}]`, JSON.stringify(r).slice(0, 400)));

        // 관심 키워드가 필드명 또는 값에 있는지 탐지
        console.log('\n───────── 관심 항목 탐지 ─────────');
        const blob = JSON.stringify(rows.slice(0, 200));
        for (const kw of KEYWORDS) {
            const inField = fields.filter((f) => f.includes(kw));
            const inValue = blob.includes(kw);
            if (inField.length || inValue) {
                console.log(` ✓ "${kw}"`,
                    inField.length ? `→ 필드: ${inField.join(', ')}` : '→ 값에 등장');
            }
        }
        console.log('\n(위에 "파기"가 없으면 이 표에는 파기 데이터가 없습니다 → 다른 sht 코드로 시도)');
    } else {
        console.log('데이터 행을 찾지 못했습니다. 전체 응답:');
        console.log(mask(JSON.stringify(json, null, 2).slice(0, 2000)));
    }

    // 결과를 파일로도 남긴다 (키는 포함되지 않음)
    const out = path.join(__dirname, `probe_${sht}_${year || 'noyear'}.json`);
    fs.writeFileSync(out, JSON.stringify(json, null, 2));
    console.log(`\n💾 전체 응답 저장: functions/${path.basename(out)}`);
    console.log('   (이 파일에는 인증키가 들어 있지 않습니다. 저장소에 커밋해도 안전합니다.)');
})();
