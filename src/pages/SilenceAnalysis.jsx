import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import Header from '../components/Header';
import SNSShareBar from '../components/SNSShareBar';

const silenceActors = [
    {
        icon: '👨‍⚖️',
        group: '법관',
        reason: '재판 권한 독점 유지',
        interest: '시민 참여 시 권한 분산',
        color: 'border-red-500',
        bg: 'bg-red-50',
        badge: 'bg-red-100 text-red-700',
    },
    {
        icon: '⚖️',
        group: '검찰',
        reason: '수사·기소 독점 유지',
        interest: '시민기소심사 도입 시 견제 발생',
        color: 'border-orange-500',
        bg: 'bg-orange-50',
        badge: 'bg-orange-100 text-orange-700',
    },
    {
        icon: '👔',
        group: '변호사',
        reason: '전문가 지위 유지',
        interest: '시민 참여 시 법률 독점 약화',
        color: 'border-amber-500',
        bg: 'bg-amber-50',
        badge: 'bg-amber-100 text-amber-700',
    },
    {
        icon: '📚',
        group: '진보 법학자',
        reason: '동료 법조인 비판 회피',
        interest: '학계·법조계 관계 유지',
        color: 'border-yellow-500',
        bg: 'bg-yellow-50',
        badge: 'bg-yellow-100 text-yellow-700',
    },
    {
        icon: '🏛️',
        group: '시민단체',
        reason: '법조 출신 자문위원 영향',
        interest: '법조 카르텔 내 네트워크',
        color: 'border-rose-500',
        bg: 'bg-rose-50',
        badge: 'bg-rose-100 text-rose-700',
    },
];

const timelineEvents = [
    {
        year: '1987',
        title: '헌법 제1조 2항 국민주권 명시',
        desc: '모든 권력은 국민으로부터 나온다 — 그러나 사법권은 예외였다.',
        side: 'left',
    },
    {
        year: '2005',
        title: '사법개혁특별위원회',
        desc: '참심제 안건에도 없었다. 배심제 논의만 제한적으로 이루어졌다.',
        side: 'right',
    },
    {
        year: '2008',
        title: '국민참여재판 시행',
        desc: '권고적 효력만. 판사가 배심원 평결을 무시해도 아무 문제 없는 구조.',
        side: 'left',
    },
    {
        year: '2016',
        title: '헌법개정 논의',
        desc: '사법민주화에서 또 빠짐. 선거제·개헌 논의에서 시민참심제는 언급조차 없었다.',
        side: 'right',
    },
    {
        year: '2024',
        title: '검찰개혁 논의 시작',
        desc: '국민 없는 개혁. 수사 기관 재편만 논의되고 시민참여 장치는 의제 밖이었다.',
        side: 'left',
    },
    {
        year: '2026',
        title: '공소청법·중수청법 통과',
        desc: '시민 참여 장치 부재. 조직 개편만 이루어졌고, 재판에 시민이 들어갈 자리는 여전히 없다.',
        side: 'right',
    },
];

