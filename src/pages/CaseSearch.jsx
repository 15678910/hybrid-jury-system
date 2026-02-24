import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import { JUDGES_DATA as judges } from '../data/judges';
import { searchPrecedents, searchLaws } from '../lib/lawApi';

// 인물 데이터 (SentencingAnalysis에서 가져옴)
const PERSONS = {
    '윤석열': { position: '전 대통령', status: '구속', court: '서울중앙지방법원', charges: ['내란수괴', '내란목적살인미수'], trialStatus: '1심 무기징역 선고 (2026.2.19)' },
    '한덕수': { position: '전 국무총리', status: '구속', court: '서울중앙지방법원', charges: ['내란중요임무종사', '위증'], trialStatus: '1심 징역 23년 선고 (2026.1.21)' },
    '이상민': { position: '전 행정안전부 장관', status: '구속', court: '서울중앙지방법원', charges: ['내란중요임무종사', '위증', '직권남용'], trialStatus: '1심 징역 7년 선고 (2026.2.12)' },
    '김용현': { position: '전 국방부 장관', status: '구속', court: '서울중앙지방법원', charges: ['내란중요임무종사', '직권남용'], trialStatus: '1심 징역 30년 선고 (2026.2.19)' },
    '조태용': { position: '전 국정원장', status: '구속', court: '서울중앙지방법원', charges: ['국가정보원법 위반'], trialStatus: '1심 재판 진행 중' },
    '김건희': { position: '대통령 배우자', status: '구속', court: '서울중앙지방법원', charges: ['주가조작', '명품백 수수'], trialStatus: '1심 징역 1년 8개월 선고 (2026.1.28)' },
    '여인형': { position: '전 방첩사령관', status: '구속', court: '서울중앙지방법원', charges: ['내란중요임무종사'], trialStatus: '1심 재판 진행 중' },
    '이진우': { position: '전 수도방위사령관', status: '구속', court: '서울중앙지방법원', charges: ['내란중요임무종사'], trialStatus: '1심 재판 진행 중' },
    '곽종근': { position: '전 특수전사령부 부사령관', status: '구속', court: '서울중앙지방법원', charges: ['내란중요임무종사'], trialStatus: '1심 재판 진행 중' },
};

