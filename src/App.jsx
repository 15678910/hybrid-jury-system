import { useState, useEffect, useRef } from 'react';
import Poster from './Poster'
import { Link, useNavigate } from 'react-router-dom'
import FloatingChat from './CozeFloatingChat'
import { collection, addDoc, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db, auth, RecaptchaVerifier, signInWithPhoneNumber } from './lib/firebase';
import ConsentCheckbox from './components/ConsentCheckbox';
import LoginModal from './components/LoginModal';
import { onAuthChange, signOut as authSignOut, getUserInfo, checkUserSignature, checkGoogleRedirectResult } from './lib/auth';

// 카카오톡 아이콘
const KakaoIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.89 5.33 4.71 6.73l-.96 3.57c-.07.27.2.5.45.38l4.27-2.43c.49.05 1 .08 1.53.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
    </svg>
);

// 페이스북 아이콘
const FacebookIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

// X (트위터) 아이콘
const XIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

// 인스타그램 아이콘
const InstagramIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
);

// 이름 표시 함수 (전체 이름 공개)
const maskName = (name) => {
    if (!name || name.length === 0) return '';
    return name;
};

// 전화번호 마스킹 함수 (예: 010-1234-5678 → 010-****-5678)
const maskPhone = (phone) => {
    if (!phone) return '';
    // 하이픈이 있는 경우
    if (phone.includes('-')) {
        const parts = phone.split('-');
        if (parts.length === 3) {
            return `${parts[0]}-****-${parts[2]}`;
        }
    }
    // 하이픈이 없는 경우 (예: 01012345678)
    if (phone.length === 11) {
        return phone.slice(0, 3) + '-****-' + phone.slice(7);
    }
    return phone;
};

// 텔레그램 아이콘
const TelegramIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
);

