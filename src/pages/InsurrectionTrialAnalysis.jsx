import { useState, useEffect, Fragment } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';

// 판결 데이터 (기본 fallback)
const DEFAULT_VERDICTS = [
    {
        date: '2026.01.06',
        defendant: '윤석열',
        court: '서울중앙지법',
        charge: '체포방해 (직권남용권리행사방해, 허위공문서작성, 대통령기록물법 위반)',
        sentence: '징역 5년',
        prosecution: '-',
        status: 'convicted',
        detail: '공수처 체포 방해 및 경호처 동원'
    },
    {
        date: '2026.01.22',
        defendant: '한덕수',
        court: '서울중앙지법 형사합의33부',
        judge: '이진관 부장판사',
        charge: '내란중요임무종사, 허위공문서작성, 대통령기록물법 위반, 헌재 위증',
        sentence: '징역 23년 (법정구속)',
        prosecution: '징역 15년 (조은석 특검)',
        status: 'convicted',
        detail: '구형보다 8년 높은 징역 23년 선고'
    },
    {
        date: '2026.01.28',
        defendant: '김건희',
        court: '서울중앙지법 형사합의27부',
        judge: '우인성 부장판사',
        charge: '도이치모터스 주가조작, 정치자금법 위반',
        sentence: '징역 1년 8개월 (주가조작 무죄)',
        prosecution: '징역 15년',
        status: 'partial',
        detail: '주가조작 무죄, 명품수수 및 정치자금법만 유죄'
    },
    {
        date: '2026.02.12',
        defendant: '이상민',
        court: '서울중앙지법 형사합의32부',
        judge: '류경진 부장판사',
        charge: '내란중요임무종사, 헌재 위증',
        sentence: '징역 7년',
        prosecution: '징역 15년',
        status: 'convicted',
        detail: '언론사 단전 및 단수 지시 전달, 직권남용 무죄'
    },
    {
        date: '2026.02.13',
        defendant: '송영길',
        court: '서울고등법원 형사1부',
        judge: '윤성식 부장판사',
        charge: '돈봉투 살포, 불법 정치자금 수수',
        sentence: '전부 무죄 (1심 징역 2년 뒤집음)',
        prosecution: '-',
        status: 'acquitted',
        detail: '이정근 녹음파일 증거능력 불인정, 위법수집 증거 판단'
    },
    {
        date: '2026.02.19',
        defendant: '윤석열',
        court: '서울중앙지법 형사합의25부',
        judge: '지귀연 부장판사',
        charge: '내란 수괴 (형법 제87조)',
        sentence: '무기징역',
        prosecution: '사형 (내란특검 구형)',
        status: 'convicted',
        detail: '"성경을 읽는다는 이유로 촛불을 훔칠 수는 없다" — 대통령 내란죄 유죄 선고'
    },
    {
        date: '2026.02.19',
        defendant: '김용현',
        court: '서울중앙지법 형사합의25부',
        judge: '지귀연 부장판사',
        charge: '내란중요임무종사 (형법 제87조)',
        sentence: '징역 30년',
        prosecution: '무기징역',
        status: 'convicted',
        detail: '비상계엄을 주도적으로 준비, 대통령의 비이성적 결심을 조장'
    },
    {
        date: '2026.02.19',
        defendant: '노상원',
        court: '서울중앙지법 형사합의25부',
        judge: '지귀연 부장판사',
        charge: '내란중요임무종사 (형법 제87조)',
        sentence: '징역 18년',
        prosecution: '징역 30년',
        status: 'convicted',
        detail: '계엄 사전 모의, 포고령 초안 작성, 선관위 침입 지휘. 예비역 민간인 신분'
    },
    {
        date: '2026.02.19',
        defendant: '조지호',
        court: '서울중앙지법 형사합의25부',
        judge: '지귀연 부장판사',
        charge: '내란중요임무종사 (형법 제87조)',
        sentence: '징역 12년',
        prosecution: '징역 20년',
        status: 'convicted',
        detail: '경찰청장으로서 포고령 위법성 미검토, 군의 국회 진입 조력, 의원 출입 차단'
    },
    {
        date: '2026.02.19',
        defendant: '김봉식',
        court: '서울중앙지법 형사합의25부',
        judge: '지귀연 부장판사',
        charge: '내란중요임무종사 (형법 제87조)',
        sentence: '징역 10년',
        prosecution: '징역 15년',
        status: 'convicted',
        detail: '서울경찰청장으로서 국회 봉쇄 가담, 안가회동 문건 수령'
    },
    {
        date: '2026.02.19',
        defendant: '목현태',
        court: '서울중앙지법 형사합의25부',
        judge: '지귀연 부장판사',
        charge: '내란중요임무종사 (형법 제87조)',
        sentence: '징역 3년',
        prosecution: '징역 12년',
        status: 'convicted',
        detail: '국회경비대장으로서 국회의원 출입 차단, 국회의장 4번 수색 지시'
    },
    {
        date: '2026.02.19',
        defendant: '김용군',
        court: '서울중앙지법 형사합의25부',
        judge: '지귀연 부장판사',
        charge: '내란중요임무종사 (형법 제87조)',
        sentence: '무죄',
        prosecution: '징역 10년',
        status: 'acquitted',
        detail: '국헌문란 목적을 미필적으로라도 인식·공유했다는 증거 부족'
    },
    {
        date: '2026.02.19',
        defendant: '윤승영',
        court: '서울중앙지법 형사합의25부',
        judge: '지귀연 부장판사',
        charge: '내란중요임무종사 (형법 제87조)',
        sentence: '무죄',
        prosecution: '징역 10년',
        status: 'acquitted',
        detail: '범행 계획 공모 또는 국헌문란 목적 인식·공유 증거 부족'
    }
];