function CaseSearch() {
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [activeFilter, setActiveFilter] = useState('precedent'); // precedent, law, judge, person
    const [sortOrder, setSortOrder] = useState('relevance'); // relevance, newest

    // Enhanced Filters
    const [excludeKeywords, setExcludeKeywords] = useState('');
    const [selectedCourts, setSelectedCourts] = useState([]);
    const [selectedCaseTypes, setSelectedCaseTypes] = useState([]);
    const [selectedResults, setSelectedResults] = useState([]);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // API 검색 상태
    const [precedents, setPrecedents] = useState([]);
    const [laws, setLaws] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPrecedents, setTotalPrecedents] = useState(0);
    const [totalLaws, setTotalLaws] = useState(0);

    // 북마크 상태
    const [bookmarkedPrecedents, setBookmarkedPrecedents] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('bookmarks_precedents') || '[]');
        } catch {
            return [];
        }
    });
    const [bookmarkedLaws, setBookmarkedLaws] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('bookmarks_laws') || '[]');
        } catch {
            return [];
        }
    });

    // API 검색 실행
    useEffect(() => {
        const performSearch = async () => {
            if (!searchQuery.trim()) {
                setPrecedents([]);
                setLaws([]);
                setTotalPrecedents(0);
                setTotalLaws(0);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // 판례와 법령 동시 검색
                const [precData, lawData] = await Promise.all([
                    searchPrecedents(searchQuery, { display: 20, page: currentPage }),
                    searchLaws(searchQuery, { display: 20, page: currentPage })
                ]);

                if (precData) {
                    // API returns PrecSearch.prec (not PrecService[1].prec)
                    setPrecedents(precData.PrecSearch?.prec || []);
                    setTotalPrecedents(parseInt(precData.PrecSearch?.totalCnt || 0));
                }

                if (lawData) {
                    // API returns LawSearch.law (not LawService[1].law)
                    setLaws(lawData.LawSearch?.law || []);
                    setTotalLaws(parseInt(lawData.LawSearch?.totalCnt || 0));
                }
            } catch (err) {
                setError('검색 중 오류가 발생했습니다.');
                console.error('Search error:', err);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(performSearch, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, currentPage]);

    // Highlight search keyword helper
    const highlightKeyword = (text, keyword) => {
        if (!text || !keyword) return text;

        const parts = text.split(new RegExp(`(${keyword})`, 'gi'));
        return parts.map((part, idx) =>
            part.toLowerCase() === keyword.toLowerCase()
                ? <span key={idx} className="text-blue-600 font-medium">{part}</span>
                : part
        );
    };

    // 정적 데이터 검색 (판사, 인물)
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return { judges: [], persons: [] };

        const query = searchQuery.toLowerCase().trim();

        // 판사 검색
        const judgeResults = judges.filter(judge =>
            judge.name.toLowerCase().includes(query) ||
            judge.position?.toLowerCase().includes(query) ||
            judge.court?.toLowerCase().includes(query) ||
            judge.cases?.some(c => c.text.toLowerCase().includes(query))
        );

        // 인물 검색
        const personResults = Object.entries(PERSONS)
            .filter(([name, data]) =>
                name.toLowerCase().includes(query) ||
                data.position.toLowerCase().includes(query) ||
                data.charges.some(c => c.toLowerCase().includes(query))
            )
            .map(([name, data]) => ({ name, ...data }));

        return {
            judges: judgeResults,
            persons: personResults
        };
    }, [searchQuery]);

    // 필터링된 결과
    const filteredResults = useMemo(() => {
        let results = {
            judges: activeFilter === 'judge' ? searchResults.judges : [],
            precedents: activeFilter === 'precedent' ? precedents : [],
            laws: activeFilter === 'law' ? laws : [],
            persons: activeFilter === 'person' ? searchResults.persons : []
        };

        // Apply exclude keywords filter
        if (excludeKeywords.trim() && activeFilter === 'precedent') {
            const excludeTerms = excludeKeywords.toLowerCase().split(',').map(k => k.trim());
            results.precedents = results.precedents.filter(prec => {
                const searchText = `${prec.사건명} ${prec.판시사항} ${prec.판결요지}`.toLowerCase();
                return !excludeTerms.some(term => searchText.includes(term));
            });
        }

        // Apply court filter
        if (selectedCourts.length > 0 && activeFilter === 'precedent') {
            results.precedents = results.precedents.filter(prec => {
                const court = prec.법원명 || '';
                return selectedCourts.some(filter => {
                    if (filter === '대법원') return court.includes('대법원');
                    if (filter === '고등법원') return court.includes('고등법원') || court.includes('특허법원');
                    if (filter === '지방법원') return court.includes('지방법원') || court.includes('행정법원') || court.includes('가정법원');
                    if (filter === '헌법재판소') return court.includes('헌법재판소');
                    if (filter === '군사법원') return court.includes('군사법원');
                    return false;
                });
            });
        }

        // Apply case type filter
        if (selectedCaseTypes.length > 0 && activeFilter === 'precedent') {
            results.precedents = results.precedents.filter(prec => {
                const caseNum = prec.사건번호 || '';
                return selectedCaseTypes.some(type => {
                    if (type === '민사') return caseNum.includes('가합') || caseNum.includes('가단') || caseNum.includes('나');
                    if (type === '형사') return caseNum.includes('고합') || caseNum.includes('고단') || caseNum.includes('노');
                    if (type === '행정') return caseNum.includes('구합') || caseNum.includes('구단');
                    if (type === '특허') return caseNum.includes('허');
                    if (type === '가사') return caseNum.includes('드') || caseNum.includes('느');
                    return false;
                });
            });
        }

        // Apply litigation result filter
        if (selectedResults.length > 0 && activeFilter === 'precedent') {
            results.precedents = results.precedents.filter(prec => {
                const summary = `${prec.판결요지} ${prec.판시사항}`.toLowerCase();
                return selectedResults.some(result => {
                    if (result === '원고패') return summary.includes('기각') || summary.includes('패소');
                    if (result === '원고일부승') return summary.includes('일부') && summary.includes('인용');
                    if (result === '원고승') return summary.includes('인용') && !summary.includes('기각');
                    if (result === '무죄') return summary.includes('무죄');
                    if (result === '집행유예') return summary.includes('집행유예');
                    return false;
                });
            });
        }

        // Apply date range filter
        if (dateRange.start || dateRange.end) {
            if (activeFilter === 'precedent') {
                results.precedents = results.precedents.filter(prec => {
                    const date = prec.선고일자?.replace(/\./g, '-');
                    if (!date) return false;
                    if (dateRange.start && date < dateRange.start) return false;
                    if (dateRange.end && date > dateRange.end) return false;
                    return true;
                });
            }
        }

        // Apply sorting
        if (activeFilter === 'precedent' && sortOrder === 'newest') {
            results.precedents = [...results.precedents].sort((a, b) => {
                const dateA = a.선고일자?.replace(/\./g, '') || '0';
                const dateB = b.선고일자?.replace(/\./g, '') || '0';
                return dateB.localeCompare(dateA);
            });
        }

        return results;
    }, [searchResults, precedents, laws, activeFilter, excludeKeywords, selectedCourts, selectedCaseTypes, selectedResults, dateRange, sortOrder]);

    const totalCount = filteredResults.judges.length + filteredResults.precedents.length + filteredResults.laws.length + filteredResults.persons.length;

    // 각 카테고리별 전체 개수 (탭 표시용)
    const categoryCounts = useMemo(() => ({
        precedent: precedents.length,
        law: laws.length,
        judge: searchResults.judges.length,
        person: searchResults.persons.length
    }), [precedents, laws, searchResults]);

    // 북마크 토글 함수
    const toggleBookmarkPrecedent = (id) => {
        const newBookmarks = bookmarkedPrecedents.includes(id)
            ? bookmarkedPrecedents.filter(b => b !== id)
            : [...bookmarkedPrecedents, id];
        setBookmarkedPrecedents(newBookmarks);
        localStorage.setItem('bookmarks_precedents', JSON.stringify(newBookmarks));
    };

    const toggleBookmarkLaw = (mst) => {
        const newBookmarks = bookmarkedLaws.includes(mst)
            ? bookmarkedLaws.filter(b => b !== mst)
            : [...bookmarkedLaws, mst];
        setBookmarkedLaws(newBookmarks);
        localStorage.setItem('bookmarks_laws', JSON.stringify(newBookmarks));
    };

    const handleSearch = (e) => {
        e.preventDefault();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* Hero Section */}
            <div className="bg-gradient-to-b from-white to-gray-100 pt-24 pb-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        법률정보 검색 서비스
                    </h1>
                    <p className="text-xl text-blue-600 font-semibold mb-8">시민법정</p>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                        <div className="flex items-center bg-white rounded-full shadow-lg border border-gray-200 overflow-hidden">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="판례번호 또는 키워드를 입력해주세요 (예: 이진관, 2024가단12345)"
                                className="flex-1 px-6 py-4 text-lg focus:outline-none"
                            />
                            <button
                                type="submit"
                                className="px-6 py-4 text-gray-500 hover:text-blue-600 transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </div>
                    </form>

                    {/* Quick Search Tags */}
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                        {['내란', '형법', '민법'].map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSearchQuery(tag)}
                                className="px-4 py-2 bg-white rounded-full text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 transition"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search Results */}
            {searchQuery && (
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Results */}
                        <div className="flex-1">
                            {/* Tabs */}
                            <div className="flex items-center justify-between border-b border-gray-200 mb-6">
                                <div className="flex items-center gap-6 overflow-x-auto">
                                    <button
                                        onClick={() => setActiveFilter('precedent')}
                                        className={`pb-3 px-1 font-medium transition whitespace-nowrap ${activeFilter === 'precedent' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        판례 {categoryCounts.precedent > 0 && <span className={`ml-1 text-xs ${activeFilter === 'precedent' ? 'text-blue-500' : 'text-gray-400'}`}>({categoryCounts.precedent})</span>}
                                    </button>
                                    <button
                                        onClick={() => setActiveFilter('law')}
                                        className={`pb-3 px-1 font-medium transition whitespace-nowrap ${activeFilter === 'law' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        법령 {categoryCounts.law > 0 && <span className={`ml-1 text-xs ${activeFilter === 'law' ? 'text-blue-500' : 'text-gray-400'}`}>({categoryCounts.law})</span>}
                                    </button>
                                    <button
                                        onClick={() => setActiveFilter('judge')}
                                        className={`pb-3 px-1 font-medium transition whitespace-nowrap ${activeFilter === 'judge' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        판사 {categoryCounts.judge > 0 && <span className={`ml-1 text-xs ${activeFilter === 'judge' ? 'text-blue-500' : 'text-gray-400'}`}>({categoryCounts.judge})</span>}
                                    </button>
                                    <button
                                        onClick={() => setActiveFilter('person')}
                                        className={`pb-3 px-1 font-medium transition whitespace-nowrap ${activeFilter === 'person' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        인물 {categoryCounts.person > 0 && <span className={`ml-1 text-xs ${activeFilter === 'person' ? 'text-blue-500' : 'text-gray-400'}`}>({categoryCounts.person})</span>}
                                    </button>
                                </div>

                                {/* Sorting Options - Show only for precedents */}
                                {activeFilter === 'precedent' && filteredResults.precedents.length > 0 && (
                                    <div className="flex items-center gap-2 pb-3">
                                        <button
                                            onClick={() => setSortOrder('relevance')}
                                            className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                                                sortOrder === 'relevance'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            정확도순
                                        </button>
                                        <button
                                            onClick={() => setSortOrder('newest')}
                                            className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                                                sortOrder === 'newest'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            최신순
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Loading */}
                            {loading && (
                                <div className="text-center py-12 bg-white rounded-xl">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <p className="text-gray-500 mt-4">검색 중...</p>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="text-center py-12 bg-red-50 rounded-xl">
                                    <p className="text-red-600">{error}</p>
                                </div>
                            )}

                            {!loading && !error && (
                                <>
                                    {/* Results Count */}
                                    {totalCount > 0 && (
                                        <p className="text-sm text-gray-600 mb-4">
                                            검색결과 총 <strong className="text-gray-900">{totalCount.toLocaleString()}건</strong>
                                        </p>
                                    )}

                                    {/* No Results */}
                                    {totalCount === 0 && (
                                        <div className="text-center py-12 bg-white rounded-xl">
                                            <p className="text-gray-500">검색 결과가 없습니다.</p>
                                            <p className="text-sm text-gray-400 mt-2">다른 키워드로 검색해 보세요.</p>
                                        </div>
                                    )}

                                    {/* Precedent Results - CaseNote Style */}
                                    {filteredResults.precedents.length > 0 && (
                                        <div className="mb-8">
                                            <div className="space-y-3">
                                                {filteredResults.precedents.map(prec => {
                                                    const summary = prec.판시사항 || prec.판결요지 || '판결 내용 요약 없음';
                                                    return (
                                                        <Link
                                                            to={`/precedent/${prec.판례일련번호}`}
                                                            key={prec.판례일련번호}
                                                            className="block bg-white rounded-lg p-4 hover:bg-gray-50 transition border border-gray-200"
                                                        >
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex-1 min-w-0">
                                                                    {/* First Line: Court + Date + Case Number + Case Name */}
                                                                    <div className="text-sm text-gray-900 mb-2 leading-relaxed">
                                                                        <span className="font-medium">{prec.법원명}</span>
                                                                        {' '}
                                                                        <span>{prec.선고일자} 선고</span>
                                                                        {' '}
                                                                        <span className="font-semibold">{prec.사건번호}</span>
                                                                        {' '}
                                                                        {prec.사건명 && <span>[{prec.사건명}]</span>}
                                                                    </div>

                                                                    {/* Second Line: Summary with keyword highlighting */}
                                                                    <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                                                                        {highlightKeyword(summary, searchQuery.trim())}
                                                                    </p>
                                                                </div>

                                                                {/* Bookmark Button */}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        toggleBookmarkPrecedent(prec.판례일련번호);
                                                                    }}
                                                                    className="flex-shrink-0 text-gray-400 hover:text-yellow-500 transition"
                                                                >
                                                                    {bookmarkedPrecedents.includes(prec.판례일련번호) ? (
                                                                        <svg className="w-5 h-5 fill-current text-yellow-500" viewBox="0 0 24 24">
                                                                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                                                                        </svg>
                                                                    ) : (
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                                        </svg>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Law Results */}
                                    {filteredResults.laws.length > 0 && (
                                        <div className="mb-8">
                                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <span className="w-1 h-5 bg-green-600 rounded-full"></span>
                                                법령
                                            </h2>
                                            <div className="space-y-4">
                                                {filteredResults.laws.map(law => (
                                                    <a
                                                        key={law.법령일련번호}
                                                        href={`https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=${law.법령일련번호}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition border border-gray-100"
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                                                        {law.법령구분명}
                                                                    </span>
                                                                    <span className="text-sm text-gray-500">시행 {law.시행일자}</span>
                                                                </div>
                                                                <h3 className="text-base font-bold text-gray-900 mb-1">{law.법령명한글}</h3>
                                                                {law.소관부처명 && (
                                                                    <p className="text-sm text-gray-600">소관: {law.소관부처명}</p>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    toggleBookmarkLaw(law.법령일련번호);
                                                                }}
                                                                className="flex-shrink-0 text-gray-400 hover:text-yellow-500 transition"
                                                            >
                                                                {bookmarkedLaws.includes(law.법령일련번호) ? (
                                                                    <svg className="w-6 h-6 fill-current text-yellow-500" viewBox="0 0 24 24">
                                                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Judge Results */}
                                    {filteredResults.judges.length > 0 && (
                                        <div className="mb-8">
                                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                                                판사
                                            </h2>
                                            <div className="space-y-5">
                                                {filteredResults.judges.map(judge => (
                                                    <Link
                                                        key={judge.id}
                                                        to={`/judge/${judge.id}`}
                                                        className="block bg-white rounded-xl shadow-sm hover:shadow-lg transition border border-gray-200 overflow-hidden"
                                                    >
                                                        {/* Header */}
                                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                                                            <div className="flex items-start gap-4">
                                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-white shadow-md">
                                                                    {judge.photo ? (
                                                                        <img src={judge.photo} alt={judge.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="text-2xl font-bold text-blue-600">{judge.name[0]}</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                                                        <h3 className="text-xl font-bold text-gray-900">{judge.name}</h3>
                                                                        <span className="px-2.5 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">
                                                                            {judge.category}
                                                                        </span>
                                                                        {judge.appointedBy && (
                                                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                                                임명: {judge.appointedBy}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-gray-700 font-medium">{judge.court}</p>
                                                                    <p className="text-sm text-gray-600">{judge.position}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Body */}
                                                        <div className="px-6 py-4">
                                                            {/* Notable Cases */}
                                                            {judge.cases && judge.cases.length > 0 && (
                                                                <div className="mb-4">
                                                                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                        </svg>
                                                                        주요 판결 ({judge.cases.length}건)
                                                                    </h4>
                                                                    <div className="space-y-2.5">
                                                                        {judge.cases.slice(0, 3).map((caseItem, idx) => (
                                                                            <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                                                                <div className="flex items-start gap-2">
                                                                                    <span className="inline-block w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                                        {idx + 1}
                                                                                    </span>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="text-sm text-gray-900 font-medium leading-relaxed">
                                                                                            {caseItem.text}
                                                                                        </p>
                                                                                        {caseItem.source && (
                                                                                            <a
                                                                                                href={caseItem.source.url}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1"
                                                                                            >
                                                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                                                                </svg>
                                                                                                {caseItem.source.name}
                                                                                            </a>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Career Highlights */}
                                                            {judge.career && judge.career.length > 0 && (
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                        </svg>
                                                                        주요 경력
                                                                    </h4>
                                                                    <ul className="text-xs text-gray-600 space-y-1">
                                                                        {judge.career.slice(0, 3).map((item, idx) => (
                                                                            <li key={idx} className="flex items-start gap-2">
                                                                                <span className="text-blue-400 mt-0.5">•</span>
                                                                                <span>{item}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Footer */}
                                                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs text-gray-500">상세 정보 보기</span>
                                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Person Results */}
                                    {filteredResults.persons.length > 0 && (
                                        <div className="mb-8">
                                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <span className="w-1 h-5 bg-orange-600 rounded-full"></span>
                                                인물
                                            </h2>
                                            <div className="space-y-4">
                                                {filteredResults.persons.map(person => (
                                                    <Link
                                                        key={person.name}
                                                        to={`/sentencing-analysis?person=${encodeURIComponent(person.name)}`}
                                                        className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition border border-gray-100"
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                                person.status === '구속' ? 'bg-red-100' : 'bg-green-100'
                                                            }`}>
                                                                <span className={`text-lg font-bold ${
                                                                    person.status === '구속' ? 'text-red-600' : 'text-green-600'
                                                                }`}>
                                                                    {person.name[0]}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <h3 className="text-lg font-bold text-gray-900">{person.name}</h3>
                                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                                                        person.status === '구속' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                                    }`}>
                                                                        {person.status}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-500 mt-1">{person.position}</p>
                                                                <p className="text-sm text-gray-600 mt-2">
                                                                    혐의: {person.charges.join(', ')}
                                                                </p>
                                                                <p className="text-sm text-blue-600 mt-1">{person.trialStatus}</p>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Pagination */}
                                    {(filteredResults.precedents.length > 0 || filteredResults.laws.length > 0) && (
                                        <div className="flex justify-center items-center gap-2 mt-8">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                이전
                                            </button>
                                            <span className="px-4 py-2 text-sm text-gray-600">
                                                {currentPage} 페이지
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(p => p + 1)}
                                                disabled={
                                                    (activeFilter === 'precedent' && filteredResults.precedents.length < 20) ||
                                                    (activeFilter === 'law' && filteredResults.laws.length < 20) ||
                                                    (activeFilter === 'all' && filteredResults.precedents.length < 20 && filteredResults.laws.length < 20)
                                                }
                                                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                다음
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Filters Sidebar - CaseNote Style */}
                        <div className="lg:w-80">
                            <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 sticky top-24">
                                <h3 className="font-bold text-gray-900 mb-5 text-base">상세 검색</h3>

                                {/* Exclude Keywords */}
                                {activeFilter === 'precedent' && (
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            결과 내 제외어
                                        </label>
                                        <input
                                            type="text"
                                            value={excludeKeywords}
                                            onChange={(e) => setExcludeKeywords(e.target.value)}
                                            placeholder="쉼표로 구분 (예: 민사,계약)"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                )}

                                {/* Court Filter */}
                                {activeFilter === 'precedent' && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">법원</h4>
                                        <div className="space-y-2">
                                            {['대법원', '고등법원', '지방법원', '헌법재판소', '군사법원'].map(court => (
                                                <label key={court} className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCourts.includes(court)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedCourts([...selectedCourts, court]);
                                                            } else {
                                                                setSelectedCourts(selectedCourts.filter(c => c !== court));
                                                            }
                                                        }}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                                        {court}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Case Type Filter */}
                                {activeFilter === 'precedent' && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">사건종류</h4>
                                        <div className="space-y-2">
                                            {['민사', '형사', '행정', '특허', '가사'].map(type => (
                                                <label key={type} className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCaseTypes.includes(type)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedCaseTypes([...selectedCaseTypes, type]);
                                                            } else {
                                                                setSelectedCaseTypes(selectedCaseTypes.filter(t => t !== type));
                                                            }
                                                        }}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                                        {type}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Litigation Result Filter */}
                                {activeFilter === 'precedent' && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">소송결과</h4>
                                        <div className="space-y-2">
                                            {['원고패', '원고일부승', '원고승', '무죄', '집행유예'].map(result => (
                                                <label key={result} className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedResults.includes(result)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedResults([...selectedResults, result]);
                                                            } else {
                                                                setSelectedResults(selectedResults.filter(r => r !== result));
                                                            }
                                                        }}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                                        {result}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Date Range Filter */}
                                {activeFilter === 'precedent' && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">기간</h4>
                                        <div className="space-y-2">
                                            <input
                                                type="date"
                                                value={dateRange.start}
                                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="시작일"
                                            />
                                            <div className="text-center text-xs text-gray-500">~</div>
                                            <input
                                                type="date"
                                                value={dateRange.end}
                                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="종료일"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Reset Button */}
                                <button
                                    onClick={() => {
                                        setExcludeKeywords('');
                                        setSelectedCourts([]);
                                        setSelectedCaseTypes([]);
                                        setSelectedResults([]);
                                        setDateRange({ start: '', end: '' });
                                        setSortOrder('relevance');
                                        setCurrentPage(1);
                                    }}
                                    className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition"
                                >
                                    필터 초기화
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Initial State - Popular Searches */}
            {!searchQuery && (
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </span>
                                주요 판사
                            </h3>
                            <div className="space-y-2">
                                {['명재권', '이진관', '류경진', '마성영', '김선희'].map(name => (
                                    <button
                                        key={name}
                                        onClick={() => setSearchQuery(name)}
                                        className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </span>
                                인기 검색 법령
                            </h3>
                            <div className="space-y-2">
                                {['형법', '민법', '헌법', '상법', '형사소송법'].map(name => (
                                    <button
                                        key={name}
                                        onClick={() => setSearchQuery(name)}
                                        className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition"
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </span>
                                주요 인물
                            </h3>
                            <div className="space-y-2">
                                {['윤석열', '한덕수', '이상민', '김용현', '김건희'].map(name => (
                                    <button
                                        key={name}
                                        onClick={() => setSearchQuery(name)}
                                        className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition"
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* External Links */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">공식 법률 데이터베이스</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                        href="https://portal.scourt.go.kr/pgp/index.on?m=PGP1001M01&l=N&c=900"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition"
                    >
                        <span className="text-2xl">⚖️</span>
                        <div>
                            <p className="font-semibold text-gray-900">사법정보공개포털</p>
                            <p className="text-xs text-gray-500">대법원 재판정보</p>
                        </div>
                    </a>
                    <a
                        href="https://search.ccourt.go.kr/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition"
                    >
                        <span className="text-2xl">🏛️</span>
                        <div>
                            <p className="font-semibold text-gray-900">헌법재판소</p>
                            <p className="text-xs text-gray-500">헌재 결정문 검색</p>
                        </div>
                    </a>
                    <a
                        href="https://www.law.go.kr/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition"
                    >
                        <span className="text-2xl">📜</span>
                        <div>
                            <p className="font-semibold text-gray-900">국가법령정보센터</p>
                            <p className="text-xs text-gray-500">법령 + 판례 통합</p>
                        </div>
                    </a>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8 mt-12">
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

export default CaseSearch;
