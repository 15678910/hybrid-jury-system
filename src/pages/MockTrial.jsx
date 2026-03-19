import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import SEOHead from '../components/SEOHead';
import SNSShareBar from '../components/SNSShareBar';

const STEPS = ['소개', '사건 개요', '증거 검토', '평의', '결과'];

const EVIDENCE_TABS = [
  {
    id: 'accounting',
    icon: '\uD83D\uDCC4',
    title: '회계 서류',
    content: '허위 지출 결의서 15건 확인, 총 5.2억원. 피고인이 직접 작성한 것으로 확인된 결의서에는 실재하지 않는 업체명과 허위 용역 내역이 기재되어 있습니다.',
  },
  {
    id: 'money',
    icon: '\uD83D\uDCB0',
    title: '자금 추적',
    content: '피고인 개인 계좌로 3.1억원 이체 확인. 금융거래 추적 결과, 공공기관 예산에서 피고인 명의 개인 계좌로 3년간 총 31건의 이체가 이루어졌습니다.',
  },
  {
    id: 'witness',
    icon: '\uD83D\uDC64',
    title: '증인 진술',
    content: '동료 직원 증인 진술: "김OO가 지출 결의서를 작성하고 본인이 승인했다. 다른 직원들은 이 과정에 관여하지 않았으며, 김OO가 재무 관련 모든 권한을 독점적으로 행사했다."',
  },
  {
    id: 'defense',
    icon: '\uD83D\uDD0D',
    title: '변호인 반박',
    content: '기관 관행상 재무담당이 지출 결의 및 승인을 겸하는 것이 일반적이었음. 이체된 금액은 업무 관련 지출(접대비, 출장비 등)로 사용되었으며, 기관의 내부통제 시스템 부재가 근본 원인입니다.',
  },
];

const REASONS = [
  '회계 서류 위조가 명백함',
  '개인 계좌 이체가 횡령의 증거',
  '기관 관행이라는 변호인 주장에 타당성 있음',
  '피고인에게 유리한 정황도 존재',
];

const SENTENCING_OPTIONS = ['징역 2년', '징역 3년', '징역 5년', '징역 7년'];

