/**
 * Claude API 기반 AI 양형 예측 생성 스크립트
 *
 * 25명 내란 피고인에 대해 3단계 파이프라인으로 양형을 예측하고
 * Firestore sentencingData/{이름}/claudePrediction 에 저장합니다.
 *
 * 사용법:
 *   ANTHROPIC_API_KEY=sk-... node generate_claude_predictions.js
 *
 * 특징:
 *   - 모델: claude-sonnet-4-20250514
 *   - 톤: 법학 교수·전 판사 출신 양형 분석가 (냉정·객관적·정치적 중립)
 *   - 3단계: 법률 분석 → 역사적 선례 비교 → 최종 예측
 *   - 순차 실행, 2초 대기 (rate limit), 실패 시 건너뛰기
 */

const Anthropic = require('@anthropic-ai/sdk');
const admin = require('firebase-admin');
const path = require('path');

// ============================================================
// Firebase 초기화
// ============================================================
const serviceAccountPath = path.resolve('C:/Users/lacoi/Desktop/hybrid-jury-system/serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath))
});
const db = admin.firestore();

// ============================================================
// Claude 클라이언트 (ANTHROPIC_API_KEY 환경변수 자동 사용)
// ============================================================
const anthropic = new Anthropic();
const MODEL = 'claude-sonnet-4-20250514';

// ============================================================
// 역사적 선례 데이터
// ============================================================
const HISTORICAL_PRECEDENTS = {
    chundoohwan: {
        name: '전두환', year: 1996,
        charges: '내란수괴 (형법 제87조), 내란목적살인 (형법 제88조)',
        background: '1979년 12.12 군사반란으로 군권 장악 후 1980년 5.18 광주민주화운동 유혈진압.',
        firstInstance: '사형 (1996.8.26)',
        appeal: '무기징역 (1996.12.16)',
        supremeCourt: '무기징역 확정 (1997.4.17)',
        finalResult: '1997.12.22 특별사면',
        aggravatingFactors: ['군사반란 및 내란의 최고 주도자(수괴)', '계엄군 동원 광주 시민 살상 명령', '헌정질서 파괴 및 국가 전복', '대통령 권한 불법 찬탈'],
        mitigatingFactors: ['항소심에서 내란목적살인 일부 감경', '사건 발생 후 16년 경과', '국민 화합 차원 정치적 고려']
    },
    nohtaewoo: {
        name: '노태우', year: 1996,
        charges: '내란중요임무종사 (형법 제87조)',
        background: '12.12 군사반란 당시 9사단장으로서 핵심 전투부대 동원하여 전두환 군사반란 지원.',
        firstInstance: '징역 22년 6개월 (1996.8.26)',
        appeal: '징역 17년 (1996.12.16)',
        supremeCourt: '징역 17년 확정 (1997.4.17)',
        finalResult: '1997.12.22 특별사면',
        aggravatingFactors: ['군사반란의 핵심 실행자', '9사단 병력 동원 반란 성공 결정적 기여', '내란 후 권력 핵심부 진입'],
        mitigatingFactors: ['수괴가 아닌 중요임무종사자 지위', '전두환 대비 종속적 역할', '항소심에서 역할 재평가']
    },
    kimjaegyu: {
        name: '김재규', year: 1979,
        charges: '내란목적살인 (형법 제88조), 살인 (형법 제250조)',
        background: '1979.10.26 중앙정보부장이 박정희 대통령과 차지철 경호실장 사살.',
        firstInstance: '사형 (1980.5.20)',
        supremeCourt: '사형 확정 (대법원 전원합의체)',
        finalResult: '1980.5.24 사형 집행',
        aggravatingFactors: ['대통령 시해', '헌정질서 중대 침해', '계획적 범행', '다수 살상'],
        mitigatingFactors: ['유신독재 종식 목적 주장 (법원 불인정)']
    },
    leesukki: {
        name: '이석기', year: 2014,
        charges: '내란음모 (형법 제90조), 내란선동 (형법 제90조)',
        background: '통합진보당 국회의원이 2013년 지하혁명조직 회합에서 내란 선동.',
        firstInstance: '징역 12년 (2014.2.17)',
        appeal: '징역 9년 (2014.8.11) - 내란음모 무죄, 내란선동만 유죄',
        supremeCourt: '징역 9년 확정 (2015.1.22)',
        finalResult: '2021.12.31 특별사면',
        aggravatingFactors: ['현직 국회의원의 내란 관련 범죄', '지하혁명조직 활용 조직적 범행', '국가안보 중대 위협'],
        mitigatingFactors: ['항소심에서 내란음모 무죄', '실제 폭동에 이르지 않음', '실현가능성 낮음']
    }
};

