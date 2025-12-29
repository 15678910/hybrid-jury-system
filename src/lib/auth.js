import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from './firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';

// 카카오 앱 키
const KAKAO_APP_KEY = '83e843186c1251b9b5a8013fd5f29798';

// 카카오 SDK 초기화
const initKakao = () => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_APP_KEY);
    }
};

// Google 로그인
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

        return {
            success: true,
            user: result.user
        };
    } catch (error) {
        console.error('Google 로그인 에러:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Kakao 로그인
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

