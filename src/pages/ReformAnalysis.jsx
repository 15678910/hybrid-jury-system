import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import SEOHead from '../components/SEOHead';
import SNSShareBar from '../components/SNSShareBar';
import { BILL_COMPARISON, BILL_COMPARISON_REVISED, KEY_ISSUES, OPPOSITION_VOICES, INTERNATIONAL_COMPARISON, DEMOCRATIZATION_SCORECARD, FINLAND_REFORM_BILL } from '../data/prosecutionReformData';
import { getLawComparison, getLawHistory } from '../lib/lawApi';

// 법원조직법 핵심 쟁점 현행 vs 개혁안 (개혁안 출처: 본 페이지의 사법개혁안 데이터)
const COURT_ORG_COMPARISON = [
    {
        topic: '대법원 구성',
        current: '대법관 14명(대법원장 포함)·3개 소부 — 상고 사건 폭증으로 충실한 심리가 어렵다는 지적',
        reform: '대법관 14명→26명 증원, 소부 6개·합의부 2개로 확대, 비법관 출신 대법관 임명 확대',
    },
    {
        topic: '법원행정처',
        current: '법원행정처가 사법행정을 총괄, 처장·차장 등을 현직 법관이 겸직 — 사법농단의 구조적 배경으로 지목',
        reform: '법원행정처 폐지, 비법관도 참여하는 사법행정위원회(13명) 신설로 민주적 통제',
    },
    {
        topic: '법관 인사',
        current: '대법원장에게 법관 인사·보임 권한이 집중 — 제청·평정의 불투명성 논란',
        reform: '대법관 추천위 구성 다양화, 법관 평가제 도입 등 인사 투명화·분산',
    },
];

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
// 형사소송법 검찰개혁 개정안 2건 심층 비교 (2026.6~7 발의) — 국회 의안정보시스템 원문(조문) 직접 분석
const CRIMINAL_PROCEDURE_BILLS = {
    intro: '2026.10 「검찰청법」 폐지·공소청/중대범죄수사청 출범(수사·기소 분리)의 후속으로 형사소송법을 정비하는 검찰개혁 법안 2건. 두 안 모두 ① 검사의 직접수사와 직접 보완수사를 폐지하고 ② 수사 주체를 사법경찰관으로 일원화하되, ③ 공소청 검사의 「보완수사 요구권」·「재수사 요청권」은 유지·강화한다. 차이는 무엇을 얼마나 강하게 정비하느냐에 있다. (2219564는 김용민(민주당)·박은정(조국혁신당) 등 개혁파 공동안, 2219875는 더불어민주당 검찰개혁 TF가 발의한 당론성 안.)',
    bills: [
        {
            name: '김용민·박은정 의원안',
            billNo: '2219564', proposers: '김용민(민주당)·박은정(조국혁신당) 등 12인 · 개혁파 공동발의', date: '2026.6.26 발의',
            stance: '포괄·인권통제형', border: 'border-red-200', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700',
            purpose: '형사소송법 전면 정비 + 인권보호·민주통제 기구를 대거 신설.',
            points: [
                '검사 직접수사·직접 보완수사 폐지 — 검사는 사법경찰관에게 보완수사를 「요구」만 가능(제197조의2①1호)',
                '보완수사 완료기간 3개월 원칙 / 불이행 시 공소청장이 수사관서장에게 직무배제·교체 요구',
                '수사인권보호관 신설(제196조) — 개방형 직위, 인권침해·수사권 남용 민원 처리, 수사방식 변경·수사관 교체·징계 권고',
                '공소심의회 신설(제246조의3) — 검사의 공소권 행사에 대한 민주적 통제',
                '수사·기소 처리기한 명문화, 전자정보 압수수색 참여·의견진술권 등',
            ],
            sources: [
                { name: '국회 의안 2219564(열려라국회)', url: 'https://watch.peoplepower21.org/BillDetail/2219564' },
            ],
        },
        {
            name: '더불어민주당 형사소송법 개정안',
            billNo: '2219875', proposers: '김한규 의원 대표발의 · 김한규 등 22인 (민주당 검찰개혁 TF)', date: '2026.7.9 발의',
            stance: '이행강제·집중형 (민주당 당론성)', border: 'border-orange-200', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700',
            purpose: '더불어민주당 검찰개혁 TF가 발의한 당론성 법안. 수사·기소 분리 원칙 구현 + 공소청의 수사 통제(이행강제)를 촘촘히 설계.',
            points: [
                '검사 직접수사·직접 보완수사 폐지 — 수사 주체 사법경찰관 일원화',
                '★ 보완수사 완료기간 1개월로 단축(제197조의2) — 김용민·박은정 안(3개월)보다 신속',
                '★ 보완수사 수사관서 지정·변경권 신설 — 특정 수사관서의 적정 이행이 어려운 사정이 있으면 검사가 관서를 지정·변경',
                '★ 재수사요청 강화(제245조의8) — 요청기간 90일 명문화(새 증거·허위/위조 정황 시 제한 없음), 고소인 통지의무, 재수사 기간 3개월, "다시 재수사 요청" 규정 신설',
                '보완수사·재수사 불이행 시 직무배제·교체·징계 요구 / 수사인권보호관·공소심의회 등 부가 기구는 두지 않음',
            ],
            sources: [
                { name: '경향신문', url: 'https://www.khan.co.kr/article/202607092148005/' },
                { name: '아주경제(보완수사요구권)', url: 'https://www.ajunews.com/view/20260709173302438' },
                { name: '한국일보(당 TF 발의)', url: 'https://www.hankookilbo.com/news/article/A2026070917320002317' },
                { name: '국회 의안 2219875(열려라국회)', url: 'https://watch.peoplepower21.org/BillDetail/2219875' },
            ],
        },
    ],
    articles: [
        { article: '검사 직접수사·직접 보완수사', law: '제196조 등', kimpark: '폐지 — 송치사건도 검사는 직접 보완수사 불가, 사법경찰관에 「요구」만 가능', hankyu: '폐지 — 수사 주체를 사법경찰관으로 일원화' },
        { article: '보완수사 요구·이행강제', law: '제197조의2', kimpark: '대상·방법·절차·시기 문서 명시 요구·이행관리 / 3개월 원칙 / 불이행 시 직무배제·교체 요구', hankyu: '★ 1개월로 단축 + ★ 수사관서 지정·변경권 / 불이행 시 직무배제·교체·징계 요구' },
        { article: '불송치 재수사 요청', law: '제245조의8', kimpark: '재수사 요청·기간 규정 정비', hankyu: '★ 90일 명문화(예외 무제한) + 고소인 통지의무 + 재수사 3개월 + "다시 요청" 신설 + 불이행 제재' },
        { article: '인권보호·민주통제 기구', law: '제196조·제246조의3', kimpark: '★ 수사인권보호관 + ★ 공소심의회 신설', hankyu: '두지 않음 (수사·기소 분리 원칙 구현에 집중)' },
        { article: '피해자 구제(불복·재정신청)', law: '제245조의7·제260조 등', kimpark: '★ 두텁게 정비 — 불송치 이의신청·재수사요청 + 불기소 재정신청 대폭 정비를 공소심의회 심의와 연계 + 고소인 통지·기록 열람·피해자보호', hankyu: '통지·이의신청 등 기본 정비 (공소심의회 없음, 재정신청 정비 상대적 약함)' },
        { article: '수사심의회(수사단계 심의)', law: '—', kimpark: '없음 (기소 심의 「공소심의회」만 신설)', hankyu: '없음' },
    ],
    debates: [
        { title: '공소청의 경찰 직무배제·징계요구권', pro: '부실수사 방지·공소유지 실효성 확보(수사지휘 없이도 최소한의 통제)', con: '사실상 수사지휘 부활·"제2의 검찰"화 우려, 경찰 수사 독립성 침해', finland: '검사에게 경찰 징계·직무배제권을 주지 않는다. 위법·부실수사 통제는 검찰이 아니라 독립 감찰기구(법률감찰단〔핀란드 법무총감〕 + 시민옴부즈만〔핀란드 의회 옴부즈만〕) + 경찰 내부 감찰이 맡는다. → 「검사가 경찰을 통제」가 아니라 「독립 감찰이 양쪽을 감시」 — 수사·기소 분리를 지키면서 통제도 확보.' },
        { title: '보완수사 1개월(김한규) vs 3개월(김용민·박은정)', pro: '1개월=신속한 사건처리 / 3개월=복잡사건 충실수사', con: '1개월=복잡사건 부실 우려 / 3개월=사건 지연·미제 누적', finland: '「기한」 다툼은 검사가 경찰에 사건을 되돌려 지휘하는 구조에서 생긴다. 핀란드는 경찰이 수사를 완결(완결수사권)하고 검사는 결과로 기소만 판단하며, 필요한 소통은 수사 초기 「협력(cooperation)」으로 처리 — 지휘가 아니다. → 보완수사 기한 규정 자체가 불필요.' },
        { title: '수사인권보호관·공소심의회(김용민·박은정)', pro: '수사 인권보호·기소권 민주통제 강화', con: '기구 남설(옥상옥)·기소 지연, 실효성 의문', finland: '핀란드는 기구를 새로 늘리기보다 이미 있는 이중 감시(법률감찰단〔핀란드 법무총감〕 + 시민옴부즈만〔핀란드 의회 옴부즈만〕)가 인권·적법성을 상시 점검한다. 기소 통제는 「내부 심의회」가 아니라 시민이 참여하는 통제(참심제)와 입법부 옴부즈만으로. → 「옥상옥」 대신 독립·상설 감시로 같은 목적(인권보호·민주통제)을 달성.' },
        { title: '수사관서 지정·변경권 + 직무배제·징계요구권(민주당·김한규 등 22인) — 「수사지휘의 부활」 논란', pro: '부실·편파 수사관서를 우회해 공소유지 실효성 확보', con: '★ 사실상 「수사지휘의 부활」 — 공소청이 수사관서를 지정·변경하고 경찰관 직무배제·징계까지 요구하면, 형식상 "요구"라도 실질은 검사가 경찰 수사를 좌우하는 지휘. 수사·기소 분리 원칙이 형해화되고 검찰권력이 「공소청」 이름으로 존속할 우려', finland: '★ 핀란드엔 검사의 「수사관서 지정·변경권」도 「경찰 징계요구권」도 없다. 검사가 수사관서·수사관을 고르거나 갈아치우는 것은 지휘 그 자체다. 핀란드는 경찰이 수사 주체를 정하고(완결수사권), 부실·편파 수사는 독립 감찰기구가 사후 감찰·시정한다. → 「검사가 경찰을 고른다」가 아니라 「독립 감찰이 잘못을 잡는다」 — 이것이 수사지휘 부활을 막는 핀란드 방식.' },
        { title: '검사 직접수사 전면 폐지', pro: '수사·기소 분리로 검찰권 남용 차단', con: '경제·부패 등 전문수사 공백(→중수청 이관)·과도기 혼란', finland: '핀란드 검사는 애초에 직접수사를 하지 않는다(수사=경찰). 「전문수사 공백」은 검사에게 수사를 남겨서가 아니라, 경찰 내 국가수사국(KRP)처럼 경제·부패·사이버 전담 전문수사 부서를 두어 메운다. → 검사 직접수사 없이도 전문성은 「수사기관 내 전문화」로 확보.' },
    ],
    international: [
        { flag: '🇬🇧', country: '영국(잉글랜드·웨일스)', model: 'CPS(왕립검찰청) 기소 전담·경찰 수사, 검사 수사지휘 없음. 조기수사자문(Early Advice)으로 공소유지 협력', tag: '두 개정안의 공소청 모델과 가장 유사' },
        { flag: '🇺🇸', country: '미국', model: '검사가 경찰 수사 지휘·대배심 기소(주별 상이). 수사·기소 밀접', tag: '한국 개정안과 반대 방향' },
        { flag: '🇩🇪', country: '독일', model: '검사가 "수사의 주재자(Herrin des Verfahrens)", 경찰은 보조. 수사·기소 통합 지휘', tag: '분리보다 통합형' },
        { flag: '🇫🇮', country: '핀란드', model: '수사(경찰)·기소(검사) 분리, 검사는 중요사건 수사 협력·법률자문', tag: '완전 분리 + 협력 (핀란드식 사법개혁안 탭 참조)' },
    ],
    sovereign: '주권자사법개혁추진준비위원회 안은 「독립기소청법·수사기관독립법·시민사법참여법·사법감시이중안전법」의 4법 체계로 공소청을 법무부에서 독립시키고 기소심사위원회·시민감사 등 시민통제를 제도화하는 데 초점이 있다. 반면 형사소송법 개정 2건(김용민·박은정/김한규)은 형사절차 내에서 수사·기소 분리를 구현하는 데 집중한다. 즉 층위가 다르며(주권자위 안=공소청 조직 독립·시민통제 / 형소법 개정=형사절차 정비), 두 접근은 상호 보완될 수 있다.',
    remedyAnalysis: {
        title: '피해자 구제안 · 시민옴부즈만 — 무엇이 더 필요한가',
        victimRelief: {
            q: '피해자 구제안이 필요한가?',
            a: '필요하다. 검사의 직접수사·직접 보완수사가 폐지되면 사건이 경찰 수사 중심으로 이동해 부실수사·불송치·불기소로 피해자 권리가 약화될 위험이 커진다. 따라서 불송치 이의신청(제245조의7)·재수사요청(제245조의8)·불기소 재정신청(제260조)·처분 통지·기록 열람 같은 사후 구제 통로가 반드시 강화되어야 한다. 김용민·박은정 안은 재정신청을 대폭 정비하고 공소심의회 심의와 연계해 이를 두텁게 설계했다. 김한규 안은 상대적으로 약하다(공소심의회 없음).',
        },
        ombudsman: {
            q: '평소 감시·견제하는 「시민옴부즈만」 제도가 필요한가?',
            a: '필요하다. 피해자 구제(이의신청·재정신청)는 피해가 발생하고 처분이 난 뒤 당사자가 신청해야 작동하는 「사후·개별」 구제다. 반면 시민옴부즈만은 특정 사건 당사자가 아니어도 주권자인 시민이 수사·기소권 행사 전반을 「평소·상시」 감시하고 시정을 요구하는 시스템적 견제다. 두 형소법 개정안에는 옴부즈만·상시 시민감시 기구가 없다(김용민·박은정의 수사인권보호관은 수사기관 내부 인권 담당, 공소심의회는 기소 심의로, 독립적 시민 옴부즈만이 아니다). 주권자사법개혁추진준비위원회 안의 「사법감시이중안전법」(사법감찰관+사법옴부즈만)이 이 상시 감시 기능을 담당한다.',
        },
        conclusion: '「사후 구제(피해자 구제) + 상시 감시(시민옴부즈만)」의 병행이 필요하다. 사후 구제만으로는 권력 남용을 사전에 억제하지 못하고, 상시 감시가 없으면 남용이 반복된다. 헌법 제1조(주권재민)가 요구하는 것은 주권자인 국민이 수사·기소 권력을 「평소에」 통제하는 것이며, 시민옴부즈만은 그 상시적 통제의 핵심 장치다.',
        note: '※ 수사심의회(수사 단계 심의 기구)는 두 개정안 모두 두지 않는다. 김용민·박은정 안에는 「공소심의회」(기소 여부 심의, 제246조의3)만 있다. 현행 대검찰청 「수사심의위원회」는 검찰 내부 자문기구로 이 법안들의 공식 기구와 별개다.',
    },
    constitutionalEval: {
        title: '헌법 제1조·민주주의 부합성 평가',
        intro: '헌법 제1조(①민주공화국 ②주권은 국민에게 있고 모든 권력은 국민으로부터)의 관점에서 핵심 질문은 "수사·기소 권력을 얼마나 주권자인 국민의 민주적 통제 아래 두고, 특정 기관의 자의적 권력 독점을 막느냐"이다. 이 기준으로 보면 —',
        ranking: [
            { rank: '가장 부합', color: 'green', model: '핀란드식 완전분리 + 시민통제', reason: '수사(경찰)와 기소(검사)를 완전히 분리하고, 참심제·시민 사법참여·이중 감시로 주권자(국민)가 사법권력을 직접 통제한다. 어느 기관도 수사·기소를 독점하지 못하므로 헌법 제1조의 주권재민 원리에 가장 근접한다.' },
            { rank: '상대적 부합', color: 'blue', model: '김용민·박은정 안', reason: '검사의 직접수사·직접 보완수사를 폐지하고 수사인권보호관·공소심의회 등 민주적 통제 장치를 신설한다. 수사지휘 부활 요소가 상대적으로 적어, 두 형소법 개정안 중에서는 최소한 이 안이 우선 통과되어야 한다.' },
            { rank: '후퇴 우려', color: 'amber', model: '민주당(김한규 등 22인) 안', reason: '수사관서 지정·변경권 + 직무배제·징계요구권 등 강한 이행강제는 "수사지휘 없는 통제"의 경계를 넘어 사실상 검사(공소청)의 수사지휘를 부활시킬 소지가 크다. 이는 수사·기소 분리 원칙을 형해화해, 헌법 제1조가 요구하는 권력 분산·민주적 통제에 역행할 우려가 있다.' },
        ],
        conclusion: '두 형소법 개정안 중에서는 수사지휘 부활 요소가 적고 민주적 통제 장치를 갖춘 김용민·박은정 안이 최소한 우선 통과되어야 한다. 그러나 더 근본적인 물음은 "어느 모델이 헌법 제1조(주권재민)와 민주주의에 부합하는가"이며, 그 답은 핀란드식 완전분리와 시민통제(참심제·기소심의·시민감사)를 결합한 모델이다. 검찰개혁의 최종 좌표는 "검찰을 공소청으로 개명하는 것"이 아니라 "사법권력을 주권자인 국민의 통제 아래 두는 것"이어야 한다.',
    },
    finlandModel: {
        title: '핀란드는 어떻게 했나 — 구체적 대안',
        facts: [
            { label: '수사·기소 분리 + 협력 (1996 개혁)', text: '경찰(수사기관)이 수사를 담당하고, 검사는 수사에 「협력」하며 수사 종료 후 기소 여부를 최종 판단한다. 검사는 수사지휘관이 아니라 협력자이자 기소 판단자다.' },
            { label: '검사의 독립성', text: '검사(국가검찰청, Syyttäjälaitos)는 수사 전 단계·기소·재판에 관여하는 유일한 기관이지만, 기소 결정에서 「자율적·독립적」 사법 행정관으로 활동한다.' },
            { label: '경찰 범죄는 검사가 수사 지휘', text: '경찰관이 저지른 범죄는 예외적으로 검사가 수사 단계부터 「수사의 장」으로 지휘한다. 2024.10부터 검찰총장실 산하 「경찰범죄수사부」로 집중 — 경찰의 셀프수사를 원천 차단.' },
            { label: '★ 의회가 선출하는 옴부즈만(oikeusasiamies)', text: '의회(Eduskunta)가 선출하는 「최고 적법성 감시관」. 법원·행정청·공무원은 물론 경찰과 검찰총장의 적법성을 상시 감시한다. ① 시민 민원 조사 ② 직권 조사 ③ 현장 점검 ④ 입법 의견 — 특히 경찰 수사·강제처분·수사절차를 집중 감시.' },
            { label: '이중 안전장치 — 법무총감(Chancellor of Justice)', text: '옴부즈만과 별도로 법무총감(oikeuskansleri)이 병행 감시 — 상시 감시를 이중으로.' },
        ],
        contrast: '한국의 두 개정안은 핀란드식 「협력구조」 대신 검사의 「요구권 + 이행강제(직무배제·교체·징계요구, 김한규는 수사관서 지정·변경권까지)」로 설계돼 검사가 경찰을 지휘하는 색채가 강하다. 무엇보다 핀란드의 핵심인 「의회 선출 독립 옴부즈만(상시 시민감시)」이 두 법안 모두 빠져 있다. 김용민·박은정의 수사인권보호관은 수사기관 내부 인권 담당(독립기구 아님), 공소심의회는 기소 심의로, 옴부즈만이 아니다.',
        alternative: [
            '① 수사–기소 「협력구조」로 전환 — 이행강제(직무배제·징계요구·수사관서 지정변경) 대신 검사의 조기 자문·협력. 검사는 지휘가 아니라 기소 판단에 집중.',
            '② 경찰 범죄 전담 독립수사 — 경찰이 저지른 범죄는 별도 독립 수사기구(핀란드 경찰범죄수사부 모델)가 담당해 셀프수사 차단(중수청·공수처와 연계).',
            '③ ★ 「의회 선출 시민옴부즈만(사법옴부즈만)」 신설 — 국회가 선출하는 독립기구가 경찰·공소청의 적법성을 상시 감시(민원 조사+직권 조사+현장 점검+입법 의견). = 주권자위 안 「사법감시이중안전법」(사법감찰관+사법옴부즈만).',
            '④ 피해자 구제 이중화 — 불기소·불송치 재정신청(사후) + 옴부즈만 민원(상시)을 병행.',
            '⑤ 공소청의 조직 독립 — 공소청을 법무부에서 독립(주권자위 「독립기소청법」)해 검사 독립성을 제도적으로 보장.',
        ],
        conclusion: '핀란드의 교훈은 "검사에게 경찰에 대한 강한 이행강제권을 주는 것"이 아니라 "① 수사–기소를 협력구조로 분리하고 ② 의회가 선출한 독립 옴부즈만이 양쪽을 상시 감시"하는 것이다. 인권·통제 기구 없이 이행강제만 강화하면, 제도가 부실하다는 비판이 나올 때 「역시 검사(검찰)의 지휘가 필요하다」는 검찰 부활론의 빌미가 될 수 있다 — 이것이 김한규 안이 인권·통제 기구를 두지 않은 데 대한 주권자 관점의 우려다. 최소한 김용민·박은정 안의 통제·인권 장치를 갖추되, 궁극적으로는 핀란드식 「협력 + 의회 선출 시민옴부즈만」을 도입해야 한다.',
        sources: [
            { name: '핀란드 국가검찰청', url: 'https://syyttajalaitos.fi/en/the-national-prosecution-authority' },
            { name: '핀란드 의회 옴부즈만', url: 'https://oikeusasiamies.fi/en/parliamentary-ombudsman' },
        ],
    },
    jangCase: {
        title: '장윤기 사건과 「보완수사권 존치론」 — 사실과 반론',
        facts: '2026.5.5 광주 광산구에서 장윤기가 여고생을 살해한 사건. 경찰은 「단순살인」으로 송치했으나 검찰이 보완수사로 성범죄(강간살인) 정황을 보강해 기소했다. 장윤기의 부친(현직 경찰 간부)이 성인용품·휴대전화 등을 폐기하고, 초동수사 때 누락된 케이블타이가 부친 집에서 발견됐으며, 광산경찰서 강력팀이 부친과 통화하며 정보를 누설하고 「경찰인 사실을 숨기라」는 윗선 지시 녹취까지 나오는 등 경찰의 조직적 은폐 정황이 드러났다(수사 진행 중). 이를 근거로 「검사 보완수사가 없었다면 진실이 은폐됐을 것」이라며 검찰 보완수사권 존치론이 재점화됐다.',
        claim: '경찰이 조직적으로 증거를 인멸했고 검찰의 보완수사로 강간살인이 밝혀졌으니, 경찰을 견제할 「검사 보완수사권」을 폐지해선 안 된다.',
        rebuttals: [
            { title: '① 진짜 문제는 「경찰의 셀프수사·이해충돌」이지 검찰 권한 축소가 아니다', text: '핵심은 부친이 현직 경찰이고 동료 경찰이 은폐에 가담한, 「경찰이 경찰을 수사」하는 이해충돌이다. 검사에게 경찰 위 지휘권을 줄 문제가 아니라, 핀란드처럼 「경찰이 연루된 범죄는 별도 독립 수사기구(경찰범죄수사부·공수처·중수청)」가 맡아야 한다는 것을 보여준다. 검찰 권한 확대로 경찰 유착을 막자는 논리는, 검찰 유착이 생기면 다시 경찰 확대로 막자는 악순환일 뿐이다.' },
            { title: '② 개정안도 「보완수사 요구권·재수사 요청권」은 유지·강화한다 — 폐지되는 건 「검사 직접수사」다', text: '김용민·박은정/김한규 안 모두 검사가 경찰에 보완수사를 「요구」하고 불이행 시 직무배제·징계까지 요구할 수 있으며(제197조의2), 불송치 재수사 요청(제245조의8)도 강화한다. 「경찰 부실수사를 거를 장치」는 개정안에 그대로 있다. 장윤기 사건에서 검찰이 한 것도 송치 후 「보완수사」로, 이는 개정안의 보완수사 요구·재수사 구조로도 가능하다. 「직접수사 폐지 = 견제 소멸」은 사실 왜곡이다.' },
            { title: '③ 검찰 보완수사권도 만능이 아니다 — 검찰의 봐주기·부실수사 역사', text: '검찰 역시 김건희·통일교 사건 등에서 봐주기·부실수사 논란을 반복했다. 한 기관에 권력을 몰아주면, 그 기관이 유착·은폐의 주체가 될 때 통제할 수단이 사라진다. 답은 특정 기관의 권한 독점이 아니라 「수사·기소 분리 + 독립 시민감시」다.' },
            { title: '④ 부친 처벌 공백은 「형법 친족특례」 문제 — 보완수사권과 무관', text: '부친이 증거인멸로 처벌받지 않는 것은 「검찰 보완수사권 유무」가 아니라 형법상 친족간 증거인멸 특례 때문이다. 공무원(경찰)이 직무상 지위를 이용해 자녀 사건을 은폐한 경우 친족특례를 배제하는 형법 개정이 필요하며, 이는 보완수사권 존폐와는 별개의 입법과제다.' },
            { title: '⑤ 은폐를 끝내 드러낸 것은 언론·시민의 감시였다', text: '경찰 내부 은폐 정황을 세상에 드러낸 결정적 힘은 언론 보도와 시민의 감시였다. 상시 「시민옴부즈만(핀란드식)」이 제도화돼 있었다면 경찰의 은폐가 더 일찍·체계적으로 걸러졌을 것이다. 사건이 가리키는 방향은 「검찰 권한 강화」가 아니라 「독립 수사 + 상시 시민감시」다.' },
        ],
        conclusion: '장윤기 사건의 진짜 교훈은 「검찰에 권한을 몰아주자」가 아니라 ① 경찰 유착 사건은 독립 수사기구가 맡고 ② 검사의 보완수사 요구권·재수사 요청권은 유지하되(개정안이 이미 그렇다) ③ 형법 친족특례를 손보고 ④ 의회 선출 시민옴부즈만이 경찰·공소청을 상시 감시하는 것이다. 한 기관의 권력 강화가 아니라 「분리·독립·시민감시」가 헌법 제1조(주권재민)에 부합하는 해법이다.',
        sources: [
            { name: '한국일보', url: 'https://www.hankookilbo.com/news/article/A2026070911060003280' },
            { name: 'YTN(친족특례)', url: 'https://www.ytn.co.kr/_ln/0103_202607041858392707' },
            { name: '오마이뉴스(존폐 논란)', url: 'https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003249370' },
        ],
    },
    multiLayer: {
        title: '장윤기 사건 재발 방지 — 핀란드식 2중·3중 안전장치',
        intro: '장윤기 사건 같은 경찰 유착·은폐를 막으려면 「검찰에 권한을 몰아주는」 단일 통제가 아니라, 핀란드처럼 서로 독립된 여러 겹의 감시·수사 장치가 필요하다.',
        layers: [
            { n: '1중', name: '독립수사팀', color: 'blue', org: '독립기구 (경찰·검찰에서 분리)', orgDetail: '핀란드 = 검찰총장실 산하 「경찰범죄수사부」 / 한국 = 공수처·중수청 등 어느 부처에도 예속되지 않는 독립기구', desc: '경찰·검사 등 수사기관이 연루된 사건은 소속과 분리된 독립 수사기구가 전담 수사 — 셀프수사·이해충돌 차단.' },
            { n: '2중', name: '법률감찰단(사법감찰관)', color: 'green', org: '독립 감찰기구 (직무상 독립)', orgDetail: '핀란드 = 정부(행정부) 소속이되 헌법상 독립인 「법무총감(Chancellor of Justice)」 / 한국 = 주권자위 「사법감시이중안전법」의 독립 사법감찰관', desc: '수사·기소 기관의 위법·유착·부실을 상시 감찰 — 개별 사건을 넘어 조직적 문제를 적발.' },
            { n: '3중', name: '시민옴부즈만', color: 'purple', org: '★ 입법부(국회) 선출 — 행정부에서 독립', orgDetail: '핀란드 = 「의회(Eduskunta)가 선출」하는 의회 옴부즈만(oikeusasiamies) / 한국 = 국회가 선출하는 독립 사법옴부즈만', desc: '시민 민원·직권조사·현장점검으로 경찰·공소청을 상시 감시하고 시정 요구 — 최종 시민 통제.' },
        ],
        placementNote: '핵심은 「소속」이다. 세 장치가 모두 행정부(대통령) 아래 있으면 서로를, 그리고 행정부를 견제하지 못한다. 핀란드가 옴부즈만을 「의회(입법부)」가 선출하게 한 이유가 바로 이것 — 감시자가 감시 대상(행정부)으로부터 독립해야 실효성이 있다. 따라서 독립수사팀·법률감찰단은 어느 부처에도 예속되지 않는 「독립기구」로, 최소한 3중 시민옴부즈만은 「국회(입법부) 선출」로 두어 행정부로부터 독립시켜야 한다. (국무총리·법무부 등 행정부 산하에 두면 셀프감시가 되어 장윤기식 은폐를 막지 못한다.)',
        plus: '여기에 ① 검사의 보완수사 요구권·재수사 요청권(개정안 유지)으로 개별 사건의 부실을 거르고 ② 형법 친족특례를 개정해 공무원의 직무상 은폐를 처벌하면, 장윤기식 은폐는 여러 겹에서 걸러진다.',
        conclusion: '핵심은 「한 기관(검찰)의 힘」이 아니라 「서로 견제하는 여러 겹의 독립 장치 + 주권자 시민의 상시 감시」다. 이것이 헌법 제1조(주권재민)에 부합하는 장윤기 사건의 진짜 해법이다.',
    },
    assessment: '두 개정안은 검사의 직접수사·직접 보완수사를 폐지하고 수사 주체를 사법경찰관으로 일원화하되, 공소청 검사의 보완수사 요구권·재수사 요청권을 유지·강화한다는 큰 틀이 동일하다. 차이는 강조점이다. 김용민·박은정 안은 수사인권보호관·공소심의회 등 인권보호·민주통제 기구를 대거 신설한 "포괄형"이고, 김한규 안은 보완수사 1개월 단축·수사관서 지정변경권·재수사요청 강화 등 공소청의 실질적 이행강제 수단을 촘촘히 설계한 "이행강제형"이다. 공통 쟁점은 "수사지휘 없는 통제"의 경계 — 직무배제·징계요구권이 자칫 수사지휘의 부활로 비칠 수 있다는 점이다.',
};

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
                        summary: '기소기관 권한 명확화 — 수사 개입 일체 배제',
                        details: [
                            '기소기관이 가져야 할 것: 수사 결과물 검토권, 기소/불기소 결정권, 공판 유지권, 법령 해석·적용 권한',
                            '기소기관이 가지면 안 되는 것: 보완수사요구권, 영장청구권, 특별사법경찰 지휘·감독권, 수사 과정 개입 일체',
                            '국민이 이 권력을 통제할 수 있는 장치가 반드시 수반되어야 한다는 원칙 제시'
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
                        summary: '국민의 사법 권력 통제 장치 수반 원칙 제시',
                        details: [
                            '헌법 제1조 제2항 구현: 국민이 이 권력을 통제할 수 있는 장치가 반드시 수반되어야 한다는 원칙 제시',
                            '기소권에 대한 국민 통제 필요성 언급',
                            '재판에 대한 국민 참여 필요성 언급',
                            '사법기관에 대한 국민 감시 필요성 언급',
                            '국무총리 직속 국가수사위원회 신설 추진 (장경태 의원안)'
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
    const [showLawComparison, setShowLawComparison] = useState(false);
    const [lawComparisonData, setLawComparisonData] = useState(null);
    const [lawHistoryData, setLawHistoryData] = useState(null);
    const [comparisonLoading, setComparisonLoading] = useState(false);

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
                image={activeTab === 'prosecution-reform' ? '/검찰개혁심층분석.png?v=20260626' : activeTab === 'finland-reform' ? '/핀란드식사법개혁안.png' : '/사법개혁안비교.png'}
            />
            <Header />
            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-7xl">
                    {/* 페이지 헤더 */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                            사법 개혁안 비교
                        </h1>
                        <p className="text-gray-500 text-base">
                            정부/여당, 야당, 시민사회의 사법개혁안을 한눈에 비교합니다
                        </p>
                    </div>

                    {/* 통계 요약 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                            <p className="text-3xl font-bold text-gray-900">9</p>
                            <p className="text-base text-gray-500">개혁 영역</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                            <p className="text-3xl font-bold text-blue-600">8</p>
                            <p className="text-base text-gray-500">비교 주체</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                            <p className="text-3xl font-bold text-green-600">2026</p>
                            <p className="text-base text-gray-500">시행 목표</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                            <p className="text-3xl font-bold text-purple-600">22대</p>
                            <p className="text-base text-gray-500">국회</p>
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
                                            className={`w-full text-left px-4 py-3 text-base font-medium transition-colors border-l-4 whitespace-nowrap lg:whitespace-normal ${
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
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    {activeReform.icon} {activeReform.title}
                                </h2>
                                <p className="text-gray-600">{activeReform.description}</p>
                            </div>

                            {activeReform.customRender && activeTab === 'prosecution-reform' ? (
                                <div className="space-y-8">
                                    {/* 섹션 A: 검찰개혁 법안 수정안 비교 */}
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>📋</span> 검찰개혁 법안 수정안 비교 <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-sm rounded-full font-medium">2026.3.17 법사위 통과 기준</span>
                                        </h3>
                                        <div className="grid md:grid-cols-3 gap-4">
                                            {/* 정부 수정안 */}
                                            <div className={`bg-white border-2 ${BILL_COMPARISON_REVISED.government.color} rounded-xl overflow-hidden shadow-sm`}>
                                                <div className={`${BILL_COMPARISON_REVISED.government.bgColor} px-4 py-3 border-b`}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-gray-800">{BILL_COMPARISON_REVISED.government.name}</h4>
                                                        <span className={`px-2 py-0.5 text-sm rounded-full font-medium ${BILL_COMPARISON_REVISED.government.badgeColor}`}>{BILL_COMPARISON_REVISED.government.badge}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500">{BILL_COMPARISON_REVISED.government.subtitle}</p>
                                                </div>
                                                <div className="px-4 py-3 space-y-3">
                                                    <p className="text-lg text-gray-600">{BILL_COMPARISON_REVISED.government.description}</p>

                                                    <div>
                                                        <p className="text-base font-bold text-green-700 mb-1">✅ 유지된 권한</p>
                                                        <ul className="space-y-0.5">
                                                            {BILL_COMPARISON_REVISED.government.retained.map((item, i) => (
                                                                <li key={i} className="text-base text-gray-600 flex items-start gap-1"><span className="text-green-400 shrink-0">•</span>{item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div>
                                                        <p className="text-base font-bold text-red-700 mb-1">❌ 삭제된 권한 (원안 대비)</p>
                                                        <ul className="space-y-0.5">
                                                            {BILL_COMPARISON_REVISED.government.deleted.map((item, i) => (
                                                                <li key={i} className="text-base text-gray-600 flex items-start gap-1"><span className="text-red-400 shrink-0">•</span>{item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div>
                                                        <p className="text-base font-bold text-blue-700 mb-1">🆕 새로 추가</p>
                                                        <ul className="space-y-0.5">
                                                            {BILL_COMPARISON_REVISED.government.added.map((item, i) => (
                                                                <li key={i} className="text-base text-gray-600 flex items-start gap-1"><span className="text-blue-400 shrink-0">•</span>{item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div className="bg-orange-50 rounded-lg p-2">
                                                        <p className="text-base font-bold text-orange-700 mb-1">⚠️ 한계</p>
                                                        <ul className="space-y-0.5">
                                                            {BILL_COMPARISON_REVISED.government.limitations.map((item, i) => (
                                                                <li key={i} className="text-base text-orange-800 flex items-start gap-1"><span className="shrink-0">▸</span>{item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div className="flex flex-wrap gap-1 pt-1">
                                                        {BILL_COMPARISON_REVISED.government.sources.map((s, i) => (
                                                            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded hover:bg-gray-200">{s.name}</a>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 민주당 수정 원칙 */}
                                            <div className={`bg-white border-2 ${BILL_COMPARISON_REVISED.democrat.color} rounded-xl overflow-hidden shadow-sm`}>
                                                <div className={`${BILL_COMPARISON_REVISED.democrat.bgColor} px-4 py-3 border-b`}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-gray-800">{BILL_COMPARISON_REVISED.democrat.name}</h4>
                                                        {BILL_COMPARISON_REVISED.democrat.badge && <span className={`px-2 py-0.5 text-sm rounded-full font-medium ${BILL_COMPARISON_REVISED.democrat.badgeColor}`}>{BILL_COMPARISON_REVISED.democrat.badge}</span>}
                                                    </div>
                                                    <p className="text-sm text-gray-500">{BILL_COMPARISON_REVISED.democrat.subtitle}</p>
                                                </div>
                                                <div className="px-4 py-3 space-y-3">
                                                    <p className="text-lg text-gray-600">{BILL_COMPARISON_REVISED.democrat.description}</p>

                                                    <div>
                                                        <p className="text-base font-bold text-blue-700 mb-1">🔧 주요 수정 사항</p>
                                                        <ul className="space-y-0.5">
                                                            {BILL_COMPARISON_REVISED.democrat.keyModifications.map((item, i) => (
                                                                <li key={i} className="text-base text-gray-600 flex items-start gap-1"><span className="text-blue-400 shrink-0">•</span>{item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div className="bg-blue-50 rounded-lg p-2 space-y-2">
                                                        <p className="text-base font-bold text-blue-700 mb-1">💬 주요 발언</p>
                                                        {BILL_COMPARISON_REVISED.democrat.keyQuotes.map((q, i) => (
                                                            <div key={i}>
                                                                <p className="text-sm font-semibold text-blue-600">{q.speaker}</p>
                                                                <p className="text-base text-blue-800 italic">"{q.content}"</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="bg-orange-50 rounded-lg p-2">
                                                        <p className="text-base font-bold text-orange-700 mb-1">⚠️ 한계</p>
                                                        <ul className="space-y-0.5">
                                                            {BILL_COMPARISON_REVISED.democrat.limitations.map((item, i) => (
                                                                <li key={i} className="text-base text-orange-800 flex items-start gap-1"><span className="shrink-0">▸</span>{item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div className="flex flex-wrap gap-1 pt-1">
                                                        {BILL_COMPARISON_REVISED.democrat.sources.map((s, i) => (
                                                            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded hover:bg-gray-200">{s.name}</a>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 주권자사법개혁추진준비위원회 개정안 */}
                                            <div className={`bg-white border-2 ${BILL_COMPARISON_REVISED.sovereign.color} rounded-xl overflow-hidden shadow-sm`}>
                                                <div className={`${BILL_COMPARISON_REVISED.sovereign.bgColor} px-4 py-3 border-b`}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-gray-800">{BILL_COMPARISON_REVISED.sovereign.name}</h4>
                                                        {BILL_COMPARISON_REVISED.sovereign.badge && <span className={`px-2 py-0.5 text-sm rounded-full font-medium ${BILL_COMPARISON_REVISED.sovereign.badgeColor}`}>{BILL_COMPARISON_REVISED.sovereign.badge}</span>}
                                                    </div>
                                                    <p className="text-sm text-gray-500">{BILL_COMPARISON_REVISED.sovereign.subtitle}</p>
                                                </div>
                                                <div className="px-4 py-3 space-y-3">
                                                    <p className="text-lg text-gray-600">{BILL_COMPARISON_REVISED.sovereign.description}</p>

                                                    <div>
                                                        <p className="text-base font-bold text-green-700 mb-1">📜 4법 체계</p>
                                                        <ul className="space-y-1">
                                                            {BILL_COMPARISON_REVISED.sovereign.bills.map((bill, i) => (
                                                                <li key={i} className="text-base text-gray-600 flex items-start gap-1.5">
                                                                    <span className="shrink-0">{bill.icon}</span>
                                                                    <span><span className="font-semibold">{bill.name}</span> — {bill.description}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div>
                                                        <p className="text-base font-bold text-green-700 mb-1">🎯 핵심 특징</p>
                                                        <ul className="space-y-0.5">
                                                            {BILL_COMPARISON_REVISED.sovereign.keyFeatures.map((item, i) => (
                                                                <li key={i} className="text-base text-gray-600 flex items-start gap-1"><span className="text-green-400 shrink-0">•</span>{item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div className="bg-green-50 rounded-lg p-2">
                                                        <p className="text-base font-bold text-green-700 mb-1">💡 장점</p>
                                                        <ul className="space-y-0.5">
                                                            {BILL_COMPARISON_REVISED.sovereign.advantages.map((item, i) => (
                                                                <li key={i} className="text-base text-green-800 flex items-start gap-1"><span className="shrink-0">✓</span>{item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 섹션 A-2: 형사소송법 검찰개혁 개정안 2건 심층 비교 (조문·논쟁점·해외사례·주권자위) */}
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                                            <span>📑</span> 형사소송법 검찰개혁 개정안 2건 심층 비교 <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">2026.6~7 발의 · 국회 원문(조문) 분석</span>
                                        </h3>
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                            <p className="text-base text-blue-900 leading-relaxed">{CRIMINAL_PROCEDURE_BILLS.intro}</p>
                                        </div>
                                        {/* 2개 법안 카드 */}
                                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                                            {CRIMINAL_PROCEDURE_BILLS.bills.map((b, i) => (
                                                <div key={i} className={`bg-white border-2 ${b.border} rounded-xl overflow-hidden shadow-sm`}>
                                                    <div className={`${b.bg} px-4 py-3 border-b`}>
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <h4 className="font-bold text-gray-800">{b.name}</h4>
                                                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${b.badge}`}>{b.stance}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500">의안 {b.billNo} · {b.proposers} · {b.date}</p>
                                                        <p className="text-base font-semibold text-gray-600 mt-1">{b.purpose}</p>
                                                    </div>
                                                    <div className="px-4 py-3">
                                                        <ul className="space-y-1">
                                                            {b.points.map((p, j) => (
                                                                <li key={j} className="text-base text-gray-700 flex items-start gap-1"><span className="text-gray-400 shrink-0">•</span>{p}</li>
                                                            ))}
                                                        </ul>
                                                        {b.sources && (
                                                            <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-100">
                                                                {b.sources.map((s, j) => (
                                                                    s.url ? <a key={j} href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded hover:bg-gray-200">{s.name}</a> : <span key={j} className="text-sm px-1.5 py-0.5 text-gray-400">{s.name}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {/* 조문별 비교표 */}
                                        <p className="text-base font-bold text-gray-700 mb-2">📜 조문별 비교</p>
                                        <div className="overflow-x-auto mb-6">
                                            <table className="w-full min-w-[720px] text-base border border-gray-200 rounded-lg overflow-hidden">
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="px-3 py-2 text-left font-bold text-gray-700">쟁점 (조문)</th>
                                                        <th className="px-3 py-2 text-left font-bold text-red-700 border-l border-gray-200">김용민·박은정</th>
                                                        <th className="px-3 py-2 text-left font-bold text-orange-700 border-l border-gray-200">민주당(김한규)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {CRIMINAL_PROCEDURE_BILLS.articles.map((a, i) => (
                                                        <tr key={i} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                                                            <td className="px-3 py-2 align-top font-semibold text-gray-700">{a.article}<span className="block text-xs font-normal text-gray-400">{a.law}</span></td>
                                                            <td className="px-3 py-2 align-top text-gray-600 border-l border-gray-200">{a.kimpark}</td>
                                                            <td className="px-3 py-2 align-top text-gray-600 border-l border-gray-200">{a.hankyu}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {/* 논쟁점 (찬반) */}
                                        <p className="text-base font-bold text-gray-700 mb-2">⚖️ 주요 논쟁점 (찬반)</p>
                                        <div className="space-y-2 mb-6">
                                            {CRIMINAL_PROCEDURE_BILLS.debates.map((d, i) => (
                                                <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                                                    <p className="bg-gray-100 px-3 py-1.5 text-base font-semibold text-gray-800">{d.title}</p>
                                                    <div className="grid md:grid-cols-2">
                                                        <p className="px-3 py-2 text-base text-green-800 bg-green-50 md:border-r border-gray-200"><span className="font-bold">찬성 </span>{d.pro}</p>
                                                        <p className="px-3 py-2 text-base text-red-800 bg-red-50"><span className="font-bold">우려 </span>{d.con}</p>
                                                    </div>
                                                    {d.finland && (
                                                        <p className="px-3 py-2 text-base text-blue-900 bg-blue-50 border-t border-blue-200"><span className="font-bold">🇫🇮 핀란드 대안 </span>{d.finland}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {/* 해외사례 */}
                                        <p className="text-base font-bold text-gray-700 mb-2">🌍 해외 사례 비교</p>
                                        <div className="grid sm:grid-cols-2 gap-3 mb-6">
                                            {CRIMINAL_PROCEDURE_BILLS.international.map((c, i) => (
                                                <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
                                                    <p className="text-base font-bold text-gray-800">{c.flag} {c.country}</p>
                                                    <p className="text-base text-gray-600 mt-0.5">{c.model}</p>
                                                    <p className="text-sm text-blue-600 mt-1">→ {c.tag}</p>
                                                </div>
                                            ))}
                                        </div>
                                        {/* 주권자위 비교 */}
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                            <p className="text-base font-bold text-green-700 mb-1">🏛️ 주권자사법개혁추진준비위원회 개정안과의 관계</p>
                                            <p className="text-base text-green-900 leading-relaxed">{CRIMINAL_PROCEDURE_BILLS.sovereign}</p>
                                        </div>
                                        {/* 종합 */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <p className="text-base font-bold text-blue-700 mb-1">🧭 종합 분석</p>
                                            <p className="text-base text-blue-900 leading-relaxed">{CRIMINAL_PROCEDURE_BILLS.assessment}</p>
                                        </div>
                                        {/* 피해자 구제 · 시민옴부즈만 분석 */}
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                                            <p className="text-lg font-bold text-amber-800 mb-2">🛟 {CRIMINAL_PROCEDURE_BILLS.remedyAnalysis.title}</p>
                                            <div className="space-y-3">
                                                <div className="bg-white/70 rounded-lg p-3 border border-amber-200">
                                                    <p className="text-base font-bold text-gray-800 mb-1">Q. {CRIMINAL_PROCEDURE_BILLS.remedyAnalysis.victimRelief.q}</p>
                                                    <p className="text-base text-gray-700 leading-relaxed">{CRIMINAL_PROCEDURE_BILLS.remedyAnalysis.victimRelief.a}</p>
                                                </div>
                                                <div className="bg-white/70 rounded-lg p-3 border border-amber-200">
                                                    <p className="text-base font-bold text-gray-800 mb-1">Q. {CRIMINAL_PROCEDURE_BILLS.remedyAnalysis.ombudsman.q}</p>
                                                    <p className="text-base text-gray-700 leading-relaxed">{CRIMINAL_PROCEDURE_BILLS.remedyAnalysis.ombudsman.a}</p>
                                                </div>
                                                <div className="bg-orange-100 rounded-lg p-3 border border-orange-300">
                                                    <p className="text-base font-bold text-orange-900 leading-relaxed">{CRIMINAL_PROCEDURE_BILLS.remedyAnalysis.conclusion}</p>
                                                </div>
                                                <p className="text-sm text-gray-500 leading-relaxed">{CRIMINAL_PROCEDURE_BILLS.remedyAnalysis.note}</p>
                                            </div>
                                        </div>
                                        {/* 헌법 제1조·민주주의 부합성 평가 (핵심 결론) */}
                                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-xl p-4 mt-4">
                                            <p className="text-lg font-bold text-indigo-800 mb-1 flex items-center gap-2">🏛️ {CRIMINAL_PROCEDURE_BILLS.constitutionalEval.title} <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">주권자 사법개혁 관점 평가</span></p>
                                            <p className="text-base text-indigo-900 leading-relaxed mb-3">{CRIMINAL_PROCEDURE_BILLS.constitutionalEval.intro}</p>
                                            <div className="space-y-2 mb-3">
                                                {CRIMINAL_PROCEDURE_BILLS.constitutionalEval.ranking.map((r, i) => (
                                                    <div key={i} className={`rounded-lg p-3 border ${r.color === 'green' ? 'bg-green-50 border-green-200' : r.color === 'blue' ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
                                                        <p className="text-base font-bold text-gray-800"><span className={`px-2 py-0.5 rounded-full text-sm mr-2 ${r.color === 'green' ? 'bg-green-200 text-green-800' : r.color === 'blue' ? 'bg-blue-200 text-blue-800' : 'bg-amber-200 text-amber-800'}`}>{r.rank}</span>{r.model}</p>
                                                        <p className="text-base text-gray-700 mt-1">{r.reason}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="bg-white/70 rounded-lg p-3 border border-indigo-200">
                                                <p className="text-base font-bold text-indigo-900 leading-relaxed">{CRIMINAL_PROCEDURE_BILLS.constitutionalEval.conclusion}</p>
                                            </div>
                                        </div>
                                        {/* 핀란드 모델 — 구체적 대안 */}
                                        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-300 rounded-xl p-4 mt-4">
                                            <p className="text-lg font-bold text-cyan-900 mb-2 flex items-center gap-2">🇫🇮 {CRIMINAL_PROCEDURE_BILLS.finlandModel.title}</p>
                                            <p className="text-base font-bold text-gray-700 mb-2">핀란드 실제 제도</p>
                                            <div className="space-y-2 mb-3">
                                                {CRIMINAL_PROCEDURE_BILLS.finlandModel.facts.map((f, i) => (
                                                    <div key={i} className="bg-white/70 rounded-lg p-2.5 border border-cyan-200">
                                                        <p className="text-base font-bold text-cyan-800">{f.label}</p>
                                                        <p className="text-base text-gray-700 leading-relaxed">{f.text}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                                                <p className="text-base font-bold text-amber-700 mb-1">⚠️ 한국 두 법안과의 대조</p>
                                                <p className="text-base text-amber-900 leading-relaxed">{CRIMINAL_PROCEDURE_BILLS.finlandModel.contrast}</p>
                                            </div>
                                            <p className="text-base font-bold text-gray-700 mb-2">💡 구체적 대안 (핀란드 벤치마킹)</p>
                                            <ul className="space-y-1 mb-3">
                                                {CRIMINAL_PROCEDURE_BILLS.finlandModel.alternative.map((a, i) => (
                                                    <li key={i} className="text-base text-gray-800 bg-white/70 rounded-lg p-2 border border-cyan-100 leading-relaxed">{a}</li>
                                                ))}
                                            </ul>
                                            <div className="bg-cyan-100 rounded-lg p-3 border border-cyan-300">
                                                <p className="text-base font-bold text-cyan-900 leading-relaxed">{CRIMINAL_PROCEDURE_BILLS.finlandModel.conclusion}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {CRIMINAL_PROCEDURE_BILLS.finlandModel.sources.map((s, i) => (
                                                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded hover:bg-gray-200">{s.name}</a>
                                                ))}
                                            </div>
                                        </div>
                                        {/* 장윤기 사건 — 보완수사권 존치론 반론 */}
                                        <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 mt-4">
                                            <p className="text-lg font-bold text-rose-900 mb-2 flex items-center gap-2">🔎 {CRIMINAL_PROCEDURE_BILLS.jangCase.title}</p>
                                            <div className="bg-white/70 rounded-lg p-3 border border-rose-200 mb-2">
                                                <p className="text-sm font-bold text-gray-500 mb-1">사건 개요 (수사 진행 중)</p>
                                                <p className="text-base text-gray-700 leading-relaxed">{CRIMINAL_PROCEDURE_BILLS.jangCase.facts}</p>
                                            </div>
                                            <div className="bg-gray-100 rounded-lg p-3 mb-3">
                                                <p className="text-base font-bold text-gray-700 mb-1">📢 「보완수사권 존치」 주장</p>
                                                <p className="text-base text-gray-800 italic">"{CRIMINAL_PROCEDURE_BILLS.jangCase.claim}"</p>
                                            </div>
                                            <p className="text-base font-bold text-rose-700 mb-2">↩️ 반론 (검찰개혁·주권자 관점)</p>
                                            <div className="space-y-2 mb-3">
                                                {CRIMINAL_PROCEDURE_BILLS.jangCase.rebuttals.map((r, i) => (
                                                    <div key={i} className="bg-white/70 rounded-lg p-3 border border-rose-200">
                                                        <p className="text-base font-bold text-rose-800">{r.title}</p>
                                                        <p className="text-base text-gray-700 leading-relaxed">{r.text}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="bg-rose-100 rounded-lg p-3 border border-rose-300">
                                                <p className="text-base font-bold text-rose-900 leading-relaxed">{CRIMINAL_PROCEDURE_BILLS.jangCase.conclusion}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {CRIMINAL_PROCEDURE_BILLS.jangCase.sources.map((s, i) => (
                                                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded hover:bg-gray-200">{s.name}</a>
                                                ))}
                                            </div>
                                        </div>
                                        {/* 2중·3중 안전장치 (장윤기 재발 방지) */}
                                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-4 mt-4">
                                            <p className="text-lg font-bold text-emerald-900 mb-1 flex items-center gap-2">🛡️ {CRIMINAL_PROCEDURE_BILLS.multiLayer.title}</p>
                                            <p className="text-base text-emerald-900 leading-relaxed mb-3">{CRIMINAL_PROCEDURE_BILLS.multiLayer.intro}</p>
                                            <div className="space-y-2 mb-3">
                                                {CRIMINAL_PROCEDURE_BILLS.multiLayer.layers.map((l, i) => (
                                                    <div key={i} className={`rounded-lg p-3 border flex items-start gap-3 ${l.color === 'blue' ? 'bg-blue-50 border-blue-200' : l.color === 'green' ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200'}`}>
                                                        <span className={`shrink-0 px-2.5 py-1 rounded-full text-sm font-bold ${l.color === 'blue' ? 'bg-blue-200 text-blue-800' : l.color === 'green' ? 'bg-green-200 text-green-800' : 'bg-purple-200 text-purple-800'}`}>{l.n}</span>
                                                        <div>
                                                            <p className="text-base font-bold text-gray-800 flex items-center gap-2 flex-wrap">{l.name} <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/80 border border-gray-300 text-gray-700">🏛️ 소속: {l.org}</span></p>
                                                            <p className="text-base text-gray-700 leading-relaxed">{l.desc}</p>
                                                            <p className="text-sm text-gray-500 mt-0.5">{l.orgDetail}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="bg-amber-100 rounded-lg p-3 border border-amber-300 mb-2">
                                                <p className="text-base font-bold text-amber-900 leading-relaxed">🏛️ 소속이 곧 독립성 — {CRIMINAL_PROCEDURE_BILLS.multiLayer.placementNote}</p>
                                            </div>
                                            <div className="bg-white/70 rounded-lg p-3 border border-emerald-200 mb-2">
                                                <p className="text-base text-gray-700 leading-relaxed">{CRIMINAL_PROCEDURE_BILLS.multiLayer.plus}</p>
                                            </div>
                                            <div className="bg-emerald-100 rounded-lg p-3 border border-emerald-300">
                                                <p className="text-base font-bold text-emerald-900 leading-relaxed">{CRIMINAL_PROCEDURE_BILLS.multiLayer.conclusion}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">출처: 국회 의안정보시스템 원문(의안 2219564 김용민·박은정 등 12인, 2219875 더불어민주당 김한규 등 22인) 제안이유·조문 직접 분석 · 경향·아주경제·한국일보(민주당 발의) · 핀란드 국가검찰청/의회 옴부즈만 공식자료 · 장윤기 사건 언론 교차확인 · 평가·반론은 주권자 사법개혁 관점</p>
                                    </div>

                                    {/* 섹션 B: 핵심 쟁점 분석 (주권자사법개혁추진준비위원회 기준) */}
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>🔥</span> 핵심 쟁점: 수사·기소 분리 실현 여부 <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-sm rounded-full font-medium">주권자사법개혁추진준비위원회 기준 평가</span>
                                        </h3>
                                        <div className="space-y-4">
                                            {KEY_ISSUES.map((issue, idx) => (
                                                <div key={idx} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                                                    <div className="px-5 py-4">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <span className="text-3xl">{issue.icon}</span>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-bold text-gray-800">{issue.title}</h4>
                                                                    <span className={`px-2 py-0.5 text-sm rounded-full font-medium ${
                                                                        issue.risk === 'high' ? 'bg-red-100 text-red-700' :
                                                                        issue.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                        'bg-green-100 text-green-700'
                                                                    }`}>{issue.risk === 'high' ? '미해결' : issue.risk === 'medium' ? '부분 해결' : '해결'}</span>
                                                                </div>
                                                                <p className="text-base text-gray-600 mt-0.5">{issue.description}</p>
                                                            </div>
                                                        </div>

                                                        {issue.keyPoint && (
                                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                                                                <div className="space-y-1.5">
                                                                    <div className="flex items-start gap-2">
                                                                        <span className="text-red-500 font-bold text-base mt-0.5">✕ 삭제</span>
                                                                        <p className="text-base text-gray-800">{issue.keyPoint.deleted}</p>
                                                                    </div>
                                                                    <div className="flex items-start gap-2">
                                                                        <span className="text-amber-600 font-bold text-base mt-0.5">⚠ 잔존</span>
                                                                        <p className="text-base text-gray-800 font-medium">{issue.keyPoint.remained}</p>
                                                                    </div>
                                                                    <div className="flex items-start gap-2">
                                                                        <span className="text-blue-500 font-bold text-base mt-0.5">→ 구조</span>
                                                                        <p className="text-base text-gray-800">{issue.keyPoint.structure}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="grid md:grid-cols-3 gap-2 mb-3">
                                                            {issue.comparison.map((c, cIdx) => (
                                                                <div key={cIdx} className={`rounded-lg p-2.5 border ${
                                                                    c.verdict === 'best' ? 'bg-green-50 border-green-200' :
                                                                    c.verdict === 'good' ? 'bg-blue-50 border-blue-200' :
                                                                    c.verdict === 'partial' ? 'bg-yellow-50 border-yellow-200' :
                                                                    'bg-red-50 border-red-200'
                                                                }`}>
                                                                    <p className={`text-base font-bold mb-1 ${
                                                                        c.verdict === 'best' ? 'text-green-700' :
                                                                        c.verdict === 'good' ? 'text-blue-700' :
                                                                        c.verdict === 'partial' ? 'text-yellow-700' :
                                                                        'text-red-700'
                                                                    }`}>
                                                                        {c.verdict === 'best' ? '◎' : c.verdict === 'good' ? '○' : c.verdict === 'partial' ? '△' : '✕'} {c.actor}
                                                                    </p>
                                                                    <p className="text-base text-gray-700">{c.content}</p>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="bg-gray-50 rounded-lg px-3 py-2">
                                                            <p className="text-base text-gray-700"><span className="font-bold text-green-700">주권자사법개혁추진준비위원회 입장:</span> {issue.ourPosition}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 섹션 D: 국제 비교 */}
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>🌍</span> 국제 비교: 검찰 조직 · 민주화
                                        </h3>
                                        <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200">
                                            <table className="w-full min-w-[1000px]">
                                                <thead>
                                                    <tr>
                                                        <th className="bg-gray-100 px-3 py-3 text-left text-base font-bold text-gray-700 w-[12%]">비교 항목</th>
                                                        {INTERNATIONAL_COMPARISON.map((c, idx) => (
                                                            <th key={idx} className={`${c.bgColor} border-t-4 ${c.color} px-3 py-3 text-center text-base font-bold text-gray-800 w-[22%]`}>
                                                                {c.flag} {c.country}
                                                                <div className="text-sm font-normal text-gray-500 mt-1">{c.model}</div>
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
                                                        <td className="px-3 py-3 text-base font-semibold text-gray-700 bg-gray-50">⚖️ 검찰</td>
                                                        {INTERNATIONAL_COMPARISON.map((c, idx) => (
                                                            <td key={idx} className="px-3 py-3 text-base text-gray-700">
                                                                <p className="font-semibold">{c.prosecution.name}</p>
                                                                <p className="text-gray-500 mt-0.5">{c.prosecution.parent}</p>
                                                                <p className="mt-1">역할: {c.prosecution.role}</p>
                                                                <p className="text-gray-500 mt-0.5 text-sm">{c.prosecution.independence}</p>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                    <tr className="border-t border-gray-100">
                                                        <td className="px-3 py-3 text-base font-semibold text-gray-700 bg-gray-50">🚔 경찰·수사</td>
                                                        {INTERNATIONAL_COMPARISON.map((c, idx) => (
                                                            <td key={idx} className="px-3 py-3 text-base text-gray-700">
                                                                <p className="font-semibold">{c.police.name}</p>
                                                                <p className="mt-0.5">{c.police.role}</p>
                                                                <p className="text-gray-500 mt-0.5 text-sm">{c.police.relationship}</p>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                    <tr className="border-t border-gray-100">
                                                        <td className="px-3 py-3 text-base font-semibold text-gray-700 bg-gray-50">🛡️ 감시·통제</td>
                                                        {INTERNATIONAL_COMPARISON.map((c, idx) => (
                                                            <td key={idx} className="px-3 py-3 text-base text-gray-700">{c.oversight}</td>
                                                        ))}
                                                    </tr>
                                                    <tr className="border-t border-gray-100">
                                                        <td className="px-3 py-3 text-base font-semibold text-gray-700 bg-gray-50">👥 시민 참여</td>
                                                        {INTERNATIONAL_COMPARISON.map((c, idx) => (
                                                            <td key={idx} className="px-3 py-3 text-base text-gray-700">{c.democratization}</td>
                                                        ))}
                                                    </tr>
                                                    <tr className="border-t border-gray-100 bg-gray-50/50">
                                                        <td className="px-3 py-3 text-base font-semibold text-gray-700 bg-gray-50">💡 핵심</td>
                                                        {INTERNATIONAL_COMPARISON.map((c, idx) => (
                                                            <td key={idx} className={`px-3 py-3 text-base font-medium ${
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
                                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>📊</span> 검찰 민주화 종합 평가
                                        </h3>
                                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                            {/* 국가별 총점 */}
                                            <div className="grid grid-cols-4 gap-0 border-b">
                                                {DEMOCRATIZATION_SCORECARD.countries.map((c, idx) => {
                                                    const total = DEMOCRATIZATION_SCORECARD.categories.reduce((sum, cat) => sum + cat[c.key], 0);
                                                    return (
                                                        <div key={idx} className="p-4 text-center border-r last:border-r-0">
                                                            <p className="text-3xl mb-1">{c.flag}</p>
                                                            <p className="text-base font-bold text-gray-800">{c.name}</p>
                                                            <p className={`text-3xl font-bold mt-1 ${total >= 40 ? 'text-green-600' : total >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                                {total}<span className="text-base text-gray-400">/{DEMOCRATIZATION_SCORECARD.totalMax}</span>
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
                                                            <span className="text-lg font-medium text-gray-800">{cat.name}</span>
                                                            <span className="text-base text-gray-400 ml-auto">{cat.description}</span>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            {DEMOCRATIZATION_SCORECARD.countries.map((country, coIdx) => (
                                                                <div key={coIdx} className="flex items-center gap-2">
                                                                    <span className="text-base w-12 text-right text-gray-500">{country.flag} {country.name}</span>
                                                                    <div className="flex-1 bg-gray-100 rounded-full h-4 relative">
                                                                        <div
                                                                            className={`h-4 rounded-full transition-all ${country.color}`}
                                                                            style={{ width: `${cat[country.key] * 10}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className={`text-sm font-bold w-6 ${cat[country.key] >= 7 ? 'text-green-600' : cat[country.key] >= 4 ? 'text-yellow-600' : 'text-red-600'}`}>
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
                                                <p className="text-lg font-bold text-red-800 mb-2">⚠️ 종합 평가: 한국 검찰개혁안의 한계와 대안</p>
                                                <p className="text-base text-red-700 leading-relaxed mb-3">
                                                    한국의 공소청·중수청 개혁안은 조직 분리의 형식을 갖추었으나, 핀란드·독일·일본 등 모범국 대비 시민 통제·참여(2/10),
                                                    검찰 정치적 독립성(3/10), 인사 독립성(3/10)에서 현저히 낮은 점수를 기록합니다.
                                                </p>
                                                <div className="bg-white/70 rounded-lg p-3 border border-red-100">
                                                    <p className="text-base font-bold text-green-800 mb-1">🇫🇮 대안: 핀란드식 검찰 민주화 모델</p>
                                                    <p className="text-base text-gray-700 leading-relaxed">
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
                                        <h3 className="text-xl font-bold text-blue-900 mb-1">{FINLAND_REFORM_BILL.title}</h3>
                                        <p className="text-base text-blue-700 mb-2">{FINLAND_REFORM_BILL.subtitle}</p>
                                        <p className="text-sm text-blue-500">벤치마킹: {FINLAND_REFORM_BILL.basedOn}</p>
                                    </div>

                                    {/* 4개 법안 상세 */}
                                    {FINLAND_REFORM_BILL.bills.map((bill, bIdx) => (
                                        <div key={bIdx} className={`${bill.bgColor} border-l-4 ${bill.color} rounded-xl overflow-hidden shadow-sm`}>
                                            <div className="p-5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-2xl">{bill.icon}</span>
                                                    <h3 className="text-xl font-bold text-gray-800">{bill.name}</h3>
                                                </div>
                                                <p className="text-base text-gray-600 mb-4">{bill.purpose}</p>

                                                <div className="grid md:grid-cols-3 gap-4 mb-4">
                                                    {bill.keyPoints.map((kp, kIdx) => (
                                                        <div key={kIdx} className="bg-white/70 rounded-lg p-4">
                                                            <h4 className="text-base font-bold text-gray-800 mb-2">{kp.title}</h4>
                                                            <ul className="space-y-1.5">
                                                                {kp.items.map((item, iIdx) => (
                                                                    <li key={iIdx} className="text-base text-gray-700 flex items-start gap-1.5">
                                                                        <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                                                                        <span>{item}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="bg-white/50 rounded-lg p-3 border border-gray-200/50">
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-bold">🇫🇮 핀란드 참조:</span> {bill.finlandReference}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* 🔀 수사기구 역할 중복 해소 — 비중복·상호견제 설계 */}
                                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border-2 border-orange-300">
                                        <h3 className="text-xl font-bold text-orange-900 mb-1 flex items-center gap-2"><span>🔀</span> {FINLAND_REFORM_BILL.deconfliction.title}</h3>
                                        <p className="text-base text-gray-700 leading-relaxed mb-3">{FINLAND_REFORM_BILL.deconfliction.intro}</p>

                                        {/* 기존 안에서 빠진 부분 */}
                                        <div className="bg-white/70 rounded-lg p-3 border border-orange-200 mb-4">
                                            <p className="text-sm text-orange-800"><span className="font-bold">🖼️ 기존 안에서 빠진 부분:</span> {FINLAND_REFORM_BILL.deconfliction.gap}</p>
                                        </div>

                                        {/* 중복·경합 사례 칩 */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {FINLAND_REFORM_BILL.deconfliction.overlaps.map((o, i) => {
                                                const c = o.color === 'red' ? 'bg-red-100 border-red-300 text-red-800' : 'bg-amber-100 border-amber-300 text-amber-800';
                                                return (
                                                    <div key={i} className={`rounded-lg px-3 py-2 border ${c}`}>
                                                        <span className="text-sm font-bold">{o.level}</span>
                                                        <span className="text-sm"> · {o.crime} → {o.agencies}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* 기관 역할·소속 매트릭스 */}
                                        <div className="overflow-x-auto rounded-lg border border-gray-200 mb-4 bg-white">
                                            <table className="w-full min-w-[720px]">
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="px-3 py-2 text-left text-sm font-bold text-gray-700">수사기관</th>
                                                        <th className="px-3 py-2 text-left text-sm font-bold text-gray-700">수사 대상(관할)</th>
                                                        <th className="px-3 py-2 text-left text-sm font-bold text-gray-700">소속</th>
                                                        <th className="px-3 py-2 text-left text-sm font-bold text-gray-700">중복·유의점</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {FINLAND_REFORM_BILL.deconfliction.matrix.map((m, i) => {
                                                        const oc = { green: 'text-green-700', red: 'text-red-700', amber: 'text-amber-700', gray: 'text-gray-600' }[m.orgColor] || 'text-gray-700';
                                                        return (
                                                            <tr key={i} className="border-t border-gray-100 align-top">
                                                                <td className="px-3 py-2 text-sm font-bold text-gray-800">{m.agency}<div className="text-xs font-normal text-gray-400">{m.full}</div></td>
                                                                <td className="px-3 py-2 text-sm text-gray-700">{m.target}</td>
                                                                <td className={`px-3 py-2 text-sm font-semibold ${oc}`}>{m.org}</td>
                                                                <td className="px-3 py-2 text-sm text-gray-500">{m.note}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* 현행 문제 + 핀란드 모델 */}
                                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                                            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                                <h4 className="text-base font-bold text-red-800 mb-2">⚠️ 현행 조정 방식의 문제</h4>
                                                <ul className="space-y-1.5">
                                                    {FINLAND_REFORM_BILL.deconfliction.currentProblems.map((p, i) => (
                                                        <li key={i} className="text-sm text-red-700 flex items-start gap-1.5"><span className="mt-0.5 shrink-0">•</span><span>{p}</span></li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                                <h4 className="text-base font-bold text-blue-800 mb-2">🇫🇮 핀란드는 어떻게 했나</h4>
                                                <p className="text-sm text-blue-700 leading-relaxed">{FINLAND_REFORM_BILL.deconfliction.finlandModel}</p>
                                            </div>
                                        </div>

                                        {/* 4원칙 */}
                                        <div className="grid md:grid-cols-2 gap-3 mb-4">
                                            {FINLAND_REFORM_BILL.deconfliction.principles.map((pr, i) => {
                                                const cmap = { blue: 'bg-blue-50 border-blue-300', green: 'bg-green-50 border-green-300', purple: 'bg-purple-50 border-purple-300', red: 'bg-rose-50 border-rose-300' }[pr.color] || 'bg-gray-50 border-gray-300';
                                                return (
                                                    <div key={i} className={`rounded-lg p-4 border ${cmap}`}>
                                                        <p className="text-base font-bold text-gray-900 mb-1">{pr.n}. {pr.title}</p>
                                                        <p className="text-sm text-gray-700 leading-relaxed">{pr.desc}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* 결론 */}
                                        <div className="bg-orange-100 rounded-lg p-4 border border-orange-300 mb-3">
                                            <p className="text-base font-bold text-orange-900 leading-relaxed">🎯 {FINLAND_REFORM_BILL.deconfliction.conclusion}</p>
                                        </div>

                                        {/* 출처 */}
                                        <div className="text-xs text-gray-500">
                                            <span className="font-semibold">출처: </span>
                                            {FINLAND_REFORM_BILL.deconfliction.sources.map((s, i) => (
                                                <span key={i}>{i > 0 ? ' · ' : ''}<a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{s.label}</a></span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 시행 타임라인 */}
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>📅</span> 시행 로드맵
                                        </h3>
                                        <div className="grid md:grid-cols-4 gap-4">
                                            {FINLAND_REFORM_BILL.timeline.map((t, tIdx) => (
                                                <div key={tIdx} className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-blue-400">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-sm rounded-full font-bold">{t.phase}</span>
                                                        <span className="text-sm text-gray-500">{t.period}</span>
                                                    </div>
                                                    <h4 className="font-bold text-gray-800 text-base mb-2">{t.title}</h4>
                                                    <ul className="space-y-1">
                                                        {t.items.map((item, iIdx) => (
                                                            <li key={iIdx} className="text-base text-gray-600 flex items-start gap-1.5">
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
                                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>📊</span> 현행 정부안 vs 핀란드식 개혁안
                                        </h3>
                                        <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200">
                                            <table className="w-full">
                                                <thead>
                                                    <tr>
                                                        <th className="bg-gray-100 px-4 py-3 text-left text-base font-bold text-gray-700 w-[20%]">비교 항목</th>
                                                        <th className="bg-red-50 border-t-4 border-red-400 px-4 py-3 text-center text-base font-bold text-gray-800 w-[40%]">
                                                            🇰🇷 현행 정부안
                                                            <div className="text-sm font-normal text-red-500 mt-1">공소청·중수청 분리 (2026)</div>
                                                        </th>
                                                        <th className="bg-blue-50 border-t-4 border-blue-500 px-4 py-3 text-center text-base font-bold text-gray-800 w-[40%]">
                                                            🇫🇮 핀란드식 개혁안
                                                            <div className="text-sm font-normal text-blue-500 mt-1">수사·기소 완전 분리 + 시민 참여</div>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {FINLAND_REFORM_BILL.comparison.items.map((item, idx) => (
                                                        <tr key={idx} className="border-t border-gray-100">
                                                            <td className="px-4 py-3 text-base font-semibold text-gray-700 bg-gray-50">{item.category}</td>
                                                            <td className="px-4 py-3 text-base text-red-700">{item.current}</td>
                                                            <td className="px-4 py-3 text-base text-blue-700 font-medium">{item.proposed}</td>
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
                                            <span className="text-2xl">{section.icon}</span>
                                            <h3 className="text-xl font-bold text-gray-800">{section.title}</h3>
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
                                                                    <div className="font-bold text-gray-900 text-base">{pos.stakeholder}</div>
                                                                    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-sm font-medium ${pos.stanceColor}`}>
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
                                                                <p className="text-sm text-gray-800 font-semibold mb-2 leading-relaxed">{pos.summary}</p>
                                                                <ul className="space-y-1">
                                                                    {pos.details.map((detail, i) => (
                                                                        <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5 leading-relaxed">
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
                                                            <div className="font-bold text-gray-900 text-base">{pos.stakeholder}</div>
                                                            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-sm font-medium ${pos.stanceColor}`}>
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
                                                        <p className="text-sm text-gray-800 font-semibold mb-2 leading-relaxed">{pos.summary}</p>
                                                        <ul className="space-y-1">
                                                            {pos.details.map((detail, i) => (
                                                                <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5 leading-relaxed">
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
                                    <span className="text-xl">🤖</span>
                                    <span className="font-bold text-gray-800">AI 법안 위험도 분석</span>
                                    <span className={`px-2 py-0.5 text-sm rounded-full font-medium ${
                                        REFORM_RISK_ANALYSIS[activeReform.id].overallRisk === 'high' ? 'bg-red-100 text-red-700' :
                                        REFORM_RISK_ANALYSIS[activeReform.id].overallRisk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>{REFORM_RISK_ANALYSIS[activeReform.id].overallRisk === 'high' ? '고위험' :
                                        REFORM_RISK_ANALYSIS[activeReform.id].overallRisk === 'medium' ? '중위험' : '저위험'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-base text-gray-500">{REFORM_RISK_ANALYSIS[activeReform.id].overallScore}/10</span>
                                    <span className={`transform transition-transform ${showRiskAnalysis ? 'rotate-180' : ''}`}>▼</span>
                                </div>
                            </button>

                            {showRiskAnalysis && (() => {
                                const riskData = REFORM_RISK_ANALYSIS[activeReform.id];
                                return (
                                    <div className="px-6 pb-6 space-y-4">
                                        {/* AI 면책 배너 */}
                                        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 text-center">
                                            <p className="text-sm text-cyan-800">
                                                ⚠️ AI가 사전 생성한 법안 위험도 분석입니다. 법적 조언이 아니며, 정확한 법률 자문은 전문가에게 문의하세요.
                                            </p>
                                        </div>

                                        {/* 종합 위험도 진행바 */}
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-base font-medium text-gray-700">종합 위험도 점수</span>
                                                <span className="text-xl font-bold text-gray-800">{riskData.overallScore}/10</span>
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
                                                        <span className={`px-2 py-0.5 text-sm rounded-full font-medium ${
                                                            clause.risk === 'high' ? 'bg-red-100 text-red-700' :
                                                            clause.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-green-100 text-green-700'
                                                        }`}>{clause.score}/10</span>
                                                        <span className="font-medium text-base text-gray-800">{clause.clause}</span>
                                                    </div>
                                                    <span className={`transform transition-transform text-base ${expandedRiskClause === cIdx ? 'rotate-180' : ''}`}>▼</span>
                                                </button>

                                                {expandedRiskClause === cIdx && (
                                                    <div className="px-4 pb-4 space-y-3">
                                                        {/* 헌법적 쟁점 */}
                                                        <div className="bg-red-50 rounded-lg p-3">
                                                            <h5 className="font-bold text-red-800 text-sm mb-2">🏛️ 헌법적 쟁점</h5>
                                                            <ul className="space-y-1">
                                                                {clause.constitutionalIssues.map((issue, iIdx) => (
                                                                    <li key={iIdx} className="text-sm text-gray-700 flex items-start gap-1.5">
                                                                        <span className="text-red-400 mt-0.5 shrink-0">•</span>
                                                                        <span>{issue}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                        {/* 이행 과제 */}
                                                        <div className="bg-amber-50 rounded-lg p-3">
                                                            <h5 className="font-bold text-amber-800 text-sm mb-2">⚙️ 이행 과제</h5>
                                                            <ul className="space-y-1">
                                                                {clause.implementationChallenges.map((ch, chIdx) => (
                                                                    <li key={chIdx} className="text-sm text-gray-700 flex items-start gap-1.5">
                                                                        <span className="text-amber-400 mt-0.5 shrink-0">•</span>
                                                                        <span>{ch}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                        {/* 국제 사례 */}
                                                        <div className="bg-blue-50 rounded-lg p-3">
                                                            <h5 className="font-bold text-blue-800 text-sm mb-2">🌍 국제 사례</h5>
                                                            <ul className="space-y-1">
                                                                {clause.internationalPrecedents.map((prec, pIdx) => (
                                                                    <li key={pIdx} className="text-sm text-gray-700 flex items-start gap-1.5">
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

                    {/* 법원조직법 현행 vs 개정안 비교 */}
                    <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
                        <button
                            onClick={() => setShowLawComparison(!showLawComparison)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">📜</span>
                                <span className="font-bold text-gray-800">법원조직법 현행 vs 개정안 비교</span>
                                <span className="px-2 py-0.5 text-sm rounded-full font-medium bg-blue-100 text-blue-700">법령 참고</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-base text-gray-500">신구법 비교 조회</span>
                                <span className={`transform transition-transform ${showLawComparison ? 'rotate-180' : ''}`}>▼</span>
                            </div>
                        </button>

                        {showLawComparison && (
                            <div className="px-6 pb-6 space-y-4">
                                {/* 안내 배너 */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                    <p className="text-sm text-blue-800">
                                        법원조직법의 현행 조문과 개정 연혁은 국가법령정보센터에서 확인할 수 있습니다.
                                    </p>
                                </div>

                                {comparisonLoading ? (
                                    <div className="text-center py-8">
                                        <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                        <p className="text-gray-500 text-base">법원조직법 데이터를 불러오는 중...</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* 현행 vs 개혁안 핵심 비교표 */}
                                        <div className="space-y-3">
                                            <h4 className="font-bold text-gray-800 text-base flex items-center gap-2">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                법원조직법 핵심 쟁점 — 현행 vs 개혁안
                                            </h4>
                                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                                <table className="w-full text-base min-w-[640px]">
                                                    <thead>
                                                        <tr className="bg-gray-50 text-left border-b border-gray-200">
                                                            <th className="px-4 py-2.5 font-semibold text-gray-700 whitespace-nowrap">쟁점</th>
                                                            <th className="px-4 py-2.5 font-semibold text-red-700">현행</th>
                                                            <th className="px-4 py-2.5 font-semibold text-green-700">개혁안</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {COURT_ORG_COMPARISON.map((row) => (
                                                            <tr key={row.topic} className="border-b border-gray-100 align-top">
                                                                <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{row.topic}</td>
                                                                <td className="px-4 py-3 text-gray-700 bg-red-50/40 leading-relaxed">{row.current}</td>
                                                                <td className="px-4 py-3 text-gray-700 bg-green-50/40 leading-relaxed">{row.reform}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <p className="text-sm text-gray-400">※ ‘개혁안’은 시민법정이 지지하는 사법개혁 방향이며, 구체 법안·조문은 아래 국가법령정보센터·법령DB에서 확인할 수 있습니다.</p>
                                        </div>


                                        {/* 외부 링크 */}
                                        <div className="flex flex-wrap gap-3 pt-2">
                                            <a
                                                href="https://www.law.go.kr/법령/법원조직법"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-base hover:bg-blue-700 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                                법원조직법 전문 보기
                                            </a>
                                            <a
                                                href="/law-database"
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-base hover:bg-gray-200 transition-colors"
                                            >
                                                법령 데이터베이스 →
                                            </a>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                        </div>{/* 메인 컨텐츠 끝 */}
                    </div>{/* flex 컨테이너 끝 */}

                    {/* 출처 안내 */}
                    <div className="p-4 bg-gray-100 rounded-xl text-center">
                        <p className="text-gray-600 text-base">
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
                    <p className="mt-2 text-base">문의: siminbupjung@gmail.com</p>
                </div>
            </footer>
        </div>
    );
}
