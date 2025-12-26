import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Google 로그인
export const signInWithGoogle = async () => {
    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        const result = await signInWithPopup(auth, provider);
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

// Kakao 로그인 (선택사항 - 나중에 구현)
export const signInWithKakao = async () => {
    // Kakao SDK를 사용한 로그인은 나중에 구현
    alert('Kakao 로그인은 준비 중입니다. Google 로그인을 이용해주세요.');
    return { success: false, error: 'Not implemented' };
};

// 로그아웃
export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
        return { success: true };
    } catch (error) {
        console.error('로그아웃 에러:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// 현재 사용자 정보
export const getCurrentUser = () => {
    return auth.currentUser;
};

// 인증 상태 감지
export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
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

