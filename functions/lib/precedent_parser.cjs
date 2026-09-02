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

/** 파기의 범위 — 전부인가 일부인가 */
const SCOPE = {
    FULL: 'full',       // 원심판결 전부 파기
    PARTIAL: 'partial', // 일부만 파기, 나머지는 기각 (여러 혐의가 병합된 사건에서 흔하다)
    NONE: 'none',       // 파기 없음
};

/**
 * 파기 범위를 판정한다.
 *
 * 여러 혐의가 병합된 사건에서는 「원심판결 중 유죄 부분을 파기하고 … 나머지 상고를
 * 기각한다」처럼 일부만 파기되는 경우가 흔하다. 이를 전부 파기와 한 칸에 넣으면
 * 예측이 실제 결과와 어긋난다. 실무에서 더 자주 나오는 결론을 별도로 센다.
 */
const classifyScope = (주문) => {
    if (!/파기/.test(주문)) return SCOPE.NONE;

    // ① 「… 중 … 부분을 파기」 — 범위를 한정한 표현
    const 부분한정 = /중[\s\S]{0,60}?부분[\s\S]{0,20}?파기/.test(주문) || /일부[\s\S]{0,20}?파기/.test(주문);
    // ② 같은 주문 안에 파기와 기각이 함께 있으면 나머지는 유지된 것이다
    const 파기와기각공존 = /파기/.test(주문) && /기각/.test(주문);

    return (부분한정 || 파기와기각공존) ? SCOPE.PARTIAL : SCOPE.FULL;
};

/**
 * 파기의 방향 — 누구의 상고가 받아들여졌는가.
 *
 * 왜 필요한가: 쌍방이 상고한 사건에서 「파기」는 정반대 두 가지를 뜻한다.
 * 피고인 상고가 받아들여지면 유죄 부분이 깨지고, 검사 상고가 받아들여지면
 * 무죄 부분이 깨진다. 방향을 모르면 파기 확률을 알아도 그것이 누구에게
 * 유리한지 알 수 없다.
 */
const DIRECTION = {
    DEFENSE: 'defense',         // 피고인 상고를 받아들인 파기
    PROSECUTION: 'prosecution', // 검사 상고를 받아들인 파기
    BOTH: 'both',               // 쌍방 상고이유가 모두 일부 받아들여짐
    NONE: 'none',               // 파기 아님
    UNKNOWN: 'unknown',         // 문언으로 가릴 수 없음
};

/**
 * 이유에서 누가 상고했는지를 읽는다.
 *
 * 실제 판결문에서 확인한 표현(2026-08-07 조사):
 *   · 「검사가 원심판결에 대하여 상고하였으므로, 대법원은 검사의 상고이유를 판단한다」
 *   · 「1. 피고인 1의 상고이유에 관하여」
 * 앞의 것은 상고 주체를 명시하고, 뒤의 것은 절 제목으로 주체를 드러낸다.
 * 피고인이 여럿이면 「피고인 1의」처럼 번호가 붙으므로 이를 함께 받는다.
 */
const detectAppellants = (본문) => {
    const 검사 = /검사의\s*상고이유/.test(본문) || /검사가[\s\S]{0,40}?상고하였/.test(본문);
    const 피고인 = /피고인(들|\s*\d+)?\s*의\s*상고이유/.test(본문)
        || /피고인(들|\s*\d+)?[이가][\s\S]{0,40}?상고하였/.test(본문);
    return { 검사, 피고인 };
};

/**
 * 파기의 방향을 판정한다.
 *
 * 판정 순서는 조사 전에 정해 두었다(docs/analysis/파기방향_판정설계.md).
 *   ① 주문의 파기 대상 문언 — 「무죄 부분을 파기」/「유죄 부분을 파기」
 *   ② 상고 주체가 한쪽뿐이면 파기는 그쪽을 받아들인 것이다
 *   ③ 쌍방이면 어느 쪽 상고이유가 「이유 있다」고 했는지 본다
 * 셋이 어긋나면 억지로 고르지 않고 UNKNOWN 으로 둔다. 애매한 것을 한쪽에
 * 몰아넣으면 그 비율이 그대로 결론의 편향이 된다.
 */
