import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import SEOHead from '../components/SEOHead';
import { searchLaws, searchPrecedents, searchConstitutionalDecisions, searchLegalTerms, searchLawInterpretations } from '../lib/lawApi';
import SNSShareBar from '../components/SNSShareBar';

// ============================================
// 정적 데이터 (API 실패 시 폴백)
// ============================================

const CRIMINAL_LAW_ARTICLES = [
    {
        number: '제87조',
        title: '내란',
        text: '국토를 참절하거나 국헌을 문란할 목적으로 폭동한 자는 다음의 구별에 의하여 처단한다.\n1. 수괴는 사형, 무기징역 또는 무기금고에 처한다.\n2. 모의에 참여하거나 지휘하거나 기타 중요한 임무에 종사한 자는 사형, 무기 또는 5년 이상의 징역이나 금고에 처한다. 죄를 실행을 위하여 병기를 반포하거나 폭발물 기타 위험한 물건을 사용한 자도 같다.\n3. 부화수행하거나 단순히 폭동에만 관여한 자는 5년 이하의 징역 또는 금고에 처한다.',
        appliedTo: ['윤석열 (내란수괴)', '한덕수 (내란중요임무종사)', '김용현', '곽종근', '여인형', '이진우', '이상민', '박성재'],
        highlight: true
    },
    {
        number: '제88조',
        title: '내란목적의 살인',
        text: '국토를 참절하거나 국헌을 문란할 목적으로 사람을 살해한 자는 사형, 무기징역 또는 무기금고에 처한다.',
        appliedTo: [],
        highlight: false
    },
    {
        number: '제89조',
        title: '미수범',
        text: '전2조의 미수범은 처벌한다.',
        appliedTo: [],
        highlight: false
    },
    {
        number: '제90조',
        title: '예비, 음모, 선동, 선전',
        text: '①제87조 또는 제88조의 죄를 범할 목적으로 예비 또는 음모한 자는 3년 이상의 유기징역이나 유기금고에 처한다. 단, 그 목적한 죄의 실행에 이르기 전에 자수한 때에는 그 형을 감경 또는 면제한다.\n②제87조 또는 제88조의 죄를 범할 것을 선동 또는 선전한 자도 전항의 형과 같다.',
        appliedTo: [],
        highlight: false
    },
    {
        number: '제91조',
        title: '국헌문란의 정의',
        text: '본장에서 국헌을 문란할 목적이라 함은 다음 각호의 1에 해당함을 말한다.\n1. 헌법 또는 법률에 정한 절차에 의하지 아니하고 헌법 또는 법률의 기능을 소멸시키는 것\n2. 헌법에 의하여 설치된 국가기관을 강압에 의하여 전복 또는 그 권능행사를 불가능하게 하는 것',
        appliedTo: [],
        highlight: true
    },
    {
        number: '제93조',
        title: '일반이적',
        text: '적국을 위하여 간첩하거나 적국의 군사상의 이익을 도모한 자는 사형 또는 무기징역에 처한다.',
        appliedTo: ['윤석열', '김용현', '여인형'],
        highlight: false
    }
];

const LEGAL_TERMS = [
    {
        term: '내란',
        definition: '국토를 참절(僭竊)하거나 국헌을 문란할 목적으로 폭동하는 것. 국가의 존립이나 헌법의 기본적 질서를 위태롭게 하는 중대한 범죄.',
        relatedLaw: '형법 제87조',
        caseRelevance: '2024.12.3 비상계엄 선포가 "국헌문란 목적의 폭동"에 해당하는지가 핵심 쟁점'
    },
    {
        term: '내란수괴',
        definition: '내란의 주모자로서 내란을 기획·지휘하는 우두머리. 법정형은 사형, 무기징역 또는 무기금고.',
        relatedLaw: '형법 제87조 제1호',
        caseRelevance: '윤석열 전 대통령이 내란수괴 혐의로 기소됨'
    },
    {
        term: '내란중요임무종사',
        definition: '내란의 모의에 참여하거나 지휘하거나 기타 중요한 임무에 종사하는 것. 법정형은 사형, 무기 또는 5년 이상의 징역이나 금고.',
        relatedLaw: '형법 제87조 제2호',
        caseRelevance: '한덕수, 김용현, 곽종근, 여인형 등이 이 혐의로 기소됨. 한덕수는 징역 23년 선고'
    },
    {
        term: '국헌문란',
        definition: '①헌법 또는 법률에 정한 절차에 의하지 아니하고 헌법 또는 법률의 기능을 소멸시키는 것 ②헌법에 의하여 설치된 국가기관을 강압에 의하여 전복 또는 그 권능행사를 불가능하게 하는 것',
        relatedLaw: '형법 제91조',
        caseRelevance: '재판부는 12.3 비상계엄이 "국회의 권능행사를 불가능하게 하려는 시도"로 국헌문란에 해당한다고 판단'
    },
    {
        term: '필요적 공동정범',
        definition: '범죄의 성질상 2인 이상의 행위자가 있어야만 성립하는 범죄. 내란죄는 다수인의 폭동을 전제하므로 필요적 공동정범에 해당.',
        relatedLaw: '형법 총칙 제30조',
        caseRelevance: '한덕수 재판에서 "내란죄는 필요적 공동정범이므로 방조범이 성립할 수 없다"고 판단 (내란우두머리방조 무죄 근거)'
    },
    {
        term: '공모공동정범',
        definition: '2인 이상이 범죄의 실행을 공모하고 그 공모에 기하여 범죄를 실행한 경우, 실행행위를 직접 분담하지 않은 자도 공동정범으로 처벌하는 법리.',
        relatedLaw: '형법 제30조',
        caseRelevance: '내란 참여자들의 공모 범위와 역할 분담이 각 피고인별 핵심 쟁점'
    },
    {
        term: '비상계엄',
        definition: '전시·사변 또는 이에 준하는 국가비상사태에 있어서 병력으로써 군사상의 필요에 응하거나 공공의 안녕질서를 유지할 필요가 있을 때 대통령이 선포하는 계엄.',
        relatedLaw: '헌법 제77조, 계엄법',
        caseRelevance: '2024.12.3 비상계엄이 헌법상 요건을 충족하지 못한 위법한 계엄인지가 쟁점'
    },
    {
        term: '내란목적살인',
        definition: '국토를 참절하거나 국헌을 문란할 목적으로 사람을 살해하는 것. 법정형은 사형, 무기징역 또는 무기금고.',
        relatedLaw: '형법 제88조',
        caseRelevance: '현재 12.3 사건에서는 내란목적살인 혐의로 기소된 사람은 없음'
    },
    {
        term: '내란불고지',
        definition: '내란의 예비·음모·선동·선전을 알면서도 이를 수사기관 등에 고지하지 않는 것.',
        relatedLaw: '형법 제90조, 제101조',
        caseRelevance: '비상계엄을 사전에 알고도 고지하지 않은 인사들에 대한 수사 가능성'
    },
    {
        term: '일반이적',
        definition: '적국을 위하여 간첩하거나 적국의 군사상의 이익을 도모하는 것. 법정형은 사형 또는 무기징역.',
        relatedLaw: '형법 제93조',
        caseRelevance: '윤석열, 김용현, 여인형이 일반이적 혐의로 추가 기소됨 (2025.11.10)'
    }
];