export default function MockTrial() {
  const [step, setStep] = useState(0);
  const [fade, setFade] = useState(true);
  const [viewedTabs, setViewedTabs] = useState(new Set());
  const [activeTab, setActiveTab] = useState(null);
  const [verdict, setVerdict] = useState(null); // 'guilty' | 'not-guilty'
  const [sentence, setSentence] = useState(null);
  const [reasons, setReasons] = useState([]);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    const count = parseInt(localStorage.getItem('mockTrialCount') || '0', 10);
    setParticipantCount(count);
  }, []);

  const goToStep = (nextStep) => {
    setFade(false);
    setTimeout(() => {
      setStep(nextStep);
      setFade(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 200);
  };

  const handleTabClick = (tabId) => {
    setActiveTab(activeTab === tabId ? null : tabId);
    setViewedTabs((prev) => new Set([...prev, tabId]));
  };

  const toggleReason = (reason) => {
    setReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleSubmitVote = () => {
    const newCount = participantCount + 1;
    localStorage.setItem('mockTrialCount', String(newCount));
    setParticipantCount(newCount);
    goToStep(4);
  };

  const handleRestart = () => {
    setVerdict(null);
    setSentence(null);
    setReasons([]);
    setViewedTabs(new Set());
    setActiveTab(null);
    goToStep(0);
  };

  const getMajorityDecision = () => {
    // Simulated votes: 참심원2=유죄/3년, 참심원3=유죄/5년, 직업법관=유죄/5년
    const votes = [];
    if (verdict === 'guilty') {
      votes.push(
        { guilty: true, sentence: sentence },
        { guilty: true, sentence: '징역 3년' },
        { guilty: true, sentence: '징역 5년' },
        { guilty: true, sentence: '징역 5년' }
      );
    } else {
      votes.push(
        { guilty: false, sentence: null },
        { guilty: true, sentence: '징역 3년' },
        { guilty: true, sentence: '징역 5년' },
        { guilty: true, sentence: '징역 5년' }
      );
    }
    const guiltyCount = votes.filter((v) => v.guilty).length;
    const isGuilty = guiltyCount >= 3;

    if (!isGuilty) return '무죄';

    // Find most common sentence among guilty votes
    const sentenceCounts = {};
    votes
      .filter((v) => v.guilty && v.sentence)
      .forEach((v) => {
        sentenceCounts[v.sentence] = (sentenceCounts[v.sentence] || 0) + 1;
      });
    const sorted = Object.entries(sentenceCounts).sort((a, b) => b[1] - a[1]);
    return `유죄 — ${sorted[0][0]}`;
  };

  return (
    <>
      <SEOHead
        title="참심제 모의재판 체험"
        description="시민법관이 되어 모의재판에 참여해보세요. 참심원으로서 직접 증거를 검토하고 판결에 참여하는 체험입니다."
        path="/mock-trial"
      />
      <Header />

      <main className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 pt-20">
        {/* Progress Bar */}
        <div className="sticky top-16 z-40 bg-stone-900/90 backdrop-blur border-b border-amber-900/30">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {STEPS.map((label, i) => (
                <div key={label} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                        i < step
                          ? 'bg-amber-600 border-amber-500 text-white'
                          : i === step
                          ? 'bg-amber-700 border-amber-400 text-amber-100 ring-2 ring-amber-400/30'
                          : 'bg-stone-700 border-stone-600 text-stone-400'
                      }`}
                    >
                      {i < step ? '\u2713' : i + 1}
                    </div>
                    <span
                      className={`text-xs mt-1 hidden sm:block ${
                        i === step ? 'text-amber-300 font-medium' : 'text-stone-500'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`w-8 sm:w-16 h-0.5 mx-1 ${
                        i < step ? 'bg-amber-600' : 'bg-stone-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          className={`container mx-auto px-4 py-8 max-w-4xl transition-opacity duration-200 ${
            fade ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Step 0: Introduction */}
          {step === 0 && (
            <div className="text-center">
              <div className="mb-8">
                <span className="text-6xl">&#9878;&#65039;</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-amber-100 mb-4">
                참심제 모의재판 체험
              </h1>
              <p className="text-lg text-amber-200/80 mb-8">
                시민법관이 되어 재판에 참여해보세요
              </p>

              {/* Structure Diagram */}
              <div className="bg-stone-800/80 border border-amber-900/40 rounded-2xl p-6 sm:p-8 mb-8 max-w-2xl mx-auto">
                <h2 className="text-xl font-bold text-amber-200 mb-6">
                  한국형 참심제 구성
                </h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-6">
                  {/* Citizen Judges */}
                  <div className="flex gap-3">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-blue-900/30">
                          <span role="img" aria-label="citizen">&#128100;</span>
                        </div>
                        <span className="text-sm text-blue-300 mt-2 font-medium">
                          시민 {n}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="text-amber-500 text-2xl font-bold">+</div>

                  {/* Professional Judge */}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-amber-900/30">
                      <span role="img" aria-label="judge">&#9878;&#65039;</span>
                    </div>
                    <span className="text-sm text-amber-300 mt-2 font-medium">
                      직업법관
                    </span>
                  </div>
                </div>

                <div className="bg-stone-700/50 rounded-lg p-4 text-stone-300 text-sm leading-relaxed">
                  <p className="mb-2">
                    <strong className="text-amber-200">참심원(시민법관) 3명</strong>과{' '}
                    <strong className="text-amber-200">직업법관 1명</strong>이 함께 재판합니다.
                  </p>
                  <p>
                    참심원의 투표는 직업법관과 <strong className="text-green-400">동등한 권한</strong>을 가지며,{' '}
                    <strong className="text-green-400">다수결</strong>로 판결이 확정됩니다.
                  </p>
                </div>

                <div className="mt-4 text-xs text-stone-500">
                  독일 Schoeffengericht(참심법원) 모델을 한국에 맞게 확대 적용
                </div>
              </div>

              <button
                onClick={() => goToStep(1)}
                className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-amber-900/30 transition-all duration-200 hover:scale-105"
              >
                재판 시작하기
              </button>
            </div>
          )}

          {/* Step 1: Case Briefing */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-amber-100 mb-6 text-center">
                &#128221; 사건 개요
              </h2>

              <div className="bg-stone-800/80 border border-amber-900/40 rounded-2xl overflow-hidden mb-8">
                {/* Case Header */}
                <div className="bg-gradient-to-r from-red-900/60 to-red-800/40 px-6 py-4 border-b border-red-900/30">
                  <h3 className="text-xl font-bold text-red-200">
                    공공기금 횡령 사건
                  </h3>
                  <p className="text-red-300/70 text-sm mt-1">
                    특정경제범죄가중처벌법 위반
                  </p>
                </div>

                <div className="p-6 space-y-5">
                  {/* Defendant */}
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">&#128100;</span>
                    <div>
                      <p className="text-amber-300 font-medium">피고인</p>
                      <p className="text-stone-300">
                        김OO (가명), 공공기관 재무담당 (근무 8년차)
                      </p>
                    </div>
                  </div>

                  {/* Charges */}
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">&#9888;&#65039;</span>
                    <div>
                      <p className="text-amber-300 font-medium">혐의</p>
                      <p className="text-stone-300">
                        공공기금 5억원 횡령 (특정경제범죄가중처벌법 위반)
                      </p>
                    </div>
                  </div>

                  {/* Prosecution */}
                  <div className="bg-red-900/20 border border-red-900/30 rounded-xl p-4">
                    <p className="text-red-300 font-medium mb-2">&#128308; 검찰 주장</p>
                    <p className="text-stone-300 leading-relaxed">
                      피고인은 3년간 허위 지출 서류를 작성하여 총 5억원의 공공기금을
                      횡령했습니다. 허위 업체에 대한 용역비 명목으로 자금을 빼돌린 후,
                      개인 계좌로 이체한 정황이 확인되었습니다.
                    </p>
                  </div>

                  {/* Defense */}
                  <div className="bg-blue-900/20 border border-blue-900/30 rounded-xl p-4">
                    <p className="text-blue-300 font-medium mb-2">&#128309; 변호인 주장</p>
                    <p className="text-stone-300 leading-relaxed">
                      해당 지출은 기관의 오랜 업무 관행에 따른 것이며, 피고인은 개인적
                      이득을 취한 바 없습니다. 이체된 금액은 모두 업무 관련 지출(접대비,
                      출장비, 업무추진비)로 사용되었습니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => goToStep(2)}
                  className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-amber-900/30 transition-all duration-200 hover:scale-105"
                >
                  증거 확인하기
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Evidence Review */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-amber-100 mb-2 text-center">
                &#128269; 증거 검토
              </h2>
              <p className="text-stone-400 text-center mb-8">
                각 증거를 클릭하여 내용을 확인하세요 (최소 3개 이상)
              </p>

              <div className="space-y-3 mb-8">
                {EVIDENCE_TABS.map((tab) => {
                  const isViewed = viewedTabs.has(tab.id);
                  const isActive = activeTab === tab.id;
                  return (
                    <div key={tab.id}>
                      <button
                        onClick={() => handleTabClick(tab.id)}
                        className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                          isActive
                            ? 'bg-amber-900/30 border-amber-600/50 shadow-lg'
                            : isViewed
                            ? 'bg-stone-800/60 border-green-800/40 hover:border-green-700/50'
                            : 'bg-stone-800/60 border-stone-700/50 hover:border-amber-700/50 hover:bg-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{tab.icon}</span>
                          <span
                            className={`font-medium ${
                              isActive ? 'text-amber-200' : 'text-stone-200'
                            }`}
                          >
                            {tab.title}
                          </span>
                          {isViewed && (
                            <span className="text-green-500 text-sm">&#10003; &#54869;&#51064;</span>
                          )}
                        </div>
                        <svg
                          className={`w-5 h-5 text-stone-400 transition-transform ${
                            isActive ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {isActive && (
                        <div className="mt-2 px-5 py-4 bg-stone-800/40 border border-stone-700/30 rounded-xl">
                          <p className="text-stone-300 leading-relaxed">{tab.content}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="text-center">
                <p className="text-stone-500 text-sm mb-4">
                  {viewedTabs.size}/4개 증거 확인 완료
                  {viewedTabs.size < 3 && ' (최소 3개 필요)'}
                </p>
                <button
                  onClick={() => goToStep(3)}
                  disabled={viewedTabs.size < 3}
                  className={`px-8 py-4 rounded-xl text-lg font-bold shadow-lg transition-all duration-200 ${
                    viewedTabs.size >= 3
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-900/30 hover:scale-105'
                      : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  심리 참여하기
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Deliberation */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-amber-100 mb-2 text-center">
                &#9878;&#65039; 평의
              </h2>
              <p className="text-amber-200/60 text-center mb-8">
                참심원으로서 의견을 제시하세요
              </p>

              <div className="bg-green-900/20 border border-green-800/40 rounded-xl p-4 mb-8 text-center">
                <p className="text-green-300 text-sm">
                  참심원(시민법관)은 직업법관과 <strong>동등한 투표권</strong>을 가집니다
                </p>
              </div>

              <div className="space-y-8">
                {/* Question 1: Verdict */}
                <div className="bg-stone-800/80 border border-stone-700/50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-amber-200 mb-4">
                    Q1. 피고인이 유죄라고 생각하십니까?
                  </h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setVerdict('guilty');
                        if (verdict !== 'guilty') setSentence(null);
                      }}
                      className={`flex-1 py-3 rounded-xl font-bold text-lg border-2 transition-all duration-200 ${
                        verdict === 'guilty'
                          ? 'bg-red-900/40 border-red-500 text-red-200 shadow-lg shadow-red-900/20'
                          : 'bg-stone-700/50 border-stone-600 text-stone-300 hover:border-red-700'
                      }`}
                    >
                      유죄
                    </button>
                    <button
                      onClick={() => {
                        setVerdict('not-guilty');
                        setSentence(null);
                      }}
                      className={`flex-1 py-3 rounded-xl font-bold text-lg border-2 transition-all duration-200 ${
                        verdict === 'not-guilty'
                          ? 'bg-blue-900/40 border-blue-500 text-blue-200 shadow-lg shadow-blue-900/20'
                          : 'bg-stone-700/50 border-stone-600 text-stone-300 hover:border-blue-700'
                      }`}
                    >
                      무죄
                    </button>
                  </div>
                </div>

                {/* Question 2: Sentencing (only if guilty) */}
                {verdict === 'guilty' && (
                  <div className="bg-stone-800/80 border border-stone-700/50 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-amber-200 mb-4">
                      Q2. 적정 형량은?
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {SENTENCING_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setSentence(opt)}
                          className={`py-3 rounded-xl font-medium border-2 transition-all duration-200 ${
                            sentence === opt
                              ? 'bg-amber-900/40 border-amber-500 text-amber-200 shadow-lg'
                              : 'bg-stone-700/50 border-stone-600 text-stone-300 hover:border-amber-700'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question 3: Reasoning */}
                {verdict && (
                  <div className="bg-stone-800/80 border border-stone-700/50 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-amber-200 mb-4">
                      Q3. 판단의 근거를 선택해주세요 (복수 선택 가능)
                    </h3>
                    <div className="space-y-3">
                      {REASONS.map((reason) => (
                        <button
                          key={reason}
                          onClick={() => toggleReason(reason)}
                          className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                            reasons.includes(reason)
                              ? 'bg-amber-900/30 border-amber-600/50 text-amber-200'
                              : 'bg-stone-700/40 border-stone-600 text-stone-300 hover:border-amber-700/50'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <span
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs ${
                                reasons.includes(reason)
                                  ? 'bg-amber-600 border-amber-500 text-white'
                                  : 'border-stone-500'
                              }`}
                            >
                              {reasons.includes(reason) && '\u2713'}
                            </span>
                            {reason}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="text-center mt-8">
                <button
                  onClick={handleSubmitVote}
                  disabled={
                    !verdict ||
                    (verdict === 'guilty' && !sentence) ||
                    reasons.length === 0
                  }
                  className={`px-8 py-4 rounded-xl text-lg font-bold shadow-lg transition-all duration-200 ${
                    verdict &&
                    (verdict !== 'guilty' || sentence) &&
                    reasons.length > 0
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-900/30 hover:scale-105'
                      : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  의견 제출하기
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-amber-100 mb-8 text-center">
                &#128202; 판결 결과
              </h2>

              {/* Votes Table */}
              <div className="bg-stone-800/80 border border-amber-900/40 rounded-2xl overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-amber-900/40 to-amber-800/20 px-6 py-3 border-b border-amber-900/30">
                  <h3 className="text-lg font-bold text-amber-200">투표 결과</h3>
                </div>
                <div className="divide-y divide-stone-700/50">
                  {/* User's vote */}
                  <div className="px-6 py-4 flex items-center justify-between bg-amber-900/10">
                    <div className="flex items-center gap-3">
                      <span className="text-blue-400 text-lg">&#128100;</span>
                      <div>
                        <p className="text-amber-200 font-medium">참심원 1 (나)</p>
                        <p className="text-stone-500 text-xs">시민법관</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          verdict === 'guilty' ? 'text-red-400' : 'text-blue-400'
                        }`}
                      >
                        {verdict === 'guilty' ? '유죄' : '무죄'}
                      </p>
                      {verdict === 'guilty' && sentence && (
                        <p className="text-stone-400 text-sm">{sentence}</p>
                      )}
                    </div>
                  </div>

                  {/* Simulated votes */}
                  {[
                    { name: '참심원 2', role: '시민법관', verdict: '유죄', sentence: '징역 3년', icon: '&#128100;', color: 'text-blue-400' },
                    { name: '참심원 3', role: '시민법관', verdict: '유죄', sentence: '징역 5년', icon: '&#128100;', color: 'text-blue-400' },
                    { name: '직업법관', role: '판사', verdict: '유죄', sentence: '징역 5년', icon: '&#9878;&#65039;', color: 'text-amber-400' },
                  ].map((voter) => (
                    <div
                      key={voter.name}
                      className="px-6 py-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`${voter.color} text-lg`}
                          dangerouslySetInnerHTML={{ __html: voter.icon }}
                        />
                        <div>
                          <p className="text-stone-200 font-medium">{voter.name}</p>
                          <p className="text-stone-500 text-xs">{voter.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-400">{voter.verdict}</p>
                        <p className="text-stone-400 text-sm">{voter.sentence}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Majority Decision */}
                <div className="bg-gradient-to-r from-amber-900/30 to-amber-800/10 px-6 py-4 border-t border-amber-900/30">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-200 font-bold">다수결 판결</span>
                    <span className="text-xl font-bold text-amber-100">
                      {getMajorityDecision()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Message */}
              <div className="bg-gradient-to-br from-stone-800 to-stone-800/80 border-2 border-amber-600/40 rounded-2xl p-6 sm:p-8 mb-8">
                <h3 className="text-lg font-bold text-amber-200 mb-5 text-center">
                  왜 참심제가 필요한가?
                </h3>
                <div className="space-y-4">
                  <div className="bg-red-900/20 border border-red-900/30 rounded-xl p-4">
                    <p className="text-red-300 font-medium mb-1">
                      &#127472;&#127479; 현행 한국 (국민참여재판)
                    </p>
                    <p className="text-stone-300 text-sm leading-relaxed">
                      배심원의 평결은 <strong className="text-red-300">'권고적 효력'</strong>만
                      있어 법관이 무시할 수 있습니다. 실제로 배심원 평결과 다른 판결이
                      내려진 사례가 다수 존재합니다.
                    </p>
                  </div>
                  <div className="bg-green-900/20 border border-green-900/30 rounded-xl p-4">
                    <p className="text-green-300 font-medium mb-1">
                      &#127465;&#127466; 독일 참심제 (Schoeffengericht)
                    </p>
                    <p className="text-stone-300 text-sm leading-relaxed">
                      참심원의 투표는 법관과 <strong className="text-green-300">동등</strong>하며,{' '}
                      <strong className="text-green-300">다수결</strong>로 판결이 확정됩니다.
                      법관 혼자 시민의 뜻을 뒤집을 수 없습니다.
                    </p>
                  </div>
                  <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4 text-center">
                    <p className="text-amber-200 font-bold text-lg">
                      이것이 참심제 도입이 필요한 이유입니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-stone-800/60 border border-stone-700/40 rounded-xl p-5 mb-8 text-center">
                <p className="text-stone-400">
                  지금까지{' '}
                  <span className="text-amber-300 font-bold text-xl">
                    {participantCount.toLocaleString()}
                  </span>
                  명의 시민이 모의재판에 참여했습니다
                </p>
              </div>

              {/* SNS Share */}
              <div className="mb-8">
                <SNSShareBar />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleRestart}
                  className="px-6 py-3 rounded-xl font-bold border-2 border-stone-600 text-stone-300 hover:border-amber-600 hover:text-amber-200 transition-all duration-200"
                >
                  다시 체험하기
                </button>
                <Link
                  to="/#necessity"
                  className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-center shadow-lg transition-all duration-200"
                >
                  참심제 더 알아보기
                </Link>
                <Link
                  to="/#signature"
                  className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-center shadow-lg transition-all duration-200"
                >
                  준비위원으로 참여하기
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
