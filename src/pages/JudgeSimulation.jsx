import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import SEOHead from '../components/SEOHead';
import SNSShareBar from '../components/SNSShareBar';
import { SIMULATION_CASES, VERDICT_REASONS, SENTENCE_OPTIONS } from '../data/simulationCases';

const generateVisitorId = () => {
  const ua = navigator.userAgent;
  const lang = navigator.language;
  const screen = `${window.screen.width}x${window.screen.height}`;
  const str = `${ua}-${lang}-${screen}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `v_${Math.abs(hash).toString(36)}`;
};

const StepIndicator = ({ currentStep }) => {
  const steps = [
    { num: 1, label: '소개' },
    { num: 2, label: '사건 선택' },
    { num: 3, label: '판결' },
    { num: 4, label: '결과' },
  ];

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {steps.map((s, idx) => (
        <div key={s.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                currentStep === s.num
                  ? 'bg-blue-600 text-white scale-110 shadow-lg'
                  : currentStep > s.num
                  ? 'bg-blue-400 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {currentStep > s.num ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s.num
              )}
            </div>
            <span className={`text-xs mt-1 ${currentStep === s.num ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`w-8 sm:w-12 h-0.5 mx-1 mb-5 transition-colors duration-300 ${
                currentStep > s.num ? 'bg-blue-400' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default function JudgeSimulation() {
  const [step, setStep] = useState(1);
  const [selectedCase, setSelectedCase] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [sentence, setSentence] = useState(null);
  const [reasons, setReasons] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const goToStep = (newStep) => {
    setStep(newStep);
  };

  const selectCase = (caseData) => {
    setSelectedCase(caseData);
    setVerdict(null);
    setSentence(null);
    setReasons([]);
    setStats(null);
    setHasVoted(false);
    goToStep(3);
  };

  const toggleReason = (reasonId) => {
    setReasons((prev) =>
      prev.includes(reasonId) ? prev.filter((r) => r !== reasonId) : [...prev, reasonId]
    );
  };

  const submitVote = async () => {
    if (!verdict) return;
    if (verdict === 'guilty' && sentence === null) return;

    setLoading(true);
    try {
      const visitorId = generateVisitorId();

      const votesRef = collection(db, 'simulation_votes');
      const q = query(votesRef, where('caseId', '==', selectedCase.id), where('visitorId', '==', visitorId));
      const existing = await getDocs(q);

      const voteData = {
        caseId: selectedCase.id,
        visitorId,
        verdict,
        sentence: verdict === 'guilty' ? sentence : 0,
        reasons,
        createdAt: serverTimestamp(),
      };

      if (existing.empty) {
        await addDoc(votesRef, voteData);
      } else {
        const docRef = existing.docs[0].ref;
        await setDoc(docRef, voteData, { merge: true });
      }

      await fetchStats(selectedCase.id);
      setHasVoted(true);
      goToStep(4);
    } catch (error) {
      console.error('투표 제출 오류:', error);
      alert('투표 제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
    setLoading(false);
  };

  const fetchStats = async (caseId) => {
    try {
      const votesRef = collection(db, 'simulation_votes');
      const q = query(votesRef, where('caseId', '==', caseId));
      const snapshot = await getDocs(q);

      let totalVotes = 0;
      let guiltyCount = 0;
      let sentenceSum = 0;
      let sentenceCount = 0;
      const distribution = {};

      SENTENCE_OPTIONS.forEach((opt) => {
        distribution[opt.label] = 0;
      });

      snapshot.forEach((doc) => {
        const data = doc.data();
        totalVotes++;
        if (data.verdict === 'guilty') {
          guiltyCount++;
          if (data.sentence != null) {
            const opt = SENTENCE_OPTIONS.find((o) => o.value === data.sentence);
            if (opt) distribution[opt.label] = (distribution[opt.label] || 0) + 1;
            if (data.sentence < 999) {
              sentenceSum += data.sentence;
              sentenceCount++;
            }
          }
        }
      });

      setStats({
        totalVotes,
        guiltyPercent: totalVotes > 0 ? ((guiltyCount / totalVotes) * 100).toFixed(1) : 0,
        avgSentence: sentenceCount > 0 ? (sentenceSum / sentenceCount).toFixed(1) : 0,
        distribution,
      });
    } catch (error) {
      // silently handle
    }
  };

  const getShareText = () => {
    if (!selectedCase || !verdict) return '';
    const sentenceLabel =
      verdict === 'guilty'
        ? SENTENCE_OPTIONS.find((o) => o.value === sentence)?.label || ''
        : '무죄';
    return `나는 참심원으로 ${selectedCase.name}에게 "${sentenceLabel}"을 선고했습니다.\n시민 ${stats?.totalVotes || 0}명 중 ${stats?.guiltyPercent || 0}%가 유죄를 판단했습니다.\n\n시민법관이 직업법관과 함께하는 참심제, 당신도 체험해보세요!\n#참심제 #시민법정 #사법개혁`;
  };

  const getSentenceLabel = (val) => {
    const opt = SENTENCE_OPTIONS.find((o) => o.value === val);
    return opt ? opt.label : '';
  };

  // ─────────────────────────────────────────────
  // STEP 1: Intro
  // ─────────────────────────────────────────────
  const renderIntro = () => (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 border-2 border-white rounded-full" />
          <div className="absolute bottom-20 right-20 w-60 h-60 border-2 border-white rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-20 h-20 border border-white rounded-full" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
          <div className="text-6xl sm:text-7xl mb-6 animate-bounce">
            <span role="img" aria-label="scales">&#9878;&#65039;</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight">
            당신이 시민법관 참심원입니다
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            독일에서는 시민법관 2명이 직업법관 1명과 함께,
            <br className="hidden sm:block" />
            핀란드에서는 시민법관 3명이 직업법관 1명과 함께 재판합니다.
            <br className="hidden sm:block" />
            <strong className="text-white">이제 당신이 시민법관 참심원이 되어 판결을 내려보세요.</strong>
          </p>

          <button
            onClick={() => goToStep(2)}
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold text-lg px-8 py-4 rounded-full shadow-2xl hover:bg-blue-50 hover:scale-105 transition-all duration-300"
          >
            시뮬레이션 시작하기
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="max-w-5xl mx-auto px-4 -mt-10 relative z-10 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-gray-800 mb-2">참심제란?</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              일반 시민법관이 직업법관과 함께 재판부를 구성하여 유·무죄와 양형을 함께 결정하는 제도입니다.
              독일, 핀란드, 프랑스 등 유럽 선진국에서 시행 중입니다.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-gray-800 mb-2">시민법관이 직업법관과 함께</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              법률 전문가가 아닌 일반 시민법관이 재판에 참여합니다.
              시민법관의 건전한 상식과 직업법관의 법률 전문성이 조화를 이루는 제도입니다.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-gray-800 mb-2">유·무죄와 양형 결정</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              참심원은 유·무죄 판단뿐 아니라 양형(형량)까지 직업법관과 동등한 투표권으로 결정합니다.
              국민참여재판과의 핵심 차이점입니다.
            </p>
          </div>
        </div>
      </div>

      {/* SNS 공유 */}
      <SNSShareBar />
    </div>
  );

  // ─────────────────────────────────────────────
  // STEP 2: Case Selection
  // ─────────────────────────────────────────────
  const renderCaseSelection = () => (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <StepIndicator currentStep={2} />

      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">사건을 선택하세요</h2>
        <p className="text-gray-500">참심원으로 참여할 사건을 선택합니다</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {SIMULATION_CASES.map((c) => (
          <button
            key={c.id}
            onClick={() => selectCase(c)}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 p-6 text-left transition-all duration-300 hover:-translate-y-1 group"
          >
            <div className="flex items-center gap-4 mb-4">
              <img
                src={c.photo}
                alt={c.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-400 transition-colors"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23ddd" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23999" font-size="14">${encodeURIComponent(c.name[0])}</text></svg>`;
                }}
              />
              <div>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{c.name}</h3>
                <p className="text-sm text-gray-500">{c.position}</p>
                <span
                  className={`inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    c.statusColor === 'red'
                      ? 'bg-red-100 text-red-700'
                      : c.statusColor === 'orange'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {c.status}
                </span>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <p className="text-sm font-medium text-gray-700">{c.charges[0].name}</p>
              <p className="text-xs text-gray-400 mt-1">{c.charges[0].law}</p>
            </div>
            <div className="mt-3 flex items-center justify-end text-blue-500 text-sm font-medium group-hover:text-blue-700">
              판결하기
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={() => goToStep(1)}
          className="text-gray-500 hover:text-gray-700 font-medium transition-colors inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          돌아가기
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  // STEP 3: Judge
  // ─────────────────────────────────────────────
  const renderJudge = () => {
    if (!selectedCase) return null;
    const charge = selectedCase.charges[0];
    const canSubmit = verdict && (verdict === 'not_guilty' || sentence !== null);

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <StepIndicator currentStep={3} />

        {/* Case Overview */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <img
              src={selectedCase.photo}
              alt={selectedCase.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23ddd" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23999" font-size="14">${encodeURIComponent(selectedCase.name[0])}</text></svg>`;
              }}
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{selectedCase.name}</h2>
              <p className="text-gray-500">{selectedCase.position}</p>
            </div>
            <span
              className={`sm:ml-auto text-sm font-semibold px-3 py-1 rounded-full ${
                selectedCase.statusColor === 'red'
                  ? 'bg-red-100 text-red-700'
                  : selectedCase.statusColor === 'orange'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {selectedCase.status}
            </span>
          </div>

          {/* Charge Info */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-700 font-bold text-lg">{charge.name}</span>
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">{charge.law}</span>
            </div>
            <p className="text-gray-700 text-sm">{charge.description}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-600">
              <span>양형 범위: <strong>{charge.sentencingRange.min} ~ {charge.sentencingRange.max}</strong></span>
              {charge.prosecutionRequest !== '재판 진행 중' && (
                <span>검찰 구형: <strong className="text-red-600">{charge.prosecutionRequest}</strong></span>
              )}
              {charge.actualVerdict !== '재판 진행 중' && (
                <span>실제 판결: <strong className="text-blue-600">{charge.actualVerdict}</strong></span>
              )}
            </div>
          </div>

          {/* Key Facts */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              주요 사실관계
            </h3>
            <ul className="space-y-2">
              {selectedCase.keyFacts.map((fact, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-5 h-5 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium mt-0.5">
                    {idx + 1}
                  </span>
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Verdict Section */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">유·무죄 판단</h3>
          <p className="text-sm text-gray-500 mb-6">참심원으로서 유·무죄를 판단해주세요</p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setVerdict('guilty');
                if (sentence === null) setSentence(null);
              }}
              className={`py-6 rounded-xl text-lg font-bold transition-all duration-300 border-2 ${
                verdict === 'guilty'
                  ? 'bg-red-600 text-white border-red-600 shadow-lg scale-[1.02]'
                  : 'bg-white text-red-600 border-red-200 hover:border-red-400 hover:bg-red-50'
              }`}
            >
              <div className="text-3xl mb-1">
                <span role="img" aria-label="guilty">&#10060;</span>
              </div>
              유죄
            </button>
            <button
              onClick={() => {
                setVerdict('not_guilty');
                setSentence(null);
              }}
              className={`py-6 rounded-xl text-lg font-bold transition-all duration-300 border-2 ${
                verdict === 'not_guilty'
                  ? 'bg-green-600 text-white border-green-600 shadow-lg scale-[1.02]'
                  : 'bg-white text-green-600 border-green-200 hover:border-green-400 hover:bg-green-50'
              }`}
            >
              <div className="text-3xl mb-1">
                <span role="img" aria-label="not guilty">&#9898;</span>
              </div>
              무죄
            </button>
          </div>
        </div>

        {/* Sentencing Section (only if guilty) */}
        {verdict === 'guilty' && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">양형 선택</h3>
            <p className="text-sm text-gray-500 mb-6">적절한 형량을 선택해주세요</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {SENTENCE_OPTIONS.filter((opt) => opt.value > 0).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSentence(opt.value)}
                  className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${
                    sentence === opt.value
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.03]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reasons Section */}
        {verdict && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">판단 사유</h3>
            <p className="text-sm text-gray-500 mb-6">판단에 영향을 준 요소를 선택해주세요 (복수 선택 가능)</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VERDICT_REASONS.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => toggleReason(reason.id)}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    reasons.includes(reason.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      reasons.includes(reason.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}
                  >
                    {reasons.includes(reason.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{reason.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{reason.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submit & Back buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => {
              goToStep(2);
              setVerdict(null);
              setSentence(null);
              setReasons([]);
            }}
            className="text-gray-500 hover:text-gray-700 font-medium transition-colors inline-flex items-center gap-1 order-2 sm:order-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            다른 사건 선택
          </button>

          <button
            onClick={submitVote}
            disabled={!canSubmit || loading}
            className={`flex-1 sm:flex-none order-1 sm:order-2 w-full sm:w-auto py-4 px-10 rounded-xl text-lg font-bold transition-all duration-300 ${
              canSubmit && !loading
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                제출 중...
              </span>
            ) : (
              '판결 제출하기'
            )}
          </button>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────
  // STEP 4: Results
  // ─────────────────────────────────────────────
  const renderResults = () => {
    if (!selectedCase || !stats) return null;

    const charge = selectedCase.charges[0];
    const mySentenceLabel = verdict === 'guilty' ? getSentenceLabel(sentence) : '무죄';
    const maxDistributionCount = Math.max(...Object.values(stats.distribution), 1);

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <StepIndicator currentStep={4} />

        {/* My Verdict Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl" role="img" aria-label="gavel">&#9878;&#65039;</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">나의 판결</h2>
              <p className="text-blue-200 text-sm">{selectedCase.name} | {charge.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-blue-200 text-xs mb-1">유·무죄</p>
              <p className="text-2xl font-bold">{verdict === 'guilty' ? '유죄' : '무죄'}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-blue-200 text-xs mb-1">양형</p>
              <p className="text-2xl font-bold">{mySentenceLabel}</p>
            </div>
          </div>

          {reasons.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {reasons.map((rId) => {
                const r = VERDICT_REASONS.find((vr) => vr.id === rId);
                return r ? (
                  <span key={rId} className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                    {r.label}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">판결 비교</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">항목</th>
                  <th className="text-center py-3 px-2 text-blue-600 font-bold">나의 판단</th>
                  <th className="text-center py-3 px-2 text-purple-600 font-bold">시민 평균</th>
                  <th className="text-center py-3 px-2 text-gray-700 font-bold">검찰 / 법원</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-2 text-gray-600 font-medium">유·무죄</td>
                  <td className="py-4 px-2 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${verdict === 'guilty' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {verdict === 'guilty' ? '유죄' : '무죄'}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                      유죄 {stats.guiltyPercent}%
                    </span>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                      {charge.prosecutionRequest}
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-2 text-gray-600 font-medium">양형</td>
                  <td className="py-4 px-2 text-center font-bold text-blue-700">{mySentenceLabel}</td>
                  <td className="py-4 px-2 text-center font-bold text-purple-700">
                    {Number(stats.avgSentence) > 0 ? `평균 ${stats.avgSentence}년` : '-'}
                  </td>
                  <td className="py-4 px-2 text-center">
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-gray-500">구형:</span>{' '}
                        <span className="font-bold text-red-600">{selectedCase.summary.prosecutionTotal}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">판결:</span>{' '}
                        <span className="font-bold text-blue-600">{selectedCase.summary.verdictTotal}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            시민 참심원 통계
            <span className="text-sm font-normal text-gray-500 ml-2">총 {stats.totalVotes}명 참여</span>
          </h3>

          {/* Guilty Percentage Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">유죄 비율</span>
              <span className="text-sm font-bold text-blue-600">{stats.guiltyPercent}%</span>
            </div>
            <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                style={{ width: `${Math.max(stats.guiltyPercent, 2)}%` }}
              >
                {Number(stats.guiltyPercent) > 15 && (
                  <span className="text-xs text-white font-bold">{stats.guiltyPercent}%</span>
                )}
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>무죄 {(100 - Number(stats.guiltyPercent)).toFixed(1)}%</span>
              <span>유죄 {stats.guiltyPercent}%</span>
            </div>
          </div>

          {/* Sentence Distribution */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-4">양형 분포</h4>
            <div className="space-y-3">
              {SENTENCE_OPTIONS.filter((opt) => opt.value > 0).map((opt) => {
                const count = stats.distribution[opt.label] || 0;
                const pct = stats.totalVotes > 0 ? ((count / stats.totalVotes) * 100).toFixed(1) : 0;
                const barWidth = maxDistributionCount > 0 ? ((count / maxDistributionCount) * 100) : 0;

                return (
                  <div key={opt.value} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-20 text-right flex-shrink-0 font-medium">{opt.label}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          sentence === opt.value ? 'bg-blue-600' : 'bg-blue-300'
                        }`}
                        style={{ width: `${Math.max(barWidth, count > 0 ? 3 : 0)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-16 flex-shrink-0">
                      {count}명 ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 참심제 Meaning Section */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6 sm:p-8 mb-6">
          <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center gap-2">
            <span role="img" aria-label="lightbulb">&#128161;</span>
            만약 참심제가 도입되었다면?
          </h3>
          <div className="space-y-4 text-sm text-amber-900 leading-relaxed">
            <p>
              현재 대한민국의 <strong>국민참여재판</strong>은 배심원의 평결이 법적 구속력이 없는
              <strong> '권고적 효력'</strong>에 불과합니다. 판사가 배심원의 의견을 무시할 수 있어
              시민 참여의 실질적 의미가 퇴색됩니다.
            </p>
            <p>
              <strong>참심제</strong>가 도입되었다면, 시민법관 참심원이 직업법관과 <strong>동등한 투표권</strong>을 가지고
              유·무죄와 양형을 결정합니다. 당신이 방금 내린 판결이 실제 재판 결과에
              직접 반영되는 것입니다.
            </p>
            <div className="bg-white/60 rounded-xl p-4 mt-4">
              <p className="font-bold text-amber-800 mb-2">참심제 도입 시 기대 효과</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">&#10003;</span>
                  사법부에 대한 국민 신뢰 회복
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">&#10003;</span>
                  시민 상식의 재판 반영으로 판결의 정당성 강화
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">&#10003;</span>
                  밀실 재판 방지 및 사법 투명성 제고
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">&#10003;</span>
                  권력형 범죄에 대한 국민 감시 기능 강화
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* SNS Share */}
        <div className="mb-6">
          <SNSShareBar />
        </div>

        {/* Action Button */}
        <div className="text-center">
          <button
            onClick={() => {
              setSelectedCase(null);
              setVerdict(null);
              setSentence(null);
              setReasons([]);
              setStats(null);
              setHasVoted(false);
              goToStep(2);
            }}
            className="inline-flex items-center gap-2 bg-white border-2 border-blue-600 text-blue-600 font-bold text-lg px-8 py-4 rounded-full shadow-md hover:bg-blue-50 hover:scale-[1.02] transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            다른 사건 체험하기
          </button>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────
  // Main Render
  // ─────────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen">
      <SEOHead
        title="참심제 시뮬레이션"
        description="시민법관이 직업법관과 함께하는 참심제를 직접 체험해보세요. 내란 사건의 참심원이 되어 유·무죄와 양형을 결정하는 시뮬레이션입니다."
        path="/simulation"
        image="/og-simulation.png"
      />
      <Header />

      <main className="pt-20">
        {step === 1 && renderIntro()}
        {step === 2 && renderCaseSelection()}
        {step === 3 && renderJudge()}
        {step === 4 && renderResults()}
      </main>
    </div>
  );
}
