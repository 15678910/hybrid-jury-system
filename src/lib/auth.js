import {
    signInWithCredential,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from './firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc, addDoc } from 'firebase/firestore';

// 카카오 앱 키
const KAKAO_APP_KEY = '83e843186c1251b9b5a8013fd5f29798';

// 카카오 SDK 초기화
const initKakao = () => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_APP_KEY);
    }
};

// Google OAuth 설정
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '68915786798-unq8hgmt9q2f1egj34bmdvg4cokpcshs.apps.googleusercontent.com';

// Google OAuth URL 생성
const getGoogleAuthUrl = () => {
    // 현재 도메인을 redirect_uri로 사용
    // Google Cloud Console에 등록된 도메인이어야 함
    const redirectUri = window.location.origin;

    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'id_token',
        scope: 'openid email profile',
        nonce: Math.random().toString(36).substring(2),
        prompt: 'select_account'
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

// URL 해시에서 ID 토큰 추출
const extractIdTokenFromHash = () => {
    const fullHash = window.location.hash;
    console.log('[Auth] 전체 URL:', window.location.href);
    console.log('[Auth] URL 해시:', fullHash);

    if (!fullHash || fullHash.length <= 1) {
        console.log('[Auth] 해시 없음');
        return null;
    }

    const hash = fullHash.substring(1);
    const params = new URLSearchParams(hash);
    const idToken = params.get('id_token');

    console.log('[Auth] 추출된 id_token:', idToken ? `${idToken.substring(0, 50)}...` : 'null');
    return idToken;
};

// JWT ID 토큰에서 사용자 정보 추출 (Firebase 없이도 가능)
const decodeIdToken = (idToken) => {
    try {
        // JWT는 header.payload.signature 형식
        const parts = idToken.split('.');
        if (parts.length !== 3) {
            console.error('[Auth] Invalid JWT format');
            return null;
        }

        // Base64Url 디코딩
        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        const parsed = JSON.parse(decoded);

        console.log('[Auth] 디코딩된 토큰 정보:', {
            email: parsed.email,
            name: parsed.name,
            sub: parsed.sub
        });

        return {
            uid: parsed.sub, // Google unique ID
            email: parsed.email,
            displayName: parsed.name,
            photoURL: parsed.picture,
            provider: 'google'
        };
    } catch (error) {
        console.error('[Auth] JWT 디코딩 실패:', error);
        return null;
    }
};

// Google 계정 선택 및 로그인 (OAuth Implicit Flow)
export const selectGoogleAccount = async () => {
    try {
        console.log('[Auth] Google OAuth 로그인 시작...');

        // 현재 URL 저장 (로그인 후 돌아올 위치)
        sessionStorage.setItem('googleLoginReturnUrl', window.location.pathname);
        sessionStorage.setItem('googleLoginPending', 'true');

        // Google OAuth 페이지로 리다이렉트
        window.location.href = getGoogleAuthUrl();

        // 리다이렉트되므로 여기까지 실행되지 않음
        return { success: false, isRedirect: true };
    } catch (error) {
        console.error('[Auth] Google OAuth 에러:', error);
        await logLoginFailure('google', error.message);
        return {
            success: false,
            error: error.message || 'Google 로그인에 실패했습니다.'
        };
    }
};

// Firebase Auth 준비 대기
const waitForAuth = () => {
    return new Promise((resolve) => {
        if (auth.currentUser !== undefined) {
            resolve();
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, () => {
            unsubscribe();
            resolve();
        });
        // 최대 3초 대기
        setTimeout(resolve, 3000);
    });
};

// Google OAuth 리다이렉트 결과 확인 (페이지 로드 시 호출)
export const checkGoogleRedirectResult = async () => {
    try {
        // URL 해시에서 ID 토큰 확인
        const idToken = extractIdTokenFromHash();

        if (!idToken) {
            // 대기 중이었는데 토큰이 없으면 실패
            if (sessionStorage.getItem('googleLoginPending')) {
                sessionStorage.removeItem('googleLoginPending');
                sessionStorage.removeItem('googleLoginReturnUrl');
            }
            return null;
        }

        console.log('[Auth] Google ID 토큰 발견, 처리 중...');

        // URL 해시 제거 (보안 및 깔끔한 URL)
        window.history.replaceState(null, '', window.location.pathname + window.location.search);

        // ID 토큰에서 사용자 정보 추출 (Firebase 없이도 가능 - 즉시 반환)
        const user = decodeIdToken(idToken);
        if (!user) {
            throw new Error('ID 토큰 디코딩 실패');
        }

        console.log('[Auth] 사용자 정보 추출 성공:', user.email);

        // 세션에 사용자 정보 저장 (즉시)
        sessionStorage.setItem('googleUser', JSON.stringify(user));

        // 대기 상태 제거
        sessionStorage.removeItem('googleLoginPending');

        // 원래 페이지로 돌아갈 URL
        const returnUrl = sessionStorage.getItem('googleLoginReturnUrl') || '/';
        sessionStorage.removeItem('googleLoginReturnUrl');

        // Firebase 로그인은 백그라운드에서 시도 (결과 기다리지 않음)
        (async () => {
            try {
                await waitForAuth();
                const credential = GoogleAuthProvider.credential(idToken);
                const result = await signInWithCredential(auth, credential);
                console.log('[Auth] Firebase 백그라운드 로그인 성공:', result.user.email);

                // Firestore에 사용자 정보 저장
                await saveUserToFirestore({
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: result.user.displayName,
                    photoURL: result.user.photoURL,
                    provider: 'google'
                });
                await logLoginActivity(result.user.uid, 'google');
            } catch (error) {
                console.warn('[Auth] Firebase 백그라운드 로그인 실패 (무시됨):', error.code || error.message);
                // Firebase 실패해도 세션 로그인은 유지됨
            }
        })();

        return {
            success: true,
            user,
            returnUrl
        };
    } catch (error) {
        console.error('[Auth] Google 리다이렉트 결과 처리 에러:', error);
        sessionStorage.removeItem('googleLoginPending');
        sessionStorage.removeItem('googleLoginReturnUrl');

        // URL 해시 제거
        if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        return {
            success: false,
            error: error.message || 'Google 로그인 처리 중 오류가 발생했습니다.'
        };
    }
};

// Google 로그인 확인 (이미 로그인 완료됨, 저장된 사용자 정보 반환)
export const confirmGoogleLogin = async () => {
    // 이미 selectGoogleAccount에서 로그인 완료됨
    // 현재 로그인된 사용자 반환
    if (auth.currentUser) {
        return {
            success: true,
            user: auth.currentUser
        };
    }
    return {
        success: false,
        error: '로그인 세션이 만료되었습니다. 다시 시도해주세요.'
    };
};

// Kakao 계정 선택 (로그인 완료 전 - 정보만 가져오기)
export const selectKakaoAccount = () => {
    return new Promise((resolve) => {
        initKakao();

        if (!window.Kakao) {
            resolve({ success: false, error: 'Kakao SDK가 로드되지 않았습니다.' });
            return;
        }

        window.Kakao.Auth.login({
            success: async (authObj) => {
                try {
                    // 카카오 사용자 정보 가져오기
                    window.Kakao.API.request({
                        url: '/v2/user/me',
                        success: (res) => {
                            const kakaoUser = {
                                uid: `kakao_${res.id}`,
                                email: res.kakao_account?.email || '',
                                displayName: res.properties?.nickname || '카카오 사용자',
                                photoURL: res.properties?.profile_image || null,
                                provider: 'kakao',
                                kakaoId: res.id
                            };

                            // 임시로 사용자 정보 저장 (확인 후 로그인 완료 시 사용)
                            sessionStorage.setItem('pendingKakaoUser', JSON.stringify(kakaoUser));
                            sessionStorage.setItem('pendingKakaoToken', authObj.access_token);

                            // 로그아웃하지 않고 정보만 반환 (확인 화면 표시용)
                            resolve({
                                success: true,
                                user: kakaoUser
                            });
                        },
                        fail: (error) => {
                            console.error('카카오 사용자 정보 조회 실패:', error);
                            resolve({ success: false, error: '사용자 정보를 가져올 수 없습니다.' });
                        }
                    });
                } catch (error) {
                    console.error('카카오 계정 선택 에러:', error);
                    resolve({ success: false, error: error.message });
                }
            },
            fail: (error) => {
                console.error('카카오 로그인 실패:', error);
                resolve({ success: false, error: '카카오 로그인에 실패했습니다.' });
            }
        });
    });
};

// Kakao 로그인 완료 (확인 버튼 클릭 후)
export const confirmKakaoLogin = async () => {
    try {
        const pendingUser = sessionStorage.getItem('pendingKakaoUser');

        if (!pendingUser) {
            return { success: false, error: '카카오 계정 정보가 없습니다.' };
        }

        const kakaoUser = JSON.parse(pendingUser);

        // Firestore에 사용자 정보 저장
        await saveUserToFirestore(kakaoUser);

        // 로그인 활동 로그 기록
        await logLoginActivity(kakaoUser.uid, 'kakao');

        // sessionStorage에 카카오 로그인 상태 저장 (브라우저 탭/창을 닫으면 로그아웃)
        sessionStorage.setItem('kakaoUser', JSON.stringify(kakaoUser));

        // 임시 저장 데이터 삭제
        sessionStorage.removeItem('pendingKakaoUser');
        sessionStorage.removeItem('pendingKakaoToken');

        return {
            success: true,
            user: kakaoUser
        };
    } catch (error) {
        console.error('카카오 로그인 완료 에러:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Kakao 로그인 (기존 호환성 유지)
export const signInWithKakao = () => {
    return new Promise((resolve) => {
        initKakao();

        if (!window.Kakao) {
            resolve({ success: false, error: 'Kakao SDK가 로드되지 않았습니다.' });
            return;
        }

        window.Kakao.Auth.login({
            success: async (authObj) => {
                try {
                    // 카카오 사용자 정보 가져오기
                    window.Kakao.API.request({
                        url: '/v2/user/me',
                        success: async (res) => {
                            const kakaoUser = {
                                uid: `kakao_${res.id}`,
                                email: res.kakao_account?.email || '',
                                displayName: res.properties?.nickname || '카카오 사용자',
                                photoURL: res.properties?.profile_image || null,
                                provider: 'kakao',
                                kakaoId: res.id
                            };

                            // Firestore에 사용자 정보 저장
                            await saveUserToFirestore(kakaoUser);

                            // 로그인 활동 로그 기록
                            await logLoginActivity(kakaoUser.uid, 'kakao');

                            // sessionStorage에 카카오 로그인 상태 저장 (브라우저 탭/창을 닫으면 로그아웃)
                            sessionStorage.setItem('kakaoUser', JSON.stringify(kakaoUser));
                            sessionStorage.setItem('kakaoAccessToken', authObj.access_token);

                            resolve({
                                success: true,
                                user: kakaoUser
                            });
                        },
                        fail: (error) => {
                            console.error('카카오 사용자 정보 조회 실패:', error);
                            resolve({ success: false, error: '사용자 정보를 가져올 수 없습니다.' });
                        }
                    });
                } catch (error) {
                    console.error('카카오 로그인 처리 에러:', error);
                    resolve({ success: false, error: error.message });
                }
            },
            fail: (error) => {
                console.error('카카오 로그인 실패:', error);
                resolve({ success: false, error: '카카오 로그인에 실패했습니다.' });
            }
        });
    });
};

// 내부 로그 함수 (순환 참조 방지)
const logLoginActivity = async (userId, provider) => {
    try {
        const userAgent = navigator.userAgent || '';
        const logData = {
            userId,
            actionType: 'login',
            details: { provider, loginTime: new Date().toISOString() },
            timestamp: new Date(),
            userAgent,
            language: navigator.language || '',
            platform: navigator.platform || '',
            screenSize: `${window.screen.width}x${window.screen.height}`,
            pageUrl: window.location.href,
            pagePath: window.location.pathname,
            sessionId: sessionStorage.getItem('sessionId') || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        if (!sessionStorage.getItem('sessionId')) {
            sessionStorage.setItem('sessionId', logData.sessionId);
        }
        await addDoc(collection(db, 'activity_logs'), logData);
    } catch (error) {
        console.error('로그인 로그 기록 에러:', error);
    }
};

const logLoginFailure = async (provider, errorMessage) => {
    try {
        const logData = {
            userId: 'anonymous',
            actionType: 'login_failure',
            details: { provider, errorMessage, attemptTime: new Date().toISOString() },
            timestamp: new Date(),
            userAgent: navigator.userAgent || '',
            language: navigator.language || '',
            platform: navigator.platform || '',
            screenSize: `${window.screen.width}x${window.screen.height}`,
            pageUrl: window.location.href,
            pagePath: window.location.pathname,
            sessionId: sessionStorage.getItem('sessionId') || 'unknown'
        };
        await addDoc(collection(db, 'activity_logs'), logData);
    } catch (error) {
        console.error('로그인 실패 로그 기록 에러:', error);
    }
};

const logLogoutActivity = async (userId) => {
    try {
        const logData = {
            userId,
            actionType: 'logout',
            details: { logoutTime: new Date().toISOString() },
            timestamp: new Date(),
            userAgent: navigator.userAgent || '',
            language: navigator.language || '',
            platform: navigator.platform || '',
            screenSize: `${window.screen.width}x${window.screen.height}`,
            pageUrl: window.location.href,
            pagePath: window.location.pathname,
            sessionId: sessionStorage.getItem('sessionId') || 'unknown'
        };
        await addDoc(collection(db, 'activity_logs'), logData);
    } catch (error) {
        console.error('로그아웃 로그 기록 에러:', error);
    }
};

// Firestore에 사용자 정보 저장
const saveUserToFirestore = async (userData) => {
    try {
        const userRef = doc(db, 'users', userData.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // 새 사용자
            await setDoc(userRef, {
                ...userData,
                createdAt: new Date(),
                lastLoginAt: new Date()
            });
        } else {
            // 기존 사용자 - 마지막 로그인 시간 업데이트
            await setDoc(userRef, {
                lastLoginAt: new Date()
            }, { merge: true });
        }
    } catch (error) {
        console.error('사용자 정보 저장 에러:', error);
    }
};

// 로그아웃 (Google + Kakao)
export const signOut = async () => {
    try {
        // 현재 사용자 정보 가져오기 (로그아웃 전)
        const currentUser = getCurrentUser();
        const userId = currentUser?.uid;

        // Firebase 로그아웃
        await firebaseSignOut(auth);

        // 카카오 로그아웃
        if (window.Kakao && window.Kakao.Auth.getAccessToken()) {
            window.Kakao.Auth.logout(() => {
                console.log('카카오 로그아웃 완료');
            });
        }

        // sessionStorage 정리 (세션 기반 로그인)
        sessionStorage.removeItem('kakaoUser');
        sessionStorage.removeItem('kakaoAccessToken');
        // localStorage도 정리 (기존 데이터 호환)
        localStorage.removeItem('kakaoUser');
        localStorage.removeItem('kakaoAccessToken');

        // 로그아웃 활동 로그 기록
        if (userId) {
            await logLogoutActivity(userId);
        }

        return { success: true };
    } catch (error) {
        console.error('로그아웃 에러:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// 현재 사용자 정보 (Google 또는 Kakao)
export const getCurrentUser = () => {
    // Firebase 사용자 확인
    if (auth.currentUser) {
        return auth.currentUser;
    }

    // 카카오 사용자 확인 (sessionStorage 우선, localStorage는 기존 데이터 호환)
    const kakaoUser = sessionStorage.getItem('kakaoUser') || localStorage.getItem('kakaoUser');
    if (kakaoUser) {
        return JSON.parse(kakaoUser);
    }

    return null;
};

// 인증 상태 감지
export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
            callback(firebaseUser);
        } else {
            // 카카오 사용자 확인 (sessionStorage 우선, localStorage는 기존 데이터 호환)
            const kakaoUser = sessionStorage.getItem('kakaoUser') || localStorage.getItem('kakaoUser');
            if (kakaoUser) {
                callback(JSON.parse(kakaoUser));
            } else {
                callback(null);
            }
        }
    });
};

// 사용자 정보 추출
export const getUserInfo = (user) => {
    if (!user) return null;

    return {
        uid: user.uid,
        displayName: user.displayName || '',
        email: user.email || '',
        photoURL: user.photoURL || null,
        phoneNumber: user.phoneNumber || '',
        provider: user.provider || 'google',
        providerData: user.providerData
    };
};

// 사용자의 서명(참여) 여부 확인
export const checkUserSignature = async (userId) => {
    if (!userId) return false;

    try {
        const q = query(
            collection(db, 'signatures'),
            where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error('서명 확인 에러:', error);
        return false;
    }
};

// ==========================================
// 활동 로그 기록 시스템
// ==========================================

// 활동 로그 타입
export const LOG_TYPES = {
    LOGIN: 'login',
    LOGOUT: 'logout',
    VOTE: 'vote',
    COMMENT: 'comment',
    SIGNATURE: 'signature',
    PROPOSAL: 'proposal',
    PROPOSAL_SUPPORT: 'proposal_support',
    ADMIN_ACTION: 'admin_action'
};

// 활동 로그 기록
export const logActivity = async (userId, actionType, details = {}) => {
    try {
        // 브라우저 정보 수집
        const userAgent = navigator.userAgent || '';
        const language = navigator.language || '';
        const platform = navigator.platform || '';
        const screenSize = `${window.screen.width}x${window.screen.height}`;

        // 현재 페이지 URL
        const pageUrl = window.location.href;
        const pagePath = window.location.pathname;

        const logData = {
            userId: userId || 'anonymous',
            actionType,
            details,
            timestamp: new Date(),
            // 브라우저 정보
            userAgent,
            language,
            platform,
            screenSize,
            // 페이지 정보
            pageUrl,
            pagePath,
            // 세션 정보
            sessionId: getSessionId()
        };

        await addDoc(collection(db, 'activity_logs'), logData);

        return { success: true };
    } catch (error) {
        console.error('활동 로그 기록 에러:', error);
        return { success: false, error: error.message };
    }
};

// 세션 ID 생성/가져오기
const getSessionId = () => {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
};

// 로그인 로그 기록
export const logLogin = async (userId, provider) => {
    return logActivity(userId, LOG_TYPES.LOGIN, {
        provider,
        loginTime: new Date().toISOString()
    });
};

// 로그아웃 로그 기록
export const logLogout = async (userId) => {
    return logActivity(userId, LOG_TYPES.LOGOUT, {
        logoutTime: new Date().toISOString()
    });
};

// 투표 로그 기록
export const logVote = async (userId, topicId, vote) => {
    return logActivity(userId, LOG_TYPES.VOTE, {
        topicId,
        vote,
        voteTime: new Date().toISOString()
    });
};

// 댓글 로그 기록
export const logComment = async (userId, topicId, position) => {
    return logActivity(userId, LOG_TYPES.COMMENT, {
        topicId,
        position,
        commentTime: new Date().toISOString()
    });
};

// 서명 로그 기록
export const logSignature = async (userId, signatureType) => {
    return logActivity(userId, LOG_TYPES.SIGNATURE, {
        signatureType,
        signatureTime: new Date().toISOString()
    });
};

// 제안 로그 기록
export const logProposal = async (userId, proposalId, action) => {
    return logActivity(userId, LOG_TYPES.PROPOSAL, {
        proposalId,
        action, // 'create', 'support', 'delete'
        proposalTime: new Date().toISOString()
    });
};

// 관리자 작업 로그 기록
export const logAdminAction = async (adminId, action, details) => {
    return logActivity(adminId, LOG_TYPES.ADMIN_ACTION, {
        action,
        ...details,
        actionTime: new Date().toISOString()
    });
};