// ============================================================
// 피고인 25명 데이터
// ============================================================
const FRONTEND_SENTENCING_DATA = {
    '윤석열': {
        position: '대통령 (직무정지)',
        charges: '내란수괴 (형법 제87조), 특수공무집행방해 등',
        prosecutionRequest: '내란수괴: 사형 구형 + 특수공무집행방해 등: 징역 10년 구형',
        verdict: '내란수괴: 무기징역 (2026.2.19) + 체포방해 등: 징역 5년 (2026.1.16)',
        ratio: '사형→무기징역 (감경)',
        sentencingGuidelines: {
            aggravating: ['범행을 주도적으로 계획·지시', '국회 기능 마비 시도', '대통령으로서 헌법 수호 의무 중대 위반', '재판 출석 거부 및 반성 부재', '막대한 사회적 비용 초래'],
            mitigating: ['계엄이 수시간 만에 해제', '실질적 인명 피해 없음']
        },
        pendingTrials: ['일반이적 (형법 제93조) - 평양 무인기 대북전단 살포로 북한 도발 유도', '위증, 채상병 수사외압, 이종섭 범인도피교사, 명태균 게이트, 20대 대선 허위사실공표'],
        uncharged: ['외환유치 (형법 제92조)', '여적 (형법 제93조)', '내란목적살인예비 (형법 제88조)'],
        verdictOmissions: ['노상원 수첩 증거능력 배척', '계엄 모의 시점 축소', '외환죄 별도 재판 분리', '내란목적살인예비 미적용']
    },
    '김용현': {
        position: '전 국방부 장관',
        charges: '내란중요임무종사 (형법 제87조)',
        prosecutionRequest: '무기징역 (특검 구형)',
        verdict: '징역 30년 (2026.2.19 선고)',
        ratio: '무기징역→30년 (감경)',
        sentencingGuidelines: {
            aggravating: ['비상계엄을 주도적으로 준비', '부정선거 수사 등 독단적 계획 수립', '대통령의 비이성적 결심 조장', '안가회동 5회 주도', '롯데리아 회동 주관', '군·경찰 양면 동원 총괄'],
            mitigating: ['내란수괴가 아닌 종사자 지위']
        },
        pendingTrials: ['일반이적 (형법 제93조)']
    },
    '한덕수': {
        position: '전 국무총리',
        charges: '내란중요임무종사 (형법 제87조), 허위공문서 작성, 대통령기록물법 위반, 위증',
        prosecutionRequest: '징역 15년 (특검 구형)',
        verdict: '징역 23년, 법정구속 (2026.1.21)',
        ratio: '구형의 약 1.5배 (8년 초과)',
        sentencingGuidelines: {
            aggravating: ['국무총리 직위의 중대성', '헌법 수호 의무 위반', '국헌문란 목적 내란 가담'],
            mitigating: ['직접 병력 동원은 아님']
        }
    },
    '이상민': {
        position: '전 행정안전부 장관',
        charges: '내란중요임무종사 (형법 제87조), 위증',
        prosecutionRequest: '징역 15년 (특검 구형)',
        verdict: '징역 7년 (직권남용 무죄) (2026.2.12)',
        ratio: '구형의 47%',
        sentencingGuidelines: {
            aggravating: ['국가 존립 위태롭게 함', '장관급 고위직 가담'],
            mitigating: ['직접 실행행위 아닌 지시 전달']
        }
    },
    '김건희': {
        position: '대통령 배우자',
        charges: '도이치모터스 주가조작 (자본시장법 위반), 정치자금법 위반, 알선수재',
        prosecutionRequest: '징역 15년, 벌금 20억원, 추징금 9억 4,800만원 (특검 구형)',
        verdict: '징역 1년 8개월, 추징금 1,281만 5,000원 (주가조작·정치자금법 무죄) (2026.1.28)',
        ratio: '구형의 약 1/9 수준',
        sentencingGuidelines: {
            aggravating: ['공무원 배우자 지위 이용', '금품 수수', '반복적 범행', '검찰 수사 무마 개입 의혹'],
            mitigating: ['초범', '공동정범 요건 불성립(주가조작)', '명태균 진술 신빙성 부족(정치자금)']
        },
        pendingTrials: ['도이치모터스 주가조작 항소심 (특검 항소)', '정치자금법 위반 항소심']
    },
    '조지호': {
        position: '전 경찰청장',
        charges: '내란중요임무종사 (형법 제87조)',
        prosecutionRequest: '징역 20년 (특검 구형)',
        verdict: '징역 12년 (2026.2.19 선고)',
        ratio: '구형의 60%',
        sentencingGuidelines: {
            aggravating: ['경찰청장으로서 포고령 위법성 미검토', '군의 국회 진입 조력', '국회의원 출입 차단 지시'],
            mitigating: ['상급자 지시에 따른 측면']
        }
    },
    '김봉식': {
        position: '전 서울경찰청장',
        charges: '내란중요임무종사 (형법 제87조)',
        prosecutionRequest: '징역 15년 (특검 구형)',
        verdict: '징역 10년 (2026.2.19 선고)',
        ratio: '구형의 67%',
        sentencingGuidelines: {
            aggravating: ['서울경찰청장으로서 국회 봉쇄 가담', '안가회동 문건 수령', '포고령 위법성 미검토'],
            mitigating: ['상급자 지시에 따른 측면', '직접 군사작전 지휘는 아님']
        }
    },
    '노상원': {
        position: '전 국군정보사령관 (예비역, 민간인)',
        charges: '내란중요임무종사 (형법 제87조), 내란목적살인예비',
        prosecutionRequest: '징역 30년 (내란 본건)',
        verdict: '징역 18년 (2026.2.19 선고) + 별건 징역 2년',
        ratio: '구형의 60%',
        sentencingGuidelines: {
            aggravating: ['계엄 사전 모의 핵심 참여 — 22회 대통령 공관 방문', '포고령 초안 작성 및 USB 전달', '선관위 침입 지휘', '체포·살해 명단 수첩 기록 (70페이지)', '예비역 민간인이면서 현역 장성급 역할'],
            mitigating: ['예비역 민간인으로서 직접 지휘권 부재']
        },
        notebook: {
            description: '70페이지 수기 메모',
            content: ['500명 체포 대상 명단', '살해 방법 기록', '수용 장소', 'NLL 북한 공격 유도', '3선 개헌 계획'],
            evidenceStatus: '1심 증거능력 배척 (지귀연 재판부), 항소심 재검토 가능'
        }
    },
    '목현태': {
        position: '전 서울경찰청 국회경비대장',
        charges: '내란중요임무종사 (형법 제87조)',
        prosecutionRequest: '징역 12년 (특검 구형)',
        verdict: '징역 3년 (2026.2.19 선고)',
        ratio: '구형의 25%',
        sentencingGuidelines: {
            aggravating: ['국회경비대장으로서 국회의원 출입 차단 지시', '계엄해제 의결 방해'],
            mitigating: ['하급자로서 독자적 판단 여지 제한']
        }
    },
    '여인형': {
        position: '전 국군방첩사령관',
        charges: '내란중요임무종사 (형법 제87조), 일반이적 (형법 제99조)',
        prosecutionRequest: '미정 (재판 진행 중)',
        verdict: '미선고 (2026.2.11 첫 공판, 혐의 전면 부인)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['방첩사령관으로서 계엄 핵심 모의 참여', '방첩사 체포조 운영 지휘', '일반이적 추가 기소', '계엄 명분 마련 목적의 대북 도발 기획'],
            mitigating: ['혐의 전면 부인', '상급자 지시에 따른 측면']
        }
    },
    '문상호': {
        position: '전 국군정보사령관',
        charges: '내란중요임무종사 (형법 제87조), 군사기밀누설, 직권남용',
        prosecutionRequest: '미정 (재판 진행 중)',
        verdict: '미선고 (재판 진행 중)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['정보사 요원 30여명 개인정보를 민간인에게 전달', '선관위 침투 지휘', '포승줄로 묶고 복면 씌워 이송 지시', '롯데리아 회동 참석', '군사기밀 누설'],
            mitigating: ['상급자 지시에 따른 측면']
        }
    },
    '박안수': {
        position: '전 육군참모총장 (계엄사령관)',
        charges: '내란중요임무종사 (형법 제87조), 직권남용',
        prosecutionRequest: '미정 (재판 진행 중)',
        verdict: '미선고 (서울중앙지법 이송 요청 중)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['계엄사령관으로서 불법 계엄 포고령 발령', '국회에 무장 병력 투입 지휘', '위헌적 포고령으로 정당·국회 활동 금지'],
            mitigating: ['상급자(대통령) 지시에 의한 측면']
        }
    },
    '이진우': {
        position: '전 수도방위사령관',
        charges: '내란중요임무종사 (형법 제87조)',
        prosecutionRequest: '미정 (재판 진행 중)',
        verdict: '미선고 (2026.2.11 첫 공판, 혐의 부인)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['수방사 병력 약 3,300명 동원하여 국회 봉쇄', '윤석열 대통령 직접 전화로 독촉', '탄핵심판 위증 혐의 추가'],
            mitigating: ['혐의 부인', '외부 위협 방어 및 질서 유지 목적 주장']
        }
    },
    '곽종근': {
        position: '전 육군특수전사령관',
        charges: '내란중요임무종사 (형법 제87조), 직권남용',
        prosecutionRequest: '미정 (재판 진행 중)',
        verdict: '미선고 (재판 진행 중)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['특전사 부대를 직접 이끌고 국회 진입 지시', '문 부수고 의원 끌어내라 지시', '롯데리아 회동 참석', '국회 주권 직접 침해'],
            mitigating: ['상급자 지시에 따른 측면']
        }
    },
    '추경호': {
        position: '국민의힘 전 원내대표',
        charges: '내란중요임무종사 (형법 제87조)',
        prosecutionRequest: '미정 (2026.3.25 첫 정식재판 예정)',
        verdict: '미선고 (불구속 기소, 구속영장 기각)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['국회 계엄 해제 표결 방해', '긴급 의원총회 장소 변경으로 의원 소집 지연'],
            mitigating: ['불구속 상태', '직접 병력 동원은 아님']
        }
    },
    '박성재': {
        position: '전 법무부 장관',
        charges: '내란중요임무종사 (형법 제87조), 직권남용, 청탁금지법 위반',
        prosecutionRequest: '미정 (재판 진행 중)',
        verdict: '미선고 (불구속 기소, 주 2회 재판 중)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['안가회동 참석', '검사 파견 및 구치소 수용 공간 확보 지시', '김건희 수사 무마 의혹'],
            mitigating: ['불구속 상태', '직접 병력 동원은 아님']
        }
    },
    '박종준': {
        position: '대통령경호처장',
        charges: '내란중요임무종사 (형법 제87조), 특수공무집행방해',
        prosecutionRequest: '미정 (재판 진행 중)',
        verdict: '미선고 (재판 진행 중)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['대통령 체포영장 집행 방해 (2025.1.3 1차 실패)', '2차 체포 시에도 저항 조직', '경호처 무력화 시도'],
            mitigating: ['직무 범위 내 행위 주장']
        }
    },
    '조태용': {
        position: '전 국가정보원장',
        charges: '직무유기, 국정원법 위반 (정치 중립 위반)',
        prosecutionRequest: '미정 (재판 진행 중)',
        verdict: '미선고 (구속 기소, 2026.2.4 첫 공판 혐의 전면 부인)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['계엄 선포 계획 알고도 국회 정보위에 미보고', '국민의힘에만 CCTV 영상 선별 제공', '체포 계획 들었으나 침묵'],
            mitigating: ['혐의 전면 부인', '직접 내란 실행행위는 아님']
        }
    },
    '최상목': {
        position: '전 경제부총리 (대통령 권한대행)',
        charges: '직무유기 (형법 제122조)',
        prosecutionRequest: '미정 (재판 진행 중)',
        verdict: '미선고 (재판 진행 중)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['대통령 탄핵 후 권한대행으로서 헌재 재판관 임명 거부', '헌법재판소 정상 운영 방해'],
            mitigating: ['내란 직접 가담은 아님', '직무유기 단독 혐의']
        }
    },
    '김태효': {
        position: '전 대통령실 국가안보실 1차장',
        charges: '직무유기, 국정원법 위반',
        prosecutionRequest: '미정 (재판 진행 중)',
        verdict: '미선고 (재판 진행 중)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['계엄 관련 정보 인지 후 보고 의무 불이행', '국가안보실 1차장으로서 중대한 직무 태만'],
            mitigating: ['직접 내란 실행행위는 아님', '직무유기 단독 혐의']
        }
    },
    '심우정': {
        position: '전 검찰총장',
        charges: '직무유기, 직권남용',
        prosecutionRequest: '미정 (재판 진행 중)',
        verdict: '미선고 (재판 진행 중)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['검찰총장으로서 내란 수사 지연/방해 의혹', '김건희 수사 무마 관련 지휘 라인', '디가우징(데이터 완전 삭제) 당시 검찰 수뇌부'],
            mitigating: ['직접 내란 가담은 아님', '직무유기/직권남용 혐의']
        }
    },
    '이완규': {
        position: '전 법제처장',
        charges: '위증 (국회증언감정법), 내란 방조 수사 중',
        prosecutionRequest: '위증 재판 진행 중 + 내란 방조 수사 중',
        verdict: '미선고 (재판 진행 중)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['안가회동 참석', '비상계엄 법적 정당성 자문 의혹', '국회 위증', '윤석열 사법연수원 동기 — 핵심 법률 측근'],
            mitigating: ['직접적 내란 실행 행위 아님', '불구속 상태']
        }
    },
    '김주현': {
        position: '전 대통령실 민정수석',
        charges: '직권남용권리행사방해, 내란 방조 수사 중',
        prosecutionRequest: '직권남용 재판 진행 중 + 내란 방조 수사 중',
        verdict: '미선고 (재판 진행 중)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['안가회동 참석', '계엄선포문 사후 작성 관여', '헌법재판관 3인 졸속 지명', '대통령 핵심 법률 참모'],
            mitigating: ['직접적 내란 실행 행위 아님', '불구속 상태', '대통령 지시에 따른 업무 수행']
        }
    },
    '김용군': {
        position: '전 대통령 부속실장',
        charges: '미상 (수사 진행 중)',
        prosecutionRequest: '미정',
        verdict: '미선고',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['대통령 최측근으로서 계엄 관련 일정 조율 의혹'],
            mitigating: ['구체적 혐의 미확정']
        }
    },
    '윤승영': {
        position: '전 경찰청 국수본 수사기획조정관 (치안정감)',
        charges: '내란중요임무종사 (형법 제87조), 직권남용권리행사방해',
        prosecutionRequest: '불구속 기소 (2025.2.28)',
        verdict: '무죄 (2026.2.19 선고)',
        ratio: '무죄 (내란죄·직권남용 모두 무죄)',
        sentencingGuidelines: {
            aggravating: ['방첩사 체포조 편성 시 경찰 인력 지원 중간 보고·조정'],
            mitigating: ['비상계엄 매뉴얼에 따른 합동수사단 지원으로 오인 — 재판부 수용', '체포 대상을 정치인이 아닌 포고령 위반 사범으로 인식', '국회 활동 저지·마비 목적 공유 증거 부족', '명령 전달자(중간 실무급)로서 범의 불인정']
        }
    }
};

