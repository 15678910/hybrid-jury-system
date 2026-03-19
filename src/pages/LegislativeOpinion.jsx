import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import Header from '../components/Header';
import SNSShareBar from '../components/SNSShareBar';

export default function LegislativeOpinion() {
    return (
        <>
            <SEOHead
                title="시민참심제 도입을 위한 법률 제정 의견서 | 사법개혁"
                description="주권자사법개혁추진준비위원회가 국회에 제출하는 시민참심제 도입을 위한 공식 입법 의견서입니다."
                keywords="시민참심제, 입법의견서, 사법개혁, 국민주권, 참심제 도입"
            />
            <Header />

            <div className="min-h-screen bg-gray-50 pt-20 pb-16">
                <div className="container mx-auto px-4 max-w-4xl">

                    {/* 문서 헤더 */}
                    <div className="bg-white border border-gray-300 rounded-lg shadow-sm mt-8 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-8 py-10 text-center text-white">
                            <p className="text-sm font-semibold tracking-widest uppercase opacity-90 mb-3">공식 입법 의견서</p>
                            <h1 className="text-2xl md:text-3xl font-bold leading-snug mb-4">
                                시민참심제 도입을 위한<br />법률 제정 의견서
                            </h1>
                            <p className="text-base md:text-lg font-medium opacity-90">
                                주권자사법개혁추진준비위원회
                            </p>
                        </div>

                        {/* 문서 본문 */}
                        <div className="p-8 md:p-12 space-y-10">

                            {/* 섹션 Ⅰ */}
                            <section>
                                <h2 className="flex items-center gap-3 text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold shrink-0">Ⅰ</span>
                                    의견 요지
                                </h2>
                                <p className="text-gray-700 leading-relaxed">
                                    헌법 제1조 제2항에 명시된 국민주권 원리를 사법 영역에서도 실현하기 위해, 시민이 직접 재판에 참여하는 참심제(시민법관제) 도입 법률 제정을 요청합니다.
                                </p>
                            </section>

                            {/* 섹션 Ⅱ */}
                            <section>
                                <h2 className="flex items-center gap-3 text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold shrink-0">Ⅱ</span>
                                    헌법적 근거
                                </h2>
                                <div className="space-y-4">
                                    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
                                        <p className="text-sm font-semibold text-blue-700 mb-1">헌법 제1조 2항</p>
                                        <p className="text-gray-800 leading-relaxed">
                                            "대한민국의 주권은 국민에게 있고, 모든 권력은 국민으로부터 나온다"
                                        </p>
                                    </div>
                                    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
                                        <p className="text-sm font-semibold text-blue-700 mb-1">헌법 제27조 1항</p>
                                        <p className="text-gray-800 leading-relaxed">
                                            "모든 국민은 헌법과 법률이 정한 법관에 의하여 법률에 의한 재판을 받을 권리를 가진다"
                                        </p>
                                    </div>
                                    <div className="bg-purple-50 border-l-4 border-purple-400 rounded-r-lg p-4">
                                        <p className="text-sm font-semibold text-purple-700 mb-1">헌법 제10조</p>
                                        <p className="text-gray-800">인간의 존엄과 가치, 행복추구권</p>
                                    </div>
                                    <div className="bg-purple-50 border-l-4 border-purple-400 rounded-r-lg p-4">
                                        <p className="text-sm font-semibold text-purple-700 mb-1">헌법 제12조</p>
                                        <p className="text-gray-800">신체의 자유, 적법절차 원칙</p>
                                    </div>
                                    <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg p-4">
                                        <p className="text-sm font-semibold text-yellow-700 mb-1">입법 부작위</p>
                                        <p className="text-gray-800 leading-relaxed">
                                            헌법이 국민주권을 명시한 지 37년, 사법 영역에서의 국민 참여는 권고적 효력의 국민참여재판에 그침
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* 섹션 Ⅲ */}
                            <section>
                                <h2 className="flex items-center gap-3 text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold shrink-0">Ⅲ</span>
                                    해외 입법례
                                </h2>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <span className="text-2xl shrink-0">🇩🇪</span>
                                        <div>
                                            <p className="font-semibold text-gray-800">독일: 참심제(Schöffengericht)</p>
                                            <p className="text-gray-600 text-sm mt-1">시민 참심원 2명 + 직업법관 1~3명, 동등한 평결권</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <span className="text-2xl shrink-0">🇫🇮</span>
                                        <div>
                                            <p className="font-semibold text-gray-800">핀란드: 시민판사(Lautamies)</p>
                                            <p className="text-gray-600 text-sm mt-1">지방법원 1심에서 시민 3명 + 직업법관 1명</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <span className="text-2xl shrink-0">🌍</span>
                                        <div>
                                            <p className="font-semibold text-gray-800">프랑스, 이탈리아, 덴마크, 노르웨이 등</p>
                                            <p className="text-gray-600 text-sm mt-1">유럽 다수 국가에서 시민 직접 참여 제도 운영</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 text-center">
                                    <a
                                        href="https://시민법정.kr/reform-analysis?tab=finland-reform"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 underline"
                                    >
                                        핀란드 개혁 사례 상세 보기
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                </div>
                            </section>

                            {/* 섹션 Ⅳ */}
                            <section>
                                <h2 className="flex items-center gap-3 text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold shrink-0">Ⅳ</span>
                                    현행 제도의 문제점
                                </h2>
                                <ul className="space-y-3">
                                    {[
                                        { year: '현행', text: '국민참여재판: 배심원 평결에 권고적 효력만 부여, 법관이 최종 판단 독점' },
                                        { year: '2005', text: '사법개혁특별위원회: 참심제 논의 자체가 안건에 포함되지 않음' },
                                        { year: '2016', text: '헌법개정 논의: 사법 민주화 의제에서 또다시 배제' },
                                        { year: '2024~2026', text: '검찰개혁: 조직 개편에 집중, 시민 참여 장치 부재' },
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <span className="inline-block bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded shrink-0 mt-0.5">{item.year}</span>
                                            <p className="text-gray-700 leading-relaxed">{item.text}</p>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            {/* 섹션 Ⅴ */}
                            <section>
                                <h2 className="flex items-center gap-3 text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold shrink-0">Ⅴ</span>
                                    법률안 골자 (4법 체계)
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        {
                                            num: '1',
                                            title: '독립기소청법',
                                            desc: '기소청을 독립 헌법기관으로, 수사권 완전 배제',
                                            color: 'from-blue-500 to-blue-600',
                                        },
                                        {
                                            num: '2',
                                            title: '수사기관독립법',
                                            desc: '중수청 국무총리 직속, 경찰 수사 독립',
                                            color: 'from-purple-500 to-purple-600',
                                        },
                                        {
                                            num: '3',
                                            title: '시민사법참여법',
                                            desc: '참심제 + 시민기소심사위 도입',
                                            color: 'from-indigo-500 to-indigo-600',
                                        },
                                        {
                                            num: '4',
                                            title: '사법감시이중안전법',
                                            desc: '법률감찰관 + 사법옴부즈만 (국회 소속)',
                                            color: 'from-violet-500 to-violet-600',
                                        },
                                    ].map((law) => (
                                        <div key={law.num} className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className={`bg-gradient-to-r ${law.color} px-4 py-2`}>
                                                <span className="text-white text-sm font-bold">제{law.num}법</span>
                                            </div>
                                            <div className="px-4 py-3">
                                                <p className="font-bold text-gray-800 mb-1">{law.title}</p>
                                                <p className="text-gray-600 text-sm">{law.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* 섹션 Ⅵ */}
                            <section>
                                <h2 className="flex items-center gap-3 text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold shrink-0">Ⅵ</span>
                                    제출 안내
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* 카드 1 */}
                                    <div className="border-2 border-green-400 rounded-lg p-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-lg font-bold">1</span>
                                            <p className="font-bold text-gray-800 text-sm">국회 전자청원</p>
                                        </div>
                                        <p className="text-gray-600 text-sm leading-relaxed mb-3">
                                            국회 홈페이지 → 국민소통 → 국민제안/청원
                                        </p>
                                        <a
                                            href="https://www.assembly.go.kr"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-900 font-medium underline"
                                        >
                                            assembly.go.kr
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    </div>

                                    {/* 카드 2 */}
                                    <div className="border-2 border-blue-400 rounded-lg p-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-lg font-bold">2</span>
                                            <p className="font-bold text-gray-800 text-sm">법사위 직접 제출</p>
                                        </div>
                                        <p className="text-gray-600 text-sm leading-relaxed mb-3">
                                            assembly.go.kr → 법제사법위원회 → 민원/의견 제출
                                        </p>
                                        <a
                                            href="https://www.assembly.go.kr"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-900 font-medium underline"
                                        >
                                            바로가기
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    </div>

                                    {/* 카드 3 */}
                                    <div className="border-2 border-orange-400 rounded-lg p-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-8 h-8 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-lg font-bold">3</span>
                                            <p className="font-bold text-gray-800 text-sm">국민동의청원</p>
                                        </div>
                                        <p className="text-gray-600 text-sm leading-relaxed mb-3">
                                            5만 명 달성 시 본회의 부의
                                        </p>
                                        <a
                                            href="https://petitions.assembly.go.kr"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-sm text-orange-700 hover:text-orange-900 font-medium underline"
                                        >
                                            petitions.assembly.go.kr
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            </section>

                            {/* 섹션 Ⅶ */}
                            <section>
                                <h2 className="flex items-center gap-3 text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold shrink-0">Ⅶ</span>
                                    참고 사이트
                                </h2>
                                <ul className="space-y-2">
                                    <li>
                                        <a
                                            href="https://시민법정.kr/reform-analysis?tab=finland-reform"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline text-sm"
                                        >
                                            https://시민법정.kr/reform-analysis?tab=finland-reform
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    </li>
                                </ul>
                            </section>

                            {/* 인쇄 버튼 */}
                            <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 justify-between items-center">
                                <p className="text-xs text-gray-400">
                                    본 의견서는 자유롭게 배포하여 국회에 제출할 수 있습니다.
                                </p>
                                <button
                                    onClick={() => window.print()}
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition shadow"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    인쇄하기
                                </button>
                            </div>

                        </div>
                    </div>

                    {/* SNS 공유 */}
                    <div className="mt-8">
                        <SNSShareBar
                            title="시민참심제 도입을 위한 법률 제정 의견서"
                            description="주권자사법개혁추진준비위원회가 국회에 제출하는 공식 입법 의견서입니다."
                        />
                    </div>

                    {/* 하단 링크 */}
                    <div className="mt-8 text-center">
                        <Link
                            to="/"
                            className="text-sm text-gray-500 hover:text-blue-600 transition"
                        >
                            홈으로 돌아가기
                        </Link>
                    </div>

                </div>
            </div>

            {/* 인쇄 스타일 */}
            <style>{`
                @media print {
                    header, .fixed, button, [class*="SNSShareBar"], a[href="#"] {
                        display: none !important;
                    }
                    body { background: white !important; }
                    .shadow-sm, .shadow { box-shadow: none !important; }
                }
            `}</style>
        </>
    );
}
