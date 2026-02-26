import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import SEOHead from '../components/SEOHead';

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

export default function ReformAnalysis() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(() => {
        const tabParam = searchParams.get('tab');
        const validTabs = ['prosecution', 'supreme-court', 'law-distortion', 'judicial-appeal', 'court-admin', 'judge-personnel', 'citizen-trial'];
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
            <SEOHead title="사법개혁 분석" description="한국 사법제도 개혁 분석 - 참심제, 배심제, 국민참여재판 비교 분석" path="/reform-analysis" />
            <Header />
            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-5xl">
                    {/* 페이지 헤더 */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                            법원·검찰 개혁안 비교
                        </h1>
                        <p className="text-gray-500 text-sm">
                            정부/여당, 야당, 시민사회의 사법개혁안을 한눈에 비교합니다
                        </p>
                    </div>

                    {/* 통계 요약 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                            <p className="text-2xl font-bold text-gray-900">7</p>
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

                    {/* 탭 네비게이션 */}
                    <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
                        {reformData.map(reform => (
                            <button
                                key={reform.id}
                                onClick={() => setActiveTab(reform.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                    activeTab === reform.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {reform.icon} {reform.title}
                            </button>
                        ))}
                    </div>

                    {/* 선택된 개혁안 내용 */}
                    {activeReform && (
                        <>
                            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">
                                    {activeReform.icon} {activeReform.title}
                                </h2>
                                <p className="text-gray-600">{activeReform.description}</p>
                            </div>

                            {activeReform.subsections ? (
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

                    {/* 관련 최신 뉴스 */}
                    {activeReform && (
                        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span>📰</span> 관련 최신 뉴스
                            </h3>

                            {newsLoading && !reformNews[activeReform.id] ? (
                                <div className="text-center py-6">
                                    <div className="inline-block w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm text-gray-500 mt-2">뉴스를 불러오는 중...</p>
                                </div>
                            ) : reformNews[activeReform.id]?.news?.length > 0 ? (
                                <>
                                    {reformNews[activeReform.id].aiSummary && (
                                        <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3 mb-4">
                                            💡 {reformNews[activeReform.id].aiSummary}
                                        </p>
                                    )}
                                    <ul className="space-y-3">
                                        {reformNews[activeReform.id].news.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                                                <span className="text-blue-500 mt-0.5 shrink-0">📌</span>
                                                <div className="flex-1 min-w-0">
                                                    <a
                                                        href={item.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
                                                    >
                                                        {item.title}
                                                    </a>
                                                    {item.pubDate && (
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {new Date(item.pubDate).toLocaleDateString('ko-KR', {
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </p>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                    {reformNews[activeReform.id].lastUpdated && (
                                        <p className="text-xs text-gray-400 mt-3 text-right">
                                            마지막 업데이트: {
                                                reformNews[activeReform.id].lastUpdated?.seconds
                                                    ? new Date(reformNews[activeReform.id].lastUpdated.seconds * 1000).toLocaleDateString('ko-KR')
                                                    : ''
                                            }
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    아직 수집된 뉴스가 없습니다.
                                </p>
                            )}
                        </div>
                    )}

                    {/* 출처 안내 */}
                    <div className="p-4 bg-gray-100 rounded-xl text-center">
                        <p className="text-gray-600 text-sm">
                            이 정보는 공개된 뉴스 보도와 각 기관 발표 자료를 바탕으로 작성되었습니다.<br />
                            정책 변화에 따라 내용이 변경될 수 있습니다.
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
