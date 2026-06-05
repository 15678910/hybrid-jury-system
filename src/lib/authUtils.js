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

const VERIFY_URL = 'https://asia-northeast3-siminbupjung-blog.cloudfunctions.net/verifyAccessCode';

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
            return { valid: true, name: data.name, role: data.role };
        }
        return { valid: false };
    } catch (e) {
        console.error('접근 코드 검증 통신 실패:', e);
        return { valid: false, error: true };
    }
}
