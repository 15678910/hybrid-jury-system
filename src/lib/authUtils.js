// ============================================
// 작성자/관리자 접근 코드 검증 (서버측 Function 호출)
// ============================================
// 2026-06-06 보안 개선: 기존에는 VITE_ADMIN_CODE / VITE_WRITER_CODE 환경변수를
// 클라이언트에서 직접 비교했으나, Vite가 빌드 시 이 값을 JS 번들에 평문으로
// 인라인하여 누구나 배포된 사이트 JS에서 코드를 추출할 수 있는 CRITICAL 취약점이
// 있었음. 코드 검증을 서버(Firebase Function)로 이전하여 코드가 클라이언트 번들에
// 절대 노출되지 않도록 함.
//
// 코드는 functions/.env(서버측)에만 존재하며, verifyAccessCode Function이 검증함.

import { signInWithCustomToken } from 'firebase/auth';
import { auth } from './firebase';

const FN_BASE = 'https://asia-northeast3-siminbupjung-blog.cloudfunctions.net';
const VERIFY_URL = `${FN_BASE}/verifyAccessCode`;
const CHECK_DUP_URL = `${FN_BASE}/checkSignatureDuplicate`;
const EXPORT_SIG_URL = `${FN_BASE}/exportSignatures`;

/**
 * 작성자/관리자 접근 코드를 서버에서 검증한다.
 * @param {string} code - 사용자가 입력한 접근 코드
 * @returns {Promise<{valid: boolean, name?: string, role?: 'admin'|'writer', error?: boolean}>}
 *   valid: 검증 성공 여부
 *   name: 인증 시 표시 이름 (예: '관리자', '시민법정')
 *   role: 권한 등급 ('admin' | 'writer')
 *   error: 네트워크 등 통신 오류 발생 여부
 */
export async function verifyAccessCode(code) {
    if (!code || !code.trim()) return { valid: false };
    try {
        const res = await fetch(VERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code.trim() }),
        });
        const data = await res.json().catch(() => ({ valid: false }));
        if (res.ok && data.valid) {
            // custom token으로 Firebase Auth 로그인 → Firestore 쓰기 시 request.auth.token.role 사용 (H-1)
            if (data.token) {
                try {
                    await signInWithCustomToken(auth, data.token);
                } catch (e) {
                    console.error('custom token 로그인 실패:', e);
                    // Phase 1: 규칙이 아직 role을 강제하지 않으므로, 로그인 실패해도 검증 성공으로 진행
                }
            }
            return { valid: true, name: data.name, role: data.role };
        }
        return { valid: false };
    } catch (e) {
        console.error('접근 코드 검증 통신 실패:', e);
        return { valid: false, error: true };
    }
}

/**
 * 서명 전화번호 중복 여부를 서버에서 확인 (C-1: 클라이언트 phone 비교 대체)
 * @param {string} phone
 * @returns {Promise<{duplicate: boolean, error?: boolean}>}
 */
export async function checkSignatureDuplicate(phone) {
    try {
        const res = await fetch(CHECK_DUP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { duplicate: false, error: true };
        return { duplicate: !!data.duplicate };
    } catch (e) {
        console.error('서명 중복 확인 통신 실패:', e);
        return { duplicate: false, error: true };
    }
}

/**
 * 서명자 전체 데이터(PII 포함) 내보내기 — 관리자 전용 (C-1: 엑셀 서버화)
 * @param {string} code - 관리자/작성자 접근 코드
 * @returns {Promise<{signatures: Array|null, error?: boolean}>}
 */
export async function exportSignatures(code) {
    try {
        const res = await fetch(EXPORT_SIG_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        });
        if (!res.ok) return { signatures: null, error: true };
        const data = await res.json();
        return { signatures: Array.isArray(data.signatures) ? data.signatures : [] };
    } catch (e) {
        console.error('서명 내보내기 통신 실패:', e);
        return { signatures: null, error: true };
    }
}
