import { useState, useEffect, Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, addDoc, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import SEOHead from '../components/SEOHead';

// 판결 데이터 (기본 fallback)
const DEFAULT_VERDICTS = [
    {
        date: '2026.01.06',
        defendant: '윤석열',
        court: '서울중앙지법',
        charge: '체포방해 (직권남용권리행사방해, 허위공문서작성, 대통령기록물법 위반)',
        sentence: '징역 5년',
        prosecution: '-',
        status: 'convicted',
        detail: '공수처 체포 방해 및 경호처 동원'
    },
    {
        date: '2026.01.22',
        defendant: '한덕수',
        court: '서울중앙지법 형사합의33부',
        judge: '이진관 부장판사',
        charge: '내란중요임무종사, 허위공문서작성, 대통령기록물법 위반, 헌재 위증',
        sentence: '징역 23년 (법정구속)',
        prosecution: '징역 15년 (조은석 특검)',
        status: 'convicted',
        detail: '구형보다 8년 높은 징역 23년 선고'
    },
    {
        date: '2026.01.28',
        defendant: '김건희',
        court: '서울중앙지법 형사합의27부',
        judge: '우인성 부장판사',
        charge: '도이치모터스 주가조작, 정치자금법 위반',
        sentence: '징역 1년 8개월 (주가조작 무죄)',
        prosecution: '징역 15년',
        status: 'partial',
        detail: '주가조작 무죄, 명품수수 및 정치자금법만 유죄'
    },
    {
        date: '2026.02.12',
        defendant: '이상민',
        court: '서울중앙지법 형사합의32부',
        judge: '류경진 부장판사',
        charge: '내란중요임무종사, 헌재 위증',
        sentence: '징역 7년',
        prosecution: '징역 15년',
        status: 'convicted',
        detail: '언론사 단전 및 단수 지시 전달, 직권남용 무죄'
    },
    {
        date: '2026.02.19',
        defendant: '윤석열',
        court: '서울중앙지법 형사합의25부',
        judge: '지귀연 부장판사',
        charge: '내란 수괴 (형법 제87조)',
        sentence: '무기징역',
        prosecution: '사형 (내란특검 구형)',
        status: 'convicted',
        detail: '"성경을 읽는다는 이유로 촛불을 훔칠 수는 없다" — 대통령 내란죄 유죄 선고'
    },
    {
        date: '2026.02.19',
        defendant: '김용현',
        court: '서울중앙지법 형사합의25부',
        judge: '지귀연 부장판사',
        charge: '내란중요임무종사 (형법 제87조)',
        sentence: '징역 30년',
        prosecution: '무기징역',
        status: 'convicted',
        detail: '비상계엄을 주도적으로 준비, 대통령의 비이성적 결심을 조장'
    },
    {
        date: '2026.02.19',
        defendant: '노상원',
        court: '서울중앙지법 형사합의25부',
        judge: '지귀연 부장판사',
        charge: '내란중요임무종사 (형법 제87조)',
        sentence: '징역 18년',
        prosecution: '징역 30년',
        status: 'convicted',
        detail: '계엄 사전 모의, 포고령 초안 작성, 선관위 침입 지휘. 예비역 민간인 신분'
    },
    {
        date: '2026.02.19',
        defendant: '조지호',
        court: '서울중앙지법 형사합의25부',
        judge: '지귀연 부장판사',
        charge: '내란중요임무종사 (형법 제87조)',
        sentence: '징역 12년',
        prosecution: '징역 20년',
        status: 'convicted',
        detail: '경찰청장으로서 포고령 위법성 미검토, 군의 국회 진입 조력, 의원 출입 차단'
    },
    {
        date: '2026.02.19',
        defendant: '김봉식',
        court: '서울중앙지법 형사합의25부',
        judge: '지귀연 부장판사',
        charge: '내란중요임무종사 (형법 제87조)',
        sentence: '징역 10년',
        prosecution: '징역 15년',
        status: 'convicted',
        detail: '서울경찰청장으로서 국회 봉쇄 가담, 안가회동 문건 수령'
    },
    {
        date: '2026.02.19',
        defendant: '목현태',
        court: '서울중앙지법 형사합의25부',
        judge: '지귀연 부장판사',
        charge: '내란중요임무종사 (형법 제87조)',
        sentence: '징역 3년',
        prosecution: '징역 12년',
        status: 'convicted',
        detail: '국회경비대장으로서 국회의원 출입 차단, 국회의장 4번 수색 지시'
    },
    {
        date: '2026.02.19',
        defendant: '김용군',
        court: '서울중앙지법 형사합의25부',
        judge: '지귀연 부장판사',
        charge: '내란중요임무종사 (형법 제87조)',
        sentence: '무죄',
        prosecution: '징역 10년',
        status: 'acquitted',
        detail: '국헌문란 목적을 미필적으로라도 인식·공유했다는 증거 부족'
    },
    {
        date: '2026.02.19',
        defendant: '윤승영',
        court: '서울중앙지법 형사합의25부',
        judge: '지귀연 부장판사',
        charge: '내란중요임무종사 (형법 제87조)',
        sentence: '무죄',
        prosecution: '징역 10년',
        status: 'acquitted',
        detail: '범행 계획 공모 또는 국헌문란 목적 인식·공유 증거 부족'
    },
    {
        date: '',
        defendant: '곽종근',
        court: '서울중앙지법',
        charge: '내란중요임무종사',
        sentence: '',
        prosecution: '',
        status: 'pending',
        detail: '특전사령관, 국회 진입 작전 지휘'
    },
    {
        date: '',
        defendant: '문상호',
        court: '서울중앙지법',
        charge: '내란중요임무종사, 직권남용권리행사방해, 군사기밀 누설',
        sentence: '',
        prosecution: '',
        status: 'pending',
        detail: '국군방첩사령관, 계엄 사전 모의 및 정보 수집'
    },
    {
        date: '',
        defendant: '박안수',
        court: '서울중앙지법',
        charge: '내란중요임무종사, 직권남용권리행사방해',
        sentence: '',
        prosecution: '',
        status: 'pending',
        detail: '육군참모총장, 병력 이동 명령'
    },
    {
        date: '',
        defendant: '박성재',
        court: '서울중앙지법',
        charge: '내란중요임무종사',
        sentence: '',
        prosecution: '',
        status: 'pending',
        detail: '법무부 장관, 내란 가담'
    },
    {
        date: '',
        defendant: '박종준',
        court: '서울중앙지법',
        charge: '특수공무집행방해, 증거인멸',
        sentence: '',
        prosecution: '',
        status: 'pending',
        detail: '대통령경호처장, 공수처 체포 방해'
    },
    {
        date: '',
        defendant: '여인형',
        court: '서울중앙지법',
        charge: '내란중요임무종사, 위증, 일반이적',
        sentence: '',
        prosecution: '',
        status: 'pending',
        detail: '국방부 장관, 계엄포고령 발령 관여'
    },
    {
        date: '',
        defendant: '이진우',
        court: '서울중앙지법',
        charge: '내란중요임무종사',
        sentence: '',
        prosecution: '',
        status: 'pending',
        detail: '수도방위사령관, 국회 병력 투입'
    },
    {
        date: '',
        defendant: '조태용',
        court: '서울중앙지법',
        charge: '국가정보원법 위반',
        sentence: '',
        prosecution: '',
        status: 'pending',
        detail: '국가정보원장, 정보 기관 동원'
    },
    {
        date: '',
        defendant: '최상목',
        court: '서울중앙지법',
        charge: '위증',
        sentence: '',
        prosecution: '',
        status: 'pending',
        detail: '기획재정부 장관, 헌재 위증'
    },
    {
        date: '',
        defendant: '김주현',
        court: '서울중앙지법',
        charge: '직권남용권리행사방해',
        sentence: '',
        prosecution: '',
        status: 'pending',
        detail: '금융위원장, 직권남용'
    },
    {
        date: '',
        defendant: '김태효',
        court: '서울중앙지법',
        charge: '내란중요임무종사',
        sentence: '',
        prosecution: '',
        status: 'pending',
        detail: '국가안보실 1차장'
    },
    {
        date: '',
        defendant: '심우정',
        court: '서울중앙지법',
        charge: '직권남용권리행사방해',
        sentence: '',
        prosecution: '',
        status: 'pending',
        detail: '검찰총장, 검찰 수사 방해'
    },
    {
        date: '',
        defendant: '이완규',
        court: '서울중앙지법',
        charge: '직권남용권리행사방해',
        sentence: '',
        prosecution: '',
        status: 'pending',
        detail: '법원행정처장'
    },
    {
        date: '',
        defendant: '추경호',
        court: '서울중앙지법',
        charge: '내란중요임무종사',
        sentence: '',
        prosecution: '',
        status: 'pending',
        detail: '국회부의장, 국회 의결 방해 시도'
    },
    {
        date: '2026.02.24',
        defendant: '전성배',
        court: '서울중앙지법 형사합의33부',
        judge: '이진관 부장판사',
        charge: '알선수재 (특정범죄가중처벌법)',
        sentence: '징역 6년',
        prosecution: '징역 5년 (조은석 특검)',
        status: 'convicted',
        detail: '건진법사(승려), 통일교 윤영호로부터 샤넬백·다이아몬드 등 8천만원 상당 금품 수수 알선. 구형 초과 선고.'
    },
    {
        date: '',
        defendant: '정진석',
        court: '서울중앙지법',
        charge: '내란중요임무종사',
        sentence: '',
        prosecution: '',
        status: 'pending',
        detail: '대통령비서실장, 내란 가담'
    }
];

// AI 판결 비교분석 데이터
const VERDICT_COMPARISON_ANALYSIS = {
    overallAssessment: {
        summary: '12.3 내란 사건의 1심 판결은 전체적으로 내란죄 성립을 인정하면서도, 피고인별 양형에 상당한 편차가 존재합니다. 특히 구형을 초과하는 선고(한덕수), 같은 혐의에 대한 3배 이상의 양형 차이(한덕수 vs 이상민), 재판부 간 무죄 범위의 차이 등이 주목됩니다.',
        keyFindings: [
            '구형 초과 선고: 한덕수에 대해 검찰 구형(15년)보다 8년 높은 23년 선고 — 사법부 독립성의 양면',
            '양형 편차: 내란중요임무종사 혐의 피고인 간 7년~30년의 편차 (4.3배)',
            '무죄 기준 불일치: 동일 혐의에 대해 재판부별 국헌문란 목적 인식 인정 범위가 상이',
            '역할 비중과 양형의 비례성 문제: 실행 지휘자(김용현 30년)와 정치적 책임자(한덕수 23년)의 격차'
        ]
    },
    sentencingDisparities: [
        {
            pair: '한덕수 vs 이상민',
            pairDetail: '국무총리 vs 행안부장관',
            charge: '내란중요임무종사',
            sentences: ['징역 23년', '징역 7년'],
            gap: '3.3배',
            analysis: '한덕수는 내란우두머리방조 무죄에도 불구하고 내란중요임무종사로 23년 선고. 이상민은 동일 혐의로 7년. 역할 차이가 16년의 양형 차이를 정당화하는지 논란.',
            disparity: 'high'
        },
        {
            pair: '김용현 vs 노상원',
            pairDetail: '국방부장관 vs 수방사령관',
            charge: '내란중요임무종사',
            sentences: ['징역 30년', '징역 18년'],
            gap: '12년',
            analysis: '김용현은 비상계엄 전반을 주도적으로 준비한 핵심 인물로 최고형. 노상원은 포고령 작성 및 선관위 침입 지휘로 18년. 역할 비중에 따른 차등화.',
            disparity: 'medium'
        },
        {
            pair: '김봉식 vs 조지호',
            pairDetail: '해병대사령관 vs 서울경찰청장',
            charge: '내란중요임무종사',
            sentences: ['징역 12년', '징역 15년'],
            gap: '3년',
            analysis: '군 수장(김봉식 12년)보다 경찰 수장(조지호 15년)이 더 높은 형을 받음. 국회 봉쇄라는 직접적 실행 행위의 중대성이 반영.',
            disparity: 'low'
        },
        {
            pair: '김용군/윤승영 vs 유죄 피고인',
            pairDetail: '무죄 2명 vs 유죄 다수',
            charge: '내란중요임무종사',
            sentences: ['무죄', '유죄 (7~30년)'],
            gap: '전면 무죄',
            analysis: '같은 내란중요임무종사 혐의에서 국헌문란 목적의 인식·공유가 인정되지 않아 무죄. 공모의 범위와 고의성 입증 기준이 핵심 쟁점.',
            disparity: 'high'
        }
    ],
    judicialIntegrityFlags: [
        {
            flag: '구형 초과 선고',
            severity: 'warning',
            detail: '한덕수 사건에서 검찰 구형(15년)을 8년 초과하는 23년 선고. 일반적으로 법원은 구형 이하를 선고하는 관행이 있으나, 법적으로 구형 초과는 허용됨. 사법부의 독립성을 보여주나, 양형 기준의 예측 가능성에 대한 우려도 존재.'
        },
        {
            flag: '재판부 간 양형 편차',
            severity: 'warning',
            detail: '형사합의33부(한덕수, 23년)와 형사합의25-1부(이상민, 7년)의 양형 편차가 현저. 동일 혐의에 대한 일관된 양형 기준 부재가 사법 신뢰에 영향.'
        },
        {
            flag: '무죄 선고와 공모 인정 범위',
            severity: 'info',
            detail: '형사합의25부(김용군, 윤승영 무죄)와 형사합의33부(한덕수 유죄)의 공모 범위 인정 기준이 상이. 국헌문란 목적의 인식·공유에 대한 법원 간 해석 차이.'
        },
        {
            flag: '내란우두머리방조 법리 판단',
            severity: 'info',
            detail: '한덕수 사건에서 "내란죄는 필요적 공동정범이므로 방조범이 성립할 수 없다"는 법리 확인. 이는 향후 내란 관련 사건의 공소 전략에 영향을 미칠 선례.'
        }
    ],
    historicalBenchmark: [
        { event: '12.12 군사반란', year: '1979', defendant: '전두환', charge: '반란수괴·내란수괴', sentence: '사형→무기징역→특사', note: '1996년 선고, 1997년 특사' },
        { event: '12.12 군사반란', year: '1979', defendant: '노태우', charge: '반란중요임무·내란중요임무', sentence: '징역 22년6월→17년→특사', note: '1996년 선고, 1997년 특사' },
        { event: '12.12 군사반란', year: '1979', defendant: '정호용', charge: '반란중요임무·내란중요임무', sentence: '징역 10년→7년', note: '특전사령관' },
        { event: '12.3 비상계엄', year: '2024', defendant: '윤석열', charge: '내란수괴', sentence: '무기징역', note: '1심, 사형 구형' },
        { event: '12.3 비상계엄', year: '2024', defendant: '김용현', charge: '내란중요임무종사', sentence: '징역 30년', note: '1심, 국방부장관' },
        { event: '12.3 비상계엄', year: '2024', defendant: '한덕수', charge: '내란중요임무종사', sentence: '징역 23년', note: '1심, 구형 15년 초과' },
        { event: '12.3 비상계엄', year: '2024', defendant: '이상민', charge: '내란중요임무종사', sentence: '징역 7년', note: '1심, 행안부장관' }
    ]
};

// 1심 재판부 데이터 (기본 fallback)
const DEFAULT_FIRST_COURTS = [
    {
        division: '형사합의25부',
        chief: '지귀연',
        chiefClass: 31,
        associates: [
            { name: '김의담', classYear: 46 },
            { name: '이완규', classYear: 36 }
        ],
        mainCase: '윤석열 내란 수괴'
    },
    {
        division: '형사합의27부',
        chief: '우인성',
        chiefClass: 29,
        associates: [],
        mainCase: '김건희 주가조작'
    },
    {
        division: '형사합의32부',
        chief: '류경진',
        chiefClass: 31,
        associates: [],
        mainCase: '이상민 내란'
    },
    {
        division: '형사합의33부',
        chief: '이진관',
        chiefClass: 32,
        associates: [],
        mainCase: '한덕수 내란'
    }
];

// 항소심 재판부 데이터 (기본 fallback)
const DEFAULT_APPEAL_COURTS = [
    {
        division: '형사1부',
        members: [
            { name: '윤성식', classYear: 24, role: '재판장' },
            { name: '민성철', classYear: 29, role: '배석' },
            { name: '이동현', classYear: 36, role: '배석' }
        ],
        feature: '일반 합의부'
    },
    {
        division: '형사12부',
        members: [
            { name: '이승철', classYear: 26, role: '배석' },
            { name: '조진구', classYear: 29, role: '배석' },
            { name: '김민아', classYear: 34, role: '배석' }
        ],
        feature: '대등재판부 (부장판사 없음)'
    }
];

// 참심제 시뮬레이션 데이터
const SIMULATION_DATA = [
    {
        defendant: '윤석열',
        charge: '내란 수괴 (형법 제87조)',
        judge: '지귀연 부장판사',
        court: '형사합의25부',
        actualVerdict: {
            sentence: '무기징역',
            prosecution: '사형',
            issues: [
                '노상원 수첩 증거능력 전면 배척 → 계획성 미입증',
                '구속취소 시간기준 논란 (71년 관례 날짜기준 대신 시간기준 적용)',
                '재판 비공개 진행 논란 (전직 대통령 재판 최초 비공개)',
                '외환유치죄(형법 93조) 미기소 상태에서 재판 진행'
            ]
        },
        aiPrediction: {
            sentence: '사형 또는 무기징역',
            reasoning: 'AI는 외환유치죄(형법 93조) 미기소를 핵심 문제로 지적. 노상원 수첩을 포함한 계획성 증거가 인정될 경우 사형 근거 대폭 강화. 드론작전사령부 북한 드론 5차례 침투에 대한 현역 장교 증언도 반영 시 외환유치죄 성립 가능.'
        },
        layJudgeSimulation: {
            sentence: '사형',
            composition: '직업법관 3명 + 시민법관 2명 (독일 참심제 모델)',
            reasoning: '시민법관은 국민의 법감정을 직접 반영하여 민주주의 전복 시도에 최고형 부과. 독일 참심제에서 참심원은 유무죄와 양형 모두 동등한 결정권 보유.',
            citizenPerspective: [
                '국헌문란 목적의 군 동원은 민주주의 자체를 위협하는 행위 — 최고형 부과 공감대',
                '71년 관례를 깬 시간기준 구속취소 결정은 시민법관 참여 시 불가',
                '재판 공개 원칙 — 시민법관 참여 시 비공개 불가, 국민의 알 권리 보장',
                '외환유치죄 미기소에 대한 시민 감시 기능 — 검찰 기소 누락 견제'
            ],
            europeanPrecedent: '독일: 참심원은 직업법관과 동등한 투표권, 다수결로 유무죄·양형 결정. 국가 전복 범죄에 시민 참여 의무.'
        }
    },
    {
        defendant: '한덕수',
        charge: '내란중요임무종사, 허위공문서작성',
        judge: '이진관 부장판사',
        court: '형사합의33부',
        actualVerdict: {
            sentence: '징역 23년',
            prosecution: '징역 15년',
            issues: [
                '구형(15년) 대비 153% 초과 선고 — 재판부 독립적 판단',
                '국무총리 헌법적 책임 가중 반영',
                '다른 피고인 대비 양형 형평성 논란'
            ]
        },
        aiPrediction: {
            sentence: '징역 25~30년',
            reasoning: 'AI는 국무총리가 대통령 유고 시 권한대행을 맡는 헌법상 제2인자임을 고려, 내란 가담의 헌법적 중대성에 비례한 양형 필요성 지적. 검찰의 과소 구형(15년)은 직위별 차별화 논리 부족.'
        },
        layJudgeSimulation: {
            sentence: '징역 25~30년',
            composition: '직업법관 3명 + 시민법관 2명',
            reasoning: '시민법관은 국가 제2인자가 내란에 가담한 것에 대한 시민적 분노를 양형에 반영. 이진관 판사의 독립적 판단(구형 초과 선고)이 시민 참여로 더욱 강화.',
            citizenPerspective: [
                '헌법상 제2인자의 내란 가담 — 국민에 대한 최대 배신',
                '국무총리는 내란을 저지할 헌법적 의무가 있으나 오히려 가담',
                '검찰의 과소 구형(15년)에 대한 시민 감시 기능'
            ],
            europeanPrecedent: '프랑스: 중죄법원에서 시민배심원 6명이 직업법관 3명과 합의. 고위 공직자 범죄에 시민 참여로 엄정한 양형.'
        }
    },
    {
        defendant: '김건희',
        charge: '도이치모터스 주가조작, 정치자금법 위반 (내란공모 미기소)',
        judge: '우인성 부장판사',
        court: '형사합의27부',
        actualVerdict: {
            sentence: '징역 1년 8개월 (주가조작 무죄)',
            prosecution: '징역 15년',
            issues: [
                '대법원 포괄일죄 판례에 정면 위배 — 3개 범행 분리하여 2건 공소시효 도과',
                '구형 15년 대비 1/9 수준인 1년 8개월 선고',
                '정치자금법 전면 무죄 → 윤석열 당선무효 가능성 차단',
                '판사 주가조작 재판 첫 담당, 과거 판결 다수 2심에서 뒤집힌 이력, 1971년 서병호 간첩 조작 고문 사건의 진실화해위원회 재심 결정을 기각한 전력',
                '내란공모 혐의 미기소 — 윤석열과 공모관계 수사 없이 별건(주가조작)만 기소하여 내란 본질 회피'
            ]
        },
        aiPrediction: {
            sentence: '징역 8~12년',
            reasoning: 'AI는 대법원 판례(포괄일죄)를 적용하면 주가조작 전체가 유죄이며, 뇌물죄 확장 시 형량 대폭 상향. 정치자금법 유죄 시 윤석열 당선무효 연결. 내란공모 혐의가 추가되었다면 형량은 무기징역 이상으로 급등.'
        },
        layJudgeSimulation: {
            sentence: '징역 8~12년',
            composition: '직업법관 3명 + 시민법관 2명',
            reasoning: '시민법관은 대법원 판례 위배 판결에 반대 투표 가능. 구형 대비 1/9 양형은 국민의 법감정과 현저히 괴리되어 시민법관이 시정. 내란공모 누락에 대해서도 시민법관이 검찰의 기소 범위 문제를 공개적으로 지적 가능.',
            citizenPerspective: [
                '대법원 판례(포괄일죄)를 깬 판결 — 시민법관이 상식적 법리 적용 요구',
                '구형의 1/9 양형은 "법 앞의 평등" 원칙 위반',
                '정치자금법 무죄로 윤석열 당선무효 차단 — 시민 감시로 방지',
                '주가조작 피해 투자자들의 법감정 반영',
                '내란공모 미기소 문제 — 시민법관이 검찰의 별건 기소 전략에 대한 공개적 문제 제기'
            ],
            europeanPrecedent: '이탈리아: 중죄재판소에서 시민참심원 6명이 직업법관 2명과 합의. 경제범죄에도 시민 참여로 양형 공정성 담보.'
        }
    },
    {
        defendant: '이상민',
        charge: '내란중요임무종사, 헌재 위증',
        judge: '류경진 부장판사',
        court: '형사합의32부',
        actualVerdict: {
            sentence: '징역 7년',
            prosecution: '징역 15년',
            issues: [
                '구형 대비 47% — 내란 범죄치고 관대한 양형',
                '행안부 장관의 치안 조직 관할 책임 과소 반영',
                '가담 범위를 "지시 전달" 수준으로 축소 해석',
                '한덕수(153%)와 극단적 양형 격차'
            ]
        },
        aiPrediction: {
            sentence: '징역 12~15년',
            reasoning: 'AI는 행안부 장관이 경찰·소방을 관할하는 치안 핵심 부처 수장으로서 내란을 저지할 직접적 책임이 있으나 오히려 가담한 점을 가중 요소로 평가. 불작위 자체가 내란 가담에 해당.'
        },
        layJudgeSimulation: {
            sentence: '징역 12~15년',
            composition: '직업법관 3명 + 시민법관 2명',
            reasoning: '시민법관은 국가 안보 책임자의 내란 가담에 대해 시민적 분노를 반영. 언론사 단전·단수 지시는 시민 생활에 직접 영향을 미치는 행위.',
            citizenPerspective: [
                '행안부 장관은 시민의 안전을 책임지는 직위 — 내란 가담은 시민에 대한 배신',
                '언론사 단전·단수는 시민의 알 권리 침해',
                '한덕수(23년)와의 양형 격차(7년)는 형평성 위반',
                '내란중요임무종사의 "중요임무" 해석이 지나치게 협소'
            ],
            europeanPrecedent: '스웨덴: 참심원 3명이 직업법관 1명과 합의. 참심원 다수결 가능하여 시민의 양형 판단이 직접 반영.'
        }
    },
    {
        defendant: '김용현',
        charge: '내란중요임무종사 (형법 제87조)',
        judge: '지귀연 부장판사',
        court: '형사합의25부',
        actualVerdict: {
            sentence: '징역 30년',
            prosecution: '무기징역',
            issues: [
                '비상계엄을 주도적으로 준비한 핵심 인물',
                '대통령의 비이성적 결심을 조장한 책임'
            ]
        },
        aiPrediction: {
            sentence: '무기징역',
            reasoning: 'AI는 김용현이 계엄 실행의 실질적 총책임자로서 노상원·문상호 등과 사전 모의한 점을 고려, 내란 수괴에 준하는 양형 필요성 지적.'
        },
        layJudgeSimulation: {
            sentence: '무기징역',
            composition: '직업법관 3명 + 시민법관 2명',
            reasoning: '시민법관은 국방부 장관이 계엄을 주도적으로 준비하고 대통령의 결심을 조장한 것에 대해 최고 수준의 양형 요구.',
            citizenPerspective: [
                '국방부 장관이 민주주의 전복을 주도적으로 준비 — 최고형에 준하는 양형',
                '군을 사적 목적에 동원한 헌법 위반',
                '롯데리아 회동 등 사전 모의의 계획성'
            ],
            europeanPrecedent: '독일: 연방헌법수호법에 따라 국가 전복 범죄는 참심재판 필수. 시민 참여로 민주주의 수호.'
        }
    },
    {
        defendant: '노상원',
        charge: '내란중요임무종사 (형법 제87조)',
        judge: '지귀연 부장판사',
        court: '형사합의25부',
        actualVerdict: {
            sentence: '징역 18년',
            prosecution: '징역 30년',
            issues: [
                '계엄 사전 모의, 포고령 초안 작성, 선관위 침입 지휘',
                '예비역 민간인 신분으로서의 가담 — 구형의 60%'
            ]
        },
        aiPrediction: {
            sentence: '무기징역',
            reasoning: 'AI는 노상원이 내란을 기획·공모·실행한 핵심 인물로서 포고령 초안 작성, 선관위 침입 지휘 등 김용현에 준하는 역할을 수행한 점을 고려. 민간인 신분은 감경 사유가 아니라 오히려 민주주의 전복을 자발적으로 기획한 가중 요소.'
        },
        layJudgeSimulation: {
            sentence: '무기징역',
            composition: '직업법관 3명 + 시민법관 2명',
            reasoning: '시민법관은 노상원이 내란을 기획(포고령 초안)·공모(김용현과 사전 모의)·실행(선관위 침입 지휘)한 3단계 모두에 핵심 가담한 점에서 김용현과 동일한 무기징역이 타당하다고 판단.',
            citizenPerspective: [
                '내란 기획·공모·실행 3단계 모두 핵심 가담 — 김용현과 동등한 책임',
                '민간인이 군사 쿠데타를 자발적으로 기획 — 민주주의의 근본적 위협',
                '포고령 초안 작성은 내란의 설계도를 그린 행위',
                '선관위 침입 지휘는 선거 제도 자체를 공격한 중대 범죄'
            ],
            europeanPrecedent: '핀란드: 참심원 3명 + 직업법관 1명. 참심원 개별 투표권 보유로 시민의 독립적 양형 판단 가능.'
        }
    },
    {
        defendant: '김용군',
        charge: '내란중요임무종사 (형법 제87조)',
        judge: '지귀연 부장판사',
        court: '형사합의25부',
        actualVerdict: {
            sentence: '무죄',
            prosecution: '징역 10년',
            issues: [
                '국헌문란 목적을 미필적으로라도 인식·공유했다는 증거 부족으로 무죄',
                '방첩사 HQ요원으로서 내란 현장에 직접 투입되었으나 목적 인식 부정',
                '군 명령 체계에 따른 행위로 판단 — 개인 책임 면제'
            ]
        },
        aiPrediction: {
            sentence: '징역 7~10년',
            reasoning: 'AI는 방첩사 HQ요원이 내란 현장에 투입된 것 자체가 내란중요임무종사에 해당하며, 군 명령이라도 명백한 위법 명령에 대한 거부 의무가 있었다고 평가. 국헌문란 목적 미인식은 감경 사유이나 무죄 사유는 아님.'
        },
        layJudgeSimulation: {
            sentence: '징역 7~10년',
            composition: '직업법관 3명 + 시민법관 2명',
            reasoning: '시민법관은 "명령에 따랐을 뿐"이라는 항변에 대해 뉘른베르크 원칙을 적용. 내란 현장에 투입된 군인은 명령의 위법성을 인식할 수 있었으며, 거부 의무가 있었다고 판단.',
            citizenPerspective: [
                '방첩사 HQ요원이 내란 현장 투입 — "명령 복종"은 면죄부가 아님',
                '뉘른베르크 원칙: 명백한 위법 명령에 대한 거부 의무',
                '시민의 관점에서 국회에 무장 투입된 군인의 무죄는 상식에 반함',
                '군 명령 체계의 무비판적 수용은 민주주의의 위험 요소'
            ],
            europeanPrecedent: '독일: 참심원 2명 + 직업법관 3명. 시민법관이 군사적 명령 복종 논리에 대해 시민적 관점으로 견제. 독일은 뉘른베르크 재판 이후 위법 명령 거부 원칙을 참심제로 강화.'
        }
    },
    {
        defendant: '조지호',
        charge: '내란중요임무종사 (형법 제87조)',
        judge: '지귀연 부장판사',
        court: '형사합의25부',
        actualVerdict: {
            sentence: '징역 12년',
            prosecution: '징역 20년',
            issues: [
                '경찰청장으로서 포고령 위법성 미검토',
                '군의 국회 진입 조력, 의원 출입 차단',
                '구형의 60%'
            ]
        },
        aiPrediction: {
            sentence: '징역 15~18년',
            reasoning: 'AI는 경찰청장이 포고령 위법성을 검토하지 않고 군의 국회 진입을 조력한 것은 직무 유기를 넘어 적극적 내란 가담으로 평가.'
        },
        layJudgeSimulation: {
            sentence: '징역 15~18년',
            composition: '직업법관 3명 + 시민법관 2명',
            reasoning: '시민법관은 시민의 안전을 책임지는 경찰 수장이 내란에 가담한 것에 대해 가중 처벌 요구.',
            citizenPerspective: [
                '경찰청장은 시민을 보호해야 할 의무 — 내란 가담은 직무 배신',
                '국회의원 출입 차단은 민주주의의 핵심인 국회 기능 마비',
                '포고령 위법성 미검토는 의도적 방조'
            ],
            europeanPrecedent: '노르웨이: 2018년 참심제 통일 후 참심원 2명 + 법관 1명 체제. 시민이 법 집행기관의 월권에 대해 직접 판단.'
        }
    },
    {
        defendant: '김봉식',
        charge: '내란중요임무종사 (형법 제87조)',
        judge: '지귀연 부장판사',
        court: '형사합의25부',
        actualVerdict: {
            sentence: '징역 10년',
            prosecution: '징역 15년',
            issues: [
                '서울경찰청장으로서 국회 봉쇄 가담',
                '안가회동 문건 수령',
                '구형의 67%'
            ]
        },
        aiPrediction: {
            sentence: '징역 12~15년',
            reasoning: 'AI는 서울경찰청장이 수도의 치안을 책임지는 핵심 직위로서 국회 봉쇄에 가담한 중대성을 반영.'
        },
        layJudgeSimulation: {
            sentence: '징역 12~15년',
            composition: '직업법관 3명 + 시민법관 2명',
            reasoning: '시민법관은 수도 서울의 치안 수장이 국회 봉쇄에 가담한 것에 대해 시민적 분노를 양형에 반영.',
            citizenPerspective: [
                '서울경찰청장은 수도의 시민 안전 책임자',
                '국회 봉쇄는 시민의 대표기관에 대한 공격',
                '안가회동 참석은 사전 모의 가담의 증거'
            ],
            europeanPrecedent: '덴마크: 중대 형사사건은 배심원 6명 + 법관 3명. 시민 다수 참여로 법집행 기관 범죄에 엄정 대응.'
        }
    },
    {
        defendant: '목현태',
        charge: '내란중요임무종사 (형법 제87조)',
        judge: '지귀연 부장판사',
        court: '형사합의25부',
        actualVerdict: {
            sentence: '징역 3년',
            prosecution: '징역 12년',
            issues: [
                '국회경비대장으로서 국회의원 출입 차단',
                '국회의장 4번 수색 지시',
                '구형의 25% — 매우 관대한 양형'
            ]
        },
        aiPrediction: {
            sentence: '징역 7~10년',
            reasoning: 'AI는 국회경비대장이 국회의원 출입을 직접 차단하고 국회의장을 수색한 행위는 국회 기능 마비의 직접적 실행행위로 평가. 구형의 25%는 과도한 감경.'
        },
        layJudgeSimulation: {
            sentence: '징역 7~10년',
            composition: '직업법관 3명 + 시민법관 2명',
            reasoning: '시민법관은 국민의 대표기관인 국회를 물리적으로 봉쇄한 행위에 대해 상식적 수준의 양형 요구.',
            citizenPerspective: [
                '국회의원 출입 차단은 국민의 대표권 침해',
                '국회의장 수색은 헌법기관에 대한 모독',
                '구형의 25%(3년)는 국민의 법감정과 극단적 괴리'
            ],
            europeanPrecedent: '오스트리아: 중죄(5년 이상)는 배심원 8명 참여. 헌법기관 침해 범죄에 시민 참여 의무화.'
        }
    }
];

// 참심제 구조적 문제 데이터
const SYSTEMIC_ISSUES = {
    prosecution: [
        {
            title: '외환유치죄(형법 93조) 미기소',
            description: '드론작전사령부의 북한 드론 5차례 침투에 대해 현역 장교가 "윤석열이 작전 승인반복 지시"라고 증언했으나, 1차 특검에서 외환유치죄 기소 누락.',
            impact: '외환유치죄 성립 시 사형·무기징역까지 가능한 추가 중형 미반영',
            citizenSolution: '시민법관 참여 시 검찰의 기소 범위에 대한 시민 감시 기능 강화. 유럽 참심제에서는 시민이 검찰 기소에 대한 의문을 재판 과정에서 제기 가능.'
        },
        {
            title: '도이치모터스 공소장 설계 부실',
            description: '대법원이 동종 사건에서 포괄일죄로 인정한 판례가 있음에도, 특검이 각 행위를 분리 기재하여 공소시효 도과 빌미 제공.',
            impact: '핵심 혐의 무죄 → 구형 15년의 1/9인 1년 8개월만 선고',
            citizenSolution: '시민법관은 상식적 관점에서 판례 위배 판결에 반대 가능. 독일에서는 참심원이 법관의 법리 설명을 듣고 독립적으로 투표.'
        },
        {
            title: '정치자금법·뇌물죄 미적용',
            description: '김건희의 명태균 무상 여론조사 수수에 대해 뇌물죄 대신 알선수재만 적용. 정치자금법 무죄로 윤석열 당선무효 가능성 차단.',
            impact: '윤석열 연루 차단, 정치자금법 전면 무죄 판결',
            citizenSolution: '시민법관은 검찰의 봐주기 기소에 대한 감시 역할. 프랑스 중죄법원에서는 시민배심원이 기소 범위의 적정성을 간접 견제.'
        },
        {
            title: '내란중요임무종사 가담 범위 축소 특정',
            description: '이상민의 행안부 장관 직위에 따른 치안 조직 관할 책임을 충분히 규명하지 않고 언론사 단전·단수 지시 전달로 좁게 특정.',
            impact: '재판부의 감경 판단에 빌미를 제공, 구형 15년 대비 47%인 7년 선고',
            citizenSolution: '시민법관은 국가 안보 책임자의 내란 가담에 대한 시민적 관점을 제공. 스웨덴에서는 참심원 다수결로 양형 결정 가능.'
        }
    ],
    judiciary: [
        {
            title: '대법원 판례 정면 위배 판결',
            description: '우인성 판사가 도이치모터스 주가조작을 3개 범행으로 분리하여 대법원 포괄일죄 판례에 정면 위배되는 판결. 특검도 "대법원 판결에 위배되는 판결"이라고 공식 비판. 또한 1971년 서병호 간첩 조작 고문 사건에 대해 진실화해위원회가 재심을 결정했음에도 이를 기각한 전력이 있는 판사.',
            impact: '도이치모터스 주가조작 전면 무죄, 사법부 신뢰도 심각한 훼손',
            citizenSolution: '시민법관은 대법원 판례를 법관으로부터 설명받고 상식적 판단으로 판례 위배 방지. 독일에서는 참심원이 법관과 동등한 투표권으로 부당 판결 견제.'
        },
        {
            title: '양형 괴리 — 구형 대비 극단적 편차',
            description: '동일 내란 사건에서 한덕수 153%, 이상민 47%, 김건희 11%(1/9). 재판부 간 양형 기준이 극단적으로 불일치.',
            impact: '국민의 법감정과 현저한 괴리, 사법부 내 양형 일관성에 대한 의문',
            citizenSolution: '시민법관이 양형에 참여하면 국민의 상식적 법감정이 반영되어 양형 괴리 축소. 이탈리아에서는 시민참심원 6명이 법관 2명과 함께 양형을 결정하여 일관성 유지.'
        },
        {
            title: '재판장 편향·비공개 논란',
            description: '지귀연 부장판사의 구속심사 편향 논란, 재판 비공개 진행(전직 대통령 재판 최초), 1심 선고 후 전보 인사.',
            impact: '사법부 독립성·공정성에 대한 의문, 국민의 알 권리 침해',
            citizenSolution: '시민법관 참여 시 재판 공개 원칙이 강화되고, 재판장의 편향적 소송지휘를 시민이 직접 견제. 독일에서는 참심원이 재판 과정 전체에 참여하여 투명성 보장.'
        },
        {
            title: '법해석 독점과 시민 배제',
            description: '조희대 대법원장의 이재명 파기환송, 우인성의 포괄일죄 분리 및 서병호 간첩 조작 재심 기각 등 직업법관이 법해석을 독점하면서 국민의 상식과 괴리되는 판결 양산.',
            impact: '사법에 대한 국민 신뢰 하락, 법관 불신 심화',
            citizenSolution: '참심제 도입으로 법해석 독점을 시민 참여로 견제. 헌법 제1조 2항 "모든 권력은 국민으로부터 나온다"의 사법부 적용.'
        }
    ]
};

// 유럽 참심제 사례 데이터
const EUROPEAN_PRECEDENTS = [
    {
        country: '독일',
        flag: '\uD83C\uDDE9\uD83C\uDDEA',
        system: 'Sch\u00F6ffengericht (참심제)',
        composition: '참심원 2명 + 직업법관 1명',
        features: [
            '참심원은 유무죄와 양형 모두 동등한 결정권 보유',
            '5년 임기, 일반 시민 중 선발',
            '형사재판 중심, 유죄 선고에 2/3 다수결 필요',
            '1877년부터 운영, 150년 전통'
        ],
        relevance: '내란 사건과 같은 국가 전복 범죄에서 시민 참심원이 직업법관과 동등하게 재판에 참여하여 민주주의 수호 기능 수행.'
    },
    {
        country: '프랑스',
        flag: '\uD83C\uDDEB\uD83C\uDDF7',
        system: 'Cour d\'assises (중죄법원)',
        composition: '시민배심원 6명 + 직업법관 3명 (항소심: 배심원 9명)',
        features: [
            '중죄사건(15년 이상 형사사건) 전담',
            '배심원과 법관이 합의체 구성',
            '유죄 선고에 8/9 다수결 (엄격한 기준)',
            '2000년 항소심 도입으로 이중 시민 참여'
        ],
        relevance: '고위 공직자의 국가 반역 범죄에 시민 배심원이 대거 참여하여 엄정한 양형 실현.'
    },
    {
        country: '이탈리아',
        flag: '\uD83C\uDDEE\uD83C\uDDF9',
        system: 'Corte d\'Assise (중죄재판소)',
        composition: '시민참심원 6명 + 직업법관 2명',
        features: [
            '중죄사건 전담 (징역 24년 이상 또는 무기징역)',
            '시민참심원이 법관보다 3배 많음',
            '만장일치 불요, 다수결 가능',
            '항소심도 동일 구조'
        ],
        relevance: '시민참심원이 법관의 3배로 시민의 목소리가 압도적. 경제범죄(주가조작 등)에도 적용 가능.'
    },
    {
        country: '스웨덴',
        flag: '\uD83C\uDDF8\uD83C\uDDEA',
        system: 'N\u00E4mndem\u00E4n (참심제)',
        composition: '참심원 3명 + 직업법관 1명',
        features: [
            '참심원이 법관보다 3배 많음',
            '정당 추천으로 선출, 형사·민사 모두 적용',
            '참심원 다수결 가능 — 법관의 의견을 뒤집을 수 있음',
            '중세시대부터의 전통'
        ],
        relevance: '참심원 다수결로 법관의 양형을 뒤집을 수 있어, 관대한 양형에 대한 시민 견제 기능이 가장 강력.'
    }
];

// 상태별 색상/라벨 매핑
const STATUS_CONFIG = {
    convicted: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', label: '유죄', dot: 'bg-red-500' },
    acquitted: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', label: '무죄', dot: 'bg-green-500' },
    partial: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', label: '일부유죄', dot: 'bg-yellow-500' },
    pending: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', label: '선고 대기', dot: 'bg-blue-500' }
};

// 통계 계산
function computeStats(verdictsData) {
    const convicted = verdictsData.filter(v => v.status === 'convicted').length;
    const acquitted = verdictsData.filter(v => v.status === 'acquitted').length;
    const partial = verdictsData.filter(v => v.status === 'partial').length;
    const pending = verdictsData.filter(v => v.status === 'pending').length;

    // 구형 대비 선고 비율 (숫자 추출 가능한 건만)
    const sentenceRatios = [];
    verdictsData.forEach(v => {
        if (!v.sentence || !v.prosecution) return;
        const sentenceMatch = v.sentence.match(/(\d+)년/);
        const prosMatch = v.prosecution.match(/(\d+)년/);
        if (sentenceMatch && prosMatch) {
            const sentenceYears = parseInt(sentenceMatch[1], 10);
            const prosYears = parseInt(prosMatch[1], 10);
            sentenceRatios.push({
                defendant: v.defendant,
                sentence: sentenceYears,
                prosecution: prosYears,
                ratio: Math.round((sentenceYears / prosYears) * 100)
            });
        }
    });

    return { convicted, acquitted, partial, pending, sentenceRatios };
}

// 기수 분석 계산
function computeClassAnalysis(firstInstanceCourts, appealCourtsData) {
    const firstInstanceClasses = [];
    firstInstanceCourts.forEach(court => {
        firstInstanceClasses.push(court.chiefClass);
        court.associates.forEach(a => firstInstanceClasses.push(a.classYear));
    });

    const appealClasses = [];
    appealCourtsData.forEach(court => {
        court.members.forEach(m => appealClasses.push(m.classYear));
    });

    const avg = (arr) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;

    // 기수별 인원 분포
    const allClasses = [...firstInstanceClasses, ...appealClasses];
    const distribution = {};
    allClasses.forEach(c => { distribution[c] = (distribution[c] || 0) + 1; });

    return {
        firstInstanceAvg: avg(firstInstanceClasses),
        appealAvg: avg(appealClasses),
        firstInstanceClasses,
        appealClasses,
        distribution: Object.entries(distribution).sort((a, b) => Number(a[0]) - Number(b[0]))
    };
}

export default function InsurrectionTrialAnalysis() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(() => {
        const tabParam = searchParams.get('tab');
        const validTabs = ['overview', 'courts', 'timeline', 'classAnalysis', 'legal', 'simulation', 'aiVerdict'];
        return validTabs.includes(tabParam) ? tabParam : 'overview';
    });

    // 탭 변경 시 URL 업데이트 (SNS 공유 시 탭 상태 유지)
    useEffect(() => {
        if (activeTab === 'overview') {
            // 기본 탭이면 ?tab= 제거 (깔끔한 URL)
            if (searchParams.has('tab')) {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('tab');
                setSearchParams(newParams, { replace: true });
            }
        } else {
            setSearchParams({ tab: activeTab }, { replace: true });
        }
    }, [activeTab]);
    const [courtTab, setCourtTab] = useState('first');
    const [verdicts, setVerdicts] = useState(DEFAULT_VERDICTS);
    const [firstCourts, setFirstCourts] = useState(DEFAULT_FIRST_COURTS);
    const [appealCourts, setAppealCourts] = useState(DEFAULT_APPEAL_COURTS);
    const [loading, setLoading] = useState(true);
    const [expandedSim, setExpandedSim] = useState(null);
    const [expandedDisparity, setExpandedDisparity] = useState(null);
    const [citizenReports, setCitizenReports] = useState({});  // { defendant: [reports] }
    const [reportForm, setReportForm] = useState({ defendant: '', content: '', sourceUrl: '', sourceType: 'news', nickname: '' });
    const [showReportForm, setShowReportForm] = useState(null); // which defendant idx
    const [factCheckResult, setFactCheckResult] = useState(null); // { score, verdict, reasons, defendant }
    const [reportSubmitting, setReportSubmitting] = useState(false);

    // === 시민 제보 팩트체크 알고리즘 ===
    const TRUSTED_DOMAINS = ['hankyoreh.com','khan.co.kr','kbs.co.kr','mbc.co.kr','sbs.co.kr','ytn.co.kr','yna.co.kr','hani.co.kr',
        'joins.com','donga.com','chosun.com','news1.kr','newsis.com','jtbc.co.kr','yonhapnews.co.kr','bbc.com','reuters.com',
        'court.go.kr','law.go.kr','assembly.go.kr','moleg.go.kr','wikileaks.org','opennet.or.kr'];

    const RED_FLAG_KEYWORDS = ['확실히','무조건','100%','음모','비밀결사','외계','사탄','공산당 지령','간첩','빨갱이','주사파'];

    const LEGAL_KEYWORDS = ['형법','내란','공모','교사','방조','수괴','중요임무','부수행위','외환','국헌문란','계엄','긴급조치',
        '헌법','대법원','판례','증거','공소장','기소','구형','선고','징역','사형','무기'];

    const analyzeFactCheck = (content, sourceUrl, sourceType) => {
        let score = 50; // base score
        const reasons = [];

        // 1. Source credibility
        if (sourceUrl && sourceUrl.trim()) {
            try {
                const urlObj = new URL(sourceUrl.startsWith('http') ? sourceUrl : 'https://' + sourceUrl);
                const domain = urlObj.hostname.replace('www.', '');
                const isTrusted = TRUSTED_DOMAINS.some(d => domain.includes(d));
                if (isTrusted) {
                    score += 25;
                    reasons.push({ type: 'positive', text: `신뢰할 수 있는 출처 (${domain})` });
                } else {
                    score += 5;
                    reasons.push({ type: 'neutral', text: `출처 확인 필요 (${domain})` });
                }
            } catch {
                score -= 10;
                reasons.push({ type: 'negative', text: '유효하지 않은 URL 형식' });
            }
        } else {
            score -= 20;
            reasons.push({ type: 'negative', text: '출처 URL 미제공 — 신뢰도 대폭 감소' });
        }

        // 2. Source type bonus
        if (sourceType === 'court') { score += 15; reasons.push({ type: 'positive', text: '법원/공식 문서 출처' }); }
        else if (sourceType === 'news') { score += 10; reasons.push({ type: 'positive', text: '언론 보도 기반' }); }
        else if (sourceType === 'insider') { score += 5; reasons.push({ type: 'neutral', text: '내부 제보 — 교차검증 필요' }); }
        else { reasons.push({ type: 'neutral', text: '기타 출처 — 추가 검증 권장' }); }

        // 3. Content quality
        if (content.length < 30) { score -= 15; reasons.push({ type: 'negative', text: '제보 내용이 너무 짧음 (30자 이상 권장)' }); }
        else if (content.length >= 100) { score += 10; reasons.push({ type: 'positive', text: '구체적인 제보 내용' }); }

        // 4. Legal term presence
        const legalMatches = LEGAL_KEYWORDS.filter(kw => content.includes(kw));
        if (legalMatches.length >= 3) { score += 10; reasons.push({ type: 'positive', text: `법률 용어 ${legalMatches.length}개 포함 — 전문성 확인` }); }
        else if (legalMatches.length >= 1) { score += 5; reasons.push({ type: 'neutral', text: `법률 용어 포함` }); }

        // 5. Red flags
        const redFlags = RED_FLAG_KEYWORDS.filter(kw => content.includes(kw));
        if (redFlags.length > 0) { score -= 15 * redFlags.length; reasons.push({ type: 'negative', text: `의심스러운 표현 감지: "${redFlags.join('", "')}"` }); }

        // 6. Specific defendant mention check
        const defendants = SIMULATION_DATA.map(d => d.defendant);
        const mentionedDefendants = defendants.filter(d => content.includes(d));
        if (mentionedDefendants.length > 0) { score += 5; reasons.push({ type: 'positive', text: `관련 피고인 명시: ${mentionedDefendants.join(', ')}` }); }

        // Clamp score
        score = Math.max(0, Math.min(100, score));

        // Determine verdict
        let verdict, verdictLabel, verdictColor;
        if (score >= 70) { verdict = 'trusted'; verdictLabel = '신뢰'; verdictColor = 'green'; }
        else if (score >= 40) { verdict = 'caution'; verdictLabel = '주의'; verdictColor = 'amber'; }
        else { verdict = 'warning'; verdictLabel = '경고'; verdictColor = 'red'; }

        return { score, verdict, verdictLabel, verdictColor, reasons };
    };

    const handleReportSubmit = async (defendantName) => {
        if (!reportForm.content.trim()) return;
        setReportSubmitting(true);
        setFactCheckResult(null);

        // Run fact-check
        const result = analyzeFactCheck(reportForm.content, reportForm.sourceUrl, reportForm.sourceType);
        const isApproved = result.score >= 40;

        // Save to Firestore
        try {
            await addDoc(collection(db, 'citizenReports'), {
                defendant: defendantName,
                content: reportForm.content.trim(),
                sourceUrl: reportForm.sourceUrl.trim(),
                sourceType: reportForm.sourceType,
                nickname: reportForm.nickname.trim() || '익명 시민',
                credibilityScore: result.score,
                verdict: result.verdict,
                analysisReasons: result.reasons.map(r => r.text),
                timestamp: Timestamp.now(),
                approved: isApproved
            });

            // Update local state if approved
            if (isApproved) {
                setCitizenReports(prev => {
                    const updated = { ...prev };
                    if (!updated[defendantName]) updated[defendantName] = [];
                    updated[defendantName] = [{
                        defendant: defendantName,
                        content: reportForm.content.trim(),
                        sourceUrl: reportForm.sourceUrl.trim(),
                        sourceType: reportForm.sourceType,
                        nickname: reportForm.nickname.trim() || '익명 시민',
                        credibilityScore: result.score,
                        verdict: result.verdict,
                        timestamp: { seconds: Date.now() / 1000 }
                    }, ...updated[defendantName]];
                    return updated;
                });
            }
        } catch (err) {
            console.error('제보 저장 실패:', err);
        }

        setFactCheckResult({ ...result, defendant: defendantName });
        setReportSubmitting(false);

        // Reset form after success
        if (isApproved) {
            setTimeout(() => {
                setReportForm({ defendant: '', content: '', sourceUrl: '', sourceType: 'news', nickname: '' });
            }, 3000);
        }
    };

    // Firestore에서 최신 데이터 가져오기
    useEffect(() => {
        const fetchData = async () => {
            try {
                // DEFAULT_VERDICTS만 사용 (Firestore 쓰레기 데이터 차단)
                // Firestore에는 동기화만 수행, 표시는 DEFAULT_VERDICTS만
                setVerdicts(DEFAULT_VERDICTS);

                // Firestore 동기화: DEFAULT_VERDICTS를 Firestore에 최신 저장
                try {
                    for (const v of DEFAULT_VERDICTS) {
                        const docId = `${v.defendant}_${v.date}`.replace(/[/.]/g, '_');
                        await setDoc(doc(db, 'insurrectionVerdicts', docId), v);
                    }
                } catch (syncErr) {
                    console.warn('Firestore sync skipped:', syncErr);
                }

                // 재판부 데이터
                const courtsSnap = await getDocs(collection(db, 'insurrectionCourts'));
                if (courtsSnap.size > 0) {
                    const firstInstance = [];
                    const appeal = [];
                    courtsSnap.forEach(d => {
                        const data = d.data();
                        if (data.type === 'appeal') {
                            appeal.push(data);
                        } else {
                            firstInstance.push(data);
                        }
                    });
                    if (firstInstance.length > 0) setFirstCourts(firstInstance);
                    if (appeal.length > 0) setAppealCourts(appeal);
                }
                // 시민 제보 데이터 로드
                try {
                    const reportsSnap = await getDocs(collection(db, 'citizenReports'));
                    const reportsMap = {};
                    reportsSnap.forEach(d => {
                        const data = d.data();
                        if (data.approved) {
                            if (!reportsMap[data.defendant]) reportsMap[data.defendant] = [];
                            reportsMap[data.defendant].push({ id: d.id, ...data });
                        }
                    });
                    // Sort by timestamp desc
                    Object.values(reportsMap).forEach(arr => arr.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
                    setCitizenReports(reportsMap);
                } catch (reportErr) {
                    console.warn('시민 제보 로드 실패:', reportErr);
                }
            } catch (error) {
                console.error('Failed to fetch trial data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const stats = computeStats(verdicts);
    const classAnalysis = computeClassAnalysis(firstCourts, appealCourts);

    const tabs = [
        { id: 'overview', label: '종합 현황' },
        { id: 'courts', label: '재판부 구성' },
        { id: 'timeline', label: '판결 타임라인' },
        { id: 'classAnalysis', label: '기수 분석' },
        { id: 'legal', label: '형법 제91조 분석' },
        { id: 'simulation', label: '참심제 시뮬레이션' },
        { id: 'aiVerdict', label: 'AI 판결 비교분석' }
    ];

    return (
        <>
            <SEOHead title="내란재판 분석" description="12.3 내란사건 재판 일정 및 진행 상황 분석" path="/trial-analysis" />
            <Header />
            <div className="bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen pt-24">
                <div className="container mx-auto px-4 py-8 max-w-6xl">

                    {/* 로딩 인디케이터 */}
                    {loading && (
                        <div className="text-center py-4 mb-4">
                            <div className="inline-block w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-500 mt-2">최신 데이터 확인 중...</p>
                        </div>
                    )}

                    {/* 헤더 영역 */}
                    <div className="text-center mb-10">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                            내란 재판 종합분석
                        </h1>
                        <p className="text-gray-500 text-lg">
                            12.3 내란 사건 재판 현황 및 판결 분석
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                유죄 {stats.convicted}건
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                무죄 {stats.acquitted}건
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                일부유죄 {stats.partial}건
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                대기 {stats.pending}건
                            </span>
                        </div>
                    </div>

                    {/* 탭 네비게이션 */}
                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* 종합 현황 탭 */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* 통계 카드 그리드 */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard label="유죄" count={stats.convicted} color="red" icon="⚖" />
                                <StatCard label="무죄" count={stats.acquitted} color="green" icon="✓" />
                                <StatCard label="일부유죄" count={stats.partial} color="yellow" icon="⚠" />
                                <StatCard label="선고 대기" count={stats.pending} color="blue" icon="⌛" />
                            </div>

                            {/* 구형 대비 선고 비율 차트 */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">구형 대비 선고 비율</h2>
                                <div className="space-y-4">
                                    {stats.sentenceRatios.map((item, idx) => (
                                        <div key={idx}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-700">{item.defendant}</span>
                                                <span className="text-sm text-gray-500">
                                                    선고 {item.sentence}년 / 구형 {item.prosecution}년 ({item.ratio}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-4 relative">
                                                {/* 구형 (전체 바) */}
                                                <div className="absolute inset-0 bg-gray-300 rounded-full"></div>
                                                {/* 선고 비율 */}
                                                <div
                                                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                                                        item.ratio > 100 ? 'bg-red-500' : item.ratio > 50 ? 'bg-orange-400' : 'bg-blue-500'
                                                    }`}
                                                    style={{ width: `${Math.min(item.ratio, 100)}%` }}
                                                ></div>
                                                {item.ratio > 100 && (
                                                    <div
                                                        className="absolute inset-y-0 bg-red-600 rounded-r-full opacity-60"
                                                        style={{ left: '100%', width: `${Math.min(item.ratio - 100, 60)}%` }}
                                                    ></div>
                                                )}
                                            </div>
                                            {item.ratio > 100 && (
                                                <p className="text-xs text-red-600 mt-1 font-medium">
                                                    구형 대비 {item.ratio - 100}% 초과 선고
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {stats.sentenceRatios.length === 0 && (
                                    <p className="text-gray-400 text-center py-4">비교 가능한 데이터가 없습니다.</p>
                                )}
                            </div>

                            {/* 전체 판결 요약 테이블 */}
                            <div className="bg-white rounded-xl shadow-lg p-6 overflow-x-auto">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">전체 판결 요약</h2>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200">
                                            <th className="text-left py-3 px-2 font-semibold text-gray-600">일자</th>
                                            <th className="text-left py-3 px-2 font-semibold text-gray-600">피고인</th>
                                            <th className="text-left py-3 px-2 font-semibold text-gray-600 hidden md:table-cell">혐의</th>
                                            <th className="text-left py-3 px-2 font-semibold text-gray-600">구형</th>
                                            <th className="text-left py-3 px-2 font-semibold text-gray-600">선고</th>
                                            <th className="text-left py-3 px-2 font-semibold text-gray-600">결과</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {verdicts.map((v, idx) => {
                                            const cfg = STATUS_CONFIG[v.status];
                                            return (
                                                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-2 text-gray-600 whitespace-nowrap">{v.date}</td>
                                                    <td className="py-3 px-2 font-medium text-gray-800">{v.defendant}</td>
                                                    <td className="py-3 px-2 text-gray-600 hidden md:table-cell max-w-xs truncate">{v.charge}</td>
                                                    <td className="py-3 px-2 text-gray-600">{v.prosecution}</td>
                                                    <td className="py-3 px-2 font-medium text-gray-800">{v.sentence}</td>
                                                    <td className="py-3 px-2">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                                                            {cfg.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 재판부 구성 탭 */}
                    {activeTab === 'courts' && (
                        <div className="space-y-6">
                            {/* 1심/항소심 토글 */}
                            <div className="flex justify-center gap-2 mb-4">
                                <button
                                    onClick={() => setCourtTab('first')}
                                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                        courtTab === 'first'
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                    }`}
                                >
                                    1심 (서울중앙지방법원)
                                </button>
                                <button
                                    onClick={() => setCourtTab('appeal')}
                                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                        courtTab === 'appeal'
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                    }`}
                                >
                                    항소심 (서울고등법원)
                                </button>
                            </div>

                            {courtTab === 'first' && (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {firstCourts.map((court, idx) => (
                                        <div key={idx} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-lg font-bold text-gray-800">{court.division}</h3>
                                                <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full font-medium">1심</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">재판장</span>
                                                    <span className="font-medium text-gray-800">{court.chief}</span>
                                                    <span className="text-xs text-gray-400">({court.chiefClass}기)</span>
                                                </div>
                                                {court.associates.length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">배석</span>
                                                        {court.associates.map((a, i) => (
                                                            <span key={i} className="text-sm text-gray-700">
                                                                {a.name} <span className="text-xs text-gray-400">({a.classYear}기)</span>
                                                                {i < court.associates.length - 1 && ', '}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {court.associates.length === 0 && (
                                                    <p className="text-xs text-gray-400">배석판사 정보 미공개</p>
                                                )}
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <span className="text-sm text-gray-500">주요 사건: </span>
                                                <span className="text-sm font-medium text-gray-700">{court.mainCase}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {courtTab === 'appeal' && (
                                <div className="space-y-4">
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-amber-800">
                                            <span className="font-bold">2026.02.05 지정</span> - 서울고등법원 항소심 재판부가 배정되었습니다.
                                        </p>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {appealCourts.map((court, idx) => (
                                            <div key={idx} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-500">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-lg font-bold text-gray-800">{court.division}</h3>
                                                    <span className="text-xs px-2 py-1 bg-amber-50 text-amber-600 rounded-full font-medium">항소심</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {court.members.map((m, i) => (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                                                m.role === '재판장'
                                                                    ? 'bg-amber-100 text-amber-700'
                                                                    : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {m.role}
                                                            </span>
                                                            <span className="font-medium text-gray-800">{m.name}</span>
                                                            <span className="text-xs text-gray-400">({m.classYear}기)</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-3 pt-3 border-t border-gray-100">
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                        court.feature.includes('대등')
                                                            ? 'bg-purple-50 text-purple-600'
                                                            : 'bg-gray-50 text-gray-600'
                                                    }`}>
                                                        {court.feature}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 판결 타임라인 탭 */}
                    {activeTab === 'timeline' && (
                        <div className="space-y-4">
                            <div className="relative">
                                {/* 타임라인 세로줄 */}
                                <div className="absolute left-4 md:left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

                                {verdicts.map((v, idx) => {
                                    const cfg = STATUS_CONFIG[v.status];
                                    return (
                                        <div key={idx} className="relative pl-12 md:pl-20 pb-6">
                                            {/* 타임라인 도트 */}
                                            <div className={`absolute left-2.5 md:left-6.5 top-2 w-3.5 h-3.5 rounded-full border-2 border-white shadow ${cfg.dot}`}></div>

                                            <div className={`bg-white rounded-xl shadow-lg p-5 border-l-4 ${cfg.border}`}>
                                                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                                    <div>
                                                        <span className="text-xs text-gray-400 font-medium">{v.date}</span>
                                                        <h3 className="text-lg font-bold text-gray-800">{v.defendant}</h3>
                                                        <p className="text-sm text-gray-500">{v.court}{v.judge ? ` | ${v.judge}` : ''}</p>
                                                    </div>
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
                                                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`}></span>
                                                        {cfg.label}
                                                    </span>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-3 mt-3">
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <p className="text-xs text-gray-400 mb-1">혐의</p>
                                                        <p className="text-sm text-gray-700">{v.charge}</p>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <p className="text-xs text-gray-400 mb-1">구형 / 선고</p>
                                                        <p className="text-sm text-gray-700">
                                                            <span className="text-gray-500">구형:</span> {v.prosecution}
                                                        </p>
                                                        <p className="text-sm font-medium text-gray-800">
                                                            <span className="text-gray-500">선고:</span> {v.sentence}
                                                        </p>
                                                    </div>
                                                </div>

                                                <p className="mt-3 text-sm text-gray-600 bg-slate-50 rounded-lg p-3">
                                                    {v.detail}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 기수 분석 탭 */}
                    {activeTab === 'classAnalysis' && (
                        <div className="space-y-6">
                            {/* 평균 기수 비교 */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">사법연수원 기수 분석</h2>
                                <div className="grid md:grid-cols-2 gap-4 mb-6">
                                    <div className="bg-indigo-50 rounded-xl p-5 text-center">
                                        <p className="text-sm text-indigo-600 font-medium mb-1">1심 재판부 평균 기수</p>
                                        <p className="text-4xl font-bold text-indigo-700">{classAnalysis.firstInstanceAvg}<span className="text-lg">기</span></p>
                                        <p className="text-xs text-gray-500 mt-1">{classAnalysis.firstInstanceClasses.length}명 기준</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-5 text-center">
                                        <p className="text-sm text-amber-600 font-medium mb-1">항소심 재판부 평균 기수</p>
                                        <p className="text-4xl font-bold text-amber-700">{classAnalysis.appealAvg}<span className="text-lg">기</span></p>
                                        <p className="text-xs text-gray-500 mt-1">{classAnalysis.appealClasses.length}명 기준</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-gray-600">
                                        항소심 재판부의 평균 기수가 <span className="font-bold text-gray-800">
                                        {(classAnalysis.firstInstanceAvg - classAnalysis.appealAvg).toFixed(1)}기</span> 낮아(선임),
                                        1심 대비 경력이 더 풍부한 판사들로 구성되어 있습니다.
                                        기수가 낮을수록 임관이 빠르고 경력이 긴 선배 판사를 의미합니다.
                                    </p>
                                </div>
                            </div>

                            {/* 기수별 인원 분포 */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">기수별 인원 분포</h3>
                                <div className="space-y-3">
                                    {classAnalysis.distribution.map(([classYear, count]) => {
                                        const maxCount = Math.max(...classAnalysis.distribution.map(d => d[1]));
                                        const widthPercent = (count / maxCount) * 100;
                                        const isFirstInstance = classAnalysis.firstInstanceClasses.includes(Number(classYear));
                                        const isAppeal = classAnalysis.appealClasses.includes(Number(classYear));
                                        return (
                                            <div key={classYear} className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-gray-600 w-12 text-right">{classYear}기</span>
                                                <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
                                                    <div
                                                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                                                            isFirstInstance && isAppeal
                                                                ? 'bg-gradient-to-r from-indigo-500 to-amber-500'
                                                                : isAppeal
                                                                    ? 'bg-amber-400'
                                                                    : 'bg-indigo-400'
                                                        }`}
                                                        style={{ width: `${widthPercent}%` }}
                                                    ></div>
                                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                                                        {count}명
                                                    </span>
                                                </div>
                                                <div className="flex gap-1 w-20">
                                                    {isFirstInstance && <span className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded">1심</span>}
                                                    {isAppeal && <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded">2심</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 범례 */}
                                <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-indigo-400"></span>
                                        <span className="text-xs text-gray-600">1심 (서울중앙지법)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                                        <span className="text-xs text-gray-600">항소심 (서울고법)</span>
                                    </div>
                                </div>
                            </div>

                            {/* 전체 재판관 기수 목록 */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">재판관 전체 기수 현황</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-gray-200">
                                                <th className="text-left py-3 px-2 font-semibold text-gray-600">이름</th>
                                                <th className="text-left py-3 px-2 font-semibold text-gray-600">기수</th>
                                                <th className="text-left py-3 px-2 font-semibold text-gray-600">소속</th>
                                                <th className="text-left py-3 px-2 font-semibold text-gray-600">역할</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {firstCourts.map((court) => (
                                                <Fragment key={court.division}>
                                                    <tr className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="py-2 px-2 font-medium text-gray-800">{court.chief}</td>
                                                        <td className="py-2 px-2 text-gray-600">{court.chiefClass}기</td>
                                                        <td className="py-2 px-2">
                                                            <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded">1심 {court.division}</span>
                                                        </td>
                                                        <td className="py-2 px-2 text-gray-600">재판장</td>
                                                    </tr>
                                                    {court.associates.map((a, i) => (
                                                        <tr key={`${court.division}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="py-2 px-2 font-medium text-gray-800">{a.name}</td>
                                                            <td className="py-2 px-2 text-gray-600">{a.classYear}기</td>
                                                            <td className="py-2 px-2">
                                                                <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded">1심 {court.division}</span>
                                                            </td>
                                                            <td className="py-2 px-2 text-gray-600">배석</td>
                                                        </tr>
                                                    ))}
                                                </Fragment>
                                            ))}
                                            {appealCourts.map((court) => (
                                                court.members.map((m, i) => (
                                                    <tr key={`appeal-${court.division}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="py-2 px-2 font-medium text-gray-800">{m.name}</td>
                                                        <td className="py-2 px-2 text-gray-600">{m.classYear}기</td>
                                                        <td className="py-2 px-2">
                                                            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded">항소심 {court.division}</span>
                                                        </td>
                                                        <td className="py-2 px-2 text-gray-600">{m.role}</td>
                                                    </tr>
                                                ))
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 형법 제91조 분석 탭 */}
                    {activeTab === 'legal' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-2">형법 제91조 제2호 — 국헌문란의 목적</h2>
                                <p className="text-sm text-gray-500 mb-6">내란죄 성립의 핵심 요건 분석</p>

                                {/* 조문 원문 */}
                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6">
                                    <h3 className="font-bold text-indigo-800 mb-3">형법 제91조 (정의)</h3>
                                    <div className="space-y-2 text-sm text-gray-700">
                                        <p>본 장에서 "국헌문란"이라 함은 다음 각 호의 1에 해당하는 행위를 말한다.</p>
                                        <div className="bg-white rounded-lg p-3 ml-4">
                                            <p className="text-gray-600">제1호: 헌법 또는 법률에 정한 절차에 의하지 아니하고 헌법 또는 법률의 기능을 소멸시키는 것</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 ml-4 border-2 border-indigo-300">
                                            <p className="font-medium text-indigo-800">제2호: 헌법에 의하여 설치된 국가기관을 강압에 의하여 전복 또는 그 권능행사를 불가능하게 하는 것</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 대법원 판례 해석 */}
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
                                    <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        대법원 판례 해석
                                    </h3>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        대법원 판례에 따르면, 형법 제91조 제2호에서 명시한 <span className="font-bold text-amber-800">"헌법에 의하여 설치된 국가 기관을 강압에 의하여 전복 또는 그 권능 행사를 불가능하게 하는 것"</span>의 의미는
                                        해당 국가 기관을 제도적으로 영구히 폐지하는 경우뿐만 아니라,
                                        <span className="font-bold text-red-700"> 사실상 상당 기간 그 기능을 제대로 할 수 없게 만드는 것</span>까지 포함합니다.
                                    </p>
                                </div>

                                {/* 주요 법적 쟁점 3가지 */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-gray-800">주요 법적 쟁점</h3>

                                    {/* 쟁점 1: 대통령의 내란죄 주체 */}
                                    <div className="border border-red-200 rounded-xl p-5 bg-red-50/30">
                                        <div className="flex items-start gap-3 mb-3">
                                            <span className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                            <div>
                                                <h4 className="font-bold text-gray-800">대통령의 내란죄 주체 인정</h4>
                                                <p className="text-sm text-gray-500 mt-1">형법 제91조 제2호 + 형법 제87조 적용</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed ml-11">
                                            형법 제91조 제2호가 적용되는 '국헌문란 목적 내란죄'는 <span className="font-bold">대통령도 저지를 수 있습니다</span>.
                                            대통령이 군을 동원하여 국회를 강제로 점령하거나 국회의원을 체포함으로써 상당 기간 국회 활동을 저지하고 마비시키려는 목적을 가졌다면
                                            국헌문란 목적을 가진 폭동으로 인정되어 내란죄에 해당합니다.
                                        </p>
                                        <div className="mt-3 ml-11 grid md:grid-cols-3 gap-2">
                                            <div className="bg-red-100 rounded-lg p-2">
                                                <p className="text-xs font-medium text-red-700">검찰 입장</p>
                                                <p className="text-xs text-gray-600 mt-1">군 동원 국회 점령 시도는 명백한 내란수괴 행위</p>
                                            </div>
                                            <div className="bg-blue-100 rounded-lg p-2">
                                                <p className="text-xs font-medium text-blue-700">변호인 입장</p>
                                                <p className="text-xs text-gray-600 mt-1">헌법상 국군통수권자의 고유 권한 행사</p>
                                            </div>
                                            <div className="bg-purple-100 rounded-lg p-2">
                                                <p className="text-xs font-medium text-purple-700">법원 판단</p>
                                                <p className="text-xs text-gray-600 mt-1">대통령도 내란죄 주체, 국헌문란 목적 군 동원은 폭동</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 쟁점 2: 비상계엄과의 관계 */}
                                    <div className="border border-amber-200 rounded-xl p-5 bg-amber-50/30">
                                        <div className="flex items-start gap-3 mb-3">
                                            <span className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                            <div>
                                                <h4 className="font-bold text-gray-800">비상계엄 선포와의 관계</h4>
                                                <p className="text-sm text-gray-500 mt-1">계엄권의 한계와 내란죄 성립 조건</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed ml-11">
                                            원칙적으로 대통령의 비상계엄 선포 자체는 사법 심사의 대상이 되기 어렵고 내란에 해당하지 않습니다.
                                            그러나 비상계엄을 통해서도 할 수 없는 권한의 행사, 즉
                                            <span className="font-bold text-amber-800"> 헌법과 계엄법이 보장하는 국회의 권한이나 행정 및 사법의 본질적인 기능을 상당 기간 침해하고 마비시킬 목적</span>으로
                                            비상계엄을 선포했다면 형법 제91조 제2호에 따른 국헌문란 목적 내란죄가 성립할 수 있습니다.
                                        </p>
                                        <div className="mt-3 ml-11 bg-white rounded-lg p-3 border border-amber-200">
                                            <p className="text-xs text-gray-600">
                                                <span className="font-bold text-amber-700">본 사건 적용:</span> 12.3 비상계엄은 국회의 계엄해제 의결권을 방해하고,
                                                국회의원 출입을 차단하여 국회의 헌법적 기능을 마비시킬 목적으로 선포된 것으로 법원이 판단
                                            </p>
                                        </div>
                                    </div>

                                    {/* 쟁점 3: 공범 성립 기준 */}
                                    <div className="border border-green-200 rounded-xl p-5 bg-green-50/30">
                                        <div className="flex items-start gap-3 mb-3">
                                            <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                                            <div>
                                                <h4 className="font-bold text-gray-800">내란죄 공범 성립 기준</h4>
                                                <p className="text-sm text-gray-500 mt-1">집합범의 특성과 목적 인식 요건</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed ml-11">
                                            내란죄는 다수가 결합하는 <span className="font-bold">집합범</span>의 성격을 가집니다.
                                            공범으로 인정되려면 단순히 비상계엄 선포 등의 폭동 행위에 관여한 사실만으로는 부족하며,
                                            <span className="font-bold text-green-800"> 반드시 이 '국헌문란의 목적'을 미필적으로라도 인식하고 공유</span>하면서
                                            가담한 사실이 인정되어야만 합니다.
                                        </p>
                                        <div className="mt-3 ml-11 bg-white rounded-lg p-3 border border-green-200">
                                            <p className="text-xs text-gray-600">
                                                <span className="font-bold text-green-700">본 사건 적용:</span> 이 기준에 따라 김용군(방첩사 HQ요원)과 윤승영(수사기획조정관)은
                                                국헌문란 목적을 인식·공유했다는 증거가 부족하여 무죄 선고
                                            </p>
                                        </div>
                                        <div className="mt-3 ml-11 grid md:grid-cols-2 gap-2">
                                            <div className="bg-red-50 rounded-lg p-2 border border-red-100">
                                                <p className="text-xs font-medium text-red-700">유죄 인정 (6명)</p>
                                                <p className="text-xs text-gray-600 mt-1">윤석열, 김용현, 노상원, 조지호, 김봉식, 목현태 — 국헌문란 목적 인식·공유 인정</p>
                                            </div>
                                            <div className="bg-green-50 rounded-lg p-2 border border-green-100">
                                                <p className="text-xs font-medium text-green-700">무죄 선고 (2명)</p>
                                                <p className="text-xs text-gray-600 mt-1">김용군, 윤승영 — 국헌문란 목적 인식·공유 증거 부족</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 참심제 시뮬레이션 탭 */}
                    {activeTab === 'simulation' && (
                        <div className="space-y-6">

                            {/* A. 시뮬레이션 개요 */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-2">참심제 시뮬레이션</h2>
                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-4">
                                    <p className="text-sm text-indigo-800 font-medium leading-relaxed">
                                        <span className="font-bold">헌법 제1조 2항</span> &quot;대한민국의 주권은 국민에게 있고, 모든 권력은 국민으로부터 나온다.&quot;
                                    </p>
                                    <p className="text-sm text-gray-600 mt-2">
                                        이 원칙은 입법부와 행정부뿐만 아니라 <span className="font-bold text-indigo-700">사법부에도 동일하게 적용</span>되어야 합니다.
                                        참심제는 시민이 직업법관과 함께 재판에 참여하여 유무죄와 양형을 결정하는 제도로,
                                        유럽의 독일, 프랑스, 이탈리아, 스웨덴 등에서 이미 수백 년간 운영되고 있습니다.
                                    </p>
                                </div>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="bg-red-50 rounded-lg p-4 text-center">
                                        <p className="text-xs text-red-600 font-medium mb-1">실제 판결</p>
                                        <p className="text-sm text-gray-700">직업법관 3명이 단독으로 결정한 현재 1심 판결</p>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                                        <p className="text-xs text-blue-600 font-medium mb-1">AI 양형예측</p>
                                        <p className="text-sm text-gray-700">판례·법리·증거를 종합한 AI 기반 양형 분석</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-4 text-center">
                                        <p className="text-xs text-green-600 font-medium mb-1">참심제 시뮬레이션</p>
                                        <p className="text-sm text-gray-700">시민법관 참여 시 예상되는 양형 결과 (유럽 모델 기반)</p>
                                    </div>
                                </div>
                            </div>

                            {/* B. 3단 비교 종합표 */}
                            <div className="bg-white rounded-xl shadow-lg p-6 overflow-x-auto">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">3단 비교 종합표</h2>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200">
                                            <th className="text-left py-3 px-2 font-semibold text-gray-600">피고인</th>
                                            <th className="text-left py-3 px-2 font-semibold text-gray-600 hidden md:table-cell">혐의</th>
                                            <th className="text-left py-3 px-2 font-semibold text-red-600">실제 판결</th>
                                            <th className="text-left py-3 px-2 font-semibold text-blue-600">AI 예측</th>
                                            <th className="text-left py-3 px-2 font-semibold text-green-600">참심제<span className="block text-xs font-normal text-green-500">(시민법관+직업법관)</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {SIMULATION_DATA.map((item, idx) => (
                                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-2 font-medium text-gray-800">{item.defendant}</td>
                                                <td className="py-3 px-2 text-gray-600 hidden md:table-cell max-w-xs truncate">{item.charge}</td>
                                                <td className="py-3 px-2">
                                                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                        {item.actualVerdict.sentence}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                        {item.aiPrediction.sentence}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                        {item.layJudgeSimulation.sentence}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* C. 피고인별 상세 분석 (아코디언) */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">피고인별 상세 분석</h2>
                                <div className="space-y-3">
                                    {SIMULATION_DATA.map((item, idx) => (
                                        <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                                            <button
                                                onClick={() => setExpandedSim(expandedSim === idx ? null : idx)}
                                                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
                                                        {idx + 1}
                                                    </span>
                                                    <div>
                                                        <p className="font-bold text-gray-800">{item.defendant}</p>
                                                        <p className="text-xs text-gray-500">{item.charge} | {item.court}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {citizenReports[item.defendant]?.length > 0 && (
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                            제보 {citizenReports[item.defendant].length}건
                                                        </span>
                                                    )}
                                                    <div className="hidden sm:flex items-center gap-2">
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{item.actualVerdict.sentence}</span>
                                                        <span className="text-gray-300">→</span>
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{item.layJudgeSimulation.sentence}</span>
                                                    </div>
                                                    <svg
                                                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedSim === idx ? 'rotate-180' : ''}`}
                                                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </button>

                                            {expandedSim === idx && (
                                                <div className="border-t border-gray-200 p-4 bg-gray-50/50">
                                                    {/* 3단 비교 카드 */}
                                                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                                                        {/* 실제 판결 */}
                                                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                                                                <p className="text-sm font-bold text-red-700">실제 판결</p>
                                                            </div>
                                                            <p className="text-lg font-bold text-gray-800 mb-1">{item.actualVerdict.sentence}</p>
                                                            <p className="text-xs text-gray-500 mb-2">구형: {item.actualVerdict.prosecution}</p>
                                                            <p className="text-xs text-gray-500 mb-2">재판장: {item.judge}</p>
                                                            <div className="space-y-1">
                                                                {item.actualVerdict.issues.map((issue, i) => (
                                                                    <p key={i} className="text-xs text-gray-600 flex items-start gap-1">
                                                                        <span className="text-red-400 mt-0.5 shrink-0">&#8226;</span>
                                                                        {issue}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* AI 예측 */}
                                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                                                <p className="text-sm font-bold text-blue-700">AI 양형예측</p>
                                                            </div>
                                                            <p className="text-lg font-bold text-gray-800 mb-2">{item.aiPrediction.sentence}</p>
                                                            <p className="text-xs text-gray-600 leading-relaxed">{item.aiPrediction.reasoning}</p>
                                                        </div>

                                                        {/* 참심제 */}
                                                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                                                                <p className="text-sm font-bold text-green-700">참심제 시뮬레이션</p>
                                                            </div>
                                                            <p className="text-lg font-bold text-gray-800 mb-1">{item.layJudgeSimulation.sentence}</p>
                                                            <p className="text-xs text-gray-500 mb-2">{item.layJudgeSimulation.composition}</p>
                                                            <p className="text-xs text-gray-600 leading-relaxed">{item.layJudgeSimulation.reasoning}</p>
                                                        </div>
                                                    </div>

                                                    {/* 시민 관점 */}
                                                    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                                                        <h4 className="text-sm font-bold text-gray-800 mb-3">시민법관의 관점</h4>
                                                        <div className="grid sm:grid-cols-2 gap-2">
                                                            {item.layJudgeSimulation.citizenPerspective.map((point, i) => (
                                                                <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg p-2.5">
                                                                    <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">
                                                                        {i + 1}
                                                                    </span>
                                                                    <p className="text-xs text-gray-700 leading-relaxed">{point}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* 유럽 선례 */}
                                                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                                                        <p className="text-xs text-indigo-600 font-medium mb-1">유럽 참심제 선례</p>
                                                        <p className="text-xs text-gray-700">{item.layJudgeSimulation.europeanPrecedent}</p>
                                                    </div>

                                                    {/* === 시민 제보 섹션 === */}
                                                    <div className="mt-4 border-t border-gray-200 pt-4">
                                                        {/* 제보된 범죄사실 목록 */}
                                                        {citizenReports[item.defendant]?.length > 0 && (
                                                            <div className="mb-4">
                                                                <h4 className="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                                                                    시민 제보 사항 ({citizenReports[item.defendant].length}건 반영)
                                                                </h4>
                                                                <div className="space-y-2">
                                                                    {citizenReports[item.defendant].map((report, ri) => (
                                                                        <div key={ri} className={`rounded-lg p-3 text-xs ${
                                                                            report.verdict === 'trusted' ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
                                                                        }`}>
                                                                            <div className="flex items-center justify-between mb-1">
                                                                                <span className="font-medium text-gray-800">{report.nickname || '익명 시민'}</span>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                                                                        report.verdict === 'trusted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                                                    }`}>
                                                                                        신뢰도 {report.credibilityScore}점
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <p className="text-gray-700 leading-relaxed">{report.content}</p>
                                                                            {report.sourceUrl && (
                                                                                <a href={report.sourceUrl.startsWith('http') ? report.sourceUrl : 'https://' + report.sourceUrl}
                                                                                   target="_blank" rel="noopener noreferrer"
                                                                                   className="text-blue-600 hover:underline mt-1 inline-block">
                                                                                    출처 확인
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* 제보하기 버튼 / 폼 토글 */}
                                                        {showReportForm !== idx ? (
                                                            <button
                                                                onClick={() => { setShowReportForm(idx); setFactCheckResult(null); setReportForm({ defendant: '', content: '', sourceUrl: '', sourceType: 'news', nickname: '' }); }}
                                                                className="w-full py-3 rounded-xl border-2 border-dashed border-purple-300 text-purple-600 font-medium text-sm hover:bg-purple-50 hover:border-purple-400 transition-all flex items-center justify-center gap-2"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                                새로운 범죄사실 제보하기
                                                            </button>
                                                        ) : (
                                                            <div className="bg-white border border-purple-200 rounded-xl p-4 shadow-sm">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <h4 className="text-sm font-bold text-purple-700 flex items-center gap-2">
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                                        {item.defendant}에 대한 범죄사실 제보
                                                                    </h4>
                                                                    <button onClick={() => { setShowReportForm(null); setFactCheckResult(null); }} className="text-gray-400 hover:text-gray-600">
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                    </button>
                                                                </div>

                                                                <div className="space-y-3">
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-600 mb-1">제보 내용 *</label>
                                                                        <textarea
                                                                            value={reportForm.content}
                                                                            onChange={e => setReportForm(prev => ({ ...prev, content: e.target.value }))}
                                                                            placeholder="언론이나 판결에서 공개되지 않은 범죄 사실을 구체적으로 작성해주세요..."
                                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none resize-none"
                                                                            rows={4}
                                                                        />
                                                                        <p className="text-xs text-gray-400 mt-0.5">{reportForm.content.length}자 (30자 이상 권장)</p>
                                                                    </div>

                                                                    <div className="grid sm:grid-cols-2 gap-3">
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-600 mb-1">출처 URL</label>
                                                                            <input
                                                                                type="text"
                                                                                value={reportForm.sourceUrl}
                                                                                onChange={e => setReportForm(prev => ({ ...prev, sourceUrl: e.target.value }))}
                                                                                placeholder="https://news.example.com/article..."
                                                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-600 mb-1">출처 유형</label>
                                                                            <select
                                                                                value={reportForm.sourceType}
                                                                                onChange={e => setReportForm(prev => ({ ...prev, sourceType: e.target.value }))}
                                                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none bg-white"
                                                                            >
                                                                                <option value="news">언론 보도</option>
                                                                                <option value="court">법원/공식 문서</option>
                                                                                <option value="insider">내부 제보</option>
                                                                                <option value="other">기타</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-600 mb-1">닉네임 (선택)</label>
                                                                        <input
                                                                            type="text"
                                                                            value={reportForm.nickname}
                                                                            onChange={e => setReportForm(prev => ({ ...prev, nickname: e.target.value }))}
                                                                            placeholder="익명 시민"
                                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
                                                                        />
                                                                    </div>

                                                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                                                        <p className="text-xs text-amber-800 leading-relaxed">
                                                                            <span className="font-bold">AI 팩트체크 안내:</span> 제출된 제보는 AI가 출처 신뢰도, 내용 구체성, 법률 관련성을 자동 분석합니다.
                                                                            신뢰도 70점 이상은 즉시 시뮬레이션에 반영되며, 40~69점은 주의 표시와 함께 반영됩니다.
                                                                            40점 미만은 반영되지 않으며 출처 보완을 요청합니다.
                                                                        </p>
                                                                    </div>

                                                                    <button
                                                                        onClick={() => handleReportSubmit(item.defendant)}
                                                                        disabled={reportSubmitting || !reportForm.content.trim()}
                                                                        className={`w-full py-2.5 rounded-lg font-medium text-sm text-white transition-all flex items-center justify-center gap-2 ${
                                                                            reportSubmitting || !reportForm.content.trim()
                                                                                ? 'bg-gray-300 cursor-not-allowed'
                                                                                : 'bg-purple-600 hover:bg-purple-700 shadow-sm hover:shadow-md'
                                                                        }`}
                                                                    >
                                                                        {reportSubmitting ? (
                                                                            <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>AI 팩트체크 분석 중...</>
                                                                        ) : (
                                                                            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>제보 제출 및 AI 팩트체크</>
                                                                        )}
                                                                    </button>
                                                                </div>

                                                                {/* 팩트체크 결과 */}
                                                                {factCheckResult && factCheckResult.defendant === item.defendant && (
                                                                    <div className={`mt-4 rounded-xl p-4 border ${
                                                                        factCheckResult.verdictColor === 'green' ? 'bg-green-50 border-green-300' :
                                                                        factCheckResult.verdictColor === 'amber' ? 'bg-amber-50 border-amber-300' :
                                                                        'bg-red-50 border-red-300'
                                                                    }`}>
                                                                        <div className="flex items-center gap-3 mb-3">
                                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                                                                factCheckResult.verdictColor === 'green' ? 'bg-green-100' :
                                                                                factCheckResult.verdictColor === 'amber' ? 'bg-amber-100' :
                                                                                'bg-red-100'
                                                                            }`}>
                                                                                {factCheckResult.verdictColor === 'green' ? '\u2705' : factCheckResult.verdictColor === 'amber' ? '\u26A0\uFE0F' : '\uD83D\uDEAB'}
                                                                            </div>
                                                                            <div>
                                                                                <p className={`font-bold text-sm ${
                                                                                    factCheckResult.verdictColor === 'green' ? 'text-green-800' :
                                                                                    factCheckResult.verdictColor === 'amber' ? 'text-amber-800' :
                                                                                    'text-red-800'
                                                                                }`}>
                                                                                    AI 팩트체크 결과: {factCheckResult.verdictLabel} (신뢰도 {factCheckResult.score}점)
                                                                                </p>
                                                                                <p className="text-xs text-gray-600">
                                                                                    {factCheckResult.score >= 40
                                                                                        ? '제보가 참심제 시뮬레이션에 반영되었습니다'
                                                                                        : '신뢰도가 낮아 시뮬레이션에 반영되지 않았습니다. 출처를 보완해주세요.'}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="space-y-1.5">
                                                                            {factCheckResult.reasons.map((reason, ri) => (
                                                                                <div key={ri} className="flex items-start gap-2 text-xs">
                                                                                    <span className={`mt-0.5 shrink-0 ${
                                                                                        reason.type === 'positive' ? 'text-green-500' :
                                                                                        reason.type === 'neutral' ? 'text-amber-500' :
                                                                                        'text-red-500'
                                                                                    }`}>
                                                                                        {reason.type === 'positive' ? '\u2713' : reason.type === 'neutral' ? '\u25B3' : '\u2717'}
                                                                                    </span>
                                                                                    <span className="text-gray-700">{reason.text}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        {/* 점수 바 */}
                                                                        <div className="mt-3">
                                                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className={`h-full rounded-full transition-all duration-1000 ${
                                                                                        factCheckResult.verdictColor === 'green' ? 'bg-green-500' :
                                                                                        factCheckResult.verdictColor === 'amber' ? 'bg-amber-500' :
                                                                                        'bg-red-500'
                                                                                    }`}
                                                                                    style={{ width: `${factCheckResult.score}%` }}
                                                                                />
                                                                            </div>
                                                                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                                                <span>0</span>
                                                                                <span className="text-red-400">경고 40</span>
                                                                                <span className="text-amber-400">주의 70</span>
                                                                                <span>100</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* D. 유럽 참심제 선진 사례 */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">유럽 참심제 선진 사례</h2>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {EUROPEAN_PRECEDENTS.map((ep, idx) => (
                                        <div key={idx} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-2xl">{ep.flag}</span>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-800">{ep.country}</h3>
                                                    <p className="text-xs text-gray-500">{ep.system}</p>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                                <p className="text-xs text-gray-400 mb-1">구성</p>
                                                <p className="text-sm font-medium text-gray-700">{ep.composition}</p>
                                            </div>
                                            <ul className="space-y-1.5 mb-3">
                                                {ep.features.map((feat, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                                        <span className="text-indigo-400 mt-0.5 shrink-0">&#8226;</span>
                                                        {feat}
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="bg-indigo-50 rounded-lg p-3">
                                                <p className="text-xs text-indigo-600 font-medium mb-1">본 사건 적용</p>
                                                <p className="text-xs text-gray-700">{ep.relevance}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* E. 구조적 문제와 시민 참여 해법 */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">구조적 문제와 시민 참여 해법</h2>

                                {/* 검찰 이슈 */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                        검찰의 구조적 문제
                                    </h3>
                                    <div className="space-y-4">
                                        {SYSTEMIC_ISSUES.prosecution.map((issue, idx) => (
                                            <div key={idx} className="border border-red-200 rounded-xl p-4 bg-red-50/30">
                                                <h4 className="font-bold text-gray-800 mb-2">{issue.title}</h4>
                                                <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                                                <div className="grid md:grid-cols-2 gap-3">
                                                    <div className="bg-red-100 rounded-lg p-3">
                                                        <p className="text-xs font-medium text-red-700 mb-1">영향</p>
                                                        <p className="text-xs text-gray-700">{issue.impact}</p>
                                                    </div>
                                                    <div className="bg-green-100 rounded-lg p-3">
                                                        <p className="text-xs font-medium text-green-700 mb-1">참심제 해법</p>
                                                        <p className="text-xs text-gray-700">{issue.citizenSolution}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 재판부 이슈 */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                        재판부의 구조적 문제
                                    </h3>
                                    <div className="space-y-4">
                                        {SYSTEMIC_ISSUES.judiciary.map((issue, idx) => (
                                            <div key={idx} className="border border-amber-200 rounded-xl p-4 bg-amber-50/30">
                                                <h4 className="font-bold text-gray-800 mb-2">{issue.title}</h4>
                                                <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                                                <div className="grid md:grid-cols-2 gap-3">
                                                    <div className="bg-amber-100 rounded-lg p-3">
                                                        <p className="text-xs font-medium text-amber-700 mb-1">영향</p>
                                                        <p className="text-xs text-gray-700">{issue.impact}</p>
                                                    </div>
                                                    <div className="bg-green-100 rounded-lg p-3">
                                                        <p className="text-xs font-medium text-green-700 mb-1">참심제 해법</p>
                                                        <p className="text-xs text-gray-700">{issue.citizenSolution}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* F. 결론 */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">왜 참심제가 필요한가</h2>

                                {/* 법조 카르텔과 귀족 사법 */}
                                <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-4">
                                    <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                                        <span className="text-lg">⚖️</span> 법조 카르텔 — 닫힌 사법부의 귀족 행태
                                    </h3>
                                    <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                                        <p>
                                            12.3 내란 사건 재판은 <span className="font-bold text-red-700">법조 카르텔</span>의 실체를 적나라하게 드러냈습니다.
                                            김건희에 대해 <span className="font-bold text-red-700">내란공모 혐의를 기소조차 하지 않고</span> 별건(주가조작)만 기소한 검찰,
                                            대법원 판례를 정면 위배하면서 <span className="font-bold text-red-700">구형의 1/9</span>만 선고한 재판부 —
                                            이는 사법부가 시민이 아닌 권력을 위해 작동하고 있음을 보여줍니다.
                                        </p>
                                        <p>
                                            동일한 내란 사건에서 <span className="font-bold text-red-700">구형 대비 153%(한덕수)</span>부터
                                            <span className="font-bold text-red-700">11%(김건희)</span>까지 극단적 양형 편차가 발생한 것은
                                            법관 개인의 자의적 판단이 아무런 견제 없이 관철되는 <span className="font-bold text-red-700">귀족 사법</span>의 전형입니다.
                                            조희대 대법원장의 이재명 파기환송, 지귀연의 시간계산 석방과 수첩 증거 배척,
                                            우인성의 판례 위배 판결과 서병호 간첩 조작 재심 기각 — 모두 <span className="font-bold text-red-700">시민 감시 없는 밀실 사법</span>에서 비롯된 결과입니다.
                                        </p>
                                    </div>
                                </div>

                                {/* 반성 없는 사법부의 역사 */}
                                <div className="bg-gray-900 text-white rounded-xl p-5 mb-4">
                                    <h3 className="font-bold text-red-400 mb-3 flex items-center gap-2">
                                        <span className="text-lg">🕯️</span> 반성과 성찰 없는 사법부 — 사법살인 70년의 기록
                                    </h3>
                                    <div className="space-y-4 text-sm text-gray-200 leading-relaxed">
                                        <p>
                                            대한민국 사법부는 건국 이래 <span className="font-bold text-red-400">무수한 사법살인</span>을 저질러 왔습니다.
                                            권력의 명령에 따라 무고한 시민을 사형에 처하고, 민주화 운동가를 투옥하며,
                                            간첩으로 조작하여 가족 전체를 파멸시켰습니다.
                                            그러면서도 <span className="font-bold text-red-400">단 한 번의 공식적인 반성이나 성찰도 없었습니다</span>.
                                        </p>

                                        {/* 이승만 정권 */}
                                        <div className="border-l-2 border-red-500 pl-3">
                                            <p className="font-bold text-red-400 text-xs mb-1">이승만 정권 (1948~1960)</p>
                                            <div className="space-y-2">
                                                <div className="bg-gray-800 rounded-lg p-3">
                                                    <p className="font-bold text-red-300 text-xs mb-1">죽산 조봉암 사법살인 (1959)</p>
                                                    <p className="text-xs text-gray-300">
                                                        진보당 대표 조봉암은 이승만의 유일한 정치적 경쟁자였습니다.
                                                        사법부는 <span className="text-red-400 font-bold">간첩 혐의로 조작</span>하여 사형을 선고하고 즉시 집행했습니다.
                                                        52년 후인 2011년 대법원 재심에서 무죄 — 대한민국 최초의 정치적 사법살인으로 기록됩니다.
                                                    </p>
                                                </div>
                                                <div className="bg-gray-800 rounded-lg p-3">
                                                    <p className="font-bold text-red-300 text-xs mb-1">민족일보 조용수 사법살인 (1961)</p>
                                                    <p className="text-xs text-gray-300">
                                                        민족일보 사장 조용수는 통일 논의를 주장했다는 이유로 <span className="text-red-400 font-bold">혁명재판소에서 사형 선고 후 집행</span>.
                                                        2008년 진실화해위원회가 &quot;부당한 공권력 행사에 의한 사망&quot;으로 인정. 언론인에 대한 사법살인이었습니다.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 박정희 정권 */}
                                        <div className="border-l-2 border-orange-500 pl-3">
                                            <p className="font-bold text-orange-400 text-xs mb-1">박정희 정권 (1961~1979)</p>
                                            <div className="space-y-2">
                                                <div className="bg-gray-800 rounded-lg p-3">
                                                    <p className="font-bold text-orange-300 text-xs mb-1">통혁당(통일혁명당) 사건 (1968)</p>
                                                    <p className="text-xs text-gray-300">
                                                        중앙정보부가 조작한 <span className="text-orange-400 font-bold">대규모 간첩단 사건</span>.
                                                        158명이 기소되어 다수가 사형·무기징역을 선고받았습니다. 이후 다수의 관련자가 재심에서 무죄를 받았으며,
                                                        사법부는 정보기관의 고문·조작 증거를 무비판적으로 채택하여 판결했습니다.
                                                    </p>
                                                </div>
                                                <div className="bg-gray-800 rounded-lg p-3">
                                                    <p className="font-bold text-orange-300 text-xs mb-1">인혁당(인민혁명당) 재건위 사건 (1975)</p>
                                                    <p className="text-xs text-gray-300">
                                                        대법원 확정판결 <span className="text-red-400 font-bold">불과 18시간 만에 8명 사형 집행</span> —
                                                        항소 기회조차 주지 않은 &quot;사법적 학살&quot;. 32년 후 재심에서 전원 무죄.
                                                        국제사법위원회(ICJ)는 이를 <span className="text-red-400 font-bold">&quot;사법사상 최악의 학살&quot;</span>이라고 규탄했습니다.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 전두환 정권 */}
                                        <div className="border-l-2 border-yellow-500 pl-3">
                                            <p className="font-bold text-yellow-400 text-xs mb-1">전두환 정권 (1980~1988)</p>
                                            <div className="space-y-2">
                                                <div className="bg-gray-800 rounded-lg p-3">
                                                    <p className="font-bold text-yellow-300 text-xs mb-1">김대중 내란음모 사건 (1980)</p>
                                                    <p className="text-xs text-gray-300">
                                                        5.18 광주 민주화운동 직후, 전두환 신군부는 김대중에게 <span className="text-yellow-400 font-bold">내란음모 혐의를 씌워 사형 선고</span>.
                                                        군사법원은 조작된 증거와 고문 자백을 근거로 판결했습니다.
                                                        국제적 압력으로 감형되었으나, 이후 대통령이 된 김대중의 사례는 사법부가 독재 권력의 도구였음을 증명합니다.
                                                    </p>
                                                </div>
                                                <div className="bg-gray-800 rounded-lg p-3">
                                                    <p className="font-bold text-yellow-300 text-xs mb-1">5.18 민주화운동 관련 사법 탄압</p>
                                                    <p className="text-xs text-gray-300">
                                                        광주 시민을 &quot;폭도&quot;로 규정하고, 민주화 운동 참여자들에게 <span className="text-yellow-400 font-bold">내란죄·소요죄를 적용하여 대규모 투옥</span>.
                                                        고문과 강압 수사로 얻은 자백을 증거로 채택한 사법부는 국가 폭력의 공범이었습니다.
                                                    </p>
                                                </div>
                                                <div className="bg-gray-800 rounded-lg p-3">
                                                    <p className="font-bold text-yellow-300 text-xs mb-1">진도 가족 간첩단 사건 (1981)</p>
                                                    <p className="text-xs text-gray-300">
                                                        전남 진도의 평범한 어민 가족을 <span className="text-yellow-400 font-bold">간첩으로 조작</span>하여 가족 전체를 투옥.
                                                        고문으로 허위 자백을 받아냈고, 사법부는 이를 그대로 인정하여 유죄 판결.
                                                        2015년 재심에서 무죄 — 한 가족의 인생 전체가 파괴된 국가범죄였습니다.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 현대 사법부 */}
                                        <div className="border-l-2 border-blue-500 pl-3">
                                            <p className="font-bold text-blue-400 text-xs mb-1">현대 사법부 — 달라지지 않은 본질</p>
                                            <div className="space-y-2">
                                                <div className="bg-gray-800 rounded-lg p-3">
                                                    <p className="font-bold text-cyan-300 text-xs mb-1">이용훈 대법원장 — 국가폭력 224건 은폐 (2005)</p>
                                                    <p className="text-xs text-gray-300">
                                                        2005년 이용훈 대법원장의 지시로 사법부 내부 조사를 통해
                                                        <span className="text-cyan-400 font-bold"> 국가폭력과 관련된 224건</span>의 과거 사법살인·인권침해 사건을 발굴했습니다.
                                                        그러나 사법부는 이 결과를 <span className="text-red-400 font-bold">공개하지 않고 묻어버렸습니다</span>.
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        조봉암, 인혁당, 통혁당, 진도 간첩단 등 무고한 시민이 사법부의 이름으로 목숨을 잃었는데도,
                                                        사법부 스스로 진상을 규명할 기회를 <span className="text-red-400 font-bold">스스로 폐기</span>한 것입니다.
                                                        224건의 존재 자체가 사법부가 국가폭력에 조직적으로 가담했음을 증명하지만,
                                                        반성과 성찰 대신 <span className="text-cyan-400 font-bold">은폐와 침묵</span>을 택한 것이 대한민국 사법부의 민낯입니다.
                                                    </p>
                                                </div>
                                                <div className="bg-gray-800 rounded-lg p-3">
                                                    <p className="font-bold text-blue-300 text-xs mb-1">양승태 사법농단 (2018)</p>
                                                    <p className="text-xs text-gray-300">
                                                        대법원장이 <span className="text-blue-400 font-bold">재판 거래</span>를 주도한 초유의 사태.
                                                        재판을 정치적 협상 수단으로 이용하면서도, 사법부 내부의 자정 능력은 작동하지 않았습니다.
                                                    </p>
                                                </div>
                                                <div className="bg-gray-800 rounded-lg p-3">
                                                    <p className="font-bold text-purple-300 text-xs mb-1">조희대 대법원장 — 대선 개입 논란 (2024)</p>
                                                    <p className="text-xs text-gray-300">
                                                        이재명 대통령 후보에 대해 <span className="text-purple-400 font-bold">파기환송 결정</span>으로 대선 출마 저지에 개입했다는 논란.
                                                        대법원장이 특정 후보의 선거권을 사법적으로 제한하려 했다는 의혹은
                                                        사법부가 여전히 <span className="text-purple-400 font-bold">정치적 도구</span>로 활용될 수 있음을 보여줍니다.
                                                    </p>
                                                </div>
                                                <div className="bg-gray-800 rounded-lg p-3">
                                                    <p className="font-bold text-green-300 text-xs mb-1">12.3 내란 재판 (현재)</p>
                                                    <p className="text-xs text-gray-300">
                                                        70년간의 사법살인 역사에서 <span className="text-green-400 font-bold">아무것도 배우지 못한</span> 사법부.
                                                        구형 대비 1/9 선고, 대법원 판례 위배, 재판 비공개, 내란공모 미기소 —
                                                        권력 앞에 무릎 꿇는 사법부의 행태가 또다시 반복되고 있습니다.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 참심제 당위성 강조 */}
                                        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mt-2">
                                            <p className="font-bold text-red-300 text-sm mb-2">왜 참심제만이 답인가</p>
                                            <p className="text-xs text-gray-200 leading-relaxed">
                                                조봉암부터 인혁당, 김대중, 진도 간첩단까지 — 사법부가 권력의 도구로 전락할 때마다
                                                <span className="text-red-400 font-bold"> 시민의 생명과 자유가 짓밟혔습니다</span>.
                                                70년이 지났지만 사법부는 스스로 변하지 않았습니다.
                                                이용훈 대법원장의 지시로 찾은 224건의 은폐에도, 양승태 사법농단에도, 조희대 대선 개입 논란에도, 12.3 내란 재판의 편향 양형에도 —
                                                사법부 내부의 자정 능력은 <span className="text-red-400 font-bold">사실상 부재</span>합니다.
                                            </p>
                                            <p className="text-xs text-gray-200 leading-relaxed mt-2">
                                                시민이 직접 재판에 참여하는 <span className="text-yellow-400 font-bold">참심제</span>야말로
                                                이 악순환을 끊을 수 있는 유일한 제도적 장치입니다.
                                                일본, 대만, 독일(150년+), 프랑스, 이탈리아, 스웨덴 등 아시아와 유럽 14개국이 이미 증명한 시스템 —
                                                시민법관이 직업법관과 동등한 투표권으로 재판에 참여할 때,
                                                <span className="text-yellow-400 font-bold">권력에 의한 사법살인은 구조적으로 불가능</span>해집니다.
                                            </p>
                                        </div>

                                        <p className="text-gray-500 text-xs italic mt-2">
                                            &quot;역사를 잊은 민족에게 미래는 없다&quot; — 224건의 사법살인을 스스로 발굴하고도 묻어버린 사법부, 70년간 반복된 권력 종속을 끝내는 것은,
                                            시민의 재판 참여를 제도화하는 참심제 도입에서 시작됩니다.
                                        </p>
                                    </div>
                                </div>

                                {/* 사법 정의와 민주주의 수호 */}
                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-4">
                                    <h3 className="font-bold text-indigo-800 mb-3 flex items-center gap-2">
                                        <span className="text-lg">🛡️</span> 사법 정의 · 사법민주화 · 민주주의 수호
                                    </h3>
                                    <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                                        <p>
                                            <span className="font-bold text-indigo-700">사법 정의</span>란 누구에게나 동일한 기준이 적용되는 것입니다.
                                            그러나 현실은 정반대입니다. 내란 수괴의 배우자에게는 <span className="font-bold text-red-700">구형의 11%</span>를,
                                            일반 시민에게는 법의 엄격함을 적용하는 이중 잣대 — 이것이 직업법관 단독 체제의 민낯입니다.
                                        </p>
                                        <p>
                                            <span className="font-bold text-indigo-700">사법민주화</span>는 사법부에 민주적 정당성을 부여하는 것입니다.
                                            입법부(국회)와 행정부(대통령)는 국민이 직접 선출하지만,
                                            사법부만 <span className="font-bold text-red-700">시민의 참여 없이 법관만의 독점적 판단</span>으로 운영됩니다.
                                            참심제는 시민이 재판에 직접 참여하여 사법부에도 민주적 통제를 가능하게 합니다.
                                        </p>
                                        <p>
                                            <span className="font-bold text-indigo-700">민주주의 수호</span>의 관점에서,
                                            내란 사건은 민주주의 체제 자체를 위협한 범죄입니다.
                                            그 재판이 시민 참여 없이 소수 법관의 밀실 판단으로 이루어진다면,
                                            <span className="font-bold text-red-700">민주주의를 파괴한 자를 비민주적 절차로 심판</span>하는 모순이 됩니다.
                                            참심제야말로 민주주의가 스스로를 지키는 제도적 장치입니다.
                                        </p>
                                    </div>
                                </div>

                                {/* 유럽 선례와 전망 */}
                                <div className="bg-gradient-to-r from-indigo-50 to-green-50 border border-indigo-200 rounded-xl p-5 mb-4">
                                    <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                                        <p>
                                            유럽의 참심제 선진국들은 이미 수백 년 전부터 시민이 재판에 직접 참여하여
                                            직업법관의 법해석 독점을 견제하고, 국민의 상식적 법감정을 양형에 반영해 왔습니다.
                                            독일의 참심원은 법관과 <span className="font-bold text-indigo-700">동등한 투표권</span>을 가지며,
                                            스웨덴에서는 <span className="font-bold text-indigo-700">참심원 다수결로 법관의 양형을 뒤집을 수</span> 있습니다.
                                        </p>
                                        <p className="font-medium text-indigo-800">
                                            헌법 제1조 2항 &quot;모든 권력은 국민으로부터 나온다&quot;는 원칙이 사법부에도 실질적으로 적용되려면,
                                            시민이 재판에 참여하는 참심제 도입이 필수적입니다.
                                            법조 카르텔을 해체하고, 귀족 사법을 청산하며, 사법 정의를 바로 세우는 것 —
                                            이것이 참심제를 통한 <span className="font-bold text-indigo-700">사법민주화</span>의 핵심입니다.
                                        </p>
                                    </div>
                                </div>

                                {/* 핵심 통계 */}
                                <div className="grid md:grid-cols-4 gap-3">
                                    <div className="bg-indigo-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-indigo-700">14개국</p>
                                        <p className="text-xs text-gray-500 mt-1">유럽 참심제 운영 국가</p>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-red-700">14배</p>
                                        <p className="text-xs text-gray-500 mt-1">최대 양형 편차 (153% vs 11%)</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-green-700">150년+</p>
                                        <p className="text-xs text-gray-500 mt-1">독일 참심제 운영 역사</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-amber-700">0%</p>
                                        <p className="text-xs text-gray-500 mt-1">현행 사법부 시민 참여율</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* AI 판결 비교분석 탭 */}
                    {activeTab === 'aiVerdict' && (
                        <div className="space-y-6">
                            {/* 종합 평가 */}
                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-teal-500">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    🤖 AI 판결 비교분석
                                </h2>
                                <p className="text-gray-600 mt-2 text-sm leading-relaxed">{VERDICT_COMPARISON_ANALYSIS.overallAssessment.summary}</p>
                                <div className="mt-4 space-y-2">
                                    {VERDICT_COMPARISON_ANALYSIS.overallAssessment.keyFindings.map((finding, idx) => (
                                        <div key={idx} className="flex items-start gap-2 bg-teal-50 rounded-lg px-3 py-2">
                                            <span className="text-teal-600 mt-0.5 shrink-0 font-bold">{idx + 1}.</span>
                                            <span className="text-sm text-gray-700">{finding}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* AI 면책 배너 */}
                            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-center">
                                <p className="text-sm text-teal-800">
                                    ⚠️ 이 분석은 AI가 사전 생성한 판결 비교분석입니다. 법적 조언이 아니며, 정확한 법률 자문은 전문 변호사에게 문의하세요.
                                </p>
                            </div>

                            {/* 양형 불균형 분석 */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">⚖️ 양형 불균형 분석</h3>
                                <div className="space-y-3">
                                    {VERDICT_COMPARISON_ANALYSIS.sentencingDisparities.map((item, idx) => (
                                        <div key={idx} className="border rounded-xl overflow-hidden">
                                            <button
                                                onClick={() => setExpandedDisparity(expandedDisparity === idx ? null : idx)}
                                                className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                                        item.disparity === 'high' ? 'bg-red-100 text-red-700' :
                                                        item.disparity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>{item.disparity === 'high' ? '높음' : item.disparity === 'medium' ? '중간' : '낮음'}</span>
                                                    <span className="font-medium text-gray-800">{item.pair}</span>
                                                    <span className="text-xs text-gray-500">({item.pairDetail})</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-mono text-gray-600">{item.gap}</span>
                                                    <span className={`transform transition-transform ${expandedDisparity === idx ? 'rotate-180' : ''}`}>▼</span>
                                                </div>
                                            </button>
                                            {expandedDisparity === idx && (
                                                <div className="px-5 pb-4 space-y-3">
                                                    <div className="flex gap-3">
                                                        {item.sentences.map((s, sIdx) => (
                                                            <span key={sIdx} className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                                s === '무죄' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            }`}>{s}</span>
                                                        ))}
                                                    </div>
                                                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{item.analysis}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 사법 건전성 플래그 */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">🚩 사법 건전성 플래그</h3>
                                <div className="space-y-3">
                                    {VERDICT_COMPARISON_ANALYSIS.judicialIntegrityFlags.map((flag, idx) => (
                                        <div key={idx} className={`rounded-xl p-4 border ${
                                            flag.severity === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
                                        }`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span>{flag.severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
                                                <span className={`font-bold text-sm ${
                                                    flag.severity === 'warning' ? 'text-amber-800' : 'text-blue-800'
                                                }`}>{flag.flag}</span>
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed">{flag.detail}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 역대 내란 양형 비교표 */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">📊 역대 내란 사건 양형 비교</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-gray-200">
                                                <th className="text-left py-2 px-3 font-medium text-gray-600">사건</th>
                                                <th className="text-left py-2 px-3 font-medium text-gray-600">연도</th>
                                                <th className="text-left py-2 px-3 font-medium text-gray-600">피고인</th>
                                                <th className="text-left py-2 px-3 font-medium text-gray-600">혐의</th>
                                                <th className="text-left py-2 px-3 font-medium text-gray-600">양형</th>
                                                <th className="text-left py-2 px-3 font-medium text-gray-600">비고</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {VERDICT_COMPARISON_ANALYSIS.historicalBenchmark.map((row, idx) => (
                                                <tr key={idx} className={`border-b ${row.event === '12.3 비상계엄' ? 'bg-red-50 font-medium' : 'hover:bg-gray-50'}`}>
                                                    <td className="py-2 px-3">{row.event}</td>
                                                    <td className="py-2 px-3">{row.year}</td>
                                                    <td className="py-2 px-3 font-medium">{row.defendant}</td>
                                                    <td className="py-2 px-3 text-xs">{row.charge}</td>
                                                    <td className="py-2 px-3">{row.sentence}</td>
                                                    <td className="py-2 px-3 text-xs text-gray-500">{row.note}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* AI 면책 푸터 */}
                            <div className="bg-gray-100 rounded-xl p-4 text-center">
                                <p className="text-xs text-gray-500">
                                    본 AI 분석은 공개된 판결 정보를 기반으로 사전 생성되었으며, 법적 구속력이 없습니다.
                                    정확한 법률 해석은 전문 변호사에게 문의하세요.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 푸터 정보 */}
                    <div className="mt-12 text-center text-sm text-gray-400">
                        <p>본 페이지는 공개된 재판 정보를 바탕으로 작성되었습니다.</p>
                        <p className="mt-1">최종 업데이트: 2026.02.20</p>
                    </div>
                </div>
            </div>
        </>
    );
}

// 통계 카드 컴포넌트
function StatCard({ label, count, color, icon }) {
    const colorMap = {
        red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', iconBg: 'bg-red-100' },
        green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', iconBg: 'bg-green-100' },
        yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', iconBg: 'bg-yellow-100' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', iconBg: 'bg-blue-100' }
    };
    const c = colorMap[color];

    return (
        <div className={`${c.bg} border ${c.border} rounded-xl p-4 text-center`}>
            <div className={`inline-flex items-center justify-center w-10 h-10 ${c.iconBg} rounded-full mb-2`}>
                <span className={`text-lg ${c.text}`}>{icon}</span>
            </div>
            <p className={`text-3xl font-bold ${c.text}`}>{count}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
        </div>
    );
}
