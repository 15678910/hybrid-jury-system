import {
    signInWithPopup,
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

// Google 계정 선택 (로그인 완료 전 - 정보만 가져오기)
export const selectGoogleAccount = async () => {
    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        const result = await signInWithPopup(auth, provider);

        // 계정 정보 저장
        const userData = {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            provider: 'google'
        };

        // 바로 로그아웃 (확인 단계 대기)
        await firebaseSignOut(auth);

        return {
            success: true,
            user: userData
        };
    } catch (error) {
        console.error('Google 계정 선택 에러:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Google 로그인 완료 (확인 버튼 클릭 후)
export const confirmGoogleLogin = async () => {
    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'none' // 이미 선택된 계정으로 바로 로그인
        });
        const result = await signInWithPopup(auth, provider);

        // Firestore에 사용자 정보 저장
        await saveUserToFirestore({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            provider: 'google'
        });

        // 로그인 활동 로그 기록
        await logLoginActivity(result.user.uid, 'google');

        return {
            success: true,
            user: result.user
        };
    } catch (error) {
        console.error('Google 로그인 에러:', error);
        // 로그인 실패 로그 기록
        await logLoginFailure('google', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

// Google 로그인 (기존 호환성 유지)
export const signInWithGoogle = async () => {
    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account',
            auth_type: 'reauthenticate'
        });
        const result = await signInWithPopup(auth, provider);

        // Firestore에 사용자 정보 저장
        await saveUserToFirestore({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            provider: 'google'
        });

        // 로그인 활동 로그 기록
        await logLoginActivity(result.user.uid, 'google');

        return {
            success: true,
            user: result.user
        };
    } catch (error) {
        console.error('Google 로그인 에러:', error);
        // 로그인 실패 로그 기록
        await logLoginFailure('google', error.message);
        return {
            success: false,
            error: error.message
        };
    }
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

        // localStorage에 카카오 로그인 상태 저장
        localStorage.setItem('kakaoUser', JSON.stringify(kakaoUser));

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

                            // localStorage에 카카오 로그인 상태 저장
                            localStorage.setItem('kakaoUser', JSON.stringify(kakaoUser));
                            localStorage.setItem('kakaoAccessToken', authObj.access_token);

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

        // localStorage 정리
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

    // 카카오 사용자 확인
    const kakaoUser = localStorage.getItem('kakaoUser');
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
            // 카카오 사용자 확인
            const kakaoUser = localStorage.getItem('kakaoUser');
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