const shortformSeries = [
    {
        ep: 1,
        title: '"판사가 왜 3명뿐일까?"',
        message: '한국은 직업법관 3명이 모든 것을 결정 → 핀란드는 시민 3명 + 판사 1명',
        duration: '45초',
        scenario: [
            { type: 'narration', text: '한국에서 재판을 받으면, 당신의 유죄와 무죄를 결정하는 사람은 딱 3명입니다.' },
            { type: 'visual', text: '[화면: 법정 이미지, 법관석에 3명의 판사]' },
            { type: 'narration', text: '직업법관 3명. 모두 사법연수원 출신, 같은 교육, 같은 문화.' },
            { type: 'visual', text: '[화면: 핀란드 법정 → 시민 3명 + 판사 1명이 나란히 앉은 모습]' },
            { type: 'narration', text: '핀란드에서는 다릅니다. 시민 3명이 판사 1명과 함께 앉아 동등한 투표권으로 판결합니다.' },
            { type: 'narration', text: '이것을 참심제, 핀란드어로 "라우타미에스(Lautamies)"라고 합니다.' },
            { type: 'visual', text: '[화면: 한국 vs 핀란드 비교 그래픽]' },
            { type: 'narration', text: '한국: 법관 3명이 100% 결정.' },
            { type: 'narration', text: '핀란드: 시민 3명 + 법관 1명, 다수결로 결정. 시민이 다수입니다.' },
            { type: 'emphasis', text: '"왜 한국에서는 시민이 재판에 참여할 수 없을까요?"' },
            { type: 'closing', text: '다음 화에서 그 답을 찾아봅니다.' },
        ],
    },
    {
        ep: 2,
        title: '"헌법이 37년째 묻고 있다"',
        message: '헌법 제1조 2항, 제27조 → 입법 부작위',
        duration: '50초',
        scenario: [
            { type: 'narration', text: '대한민국 헌법 제1조 2항.' },
            { type: 'emphasis', text: '"대한민국의 주권은 국민에게 있고, 모든 권력은 국민으로부터 나온다."' },
            { type: 'narration', text: '1987년에 쓰인 이 문장. 입법부, 행정부에서는 실현됐습니다.' },
            { type: 'visual', text: '[화면: 국회의원 선거 → 대통령 선거 이미지]' },
            { type: 'narration', text: '국민이 국회의원을 뽑고, 대통령을 뽑습니다.' },
            { type: 'narration', text: '그런데 사법부는?' },
            { type: 'visual', text: '[화면: 법원 건물 → 물음표]' },
            { type: 'narration', text: '판사를 국민이 뽑지도, 재판에 참여하지도 못합니다.' },
            { type: 'narration', text: '헌법 제27조 1항: "모든 국민은 법률이 정한 법관에 의하여 재판을 받을 권리를 가진다."' },
            { type: 'narration', text: '법률이 정하면 시민도 법관이 될 수 있습니다. 그런데 37년째 그 법률이 없습니다.' },
            { type: 'emphasis', text: '이것을 "입법 부작위"라고 합니다.' },
            { type: 'closing', text: '헌법이 37년째 묻고 있습니다. "왜 사법부만 국민 없이 운영되는가?"' },
        ],
    },
    {
        ep: 3,
        title: '"검찰개혁? 국민 빠진 개혁"',
        message: '공소청법안도 시민 참여 없이 조직 개편만',
        duration: '50초',
        scenario: [
            { type: 'narration', text: '2026년 3월, 검찰개혁법이 통과됐습니다.' },
            { type: 'visual', text: '[화면: 국회 법사위 의결 장면]' },
            { type: 'narration', text: '검찰청은 공소청으로, 수사권은 중대범죄수사청으로. 78년 만의 개혁이라고 합니다.' },
            { type: 'narration', text: '그런데 한 가지 빠진 것이 있습니다.' },
            { type: 'emphasis', text: '"국민"입니다.' },
            { type: 'visual', text: '[화면: 공소청법 조문 → "시민 참여" 검색 → 결과 없음]' },
            { type: 'narration', text: '시민기소심사위원회? 없습니다.' },
            { type: 'narration', text: '참심제? 논의조차 없었습니다.' },
            { type: 'narration', text: '법률감찰관? 사법옴부즈만? 어디에도 없습니다.' },
            { type: 'narration', text: '조직을 바꿨을 뿐, 국민이 사법에 참여하는 장치는 하나도 만들지 않았습니다.' },
            { type: 'emphasis', text: '"국민 없는 개혁은 개혁이 아닙니다."' },
            { type: 'closing', text: '그렇다면 시민이 직접 재판에 참여하는 나라는 어떤 모습일까요?' },
        ],
    },
    {
        ep: 4,
        title: '"핀란드 시민은 판사다"',
        message: '핀란드 참심제(Lautamies) 30초 설명',
        duration: '40초',
        scenario: [
            { type: 'narration', text: '핀란드에서는 일반 시민이 판사가 됩니다.' },
            { type: 'visual', text: '[화면: 핀란드 법정, "Lautamies (라우타미에스)" 자막]' },
            { type: 'narration', text: '참심제. 핀란드어로 라우타미에스.' },
            { type: 'narration', text: '어떻게 작동할까요?' },
            { type: 'visual', text: '[화면: 단계별 인포그래픽]' },
            { type: 'narration', text: '1단계: 지방의회가 시민 중에서 참심원을 선출합니다.' },
            { type: 'narration', text: '2단계: 선출된 시민은 지방법원 1심 재판에 참여합니다.' },
            { type: 'narration', text: '3단계: 직업법관 1명과 시민 3명이 함께 앉아 사건을 심리합니다.' },
            { type: 'narration', text: '4단계: 유무죄와 형량을 동등한 투표권으로 결정합니다. 시민이 다수입니다.' },
            { type: 'emphasis', text: '법학 학위 없이도, 시민의 상식과 양심으로 판단합니다.' },
            { type: 'narration', text: '핀란드뿐 아닙니다. 독일, 프랑스, 덴마크, 노르웨이 — 유럽 대부분이 이렇게 합니다.' },
            { type: 'closing', text: '그런데 왜 한국에서는 아무도 이 이야기를 하지 않을까요?' },
        ],
    },
    {
        ep: 5,
        title: '"왜 아무도 말 안 하나?"',
        message: '진보·보수 모두 침묵하는 이유',
        duration: '60초',
        scenario: [
            { type: 'narration', text: '참심제. 시민이 판사가 되는 제도.' },
            { type: 'narration', text: '핀란드는 수십 년째 하고 있고, 독일도, 프랑스도 하고 있습니다.' },
            { type: 'narration', text: '그런데 한국에서는 진보도, 보수도, 시민단체도 침묵합니다.' },
            { type: 'emphasis', text: '왜?' },
            { type: 'visual', text: '[화면: 이해관계 구조도]' },
            { type: 'narration', text: '법관: 재판 권한을 독점하고 싶습니다. 시민이 들어오면 권한이 분산됩니다.' },
            { type: 'narration', text: '검찰: 기소 독점을 유지하고 싶습니다. 시민기소심사위가 생기면 견제받습니다.' },
            { type: 'narration', text: '변호사: 법률 전문가 지위를 지키고 싶습니다. 시민 참여는 독점을 약화시킵니다.' },
            { type: 'narration', text: '법학자: 동료 법조인을 비판하기 어렵습니다. 학계 내 관계가 깨집니다.' },
            { type: 'narration', text: '시민단체: 자문위원이 법조 출신입니다. 카르텔 안에 있습니다.' },
            { type: 'visual', text: '[화면: 모든 화살표가 "현상 유지"로 향하는 다이어그램]' },
            { type: 'emphasis', text: '모두가 침묵하는 이유는 하나입니다. 현재 구조가 자신에게 유리하기 때문입니다.' },
            { type: 'narration', text: '이 침묵을 깰 수 있는 것은 오직 한 가지.' },
            { type: 'emphasis', text: '"깨어 있는 시민"입니다.' },
            { type: 'closing', text: '헌법 제1조 2항: 모든 권력은 국민으로부터 나온다. 사법도 예외가 아닙니다.' },
        ],
    },
];

