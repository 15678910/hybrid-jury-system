import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { JUDGES_DATA } from '../data/judges';

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
                </div>
            </div>
        </>
    );
}
