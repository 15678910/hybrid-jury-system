import Header from '../components/Header';
import SEOHead from '../components/SEOHead';
import SNSShareBar from '../components/SNSShareBar';
import { Link } from 'react-router-dom';

// 사건별 평결·선고 결과 (2026.6.20 수원지법 형사11부 송병훈, 배심원 7명)
// 출처: 파이낸셜뉴스 종합2보·'쪼개기 기소' 공소기각 기사, 경향신문, 오마이뉴스 (2026.6.19~20)
const CHARGES = [
    {
        key: '위증',
        title: '위증 (국회 ‘박상용 검사 탄핵’ 청문회 ‘연어 술파티’ 증언)',
        verdict: '징역 4개월 (유죄)',
        verdictColor: 'rose',
        jury: '배심원 4 대 3 — “술파티 없었다” 다수의견(위증)',
        juryDetail: '이화영은 “2023년 수원지검 1313호에서 김성태 등과 연어회·소주를 곁들인 술파티가 있었다”고 증언했다(민주당 박상용 검사 탄핵의 핵심 근거). 배심원 7명 중 4명이 “술파티는 없었다”며 위증으로, 3명은 위증으로 단정하기 어렵다고 봐 4 대 3 유죄.',
        court: '술자리에 있었다고 지목된 7명(김성태·박상용 등) 전원이 “술자리는 없었다”고 일관 증언한 반면, 이화영은 장소·날짜·음주 시간을 번복해 진술 신빙성이 없다며 유죄. 변호인이 낸 “검찰청 앞 편의점 소주 구입 영수증”은 다수 배심원을 설득하지 못함.',
    },
    {
        key: '정치자금법',
        title: '정치자금법 위반 (이재명 측에 쪼개기 한도초과 후원 공모)',
        verdict: '무죄',
        verdictColor: 'emerald',
        jury: '배심원 7-0 만장일치 무죄',
        juryDetail: '2018년 경기도지사 후원회·2021년 민주당 대선 경선 후원회 모두 이화영이 관여했다고 볼 수 없다며 7명 전원 무죄.',
        court: '재판부도 무죄. “쪼개기 후원 관여가 합리적 의심이 들 정도로 증명되지 않았다.”',
    },
    {
        key: '직권남용',
        title: '직권남용·위계공무집행방해 (경기도 공무원에 대북 금송·밀가루 지원 강요)',
        verdict: '공소기각',
        verdictColor: 'amber',
        jury: '배심원 만장일치 “법령 위배 아님 · 검찰권 과잉 아님”',
        juryDetail: '대북 지원 사업이 관련 법령에 위배되는지 등 실체적 혐의에 대해 7명 전원이 “아니다”라고 평결.',
        court: '재판부는 실체판단(무죄) 적용 전, 절차적 사유로 공소기각. 검찰이 신명섭 사건에서 이화영을 공범으로 적시해 먼저 유죄 판단을 받게 한 뒤 정작 본인은 “객관적 혐의 없다”며 늦게 기소한 것을 “방어권을 충분히 행사하지 못한 상태에서 유죄 판단을 받게 한 명백한 공소권 남용(쪼개기 기소)”으로 판단.',
    },
];

// 배심원제 vs 참심제 비교
const COMPARISON = [
    {
        axis: '평결의 효력',
        jury: '권고적 효력만 — 법관을 기속하지 못함',
        chamsim: '판결에 직접 반영 — 시민법관이 합의체의 일원',
    },
    {
        axis: '시민의 권한 범위',
        jury: '유·무죄 사실판단 의견 (양형은 의견 개진에 그침)',
        chamsim: '유·무죄 + 양형까지 직업법관과 동등하게 평결',
    },
    {
        axis: '합의 방식',
        jury: '배심원단이 따로 평의 → 법관에게 ‘권고’',
        chamsim: '시민법관과 직업법관이 한 재판부에서 함께 평의',
    },
    {
        axis: '모집 기간',
        jury: '사건마다 1회성 차출 (단기)',
        chamsim: '정당 지명·지방의회 등이 임기제로 선출 (수년)',
    },
    {
        axis: '배심원 면접 유무',
        jury: '있음 — 선정기일에 판사·검사·변호인이 질문·기피',
        chamsim: '없음 — 추천·선출로 구성, 사건별 면접 안 함',
    },
    {
        axis: '적용 사건',
        jury: '피고인이 신청한 일부 형사사건에 한정',
        chamsim: '법으로 정한 대상 사건에 상시 적용',
    },
    {
        axis: '대표 국가',
        jury: '미국·영국 (배심제)',
        chamsim: '독일·스웨덴·핀란드·일본 (참심·재판원제)',
    },
    {
        axis: '도입 요건',
        jury: '현행 국민참여재판법',
        chamsim: '헌법 개정 불필요 — 법률 개정만으로 도입 가능',
    },
];

