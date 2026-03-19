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
        message: '한국은 직업법관 3명이 모든 것을 결정 → 독일은 시민 2명 + 판사 3명',
    },
    {
        ep: 2,
        title: '"헌법이 37년째 묻고 있다"',
        message: '헌법 제1조 2항, 제27조 → 입법 부작위',
    },
    {
        ep: 3,
        title: '"검찰개혁? 국민 빠진 개혁"',
        message: '공소청법안도 시민 참여 없이 조직 개편만',
    },
    {
        ep: 4,
        title: '"독일 시민은 판사다"',
        message: '참심원 제도 30초 설명',
    },
    {
        ep: 5,
        title: '"왜 아무도 말 안 하나?"',
        message: '진보·보수 모두 침묵하는 이유',
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
                                    className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-600 text-white font-black text-sm shrink-0">
                                            {ep.ep}화
                                        </span>
                                        <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Episode {ep.ep}</span>
                                    </div>
                                    <h3 className="text-base font-bold mb-3 leading-snug">{ep.title}</h3>
                                    <p className="text-gray-300 text-sm leading-relaxed">{ep.message}</p>
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