export default function App() {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('home');
    const [selectedCountry, setSelectedCountry] = useState('독일');

    const [formData, setFormData] = useState({
        name: '',
        type: 'individual',
        address: '',
        talent: '',
        phone: '',
        sns: [],
        addressVerified: false // Daum API로 입력된 주소인지 확인
    });

    const [signatures, setSignatures] = useState([]);
    const [stats, setStats] = useState({ individual: 0, organization: 0, total: 0, telegram: 0, kakao: 0 });
    const [showNotification, setShowNotification] = useState(false);
    const [latestSignature, setLatestSignature] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [showPosterModal, setShowPosterModal] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mediaDropdownOpen, setMediaDropdownOpen] = useState(false);
    const [introDropdownOpen, setIntroDropdownOpen] = useState(false);

    // 최신 블로그 글 상태
    const [latestPosts, setLatestPosts] = useState([]);

    // SMS 인증 관련 상태
    const [verificationCode, setVerificationCode] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const recaptchaContainerRef = useRef(null);
    const recaptchaVerifierRef = useRef(null);

    // 하루 등록 제한 관련 상태
    const [todayRegistrations, setTodayRegistrations] = useState(0);
    const [isDailyLimitReached, setIsDailyLimitReached] = useState(false);
    const DAILY_LIMIT = 1000; // 하루 최대 등록 수 (Firebase 무료 한도)

    // 동의 체크박스 상태
    const [consents, setConsents] = useState({
        age14: false,
        privacy: false,
        terms: false
    });

    // 로그인 상태
    const [user, setUser] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    // LoginModal 상태를 App에서 관리 (리렌더링 방지)
    const [loginModalStep, setLoginModalStep] = useState('select'); // 'select' | 'confirm'
    const [loginModalUser, setLoginModalUser] = useState(null);
    const [loginModalProvider, setLoginModalProvider] = useState(null);
    // Google 로그인 진행 중 플래그 (useRef로 리렌더링 없이 상태 유지)
    const googleLoginInProgress = useRef(false);
    const [hasSignature, setHasSignature] = useState(null); // null = 로딩중, true = 서명함, false = 서명 안함

    const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin2025'; // 환경변수 사용

    // Firestore에서 서명 데이터 불러오기
    useEffect(() => {
        const fetchSignatures = async () => {
            try {
                const signaturesRef = collection(db, 'signatures');
                const q = query(signaturesRef, orderBy('timestamp', 'desc'));
                const querySnapshot = await getDocs(q);

                const firestoreSignatures = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setSignatures(firestoreSignatures);

                // 오늘 등록자 수 계산
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayCount = firestoreSignatures.filter(sig => {
                    const sigDate = new Date(sig.timestamp);
                    return sigDate >= today;
                }).length;

                setTodayRegistrations(todayCount);
                setIsDailyLimitReached(todayCount >= DAILY_LIMIT);
            } catch (error) {
                console.error('Error fetching signatures:', error);
            }
        };

        fetchSignatures();
    }, []);

    // 최신 블로그 글 불러오기
    useEffect(() => {
        const fetchLatestPosts = async () => {
            try {
                const postsRef = collection(db, 'posts');
                const q = query(postsRef, orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const posts = querySnapshot.docs.slice(0, 3).map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    date: doc.data().createdAt?.toDate().toLocaleDateString('ko-KR') || ''
                }));
                setLatestPosts(posts);
            } catch (error) {
                console.error('Error fetching latest posts:', error);
            }
        };

        fetchLatestPosts();
    }, []);

    // 페이지 첫 로드 시 URL 파라미터 처리 (포스터/로그인 모달은 initAuth에서 처리)
    useEffect(() => {
        // URL 파라미터로 관리자 접근 확인 (먼저)
        const params = new URLSearchParams(window.location.search);

        // Redirect 파라미터 체크 (우선순위 높음)
        const redirectPath = params.get('r');
        if (redirectPath) {
            // URL에서 r 파라미터 제거하고 해당 경로로 이동
            navigate(redirectPath, { replace: true });
            return; // 다른 로직 실행하지 않음
        }

        const adminParam = params.get('key');

        // URL 해시 체크 (예: /#signature)
        const hash = window.location.hash;
        if (hash) {
            const sectionId = hash.replace('#', '');
            // 약간의 딜레이 후 스크롤 (DOM이 준비될 때까지 대기)
            setTimeout(() => {
                const element = document.getElementById(sectionId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                    setActiveSection(sectionId);
                }
            }, 100);
            return; // 해시가 있으면 포스터/로그인 모달 열지 않음
        }

        console.log('Admin key:', adminParam); // 디버깅용

        if (adminParam === 'admin999') {
            console.log('Opening admin login modal'); // 디버깅용
            setShowAdminLogin(true);
        }
        // 포스터 모달은 initAuth에서 로그인 상태 확인 후 표시
    }, [navigate]);

    // 로그인 모달 표시 (로그인 안 된 경우)
    useEffect(() => {
        const initAuth = async () => {
            console.log('[App] initAuth 시작');

            // Google 리다이렉트 결과 확인 (먼저 처리해야 함 - URL 해시에 id_token이 있을 수 있음)
            const redirectResult = await checkGoogleRedirectResult();
            console.log('[App] redirectResult:', redirectResult);

            if (redirectResult && redirectResult.success && redirectResult.user) {
                console.log('[App] Google 리다이렉트 성공');
                // 리다이렉트 로그인 성공 - 포스터 팝업 표시
                setUser(redirectResult.user);
                setShowPosterModal(true);
                return;
            }

            // URL 해시가 있으면 모달 표시 안 함 (스크롤 링크로 접속한 경우)
            // 단, id_token 해시는 이미 위에서 처리됨
            const hash = window.location.hash;
            console.log('[App] hash:', hash);
            if (hash && !hash.includes('id_token')) {
                console.log('[App] 해시 있음 - 모달 표시 안 함');
                return;
            }

            // 카카오 로그인 확인
            const kakaoUser = sessionStorage.getItem('kakaoUser') || localStorage.getItem('kakaoUser');
            if (kakaoUser) {
                console.log('[App] 카카오 로그인 상태 확인됨');
                // 이미 로그인됨 - 포스터 팝업만 표시
                setShowPosterModal(true);
                return;
            }

            // Google 세션 로그인 확인 (Firebase 실패해도 세션에 저장됨)
            const googleUser = sessionStorage.getItem('googleUser');
            if (googleUser) {
                console.log('[App] Google 세션 로그인 상태 확인됨');
                try {
                    const parsedUser = JSON.parse(googleUser);
                    setUser(parsedUser);
                    setShowPosterModal(true);
                    return;
                } catch (e) {
                    console.error('[App] Google 세션 파싱 실패:', e);
                    sessionStorage.removeItem('googleUser');
                }
            }

            // Firebase Auth 상태 확인 (비동기로 로드될 수 있음)
            const currentUser = await new Promise((resolve) => {
                const unsubscribe = onAuthChange((authUser) => {
                    unsubscribe();
                    resolve(authUser);
                });
                // 1초 내에 응답 없으면 null로 처리
                setTimeout(() => resolve(null), 1000);
            });

            console.log('[App] Firebase currentUser:', currentUser?.email || 'null');

            if (currentUser) {
                // 이미 로그인됨 - 포스터 팝업만 표시
                console.log('[App] 이미 로그인됨 - 포스터 팝업 표시');
                setShowPosterModal(true);
                return;
            }

            // 로그인 안 되어 있으면 로그인 모달 표시
            console.log('[App] 로그인 안됨 - 로그인 모달 표시');
            setShowPosterModal(false);
            setShowLoginModal(true);
        };

        // 페이지 로드 후 실행
        const timer = setTimeout(initAuth, 300);
        return () => clearTimeout(timer);
    }, []);

    // 로그인 상태 감지
    useEffect(() => {
        const unsubscribe = onAuthChange((authUser) => {
            console.log('Auth 상태 변경:', authUser ? authUser.email || authUser.displayName : 'null');
            console.log('[App] googleLoginInProgress:', googleLoginInProgress.current);

            // Google 로그인 진행 중일 때는 user 상태 업데이트를 스킵
            // LoginModal에서 로그인 완료 처리를 직접 함
            if (googleLoginInProgress.current) {
                console.log('[App] Google 로그인 진행 중 - user 업데이트 스킵');
                return;
            }

            setUser(authUser);

            // 로그인 하면 자동으로 이름/이메일 채우기 (전화번호는 제외 - 인증 필요)
            if (authUser) {
                const userInfo = getUserInfo(authUser);
                setFormData(prev => ({
                    ...prev,
                    name: userInfo.displayName || prev.name,
                    // phone는 자동으로 채우지 않음 (인증 필요)
                }));
            }
        });

        return () => unsubscribe();
    }, []);

    // 초기 데이터 로드 및 통계 업데이트
    useEffect(() => {
        updateStats(signatures);
    }, [signatures]);

    // 통계 업데이트
    const updateStats = (sigs) => {
        const individual = sigs.filter(s => s.type === 'individual').length;
        const organization = sigs.filter(s => s.type === 'organization').length;
        const telegram = sigs.filter(s => s.sns && s.sns.includes('telegram')).length;
        const kakao = sigs.filter(s => s.sns && s.sns.includes('kakao')).length;
        setStats({
            individual,
            organization,
            total: individual + organization,
            telegram,
            kakao
        });
    };

    // 관리자 로그인
    const handleAdminLogin = (e) => {
        e.preventDefault();
        if (adminPassword === ADMIN_PASSWORD) {
            setIsAdmin(true);
            setShowAdminLogin(false);
            setAdminPassword('');
            alert('관리자 모드로 로그인되었습니다.');
        } else {
            alert('비밀번호가 올바르지 않습니다.');
            setAdminPassword('');
        }
    };

    // 관리자 로그아웃
    const handleAdminLogout = () => {
        setIsAdmin(false);
        alert('로그아웃되었습니다.');
    };

    // 사용자 로그인 성공 핸들러
    const handleLoginSuccess = (loggedInUser) => {
        console.log('로그인 성공:', loggedInUser);

        // 로그인 완료 후 플래그 해제
        googleLoginInProgress.current = false;
        console.log('[App] 로그인 완료 - googleLoginInProgress = false');

        // user 상태 업데이트
        setUser(loggedInUser);

        // 모달 상태 초기화
        setShowLoginModal(false);
        setLoginModalStep('select');
        setLoginModalUser(null);
        setLoginModalProvider(null);

        // 로그인 후 포스터 팝업 표시
        setShowPosterModal(true);
    };

    // 사용자 로그아웃 핸들러
    const handleUserLogout = async () => {
        const result = await authSignOut();
        if (result.success) {
            setFormData(prev => ({
                ...prev,
                name: '',
                // phone는 그대로 유지 (인증 필요)
            }));
            alert('로그아웃되었습니다.');
        } else {
            alert('로그아웃 실패: ' + result.error);
        }
    };

    // 엑셀 다운로드 함수 (관리자 전용)
    const downloadExcel = async () => {
        // SheetJS 동적 로드
        const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');

        // 데이터 준비
        const excelData = signatures.map((sig, index) => ({
            '번호': signatures.length - index,
            '이름/단체명': sig.name,
            '구분': sig.type === 'individual' ? '개인' : '단체',
            '재능나눔': sig.talent || '-',
            '전화번호': sig.phone || '-',
            '텔레그램': sig.sns.includes('telegram') ? 'O' : 'X',
            '카카오톡': sig.sns.includes('kakao') ? 'O' : 'X',
            '서명일시': new Date(sig.timestamp).toLocaleString('ko-KR')
        }));

        // 통계 시트 데이터
        const statsData = [
            { '구분': '총 지지자', '수': stats.total },
            { '구분': '개인 지지', '수': stats.individual },
            { '구분': '단체 지지', '수': stats.organization },
            { '구분': '텔레그램 가입', '수': stats.telegram },
            { '구분': '카카오톡 가입', '수': stats.kakao }
        ];

        // 워크북 생성
        const wb = XLSX.utils.book_new();

        // 서명 데이터 시트
        const ws1 = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws1, '지지서명목록');

        // 통계 시트
        const ws2 = XLSX.utils.json_to_sheet(statsData);
        XLSX.utils.book_append_sheet(wb, ws2, '통계');

        // 파일 다운로드
        const timestamp = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `혼합형참심제_지지서명_${timestamp}.xlsx`);
    };

    // SNS 토글
    const toggleSNS = (platform) => {
        setFormData(prev => ({
            ...prev,
            sns: prev.sns.includes(platform)
                ? prev.sns.filter(s => s !== platform)
                : [...prev.sns, platform]
        }));
    };

    // reCAPTCHA 초기화
    const initRecaptcha = () => {
        // 기존 reCAPTCHA 정리
        if (recaptchaVerifierRef.current) {
            try {
                recaptchaVerifierRef.current.clear();
            } catch (e) {
                console.log('reCAPTCHA clear error:', e);
            }
            recaptchaVerifierRef.current = null;
        }

        // 컨테이너 내용 초기화 (안전한 DOM 조작)
        if (recaptchaContainerRef.current) {
            while (recaptchaContainerRef.current.firstChild) {
                recaptchaContainerRef.current.removeChild(recaptchaContainerRef.current.firstChild);
            }

            recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
                size: 'invisible',
                callback: () => {
                    console.log('reCAPTCHA solved');
                },
                'expired-callback': () => {
                    console.log('reCAPTCHA expired');
                    recaptchaVerifierRef.current = null;
                }
            });
        }
    };

    // SMS 인증 코드 발송
    const sendVerificationCode = async () => {
        // 하루 등록 한도 체크
        if (isDailyLimitReached) {
            alert('오늘 등록 한도(1,000명)에 도달했습니다.\n내일 다시 시도해주세요.');
            return;
        }

        const phoneClean = formData.phone.replace(/[\s-]/g, '');
        console.log('전화번호 검증:', phoneClean, '길이:', phoneClean.length);

        // 전화번호 형식 검증 (010으로 시작, 정확히 11자리)
        if (!/^010[0-9]{8}$/.test(phoneClean)) {
            alert('올바른 휴대폰 번호를 입력해주세요.\n(010으로 시작하는 11자리 숫자)');
            return;
        }

        // 중복 체크
        const existingPhone = signatures.find(sig =>
            sig.phone && sig.phone.replace(/[\s-]/g, '') === phoneClean
        );
        if (existingPhone) {
            alert('이미 등록된 전화번호입니다.');
            return;
        }

        setIsSendingCode(true);

        try {
            initRecaptcha();

            // 한국 국가 코드 추가
            const phoneNumber = '+82' + phoneClean.substring(1);

            const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifierRef.current);
            setConfirmationResult(confirmation);
            alert('인증 코드가 발송되었습니다. SMS를 확인해주세요.');
        } catch (error) {
            console.error('SMS 발송 오류:', error);
            if (error.code === 'auth/too-many-requests') {
                alert('너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.');
            } else if (error.code === 'auth/invalid-phone-number') {
                alert('유효하지 않은 전화번호입니다.');
            } else {
                alert(`인증 코드 발송에 실패했습니다.\n에러 코드: ${error.code}\n메시지: ${error.message}`);
            }
            // reCAPTCHA 리셋
            recaptchaVerifierRef.current = null;
        } finally {
            setIsSendingCode(false);
        }
    };

    // 인증 코드 확인
    const verifyCode = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            alert('6자리 인증 코드를 입력해주세요.');
            return;
        }

        setIsVerifying(true);

        try {
            await confirmationResult.confirm(verificationCode);
            setIsPhoneVerified(true);
            alert('전화번호 인증이 완료되었습니다!');
        } catch (error) {
            console.error('인증 코드 확인 오류:', error);
            if (error.code === 'auth/invalid-verification-code') {
                alert('인증 코드가 올바르지 않습니다.');
            } else {
                alert('인증에 실패했습니다. 다시 시도해주세요.');
            }
        } finally {
            setIsVerifying(false);
        }
    };

    // 서명 제출
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 동의 체크 확인
        if (!consents.age14 || !consents.privacy || !consents.terms) {
            alert('필수 동의 항목에 모두 체크해주세요.');
            return;
        }

        // 로그인 사용자 중복 서명 확인
        if (user?.uid) {
            const alreadySigned = await checkUserSignature(user.uid);
            if (alreadySigned) {
                alert('이미 참여하셨습니다! 참여는 1회만 가능합니다.');
                return;
            }
        }

        if (!formData.name || !formData.phone) {
            alert('이름과 전화번호를 입력해주세요.');
            return;
        }

        // 전화번호 인증 확인
        if (!isPhoneVerified) {
            alert('전화번호 인증을 완료해주세요.');
            return;
        }

        // 이름 유효성 검증 (한글 2-20자, 단체명은 더 길 수 있음)
        const nameRegex = /^[가-힣a-zA-Z\s]{2,20}$/;
        if (!nameRegex.test(formData.name.trim())) {
            alert('이름을 올바르게 입력해주세요. (한글 또는 영문 2-20자)');
            return;
        }

        // 전화번호 유효성 검증 (010으로 시작, 정확히 11자리)
        const phoneClean = formData.phone.replace(/[\s-]/g, '');
        const phoneRegex = /^010[0-9]{8}$/;
        if (!phoneRegex.test(phoneClean)) {
            alert('올바른 휴대폰 번호를 입력해주세요.\n(010으로 시작하는 11자리 숫자)');
            return;
        }

        // 가짜 번호 차단 (연속 숫자, 반복 숫자, 예시 번호)
        const middleAndLast = phoneClean.slice(3); // 010 제외한 나머지
        const fakePatterns = [
            '12345678', '11111111', '22222222', '33333333', '44444444',
            '55555555', '66666666', '77777777', '88888888', '99999999',
            '00000000', '11112222', '12341234', '56785678', '00001111'
        ];
        if (fakePatterns.includes(middleAndLast) || /^(.)\1{6,}$/.test(middleAndLast)) {
            alert('유효한 전화번호를 입력해주세요.');
            return;
        }

        // 뒷자리 4자리 반복 패턴 차단 (예: 2222, 3333)
        const lastFour = phoneClean.slice(-4);
        if (/^(.)\1{3}$/.test(lastFour)) {
            alert('유효한 전화번호를 입력해주세요. (반복되는 숫자 불가)');
            return;
        }

        // 주소 검증 - Daum API로 입력된 주소인지 확인
        if (formData.address && !formData.addressVerified) {
            alert('주소는 주소 검색 버튼을 통해 입력해주세요.');
            return;
        }

        // 전화번호 중복 체크
        const existingPhone = signatures.find(sig =>
            sig.phone && sig.phone.replace(/[\s-]/g, '') === phoneClean
        );
        if (existingPhone) {
            alert('이미 등록된 전화번호입니다.');
            return;
        }

        // 이름+전화번호 조합 중복 체크
        const existingCombo = signatures.find(sig =>
            sig.name === formData.name.trim() &&
            sig.phone && sig.phone.replace(/[\s-]/g, '') === phoneClean
        );
        if (existingCombo) {
            alert('이미 동일한 이름과 전화번호로 등록되어 있습니다.');
            return;
        }

        try {
            // addressVerified는 저장하지 않음 (검증용 플래그)
            const { addressVerified, ...dataToSave } = formData;
            const newSignature = {
                ...dataToSave,
                timestamp: new Date().toISOString(),
                // 로그인 정보 추가
                userId: user?.uid || null,
                loginMethod: user?.providerData?.[0]?.providerId || 'none',
                userEmail: user?.email || null
            };

            // Firestore에 저장
            const docRef = await addDoc(collection(db, 'signatures'), newSignature);

            // 로컬 상태 업데이트 (Firestore에서 생성된 ID 사용)
            const savedSignature = { ...newSignature, id: docRef.id };
            setSignatures(prev => [savedSignature, ...prev]);

            // 알림 표시
            setLatestSignature(savedSignature);
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 5000);

            // SNS 자동 가입 처리
            if (formData.sns.length > 0) {
                formData.sns.forEach(platform => {
                    if (platform === 'telegram') {
                        window.open('https://t.me/judicialreform', '_blank');
                    } else if (platform === 'kakao') {
                        window.open('https://open.kakao.com/o/g1wj6P3h', '_blank');
                    }
                });
            }

            // 폼 초기화
            setFormData({
                name: '',
                type: 'individual',
                address: '',
                talent: '',
                phone: '',
                sns: [],
                addressVerified: false
            });

            // 인증 상태 초기화
            setIsPhoneVerified(false);
            setConfirmationResult(null);
            setVerificationCode('');

            // 참여 기록 localStorage에 저장 (재방문 시 자동 로그인 팝업용)
            localStorage.setItem('hasParticipated', 'true');

            // 오늘 등록자 수 업데이트
            const newTodayCount = todayRegistrations + 1;
            setTodayRegistrations(newTodayCount);
            if (newTodayCount >= DAILY_LIMIT) {
                setIsDailyLimitReached(true);
            }

            alert('✅ 지지 서명이 등록되었습니다!');
        } catch (error) {
            console.error('Error saving signature:', error);
            alert('서명 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    };

    const scrollToSection = (sectionId) => {
        setActiveSection(sectionId);
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    };

    // SNS 공유 함수들
    const shareToKakao = () => {
        const url = 'https://시민법정.kr';
        const text = '주권자에 의한 시민법관 참심제! 함께해주세요.';
        window.open('https://story.kakao.com/share?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text), '_blank', 'width=600,height=400');
    };

    const shareToFacebook = () => {
        const url = 'https://시민법정.kr';
        window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank', 'width=600,height=400');
    };

    const shareToTwitter = () => {
        const url = 'https://시민법정.kr';
        const text = '주권자에 의한 시민법관 참심제! 함께해주세요.';
        window.open('https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text), '_blank', 'width=600,height=400');
    };

    const shareToInstagram = () => {
        navigator.clipboard.writeText('주권자에 의한 시민법관 참심제! https://시민법정.kr');
        alert('텍스트가 복사되었습니다! 인스타그램 스토리나 게시물에 붙여넣기 해주세요.');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <header className="bg-white shadow-md fixed top-0 w-full z-50">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center justify-between py-4">
                        <div className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => scrollToSection('necessity')}>
                            ⚖️ 사법개혁
                        </div>

                        {/* 데스크톱 메뉴 */}
                        <div className="hidden lg:flex space-x-6 text-sm items-center">
                            {/* 소개 */}
                            <a href="/intro.html" className="hover:text-blue-600 transition font-medium">소개</a>

                            {/* 소통방 드롭다운 */}
                            <div
                                className="relative"
                                onMouseEnter={() => setIntroDropdownOpen(true)}
                                onMouseLeave={() => setIntroDropdownOpen(false)}
                            >
                                <button
                                    className="hover:text-blue-600 transition font-medium flex items-center gap-1"
                                >
                                    소통방
                                    <svg className={`w-4 h-4 transition-transform ${introDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className={`absolute top-full left-0 mt-0 pt-2 ${introDropdownOpen ? 'block' : 'hidden'}`}>
                                    <div className="bg-white rounded-lg shadow-lg border py-2 min-w-[140px] z-50">
                                        <Link
                                            to="/governance"
                                            className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600"
                                        >
                                            의사결정
                                        </Link>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => scrollToSection('necessity')} className="hover:text-blue-600 transition font-medium">도입 필요성</button>
                            <button onClick={() => scrollToSection('cases')} className="hover:text-blue-600 transition font-medium">해외 사례</button>
                            <button onClick={() => scrollToSection('constitution')} className="hover:text-blue-600 transition font-medium">헌법적 근거</button>
                            <button onClick={() => scrollToSection('bill')} className="hover:text-blue-600 transition font-medium">법안 제안</button>

                            {/* 미디어 드롭다운 */}
                            <div
                                className="relative"
                                onMouseEnter={() => setMediaDropdownOpen(true)}
                                onMouseLeave={() => setMediaDropdownOpen(false)}
                            >
                                <button
                                    className="hover:text-blue-600 transition font-medium flex items-center gap-1"
                                >
                                    미디어
                                    <svg className={`w-4 h-4 transition-transform ${mediaDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className={`absolute top-full left-0 mt-0 pt-2 ${mediaDropdownOpen ? 'block' : 'hidden'}`}>
                                    <div className="bg-white rounded-lg shadow-lg border py-2 min-w-[120px] z-50">
                                        <Link
                                            to="/blog"
                                            className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600"
                                        >
                                            블로그
                                        </Link>
                                        <Link
                                            to="/videos"
                                            className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600"
                                        >
                                            동영상
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => scrollToSection('signature')}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-bold"
                            >
                                참여하기
                            </button>
                        </div>

                        {/* 모바일 햄버거 버튼 */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden text-gray-600 hover:text-blue-600 transition p-2"
                            aria-label="메뉴"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </nav>

                    {/* 모바일 메뉴 드롭다운 */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden bg-white border-t border-gray-200 py-4 space-y-2">
                            {/* 소개 */}
                            <a
                                href="/intro.html"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition font-medium"
                            >
                                소개
                            </a>

                            {/* 모바일 소통방 서브메뉴 */}
                            <div className="border-b border-gray-200 pb-2 mb-2">
                                <div className="px-4 py-2 text-gray-500 text-sm font-medium">소통방</div>
                                <Link
                                    to="/governance"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block w-full text-left px-6 py-2 hover:bg-gray-100 transition"
                                >
                                    의사결정
                                </Link>
                            </div>
                            <button
                                onClick={() => { scrollToSection('necessity'); setMobileMenuOpen(false); }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                도입 필요성
                            </button>
                            <button
                                onClick={() => { scrollToSection('cases'); setMobileMenuOpen(false); }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                해외 사례
                            </button>
                            <button
                                onClick={() => { scrollToSection('constitution'); setMobileMenuOpen(false); }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                헌법적 근거
                            </button>
                            <button
                                onClick={() => { scrollToSection('bill'); setMobileMenuOpen(false); }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                법안 제안
                            </button>

                            {/* 모바일 미디어 서브메뉴 */}
                            <div className="border-t border-gray-200 pt-2 mt-2">
                                <div className="px-4 py-2 text-gray-500 text-sm font-medium">미디어</div>
                                <Link
                                    to="/blog"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block w-full text-left px-6 py-2 hover:bg-gray-100 transition"
                                >
                                    블로그
                                </Link>
                                <Link
                                    to="/videos"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block w-full text-left px-6 py-2 hover:bg-gray-100 transition"
                                >
                                    동영상
                                </Link>
                            </div>

                            <button
                                onClick={() => { scrollToSection('signature'); setMobileMenuOpen(false); }}
                                className="block w-full text-left px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition font-bold"
                            >
                                참여하기
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* 관리자 로그인 모달 */}
            {showAdminLogin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
                        <h3 className="text-2xl font-bold mb-4">관리자 로그인</h3>
                        <form onSubmit={handleAdminLogin}>
                            <input
                                type="password"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                placeholder="비밀번호를 입력하세요"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                                >
                                    로그인
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAdminLogin(false);
                                        setAdminPassword('');
                                    }}
                                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-400 transition"
                                >
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 알림 */}
            {showNotification && latestSignature && (
                <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-pulse">
                    <div className="font-bold">🎉 새로운 지지 서명!</div>
                    <div className="text-sm">{latestSignature.name}님 ({latestSignature.type === 'individual' ? '개인' : '단체'})</div>
                </div>
            )}

            {/* 메인 히어로 */}
            <section id="necessity" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pt-32 pb-20 px-4 mt-16">
                <div className="container mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        헌법 개정 없이 가능한
                    </h1>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="text-orange-400">시민법관 참심제!</span>
                    </h1>
                    <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto">
                        '모든 권력은 국민으로부터 나온다'는 헌법 제1조 2항의 정신을 사법에서 실현합니다.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={() => scrollToSection('signature')}
                            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition transform hover:scale-105"
                        >
                            준비위원으로 참여하기
                        </button>
                        <button
                            onClick={() => window.location.href = '/proposal.html'}
                            className="bg-orange-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-orange-600 transition transform hover:scale-105"
                        >
                            제안서 및 법률안
                        </button>
                    </div>

                    {/* 추가 정보 */}
                    <div className="mt-8 flex flex-col items-center gap-3 text-white">
                        <p className="text-base md:text-lg">
                            온라인 준비위원으로 <span className="font-bold text-yellow-300">1만명</span>이 참여하면 광장에서 주권자 세상 시작합니다.
                        </p>
                    </div>
                </div>
            </section>

            {/* 국민 동의 */}
            <section className="py-20 px-4 bg-white">
                <div className="container mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">국민의 77.8%가 동의한 사법개혁</h2>

                    <p className="text-center text-gray-700 text-lg mb-12 max-w-4xl mx-auto leading-relaxed">
                        2005년 사법제도개혁추진위원회(사개추위)의 여론조사 결과, 국민 대다수가 사법 절차에 시민의 참여가 필요하다고 응답했습니다. 이는 사법부에 대한 국민적 신뢰가 낮으며, 재판 과정에 국민의 상식이 반영되기를 강력히 원한다는 것을 보여줍니다.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-12 max-w-5xl mx-auto">
                        {/* 도넛 차트 */}
                        <div className="relative w-64 h-64">
                            <svg viewBox="0 0 100 100" className="transform -rotate-90">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="20"
                                    strokeDasharray="195.6 251.2" strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-sm text-gray-500">시민참여 필요</div>
                                <div className="text-4xl font-bold text-blue-600">77.8%</div>
                            </div>
                        </div>

                        <div className="max-w-md space-y-4">
                            <div className="bg-blue-50 p-6 rounded-lg">
                                <h3 className="font-bold text-lg mb-2">국민참여배심제의 한계</h3>
                                <p className="text-gray-700 text-sm">
                                    2007년 도입된 '국민참여재판'은 배심원의 평결이 법관을 기속하지 않아 유명무실합니다.
                                </p>
                            </div>

                            <div className="bg-green-50 p-6 rounded-lg">
                                <h3 className="font-bold text-lg mb-2">이제는 '혼합형 참심제'</h3>
                                <p className="text-gray-700 text-sm">
                                    직업 법관과 시민법관이 '함께' 평의하고 '동등하게' 판결하는 진정한 시민 참여를 실현합니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 제안 모델 */}
            <section id="model" className="py-20 px-4 bg-gray-50">
                <div className="container mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">제안 모델: 혼합형 참심 재판부</h2>
                    <p className="text-center text-gray-600 mb-12">
                        독일, 프랑스 등 유럽을 참고하여 3:6 구성을 제안합니다.
                    </p>

                    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
                        <h3 className="text-2xl font-bold text-center mb-8">재판부 구성(예시: 법률안 제5조)</h3>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
                            {/* 직업법관 */}
                            <div className="text-center">
                                <div className="text-xl font-bold text-gray-700 mb-4">직업법관</div>
                                <div className="flex gap-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-20 h-20 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-sm">
                                            법관
                                        </div>
                                    ))}
                                </div>
                                <div className="text-2xl font-bold mt-4">3인</div>
                            </div>

                            <div className="text-3xl text-gray-400">+</div>

                            {/* 시민 참심원 */}
                            <div className="text-center">
                                <div className="text-xl font-bold text-gray-700 mb-4">시민법관</div>
                                <div className="grid grid-cols-3 gap-2">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="w-20 h-20 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                                            시민
                                        </div>
                                    ))}
                                </div>
                                <div className="text-2xl font-bold mt-4">6인</div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h4 className="font-bold mb-3">핵심 원칙</h4>
                            <ul className="space-y-2 text-gray-700 text-sm">
                                <li>• <strong>동등한 권한:</strong> 직업법관과 시민법관 전원이 동등한 1표씩 행사.</li>
                                <li>• <strong>함께 심리:</strong> 사실인정(유/무죄)과 양형(형량) 모두를 함께 평의.</li>
                                <li>• <strong>기속력 있는 평결:</strong> 유죄 판결 시, 과반수 외 '직업법관 1명 이상+시민법관 1명 이상'의 찬성을 동시 요구. (특별다수결)</li>
                                <li>• <strong>무작위 선발:</strong> 대표성 담보</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 해외 사례 */}
            <section id="cases" className="py-20 px-4 bg-white">
                <div className="container mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">시민참여 사법제도 해외 사례</h2>
                    <p className="text-center text-gray-600 mb-12">
                        독일, 스웨덴, 핀란드, 노르웨이, 프랑스 등 다수의 대륙법계 국가가 혼합형 참심제도를 안정적으로 운영하고 있습니다.
                    </p>

                    {/* 국가 탭 */}
                    <div className="max-w-5xl mx-auto mb-8">
                        <div className="flex flex-wrap gap-2 justify-center border-b border-gray-300">
                            {['독일', '스웨덴', '핀란드', '노르웨이', '프랑스', '덴마크', '일본', 'EU'].map(country => (
                                <button
                                    key={country}
                                    onClick={() => setSelectedCountry(country)}
                                    className={`px-6 py-3 font-medium transition ${selectedCountry === country
                                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {country}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 국가별 상세 정보 */}
                    <div className="max-w-5xl mx-auto">
                        {selectedCountry === '독일' && (
                            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                                <h3 className="text-2xl font-bold mb-4 text-blue-600">독일: 참심제(Schöffengericht)</h3>
                                <p className="text-gray-700 mb-6">
                                    독일은 1924년 배심제를 폐지하고 참심제로 전환하여 가장 성공적으로 운영 중인 국가입니다. 직업법관과 시민법관이 모든 권한을 동등하게 행사합니다.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">구성:</div>
                                        <div className="text-gray-700">지방법원(Landgericht) 1심 기준 직업법관 3인 + 시민법관 2인. (사안에 따라 직업법관 1인 + 시민법관 2인 구성도 있음)</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">선발:</div>
                                        <div className="text-gray-700">지방의회 추천 목록을 기반으로 법원의 선발위원회에서 선출 (임기 5년).</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">권한:</div>
                                        <div className="text-gray-700">유/무죄 및 양형 결정에 대해 직업법관과 시민법관이 동등한 1표를 행사.</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">평결:</div>
                                        <div className="text-gray-700">재판부 구성원 3분의 2 이상의 다수결로 결정. 직업법관만으로는 유죄 판결이 불가능한 구조.</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedCountry === '스웨덴' && (
                            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                                <h3 className="text-2xl font-bold mb-4 text-blue-600">스웨덴: 참심제(Nämnddemän)</h3>
                                <p className="text-gray-700 mb-6">
                                    스웨덴은 오랜 참심제 전통을 가진 국가입니다. 다만 정당 추천 방식의 한계가 지적되고 있습니다.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">구성:</div>
                                        <div className="text-gray-700">1심: 직업법관 1인 + 참심원 3인, 항소심: 직업법관 3인 + 참심원 2인</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">선발:</div>
                                        <div className="text-gray-700">정당 추천 방식 (편향성 논란 존재)</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">권한:</div>
                                        <div className="text-gray-700">사실인정 + 법률 적용 + 양형 결정</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">평결:</div>
                                        <div className="text-gray-700">1심: 단순 다수결, 참심원 우위 가능</div>
                                    </div>

                                </div>
                            </div>
                        )}

                        {selectedCountry === '핀란드' && (
                            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                                <h3 className="text-2xl font-bold mb-4 text-blue-600">핀란드: 참심제(Lautamiehet)</h3>
                                <p className="text-gray-700 mb-6">
                                    핀란드는 지방 의회 선출 방식의 참심제를 운영하고 있습니다. 시민 참심원의 영향력이 상대적으로 강한 편입니다.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">구성:</div>
                                        <div className="text-gray-700">직업법관 1인 + 참심원 2인 (중대 형사 1심)</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">선발:</div>
                                        <div className="text-gray-700">지방 의회 선출</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">권한:</div>
                                        <div className="text-gray-700">사실인정 + 법률 적용 + 양형 결정</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">평결:</div>
                                        <div className="text-gray-700">단순 다수결 (참심원이 다수를 이루어 시민 우위 가능)</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedCountry === '노르웨이' && (
                            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                                <h3 className="text-2xl font-bold mb-4 text-blue-600">노르웨이: 병용제 (배심제 + 참심제)</h3>
                                <p className="text-gray-700 mb-6">
                                    노르웨이는 사건의 중대성에 따라 배심제와 참심제를 선택적으로 적용하는 유연한 시스템을 운영합니다.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">구성:</div>
                                        <div className="text-gray-700">참심(1심): 1인 + 2인, 참심(항소심): 3인 + 4인, 배심(항소심): 3인 + 10인</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">선발:</div>
                                        <div className="text-gray-700">위원회 선정 (정당 영향 존재)</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">권한:</div>
                                        <div className="text-gray-700">참심: 전 과정 참여, 배심: 사실인정만</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">평결:</div>
                                        <div className="text-gray-700">사건 유형에 따라 다수결 또는 특별다수결</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedCountry === '프랑스' && (
                            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                                <h3 className="text-2xl font-bold mb-4 text-blue-600">프랑스: 중죄법원 (Cour d'Assises)</h3>
                                <p className="text-gray-700 mb-6">
                                    프랑스는 중대 형사사건에 대해 직업법관 3인과 시민 배심원 9인이 함께 재판하는 강력한 혼합형 시스템을 운영합니다.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">구성:</div>
                                        <div className="text-gray-700">직업법관 3인 + 시민 배심원 9인 (총 12인)</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">선발:</div>
                                        <div className="text-gray-700">무작위 추첨 + 심사 (기피 제도 활용)</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">권한:</div>
                                        <div className="text-gray-700">사실인정 + 법률 적용 + 양형 결정 (배심원이 실질적 참심원 역할)</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">평결:</div>
                                        <div className="text-gray-700">특별다수결 (유죄 판결에 높은 합의 요구)</div>
                                    </div>

                                </div>
                            </div>
                        )}

                        {selectedCountry === '덴마크' && (
                            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                                <h3 className="text-2xl font-bold mb-4 text-blue-600">덴마크: 병용제 (배심제 + 참심제)</h3>
                                <p className="text-gray-700 mb-6">
                                    덴마크는 사건의 중대성과 피고인의 선택에 따라 배심제와 참심제를 병용하는 시스템입니다.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">구성:</div>
                                        <div className="text-gray-700">배심: 3인 + 12인, 참심(1심): 1인 + 2인, 참심(항소심): 3인 + 3인</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">선발:</div>
                                        <div className="text-gray-700">정당 추천 기반</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">권한:</div>
                                        <div className="text-gray-700">배심: 사실인정만, 참심: 전 과정 참여</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">평결:</div>
                                        <div className="text-gray-700">배심: 특별다수결(8+), 참심: 다수결</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedCountry === '일본' && (
                            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                                <h3 className="text-2xl font-bold mb-4 text-blue-600">일본: 재판원제도 (Saiban-in)</h3>
                                <p className="text-gray-700 mb-6">
                                    일본은 2009년 도입한 현대적 혼합형 참심제로, 한국 모델의 주요 참고 사례입니다.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">구성:</div>
                                        <div className="text-gray-700">직업법관 3인 + 재판원 6인 (표준 모델)</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">선발:</div>
                                        <div className="text-gray-700">무작위 추첨 + 심사 (기피 제도)</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">권한:</div>
                                        <div className="text-gray-700">사실인정 + 법률 적용 + 양형 결정</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">평결:</div>
                                        <div className="text-gray-700">다수결 (단, 각 그룹에서 최소 1인 이상 찬성 필요)</div>
                                    </div>

                                </div>
                            </div>
                        )}

                        {selectedCountry === 'EU' && (
                            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                                <h3 className="text-2xl font-bold mb-4 text-blue-600">EU: 유럽연합의 시민 참여 사법제도</h3>
                                <p className="text-gray-700 mb-6">
                                    유럽연합 회원국 대다수가 다양한 형태의 시민 참여 사법제도를 운영하고 있으며, 이는 유럽 사법 전통의 핵심입니다.
                                </p>
                                <div className="space-y-6">
                                    <div className="bg-blue-50 p-6 rounded-lg">
                                        <h4 className="font-bold text-lg mb-3 text-blue-700">📊 현황</h4>
                                        <ul className="space-y-2 text-gray-700">
                                            <li>• EU 27개 회원국 중 다수가 참심제 또는 배심제 운영</li>
                                            <li>• 독일, 프랑스, 스웨덴, 핀란드, 덴마크, 노르웨이 등 전통적 참심제 국가</li>
                                            <li>• 오스트리아, 벨기에, 이탈리아, 스페인 등도 유사 제도 보유</li>
                                        </ul>
                                    </div>

                                    <div className="bg-green-50 p-6 rounded-lg">
                                        <h4 className="font-bold text-lg mb-3 text-green-700">🎯 공통 특징</h4>
                                        <ul className="space-y-2 text-gray-700">
                                            <li>• <strong>민주적 정당성:</strong> 시민 참여를 통한 사법의 민주화</li>
                                            <li>• <strong>혼합 재판부:</strong> 직업법관과 시민이 함께 판단</li>
                                            <li>• <strong>형사사건 중심:</strong> 주로 중대 형사사건에 적용</li>
                                            <li>• <strong>동등한 권한:</strong> 사실인정, 법률적용, 양형에 모두 참여</li>
                                        </ul>
                                    </div>

                                    <div className="bg-purple-50 p-6 rounded-lg">
                                        <h4 className="font-bold text-lg mb-3 text-purple-700">✅ 성공 요인</h4>
                                        <ul className="space-y-2 text-gray-700">
                                            <li>• 오랜 역사와 전통 (일부 국가는 100년 이상)</li>
                                            <li>• 체계적인 교육 및 지원 시스템</li>
                                            <li>• 명확한 법적 근거와 절차</li>
                                            <li>• 높은 국민적 신뢰와 참여율</li>
                                        </ul>
                                    </div>

                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 헌법적 근거 */}
            <section id="constitution" className="py-20 px-4 bg-gray-50">
                <div className="container mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">도입의 핵심 근거</h2>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <div className="bg-white p-8 rounded-lg shadow-lg">
                            <h3 className="text-xl font-bold mb-4 text-blue-600">사법 신뢰 회복 및 투명성</h3>
                            <p className="text-gray-700">
                                사법이 직업 법관으로만 운영되는 폐쇄적 구조에서 시민이 참여하는 개방적 구조로 전환하여
                                사법에 대한 국민의 신뢰를 높이고 투명성을 강화합니다.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-lg shadow-lg">
                            <h3 className="text-xl font-bold mb-4 text-blue-600">국민의 건전한 상식 반영</h3>
                            <p className="text-gray-700">
                                직업 법관의 전문성과 시민의 상식이 결합하여 더 균형잡힌 판결을 내릴 수 있습니다.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-lg shadow-lg md:col-span-2">
                            <h3 className="text-xl font-bold mb-4 text-blue-600">헌법적 근거: "헌법 개정 없이 가능"</h3>
                            <p className="text-gray-700 mb-4">
                                참심제 도입의 가장 큰 우려는 헌법 제27조 1항("모든 국민은... 법관에 의하여 법률에 의한 재판을 받을 권리를 가진다")과의 충돌입니다.
                            </p>
                            <p className="text-gray-700 mb-4">
                                그러나 헌법 제101조 3항은 "법관의 자격은 법률로 정한다"고 명시하고 있습니다. 이는 '법관'의 범위를 정하는 권한이 입법부인 국회에 있음을 의미합니다.
                            </p>
                            <p className="text-gray-700 font-semibold">
                                따라서 국회가 '법원조직법' 또는 '신규 특별법'을 개정·제정하여 '시민법관'의 자격, 선임 절차, 권한과 의무를 명확히 규정한다면, 시민법관 역시 헌법이 정한 '법관'의 범주에 포함시킬 수 있습니다. <strong>이는 헌법 개정 없이 법률 개정만으로도 도입이 가능함을 의미합니다.</strong>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 법안 제안 */}
            <section id="bill" className="py-20 px-4 bg-white">
                <div className="container mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">참심제도 제안 법률안(요지)</h2>
                    <p className="text-center text-gray-600 mb-6">
                        새로 제안된 '제안 법률안'은 참심제 도입을 위한 구체적인 내용을 담고 있습니다.
                    </p>

                    <div className="text-center mb-8">
                        <button
                            onClick={() => window.location.href = '/proposal.html'}
                            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition transform hover:scale-105 shadow-lg"
                        >
                            제안서 및 법률안 원문(PDF)
                        </button>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gray-50 p-8 rounded-lg">
                            <h3 className="text-xl font-bold mb-6 text-blue-600">참심제 운용에 관한 법률안 (가칭)</h3>

                            <div className="space-y-4">
                                {[
                                    { num: 1, title: '목적 (제1조)', desc: '국민이 시민법관으로 참여, 직업법관과 함께 재판권을 행사. 사법의 민주적 정당성, 투명성, 신뢰 증진을 목적으로 함.' },
                                    { num: 2, title: '적용 범위 (제3조)', desc: '1심 중대 형사사건 (예: 법정합의부 사건, 사형, 무기 또는 단기 1년 이상 징역 사건). 피고인 자백 여부와 무관.' },
                                    { num: 3, title: '재판부 구성 (제5조)', desc: '직업법관 3인 + 시민법관 6인 (필요시 9인까지 증가 가능). 참심원이 다수를 구성.' },
                                    { num: 4, title: '시민법관 권한 (제6조)', desc: '직업법관과 동등한 권한 (질문권, 평의, 표결권). 사실인정, 법령 적용, 유/무죄 및 양형에 모두 참여.' },
                                    { num: 5, title: '선발 (제8조~제12조)', desc: '무작위 추출 + 심사 + 기피 절차. 만 25세 이상 국민 명부에서 선정. 스웨덴식 정당 추천 배제.' },
                                    { num: 6, title: '임기 (제14조)', desc: '사건별 선임. (독일/스웨덴식 장기 임기 아님). 국민 참여 기회를 극대화하고 부담 감소.' },
                                    { num: 7, title: '평결 (제25조)', desc: '특별다수결. 과반수 찬성 + 유죄 판결 시 \'직업법관 1명 이상\' 및 \'시민법관 1명 이상\' 찬성 모두 요구.' },
                                    { num: 8, title: '절차 (제23조)', desc: '집중심리 및 연일 개정 권장. 재판장의 이해돕기 설명. 재판절차 이해 가능하게 국민 참여 보장.' }
                                ].map((item) => (
                                    <div key={item.num} className="flex gap-4 items-start">
                                        <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                            {item.num}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold mb-1">{item.title}</h4>
                                            <p className="text-gray-700 text-sm">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 지지 서명 */}
            <section id="signature" className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="container mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">주권자에 의한 시민법정!</h2>
                    <p className="text-center mb-12 text-lg">
                        시민법관 참심제도 도입을 위한 준비위원으로 참여해주세요. 여러분의 목소리가 주권자 세상을 만듭니다.
                    </p>

                    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-2xl p-8 text-gray-800">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* 로그인 상태 표시 및 로그인 버튼 */}
                            <div className="mb-6">
                                {user ? (
                                    /* 로그인한 사용자 - 서명 여부에 따라 다른 UI */
                                    hasSignature === null ? (
                                        /* 로딩중 - 빈 상태 */
                                        null
                                    ) : hasSignature ? (
                                        /* 이미 서명함 */
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {user.photoURL && (
                                                        <img
                                                            src={user.photoURL}
                                                            alt="프로필"
                                                            className="w-12 h-12 rounded-full border-2 border-green-300"
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-2xl">✅</span>
                                                            <span className="font-semibold text-green-900">{user.displayName}님</span>
                                                        </div>
                                                        <p className="text-sm text-green-700 mt-1">
                                                            이미 참여하셨습니다! 블로그 글쓰기 권한이 있습니다.
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleUserLogout}
                                                    className="px-4 py-2 text-sm border border-green-300 rounded-lg hover:bg-green-100 transition"
                                                >
                                                    로그아웃
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* 서명 안함 */
                                        <div className="bg-yellow-50 p-4 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {user.photoURL && (
                                                        <img
                                                            src={user.photoURL}
                                                            alt="프로필"
                                                            className="w-12 h-12 rounded-full border-2 border-yellow-300"
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-2xl">⚠️</span>
                                                            <span className="font-semibold text-yellow-900">{user.displayName}님</span>
                                                        </div>
                                                        <p className="text-sm text-yellow-700 mt-1">
                                                            아직 참여하지 않으셨습니다. 아래 양식을 작성해주세요.
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleUserLogout}
                                                    className="px-4 py-2 text-sm border border-yellow-300 rounded-lg hover:bg-yellow-100 transition"
                                                >
                                                    로그아웃
                                                </button>
                                            </div>
                                        </div>
                                    )
                                ) : null}
                            </div>

                            {/* 이름 */}
                            <div>
                                <label className="block font-bold mb-2">이름 또는 단체명 *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="예: 홍길동, OOOO시민단체"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* 구분 */}
                            <div>
                                <label className="block font-bold mb-2">구분 *</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="individual">개인</option>
                                    <option value="organization">단체</option>
                                </select>
                            </div>

                            {/* 주소 */}
                            <div>
                                <label className="block font-bold mb-2">주소</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.address}
                                        readOnly
                                        placeholder="주소 검색을 눌러주세요"
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onClick={() => {
                                            new window.daum.Postcode({
                                                oncomplete: function (data) {
                                                    // 시/도 + 구/군 + 동/읍/면 추출
                                                    const sido = data.sido; // 시/도
                                                    const sigungu = data.sigungu; // 구/군
                                                    const bname = data.bname; // 동/읍/면
                                                    const address = `${sido} ${sigungu} ${bname}`;
                                                    setFormData(prev => ({ ...prev, address, addressVerified: true }));
                                                }
                                            }).open();
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            new window.daum.Postcode({
                                                oncomplete: function (data) {
                                                    const sido = data.sido;
                                                    const sigungu = data.sigungu;
                                                    const bname = data.bname;
                                                    const address = `${sido} ${sigungu} ${bname}`;
                                                    setFormData(prev => ({ ...prev, address, addressVerified: true }));
                                                }
                                            }).open();
                                        }}
                                        className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition whitespace-nowrap"
                                    >
                                        주소 검색
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">동 단위까지만 저장됩니다. (개인정보 보호)</p>
                            </div>

                            {/* 재능 응원봉 */}
                            <div>
                                <label className="block font-bold mb-2">재능 응원봉</label>
                                <select
                                    value={['IT', '미디어', '마케팅', '재정', '독립연구자', ''].includes(formData.talent) ? formData.talent : '기타'}
                                    onChange={(e) => setFormData({ ...formData, talent: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">선택 안함</option>
                                    <option value="IT">IT</option>
                                    <option value="미디어">미디어</option>
                                    <option value="마케팅">마케팅</option>
                                    <option value="재정">재정</option>
                                    <option value="독립연구자">독립연구자</option>
                                    <option value="기타">기타 (직접 입력)</option>
                                </select>
                                {/* 기타 선택 시 직접 입력 */}
                                {(formData.talent === '기타' || (formData.talent && !['IT', '미디어', '마케팅', '재정', '독립연구자', ''].includes(formData.talent))) && (
                                    <input
                                        type="text"
                                        value={formData.talent === '기타' ? '' : formData.talent}
                                        onChange={(e) => setFormData({ ...formData, talent: e.target.value || '기타' })}
                                        placeholder="재능 분야를 직접 입력해주세요"
                                        className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                )}
                            </div>

                            {/* 전화번호 */}
                            <div>
                                <label className="block font-bold mb-2">전화번호 * {isPhoneVerified && <span className="text-green-600 text-sm">(인증완료)</span>}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => {
                                            setFormData({ ...formData, phone: e.target.value });
                                            // 전화번호가 변경되면 인증 상태 리셋
                                            if (isPhoneVerified) {
                                                setIsPhoneVerified(false);
                                                setConfirmationResult(null);
                                                setVerificationCode('');
                                            }
                                        }}
                                        placeholder="숫자만 입력"
                                        className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isPhoneVerified ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
                                        required
                                        disabled={isPhoneVerified}
                                    />
                                    {!isPhoneVerified && !confirmationResult && (
                                        <button
                                            type="button"
                                            onClick={sendVerificationCode}
                                            disabled={isSendingCode || !formData.phone}
                                            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            {isSendingCode ? '발송중...' : '인증요청'}
                                        </button>
                                    )}
                                </div>
                                {!isPhoneVerified && (
                                    <p className="mt-2 text-xs text-gray-500">
                                        * 인증번호는 <strong>xn--lg3b0kt4n41f.kr</strong> (시민법정.kr)에서 발송됩니다. 스팸이 아니니 안심하세요.
                                    </p>
                                )}

                                {/* 인증 코드 입력 */}
                                {confirmationResult && !isPhoneVerified && (
                                    <div className="mt-3 flex gap-2">
                                        <input
                                            type="text"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="6자리 인증코드 입력"
                                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            maxLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={verifyCode}
                                            disabled={isVerifying || verificationCode.length !== 6}
                                            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition whitespace-nowrap disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            {isVerifying ? '확인중...' : '인증확인'}
                                        </button>
                                    </div>
                                )}

                                {/* reCAPTCHA 컨테이너 */}
                                <div ref={recaptchaContainerRef} id="recaptcha-container"></div>
                            </div>

                            {/* 하루 등록 한도 안내 */}
                            {isDailyLimitReached && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-yellow-800">📢 오늘 등록이 마감되었습니다</h3>
                                            <p className="mt-1 text-sm text-yellow-700">
                                                많은 분들의 관심에 감사드립니다.
                                                <br /><br />
                                                시스템 안정을 위해 하루 등록 인원을 제한하고 있습니다.
                                                <br />
                                                <strong>내일 오전 12시(자정) 이후</strong>에 다시 시도해주세요.
                                                <br /><br />
                                                <span className="text-yellow-600">※ 매일 자정에 등록이 초기화됩니다.</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 동의 체크박스 */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <ConsentCheckbox
                                    consents={consents}
                                    onChange={setConsents}
                                />
                            </div>

                            {/* 제출 버튼 */}
                            <button
                                type="submit"
                                disabled={isDailyLimitReached || !consents.age14 || !consents.privacy || !consents.terms}
                                className={`w-full py-4 rounded-lg font-bold text-lg transition transform ${isDailyLimitReached || !consents.age14 || !consents.privacy || !consents.terms
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                                    }`}
                            >
                                {isDailyLimitReached ? '오늘 등록 마감' : (!consents.age14 || !consents.privacy || !consents.terms) ? '필수 동의 필요' : '참여하기'}
                            </button>
                        </form>

                        {/* SNS 그룹 참여 안내 */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h4 className="text-lg font-bold text-center mb-4 text-gray-800">
                                SNS 그룹에 참여하세요!
                            </h4>
                            <p className="text-sm text-gray-600 text-center mb-4">
                                함께 소통하고 활동 소식을 받아보세요
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                {/* 카카오톡 오픈채팅 */}
                                <a
                                    href="https://open.kakao.com/o/g1wj6P3h"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-12 h-12 flex items-center justify-center bg-[#FEE500] rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                                    title="카카오톡 오픈채팅"
                                >
                                    <KakaoIcon className="w-6 h-6 text-[#391B1B]" />
                                </a>
                                {/* 텔레그램 */}
                                <a
                                    href="https://t.me/siminbupjung"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-12 h-12 flex items-center justify-center bg-[#0088cc] rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                                    title="텔레그램"
                                >
                                    <TelegramIcon className="w-6 h-6 text-white" />
                                </a>
                                {/* X (트위터) */}
                                <a
                                    href="https://x.com/chamsimje67719"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-12 h-12 flex items-center justify-center bg-black rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                                    title="X (트위터)"
                                >
                                    <XIcon className="w-5 h-5 text-white" />
                                </a>
                                {/* 인스타그램 */}
                                <a
                                    href="https://www.instagram.com/siminbupjung"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-12 h-12 flex items-center justify-center bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                                    title="인스타그램"
                                >
                                    <InstagramIcon className="w-6 h-6 text-white" />
                                </a>
                                {/* 페이스북 */}
                                <a
                                    href="https://www.facebook.com/profile.php?id=61585298259020"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-12 h-12 flex items-center justify-center bg-[#1877F2] rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                                    title="페이스북"
                                >
                                    <FacebookIcon className="w-6 h-6 text-white" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 실시간 현황 */}
            <section id="stats" className="py-20 px-4 bg-white">
                <div className="container mx-auto">
                    <div className="flex justify-between items-center mb-12 max-w-4xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold">실시간 참가 현황</h2>
                        {isAdmin && (
                            <button
                                onClick={downloadExcel}
                                className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition flex items-center gap-2"
                            >
                                📊 엑셀 다운로드
                            </button>
                        )}
                    </div>

                    {/* 통계 */}
                    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-xl shadow-lg">
                            <div className="text-5xl font-bold mb-2 text-center">{stats.individual}</div>
                            <div className="text-xl text-center mb-4">개인</div>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4 max-h-32 overflow-y-auto">
                                <div className="text-sm text-center">
                                    {signatures
                                        .filter(s => s.type === 'individual')
                                        .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
                                        .map(sig => maskName(sig.name))
                                        .join(', ')}
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-8 rounded-xl shadow-lg">
                            <div className="text-5xl font-bold mb-2 text-center">{stats.organization}</div>
                            <div className="text-xl text-center mb-4">단체</div>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4 max-h-32 overflow-y-auto">
                                <div className="text-sm text-center">
                                    {signatures
                                        .filter(s => s.type === 'organization')
                                        .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
                                        .map(sig => maskName(sig.name))
                                        .join(', ')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 최신 소식 섹션 */}
            <section className="py-16 px-4 bg-gradient-to-r from-slate-800 to-slate-900">
                <div className="container mx-auto max-w-4xl">
                    <div className="text-center mb-10">
                        <h3 className="text-2xl font-bold text-white mb-2">최신 소식</h3>
                        <p className="text-gray-400">참심제와 사법개혁에 관한 소식을 전합니다</p>
                    </div>

                    {latestPosts.length > 0 ? (
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            {latestPosts.map(post => (
                                <Link
                                    key={post.id}
                                    to={`/blog/${post.id}`}
                                    className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-5 hover:bg-opacity-20 transition-all duration-300 group"
                                >
                                    <h4 className="text-white font-bold mb-2 line-clamp-2 group-hover:text-blue-300 transition">
                                        {post.title}
                                    </h4>
                                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                                        {post.summary || post.content?.substring(0, 100)}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>{post.author}</span>
                                        <span>{post.date}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-8">
                            아직 등록된 글이 없습니다.
                        </div>
                    )}

                    <div className="text-center">
                        <Link
                            to="/blog"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white bg-opacity-10 text-white rounded-full hover:bg-opacity-20 transition-all duration-300 font-medium"
                        >
                            더 많은 글 보기
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>


            {/* 푸터 */}
            <footer className="bg-gray-900 text-gray-400 py-6 px-4">
                <div className="container mx-auto text-center">
                    <p>© 주권자사법개혁추진준비위원회</p>
                </div>
            </footer>

            {/* 포스터 모달 */}
            {showPosterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-0 z-50 overflow-auto">
                    <Poster key={Date.now()} onClose={() => setShowPosterModal(false)} />
                </div>
            )}

            {/* 로그인 모달 */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => {
                    setShowLoginModal(false);
                    setLoginModalStep('select');
                    setLoginModalUser(null);
                    setLoginModalProvider(null);
                    googleLoginInProgress.current = false;
                }}
                onLoginSuccess={handleLoginSuccess}
                step={loginModalStep}
                setStep={setLoginModalStep}
                selectedUser={loginModalUser}
                setSelectedUser={setLoginModalUser}
                selectedProvider={loginModalProvider}
                setSelectedProvider={setLoginModalProvider}
                googleLoginInProgress={googleLoginInProgress}
            />

            {/* 플로팅 챗봇 */}
            <FloatingChat />

        </div>
    );
}