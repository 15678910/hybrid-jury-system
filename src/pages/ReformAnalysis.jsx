import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import SEOHead from '../components/SEOHead';
import SNSShareBar from '../components/SNSShareBar';
import { BILL_COMPARISON, KEY_ISSUES, OPPOSITION_VOICES, INTERNATIONAL_COMPARISON, DEMOCRATIZATION_SCORECARD, FINLAND_REFORM_BILL } from '../data/prosecutionReformData';

// 개혁안 뉴스 캐시 설정
const REFORM_NEWS_CACHE_KEY = 'reform_news_cache';
const REFORM_NEWS_CACHE_DURATION = 30 * 60 * 1000; // 30분

const getReformNewsCache = () => {
    try {
        const cached = localStorage.getItem(REFORM_NEWS_CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < REFORM_NEWS_CACHE_DURATION) {
                return data;
            }
        }
    } catch (e) { /* ignore */ }
    return null;
};

const setReformNewsCache = (data) => {
    try {
        localStorage.setItem(REFORM_NEWS_CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (e) { /* ignore */ }
};

// 개혁안 비교 데이터
const reformData = [
    {
        id: 'prosecution',
        title: '검찰 조직 개편',
        icon: '⚖️',
        description: '검찰청 폐지·중수청·공소청 신설, 수사사법관 제도, 보완수사권, 감시·견제 시스템 종합 비교',
        subsections: [
            {
                title: '조직 개편',
                icon: '🏗️',
                positions: [
                    {
                        stakeholder: '정부',
                        color: 'border-sky-500',
                        stance: '추진',
                        stanceColor: 'bg-blue-100 text-blue-700',
                        summary: '검찰청 폐지 → 중수청·공소청 신설',
                        details: [
                            '검찰청 폐지 및 중대범죄수사청(중수청) 신설, 공소청(기소 전담) 별도 설치',
                            '정부조직법 개정안 국회 통과 (2025년 9월, 1년 유예) → 2026년 9월 시행 목표',
                            '공소청의 보완수사권 최소화 — 기소 유지에 필요한 범위로 한정',
                            '중수청에 9대 중대범죄(부패·경제·공직자·선거·방위사업·대형참사·마약·내란외환·사이버) 직접수사 대상 규정'
                        ],
                        sources: [{name:'법률신문',url:'https://www.lawtimes.co.kr/news/211212'},{name:'한국일보',url:'https://www.hankookilbo.com/News/Read/A2025092614560004958'}]
                    },
                    {
                        stakeholder: '더불어민주당',
                        color: 'border-blue-800',
                        stance: '추진',
                        stanceColor: 'bg-blue-100 text-blue-700',
                        summary: '수사·기소 완전 분리, 검사 수사지휘권 폐지',
                        details: [
                            '수사·기소 완전 분리 원칙 입법 추진, 검사 수사지휘권 폐지',
                            '공소청법·중수청법 세부 입법 주도, 경찰 자율 수사 확대',
                            '보완수사권은 기소 유지 목적 최소 범위로 제한'
                        ],
                        sources: [{name:'경향신문',url:'https://www.khan.co.kr/article/202510011658001'}]
                    },
                    {
                        stakeholder: '국민의힘',
                        color: 'border-red-700',
                        stance: '반대',
                        stanceColor: 'bg-red-100 text-red-700',
                        summary: '검찰 조직 해체 반대, 보완수사권 유지 주장',
                        details: [
                            '검찰청 폐지는 성급한 결정, 검찰 수사권 원상 복구(검수원복) 주장',
                            '보완수사권 완전 박탈 시 공소 유지 불가 우려',
                            '수사 공백 및 강력범죄 대응 약화 우려',
                            '경찰 권한 비대화에 대한 견제 장치 부재'
                        ],
                        sources: [{name:'뉴스토마토',url:'https://www.newstomato.com/ReadNews.aspx?no=1273181'}]
                    },
                    {
                        stakeholder: '조국혁신당',
                        color: 'border-blue-500',
                        stance: '추진',
                        stanceColor: 'bg-blue-100 text-blue-700',
                        summary: "완전한 수사·기소 분리, 검찰을 '기소청'으로 전환",
                        details: [
                            '수사·기소 완전 분리 — 검찰 수사권 전면 폐지',
                            "검찰을 기소 전담 '기소청'으로 전환, 독립적 중수청 설치 지지",
                            '보완수사권도 원칙적으로 불인정 (경찰에 보완수사 요청 방식)'
                        ],
                        sources: [{name:'SBS뉴스',url:'https://news.sbs.co.kr/news/endPage.do?news_id=N1007588669'}]
                    },
                    {
                        stakeholder: '진보당',
                        color: 'border-rose-600',
                        stance: '추진',
                        stanceColor: 'bg-blue-100 text-blue-700',
                        summary: '수사·기소 분리 지지, 검찰개혁 후퇴 반대',
                        details: [
                            '수사·기소 완전 분리 원칙 지지',
                            '검찰개혁이 후퇴해서는 안 된다는 입장',
                            '정부안이 진정한 수사·기소 분리가 아니라고 비판'
                        ],
                        sources: [{name:'오마이뉴스',url:'https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003160926'}]
                    },
                    {
                        stakeholder: '기본소득당',
                        color: 'border-teal-500',
                        stance: '추진',
                        stanceColor: 'bg-blue-100 text-blue-700',
                        summary: '형사사법 시스템 개혁 지지, 경찰 민주적 통제 연계',
                        details: [
                            '형사사법 시스템 전반 개혁 필요성 인정',
                            '검찰개혁에 맞춰 경찰 민주적 통제 방안 병행 추진',
                            '진보 정당 연대 경찰법 개정안 공동발의'
                        ],
                        sources: [{name:'데일리비즈온',url:'https://www.dailybizon.com/news/articleView.html?idxno=59058'}]
                    },
                    {
                        stakeholder: '사회민주당',
                        color: 'border-pink-500',
                        stance: '조건부',
                        stanceColor: 'bg-yellow-100 text-yellow-700',
                        summary: '검찰 개혁 지지, 검찰권 남용 특별법 공동발의',
                        details: [
                            '검찰 개혁을 총선 공약으로 제시',
                            '검찰권 오남용 진상조사 특별법 공동발의',
                            '구체적 조직 개편안에 대한 세부 입장 미표명'
                        ],
                        sources: [{name:'뉴시스',url:'https://www.newsis.com/view/NISX20250710_0003247330'}]
                    },
                    {
                        stakeholder: '시민사회',
                        color: 'border-green-500',
                        stance: '추진',
                        stanceColor: 'bg-blue-100 text-blue-700',
                        summary: '수사·기소 분리 지지, 보완수사권 남용 방지 강조',
                        details: [
                            '수사·기소 분리 원칙 지지, 보완수사권 남용 방지 강조',
                            '독립적이고 투명한 수사기관 필요'
                        ],
                        sources: [{name:'한국NGO신문',url:'https://www.ngonews.kr/news/articleView.html?idxno=207813'}]
                    }
                ]
            },
            {
                title: '수사사법관 제도',
                icon: '🔍',
                positions: [
                    {
                        stakeholder: '정부',
                        color: 'border-sky-500',
                        stance: '추진',
                        stanceColor: 'bg-blue-100 text-blue-700',
                        summary: '중수청 내 수사사법관·전문수사관 이원 체계 도입',
                        details: [
                            '중수청 수사 인력을 수사사법관(변호사 자격)과 전문수사관으로 이원화',
                            '기관장·부서장 등 주요 보직에 수사사법관만 임용, 전문수사관을 지휘',
                            '약 3,000명 규모, 연간 2만~3만 건 처리 예상',
                            '봉욱 민정수석: "법률가 주도의 엄격한 이원 조직" 설계',
                            '검찰개혁추진단 자문위원 6인 사퇴 — 정부안에 자문 의견 미반영 비판'
                        ],
                        sources: [{name:'서울신문',url:'https://www.seoul.co.kr/news/newsView.php?id=20260113003003'},{name:'시사저널',url:'https://www.sisajournal.com/news/articleView.html?idxno=360135'}]
                    },
                    {
                        stakeholder: '더불어민주당',
                        color: 'border-blue-800',
                        stance: '조건부',
                        stanceColor: 'bg-yellow-100 text-yellow-700',
                        summary: '수사사법관 이원화에 수정 필요, 근본적 재설계 대두',
                        details: [
                            '수사사법관·전문수사관 이원화는 수정이 필요하다는 데 공감대',
                            '정청래 대표: "수사사법관 명칭에 오해의 소지가 있다"',
                            '자문위원 6인 사퇴에 따른 근본적 재설계 필요성 대두',
                            '수정안 재논의를 위한 정책의원총회 개최'
                        ],
                        sources: [{name:'뉴스1',url:'https://www.news1.kr/politics/assembly/6037586'}]
                    },
                    {
                        stakeholder: '국민의힘',
                        color: 'border-red-700',
                        stance: '반대',
                        stanceColor: 'bg-red-100 text-red-700',
                        summary: '검찰청 폐지·중수청 신설 자체를 반대',
                        details: [
                            '검찰청 폐지·중수청 신설 자체에 반대',
                            '공수처 폐지 법안 발의',
                            '수사·기소 분리 전반에 반대 입장'
                        ],
                        sources: [{name:'아주경제',url:'https://www.ajunews.com/view/20251027140322705'}]
                    },
                    {
                        stakeholder: '조국혁신당',
                        color: 'border-blue-500',
                        stance: '반대',
                        stanceColor: 'bg-red-100 text-red-700',
                        summary: '"제2의 검찰청" 경고 — 이원화 폐지, 일원 조직 주장',
                        details: [
                            '조국 대표: "검사가 명찰만 수사사법관으로 바꿔 다는 것" — 이원화 폐지, 일원 조직 주장',
                            '"중수청이 제2의 검찰청이 되면 공소청 검사와 카르텔 형성 우려"',
                            '정부안은 "개혁이 아니라 개악", "대검 중수부의 전국 조직 부활" 경고'
                        ],
                        sources: [{name:'오마이뉴스',url:'https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003198211'},{name:'시사저널',url:'https://www.sisajournal.com/news/articleView.html?idxno=359096'}]
                    },
                    {
                        stakeholder: '진보당',
                        color: 'border-rose-600',
                        stance: '미정',
                        stanceColor: 'bg-gray-100 text-gray-600',
                        summary: '공식 입장 미표명',
                        details: [
                            '수사사법관 제도에 대한 공식 입장 미표명'
                        ],
                        sources: [{name:'오마이뉴스',url:'https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003198367'}]
                    },
                    {
                        stakeholder: '기본소득당',
                        color: 'border-teal-500',
                        stance: '미정',
                        stanceColor: 'bg-gray-100 text-gray-600',
                        summary: '공식 입장 미표명',
                        details: [
                            '수사사법관 제도에 대한 공식 입장 미표명'
                        ],
                        sources: [{name:'데일리비즈온',url:'https://www.dailybizon.com/news/articleView.html?idxno=59058'}]
                    },
                    {
                        stakeholder: '사회민주당',
                        color: 'border-pink-500',
                        stance: '미정',
                        stanceColor: 'bg-gray-100 text-gray-600',
                        summary: '공식 입장 미표명',
                        details: [
                            '수사사법관 제도에 대한 공식 입장 미표명'
                        ],
                        sources: [{name:'뉴시스',url:'https://www.newsis.com/view/NISX20250710_0003247330'}]
                    },
                    {
                        stakeholder: '시민사회',
                        color: 'border-green-500',
                        stance: '반대',
                        stanceColor: 'bg-red-100 text-red-700',
                        summary: '검찰 권한 재생산 우려 — 자문위원 6인 동반 사퇴',
                        details: [
                            '검찰개혁추진단 자문위원 6인 동반 사퇴로 항의',
                            '한상희 교수: "검찰을 2022년 이전 체제로 복사해 놓은 것"',
                            '수사사법관 제도가 검찰 권한 재생산 구조라 비판'
                        ],
                        sources: [{name:'법률신문',url:'https://www.lawtimes.co.kr/news/214965'},{name:'경향신문',url:'https://www.khan.co.kr/article/202601141558001'}]
                    }
                ]
            },
            {
                title: '감시·견제 시스템',
                icon: '🛡️',
                positions: [
                    {
                        stakeholder: '정부',
                        color: 'border-sky-500',
                        stance: '추진',
                        stanceColor: 'bg-blue-100 text-blue-700',
                        summary: '사건심의위원회·검사 정치관여 처벌·중수청장 인사청문',
                        details: [
                            '고등공소청 내 외부 인사 참여 사건심의위원회 설치 — 영장 청구·기소 여부에 시민 의견 반영',
                            '검사의 정치 관여 행위에 대한 형사 처벌 규정 신설',
                            '중수청장은 2년 단임 차관급, 대통령 지명·국회 인사청문 거쳐 임명',
                            '중수청 수사 개시 시 공소청에 통보 의무, 공소청의 수사관 교체 요구권',
                            '장관 지휘권 행사 시 서면 기록·공개 의무화'
                        ],
                        sources: [{name:'법률신문',url:'https://www.lawtimes.co.kr/news/211212'}]
                    },
                    {
                        stakeholder: '더불어민주당',
                        color: 'border-blue-800',
                        stance: '추진',
                        stanceColor: 'bg-blue-100 text-blue-700',
                        summary: '국가수사위원회 신설, 공소청의 사법적 통제 기능 강화',
                        details: [
                            '국무총리 직속 국가수사위원회 신설 추진 (장경태 의원안)',
                            '공소청을 기소 판단 + 사법적 통제 기관으로 위상 정립',
                            '3대 수사기관(중수청·공수처·국수본) 상호 견제 체계 구축',
                            '불송치 사건에 대한 피해자 이의신청 → 검사 통제 유지'
                        ],
                        sources: [{name:'뉴시스',url:'https://www.newsis.com/view/NISX20250924_0003342587'}]
                    },
                    {
                        stakeholder: '국민의힘',
                        color: 'border-red-700',
                        stance: '반대',
                        stanceColor: 'bg-red-100 text-red-700',
                        summary: '수사기관 옥상옥 우려, 기존 검찰 체계 유지 주장',
                        details: [
                            '중수청·공수처·국수본 등 수사기관 난립으로 옥상옥 우려',
                            '별도 감시기구 신설은 행정 비효율 초래',
                            '기존 검찰 지휘 체계가 효율적 견제 수단이라는 입장'
                        ],
                        sources: [{name:'아주경제',url:'https://www.ajunews.com/view/20251027140322705'}]
                    },
                    {
                        stakeholder: '조국혁신당',
                        color: 'border-blue-500',
                        stance: '조건부',
                        stanceColor: 'bg-yellow-100 text-yellow-700',
                        summary: '기소심의위원회 설치, 실질적 시민 통제 강조',
                        details: [
                            '공소청 기소권에 대한 시민 통제를 위한 기소심의위원회 설치 제안',
                            '형식적 자문 위원회가 아닌 실질적 의결 권한 부여 필요',
                            '수사기관에 대한 국회 차원의 상시 감시 체계 구축',
                            '정부안의 사건심의위원회는 권한이 불충분하다고 비판'
                        ],
                        sources: [{name:'시사저널',url:'https://www.sisajournal.com/news/articleView.html?idxno=338446'}]
                    },
                    {
                        stakeholder: '진보당',
                        color: 'border-rose-600',
                        stance: '미정',
                        stanceColor: 'bg-gray-100 text-gray-600',
                        summary: '공식 입장 미표명',
                        details: [
                            '감시·견제 시스템에 대한 공식 입장 미표명'
                        ],
                        sources: [{name:'오마이뉴스',url:'https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003160926'}]
                    },
                    {
                        stakeholder: '기본소득당',
                        color: 'border-teal-500',
                        stance: '미정',
                        stanceColor: 'bg-gray-100 text-gray-600',
                        summary: '공식 입장 미표명',
                        details: [
                            '감시·견제 시스템에 대한 공식 입장 미표명'
                        ],
                        sources: [{name:'데일리비즈온',url:'https://www.dailybizon.com/news/articleView.html?idxno=59058'}]
                    },
                    {
                        stakeholder: '사회민주당',
                        color: 'border-pink-500',
                        stance: '미정',
                        stanceColor: 'bg-gray-100 text-gray-600',
                        summary: '공식 입장 미표명',
                        details: [
                            '감시·견제 시스템에 대한 공식 입장 미표명'
                        ],
                        sources: [{name:'뉴시스',url:'https://www.newsis.com/view/NISX20250710_0003247330'}]
                    },
                    {
                        stakeholder: '시민사회',
                        color: 'border-green-500',
                        stance: '조건부',
                        stanceColor: 'bg-yellow-100 text-yellow-700',
                        summary: '실질적 감시 권한 부여 요구 — 형식적 위원회 반대',
                        details: [
                            '형식적·자문적 위원회 설치만으로는 견제 불가능',
                            '독립적 수사심의위원회에 실질적 의결·권고 권한 부여 필요',
                            '시민 참여 감시 기구에 수사 중단·시정 권고권 부여 요구',
                            '장관 지휘권 남용 방지를 위한 투명성 장치(서면 기록·실시간 공개·국회 보고) 필수',
                            '권력 분산과 민주적 통제가 결합된 장기적 수사 거버넌스 설계 촉구'
                        ],
                        sources: [{name:'한국NGO신문',url:'https://www.ngonews.kr/news/articleView.html?idxno=207813'}]
                    }
                ]
            }
        ]
    },
    {
        id: 'prosecution-reform',
        title: '검찰개혁 심층분석',
        icon: '🔬',
        description: '공소청법·중수청법 법안 분석, 수사·기소 분리 실현 평가, 국제 비교를 통한 검찰 민주화 종합 평가',
        customRender: true
    },
    {
        id: 'finland-reform',
        title: '핀란드식 사법개혁안',
        icon: '🇫🇮',
        description: '핀란드 모델을 벤치마킹한 이상적 사법개혁 법률안 - 수사·기소 완전 분리, 참심제, 이중 감시 체계',
        customRender: true
    },
    {
        id: 'supreme-court',
        title: '대법원 구성',
        icon: '🏛️',
        description: '대법관 14명→26명 증원 및 대법원 구조 개편',
        positions: [
            {
                stakeholder: '정부',
                color: 'border-sky-500',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '별도 입장 미표명, 여당 입법에 협조',
                details: [
                    '대법원 구성 변경에 대한 별도 정부안 없음',
                    '여당 주도 입법에 협조적 입장'
                ],
                sources: [{name:'한국경제',url:'https://www.hankyung.com/article/2025090669877'}]
            },
            {
                stakeholder: '더불어민주당',
                color: 'border-blue-800',
                stance: '추진',
                stanceColor: 'bg-blue-100 text-blue-700',
                summary: '대법관 26명 증원, 6개 소부+2개 합의부 신설',
                details: [
                    '대법관 14명에서 26명으로 증원',
                    '6개 소부 + 2개 합의부 신설',
                    '3년간 단계적 확대 (연 4명씩 추가)',
                    '상고심 재판 지연 해소 목적',
                    '대통령이 임기 중 22명 임명 가능'
                ],
                sources: [{name:'뉴스1',url:'https://www.news1.kr/politics/assembly/5947017'},{name:'한국경제',url:'https://www.hankyung.com/article/2025090669877'}]
            },
            {
                stakeholder: '국민의힘',
                color: 'border-red-700',
                stance: '반대',
                stanceColor: 'bg-red-100 text-red-700',
                summary: '사법부 정치화 우려, 사법독립 침해',
                details: [
                    '사법부 정치화 우려',
                    '사법독립 침해 가능성',
                    '증원보다 기존 시스템 효율화 우선'
                ],
                sources: [{name:'뉴스1',url:'https://www.news1.kr/politics/assembly/5947017'}]
            },
            {
                stakeholder: '조국혁신당',
                color: 'border-blue-500',
                stance: '조건부',
                stanceColor: 'bg-yellow-100 text-yellow-700',
                summary: '증원 원칙 동의, 구체적 규모는 논의 필요',
                details: [
                    '대법관 증원 원칙에는 동의',
                    '구체적인 증원 규모는 추가 논의 필요',
                    '대법관 추천 방식 다양화 필요'
                ],
                sources: [{name:'한국경제',url:'https://www.hankyung.com/article/2025090669877'}]
            },
            {
                stakeholder: '진보당',
                color: 'border-rose-600',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '공식 입장 미표명',
                details: [
                    '대법관 증원에 대한 공식 입장 미표명'
                ],
                sources: [{name:'오마이뉴스',url:'https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003160926'}]
            },
            {
                stakeholder: '기본소득당',
                color: 'border-teal-500',
                stance: '추진',
                stanceColor: 'bg-blue-100 text-blue-700',
                summary: '대법관 증원 적극 지지, 신속 재판·다양성 확보',
                details: [
                    '대법관 증원은 수십 년간 제기된 과제',
                    '신속한 재판과 다양성 확보를 위해 빠른 추진 촉구',
                    '사법개혁안 당론에 포함'
                ],
                sources: [{name:'데일리비즈온',url:'https://www.dailybizon.com/news/articleView.html?idxno=59138'}]
            },
            {
                stakeholder: '사회민주당',
                color: 'border-pink-500',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '공식 입장 미표명',
                details: [
                    '대법관 증원에 대한 공식 입장 미표명',
                    '대법원 세종 이전 추진 과정에서 증원 가능성 언급'
                ],
                sources: [{name:'전매일보',url:'https://www.jeonmae.co.kr/news/articleView.html?idxno=1202348'}]
            },
            {
                stakeholder: '시민사회',
                color: 'border-green-500',
                stance: '조건부',
                stanceColor: 'bg-yellow-100 text-yellow-700',
                summary: '증원 자체보다 다양성 확보가 핵심',
                details: [
                    '단순 증원보다 다양성 확보가 핵심',
                    '비법관 출신 대법관 임명 확대',
                    '대법관 추천 과정 투명성 강화'
                ],
                sources: [{name:'한국경제',url:'https://www.hankyung.com/article/2025090669877'}]
            }
        ]
    },
    {
        id: 'law-distortion',
        title: '법왜곡죄',
        icon: '📜',
        description: '법관·검사의 고의적 법률 왜곡 행위를 처벌하는 범죄 신설',
        positions: [
            {
                stakeholder: '정부',
                color: 'border-sky-500',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '별도 정부안 없음, 입법부 논의 지켜보는 중',
                details: [
                    '법왜곡죄에 대한 별도 정부안 없음',
                    '국회 입법 논의 과정 지켜보는 입장'
                ],
                sources: [{name:'서울신문',url:'https://www.seoul.co.kr/news/politics/2025/12/25/20251225003002'}]
            },
            {
                stakeholder: '더불어민주당',
                color: 'border-blue-800',
                stance: '추진',
                stanceColor: 'bg-blue-100 text-blue-700',
                summary: '법왜곡죄 신설, 10년 이하 징역 또는 자격정지',
                details: [
                    '법왜곡죄 신설 추진 (22대 국회 재발의)',
                    '10년 이하 징역 또는 자격정지',
                    '증거 은폐·조작·사실 왜곡 처벌',
                    '법관·검사의 직무 남용 방지',
                    '설 연휴 전 법사위 처리 목표'
                ],
                sources: [{name:'법률신문',url:'https://www.lawtimes.co.kr/news/202623'},{name:'헤럴드경제',url:'https://biz.heraldcorp.com/article/10639482'}]
            },
            {
                stakeholder: '국민의힘',
                color: 'border-red-700',
                stance: '반대',
                stanceColor: 'bg-red-100 text-red-700',
                summary: '수사 위축, 허위고소 남용 우려, 사법독립 침해',
                details: [
                    '수사 위축 효과 우려',
                    '허위고소 남용 가능성',
                    '사법독립 침해 우려',
                    '기존 법체계로 충분히 대응 가능'
                ],
                sources: [{name:'서울신문',url:'https://www.seoul.co.kr/news/politics/2025/12/25/20251225003002'}]
            },
            {
                stakeholder: '조국혁신당',
                color: 'border-blue-500',
                stance: '추진',
                stanceColor: 'bg-blue-100 text-blue-700',
                summary: '법관·검사 책임 강화 필요',
                details: [
                    '법관·검사의 직무상 책임 강화 필요',
                    '고의적 법률 왜곡에 대한 처벌 규정 지지',
                    '사법 불신 해소를 위한 제도적 장치'
                ],
                sources: [{name:'법률저널',url:'https://www.lawfact.co.kr/news_view.jsp?ncd=4003'}]
            },
            {
                stakeholder: '진보당',
                color: 'border-rose-600',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '공식 입장 미표명',
                details: [
                    '법왜곡죄에 대한 공식 입장 미표명'
                ],
                sources: [{name:'오마이뉴스',url:'https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003160926'}]
            },
            {
                stakeholder: '기본소득당',
                color: 'border-teal-500',
                stance: '추진',
                stanceColor: 'bg-blue-100 text-blue-700',
                summary: '사법개혁안 당론에 포함',
                details: [
                    '법왜곡죄 도입을 사법개혁안 당론에 포함',
                    '법관·검사의 직무 책임 강화 방향 지지'
                ],
                sources: [{name:'데일리비즈온',url:'https://www.dailybizon.com/news/articleView.html?idxno=59138'}]
            },
            {
                stakeholder: '사회민주당',
                color: 'border-pink-500',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '공식 입장 미표명',
                details: [
                    '법왜곡죄에 대한 공식 입장 미표명'
                ],
                sources: [{name:'뉴시스',url:'https://www.newsis.com/view/NISX20250710_0003247330'}]
            },
            {
                stakeholder: '시민사회',
                color: 'border-green-500',
                stance: '조건부',
                stanceColor: 'bg-yellow-100 text-yellow-700',
                summary: '취지 공감, 남용 방지 장치 필요',
                details: [
                    '법왜곡죄 신설 취지에 공감',
                    '남용 방지를 위한 제도적 장치 필요',
                    '고의성 입증 기준 명확화 필요'
                ],
                sources: [{name:'법률신문',url:'https://www.lawtimes.co.kr/news/202623'}]
            }
        ]
    },
    {
        id: 'judicial-appeal',
        title: '재판소원제',
        icon: '🔨',
        description: '일반 법원 판결에 대한 헌법재판소 위헌 심사 허용',
        positions: [
            {
                stakeholder: '정부',
                color: 'border-sky-500',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '별도 정부안 없음, 공론화 과정 지켜보는 중',
                details: [
                    '재판소원제에 대한 별도 정부안 없음',
                    '헌법 개정 사항으로 신중한 접근'
                ],
                sources: [{name:'법률신문',url:'https://www.lawtimes.co.kr/news/212733'}]
            },
            {
                stakeholder: '더불어민주당',
                color: 'border-blue-800',
                stance: '추진',
                stanceColor: 'bg-blue-100 text-blue-700',
                summary: '재판소원제 공론화 추진, 기본권 보장 강화',
                details: [
                    '재판소원제 도입 공론화 추진',
                    '기본권 보장 강화 목적',
                    '헌법재판소의 위헌 심사 확대',
                    '법사위에서 본격 논의 추진'
                ],
                sources: [{name:'뉴스1',url:'https://www.news1.kr/politics/assembly/5947017'},{name:'법률신문',url:'https://www.lawtimes.co.kr/news/212733'}]
            },
            {
                stakeholder: '국민의힘',
                color: 'border-red-700',
                stance: '반대',
                stanceColor: 'bg-red-100 text-red-700',
                summary: '소송 지옥 우려, 사법체계 혼란',
                details: [
                    '소송 지옥 우려 (재판 장기화)',
                    '사법체계 혼란 가능성',
                    '법원과 헌법재판소 간 충돌 우려'
                ],
                sources: [{name:'법률신문',url:'https://www.lawtimes.co.kr/news/212733'}]
            },
            {
                stakeholder: '조국혁신당',
                color: 'border-blue-500',
                stance: '추진',
                stanceColor: 'bg-blue-100 text-blue-700',
                summary: '헌법적 기본권 보호 필요',
                details: [
                    '헌법적 기본권 보호 필요',
                    '법원 판결에 대한 헌법적 통제 강화',
                    '국민의 기본권 구제 범위 확대'
                ],
                sources: [{name:'법률신문',url:'https://www.lawtimes.co.kr/news/212733'}]
            },
            {
                stakeholder: '진보당',
                color: 'border-rose-600',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '공식 입장 미표명',
                details: [
                    '재판소원제에 대한 공식 입장 미표명'
                ],
                sources: [{name:'오마이뉴스',url:'https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003160926'}]
            },
            {
                stakeholder: '기본소득당',
                color: 'border-teal-500',
                stance: '추진',
                stanceColor: 'bg-blue-100 text-blue-700',
                summary: '사법개혁안 당론에 포함',
                details: [
                    '재판소원제 도입을 사법개혁안 당론에 포함',
                    '법원 판결에 대한 헌법적 통제 확대 방향'
                ],
                sources: [{name:'데일리비즈온',url:'https://www.dailybizon.com/news/articleView.html?idxno=59138'}]
            },
            {
                stakeholder: '사회민주당',
                color: 'border-pink-500',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '공식 입장 미표명',
                details: [
                    '재판소원제에 대한 공식 입장 미표명'
                ],
                sources: [{name:'뉴시스',url:'https://www.newsis.com/view/NISX20250710_0003247330'}]
            },
            {
                stakeholder: '시민사회',
                color: 'border-green-500',
                stance: '조건부',
                stanceColor: 'bg-yellow-100 text-yellow-700',
                summary: '필요성 인정하나 제도 설계 신중해야',
                details: [
                    '재판소원제 필요성은 인정',
                    '제도 설계에 신중한 접근 필요',
                    '남용 방지 및 사법 효율성 보장 방안 마련 필요'
                ],
                sources: [{name:'법률신문',url:'https://www.lawtimes.co.kr/news/212733'}]
            }
        ]
    },
    {
        id: 'court-admin',
        title: '법원행정처 개혁',
        icon: '🏢',
        description: '법원행정처 폐지 및 사법행정위원회 신설',
        positions: [
            {
                stakeholder: '정부',
                color: 'border-sky-500',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '별도 정부안 없음, 사법부 자율 개혁 기대',
                details: [
                    '법원행정처 개혁에 대한 별도 정부안 없음',
                    '사법부 자율적 개혁 기대 입장'
                ],
                sources: [{name:'아주경제',url:'https://www.ajunews.com/view/20251125161923638'}]
            },
            {
                stakeholder: '더불어민주당',
                color: 'border-blue-800',
                stance: '추진',
                stanceColor: 'bg-blue-100 text-blue-700',
                summary: '법원행정처 폐지, 사법행정위 신설 (13명 위원, 비법관 포함)',
                details: [
                    '법원행정처 폐지 법안 발의',
                    '사법행정위원회 신설 (13명 위원)',
                    '장관급 위원장 1명 (비법관, 전국법관회의 추천)',
                    '비법관 위원 7~9명 포함으로 다양성 확보',
                    '인사·징계·예산·회계 권한 부여',
                    '판사 관료화 방지'
                ],
                sources: [{name:'아주경제',url:'https://www.ajunews.com/view/20251125161923638'},{name:'민들레',url:'https://www.mindlenews.com/news/articleView.html?idxno=16305'}]
            },
            {
                stakeholder: '국민의힘',
                color: 'border-red-700',
                stance: '반대',
                stanceColor: 'bg-red-100 text-red-700',
                summary: '사법부 자율성 침해, 외부 개입 우려',
                details: [
                    '사법부 자율성 침해 우려',
                    '외부 개입으로 사법독립 훼손',
                    '기존 시스템 개선으로 충분'
                ],
                sources: [{name:'아주경제',url:'https://www.ajunews.com/view/20251125161923638'}]
            },
            {
                stakeholder: '조국혁신당',
                color: 'border-blue-500',
                stance: '추진',
                stanceColor: 'bg-blue-100 text-blue-700',
                summary: '사법행정 민주화',
                details: [
                    '사법행정 민주화 필요',
                    '법원행정처 폐지 지지',
                    '판사 인사 독립성 확보'
                ],
                sources: [{name:'민들레',url:'https://www.mindlenews.com/news/articleView.html?idxno=16305'}]
            },
            {
                stakeholder: '진보당',
                color: 'border-rose-600',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '공식 입장 미표명',
                details: [
                    '법원행정처 개혁에 대한 공식 입장 미표명'
                ],
                sources: [{name:'오마이뉴스',url:'https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003160926'}]
            },
            {
                stakeholder: '기본소득당',
                color: 'border-teal-500',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '공식 입장 미표명',
                details: [
                    '법원행정처 개혁에 대한 공식 입장 미표명'
                ],
                sources: [{name:'데일리비즈온',url:'https://www.dailybizon.com/news/articleView.html?idxno=59138'}]
            },
            {
                stakeholder: '사회민주당',
                color: 'border-pink-500',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '공식 입장 미표명',
                details: [
                    '법원행정처 개혁에 대한 공식 입장 미표명',
                    '사법부에 대한 국민 견제 강화 필요성은 강조'
                ],
                sources: [{name:'전매일보',url:'https://www.jeonmae.co.kr/news/articleView.html?idxno=1202348'}]
            },
            {
                stakeholder: '시민사회',
                color: 'border-green-500',
                stance: '추진',
                stanceColor: 'bg-blue-100 text-blue-700',
                summary: '법원행정처 폐지, 민주적 사법행정기구 설치',
                details: [
                    '법원행정처 폐지 지지',
                    '민주적 사법행정기구 설치 요구',
                    '투명한 정보공개 및 시민 참여 보장'
                ],
                sources: [{name:'민들레',url:'https://www.mindlenews.com/news/articleView.html?idxno=16305'}]
            }
        ]
    },
    {
        id: 'judge-personnel',
        title: '법관 인사제도',
        icon: '👤',
        description: '법관 임용·승진·평가 제도 개혁',
        positions: [
            {
                stakeholder: '정부',
                color: 'border-sky-500',
                stance: '조건부',
                stanceColor: 'bg-yellow-100 text-yellow-700',
                summary: '법관 경력요건 10년 적용 (2026년~)',
                details: [
                    '2026년부터 법관 경력요건 10년 적용',
                    '법조일원화 제도 정착 지원'
                ],
                sources: [{name:'뉴시스',url:'https://www.newsis.com/view/NISX20240916_0002889900'}]
            },
            {
                stakeholder: '더불어민주당',
                color: 'border-blue-800',
                stance: '추진',
                stanceColor: 'bg-blue-100 text-blue-700',
                summary: '대법관 추천위 다양화, 법관 평가제 도입',
                details: [
                    '대법관 추천위원회 구성 다양화',
                    '법관 평가제 도입 추진',
                    '하급심 판결 공개 확대',
                    '영장전담판사 사전심문제 도입'
                ],
                sources: [{name:'뉴시스',url:'https://www.newsis.com/view/NISX20240916_0002889900'}]
            },
            {
                stakeholder: '국민의힘',
                color: 'border-red-700',
                stance: '반대',
                stanceColor: 'bg-red-100 text-red-700',
                summary: '사법부 인사 독립 필요',
                details: [
                    '사법부 인사 독립성 보장 필요',
                    '외부 개입으로 인한 사법 정치화 우려',
                    '법관 평가제는 재판 독립성 저해 가능성'
                ],
                sources: [{name:'경향신문',url:'https://www.khan.co.kr/article/202412051130021'}]
            },
            {
                stakeholder: '조국혁신당',
                color: 'border-blue-500',
                stance: '조건부',
                stanceColor: 'bg-yellow-100 text-yellow-700',
                summary: '법조일원화 정착 지지',
                details: [
                    '법조일원화 정착 지지',
                    '다양한 경력의 법관 임용 확대',
                    '법관 인사 투명성 강화'
                ],
                sources: [{name:'뉴시스',url:'https://www.newsis.com/view/NISX20240916_0002889900'}]
            },
            {
                stakeholder: '진보당',
                color: 'border-rose-600',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '공식 입장 미표명',
                details: [
                    '법관 인사제도에 대한 공식 입장 미표명'
                ],
                sources: [{name:'오마이뉴스',url:'https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003160926'}]
            },
            {
                stakeholder: '기본소득당',
                color: 'border-teal-500',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '공식 입장 미표명',
                details: [
                    '법관 인사제도에 대한 공식 입장 미표명'
                ],
                sources: [{name:'데일리비즈온',url:'https://www.dailybizon.com/news/articleView.html?idxno=59138'}]
            },
            {
                stakeholder: '사회민주당',
                color: 'border-pink-500',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '공식 입장 미표명',
                details: [
                    '법관 인사제도에 대한 공식 입장 미표명'
                ],
                sources: [{name:'뉴시스',url:'https://www.newsis.com/view/NISX20250710_0003247330'}]
            },
            {
                stakeholder: '시민사회',
                color: 'border-green-500',
                stance: '추진',
                stanceColor: 'bg-blue-100 text-blue-700',
                summary: '고등법원 부장판사 승진제 폐지, 법조일원화',
                details: [
                    '고등법원 부장판사 승진제 폐지',
                    '법조일원화 정착 촉구',
                    '2026년부터 법관 경력요건 10년 적용'
                ],
                sources: [{name:'경향신문',url:'https://www.khan.co.kr/article/202412051130021'}]
            }
        ]
    },
    {
        id: 'citizen-trial',
        title: '국민참여재판 확대',
        icon: '👥',
        description: '국민참여재판 적용 범위 확대 및 평결 효력 강화',
        positions: [
            {
                stakeholder: '정부',
                color: 'border-sky-500',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '구체적 정부안 없음',
                details: [
                    '국민참여재판 확대에 대한 구체적 정부안 없음',
                    '입법부 논의 추이 관망'
                ],
                sources: [{name:'법률신문',url:'https://www.lawtimes.co.kr/news/212733'}]
            },
            {
                stakeholder: '더불어민주당',
                color: 'border-blue-800',
                stance: '추진',
                stanceColor: 'bg-blue-100 text-blue-700',
                summary: '국민참여재판 확대 법안 발의',
                details: [
                    '국민참여재판 대상 사건 확대 법안 발의 (정성호·백혜련 의원)',
                    '고의 살인 사건 필수 적용 추진',
                    '배심원 성별·연령 무작위 선정 제도화'
                ],
                sources: [{name:'법률신문',url:'https://www.lawtimes.co.kr/news/180979'},{name:'주간경향',url:'https://weekly.khan.co.kr/article/202508151439001'}]
            },
            {
                stakeholder: '국민의힘',
                color: 'border-red-700',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '공식 입장 미표명',
                details: [
                    '국민참여재판 확대에 대한 공식 입장 미표명',
                    '당론 내 다양한 의견 존재'
                ],
                sources: [{name:'법률신문',url:'https://www.lawtimes.co.kr/news/212733'}]
            },
            {
                stakeholder: '조국혁신당',
                color: 'border-blue-500',
                stance: '추진',
                stanceColor: 'bg-blue-100 text-blue-700',
                summary: '국민참여재판 확대 추진',
                details: [
                    '국민참여재판(배심제도) 확대 방안 추진',
                    '참여재판 개시 요건 완화 추진',
                    '사법개혁 로드맵에 포함 (2024.05.29 발표)'
                ],
                sources: [{name:'서울경제',url:'https://www.sedaily.com/NewsView/2GSZJ3354C'}]
            },
            {
                stakeholder: '진보당',
                color: 'border-rose-600',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '공식 입장 미표명',
                details: [
                    '국민참여재판 확대에 대한 공식 입장 미표명'
                ],
                sources: [{name:'오마이뉴스',url:'https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003160926'}]
            },
            {
                stakeholder: '기본소득당',
                color: 'border-teal-500',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '공식 입장 미표명',
                details: [
                    '국민참여재판 확대에 대한 공식 입장 미표명'
                ],
                sources: [{name:'데일리비즈온',url:'https://www.dailybizon.com/news/articleView.html?idxno=59138'}]
            },
            {
                stakeholder: '사회민주당',
                color: 'border-pink-500',
                stance: '미정',
                stanceColor: 'bg-gray-100 text-gray-600',
                summary: '공식 입장 미표명',
                details: [
                    '국민참여재판 확대에 대한 공식 입장 미표명'
                ],
                sources: [{name:'뉴시스',url:'https://www.newsis.com/view/NISX20250710_0003247330'}]
            },
            {
                stakeholder: '시민사회',
                color: 'border-green-500',
                stance: '추진',
                stanceColor: 'bg-blue-100 text-blue-700',
                summary: '단독판사 사건 확대, 무죄 평결 시 항소 제한',
                details: [
                    '단독판사 사건으로 적용 범위 확대',
                    '만장일치 무죄 시 검사 항소 제한',
                    '고의 살인 사건 필수 적용',
                    '평결 효력 강화 (권고적 → 구속력 부여)'
                ],
                sources: [{name:'법률신문',url:'https://www.lawtimes.co.kr/news/212733'}]
            }
        ]
    }
];

// AI 법안 위험도 분석 데이터
const REFORM_RISK_ANALYSIS = {
    prosecution: {
        overallRisk: 'high',
        overallScore: 8,
        title: '검찰개혁',
        clauses: [
            {
                clause: '검찰 기소독점주의 폐지',
                risk: 'high', score: 9,
                constitutionalIssues: ['헌법 제12조 적법절차 원칙과의 충돌 가능성', '검찰의 헌법상 지위(법률로 설치된 기관) 변경 시 개헌 필요 여부'],
                implementationChallenges: ['대안 기소 기관 설립 및 인력 확보에 3~5년 소요', '기소 품질 저하 및 무혐의 기소 증가 우려'],
                internationalPrecedents: ['일본: 검찰심사회(시민 기소 심사) 운영', '독일: 기소법정주의 채택, 검찰 재량 제한']
            },
            {
                clause: '검찰 수사권 완전 분리',
                risk: 'medium', score: 6,
                constitutionalIssues: ['수사와 기소의 분리가 효율적 형사사법 운영에 미치는 영향'],
                implementationChallenges: ['경찰-검찰 간 수사 지휘 체계 재정립 필요', '특수 범죄(부패, 경제) 수사 전문성 유지 방안'],
                internationalPrecedents: ['영국: 경찰 수사 + CPS 기소 분리 모델', '프랑스: 예심판사 제도로 수사 감독']
            }
        ]
    },
    'prosecution-reform': {
        overallRisk: 'high',
        overallScore: 7,
        title: '검찰개혁 법안',
        clauses: [
            {
                clause: '공소청 보완수사요구권',
                risk: 'high', score: 8,
                constitutionalIssues: ['수사권 없는 기소기관의 보완수사 요구가 사실상 수사지휘로 작동할 가능성', '수사·기소 분리 원칙과의 모순'],
                implementationChallenges: ['보완수사 요구의 범위·한계 기준 모호', '중수청·경찰과의 수사 협력 시 갈등 발생 예상'],
                internationalPrecedents: ['핀란드: 검찰이 수사에 일체 불개입, 기소 여부만 결정', '독일: 검찰이 수사를 주도하되 기소법정주의로 재량 제한']
            },
            {
                clause: '중수청 정치적 독립성',
                risk: 'high', score: 7,
                constitutionalIssues: ['행안부장관 소속으로 행정부 정치적 영향 불가피', '청장 임기 2년은 독립적 수사 리더십 구축에 불충분'],
                implementationChallenges: ['후보추천위 9명의 정치적 중립성 담보 방안 부재', '정권 교체 시 수사 독립성 보장 메커니즘 없음'],
                internationalPrecedents: ['일본: 법무대신의 개별 사건 지휘 불행사 관행으로 실질적 독립', '핀란드: 검찰총장 독립적 지위로 정치적 간섭 원천 차단']
            },
            {
                clause: '검찰총장 명칭 유지 문제',
                risk: 'medium', score: 6,
                constitutionalIssues: ['헌법 제89조 제16호의 "검찰총장" 명칭 → 헌법 개정 없이 조직 본질 변경 가능한지 논란', '명칭 유지가 기존 검찰 권위·문화 존속의 상징'],
                implementationChallenges: ['국민 인식에서 "공소청 = 검찰" 동일시 우려', '조직 문화 혁신의 걸림돌로 작용 가능'],
                internationalPrecedents: ['독일: 검찰청(Staatsanwaltschaft) 명칭 유지하되 기소법정주의로 본질 변경', '핀란드: 검찰청(Syyttäjälaitos) 독자 명칭으로 완전히 새로운 조직 정체성 확립']
            },
            {
                clause: '시민 통제 메커니즘 부재',
                risk: 'high', score: 8,
                constitutionalIssues: ['검찰 권한에 대한 민주적 통제의 헌법적 요청', '국민주권 원리에 부합하는 시민 참여 장치의 필요성'],
                implementationChallenges: ['일본식 검찰심사회 도입 시 법 제도 전면 개편 필요', '시민 참여 기구의 전문성·실효성 확보 방안'],
                internationalPrecedents: ['일본: 시민 11명 검찰심사회, 2회 기소상당 의결 시 강제기소', '독일: 참심제로 시민이 재판 과정에서 검찰 기소를 사법적으로 통제']
            }
        ]
    },
    'supreme-court': {
        overallRisk: 'high',
        overallScore: 8,
        title: '대법원 개혁',
        clauses: [
            {
                clause: '대법관 임명 방식 변경',
                risk: 'high', score: 8,
                constitutionalIssues: ['헌법 제104조(대법관 임명) 개정 필요', '사법부 독립성과 민주적 정당성의 균형'],
                implementationChallenges: ['국민 참여형 추천위원회 구성의 정치적 중립성 확보', '임명 절차 장기화로 대법관 공백 발생 우려'],
                internationalPrecedents: ['미국: 대통령 지명 + 상원 인준', '독일: 연방의회·연방참사원 각 절반 선출']
            },
            {
                clause: '대법원 상고 허가제 강화',
                risk: 'medium', score: 5,
                constitutionalIssues: ['재판받을 권리(헌법 제27조)와의 관계', '법률 해석 통일 기능 약화 우려'],
                implementationChallenges: ['허가 기준의 명확화 필요', '고등법원 판결의 최종성 강화에 따른 항소심 부담 증가'],
                internationalPrecedents: ['독일: 연방대법원 상고 허가제 운영', '일본: 상고수리제 도입']
            }
        ]
    },
    'law-distortion': {
        overallRisk: 'high',
        overallScore: 9,
        title: '법왜곡죄 도입',
        clauses: [
            {
                clause: '법관 법왜곡죄 신설',
                risk: 'high', score: 9,
                constitutionalIssues: ['사법부 독립(헌법 제103조)과의 충돌', '법관의 법률 해석 재량과 "왜곡" 구분 기준 모호'],
                implementationChallenges: ['법왜곡 판단 주체 문제 (검찰이 법관을 수사하는 구조)', '"고의적 왜곡"의 입증 기준 설정 난이도 극히 높음'],
                internationalPrecedents: ['독일: Rechtsbeugung(법왜곡죄) 형법 제339조 운영', '오스트리아: 유사 규정 존재하나 적용 사례 극히 드묾']
            }
        ]
    },
    'judicial-appeal': {
        overallRisk: 'medium',
        overallScore: 6,
        title: '사법불복 절차 개선',
        clauses: [
            {
                clause: '재판관할 변경 제도 강화',
                risk: 'medium', score: 6,
                constitutionalIssues: ['법관의 재판 독립성과 관할 변경의 남용 가능성'],
                implementationChallenges: ['관할 변경 신청의 남용 방지 기준 마련', '소송 지연 효과 최소화 방안'],
                internationalPrecedents: ['미국: venue change(재판장소 변경) 폭넓게 인정', '영국: 편견 없는 재판을 위한 이송 제도']
            }
        ]
    },
    'court-admin': {
        overallRisk: 'medium',
        overallScore: 7,
        title: '법원행정 개혁',
        clauses: [
            {
                clause: '사법행정권 분리',
                risk: 'high', score: 7,
                constitutionalIssues: ['대법원장의 사법행정 총괄권(헌법 제104조) 변경 문제', '법원행정처의 독립기관화 시 민주적 통제 방안'],
                implementationChallenges: ['행정 인력 및 예산 이관 절차', '사법행정 전문성 유지와 재판 독립성 보장의 균형'],
                internationalPrecedents: ['미국: 연방사법회의(Judicial Conference) 운영', '독일: 법무부가 법원 행정 담당']
            }
        ]
    },
    'judge-personnel': {
        overallRisk: 'medium',
        overallScore: 6,
        title: '법관인사 개혁',
        clauses: [
            {
                clause: '법관 성과평가 제도 도입',
                risk: 'medium', score: 6,
                constitutionalIssues: ['법관 독립성(헌법 제103조)과 성과평가의 긴장 관계', '평가 기준이 판결 내용에 영향을 미칠 우려'],
                implementationChallenges: ['공정하고 객관적인 평가 기준 설정의 어려움', '평가 결과의 인사 반영 범위와 방법'],
                internationalPrecedents: ['네덜란드: 법관 평가 시스템 운영', '호주: 법관 성과 프레임워크']
            }
        ]
    },
    'citizen-trial': {
        overallRisk: 'medium',
        overallScore: 5,
        title: '시민재판 참여 확대',
        clauses: [
            {
                clause: '국민참여재판 적용 범위 확대',
                risk: 'low', score: 4,
                constitutionalIssues: ['헌법재판소 결정(2009헌바17): 국민참여재판 권고적 효력 합헌', '구속력 부여 시 헌법 개정 필요 여부'],
                implementationChallenges: ['배심원 확보 및 교육 인프라 구축', '재판 기간 연장에 따른 비용 증가'],
                internationalPrecedents: ['미국: 배심제(구속력 있는 평결)', '독일: 참심제(시민판사+직업법관 합의체)', '프랑스: 중죄재판 배심제']
            },
            {
                clause: '참심제 도입',
                risk: 'medium', score: 5,
                constitutionalIssues: ['헌법상 법관 자격 요건과 시민법관의 법적 지위', '위헌 여부에 대한 헌법재판소 판단 필요'],
                implementationChallenges: ['시민법관 선발 기준 및 이해충돌 방지', '전문적 법률 판단에 대한 시민 참여의 한계'],
                internationalPrecedents: ['독일: Schöffen(참심원) 제도 200년+ 운영', '스웨덴: nämndemän(참심원) 제도', '이탈리아: giudice popolare(인민판사) 제도']
            }
        ]
    }
};

export default function ReformAnalysis() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(() => {
        const tabParam = searchParams.get('tab');
        const validTabs = ['prosecution', 'prosecution-reform', 'finland-reform', 'supreme-court', 'law-distortion', 'judicial-appeal', 'court-admin', 'judge-personnel', 'citizen-trial'];
        return validTabs.includes(tabParam) ? tabParam : 'prosecution';
    });

    useEffect(() => {
        if (activeTab === 'prosecution') {
            if (searchParams.has('tab')) {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('tab');
                setSearchParams(newParams, { replace: true });
            }
        } else {
            setSearchParams({ tab: activeTab }, { replace: true });
        }
    }, [activeTab]);
    const [reformNews, setReformNews] = useState({});
    const [newsLoading, setNewsLoading] = useState(false);
    const [showRiskAnalysis, setShowRiskAnalysis] = useState(false);
    const [expandedRiskClause, setExpandedRiskClause] = useState(null);

    // Firestore에서 개혁안 뉴스 가져오기
    useEffect(() => {
        const cached = getReformNewsCache();
        if (cached) {
            setReformNews(cached);
            return;
        }

        const fetchReformNews = async () => {
            try {
                setNewsLoading(true);
                const snapshot = await getDocs(collection(db, 'reformNews'));
                const newsData = {};
                snapshot.forEach(doc => {
                    newsData[doc.id] = doc.data();
                });
                setReformNews(newsData);
                setReformNewsCache(newsData);
            } catch (error) {
                console.error('Reform news fetch error:', error);
            } finally {
                setNewsLoading(false);
            }
        };
        fetchReformNews();
    }, []);

    const activeReform = reformData.find(r => r.id === activeTab);

    return (
        <div className="min-h-screen bg-gray-50">
            <SEOHead
                title={activeTab === 'prosecution-reform' ? '검찰개혁 심층분석' : activeTab === 'finland-reform' ? '핀란드식 사법개혁안' : '사법개혁 분석'}
                description={activeTab === 'prosecution-reform' ? '공소청법·중수청법 정부안 vs 김용민·박은정 의원안 비교, AI 법안 위험도 분석' : activeTab === 'finland-reform' ? '수사·기소 완전 분리, 참심제, 이중 감시 체계 - 핀란드 모델 벤치마킹 법률안' : '한국 사법제도 개혁 분석 - 참심제, 배심제, 국민참여재판 비교 분석'}
                path={activeTab !== 'prosecution' ? `/reform-analysis?tab=${activeTab}` : '/reform-analysis'}
                image={activeTab === 'prosecution-reform' ? '/검찰개혁심층분석.png' : activeTab === 'finland-reform' ? '/핀란드식사법개혁안.png' : '/사법개혁안비교.png'}
            />
            <Header />
            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-7xl">
                    {/* 페이지 헤더 */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                            사법 개혁안 비교
                        </h1>
                        <p className="text-gray-500 text-sm">
                            정부/여당, 야당, 시민사회의 사법개혁안을 한눈에 비교합니다
                        </p>
                    </div>

                    {/* 통계 요약 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                            <p className="text-2xl font-bold text-gray-900">9</p>
                            <p className="text-sm text-gray-500">개혁 영역</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                            <p className="text-2xl font-bold text-blue-600">8</p>
                            <p className="text-sm text-gray-500">비교 주체</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                            <p className="text-2xl font-bold text-green-600">2026</p>
                            <p className="text-sm text-gray-500">시행 목표</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                            <p className="text-2xl font-bold text-purple-600">22대</p>
                            <p className="text-sm text-gray-500">국회</p>
                        </div>
                    </div>

                    {/* 사이드바 + 컨텐츠 레이아웃 */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* 사이드바 */}
                        <div className="lg:w-64 shrink-0">
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-28">
                                <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible">
                                    {reformData.map(reform => (
                                        <button
                                            key={reform.id}
                                            onClick={() => setActiveTab(reform.id)}
                                            className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-l-4 whitespace-nowrap lg:whitespace-normal ${
                                                activeTab === reform.id
                                                    ? 'bg-blue-50 text-blue-700 border-blue-600'
                                                    : 'text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                        >
                                            <span className="mr-1.5">{reform.icon}</span>
                                            {reform.title}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </div>

                        {/* 메인 컨텐츠 */}
                        <div className="flex-1 min-w-0">
                    {/* 선택된 개혁안 내용 */}
                    {activeReform && (
                        <>
                            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">
                                    {activeReform.icon} {activeReform.title}
                                </h2>
                                <p className="text-gray-600">{activeReform.description}</p>
                            </div>

                            {activeReform.customRender && activeTab === 'prosecution-reform' ? (
                                <div className="space-y-8">
                                    {/* 섹션 A: 검찰개혁 법안 비교표 */}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>📋</span> 검찰개혁 법안 비교 <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">정부안 vs 의원안</span>
                                        </h3>
                                        <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200">
                                            <table className="w-full min-w-[1100px]">
                                                <thead>
                                                    <tr>
                                                        <th className="bg-gray-100 px-3 py-3 text-left text-sm font-bold text-gray-700 w-[12%]">비교 항목</th>
                                                        <th className="bg-sky-50 border-t-4 border-sky-400 px-3 py-3 text-center text-sm font-bold text-gray-800 w-[22%]">
                                                            ⚖️ {BILL_COMPARISON.gongso.name}
                                                            <div className="text-xs font-normal text-gray-500 mt-1">{BILL_COMPARISON.gongso.submitter}</div>
                                                            <div className="mt-1"><span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] rounded-full">정부안</span></div>
                                                        </th>
                                                        <th className="bg-amber-50 border-t-4 border-amber-400 px-3 py-3 text-center text-sm font-bold text-gray-800 w-[22%]">
                                                            🔍 {BILL_COMPARISON.jungsu.name}
                                                            <div className="text-xs font-normal text-gray-500 mt-1">{BILL_COMPARISON.jungsu.submitter}</div>
                                                            <div className="mt-1"><span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] rounded-full">정부안</span></div>
                                                        </th>
                                                        <th className="bg-green-50 border-t-4 border-green-500 px-3 py-3 text-center text-sm font-bold text-gray-800 w-[22%]">
                                                            🏛️ {BILL_COMPARISON.kimyongmin.name}
                                                            <div className="text-xs font-normal text-gray-500 mt-1">{BILL_COMPARISON.kimyongmin.submitter}</div>
                                                            <div className="mt-1"><span className="px-1.5 py-0.5 bg-green-100 text-green-600 text-[10px] rounded-full">의원안</span></div>
                                                        </th>
                                                        <th className="bg-purple-50 border-t-4 border-purple-500 px-3 py-3 text-center text-sm font-bold text-gray-800 w-[22%]">
                                                            ✊ {BILL_COMPARISON.parkeunjung.name}
                                                            <div className="text-xs font-normal text-gray-500 mt-1">{BILL_COMPARISON.parkeunjung.submitter}</div>
                                                            <div className="mt-1"><span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] rounded-full">의원안</span></div>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="border-t border-gray-100">
                                                        <td className="px-3 py-3 text-sm font-semibold text-gray-700 bg-gray-50">소관부처</td>
                                                        <td className="px-3 py-3 text-sm text-gray-700">{BILL_COMPARISON.gongso.parent}</td>
                                                        <td className="px-3 py-3 text-sm text-gray-700">{BILL_COMPARISON.jungsu.parent}</td>
                                                        <td className="px-3 py-3 text-sm text-gray-700">{BILL_COMPARISON.kimyongmin.parent}</td>
                                                        <td className="px-3 py-3 text-sm text-gray-700">{BILL_COMPARISON.parkeunjung.parent}</td>
                                                    </tr>
                                                    <tr className="border-t border-gray-100">
                                                        <td className="px-3 py-3 text-sm font-semibold text-gray-700 bg-gray-50">조직구조</td>
                                                        <td className="px-3 py-3 text-sm text-gray-700">{BILL_COMPARISON.gongso.structure}</td>
                                                        <td className="px-3 py-3 text-sm text-gray-700">{BILL_COMPARISON.jungsu.structure}</td>
                                                        <td className="px-3 py-3 text-sm text-gray-700">{BILL_COMPARISON.kimyongmin.structure}</td>
                                                        <td className="px-3 py-3 text-sm text-gray-700">{BILL_COMPARISON.parkeunjung.structure}</td>
                                                    </tr>
                                                    <tr className="border-t border-gray-100">
                                                        <td className="px-3 py-3 text-sm font-semibold text-gray-700 bg-gray-50">핵심 역할</td>
                                                        <td className="px-3 py-3 text-sm text-gray-700">
                                                            <ul className="space-y-1">{BILL_COMPARISON.gongso.duties.map((d, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-sky-400 mt-0.5 shrink-0">•</span><span>{d}</span></li>)}</ul>
                                                            <p className="mt-2 text-red-600 font-semibold text-xs">❌ 제외: {BILL_COMPARISON.gongso.excluded}</p>
                                                        </td>
                                                        <td className="px-3 py-3 text-sm text-gray-700">
                                                            <p className="font-semibold mb-1">6대 중대범죄 수사:</p>
                                                            <ul className="space-y-1">{BILL_COMPARISON.jungsu.targetCrimes.map((c, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-amber-400 mt-0.5 shrink-0">•</span><span>{c}</span></li>)}</ul>
                                                        </td>
                                                        <td className="px-3 py-3 text-sm text-gray-700">
                                                            <ul className="space-y-1">{BILL_COMPARISON.kimyongmin.duties.map((d, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-green-400 mt-0.5 shrink-0">•</span><span>{d}</span></li>)}</ul>
                                                            <p className="mt-2 text-green-700 font-semibold text-xs">✅ {BILL_COMPARISON.kimyongmin.excluded}</p>
                                                        </td>
                                                        <td className="px-3 py-3 text-sm text-gray-700">
                                                            <ul className="space-y-1">{BILL_COMPARISON.parkeunjung.duties.map((d, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-purple-400 mt-0.5 shrink-0">•</span><span>{d}</span></li>)}</ul>
                                                            <p className="mt-2 text-purple-700 font-semibold text-xs">✅ {BILL_COMPARISON.parkeunjung.excluded}</p>
                                                        </td>
                                                    </tr>
                                                    <tr className="border-t border-gray-100">
                                                        <td className="px-3 py-3 text-sm font-semibold text-gray-700 bg-gray-50">감독·감시</td>
                                                        <td className="px-3 py-3 text-sm text-gray-700">
                                                            <ul className="space-y-1">{BILL_COMPARISON.gongso.oversight.map((o, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-sky-400 mt-0.5 shrink-0">•</span><span>{o}</span></li>)}</ul>
                                                        </td>
                                                        <td className="px-3 py-3 text-sm text-gray-700">
                                                            <ul className="space-y-1">{BILL_COMPARISON.jungsu.oversight.map((o, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-amber-400 mt-0.5 shrink-0">•</span><span>{o}</span></li>)}</ul>
                                                        </td>
                                                        <td className="px-3 py-3 text-sm text-gray-700">
                                                            <ul className="space-y-1">{BILL_COMPARISON.kimyongmin.oversight.map((o, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-green-400 mt-0.5 shrink-0">•</span><span>{o}</span></li>)}</ul>
                                                        </td>
                                                        <td className="px-3 py-3 text-sm text-gray-700">
                                                            <ul className="space-y-1">{BILL_COMPARISON.parkeunjung.oversight.map((o, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-purple-400 mt-0.5 shrink-0">•</span><span>{o}</span></li>)}</ul>
                                                        </td>
                                                    </tr>
                                                    <tr className="border-t border-gray-100">
                                                        <td className="px-3 py-3 text-sm font-semibold text-gray-700 bg-gray-50">분리 장치</td>
                                                        <td className="px-3 py-3 text-sm text-gray-700">
                                                            <p className="text-orange-600 font-semibold">⚠️ {BILL_COMPARISON.gongso.nameIssue}</p>
                                                            <p className="mt-1">징계: {BILL_COMPARISON.gongso.discipline}</p>
                                                        </td>
                                                        <td className="px-3 py-3 text-sm text-gray-700">
                                                            <ul className="space-y-1">{BILL_COMPARISON.jungsu.separation.map((s, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-amber-400 mt-0.5 shrink-0">•</span><span>{s}</span></li>)}</ul>
                                                        </td>
                                                        <td className="px-3 py-3 text-sm text-gray-700">
                                                            <p className="text-green-700 font-semibold">✅ {BILL_COMPARISON.kimyongmin.nameIssue}</p>
                                                            <p className="mt-1">징계: {BILL_COMPARISON.kimyongmin.discipline}</p>
                                                        </td>
                                                        <td className="px-3 py-3 text-sm text-gray-700">
                                                            <p className="text-purple-700 font-semibold">✅ {BILL_COMPARISON.parkeunjung.nameIssue}</p>
                                                            <p className="mt-1">징계: {BILL_COMPARISON.parkeunjung.discipline}</p>
                                                        </td>
                                                    </tr>
                                                    <tr className="border-t border-gray-100 bg-gray-50/50">
                                                        <td className="px-3 py-3 text-sm font-semibold text-gray-700 bg-gray-50">핵심 차이</td>
                                                        <td className="px-3 py-3 text-sm text-orange-700 font-medium">보완수사요구권 보유, 검찰총장 명칭 유지</td>
                                                        <td className="px-3 py-3 text-sm text-orange-700 font-medium">행안부 소속, 청장 임기 2년(중임불가)</td>
                                                        <td className="px-3 py-3 text-sm text-green-700 font-medium">{BILL_COMPARISON.kimyongmin.keyDifference}</td>
                                                        <td className="px-3 py-3 text-sm text-purple-700 font-medium">{BILL_COMPARISON.parkeunjung.keyDifference}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* 섹션 B: 핵심 쟁점 분석 */}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>🔥</span> 핵심 쟁점: 수사·기소 분리 실현 여부
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {KEY_ISSUES.map((issue, idx) => (
                                                <div key={idx} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                                                    <div className="px-5 py-4 flex items-start gap-3">
                                                        <span className="text-2xl">{issue.icon}</span>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-bold text-gray-800">{issue.title}</h4>
                                                                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                                                    issue.risk === 'high' ? 'bg-red-100 text-red-700' :
                                                                    issue.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-green-100 text-green-700'
                                                                }`}>{issue.risk === 'high' ? '고위험' : issue.risk === 'medium' ? '중위험' : '저위험'}</span>
                                                            </div>
                                                            <p className="text-base text-gray-600 mb-3">{issue.description}</p>
                                                            <ul className="space-y-1.5">
                                                                {issue.points.map((point, pIdx) => (
                                                                    <li key={pIdx} className="text-sm text-gray-700 flex items-start gap-1.5">
                                                                        <span className="text-red-400 mt-0.5 shrink-0">▸</span>
                                                                        <span>{point}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 섹션 D: 국제 비교 */}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>🌍</span> 국제 비교: 검찰 조직 · 민주화
                                        </h3>
                                        <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200">
                                            <table className="w-full min-w-[1000px]">
                                                <thead>
                                                    <tr>
                                                        <th className="bg-gray-100 px-3 py-3 text-left text-sm font-bold text-gray-700 w-[12%]">비교 항목</th>
                                                        {INTERNATIONAL_COMPARISON.map((c, idx) => (
                                                            <th key={idx} className={`${c.bgColor} border-t-4 ${c.color} px-3 py-3 text-center text-sm font-bold text-gray-800 w-[22%]`}>
                                                                {c.flag} {c.country}
                                                                <div className="text-xs font-normal text-gray-500 mt-1">{c.model}</div>
                                                                <div className="mt-1">
                                                                    <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium ${
                                                                        c.score >= 8 ? 'bg-green-100 text-green-700' :
                                                                        c.score >= 6 ? 'bg-yellow-100 text-yellow-700' :
                                                                        'bg-red-100 text-red-700'
                                                                    }`}>{c.score}/10</span>
                                                                </div>
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="border-t border-gray-100">
                                                        <td className="px-3 py-3 text-sm font-semibold text-gray-700 bg-gray-50">⚖️ 검찰</td>
                                                        {INTERNATIONAL_COMPARISON.map((c, idx) => (
                                                            <td key={idx} className="px-3 py-3 text-sm text-gray-700">
                                                                <p className="font-semibold">{c.prosecution.name}</p>
                                                                <p className="text-gray-500 mt-0.5">{c.prosecution.parent}</p>
                                                                <p className="mt-1">역할: {c.prosecution.role}</p>
                                                                <p className="text-gray-500 mt-0.5 text-xs">{c.prosecution.independence}</p>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                    <tr className="border-t border-gray-100">
                                                        <td className="px-3 py-3 text-sm font-semibold text-gray-700 bg-gray-50">🚔 경찰·수사</td>
                                                        {INTERNATIONAL_COMPARISON.map((c, idx) => (
                                                            <td key={idx} className="px-3 py-3 text-sm text-gray-700">
                                                                <p className="font-semibold">{c.police.name}</p>
                                                                <p className="mt-0.5">{c.police.role}</p>
                                                                <p className="text-gray-500 mt-0.5 text-xs">{c.police.relationship}</p>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                    <tr className="border-t border-gray-100">
                                                        <td className="px-3 py-3 text-sm font-semibold text-gray-700 bg-gray-50">🛡️ 감시·통제</td>
                                                        {INTERNATIONAL_COMPARISON.map((c, idx) => (
                                                            <td key={idx} className="px-3 py-3 text-sm text-gray-700">{c.oversight}</td>
                                                        ))}
                                                    </tr>
                                                    <tr className="border-t border-gray-100">
                                                        <td className="px-3 py-3 text-sm font-semibold text-gray-700 bg-gray-50">👥 시민 참여</td>
                                                        {INTERNATIONAL_COMPARISON.map((c, idx) => (
                                                            <td key={idx} className="px-3 py-3 text-sm text-gray-700">{c.democratization}</td>
                                                        ))}
                                                    </tr>
                                                    <tr className="border-t border-gray-100 bg-gray-50/50">
                                                        <td className="px-3 py-3 text-sm font-semibold text-gray-700 bg-gray-50">💡 핵심</td>
                                                        {INTERNATIONAL_COMPARISON.map((c, idx) => (
                                                            <td key={idx} className={`px-3 py-3 text-sm font-medium ${
                                                                c.score >= 8 ? 'text-green-700' :
                                                                c.score >= 6 ? 'text-yellow-700' :
                                                                'text-red-700'
                                                            }`}>{c.keyFeature}</td>
                                                        ))}
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* 섹션 E: 종합 평가 스코어카드 */}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>📊</span> 검찰 민주화 종합 평가
                                        </h3>
                                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                            {/* 국가별 총점 */}
                                            <div className="grid grid-cols-4 gap-0 border-b">
                                                {DEMOCRATIZATION_SCORECARD.countries.map((c, idx) => {
                                                    const total = DEMOCRATIZATION_SCORECARD.categories.reduce((sum, cat) => sum + cat[c.key], 0);
                                                    return (
                                                        <div key={idx} className="p-4 text-center border-r last:border-r-0">
                                                            <p className="text-2xl mb-1">{c.flag}</p>
                                                            <p className="text-sm font-bold text-gray-800">{c.name}</p>
                                                            <p className={`text-2xl font-bold mt-1 ${total >= 40 ? 'text-green-600' : total >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                                {total}<span className="text-sm text-gray-400">/{DEMOCRATIZATION_SCORECARD.totalMax}</span>
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {/* 항목별 비교 바 차트 */}
                                            <div className="p-5 space-y-4">
                                                {DEMOCRATIZATION_SCORECARD.categories.map((cat, cIdx) => (
                                                    <div key={cIdx}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span>{cat.icon}</span>
                                                            <span className="text-base font-medium text-gray-800">{cat.name}</span>
                                                            <span className="text-sm text-gray-400 ml-auto">{cat.description}</span>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            {DEMOCRATIZATION_SCORECARD.countries.map((country, coIdx) => (
                                                                <div key={coIdx} className="flex items-center gap-2">
                                                                    <span className="text-sm w-12 text-right text-gray-500">{country.flag} {country.name}</span>
                                                                    <div className="flex-1 bg-gray-100 rounded-full h-4 relative">
                                                                        <div
                                                                            className={`h-4 rounded-full transition-all ${country.color}`}
                                                                            style={{ width: `${cat[country.key] * 10}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className={`text-xs font-bold w-6 ${cat[country.key] >= 7 ? 'text-green-600' : cat[country.key] >= 4 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                                        {cat[country.key]}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* 결론 배너 */}
                                            <div className="bg-red-50 border-t border-red-200 px-5 py-4">
                                                <p className="text-base font-bold text-red-800 mb-2">⚠️ 종합 평가: 한국 검찰개혁안의 한계와 대안</p>
                                                <p className="text-sm text-red-700 leading-relaxed mb-3">
                                                    한국의 공소청·중수청 개혁안은 조직 분리의 형식을 갖추었으나, 핀란드·독일·일본 등 모범국 대비 시민 통제·참여(2/10),
                                                    검찰 정치적 독립성(3/10), 인사 독립성(3/10)에서 현저히 낮은 점수를 기록합니다.
                                                </p>
                                                <div className="bg-white/70 rounded-lg p-3 border border-red-100">
                                                    <p className="text-sm font-bold text-green-800 mb-1">🇫🇮 대안: 핀란드식 검찰 민주화 모델</p>
                                                    <p className="text-sm text-gray-700 leading-relaxed">
                                                        국가 조직의 민주화를 위한 검찰개혁의 가장 이상적인 방향은 <strong className="text-green-700">핀란드식 수사·기소 완전 분리 모델</strong>입니다.
                                                        핀란드는 검찰을 독립 기관으로 두고 기소만 전담하게 하며, 수사는 경찰이 독자적으로 수행합니다.
                                                        이중 감시(법률감찰관 + 국회 옴부즈만)와 참심원 제도(시민 3명 + 법관 1명)를 통해
                                                        검찰 권한의 민주적 통제와 시민 직접 참여를 동시에 실현하고 있습니다.
                                                        한국 개혁안이 진정한 수사·기소 분리를 달성하려면, 핀란드의 제도적 장치를 벤치마킹해야 합니다.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : activeReform.customRender && activeTab === 'finland-reform' ? (
                                <div className="space-y-8">
                                    {/* 핀란드 법률안 개요 */}
                                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                                        <h3 className="text-lg font-bold text-blue-900 mb-1">{FINLAND_REFORM_BILL.title}</h3>
                                        <p className="text-sm text-blue-700 mb-2">{FINLAND_REFORM_BILL.subtitle}</p>
                                        <p className="text-xs text-blue-500">벤치마킹: {FINLAND_REFORM_BILL.basedOn}</p>
                                    </div>

                                    {/* 4개 법안 상세 */}
                                    {FINLAND_REFORM_BILL.bills.map((bill, bIdx) => (
                                        <div key={bIdx} className={`${bill.bgColor} border-l-4 ${bill.color} rounded-xl overflow-hidden shadow-sm`}>
                                            <div className="p-5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xl">{bill.icon}</span>
                                                    <h3 className="text-lg font-bold text-gray-800">{bill.name}</h3>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-4">{bill.purpose}</p>

                                                <div className="grid md:grid-cols-3 gap-4 mb-4">
                                                    {bill.keyPoints.map((kp, kIdx) => (
                                                        <div key={kIdx} className="bg-white/70 rounded-lg p-4">
                                                            <h4 className="text-sm font-bold text-gray-800 mb-2">{kp.title}</h4>
                                                            <ul className="space-y-1.5">
                                                                {kp.items.map((item, iIdx) => (
                                                                    <li key={iIdx} className="text-sm text-gray-700 flex items-start gap-1.5">
                                                                        <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                                                                        <span>{item}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="bg-white/50 rounded-lg p-3 border border-gray-200/50">
                                                    <p className="text-xs text-gray-600">
                                                        <span className="font-bold">🇫🇮 핀란드 참조:</span> {bill.finlandReference}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* 시행 타임라인 */}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>📅</span> 시행 로드맵
                                        </h3>
                                        <div className="grid md:grid-cols-4 gap-4">
                                            {FINLAND_REFORM_BILL.timeline.map((t, tIdx) => (
                                                <div key={tIdx} className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-blue-400">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">{t.phase}</span>
                                                        <span className="text-xs text-gray-500">{t.period}</span>
                                                    </div>
                                                    <h4 className="font-bold text-gray-800 text-sm mb-2">{t.title}</h4>
                                                    <ul className="space-y-1">
                                                        {t.items.map((item, iIdx) => (
                                                            <li key={iIdx} className="text-sm text-gray-600 flex items-start gap-1.5">
                                                                <span className="text-blue-400 mt-0.5 shrink-0">→</span>
                                                                <span>{item}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 현행 vs 개혁안 비교표 */}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>📊</span> 현행 정부안 vs 핀란드식 개혁안
                                        </h3>
                                        <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200">
                                            <table className="w-full">
                                                <thead>
                                                    <tr>
                                                        <th className="bg-gray-100 px-4 py-3 text-left text-sm font-bold text-gray-700 w-[20%]">비교 항목</th>
                                                        <th className="bg-red-50 border-t-4 border-red-400 px-4 py-3 text-center text-sm font-bold text-gray-800 w-[40%]">
                                                            🇰🇷 현행 정부안
                                                            <div className="text-xs font-normal text-red-500 mt-1">공소청·중수청 분리 (2026)</div>
                                                        </th>
                                                        <th className="bg-blue-50 border-t-4 border-blue-500 px-4 py-3 text-center text-sm font-bold text-gray-800 w-[40%]">
                                                            🇫🇮 핀란드식 개혁안
                                                            <div className="text-xs font-normal text-blue-500 mt-1">수사·기소 완전 분리 + 시민 참여</div>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {FINLAND_REFORM_BILL.comparison.items.map((item, idx) => (
                                                        <tr key={idx} className="border-t border-gray-100">
                                                            <td className="px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-50">{item.category}</td>
                                                            <td className="px-4 py-3 text-sm text-red-700">{item.current}</td>
                                                            <td className="px-4 py-3 text-sm text-blue-700 font-medium">{item.proposed}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : activeReform.subsections ? (
                                /* 섹션별 비교표 (검찰 조직 개편) */
                                activeReform.subsections.map((section, sIdx) => (
                                    <div key={sIdx} className="mb-8">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xl">{section.icon}</span>
                                            <h3 className="text-lg font-bold text-gray-800">{section.title}</h3>
                                        </div>
                                        <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200">
                                            <table className="w-full min-w-[1500px]">
                                                <thead>
                                                    <tr>
                                                        {section.positions.map((pos, idx) => {
                                                            const bgMap = {
                                                                'border-sky-500': 'bg-sky-50 border-sky-400',
                                                                'border-blue-800': 'bg-blue-100 border-blue-700',
                                                                'border-red-700': 'bg-red-100 border-red-600',
                                                                'border-blue-500': 'bg-blue-50 border-blue-400',
                                                                'border-rose-600': 'bg-rose-50 border-rose-500',
                                                                'border-teal-500': 'bg-teal-50 border-teal-400',
                                                                'border-pink-500': 'bg-pink-50 border-pink-400',
                                                                'border-green-500': 'bg-green-50 border-green-400'
                                                            };
                                                            const headerStyle = bgMap[pos.color] || 'bg-gray-50 border-gray-300';
                                                            return (
                                                                <th key={idx} className={`${headerStyle} border-t-4 px-3 py-3 text-center w-[12.5%]`}>
                                                                    <div className="font-bold text-gray-900 text-sm">{pos.stakeholder}</div>
                                                                    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${pos.stanceColor}`}>
                                                                        {pos.stance}
                                                                    </span>
                                                                </th>
                                                            );
                                                        })}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        {section.positions.map((pos, idx) => (
                                                            <td key={idx} className="px-3 py-3 align-top border-t border-gray-100 bg-white">
                                                                <p className="text-xs text-gray-800 font-semibold mb-2 leading-relaxed">{pos.summary}</p>
                                                                <ul className="space-y-1">
                                                                    {pos.details.map((detail, i) => (
                                                                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5 leading-relaxed">
                                                                            <span className="text-gray-400 mt-0.5 shrink-0">•</span>
                                                                            <span>{detail}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                                {pos.sources && pos.sources.length > 0 && (
                                                                    <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1">
                                                                        {pos.sources.map((src, si) => (
                                                                            <a
                                                                                key={si}
                                                                                href={src.url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                                            >
                                                                                {src.name}
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                /* 일반 비교표 */
                                <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200 mb-8">
                                    <table className="w-full min-w-[1500px]">
                                        <thead>
                                            <tr>
                                                {activeReform.positions.map((pos, idx) => {
                                                    const bgMap = {
                                                        'border-sky-500': 'bg-sky-50 border-sky-400',
                                                        'border-blue-800': 'bg-blue-100 border-blue-700',
                                                        'border-red-700': 'bg-red-100 border-red-600',
                                                        'border-blue-500': 'bg-blue-50 border-blue-400',
                                                        'border-rose-600': 'bg-rose-50 border-rose-500',
                                                        'border-teal-500': 'bg-teal-50 border-teal-400',
                                                        'border-pink-500': 'bg-pink-50 border-pink-400',
                                                        'border-green-500': 'bg-green-50 border-green-400'
                                                    };
                                                    const headerStyle = bgMap[pos.color] || 'bg-gray-50 border-gray-300';
                                                    return (
                                                        <th key={idx} className={`${headerStyle} border-t-4 px-3 py-3 text-center w-[12.5%]`}>
                                                            <div className="font-bold text-gray-900 text-sm">{pos.stakeholder}</div>
                                                            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${pos.stanceColor}`}>
                                                                {pos.stance}
                                                            </span>
                                                        </th>
                                                    );
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                {activeReform.positions.map((pos, idx) => (
                                                    <td key={idx} className="px-3 py-3 align-top border-t border-gray-100 bg-white">
                                                        <p className="text-xs text-gray-800 font-semibold mb-2 leading-relaxed">{pos.summary}</p>
                                                        <ul className="space-y-1">
                                                            {pos.details.map((detail, i) => (
                                                                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5 leading-relaxed">
                                                                    <span className="text-gray-400 mt-0.5 shrink-0">•</span>
                                                                    <span>{detail}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        {pos.sources && pos.sources.length > 0 && (
                                                            <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1">
                                                                {pos.sources.map((src, si) => (
                                                                    <a
                                                                        key={si}
                                                                        href={src.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                                    >
                                                                        {src.name}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {/* AI 법안 위험도 분석 */}
                    {activeReform && REFORM_RISK_ANALYSIS[activeReform.id] && (
                        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
                            <button
                                onClick={() => { setShowRiskAnalysis(!showRiskAnalysis); setExpandedRiskClause(null); }}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">🤖</span>
                                    <span className="font-bold text-gray-800">AI 법안 위험도 분석</span>
                                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                        REFORM_RISK_ANALYSIS[activeReform.id].overallRisk === 'high' ? 'bg-red-100 text-red-700' :
                                        REFORM_RISK_ANALYSIS[activeReform.id].overallRisk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>{REFORM_RISK_ANALYSIS[activeReform.id].overallRisk === 'high' ? '고위험' :
                                        REFORM_RISK_ANALYSIS[activeReform.id].overallRisk === 'medium' ? '중위험' : '저위험'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500">{REFORM_RISK_ANALYSIS[activeReform.id].overallScore}/10</span>
                                    <span className={`transform transition-transform ${showRiskAnalysis ? 'rotate-180' : ''}`}>▼</span>
                                </div>
                            </button>

                            {showRiskAnalysis && (() => {
                                const riskData = REFORM_RISK_ANALYSIS[activeReform.id];
                                return (
                                    <div className="px-6 pb-6 space-y-4">
                                        {/* AI 면책 배너 */}
                                        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 text-center">
                                            <p className="text-xs text-cyan-800">
                                                ⚠️ AI가 사전 생성한 법안 위험도 분석입니다. 법적 조언이 아니며, 정확한 법률 자문은 전문가에게 문의하세요.
                                            </p>
                                        </div>

                                        {/* 종합 위험도 진행바 */}
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700">종합 위험도 점수</span>
                                                <span className="text-lg font-bold text-gray-800">{riskData.overallScore}/10</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div
                                                    className={`h-3 rounded-full transition-all ${
                                                        riskData.overallScore >= 6 ? 'bg-red-500' :
                                                        riskData.overallScore >= 4 ? 'bg-yellow-500' : 'bg-green-500'
                                                    }`}
                                                    style={{ width: `${riskData.overallScore * 10}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* 조항별 위험도 카드 */}
                                        {riskData.clauses.map((clause, cIdx) => (
                                            <div key={cIdx} className="border rounded-xl overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedRiskClause(expandedRiskClause === cIdx ? null : cIdx)}
                                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                                            clause.risk === 'high' ? 'bg-red-100 text-red-700' :
                                                            clause.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-green-100 text-green-700'
                                                        }`}>{clause.score}/10</span>
                                                        <span className="font-medium text-sm text-gray-800">{clause.clause}</span>
                                                    </div>
                                                    <span className={`transform transition-transform text-sm ${expandedRiskClause === cIdx ? 'rotate-180' : ''}`}>▼</span>
                                                </button>

                                                {expandedRiskClause === cIdx && (
                                                    <div className="px-4 pb-4 space-y-3">
                                                        {/* 헌법적 쟁점 */}
                                                        <div className="bg-red-50 rounded-lg p-3">
                                                            <h5 className="font-bold text-red-800 text-xs mb-2">🏛️ 헌법적 쟁점</h5>
                                                            <ul className="space-y-1">
                                                                {clause.constitutionalIssues.map((issue, iIdx) => (
                                                                    <li key={iIdx} className="text-xs text-gray-700 flex items-start gap-1.5">
                                                                        <span className="text-red-400 mt-0.5 shrink-0">•</span>
                                                                        <span>{issue}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                        {/* 이행 과제 */}
                                                        <div className="bg-amber-50 rounded-lg p-3">
                                                            <h5 className="font-bold text-amber-800 text-xs mb-2">⚙️ 이행 과제</h5>
                                                            <ul className="space-y-1">
                                                                {clause.implementationChallenges.map((ch, chIdx) => (
                                                                    <li key={chIdx} className="text-xs text-gray-700 flex items-start gap-1.5">
                                                                        <span className="text-amber-400 mt-0.5 shrink-0">•</span>
                                                                        <span>{ch}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                        {/* 국제 사례 */}
                                                        <div className="bg-blue-50 rounded-lg p-3">
                                                            <h5 className="font-bold text-blue-800 text-xs mb-2">🌍 국제 사례</h5>
                                                            <ul className="space-y-1">
                                                                {clause.internationalPrecedents.map((prec, pIdx) => (
                                                                    <li key={pIdx} className="text-xs text-gray-700 flex items-start gap-1.5">
                                                                        <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                                                                        <span>{prec}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                        </div>{/* 메인 컨텐츠 끝 */}
                    </div>{/* flex 컨테이너 끝 */}

                    {/* 출처 안내 */}
                    <div className="p-4 bg-gray-100 rounded-xl text-center">
                        <p className="text-gray-600 text-sm">
                            이 정보는 공개된 뉴스 보도와 각 기관 발표 자료를 바탕으로 작성되었습니다.<br />
                            정책 변화에 따라 내용이 변경될 수 있습니다.
                        </p>
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
