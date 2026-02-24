import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import { KakaoIcon, FacebookIcon, XIcon, InstagramIcon, TelegramIcon, ThreadsIcon, LinkedInIcon } from '../components/icons';
import { JUDGES_DATA } from '../data/judges';

// 위키백과 공개 이미지 URL (Wikimedia Commons) + 정부 정책브리핑(korea.kr) 공식 사진
const PERSON_PHOTOS = {
    '곽종근': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Kwak_Jong-geun_in_November_2025.png/200px-Kwak_Jong-geun_in_November_2025.png',
    '김건희': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Kim_Keon-hee_2024.jpg/200px-Kim_Keon-hee_2024.jpg',
    '김봉식': '/김봉식.png',
    '김용군': '/김용군.png',
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
        status: '보석',
        statusColor: 'orange',
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
            '김용현→박안수→곽종근 명령 체계: 계엄사령관 지시로 특전사 병력 국회 투입',
            '롯데리아 회동 참석: 노상원·문상호 등과 계엄 사전 모의',
            '특수전사령부(특전사) 병력 국회 출동 지휘 — 국회 진입 첫 번째 병력',
            '"한동훈 잡아오라" 발언: 체포명단 실행 의도 드러남',
            '2025.1.3 구속기소 → 2025.4.4 건강 악화로 보석 허가',
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
                verdict: '유죄 - 징역 30년 (2026.2.19 선고)',
                reason: '비상계엄을 주도적으로 준비, 부정선거 수사 등 독단적 계획 수립하여 대통령의 비이성적 결심을 조장'
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
            verdictTotal: '징역 30년 (2026.2.19 선고)',
            ratio: '무기징역→30년 (감경)'
        },
        keyFacts: [
            '비상계엄 선포 핵심 관여자, 군 병력 국회 투입 지휘',
            '내란특검 무기징역 구형 (2026.1.13)',
            '2026.2.19 1심 선고: 징역 30년 (내란중요임무종사 유죄)',
            '노상원과 22회 이상 국방부장관 공관 회동, 계엄 사전 모의',
            '롯데리아 회동 3회: 노상원·곽종근·문상호 등과 계엄 구체 계획 논의',
            '체포명단 14명 작성 지시 (우원식, 이재명, 한동훈 + 야당의원·시민단체 등)',
            '군 동원 명령 체계: 김용현→박안수→곽종근(특전사)/이진우(수방사)',
            '윤석열에게 직접 보고, 12.1 최종 결의 (대통령-김용현 양자 회동)',
            '12.3 삼청동 안가에서 경찰 수뇌부(조지호·김봉식) 소집, 최종 작전 지시',
            '선관위 침투 계획: 김용현→노상원→문상호 라인으로 정보사 병력 투입 지시'
        ],
        verdictDate: '2026년 2월 19일',
        trialStatus: '1심 선고: 징역 30년 (2026.2.19)',
        sentencingGuidelines: [
            {
                crime: '내란중요임무종사 (형법 제87조)',
                standardRange: '5년~무기징역',
                aggravating: ['비상계엄을 주도적으로 준비', '부정선거 수사 등 독단적 계획 수립', '대통령의 비이성적 결심 조장', '노상원과 22회 이상 공관 회동으로 계엄 사전 모의', '체포명단 14명 작성 지시 (국회의장·야당 대표 포함)', '군·경찰 양면 동원 총괄 (육군·특전사·수방사·방첩사·경찰)'],
                mitigating: ['내란수괴가 아닌 종사자 지위'],
                verdict: '징역 30년',
                analysis: '비상계엄을 주도적으로 준비하고 부정선거 수사 등 독단적 계획 수립. 대통령의 비이성적 결심을 조장한 측면이 크다고 판단'
            }
        ],
        judgeHistory: {
            judgeName: '지귀연',
            position: '서울중앙지방법원 형사합의25부 부장판사',
            recentCases: [
                {
                    caseName: '윤석열 외 7인 내란 사건',
                    year: '2026',
                    verdict: '김용현 징역 30년 (내란중요임무종사 유죄)',
                    detail: '8인 공동재판, 무기징역→30년 감경'
                }
            ],
            profile: '사법연수원 25기. 서울중앙지법 형사합의25부 부장판사. 내란 사건 1심 전담 재판장.'
        },
        keyIssues: [
            {
                title: '대통령 결심 조장의 책임',
                description: '부정선거 수사 등 독단적 계획을 수립하여 대통령의 비이성적 결심을 조장한 책임이 크다고 법원 판단',
                opinion: {
                    prosecution: '내란의 핵심 기획자로서 무기징역이 상당',
                    defense: '대통령의 지시에 따른 것이며 주도적 기획자가 아님',
                    court: '비상계엄을 주도적으로 준비, 대통령의 비이성적 결심을 조장'
                }
            },
            {
                title: '안가회동과 사전음모 체계',
                description: '노상원과 22회 이상 국방부장관 공관 회동, 롯데리아 회동 3회를 통해 계엄을 체계적으로 사전 모의. 체포명단 14명 작성 지시, 포고령 초안 작성 지시 등 핵심 기획자 역할',
                opinion: {
                    prosecution: '장기간 체계적 사전 모의의 총괄자, 내란의 실질적 기획자',
                    defense: '대통령의 국정운영 보좌 차원의 논의였으며 구체적 내란 모의가 아님',
                    court: '비상계엄을 주도적으로 준비하고 대통령의 비이성적 결심을 조장한 핵심 인물로 판단'
                }
            },
            {
                title: '군·경찰 양면 동원 총괄',
                description: '군 명령 체계(박안수→곽종근·이진우)와 경찰 수뇌부(조지호·김봉식)를 동시에 장악하여 내란 실행을 총괄. 12.3 삼청동 안가에서 경찰 수뇌부 최종 작전 지시',
                opinion: {
                    prosecution: '군과 경찰을 동시 동원한 유일한 인물로 사실상 내란의 총괄 실행자',
                    defense: '국방부 장관으로서 계엄 관련 정상 업무 수행',
                    court: '징역 30년 (무기징역에서 감경) — 내란수괴 다음으로 가장 중한 형량'
                }
            }
        ]
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
            '선관위에 정보사 병력 10명 투입 지휘, 서버실 침입·선거 데이터 탈취 시도',
            '김용현→노상원→문상호 라인: 선관위 침투 핵심 실행자',
            '롯데리아 회동 참석: 노상원·곽종근 등과 계엄 사전 모의',
            '국군정보사 사령관으로서 부정선거 의혹 수사 명분으로 선관위 침입 계획 수립',
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
            '12.3 비상계엄 계엄사령관 임명, 포고령 제1호 서명 — 형식적 계엄사령관 역할',
            '김용현→박안수→곽종근(특전사)/이진우(수방사) 군 동원 명령 체계의 중간 지휘자',
            '계엄사령관으로서 위헌적 포고령 제1호 발령 (정당·국회활동 금지 등)',
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
            '비상계엄 당시 법무부 장관, 내란중요임무종사 혐의 기소 (2025.12.11)',
            '12.4 안가회동(삼청동 안전가옥) 참석 — 계엄 사후 수습 논의',
            '구치소 수용 확보: 체포 대상자 수용을 위한 구치소 수용 확보 지시 의혹',
            '법무부 장관으로서 계엄 관련 법적 절차 지원 역할',
            '불구속 기소 후 1심 재판 진행 중'
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
            '김용현→여인형 라인: 국방부 장관 직속으로 방첩사 병력 동원 총괄',
            '방첩사(국군기무사 후신) 계엄 문건 작성 주도 — 계엄 실행의 정보·작전 핵심',
            '국회·중앙선관위에 방첩사 병력 투입 지휘, 체포조 편성',
            '주요 인사 체포명단(14명) 실행을 위한 체포조 운영 지휘',
            '국방부 파면 징계 (2025.12.29)',
            '일반이적 혐의 추가 기소 (2025.11.10)',
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
                verdict: '유죄 - 무기징역 (2026.2.19 선고)',
                reason: '범행을 주도적으로 계획하고 다수를 관여시킴. 막대한 사회적 비용 초래에도 사과나 반성 기미 부족. 재판 출석 거부'
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
            verdictTotal: '내란수괴: 무기징역 (2026.2.19) + 체포방해 등: 징역 5년 (2026.1.16)',
            ratio: '사형→무기징역 (감경)'
        },
        keyFacts: [
            '대한민국 헌정사상 최초 현직 대통령 구속',
            '2024.12.3 비상계엄 선포',
            '2025.1.15 공수처 체포, 2025.4.4 헌재 탄핵 인용 (파면)',
            '체포방해 등 1심 징역 5년 선고 (2026.1.16)',
            '내란수괴 사형 구형 (2026.1.13)',
            '2026.2.19 1심 선고: 무기징역 — "성경을 읽는다는 이유로 촛불을 훔칠 수는 없다"'
        ],
        verdictDate: '2026년 2월 19일',
        trialStatus: '1심 선고: 내란수괴 무기징역 (2026.2.19) + 체포방해 징역 5년 (2026.1.16)',
        sentencingGuidelines: [
            {
                crime: '내란수괴 (형법 제87조)',
                standardRange: '사형, 무기징역, 무기금고',
                aggravating: ['범행을 주도적으로 계획·지시', '국회 기능 마비 시도', '대통령으로서 헌법 수호 의무 중대 위반', '재판 출석 거부 및 반성 부재', '막대한 사회적 비용 초래'],
                mitigating: ['계엄이 수시간 만에 해제', '실질적 인명 피해 없음'],
                verdict: '무기징역',
                analysis: '법정형 중 사형을 구형했으나, 계엄이 수시간 만에 해제되고 실질적 인명 피해가 없었다는 점을 감경 사유로 인정'
            },
            {
                crime: '특수공무집행방해 (형법 제144조)',
                standardRange: '5년 이상의 유기징역',
                aggravating: ['공수처 체포영장 집행 조직적 방해', '경호처 동원하여 법 집행 차단'],
                mitigating: ['최종적으로 체포에 응함'],
                verdict: '유죄 - 징역 5년 (2026.1.16)',
                analysis: '공수처 체포영장 집행 방해, 국무회의 심의권 침해'
            }
        ],
        judgeHistory: {
            judgeName: '지귀연',
            position: '서울중앙지방법원 형사합의25부 부장판사',
            recentCases: [
                {
                    caseName: '윤석열 외 7인 내란 사건',
                    year: '2026',
                    verdict: '윤석열 무기징역, 김용현 30년, 노상원 18년, 조지호 12년, 김봉식 10년, 목현태 3년, 김용군·윤승영 무죄',
                    detail: '8인 공동재판. "성경을 읽는다는 이유로 촛불을 훔칠 수는 없다"'
                }
            ],
            profile: '사법연수원 25기. 서울중앙지법 형사합의25부 부장판사. 내란 사건 1심 전담 재판장.'
        },
        keyIssues: [
            {
                title: '대통령의 내란죄 주체 여부',
                description: '현직 대통령이 내란죄의 주체가 될 수 있는지가 헌정사상 최초의 쟁점. 재판부는 영국 찰스 1세 사건을 언급하며 "왕이라도 의회를 공격하면 반역죄 성립"이라고 판시',
                opinion: {
                    prosecution: '대통령도 헌법의 구속을 받으며, 국헌문란 목적의 비상계엄은 내란에 해당',
                    defense: '비상계엄 선포는 대통령의 고유 권한이며, 정치적 판단 영역으로 사법심사 대상 아님',
                    court: '비상계엄 선포 자체는 내란죄에 해당할 수 없으나, 헌법기관의 기능을 상당 기간 저지·마비시키려는 목적이면 국헌문란 목적 내란죄 성립 가능'
                }
            },
            {
                title: '사형 → 무기징역 감경 이유',
                description: '특검 사형 구형에 대해 재판부가 무기징역으로 감경한 양형 판단',
                opinion: {
                    prosecution: '민주주의 근간을 흔든 중대 범죄, 산정 불가능한 사회적 피해, 반성 부재로 사형 상당',
                    defense: '실탄 미사용, 인명 피해 없음, 수시간 내 해제, 초범, 65세 고령',
                    court: '아주 치밀한 계획이 아니었고, 물리력 행사를 자제시키려 했으며, 실탄 소지·직접 폭력 행사 예 거의 없고, 범죄 전력 없음, 장기간 공무원 봉직, 65세 고령 고려하여 무기징역'
                }
            },
            {
                title: '"폭동" 성립의 법리적 판단',
                description: '재판부는 "이 사건의 핵심은 군을 국회로 보낸 것"이라 강조. 무장 군의 국회 침입, 헬기 동원, 담장 넘기, 의원 출입 차단, 체포조 출동 등 "대부분이 모두 폭동에 해당"',
                opinion: {
                    prosecution: '무장한 군의 국회 강제 침입은 명백한 폭동 행위',
                    defense: '실탄 미사용, 발포 없음, 실질적 폭력 부재로 폭동 미해당',
                    court: '단순 물리적 폭력만이 폭동이 아니며, 무력의 과시와 위압적 실력 행사 자체가 폭동. 내란죄는 위험범으로 실제 피해 여부와 무관하게 성립'
                }
            },
            {
                title: '계엄 모의 시점 쟁점',
                description: '특검은 2023년부터 계엄 모의 시작 주장, 재판부는 2024.12.1(계엄 2일 전) 결심으로 판단. 노상원 수첩 증거능력 배척',
                opinion: {
                    prosecution: '노상원 수첩(70페이지 수기 메모), 사전 회동 기록 등 2023년부터 장기 모의 증거 다수',
                    defense: '부정선거 수사 준비일 뿐 계엄 모의 아님, 수첩은 개인적 메모에 불과',
                    court: '수첩의 외관·형식·내용이 조잡하고 보관 방법 고려 시 중요사항 담았다고 보기 어려움. 계엄은 이틀 전 결심으로 판단'
                }
            },
            {
                title: '내란 공범의 범위 — 국헌문란 목적 인식 기준',
                description: '재판부는 내란죄 공범 성립 요건으로 "국헌문란 목적의 미필적 인식·공유" 필요. 이 기준에 따라 김용군·윤승영 무죄, 목현태는 미필적 고의로 유죄',
                opinion: {
                    prosecution: '계엄 상황에서 군·경찰 동원에 가담한 이상 국헌문란 목적 인식 인정되어야',
                    defense: '비상계엄 매뉴얼에 따른 정상 업무로 인식했으며 국헌문란 목적 공유하지 않음',
                    court: '단순 참여만으로 부족, 국헌문란 목적에 대한 명확한 인식·공유 필요. 사후에 상황 인지하고도 계속 참여하면 미필적 고의 인정 가능'
                }
            }
        ]
    },
    '이상민': {
        id: 'leesangmin',
        name: '이상민',
        position: '전 행정안전부 장관',
        status: '구속',
        statusColor: 'red',
        court: '서울중앙지방법원 형사합의32부',
        judge: '류경진 부장판사',
        verdictDate: '2026년 2월 12일',
        charges: [
            {
                id: 1,
                name: '내란중요임무종사',
                law: '형법 제87조',
                period: '2024.12.3',
                amount: '언론사 단전·단수 지시 전달',
                prosecutionRequest: '징역 15년 (특검 구형)',
                verdict: '유죄 - 징역 7년',
                reason: '국가의 존립을 위태롭게 한 내란 행위에 대해서는 그 목적의 달성 여부와 무관하게 엄중한 처벌이 필요'
            },
            {
                id: 2,
                name: '위증',
                law: '형법 제152조',
                period: '2025.2 (헌재 탄핵심판)',
                amount: '단전·단수 지시 관련 허위 증언',
                prosecutionRequest: '-',
                verdict: '유죄 (징역 7년에 포함)',
                reason: '헌재 탄핵심판에서 지시한 적 없다고 허위 증언한 사실 인정'
            },
            {
                id: 3,
                name: '직권남용권리행사방해',
                law: '형법 제123조',
                period: '2024.12.3',
                amount: '소방청장에게 단전·단수 지시 전달',
                prosecutionRequest: '-',
                verdict: '무죄',
                reason: '행정안전부 장관에게는 소방청을 지휘할 수 있는 일반적 직무권한이 있고, 일선 소방서에서 언론사 단전·단수 대응 태세를 갖췄다고 보기는 어렵다'
            }
        ],
        summary: {
            prosecutionTotal: '징역 15년 (내란특검 구형)',
            verdictTotal: '징역 7년 (직권남용 무죄)',
            ratio: '구형의 47%'
        },
        keyFacts: [
            '12.3 내란 가담 장관급 첫 1심 선고',
            '내란중요임무종사·위증 유죄, 직권남용 무죄',
            '구형 15년 대비 47% 수준 형량',
            '재판부 "윤석열 등의 내란을 만류했다고 볼 자료 없다"',
            '헌재 탄핵심판 위증 사실 인정'
        ],
        trialStatus: '1심 선고 완료, 항소 예정',
        sentencingGuidelines: [
            {
                crime: '내란중요임무종사 (형법 제87조)',
                standardRange: '5년~무기징역',
                aggravating: ['국가 존립 위태롭게 함', '장관급 고위직 가담'],
                mitigating: ['직접 실행행위 아닌 지시 전달'],
                verdict: '유죄 - 징역 7년',
                analysis: '재판부는 내란 행위 가담에 엄중한 처벌이 필요하다고 판단'
            },
            {
                crime: '위증 (형법 제152조)',
                standardRange: '5년 이하 징역',
                aggravating: ['헌재 탄핵심판에서 허위 증언', '사법절차 방해'],
                mitigating: ['-'],
                verdict: '유죄 (병합)',
                analysis: '단전·단수 지시를 한 적 없다는 허위 증언 인정'
            },
            {
                crime: '직권남용권리행사방해 (형법 제123조)',
                standardRange: '5년 이하 징역',
                aggravating: ['공무원 지위 남용'],
                mitigating: ['장관의 소방청 지휘권한 인정'],
                verdict: '무죄',
                analysis: '장관에게 소방청 지휘 권한이 있어 직권남용에 해당하지 않음'
            }
        ],
        judgeHistory: {
            judgeName: '류경진',
            position: '서울중앙지방법원 형사합의32부 부장판사',
            recentCases: [
                {
                    year: '2026',
                    caseName: '이상민 내란중요임무종사 사건',
                    role: '재판장',
                    verdict: '유죄 - 징역 7년'
                },
                {
                    year: '2023',
                    caseName: '인천 편의점 강도살인 사건',
                    role: '재판장 (인천지법)',
                    verdict: '무기징역 + 전자발찌 20년'
                },
                {
                    year: '2022',
                    caseName: '잠진도 아내 살인 사건',
                    role: '재판장 (인천지법)',
                    verdict: '징역 23년'
                },
                {
                    year: '2021',
                    caseName: '38년간 딸 간병 후 살해 사건',
                    role: '재판장 (인천지법)',
                    verdict: '집행유예 - "국가 지원 부재" 언급'
                },
                {
                    year: '2023',
                    caseName: '부장판사 뇌물수수 사건',
                    role: '재판장',
                    verdict: '무죄 (증거 부족)'
                }
            ],
            profile: '사법연수원 31기, 법무법인 태평양 변호사 출신. 인천지법 부장판사 거쳐 서울중앙지법 형사합의32부 재판장. 중형 선고와 함께 사회구조적 문제를 판결문에 언급하는 성향.'
        },
        keyIssues: [
            {
                title: '내란중요임무종사 인정 여부',
                description: '소방청장에게 언론사 단전·단수 지시를 전달한 행위가 내란 가담에 해당하는지',
                opinion: {
                    prosecution: '윤석열 대통령의 내란 실행을 위한 핵심 지시 전달자',
                    defense: '단순 업무 지시 전달이며 내란 의도 없었음',
                    court: '내란을 만류했다고 볼 자료가 없고, 내란 가담 행위로 인정'
                }
            },
            {
                title: '헌재 탄핵심판 위증',
                description: '단전·단수 지시를 한 적 없다는 헌재 탄핵심판 증언의 허위 여부',
                opinion: {
                    prosecution: '명백한 허위 증언으로 사법절차 방해',
                    defense: '기억에 의존한 진술이며 고의적 위증 아님',
                    court: '지시 사실이 객관적으로 입증되어 위증 인정'
                }
            },
            {
                title: '직권남용 무죄 판단',
                description: '행정안전부 장관의 소방청 지휘권한 존재 여부',
                opinion: {
                    prosecution: '불법적 명령으로 공무원 직권남용',
                    defense: '장관으로서 정당한 지휘권한 행사',
                    court: '장관에게 소방청 지휘 일반 권한 있어 직권남용 불인정'
                }
            },
            {
                title: '구형 대비 낮은 형량 (47%)',
                description: '특검 구형 15년 대비 7년 선고의 적정성',
                opinion: {
                    prosecution: '장관급 고위직 가담에 엄벌 필요',
                    defense: '직접 실행행위 없이 지시 전달에 불과',
                    court: '직접 실행행위가 아닌 점 등 감경 요소 고려'
                }
            },
            {
                title: '윤석열·한덕수 재판에 미치는 영향',
                description: '장관급 첫 선고로서 후속 재판에 미치는 선례적 영향',
                opinion: {
                    prosecution: '내란 가담 인정은 후속 재판 유죄 근거 강화',
                    defense: '개별 사건별 독립적 판단 필요',
                    court: '12·3 비상계엄의 내란 성격을 재확인하는 판결'
                }
            },
            {
                title: '한덕수 vs 이상민 판결 비교',
                description: '동일 혐의(내란중요임무종사), 동일 구형(15년)에 대한 상이한 판결',
                comparison: {
                    items: [
                        { category: '직위', handeoksu: '국무총리 (내각 수반)', leesangmin: '행정안전부 장관' },
                        { category: '주요 혐의', handeoksu: '내란중요임무종사, 위증', leesangmin: '내란중요임무종사, 위증, 직권남용' },
                        { category: '가담 행위', handeoksu: '국무회의 불소집, 내란 만류 안함', leesangmin: '언론사 단전·단수 지시 전달' },
                        { category: '특검 구형', handeoksu: '징역 15년', leesangmin: '징역 15년' },
                        { category: '1심 선고', handeoksu: '징역 23년 (구형의 153%)', leesangmin: '징역 7년 (구형의 47%)' },
                        { category: '직권남용', handeoksu: '-', leesangmin: '무죄 (지휘권한 인정)' },
                        { category: '재판부 판단', handeoksu: '"위로부터의 내란"에 합류', leesangmin: '직접 실행 아닌 지시 전달' },
                        { category: '법정구속', handeoksu: 'O (즉시 구속)', leesangmin: 'O (기존 구속 유지)' }
                    ]
                }
            }
        ]
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
            '수도방위사령관으로서 수방사 병력 약 3,300명 동원 — 국회 투입 핵심 병력',
            '김용현→박안수→이진우 명령 체계: 계엄사령관 지시로 수방사 병력 국회 투입',
            '수방사 병력이 국회 진입·봉쇄의 주력 부대로 활동',
            '윤석열 대통령이 직접 전화하여 병력 투입 독촉한 것으로 알려짐',
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
                name: '직권남용권리행사방해',
                law: '형법 제123조',
                description: '2025.12.11 기소. 헌법재판관 졸속 지명 관련',
                prosecutionRequest: '조사 중',
                verdict: '재판 진행 중',
                reason: '-'
            },
            {
                id: 2,
                name: '내란 방조 (수사 중)',
                law: '형법 제87조, 제32조',
                description: '내란특검 수사 진행 중. 안가회동 참석, 계엄선포문 사후작성 관여',
                prosecutionRequest: '수사 중',
                verdict: '수사 중',
                reason: '-'
            }
        ],
        summary: {
            prosecutionTotal: '직권남용 재판 진행 중 + 내란 방조 수사 중',
            verdictTotal: '재판 진행 중',
            ratio: '-'
        },
        keyFacts: [
            '검사 출신 윤석열 핵심 법률 참모, 대통령실 민정수석',
            '12.4 안가회동(삼청동 안전가옥) 참석 — 계엄 사후 수습 논의',
            '비상계엄 선포문 사후 작성 관여: 계엄 선포 후 법적 형식을 갖추기 위해 선포문 작성',
            '헌법재판관 졸속 지명: 계엄 직전 헌법재판관 3인을 졸속으로 지명, 탄핵심판 영향력 확보 시도',
            '직권남용권리행사방해 혐의 불구속 기소 (2025.12.11)',
            '내란특검, 안가회동 참석·계엄선포문 관여를 근거로 내란 방조 수사 중'
        ],
        trialStatus: '1심 재판 진행 중 (직권남용) + 내란 방조 수사 중',
        sentencingGuidelines: [
            {
                crime: '직권남용권리행사방해 (형법 제123조)',
                standardRange: '5년 이하 징역',
                aggravating: ['대통령 측근으로서 헌법재판관 지명 과정 관여', '계엄 직전 시점에 졸속 지명으로 사법부 독립 훼손 시도'],
                mitigating: ['대통령 지시에 따른 업무 수행', '직접적 내란 실행 행위 아님'],
                verdict: '재판 진행 중',
                analysis: '민정수석으로서 헌법재판관 졸속 지명에 관여한 직권남용 혐의'
            }
        ],
        keyIssues: [
            {
                title: '안가회동 참석과 내란 방조',
                description: '12.4 삼청동 안전가옥 회동에 참석하여 계엄 사후 수습을 논의. 이완규 법제처장과 함께 법률적 뒷받침 역할 수행',
                opinion: {
                    prosecution: '안가회동 참석은 내란 사후 수습에 가담한 증거',
                    defense: '대통령 참모로서 위기 상황 대응을 위한 정상적 업무 회의',
                    court: '수사 진행 중'
                }
            },
            {
                title: '계엄선포문 사후 작성',
                description: '비상계엄 선포 후 법적 형식을 갖추기 위해 계엄선포문을 사후적으로 작성한 관여 의혹. 계엄의 졸속성과 불법성을 보여주는 증거',
                opinion: {
                    prosecution: '계엄선포문 사후 작성은 계엄 자체가 법적 절차 없이 감행되었음을 증명',
                    defense: '행정 절차상 문서 정비에 불과',
                    court: '수사 진행 중'
                }
            },
            {
                title: '헌법재판관 졸속 지명',
                description: '계엄 직전 헌법재판관 3인을 졸속으로 지명하여 탄핵심판에 영향력을 확보하려는 시도. 사법부 독립 훼손 의혹',
                opinion: {
                    prosecution: '내란의 법적 기반을 마련하기 위한 사전 포석',
                    defense: '공석인 헌법재판관 충원은 정상적 업무',
                    court: '직권남용으로 기소, 재판 진행 중'
                }
            }
        ]
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
            },
            {
                id: 2,
                name: '내란 방조 (수사 중)',
                law: '형법 제87조, 제32조',
                description: '내란특검 수사 진행 중. 안가회동 참석, 계엄 법적 자문 관여',
                prosecutionRequest: '수사 중',
                verdict: '수사 중',
                reason: '-'
            }
        ],
        summary: {
            prosecutionTotal: '위증 재판 진행 중 + 내란 방조 수사 중',
            verdictTotal: '재판 진행 중',
            ratio: '-'
        },
        keyFacts: [
            '윤석열 대통령 사법연수원 동기 (25기), 핵심 법률 측근',
            '법제처장으로서 비상계엄의 법적 정당성 자문 역할 의혹',
            '12.4 안가회동(삼청동 안전가옥) 참석 — 김주현 민정수석과 함께 법률적 수습 논의',
            '국회 법사위 출석 시 안가회동 참석 사실 등에 대해 허위 진술 (위증)',
            '위증 혐의 불구속 기소 (2025.12.11)',
            '내란특검, 안가회동 참석·법적 자문을 근거로 내란 방조 수사 중'
        ],
        trialStatus: '1심 재판 진행 중 (위증) + 내란 방조 수사 중',
        sentencingGuidelines: [
            {
                crime: '위증 (국회증언감정법)',
                standardRange: '1년 이상 10년 이하 징역',
                aggravating: ['국회 법사위라는 공식 절차에서의 위증', '내란 관련 핵심 사실에 대한 허위 진술', '사법절차 방해'],
                mitigating: ['직접적 내란 실행 행위 아님'],
                verdict: '재판 진행 중',
                analysis: '법제처장으로서 국회에서 안가회동 참석 사실 등에 대해 허위 진술한 혐의'
            }
        ],
        keyIssues: [
            {
                title: '안가회동 참석과 법률적 뒷받침',
                description: '12.4 삼청동 안전가옥 회동에 참석. 법제처장으로서 비상계엄의 법적 정당성을 뒷받침하는 역할을 수행했는지가 핵심 쟁점',
                opinion: {
                    prosecution: '법제처장이 안가회동에 참석한 것은 내란의 법적 기반을 마련한 행위',
                    defense: '위기 상황에서 법제처장으로서 법률 자문을 제공한 정상 업무',
                    court: '수사 진행 중'
                }
            },
            {
                title: '국회 법사위 위증',
                description: '국회 법제사법위원회에 출석하여 안가회동 참석 등 핵심 사실에 대해 허위 진술',
                opinion: {
                    prosecution: '내란 관련 핵심 사실을 은폐하기 위한 고의적 위증',
                    defense: '기억에 의존한 진술이며 고의적 허위가 아님',
                    court: '재판 진행 중'
                }
            },
            {
                title: '윤석열 사법연수원 동기로서의 역할',
                description: '윤석열과 사법연수원 25기 동기로서 법제처장에 임명. 계엄의 법적 정당성 검토 및 자문 역할을 수행했을 가능성',
                opinion: {
                    prosecution: '대통령 측근으로서 내란의 법적 기반을 마련하는 데 기여',
                    defense: '법제처장으로서 독립적 법률 검토 업무 수행',
                    court: '수사 진행 중'
                }
            }
        ]
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
    '김용군': {
        id: 'kimyonggun',
        name: '김용군',
        position: '전 제3야전군사령부 헌병대장',
        status: '불구속',
        statusColor: 'green',
        court: '서울중앙지방법원 형사합의25부',
        judge: '지귀연 부장판사',
        charges: [
            {
                id: 1,
                name: '내란중요임무종사',
                law: '형법 제87조',
                description: '비상계엄 당시 헌병대 병력 동원 관련',
                prosecutionRequest: '징역 10년',
                verdict: '무죄 (2026.2.19 선고)',
                reason: '범행 계획에 공모 또는 국헌문란의 목적을 명확히 인식/공유했다는 증거 부족'
            }
        ],
        summary: {
            prosecutionTotal: '징역 10년 (특검 구형)',
            verdictTotal: '무죄 (2026.2.19 선고)',
            ratio: '무죄'
        },
        keyFacts: [
            '전 제3야전군사령부 헌병대장',
            '비상계엄 당시 헌병대 병력 동원 관련 혐의',
            '2026.2.19 1심 선고: 무죄 (내란죄 불성립)'
        ],
        verdictDate: '2026년 2월 19일',
        trialStatus: '1심 선고: 무죄 (2026.2.19, 내란죄 불성립)',
        sentencingGuidelines: [
            {
                crime: '내란중요임무종사 (형법 제87조)',
                standardRange: '5년~무기징역 (유죄 시)',
                aggravating: ['비상계엄 당시 헌병대 병력 동원 관련 혐의', '군 명령체계 내 실행 역할'],
                mitigating: ['국헌문란 목적 인식·공유 증거 부족', '상급자 지시에 따른 군 지휘체계 내 행위', '내란 사전 모의 참여 증거 없음', '헌병대 동원이 국회 진입이 아닌 경계 업무'],
                verdict: '무죄',
                analysis: '재판부는 "피고인이 국헌문란의 목적을 인식하거나 공유했다는 증거가 불충분"하다고 판단. 군 지휘체계 내에서 상급자 지시에 따른 행위로, 내란의 고의를 인정하기 어려움'
            }
        ],
        judgeHistory: {
            judgeName: '지귀연',
            position: '서울중앙지방법원 형사합의25부 부장판사',
            recentCases: [
                {
                    caseName: '윤석열 외 7인 내란 사건',
                    year: '2026',
                    verdict: '김용군 무죄 (내란중요임무종사 불성립)',
                    detail: '국헌문란 목적 인식·공유 증거 부족으로 무죄'
                }
            ],
            profile: '사법연수원 25기. 서울중앙지법 형사합의25부 부장판사. 내란 사건 1심 전담 재판장. 2026.2.19 윤석열 무기징역 등 8명 선고.'
        },
        keyIssues: [
            {
                title: '국헌문란 목적의 인식·공유 여부',
                description: '재판부는 내란죄 공범 성립 요건으로 "국헌문란 목적의 미필적 인식·공유"를 필요로 함. 김용군은 헌병대장으로서 병력을 동원했으나, 그것이 국헌문란 목적임을 인식했다는 증거가 불충분',
                opinion: {
                    prosecution: '헌병대 병력 동원은 비상계엄의 일환으로 국회 기능 마비에 기여한 것',
                    defense: '군 지휘체계 내 상급자 지시에 따른 정당한 군사 임무 수행이며, 내란 목적 인식 없음',
                    court: '국헌문란 목적을 인식·공유했다는 증거 불충분하여 무죄'
                }
            },
            {
                title: '군 지휘체계 내 하급자의 범의 인정 기준',
                description: '동일 지휘체계 내에서 상위자(김용현 30년, 박안수 재판 중)는 유죄이나 하급 실행자인 김용군은 무죄로, 명령 체계에서의 범의 인식 경계선이 쟁점',
                opinion: {
                    prosecution: '군 명령체계 내에서도 위법한 명령임을 인식할 수 있었음',
                    defense: '군인으로서 상급자 명령에 복종할 의무가 있으며, 명령의 위법성을 판단할 위치가 아님',
                    court: '하급 실행자의 경우 내란 목적 인식 입증 책임이 검찰에 있으며, 이를 충족하지 못함'
                }
            }
        ],
        sources: [
            { label: '경향신문', title: '내란 공범 성립 여부 가른 국헌문란 목적 인식', url: 'https://www.khan.co.kr/article/202602191845001', date: '2026.2.19' },
            { label: '조세금융신문', title: '내란 1심 김용군·윤승영 무죄', url: 'https://www.tfmedia.co.kr/news/article.html?no=201681', date: '2026.2.19' },
            { label: 'YTN', title: '내란 1심 선고 - 김용군·윤승영 무죄', url: 'https://m.ytn.co.kr/news_view.amp.php?version=1&param=0103_202602200022476461', date: '2026.2.20' }
        ]
    },
    '김봉식': {
        id: 'kimbongsik',
        name: '김봉식',
        position: '전 서울경찰청장',
        status: '법정구속',
        statusColor: 'red',
        court: '서울중앙지방법원 형사합의25부',
        judge: '지귀연 부장판사',
        charges: [
            {
                id: 1,
                name: '내란중요임무종사',
                law: '형법 제87조',
                description: '비상계엄 당시 서울경찰청장으로 국회 봉쇄 가담',
                prosecutionRequest: '징역 15년',
                verdict: '유죄 - 징역 10년 (2026.2.19 선고)',
                reason: '경찰 총책임자로서 포고령의 위법성 미검토, 군의 국회 진입을 돕고 의원 출입 차단'
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
            verdictTotal: '징역 10년 (2026.2.19 선고)',
            ratio: '구형의 67%'
        },
        keyFacts: [
            '12.3 비상계엄 당시 서울경찰청장으로 국회 봉쇄 가담',
            '김용현 당시 국방장관으로부터 안가회동 문건 수령',
            '비화폰 원격삭제 의혹 (2024.12.6)',
            '2025.1.8 구속기소 → 2025.6.26 보석 허가 → 2026.2.19 보석 취소, 법정구속'
        ],
        verdictDate: '2026년 2월 19일',
        trialStatus: '1심 선고: 징역 10년 (2026.2.19)',
        sentencingGuidelines: [
            {
                crime: '내란중요임무종사 (형법 제87조)',
                standardRange: '5년~무기징역',
                aggravating: ['서울경찰청장으로서 국회 봉쇄 가담', '안가회동 문건 수령', '포고령 위법성 미검토'],
                mitigating: ['상급자 지시에 따른 측면', '직접 군사작전 지휘는 아님'],
                verdict: '징역 10년',
                analysis: '서울경찰청장으로서 국회 봉쇄에 가담. 포고령의 위법성을 검토하지 않고 군의 국회 진입을 도운 점'
            }
        ],
        judgeHistory: {
            judgeName: '지귀연',
            position: '서울중앙지방법원 형사합의25부 부장판사',
            recentCases: [
                {
                    caseName: '윤석열 외 7인 내란 사건',
                    year: '2026',
                    verdict: '김봉식 징역 10년 (내란중요임무종사 유죄)',
                    detail: '구형 15년의 67% 선고'
                }
            ],
            profile: '사법연수원 25기. 서울중앙지법 형사합의25부 부장판사. 내란 사건 1심 전담 재판장.'
        },
        keyIssues: [
            {
                title: '경찰 수뇌부의 국회 봉쇄 가담',
                description: '서울경찰청장으로서 국회 봉쇄에 직접 가담하고, 안가회동 문건을 수령한 행위',
                opinion: {
                    prosecution: '현장 지휘관으로서 국회 봉쇄를 직접 집행한 책임',
                    defense: '상급자 지시에 따른 것이며 내란 목적 인식 부족',
                    court: '포고령 위법성 미검토, 군 국회 진입 조력으로 비난 가능성 높음'
                }
            }
        ],
        sources: [
            { label: '오마이뉴스', title: '김봉식 전 서울경찰청장 징역 10년 선고', url: 'https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003208296', date: '2026.2.19' },
            { label: 'YTN', title: '조지호 전 경찰청장 1심 징역 12년...김봉식 징역 10년', url: 'https://m.ytn.co.kr/news_view.amp.php?version=1&param=0103_202602200022476461', date: '2026.2.20' },
            { label: '헤럴드경제', title: '1심 선고 하루 만에 김봉식·목현태 징계 의결', url: 'https://biz.heraldcorp.com/article/10678952', date: '2026.2.20' }
        ]
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
                verdict: '유죄 - 징역 18년 (2026.2.19 선고)',
                reason: '내란중요임무종사 유죄'
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
            verdictTotal: '내란 본건: 징역 18년 (2026.2.19) + 별건: 징역 2년 (2025.12.15)',
            ratio: '구형의 60%'
        },
        keyFacts: [
            '김용현 전 장관 최측근, 예비역 민간인으로 계엄 핵심 기획',
            '김용현 국방장관 공관 22회 이상 방문 — 계엄 사전 모의 핵심 채널',
            '롯데리아 회동 3회: 곽종근·문상호 등과 계엄 구체 계획 논의 ("버거보살" 별명)',
            '포고령 초안 작성: USB에서 포고령 초안 파일 발견, 김용현 지시로 작성',
            '수첩에 체포명단 14명 기록 (우원식·이재명·한동훈 + 야당의원·시민단체 등)',
            '수첩에 NLL 북한 공격 유도, 500여명 체포·살해 구상 등 극단적 계획 기록',
            '선관위 침투 계획 중간 연결자: 김용현→노상원→문상호(정보사) 라인',
            '별건(개인정보보호법 위반·알선수재) 1심 징역 2년, 추징금 2,490만원 선고, 쌍방 항소'
        ],
        verdictDate: '2026년 2월 19일',
        trialStatus: '1심 선고: 징역 18년 (2026.2.19) + 별건 징역 2년 (2025.12.15)',
        sentencingGuidelines: [
            {
                crime: '내란중요임무종사 (형법 제87조)',
                standardRange: '5년~무기징역',
                aggravating: ['계엄 사전 모의 핵심 참여', '포고령 초안 작성', '선관위 침입 지휘', '체포·살해 명단 수첩 기록'],
                mitigating: ['예비역 민간인으로서 직접 지휘권 부재'],
                verdict: '징역 18년',
                analysis: '계엄 사전 모의, 포고령 초안 작성, 선관위 침입 지휘. 예비역 민간인으로서 계엄 핵심 기획에 참여한 점 중하게 평가'
            }
        ],
        judgeHistory: {
            judgeName: '지귀연',
            position: '서울중앙지방법원 형사합의25부 부장판사',
            recentCases: [
                {
                    caseName: '윤석열 외 7인 내란 사건',
                    year: '2026',
                    verdict: '노상원 징역 18년 (내란중요임무종사 유죄)',
                    detail: '구형 30년의 60% 선고'
                }
            ],
            profile: '사법연수원 25기. 서울중앙지법 형사합의25부 부장판사. 내란 사건 1심 전담 재판장.'
        },
        keyIssues: [
            {
                title: '예비역 민간인의 내란 가담',
                description: '예비역 전환 후 민간인 신분으로 계엄 핵심 기획에 참여. 포고령 초안 작성, 체포·살해 명단 수첩 기록 등',
                opinion: {
                    prosecution: '현역이 아닌 민간인이 군사 작전을 기획한 점이 더욱 위험',
                    defense: '예비역으로서 군 지휘권이 없었으므로 중요임무종사에 해당하지 않음',
                    court: '내란중요임무종사 유죄 인정'
                }
            },
            {
                title: '포고령 초안 작성과 USB 증거',
                description: '노상원 압수 USB에서 포고령 초안 파일이 발견됨. 김용현 지시로 포고령을 사전 작성한 것으로 추정되며, 계엄의 사전 기획성을 입증하는 핵심 물증',
                opinion: {
                    prosecution: '포고령 사전 작성은 계엄이 즉흥적 결정이 아닌 치밀한 사전 모의임을 입증',
                    defense: '국방부 장관의 업무 지시에 따른 참고 문서 작성에 불과',
                    court: '계엄 선포까지 이를 수 있게 하는 동력 중 하나로 평가'
                }
            },
            {
                title: '22회 공관 방문과 사전 모의 규모',
                description: '김용현 국방장관 공관을 22회 이상 방문하며 계엄을 체계적으로 사전 모의. 롯데리아 회동 3회를 통해 군부 지휘관(곽종근·문상호)과 구체적 실행 계획 논의',
                opinion: {
                    prosecution: '22회 이상 회동은 장기간 치밀한 내란 모의의 증거',
                    defense: '전역 후 후배와의 사적 만남이며 내란 모의가 아님',
                    court: '김용현과의 긴밀한 사전 모의를 통한 계엄 핵심 기획자로 인정'
                }
            }
        ]
    },
    '목현태': {
        id: 'mokhyuntae',
        name: '목현태',
        position: '전 서울경찰청 국회경비대장',
        status: '법정구속',
        statusColor: 'red',
        court: '서울중앙지방법원 형사합의25부',
        judge: '지귀연 부장판사',
        charges: [
            {
                id: 1,
                name: '내란중요임무종사',
                law: '형법 제87조',
                description: '국회경비대장으로서 국회의원 출입 차단 지시',
                prosecutionRequest: '징역 12년',
                verdict: '유죄 - 징역 3년 (2026.2.19 선고)',
                reason: '내란중요임무종사 유죄'
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
            verdictTotal: '징역 3년 (2026.2.19 선고)',
            ratio: '구형의 25%'
        },
        keyFacts: [
            '국회경비대장으로서 국회 출입구 차단 지시',
            '국회의원 출입 차단으로 계엄해제 의결 방해',
            '국회의장 찾을 것을 4번 지시한 사실 확인',
            '"국헌 문란의 목적이 없었다"며 내란 혐의 부인',
            '2026.2.19 1심 징역 3년 선고, 법정구속 (2026.2.23 항소)'
        ],
        verdictDate: '2026년 2월 19일',
        trialStatus: '1심 선고: 징역 3년 (2026.2.19)',
        keyIssues: [
            {
                title: '미필적 고의에 의한 내란 가담 인정',
                description: '재판부는 "처음부터 국헌문란 목적을 인식하지는 않았지만, 군 출입이 허용되는 상황을 목격하면서도 계속 의원 출입 차단에 가담한 것은 미필적으로나마 국회 활동 저지 행위임을 인식한 것"으로 판단',
                opinion: {
                    prosecution: '국회경비대장으로서 군의 국회 진입을 목격하고도 의원 출입 차단을 계속한 것은 적극적 내란 가담',
                    defense: '상급자(조지호, 김봉식) 지시에 따른 것이며, 처음부터 국헌문란 목적을 인식하지 못함',
                    court: '처음에는 목적 미인식이나, 상황 전개를 목격한 후에도 계속 참여한 것은 미필적 고의로 내란 가담 인정'
                }
            },
            {
                title: '하급자의 책임 범위와 양형',
                description: '구형 12년 대비 3년(구형의 25%) 선고로, 하급자의 독자적 판단 여지가 제한적이었음을 반영한 양형',
                opinion: {
                    prosecution: '국회경비대장이라는 직책상 의원 출입 차단의 직접 책임자',
                    defense: '독자적 판단 여지 극히 제한, 상급자 지시 이행에 불과',
                    court: '하급자로서 독자적 판단 여지 제한적, 미필적 고의 수준으로 비난 가능성 상대적으로 낮음'
                }
            }
        ],
        sentencingGuidelines: [
            {
                crime: '내란중요임무종사 (형법 제87조)',
                standardRange: '5년~무기징역',
                aggravating: ['국회경비대장으로서 국회의원 출입 차단 직접 지시', '국회의장 소재 파악 4회 지시', '군 국회 진입 목격 후에도 계속 가담'],
                mitigating: ['하급자로서 독자적 판단 여지 제한', '상급자(조지호·김봉식) 지시 이행', '처음부터 국헌문란 목적 인식하지 않음 (미필적 고의)'],
                verdict: '징역 3년',
                analysis: '재판부는 미필적 고의에 의한 내란 가담을 인정하되, 하급자로서 독자적 판단 여지가 제한적이었음을 반영하여 구형 12년의 25%인 3년 선고'
            }
        ],
        judgeHistory: {
            judgeName: '지귀연',
            position: '서울중앙지방법원 형사합의25부 부장판사',
            recentCases: [
                {
                    caseName: '윤석열 외 7인 내란 사건',
                    year: '2026',
                    verdict: '목현태 징역 3년 (내란중요임무종사 유죄, 미필적 고의)',
                    detail: '구형 12년의 25% 선고, 법정구속'
                }
            ],
            profile: '사법연수원 25기. 서울중앙지법 형사합의25부 부장판사. 내란 사건 1심 전담 재판장. 2026.2.19 윤석열 무기징역 등 8명 선고.'
        },
        sources: [
            { label: 'SBS뉴스', title: '목현태 내란 가담 인정, 징역 3년 법정구속', url: 'https://news.sbs.co.kr/amp/news.amp?news_id=N1008447866', date: '2026.2.19' },
            { label: '헤럴드경제', title: '1심 선고 하루 만에 김봉식·목현태 징계 의결', url: 'https://biz.heraldcorp.com/article/10678952', date: '2026.2.20' },
            { label: '조세금융신문', title: '내란 1심 목현태 징역 3년', url: 'https://www.tfmedia.co.kr/news/article.html?no=201681', date: '2026.2.19' }
        ]
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
                verdict: '무죄 (2026.2.19 선고)',
                reason: '범행 계획에 공모 또는 국헌문란의 목적을 명확히 인식/공유했다는 증거 부족'
            },
            {
                id: 2,
                name: '직권남용권리행사방해',
                law: '형법 제123조',
                description: '체포조 운용 관련',
                prosecutionRequest: '포함 구형',
                verdict: '무죄 (2026.2.19 선고)',
                reason: '국헌문란 목적 인식·공유 증거 부족'
            }
        ],
        summary: {
            prosecutionTotal: '징역 10년 (특검 구형)',
            verdictTotal: '무죄 (2026.2.19 선고)',
            ratio: '무죄'
        },
        keyFacts: [
            '비상계엄 당일 국군방첩사로부터 "국회로 체포조를 보낼 건데 인솔할 형사 5명 필요" 요청 수령',
            '이현일 국수본 수사기획계장으로부터 방첩사 체포조 편성 지원 요청 보고받음',
            '조지호 경찰청장에게 보고 후 승인받아 경찰관 지원 편성',
            '2025.2.28 불구속 기소 (내란중요임무종사, 직권남용)',
            '2026.2.19 무죄 선고 — "국헌문란 목적 인식·공유 증거 부족, 매뉴얼 오인 가능성"',
            '김용군과 함께 내란 피고인 8명 중 무죄 선고받은 2명'
        ],
        verdictDate: '2026년 2월 19일',
        trialStatus: '1심 선고: 무죄 (2026.2.19, 내란죄 불성립)',
        sentencingGuidelines: [
            {
                crime: '내란중요임무종사 (형법 제87조)',
                standardRange: '5년~무기징역 (유죄 시)',
                aggravating: ['방첩사 체포조에 경찰 인력 지원 가담', '조지호 경찰청장에게 보고 후 승인 받아 실행'],
                mitigating: ['비상계엄 매뉴얼에 따른 합동수사단 지원으로 오인', '체포 대상을 포고령 위반 사범으로 인식', '국회 활동 저지·마비 목적 공유 증거 부족', '중간 전달자(실무급)로서 독자적 판단 여지 제한'],
                verdict: '무죄',
                analysis: '재판부는 "비상계엄 하 매뉴얼에 따라 합동수사단을 지원하는 행위로 인식했을 합리적 의심을 배제하기 어렵다"며 무죄 판결. 경찰 수뇌부(조지호·김봉식)는 유죄이나 중간 실무급인 윤승영은 범의 불인정'
            },
            {
                crime: '직권남용권리행사방해 (형법 제123조)',
                standardRange: '5년 이하 징역',
                aggravating: ['체포조 운용 관련 경찰관 지원 편성 가담'],
                mitigating: ['국헌문란 목적 인식 증거 부족', '상급자 지시 전달에 불과'],
                verdict: '무죄',
                analysis: '내란중요임무종사와 동일한 이유로 무죄 판결'
            }
        ],
        judgeHistory: {
            judgeName: '지귀연',
            position: '서울중앙지방법원 형사합의25부 부장판사',
            recentCases: [
                {
                    caseName: '윤석열 내란수괴 사건',
                    year: '2026',
                    verdict: '무기징역 선고 (구형: 사형)',
                    detail: '대한민국 최초 현직 대통령 내란죄 유죄 판결'
                },
                {
                    caseName: '김용현 외 6인 내란 사건',
                    year: '2026',
                    verdict: '김용현 30년, 노상원 18년, 조지호 12년, 김봉식 10년, 목현태 3년, 김용군·윤승영 무죄',
                    detail: '내란 공범 중 윤승영·김용군 2명만 무죄 선고'
                },
                {
                    caseName: '한덕수 내란 사건',
                    year: '2026',
                    verdict: '징역 23년, 법정구속 (구형: 15년)',
                    detail: '구형 초과 선고 — 구형의 약 1.5배'
                },
                {
                    caseName: '이상민 내란 사건',
                    year: '2026',
                    verdict: '징역 7년 (직권남용 무죄)',
                    detail: '구형 15년의 47%'
                }
            ],
            profile: '사법연수원 25기. 서울중앙지법 형사합의25부 부장판사. 2024년 12월 내란 사건 1심 전담 재판장. 노상원 수첩 증거능력 배척, 계엄 모의 시점 축소 등 판결 논란.'
        },
        keyIssues: [
            {
                title: '"매뉴얼 오인" 항변의 수용 여부',
                description: '윤승영은 방첩사 체포조 지원을 비상계엄 매뉴얼에 따른 합동수사단 지원으로 인식했다고 주장. 재판부가 이를 수용하여 무죄 선고',
                opinion: {
                    prosecution: '경찰 수뇌부(조지호)에게 보고·승인 받은 후 체포조 지원을 실행한 것은 단순 오인이 아닌 적극적 가담',
                    defense: '체포 대상이 정치인이 아닌 포고령 위반 사범으로 알았으며, 국헌문란 목적을 인식·공유한 바 없음',
                    court: '비상계엄 하 합동수사단 지원으로 오인했을 합리적 의심 배제 불가, 국헌문란 목적 공유 증거 부족'
                }
            },
            {
                title: '경찰 수뇌부 유죄 vs 실무급 무죄의 형평성',
                description: '보고 라인의 상위자(조지호 청장 12년, 김봉식 서울청장 10년)는 유죄이나 중간 전달자 윤승영은 무죄로, 동일 지시 체계 내 차별적 판결 논란',
                opinion: {
                    prosecution: '조지호 청장에게 보고하고 승인 받아 실행한 이상 범행 인식 있었다고 봐야 함',
                    defense: '보고·전달 행위만으로 국헌문란 목적까지 인식했다고 볼 수 없음',
                    court: '상급자와 달리 실무급 조정관은 전체 그림을 인지하지 못했을 가능성 인정'
                }
            },
            {
                title: '항소심에서의 유죄 전환 가능성',
                description: '특검이 윤승영 무죄 판결에 항소할 경우 항소심에서 유죄로 전환될 가능성',
                opinion: {
                    prosecution: '1심 무죄 판단은 국헌문란 목적 인식에 대한 법리 해석 오류, 항소심에서 정정 필요',
                    defense: '1심 재판부의 합리적 의심 판단은 타당, 2심에서도 무죄 유지될 것',
                    court: '내란죄 공범의 목적 인식 범위에 대한 법리 해석이 항소심의 핵심 쟁점'
                }
            }
        ]
    },
    '조지호': {
        id: 'jojiho',
        name: '조지호',
        position: '전 경찰청장',
        status: '보석',
        statusColor: 'orange',
        court: '서울중앙지방법원 형사합의25부',
        judge: '지귀연 부장판사',
        charges: [
            {
                id: 1,
                name: '내란중요임무종사',
                law: '형법 제87조',
                description: '비상계엄 당시 경찰 동원, 국회 봉쇄 지휘',
                prosecutionRequest: '징역 20년',
                verdict: '유죄 - 징역 12년 (2026.2.19 선고)',
                reason: '경찰 총책임자로서 포고령의 위법성 미검토, 군의 국회 진입을 돕고 의원 출입 차단'
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
            verdictTotal: '징역 12년 (2026.2.19 선고)',
            ratio: '구형의 60%'
        },
        keyFacts: [
            '12.3 비상계엄 당시 경찰청장으로서 국회 봉쇄 지휘',
            '이재명 대표 등 주요 인사 체포조 운영 가담 혐의',
            '혈액암 2기, 2025.1.23 보석 석방 (보증금 1억원)',
            '헌재 탄핵 파면 결정 (2025.12.18, 재판관 전원일치)'
        ],
        verdictDate: '2026년 2월 19일',
        trialStatus: '1심 선고: 징역 12년 (2026.2.19)',
        sentencingGuidelines: [
            {
                crime: '내란중요임무종사 (형법 제87조)',
                standardRange: '5년~무기징역',
                aggravating: ['경찰청장으로서 포고령 위법성 미검토', '군의 국회 진입 조력 — 경찰이 군 출입을 도움', '국회의원 출입 차단 지시', '포고령을 근거로 국회 출입 차단 주도'],
                mitigating: ['계엄 당일에야 군 투입 사정을 알게 됨', '통제 시간이 비교적 짧음', '혈액암 2기 투병 중 (건강 사정)'],
                verdict: '징역 12년 (구형 20년의 60%)',
                analysis: '재판부: "경찰 총책임자임에도 포고령을 면밀히 검토하지 않고, 오히려 경찰이 군 출입을 도왔다." 계엄 당일에야 군 투입을 인지했고 통제 시간이 짧았으며 혈액암 투병 중인 점을 감경 사유로 고려'
            }
        ],
        judgeHistory: {
            judgeName: '지귀연',
            position: '서울중앙지방법원 형사합의25부 부장판사',
            recentCases: [
                {
                    caseName: '윤석열 외 7인 내란 사건',
                    year: '2026',
                    verdict: '조지호 징역 12년 (내란중요임무종사 유죄)',
                    detail: '구형 20년의 60% 선고'
                }
            ],
            profile: '사법연수원 25기. 서울중앙지법 형사합의25부 부장판사. 내란 사건 1심 전담 재판장.'
        },
        keyIssues: [
            {
                title: '경찰 수뇌부의 내란 가담 책임',
                description: '경찰청장으로서 포고령의 위법성을 검토하지 않고 군의 국회 진입을 돕고 의원들의 출입을 차단한 행위의 비난 가능성',
                opinion: {
                    prosecution: '경찰 총수로서 위법한 계엄에 적극 협조한 책임 중대',
                    defense: '상급자(대통령)의 지시에 따른 것이며 독자적 판단 여지 없었음',
                    court: '포고령 위법성 미검토, 군 국회 진입 조력, 의원 출입 차단으로 비난 가능성 높음'
                }
            }
        ],
        sources: [
            { label: '시사저널', title: '조지호 1심 불복 항소', url: 'https://www.sisajournal.com/news/articleView.html?idxno=363402', date: '2026.2.20' },
            { label: 'YTN', title: '조지호 전 경찰청장 1심 징역 12년', url: 'https://m.ytn.co.kr/news_view.amp.php?version=1&param=0103_202602200022476461', date: '2026.2.20' },
            { label: '경향신문', title: '조지호 보석 석방 (혈액암 2기)', url: 'https://www.khan.co.kr/article/202501231427011', date: '2025.1.23' }
        ]
    }
};

