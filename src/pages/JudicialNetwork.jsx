import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';

// =============================================================================
// WEF 스타일 방사형 네트워크 데이터
// =============================================================================

const NETWORK_DATA = {
    // 중앙 노드
    center: {
        id: 'center',
        title: '법무부',
        subtitle: '정성호',
    },

    // 카테고리 (내부 링 2) - 5개 카테고리를 72도 간격으로 배치
    categories: [
        { id: 'cat_jrti', name: '기수', desc: '법원연수원', color: '#3B82F6', angle: 36 },
        { id: 'cat_univ', name: '출신학교', desc: '대학교', color: '#10B981', angle: 108 },
        { id: 'cat_region', name: '지역', desc: '출신 지역', color: '#F59E0B', angle: 180 },
        { id: 'cat_firm', name: '전관예우', desc: '대형로펌', color: '#EF4444', angle: 252 },
        { id: 'cat_hs', name: '고교', desc: '고등학교', color: '#8B5CF6', angle: 324 },
    ],

    // 헌재/대법원 (중앙 근처 별도 배치)
    courtLabel: { id: 'cat_court', name: '헌재/대법원', desc: '최고 사법기관' },

    // 중앙 노드 연결 정보 (정성호 법무부장관)
    centerConnections: { jrti: 18, university: '서울대', highSchool: '대신고', hometown: '양구' },

    // 인물 노드 (내부 링 1)
    persons: [
        // 헌법재판관 9명 (모두 서울대 출신)
        { id: 'cc_kim_sanghwan', name: '김상환', position: '헌법재판소장', jrti: 20, university: '서울대', group: 'constitutional' },
        { id: 'cc_kim_hyungdu', name: '김형두', position: '헌법재판관', jrti: 19, university: '서울대', group: 'constitutional' },
        { id: 'cc_jung_jungmi', name: '정정미', position: '헌법재판관', jrti: 25, university: '서울대', group: 'constitutional' },
        { id: 'cc_jung_hyungsik', name: '정형식', position: '헌법재판관', jrti: 17, university: '서울대', group: 'constitutional' },
        { id: 'cc_kim_bokhyung', name: '김복형', position: '헌법재판관', jrti: 24, university: '서울대', group: 'constitutional' },
        { id: 'cc_cho_hanchang', name: '조한창', position: '헌법재판관', jrti: 18, university: '서울대', group: 'constitutional' },
        { id: 'cc_jung_gyesun', name: '정계선', position: '헌법재판관', jrti: 27, university: '서울대', group: 'constitutional' },
        { id: 'cc_ma_eunhyuk', name: '마은혁', position: '헌법재판관', jrti: 29, university: '서울대', group: 'constitutional' },
        { id: 'cc_oh_youngjun', name: '오영준', position: '헌법재판관', jrti: 23, university: '서울대', group: 'constitutional' },

        // 대법원장 + 대법관
        { id: 'judge_cho', name: '조희대', position: '대법원장', jrti: 13, university: '서울대', highSchool: '경북고', hometown: '경주', group: 'supreme' },
        { id: 'judge_noh_ta', name: '노태악', position: '대법관', jrti: 26, university: '한양대', highSchool: '계성고', hometown: '창녕', group: 'supreme' },
        { id: 'judge_chun', name: '천대엽', position: '대법관', jrti: 30, university: '서울대', hometown: '부산', group: 'supreme' },
        { id: 'judge_oh', name: '오경미', position: '대법관', jrti: 35, university: '서울대', highSchool: '이리여고', hometown: '익산', group: 'supreme' },
        { id: 'judge_kwon', name: '권영준', position: '대법관', jrti: 35, university: '서울대', highSchool: '대건고', hometown: '대구', group: 'supreme' },
        { id: 'judge_noh_kyung', name: '노경필', position: '대법관', jrti: 33, university: '서울대', highSchool: '광주고', hometown: '해남', group: 'supreme' },
        { id: 'judge_min', name: '민유숙', position: '대법관', jrti: 28, university: '서울대', highSchool: '배화여고', hometown: '서울', group: 'supreme' },
        { id: 'judge_kim_sang', name: '김상환', position: '대법관', jrti: 26, university: '서울대', highSchool: '보문고', hometown: '대전', group: 'supreme' },
        { id: 'judge_lee_heung', name: '이흥구', position: '대법관', jrti: 28, university: '서울대', highSchool: '통영고', hometown: '통영', group: 'supreme' },
        { id: 'judge_shin', name: '신숙희', position: '대법관', jrti: 30, university: '이화여대', highSchool: '창문여고', hometown: '서울', group: 'supreme' },

        // 법원장급
        { id: 'judge_choi', name: '최수환', position: '부산고등법원장', jrti: 20, university: '서울대', hometown: '부산', group: 'chief' },
        { id: 'judge_yoon', name: '윤종구', position: '대구고등법원장', jrti: 21, university: '서울대', highSchool: '계성고', hometown: '영천', group: 'chief' },
        { id: 'judge_jung', name: '정선재', position: '서울행정법원장', jrti: 20, university: '서울대', highSchool: '영동고', hometown: '서울', group: 'chief' },
        { id: 'judge_lim', name: '임상기', position: '수원지방법원장', jrti: 20, university: '고려대', highSchool: '영신고', hometown: '대구', group: 'chief' },
        { id: 'judge_cho_yong', name: '조용현', position: '서울고등법원장', jrti: 21, university: '서울대', group: 'chief' },
        { id: 'judge_kim_kwang', name: '김광년', position: '서울중앙지법원장', jrti: 20, university: '서울대', group: 'chief' },

        // 내란 재판 재판부
        { id: 'judge_ji', name: '지귀연', position: '내란재판 재판장', jrti: 31, university: '서울대', highSchool: '개포고', hometown: '서울', group: 'trial' },
        { id: 'judge_woo', name: '우인성', position: '형사합의27부 부장판사', jrti: 29, university: '-', group: 'trial' },
        { id: 'judge_lee_jg', name: '이진관', position: '형사합의33부 부장판사', jrti: 32, university: '-', group: 'trial' },
        { id: 'judge_ryu', name: '류경진', position: '이상민 재판장', jrti: 31, university: '고려대', group: 'trial' },
        // 항소심 형사1부
        { id: 'judge_yoon_ss', name: '윤성식', position: '형사1부 재판장', jrti: 24, university: '-', group: 'appeal1' },
        { id: 'judge_min_sc', name: '민성철', position: '형사1부 배석', jrti: 29, university: '-', group: 'appeal1' },
        { id: 'judge_lee_dh', name: '이동현', position: '형사1부 배석', jrti: 36, university: '-', group: 'appeal1' },
        // 항소심 형사12부 (대등재판부)
        { id: 'judge_lee_sc', name: '이승철', position: '형사12부', jrti: 26, university: '-', group: 'appeal12' },
        { id: 'judge_cho_jg', name: '조진구', position: '형사12부', jrti: 29, university: '-', group: 'appeal12' },
        { id: 'judge_kim_ma', name: '김민아', position: '형사12부', jrti: 34, university: '-', group: 'appeal12' },

        // 전관 변호사들
        { id: 'lawyer_kim_yongdae', name: '김용대', position: '前 서울가정법원장', jrti: 17, university: '서울대', firm: '김앤장', group: 'lawyer' },
        { id: 'lawyer_shin', name: '신광렬', position: '前 서울고법 부장', jrti: 20, university: '서울대', highSchool: '보성고', firm: '김앤장', group: 'lawyer' },
        { id: 'lawyer_kang', name: '강일원', position: '前 헌법재판관', jrti: 15, university: '서울대', highSchool: '용산고', firm: '김앤장', group: 'lawyer' },
        { id: 'lawyer_kang_youngsu', name: '강영수', position: '前 인천지방법원장', jrti: 20, university: '서울대', firm: '광장', group: 'lawyer' },
    ],

    // 외부 링 노드들
    outerNodes: {
        // 연수원 기수
        jrti: [
            { id: 'jrti_13', name: '13기', desc: '사법시험 25회 (1983)' },
            { id: 'jrti_15', name: '15기', desc: '사법시험 27회 (1985)' },
            { id: 'jrti_17', name: '17기', desc: '사법시험 29회 (1987)' },
            { id: 'jrti_18', name: '18기', desc: '사법시험 30회 (1988)' },
            { id: 'jrti_19', name: '19기', desc: '사법시험 31회 (1989)' },
            { id: 'jrti_20', name: '20기', desc: '사법시험 32회 (1990)' },
            { id: 'jrti_21', name: '21기', desc: '사법시험 33회 (1991)' },
            { id: 'jrti_23', name: '23기', desc: '사법시험 35회 (1993)' },
            { id: 'jrti_24', name: '24기', desc: '사법시험 36회 (1994)' },
            { id: 'jrti_25', name: '25기', desc: '사법시험 37회 (1995)' },
            { id: 'jrti_26', name: '26기', desc: '사법시험 38회 (1996)' },
            { id: 'jrti_27', name: '27기', desc: '사법시험 39회 (1997)' },
            { id: 'jrti_28', name: '28기', desc: '사법시험 40회 (1998)' },
            { id: 'jrti_29', name: '29기', desc: '사법시험 41회 (1999)' },
            { id: 'jrti_30', name: '30기', desc: '사법시험 42회 (2000)' },
            { id: 'jrti_31', name: '31기', desc: '사법시험 43회 (2001)' },
            { id: 'jrti_33', name: '33기', desc: '사법시험 45회 (2003)' },
            { id: 'jrti_35', name: '35기', desc: '사법시험 47회 (2005)' },
            { id: 'jrti_36', name: '36기', desc: '사법시험 48회 (2006)' },
            { id: 'jrti_46', name: '46기', desc: '법학전문대학원 출신' },
        ],
        // 대학교
        university: [
            { id: 'univ_snu', name: '서울대', desc: '대법관 60% 이상' },
            { id: 'univ_yonsei', name: '연세대', desc: '신규 법관 12.8%' },
            { id: 'univ_korea', name: '고려대', desc: '신규 법관 9.1%' },
            { id: 'univ_skku', name: '성균관대', desc: '신규 법관 9.8%' },
            { id: 'univ_hanyang', name: '한양대', desc: '대법관 배출' },
            { id: 'univ_ewha', name: '이화여대', desc: '여성 법조인 배출' },
        ],
        // 지역
        region: [
            { id: 'region_seoul', name: '서울', desc: '수도권' },
            { id: 'region_busan', name: '부산', desc: '부산광역시' },
            { id: 'region_daegu', name: '대구', desc: '대구광역시' },
            { id: 'region_gwangju', name: '광주', desc: '광주광역시' },
            { id: 'region_gyeongju', name: '경주', desc: '경상북도' },
            { id: 'region_changnyeong', name: '창녕', desc: '경상남도' },
            { id: 'region_jeonju', name: '전주', desc: '전라북도' },
            { id: 'region_iksan', name: '익산', desc: '전라북도' },
            { id: 'region_haenam', name: '해남', desc: '전라남도' },
            { id: 'region_daejeon', name: '대전', desc: '대전광역시' },
            { id: 'region_tongyeong', name: '통영', desc: '경상남도' },
            { id: 'region_youngcheon', name: '영천', desc: '경상북도' },
            { id: 'region_incheon', name: '인천', desc: '인천광역시' },
            { id: 'region_yanggu', name: '양구', desc: '강원도' },
        ],
        // 로펌
        firm: [
            { id: 'firm_kim', name: '김앤장', desc: '퇴직판사 79명 (최다)' },
            { id: 'firm_kwang', name: '광장', desc: '퇴직판사 27명' },
            { id: 'firm_tae', name: '태평양', desc: '퇴직판사 약 20명' },
            { id: 'firm_sejong', name: '세종', desc: '퇴직판사 약 15명' },
            { id: 'firm_yul', name: '율촌', desc: '퇴직판사 약 15명' },
            { id: 'firm_hwawoo', name: '화우', desc: '퇴직법조인 12명' },
        ],
        // 고등학교
        highschool: [
            { id: 'hs_kyungbuk', name: '경북고', desc: '대구' },
            { id: 'hs_kyesung', name: '계성고', desc: '대구' },
            { id: 'hs_gaepo', name: '개포고', desc: '서울' },
            { id: 'hs_kyunggi', name: '경기고', desc: '서울' },
            { id: 'hs_seoul', name: '서울고', desc: '서울' },
            { id: 'hs_bosung', name: '보성고', desc: '서울' },
            { id: 'hs_yongsan', name: '용산고', desc: '서울' },
            { id: 'hs_daesin', name: '대신고', desc: '서울' },
            { id: 'hs_iri', name: '이리여고', desc: '전북 익산' },
            { id: 'hs_daegun', name: '대건고', desc: '대구' },
            { id: 'hs_gwangju', name: '광주고', desc: '광주' },
            { id: 'hs_baehwa', name: '배화여고', desc: '서울' },
            { id: 'hs_bomun', name: '보문고', desc: '대전' },
            { id: 'hs_tongyeong', name: '통영고', desc: '경남 통영' },
            { id: 'hs_changmun', name: '창문여고', desc: '서울' },
            { id: 'hs_youngdong', name: '영동고', desc: '서울' },
            { id: 'hs_youngshin', name: '영신고', desc: '대구' },
        ],
    },
};

