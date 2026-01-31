import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import { KakaoIcon, FacebookIcon, XIcon, InstagramIcon, TelegramIcon } from '../components/icons';

// 내란 관련 인물 데이터 (가나다순)
const personsData = {
    '곽종근': {
        id: 'kwak',
        name: '곽종근',
        position: '전 육군특수전사령관',
        status: '구속',
        statusColor: 'red',
        court: '서울중앙지방법원',
        charges: [
            {
                id: 1,
                name: '내란중요임무종사',
                law: '형법 제87조',
                description: '비상계엄 당시 국회로 특수전사령부 병력 출동 지휘',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            }
        ],
        summary: {
            prosecutionTotal: '재판 진행 중',
            verdictTotal: '재판 진행 중',
            ratio: '-'
        },
        keyFacts: [
            '12.3 비상계엄 당시 국회 진입 병력 지휘',
            '"한동훈 잡아오라" 발언으로 논란',
            '국방부 해임 징계 처분'
        ],
        trialStatus: '1심 재판 진행 중'
    },
    '김건희': {
        id: 'kimkunhee',
        name: '김건희',
        position: '대통령 배우자',
        status: '구속',
        statusColor: 'red',
        court: '서울중앙지방법원 형사합의27부',
        judge: '우인성 부장판사',
        verdictDate: '2026년 1월 28일',
        charges: [
            {
                id: 1,
                name: '도이치모터스 주가조작',
                law: '자본시장법 위반',
                period: '2010.10 ~ 2012.12',
                amount: '8억 1,000만원 부당이득',
                prosecutionRequest: '징역 11년 (일부)',
                verdict: '무죄',
                reason: '공동정범 요건 불성립'
            },
            {
                id: 2,
                name: '명태균 여론조사 무상제공',
                law: '정치자금법 위반',
                period: '2021.6 ~ 2022.3',
                amount: '58회, 2억 7,000만원 상당',
                prosecutionRequest: '징역 4년',
                verdict: '무죄',
                reason: '명태균 진술 신빙성 부족'
            },
            {
                id: 3,
                name: '통일교 금품 수수',
                law: '특정범죄가중처벌법 알선수재',
                period: '2022.4 ~ 2022.7',
                amount: '다이아몬드 목걸이, 샤넬백 등 8,000만원',
                prosecutionRequest: '징역 11년 (일부)',
                verdict: '유죄 - 징역 1년 8개월',
                reason: '영부인 지위로 영리 추구'
            }
        ],
        summary: {
            prosecutionTotal: '징역 15년, 벌금 20억원, 추징금 9억 4,800만원',
            verdictTotal: '징역 1년 8개월, 추징금 1,281만 5,000원',
            ratio: '구형의 약 1/9 수준'
        },
        keyFacts: [
            '대한민국 역사상 최초로 영부인 실형 선고',
            '구형 대비 1/9 수준의 낮은 형량 논란',
            '주가조작 수익 8억원 취득에도 무죄 판결'
        ],
        trialStatus: '1심 선고 완료, 항소 예정',
        sentencingGuidelines: [
            {
                crime: '주가조작 (자본시장법 위반)',
                standardRange: '3년~5년',
                aggravating: ['조직적 범행', '불법수익 5억원 이상'],
                mitigating: ['초범', '처벌전력 없음'],
                verdict: '무죄',
                analysis: '재판부는 공동정범 요건이 성립하지 않는다고 판단'
            },
            {
                crime: '정치자금법 위반',
                standardRange: '2년~4년',
                aggravating: ['반복적 범행', '선거 영향력 행사 시도'],
                mitigating: ['대가성 불인정'],
                verdict: '무죄',
                analysis: '명태균 진술의 신빙성 부족으로 무죄'
            },
            {
                crime: '알선수재 (특정범죄가중처벌법)',
                standardRange: '3년~7년',
                aggravating: ['공무원의 배우자 지위 이용', '금품 수수'],
                mitigating: ['초범'],
                verdict: '유죄 - 징역 1년 8개월',
                analysis: '영부인 지위를 이용한 영리 추구로 실형 선고'
            }
        ],
        judgeHistory: {
            judgeName: '우인성',
            position: '서울중앙지방법원 형사합의27부 부장판사',
            recentCases: [
                {
                    year: '2026',
                    caseName: '김건희 주가조작·알선수재 사건',
                    role: '재판장',
                    verdict: '유죄 - 징역 1년 8개월 (주가조작 무죄, 알선수재 유죄)'
                },
                {
                    year: '2024',
                    caseName: '이재명 대표 허위사실공표 사건',
                    role: '재판장',
                    verdict: '유죄 - 징역 1년, 집유 2년, 당선무효형'
                },
                {
                    year: '2024',
                    caseName: '강남역 의대생 여자친구 살해 사건',
                    role: '재판장',
                    verdict: '징역 26년 (항소심 30년으로 증형)'
                },
                {
                    year: '2020',
                    caseName: '이천 물류창고 화재 사고 (38명 사망)',
                    role: '재판장',
                    verdict: '시공사 관계자 징역 3년 6개월 실형'
                },
                {
                    year: '2023',
                    caseName: '성전환자 성별정정 허가 사건',
                    role: '재판장 (항소심)',
                    verdict: '외부 성기 시술 없이 성별정정 허가'
                },
                {
                    year: '2014',
                    caseName: '쌍용차 해고자 공무집행방해 사건',
                    role: '재판장',
                    verdict: '무죄 - 공권력 과도 행사 인정'
                },
                {
                    year: '2023',
                    caseName: '유시민 한동훈 명예훼손 항소심',
                    role: '재판장 (항소심)',
                    verdict: '원심 유지 - 벌금 500만원'
                },
                {
                    year: '2023',
                    caseName: '가세연(강용석·김세의) 이재명 허위사실 유포 사건',
                    role: '재판장',
                    verdict: '소년원 발언 무죄 (항소심에서 유죄로 변경)'
                },
                {
                    year: '2023',
                    caseName: '장영하 변호사 이재명 조폭 연루설 사건',
                    role: '재판장',
                    verdict: '무죄 (항소심에서 유죄로 변경)'
                }
            ],
            profile: '제39회 사법시험 합격, 사법연수원 29기(2000년 수료). 서울대 법대 졸업. 2003년 창원지법 판사로 시작, 대법원 재판연구관(2012-2014), 청주지법·수원지법·서울서부지법 부장판사 역임. 2024년 서울중앙지법 형사합의27부 재판장. 2019년 서울지방변호사회 우수법관 선정. 한국형사판례연구회 부회장.'
        },
        keyIssues: [
            {
                title: '구형 대비 1/9 형량 논란',
                description: '검찰의 징역 15년 구형에 비해 징역 1년 8개월 선고는 구형의 약 1/9 수준으로, 양형 기준에 비해 현저히 낮다는 비판',
                opinion: {
                    prosecution: '특수한 지위를 이용한 중대 범죄, 엄벌 필요',
                    defense: '직접 관여 증거 부족, 과잉처벌 우려',
                    court: '공동정범 불성립, 진술 신빙성 부족'
                }
            },
            {
                title: '주가조작 무죄 판결 쟁점',
                description: '8억원 상당의 수익을 얻었음에도 공동정범 요건 불성립으로 무죄 선고',
                opinion: {
                    prosecution: '실질적 공모관계 존재, 수익 취득 사실 명백',
                    defense: '권오수 단독 범행, 피고인은 투자자에 불과',
                    court: '공동정범의 기능적 행위지배 요건 미충족'
                }
            },
            {
                title: '명태균 진술 신빙성 문제',
                description: '핵심 증인 명태균의 진술 신빙성을 재판부가 인정하지 않음',
                opinion: {
                    prosecution: '구체적이고 일관된 진술, 객관적 증거와 부합',
                    defense: '진술 번복, 이해관계 상충으로 신빙성 없음',
                    court: '진술의 일관성 부족, 보강증거 미비'
                }
            },
            {
                title: '영부인 지위 이용 실형 선고',
                description: '통일교 관계자로부터 고가 물품 수수에 대해 유일하게 유죄 인정',
                opinion: {
                    prosecution: '공무원 배우자 지위 남용, 알선수재 명백',
                    defense: '사교적 선물, 알선 의도 없음',
                    court: '영부인 지위로 영리 추구, 사회적 해악 인정'
                }
            }
        ]
    },
    '김용현': {
        id: 'kimyonghyun',
        name: '김용현',
        position: '전 국방부 장관',
        status: '구속',
        statusColor: 'red',
        court: '서울중앙지방법원',
        charges: [
            {
                id: 1,
                name: '내란중요임무종사',
                law: '형법 제87조',
                description: '비상계엄 선포 및 군 병력 동원 총괄',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            },
            {
                id: 2,
                name: '위계공무집행방해',
                law: '형법 제137조',
                description: '국회 진입 관련',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            },
            {
                id: 3,
                name: '일반이적',
                law: '형법 제93조',
                description: '2025.11.10 기소',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            }
        ],
        summary: {
            prosecutionTotal: '재판 진행 중',
            verdictTotal: '재판 진행 중',
            ratio: '-'
        },
        keyFacts: [
            '비상계엄 선포 핵심 관여자',
            '군 병력 국회 투입 지휘',
            '구속 수감 중'
        ],
        trialStatus: '1심 재판 진행 중'
    },
    '박성재': {
        id: 'parksongjae',
        name: '박성재',
        position: '법무부 장관',
        status: '불구속',
        statusColor: 'green',
        court: '서울중앙지방법원',
        charges: [
            {
                id: 1,
                name: '내란중요임무종사',
                law: '형법 제87조',
                description: '2025.12.11 기소',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            }
        ],
        summary: {
            prosecutionTotal: '재판 진행 중',
            verdictTotal: '재판 진행 중',
            ratio: '-'
        },
        keyFacts: [
            '비상계엄 당시 법무부 장관',
            '내란중요임무종사 혐의 기소'
        ],
        trialStatus: '1심 재판 진행 중'
    },
    '박종준': {
        id: 'parkjongjun',
        name: '박종준',
        position: '대통령경호처장',
        status: '불구속',
        statusColor: 'green',
        court: '서울중앙지방법원',
        charges: [
            {
                id: 1,
                name: '특수공무집행방해',
                law: '형법 제144조',
                description: '2025.12.4 기소',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            },
            {
                id: 2,
                name: '증거인멸',
                law: '형법 제155조',
                description: '2025.12.9 추가 기소',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            }
        ],
        summary: {
            prosecutionTotal: '재판 진행 중',
            verdictTotal: '재판 진행 중',
            ratio: '-'
        },
        keyFacts: [
            '대통령 체포영장 집행 방해 의혹',
            '증거인멸 혐의 추가 기소'
        ],
        trialStatus: '1심 재판 진행 중'
    },
    '여인형': {
        id: 'yeoinheong',
        name: '여인형',
        position: '전 국군방첩사령관',
        status: '구속',
        statusColor: 'red',
        court: '서울중앙지방법원',
        charges: [
            {
                id: 1,
                name: '내란중요임무종사',
                law: '형법 제87조',
                description: '방첩사 병력 국회·선관위 투입 지휘',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            },
            {
                id: 2,
                name: '위증',
                law: '형법 제152조',
                description: '2025.6.23 기소',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            },
            {
                id: 3,
                name: '일반이적',
                law: '형법 제93조',
                description: '2025.11.10 기소',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            }
        ],
        summary: {
            prosecutionTotal: '재판 진행 중',
            verdictTotal: '재판 진행 중',
            ratio: '-'
        },
        keyFacts: [
            '방첩사 계엄 문건 작성 주도 의혹',
            '국회·중앙선관위 병력 투입 지휘',
            '국방부 파면 징계'
        ],
        trialStatus: '1심 재판 진행 중'
    },
    '윤석열': {
        id: 'yoon',
        name: '윤석열',
        position: '대통령 (직무정지)',
        status: '구속',
        statusColor: 'red',
        court: '서울중앙지방법원',
        charges: [
            {
                id: 1,
                name: '내란수괴',
                law: '형법 제87조',
                description: '12.3 비상계엄 선포 및 내란 주도',
                prosecutionRequest: '사형 또는 무기징역 (내란수괴 법정형)',
                verdict: '재판 진행 중',
                reason: '-'
            },
            {
                id: 2,
                name: '특수공무집행방해',
                law: '형법 제144조',
                description: '2025.7.19 기소',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            },
            {
                id: 3,
                name: '일반이적',
                law: '형법 제93조',
                description: '2025.11.10 기소',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            },
            {
                id: 4,
                name: '위증',
                law: '형법 제152조',
                description: '2025.12.4 기소',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            }
        ],
        summary: {
            prosecutionTotal: '내란수괴: 사형/무기징역 (법정형)',
            verdictTotal: '재판 진행 중',
            ratio: '-'
        },
        keyFacts: [
            '대한민국 헌정사상 최초 현직 대통령 구속',
            '2024.12.3 비상계엄 선포',
            '2025.1.15 공수처 체포, 헌재 탄핵심판 진행 중'
        ],
        trialStatus: '1심 재판 진행 중 (병합심리)'
    },
    '이상민': {
        id: 'leesangmin',
        name: '이상민',
        position: '전 행정안전부 장관',
        status: '구속',
        statusColor: 'red',
        court: '서울중앙지방법원',
        charges: [
            {
                id: 1,
                name: '내란중요임무종사',
                law: '형법 제87조',
                description: '2025.8.19 기소',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            }
        ],
        summary: {
            prosecutionTotal: '재판 진행 중',
            verdictTotal: '재판 진행 중',
            ratio: '-'
        },
        keyFacts: [
            '비상계엄 당시 행정안전부 장관',
            '내란중요임무종사 혐의 구속 기소'
        ],
        trialStatus: '1심 재판 진행 중'
    },
    '이진우': {
        id: 'leejinwoo',
        name: '이진우',
        position: '전 수도방위사령관',
        status: '구속',
        statusColor: 'red',
        court: '서울중앙지방법원',
        charges: [
            {
                id: 1,
                name: '내란중요임무종사',
                law: '형법 제87조',
                description: '수도방위사령부 병력 동원 지휘',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            }
        ],
        summary: {
            prosecutionTotal: '재판 진행 중',
            verdictTotal: '재판 진행 중',
            ratio: '-'
        },
        keyFacts: [
            '비상계엄 당시 수방사 병력 국회 투입',
            '국방부 파면 징계'
        ],
        trialStatus: '1심 재판 진행 중'
    },
    '조태용': {
        id: 'jotaeyong',
        name: '조태용',
        position: '전 국정원장',
        status: '구속',
        statusColor: 'red',
        court: '서울중앙지방법원',
        charges: [
            {
                id: 1,
                name: '국가정보원법 위반',
                law: '국가정보원법',
                description: '2025.11.28 기소',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            }
        ],
        summary: {
            prosecutionTotal: '재판 진행 중',
            verdictTotal: '재판 진행 중',
            ratio: '-'
        },
        keyFacts: [
            '비상계엄 사전 인지 여부 논란',
            '국정원법 위반 혐의 구속 기소'
        ],
        trialStatus: '1심 재판 진행 중'
    },
    '최상목': {
        id: 'choisangmok',
        name: '최상목',
        position: '기획재정부 장관 (전 대통령 권한대행)',
        status: '불구속',
        statusColor: 'green',
        court: '서울중앙지방법원',
        charges: [
            {
                id: 1,
                name: '위증',
                law: '형법 제152조',
                description: '2025.12.11 기소',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            }
        ],
        summary: {
            prosecutionTotal: '재판 진행 중',
            verdictTotal: '재판 진행 중',
            ratio: '-'
        },
        keyFacts: [
            '한덕수 탄핵 후 대통령 권한대행 역임',
            '위증 혐의 불구속 기소'
        ],
        trialStatus: '1심 재판 진행 중'
    },
    '한덕수': {
        id: 'handeoksu',
        name: '한덕수',
        position: '전 국무총리',
        status: '구속',
        statusColor: 'red',
        court: '서울중앙지방법원 형사합의33부',
        judge: '이진관 부장판사',
        verdictDate: '2026년 1월 21일',
        charges: [
            {
                id: 1,
                name: '내란우두머리방조',
                law: '형법 제87조, 제32조',
                description: '2025.8.29 기소',
                prosecutionRequest: '징역 15년 (전체 구형)',
                verdict: '무죄',
                reason: '내란죄는 필요적 공동정범으로 방조 성립 불가'
            },
            {
                id: 2,
                name: '내란중요임무종사',
                law: '형법 제87조',
                description: '공소장 변경',
                prosecutionRequest: '징역 15년 (전체 구형)',
                verdict: '유죄 - 징역 23년',
                reason: '국무총리로서 헌법 수호 책임 불이행, 내란 합류'
            },
            {
                id: 3,
                name: '허위공문서 작성',
                law: '형법 제227조',
                description: '비상계엄 관련 문서',
                prosecutionRequest: '포함 구형',
                verdict: '유죄',
                reason: '-'
            },
            {
                id: 4,
                name: '대통령기록물법 위반',
                law: '대통령기록물법',
                description: '기록물 관리 위반',
                prosecutionRequest: '포함 구형',
                verdict: '유죄',
                reason: '-'
            },
            {
                id: 5,
                name: '위증',
                law: '형법 제152조',
                description: '헌재 증인 출석 시 위증',
                prosecutionRequest: '포함 구형',
                verdict: '유죄',
                reason: '-'
            }
        ],
        summary: {
            prosecutionTotal: '징역 15년 (특검 구형)',
            verdictTotal: '징역 23년, 법정구속',
            ratio: '구형의 약 1.5배 (8년 초과)'
        },
        keyFacts: [
            '12.3 내란 관련 첫 판결 - 내란죄 법원 첫 판단',
            '구형(15년)보다 8년 높은 징역 23년 선고',
            '전직 국무총리 법정구속 헌정사상 최초',
            '한덕수 측·특검 모두 항소 (쌍방 항소)'
        ],
        trialStatus: '1심 선고 완료, 쌍방 항소',
        sentencingGuidelines: [
            {
                crime: '내란우두머리방조 (형법 제87조, 제32조)',
                standardRange: '-',
                aggravating: ['국무총리로서 헌법 수호 의무 위반', '계엄 저지 책임 불이행'],
                mitigating: ['내란 주도적 역할은 아님'],
                verdict: '무죄',
                analysis: '재판부는 내란죄가 필요적 공동정범이므로 방조 성립 불가 판단'
            },
            {
                crime: '내란중요임무종사 (형법 제87조)',
                standardRange: '무기 또는 5년 이상 징역',
                aggravating: ['국무총리 직위의 중대성', '헌법 수호 의무 위반', '국헌문란 목적 내란 가담'],
                mitigating: ['직접 병력 동원은 아님'],
                verdict: '유죄 - 징역 23년',
                analysis: '재판부는 12·3 비상계엄을 "위로부터의 내란"으로 규정, 국무총리로서 내란 성공 가능성에 합류한 것으로 판단'
            },
            {
                crime: '위증 (형법 제152조)',
                standardRange: '5년 이하 징역 또는 1천만원 이하 벌금',
                aggravating: ['헌재 증인 출석 시 위증', '사법절차 방해'],
                mitigating: [],
                verdict: '유죄',
                analysis: '헌법재판소 탄핵 심판 과정에서의 위증 인정'
            }
        ],
        judgeHistory: {
            judgeName: '이진관',
            position: '서울중앙지방법원 형사합의33부 부장판사',
            recentCases: [
                {
                    year: '2026',
                    caseName: '한덕수 내란중요임무종사 사건',
                    role: '재판장',
                    verdict: '유죄 - 징역 23년, 법정구속'
                }
            ],
            profile: '서울중앙지방법원 형사합의33부 재판장, 12·3 내란 관련 첫 판결 선고'
        },
        keyIssues: [
            {
                title: '내란죄 법원 첫 판단',
                description: '12·3 비상계엄에 대해 법원이 최초로 "국헌 문란을 목적으로 발령된 내란"으로 규정',
                opinion: {
                    prosecution: '대통령의 위로부터의 내란, 한덕수는 핵심 가담자',
                    defense: '합법적 계엄 조치에 대한 국무총리 역할 수행',
                    court: '"위로부터의 내란"으로 규정, 민주주의·법치주의 근본 훼손'
                }
            },
            {
                title: '구형 초과 양형 (15년 → 23년)',
                description: '특검 구형(징역 15년)보다 8년 높은 징역 23년 선고, 이례적 양형',
                opinion: {
                    prosecution: '징역 15년 구형',
                    defense: '구형보다 높은 형량은 부당, 법리 적용 오류',
                    court: '12·3 내란의 심각성과 중대성을 감안한 양형'
                }
            },
            {
                title: '내란우두머리방조 무죄 판단',
                description: '내란죄는 필요적 공동정범으로 방조 성립 불가라는 법리 판단',
                opinion: {
                    prosecution: '내란우두머리를 방조한 것이 명백',
                    defense: '방조 성립 불가 주장 인정',
                    court: '내란죄의 필요적 공동정범 성격상 방조범 불성립'
                }
            },
            {
                title: '윤석열 재판에 미치는 영향',
                description: '내란수괴 혐의로 재판 중인 윤석열 전 대통령 사건에 중대한 영향 예상',
                opinion: {
                    prosecution: '내란 인정 판결은 윤석열 유죄 근거 강화',
                    defense: '별도 사건이므로 독립적 판단 필요',
                    court: '법원이 처음으로 12·3 비상계엄을 내란으로 인정'
                }
            }
        ]
    }
};