// 1심 재판부 데이터 (기본 fallback)
const DEFAULT_FIRST_COURTS = [
    {
        division: '형사합의25부',
        chief: '지귀연',
        chiefClass: 31,
        associates: [
            { name: '김의담', classYear: 46 },
            { name: '이완규', classYear: 36 }
        ],
        mainCase: '윤석열 내란 수괴'
    },
    {
        division: '형사합의27부',
        chief: '우인성',
        chiefClass: 29,
        associates: [],
        mainCase: '김건희 주가조작'
    },
    {
        division: '형사합의32부',
        chief: '류경진',
        chiefClass: 31,
        associates: [],
        mainCase: '이상민 내란'
    },
    {
        division: '형사합의33부',
        chief: '이진관',
        chiefClass: 32,
        associates: [],
        mainCase: '한덕수 내란'
    }
];

// 항소심 재판부 데이터 (기본 fallback)
const DEFAULT_APPEAL_COURTS = [
    {
        division: '형사1부',
        members: [
            { name: '윤성식', classYear: 24, role: '재판장' },
            { name: '민성철', classYear: 29, role: '배석' },
            { name: '이동현', classYear: 36, role: '배석' }
        ],
        feature: '일반 합의부'
    },
    {
        division: '형사12부',
        members: [
            { name: '이승철', classYear: 26, role: '배석' },
            { name: '조진구', classYear: 29, role: '배석' },
            { name: '김민아', classYear: 34, role: '배석' }
        ],
        feature: '대등재판부 (부장판사 없음)'
    }
];

// 송영길 판결 상세 데이터
const SONG_ANALYSIS = {
    firstInstance: {
        court: '서울중앙지법',
        verdict: '징역 2년',
        date: '2025년',
        keyPoints: [
            '이정근 녹음파일을 핵심 증거로 채택',
            '돈봉투 살포 공모 혐의 유죄 인정',
            '정치자금법 위반 유죄'
        ]
    },
    appeal: {
        court: '서울고등법원 형사1부',
        verdict: '전부 무죄',
        date: '2026.02.13',
        judge: '윤성식 부장판사 (24기)',
        keyPoints: [
            '이정근 녹음파일 증거능력 불인정 (위법수집 증거)',
            '핵심 증거 배제로 공소사실 전부 무죄',
            '1심 유죄 판결 완전 뒤집음'
        ]
    },
    legalSignificance: [
        '위법수집 증거 배제 원칙의 엄격 적용',
        '수사기관의 증거 수집 방법에 대한 사법적 통제 강화',
        '1심과 항소심의 증거능력 판단 기준 차이 부각',
        '정치적 사건에서도 적법절차 원칙 관철'
    ]
};

// 상태별 색상/라벨 매핑
const STATUS_CONFIG = {
    convicted: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', label: '유죄', dot: 'bg-red-500' },
    acquitted: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', label: '무죄', dot: 'bg-green-500' },
    partial: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', label: '일부유죄', dot: 'bg-yellow-500' },
    pending: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', label: '선고 대기', dot: 'bg-blue-500' }
};

// 통계 계산
function computeStats(verdictsData) {
    const convicted = verdictsData.filter(v => v.status === 'convicted').length;
    const acquitted = verdictsData.filter(v => v.status === 'acquitted').length;
    const partial = verdictsData.filter(v => v.status === 'partial').length;
    const pending = verdictsData.filter(v => v.status === 'pending').length;

    // 구형 대비 선고 비율 (숫자 추출 가능한 건만)
    const sentenceRatios = [];
    verdictsData.forEach(v => {
        const sentenceMatch = (v.sentence || '').match(/(\d+)년/);
        const prosMatch = (v.prosecution || '').match(/(\d+)년/);
        if (sentenceMatch && prosMatch) {
            const sentenceYears = parseInt(sentenceMatch[1], 10);
            const prosYears = parseInt(prosMatch[1], 10);
            sentenceRatios.push({
                defendant: v.defendant,
                sentence: sentenceYears,
                prosecution: prosYears,
                ratio: Math.round((sentenceYears / prosYears) * 100)
            });
        }
    });

    return { convicted, acquitted, partial, pending, sentenceRatios };
}