const LAW_HISTORY_TIMELINE = [
    {
        year: '1953',
        title: '형법 제정',
        description: '대한민국 형법 제정과 함께 내란죄(제87조~제91조) 신설. 일본 형법의 내란죄를 참고하되 독자적 체계로 구성.',
        type: 'creation',
        source: { name: '형법 원문', url: 'https://www.law.go.kr/법령/형법' }
    },
    {
        year: '1961',
        title: '5.16 군사정변',
        description: '박정희 등 군부세력의 군사정변. 이후 "혁명"으로 정당화되어 내란죄 적용이 이루어지지 않음.',
        type: 'event',
        source: { name: '위키백과', url: 'https://ko.wikipedia.org/wiki/5·16_군사_정변' }
    },
    {
        year: '1979',
        title: '12.12 군사반란',
        description: '전두환 등 신군부의 군사반란. 당시에는 처벌되지 않았으나 이후 재판으로 이어짐.',
        type: 'event',
        source: { name: '위키백과', url: 'https://ko.wikipedia.org/wiki/12·12_군사_반란' }
    },
    {
        year: '1980',
        title: '5.18 광주민주화운동',
        description: '신군부의 비상계엄 확대와 무력 진압. 내란목적살인 등 혐의의 역사적 사례.',
        type: 'event',
        source: { name: '5.18기념재단', url: 'https://518.org/' }
    },
    {
        year: '1995',
        title: '5.18 특별법 제정',
        description: '"헌정질서 파괴범죄의 공소시효 등에 관한 특례법" 제정. 내란죄의 공소시효 배제 근거 마련.',
        type: 'amendment',
        source: { name: '특별법 원문', url: 'https://www.law.go.kr/법령/헌정질서파괴범죄의공소시효등에관한특례법' }
    },
    {
        year: '1996',
        title: '12.12/5.18 재판',
        description: '전두환·노태우 등에 대한 내란 재판. 전두환 사형(후 무기징역→특사), 노태우 징역 22년 6월(후 17년→특사). 대한민국 최초의 내란죄 유죄 판결.',
        type: 'verdict',
        source: { name: '대법원 판결문', url: 'https://www.law.go.kr/precInfoP.do?precSeq=188579' }
    },
    {
        year: '2004',
        title: '노무현 대통령 탄핵 사건',
        description: '헌법재판소 2004헌나1 결정. 탄핵 기각. 대통령의 헌법 수호 의무에 대한 헌법적 판단.',
        type: 'constitutional',
        source: { name: '헌재 결정문', url: 'https://www.law.go.kr/detcInfoP.do?mode=0&query=2004%ED%97%8C%EB%82%981' }
    },
    {
        year: '2014',
        title: '통합진보당 해산 결정',
        description: '헌재 2013헌다1 결정. 내란 관련 목적을 가진 정당의 해산 결정. 내란 관련 법리의 현대적 해석.',
        type: 'constitutional',
        source: { name: '헌재 결정문', url: 'https://www.law.go.kr/detcInfoP.do?mode=0&query=2013%ED%97%8C%EB%8B%A41' }
    },
    {
        year: '2016',
        title: '박근혜 대통령 탄핵 사건',
        description: '헌법재판소 2016헌나1 결정. 탄핵 인용. 대통령의 헌법 수호 의무 위반 확인.',
        type: 'constitutional',
        source: { name: '헌재 결정문', url: 'https://www.law.go.kr/detcInfoP.do?mode=0&query=2016%ED%97%8C%EB%82%981' }
    },
    {
        year: '2024.12.3',
        title: '비상계엄 선포',
        description: '윤석열 대통령의 비상계엄 선포. 군 병력의 국회 진입 시도. 약 6시간 만에 해제. 헌정사상 초유의 대통령 주도 내란 의혹.',
        type: 'event',
        source: { name: '연합뉴스', url: 'https://www.yna.co.kr/view/AKR20241203173400001' }
    },
    {
        year: '2025.1',
        title: '윤석열 대통령 체포·구속',
        description: '공수처에 의한 현직 대통령 체포 및 구속. 내란수괴 혐의 적용. 헌정사상 최초.',
        type: 'event',
        source: { name: '연합뉴스', url: 'https://www.yna.co.kr/view/AKR20250119034300004' }
    },
    {
        year: '2026.1.21',
        title: '한덕수 1심 판결',
        description: '12.3 내란 관련 첫 판결. 내란중요임무종사 유죄, 징역 23년 선고. 법원이 12.3 비상계엄을 "국헌문란 목적의 내란"으로 최초 인정.',
        type: 'verdict',
        source: { name: '연합뉴스', url: 'https://www.yna.co.kr/view/AKR20260121089300004' }
    },
    {
        year: '2026.1.28',
        title: '김건희 1심 판결',
        description: '도이치모터스 주가조작 무죄, 알선수재 유죄. 징역 1년 8개월 선고.',
        type: 'verdict',
        source: { name: '연합뉴스', url: 'https://www.yna.co.kr/view/AKR20260128100700004' }
    }
];

