import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import SEOHead from '../components/SEOHead';
import { JUDGES_DATA } from '../data/judges';
import SNSShareBar from '../components/SNSShareBar';

// 카테고리 정의
const CATEGORIES = [
    { id: 'constitutional', name: '헌법재판소', icon: '⚖️' },
    { id: 'supreme', name: '대법원', icon: '🏛️' },
    { id: 'insurrection', name: '내란전담재판부', icon: '🔒' },
    { id: 'warrant', name: '영장전담판사', icon: '📋' }
];

const CATEGORY_MAP = {
    '헌법재판소': 'constitutional',
    '대법원': 'supreme',
    '내란전담재판부': 'insurrection',
    '영장전담판사': 'warrant'
};

export default function JudgeEvaluation() {
    const [searchParams] = useSearchParams();
    const categoryFromUrl = searchParams.get('category');
    const [judges] = useState(JUDGES_DATA);
    const [selectedCategory, setSelectedCategory] = useState(
        categoryFromUrl?.startsWith('내란전담재판부') ? '내란전담재판부' : (categoryFromUrl || '헌법재판소')
    );
    const [judgeScores, setJudgeScores] = useState({});

    // Firestore에서 sentencingData 로드 → 판사별 동적 점수 집계
    useEffect(() => {
        const loadDynamicScores = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'sentencingData'));
                const scoreMap = {};
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const judgeName = data.judgeHistory?.judgeName;
                    const integrity = data.claudePrediction?.judicialIntegrity?.integrityScore;
                    if (judgeName && integrity) {
                        if (!scoreMap[judgeName]) {
                            scoreMap[judgeName] = { scores: [], defendantCount: 0 };
                        }
                        scoreMap[judgeName].scores.push(integrity);
                        scoreMap[judgeName].defendantCount += 1;
                    }
                });
                // 판사별 평균 점수 계산
                const avgMap = {};
                Object.entries(scoreMap).forEach(([name, { scores, defendantCount }]) => {
                    avgMap[name] = {
                        prosecution: Math.round(scores.reduce((s, v) => s + (v.prosecution || 0), 0) / scores.length),
                        judiciary: Math.round(scores.reduce((s, v) => s + (v.judiciary || 0), 0) / scores.length),
                        overall: Math.round(scores.reduce((s, v) => s + (v.overall || 0), 0) / scores.length),
                        defendantCount,
                    };
                });
                setJudgeScores(avgMap);
            } catch (err) {
                console.error('동적 점수 로드 에러:', err);
            }
        };
        loadDynamicScores();
    }, []);

    // 필터링된 판사 목록
    const filteredJudges = selectedCategory
        ? judges.filter(j => selectedCategory === '내란전담재판부'
            ? j.category.startsWith('내란전담재판부')
            : j.category === selectedCategory)
        : judges;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900">
            <SEOHead title="AI의 판사평가" description="AI가 평가하는 내란사건 재판부별 사법정의 평가 - 헌법재판소, 대법원, 내란전담재판부" path="/judge-evaluation" image="/ai의판사평가.png" />
            <Header />
            <div className="pt-20 pb-12">
                <div className="container mx-auto px-4 max-w-7xl">
                    {/* 헤더 */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            ⚖️ AI의 판사평가
                        </h1>
                        <p className="text-gray-300 text-lg mb-6">
                            AI가 공개된 판례·보도를 기반으로 판사들의 사법 정의를 분석합니다
                        </p>

                        {/* 카테고리 필터 탭 */}
                        <div className="flex flex-wrap justify-center gap-2 mb-8">
                            {CATEGORIES.map(cat => {
                                const count = judges.filter(j => cat.name === '내란전담재판부'
                                    ? j.category.startsWith('내란전담재판부')
                                    : j.category === cat.name).length;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.name)}
                                        className={`px-4 py-2 rounded-full font-medium transition ${
                                            selectedCategory === cat.name
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        {cat.icon} {cat.name} ({count})
                                    </button>
                                );
                            })}
                        </div>

                        {/* 면책 문구 */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-3xl mx-auto">
                            <p className="text-blue-800 text-sm">
                                📊 <strong>AI 평가 기준 안내:</strong> 본 평가는 AI가 각 판사의 공개된 판결문, 언론 보도, 법원 공식 기록 등
                                객관적 자료를 기반으로 분석한 결과입니다. 양형 일관성, 판례 준수율, 심리 충실도 등의
                                정량적 지표와 주요 판결 이력을 종합하여 평가하였습니다.
                            </p>
                        </div>
                    </div>

                    {/* 선택된 카테고리 헤더 */}
                    {selectedCategory && selectedCategory !== '내란전담재판부' && (
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                            {CATEGORIES.find(c => c.name === selectedCategory)?.icon}
                            {selectedCategory}
                        </h2>
                    )}

                    {/* 내란전담재판부: 1심/항소심 구분 */}
                    {selectedCategory === '내란전담재판부' && (
                        <>
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                🔒 내란전담재판부 (1심)
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                                {filteredJudges.filter(j => j.category === '내란전담재판부').map((judge) => (
                                    <Link key={judge.id} to={`/judge/${judge.id}`} className="block">
                                        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                                    {judge.photo ? (
                                                        <img src={judge.photo} alt={judge.name} className="w-full h-full object-cover"
                                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                                    ) : null}
                                                    <span className={`text-3xl font-bold text-white ${judge.photo ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                                                        {judge.name[0]}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-xl text-gray-900">{judge.name}</h3>
                                                    <p className="text-gray-500 text-sm">{judge.court}</p>
                                                    {judge.justiceEvaluation && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                                judge.justiceEvaluation.overallScore >= 70 ? 'bg-green-100 text-green-700' :
                                                                judge.justiceEvaluation.overallScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                                AI 종합 {judge.justiceEvaluation.overallScore}점
                                                            </span>
                                                        </div>
                                                    )}
                                                    {judgeScores[judge.name] && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                                                judgeScores[judge.name].overall >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                judgeScores[judge.name].overall >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                'bg-rose-50 text-rose-700 border-rose-200'
                                                            }`}>
                                                                🔥 동적평가 {judgeScores[judge.name].overall}점
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                (피고인 {judgeScores[judge.name].defendantCount}명)
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-sm text-gray-600"><span className="font-medium">직책:</span> {judge.position}</p>
                                                {judge.cases && judge.cases.length > 0 && (
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">담당:</span>
                                                        {judge.cases.length === 1 ? (
                                                            <span> {judge.cases[0].text || judge.cases[0]}</span>
                                                        ) : (
                                                            <ul className="ml-4 mt-1 space-y-1">
                                                                {judge.cases.map((caseItem, idx) => (
                                                                    <li key={idx}>• {caseItem.text || caseItem}</li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-4 text-blue-600 text-sm font-medium flex items-center gap-1">
                                                상세보기
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                🔒 내란전담재판부 (항소심)
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                                {filteredJudges.filter(j => j.category === '내란전담재판부(항소심)').map((judge) => (
                                    <Link key={judge.id} to={`/judge/${judge.id}`} className="block">
                                        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                                    {judge.photo ? (
                                                        <img src={judge.photo} alt={judge.name} className="w-full h-full object-cover"
                                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                                    ) : null}
                                                    <span className={`text-3xl font-bold text-white ${judge.photo ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                                                        {judge.name[0]}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-xl text-gray-900">{judge.name}</h3>
                                                    <p className="text-gray-500 text-sm">{judge.court}</p>
                                                    {judge.justiceEvaluation && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                                judge.justiceEvaluation.overallScore >= 70 ? 'bg-green-100 text-green-700' :
                                                                judge.justiceEvaluation.overallScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                                AI 종합 {judge.justiceEvaluation.overallScore}점
                                                            </span>
                                                        </div>
                                                    )}
                                                    {judgeScores[judge.name] && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                                                judgeScores[judge.name].overall >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                judgeScores[judge.name].overall >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                'bg-rose-50 text-rose-700 border-rose-200'
                                                            }`}>
                                                                🔥 동적평가 {judgeScores[judge.name].overall}점
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                (피고인 {judgeScores[judge.name].defendantCount}명)
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-sm text-gray-600"><span className="font-medium">직책:</span> {judge.position}</p>
                                                {judge.cases && judge.cases.length > 0 && (
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">담당:</span>
                                                        {judge.cases.length === 1 ? (
                                                            <span> {judge.cases[0].text || judge.cases[0]}</span>
                                                        ) : (
                                                            <ul className="ml-4 mt-1 space-y-1">
                                                                {judge.cases.map((caseItem, idx) => (
                                                                    <li key={idx}>• {caseItem.text || caseItem}</li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-4 text-blue-600 text-sm font-medium flex items-center gap-1">
                                                상세보기
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}

                    {/* 판사 카드 그리드 (내란전담재판부 외) */}
                    {selectedCategory !== '내란전담재판부' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredJudges.map((judge) => (
                            <Link
                                key={judge.id}
                                to={`/judge/${judge.id}`}
                                className="block"
                            >
                                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                            {judge.photo ? (
                                                <img
                                                    src={judge.photo}
                                                    alt={judge.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                />
                                            ) : null}
                                            <span className={`text-3xl font-bold text-white ${judge.photo ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                                                {judge.name[0]}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-xl text-gray-900">{judge.name}</h3>
                                            <p className="text-gray-500 text-sm">{judge.court}</p>
                                            {judge.justiceEvaluation && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                        judge.justiceEvaluation.overallScore >= 70 ? 'bg-green-100 text-green-700' :
                                                        judge.justiceEvaluation.overallScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        AI 종합 {judge.justiceEvaluation.overallScore}점
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">직책:</span> {judge.position}
                                        </p>
                                        {judge.cases && judge.cases.length > 0 && (
                                            <div className="text-sm text-gray-600">
                                                <span className="font-medium">담당:</span>
                                                {judge.cases.length === 1 ? (
                                                    <span> {judge.cases[0].text || judge.cases[0]}</span>
                                                ) : (
                                                    <ul className="ml-4 mt-1 space-y-1">
                                                        {judge.cases.map((caseItem, idx) => (
                                                            <li key={idx}>• {caseItem.text || caseItem}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        )}

                                    </div>

                                    {/* 호버 효과 */}
                                    <div className="mt-4 text-blue-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                        상세보기
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>}

                    {/* 하단 안내 */}
                    <div className="mt-12 text-center">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-3xl mx-auto">
                            <h3 className="text-lg font-bold text-blue-900 mb-2">
                                🗳️ 시민법관 참심제를 통한 사법 민주화
                            </h3>
                            <p className="text-blue-800 text-sm">
                                판사의 판결에 대한 시민의 감시와 평가는 건강한 사법 시스템을 위해 필수적입니다.
                                시민법관 참심제는 중대 형사사건에서 시민이 직접 재판에 참여하여
                                판결의 정당성을 높이고 사법 불신을 해소하는 제도입니다.
                            </p>
                            <Link
                                to="/"
                                className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition font-medium"
                            >
                                사법개혁 자세히 보기
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <SNSShareBar />
            <footer className="bg-gray-900 text-gray-400 py-6 px-4">
                <div className="container mx-auto text-center">
                    <p>© 주권자사법개혁추진준비위원회</p>
                    <p className="mt-2 text-sm">문의: siminbupjung@gmail.com</p>
                </div>
            </footer>
        </div>
    );
}
