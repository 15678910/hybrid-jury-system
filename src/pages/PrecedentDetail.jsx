import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import { getPrecedentDetail } from '../lib/lawApi';

function PrecedentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [precedent, setPrecedent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('summary'); // summary, reasons, reference, full
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [copied, setCopied] = useState(false);

    // 북마크 상태 초기화
    useEffect(() => {
        try {
            const bookmarks = JSON.parse(localStorage.getItem('bookmarks_precedents') || '[]');
            setIsBookmarked(bookmarks.includes(id));
        } catch {
            setIsBookmarked(false);
        }
    }, [id]);

    // 판례 상세 데이터 로딩
    useEffect(() => {
        const loadPrecedent = async () => {
            setLoading(true);
            setError(null);

            try {
                const data = await getPrecedentDetail(id);

                if (data?.PrecService?.prec) {
                    setPrecedent(data.PrecService.prec);
                } else {
                    setError('판례를 찾을 수 없습니다.');
                }
            } catch (err) {
                setError('판례를 불러오는 중 오류가 발생했습니다.');
                console.error('Load precedent error:', err);
            } finally {
                setLoading(false);
            }
        };

        loadPrecedent();
    }, [id]);

    // 북마크 토글
    const toggleBookmark = () => {
        try {
            const bookmarks = JSON.parse(localStorage.getItem('bookmarks_precedents') || '[]');
            const newBookmarks = isBookmarked
                ? bookmarks.filter(b => b !== id)
                : [...bookmarks, id];
            localStorage.setItem('bookmarks_precedents', JSON.stringify(newBookmarks));
            setIsBookmarked(!isBookmarked);
        } catch (err) {
            console.error('Bookmark error:', err);
        }
    };

    // URL 복사
    const copyUrl = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            alert('URL 복사에 실패했습니다.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="pt-24 pb-16">
                    <div className="max-w-4xl mx-auto px-4">
                        <div className="bg-white rounded-xl p-8 text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-gray-500">판례를 불러오는 중...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !precedent) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="pt-24 pb-16">
                    <div className="max-w-4xl mx-auto px-4">
                        <div className="bg-white rounded-xl p-8 text-center">
                            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">판례를 찾을 수 없습니다</h2>
                            <p className="text-gray-500 mb-6">{error}</p>
                            <button
                                onClick={() => navigate(-1)}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                돌아가기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="pt-24 pb-16">
                <div className="max-w-4xl mx-auto px-4">
                    {/* 상단 액션 버튼 */}
                    <div className="mb-6 flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span className="text-sm font-medium">목록으로</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleBookmark}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                                    isBookmarked
                                        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                            >
                                <svg className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                <span className="text-sm font-medium">{isBookmarked ? '북마크됨' : '북마크'}</span>
                            </button>

                            <button
                                onClick={copyUrl}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition"
                            >
                                {copied ? (
                                    <>
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-sm font-medium text-green-600">복사됨</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                        <span className="text-sm font-medium">공유</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* 판례 헤더 */}
                    <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-gray-100 mb-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                                    {precedent.법원명 || '법원 정보 없음'}
                                </span>
                                <span className="text-gray-500 text-sm">
                                    {precedent.선고일자 || '날짜 정보 없음'}
                                </span>
                                {precedent.판결유형 && (
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                                        {precedent.판결유형}
                                    </span>
                                )}
                            </div>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                            {precedent.사건번호 || '사건번호 정보 없음'}
                        </h1>

                        <h2 className="text-lg md:text-xl text-gray-700 font-medium mb-4">
                            {precedent.사건명 || '사건명 정보 없음'}
                        </h2>

                        {precedent.선고 && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-1">선고</p>
                                <p className="text-gray-900 font-medium">{precedent.선고}</p>
                            </div>
                        )}
                    </div>

                    {/* 탭 네비게이션 */}
                    <div className="bg-white rounded-t-xl border border-gray-100 border-b-0">
                        <div className="flex overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('summary')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                                    activeTab === 'summary'
                                        ? 'text-blue-600 border-blue-600'
                                        : 'text-gray-500 border-transparent hover:text-gray-700'
                                }`}
                            >
                                판시사항
                            </button>
                            <button
                                onClick={() => setActiveTab('reasons')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                                    activeTab === 'reasons'
                                        ? 'text-blue-600 border-blue-600'
                                        : 'text-gray-500 border-transparent hover:text-gray-700'
                                }`}
                            >
                                판결요지
                            </button>
                            <button
                                onClick={() => setActiveTab('reference')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                                    activeTab === 'reference'
                                        ? 'text-blue-600 border-blue-600'
                                        : 'text-gray-500 border-transparent hover:text-gray-700'
                                }`}
                            >
                                참조조문/판례
                            </button>
                            {precedent.전문 && (
                                <button
                                    onClick={() => setActiveTab('full')}
                                    className={`px-6 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                                        activeTab === 'full'
                                            ? 'text-blue-600 border-blue-600'
                                            : 'text-gray-500 border-transparent hover:text-gray-700'
                                    }`}
                                >
                                    전문
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 탭 컨텐츠 */}
                    <div className="bg-white rounded-b-xl p-6 md:p-8 shadow-sm border border-gray-100">
                        {activeTab === 'summary' && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">판시사항</h3>
                                {precedent.판시사항 ? (
                                    <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                                        {precedent.판시사항}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">판시사항 정보가 없습니다.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'reasons' && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">판결요지</h3>
                                {precedent.판결요지 ? (
                                    <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                                        {precedent.판결요지}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">판결요지 정보가 없습니다.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'reference' && (
                            <div className="space-y-6">
                                {precedent.참조조문 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">참조조문</h3>
                                        <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                                            {precedent.참조조문}
                                        </div>
                                    </div>
                                )}
                                {precedent.참조판례 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">참조판례</h3>
                                        <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                                            {precedent.참조판례}
                                        </div>
                                    </div>
                                )}
                                {!precedent.참조조문 && !precedent.참조판례 && (
                                    <p className="text-gray-500">참조조문 및 참조판례 정보가 없습니다.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'full' && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">판결 전문</h3>
                                {precedent.전문 ? (
                                    <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                                        {precedent.전문}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">판결 전문 정보가 없습니다.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 법제처 원문 링크 */}
                    <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 mb-2">법제처에서 원문 보기</h3>
                                <p className="text-sm text-gray-600 mb-3">
                                    국가법령정보센터에서 판례의 전체 내용과 추가 정보를 확인할 수 있습니다.
                                </p>
                                <a
                                    href={`https://www.law.go.kr/LSW/precInfoP.do?precSeq=${id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                >
                                    법제처로 이동
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* 하단 액션 */}
                    <div className="mt-6 flex justify-center">
                        <Link
                            to="/case-search"
                            className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            다른 판례 검색하기
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <p className="text-gray-400 text-sm">
                        시민법정 - 법률정보 검색 서비스
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                        본 서비스는 공익 목적으로 제공되며, 법률 자문을 대체하지 않습니다.
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default PrecedentDetail;