// 연결 유형별 색상
const LINK_COLORS = {
    jrti: '#60A5FA',       // blue-400
    university: '#34D399',  // emerald-400
    region: '#FBBF24',     // amber-400
    firm: '#F87171',       // red-400
    highschool: '#A78BFA', // violet-400
};

// 그룹별 노드 색상
const GROUP_COLORS = {
    constitutional: { fill: '#1E3A5F', stroke: '#3B82F6', text: '#93C5FD' },
    supreme:        { fill: '#1E3A5F', stroke: '#6366F1', text: '#A5B4FC' },
    chief:          { fill: '#1A3329', stroke: '#10B981', text: '#6EE7B7' },
    trial:          { fill: '#3B1323', stroke: '#EC4899', text: '#F9A8D4' },
    appeal1:        { fill: '#3B1F13', stroke: '#F59E0B', text: '#FDE68A' },
    appeal12:       { fill: '#3B2F13', stroke: '#F97316', text: '#FDBA74' },
    lawyer:         { fill: '#2D1B3D', stroke: '#A855F7', text: '#D8B4FE' },
};

// =============================================================================
// 유틸리티 함수
// =============================================================================

function polarToCartesian(cx, cy, radius, angleDegrees) {
    const angleRadians = (angleDegrees - 90) * Math.PI / 180;
    return {
        x: cx + radius * Math.cos(angleRadians),
        y: cy + radius * Math.sin(angleRadians)
    };
}

// =============================================================================
// 메인 컴포넌트
// =============================================================================