const CONSTITUTIONAL_DECISIONS = [
    {
        caseNumber: '2004헌나1',
        title: '노무현 대통령 탄핵 사건',
        date: '2004.5.14',
        result: '기각 (탄핵 기각)',
        summary: '국회의 탄핵소추를 기각. 대통령의 선거중립의무 위반은 인정하였으나, 파면을 정당화할 정도의 중대한 법 위반은 아니라고 판단.',
        significance: '대통령 탄핵의 요건으로 "법 위반의 중대성"이 필요함을 확립',
        source: { name: '헌법재판소', url: 'https://www.law.go.kr/detcInfoP.do?mode=0&query=2004%ED%97%8C%EB%82%981' }
    },
    {
        caseNumber: '2013헌다1',
        title: '통합진보당 해산 사건',
        date: '2014.12.19',
        result: '인용 (정당 해산)',
        summary: '통합진보당의 목적과 활동이 민주적 기본질서에 위배된다고 판단. 내란 관련 목적을 가진 정당의 해산을 결정.',
        significance: '내란 관련 법리의 현대적 해석, 민주적 기본질서의 의미 확립',
        source: { name: '헌법재판소', url: 'https://www.law.go.kr/detcInfoP.do?mode=0&query=2013%ED%97%8C%EB%8B%A41' }
    },
    {
        caseNumber: '2016헌나1',
        title: '박근혜 대통령 탄핵 사건',
        date: '2017.3.10',
        result: '인용 (탄핵 인용, 파면)',
        summary: '대통령의 헌법 수호 의무 위반, 국민주권주의와 법치주의 위반을 인정. 재판관 전원일치로 파면 결정.',
        significance: '대통령의 헌법 수호 의무의 구체적 내용과 위반 시 파면 사유 확립',
        source: { name: '헌법재판소', url: 'https://www.law.go.kr/detcInfoP.do?mode=0&query=2016%ED%97%8C%EB%82%981' }
    },
    {
        caseNumber: '2024헌나1',
        title: '윤석열 대통령 탄핵 사건',
        date: '2025.4.4',
        result: '인용 (탄핵 인용, 파면)',
        summary: '12.3 비상계엄 선포가 헌법 위반이며, 대통령의 헌법 수호 의무를 중대하게 위반했다고 판단. 재판관 전원일치로 파면 결정.',
        significance: '비상계엄의 헌법적 한계, 대통령의 내란 행위에 대한 헌법재판소의 판단',
        source: { name: '헌법재판소', url: 'https://www.law.go.kr/detcInfoP.do?mode=0&query=2024%ED%97%8C%EB%82%981' }
    }
];

// ============================================
// AI 법률 브리프 데이터 (Claude Legal Plugin /brief 스타일)
// ============================================