// ============================================================
// Claude API 호출 헬퍼
// ============================================================
async function callClaude(systemPrompt, userPrompt) {
    const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
}

// ============================================================
// 공범 판결 요약 생성
// ============================================================
function buildCodefendantSummary(excludeName) {
    return Object.entries(FRONTEND_SENTENCING_DATA)
        .filter(([name]) => name !== excludeName)
        .map(([name, d]) => {
            const parts = [`${name} (${d.position}): ${d.charges}`];
            parts.push(`구형: ${d.prosecutionRequest}`);
            parts.push(`판결: ${d.verdict}`);
            parts.push(`비율: ${d.ratio}`);
            return parts.join(' / ');
        })
        .join('\n');
}

// ============================================================
// 선고 완료된 공범 목록
// ============================================================
function buildSentencedCodefendants(excludeName) {
    return Object.entries(FRONTEND_SENTENCING_DATA)
        .filter(([name, d]) => name !== excludeName && d.ratio !== '미선고')
        .map(([name, d]) => `${name} (${d.position}): ${d.verdict} (${d.ratio})`)
        .join('\n');
}

// ============================================================
// 3단계 파이프라인
// ============================================================
async function generatePrediction(defendant, data) {
    const sentencedCodefendants = buildSentencedCodefendants(defendant);
    const allCodefendants = buildCodefendantSummary(defendant);

    // 노상원 수첩 정보 (해당 피고인과 관련 시)
    const notebookInfo = FRONTEND_SENTENCING_DATA['노상원']?.notebook;
    const notebookSection = notebookInfo
        ? `\n## 노상원 수첩 (70페이지 수기 메모 — "계엄의 스모킹건")
- 설명: ${notebookInfo.description}
- 내용: ${notebookInfo.content.join(', ')}
- 증거 상태: ${notebookInfo.evidenceStatus}`
        : '';

    // ── Step 1: 법률 분석 ──────────────────────────────────────────

    const step1System = `당신은 대한민국 형법·양형 전문 법학 교수입니다. 모든 분석은 실정법과 판례에 근거해야 하며, 개인적 의견이나 정치적 판단을 배제하십시오. 오직 법조문, 양형기준, 판례법리만을 근거로 분석하십시오.`;

    const step1User = `다음 피고인에 대한 법률 분석을 수행하십시오.

## 내란죄 관련 법정형 체계

### 형법 제87조 (내란) - 국헌문란 목적 폭동
1호. 내란수괴: 사형·무기징역·무기금고만 가능 (유기징역 법률상 불가)
2호. 내란중요임무종사: 사형, 무기 또는 5년 이상의 징역이나 금고
3호. 부화수행·단순관여: 5년 이하의 징역 또는 금고

### 형법 제88조 (내란목적살인)
내란 목적으로 사람을 살해한 자: 사형·무기 또는 7년 이상의 징역

### 형법 제89조 (미수범)
내란죄의 미수범은 처벌 (법정형 기수범과 동일)

### 형법 제90조 (예비·음모·선전·선동)
내란 예비·음모: 3년 이상의 유기징역·유기금고
내란 선전·선동: 동일

### 형법 제91조 (국헌문란의 정의)
1호. 헌법·법률에 정한 절차에 의하지 않고 헌법·법률의 기능을 소멸시키는 것
2호. 헌법에 의하여 설치된 국가기관을 강압에 의하여 전복 또는 그 권능행사를 불가능하게 하는 것

### 외환죄 (별도 재판)
- 형법 제92조 (외환유치): 사형 또는 무기징역
- 형법 제93조 (여적): 사형(단일형)
- 형법 제99조 (일반이적): 무기 또는 3년 이상 징역

### 경합범 가중
형법 제37조·제38조: 동시 판결 시 가장 중한 죄의 장기에 1/2 가중

## 피고인 정보
- 이름: ${defendant}
- 직위: ${data.position}
- 혐의: ${data.charges}
- 검찰 구형: ${data.prosecutionRequest}
- 판결: ${data.verdict}

## 양형 사유
- 가중: ${data.sentencingGuidelines.aggravating.join(' / ')}
- 감경: ${data.sentencingGuidelines.mitigating.join(' / ')}

${data.pendingTrials ? `## 별도 진행 중인 추가 재판\n${data.pendingTrials.map(t => `- ${t}`).join('\n')}` : ''}

${data.uncharged ? `## 미기소 혐의\n${data.uncharged.map(u => `- ${u}`).join('\n')}` : ''}

${data.verdictOmissions ? `## 1심 판결 누락/배척 사항\n${data.verdictOmissions.map(o => `- ${o}`).join('\n')}` : ''}

다음 JSON 형식으로만 응답하십시오:
{
    "applicableLaws": ["5개 이상, 법조문 번호와 법정형 범위 명시"],
    "statutoryRange": "법정형 범위 분석 (3-5문장)",
    "aggravatingFactors": ["5개 이상, 각 2-3문장"],
    "mitigatingFactors": ["3개 이상, 각 2-3문장"],
    "keyLegalIssues": ["4개 이상, 각 3-4문장"],
    "sentencingFramework": "양형 범위 분석 (5-7문장)"
}`;

    console.log(`  [Step 1/3] 법률 분석 중...`);
    let step1Data;
    try {
        step1Data = await callClaude(step1System, step1User);
    } catch (e) {
        console.error(`  [Step 1] 파싱 실패, 기본값 사용: ${e.message}`);
        step1Data = {
            applicableLaws: [],
            statutoryRange: '분석 실패',
            aggravatingFactors: [],
            mitigatingFactors: [],
            keyLegalIssues: [],
            sentencingFramework: '분석 실패'
        };
    }

    // ── Step 2: 역사적 선례 비교 ──────────────────────────────────

    const step2System = `당신은 대한민국 형사법 판례 비교분석 전문가입니다. 감정적 서술을 배제하고, 법리적 유사점과 차이점만을 분석하십시오. 각 선례와의 비교에서 양형에 미친 구체적 영향을 정량적으로 분석하십시오.`;

    const allPrecedents = Object.values(HISTORICAL_PRECEDENTS);
    const precedentsText = allPrecedents.map((p, i) => `### 선례 ${i + 1}: ${p.name} (${p.year}년)
- 혐의: ${p.charges}
- 배경: ${p.background}
- 1심: ${p.firstInstance}
- 항소심: ${p.appeal || 'N/A'}
- 대법원: ${p.supremeCourt}
- 최종: ${p.finalResult}
- 가중: ${p.aggravatingFactors.join(', ')}
- 감경: ${p.mitigatingFactors.join(', ')}`).join('\n\n');

    const step2User = `Step 1의 법률 분석 결과를 바탕으로, 역사적 선례와 공범 판결을 비교 분석하십시오.

## Step 1 법률 분석 결과
- 적용법조: ${JSON.stringify(step1Data.applicableLaws)}
- 가중사유: ${JSON.stringify(step1Data.aggravatingFactors)}
- 감경사유: ${JSON.stringify(step1Data.mitigatingFactors)}
- 양형기준: ${step1Data.sentencingFramework}

## 피고인 정보
- 이름: ${defendant}
- 직위: ${data.position}
- 혐의: ${data.charges}
- 검찰 구형: ${data.prosecutionRequest}
- 판결: ${data.verdict}
- 구형 대비 비율: ${data.ratio}

## 역사적 선례 (${allPrecedents.length}건)
${precedentsText}

## 이미 선고된 공범 판결
${sentencedCodefendants || '아직 선고된 공범 없음'}

## 전체 공범 양형 비교
${allCodefendants}
${notebookSection}

${data.verdictOmissions ? `## 1심 판결 누락/배척 사항\n${data.verdictOmissions.map(o => `- ${o}`).join('\n')}` : ''}

다음 JSON 형식으로만 응답하십시오:
{
    "historicalComparison": {
        "chundoohwan": { "similarity": "3-4문장", "difference": "3-4문장", "sentenceImpact": "3-4문장" },
        "nohtaewoo": { "similarity": "3-4문장", "difference": "3-4문장", "sentenceImpact": "3-4문장" },
        "kimjaegyu": { "similarity": "3-4문장", "difference": "3-4문장", "sentenceImpact": "3-4문장" },
        "leesukki": { "similarity": "3-4문장", "difference": "3-4문장", "sentenceImpact": "3-4문장" }
    },
    "codefendantComparison": [
        { "name": "공범 이름", "sentence": "선고 형량", "role": "역할", "comparedToDefendant": "비교 분석 3-4문장" }
    ],
    "precedentSummary": "종합 분석 5-7문장"
}`;

    console.log(`  [Step 2/3] 역사적 선례 비교 중...`);
    let step2Data;
    try {
        step2Data = await callClaude(step2System, step2User);
    } catch (e) {
        console.error(`  [Step 2] 파싱 실패, 기본값 사용: ${e.message}`);
        step2Data = {
            historicalComparison: {},
            codefendantComparison: [],
            precedentSummary: '분석 실패'
        };
    }

    // ── Step 3: 최종 예측 ─────────────────────────────────────────

    const step3System = `당신은 대한민국 형사재판 양형 예측 분석가입니다. 법정형 범위를 엄격히 준수하고, 통계적 패턴과 선례에 기반하여 냉정하게 예측하십시오. 어떠한 정치적·감정적 요소도 예측에 반영하지 마십시오. 이미 선고된 피고인의 경우, 항소심 예측에 집중하십시오.`;

    const ratioStats = Object.entries(FRONTEND_SENTENCING_DATA)
        .map(([name, d]) => `- ${name} (${d.position}): ${d.ratio}`)
        .join('\n');

    const step3User = `Step 1(법률 분석)과 Step 2(선례 비교) 결과를 종합하여 최종 양형을 예측하십시오.

## 법정형 제약 (반드시 준수)
- 내란수괴(형법 제87조 1호): 사형·무기징역·무기금고만 가능. 유기징역 선고 법률상 불가능
- 내란중요임무종사(형법 제87조 2호): 사형, 무기 또는 5년 이상의 징역·금고
- 부화수행(형법 제87조 3호): 5년 이하의 징역·금고
- 이미 무죄가 선고된 피고인(윤승영)의 경우, 검찰 항소 가능성과 항소심 결과를 예측할 것
${step1Data.statutoryRange ? `- Step 1 법정형 분석: ${step1Data.statutoryRange}` : ''}

## Step 1 법률 분석 요약
- 적용법조: ${JSON.stringify(step1Data.applicableLaws)}
- 가중사유 수: ${step1Data.aggravatingFactors?.length || 0}개
- 감경사유 수: ${step1Data.mitigatingFactors?.length || 0}개
- 양형기준: ${step1Data.sentencingFramework}

## Step 2 선례 분석 요약
- 역사적 선례 비교: ${allPrecedents.length}건 분석 완료
- 공범 비교: ${step2Data.codefendantComparison?.length || 0}건
- 선례 종합: ${step2Data.precedentSummary}

## 피고인 정보
- 이름: ${defendant}
- 직위: ${data.position}
- 혐의: ${data.charges}
- 검찰 구형: ${data.prosecutionRequest}
- 판결: ${data.verdict}
- 구형 대비 비율: ${data.ratio}

## 공범별 구형 대비 선고 비율 통계
${ratioStats}

위 정보를 종합하여 최종 양형을 예측하십시오. 반드시 해당 죄명의 법정형 범위 내에서만 예측할 것.

다음 JSON 형식으로만 응답하십시오:
{
    "predictedSentence": {
        "range": "법정형 범위 내 예측 양형 범위",
        "mostLikely": "가장 유력한 양형",
        "confidence": "high/medium/low",
        "reasoning": "3-4문장"
    },
    "sentencingReasoning": "10-15문장 상세 분석",
    "riskFactors": [
        { "factor": "위험 요인", "impact": "2-3문장", "probability": "high/medium/low" }
    ],
    "appealOutlook": {
        "likelihood": "항소 가능성",
        "expectedChange": "2-3문장",
        "finalOutlook": "2-3문장"
    }
}`;

    console.log(`  [Step 3/3] 최종 예측 중...`);
    let step3Data;
    try {
        step3Data = await callClaude(step3System, step3User);
    } catch (e) {
        console.error(`  [Step 3] 파싱 실패, 기본값 사용: ${e.message}`);
        step3Data = {
            predictedSentence: { range: '분석 실패', mostLikely: '분석 실패', confidence: 'low', reasoning: '파싱 실패' },
            sentencingReasoning: '분석 실패',
            riskFactors: [],
            appealOutlook: { likelihood: 'unknown', expectedChange: '분석 실패', finalOutlook: '분석 실패' }
        };
    }

    // ── 3단계 결과 병합 ───────────────────────────────────────────

    return {
        ...step1Data,
        ...step2Data,
        ...step3Data
    };
}

// ============================================================
// 메인 실행
// ============================================================
async function main() {
    const defendants = Object.keys(FRONTEND_SENTENCING_DATA);
    console.log(`\n========================================`);
    console.log(`Claude AI 양형 예측 생성`);
    console.log(`모델: ${MODEL}`);
    console.log(`대상: ${defendants.length}명`);
    console.log(`========================================\n`);

    const results = { success: [], failed: [] };

    for (const name of defendants) {
        const idx = results.success.length + results.failed.length + 1;
        try {
            console.log(`[${idx}/${defendants.length}] ${name} (${FRONTEND_SENTENCING_DATA[name].position}) 예측 중...`);

            const prediction = await generatePrediction(name, FRONTEND_SENTENCING_DATA[name]);

            // Firestore 저장 (claudePrediction 필드만, 기존 aiPrediction 유지)
            await db.collection('sentencingData').doc(name).set({
                claudePrediction: {
                    ...prediction,
                    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    model: MODEL,
                    version: 'v1.0',
                    analysisSteps: 3,
                    historicalPrecedentCount: Object.keys(HISTORICAL_PRECEDENTS).length
                },
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            results.success.push(name);
            console.log(`  [완료] ${name} - Firestore 저장 성공`);

            // rate limit 대기 (2초)
            if (idx < defendants.length) {
                await new Promise(r => setTimeout(r, 2000));
            }
        } catch (error) {
            console.error(`  [실패] ${name}: ${error.message}`);
            results.failed.push({ name, error: error.message });
        }
    }

    console.log(`\n========================================`);
    console.log(`실행 완료`);
    console.log(`  성공: ${results.success.length}명`);
    console.log(`  실패: ${results.failed.length}명`);
    if (results.failed.length > 0) {
        console.log(`  실패 목록:`);
        results.failed.forEach(f => console.log(`    - ${f.name}: ${f.error}`));
    }
    console.log(`========================================\n`);

    process.exit(0);
}

main().catch(err => {
    console.error('치명적 오류:', err);
    process.exit(1);
});