// 가나다순 정렬된 인물 목록
const sortedPersons = Object.keys(personsData).sort((a, b) => a.localeCompare(b, 'ko'));

export default function SentencingAnalysis() {
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [firestoreData, setFirestoreData] = useState({});
    const [judgeNewsData, setJudgeNewsData] = useState({});
    const [judgeYouTubeData, setJudgeYouTubeData] = useState({});
    const [judgeCourtData, setJudgeCourtData] = useState({});
    const [loading, setLoading] = useState(true);
    const [kakaoReady, setKakaoReady] = useState(false);

    // Kakao SDK 초기화
    useEffect(() => {
        const initKakao = () => {
            if (window.Kakao && !window.Kakao.isInitialized()) {
                try {
                    window.Kakao.init('83e843186c1251b9b5a8013fd5f29798');
                    setKakaoReady(true);
                } catch (e) {
                    console.error('Kakao init error:', e);
                }
            } else if (window.Kakao?.isInitialized()) {
                setKakaoReady(true);
            }
        };

        if (window.Kakao) {
            initKakao();
        } else {
            const checkKakao = setInterval(() => {
                if (window.Kakao) {
                    clearInterval(checkKakao);
                    initKakao();
                }
            }, 100);
            setTimeout(() => clearInterval(checkKakao), 5000);
        }
    }, []);

    // Firestore에서 최신 데이터 가져오기
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [sentencingSnap, judgeSnap, youtubeSnap, courtSnap] = await Promise.all([
                    getDocs(collection(db, 'sentencingData')),
                    getDocs(collection(db, 'judgeData')),
                    getDocs(collection(db, 'judgeYouTubeData')),
                    getDocs(collection(db, 'judgeCourtCases'))
                ]);

                const sentencing = {};
                sentencingSnap.forEach(doc => { sentencing[doc.id] = doc.data(); });
                setFirestoreData(sentencing);

                const judges = {};
                judgeSnap.forEach(doc => { judges[doc.id] = doc.data(); });
                setJudgeNewsData(judges);

                const youtube = {};
                youtubeSnap.forEach(doc => { youtube[doc.id] = doc.data(); });
                setJudgeYouTubeData(youtube);

                const court = {};
                courtSnap.forEach(doc => { court[doc.id] = doc.data(); });
                setJudgeCourtData(court);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    // SNS 공유 함수들
    const getShareUrl = (personName) => {
        return `https://xn--lg3b0kt4n41f.kr/sentencing-analysis${personName ? `?person=${encodeURIComponent(personName)}` : ''}`;
    };

    const getShareText = (personName) => {
        const now = new Date();
        const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
        return personName
            ? `[재판분석] ${personName} - ${dateStr} 소식`
            : `[재판분석] 내란 사건 재판 현황 - ${dateStr} 소식`;
    };

    const shareToKakao = () => {
        const url = getShareUrl(selectedPerson);
        const text = getShareText(selectedPerson);

        if (kakaoReady && window.Kakao?.isInitialized()) {
            try {
                window.Kakao.Share.sendDefault({
                    objectType: 'feed',
                    content: {
                        title: selectedPerson ? `[재판분석] ${selectedPerson}` : '재판분석',
                        description: text,
                        imageUrl: 'https://xn--lg3b0kt4n41f.kr/og-sentencing.png',
                        link: { mobileWebUrl: url, webUrl: url },
                    },
                    buttons: [{ title: '자세히 보기', link: { mobileWebUrl: url, webUrl: url } }],
                });
            } catch (e) {
                console.error('Kakao share error:', e);
                fallbackShare();
            }
        } else {
            fallbackShare();
        }
    };

    const fallbackShare = () => {
        const url = getShareUrl(selectedPerson);
        const text = getShareText(selectedPerson);
        navigator.clipboard.writeText(`${text}\n${url}`);
        alert('링크가 복사되었습니다!\n카카오톡에 붙여넣기 해주세요.');
    };

    const shareToFacebook = () => {
        const url = getShareUrl(selectedPerson);
        const text = getShareText(selectedPerson);
        navigator.clipboard.writeText(`${text}\n${url}`);
        alert('링크가 복사되었습니다!\n페이스북에 붙여넣기 해주세요.');
        window.open('https://www.facebook.com/', '_blank');
    };

    const shareToTwitter = () => {
        const url = getShareUrl(selectedPerson);
        const text = getShareText(selectedPerson);
        navigator.clipboard.writeText(`${text}\n\n${url}\n\n#시민법정 #참심제 #사법개혁 #내란`);
        alert('텍스트가 복사되었습니다!\nX에서 붙여넣기 해주세요.');
        window.open('https://x.com/', '_blank');
    };

    const shareToTelegram = () => {
        const url = getShareUrl(selectedPerson);
        const text = getShareText(selectedPerson);
        const urlWithCache = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
        window.open(
            `https://t.me/share/url?url=${encodeURIComponent(urlWithCache)}&text=${encodeURIComponent(text)}`,
            '_blank',
            'width=600,height=400'
        );
    };

    const shareToInstagram = () => {
        const url = getShareUrl(selectedPerson);
        const text = getShareText(selectedPerson);
        navigator.clipboard.writeText(`${text} ${url}`);
        alert('텍스트가 복사되었습니다! 인스타그램 스토리나 게시물에 붙여넣기 해주세요.');
    };

    // 정적 데이터와 Firestore 데이터 병합
    const getMergedPersonData = (name) => {
        const staticData = personsData[name];
        const dynamicData = firestoreData[name];

        if (!dynamicData) {
            return staticData;
        }

        // Firestore 데이터가 있으면 병합 (Firestore 데이터 우선)
        const mergedStatus = dynamicData.status || staticData.status;
        return {
            ...staticData,
            status: mergedStatus,
            statusColor: mergedStatus === '구속' ? 'red' : (mergedStatus === '불구속' ? 'green' : staticData.statusColor),
            verdictDate: dynamicData.verdictDate || staticData.verdictDate,
            trialStatus: dynamicData.trialStatus || staticData.trialStatus,
            charges: dynamicData.charges?.length > 0 ? dynamicData.charges.map((c, idx) => ({
                id: idx + 1,
                name: c.name,
                law: c.law,
                verdict: c.verdict || '재판 진행 중',
                prosecutionRequest: c.sentence || '조사 중',
                reason: '-'
            })) : staticData.charges,
            summary: {
                ...staticData.summary,
                verdictTotal: dynamicData.verdict || staticData.summary?.verdictTotal || '재판 진행 중'
            },
            keyFacts: dynamicData.keyFacts?.length > 0 ? dynamicData.keyFacts : staticData.keyFacts,
            // 김건희만 상세 탭 데이터 유지
            sentencingGuidelines: staticData.sentencingGuidelines,
            judgeHistory: staticData.judgeHistory,
            keyIssues: staticData.keyIssues,
            // 동적 데이터 메타정보
            _lastUpdated: dynamicData.lastUpdated,
            _hasLiveData: !!dynamicData
        };
    };

    const person = selectedPerson ? getMergedPersonData(selectedPerson) : null;

    // 인물 목록 화면
    if (!selectedPerson) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="pt-24 pb-16 px-4">
                    <div className="container mx-auto max-w-4xl">
                        {loading && (
                            <div className="text-center py-4 mb-4">
                                <div className="inline-block w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-sm text-gray-500 mt-2">최신 데이터 확인 중...</p>
                            </div>
                        )}

                        {/* 페이지 헤더 */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                12.3 내란 관련 재판 분석
                            </h1>
                            <p className="text-gray-500 text-sm">
                                2024년 12월 3일 비상계엄 관련 기소 인물 현황
                            </p>
                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm">
                                <span>⚖️</span>
                                <span>총 {sortedPersons.length}명 | 이름을 클릭하면 상세 분석을 볼 수 있습니다</span>
                            </div>
                        </div>

                        {/* 통계 요약 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                                <p className="text-2xl font-bold text-gray-900">{sortedPersons.length}</p>
                                <p className="text-sm text-gray-500">총 인원</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                                <p className="text-2xl font-bold text-red-600">
                                    {sortedPersons.filter(name => personsData[name].status === '구속').length}
                                </p>
                                <p className="text-sm text-gray-500">구속</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                                <p className="text-2xl font-bold text-green-600">
                                    {sortedPersons.filter(name => personsData[name].status === '불구속').length}
                                </p>
                                <p className="text-sm text-gray-500">불구속</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                                <p className="text-2xl font-bold text-blue-600">
                                    {sortedPersons.filter(name => personsData[name].verdictDate).length}
                                </p>
                                <p className="text-sm text-gray-500">선고 완료</p>
                            </div>
                        </div>

                        {/* 인물 목록 */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b">
                                <h2 className="font-bold text-gray-900">기소 인물 명단 (가나다순)</h2>
                            </div>
                            <div className="divide-y">
                                {sortedPersons.map(name => {
                                    const p = personsData[name];
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                setSelectedPerson(name);
                                                setActiveTab(personsData[name].verdictDate ? 'verdict' : 'overview');
                                            }}
                                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                                    <span className="text-lg font-bold text-gray-600">{name[0]}</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{name}</p>
                                                    <p className="text-sm text-gray-500">{p.position}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    p.status === '구속'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {p.status}
                                                </span>
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* SNS 공유 */}
                        <div className="mt-8 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6">
                            <p className="text-white text-center mb-4 font-medium">이 페이지를 공유해주세요</p>
                            <div className="flex justify-center gap-4">
                                <button onClick={shareToKakao} className="w-12 h-12 flex items-center justify-center bg-[#FEE500] rounded-full hover:scale-110 transition-transform" title="카카오톡">
                                    <KakaoIcon className="w-6 h-6 text-[#391B1B]" />
                                </button>
                                <button onClick={shareToFacebook} className="w-12 h-12 flex items-center justify-center bg-[#1877F2] rounded-full hover:scale-110 transition-transform" title="페이스북">
                                    <FacebookIcon className="w-6 h-6 text-white" />
                                </button>
                                <button onClick={shareToTwitter} className="w-12 h-12 flex items-center justify-center bg-black rounded-full hover:scale-110 transition-transform" title="X">
                                    <XIcon className="w-5 h-5 text-white" />
                                </button>
                                <button onClick={shareToInstagram} className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#515BD4] rounded-full hover:scale-110 transition-transform" title="인스타그램">
                                    <InstagramIcon className="w-6 h-6 text-white" />
                                </button>
                                <button onClick={shareToTelegram} className="w-12 h-12 flex items-center justify-center bg-[#0088cc] rounded-full hover:scale-110 transition-transform" title="텔레그램">
                                    <TelegramIcon className="w-6 h-6 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* 출처 안내 */}
                        <div className="mt-8 p-4 bg-gray-100 rounded-xl text-center">
                            <p className="text-gray-600 text-sm">
                                이 정보는 공개된 뉴스 보도를 바탕으로 작성되었습니다.<br />
                                재판 진행 상황에 따라 내용이 변경될 수 있습니다.
                            </p>
                        </div>
                    </div>
                </main>

                <footer className="bg-gray-900 text-gray-400 py-6 px-4">
                    <div className="container mx-auto text-center">
                        <p>&copy; 주권자사법개혁추진준비위원회</p>
                    </div>
                </footer>
            </div>
        );
    }

    // 개별 인물 상세 화면
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-5xl">
                    {/* 뒤로가기 버튼 */}
                    <button
                        onClick={() => setSelectedPerson(null)}
                        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>목록으로 돌아가기</span>
                    </button>

                    {/* 페이지 헤더 */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 mb-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                person.status === '구속'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-green-100 text-green-700'
                            }`}>
                                {person.status}
                            </span>
                            <span className="text-sm text-gray-500">
                                {person.trialStatus}
                                {person._hasLiveData && (
                                    <span className="ml-2 text-xs text-green-600">• 실시간 데이터</span>
                                )}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                            {person.name} 재판 분석
                        </h1>
                        <p className="text-gray-500 text-sm">
                            {person.position} | {person.court}
                            {person.judge && ` | 재판장 ${person.judge}`}
                        </p>
                        {person.verdictDate && (
                            <p className="text-sm text-gray-500 mt-1">
                                선고일: {person.verdictDate}
                            </p>
                        )}
                        {person.summary.ratio !== '-' && (
                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm">
                                <span>⚖️</span>
                                <span>{person.summary.ratio}</span>
                            </div>
                        )}
                    </div>

                    {/* 탭 네비게이션 */}
                    <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
                        {(person.verdictDate ? [
                            { id: 'verdict', label: '판결 요약' },
                            { id: 'charges', label: '혐의별 분석' },
                            { id: 'sentencing', label: '양형기준 비교' },
                            { id: 'judge', label: '판사 판결 이력' },
                            { id: 'issues', label: '핵심 쟁점' }
                        ] : [
                            { id: 'overview', label: '개요' },
                            { id: 'charges', label: '혐의 분석' }
                        ]).map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* 판결 요약 / 개요 탭 */}
                    {(activeTab === 'verdict' || activeTab === 'overview') && (
                        <div className="space-y-6">
                            {/* 구형 vs 선고 비교 (선고 완료 시) */}
                            {person.verdictDate && (
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
                                        <h3 className="text-sm text-gray-500 mb-2">검찰 구형</h3>
                                        <p className="text-lg font-bold text-gray-900">{person.summary.prosecutionTotal}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-red-500">
                                        <h3 className="text-sm text-gray-500 mb-2">법원 선고</h3>
                                        <p className="text-lg font-bold text-red-600">{person.summary.verdictTotal}</p>
                                    </div>
                                </div>
                            )}

                            {/* 재판 진행 중인 경우 */}
                            {!person.verdictDate && (
                                <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-yellow-500">
                                    <h3 className="text-sm text-gray-500 mb-2">재판 현황</h3>
                                    <p className="text-lg font-bold text-yellow-700">재판 진행 중</p>
                                    <p className="text-sm text-gray-600 mt-1">아직 판결이 선고되지 않았습니다.</p>
                                </div>
                            )}

                            {/* 핵심 사실 */}
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b">
                                    <h3 className="font-bold text-gray-900">핵심 사실</h3>
                                </div>
                                <div className="p-4">
                                    <ul className="space-y-2">
                                        {person.keyFacts.map((fact, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-blue-500 mt-1">•</span>
                                                <span className="text-gray-700">{fact}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* 기소 혐의 요약 */}
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b">
                                    <h3 className="font-bold text-gray-900">기소 혐의 ({person.charges.length}건)</h3>
                                </div>
                                <div className="divide-y">
                                    {person.charges.map(charge => (
                                        <div key={charge.id} className="p-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">{charge.name}</p>
                                                <p className="text-sm text-gray-500">{charge.law}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                charge.verdict === '무죄'
                                                    ? 'bg-green-100 text-green-700'
                                                    : charge.verdict.includes('유죄')
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {charge.verdict === '재판 진행 중' ? '심리 중' :
                                                 charge.verdict.includes('유죄') ? '유죄' : charge.verdict}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 혐의 분석 탭 */}
                    {activeTab === 'charges' && (
                        <div className="space-y-4">
                            {person.charges.map(charge => (
                                <div key={charge.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <div className={`p-4 ${
                                        charge.verdict === '무죄'
                                            ? 'bg-green-50'
                                            : charge.verdict.includes('유죄')
                                            ? 'bg-red-50'
                                            : 'bg-yellow-50'
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-gray-900">{charge.name}</h3>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                charge.verdict === '무죄'
                                                    ? 'bg-green-200 text-green-800'
                                                    : charge.verdict.includes('유죄')
                                                    ? 'bg-red-200 text-red-800'
                                                    : 'bg-yellow-200 text-yellow-800'
                                            }`}>
                                                {charge.verdict}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">적용 법률</p>
                                                <p className="font-medium">{charge.law}</p>
                                            </div>
                                            {charge.period && (
                                                <div>
                                                    <p className="text-gray-500">범행 기간</p>
                                                    <p className="font-medium">{charge.period}</p>
                                                </div>
                                            )}
                                            {charge.amount && (
                                                <div>
                                                    <p className="text-gray-500">금액/규모</p>
                                                    <p className="font-medium">{charge.amount}</p>
                                                </div>
                                            )}
                                            {charge.description && (
                                                <div className="col-span-2">
                                                    <p className="text-gray-500">내용</p>
                                                    <p className="font-medium">{charge.description}</p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-gray-500">검찰 구형</p>
                                                <p className="font-medium">{charge.prosecutionRequest}</p>
                                            </div>
                                        </div>
                                        {charge.reason !== '-' && (
                                            <div className="pt-3 border-t">
                                                <p className="text-gray-500 text-sm mb-1">재판부 판단 이유</p>
                                                <p className="text-gray-900">{charge.reason}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 양형기준 비교 탭 */}
                    {activeTab === 'sentencing' && person.sentencingGuidelines && (
                        <div className="space-y-4">
                            {person.sentencingGuidelines.map((guideline, idx) => (
                                <div key={idx} className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <div className="p-4 bg-purple-50 border-b">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-gray-900">{guideline.crime}</h3>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                guideline.verdict === '무죄'
                                                    ? 'bg-green-200 text-green-800'
                                                    : 'bg-red-200 text-red-800'
                                            }`}>
                                                {guideline.verdict}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="bg-blue-50 rounded-lg p-3">
                                                <p className="text-sm text-blue-600 font-medium mb-1">양형기준 권고형</p>
                                                <p className="font-bold text-blue-900">{guideline.standardRange}</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-sm text-gray-600 font-medium mb-1">실제 선고</p>
                                                <p className="font-bold text-gray-900">{guideline.verdict}</p>
                                            </div>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-red-600 font-medium mb-2">가중 요소</p>
                                                <ul className="space-y-1">
                                                    {guideline.aggravating.map((item, i) => (
                                                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                                            <span className="text-red-500">▲</span> {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="text-sm text-green-600 font-medium mb-2">감경 요소</p>
                                                <ul className="space-y-1">
                                                    {guideline.mitigating.map((item, i) => (
                                                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                                            <span className="text-green-500">▼</span> {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t">
                                            <p className="text-sm text-gray-500 mb-1">재판부 분석</p>
                                            <p className="text-gray-800">{guideline.analysis}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 판사 판결 이력 탭 */}
                    {activeTab === 'judge' && person.judgeHistory && (
                        <div className="space-y-6">
                            {/* 판사 프로필 */}
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="p-4 bg-indigo-50 border-b">
                                    <h3 className="font-bold text-gray-900">재판장 정보</h3>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                                            <span className="text-2xl font-bold text-indigo-600">{person.judgeHistory.judgeName[0]}</span>
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold text-gray-900">{person.judgeHistory.judgeName} 부장판사</p>
                                            <p className="text-gray-500">{person.judgeHistory.position}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{person.judgeHistory.profile}</p>
                                </div>
                            </div>

                            {/* 최근 판결 이력 */}
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b">
                                    <h3 className="font-bold text-gray-900">주요 판결 이력</h3>
                                </div>
                                <div className="divide-y">
                                    {person.judgeHistory.recentCases.map((caseItem, idx) => (
                                        <div key={idx} className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-indigo-600">{caseItem.year}</span>
                                                <span className="text-xs text-gray-500">{caseItem.role}</span>
                                            </div>
                                            <p className="font-medium text-gray-900 mb-1">{caseItem.caseName}</p>
                                            <p className="text-sm text-gray-600">판결: {caseItem.verdict}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* AI 뉴스 분석 (크롤링 데이터) */}
                            {judgeNewsData[person.judgeHistory?.judgeName] && (
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <div className="p-4 bg-blue-50 border-b">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-gray-900">AI 뉴스 분석</h3>
                                            <span className="text-xs text-blue-500">자동 수집</span>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {judgeNewsData[person.judgeHistory.judgeName].tendencyAnalysis && (
                                            <div className="bg-indigo-50 rounded-lg p-3">
                                                <p className="text-sm text-indigo-600 font-medium mb-1">판결 성향 분석</p>
                                                <p className="text-sm text-gray-800">{judgeNewsData[person.judgeHistory.judgeName].tendencyAnalysis}</p>
                                            </div>
                                        )}
                                        {judgeNewsData[person.judgeHistory.judgeName].cases?.length > 0 && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 mb-2">뉴스에서 발견된 판결 사례</p>
                                                <div className="space-y-2">
                                                    {judgeNewsData[person.judgeHistory.judgeName].cases.map((c, idx) => (
                                                        <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs text-indigo-600 font-medium">{c.year}</span>
                                                                <span className="font-medium text-sm text-gray-900">{c.caseName}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-600">{c.verdict}</p>
                                                            {c.controversy && (
                                                                <p className="text-xs text-orange-600 mt-1">논란: {c.controversy}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {judgeNewsData[person.judgeHistory.judgeName].publicOpinion?.length > 0 && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 mb-2">여론 및 비판</p>
                                                <ul className="space-y-1">
                                                    {judgeNewsData[person.judgeHistory.judgeName].publicOpinion.map((opinion, idx) => (
                                                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                                            <span className="text-blue-500 mt-0.5">•</span>
                                                            <span>{opinion}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* YouTube 언급 (크롤링 데이터) */}
                            {judgeYouTubeData[person.judgeHistory?.judgeName] && (
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <div className="p-4 bg-red-50 border-b">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-gray-900">YouTube 여론 분석</h3>
                                            <span className="text-xs text-red-500">자동 수집</span>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {judgeYouTubeData[person.judgeHistory.judgeName].overallSentiment && (
                                            <div className="bg-red-50 rounded-lg p-3">
                                                <p className="text-sm text-red-600 font-medium mb-1">전체 여론 평가</p>
                                                <p className="text-sm text-gray-800">{judgeYouTubeData[person.judgeHistory.judgeName].overallSentiment}</p>
                                            </div>
                                        )}
                                        {judgeYouTubeData[person.judgeHistory.judgeName].mentions?.length > 0 && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 mb-2">영상 언급</p>
                                                <div className="space-y-3">
                                                    {judgeYouTubeData[person.judgeHistory.judgeName].mentions.map((mention, idx) => (
                                                        <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`w-2 h-2 rounded-full ${
                                                                    mention.sentiment === '부정' ? 'bg-red-500' :
                                                                    mention.sentiment === '긍정' ? 'bg-green-500' : 'bg-gray-400'
                                                                }`}></span>
                                                                <p className="font-medium text-sm text-gray-900">{mention.videoTitle}</p>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mb-1">{mention.context}</p>
                                                            {mention.keyQuotes?.length > 0 && (
                                                                <div className="mt-2 space-y-1">
                                                                    {mention.keyQuotes.map((quote, qIdx) => (
                                                                        <p key={qIdx} className="text-xs text-gray-500 italic pl-3 border-l-2 border-gray-300">
                                                                            "{quote}"
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {judgeYouTubeData[person.judgeHistory.judgeName].controversies?.length > 0 && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 mb-2">주요 논란</p>
                                                <ul className="space-y-1">
                                                    {judgeYouTubeData[person.judgeHistory.judgeName].controversies.map((c, idx) => (
                                                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                                            <span className="text-red-500 mt-0.5">▪</span>
                                                            <span>{c}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 법원 판례 (크롤링 데이터) */}
                            {judgeCourtData[person.judgeHistory?.judgeName]?.cases?.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <div className="p-4 bg-green-50 border-b">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-gray-900">국가법령정보 판례</h3>
                                            <span className="text-xs text-green-600">공식 데이터</span>
                                        </div>
                                    </div>
                                    <div className="divide-y">
                                        {judgeCourtData[person.judgeHistory.judgeName].cases.slice(0, 10).map((courtCase, idx) => (
                                            <div key={idx} className="p-4">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-green-700">{courtCase.verdictDate}</span>
                                                    <span className="text-xs text-gray-500">{courtCase.courtName}</span>
                                                </div>
                                                <p className="font-medium text-gray-900 text-sm mb-1">{courtCase.caseName || courtCase.caseNumber}</p>
                                                {courtCase.verdictType && (
                                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{courtCase.verdictType}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 핵심 쟁점 탭 */}
                    {activeTab === 'issues' && person.keyIssues && (
                        <div className="space-y-4">
                            {person.keyIssues.map((issue, idx) => (
                                <div key={idx} className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <div className="p-4 bg-orange-50 border-b">
                                        <h3 className="font-bold text-gray-900">{issue.title}</h3>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <p className="text-gray-700">{issue.description}</p>
                                        <div className="grid md:grid-cols-3 gap-3">
                                            <div className="bg-blue-50 rounded-lg p-3">
                                                <p className="text-xs text-blue-600 font-medium mb-1">검찰 측 주장</p>
                                                <p className="text-sm text-gray-800">{issue.opinion.prosecution}</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-xs text-gray-600 font-medium mb-1">변호인 측 주장</p>
                                                <p className="text-sm text-gray-800">{issue.opinion.defense}</p>
                                            </div>
                                            <div className="bg-purple-50 rounded-lg p-3">
                                                <p className="text-xs text-purple-600 font-medium mb-1">재판부 판단</p>
                                                <p className="text-sm text-gray-800">{issue.opinion.court}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* SNS 공유 */}
                    <div className="mt-8 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6">
                        <p className="text-white text-center mb-4 font-medium">이 페이지를 공유해주세요</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={shareToKakao} className="w-12 h-12 flex items-center justify-center bg-[#FEE500] rounded-full hover:scale-110 transition-transform" title="카카오톡">
                                <KakaoIcon className="w-6 h-6 text-[#391B1B]" />
                            </button>
                            <button onClick={shareToFacebook} className="w-12 h-12 flex items-center justify-center bg-[#1877F2] rounded-full hover:scale-110 transition-transform" title="페이스북">
                                <FacebookIcon className="w-6 h-6 text-white" />
                            </button>
                            <button onClick={shareToTwitter} className="w-12 h-12 flex items-center justify-center bg-black rounded-full hover:scale-110 transition-transform" title="X">
                                <XIcon className="w-5 h-5 text-white" />
                            </button>
                            <button onClick={shareToInstagram} className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#515BD4] rounded-full hover:scale-110 transition-transform" title="인스타그램">
                                <InstagramIcon className="w-6 h-6 text-white" />
                            </button>
                            <button onClick={shareToTelegram} className="w-12 h-12 flex items-center justify-center bg-[#0088cc] rounded-full hover:scale-110 transition-transform" title="텔레그램">
                                <TelegramIcon className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* 하단 안내 */}
                    <div className="mt-8 p-4 bg-gray-100 rounded-xl text-center">
                        <p className="text-gray-600 text-sm">
                            이 분석은 공개된 뉴스와 법률 정보를 바탕으로 작성되었습니다.<br />
                            정확한 법률 자문은 전문 변호사에게 문의하세요.
                        </p>
                        <div className="mt-4 flex justify-center gap-4">
                            <a
                                href="https://sc.scourt.go.kr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 text-sm hover:underline"
                            >
                                대법원 양형위원회 →
                            </a>
                            <a
                                href="https://glaw.scourt.go.kr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 text-sm hover:underline"
                            >
                                종합법률정보 →
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-gray-900 text-gray-400 py-6 px-4">
                <div className="container mx-auto text-center">
                    <p>&copy; 주권자사법개혁추진준비위원회</p>
                </div>
            </footer>
        </div>
    );
}
