import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import {
    doc,
    collection,
    query,
    where,
    orderBy,
    getDocs,
    addDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { getCurrentUser, checkUserSignature } from '../lib/auth';
import Header from '../components/Header';
import { JUDGES_DATA } from '../data/judges';

// 인라인 SVG 아이콘 (heroicons 대체)
const ShareIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
    </svg>
);

const FlagIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
);

export default function JudgeDetail() {
    const { name } = useParams();
    const navigate = useNavigate();
    const [judge, setJudge] = useState(null);
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isSignatureParticipant, setIsSignatureParticipant] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [relatedNews, setRelatedNews] = useState([]);
    const [newsLoading, setNewsLoading] = useState(false);

    // 판사 정보 및 평가 목록 로드
    useEffect(() => {
        loadJudgeData();
        checkAuth();
    }, [name]);

    const checkAuth = async () => {
        const currentUser = getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
            const isSigned = await checkUserSignature(currentUser.uid);
            setIsSignatureParticipant(isSigned);
        }
    };

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

            // 평가 목록 가져오기 (Firestore에서) - 별도 try-catch
            try {
                const evaluationsQuery = query(
                    collection(db, 'judgeEvaluations'),
                    where('judgeId', '==', name),
                    where('reported', '==', false),
                    orderBy('createdAt', 'desc')
                );

                const evaluationsSnap = await getDocs(evaluationsQuery);
                const evaluationsList = evaluationsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setEvaluations(evaluationsList);
            } catch (evalErr) {
                console.error('평가 목록 로드 에러 (Firestore 인덱스 필요할 수 있음):', evalErr);
                // 평가 로드 실패해도 판사 정보는 표시됨
                setEvaluations([]);
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

    const handleSubmitEvaluation = async (e) => {
        e.preventDefault();

        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        if (!isSignatureParticipant) {
            alert('서명 참여자만 평가할 수 있습니다.');
            return;
        }

        if (rating === 0) {
            alert('별점을 선택해주세요.');
            return;
        }

        if (!comment.trim()) {
            alert('평가 내용을 작성해주세요.');
            return;
        }

        try {
            setSubmitting(true);

            await addDoc(collection(db, 'judgeEvaluations'), {
                judgeId: name,
                userId: user.uid,
                userName: user.displayName || '익명',
                userPhoto: user.photoURL || null,
                rating: rating,
                comment: comment.trim(),
                createdAt: serverTimestamp(),
                reported: false
            });

            // 폼 초기화
            setRating(0);
            setComment('');

            // 평가 목록 새로고침
            await loadJudgeData();

            alert('평가가 등록되었습니다.');
        } catch (err) {
            console.error('평가 등록 에러:', err);
            alert('평가 등록 중 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReportEvaluation = async (evaluationId) => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        if (!confirm('이 평가를 신고하시겠습니까?')) {
            return;
        }

        try {
            const evaluationRef = doc(db, 'judgeEvaluations', evaluationId);
            await updateDoc(evaluationRef, {
                reported: true,
                reportedBy: user.uid,
                reportedAt: serverTimestamp()
            });

            alert('신고가 접수되었습니다.');
            await loadJudgeData();
        } catch (err) {
            console.error('신고 처리 에러:', err);
            alert('신고 처리 중 오류가 발생했습니다.');
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

    const calculateAverageRating = () => {
        if (evaluations.length === 0) return 0;
        const sum = evaluations.reduce((acc, curr) => acc + curr.rating, 0);
        return (sum / evaluations.length).toFixed(1);
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
                                    <img
                                        src={judge.photo}
                                        alt={judge.name}
                                        className="w-40 h-40 rounded-full object-cover border-4 border-gray-200"
                                    />
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

                                {/* 평균 별점 */}
                                {evaluations.length > 0 && (
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <span key={star} className="text-2xl">
                                                    {star <= Math.round(calculateAverageRating()) ? '⭐' : '☆'}
                                                </span>
                                            ))}
                                        </div>
                                        <span className="text-gray-600 font-medium">
                                            {calculateAverageRating()} / 5.0 ({evaluations.length}개 평가)
                                        </span>
                                    </div>
                                )}
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

                    {/* 하단: 평가 작성 폼 */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">평가 작성</h2>

                        {isSignatureParticipant ? (
                            <form onSubmit={handleSubmitEvaluation}>
                                {/* 별점 선택 */}
                                <div className="mb-4">
                                    <label className="block text-gray-700 font-medium mb-2">
                                        별점 선택
                                    </label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className="text-4xl hover:scale-110 transition"
                                            >
                                                {star <= rating ? '⭐' : '☆'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 평가 내용 */}
                                <div className="mb-4">
                                    <label className="block text-gray-700 font-medium mb-2">
                                        평가 내용
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="판사에 대한 평가를 작성해주세요..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        rows="5"
                                        required
                                    />
                                </div>

                                {/* 제출 버튼 */}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? '등록 중...' : '평가 등록'}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-600 text-lg mb-4">
                                    서명 참여자만 평가할 수 있습니다.
                                </p>
                                {!user && (
                                    <p className="text-gray-500 text-sm">
                                        로그인 후 서명에 참여해주세요.
                                    </p>
                                )}
                                <Link
                                    to="/#signature"
                                    className="inline-block mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                                >
                                    서명 참여하기
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* 평가 목록 */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            평가 목록 ({evaluations.length})
                        </h2>

                        {/* 면책 문구 */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-gray-700">
                                본 평가는 개인적인 의견이며, 시민법정의 공식 입장이 아닙니다.
                            </p>
                        </div>

                        {evaluations.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                아직 평가가 없습니다. 첫 번째 평가를 작성해보세요!
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {evaluations.map((evaluation) => (
                                    <div
                                        key={evaluation.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                                    >
                                        {/* 평가자 정보 */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                {evaluation.userPhoto ? (
                                                    <img
                                                        src={evaluation.userPhoto}
                                                        alt={evaluation.userName}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                                                        {evaluation.userName?.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {evaluation.userName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {evaluation.createdAt?.toDate().toLocaleDateString('ko-KR')}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* 신고 버튼 */}
                                            <button
                                                onClick={() => handleReportEvaluation(evaluation.id)}
                                                className="text-gray-400 hover:text-red-600 transition"
                                                title="신고"
                                            >
                                                <FlagIcon className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* 별점 */}
                                        <div className="flex gap-1 mb-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <span key={star} className="text-xl">
                                                    {star <= evaluation.rating ? '⭐' : '☆'}
                                                </span>
                                            ))}
                                        </div>

                                        {/* 평가 내용 */}
                                        <p className="text-gray-700 whitespace-pre-wrap">
                                            {evaluation.comment}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