// 이 재판이 드러낸 배심원제의 구조적 한계
const LIMITS = [
    {
        n: '1',
        title: '평결은 ‘권고’일 뿐, 판결을 결정하지 못한다',
        body: '배심원 7명이 정치자금법·대북지원 혐의를 만장일치로 무죄/무위배로 봤지만, 재판부는 직권남용을 실체판단 없이 절차(공소기각)로 종결했다. 시민의 일치된 판단이 판결의 형식과 결론을 직접 정하지 못한다는 것이 국민참여재판법상 ‘권고적 효력’의 한계다.',
    },
    {
        n: '2',
        title: '피고인이 신청해야만 열린다 (신청주의)',
        body: '이 재판도 이화영 본인의 요청으로 열렸다. 연간 수십만 건의 형사사건 중 국민참여재판으로 진행되는 것은 극소수에 불과해, 시민의 사법 참여가 예외적 이벤트에 머문다.',
    },
    {
        n: '3',
        title: '양형은 시민의 몫이 아니다',
        body: '배심원은 유·무죄 의견을 내고 유죄 시 양형 의견을 개진할 수 있지만, 형량을 정하는 권한은 직업법관에게 있다. 위증 ‘징역 4개월’도 최종적으로 재판부가 결정했다. 시민의 법감정이 형량에 구속력 있게 반영되지 않는다.',
    },
    {
        n: '4',
        title: '시민 부담이 크고 장기화에 취약하다',
        body: '이 사건은 역대 최장인 10일간 진행됐고 선고는 6.20 새벽 3시 30분에야 나왔다. 생업을 둔 시민 배심원에게 장기 재판은 큰 부담이며, 복잡·장기 사건일수록 참여 자체가 어려워진다.',
    },
];

// 해외와 비교 — 모집·추천 방식 / 선정 면접 / 모집 기간(임기)
const INTL = [
    { country: '🇰🇷 한국', type: '배심제', mark: 'jury', recruit: '국민 명부에서 사건마다 무작위 추첨', interview: '있음 — 판사·검사·변호인이 질문·기피', term: '사건 단위 (원칙 1~3일, 이화영 10일은 역대 최장)' },
    { country: '🇺🇸 미국', type: '배심제', mark: 'jury', recruit: '유권자·면허 명부에서 무작위 소환', interview: '있음 — voir dire(판사·검사·변호인)', term: '사건 단위 (수일~수개월)' },
    { country: '🇬🇧 영국', type: '배심제', mark: 'jury', recruit: '선거인명부에서 무작위 소환', interview: '제한적 — 원칙상 기피 거의 없음', term: '사건 단위 (수일~수주)' },
    { country: '🇫🇷 프랑스', type: '혼합(중죄법원)', mark: 'mixed', recruit: '선거인명부 추첨 → 직업법관과 합의', interview: '개정 시 제한적 기피(이유 없이 검사 3·피고인 4명)', term: '세션 단위 (분기당 약 15일, 복수 사건)' },
    { country: '🇩🇪 독일', type: '참심제', mark: 'chamsim', recruit: '지자체 명부 → 선정위원회가 선출 (정당·단체 추천 영향)', interview: '없음 — 사건별 면접·기피 안 함', term: '임기제 (통상 5년)' },
    { country: '🇸🇪 스웨덴', type: '참심제', mark: 'chamsim', recruit: '정당이 지명 → 지방의회가 선출 (의석 비례)', interview: '없음 — 정당·의회 선출로 구성', term: '임기 4년' },
    { country: '🇫🇮 핀란드', type: '참심제', mark: 'chamsim', recruit: '지방의회가 선출 (정당 협상·자원봉사 시민)', interview: '없음 — 의회 선출로 구성', term: '임기제 (의회 임기와 연동)' },
    { country: '🇯🇵 일본', type: '재판원제(참심형)', mark: 'chamsim', recruit: '유권자 명부에서 사건마다 무작위 선정', interview: '있음(간이) — 선임절차서 기피 가능', term: '사건 단위 (평균 수일)' },
];