const classifyDirection = (판례내용, 주문, disposition) => {
    const 파기계열 = [DISPOSITION.REVERSED_REMANDED, DISPOSITION.REVERSED_SELF, DISPOSITION.REVERSED_TRANSFERRED];
    if (!파기계열.includes(disposition)) {
        return { direction: DIRECTION.NONE, confidence: 'high', signals: [] };
    }

    const 본문 = stripTags(판례내용);
    const signals = [];

    // ① 주문이 파기 대상을 밝힌 경우 — 가장 강한 신호
    if (/무죄[\s\S]{0,20}?부분[\s\S]{0,20}?파기/.test(주문)) {
        signals.push('주문:무죄부분파기');
        return { direction: DIRECTION.PROSECUTION, confidence: 'high', signals };
    }
    if (/유죄[\s\S]{0,20}?부분[\s\S]{0,20}?파기/.test(주문)) {
        signals.push('주문:유죄부분파기');
        return { direction: DIRECTION.DEFENSE, confidence: 'high', signals };
    }

    // ② 상고 주체가 한쪽뿐이면 파기는 그쪽을 받아들인 것이다
    const { 검사, 피고인 } = detectAppellants(본문);
    if (검사 && !피고인) {
        signals.push('상고주체:검사만');
        return { direction: DIRECTION.PROSECUTION, confidence: 'high', signals };
    }
    if (피고인 && !검사) {
        signals.push('상고주체:피고인만');
        return { direction: DIRECTION.DEFENSE, confidence: 'high', signals };
    }

    // ③ 쌍방이면 어느 쪽 상고이유가 받아들여졌는지 본다.
    //    「…의 상고이유에 관하여」 뒤부터 다음 주체가 나오기 전까지를 그 쪽의 구간으로 보고,
    //    그 안에 「이유 있다」가 있는지 센다. 「이유 없다」와 구별해야 하므로 부정형을 제외한다.
    if (검사 && 피고인) {
        signals.push('상고주체:쌍방');
        const 인용 = (주체정규식) => {
            const m = 본문.match(new RegExp(`${주체정규식}\\s*의\\s*상고이유[\\s\\S]{0,4000}?(?=(검사|피고인)(들|\\s*\\d+)?\\s*의\\s*상고이유|$)`));
            if (!m) return false;
            // 「이유 없다/없음」이 아닌 「이유 있다」만 인용으로 본다
            return /상고이유[\s\S]{0,80}?주장은[\s\S]{0,20}?이유\s*있다/.test(m[0])
                || /이\s*점을\s*지적하는[\s\S]{0,40}?이유\s*있다/.test(m[0]);
        };
        const p = 인용('검사');
        const d = 인용('피고인(들|\\s*\\d+)?');
        if (p && d) return { direction: DIRECTION.BOTH, confidence: 'low', signals: [...signals, '양쪽:이유있다'] };
        if (p) return { direction: DIRECTION.PROSECUTION, confidence: 'low', signals: [...signals, '검사:이유있다'] };
        if (d) return { direction: DIRECTION.DEFENSE, confidence: 'low', signals: [...signals, '피고인:이유있다'] };
    }

    return { direction: DIRECTION.UNKNOWN, confidence: 'low', signals };
};

/**
 * 주문에서 결론을 판정한다.
 * @returns {{disposition:string, scope:string, confidence:'high'|'low', 주문:string}}
 */
const classifyDisposition = (판례내용) => {
    const 주문 = extractDisposition(판례내용);
    if (!주문) {
        return {
            disposition: DISPOSITION.UNKNOWN, scope: SCOPE.NONE, confidence: 'low', 주문: '',
            direction: DIRECTION.UNKNOWN, directionConfidence: 'low', directionSignals: [],
        };
    }

    const 파기 = /파기/.test(주문);
    const 환송 = /환송/.test(주문);
    const 이송 = /이송/.test(주문);
    const 기각 = /(상고|항소|재항고|항고)[를을]?\s*(모두\s*)?기각/.test(주문);
    const scope = classifyScope(주문);

    // 파기가 있으면 파기 계열로 본다. 전부인지 일부인지는 scope 로 구분한다.
    let disposition;
    if (파기 && 환송) disposition = DISPOSITION.REVERSED_REMANDED;
    else if (파기 && 이송) disposition = DISPOSITION.REVERSED_TRANSFERRED;
    else if (파기) disposition = DISPOSITION.REVERSED_SELF;
    else if (기각) disposition = DISPOSITION.DISMISSED;
    else {
        return {
            disposition: DISPOSITION.OTHER, scope: SCOPE.NONE, confidence: 'low', 주문,
            direction: DIRECTION.UNKNOWN, directionConfidence: 'low', directionSignals: [],
        };
    }

    const dir = classifyDirection(판례내용, 주문, disposition);
    return {
        disposition,
        scope: disposition === DISPOSITION.DISMISSED ? SCOPE.NONE : scope,
        confidence: 'high',
        주문,
        direction: dir.direction,
        directionConfidence: dir.confidence,
        directionSignals: dir.signals,
    };
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
        scope: disp.scope,
        dispositionConfidence: disp.confidence,
        direction: disp.direction,
        directionConfidence: disp.directionConfidence,
        directionSignals: disp.directionSignals,
        주문: disp.주문.slice(0, 200),
    };
};

module.exports = {
    DISPOSITION,
    SCOPE,
    DIRECTION,
    detectAppellants,
    classifyDirection,
    CASE_TYPE,
    classifyScope,
    stripTags,
    extractDisposition,
    classifyDisposition,
    extractJustices,
    classifyEnBanc,
    normalize,
};
