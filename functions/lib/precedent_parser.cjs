/**
 * 판례 파서 — 법제처 OPEN API(target=prec) 상세 응답에서
 * ① 전원합의체 여부 ② 판결 결과(파기/기각)를 뽑아낸다.
 *
 * 배경: 법제처 판례 API 의 상세 응답에는 「파기환송/상고기각」을 담은 전용 필드가 없다.
 *       `선고`는 "선고", `판결유형`은 "판결"처럼 형식만 알려줄 뿐이다.
 *       실제 결론은 `판례내용` 안의 【주 문】에, 재판부 구성은 말미의 대법관 명단에 있다.
 *       따라서 본문을 파싱한다. 추측이 아니라 실제 응답으로 규칙을 확인해 만들었다.
 *
 * ⚠️ 이 파서의 판정은 규칙 기반이므로 100%가 아니다.
 *    집계에 쓸 때는 반드시 `confidence`가 낮은 건을 따로 세어 함께 공개할 것.
 */

/** <br/> 등 태그를 걷어내고 공백을 정리한다 */
const stripTags = (html) =>
    String(html || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/ /g, ' ');

/**
 * 【주 문】 절을 뽑는다.
 * 실제 데이터에서 제목이 「주    문」처럼 공백을 넣어 정렬돼 있어 공백을 무시하고 찾는다.
 */
const extractDisposition = (판례내용) => {
    const text = stripTags(판례내용);
    // 【주 문】 부터 다음 【…】 전까지
    const m = text.match(/【\s*주\s*문\s*】([\s\S]*?)(?=【|$)/);
    return m ? m[1].trim() : '';
};

/** 판결 결과 분류 */
const DISPOSITION = {
    DISMISSED: 'dismissed',                 // 상고기각 — 원심 확정
    REVERSED_REMANDED: 'reversed_remanded', // 파기환송
    REVERSED_SELF: 'reversed_self',         // 파기자판
    REVERSED_TRANSFERRED: 'reversed_transferred', // 파기이송
    OTHER: 'other',
    UNKNOWN: 'unknown',
};

/**
 * 주문에서 결론을 판정한다.
 * @returns {{disposition:string, confidence:'high'|'low', 주문:string}}
 */
const classifyDisposition = (판례내용) => {
    const 주문 = extractDisposition(판례내용);
    if (!주문) return { disposition: DISPOSITION.UNKNOWN, confidence: 'low', 주문: '' };

    const 파기 = /파기/.test(주문);
    const 환송 = /환송/.test(주문);
    const 이송 = /이송/.test(주문);
    const 기각 = /(상고|항소|재항고|항고)[를을]?\s*(모두\s*)?기각/.test(주문);

    // 파기 판단을 먼저 본다. 「일부 파기, 일부 기각」인 경우 파기가 더 중요한 정보다.
    if (파기 && 환송) return { disposition: DISPOSITION.REVERSED_REMANDED, confidence: 'high', 주문 };
    if (파기 && 이송) return { disposition: DISPOSITION.REVERSED_TRANSFERRED, confidence: 'high', 주문 };
    if (파기) return { disposition: DISPOSITION.REVERSED_SELF, confidence: 'high', 주문 };
    if (기각) return { disposition: DISPOSITION.DISMISSED, confidence: 'high', 주문 };

    return { disposition: DISPOSITION.OTHER, confidence: 'low', 주문 };
};

/**
 * 말미의 대법관 명단을 뽑아 인원을 센다.
 * 실제 형식 예: "대법관 안용득(재판장) 천경송 지창권 신성택(주심)"
 * 전원합의체는 대법원장과 대법관 다수가 나열된다.
 */
const extractJustices = (판례내용) => {
    const text = stripTags(판례내용).trim();
    // 마지막 "대법관" 또는 "대법원장" 이 나오는 줄부터 끝까지
    const idx = Math.max(text.lastIndexOf('대법관'), text.lastIndexOf('대법원장'));
    if (idx < 0) return { names: [], raw: '' };

    const raw = text.slice(idx).replace(/^대법(관|원장)\s*/, '');
    const names = raw
        .split(/\s+/)
        .map((s) => s.replace(/\((재판장|주심|출석불능.*?)\)/g, '').trim())
        .map((s) => s.replace(/[^가-힣]/g, ''))
        .filter((s) => s.length >= 2 && s.length <= 4);

    return { names, raw: raw.slice(0, 300) };
};