const SOURCES = [
    { name: '파이낸셜뉴스 — ‘쪼개기 기소’에 제동, 공소기각 후폭풍', url: 'https://www.fnnews.com/news/202606200542298773' },
    { name: '파이낸셜뉴스 — ‘연어 술파티’ 징역 4개월, 배심원 4:3 (종합2보)', url: 'https://www.fnnews.com/news/202606200520089162' },
    { name: '경향신문 — 역대 최장 국민참여재판, 20일 새벽 선고', url: 'https://www.khan.co.kr/article/202606190924001/' },
    { name: '오마이뉴스 — 위증 유죄·정치자금법 무죄·직권남용 공소기각', url: 'https://www.ohmynews.com/NWS_Web/Series/series_premium_pg.aspx?CNTN_CD=A0003244814&PAGE_CD=N0002&CMPT_CD=M0112' },
];

const VERDICT_BADGE = {
    rose: 'bg-rose-100 text-rose-800 border-rose-200',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
};

export default function JuryTrialAnalysis() {
    return (
        <div className="min-h-screen bg-gray-50">
            <SEOHead
                title="이화영 국민참여재판 분석 — 배심원제의 한계와 참심제"
                description="이화영 국민참여재판(2026.6.20 선고) 사건별 평결을 분석하고, 배심원 평결의 권고적 한계와 참심제 도입의 필요성을 짚습니다. 배심원 만장일치 무죄에도 재판부가 공소기각으로 종결한 이유는?"
                path="/jury-analysis"
                image="/참심제시뮬레이션.png"
                type="article"
            />
            <Header />

            <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                {/* Hero */}
                <header className="mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold mb-4">
                        ⚖️ 국민참여재판 심층 분석
                    </div>
                    <h1 className="text-2xl md:text-4xl font-bold text-gray-900 leading-snug mb-4">
                        이화영 국민참여재판이 보여준<br className="hidden md:block" /> 배심원제의 한계와 <span className="text-indigo-700">참심제</span>라는 답
                    </h1>
                    <p className="text-gray-600 md:text-lg leading-relaxed mb-5">
                        배심원 7명이 핵심 혐의를 <strong>만장일치로 무죄</strong>로 봤는데도, 재판부는 실체 판단 없이 <strong>공소기각</strong>으로 사건을 끝냈습니다.
                        시민의 일치된 판단이 판결을 결정하지 못하는 이 구조가, 왜 우리가 <strong>참심제</strong>를 말하는지 보여줍니다.
                    </p>
                    <div className="flex flex-wrap gap-2 text-sm">
                        {[
                            '2026.6.20 새벽 3:30 선고',
                            '수원지법 형사11부 (송병훈 부장판사)',
                            '본배심원 7명 + 예비 5명',
                            '2026.6.8~6.20 · 역대 최장 10일',
                        ].map((m) => (
                            <span key={m} className="px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700">{m}</span>
                        ))}
                    </div>
                </header>

                {/* 1. 사건 개요 */}
                <section className="mb-10 bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">① 어떤 재판이었나</h2>
                    <p className="text-gray-700 leading-relaxed mb-3">
                        이화영 전 경기도 평화부지사가 <strong>본인 요청</strong>으로 신청한 국민참여재판입니다.
                        쌍방울 대북송금 본안 사건(징역 7년8개월 대법 확정, 2025.6.5)과는 <strong>별개</strong>로,
                        ①위증 ②정치자금법 위반 ③직권남용·위계공무집행방해 세 갈래 혐의를 다뤘습니다.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        이화영 측은 검찰의 진술 회유와 ‘조작 수사’를 주장하며 혐의를 전부 부인했고, 검찰은 위증·직권남용 등에 징역 2년, 정치자금법에 벌금 500만원을 구형했습니다.
                        무작위 추첨으로 뽑힌 후보들이 선정기일(6.8, 비공개)에서 출석·질문(면접)·기피 절차를 거쳐 <strong>본배심원 7명과 예비배심원 5명(총 12명)</strong>으로 확정됐고, 본배심원 7명이 열흘간 평의에 참여했습니다.
                    </p>
                    <p className="mt-4 text-sm text-gray-500">
                        ※ 12·3 내란 사건과는 무관한 별개의 사건입니다. 이 페이지는 ‘국민참여재판’이라는 제도 자체를 분석하기 위한 사례로 다룹니다.
                    </p>
                </section>

                {/* 2. 사건별 평결·선고 결과 */}
                <section className="mb-10">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">② 사건별 평결·선고 결과</h2>
                    <div className="space-y-4">
                        {CHARGES.map((c) => (
                            <article key={c.key} className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <h3 className="font-bold text-gray-900 leading-snug">{c.title}</h3>
                                    <span className={`shrink-0 px-3 py-1 rounded-lg border text-sm font-bold ${VERDICT_BADGE[c.verdictColor]}`}>
                                        {c.verdict}
                                    </span>
                                </div>
                                <div className="grid md:grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                                        <p className="text-xs font-semibold text-indigo-700 mb-1">🧑‍🤝‍🧑 배심원 평결</p>
                                        <p className="text-sm font-bold text-gray-900 mb-1">{c.jury}</p>
                                        <p className="text-sm text-gray-600 leading-relaxed">{c.juryDetail}</p>
                                    </div>
                                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                                        <p className="text-xs font-semibold text-gray-600 mb-1">⚖️ 재판부 선고</p>
                                        <p className="text-sm text-gray-700 leading-relaxed">{c.court}</p>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                    <p className="mt-3 text-sm text-gray-500">검찰 구형: 위증·직권남용 등 징역 2년 + 정치자금법 벌금 500만원.</p>

                    {/* 쟁점: 술파티 위증 공방 + 사법개혁 관점 */}
                    <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-5 md:p-6">
                        <p className="font-bold text-rose-900 mb-3">🔍 쟁점 — ‘술파티’ 위증을 둘러싼 공방, 그리고 검찰·사법개혁</p>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li>• <strong>이화영·변호인·민주당 측:</strong> 검찰청 앞 편의점 ‘소주 구입 영수증’, 박상용 검사–변호인 통화 녹취, 오후 6시 이후 수사기록 부재 등을 들어 검찰의 향응·진술회유가 실재했다고 주장.</li>
                            <li>• <strong>박상용·검찰 측:</strong> 좁은 영상녹화실에 교도관이 계호하는 상황이라 음주는 불가능하다며 “진술세미나? 망상”이라고 전면 부인. 지목된 7명 전원이 술자리를 부인.</li>
                            <li>• <strong>재판부:</strong> 7명의 일관된 부인과 이화영의 진술 번복(장소·날짜·시간)을 근거로 위증 유죄. 변호인이 낸 소주 영수증은 다수 배심원을 설득하지 못함.</li>
                            <li>• <strong>다만</strong> 박상용 검사는 진술회유 의혹으로 2026.4.9 종합특검에 피의자로 입건·출국금지 — 향응·회유 의혹의 실체는 별도 수사로 가려지는 중.</li>
                        </ul>
                        <p className="mt-3 text-sm text-rose-900 leading-relaxed bg-white/70 rounded-lg p-3">
                            <strong>시민법정의 관점.</strong> 진술회유 의혹으로 특검 피의자까지 된 검사의 권한 남용조차 그 실체는 또다시 검찰의 손에서 가려지고, 시민이 핵심 혐의를 만장일치로 판단해도 그 평결은 ‘권고’에 그치며, 배심원을 누구로 앉힐지마저 판사와 검사가 정합니다. 견제받지 않는 검찰권, 시민의 판단을 ‘참고만 하는’ 사법 — 이 구조를 그대로 둔 채로는 어떤 판결도 신뢰를 회복할 수 없습니다. <strong>검찰개혁과 사법개혁(참심제 도입)은 선택이 아니라 필수입니다.</strong> 시민의 상식이 ‘권고’가 아니라 ‘판결’이 될 때, 비로소 권력은 시민 앞에 책임을 집니다.
                        </p>
                    </div>
                </section>

                {/* 3. 배심원 평결 패턴 분석 */}
                <section className="mb-10 bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">③ 배심원들은 어떤 ‘성향’을 보였나</h2>
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-5">
                        <p className="text-sm text-amber-900 leading-relaxed">
                            <strong>먼저 짚을 점:</strong> 국민참여재판 배심원의 <strong>신원·개인 성향은 법으로 보호되어 공개되지 않습니다</strong>(배심원 보호 원칙).
                            따라서 개별 배심원의 정치성향을 단정하는 것은 불가능하며, 분석할 수 있는 것은 <strong>평결로 드러난 집단적 판단 경향</strong>뿐입니다.
                            배심원은 만 20세 이상 국민 중 <strong>무작위로 선정</strong>되므로, 특정 진영이 아니라 ‘보통 시민의 상식적 법감정’에 가깝습니다.
                        </p>
                    </div>
                    <ul className="space-y-4">
                        <li className="flex gap-3">
                            <span className="shrink-0 text-emerald-600 font-bold">▸</span>
                            <p className="text-gray-700 leading-relaxed">
                                <strong>검찰권의 과잉에는 결집해 견제.</strong> 정치적 색채가 짙은 핵심 혐의(정치자금법·대북지원 직권남용)에 대해 <strong>7명 전원이 만장일치</strong>로 검찰에 불리한 판단을 내렸습니다.
                                시민 배심원단이 ‘쪼개기 후원’이나 ‘대북지원의 형사화’ 같은 검찰의 무리한 기소 논리에 회의적이었음을 보여줍니다.
                            </p>
                        </li>
                        <li className="flex gap-3">
                            <span className="shrink-0 text-rose-600 font-bold">▸</span>
                            <p className="text-gray-700 leading-relaxed">
                                <strong>사실관계가 엇갈리는 사안에서는 분열.</strong> 반면 ‘술파티’ 위증은 <strong>4 대 3</strong>으로 갈렸습니다 — 다수(4명)는 ‘술파티가 없었다’며 위증으로, 소수(3명)는 위증으로 단정하기 어렵다고 봤습니다. 시민은 검찰권 견제에는 한목소리를 냈지만, 진술이 엇갈리는 개별 사실 인정에는 신중하게 나뉘었습니다.
                            </p>
                        </li>
                        <li className="flex gap-3">
                            <span className="shrink-0 text-indigo-600 font-bold">▸</span>
                            <p className="text-gray-700 leading-relaxed">
                                <strong>결론:</strong> ‘무조건 피고인 편’도 ‘무조건 검찰 편’도 아니었습니다. 무리한 기소는 만장일치로 깨고, 거짓말(위증)은 다수의견으로 유죄로 인정했습니다.
                                이것이 바로 무작위 시민이 보여주는 <strong>균형 잡힌 상식</strong>이며, 사법에 시민을 참여시켜야 하는 이유입니다.
                            </p>
                        </li>
                    </ul>
                </section>

                {/* 4. 배심원제의 한계 */}
                <section className="mb-10">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">④ 그런데 — 이 재판이 드러낸 배심원제의 한계</h2>
                    <p className="text-gray-600 mb-5">시민의 균형 잡힌 판단이 있었는데도, 그 판단은 판결을 ‘결정’하지 못했습니다.</p>
                    <div className="grid md:grid-cols-2 gap-4">
                        {LIMITS.map((l) => (
                            <div key={l.n} className="bg-white rounded-2xl border border-gray-200 p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-900 text-white text-sm font-bold">{l.n}</span>
                                    <h3 className="font-bold text-gray-900">{l.title}</h3>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{l.body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. 해외 비교: 모집과 기간 */}
                <section className="mb-10">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">⑤ 해외와 비교 — 시민 ‘모집’과 ‘기간’</h2>
                    <p className="text-gray-600 mb-5">
                        한국은 시민을 <strong>사건마다 한 번 무작위로 차출</strong>하고, 부담을 줄이려 보통 1~3일 안에 압축해 끝냅니다.
                        이화영 재판의 10일은 역대 최장으로, 현행 배심제가 복잡·장기 사건에 취약함을 보여줍니다. 반면 참심제 국가들은 시민법관을 <strong>임기제로 두거나 합의체로 편성</strong>해 지속성과 책임성을 확보합니다.
                    </p>
                    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                        <table className="w-full text-sm min-w-[760px]">
                            <thead>
                                <tr className="border-b border-gray-200 text-left bg-gray-50">
                                    <th className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">국가</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">유형</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700">모집·추천 방식</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700">선정 면접</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">모집 기간(임기)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {INTL.map((r) => (
                                    <tr key={r.country} className="border-b border-gray-100 align-top">
                                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{r.country}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.mark === 'chamsim' ? 'bg-indigo-100 text-indigo-700' : r.mark === 'mixed' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{r.type}</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{r.recruit}</td>
                                        <td className="px-4 py-3 text-gray-700">{r.interview}</td>
                                        <td className="px-4 py-3 text-gray-700">{r.term}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-3 text-sm text-gray-500">
                        정리하면 <strong>배심제</strong>는 ‘일회성 차출 + 단기’, <strong>참심제</strong>는 ‘임기제·합의체 + 지속’입니다. 시민이 더 깊이, 더 책임 있게 참여할수록 그 평결의 무게도 커집니다.
                    </p>

                    {/* 면접(선정기일 질문) 주체 + 핀란드 모델 */}
                    <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
                        <p className="font-bold text-indigo-900 mb-2">📌 ‘면접(선정기일 질문)은 누가 보나?’</p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            한국 국민참여재판에서 배심원 후보를 질문·선별하는 주체는 <strong>시민이 아니라 재판부(판사)와 검사·변호인</strong>입니다. 검사·변호인은 이유를 대지 않고도 후보를 배제하는 ‘무이유부 기피’를 각각 행사합니다(7인 배심에서 각 4명). 미국도 <strong>voir dire</strong>에서 판사·검사·변호인이 같은 방식으로 선별하므로, ‘면접’ 절차 자체는 해외 배심제에도 있습니다.
                            반면 유럽 참심제는 사건마다 면접·기피로 거르지 않습니다. <strong>스웨덴</strong>은 정당이 후보를 지명하고 지방의회가 의석 비례로 선출(임기 4년), <strong>독일</strong>은 지자체 명부로 선정위원회가 선출(임기 약 5년), <strong>핀란드</strong>는 지방의회가 선출합니다 — 선정 단계부터 시민의 대표성이 더 안정적으로 보장됩니다.
                        </p>
                        <p className="mt-3 text-sm text-indigo-900 bg-white/70 rounded-lg p-3">
                            🇫🇮 <strong>핀란드 모델</strong> — 지방의회가 임기제로 시민 참심인(lautamies)을 선출하고 직업법관과 <strong>동등한 권리</strong>로 함께 판단하는 방식은, <strong>시민법정이 지향하는 모델</strong>입니다.
                        </p>
                    </div>
                </section>

                {/* 6. 참심제 대안 */}
                <section className="mb-10 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 md:p-8 text-white">
                    <h2 className="text-xl md:text-2xl font-bold mb-2">⑥ 그래서 ‘참심제’다</h2>
                    <p className="text-indigo-100 leading-relaxed mb-6">
                        배심원제(권고)와 달리, <strong className="text-white">참심제</strong>는 주권자가 뽑힌 ‘시민법관(참심원)’으로서 직업법관과 <strong className="text-white">하나의 재판부</strong>를 이뤄
                        유·무죄와 양형을 <strong className="text-white">함께 결정</strong>합니다. 시민의 평결이 ‘권고’가 아니라 <strong className="text-white">판결 그 자체</strong>가 됩니다.
                    </p>
                    <div className="overflow-x-auto rounded-xl bg-white/10 backdrop-blur">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/20 text-left">
                                    <th className="px-4 py-3 font-semibold">구분</th>
                                    <th className="px-4 py-3 font-semibold">현행 배심원제 (국민참여재판)</th>
                                    <th className="px-4 py-3 font-semibold text-amber-200">참심제 (시민법정 제안)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {COMPARISON.map((row) => (
                                    <tr key={row.axis} className="border-b border-white/10 align-top">
                                        <td className="px-4 py-3 font-semibold whitespace-nowrap">{row.axis}</td>
                                        <td className="px-4 py-3 text-indigo-100">{row.jury}</td>
                                        <td className="px-4 py-3 text-white font-medium">{row.chamsim}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 rounded-xl bg-white/10 p-5">
                        <p className="font-bold mb-2">🔁 이화영 사건에 ‘참심제’였다면?</p>
                        <p className="text-indigo-100 text-sm leading-relaxed">
                            정치자금법·대북지원에 대한 <strong className="text-white">시민 7명의 만장일치 무죄 판단이 곧 판결</strong>이 되어, 재판부가 절차로 우회하거나 실체판단을 미룰 여지가 줄어듭니다.
                            위증의 <strong className="text-white">형량(징역 4개월)도 시민이 직업법관과 함께</strong> 정하게 됩니다. 시민의 상식이 ‘권고’를 넘어 결론에 책임 있게 반영되는 것입니다.
                        </p>
                    </div>
                    <p className="mt-4 text-xs text-indigo-200">
                        독일(Schöffe)·프랑스(중죄법원)·일본(재판원제)이 채택한 방식이며, 우리 헌법 제1조 제2항(국민주권)에 부합해 <strong className="text-white">헌법 개정 없이 법률 개정만으로 도입할 수 있습니다.</strong>
                    </p>
                </section>

                {/* CTA */}
                <section className="mb-10 bg-white rounded-2xl border border-gray-200 p-6 md:p-8 text-center">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2">시민이 판결에 책임 있게 참여하는 사법으로</h2>
                    <p className="text-gray-600 mb-5">참심제가 어떻게 작동하는지 직접 확인해 보세요.</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link to="/simulation" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition">참심제 체험하기</Link>
                        <Link to="/jury-academy" className="px-5 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 transition">참심제 아카데미</Link>
                        <Link to="/europe-jury" className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition">해외 사례 보기</Link>
                        <Link to="/trial-schedule" className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition">📅 재판 일정</Link>
                    </div>
                </section>

                {/* 출처 */}
                <section className="mb-6">
                    <h2 className="text-sm font-bold text-gray-500 mb-3">출처 (교차 검증 4개 매체)</h2>
                    <ul className="space-y-2">
                        {SOURCES.map((s) => (
                            <li key={s.url}>
                                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-words">
                                    {s.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-4 text-xs text-gray-400 leading-relaxed">
                        본 분석의 평결·선고 사실은 2026년 6월 19~20일 보도된 위 4개 매체를 교차 확인한 것입니다.
                        배심원 개인의 신원·성향은 법적으로 보호되어 공개되지 않으며, 본문의 ‘성향’ 분석은 공개된 평결 결과(집단적 판단)에 한정됩니다.
                    </p>
                </section>

                <SNSShareBar />
            </main>
        </div>
    );
}