const AI_LEGAL_BRIEF = [
    {
        articleNumber: '제87조',
        articleTitle: '내란',
        briefSummary: '12.3 내란 사건의 핵심 적용 조항. 수괴(윤석열)에 무기징역, 중요임무종사자들에 7~30년 선고.',
        applicationAnalysis: {
            title: '12.3 내란 사건 적용 분석',
            points: [
                '"국헌문란 목적의 폭동" 요건: 법원은 비상계엄 선포 + 군 병력 국회 투입을 "폭동"으로 인정',
                '수괴(제1호): 윤석열 — 계엄 선포 및 전체 지휘, 무기징역 선고 (사형 구형)',
                '중요임무종사(제2호): 한덕수(23년), 김용현(30년), 이상민(7년), 노상원(18년) 등',
                '부화수행(제3호): 적용된 피고인 없음 — 모두 제2호로 기소',
                '필요적 공동정범: 내란죄는 다수인의 폭동을 전제하므로 방조범 성립 불가'
            ]
        },
        historicalComparison: {
            title: '12.12/5.18 사건과의 비교',
            points: [
                '전두환(수괴): 사형→무기징역→특사 vs 윤석열(수괴): 무기징역 (1심)',
                '노태우(중요임무): 징역 22년6월→17년→특사 vs 한덕수(중요임무): 징역 23년',
                '12.12는 군사반란+내란 병합 적용 vs 12.3은 내란 단독 적용',
                '5.18 당시 민간인 사상자 다수 vs 12.3은 인명 피해 없음에도 중형 선고'
            ]
        },
        keyIssues: [
            '"폭동"의 범위: 물리적 충돌 없이도 군 병력 동원만으로 폭동 인정 가능한지',
            '국헌문란 목적의 인식 범위: 미필적 고의로 충분한지 (무죄 선고 2건의 기준)',
            '필요적 공동정범 법리와 개별 행위자의 책임 한계'
        ],
        defendantRisks: [
            { name: '윤석열', risk: 'critical', reason: '내란수괴로 최고형 적용, 무기징역 선고' },
            { name: '김용현', risk: 'critical', reason: '비상계엄 주도적 준비, 징역 30년' },
            { name: '한덕수', risk: 'high', reason: '국무총리로서 계엄 집행 지원, 징역 23년' },
            { name: '이상민', risk: 'high', reason: '행안부 장관으로서 가담, 징역 7년' },
            { name: '노상원', risk: 'high', reason: '포고령 작성·선관위 침입 지휘, 징역 18년' }
        ]
    },
    {
        articleNumber: '제88조',
        articleTitle: '내란목적의 살인',
        briefSummary: '12.3 사건에서 이 조항으로 기소된 피고인은 없음. 인명 피해 부재가 양형에 참작된 요소.',
        applicationAnalysis: {
            title: '12.3 내란 사건 적용 분석',
            points: [
                '12.3 비상계엄 과정에서 사망자가 발생하지 않아 이 조항은 적용되지 않음',
                '국회 진입 과정에서 물리적 충돌이 있었으나 살인에 이르지는 않음',
                '5.18 광주민주화운동과의 차이점: 당시에는 내란목적살인이 주요 쟁점',
                '인명 피해 미발생이 양형에 참작됨 (특히 윤석열의 사형→무기징역 감형 논거)'
            ]
        },
        historicalComparison: {
            title: '12.12/5.18 사건과의 비교',
            points: [
                '5.18: 수백 명의 민간인 사상자 발생 → 내란목적살인 적용 핵심 쟁점',
                '12.3: 인명 피해 없음 → 내란목적살인 미적용',
                '5.18의 발포 명령 책임자 처벌이 내란목적살인 법리의 실질적 선례'
            ]
        },
        keyIssues: [
            '내란 과정에서 인명 피해가 없었다는 점이 양형에 미치는 영향',
            '미수범 처벌(제89조)과의 관계: 살인 미수 가능성 검토 여부'
        ],
        defendantRisks: [
            { name: '해당 없음', risk: 'low', reason: '12.3 사건에서 이 조항으로 기소된 피고인 없음' }
        ]
    },
    {
        articleNumber: '제89조',
        articleTitle: '미수범',
        briefSummary: '내란죄와 내란목적살인의 미수범을 처벌하는 조항. 12.3 사건은 내란 기수로 인정됨.',
        applicationAnalysis: {
            title: '12.3 내란 사건 적용 분석',
            points: [
                '법원은 12.3 비상계엄을 내란의 기수(旣遂)로 인정 — 미수가 아닌 기수범 처벌',
                '비상계엄 선포 자체가 "폭동"의 완성으로 판단',
                '국회의 계엄 해제 의결로 목적 달성에는 실패했으나, 폭동 행위 자체는 완료',
                '따라서 제89조(미수범)가 아닌 제87조(기수범)로 기소·선고'
            ]
        },
        historicalComparison: {
            title: '역사적 비교',
            points: [
                '12.12/5.18도 내란 기수로 인정 — 미수범 조항 미적용',
                '내란죄에서 미수와 기수의 구분: "폭동 개시" 시점이 기수 성립 시점',
                '실제로 내란 미수로 처벌된 역사적 사례는 극히 드묾'
            ]
        },
        keyIssues: [
            '내란의 기수 시점: 계엄 선포 vs 군 병력 투입 vs 국회 봉쇄 시도',
            '목적 달성 실패와 기수 인정의 관계'
        ],
        defendantRisks: [
            { name: '해당 없음', risk: 'low', reason: '기수범 적용으로 미수범 조항 미적용' }
        ]
    },
    {
        articleNumber: '제90조',
        articleTitle: '예비, 음모, 선동, 선전',
        briefSummary: '내란의 예비·음모를 처벌. 12.3 이전 사전모의 행위가 이 조항과 관련되나, 실제로는 제87조로 기소.',
        applicationAnalysis: {
            title: '12.3 내란 사건 적용 분석',
            points: [
                '노상원 수첩: 계엄 사전 모의 증거로 제출 — 증거능력 논란',
                '롯데리아 회동(2024.11): 곽종근·노상원 등의 사전 모의 장소',
                '사전 모의 행위는 제90조 해당이나, 내란 실행으로 이어져 제87조로 기소',
                '예비·음모 단계를 넘어 실행(폭동)에 이르렀으므로 제90조 별도 적용 불필요',
                '자수 감경 규정(단서): 해당 피고인 중 자수한 사례 없음'
            ]
        },
        historicalComparison: {
            title: '역사적 비교',
            points: [
                '이석기 사건(2015): 내란음모죄(제90조)로 징역 9년 선고 — 실행 미착수로 음모죄 적용',
                '12.3 사건: 실행 착수→완료로 제87조 적용 (제90조 별도 적용 없음)',
                '이석기 사건이 내란음모죄 적용의 현대적 선례'
            ]
        },
        keyIssues: [
            '사전 모의(예비·음모)와 실행 행위의 구분 기준',
            '노상원 수첩의 증거능력: 계획성 입증의 핵심 증거',
            '자수 감경 규정의 적용 가능성'
        ],
        defendantRisks: [
            { name: '노상원', risk: 'high', reason: '포고령 초안 작성 등 사전 모의 핵심 역할' },
            { name: '곽종근', risk: 'medium', reason: '롯데리아 회동 참석, 사전 모의 가담' }
        ]
    },
    {
        articleNumber: '제91조',
        articleTitle: '국헌문란의 정의',
        briefSummary: '내란죄의 핵심 구성요건인 "국헌문란"을 정의. 12.3 사건의 유무죄 판단 근거 조항.',
        applicationAnalysis: {
            title: '12.3 내란 사건 적용 분석',
            points: [
                '제1호 해당: "헌법의 기능을 소멸시키는 것" — 비상계엄으로 기본권 정지 시도',
                '제2호 해당: "국가기관을 강압에 의하여 전복" — 국회의 권능행사 불가능 시도',
                '법원 판단: 12.3 비상계엄은 "국회의 권능행사를 불가능하게 하려는 시도"로 국헌문란에 해당',
                '무죄 선고 2건(김용군, 윤승영): 국헌문란 "목적의 인식" 부족으로 무죄',
                '국헌문란 목적의 인식 유무가 유무죄를 가르는 핵심 기준'
            ]
        },
        historicalComparison: {
            title: '역사적 비교',
            points: [
                '12.12/5.18: 국가기관(국회·법원)의 기능 전면 마비 → 국헌문란 명백',
                '12.3: 국회의 계엄 해제 의결로 국회 기능 회복 → 국헌문란 "시도" 인정',
                '통합진보당 해산(2013헌다1): 국헌문란 목적의 현대적 해석 선례 제공'
            ]
        },
        keyIssues: [
            '"국헌문란 목적의 인식" 판단 기준: 확정적 고의 vs 미필적 고의',
            '국회 기능 회복과 국헌문란 성립의 관계: 미수와 기수의 경계',
            '무죄 선고 기준의 일관성: 동일 사건에서 유무죄가 갈린 이유'
        ],
        defendantRisks: [
            { name: '윤석열', risk: 'critical', reason: '국헌문란 목적의 직접적 주체' },
            { name: '한덕수', risk: 'high', reason: '국무총리로서 국헌문란 행위에 적극 가담' },
            { name: '김용군', risk: 'low', reason: '국헌문란 목적 인식 부족으로 무죄' },
            { name: '윤승영', risk: 'low', reason: '국헌문란 목적 인식 부족으로 무죄' }
        ]
    },
    {
        articleNumber: '제93조',
        articleTitle: '일반이적',
        briefSummary: '적국의 군사상 이익을 도모한 자를 처벌. 윤석열·김용현·여인형에 추가 기소.',
        applicationAnalysis: {
            title: '12.3 내란 사건 적용 분석',
            points: [
                '2025.11.10: 윤석열, 김용현, 여인형에 일반이적(형법 93조) 추가 기소',
                '비상계엄 기간 군 전력 투입으로 대북 방어태세 약화 → 적국에 군사적 이익 제공 논리',
                '논란: 직접적 간첩 행위가 아닌 간접적 이적 행위에 해당하는지',
                '특검의 외환유치죄(형법 92조) 미기소가 별도 논란 — 더 무거운 죄의 누락 지적'
            ]
        },
        historicalComparison: {
            title: '역사적 비교',
            points: [
                '12.12/5.18: 일반이적 적용 없음 — 당시에는 이적 행위 논의 자체가 부재',
                '국가보안법상 이적 행위와의 구분: 형법 93조는 직접적 군사 이익 도모에 한정',
                '일반이적 적용은 현대 내란 사건에서 전례 없는 시도'
            ]
        },
        keyIssues: [
            '간접적 이적 행위가 "적국의 군사상 이익 도모"에 해당하는지',
            '외환유치죄(제92조) 미기소의 적정성: 사형만 규정된 최중형 조항',
            '일반이적 혐의의 추가가 양형에 미치는 영향'
        ],
        defendantRisks: [
            { name: '윤석열', risk: 'critical', reason: '일반이적 추가 기소, 최고형 사형' },
            { name: '김용현', risk: 'critical', reason: '일반이적 추가 기소' },
            { name: '여인형', risk: 'high', reason: '일반이적 추가 기소, 국방부 역할' }
        ]
    }
];

