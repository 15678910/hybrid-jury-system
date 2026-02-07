import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import { KakaoIcon, FacebookIcon, XIcon, InstagramIcon, TelegramIcon } from '../components/icons';

// 위키백과 공개 이미지 URL (Wikimedia Commons) + 정부 정책브리핑(korea.kr) 공식 사진
const PERSON_PHOTOS = {
    '곽종근': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Kwak_Jong-geun_in_November_2025.png/200px-Kwak_Jong-geun_in_November_2025.png',
    '김건희': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Kim_Keon-hee_2024.jpg/200px-Kim_Keon-hee_2024.jpg',
    '김봉식': '/김봉식.png',
    '김용현': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Kim_Yong-hyun_%28_%EA%B9%80%EC%9A%A9%ED%98%84_%29_%282024%29_%28cropped%29.jpg/200px-Kim_Yong-hyun_%28_%EA%B9%80%EC%9A%A9%ED%98%84_%29_%282024%29_%28cropped%29.jpg',
    '김주현': '/김주현.png',
    '김태효': '/김태효.png',
    '노상원': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/PD%EC%88%98%EC%B2%A9_%EB%85%B8%EC%83%81%EC%9B%90_%EC%82%AC%EC%A7%84.jpg/200px-PD%EC%88%98%EC%B2%A9_%EB%85%B8%EC%83%81%EC%9B%90_%EC%82%AC%EC%A7%84.jpg',
    '목현태': '/목현태.png',
    '문상호': '/문상호.png',
    '박성재': '/박성재.png',
    '박안수': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/General_Park_An-su_%28_%EB%B0%95%EC%95%88%EC%88%98_%29%2C_Republic_of_Korea_chief_of_staff_of_the_army_during_the_Land_Forces_Pacific_Symposium_and_Exhibition_%28LANPAC%29_in_Honolulu%2C_Hawaii_on_May_15%2C_2024.jpg/200px-General_Park_An-su_%28_%EB%B0%95%EC%95%88%EC%88%98_%29%2C_Republic_of_Korea_chief_of_staff_of_the_army_during_the_Land_Forces_Pacific_Symposium_and_Exhibition_%28LANPAC%29_in_Honolulu%2C_Hawaii_on_May_15%2C_2024.jpg',
    '박종준': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/%EB%B0%95%EC%A2%85%EC%A4%80.jpg/200px-%EB%B0%95%EC%A2%85%EC%A4%80.jpg',
    '심우정': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Prosecutor_General_Shim_Woo-jung_20240926.jpg/200px-Prosecutor_General_Shim_Woo-jung_20240926.jpg',
    '여인형': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Lieutenant_General_Yeo_In-hyung.png/200px-Lieutenant_General_Yeo_In-hyung.png',
    '윤석열': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/South_Korea_President_Yoon_Suk_Yeol_portrait.jpg/200px-South_Korea_President_Yoon_Suk_Yeol_portrait.jpg',
    '윤승영': '/윤승영.png',
    '이상민': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/%EC%9D%B4%EC%83%81%EB%AF%BC_20220128.jpg/200px-%EC%9D%B4%EC%83%81%EB%AF%BC_20220128.jpg',
    '이완규': '/이완규.png',
    '이진우': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Lieutenant_General_Lee_Jin-woo.png/200px-Lieutenant_General_Lee_Jin-woo.png',
    '조지호': '/조지호.png',
    '조태용': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Cho_Taeyong_in_2022_%28cropped%29.jpg/200px-Cho_Taeyong_in_2022_%28cropped%29.jpg',
    '최상목': '/최상목.png',
    '추경호': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/%EC%B6%94%EA%B2%BD%ED%98%B8_%EB%B6%80%EC%B4%9D%EB%A6%AC_%EC%98%88%EB%B0%A9_%EB%B0%9B%EC%95%84_001_%28cropped%29.jpg/200px-%EC%B6%94%EA%B2%BD%ED%98%B8_%EB%B6%80%EC%B4%9D%EB%A6%AC_%EC%98%88%EB%B0%A9_%EB%B0%9B%EC%95%84_001_%28cropped%29.jpg',
    '한덕수': '/한덕수.png'
};

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
            '국방부 해임 징계 처분 (2025.12.29)',
            '재판 군사법원→서울중앙지법 이송 (2026.1)'
        ],
        trialStatus: '1심 재판 진행 중 (서울중앙지법 이송)'
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
            },
            {
                id: 4,
                name: '공직선거법 위반 (윤석열 공범)',
                law: '공직선거법 위반 (허위사실 공표), 정치자금법 위반',
                period: '2021.6 ~ 2022.3',
                amount: '명태균 무상 여론조사 58회, 2억 7,000만원 + 허위사실 공표',
                prosecutionRequest: '특검, 윤석열 불구속 기소 (공직선거법·정치자금법 위반)',
                verdict: '정치자금법 위반: 김건희 무죄 (1심) / 윤석열: 재판 진행 중',
                reason: '유죄 확정 시 당선무효(벌금 100만원 이상) → 국민의힘 선거보조금 약 400억원 반환'
            }
        ],
        summary: {
            prosecutionTotal: '징역 15년, 벌금 20억원, 추징금 9억 4,800만원 + 윤석열 공직선거법·정치자금법 위반 별도 기소',
            verdictTotal: '징역 1년 8개월, 추징금 1,281만 5,000원 (정치자금법·선거법 관련 무죄)',
            ratio: '구형의 약 1/9 수준, 정치자금법 무죄로 윤석열 연루 차단 논란'
        },
        keyFacts: [
            '대한민국 역사상 최초로 영부인 실형 선고',
            '구형 대비 1/9 수준의 낮은 형량 논란',
            '주가조작 수익 8억원 취득에도 무죄 판결',
            '정치자금법 무죄로 윤석열 당선무효 가능성 차단 의혹',
            '보수 언론조차 판결에 당혹감 표시'
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
            },
            {
                crime: '공직선거법 위반·정치자금법 위반 (윤석열 관련)',
                standardRange: '벌금 100만원 이상 시 당선무효',
                aggravating: ['대선 과정 허위사실 공표', '2억 7천만원 상당 불법 여론조사 수수'],
                mitigating: ['김건희 1심 정치자금법 무죄 판결'],
                verdict: '윤석열 재판 진행 중',
                analysis: '김건희 정치자금법 무죄 판결이 윤석열 재판에 미칠 영향 주목. 유죄 시 당선무효·선거보조금 반환'
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
                    verdict: '유죄 - 징역 1년 8개월 (주가조작 무죄, 알선수재 유죄)',
                    source: { name: '머니투데이', url: 'https://www.mt.co.kr/society/2026/01/28/2026012814040115676' }
                },
                {
                    year: '2025',
                    caseName: '서병호 간첩조작사건 재심',
                    role: '재판장',
                    verdict: '재심 기각 (진화위 재심 권고에도 불구)',
                    source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202507181841001' }
                },
                {
                    year: '2024',
                    caseName: '이재명 대표 허위사실공표 사건',
                    role: '재판장',
                    verdict: '유죄 - 징역 1년, 집유 2년, 당선무효형',
                    source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202411151447001' }
                },
                {
                    year: '2024',
                    caseName: '강남역 의대생 여자친구 살해 사건',
                    role: '재판장',
                    verdict: '징역 26년 (항소심 30년으로 증형)',
                    source: { name: '한겨레', url: 'https://www.hani.co.kr/arti/society/society_general/1140576.html' }
                },
                {
                    year: '2020',
                    caseName: '이천 물류창고 화재 사고 (38명 사망)',
                    role: '재판장',
                    verdict: '시공사 관계자 징역 3년 6개월 실형',
                    source: { name: '연합뉴스', url: 'https://www.yna.co.kr/view/AKR20201218100251061' }
                },
                {
                    year: '2023',
                    caseName: '성전환자 성별정정 허가 사건',
                    role: '재판장 (항소심)',
                    verdict: '외부 성기 시술 없이 성별정정 허가',
                    source: { name: '한겨레', url: 'https://www.hani.co.kr/arti/society/society_general/1080893.html' }
                },
                {
                    year: '2014',
                    caseName: '쌍용차 해고자 공무집행방해 사건',
                    role: '재판장',
                    verdict: '무죄 - 공권력 과도 행사 인정',
                    source: { name: '한겨레', url: 'https://www.hani.co.kr/arti/society/labor/626802.html' }
                },
                {
                    year: '2023',
                    caseName: '유시민 한동훈 명예훼손 항소심',
                    role: '재판장 (항소심)',
                    verdict: '원심 유지 - 벌금 500만원',
                    source: { name: '뉴시스', url: 'https://www.newsis.com/view/?id=NISX20231026_0002494844' }
                },
                {
                    year: '2023',
                    caseName: '가세연(강용석·김세의) 이재명 허위사실 유포 사건',
                    role: '재판장',
                    verdict: '소년원 발언 무죄 (항소심에서 유죄로 변경)',
                    source: { name: '서울경제', url: 'https://www.sedaily.com/article/20002586' }
                },
                {
                    year: '2023',
                    caseName: '장영하 변호사 이재명 조폭 연루설 사건',
                    role: '재판장',
                    verdict: '무죄 (항소심에서 유죄로 변경)',
                    source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202501241620001' }
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
            },
            {
                title: '알선수재 vs 뇌물죄 적용 논란',
                description: '특검이 김건희에게 형량이 무거운 뇌물죄 대신 알선수재를 적용한 것에 대한 의구심. 뇌물죄는 공무원 신분범으로 김건희가 민간인이라 직접 적용 불가하고, 윤석열과의 공모를 입증해야 했으나 실패. 알선수재는 뇌물죄보다 형량이 가벼워 사실상 봐주기 기소라는 비판.',
                opinion: {
                    prosecution: '대통령 배우자는 법적 민간인 신분이라 뇌물죄 직접 적용 불가. 윤석열이 금품 수수 사전 인지를 부인하여 공모 입증 실패',
                    defense: '알선수재 혐의 자체도 과도한 적용이며, 사교적 선물에 불과',
                    court: '알선수재 일부만 유죄 인정. 영부인 지위를 이용한 금품 수수는 사회적 해악 인정'
                }
            },
            {
                title: '정치자금법·선거법 미적용과 윤석열 당선무효 연관',
                description: '명태균으로부터 2억 7천만원 상당 무상 여론조사를 수수한 정치자금법 위반에 대해 1심 무죄 판결. 이 혐의가 유죄 확정되면 공범인 윤석열도 정치자금법 위반으로 유죄 가능성이 높아지며, 공직선거법 위반(벌금 100만원 이상)이 확정되면 당선무효 → 국민의힘 선거보조금 약 400억원 반환 의무 발생.',
                opinion: {
                    prosecution: '2억 7천만원 상당 58회 여론조사 무상 제공은 정치자금법상 기부행위. 윤석열과 공모하여 불법 수수',
                    defense: '명태균의 자발적 제공이며, 공식 계약관계 없어 정치자금으로 볼 수 없음',
                    court: '명태균 진술의 신빙성 부족으로 무죄. 그러나 이 판단이 윤석열 재판에 미칠 영향 주목'
                }
            },
            {
                title: '우인성 판사의 대법원 판례 정면 부정 논란',
                description: '재판부가 도이치모터스 주가조작 사건에서 대법원이 확립한 포괄일죄 판례를 정면 부정. 대법원은 1단계·2단계 행위를 단일 범의에 의한 포괄일죄로 인정했으나, 우인성 재판부는 이를 임의로 분리하여 공소시효 만료를 적용. 가세연 허위사실·장영하 이재명 조폭 연루설 사건에서도 1심 무죄 후 항소심에서 유죄로 뒤집힌 전력.',
                opinion: {
                    prosecution: '대법원 확정판결을 무시한 쪼개기 논리로 면죄부 제공. 사실오인 및 법리오해의 위법',
                    defense: '증거 부족에 따른 정당한 법리 판단이며, 무죄추정 원칙 적용',
                    court: '공동정범의 기능적 행위지배 요건 미충족. 권력자든 아니든 법 적용에 차별 없어야'
                }
            },
            {
                title: '특검·재판부 편파성 종합 의혹',
                description: '특검은 뇌물죄 입증 실패로 가벼운 알선수재로 기소하고, 재판부는 구형 15년 대비 1/9인 1년 8개월 선고. 보수 언론(조선일보)조차 판결에 당혹감 표시. 참여연대·정치권은 물론 판사 출신 의원(박은정)도 "유죄 선고 후 피고인에게 인사하는 재판장 처음 봤다"며 비판. 일부 변호사들이 우인성 판사를 직무유기·직권남용으로 고발.',
                opinion: {
                    prosecution: '특검 항소 예고. 왜곡된 법리를 항소심에서 전면 다툴 것. 뇌물죄는 경찰 국수본으로 이첩',
                    defense: '법과 원칙에 따른 판결이며, 정치적 압력에 굴하지 않은 용기 있는 재판',
                    court: '입법적 보완 필요 - 영부인에 대해 공무원에 준하는 형사처벌 규정 검토 필요 (특검보 발언)'
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
                prosecutionRequest: '무기징역 (특검 구형, 2026.1.13)',
                verdict: '재판 진행 중 (2026.2.19 선고 예정)',
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
            prosecutionTotal: '무기징역 (특검 구형)',
            verdictTotal: '재판 진행 중 (2026.2.19 선고 예정)',
            ratio: '-'
        },
        keyFacts: [
            '비상계엄 선포 핵심 관여자, 군 병력 국회 투입 지휘',
            '내란특검 무기징역 구형 (2026.1.13)',
            '윤석열 사건과 병합심리, 2026.2.19 선고 예정'
        ],
        trialStatus: '1심 선고 예정 (2026.2.19, 윤석열 사건 병합심리)'
    },
    '문상호': {
        id: 'moonsangho',
        name: '문상호',
        position: '전 국군정보사령관 (육군 소장)',
        status: '구속',
        statusColor: 'red',
        court: '서울중앙지방법원',
        charges: [
            {
                id: 1,
                name: '내란중요임무종사',
                law: '형법 제87조',
                description: '선관위 병력 투입 지휘, 계엄 사전 모의 참여',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            },
            {
                id: 2,
                name: '직권남용권리행사방해',
                law: '형법 제123조',
                description: '정보사 병력 선관위 파견 및 서버실 침입 지시',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            },
            {
                id: 3,
                name: '군사기밀 누설',
                law: '군사기밀보호법',
                description: '2025.12.31 추가 구속',
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
            '선관위에 정보사 병력 10명 투입 지휘, 서버실 침입',
            '계엄 2일 전 "롯데리아 회동"에서 사전 모의',
            '2024.12.20 구속, 2025.12.31 군사기밀 누설 추가 구속',
            '2026.1.2 국방부 파면 처분',
            '재판 서울중앙지법 이송 예정'
        ],
        trialStatus: '1심 재판 진행 중 (서울중앙지법 이송 예정)'
    },
    '박안수': {
        id: 'parkansu',
        name: '박안수',
        position: '전 육군참모총장 (계엄사령관)',
        status: '불구속',
        statusColor: 'green',
        court: '대전지방법원 논산지원',
        charges: [
            {
                id: 1,
                name: '내란중요임무종사',
                law: '형법 제87조',
                description: '2025.1.3 기소. 계엄사령관으로서 위헌 포고령 발령 및 국회 병력 투입 지휘',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            },
            {
                id: 2,
                name: '직권남용권리행사방해',
                law: '형법 제123조',
                description: '계엄 포고령 제1호 서명·발령',
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
            '12.3 비상계엄 계엄사령관 임명, 포고령 제1호 서명',
            '2024.12.17 구속 → 2025.6.25 보석 허가',
            '전역 후 대전지방법원 논산지원에서 단독 재판 진행'
        ],
        trialStatus: '1심 재판 진행 중 (논산지원)'
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
            '국방부 파면 징계 (2025.12.29)',
            '재판 군사법원→서울중앙지법 이송 (2026.1)'
        ],
        trialStatus: '1심 재판 진행 중 (서울중앙지법 이송)'
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
                prosecutionRequest: '사형 (특검 구형, 2026.1.13)',
                verdict: '재판 진행 중 (2026.2.19 선고 예정)',
                reason: '-'
            },
            {
                id: 2,
                name: '특수공무집행방해 등',
                law: '형법 제144조 등',
                description: '공수처 체포영장 집행 방해, 국무회의 심의권 침해, 허위공문서 작성 등',
                prosecutionRequest: '징역 10년 (특검 구형)',
                verdict: '유죄 - 징역 5년 (2026.1.16 선고)',
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
            prosecutionTotal: '내란수괴: 사형 구형 + 특수공무집행방해 등: 징역 10년 구형',
            verdictTotal: '특수공무집행방해 등: 징역 5년 (1심), 내란수괴: 2026.2.19 선고 예정',
            ratio: '체포방해 구형의 1/2'
        },
        keyFacts: [
            '대한민국 헌정사상 최초 현직 대통령 구속',
            '2024.12.3 비상계엄 선포',
            '2025.1.15 공수처 체포, 2025.4.4 헌재 탄핵 인용 (파면)',
            '체포방해 등 1심 징역 5년 선고 (2026.1.16)',
            '내란수괴 사형 구형 (2026.1.13), 2026.2.19 선고 예정'
        ],
        trialStatus: '체포방해 등: 1심 징역 5년 선고 (항소) / 내란수괴: 2026.2.19 선고 예정'
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
                description: '계엄 시 언론사 단전·단수 지시, 불법 계엄 방조',
                prosecutionRequest: '징역 15년 (특검 구형, 2026.1.12)',
                verdict: '재판 진행 중 (2026.2.12 선고 예정)',
                reason: '-'
            }
        ],
        summary: {
            prosecutionTotal: '징역 15년 (특검 구형)',
            verdictTotal: '재판 진행 중 (2026.2.12 선고 예정)',
            ratio: '-'
        },
        keyFacts: [
            '비상계엄 당시 행정안전부 장관',
            '언론사 단전·단수 지시 혐의',
            '내란특검 징역 15년 구형 (2026.1.12)',
            '2026.2.12 선고 예정'
        ],
        trialStatus: '1심 선고 예정 (2026.2.12)'
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
            '국방부 파면 징계 (2025.12.29)',
            '재판 군사법원→서울중앙지법 이송 (2026.1)'
        ],
        trialStatus: '1심 재판 진행 중 (서울중앙지법 이송)'
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
    },
    '김주현': {
        id: 'kimjuhyun',
        name: '김주현',
        position: '전 대통령실 민정수석',
        status: '불구속',
        statusColor: 'green',
        court: '서울중앙지방법원',
        charges: [
            {
                id: 1,
                name: '직권남용',
                law: '형법 제123조',
                description: '2025.12.11 기소. 헌법재판관 지명 관련',
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
            '검사 출신 윤석열 핵심 법률 참모',
            '12.4 안가회동(삼청동 안전가옥) 참석',
            '직권남용 혐의 불구속 기소'
        ],
        trialStatus: '1심 재판 진행 중'
    },
    '김태효': {
        id: 'kimtaehyo',
        name: '김태효',
        position: '전 국가안보실 제1차장',
        status: '불구속',
        statusColor: 'green',
        court: '수사 진행 중',
        charges: [
            {
                id: 1,
                name: '내란 공모 의혹',
                law: '형법 제87조',
                description: '내란특검 수사 중',
                prosecutionRequest: '수사 중',
                verdict: '수사 중',
                reason: '-'
            }
        ],
        summary: {
            prosecutionTotal: '수사 중',
            verdictTotal: '수사 중',
            ratio: '-'
        },
        keyFacts: [
            '계엄 직후 휴대전화 3회 교체, 증거인멸 의혹',
            '출국금지 조치 상태',
            '2022년 군사기밀 유출 유죄 후 대통령 사면'
        ],
        trialStatus: '수사 진행 중'
    },
    '심우정': {
        id: 'simwoojung',
        name: '심우정',
        position: '전 검찰총장',
        status: '불구속',
        statusColor: 'green',
        court: '서울중앙지방법원',
        charges: [
            {
                id: 1,
                name: '범인도피',
                law: '형법 제151조',
                description: '2025.11.27 채상병 특검에 의해 기소',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            },
            {
                id: 2,
                name: '직권남용권리행사방해',
                law: '형법 제123조',
                description: '윤석열 구속취소 결정 후 즉시항고 포기',
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
            '윤석열 구속취소 결정 후 즉시항고 포기 논란',
            '계엄 당일~4일간 특별활동비 3억 4,200만원 사용',
            '범인도피·직권남용 혐의 불구속 기소'
        ],
        trialStatus: '1심 재판 진행 중'
    },
    '이완규': {
        id: 'leewankyu',
        name: '이완규',
        position: '전 법제처장',
        status: '불구속',
        statusColor: 'green',
        court: '서울중앙지방법원',
        charges: [
            {
                id: 1,
                name: '위증',
                law: '국회증언감정법',
                description: '2025.12.11 기소. 국회 법사위 출석 시 허위 진술',
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
            '윤석열 대통령 사법연수원 동기',
            '12.4 안가회동(삼청동 안전가옥) 참석',
            '위증 혐의 불구속 기소, 내란 방조 수사 중'
        ],
        trialStatus: '1심 재판 진행 중'
    },
    '추경호': {
        id: 'chukyungho',
        name: '추경호',
        position: '국민의힘 의원 (전 원내대표)',
        status: '불구속',
        statusColor: 'green',
        court: '서울중앙지방법원',
        charges: [
            {
                id: 1,
                name: '내란중요임무종사',
                law: '형법 제87조',
                description: '2025.12.8 기소. 국회 계엄해제 표결 방해',
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
            '12.3 계엄의 밤 국회 계엄해제 표결 방해 혐의',
            '구속영장 기각 후 불구속 기소',
            '내란중요임무종사 혐의'
        ],
        trialStatus: '1심 재판 진행 중'
    },
    '김봉식': {
        id: 'kimbongsik',
        name: '김봉식',
        position: '전 서울경찰청장',
        status: '보석',
        statusColor: 'yellow',
        court: '서울중앙지방법원 형사합의25부',
        judge: '지귀연 부장판사',
        charges: [
            {
                id: 1,
                name: '내란중요임무종사',
                law: '형법 제87조',
                description: '비상계엄 당시 서울경찰청장으로 국회 봉쇄 가담',
                prosecutionRequest: '징역 15년',
                verdict: '재판 진행 중',
                reason: '-'
            },
            {
                id: 2,
                name: '직권남용권리행사방해',
                law: '형법 제123조',
                description: '국회 봉쇄 및 주요 인사 체포조 운영',
                prosecutionRequest: '포함 구형',
                verdict: '재판 진행 중',
                reason: '-'
            }
        ],
        summary: {
            prosecutionTotal: '징역 15년 (특검 구형)',
            verdictTotal: '재판 진행 중 (2026.2.19 선고 예정)',
            ratio: '-'
        },
        keyFacts: [
            '12.3 비상계엄 당시 서울경찰청장으로 국회 봉쇄 가담',
            '김용현 당시 국방장관으로부터 안가회동 문건 수령',
            '비화폰 원격삭제 의혹 (2024.12.6)',
            '2025.1.8 구속기소 → 2025.6.26 보석 허가'
        ],
        trialStatus: '1심 선고 예정 (2026.2.19, 윤석열 사건 병합심리)'
    },
    '노상원': {
        id: 'nosangwon',
        name: '노상원',
        position: '전 국군정보사령관 (예비역, 민간인)',
        status: '구속',
        statusColor: 'red',
        court: '서울중앙지방법원 형사합의25부',
        judge: '지귀연 부장판사',
        charges: [
            {
                id: 1,
                name: '내란중요임무종사',
                law: '형법 제87조',
                description: '계엄 사전 모의, 포고령 초안 작성, 선관위 침입 지휘',
                prosecutionRequest: '징역 30년',
                verdict: '재판 진행 중',
                reason: '-'
            },
            {
                id: 2,
                name: '내란목적살인예비',
                law: '형법 제88조',
                description: '수첩에 체포·살해 명단 기록',
                prosecutionRequest: '포함 구형',
                verdict: '재판 진행 중',
                reason: '-'
            },
            {
                id: 3,
                name: '개인정보보호법 위반·알선수재',
                law: '개인정보보호법, 특정범죄가중처벌법',
                description: '제2수사단 구성 위한 군사정보 취득, 진급 청탁 금품 수수',
                prosecutionRequest: '징역 3년 (별건)',
                verdict: '유죄 - 징역 2년, 추징금 2,490만원 (1심)',
                reason: '계엄 선포까지 이를 수 있게 하는 동력 중 하나'
            }
        ],
        summary: {
            prosecutionTotal: '징역 30년 (내란 본건) + 징역 3년 (별건)',
            verdictTotal: '별건: 징역 2년 선고 (2025.12.15), 내란 본건: 재판 진행 중 (2026.2.19 선고 예정)',
            ratio: '-'
        },
        keyFacts: [
            '김용현 전 장관 최측근, 예비역 민간인으로 계엄 핵심 기획',
            '계엄 포고령 초안 작성자로 추정',
            '롯데리아 회동에서 계엄 사전 모의 ("버거보살" 별명)',
            '수첩에 500여명 체포·살해 구상, NLL 북한 공격 유도 등 기록',
            '별건(개인정보보호법 위반) 1심 징역 2년 선고, 쌍방 항소'
        ],
        trialStatus: '1심 선고 예정 (2026.2.19, 윤석열 사건 병합심리)'
    },
    '목현태': {
        id: 'mokhyuntae',
        name: '목현태',
        position: '전 서울경찰청 국회경비대장',
        status: '불구속',
        statusColor: 'green',
        court: '서울중앙지방법원 형사합의25부',
        judge: '지귀연 부장판사',
        charges: [
            {
                id: 1,
                name: '내란중요임무종사',
                law: '형법 제87조',
                description: '국회경비대장으로서 국회의원 출입 차단 지시',
                prosecutionRequest: '징역 12년',
                verdict: '재판 진행 중',
                reason: '-'
            },
            {
                id: 2,
                name: '직권남용권리행사방해',
                law: '형법 제123조',
                description: '국회의원 포함 민간인 국회 출입 차단',
                prosecutionRequest: '포함 구형',
                verdict: '재판 진행 중',
                reason: '-'
            }
        ],
        summary: {
            prosecutionTotal: '징역 12년 (특검 구형)',
            verdictTotal: '재판 진행 중 (2026.2.19 선고 예정)',
            ratio: '-'
        },
        keyFacts: [
            '국회경비대장으로서 국회 출입구 차단 지시',
            '국회의원 출입 차단으로 계엄해제 의결 방해',
            '국회의장 찾을 것을 4번 지시한 사실 확인',
            '"국헌 문란의 목적이 없었다"며 내란 혐의 부인'
        ],
        trialStatus: '1심 선고 예정 (2026.2.19, 윤석열 사건 병합심리)'
    },
    '윤승영': {
        id: 'yoonseungyoung',
        name: '윤승영',
        position: '전 경찰청 국가수사본부 수사기획조정관',
        status: '불구속',
        statusColor: 'green',
        court: '서울중앙지방법원 형사합의25부',
        judge: '지귀연 부장판사',
        charges: [
            {
                id: 1,
                name: '내란중요임무종사',
                law: '형법 제87조',
                description: '방첩사 체포조 지원 요청 수령 및 보고',
                prosecutionRequest: '징역 10년',
                verdict: '재판 진행 중',
                reason: '-'
            },
            {
                id: 2,
                name: '직권남용권리행사방해',
                law: '형법 제123조',
                description: '체포조 운용 관련',
                prosecutionRequest: '포함 구형',
                verdict: '재판 진행 중',
                reason: '-'
            }
        ],
        summary: {
            prosecutionTotal: '징역 10년 (특검 구형)',
            verdictTotal: '재판 진행 중 (2026.2.19 선고 예정)',
            ratio: '-'
        },
        keyFacts: [
            '비상계엄 당일 국군방첩사로부터 체포조 지원 요청 수령',
            '2025.2.28 불구속 기소',
            '"국헌 문란의 목적이 없었다"며 내란 혐의 부인'
        ],
        trialStatus: '1심 선고 예정 (2026.2.19, 윤석열 사건 병합심리)'
    },
    '조지호': {
        id: 'jojiho',
        name: '조지호',
        position: '전 경찰청장',
        status: '보석',
        statusColor: 'yellow',
        court: '서울중앙지방법원 형사합의25부',
        judge: '지귀연 부장판사',
        charges: [
            {
                id: 1,
                name: '내란중요임무종사',
                law: '형법 제87조',
                description: '비상계엄 당시 경찰 동원, 국회 봉쇄 지휘',
                prosecutionRequest: '징역 20년',
                verdict: '재판 진행 중',
                reason: '-'
            },
            {
                id: 2,
                name: '직권남용권리행사방해',
                law: '형법 제123조',
                description: '국회 봉쇄 및 주요 인사 체포조 운영',
                prosecutionRequest: '포함 구형',
                verdict: '재판 진행 중',
                reason: '-'
            }
        ],
        summary: {
            prosecutionTotal: '징역 20년 (특검 구형)',
            verdictTotal: '재판 진행 중 (2026.2.19 선고 예정)',
            ratio: '-'
        },
        keyFacts: [
            '12.3 비상계엄 당시 경찰청장으로서 국회 봉쇄 지휘',
            '이재명 대표 등 주요 인사 체포조 운영 가담 혐의',
            '혈액암 2기, 2025.1.23 보석 석방 (보증금 1억원)',
            '헌재 탄핵 파면 결정 (2025.12.18, 재판관 전원일치)'
        ],
        trialStatus: '1심 선고 예정 (2026.2.19, 윤석열 사건 병합심리)'
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
                        imageUrl: 'https://xn--lg3b0kt4n41f.kr/%EB%82%B4%EB%9E%80%EC%9E%AC%ED%8C%90%EB%B6%84%EC%84%9D.png',
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
            _hasLiveData: !!dynamicData,
            _recentNews: dynamicData.recentNews || []
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
                                                <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden bg-gray-200 shrink-0">
                                                    {PERSON_PHOTOS[name] ? (
                                                        <img
                                                            src={PERSON_PHOTOS[name]}
                                                            alt={name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                        />
                                                    ) : null}
                                                    <span className={`text-lg font-bold text-gray-600 ${PERSON_PHOTOS[name] ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>{name[0]}</span>
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
                                            {caseItem.source && (
                                                <a
                                                    href={caseItem.source.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-500 hover:text-blue-700 hover:underline mt-1 inline-block"
                                                >
                                                    출처: {caseItem.source.name} →
                                                </a>
                                            )}
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

                    {/* 자동 수집 최신 뉴스 */}
                    {person._recentNews && person._recentNews.length > 0 && (
                        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <span className="text-green-500">●</span>
                                    자동 수집 최신 뉴스
                                </h3>
                                {person._lastUpdated && (
                                    <span className="text-xs text-gray-400">
                                        마지막 수집: {new Date(person._lastUpdated?.seconds * 1000).toLocaleDateString('ko-KR')}
                                    </span>
                                )}
                            </div>
                            <div className="space-y-3">
                                {person._recentNews.map((news, idx) => (
                                    <a
                                        key={idx}
                                        href={news.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                                    >
                                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{news.title?.replace(/<[^>]*>/g, '')}</p>
                                        {news.pubDate && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(news.pubDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        )}
                                    </a>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-4 text-center">
                                Bing News RSS + Gemini AI로 자동 수집된 뉴스입니다 (하루 2회 업데이트)
                            </p>
                        </div>
                    )}

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