const tools = [
    {
        name: '캔바(Canva)',
        use: '카드뉴스 → 애니메이션 영상 변환',
        cost: '무료',
        icon: '🎨',
    },
    {
        name: 'CapCut',
        use: '자막 자동 생성 + 편집',
        cost: '무료',
        icon: '✂️',
    },
    {
        name: 'AI 음성',
        use: '나레이션 자동 생성 (네이버 클로바, 구글 TTS)',
        cost: '무료',
        icon: '🎙️',
    },
    {
        name: '배포',
        use: '유튜브 쇼츠 + 인스타 릴스 + 틱톡 동시 업로드',
        cost: '무료',
        icon: '📱',
    },
];

export default function SilenceAnalysis() {
    const [hoveredCard, setHoveredCard] = useState(null);
    const [openEpisode, setOpenEpisode] = useState(null);

    return (
        <>
            <SEOHead
                title="왜 아무도 말하지 않는가? | 참심제 침묵의 구조 분석 | 사법개혁"
                description="법관, 검찰, 변호사, 법학자, 시민단체 — 모두가 참심제 도입에 침묵하는 이유를 분석합니다. 묵계적 카르텔의 실체를 밝힙니다."
                keywords="참심제, 침묵의 카르텔, 사법개혁, 법조카르텔, 시민참여재판, 묵계적카르텔"
            />
            <Header />

            <div className="min-h-screen bg-gray-50 pt-20">

                {/* ── 헤더 섹션 ── */}
                <section className="bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 text-white py-20 px-4">
                    <div className="container mx-auto max-w-4xl text-center">
                        <div className="inline-block bg-red-600/20 border border-red-500/40 text-red-300 text-sm font-semibold px-4 py-1 rounded-full mb-6 tracking-wider">
                            묵계적 카르텔 분석
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                            왜 아무도 말하지 않는가?
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300 font-light">
                            참심제를 둘러싼 침묵의 구조 분석
                        </p>
                        <p className="mt-6 text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            진보도, 보수도, 법조인도, 시민단체도 — 모두가 침묵합니다.
                            이 침묵은 우연이 아닙니다. 구조적 이해관계가 만들어낸 묵계적 카르텔입니다.
                        </p>
                    </div>
                </section>

                {/* ── 섹션 1: 침묵의 구조 ── */}
                <section className="py-16 px-4 bg-white">
                    <div className="container mx-auto max-w-5xl">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-black text-gray-900 mb-3">침묵의 구조</h2>
                            <p className="text-gray-500">각 주체가 참심제에 침묵하는 이유와 그 이면의 이해관계</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {silenceActors.map((actor, idx) => (
                                <div
                                    key={idx}
                                    className={`border-l-4 ${actor.color} ${actor.bg} rounded-lg p-6 shadow-sm transition-all duration-200 cursor-default ${hoveredCard === idx ? 'shadow-lg -translate-y-1' : ''}`}
                                    onMouseEnter={() => setHoveredCard(idx)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                >
                                    <div className="text-4xl mb-3">{actor.icon}</div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{actor.group}</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1 ${actor.badge}`}>
                                                침묵 이유
                                            </span>
                                            <p className="text-gray-700 text-sm">{actor.reason}</p>
                                        </div>
                                        <div>
                                            <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1 bg-gray-200 text-gray-600">
                                                이해관계
                                            </span>
                                            <p className="text-gray-600 text-sm">{actor.interest}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 섹션 2: 역사적 배제 타임라인 ── */}
                <section className="py-16 px-4 bg-gray-900 text-white">
                    <div className="container mx-auto max-w-4xl">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-black mb-3">역사적 배제 타임라인</h2>
                            <p className="text-gray-400">37년간 반복된 참심제 배제의 역사</p>
                        </div>

                        <div className="relative">
                            {/* 중앙 세로선 */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-red-600/40 -translate-x-1/2 hidden md:block" />

                            <div className="space-y-8">
                                {timelineEvents.map((event, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex flex-col md:flex-row items-center gap-4 ${event.side === 'right' ? 'md:flex-row-reverse' : ''}`}
                                    >
                                        {/* 카드 */}
                                        <div className={`flex-1 ${event.side === 'left' ? 'md:text-right' : 'md:text-left'}`}>
                                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 inline-block max-w-sm w-full">
                                                <p className="text-red-400 font-black text-xl mb-1">{event.year}</p>
                                                <h3 className="text-white font-bold mb-2">{event.title}</h3>
                                                <p className="text-gray-400 text-sm leading-relaxed">{event.desc}</p>
                                            </div>
                                        </div>

                                        {/* 중앙 점 */}
                                        <div className="hidden md:flex w-4 h-4 rounded-full bg-red-500 border-2 border-red-300 shrink-0 z-10" />

                                        {/* 반대편 빈 공간 */}
                                        <div className="flex-1 hidden md:block" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 섹션 3: 숏폼 시리즈 기획 ── */}
                <section className="py-16 px-4 bg-white">
                    <div className="container mx-auto max-w-5xl">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-black text-gray-900 mb-3">
                                "왜 아무도 말 안 하나?" 숏폼 시리즈 기획
                            </h2>
                            <p className="text-gray-500">침묵을 깨는 5부작 시리즈 — 제작 중</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {shortformSeries.map((ep) => (
                                <div
                                    key={ep.ep}
                                    className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer"
                                    onClick={() => setOpenEpisode(openEpisode === ep.ep ? null : ep.ep)}
                                >
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-600 text-white font-black text-sm shrink-0">
                                                {ep.ep}화
                                            </span>
                                            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Episode {ep.ep}</span>
                                            <span className="ml-auto text-xs text-gray-400">{ep.duration}</span>
                                        </div>
                                        <h3 className="text-base font-bold mb-3 leading-snug">{ep.title}</h3>
                                        <p className="text-gray-300 text-sm leading-relaxed">{ep.message}</p>
                                        <p className="text-xs text-gray-500 mt-3">
                                            {openEpisode === ep.ep ? '▲ 시나리오 접기' : '▼ 시나리오 보기'}
                                        </p>
                                    </div>
                                    {openEpisode === ep.ep && (
                                        <div className="border-t border-gray-700 px-6 py-5 bg-gray-950/50 rounded-b-xl" onClick={(e) => e.stopPropagation()}>
                                            <h4 className="text-sm font-bold text-red-400 mb-4">📜 시나리오 ({ep.duration})</h4>
                                            <div className="space-y-2.5">
                                                {ep.scenario.map((line, idx) => (
                                                    <div key={idx} className={`text-sm leading-relaxed ${
                                                        line.type === 'narration' ? 'text-gray-300' :
                                                        line.type === 'visual' ? 'text-blue-400 italic text-xs' :
                                                        line.type === 'emphasis' ? 'text-yellow-300 font-bold text-base' :
                                                        line.type === 'closing' ? 'text-red-300 font-semibold border-t border-gray-700 pt-3 mt-3' :
                                                        'text-gray-300'
                                                    }`}>
                                                        {line.type === 'narration' && <span className="text-gray-500 mr-1">🎙</span>}
                                                        {line.type === 'visual' && <span className="text-blue-500 mr-1">🎬</span>}
                                                        {line.type === 'emphasis' && <span className="mr-1">💡</span>}
                                                        {line.type === 'closing' && <span className="mr-1">🔚</span>}
                                                        {line.text}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 섹션 4: 제작 방법 안내 ── */}
                <section className="py-16 px-4 bg-orange-50">
                    <div className="container mx-auto max-w-4xl">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-black text-gray-900 mb-3">제작 방법 안내</h2>
                            <p className="text-gray-500">누구나 무료로 숏폼 콘텐츠를 만들 수 있습니다</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {tools.map((tool, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white rounded-xl border border-orange-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start gap-4">
                                        <span className="text-3xl">{tool.icon}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-900">{tool.name}</h3>
                                                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                    {tool.cost}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm">{tool.use}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 섹션 5: CTA ── */}
                <section className="py-20 px-4 bg-gradient-to-br from-purple-900 via-blue-900 to-gray-900 text-white">
                    <div className="container mx-auto max-w-3xl text-center">
                        <div className="text-5xl mb-6">🔔</div>
                        <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
                            시민이 깨어나면<br />침묵은 깨집니다
                        </h2>
                        <p className="text-gray-300 text-lg mb-10 leading-relaxed">
                            법조 카르텔의 침묵을 깨는 것은 결국 시민의 목소리입니다.<br />
                            참심제 도입을 위한 운동에 함께해 주세요.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/#signature"
                                className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold px-8 py-4 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                            >
                                준비위원으로 참여하기
                            </Link>
                            <Link
                                to="/legislative-opinion"
                                className="inline-block bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-full transition-all duration-200 hover:-translate-y-0.5"
                            >
                                입법 의견서 보기
                            </Link>
                        </div>
                    </div>
                </section>

                {/* SNS 공유 */}
                <div className="bg-white py-8 px-4">
                    <div className="container mx-auto max-w-4xl">
                        <SNSShareBar
                            title="왜 아무도 말하지 않는가? — 참심제 침묵의 구조 분석"
                            description="법관, 검찰, 변호사, 법학자, 시민단체 모두가 참심제에 침묵하는 이유를 분석합니다."
                        />
                    </div>
                </div>

            </div>
        </>
    );
}