// 기수 분석 계산
function computeClassAnalysis(firstInstanceCourts, appealCourtsData) {
    const firstInstanceClasses = [];
    firstInstanceCourts.forEach(court => {
        if (court.chiefClass) firstInstanceClasses.push(court.chiefClass);
        (court.associates || []).forEach(a => { if (a.classYear) firstInstanceClasses.push(a.classYear); });
    });

    const appealClasses = [];
    appealCourtsData.forEach(court => {
        (court.members || []).forEach(m => { if (m.classYear) appealClasses.push(m.classYear); });
    });

    const avg = (arr) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;

    // 기수별 인원 분포
    const allClasses = [...firstInstanceClasses, ...appealClasses];
    const distribution = {};
    allClasses.forEach(c => { distribution[c] = (distribution[c] || 0) + 1; });

    return {
        firstInstanceAvg: avg(firstInstanceClasses),
        appealAvg: avg(appealClasses),
        firstInstanceClasses,
        appealClasses,
        distribution: Object.entries(distribution).sort((a, b) => Number(a[0]) - Number(b[0]))
    };
}

export default function InsurrectionTrialAnalysis() {
    const [activeTab, setActiveTab] = useState('overview');
    const [courtTab, setCourtTab] = useState('first');
    const [verdicts, setVerdicts] = useState(DEFAULT_VERDICTS);
    const [firstCourts, setFirstCourts] = useState(DEFAULT_FIRST_COURTS);
    const [appealCourts, setAppealCourts] = useState(DEFAULT_APPEAL_COURTS);
    const [loading, setLoading] = useState(true);

    // Firestore에서 최신 데이터 가져오기
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 판결 데이터
                const verdictsSnap = await getDocs(collection(db, 'insurrectionVerdicts'));
                if (verdictsSnap.size > 0) {
                    const firestoreVerdicts = [];
                    verdictsSnap.forEach(doc => {
                        const data = doc.data();
                        firestoreVerdicts.push({ id: doc.id, ...data });
                    });
                    // date 기준 정렬
                    firestoreVerdicts.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
                    setVerdicts(firestoreVerdicts);
                }

                // 재판부 데이터
                const courtsSnap = await getDocs(collection(db, 'insurrectionCourts'));
                if (courtsSnap.size > 0) {
                    const firstInstance = [];
                    const appeal = [];
                    courtsSnap.forEach(doc => {
                        const data = doc.data();
                        if (data.type === 'appeal') {
                            appeal.push(data);
                        } else {
                            firstInstance.push(data);
                        }
                    });
                    if (firstInstance.length > 0) setFirstCourts(firstInstance);
                    if (appeal.length > 0) setAppealCourts(appeal);
                }
            } catch (error) {
                console.error('Failed to fetch trial data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const stats = computeStats(verdicts);
    const classAnalysis = computeClassAnalysis(firstCourts, appealCourts);

    const tabs = [
        { id: 'overview', label: '종합 현황' },
        { id: 'courts', label: '재판부 구성' },
        { id: 'timeline', label: '판결 타임라인' },
        { id: 'song', label: '송영길 판결 분석' },
        { id: 'classAnalysis', label: '기수 분석' },
        { id: 'legal', label: '형법 제91조 분석' }
    ];

    return (
        <>
            <Header />
            <div className="bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen pt-24">
                <div className="container mx-auto px-4 py-8 max-w-6xl">

                    {/* 로딩 인디케이터 */}
                    {loading && (
                        <div className="text-center py-4 mb-4">
                            <div className="inline-block w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-500 mt-2">최신 데이터 확인 중...</p>
                        </div>
                    )}

                    {/* 헤더 영역 */}
                    <div className="text-center mb-10">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                            내란 재판 종합분석
                        </h1>
                        <p className="text-gray-500 text-lg">
                            12.3 내란 사건 재판 현황 및 판결 분석
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                유죄 {stats.convicted}건
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                무죄 {stats.acquitted}건
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                일부유죄 {stats.partial}건
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                대기 {stats.pending}건
                            </span>
                        </div>
                    </div>

                    {/* 탭 네비게이션 */}
                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* 종합 현황 탭 */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* 통계 카드 그리드 */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard label="유죄" count={stats.convicted} color="red" icon="⚖" />
                                <StatCard label="무죄" count={stats.acquitted} color="green" icon="✓" />
                                <StatCard label="일부유죄" count={stats.partial} color="yellow" icon="⚠" />
                                <StatCard label="선고 대기" count={stats.pending} color="blue" icon="⌛" />
                            </div>

                            {/* 구형 대비 선고 비율 차트 */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">구형 대비 선고 비율</h2>
                                <div className="space-y-4">
                                    {stats.sentenceRatios.map((item, idx) => (
                                        <div key={idx}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-700">{item.defendant}</span>
                                                <span className="text-sm text-gray-500">
                                                    선고 {item.sentence}년 / 구형 {item.prosecution}년 ({item.ratio}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-4 relative">
                                                {/* 구형 (전체 바) */}
                                                <div className="absolute inset-0 bg-gray-300 rounded-full"></div>
                                                {/* 선고 비율 */}
                                                <div
                                                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                                                        item.ratio > 100 ? 'bg-red-500' : item.ratio > 50 ? 'bg-orange-400' : 'bg-blue-500'
                                                    }`}
                                                    style={{ width: `${Math.min(item.ratio, 100)}%` }}
                                                ></div>
                                                {item.ratio > 100 && (
                                                    <div
                                                        className="absolute inset-y-0 bg-red-600 rounded-r-full opacity-60"
                                                        style={{ left: '100%', width: `${Math.min(item.ratio - 100, 60)}%` }}
                                                    ></div>
                                                )}
                                            </div>
                                            {item.ratio > 100 && (
                                                <p className="text-xs text-red-600 mt-1 font-medium">
                                                    구형 대비 {item.ratio - 100}% 초과 선고
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {stats.sentenceRatios.length === 0 && (
                                    <p className="text-gray-400 text-center py-4">비교 가능한 데이터가 없습니다.</p>
                                )}
                            </div>

                            {/* 전체 판결 요약 테이블 */}
                            <div className="bg-white rounded-xl shadow-lg p-6 overflow-x-auto">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">전체 판결 요약</h2>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200">
                                            <th className="text-left py-3 px-2 font-semibold text-gray-600">일자</th>
                                            <th className="text-left py-3 px-2 font-semibold text-gray-600">피고인</th>
                                            <th className="text-left py-3 px-2 font-semibold text-gray-600 hidden md:table-cell">혐의</th>
                                            <th className="text-left py-3 px-2 font-semibold text-gray-600">구형</th>
                                            <th className="text-left py-3 px-2 font-semibold text-gray-600">선고</th>
                                            <th className="text-left py-3 px-2 font-semibold text-gray-600">결과</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {verdicts.map((v, idx) => {
                                            const cfg = STATUS_CONFIG[v.status] || STATUS_CONFIG.pending;
                                            return (
                                                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-2 text-gray-600 whitespace-nowrap">{v.date || '-'}</td>
                                                    <td className="py-3 px-2 font-medium text-gray-800">{v.defendant || '-'}</td>
                                                    <td className="py-3 px-2 text-gray-600 hidden md:table-cell max-w-xs truncate">{v.charge || '-'}</td>
                                                    <td className="py-3 px-2 text-gray-600">{v.prosecution || '-'}</td>
                                                    <td className="py-3 px-2 font-medium text-gray-800">{v.sentence || '-'}</td>
                                                    <td className="py-3 px-2">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                                                            {cfg.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 재판부 구성 탭 */}
                    {activeTab === 'courts' && (
                        <div className="space-y-6">
                            {/* 1심/항소심 토글 */}
                            <div className="flex justify-center gap-2 mb-4">
                                <button
                                    onClick={() => setCourtTab('first')}
                                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                        courtTab === 'first'
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                    }`}
                                >
                                    1심 (서울중앙지방법원)
                                </button>
                                <button
                                    onClick={() => setCourtTab('appeal')}
                                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                        courtTab === 'appeal'
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                    }`}
                                >
                                    항소심 (서울고등법원)
                                </button>
                            </div>

                            {courtTab === 'first' && (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {firstCourts.map((court, idx) => (
                                        <div key={idx} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-lg font-bold text-gray-800">{court.division}</h3>
                                                <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full font-medium">1심</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">재판장</span>
                                                    <span className="font-medium text-gray-800">{court.chief}</span>
                                                    <span className="text-xs text-gray-400">({court.chiefClass}기)</span>
                                                </div>
                                                {court.associates.length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">배석</span>
                                                        {court.associates.map((a, i) => (
                                                            <span key={i} className="text-sm text-gray-700">
                                                                {a.name} <span className="text-xs text-gray-400">({a.classYear}기)</span>
                                                                {i < court.associates.length - 1 && ', '}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {court.associates.length === 0 && (
                                                    <p className="text-xs text-gray-400">배석판사 정보 미공개</p>
                                                )}
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <span className="text-sm text-gray-500">주요 사건: </span>
                                                <span className="text-sm font-medium text-gray-700">{court.mainCase}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {courtTab === 'appeal' && (
                                <div className="space-y-4">
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-amber-800">
                                            <span className="font-bold">2026.02.05 지정</span> - 서울고등법원 항소심 재판부가 배정되었습니다.
                                        </p>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {appealCourts.map((court, idx) => (
                                            <div key={idx} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-500">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-lg font-bold text-gray-800">{court.division}</h3>
                                                    <span className="text-xs px-2 py-1 bg-amber-50 text-amber-600 rounded-full font-medium">항소심</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {court.members.map((m, i) => (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                                                m.role === '재판장'
                                                                    ? 'bg-amber-100 text-amber-700'
                                                                    : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {m.role}
                                                            </span>
                                                            <span className="font-medium text-gray-800">{m.name}</span>
                                                            <span className="text-xs text-gray-400">({m.classYear}기)</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-3 pt-3 border-t border-gray-100">
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                        court.feature.includes('대등')
                                                            ? 'bg-purple-50 text-purple-600'
                                                            : 'bg-gray-50 text-gray-600'
                                                    }`}>
                                                        {court.feature}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 판결 타임라인 탭 */}
                    {activeTab === 'timeline' && (
                        <div className="space-y-4">
                            <div className="relative">
                                {/* 타임라인 세로줄 */}
                                <div className="absolute left-4 md:left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

                                {verdicts.map((v, idx) => {
                                    const cfg = STATUS_CONFIG[v.status] || STATUS_CONFIG.pending;
                                    return (
                                        <div key={idx} className="relative pl-12 md:pl-20 pb-6">
                                            {/* 타임라인 도트 */}
                                            <div className={`absolute left-2.5 md:left-6.5 top-2 w-3.5 h-3.5 rounded-full border-2 border-white shadow ${cfg.dot}`}></div>

                                            <div className={`bg-white rounded-xl shadow-lg p-5 border-l-4 ${cfg.border}`}>
                                                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                                    <div>
                                                        <span className="text-xs text-gray-400 font-medium">{v.date || '-'}</span>
                                                        <h3 className="text-lg font-bold text-gray-800">{v.defendant || '-'}</h3>
                                                        <p className="text-sm text-gray-500">{v.court || ''}{v.judge ? ` | ${v.judge}` : ''}</p>
                                                    </div>
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
                                                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`}></span>
                                                        {cfg.label}
                                                    </span>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-3 mt-3">
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <p className="text-xs text-gray-400 mb-1">혐의</p>
                                                        <p className="text-sm text-gray-700">{v.charge || '-'}</p>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <p className="text-xs text-gray-400 mb-1">구형 / 선고</p>
                                                        <p className="text-sm text-gray-700">
                                                            <span className="text-gray-500">구형:</span> {v.prosecution || '-'}
                                                        </p>
                                                        <p className="text-sm font-medium text-gray-800">
                                                            <span className="text-gray-500">선고:</span> {v.sentence || '-'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <p className="mt-3 text-sm text-gray-600 bg-slate-50 rounded-lg p-3">
                                                    {v.detail || ''}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 송영길 판결 분석 탭 */}
                    {activeTab === 'song' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-2">송영길 돈봉투 사건 판결 분석</h2>
                                <p className="text-sm text-gray-500 mb-6">1심 유죄에서 항소심 전부 무죄 - 증거능력 판단이 핵심</p>

                                {/* 1심 vs 2심 비교 */}
                                <div className="grid md:grid-cols-2 gap-4 mb-6">
                                    {/* 1심 */}
                                    <div className="border-2 border-red-200 rounded-xl p-5 bg-red-50/30">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                            <h3 className="font-bold text-gray-800">1심 결과</h3>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-1">{SONG_ANALYSIS.firstInstance.court}</p>
                                        <p className="text-2xl font-bold text-red-600 mb-3">{SONG_ANALYSIS.firstInstance.verdict}</p>
                                        <ul className="space-y-2">
                                            {SONG_ANALYSIS.firstInstance.keyPoints.map((point, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                    <span className="text-red-400 mt-0.5 shrink-0">&#8226;</span>
                                                    {point}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* 2심 */}
                                    <div className="border-2 border-green-200 rounded-xl p-5 bg-green-50/30">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                            <h3 className="font-bold text-gray-800">항소심 결과</h3>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-1">{SONG_ANALYSIS.appeal.court} | {SONG_ANALYSIS.appeal.judge}</p>
                                        <p className="text-2xl font-bold text-green-600 mb-3">{SONG_ANALYSIS.appeal.verdict}</p>
                                        <ul className="space-y-2">
                                            {SONG_ANALYSIS.appeal.keyPoints.map((point, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                    <span className="text-green-400 mt-0.5 shrink-0">&#8226;</span>
                                                    {point}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* 핵심 쟁점 */}
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
                                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        핵심 쟁점: 증거능력 판단
                                    </h3>
                                    <div className="space-y-3 text-sm text-gray-700">
                                        <div className="bg-white rounded-lg p-3">
                                            <p className="font-medium text-gray-800 mb-1">이정근 녹음파일</p>
                                            <p>1심에서는 핵심 유죄 증거로 채택되었으나, 항소심에서는 위법하게 수집된 증거로 판단하여 증거능력을 부인했습니다.</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3">
                                            <p className="font-medium text-gray-800 mb-1">위법수집증거 배제법칙</p>
                                            <p>형사소송법 제308조의2에 따라 적법한 절차에 따르지 않고 수집한 증거는 증거로 할 수 없다는 원칙이 엄격하게 적용되었습니다.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 법적 의미 */}
                                <div className="bg-white border border-gray-200 rounded-xl p-5">
                                    <h3 className="font-bold text-gray-800 mb-3">법적 의미</h3>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {SONG_ANALYSIS.legalSignificance.map((item, i) => (
                                            <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                                                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                                                    {i + 1}
                                                </span>
                                                <p className="text-sm text-gray-700">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 기수 분석 탭 */}
                    {activeTab === 'classAnalysis' && (
                        <div className="space-y-6">
                            {/* 평균 기수 비교 */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">사법연수원 기수 분석</h2>
                                <div className="grid md:grid-cols-2 gap-4 mb-6">
                                    <div className="bg-indigo-50 rounded-xl p-5 text-center">
                                        <p className="text-sm text-indigo-600 font-medium mb-1">1심 재판부 평균 기수</p>
                                        <p className="text-4xl font-bold text-indigo-700">{classAnalysis.firstInstanceAvg}<span className="text-lg">기</span></p>
                                        <p className="text-xs text-gray-500 mt-1">{classAnalysis.firstInstanceClasses.length}명 기준</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-5 text-center">
                                        <p className="text-sm text-amber-600 font-medium mb-1">항소심 재판부 평균 기수</p>
                                        <p className="text-4xl font-bold text-amber-700">{classAnalysis.appealAvg}<span className="text-lg">기</span></p>
                                        <p className="text-xs text-gray-500 mt-1">{classAnalysis.appealClasses.length}명 기준</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-gray-600">
                                        항소심 재판부의 평균 기수가 <span className="font-bold text-gray-800">
                                        {(classAnalysis.firstInstanceAvg - classAnalysis.appealAvg).toFixed(1)}기</span> 낮아(선임),
                                        1심 대비 경력이 더 풍부한 판사들로 구성되어 있습니다.
                                        기수가 낮을수록 임관이 빠르고 경력이 긴 선배 판사를 의미합니다.
                                    </p>
                                </div>
                            </div>

                            {/* 기수별 인원 분포 */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">기수별 인원 분포</h3>
                                <div className="space-y-3">
                                    {classAnalysis.distribution.map(([classYear, count]) => {
                                        const maxCount = Math.max(...classAnalysis.distribution.map(d => d[1]));
                                        const widthPercent = (count / maxCount) * 100;
                                        const isFirstInstance = classAnalysis.firstInstanceClasses.includes(Number(classYear));
                                        const isAppeal = classAnalysis.appealClasses.includes(Number(classYear));
                                        return (
                                            <div key={classYear} className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-gray-600 w-12 text-right">{classYear}기</span>
                                                <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
                                                    <div
                                                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                                                            isFirstInstance && isAppeal
                                                                ? 'bg-gradient-to-r from-indigo-500 to-amber-500'
                                                                : isAppeal
                                                                    ? 'bg-amber-400'
                                                                    : 'bg-indigo-400'
                                                        }`}
                                                        style={{ width: `${widthPercent}%` }}
                                                    ></div>
                                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                                                        {count}명
                                                    </span>
                                                </div>
                                                <div className="flex gap-1 w-20">
                                                    {isFirstInstance && <span className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded">1심</span>}
                                                    {isAppeal && <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded">2심</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 범례 */}
                                <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-indigo-400"></span>
                                        <span className="text-xs text-gray-600">1심 (서울중앙지법)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                                        <span className="text-xs text-gray-600">항소심 (서울고법)</span>
                                    </div>
                                </div>
                            </div>

                            {/* 전체 재판관 기수 목록 */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">재판관 전체 기수 현황</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-gray-200">
                                                <th className="text-left py-3 px-2 font-semibold text-gray-600">이름</th>
                                                <th className="text-left py-3 px-2 font-semibold text-gray-600">기수</th>
                                                <th className="text-left py-3 px-2 font-semibold text-gray-600">소속</th>
                                                <th className="text-left py-3 px-2 font-semibold text-gray-600">역할</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {firstCourts.map((court) => (
                                                <Fragment key={court.division}>
                                                    <tr className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="py-2 px-2 font-medium text-gray-800">{court.chief}</td>
                                                        <td className="py-2 px-2 text-gray-600">{court.chiefClass}기</td>
                                                        <td className="py-2 px-2">
                                                            <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded">1심 {court.division}</span>
                                                        </td>
                                                        <td className="py-2 px-2 text-gray-600">재판장</td>
                                                    </tr>
                                                    {court.associates.map((a, i) => (
                                                        <tr key={`${court.division}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="py-2 px-2 font-medium text-gray-800">{a.name}</td>
                                                            <td className="py-2 px-2 text-gray-600">{a.classYear}기</td>
                                                            <td className="py-2 px-2">
                                                                <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded">1심 {court.division}</span>
                                                            </td>
                                                            <td className="py-2 px-2 text-gray-600">배석</td>
                                                        </tr>
                                                    ))}
                                                </Fragment>
                                            ))}
                                            {appealCourts.map((court) => (
                                                court.members.map((m, i) => (
                                                    <tr key={`appeal-${court.division}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="py-2 px-2 font-medium text-gray-800">{m.name}</td>
                                                        <td className="py-2 px-2 text-gray-600">{m.classYear}기</td>
                                                        <td className="py-2 px-2">
                                                            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded">항소심 {court.division}</span>
                                                        </td>
                                                        <td className="py-2 px-2 text-gray-600">{m.role}</td>
                                                    </tr>
                                                ))
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 형법 제91조 분석 탭 */}
                    {activeTab === 'legal' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-2">형법 제91조 제2호 — 국헌문란의 목적</h2>
                                <p className="text-sm text-gray-500 mb-6">내란죄 성립의 핵심 요건 분석</p>

                                {/* 조문 원문 */}
                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6">
                                    <h3 className="font-bold text-indigo-800 mb-3">형법 제91조 (정의)</h3>
                                    <div className="space-y-2 text-sm text-gray-700">
                                        <p>본 장에서 "국헌문란"이라 함은 다음 각 호의 1에 해당하는 행위를 말한다.</p>
                                        <div className="bg-white rounded-lg p-3 ml-4">
                                            <p className="text-gray-600">제1호: 헌법 또는 법률에 정한 절차에 의하지 아니하고 헌법 또는 법률의 기능을 소멸시키는 것</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 ml-4 border-2 border-indigo-300">
                                            <p className="font-medium text-indigo-800">제2호: 헌법에 의하여 설치된 국가기관을 강압에 의하여 전복 또는 그 권능행사를 불가능하게 하는 것</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 대법원 판례 해석 */}
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
                                    <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        대법원 판례 해석
                                    </h3>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        대법원 판례에 따르면, 형법 제91조 제2호에서 명시한 <span className="font-bold text-amber-800">"헌법에 의하여 설치된 국가 기관을 강압에 의하여 전복 또는 그 권능 행사를 불가능하게 하는 것"</span>의 의미는
                                        해당 국가 기관을 제도적으로 영구히 폐지하는 경우뿐만 아니라,
                                        <span className="font-bold text-red-700"> 사실상 상당 기간 그 기능을 제대로 할 수 없게 만드는 것</span>까지 포함합니다.
                                    </p>
                                </div>

                                {/* 주요 법적 쟁점 3가지 */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-gray-800">주요 법적 쟁점</h3>

                                    {/* 쟁점 1: 대통령의 내란죄 주체 */}
                                    <div className="border border-red-200 rounded-xl p-5 bg-red-50/30">
                                        <div className="flex items-start gap-3 mb-3">
                                            <span className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                            <div>
                                                <h4 className="font-bold text-gray-800">대통령의 내란죄 주체 인정</h4>
                                                <p className="text-sm text-gray-500 mt-1">형법 제91조 제2호 + 형법 제87조 적용</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed ml-11">
                                            형법 제91조 제2호가 적용되는 '국헌문란 목적 내란죄'는 <span className="font-bold">대통령도 저지를 수 있습니다</span>.
                                            대통령이 군을 동원하여 국회를 강제로 점령하거나 국회의원을 체포함으로써 상당 기간 국회 활동을 저지하고 마비시키려는 목적을 가졌다면
                                            국헌문란 목적을 가진 폭동으로 인정되어 내란죄에 해당합니다.
                                        </p>
                                        <div className="mt-3 ml-11 grid md:grid-cols-3 gap-2">
                                            <div className="bg-red-100 rounded-lg p-2">
                                                <p className="text-xs font-medium text-red-700">검찰 입장</p>
                                                <p className="text-xs text-gray-600 mt-1">군 동원 국회 점령 시도는 명백한 내란수괴 행위</p>
                                            </div>
                                            <div className="bg-blue-100 rounded-lg p-2">
                                                <p className="text-xs font-medium text-blue-700">변호인 입장</p>
                                                <p className="text-xs text-gray-600 mt-1">헌법상 국군통수권자의 고유 권한 행사</p>
                                            </div>
                                            <div className="bg-purple-100 rounded-lg p-2">
                                                <p className="text-xs font-medium text-purple-700">법원 판단</p>
                                                <p className="text-xs text-gray-600 mt-1">대통령도 내란죄 주체, 국헌문란 목적 군 동원은 폭동</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 쟁점 2: 비상계엄과의 관계 */}
                                    <div className="border border-amber-200 rounded-xl p-5 bg-amber-50/30">
                                        <div className="flex items-start gap-3 mb-3">
                                            <span className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                            <div>
                                                <h4 className="font-bold text-gray-800">비상계엄 선포와의 관계</h4>
                                                <p className="text-sm text-gray-500 mt-1">계엄권의 한계와 내란죄 성립 조건</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed ml-11">
                                            원칙적으로 대통령의 비상계엄 선포 자체는 사법 심사의 대상이 되기 어렵고 내란에 해당하지 않습니다.
                                            그러나 비상계엄을 통해서도 할 수 없는 권한의 행사, 즉
                                            <span className="font-bold text-amber-800"> 헌법과 계엄법이 보장하는 국회의 권한이나 행정 및 사법의 본질적인 기능을 상당 기간 침해하고 마비시킬 목적</span>으로
                                            비상계엄을 선포했다면 형법 제91조 제2호에 따른 국헌문란 목적 내란죄가 성립할 수 있습니다.
                                        </p>
                                        <div className="mt-3 ml-11 bg-white rounded-lg p-3 border border-amber-200">
                                            <p className="text-xs text-gray-600">
                                                <span className="font-bold text-amber-700">본 사건 적용:</span> 12.3 비상계엄은 국회의 계엄해제 의결권을 방해하고,
                                                국회의원 출입을 차단하여 국회의 헌법적 기능을 마비시킬 목적으로 선포된 것으로 법원이 판단
                                            </p>
                                        </div>
                                    </div>

                                    {/* 쟁점 3: 공범 성립 기준 */}
                                    <div className="border border-green-200 rounded-xl p-5 bg-green-50/30">
                                        <div className="flex items-start gap-3 mb-3">
                                            <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                                            <div>
                                                <h4 className="font-bold text-gray-800">내란죄 공범 성립 기준</h4>
                                                <p className="text-sm text-gray-500 mt-1">집합범의 특성과 목적 인식 요건</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed ml-11">
                                            내란죄는 다수가 결합하는 <span className="font-bold">집합범</span>의 성격을 가집니다.
                                            공범으로 인정되려면 단순히 비상계엄 선포 등의 폭동 행위에 관여한 사실만으로는 부족하며,
                                            <span className="font-bold text-green-800"> 반드시 이 '국헌문란의 목적'을 미필적으로라도 인식하고 공유</span>하면서
                                            가담한 사실이 인정되어야만 합니다.
                                        </p>
                                        <div className="mt-3 ml-11 bg-white rounded-lg p-3 border border-green-200">
                                            <p className="text-xs text-gray-600">
                                                <span className="font-bold text-green-700">본 사건 적용:</span> 이 기준에 따라 김용군(방첩사 HQ요원)과 윤승영(수사기획조정관)은
                                                국헌문란 목적을 인식·공유했다는 증거가 부족하여 무죄 선고
                                            </p>
                                        </div>
                                        <div className="mt-3 ml-11 grid md:grid-cols-2 gap-2">
                                            <div className="bg-red-50 rounded-lg p-2 border border-red-100">
                                                <p className="text-xs font-medium text-red-700">유죄 인정 (6명)</p>
                                                <p className="text-xs text-gray-600 mt-1">윤석열, 김용현, 노상원, 조지호, 김봉식, 목현태 — 국헌문란 목적 인식·공유 인정</p>
                                            </div>
                                            <div className="bg-green-50 rounded-lg p-2 border border-green-100">
                                                <p className="text-xs font-medium text-green-700">무죄 선고 (2명)</p>
                                                <p className="text-xs text-gray-600 mt-1">김용군, 윤승영 — 국헌문란 목적 인식·공유 증거 부족</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 푸터 정보 */}
                    <div className="mt-12 text-center text-sm text-gray-400">
                        <p>본 페이지는 공개된 재판 정보를 바탕으로 작성되었습니다.</p>
                        <p className="mt-1">최종 업데이트: 2026.02.20</p>
                    </div>
                </div>
            </div>
        </>
    );
}

// 통계 카드 컴포넌트
function StatCard({ label, count, color, icon }) {
    const colorMap = {
        red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', iconBg: 'bg-red-100' },
        green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', iconBg: 'bg-green-100' },
        yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', iconBg: 'bg-yellow-100' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', iconBg: 'bg-blue-100' }
    };
    const c = colorMap[color];

    return (
        <div className={`${c.bg} border ${c.border} rounded-xl p-4 text-center`}>
            <div className={`inline-flex items-center justify-center w-10 h-10 ${c.iconBg} rounded-full mb-2`}>
                <span className={`text-lg ${c.text}`}>{icon}</span>
            </div>
            <p className={`text-3xl font-bold ${c.text}`}>{count}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
        </div>
    );
}
