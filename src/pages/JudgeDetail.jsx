import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import { JUDGES_DATA } from '../data/judges';
import SNSShareBar from '../components/SNSShareBar';

// 인라인 SVG 아이콘 (heroicons 대체)
const ShareIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
    </svg>
);

export default function JudgeDetail() {
    const { name } = useParams();
    const navigate = useNavigate();
    const [judge, setJudge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [relatedNews, setRelatedNews] = useState([]);
    const [newsLoading, setNewsLoading] = useState(false);
    const [defendantAnalyses, setDefendantAnalyses] = useState([]);
    const [defendantLoading, setDefendantLoading] = useState(false);
    const [expandedDefendants, setExpandedDefendants] = useState({});

    const toggleDefendant = (idx) => {
        setExpandedDefendants(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    // 판사 정보 및 관련 뉴스 로드
    useEffect(() => {
        loadJudgeData();
    }, [name]);

    const loadJudgeData = async () => {
        try {
            setLoading(true);

            // 판사 정보 가져오기 (하드코딩 데이터에서)
            const judgeData = JUDGES_DATA.find(j => j.id === name);

            if (judgeData) {
                setJudge(judgeData);
            } else {
                setError('판사 정보를 찾을 수 없습니다.');
                return; // 판사 정보가 없으면 여기서 종료
            }

            // 관련 뉴스 검색 (네이버 API)
            try {
                setNewsLoading(true);
                const newsResponse = await fetch(
                    `https://us-central1-siminbupjung-blog.cloudfunctions.net/searchNaverNews?query=${encodeURIComponent(judgeData.name + ' 판사')}`
                );
                if (newsResponse.ok) {
                    const newsData = await newsResponse.json();
                    setRelatedNews(newsData.items || []);
                }
            } catch (newsErr) {
                console.error('뉴스 검색 에러:', newsErr);
                setRelatedNews([]);
            } finally {
                setNewsLoading(false);
            }
        } catch (err) {
            console.error('데이터 로드 에러:', err);
            setError('데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // Firestore에서 담당 피고인 AI 분석 데이터 로드
    useEffect(() => {
        if (!judge) return;
        const loadDefendantData = async () => {
            try {
                setDefendantLoading(true);
                const snapshot = await getDocs(collection(db, 'sentencingData'));
                const analyses = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.judgeHistory?.judgeName === judge.name ||
                        data.aiPrediction || data.claudePrediction) {
                        // Check if this defendant's judge matches
                        if (data.judgeHistory?.judgeName === judge.name) {
                            analyses.push({
                                name: doc.id,
                                aiPrediction: data.aiPrediction || null,
                                claudePrediction: data.claudePrediction || null,
                                judgeHistory: data.judgeHistory || null,
                            });
                        }
                    }
                });
                setDefendantAnalyses(analyses);
            } catch (err) {
                console.error('피고인 데이터 로드 에러:', err);
            } finally {
                setDefendantLoading(false);
            }
        };
        loadDefendantData();
    }, [judge]);

    const handleShare = () => {
        const url = `https://xn--lg3b0kt4n41f.kr/judge/${name}`;
        const text = `${judge?.name} 판사 평가 페이지`;

        if (navigator.share) {
            navigator.share({ title: text, url });
        } else {
            navigator.clipboard.writeText(url);
            alert('링크가 복사되었습니다.');
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="pt-24 pb-12 min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">로딩 중...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error || !judge) {
        return (
            <>
                <Header />
                <div className="pt-24 pb-12 min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-600 text-lg">{error || '판사 정보를 찾을 수 없습니다.'}</p>
                        <Link to="/sentencing-analysis" className="mt-4 inline-block text-blue-600 hover:underline">
                            돌아가기
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="pt-24 pb-12 min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 max-w-4xl">
                    {/* 뒤로 가기 버튼 */}
                    <button
                        onClick={() => navigate(`/judge-evaluation?category=${encodeURIComponent(judge.category)}`)}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>뒤로 가기</span>
                    </button>

                    {/* 상단: 판사 프로필 */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div className="flex items-start gap-6">
                            {/* 판사 사진 */}
                            <div className="flex-shrink-0">
                                {judge.photo ? (
                                    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-200">
                                        <img
                                            src={judge.photo}
                                            alt={judge.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-40 h-40 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-5xl font-bold">
                                        {judge.name?.charAt(0)}
                                    </div>
                                )}
                            </div>

                            {/* 판사 정보 */}
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <h1 className="text-3xl font-bold text-gray-900">{judge.name}</h1>
                                    <button
                                        onClick={handleShare}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                                    >
                                        <ShareIcon className="w-5 h-5" />
                                        <span className="text-sm">공유</span>
                                    </button>
                                </div>
                                <div className="mb-4">
                                    <p className="text-gray-600 text-lg">{judge.court}</p>
                                    {judge.appointedBy && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                                추천처: {judge.appointedBy}
                                            </span>
                                        </p>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* 중단: 경력 및 담당 사건 */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        {/* 경력 */}
                        {judge.career && judge.career.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-3">경력</h2>
                                <ul className="space-y-2">
                                    {judge.career.map((item, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <span className="text-blue-600 mt-1">•</span>
                                            <span className="text-gray-700">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* 담당 사건 */}
                        {judge.cases && judge.cases.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-3">주요 담당 사건</h2>
                                <ul className="space-y-2">
                                    {judge.cases.map((caseItem, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <span className="text-blue-600 mt-1">•</span>
                                            <span className="text-gray-700">
                                                {caseItem.text || caseItem}
                                                {caseItem.source && (
                                                    <a
                                                        href={caseItem.source.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="ml-2 text-xs text-blue-500 hover:underline"
                                                    >
                                                        [{caseItem.source.name}]
                                                    </a>
                                                )}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* 관련 뉴스 (네이버 검색) */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span>📰</span> 관련 뉴스
                            <span className="text-sm font-normal text-gray-500">(네이버 뉴스 검색)</span>
                        </h2>

                        {newsLoading ? (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-2 text-sm text-gray-500">뉴스 검색 중...</p>
                            </div>
                        ) : relatedNews.length > 0 ? (
                            <ul className="space-y-3">
                                {relatedNews.map((news, index) => (
                                    <li key={index} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                        <a
                                            href={news.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block hover:bg-gray-50 p-2 rounded -m-2"
                                        >
                                            <h3
                                                className="text-blue-600 hover:underline font-medium"
                                                dangerouslySetInnerHTML={{ __html: news.title }}
                                            />
                                            <p
                                                className="text-sm text-gray-600 mt-1 line-clamp-2"
                                                dangerouslySetInnerHTML={{ __html: news.description }}
                                            />
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(news.pubDate).toLocaleDateString('ko-KR')}
                                            </p>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-center py-4">관련 뉴스가 없습니다.</p>
                        )}
                    </div>

                    {/* 사법 정의 평가 (AI 분석) */}
                    {judge.justiceEvaluation ? (
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span>🔍</span> 사법 정의 평가
                                <span className="text-sm font-normal text-gray-500">AI가 공개된 판례·보도를 기반으로 사법 절차의 공정성을 평가한 결과입니다</span>
                            </h2>

                            {/* 점수 카드 */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                {[
                                    { label: '검찰 공정성', score: judge.justiceEvaluation.prosecutionScore },
                                    { label: '재판부 공정성', score: judge.justiceEvaluation.courtScore },
                                    { label: '종합 평가', score: judge.justiceEvaluation.overallScore }
                                ].map((item, idx) => (
                                    <div key={idx} className="text-center p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-600 mb-1">{item.label}</p>
                                        <p className={`text-3xl font-bold ${
                                            item.score >= 70 ? 'text-green-600' :
                                            item.score >= 50 ? 'text-yellow-600' :
                                            'text-red-600'
                                        }`}>
                                            {item.score}<span className="text-sm text-gray-400">/100</span>
                                        </p>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                            <div
                                                className={`h-2 rounded-full ${
                                                    item.score >= 70 ? 'bg-green-500' :
                                                    item.score >= 50 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                                }`}
                                                style={{ width: `${item.score}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 종합 평가 요약 */}
                            <p className="text-gray-700 mb-6 leading-relaxed">
                                {judge.justiceEvaluation.summary}
                            </p>

                            {/* 주요 쟁점 목록 */}
                            {judge.justiceEvaluation.issues && judge.justiceEvaluation.issues.length > 0 && (
                                <div className="space-y-6">
                                    {/* 검찰 문제점 */}
                                    {judge.justiceEvaluation.issues.filter(i => i.category === '검찰').length > 0 && (
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <span>📋</span> 특검·검찰 문제점
                                            </h3>
                                            <div className="space-y-3">
                                                {judge.justiceEvaluation.issues.filter(i => i.category === '검찰').map((issue, idx) => (
                                                    <div key={idx} className="border-l-4 border-red-400 bg-red-50 p-4 rounded-r-lg">
                                                        <p className="font-semibold text-gray-900">● {issue.title}</p>
                                                        <p className="text-sm text-gray-700 mt-1">{issue.description}</p>
                                                        {issue.impact && (
                                                            <p className="text-sm text-red-600 mt-1 font-medium">{issue.impact}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 재판부 문제점 */}
                                    {judge.justiceEvaluation.issues.filter(i => i.category === '재판부').length > 0 && (
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <span>⚖️</span> 재판부 문제점
                                            </h3>
                                            <div className="space-y-3">
                                                {judge.justiceEvaluation.issues.filter(i => i.category === '재판부').map((issue, idx) => (
                                                    <div key={idx} className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded-r-lg">
                                                        <p className="font-semibold text-gray-900">● {issue.title}</p>
                                                        <p className="text-sm text-gray-700 mt-1">{issue.description}</p>
                                                        {issue.impact && (
                                                            <p className="text-sm text-yellow-700 mt-1 font-medium">{issue.impact}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 면책 문구 */}
                            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <p className="text-xs text-gray-500">
                                    ※ 본 평가는 AI가 공개된 판례와 언론 보도를 기반으로 분석한 결과이며, 시민법정의 공식 입장이 아닙니다.
                                    실제 사법 판단의 정당성은 법률 전문가의 판단이 필요합니다.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span>🔍</span> 사법 정의 평가
                            </h2>
                            <p className="text-gray-500 text-center py-8">
                                사법 정의 평가 데이터를 준비 중입니다.
                            </p>
                        </div>
                    )}

                    {/* 담당 사건 AI 종합 분석 */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span>🔍</span> 담당 사건 AI 종합 분석
                            <span className="text-sm font-normal text-gray-500">(양형분석 자동 연동)</span>
                        </h2>

                        {defendantLoading ? (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                                <p className="mt-2 text-sm text-gray-500">피고인 데이터 로딩 중...</p>
                            </div>
                        ) : defendantAnalyses.length > 0 ? (
                            <div className="space-y-6">
                                {/* ── 종합 점수 (피고인별 평균) ── */}
                                {(() => {
                                    const scores = defendantAnalyses
                                        .filter(d => d.claudePrediction?.judicialIntegrity?.integrityScore)
                                        .map(d => d.claudePrediction.judicialIntegrity.integrityScore);
                                    if (scores.length === 0) return null;
                                    const avg = (arr, key) => Math.round(arr.reduce((s, v) => s + (v[key] || 0), 0) / arr.length);
                                    return (
                                        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-5 border border-blue-100">
                                            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                📊 종합 사법정의 점수
                                                <span className="text-xs font-normal text-gray-500">(담당 피고인 {scores.length}명 평균)</span>
                                            </h3>
                                            <div className="grid grid-cols-3 gap-4">
                                                {[
                                                    { label: '검찰 공정성', score: avg(scores, 'prosecution') },
                                                    { label: '재판부 공정성', score: avg(scores, 'judiciary') },
                                                    { label: '종합 평가', score: avg(scores, 'overall') }
                                                ].map((item, i) => (
                                                    <div key={i} className="text-center bg-white rounded-lg p-3 shadow-sm">
                                                        <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                                                        <p className={`text-2xl font-bold ${
                                                            item.score >= 70 ? 'text-green-600' :
                                                            item.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                                                        }`}>
                                                            {item.score}<span className="text-sm font-normal text-gray-400">/100</span>
                                                        </p>
                                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                                            <div
                                                                className={`h-2 rounded-full ${
                                                                    item.score >= 70 ? 'bg-green-500' :
                                                                    item.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}
                                                                style={{ width: `${item.score}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* ── 피고인별 상세 분석 ── */}
                                {defendantAnalyses.map((defendant, idx) => {
                                    const pred = defendant.claudePrediction;
                                    const isExpanded = expandedDefendants[idx];
                                    return (
                                        <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                                            {/* 피고인 헤더 (클릭으로 확장/축소) */}
                                            <div
                                                onClick={() => toggleDefendant(idx)}
                                                className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                        <span className="text-lg font-bold text-indigo-600">{defendant.name[0]}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900">{defendant.name}</h3>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {pred?.judicialIntegrity?.integrityScore && (
                                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                                    pred.judicialIntegrity.integrityScore.overall >= 70 ? 'bg-green-100 text-green-700' :
                                                                    pred.judicialIntegrity.integrityScore.overall >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                    종합 {pred.judicialIntegrity.integrityScore.overall}점
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-gray-500">AI 분석 완료</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        to={`/sentencing-analysis?person=${encodeURIComponent(defendant.name)}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition"
                                                    >
                                                        양형분석 →
                                                    </Link>
                                                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* 확장된 상세 분석 */}
                                            {isExpanded && (
                                                <div className="p-4 space-y-5 border-t border-gray-200">
                                                    {/* AI 양형 예측 기본 정보 */}
                                                    {(() => {
                                                        const p = defendant.aiPrediction || pred;
                                                        if (!p?.predictedSentence) return null;
                                                        return (
                                                            <div className="grid grid-cols-3 gap-3">
                                                                <div className="bg-gray-50 rounded-lg p-2 text-center">
                                                                    <p className="text-xs text-gray-500">예측 범위</p>
                                                                    <p className="text-sm font-bold text-gray-900">{p.predictedSentence.range || '-'}</p>
                                                                </div>
                                                                <div className="bg-indigo-50 rounded-lg p-2 text-center">
                                                                    <p className="text-xs text-gray-500">AI 예측</p>
                                                                    <p className="text-sm font-bold text-indigo-700">{p.predictedSentence.mostLikely || '-'}</p>
                                                                </div>
                                                                <div className="bg-gray-50 rounded-lg p-2 text-center">
                                                                    <p className="text-xs text-gray-500">신뢰도</p>
                                                                    <p className={`text-sm font-bold ${
                                                                        p.predictedSentence.confidence === 'high' ? 'text-green-600' :
                                                                        p.predictedSentence.confidence === 'medium' ? 'text-yellow-600' : 'text-red-600'
                                                                    }`}>
                                                                        {p.predictedSentence.confidence === 'high' ? '높음' :
                                                                         p.predictedSentence.confidence === 'medium' ? '보통' : '낮음'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* ⚖️ 사법 정의 평가 */}
                                                    {pred?.judicialIntegrity && (
                                                        <div className="rounded-xl border border-red-100 overflow-hidden">
                                                            <div className="p-3 bg-red-50 border-b border-red-100">
                                                                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                                    🔍 사법 정의 평가
                                                                    {pred.judicialIntegrity.evidenceSummary && (
                                                                        <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-normal">
                                                                            근거자료 {pred.judicialIntegrity.evidenceSummary.totalCount}건
                                                                        </span>
                                                                    )}
                                                                </h4>
                                                                <p className="text-xs text-gray-500 mt-0.5">AI가 판례·보도·검색트렌드·여론조사 등 객관적 자료를 분석한 결과</p>
                                                            </div>
                                                            <div className="p-3 space-y-4">
                                                                {/* 공정성 점수 */}
                                                                {pred.judicialIntegrity.integrityScore && (
                                                                    <div className="grid grid-cols-3 gap-3">
                                                                        {[
                                                                            { label: '검찰 공정성', score: pred.judicialIntegrity.integrityScore.prosecution },
                                                                            { label: '재판부 공정성', score: pred.judicialIntegrity.integrityScore.judiciary },
                                                                            { label: '종합 평가', score: pred.judicialIntegrity.integrityScore.overall }
                                                                        ].map((item, i) => (
                                                                            <div key={i} className="bg-gray-50 rounded-lg p-2 text-center">
                                                                                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                                                                                <p className={`text-xl font-bold ${
                                                                                    item.score >= 70 ? 'text-green-600' :
                                                                                    item.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                                                                                }`}>
                                                                                    {item.score}<span className="text-xs font-normal text-gray-400">/100</span>
                                                                                </p>
                                                                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                                                                    <div
                                                                                        className={`h-1.5 rounded-full ${
                                                                                            item.score >= 70 ? 'bg-green-500' :
                                                                                            item.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                                                        }`}
                                                                                        style={{ width: `${item.score}%` }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {pred.judicialIntegrity.integrityScore?.reasoning && (
                                                                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">
                                                                        {pred.judicialIntegrity.integrityScore.reasoning}
                                                                    </p>
                                                                )}

                                                                {/* 특검·검찰 문제점 */}
                                                                {pred.judicialIntegrity.prosecutorialIssues?.length > 0 && (
                                                                    <div>
                                                                        <h5 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1">
                                                                            📋 특검·검찰 문제점
                                                                        </h5>
                                                                        <div className="space-y-2">
                                                                            {pred.judicialIntegrity.prosecutorialIssues.map((issue, i) => (
                                                                                <div key={i} className={`p-2.5 rounded-lg border-l-4 ${
                                                                                    issue.severity === 'critical' ? 'bg-red-50 border-red-500' :
                                                                                    issue.severity === 'major' ? 'bg-yellow-50 border-yellow-500' :
                                                                                    'bg-gray-50 border-gray-300'
                                                                                }`}>
                                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                                        <span className={`w-2 h-2 rounded-full ${
                                                                                            issue.severity === 'critical' ? 'bg-red-500' :
                                                                                            issue.severity === 'major' ? 'bg-yellow-500' : 'bg-gray-400'
                                                                                        }`} />
                                                                                        <span className="text-xs font-bold text-gray-900">{issue.title}</span>
                                                                                    </div>
                                                                                    <p className="text-xs text-gray-600 ml-4">{issue.description}</p>
                                                                                    {issue.impact && <p className="text-xs text-red-600 ml-4 mt-0.5 font-medium">→ {issue.impact}</p>}
                                                                                    {issue.sources?.length > 0 && (
                                                                                        <div className="mt-1.5 flex flex-wrap gap-1 ml-4">
                                                                                            {issue.sources.map((src, si) => (
                                                                                                <a key={si} href={src.url} target="_blank" rel="noopener noreferrer"
                                                                                                   className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full hover:bg-blue-100 border border-blue-200"
                                                                                                   title={`${src.title} (${src.date || ''})`}>
                                                                                                    <span>{src.type === 'legal_precedent' ? '📜' : src.type === 'news_article' ? '📰' : src.type === 'opinion_poll' ? '📋' : '📊'}</span>
                                                                                                    <span className="truncate max-w-[120px]">{src.title}</span>
                                                                                                </a>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* 재판부 문제점 */}
                                                                {pred.judicialIntegrity.judicialIssues?.length > 0 && (
                                                                    <div>
                                                                        <h5 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1">
                                                                            ⚖️ 재판부 문제점
                                                                        </h5>
                                                                        <div className="space-y-2">
                                                                            {pred.judicialIntegrity.judicialIssues.map((issue, i) => (
                                                                                <div key={i} className={`p-2.5 rounded-lg border-l-4 ${
                                                                                    issue.severity === 'critical' ? 'bg-red-50 border-red-500' :
                                                                                    issue.severity === 'major' ? 'bg-yellow-50 border-yellow-500' :
                                                                                    'bg-gray-50 border-gray-300'
                                                                                }`}>
                                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                                        <span className={`w-2 h-2 rounded-full ${
                                                                                            issue.severity === 'critical' ? 'bg-red-500' :
                                                                                            issue.severity === 'major' ? 'bg-yellow-500' : 'bg-gray-400'
                                                                                        }`} />
                                                                                        <span className="text-xs font-bold text-gray-900">{issue.title}</span>
                                                                                    </div>
                                                                                    <p className="text-xs text-gray-600 ml-4">{issue.description}</p>
                                                                                    {issue.impact && <p className="text-xs text-red-600 ml-4 mt-0.5 font-medium">→ {issue.impact}</p>}
                                                                                    {issue.sources?.length > 0 && (
                                                                                        <div className="mt-1.5 flex flex-wrap gap-1 ml-4">
                                                                                            {issue.sources.map((src, si) => (
                                                                                                <a key={si} href={src.url} target="_blank" rel="noopener noreferrer"
                                                                                                   className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full hover:bg-blue-100 border border-blue-200"
                                                                                                   title={`${src.title} (${src.date || ''})`}>
                                                                                                    <span>{src.type === 'legal_precedent' ? '📜' : src.type === 'news_article' ? '📰' : src.type === 'opinion_poll' ? '📋' : '📊'}</span>
                                                                                                    <span className="truncate max-w-[120px]">{src.title}</span>
                                                                                                </a>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* 미처리·누락 증거 */}
                                                                {pred.judicialIntegrity.omittedEvidence?.length > 0 && (
                                                                    <div>
                                                                        <h5 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1">
                                                                            📎 미처리·누락 증거
                                                                        </h5>
                                                                        <div className="space-y-2">
                                                                            {pred.judicialIntegrity.omittedEvidence.map((ev, i) => (
                                                                                <div key={i} className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <span className="text-xs font-medium text-gray-900">{ev.title}</span>
                                                                                        {ev.status && (
                                                                                            <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full">{ev.status}</span>
                                                                                        )}
                                                                                    </div>
                                                                                    <p className="text-xs text-gray-600 mt-1">{ev.description}</p>
                                                                                    {ev.sources?.length > 0 && (
                                                                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                                                                            {ev.sources.map((src, si) => (
                                                                                                <a key={si} href={src.url} target="_blank" rel="noopener noreferrer"
                                                                                                   className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full hover:bg-blue-100 border border-blue-200"
                                                                                                   title={`${src.title} (${src.date || ''})`}>
                                                                                                    <span>{src.type === 'legal_precedent' ? '📜' : src.type === 'news_article' ? '📰' : '📊'}</span>
                                                                                                    <span className="truncate max-w-[120px]">{src.title}</span>
                                                                                                </a>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 📚 평가 근거 자료 */}
                                                    {pred?.judicialIntegrity?.evidenceSummary && (
                                                        <div className="rounded-xl border border-blue-100 overflow-hidden">
                                                            <div className="p-3 bg-blue-50 border-b border-blue-100">
                                                                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                                    📚 평가 근거 자료
                                                                </h4>
                                                                <p className="text-xs text-gray-500 mt-0.5">
                                                                    {pred.judicialIntegrity.evidenceSummary.totalCount}건의 객관적 자료를 분석
                                                                </p>
                                                            </div>
                                                            <div className="p-3 space-y-3">
                                                                {/* 증거 유형별 건수 */}
                                                                <div className="grid grid-cols-4 gap-2">
                                                                    {[
                                                                        { label: '판례', count: pred.judicialIntegrity.evidenceSummary.byType?.legal_precedent, icon: '📜', color: 'bg-amber-50 text-amber-700' },
                                                                        { label: '뉴스', count: pred.judicialIntegrity.evidenceSummary.byType?.news_article, icon: '📰', color: 'bg-sky-50 text-sky-700' },
                                                                        { label: '트렌드', count: pred.judicialIntegrity.evidenceSummary.byType?.search_trend, icon: '📊', color: 'bg-green-50 text-green-700' },
                                                                        { label: '여론', count: pred.judicialIntegrity.evidenceSummary.byType?.opinion_poll, icon: '📋', color: 'bg-purple-50 text-purple-700' }
                                                                    ].map((item, i) => (
                                                                        <div key={i} className={`text-center p-2 rounded-lg ${item.color}`}>
                                                                            <p className="text-base mb-0.5">{item.icon}</p>
                                                                            <p className="text-lg font-bold">{item.count || 0}</p>
                                                                            <p className="text-xs mt-0.5">{item.label}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {/* 여론 동향 분석 */}
                                                                {pred.judicialIntegrity.trendInsight && (
                                                                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 border border-green-100">
                                                                        <h5 className="text-xs font-bold text-gray-800 mb-1 flex items-center gap-1">
                                                                            📈 여론 동향 분석
                                                                        </h5>
                                                                        <p className="text-xs text-gray-600 leading-relaxed">{pred.judicialIntegrity.trendInsight}</p>
                                                                    </div>
                                                                )}

                                                                {/* 평가 방법론 */}
                                                                {pred.judicialIntegrity.integrityScore?.methodology && (
                                                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                                        <h5 className="text-xs font-bold text-gray-800 mb-1 flex items-center gap-1">
                                                                            🔬 평가 방법론
                                                                        </h5>
                                                                        <p className="text-xs text-gray-600 leading-relaxed">{pred.judicialIntegrity.integrityScore.methodology}</p>
                                                                    </div>
                                                                )}

                                                                {/* 핵심 발견사항 */}
                                                                {pred.judicialIntegrity.evidenceSummary.keyFindings?.length > 0 && (
                                                                    <div>
                                                                        <h5 className="text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1">
                                                                            💡 핵심 발견사항
                                                                        </h5>
                                                                        <ul className="space-y-1">
                                                                            {pred.judicialIntegrity.evidenceSummary.keyFindings.map((finding, i) => (
                                                                                <li key={i} className="text-xs text-gray-600 flex items-start gap-2 bg-yellow-50 rounded-lg px-3 py-1.5 border border-yellow-100">
                                                                                    <span className="text-yellow-500 font-bold mt-0.5">•</span>
                                                                                    <span>{finding}</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 🤖 AI 판사 vs 직업 판사 비교 */}
                                                    {pred?.aiJudgeComparison && (
                                                        <div className="rounded-xl border border-indigo-100 overflow-hidden">
                                                            <div className="p-3 bg-indigo-50 border-b border-indigo-100">
                                                                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                                    🤖 AI 판사 vs 직업 판사 비교
                                                                </h4>
                                                                <p className="text-xs text-gray-500 mt-0.5">AI 사법 시스템이 적용되었다면 달라졌을 판단</p>
                                                            </div>
                                                            <div className="p-3 space-y-3">
                                                                {/* AI vs 인간 예측 결과 */}
                                                                {pred.aiJudgeComparison.aiPredictedOutcome && (
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div className="bg-indigo-50 rounded-lg p-3 text-center">
                                                                            <p className="text-xs text-indigo-600 mb-1">🤖 AI 판사 예측</p>
                                                                            <p className="text-sm font-bold text-indigo-900">{pred.aiJudgeComparison.aiPredictedOutcome}</p>
                                                                        </div>
                                                                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                                            <p className="text-xs text-gray-500 mb-1">👨‍⚖️ 직업 판사</p>
                                                                            <p className="text-sm font-bold text-gray-900">{pred?.predictedSentence?.mostLikely || '재판 진행 중'}</p>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* 비교 테이블 */}
                                                                {pred.aiJudgeComparison.differences?.length > 0 && (
                                                                    <div className="overflow-x-auto">
                                                                        <table className="w-full text-xs">
                                                                            <thead>
                                                                                <tr className="bg-gray-100">
                                                                                    <th className="p-2 text-left text-gray-700 font-bold rounded-tl-lg">판단 항목</th>
                                                                                    <th className="p-2 text-left text-gray-700 font-bold">👨‍⚖️ 직업 판사</th>
                                                                                    <th className="p-2 text-left text-gray-700 font-bold">🤖 AI 판사</th>
                                                                                    <th className="p-2 text-left text-gray-700 font-bold rounded-tr-lg">AI 장점</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {pred.aiJudgeComparison.differences.map((diff, i) => (
                                                                                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                                                        <td className="p-2 font-medium text-gray-900">{diff.aspect}</td>
                                                                                        <td className="p-2 text-red-700">{diff.humanJudge}</td>
                                                                                        <td className="p-2 text-indigo-700">{diff.aiJudge}</td>
                                                                                        <td className="p-2 text-green-700">{diff.advantage}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                )}

                                                                {/* AI 판사 도입 필요성 */}
                                                                {pred.aiJudgeComparison.necessityReasoning && (
                                                                    <div className="bg-indigo-50 rounded-lg p-3">
                                                                        <p className="text-xs text-indigo-800 leading-relaxed">
                                                                            💡 {pred.aiJudgeComparison.necessityReasoning}
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {/* AI 사법 시스템 도입 현황 */}
                                                                {pred.aiJudgeComparison.aiJudgeStatus && (
                                                                    <div className="border-t pt-3">
                                                                        <h5 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1">
                                                                            🌍 AI 사법 시스템 도입 현황
                                                                        </h5>
                                                                        <div className="grid grid-cols-2 gap-3">
                                                                            <div className="bg-blue-50 rounded-lg p-3">
                                                                                <p className="text-xs font-bold text-blue-800 mb-1">🇰🇷 한국</p>
                                                                                <p className="text-xs text-blue-700 leading-relaxed">{pred.aiJudgeComparison.aiJudgeStatus.korea}</p>
                                                                            </div>
                                                                            <div className="bg-green-50 rounded-lg p-3">
                                                                                <p className="text-xs font-bold text-green-800 mb-1">🌐 해외</p>
                                                                                <p className="text-xs text-green-700 leading-relaxed">{pred.aiJudgeComparison.aiJudgeStatus.global}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* 면책 문구 */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">
                                        ※ 본 분석은 AI가 양형분석 시스템에서 생성한 데이터를 자동으로 연동한 결과이며, 시민법정의 공식 입장이 아닙니다.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-6">
                                담당 피고인 AI 분석 데이터가 아직 없습니다.
                            </p>
                        )}
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
        </>
    );
}
