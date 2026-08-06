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

const SERVICE_KEY = process.env.DATA_GO_KR_KEY;
if (!SERVICE_KEY) {
    console.error('❌ DATA_GO_KR_KEY 가 없습니다. functions/.env 에 추가하세요.');
    console.error('   DATA_GO_KR_KEY=발급받은_디코딩_키');
    process.exit(1);
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
    if (year) p.set('year', year);
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

    // data.go.kr 은 오류를 XML로 돌려주는 경우가 많다
    if (text.trim().startsWith('<')) {
        console.log('\n⚠️ XML 응답 (대개 오류입니다). 앞부분:');
        console.log(mask(text.slice(0, 1200)));
        if (text.includes('SERVICE_KEY_IS_NOT_REGISTERED')) {
            console.log('\n👉 Encoding 키를 넣었을 가능성이 큽니다. Decoding 키로 바꾸세요.');
        }
        if (text.includes('LIMITED_NUMBER_OF_SERVICE_REQUESTS')) {
            console.log('\n👉 일일 호출 한도 초과입니다.');
        }
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