// ============================================
// 메인 컴포넌트
// ============================================

export default function LawDatabase() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(() => {
        const tabParam = searchParams.get('tab');
        const validTabs = ['laws', 'terms', 'timeline', 'constitutional', 'precedents', 'aiBrief', 'interpretations'];
        return validTabs.includes(tabParam) ? tabParam : 'laws';
    });

    useEffect(() => {
        if (activeTab === 'laws') {
            if (searchParams.has('tab')) {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('tab');
                setSearchParams(newParams, { replace: true });
            }
        } else {
            setSearchParams({ tab: activeTab }, { replace: true });
        }
    }, [activeTab]);
    const [loading, setLoading] = useState(false);
    const [apiPrecedents, setApiPrecedents] = useState(null);
    const [apiConstitutional, setApiConstitutional] = useState(null);
    const [apiLawData, setApiLawData] = useState(null);
    const [expandedArticle, setExpandedArticle] = useState(null);
    const [expandedTerm, setExpandedTerm] = useState(null);
    const [expandedDecision, setExpandedDecision] = useState(null);
    const [expandedBrief, setExpandedBrief] = useState(null);
    const [interpretations, setInterpretations] = useState(null);
    const [interpSearch, setInterpSearch] = useState('');
    const [interpLoading, setInterpLoading] = useState(false);
    const [expandedInterp, setExpandedInterp] = useState(null);
    // API 데이터 로드
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [precData, constData, lawData] = await Promise.all([
                    searchPrecedents('내란', { display: 20 }),
                    searchConstitutionalDecisions('내란', { display: 20 }),
                    searchLaws('형법', { display: 5 })
                ]);
                if (precData) setApiPrecedents(precData);
                if (constData) setApiConstitutional(constData);
                if (lawData) setApiLawData(lawData);
            } catch (error) {
                console.error('API fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // 법령해석례 기본 검색
    useEffect(() => {
        if (activeTab === 'interpretations' && !interpretations) {
            handleInterpSearch('법원조직법');
        }
    }, [activeTab]);

    const handleInterpSearch = async (query) => {
        if (!query || query.trim() === '') return;
        setInterpLoading(true);
        setExpandedInterp(null);
        try {
            const data = await searchLawInterpretations(query.trim(), { display: 20 });
            setInterpretations(data);
        } catch (error) {
            console.error('Interpretation search error:', error);
        } finally {
            setInterpLoading(false);
        }
    };

    const getInterpretationList = () => {
        if (!interpretations?.ExpcSearch?.expc) return [];
        const expcs = interpretations.ExpcSearch.expc;
        return (Array.isArray(expcs) ? expcs : [expcs]).map(e => ({
            title: e['해석례제목'] || e.해석례제목 || '',
            caseNumber: e['안건번호'] || e.안건번호 || '',
            replyDate: e['회답일자'] || e.회답일자 || '',
            fullText: e['해석례내용'] || e.해석례내용 || '',
            link: e['해석례상세링크'] || e.해석례상세링크 || ''
        }));
    };

    // 판례 데이터 파싱
    const getPrecedentList = () => {
        if (!apiPrecedents?.PrecSearch?.prec) return [];
        const precs = apiPrecedents.PrecSearch.prec;
        return (Array.isArray(precs) ? precs : [precs]).map(p => ({
            caseNumber: p['사건번호'] || p.사건번호 || '',
            caseName: p['사건명'] || p.사건명 || '',
            courtName: p['법원명'] || p.법원명 || '',
            verdictDate: p['선고일자'] || p.선고일자 || '',
            verdictType: p['판결유형'] || p.판결유형 || '',
            link: p['판례상세링크'] || p.판례상세링크 || ''
        }));
    };

    // 헌재 결정례 데이터 파싱
    const getConstitutionalList = () => {
        if (!apiConstitutional?.DetcSearch?.detc) return [];
        const detcs = apiConstitutional.DetcSearch.detc;
        return (Array.isArray(detcs) ? detcs : [detcs]).map(d => ({
            caseNumber: d['사건번호'] || d.사건번호 || '',
            caseName: d['사건명'] || d.사건명 || '',
            decisionDate: d['선고일'] || d['선고일자'] || d.선고일 || '',
            decisionType: d['결정유형'] || d.결정유형 || '',
            link: d['판례상세링크'] || d.결정례상세링크 || ''
        }));
    };

    const tabs = [
        { id: 'laws', label: '내란죄 법령', icon: '📜' },
        { id: 'terms', label: '법률용어 사전', icon: '📖' },
        { id: 'timeline', label: '법령 변천사', icon: '📅' },
        { id: 'constitutional', label: '헌재결정례', icon: '⚖️' },
        { id: 'precedents', label: '관련 판례', icon: '🔍' },
        { id: 'aiBrief', label: 'AI 법률 브리프', icon: '🤖' },
        { id: 'interpretations', label: '법령해석례', icon: '📋' }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <SEOHead title="법률 데이터베이스" description="형법 조문, 판례, 헌재결정, 법률용어 검색" path="/law-database" />
            <Header />
            <main className="pt-28 pb-16 px-4">
                <div className="container mx-auto max-w-5xl">

                    {/* 페이지 헤더 */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                            내란 관련 법령 데이터베이스
                        </h1>
                        {loading && (
                            <div className="mt-3">
                                <div className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm text-gray-500 ml-2">API 데이터 로드 중...</span>
                            </div>
                        )}
                    </div>

                    {/* 탭 네비게이션 */}
                    <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                                    activeTab === tab.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <span>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ========== Tab 1: 내란죄 법령 ========== */}
                    {activeTab === 'laws' && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
                                <h2 className="font-bold text-gray-900 mb-1">형법 제2편 제1장 내란의 죄</h2>
                                <p className="text-sm text-gray-500">제87조 ~ 제91조 (내란 관련 조항) + 제93조 (일반이적)</p>
                            </div>

                            {CRIMINAL_LAW_ARTICLES.map((article, idx) => (
                                <div
                                    key={idx}
                                    className={`bg-white rounded-xl shadow-sm overflow-hidden ${article.highlight ? 'ring-2 ring-red-200' : ''}`}
                                >
                                    <button
                                        onClick={() => setExpandedArticle(expandedArticle === idx ? null : idx)}
                                        className={`w-full p-4 text-left ${article.highlight ? 'bg-red-50' : 'bg-gray-50'} border-b`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className={`text-sm font-bold ${article.highlight ? 'text-red-700' : 'text-blue-700'}`}>
                                                    {article.number}
                                                </span>
                                                <span className="ml-2 font-bold text-gray-900">{article.title}</span>
                                                {article.highlight && (
                                                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">핵심조항</span>
                                                )}
                                            </div>
                                            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedArticle === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </button>
                                    {expandedArticle === idx && (
                                        <div className="p-4 space-y-4">
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <p className="text-gray-800 whitespace-pre-line leading-relaxed text-sm">{article.text}</p>
                                            </div>
                                            {article.appliedTo.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 mb-2">이 조항이 적용된 피고인</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {article.appliedTo.map((person, pIdx) => (
                                                            <a
                                                                key={pIdx}
                                                                href="/sentencing-analysis"
                                                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
                                                            >
                                                                {person}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* API 판례 연결 */}
                            {getPrecedentList().length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
                                    <div className="p-4 bg-green-50 border-b">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-gray-900">API 연동: 내란 관련 판례</h3>
                                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">실시간 API</span>
                                        </div>
                                    </div>
                                    <div className="divide-y">
                                        {getPrecedentList().slice(0, 5).map((prec, idx) => (
                                            <div key={idx} className="p-4">
                                                <p className="font-medium text-gray-900 text-sm">{prec.caseName || prec.caseNumber}</p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                    <span>{prec.courtName}</span>
                                                    <span>{prec.verdictDate}</span>
                                                    {prec.verdictType && <span className="px-2 py-0.5 bg-gray-100 rounded">{prec.verdictType}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 bg-gray-50 text-center">
                                        <button onClick={() => setActiveTab('precedents')} className="text-sm text-blue-600 hover:underline">
                                            전체 판례 보기 →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========== Tab 2: 법률용어 사전 ========== */}
                    {activeTab === 'terms' && (
                        <div className="space-y-3">
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
                                <h2 className="font-bold text-gray-900 mb-1">내란 관련 법률용어 해설</h2>
                                <p className="text-sm text-gray-500">12.3 내란 사건에서 자주 등장하는 법률용어를 쉽게 풀어드립니다</p>
                            </div>

                            {LEGAL_TERMS.map((item, idx) => (
                                <div key={idx} className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <button
                                        onClick={() => setExpandedTerm(expandedTerm === idx ? null : idx)}
                                        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg font-bold text-sm">
                                                    {item.term}
                                                </span>
                                                <span className="text-xs text-gray-500">{item.relatedLaw}</span>
                                            </div>
                                            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedTerm === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </button>
                                    {expandedTerm === idx && (
                                        <div className="px-4 pb-4 space-y-3">
                                            <div className="bg-purple-50 rounded-lg p-3">
                                                <p className="text-sm font-medium text-purple-700 mb-1">법률적 정의</p>
                                                <p className="text-sm text-gray-800">{item.definition}</p>
                                            </div>
                                            <div className="bg-blue-50 rounded-lg p-3">
                                                <p className="text-sm font-medium text-blue-700 mb-1">12.3 사건 관련성</p>
                                                <p className="text-sm text-gray-800">{item.caseRelevance}</p>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                근거 법령: {item.relatedLaw}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ========== Tab 3: 법령 변천사 타임라인 ========== */}
                    {activeTab === 'timeline' && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-amber-500">
                                <h2 className="font-bold text-gray-900 mb-1">내란죄 법령 변천사</h2>
                                <p className="text-sm text-gray-500">1953년 형법 제정부터 현재까지 내란죄의 역사</p>
                            </div>

                            <div className="relative">
                                {/* 타임라인 세로선 */}
                                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                                {LAW_HISTORY_TIMELINE.map((event, idx) => {
                                    const colors = {
                                        creation: { bg: 'bg-blue-500', ring: 'ring-blue-200', badge: 'bg-blue-100 text-blue-700' },
                                        amendment: { bg: 'bg-green-500', ring: 'ring-green-200', badge: 'bg-green-100 text-green-700' },
                                        event: { bg: 'bg-amber-500', ring: 'ring-amber-200', badge: 'bg-amber-100 text-amber-700' },
                                        verdict: { bg: 'bg-red-500', ring: 'ring-red-200', badge: 'bg-red-100 text-red-700' },
                                        constitutional: { bg: 'bg-purple-500', ring: 'ring-purple-200', badge: 'bg-purple-100 text-purple-700' }
                                    };
                                    const color = colors[event.type] || colors.event;
                                    const typeLabels = {
                                        creation: '제정', amendment: '개정', event: '사건',
                                        verdict: '판결', constitutional: '헌재'
                                    };

                                    return (
                                        <div key={idx} className="relative pl-14 pb-6">
                                            {/* 타임라인 점 */}
                                            <div className={`absolute left-4 w-5 h-5 rounded-full ${color.bg} ring-4 ${color.ring}`}></div>

                                            <div className="bg-white rounded-xl shadow-sm p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-sm font-bold text-gray-900">{event.year}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color.badge}`}>
                                                        {typeLabels[event.type]}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-gray-900 mb-1">{event.title}</h3>
                                                <p className="text-sm text-gray-600">{event.description}</p>
                                                {event.source && (
                                                    <a
                                                        href={event.source.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                                    >
                                                        출처: {event.source.name} →
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ========== Tab 4: 헌재결정례 ========== */}
                    {activeTab === 'constitutional' && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-indigo-500">
                                <h2 className="font-bold text-gray-900 mb-1">주요 헌법재판소 결정례</h2>
                                <p className="text-sm text-gray-500">내란·탄핵 관련 헌법재판소 주요 결정</p>
                            </div>

                            {CONSTITUTIONAL_DECISIONS.map((decision, idx) => (
                                <div key={idx} className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <button
                                        onClick={() => setExpandedDecision(expandedDecision === idx ? null : idx)}
                                        className="w-full p-4 text-left bg-indigo-50 border-b"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-bold text-indigo-700">{decision.caseNumber}</span>
                                                    <span className="text-xs text-gray-500">{decision.date}</span>
                                                </div>
                                                <p className="font-bold text-gray-900">{decision.title}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    decision.result.includes('인용') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {decision.result}
                                                </span>
                                                <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedDecision === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </button>
                                    {expandedDecision === idx && (
                                        <div className="p-4 space-y-3">
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-sm font-medium text-gray-700 mb-1">결정 요지</p>
                                                <p className="text-sm text-gray-800">{decision.summary}</p>
                                            </div>
                                            <div className="bg-indigo-50 rounded-lg p-3">
                                                <p className="text-sm font-medium text-indigo-700 mb-1">법적 의의</p>
                                                <p className="text-sm text-gray-800">{decision.significance}</p>
                                            </div>
                                            {decision.source && (
                                                <a
                                                    href={decision.source.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    결정문 전문 보기 →
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* API 연동 헌재결정례 */}
                            {getConstitutionalList().length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
                                    <div className="p-4 bg-green-50 border-b">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-gray-900">API 연동: 내란 관련 헌재결정례</h3>
                                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">실시간 API</span>
                                        </div>
                                    </div>
                                    <div className="divide-y">
                                        {getConstitutionalList().map((detc, idx) => (
                                            <div key={idx} className="p-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium text-indigo-700">{detc.caseNumber}</span>
                                                    <span className="text-xs text-gray-500">{detc.decisionDate}</span>
                                                </div>
                                                <p className="text-sm text-gray-900">{detc.caseName}</p>
                                                {detc.decisionType && (
                                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded mt-1 inline-block">{detc.decisionType}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========== Tab 5: 관련 판례 ========== */}
                    {activeTab === 'precedents' && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
                                <h2 className="font-bold text-gray-900 mb-1">내란 관련 판례</h2>
                                <p className="text-sm text-gray-500">국가법령정보 OPEN API를 통해 수집된 내란 관련 법원 판례</p>
                            </div>

                            {getPrecedentList().length > 0 ? (
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <div className="p-4 bg-green-50 border-b">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-gray-900">
                                                검색 결과 ({getPrecedentList().length}건)
                                            </h3>
                                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">API 실시간</span>
                                        </div>
                                    </div>
                                    <div className="divide-y">
                                        {getPrecedentList().map((prec, idx) => (
                                            <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-bold text-green-700">{prec.caseNumber}</span>
                                                    <span className="text-xs text-gray-500">{prec.verdictDate}</span>
                                                </div>
                                                <p className="font-medium text-gray-900 text-sm">{prec.caseName}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-500">{prec.courtName}</span>
                                                    {prec.verdictType && (
                                                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{prec.verdictType}</span>
                                                    )}
                                                </div>
                                                {prec.link && (
                                                    <a
                                                        href={prec.link.startsWith('http') ? prec.link : `https://www.law.go.kr${prec.link}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                                    >
                                                        판례 상세 보기 →
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                                    {loading ? (
                                        <>
                                            <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                            <p className="text-gray-500">판례를 검색하고 있습니다...</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-gray-500 mb-2">API 데이터를 불러오지 못했습니다.</p>
                                            <p className="text-sm text-gray-400 mb-1">아래 단계를 확인해주세요:</p>
                                            <ol className="text-sm text-gray-400 text-left max-w-md mx-auto mb-4 space-y-1">
                                                <li>1. <a href="https://open.law.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">open.law.go.kr</a> 로그인</li>
                                                <li>2. [OPEN API] → [OPEN API 신청] 클릭</li>
                                                <li>3. 등록된 API 선택 → <b>법령종류 체크</b> (법령, 판례, 헌재결정례)</li>
                                            </ol>
                                            <a
                                                href="https://www.law.go.kr/precInfoP.do?mode=0&query=%EB%82%B4%EB%9E%80"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                                            >
                                                국가법령정보센터에서 직접 검색 →
                                            </a>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* 주요 역사적 판례 안내 */}
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="p-4 bg-amber-50 border-b">
                                    <h3 className="font-bold text-gray-900">주요 내란 판례 (역사적)</h3>
                                </div>
                                <div className="divide-y">
                                    <a href="https://law.go.kr/precInfoP.do?precSeq=188579" target="_blank" rel="noopener noreferrer" className="block p-4 hover:bg-blue-50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-bold text-amber-700">1997</span>
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">유죄</span>
                                        </div>
                                        <p className="font-medium text-gray-900 text-sm">전두환·노태우 12.12/5.18 내란 사건</p>
                                        <p className="text-xs text-gray-600 mt-1">대법원 96도3376 - 전두환 무기징역, 노태우 징역 17년. 대한민국 최초 내란죄 유죄 확정.</p>
                                    </a>
                                    <a href="https://www.law.go.kr/precInfoP.do?mode=0&precSeq=209161" target="_blank" rel="noopener noreferrer" className="block p-4 hover:bg-blue-50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-bold text-amber-700">2015</span>
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">유죄</span>
                                        </div>
                                        <p className="font-medium text-gray-900 text-sm">이석기 내란음모 사건</p>
                                        <p className="text-xs text-gray-600 mt-1">대법원 2014도10978 - 징역 9년, 자격정지 7년. 내란음모죄 적용.</p>
                                    </a>
                                    <a href="/sentencing-analysis" className="block p-4 hover:bg-blue-50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-bold text-amber-700">2026</span>
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">유죄</span>
                                        </div>
                                        <p className="font-medium text-gray-900 text-sm">한덕수 내란중요임무종사 사건</p>
                                        <p className="text-xs text-gray-600 mt-1">서울중앙지법 - 징역 23년 (구형 15년 초과). 12.3 비상계엄을 "국헌문란 목적의 내란"으로 인정한 최초 판결.</p>
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI 법률 브리프 탭 */}
                    {activeTab === 'aiBrief' && (
                        <div className="space-y-6">
                            {/* 헤더 */}
                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-cyan-500">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    🤖 AI 법률 브리프
                                </h2>
                                <p className="text-gray-600 mt-2">형법 제87조~제93조에 대한 AI 기반 법적 맥락 분석</p>
                            </div>

                            {/* AI 면책 배너 */}
                            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 text-center">
                                <p className="text-sm text-cyan-800">
                                    ⚠️ 이 분석은 AI가 사전 생성한 법률 브리프입니다. 법적 조언이 아니며, 정확한 법률 자문은 전문 변호사에게 문의하세요.
                                </p>
                            </div>

                            {/* 조항별 카드 */}
                            {AI_LEGAL_BRIEF.map((article, idx) => (
                                <div key={idx} className="bg-white rounded-xl shadow-lg overflow-hidden">
                                    {/* 카드 헤더 (클릭 가능) */}
                                    <button
                                        onClick={() => setExpandedBrief(expandedBrief === idx ? null : idx)}
                                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-bold text-cyan-700">{article.articleNumber}</span>
                                            <span className="text-gray-800 font-medium">{article.articleTitle}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {article.defendantRisks.some(d => d.risk === 'critical') && (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">Critical</span>
                                            )}
                                            <span className={`transform transition-transform ${expandedBrief === idx ? 'rotate-180' : ''}`}>▼</span>
                                        </div>
                                    </button>

                                    {/* 요약 */}
                                    <div className="px-6 pb-3">
                                        <p className="text-sm text-gray-600">{article.briefSummary}</p>
                                    </div>

                                    {/* 펼쳐진 내용 */}
                                    {expandedBrief === idx && (
                                        <div className="px-6 pb-6 space-y-4">
                                            {/* 적용 분석 */}
                                            <div className="bg-blue-50 rounded-lg p-4">
                                                <h4 className="font-bold text-blue-800 text-sm mb-2">📋 {article.applicationAnalysis.title}</h4>
                                                <ul className="space-y-1.5">
                                                    {article.applicationAnalysis.points.map((point, pIdx) => (
                                                        <li key={pIdx} className="text-sm text-gray-700 flex items-start gap-2">
                                                            <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                                                            <span>{point}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* 역사적 비교 */}
                                            <div className="bg-amber-50 rounded-lg p-4">
                                                <h4 className="font-bold text-amber-800 text-sm mb-2">📜 {article.historicalComparison.title}</h4>
                                                <ul className="space-y-1.5">
                                                    {article.historicalComparison.points.map((point, pIdx) => (
                                                        <li key={pIdx} className="text-sm text-gray-700 flex items-start gap-2">
                                                            <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                                                            <span>{point}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* 핵심 쟁점 */}
                                            <div className="bg-purple-50 rounded-lg p-4">
                                                <h4 className="font-bold text-purple-800 text-sm mb-2">⚖️ 핵심 법해석 쟁점</h4>
                                                <ul className="space-y-1.5">
                                                    {article.keyIssues.map((issue, iIdx) => (
                                                        <li key={iIdx} className="text-sm text-gray-700 flex items-start gap-2">
                                                            <span className="text-purple-500 mt-0.5 shrink-0">•</span>
                                                            <span>{issue}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* 피고인별 위험도 */}
                                            {article.defendantRisks.length > 0 && (
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <h4 className="font-bold text-gray-800 text-sm mb-3">🎯 피고인별 위험도 평가</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {article.defendantRisks.map((def, dIdx) => (
                                                            <div key={dIdx} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border">
                                                                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                                                    def.risk === 'critical' ? 'bg-red-100 text-red-700' :
                                                                    def.risk === 'high' ? 'bg-orange-100 text-orange-700' :
                                                                    def.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-green-100 text-green-700'
                                                                }`}>{def.risk}</span>
                                                                <span className="font-medium text-sm text-gray-800">{def.name}</span>
                                                                <span className="text-xs text-gray-500 ml-auto">{def.reason}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ========== Tab 7: 법령해석례 ========== */}
                    {activeTab === 'interpretations' && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-teal-500">
                                <h2 className="font-bold text-gray-900 mb-1">법령해석례 검색</h2>
                                <p className="text-sm text-gray-500">국가법령정보 OPEN API를 통한 법령해석례 검색</p>
                            </div>

                            {/* 검색 입력 */}
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <form onSubmit={(e) => { e.preventDefault(); handleInterpSearch(interpSearch); }} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={interpSearch}
                                        onChange={(e) => setInterpSearch(e.target.value)}
                                        placeholder="검색어 입력 (예: 법원조직법, 참심제)"
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    />
                                    <button
                                        type="submit"
                                        disabled={interpLoading}
                                        className="px-5 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
                                    >
                                        {interpLoading ? '검색 중...' : '검색'}
                                    </button>
                                </form>
                                <div className="flex gap-2 mt-3">
                                    {['법원조직법', '참심제', '배심제', '국민참여재판'].map(keyword => (
                                        <button
                                            key={keyword}
                                            onClick={() => { setInterpSearch(keyword); handleInterpSearch(keyword); }}
                                            className="px-3 py-1 text-xs bg-teal-50 text-teal-700 rounded-full hover:bg-teal-100 transition-colors"
                                        >
                                            {keyword}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 검색 결과 */}
                            {interpLoading ? (
                                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                                    <div className="inline-block w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-gray-500">법령해석례를 검색하고 있습니다...</p>
                                </div>
                            ) : getInterpretationList().length > 0 ? (
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <div className="p-4 bg-teal-50 border-b">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-gray-900">
                                                검색 결과 ({getInterpretationList().length}건)
                                            </h3>
                                            <span className="text-xs text-teal-600 bg-teal-100 px-2 py-1 rounded">API 실시간</span>
                                        </div>
                                    </div>
                                    <div className="divide-y">
                                        {getInterpretationList().map((interp, idx) => (
                                            <div key={idx} className="overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedInterp(expandedInterp === idx ? null : idx)}
                                                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-900 text-sm truncate">{interp.title || '(제목 없음)'}</p>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                {interp.caseNumber && (
                                                                    <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{interp.caseNumber}</span>
                                                                )}
                                                                {interp.replyDate && (
                                                                    <span className="text-xs text-gray-500">회답일: {interp.replyDate}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <svg className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ml-2 ${expandedInterp === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </button>
                                                {expandedInterp === idx && (
                                                    <div className="px-4 pb-4">
                                                        <div className="bg-gray-50 rounded-lg p-4">
                                                            <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                                                                {interp.fullText || '본문을 불러올 수 없습니다. 아래 링크에서 확인해주세요.'}
                                                            </p>
                                                        </div>
                                                        {interp.link && (
                                                            <a
                                                                href={interp.link.startsWith('http') ? interp.link : `https://www.law.go.kr${interp.link}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                </svg>
                                                                해석례 전문 보기 →
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : interpretations && (
                                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                                    <p className="text-gray-500 mb-2">검색 결과가 없습니다.</p>
                                    <p className="text-sm text-gray-400">다른 검색어로 시도해보세요.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 출처 안내 */}
                    <div className="mt-8 p-4 bg-gray-100 rounded-xl text-center">
                        <p className="text-gray-600 text-sm">
                            법령 데이터: <a href="https://open.law.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">국가법령정보 공동활용</a> OPEN API<br />
                            정확한 법률 자문은 전문 변호사에게 문의하세요.
                        </p>
                        <div className="mt-4 flex justify-center gap-4">
                            <a href="https://www.law.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                                국가법령정보센터 →
                            </a>
                            <a href="/sentencing-analysis" className="text-blue-600 text-sm hover:underline">
                                재판분석 페이지 →
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            <SNSShareBar />
            <footer className="bg-gray-900 text-gray-400 py-6 px-4">
                <div className="container mx-auto text-center">
                    <p>&copy; 주권자사법개혁추진준비위원회</p>
                    <p className="mt-2 text-sm">문의: siminbupjung@gmail.com</p>
                </div>
            </footer>
        </div>
    );
}