function JudicialNetwork() {
    const [isVerified, setIsVerified] = useState(true);
    const [writerCode, setWriterCode] = useState('');
    const [error, setError] = useState('');
    const [selectedNode, setSelectedNode] = useState(null);
    const [highlightedLinks, setHighlightedLinks] = useState(new Set());
    const [highlightedNodes, setHighlightedNodes] = useState(new Set());
    const [hoveredNode, setHoveredNode] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 1200, height: 900 });
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [filterTypes, setFilterTypes] = useState({
        jrti: true,
        university: true,
        region: true,
        firm: true,
        highschool: true,
        constitutional: true,
        supreme: true,
        chief: true,
        trial: true,
        appeal1: true,
        appeal12: true,
        lawyer: true,
    });

    const containerRef = useRef(null);
    const svgRef = useRef(null);

    // 화면 크기 감지
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                const height = Math.max(700, Math.min(900, window.innerHeight - 250));
                setDimensions({ width, height });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [isVerified]);

    // 관리자 코드 확인 (세션 스토리지)
    useEffect(() => {
        const savedCode = sessionStorage.getItem('judicialNetworkVerified');
        if (savedCode === 'true') {
            setIsVerified(true);
        }
    }, []);

    // 관리자 코드 검증
    const verifyWriterCode = async () => {
        setError('');

        const adminCode = import.meta.env.VITE_ADMIN_CODE;
        const writerCodeEnv = import.meta.env.VITE_WRITER_CODE;

        if (writerCode === adminCode || writerCode === writerCodeEnv) {
            setIsVerified(true);
            sessionStorage.setItem('judicialNetworkVerified', 'true');
            return;
        }

        try {
            const codesRef = collection(db, 'writerCodes');
            const q = query(codesRef, where('code', '==', writerCode), where('active', '==', true));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                setIsVerified(true);
                sessionStorage.setItem('judicialNetworkVerified', 'true');
            } else {
                setError('유효하지 않은 접근 코드입니다.');
            }
        } catch (err) {
            console.error('코드 확인 실패:', err);
            setError('코드 확인 중 오류가 발생했습니다.');
        }
    };

    // 레이아웃 계산
    const layout = useMemo(() => {
        const cx = dimensions.width / 2;
        const cy = dimensions.height / 2;
        const minDim = Math.min(dimensions.width, dimensions.height);

        // 링 반지름 - 노드 겹침 방지를 위해 간격 확대
        const centerRadius = minDim * 0.06;
        const courtRingRadius = minDim * 0.14;  // 헌재/대법원 링 (중앙 근처)
        const personRingRadius = minDim * 0.26; // 일반 인물 링
        const categoryRingRadius = minDim * 0.36; // 카테고리 레이블
        const outerRingRadius = minDim * 0.44;  // 외부 노드

        // 카테고리 위치 계산
        const categoryPositions = NETWORK_DATA.categories.map(cat => ({
            ...cat,
            ...polarToCartesian(cx, cy, categoryRingRadius, cat.angle)
        }));

        // 인물 위치 계산 - 그룹별로 배치
        const personGroups = {
            constitutional: NETWORK_DATA.persons.filter(p => p.group === 'constitutional'),
            supreme: NETWORK_DATA.persons.filter(p => p.group === 'supreme'),
            chief: NETWORK_DATA.persons.filter(p => p.group === 'chief'),
            trial: NETWORK_DATA.persons.filter(p => p.group === 'trial'),
            appeal1: NETWORK_DATA.persons.filter(p => p.group === 'appeal1'),
            appeal12: NETWORK_DATA.persons.filter(p => p.group === 'appeal12'),
            lawyer: NETWORK_DATA.persons.filter(p => p.group === 'lawyer'),
        };

        const personPositions = [];

        // 헌법재판관 (중앙 근처 왼쪽 반원, 180-360도)
        personGroups.constitutional.forEach((p, i) => {
            const angle = 200 + (i / personGroups.constitutional.length) * 140;
            const pos = polarToCartesian(cx, cy, courtRingRadius, angle);
            personPositions.push({ ...p, ...pos });
        });

        // 대법관 (중앙 근처 오른쪽 반원, 0-180도)
        personGroups.supreme.forEach((p, i) => {
            const angle = 20 + (i / personGroups.supreme.length) * 140;
            const pos = polarToCartesian(cx, cy, courtRingRadius, angle);
            personPositions.push({ ...p, ...pos });
        });

        // 법원장 (외부 링, 70-130도 영역)
        personGroups.chief.forEach((p, i) => {
            const angle = 70 + (i / personGroups.chief.length) * 60;
            const pos = polarToCartesian(cx, cy, personRingRadius, angle);
            personPositions.push({ ...p, ...pos });
        });

        // 내란재판부 (외부 링, 140-170도 영역)
        personGroups.trial.forEach((p, i) => {
            const angle = 140 + (i / personGroups.trial.length) * 30;
            const pos = polarToCartesian(cx, cy, personRingRadius, angle);
            personPositions.push({ ...p, ...pos });
        });

        // 항소심 형사1부 (외부 링, 170-190도 영역)
        personGroups.appeal1.forEach((p, i) => {
            const angle = 170 + (i / personGroups.appeal1.length) * 20;
            const pos = polarToCartesian(cx, cy, personRingRadius, angle);
            personPositions.push({ ...p, ...pos });
        });

        // 항소심 형사12부 (외부 링, 190-210도 영역)
        personGroups.appeal12.forEach((p, i) => {
            const angle = 190 + (i / personGroups.appeal12.length) * 20;
            const pos = polarToCartesian(cx, cy, personRingRadius, angle);
            personPositions.push({ ...p, ...pos });
        });

        // 전관변호사 (외부 링, 215-300도 영역)
        personGroups.lawyer.forEach((p, i) => {
            const angle = 215 + (i / personGroups.lawyer.length) * 85;
            const pos = polarToCartesian(cx, cy, personRingRadius, angle);
            personPositions.push({ ...p, ...pos });
        });

        // 외부 노드 위치 계산 (5개 카테고리, 각 72도 영역)
        const outerPositions = {};

        // 기수 (0-72도, 중심 36도)
        outerPositions.jrti = NETWORK_DATA.outerNodes.jrti.map((node, i) => {
            const angle = 5 + (i / NETWORK_DATA.outerNodes.jrti.length) * 62;
            return { ...node, ...polarToCartesian(cx, cy, outerRingRadius, angle), type: 'jrti' };
        });

        // 대학교 (72-144도, 중심 108도)
        outerPositions.university = NETWORK_DATA.outerNodes.university.map((node, i) => {
            const angle = 77 + (i / NETWORK_DATA.outerNodes.university.length) * 62;
            return { ...node, ...polarToCartesian(cx, cy, outerRingRadius, angle), type: 'university' };
        });

        // 지역 (144-216도, 중심 180도)
        outerPositions.region = NETWORK_DATA.outerNodes.region.map((node, i) => {
            const angle = 149 + (i / NETWORK_DATA.outerNodes.region.length) * 62;
            return { ...node, ...polarToCartesian(cx, cy, outerRingRadius, angle), type: 'region' };
        });

        // 로펌 (216-288도, 중심 252도)
        outerPositions.firm = NETWORK_DATA.outerNodes.firm.map((node, i) => {
            const angle = 221 + (i / NETWORK_DATA.outerNodes.firm.length) * 62;
            return { ...node, ...polarToCartesian(cx, cy, outerRingRadius, angle), type: 'firm' };
        });

        // 고등학교 (288-360도, 중심 324도)
        outerPositions.highschool = NETWORK_DATA.outerNodes.highschool.map((node, i) => {
            const angle = 293 + (i / NETWORK_DATA.outerNodes.highschool.length) * 62;
            return { ...node, ...polarToCartesian(cx, cy, outerRingRadius, angle), type: 'highschool' };
        });

        return {
            cx,
            cy,
            centerRadius,
            courtRingRadius,
            personRingRadius,
            categoryRingRadius,
            outerRingRadius,
            categoryPositions,
            personPositions,
            outerPositions,
        };
    }, [dimensions]);

    // 연결선 생성
    const links = useMemo(() => {
        const result = [];
        const allOuterNodes = {
            ...Object.fromEntries(layout.outerPositions.jrti.map(n => [n.id, n])),
            ...Object.fromEntries(layout.outerPositions.university.map(n => [n.id, n])),
            ...Object.fromEntries(layout.outerPositions.region.map(n => [n.id, n])),
            ...Object.fromEntries(layout.outerPositions.firm.map(n => [n.id, n])),
            ...Object.fromEntries(layout.outerPositions.highschool.map(n => [n.id, n])),
        };

        layout.personPositions.forEach(person => {
            // 기수 연결
            if (person.jrti) {
                const jrtiNode = allOuterNodes[`jrti_${person.jrti}`];
                if (jrtiNode && filterTypes.jrti) {
                    result.push({
                        id: `${person.id}-jrti_${person.jrti}`,
                        source: person,
                        target: jrtiNode,
                        type: 'jrti',
                    });
                }
            }

            // 대학교 연결
            if (person.university && person.university !== '-') {
                const univMap = {
                    '서울대': 'univ_snu',
                    '연세대': 'univ_yonsei',
                    '고려대': 'univ_korea',
                    '성균관대': 'univ_skku',
                    '한양대': 'univ_hanyang',
                    '이화여대': 'univ_ewha',
                };
                const univId = univMap[person.university];
                const univNode = allOuterNodes[univId];
                if (univNode && filterTypes.university) {
                    result.push({
                        id: `${person.id}-${univId}`,
                        source: person,
                        target: univNode,
                        type: 'university',
                    });
                }
            }

            // 지역 연결
            if (person.hometown) {
                const regionMap = {
                    '서울': 'region_seoul',
                    '부산': 'region_busan',
                    '대구': 'region_daegu',
                    '광주': 'region_gwangju',
                    '경주': 'region_gyeongju',
                    '창녕': 'region_changnyeong',
                    '전주': 'region_jeonju',
                    '익산': 'region_iksan',
                    '해남': 'region_haenam',
                    '대전': 'region_daejeon',
                    '통영': 'region_tongyeong',
                    '영천': 'region_youngcheon',
                    '인천': 'region_incheon',
                    '양구': 'region_yanggu',
                };
                const regionId = regionMap[person.hometown];
                const regionNode = allOuterNodes[regionId];
                if (regionNode && filterTypes.region) {
                    result.push({
                        id: `${person.id}-${regionId}`,
                        source: person,
                        target: regionNode,
                        type: 'region',
                    });
                }
            }

            // 로펌 연결
            if (person.firm) {
                const firmMap = {
                    '김앤장': 'firm_kim',
                    '광장': 'firm_kwang',
                    '태평양': 'firm_tae',
                    '세종': 'firm_sejong',
                    '율촌': 'firm_yul',
                    '화우': 'firm_hwawoo',
                };
                const firmId = firmMap[person.firm];
                const firmNode = allOuterNodes[firmId];
                if (firmNode && filterTypes.firm) {
                    result.push({
                        id: `${person.id}-${firmId}`,
                        source: person,
                        target: firmNode,
                        type: 'firm',
                    });
                }
            }

            // 고등학교 연결
            if (person.highSchool) {
                const hsMap = {
                    '경북고': 'hs_kyungbuk',
                    '계성고': 'hs_kyesung',
                    '개포고': 'hs_gaepo',
                    '경기고': 'hs_kyunggi',
                    '서울고': 'hs_seoul',
                    '보성고': 'hs_bosung',
                    '용산고': 'hs_yongsan',
                    '대신고': 'hs_daesin',
                    '이리여고': 'hs_iri',
                    '대건고': 'hs_daegun',
                    '광주고': 'hs_gwangju',
                    '배화여고': 'hs_baehwa',
                    '보문고': 'hs_bomun',
                    '통영고': 'hs_tongyeong',
                    '창문여고': 'hs_changmun',
                    '영동고': 'hs_youngdong',
                    '영신고': 'hs_youngshin',
                };
                const hsId = hsMap[person.highSchool];
                const hsNode = allOuterNodes[hsId];
                if (hsNode && filterTypes.highschool) {
                    result.push({
                        id: `${person.id}-${hsId}`,
                        source: person,
                        target: hsNode,
                        type: 'highschool',
                    });
                }
            }
        });

        // 중앙 노드(정성호) 연결
        const centerNode = { id: 'center', x: layout.cx, y: layout.cy };
        const cc = NETWORK_DATA.centerConnections;

        // 기수 연결
        if (cc.jrti && filterTypes.jrti) {
            const jrtiNode = allOuterNodes[`jrti_${cc.jrti}`];
            if (jrtiNode) {
                result.push({ id: `center-jrti_${cc.jrti}`, source: centerNode, target: jrtiNode, type: 'jrti' });
            }
        }
        // 대학교 연결
        if (cc.university && filterTypes.university) {
            const univMap = { '서울대': 'univ_snu', '연세대': 'univ_yonsei', '고려대': 'univ_korea' };
            const univNode = allOuterNodes[univMap[cc.university]];
            if (univNode) {
                result.push({ id: `center-${univMap[cc.university]}`, source: centerNode, target: univNode, type: 'university' });
            }
        }
        // 지역 연결
        if (cc.hometown && filterTypes.region) {
            const regionMap = { '양구': 'region_yanggu', '서울': 'region_seoul' };
            const regionNode = allOuterNodes[regionMap[cc.hometown]];
            if (regionNode) {
                result.push({ id: `center-${regionMap[cc.hometown]}`, source: centerNode, target: regionNode, type: 'region' });
            }
        }
        // 고등학교 연결
        if (cc.highSchool && filterTypes.highschool) {
            const hsMap = { '대신고': 'hs_daesin' };
            const hsNode = allOuterNodes[hsMap[cc.highSchool]];
            if (hsNode) {
                result.push({ id: `center-${hsMap[cc.highSchool]}`, source: centerNode, target: hsNode, type: 'highschool' });
            }
        }

        return result;
    }, [layout, filterTypes]);

    // 노드 클릭 핸들러
    const handleNodeClick = useCallback((node, nodeType) => {
        setSelectedNode({ ...node, nodeType });

        // 연결된 링크와 노드 하이라이트
        const connectedLinks = new Set();
        const connectedNodes = new Set([node.id]);

        links.forEach(link => {
            if (link.source.id === node.id || link.target.id === node.id) {
                connectedLinks.add(link.id);
                connectedNodes.add(link.source.id);
                connectedNodes.add(link.target.id);
            }
        });

        setHighlightedLinks(connectedLinks);
        setHighlightedNodes(connectedNodes);
    }, [links]);

    // 배경 클릭 핸들러
    const handleBackgroundClick = useCallback(() => {
        setSelectedNode(null);
        setHighlightedLinks(new Set());
        setHighlightedNodes(new Set());
    }, []);

    // 필터 토글
    const toggleFilter = (type) => {
        setFilterTypes(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    // 줌 핸들러
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.min(3, Math.max(0.5, prev + delta)));
    }, []);

    // 팬 시작
    const handleMouseDown = useCallback((e) => {
        if (e.button === 0) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    }, [pan]);

    // 팬 이동
    const handleMouseMove = useCallback((e) => {
        if (isPanning) {
            setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        }
    }, [isPanning, panStart]);

    // 팬 종료
    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    // 줌 리셋
    const resetZoom = useCallback(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setSelectedNode(null);
        setHighlightedLinks(new Set());
        setHighlightedNodes(new Set());
    }, []);

    // 인증 화면
    if (!isVerified) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center py-20">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">
                            사법부 네트워크 분석
                        </h2>
                        <p className="text-gray-500 text-center mb-8">
                            관리자 전용 페이지입니다
                        </p>

                        <input
                            type="password"
                            value={writerCode}
                            onChange={(e) => setWriterCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && verifyWriterCode()}
                            placeholder="접근 코드 입력"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition"
                        />

                        {error && (
                            <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
                        )}

                        <button
                            onClick={verifyWriterCode}
                            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-lg shadow-blue-500/25"
                        >
                            확인
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 필터링된 인물
    const filteredPersons = layout.personPositions.filter(p => filterTypes[p.group] !== false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            <Header />
            <div className="container mx-auto px-4 py-6">
                {/* 헤더 */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        사법부 카르텔 네트워크
                    </h1>
                    <p className="text-gray-400">
                        출신학교, 지역, 기수, 전관예우, 고교 - 대한민국 사법부의 인적 네트워크를 시각화합니다
                    </p>
                </div>

                {/* 필터 컨트롤 */}
                <div className="bg-slate-800/50 backdrop-blur rounded-2xl shadow-sm border border-slate-700 p-5 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        <h3 className="font-semibold text-gray-200">필터 및 범례</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2">
                        {/* 연결 유형 필터 */}
                        <button
                            onClick={() => toggleFilter('jrti')}
                            style={filterTypes.jrti ? { borderColor: LINK_COLORS.jrti, color: LINK_COLORS.jrti } : {}}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                                filterTypes.jrti ? 'bg-slate-800' : 'bg-slate-800 border-slate-600 text-slate-500'
                            }`}
                        >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: filterTypes.jrti ? LINK_COLORS.jrti : '#475569' }}></span>
                            기수
                        </button>

                        <button
                            onClick={() => toggleFilter('university')}
                            style={filterTypes.university ? { borderColor: LINK_COLORS.university, color: LINK_COLORS.university } : {}}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                                filterTypes.university ? 'bg-slate-800' : 'bg-slate-800 border-slate-600 text-slate-500'
                            }`}
                        >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: filterTypes.university ? LINK_COLORS.university : '#475569' }}></span>
                            출신학교
                        </button>

                        <button
                            onClick={() => toggleFilter('region')}
                            style={filterTypes.region ? { borderColor: LINK_COLORS.region, color: LINK_COLORS.region } : {}}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                                filterTypes.region ? 'bg-slate-800' : 'bg-slate-800 border-slate-600 text-slate-500'
                            }`}
                        >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: filterTypes.region ? LINK_COLORS.region : '#475569' }}></span>
                            지역
                        </button>

                        <button
                            onClick={() => toggleFilter('firm')}
                            style={filterTypes.firm ? { borderColor: LINK_COLORS.firm, color: LINK_COLORS.firm } : {}}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                                filterTypes.firm ? 'bg-slate-800' : 'bg-slate-800 border-slate-600 text-slate-500'
                            }`}
                        >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: filterTypes.firm ? LINK_COLORS.firm : '#475569' }}></span>
                            전관예우
                        </button>

                        <button
                            onClick={() => toggleFilter('highschool')}
                            style={filterTypes.highschool ? { borderColor: LINK_COLORS.highschool, color: LINK_COLORS.highschool } : {}}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                                filterTypes.highschool ? 'bg-slate-800' : 'bg-slate-800 border-slate-600 text-slate-500'
                            }`}
                        >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: filterTypes.highschool ? LINK_COLORS.highschool : '#475569' }}></span>
                            고교
                        </button>

                        {/* 인물 그룹 필터 */}
                        <button
                            onClick={() => toggleFilter('constitutional')}
                            style={filterTypes.constitutional ? { borderColor: GROUP_COLORS.constitutional.stroke, color: GROUP_COLORS.constitutional.text } : {}}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                                filterTypes.constitutional ? 'bg-slate-800' : 'bg-slate-800 border-slate-600 text-slate-500'
                            }`}
                        >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: filterTypes.constitutional ? GROUP_COLORS.constitutional.stroke : '#475569' }}></span>
                            헌재
                        </button>

                        <button
                            onClick={() => toggleFilter('supreme')}
                            style={filterTypes.supreme ? { borderColor: GROUP_COLORS.supreme.stroke, color: GROUP_COLORS.supreme.text } : {}}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                                filterTypes.supreme ? 'bg-slate-800' : 'bg-slate-800 border-slate-600 text-slate-500'
                            }`}
                        >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: filterTypes.supreme ? GROUP_COLORS.supreme.stroke : '#475569' }}></span>
                            대법원
                        </button>

                        <button
                            onClick={() => toggleFilter('chief')}
                            style={filterTypes.chief ? { borderColor: GROUP_COLORS.chief.stroke, color: GROUP_COLORS.chief.text } : {}}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                                filterTypes.chief ? 'bg-slate-800' : 'bg-slate-800 border-slate-600 text-slate-500'
                            }`}
                        >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: filterTypes.chief ? GROUP_COLORS.chief.stroke : '#475569' }}></span>
                            법원장
                        </button>

                        <button
                            onClick={() => toggleFilter('trial')}
                            style={filterTypes.trial ? { borderColor: GROUP_COLORS.trial.stroke, color: GROUP_COLORS.trial.text } : {}}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                                filterTypes.trial ? 'bg-slate-800' : 'bg-slate-800 border-slate-600 text-slate-500'
                            }`}
                        >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: filterTypes.trial ? GROUP_COLORS.trial.stroke : '#475569' }}></span>
                            내란재판부
                        </button>

                        <button
                            onClick={() => toggleFilter('appeal1')}
                            style={filterTypes.appeal1 ? { borderColor: GROUP_COLORS.appeal1.stroke, color: GROUP_COLORS.appeal1.text } : {}}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                                filterTypes.appeal1 ? 'bg-slate-800' : 'bg-slate-800 border-slate-600 text-slate-500'
                            }`}
                        >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: filterTypes.appeal1 ? GROUP_COLORS.appeal1.stroke : '#475569' }}></span>
                            항소심1부
                        </button>

                        <button
                            onClick={() => toggleFilter('appeal12')}
                            style={filterTypes.appeal12 ? { borderColor: GROUP_COLORS.appeal12.stroke, color: GROUP_COLORS.appeal12.text } : {}}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                                filterTypes.appeal12 ? 'bg-slate-800' : 'bg-slate-800 border-slate-600 text-slate-500'
                            }`}
                        >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: filterTypes.appeal12 ? GROUP_COLORS.appeal12.stroke : '#475569' }}></span>
                            항소심12부
                        </button>

                        <button
                            onClick={() => toggleFilter('lawyer')}
                            style={filterTypes.lawyer ? { borderColor: GROUP_COLORS.lawyer.stroke, color: GROUP_COLORS.lawyer.text } : {}}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                                filterTypes.lawyer ? 'bg-slate-800' : 'bg-slate-800 border-slate-600 text-slate-500'
                            }`}
                        >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: filterTypes.lawyer ? GROUP_COLORS.lawyer.stroke : '#475569' }}></span>
                            전관변호사
                        </button>
                    </div>
                </div>

                {/* 네트워크 시각화 */}
                {/* 줌 컨트롤 */}
                <div className="flex items-center gap-2 mb-4">
                    <button
                        onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
                        className="px-3 py-2 bg-slate-700 border-2 border-slate-500 rounded-lg text-white font-bold hover:bg-slate-600 transition"
                    >
                        +
                    </button>
                    <button
                        onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))}
                        className="px-3 py-2 bg-slate-700 border-2 border-slate-500 rounded-lg text-white font-bold hover:bg-slate-600 transition"
                    >
                        −
                    </button>
                    <button
                        onClick={resetZoom}
                        className="px-3 py-2 bg-slate-700 border-2 border-slate-500 rounded-lg text-white text-sm font-medium hover:bg-slate-600 transition"
                    >
                        초기화
                    </button>
                    <span className="text-sm text-gray-400 ml-2">{Math.round(zoom * 100)}%</span>
                </div>

                <div
                    ref={containerRef}
                    className="bg-slate-900 rounded-2xl shadow-sm border border-slate-700 overflow-hidden"
                    style={{ minHeight: dimensions.height }}
                >
                    <svg
                        ref={svgRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        className={isPanning ? 'cursor-grabbing' : 'cursor-grab'}
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onClick={() => {
                            setSelectedNode(null);
                            setHighlightedLinks(new Set());
                            setHighlightedNodes(new Set());
                        }}
                        style={{ fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif" }}
                    >
                        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} style={{ transformOrigin: `${layout.cx}px ${layout.cy}px` }}>
                        <defs>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        {/* 배경 원형 가이드 */}
                        <g className="guide-circles" opacity="0.3">
                            <circle
                                cx={layout.cx}
                                cy={layout.cy}
                                r={layout.courtRingRadius}
                                fill="none"
                                stroke="#334155"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                            />
                            <circle
                                cx={layout.cx}
                                cy={layout.cy}
                                r={layout.personRingRadius}
                                fill="none"
                                stroke="#334155"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                            />
                            <circle
                                cx={layout.cx}
                                cy={layout.cy}
                                r={layout.categoryRingRadius}
                                fill="none"
                                stroke="#334155"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                            />
                            <circle
                                cx={layout.cx}
                                cy={layout.cy}
                                r={layout.outerRingRadius}
                                fill="none"
                                stroke="#334155"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                            />
                        </g>

                        {/* 연결선 */}
                        <g className="links">
                            {links.map(link => {
                                const isHighlighted = highlightedLinks.size === 0 || highlightedLinks.has(link.id);
                                const opacity = isHighlighted ? 0.6 : 0.08;
                                const strokeWidth = highlightedLinks.has(link.id) ? 2 : 1;

                                return (
                                    <line
                                        key={link.id}
                                        x1={link.source.x}
                                        y1={link.source.y}
                                        x2={link.target.x}
                                        y2={link.target.y}
                                        stroke={LINK_COLORS[link.type]}
                                        strokeWidth={strokeWidth}
                                        opacity={opacity}
                                        className="transition-all duration-200"
                                    />
                                );
                            })}
                        </g>

                        {/* 외부 링 노드들 */}
                        <g className="outer-nodes">
                            {/* 기수 노드 */}
                            {filterTypes.jrti && layout.outerPositions.jrti.map(node => {
                                const isHighlighted = highlightedNodes.size === 0 || highlightedNodes.has(node.id);
                                const isHovered = hoveredNode?.id === node.id;
                                const isActive = highlightedNodes.has(node.id);
                                return (
                                    <g
                                        key={node.id}
                                        className="cursor-pointer transition-all duration-200"
                                        onClick={(e) => { e.stopPropagation(); handleNodeClick(node, 'jrti'); }}
                                        onMouseEnter={() => setHoveredNode(node)}
                                        onMouseLeave={() => setHoveredNode(null)}
                                        opacity={isHighlighted ? 1 : 0.2}
                                        filter={isActive && highlightedNodes.size > 0 ? 'url(#glow)' : undefined}
                                    >
                                        <circle
                                            cx={node.x}
                                            cy={node.y}
                                            r={isHovered ? 14 : 10}
                                            fill="#1E293B"
                                            stroke="#475569"
                                            strokeWidth="1.5"
                                            className="transition-all duration-200"
                                        />
                                        <text
                                            x={node.x}
                                            y={node.y}
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fill="#CBD5E1"
                                            fontSize="8"
                                            fontWeight="600"
                                        >
                                            {node.name.replace('기', '')}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* 대학교 노드 */}
                            {filterTypes.university && layout.outerPositions.university.map(node => {
                                const isHighlighted = highlightedNodes.size === 0 || highlightedNodes.has(node.id);
                                const isHovered = hoveredNode?.id === node.id;
                                const isActive = highlightedNodes.has(node.id);
                                return (
                                    <g
                                        key={node.id}
                                        className="cursor-pointer transition-all duration-200"
                                        onClick={(e) => { e.stopPropagation(); handleNodeClick(node, 'university'); }}
                                        onMouseEnter={() => setHoveredNode(node)}
                                        onMouseLeave={() => setHoveredNode(null)}
                                        opacity={isHighlighted ? 1 : 0.2}
                                        filter={isActive && highlightedNodes.size > 0 ? 'url(#glow)' : undefined}
                                    >
                                        <circle
                                            cx={node.x}
                                            cy={node.y}
                                            r={isHovered ? 16 : 12}
                                            fill="#1E293B"
                                            stroke="#475569"
                                            strokeWidth="1.5"
                                            className="transition-all duration-200"
                                        />
                                        <text
                                            x={node.x}
                                            y={node.y}
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fill="#CBD5E1"
                                            fontSize="8"
                                            fontWeight="600"
                                        >
                                            {node.name}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* 지역 노드 */}
                            {filterTypes.region && layout.outerPositions.region.map(node => {
                                const isHighlighted = highlightedNodes.size === 0 || highlightedNodes.has(node.id);
                                const isHovered = hoveredNode?.id === node.id;
                                const isActive = highlightedNodes.has(node.id);
                                return (
                                    <g
                                        key={node.id}
                                        className="cursor-pointer transition-all duration-200"
                                        onClick={(e) => { e.stopPropagation(); handleNodeClick(node, 'region'); }}
                                        onMouseEnter={() => setHoveredNode(node)}
                                        onMouseLeave={() => setHoveredNode(null)}
                                        opacity={isHighlighted ? 1 : 0.2}
                                        filter={isActive && highlightedNodes.size > 0 ? 'url(#glow)' : undefined}
                                    >
                                        <circle
                                            cx={node.x}
                                            cy={node.y}
                                            r={isHovered ? 14 : 10}
                                            fill="#1E293B"
                                            stroke="#475569"
                                            strokeWidth="1.5"
                                            className="transition-all duration-200"
                                        />
                                        <text
                                            x={node.x}
                                            y={node.y}
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fill="#CBD5E1"
                                            fontSize="7"
                                            fontWeight="600"
                                        >
                                            {node.name}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* 로펌 노드 */}
                            {filterTypes.firm && layout.outerPositions.firm.map(node => {
                                const isHighlighted = highlightedNodes.size === 0 || highlightedNodes.has(node.id);
                                const isHovered = hoveredNode?.id === node.id;
                                const isActive = highlightedNodes.has(node.id);
                                return (
                                    <g
                                        key={node.id}
                                        className="cursor-pointer transition-all duration-200"
                                        onClick={(e) => { e.stopPropagation(); handleNodeClick(node, 'firm'); }}
                                        onMouseEnter={() => setHoveredNode(node)}
                                        onMouseLeave={() => setHoveredNode(null)}
                                        opacity={isHighlighted ? 1 : 0.2}
                                        filter={isActive && highlightedNodes.size > 0 ? 'url(#glow)' : undefined}
                                    >
                                        <circle
                                            cx={node.x}
                                            cy={node.y}
                                            r={isHovered ? 16 : 12}
                                            fill="#1E293B"
                                            stroke="#475569"
                                            strokeWidth="1.5"
                                            className="transition-all duration-200"
                                        />
                                        <text
                                            x={node.x}
                                            y={node.y}
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fill="#CBD5E1"
                                            fontSize="7"
                                            fontWeight="600"
                                        >
                                            {node.name}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* 고등학교 노드 */}
                            {filterTypes.highschool && layout.outerPositions.highschool.map(node => {
                                const isHighlighted = highlightedNodes.size === 0 || highlightedNodes.has(node.id);
                                const isHovered = hoveredNode?.id === node.id;
                                const isActive = highlightedNodes.has(node.id);
                                return (
                                    <g
                                        key={node.id}
                                        className="cursor-pointer transition-all duration-200"
                                        onClick={(e) => { e.stopPropagation(); handleNodeClick(node, 'highschool'); }}
                                        onMouseEnter={() => setHoveredNode(node)}
                                        onMouseLeave={() => setHoveredNode(null)}
                                        opacity={isHighlighted ? 1 : 0.2}
                                        filter={isActive && highlightedNodes.size > 0 ? 'url(#glow)' : undefined}
                                    >
                                        <circle
                                            cx={node.x}
                                            cy={node.y}
                                            r={isHovered ? 14 : 10}
                                            fill="#1E293B"
                                            stroke="#475569"
                                            strokeWidth="1.5"
                                            className="transition-all duration-200"
                                        />
                                        <text
                                            x={node.x}
                                            y={node.y}
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fill="#CBD5E1"
                                            fontSize="6"
                                            fontWeight="600"
                                        >
                                            {node.name}
                                        </text>
                                    </g>
                                );
                            })}
                        </g>

                        {/* 카테고리 레이블 */}
                        <g className="category-labels">
                            {layout.categoryPositions.map(cat => (
                                <g key={cat.id}>
                                    <text
                                        x={cat.x}
                                        y={cat.y}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fill="#E2E8F0"
                                        fontSize="14"
                                        fontWeight="700"
                                        opacity="0.9"
                                    >
                                        {cat.name}
                                    </text>
                                    <text
                                        x={cat.x}
                                        y={cat.y + 16}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fill="#94A3B8"
                                        fontSize="10"
                                        opacity="0.8"
                                    >
                                        {cat.desc}
                                    </text>
                                </g>
                            ))}
                        </g>

                        {/* 인물 노드들 */}
                        <g className="person-nodes">
                            {filteredPersons.map(person => {
                                const isHighlighted = highlightedNodes.size === 0 || highlightedNodes.has(person.id);
                                const isHovered = hoveredNode?.id === person.id;
                                const isSelected = selectedNode?.id === person.id;
                                const isActive = highlightedNodes.has(person.id);
                                const radius = person.group === 'minister' ? 24 : (isHovered || isSelected ? 18 : 14);
                                const gc = GROUP_COLORS[person.group] || { fill: '#1E293B', stroke: '#64748B', text: '#E2E8F0' };

                                return (
                                    <g
                                        key={person.id}
                                        className="cursor-pointer"
                                        onClick={(e) => { e.stopPropagation(); handleNodeClick(person, 'person'); }}
                                        onMouseEnter={() => setHoveredNode(person)}
                                        onMouseLeave={() => setHoveredNode(null)}
                                        opacity={isHighlighted ? 1 : 0.25}
                                        filter={isActive && highlightedNodes.size > 0 ? 'url(#glow)' : undefined}
                                    >
                                        {/* 선택 하이라이트 */}
                                        {isSelected && (
                                            <circle
                                                cx={person.x}
                                                cy={person.y}
                                                r={radius + 4}
                                                fill="none"
                                                stroke="#FCD34D"
                                                strokeWidth="3"
                                            />
                                        )}
                                        {/* 메인 원 */}
                                        <circle
                                            cx={person.x}
                                            cy={person.y}
                                            r={radius}
                                            fill={gc.fill}
                                            stroke={gc.stroke}
                                            strokeWidth="2.5"
                                            className="transition-all duration-200"
                                        />
                                        {/* 이름 */}
                                        <text
                                            x={person.x}
                                            y={person.y}
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fill={gc.text}
                                            fontSize={person.group === 'minister' ? 10 : 8}
                                            fontWeight="600"
                                        >
                                            {person.name}
                                        </text>
                                        {/* 기수 (작게) */}
                                        {person.jrti && (
                                            <text
                                                x={person.x}
                                                y={person.y + radius + 10}
                                                textAnchor="middle"
                                                dominantBaseline="central"
                                                fill={gc.stroke}
                                                fontSize="8"
                                            >
                                                {person.jrti}기
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                        </g>

                        {/* 중앙 노드 */}
                        <g
                            className="center-node cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                const centerNodeData = {
                                    id: 'center',
                                    name: `${NETWORK_DATA.center.title} ${NETWORK_DATA.center.subtitle}`,
                                    position: '법무부장관',
                                    ...NETWORK_DATA.centerConnections,
                                    x: layout.cx,
                                    y: layout.cy
                                };
                                handleNodeClick(centerNodeData, 'center');
                            }}
                        >
                            {selectedNode?.id === 'center' && (
                                <circle
                                    cx={layout.cx}
                                    cy={layout.cy}
                                    r={layout.centerRadius + 4}
                                    fill="none"
                                    stroke="#FCD34D"
                                    strokeWidth="3"
                                />
                            )}
                            <circle
                                cx={layout.cx}
                                cy={layout.cy}
                                r={layout.centerRadius}
                                fill="#0F172A"
                                stroke="#F8FAFC"
                                strokeWidth="3"
                                filter="url(#glow)"
                            />
                            <text
                                x={layout.cx}
                                y={layout.cy - 6}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="#F1F5F9"
                                fontSize="12"
                                fontWeight="700"
                            >
                                {NETWORK_DATA.center.title}
                            </text>
                            <text
                                x={layout.cx}
                                y={layout.cy + 8}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="#94A3B8"
                                fontSize="9"
                            >
                                {NETWORK_DATA.center.subtitle}
                            </text>
                        </g>

                        {/* 헌재/대법원 레이블 (중앙 아래) */}
                        <g className="court-label">
                            <text
                                x={layout.cx}
                                y={layout.cy + layout.courtRingRadius + 20}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="#E2E8F0"
                                fontSize="13"
                                fontWeight="700"
                                opacity="0.9"
                            >
                                {NETWORK_DATA.courtLabel.name}
                            </text>
                            <text
                                x={layout.cx}
                                y={layout.cy + layout.courtRingRadius + 36}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="#94A3B8"
                                fontSize="9"
                                opacity="0.8"
                            >
                                {NETWORK_DATA.courtLabel.desc}
                            </text>
                        </g>

                        {/* 호버 툴팁 */}
                        {hoveredNode && !selectedNode && (
                            <g className="tooltip" style={{ pointerEvents: 'none' }}>
                                <rect
                                    x={hoveredNode.x + 20}
                                    y={hoveredNode.y - 30}
                                    width={Math.max(100, (hoveredNode.name?.length || 0) * 12 + 40)}
                                    height="50"
                                    rx="8"
                                    fill="#1E293B"
                                    stroke="#475569"
                                    strokeWidth="1"
                                    filter="drop-shadow(0 4px 16px rgba(0, 0, 0, 0.6))"
                                />
                                <text
                                    x={hoveredNode.x + 30}
                                    y={hoveredNode.y - 12}
                                    fill="#F1F5F9"
                                    fontSize="12"
                                    fontWeight="600"
                                >
                                    {hoveredNode.name}
                                </text>
                                <text
                                    x={hoveredNode.x + 30}
                                    y={hoveredNode.y + 6}
                                    fill="#94A3B8"
                                    fontSize="10"
                                >
                                    {hoveredNode.position || hoveredNode.desc || ''}
                                </text>
                            </g>
                        )}
                        </g>
                    </svg>
                </div>

                {/* 선택된 노드 정보 */}
                {selectedNode && (
                    <div className="mt-6 bg-slate-800/50 backdrop-blur rounded-2xl shadow-sm border border-slate-700 p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    {selectedNode.name}
                                </h3>
                                {selectedNode.position && (
                                    <p className="text-gray-400 mt-1">{selectedNode.position}</p>
                                )}
                            </div>
                            <button
                                onClick={handleBackgroundClick}
                                className="text-gray-500 hover:text-gray-300 p-2 transition"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {selectedNode.jrti && (
                                <div className="bg-blue-900/40 border border-blue-700/50 rounded-xl p-3">
                                    <p className="text-blue-400 text-xs font-medium">연수원 기수</p>
                                    <p className="text-blue-200 font-bold">{selectedNode.jrti}기</p>
                                </div>
                            )}
                            {selectedNode.university && selectedNode.university !== '-' && (
                                <div className="bg-emerald-900/40 border border-emerald-700/50 rounded-xl p-3">
                                    <p className="text-emerald-400 text-xs font-medium">출신 대학</p>
                                    <p className="text-emerald-200 font-bold">{selectedNode.university}</p>
                                </div>
                            )}
                            {selectedNode.hometown && (
                                <div className="bg-amber-900/40 border border-amber-700/50 rounded-xl p-3">
                                    <p className="text-amber-400 text-xs font-medium">출신 지역</p>
                                    <p className="text-amber-200 font-bold">{selectedNode.hometown}</p>
                                </div>
                            )}
                            {selectedNode.highSchool && (
                                <div className="bg-violet-900/40 border border-violet-700/50 rounded-xl p-3">
                                    <p className="text-violet-400 text-xs font-medium">출신 고교</p>
                                    <p className="text-violet-200 font-bold">{selectedNode.highSchool}</p>
                                </div>
                            )}
                            {selectedNode.firm && (
                                <div className="bg-red-900/40 border border-red-700/50 rounded-xl p-3">
                                    <p className="text-red-400 text-xs font-medium">소속 로펌</p>
                                    <p className="text-red-200 font-bold">{selectedNode.firm}</p>
                                </div>
                            )}
                            {selectedNode.desc && (
                                <div className="bg-slate-700/50 rounded-xl p-3 col-span-2">
                                    <p className="text-slate-400 text-xs font-medium">설명</p>
                                    <p className="text-slate-200">{selectedNode.desc}</p>
                                </div>
                            )}
                        </div>

                        {/* 연결된 관계 */}
                        {highlightedNodes.size > 1 && (
                            <div className="mt-4 pt-4 border-t border-slate-700">
                                <p className="text-sm text-slate-400 mb-2">
                                    연결된 관계 ({highlightedNodes.size - 1}개)
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from(highlightedNodes)
                                        .filter(id => id !== selectedNode.id)
                                        .map(nodeId => {
                                            // 모든 노드에서 찾기
                                            const allNodes = [
                                                ...layout.personPositions,
                                                ...layout.outerPositions.jrti,
                                                ...layout.outerPositions.university,
                                                ...layout.outerPositions.region,
                                                ...layout.outerPositions.firm,
                                                ...layout.outerPositions.highschool,
                                            ];
                                            const node = allNodes.find(n => n.id === nodeId);
                                            if (!node) return null;

                                            const typeColors = {
                                                jrti: 'bg-blue-900/60 text-blue-300 border border-blue-700/50',
                                                university: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
                                                region: 'bg-amber-900/60 text-amber-300 border border-amber-700/50',
                                                firm: 'bg-red-900/60 text-red-300 border border-red-700/50',
                                                highschool: 'bg-violet-900/60 text-violet-300 border border-violet-700/50',
                                            };
                                            const colorClass = typeColors[node.type] || 'bg-slate-700/60 text-slate-300 border border-slate-600';

                                            return (
                                                <span
                                                    key={nodeId}
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
                                                >
                                                    {node.name}
                                                </span>
                                            );
                                        })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 통계 요약 */}
                <div className="mt-6 bg-gradient-to-r from-red-950/60 to-orange-950/60 border border-red-800/40 rounded-2xl p-6">
                    <h4 className="font-bold text-red-300 mb-4">전관예우 통계 요약 (2017-2025)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-black/20 rounded-xl p-4 text-center">
                            <p className="text-3xl font-bold text-red-400">229</p>
                            <p className="text-sm text-slate-400 mt-1">10대 로펌 영입 판사</p>
                        </div>
                        <div className="bg-black/20 rounded-xl p-4 text-center">
                            <p className="text-3xl font-bold text-red-400">79</p>
                            <p className="text-sm text-slate-400 mt-1">김앤장 영입 (34.5%)</p>
                        </div>
                        <div className="bg-black/20 rounded-xl p-4 text-center">
                            <p className="text-3xl font-bold text-emerald-400">33%</p>
                            <p className="text-sm text-slate-400 mt-1">서울대 출신 법관</p>
                        </div>
                        <div className="bg-black/20 rounded-xl p-4 text-center">
                            <p className="text-3xl font-bold text-purple-400">9/9</p>
                            <p className="text-sm text-slate-400 mt-1">헌재 서울대 출신</p>
                        </div>
                    </div>
                </div>

                {/* 대법원 통계 */}
                <div className="mt-4 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-800/40 rounded-2xl p-6">
                    <h4 className="font-bold text-blue-300 mb-4">대법원 현황 (2025)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-black/20 rounded-xl p-4 text-center">
                            <p className="text-3xl font-bold text-blue-400">14</p>
                            <p className="text-sm text-slate-400 mt-1">대법관 정원</p>
                        </div>
                        <div className="bg-black/20 rounded-xl p-4 text-center">
                            <p className="text-3xl font-bold text-blue-400">71%</p>
                            <p className="text-sm text-slate-400 mt-1">서울대 출신 (10/14)</p>
                        </div>
                        <div className="bg-black/20 rounded-xl p-4 text-center">
                            <p className="text-3xl font-bold text-indigo-400">6년</p>
                            <p className="text-sm text-slate-400 mt-1">임기 (연임 가능)</p>
                        </div>
                        <div className="bg-black/20 rounded-xl p-4 text-center">
                            <p className="text-3xl font-bold text-indigo-400">65세</p>
                            <p className="text-sm text-slate-400 mt-1">정년 (대법원장 70세)</p>
                        </div>
                    </div>
                </div>

                {/* 대형로펌 현황 통계 */}
                <div className="mt-4 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                    <h4 className="font-bold text-slate-200 mb-2">6대 로펌 현황 (2024-2025)</h4>
                    <p className="text-xs text-slate-500 mb-4">* 전문인력 = 한국변호사 + 외국변호사 + 변리사 + 공인회계사 | 변호사 수: '24.11월 기준 | 매출: '24년 국세청 신고 기준</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* 김앤장 */}
                        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-600 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-lg font-bold text-slate-100">김앤장</p>
                                    <p className="text-xs text-slate-500">Kim & Chang</p>
                                </div>
                                <span className="bg-yellow-900/60 text-yellow-300 border border-yellow-700/50 text-xs font-semibold px-2 py-1 rounded">1위</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">전문인력 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-bold text-slate-200">2,000명+</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">한국변호사 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-medium text-slate-300">1,100명+</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">매출액 <span className="text-xs text-slate-600">('23)</span></span>
                                    <span className="text-sm font-bold text-blue-400">~1.3조원</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">SKY 비율 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-medium text-purple-400">80.0%</span>
                                </div>
                            </div>
                        </div>
                        {/* 광장 */}
                        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-600 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-lg font-bold text-slate-100">광장</p>
                                    <p className="text-xs text-slate-500">Lee & Ko</p>
                                </div>
                                <span className="bg-slate-700/60 text-slate-300 border border-slate-600 text-xs font-semibold px-2 py-1 rounded">2위</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">변호사 수 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-bold text-slate-200">608명</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">매출액 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-bold text-blue-400">4,309억</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">1인당 매출 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-medium text-green-400">7.13억</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">SKY 비율 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-medium text-purple-400">84.4%</span>
                                </div>
                            </div>
                        </div>
                        {/* 세종 */}
                        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-600 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-lg font-bold text-slate-100">세종</p>
                                    <p className="text-xs text-slate-500">Shin & Kim</p>
                                </div>
                                <span className="bg-slate-700/60 text-slate-300 border border-slate-600 text-xs font-semibold px-2 py-1 rounded">3위</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">변호사 수 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-bold text-slate-200">603명</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">매출액 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-bold text-blue-400">4,363억</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">1인당 매출 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-medium text-green-400">7.24억</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">SKY 비율 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-medium text-purple-400">82.9%</span>
                                </div>
                            </div>
                        </div>
                        {/* 태평양 */}
                        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-600 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-lg font-bold text-slate-100">태평양</p>
                                    <p className="text-xs text-slate-500">Bae, Kim & Lee</p>
                                </div>
                                <span className="bg-slate-700/60 text-slate-300 border border-slate-600 text-xs font-semibold px-2 py-1 rounded">4위</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">변호사 수 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-bold text-slate-200">560명</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">매출액 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-bold text-blue-400">~4,000억</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">1인당 매출 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-medium text-green-400">7.38억</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">SKY 비율 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-medium text-purple-400">77.1%</span>
                                </div>
                            </div>
                        </div>
                        {/* 율촌 */}
                        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-600 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-lg font-bold text-slate-100">율촌</p>
                                    <p className="text-xs text-slate-500">Yulchon</p>
                                </div>
                                <span className="bg-slate-700/60 text-slate-300 border border-slate-600 text-xs font-semibold px-2 py-1 rounded">5위</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">변호사 수 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-bold text-slate-200">540명</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">매출액 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-bold text-blue-400">4,080억</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">1인당 매출 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-medium text-green-400">7.60억</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">SKY 비율 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-medium text-purple-400">74.4%</span>
                                </div>
                            </div>
                        </div>
                        {/* 화우 */}
                        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-600 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-lg font-bold text-slate-100">화우</p>
                                    <p className="text-xs text-slate-500">Yoon & Yang</p>
                                </div>
                                <span className="bg-slate-700/60 text-slate-300 border border-slate-600 text-xs font-semibold px-2 py-1 rounded">6위</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">변호사 수 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-bold text-slate-200">~370명</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">매출액 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-bold text-blue-400">2,812억</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">1인당 매출 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-medium text-green-400">7.62억</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">SKY 비율 <span className="text-xs text-slate-600">('24)</span></span>
                                    <span className="text-sm font-medium text-purple-400">60.0%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="bg-black/20 rounded-lg p-3">
                                <p className="text-xl font-bold text-slate-200">~3,780명</p>
                                <p className="text-xs text-slate-500">6대 로펌 총 변호사 ('24)</p>
                            </div>
                            <div className="bg-black/20 rounded-lg p-3">
                                <p className="text-xl font-bold text-blue-400">~2.1조</p>
                                <p className="text-xs text-slate-500">6대 로펌 총 매출 ('24)</p>
                            </div>
                            <div className="bg-black/20 rounded-lg p-3">
                                <p className="text-xl font-bold text-green-400">7.3억</p>
                                <p className="text-xs text-slate-500">평균 1인당 매출 ('24)</p>
                            </div>
                            <div className="bg-black/20 rounded-lg p-3">
                                <p className="text-xl font-bold text-purple-400">76.5%</p>
                                <p className="text-xs text-slate-500">평균 SKY 비율 ('24)</p>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-4 text-right">출처: 법률신문, Asia Business Law Journal, 한국경제 (2024-2025)</p>
                </div>

                {/* 사용 안내 */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-950/50 border border-blue-800/40 rounded-2xl p-5">
                        <h4 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            사용 방법
                        </h4>
                        <ul className="text-sm text-blue-300/70 space-y-1.5">
                            <li>- 노드 클릭: 상세 정보 및 연결 관계 확인</li>
                            <li>- 필터 버튼: 특정 유형 표시/숨기기</li>
                            <li>- 빈 공간 클릭: 선택 해제</li>
                        </ul>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                        <h4 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            데이터 출처
                        </h4>
                        <ul className="text-sm text-slate-400 space-y-1.5">
                            <li>- 대법원 공식 홈페이지, 헌법재판소</li>
                            <li>- 법률신문, 한국NGO신문 (2017-2025)</li>
                            <li>- 리걸타임즈, 나무위키</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default JudicialNetwork;
