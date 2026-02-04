// 국가법령정보 OPEN API 서비스 레이어
const isLocal = window.location.hostname === 'localhost';
const LAW_API_BASE = isLocal
    ? 'http://localhost:5001/siminbupjung-blog/us-central1/lawApi'
    : 'https://us-central1-siminbupjung-blog.cloudfunctions.net/lawApi';

const CACHE_DURATION = 30 * 60 * 1000; // 30분

async function callLawApi(params) {
    const cacheKey = `lawApi_${JSON.stringify(params)}`;

    // 캐시 확인
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                return data;
            }
        }
    } catch (e) {
        // 캐시 오류 무시
    }

    try {
        const queryParams = new URLSearchParams(params);
        const response = await fetch(`${LAW_API_BASE}?${queryParams.toString()}`);

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();

        // 캐시 저장
        try {
            localStorage.setItem(cacheKey, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (e) {
            // 스토리지 가득 참 등 무시
        }

        return data;
    } catch (error) {
        console.error('Law API error:', error);
        return null;
    }
}

// 법령 검색
export async function searchLaws(query, options = {}) {
    return callLawApi({
        target: 'law',
        query,
        type: 'JSON',
        display: options.display || 20,
        page: options.page || 1,
        ...(options.search && { search: options.search })
    });
}

// 법령 상세 조회
export async function getLawDetail(mst) {
    return callLawApi({
        target: 'law',
        MST: mst,
        type: 'JSON'
    });
}

// 판례 검색
export async function searchPrecedents(query, options = {}) {
    return callLawApi({
        target: 'prec',
        query,
        type: 'JSON',
        display: options.display || 20,
        page: options.page || 1
    });
}

// 판례 상세 조회
export async function getPrecedentDetail(id) {
    return callLawApi({
        target: 'prec',
        ID: id,
        type: 'JSON'
    });
}

// 헌재결정례 검색
export async function searchConstitutionalDecisions(query, options = {}) {
    return callLawApi({
        target: 'detc',
        query,
        type: 'JSON',
        display: options.display || 20,
        page: options.page || 1
    });
}

// 헌재결정례 상세 조회
export async function getConstitutionalDecisionDetail(id) {
    return callLawApi({
        target: 'detc',
        ID: id,
        type: 'JSON'
    });
}

// 법률용어 검색
export async function searchLegalTerms(query) {
    return callLawApi({
        target: 'lsTrm',
        query,
        type: 'JSON',
        display: 20
    });
}

// 법령해석례 검색
export async function searchLawInterpretations(query, options = {}) {
    return callLawApi({
        target: 'expc',
        query,
        type: 'JSON',
        display: options.display || 20,
        page: options.page || 1
    });
}