/**
 * 전원합의체 여부를 판정한다.
 *
 * 1순위 근거는 API 가 제공하는 `판결유형` 필드다. 실제 응답에서
 * 소부는 "판결", 전합은 **"전원합의체 판결"** 로 구분돼 오는 것을 확인했다.
 * 본문 파싱은 이 필드가 비어 있는 출처(국세법령정보시스템 등)를 위한 보조 수단이다.
 *
 * 무엇으로 판정했는지(signals)를 함께 돌려준다. 집계할 때 근거별로 나눠
 * 검증할 수 있어야 하기 때문이다.
 *
 * @param {{사건명?:string, 판결유형?:string, 판례내용?:string}} rec
 */
const classifyEnBanc = (rec) => {
    const 판결유형 = String(rec.판결유형 || '');
    const 사건명 = String(rec.사건명 || '');
    const body = stripTags(rec.판례내용 || '');
    const { names } = extractJustices(rec.판례내용);
    const signals = [];

    // ① 1순위 — API 의 판결유형 필드. 가장 신뢰할 수 있다.
    if (/전원합의체/.test(판결유형)) signals.push('판결유형');

    // ② 사건명에 명시된 경우 (일부 출처에서만)
    if (/전원합의체/.test(사건명)) signals.push('사건명');

    // ③ 재판부 인원 — 소부는 통상 4명, 전합은 대법원장 포함 다수
    if (names.length >= 10) signals.push(`대법관${names.length}명`);

    // ④ 본문 표기는 참조판례 인용일 수 있어 단독 근거로 쓰지 않는다
    if (/전원합의체/.test(body)) signals.push('본문언급(약함)');

    let isEnBanc;
    let confidence;

    if (signals.includes('판결유형')) {
        isEnBanc = true;
        confidence = 'high';
    } else if (판결유형 && !/전원합의체/.test(판결유형)) {
        // 판결유형이 채워져 있는데 전합이 아니면 소부로 확정한다.
        isEnBanc = false;
        confidence = 'high';
    } else if (names.length >= 10) {
        isEnBanc = true;
        confidence = 'high';
    } else if (names.length > 0 && names.length <= 5) {
        isEnBanc = false;
        confidence = 'high';
    } else if (signals.includes('사건명')) {
        isEnBanc = true;
        confidence = 'low';
    } else {
        isEnBanc = false;
        confidence = 'low';
    }

    return { isEnBanc, confidence, signals, justiceCount: names.length, justices: names };
};

/** 사건종류코드 — 실제 응답에서 확인한 값 */
const CASE_TYPE = {
    '400101': '민사',
    '400102': '형사',
    '400103': '가사',
    '400107': '일반행정',
    '400108': '세무',
};

/** 목록·상세 레코드 하나를 집계용 행으로 정규화한다 */
const normalize = (rec) => {
    const enbanc = classifyEnBanc(rec);
    const disp = classifyDisposition(rec.판례내용);
    return {
        판례일련번호: rec.판례정보일련번호 || rec.판례일련번호 || null,
        사건번호: rec.사건번호 || null,
        사건명: rec.사건명 || null,
        선고일자: rec.선고일자 || null,
        법원명: rec.법원명 || null,
        법원종류코드: rec.법원종류코드 || null,
        사건종류명: rec.사건종류명 || null,
        사건종류코드: rec.사건종류코드 || null,
        isEnBanc: enbanc.isEnBanc,
        enBancConfidence: enbanc.confidence,
        enBancSignals: enbanc.signals,
        justiceCount: enbanc.justiceCount,
        disposition: disp.disposition,
        dispositionConfidence: disp.confidence,
        주문: disp.주문.slice(0, 200),
    };
};

module.exports = {
    DISPOSITION,
    CASE_TYPE,
    stripTags,
    extractDisposition,
    classifyDisposition,
    extractJustices,
    classifyEnBanc,
    normalize,
};