// 가나다순 정렬된 인물 목록
const sortedPersons = Object.keys(personsData).sort((a, b) => a.localeCompare(b, 'ko'));

export default function SentencingAnalysis() {
    const [searchParams] = useSearchParams();
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [firestoreData, setFirestoreData] = useState({});
    const [judgeNewsData, setJudgeNewsData] = useState({});
    const [judgeYouTubeData, setJudgeYouTubeData] = useState({});
    const [judgeCourtData, setJudgeCourtData] = useState({});
    const [loading, setLoading] = useState(true);
    const [kakaoReady, setKakaoReady] = useState(false);
    const [selectedAiModel, setSelectedAiModel] = useState('claude');

    // URL 파라미터에서 person 읽어서 선택
    useEffect(() => {
        const personParam = searchParams.get('person');
        if (personParam && personsData[personParam]) {
            setSelectedPerson(personParam);
            window.scrollTo(0, 0);
        }
    }, [searchParams]);

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
            const timeoutId = setTimeout(() => clearInterval(checkKakao), 5000);
            return () => {
                clearInterval(checkKakao);
                clearTimeout(timeoutId);
            };
        }
    }, []);

    // Firestore에서 최신 데이터 가져오기
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const results = await Promise.allSettled([
                    getDocs(collection(db, 'sentencingData')),
                    getDocs(collection(db, 'judgeData')),
                    getDocs(collection(db, 'judgeYouTubeData')),
                    getDocs(collection(db, 'judgeCourtCases'))
                ]);

                if (results[0].status === 'fulfilled') {
                    const sentencing = {};
                    results[0].value.forEach(doc => { sentencing[doc.id] = doc.data(); });
                    setFirestoreData(sentencing);
                }

                if (results[1].status === 'fulfilled') {
                    const judges = {};
                    results[1].value.forEach(doc => { judges[doc.id] = doc.data(); });
                    setJudgeNewsData(judges);
                }

                if (results[2].status === 'fulfilled') {
                    const youtube = {};
                    results[2].value.forEach(doc => { youtube[doc.id] = doc.data(); });
                    setJudgeYouTubeData(youtube);
                }

                if (results[3].status === 'fulfilled') {
                    const court = {};
                    results[3].value.forEach(doc => { court[doc.id] = doc.data(); });
                    setJudgeCourtData(court);
                }
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

    const shareToThreads = async () => {
        const shareText = `${document.title}\n\n${window.location.href}\n\n#시민법정 #참심제 #사법개혁`;
        try {
            await navigator.clipboard.writeText(shareText);
            alert('텍스트가 복사되었습니다!\nThreads에서 붙여넣기 해주세요.');
            window.open('https://www.threads.net/', '_blank');
        } catch (err) {
            alert('복사에 실패했습니다.');
        }
    };

    const shareToLinkedIn = () => {
        window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
            '_blank',
            'width=600,height=400'
        );
    };

    // 정적 데이터와 Firestore 데이터 병합
    const getMergedPersonData = (name) => {
        const staticData = personsData[name];
        const dynamicData = firestoreData[name];

        if (!dynamicData) {
            return staticData;
        }

        // Firestore 데이터가 있으면 병합
        // Firestore에서 "null" 문자열로 저장된 값 필터링
        const clean = (v) => (v && v !== 'null' && v !== 'undefined') ? v : null;
        // 크롤러 기본값('재판 진행 중')은 의미있는 데이터가 아니므로 정적 데이터를 덮어쓰지 않도록 필터링
        const cleanVerdict = (v) => {
            const cleaned = clean(v);
            if (!cleaned) return null;
            if (cleaned === '재판 진행 중' || cleaned === '최근 재판 관련 뉴스 있음') return null;
            return cleaned;
        };

        // [방어 로직] 정적 데이터에 확정 판결이 있으면 Firestore 데이터의 신뢰성 검증
        // 크롤러가 공동피고인 기사에서 다른 사람의 판결을 잘못 수집하는 경우 방지
        const staticVerdict = staticData.summary?.verdictTotal;
        const firestoreVerdict = cleanVerdict(dynamicData.verdict);
        const hasConfirmedStaticVerdict = staticVerdict && staticVerdict !== '재판 진행 중' && staticVerdict !== '수사 중';

        // 정적 데이터에 확정 판결이 있고, Firestore verdict가 이와 다르면 Firestore 데이터를 오염된 것으로 간주
        const isFirestoreVerdictContaminated = hasConfirmedStaticVerdict && firestoreVerdict
            && !staticVerdict.includes(firestoreVerdict) && firestoreVerdict !== staticVerdict;

        // keyFacts 오염 검사: 해당 인물의 이름이 아닌 다른 주요 피고인 이름이 첫 항목에 포함된 경우
        const mainDefendants = ['윤석열', '한덕수', '김용현', '조지호', '노상원', '이상민', '김건희'];
        const isKeyFactsContaminated = dynamicData.keyFacts?.length > 0 && dynamicData.keyFacts.some(fact => {
            return mainDefendants.some(d => d !== name && fact.includes(d) && !fact.includes(name));
        });

        // charges 오염 검사: 정적 데이터가 더 상세하면(더 많은 건수) 정적 데이터 우선
        const isChargesLessDetailed = dynamicData.charges?.length > 0
            && staticData.charges?.length > 0
            && dynamicData.charges.length < staticData.charges.length;

        // 오염 감지 시 콘솔 경고 (개발 모드)
        if (import.meta.env.DEV && (isFirestoreVerdictContaminated || isKeyFactsContaminated)) {
            console.warn(`[데이터 오염 감지] ${name}: Firestore 데이터가 다른 피고인의 정보로 오염됨.`,
                { staticVerdict, firestoreVerdict, isKeyFactsContaminated });
        }

        const mergedStatus = clean(dynamicData.status) || staticData.status;

        // verdict 결정: 오염된 경우 정적 데이터 우선
        const mergedVerdictTotal = isFirestoreVerdictContaminated
            ? staticVerdict
            : (firestoreVerdict || staticVerdict || '재판 진행 중');

        // charges 결정: 오염되었거나 정적이 더 상세하면 정적 데이터 우선
        const useStaticCharges = isFirestoreVerdictContaminated || isChargesLessDetailed;
        const mergedCharges = useStaticCharges
            ? staticData.charges
            : (dynamicData.charges?.length > 0 ? dynamicData.charges.map((c, idx) => {
                const staticCharge = staticData.charges?.find(sc => sc.name === c.name) || staticData.charges?.[idx] || {};
                return {
                    ...staticCharge,
                    id: idx + 1,
                    name: clean(c.name) || staticCharge.name,
                    law: clean(c.law) || staticCharge.law,
                    verdict: cleanVerdict(c.verdict) || staticCharge.verdict || '재판 진행 중',
                    prosecutionRequest: clean(c.sentence) || clean(c.prosecutionRequest) || staticCharge.prosecutionRequest || '조사 중',
                    reason: staticCharge.reason || '-'
                };
            }) : staticData.charges);

        // keyFacts 결정: 오염된 경우 정적 데이터 우선
        const mergedKeyFacts = (isKeyFactsContaminated || isFirestoreVerdictContaminated)
            ? staticData.keyFacts
            : (dynamicData.keyFacts?.length > 0 ? dynamicData.keyFacts : staticData.keyFacts);

        return {
            ...staticData,
            status: mergedStatus,
            statusColor: (mergedStatus === '구속' || mergedStatus === '법정구속') ? 'red' : mergedStatus === '보석' ? 'orange' : (mergedStatus === '불구속' ? 'green' : staticData.statusColor),
            verdictDate: clean(dynamicData.verdictDate) || staticData.verdictDate,
            trialStatus: cleanVerdict(dynamicData.trialStatus) || staticData.trialStatus,
            charges: mergedCharges,
            summary: {
                ...staticData.summary,
                verdictTotal: mergedVerdictTotal
            },
            keyFacts: mergedKeyFacts,
            // Firestore 데이터가 있으면 우선 사용, 없으면 static fallback
            sentencingGuidelines: dynamicData.sentencingGuidelines?.length > 0
                ? dynamicData.sentencingGuidelines
                : staticData.sentencingGuidelines,
            judgeHistory: dynamicData.judgeHistory?.judgeName
                ? dynamicData.judgeHistory
                : staticData.judgeHistory,
            keyIssues: dynamicData.keyIssues?.length > 0
                ? dynamicData.keyIssues
                : staticData.keyIssues,
            aiPrediction: dynamicData.aiPrediction || null,
            claudePrediction: dynamicData.claudePrediction ? {
                ...dynamicData.claudePrediction,
                judicialIntegrity: dynamicData.claudePrediction.judicialIntegrity ? {
                    ...dynamicData.claudePrediction.judicialIntegrity,
                    evidenceSummary: dynamicData.claudePrediction.judicialIntegrity.evidenceSummary || null,
                    trendInsight: dynamicData.claudePrediction.judicialIntegrity.trendInsight || null,
                } : null,
                aiJudgeComparison: dynamicData.claudePrediction.aiJudgeComparison || null,
            } : null,
            sources: dynamicData.sources || staticData.sources || [],
            // 동적 데이터 메타정보
            _lastUpdated: dynamicData.lastUpdated,
            _hasLiveData: !!dynamicData,
            _recentNews: dynamicData.recentNews || [],
            // 오염 감지 플래그
            _dataContaminated: isFirestoreVerdictContaminated || isKeyFactsContaminated
        };
    };

    const person = selectedPerson ? getMergedPersonData(selectedPerson) : null;

    // [개발 모드 전용] 피고인 데이터 완전성 검증
    // 누락된 필수 필드를 콘솔 경고로 출력하여 데이터 미비 방지
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        const REQUIRED_FIELDS = ['sentencingGuidelines', 'judgeHistory', 'keyIssues', 'sources'];
        const missing = [];
        sortedPersons.forEach(name => {
            const merged = getMergedPersonData(name);
            const lacks = REQUIRED_FIELDS.filter(f => {
                const v = merged[f];
                if (!v) return true;
                if (Array.isArray(v) && v.length === 0) return true;
                if (f === 'judgeHistory' && !v.judgeName) return true;
                return false;
            });
            if (lacks.length > 0) missing.push({ name, lacks });
        });
        if (missing.length > 0) {
            console.warn(
                `[데이터 완전성 경고] ${missing.length}명 피고인 필수 필드 누락:\n` +
                missing.map(m => `  ❌ ${m.name}: ${m.lacks.join(', ')}`).join('\n')
            );
        }
    }, [firestoreData]); // eslint-disable-line react-hooks/exhaustive-deps

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
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                                <p className="text-2xl font-bold text-gray-900">{sortedPersons.length}</p>
                                <p className="text-sm text-gray-500">총 인원</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                                <p className="text-2xl font-bold text-red-600">
                                    {sortedPersons.filter(name => personsData[name].status === '구속' || personsData[name].status === '법정구속').length}
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
                                <p className="text-2xl font-bold text-orange-600">
                                    {sortedPersons.filter(name => personsData[name].status === '보석').length}
                                </p>
                                <p className="text-sm text-gray-500">보석</p>
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
                                                window.scrollTo(0, 0);
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
                                                    (p.status === '구속' || p.status === '법정구속')
                                                        ? 'bg-red-100 text-red-700'
                                                        : p.status === '보석'
                                                            ? 'bg-orange-100 text-orange-700'
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
                                <button
                                    onClick={shareToThreads}
                                    className="w-12 h-12 flex items-center justify-center bg-black rounded-full hover:scale-110 transition-transform"
                                    title="Threads"
                                >
                                    <ThreadsIcon className="w-6 h-6 text-white" />
                                </button>
                                <button
                                    onClick={shareToLinkedIn}
                                    className="w-12 h-12 flex items-center justify-center bg-[#0A66C2] rounded-full hover:scale-110 transition-transform"
                                    title="LinkedIn"
                                >
                                    <LinkedInIcon className="w-6 h-6 text-white" />
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
                                (person.status === '구속' || person.status === '법정구속')
                                    ? 'bg-red-100 text-red-700'
                                    : person.status === '보석'
                                        ? 'bg-orange-100 text-orange-700'
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
                            { id: 'issues', label: '핵심 쟁점' },
                            { id: 'aiPrediction', label: 'AI 양형 예측' }
                        ] : [
                            { id: 'overview', label: '개요' },
                            { id: 'charges', label: '혐의 분석' },
                            { id: 'aiPrediction', label: 'AI 양형 예측' }
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
                    {activeTab === 'judge' && person.judgeHistory && (() => {
                        const judgeFromDB = JUDGES_DATA.find(j => j.name === person.judgeHistory.judgeName);
                        return (
                        <div className="space-y-6">
                            {/* 판사 프로필 */}
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="p-4 bg-indigo-50 border-b">
                                    <h3 className="font-bold text-gray-900">재판장 정보</h3>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-4 mb-4">
                                        {judgeFromDB?.photo ? (
                                            <img
                                                src={judgeFromDB.photo}
                                                alt={person.judgeHistory.judgeName}
                                                className="w-16 h-16 rounded-full object-cover"
                                                onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
                                            />
                                        ) : null}
                                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center" style={judgeFromDB?.photo ? {display: 'none'} : {}}>
                                            <span className="text-2xl font-bold text-indigo-600">{person.judgeHistory.judgeName[0]}</span>
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold text-gray-900">{person.judgeHistory.judgeName} 부장판사</p>
                                            <p className="text-gray-500">{judgeFromDB?.position || person.judgeHistory.position}</p>
                                            {judgeFromDB?.court && <p className="text-sm text-gray-400">{judgeFromDB.court}</p>}
                                        </div>
                                    </div>
                                    {/* 경력사항 */}
                                    {judgeFromDB?.career?.length > 0 ? (
                                        <div className="mb-3">
                                            <p className="text-sm font-medium text-indigo-600 mb-2">경력사항</p>
                                            <ul className="space-y-1">
                                                {judgeFromDB.career.map((item, idx) => (
                                                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                                        <span className="text-indigo-400 mt-0.5">•</span>
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : null}
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{person.judgeHistory.profile}</p>
                                </div>
                            </div>

                            {/* 주요 판결 이력 - judges.js 데이터 우선 */}
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b">
                                    <h3 className="font-bold text-gray-900">주요 판결 이력</h3>
                                    {judgeFromDB && <span className="text-xs text-blue-500 ml-2">판사평가 연동</span>}
                                </div>
                                <div className="divide-y">
                                    {judgeFromDB?.cases?.length > 0 ? (
                                        judgeFromDB.cases.map((caseItem, idx) => (
                                            <div key={idx} className="p-4">
                                                <p className="font-medium text-gray-900 mb-1">{caseItem.text}</p>
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
                                        ))
                                    ) : (
                                        person.judgeHistory.recentCases.map((caseItem, idx) => (
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
                                        ))
                                    )}
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
                        );
                    })()}

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

                                        {/* 일반 의견 비교 (opinion이 있는 경우) */}
                                        {issue.opinion && (
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
                                        )}

                                        {/* 비교 테이블 (comparison이 있는 경우) */}
                                        {issue.comparison && (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="bg-gradient-to-r from-indigo-100 to-purple-100">
                                                            <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">항목</th>
                                                            <th className="px-4 py-3 text-center font-semibold text-indigo-700 border-b">한덕수 (국무총리)</th>
                                                            <th className="px-4 py-3 text-center font-semibold text-purple-700 border-b">이상민 (행안부 장관)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {issue.comparison.items.map((item, i) => (
                                                            <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                                                <td className="px-4 py-3 font-medium text-gray-700 border-b">{item.category}</td>
                                                                <td className={`px-4 py-3 text-center border-b ${item.category === '1심 선고' ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                                                    {item.handeoksu}
                                                                </td>
                                                                <td className={`px-4 py-3 text-center border-b ${item.category === '1심 선고' ? 'text-orange-600 font-bold' : 'text-gray-600'}`}>
                                                                    {item.leesangmin}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                                    <p className="text-xs text-yellow-800">
                                                        <strong>※ 양형 차이 분석:</strong> 동일 혐의·동일 구형에도 한덕수는 구형의 153%, 이상민은 구형의 47% 선고.
                                                        재판부는 한덕수의 경우 "위로부터의 내란에 합류"로, 이상민은 "직접 실행행위가 아닌 지시 전달"로 판단 차이를 보임.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'aiPrediction' && (
                        <div className="space-y-6">
                            {/* AI 모델 선택 */}
                            <div className="flex items-center justify-center gap-2 bg-white rounded-xl shadow-sm p-3">
                                <span className="text-sm text-gray-500 mr-2">AI 모델:</span>
                                <button
                                    onClick={() => setSelectedAiModel('gemini')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        selectedAiModel === 'gemini'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Gemini AI
                                </button>
                                <button
                                    onClick={() => setSelectedAiModel('claude')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        selectedAiModel === 'claude'
                                            ? 'bg-orange-600 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Claude AI
                                </button>
                            </div>

                            {/* 면책 고지 */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <p className="text-amber-800 text-sm">
                                    ⚠️ 이 분석은 {selectedAiModel === 'gemini' ? 'Google Gemini AI' : 'Anthropic Claude AI'}가 공개된 뉴스 보도와 역사적 선례를 기반으로 예측한 것이며, 실제 법원 판결과 다를 수 있습니다. 법적 조언이 아닌 참고 자료로만 활용하시기 바랍니다.
                                </p>
                            </div>

                            {(selectedAiModel === 'gemini' ? person.aiPrediction : person.claudePrediction) ? (() => {
                                const pred = selectedAiModel === 'gemini' ? person.aiPrediction : person.claudePrediction;
                                return (
                                    <>
                                        {/* 예측 결과 요약 */}
                                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                            <div className="p-4 bg-indigo-50 border-b border-indigo-100">
                                                <h3 className="font-bold text-gray-900">예측 결과</h3>
                                            </div>
                                            <div className="p-4">
                                                <div className="grid md:grid-cols-3 gap-4">
                                                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                                                        <p className="text-sm text-blue-600 mb-1">예측 양형 범위</p>
                                                        <p className="text-lg font-bold text-blue-900">{pred.predictedSentence?.range}</p>
                                                    </div>
                                                    <div className="bg-red-50 rounded-lg p-4 text-center">
                                                        <p className="text-sm text-red-600 mb-1">가장 유력한 양형</p>
                                                        <p className="text-lg font-bold text-red-900">{pred.predictedSentence?.mostLikely}</p>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                                                        <p className="text-sm text-gray-600 mb-1">예측 신뢰도</p>
                                                        <p className={`text-lg font-bold ${
                                                            pred.predictedSentence?.confidence === 'high' ? 'text-green-600' :
                                                            pred.predictedSentence?.confidence === 'medium' ? 'text-yellow-600' :
                                                            'text-gray-600'
                                                        }`}>
                                                            {pred.predictedSentence?.confidence === 'high' ? '높음' :
                                                             pred.predictedSentence?.confidence === 'medium' ? '보통' : '낮음'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 선고 완료 시: 예측 vs 실제 비교 */}
                                        {person.verdictDate && person.summary?.verdictTotal && (
                                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                                <div className="p-4 bg-orange-50 border-b border-orange-100">
                                                    <h3 className="font-bold text-gray-900">AI 예측 vs 실제 선고</h3>
                                                </div>
                                                <div className="p-4 grid md:grid-cols-2 gap-4">
                                                    <div className="bg-indigo-50 rounded-lg p-4 text-center">
                                                        <p className="text-sm text-indigo-600 mb-1">AI 예측</p>
                                                        <p className="text-xl font-bold text-indigo-900">{pred.predictedSentence?.mostLikely}</p>
                                                    </div>
                                                    <div className="bg-red-50 rounded-lg p-4 text-center">
                                                        <p className="text-sm text-red-600 mb-1">실제 선고</p>
                                                        <p className="text-xl font-bold text-red-900">{person.summary.verdictTotal}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* 역사적 선례 비교 */}
                                        {pred.historicalComparison && (
                                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                                <div className="p-4 bg-purple-50 border-b border-purple-100">
                                                    <h3 className="font-bold text-gray-900">역사적 선례 비교</h3>
                                                </div>
                                                <div className="p-4 space-y-4">
                                                    {/* 전두환 비교 */}
                                                    {pred.historicalComparison.chundoohwan && (
                                                        <div className="border border-gray-200 rounded-lg p-4">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <span className="text-lg font-bold text-gray-900">전두환</span>
                                                                <span className="text-sm text-gray-500">1996년 | 내란수괴</span>
                                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                                                                    1심: 사형 → 항소심: 무기징역
                                                                </span>
                                                            </div>
                                                            <div className="grid md:grid-cols-2 gap-3 mb-3">
                                                                <div className="bg-blue-50 rounded-lg p-3">
                                                                    <p className="text-sm text-blue-700 font-medium mb-1">유사점</p>
                                                                    <p className="text-sm text-gray-700">{pred.historicalComparison.chundoohwan.similarity}</p>
                                                                </div>
                                                                <div className="bg-orange-50 rounded-lg p-3">
                                                                    <p className="text-sm text-orange-700 font-medium mb-1">차이점</p>
                                                                    <p className="text-sm text-gray-700">{pred.historicalComparison.chundoohwan.difference}</p>
                                                                </div>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-lg p-3">
                                                                <p className="text-sm text-gray-600 font-medium mb-1">양형 영향</p>
                                                                <p className="text-sm text-gray-700">{pred.historicalComparison.chundoohwan.sentenceImpact}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 노태우 비교 */}
                                                    {pred.historicalComparison.nohtaewoo && (
                                                        <div className="border border-gray-200 rounded-lg p-4">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <span className="text-lg font-bold text-gray-900">노태우</span>
                                                                <span className="text-sm text-gray-500">1996년 | 내란중요임무종사</span>
                                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                                                                    1심: 22년6월 → 항소심: 17년
                                                                </span>
                                                            </div>
                                                            <div className="grid md:grid-cols-2 gap-3 mb-3">
                                                                <div className="bg-blue-50 rounded-lg p-3">
                                                                    <p className="text-sm text-blue-700 font-medium mb-1">유사점</p>
                                                                    <p className="text-sm text-gray-700">{pred.historicalComparison.nohtaewoo.similarity}</p>
                                                                </div>
                                                                <div className="bg-orange-50 rounded-lg p-3">
                                                                    <p className="text-sm text-orange-700 font-medium mb-1">차이점</p>
                                                                    <p className="text-sm text-gray-700">{pred.historicalComparison.nohtaewoo.difference}</p>
                                                                </div>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-lg p-3">
                                                                <p className="text-sm text-gray-600 font-medium mb-1">양형 영향</p>
                                                                <p className="text-sm text-gray-700">{pred.historicalComparison.nohtaewoo.sentenceImpact}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* 공범 비교 */}
                                        {pred.codefendantComparison?.length > 0 && (
                                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                                <div className="p-4 bg-green-50 border-b border-green-100">
                                                    <h3 className="font-bold text-gray-900">공범 선고 비교</h3>
                                                </div>
                                                <div className="divide-y divide-gray-100">
                                                    {pred.codefendantComparison.map((codef, idx) => (
                                                        <div key={idx} className="p-4">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className="font-bold text-gray-900">{codef.name}</span>
                                                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{codef.sentence}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-700">{codef.comparedToDefendant}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 법적 분석 */}
                                        {pred.legalAnalysis && (
                                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                                <div className="p-4 bg-gray-50 border-b border-gray-100">
                                                    <h3 className="font-bold text-gray-900">법적 분석</h3>
                                                </div>
                                                <div className="p-4 space-y-4">
                                                    {pred.legalAnalysis.applicableLaws?.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-700 mb-2">적용 법률 및 양형 기준</h4>
                                                            <ul className="space-y-1">
                                                                {pred.legalAnalysis.applicableLaws.map((law, i) => (
                                                                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                                                        <span className="text-blue-500 mt-0.5">•</span>
                                                                        <span>{law}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        {pred.legalAnalysis.aggravatingFactors?.length > 0 && (
                                                            <div className="bg-red-50 rounded-lg p-3">
                                                                <h4 className="text-sm font-bold text-red-700 mb-2">가중 사유</h4>
                                                                <ul className="space-y-1">
                                                                    {pred.legalAnalysis.aggravatingFactors.map((f, i) => (
                                                                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                                                            <span className="text-red-400 mt-0.5">▲</span>
                                                                            <span>{f}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {pred.legalAnalysis.mitigatingFactors?.length > 0 && (
                                                            <div className="bg-blue-50 rounded-lg p-3">
                                                                <h4 className="text-sm font-bold text-blue-700 mb-2">감경 사유</h4>
                                                                <ul className="space-y-1">
                                                                    {pred.legalAnalysis.mitigatingFactors.map((f, i) => (
                                                                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                                                            <span className="text-blue-400 mt-0.5">▼</span>
                                                                            <span>{f}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {pred.legalAnalysis.keyLegalIssues?.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-700 mb-2">핵심 법적 쟁점</h4>
                                                            <ul className="space-y-1">
                                                                {pred.legalAnalysis.keyLegalIssues.map((issue, i) => (
                                                                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                                                        <span className="text-purple-500 mt-0.5">◆</span>
                                                                        <span>{issue}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* 종합 예측 근거 */}
                                        {pred.sentencingReasoning && (
                                            <div className="bg-white rounded-xl shadow-sm p-4">
                                                <h3 className="font-bold text-gray-900 mb-3">종합 예측 근거</h3>
                                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                                    {pred.sentencingReasoning}
                                                </p>
                                            </div>
                                        )}

                                        {/* ── 사법 정의 평가 ── */}
                                        {pred.judicialIntegrity && (
                                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                                <div className="p-4 bg-red-50 border-b border-red-100">
                                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                        <span>🔍</span> 사법 정의 평가
                                                        {pred.judicialIntegrity.evidenceSummary && (
                                                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-normal">
                                                                근거자료 {pred.judicialIntegrity.evidenceSummary.totalCount}건
                                                            </span>
                                                        )}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mt-1">AI가 판례·보도·검색트렌드·여론조사 등 객관적 자료를 수집·분석하여 평가한 결과입니다</p>
                                                </div>
                                                <div className="p-4 space-y-5">
                                                    {/* 공정성 점수 */}
                                                    {pred.judicialIntegrity.integrityScore && (
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {[
                                                                { label: '검찰 공정성', score: pred.judicialIntegrity.integrityScore.prosecution, color: 'blue' },
                                                                { label: '재판부 공정성', score: pred.judicialIntegrity.integrityScore.judiciary, color: 'purple' },
                                                                { label: '종합 평가', score: pred.judicialIntegrity.integrityScore.overall, color: 'red' }
                                                            ].map((item, i) => (
                                                                <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
                                                                    <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                                                                    <p className={`text-2xl font-bold ${item.score <= 30 ? 'text-red-600' : item.score <= 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                                        {item.score}<span className="text-sm font-normal text-gray-400">/100</span>
                                                                    </p>
                                                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                                                        <div
                                                                            className={`h-2 rounded-full ${item.score <= 30 ? 'bg-red-500' : item.score <= 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                                            style={{ width: `${item.score}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {pred.judicialIntegrity.integrityScore?.reasoning && (
                                                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">
                                                            {pred.judicialIntegrity.integrityScore.reasoning}
                                                        </p>
                                                    )}

                                                    {/* 특검·검찰 문제점 */}
                                                    {pred.judicialIntegrity.prosecutorialIssues?.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1">
                                                                <span>📋</span> 특검·검찰 문제점
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {pred.judicialIntegrity.prosecutorialIssues.map((issue, i) => (
                                                                    <div key={i} className={`p-3 rounded-lg border-l-4 ${
                                                                        issue.severity === 'critical' ? 'bg-red-50 border-red-500' :
                                                                        issue.severity === 'major' ? 'bg-yellow-50 border-yellow-500' :
                                                                        'bg-gray-50 border-gray-300'
                                                                    }`}>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className={`w-2 h-2 rounded-full ${
                                                                                issue.severity === 'critical' ? 'bg-red-500' :
                                                                                issue.severity === 'major' ? 'bg-yellow-500' : 'bg-gray-400'
                                                                            }`} />
                                                                            <span className="text-sm font-bold text-gray-900">{issue.title}</span>
                                                                        </div>
                                                                        <p className="text-xs text-gray-600 ml-4">{issue.description}</p>
                                                                        {issue.impact && <p className="text-xs text-red-600 ml-4 mt-1 font-medium">→ {issue.impact}</p>}
                                                                        {issue.sources?.length > 0 && (
                                                                            <div className="mt-2 flex flex-wrap gap-1">
                                                                                {issue.sources.map((src, si) => (
                                                                                    <a key={si}
                                                                                       href={src.url}
                                                                                       target="_blank"
                                                                                       rel="noopener noreferrer"
                                                                                       className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
                                                                                       title={`${src.title} (${src.date || ''})`}
                                                                                    >
                                                                                        <span>{src.type === 'legal_precedent' ? '📜' : src.type === 'news_article' ? '📰' : src.type === 'opinion_poll' ? '📋' : '📊'}</span>
                                                                                        <span className="truncate max-w-[150px]">{src.title}</span>
                                                                                    </a>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 재판부 문제점 */}
                                                    {pred.judicialIntegrity.judicialIssues?.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1">
                                                                <span>⚖️</span> 재판부 문제점
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {pred.judicialIntegrity.judicialIssues.map((issue, i) => (
                                                                    <div key={i} className={`p-3 rounded-lg border-l-4 ${
                                                                        issue.severity === 'critical' ? 'bg-red-50 border-red-500' :
                                                                        issue.severity === 'major' ? 'bg-yellow-50 border-yellow-500' :
                                                                        'bg-gray-50 border-gray-300'
                                                                    }`}>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className={`w-2 h-2 rounded-full ${
                                                                                issue.severity === 'critical' ? 'bg-red-500' :
                                                                                issue.severity === 'major' ? 'bg-yellow-500' : 'bg-gray-400'
                                                                            }`} />
                                                                            <span className="text-sm font-bold text-gray-900">{issue.title}</span>
                                                                        </div>
                                                                        <p className="text-xs text-gray-600 ml-4">{issue.description}</p>
                                                                        {issue.impact && <p className="text-xs text-red-600 ml-4 mt-1 font-medium">→ {issue.impact}</p>}
                                                                        {issue.sources?.length > 0 && (
                                                                            <div className="mt-2 flex flex-wrap gap-1">
                                                                                {issue.sources.map((src, si) => (
                                                                                    <a key={si}
                                                                                       href={src.url}
                                                                                       target="_blank"
                                                                                       rel="noopener noreferrer"
                                                                                       className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
                                                                                       title={`${src.title} (${src.date || ''})`}
                                                                                    >
                                                                                        <span>{src.type === 'legal_precedent' ? '📜' : src.type === 'news_article' ? '📰' : src.type === 'opinion_poll' ? '📋' : '📊'}</span>
                                                                                        <span className="truncate max-w-[150px]">{src.title}</span>
                                                                                    </a>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 미처리·누락 증거 */}
                                                    {pred.judicialIntegrity.omittedEvidence?.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1">
                                                                <span>📎</span> 미처리·누락 증거
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {pred.judicialIntegrity.omittedEvidence.map((ev, i) => (
                                                                    <div key={i} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-sm font-medium text-gray-900">{ev.title}</span>
                                                                            {ev.status && (
                                                                                <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full">{ev.status}</span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs text-gray-600 mt-1">{ev.description}</p>
                                                                        {ev.sources?.length > 0 && (
                                                                            <div className="mt-2 flex flex-wrap gap-1">
                                                                                {ev.sources.map((src, si) => (
                                                                                    <a key={si}
                                                                                       href={src.url}
                                                                                       target="_blank"
                                                                                       rel="noopener noreferrer"
                                                                                       className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
                                                                                       title={`${src.title} (${src.date || ''})`}
                                                                                    >
                                                                                        <span>{src.type === 'legal_precedent' ? '📜' : src.type === 'news_article' ? '📰' : src.type === 'opinion_poll' ? '📋' : '📊'}</span>
                                                                                        <span className="truncate max-w-[150px]">{src.title}</span>
                                                                                    </a>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* ── 평가 근거 자료 ── */}
                                        {pred.judicialIntegrity?.evidenceSummary && (
                                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                                <div className="p-4 bg-blue-50 border-b border-blue-100">
                                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                        <span>📚</span> 평가 근거 자료
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        이 평가는 {pred.judicialIntegrity.evidenceSummary.totalCount}건의 객관적 자료를 수집·분석하여 생성되었습니다
                                                    </p>
                                                </div>
                                                <div className="p-4 space-y-4">
                                                    {/* 증거 유형별 건수 */}
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {[
                                                            { label: '판례', count: pred.judicialIntegrity.evidenceSummary.byType?.legal_precedent, icon: '📜', color: 'bg-amber-50 text-amber-700' },
                                                            { label: '뉴스', count: pred.judicialIntegrity.evidenceSummary.byType?.news_article, icon: '📰', color: 'bg-sky-50 text-sky-700' },
                                                            { label: '트렌드', count: pred.judicialIntegrity.evidenceSummary.byType?.search_trend, icon: '📊', color: 'bg-green-50 text-green-700' },
                                                            { label: '여론', count: pred.judicialIntegrity.evidenceSummary.byType?.opinion_poll, icon: '📋', color: 'bg-purple-50 text-purple-700' }
                                                        ].map((item, i) => (
                                                            <div key={i} className={`text-center p-3 rounded-lg ${item.color}`}>
                                                                <p className="text-lg mb-1">{item.icon}</p>
                                                                <p className="text-xl font-bold">{item.count || 0}</p>
                                                                <p className="text-xs mt-0.5">{item.label}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* 검색 트렌드 분석 */}
                                                    {pred.judicialIntegrity.trendInsight && (
                                                        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 border border-green-100">
                                                            <h4 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-1">
                                                                <span>📈</span> 검색 트렌드 분석
                                                            </h4>
                                                            <p className="text-xs text-gray-600 leading-relaxed">{pred.judicialIntegrity.trendInsight}</p>
                                                        </div>
                                                    )}

                                                    {/* 점수 산출 방법론 */}
                                                    {pred.judicialIntegrity.integrityScore?.methodology && (
                                                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                            <h4 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-1">
                                                                <span>🔬</span> 평가 방법론
                                                            </h4>
                                                            <p className="text-xs text-gray-600 leading-relaxed">{pred.judicialIntegrity.integrityScore.methodology}</p>
                                                        </div>
                                                    )}

                                                    {/* 핵심 발견사항 */}
                                                    {pred.judicialIntegrity.evidenceSummary.keyFindings?.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1">
                                                                <span>💡</span> 핵심 발견사항
                                                            </h4>
                                                            <ul className="space-y-1.5">
                                                                {pred.judicialIntegrity.evidenceSummary.keyFindings.map((finding, i) => (
                                                                    <li key={i} className="text-xs text-gray-600 flex items-start gap-2 bg-yellow-50 rounded-lg px-3 py-2 border border-yellow-100">
                                                                        <span className="text-yellow-500 font-bold mt-0.5">•</span>
                                                                        <span>{finding}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* ── AI 판사 vs 직업 판사 비교 ── */}
                                        {pred.aiJudgeComparison && (
                                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                                <div className="p-4 bg-indigo-50 border-b border-indigo-100">
                                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                        <span>🤖</span> AI 판사 vs 직업 판사 비교
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mt-1">AI 사법 시스템이 적용되었다면 달라졌을 판단을 비교합니다</p>
                                                </div>
                                                <div className="p-4 space-y-4">
                                                    {/* AI vs 인간 예측 결과 */}
                                                    {pred.aiJudgeComparison.aiPredictedOutcome && (
                                                        <div className="grid md:grid-cols-2 gap-3">
                                                            <div className="bg-indigo-50 rounded-lg p-4 text-center">
                                                                <p className="text-xs text-indigo-600 mb-1">🤖 AI 판사 예측</p>
                                                                <p className="text-lg font-bold text-indigo-900">{pred.aiJudgeComparison.aiPredictedOutcome}</p>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                                                <p className="text-xs text-gray-500 mb-1">👨‍⚖️ 직업 판사 선고</p>
                                                                <p className="text-lg font-bold text-gray-900">{person.summary?.verdictTotal || '재판 진행 중'}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 비교 테이블 */}
                                                    {pred.aiJudgeComparison.differences?.length > 0 && (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-sm">
                                                                <thead>
                                                                    <tr className="bg-gray-100">
                                                                        <th className="p-2 text-left text-gray-700 font-bold rounded-tl-lg">판단 항목</th>
                                                                        <th className="p-2 text-left text-gray-700 font-bold">👨‍⚖️ 직업 판사</th>
                                                                        <th className="p-2 text-left text-gray-700 font-bold">🤖 AI 판사</th>
                                                                        <th className="p-2 text-left text-gray-700 font-bold rounded-tr-lg">AI 장점</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {pred.aiJudgeComparison.differences.map((diff, i) => (
                                                                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                                            <td className="p-2 font-medium text-gray-900">{diff.aspect}</td>
                                                                            <td className="p-2 text-red-700">{diff.humanJudge}</td>
                                                                            <td className="p-2 text-indigo-700">{diff.aiJudge}</td>
                                                                            <td className="p-2 text-green-700 text-xs">{diff.advantage}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}

                                                    {/* 필요성 요약 */}
                                                    {pred.aiJudgeComparison.necessityReasoning && (
                                                        <div className="bg-indigo-50 rounded-lg p-3">
                                                            <p className="text-sm text-indigo-800 leading-relaxed">
                                                                💡 {pred.aiJudgeComparison.necessityReasoning}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* AI 사법 시스템 도입 현황 */}
                                                    {pred.aiJudgeComparison.aiJudgeStatus && (
                                                        <div className="border-t pt-4">
                                                            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1">
                                                                <span>🌍</span> AI 사법 시스템 도입 현황
                                                            </h4>
                                                            <div className="grid md:grid-cols-2 gap-3">
                                                                <div className="bg-blue-50 rounded-lg p-3">
                                                                    <p className="text-xs font-bold text-blue-800 mb-1">🇰🇷 한국</p>
                                                                    <p className="text-xs text-blue-700 leading-relaxed">{pred.aiJudgeComparison.aiJudgeStatus.korea}</p>
                                                                </div>
                                                                <div className="bg-green-50 rounded-lg p-3">
                                                                    <p className="text-xs font-bold text-green-800 mb-1">🌐 해외</p>
                                                                    <p className="text-xs text-green-700 leading-relaxed">{pred.aiJudgeComparison.aiJudgeStatus.global}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* 생성 시간 */}
                                        <p className="text-xs text-gray-400 text-center">
                                            AI 모델: {pred.model || (selectedAiModel === 'gemini' ? 'Gemini' : 'Claude')} |
                                            {pred.newsSourceCount ? ` 참조 뉴스: ${pred.newsSourceCount}건 |` : ''}
                                            {pred.generatedAt && ` 생성: ${pred.generatedAt.toDate ? pred.generatedAt.toDate().toLocaleDateString('ko-KR') : new Date(pred.generatedAt).toLocaleDateString('ko-KR')}`}
                                        </p>
                                    </>
                                );
                            })() : (
                                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                                    <div className="text-4xl mb-3">🔮</div>
                                    <h3 className="text-lg font-bold text-gray-700 mb-2">
                                        {selectedAiModel === 'gemini' ? 'Gemini' : 'Claude'} AI 양형 예측이 아직 생성되지 않았습니다
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {person.aiPrediction || person.claudePrediction ? (
                                            <>다른 AI 모델의 예측을 확인하려면 위 버튼을 전환해보세요.</>
                                        ) : (
                                            <>관리자 페이지에서 AI 양형 예측을 실행하면 이 탭에 결과가 표시됩니다.</>
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 자료 출처 */}
                    {person.sources && person.sources.length > 0 && (
                        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
                            <h3 className="text-lg font-bold mb-4">자료 출처</h3>
                            <div className="space-y-3">
                                {person.sources.map((src, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full whitespace-nowrap">{src.label}</span>
                                        <div className="flex-1">
                                            <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium">
                                                {src.title}
                                            </a>
                                            <p className="text-xs text-gray-400 mt-1">{src.date}</p>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                ))}
                            </div>
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
                            <button
                                onClick={shareToThreads}
                                className="w-12 h-12 flex items-center justify-center bg-black rounded-full hover:scale-110 transition-transform"
                                title="Threads"
                            >
                                <ThreadsIcon className="w-6 h-6 text-white" />
                            </button>
                            <button
                                onClick={shareToLinkedIn}
                                className="w-12 h-12 flex items-center justify-center bg-[#0A66C2] rounded-full hover:scale-110 transition-transform"
                                title="LinkedIn"
                            >
                                <LinkedInIcon className="w-6 h-6 text-white" />
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
