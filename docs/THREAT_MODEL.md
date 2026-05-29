# 위협 모델 (THREAT_MODEL)

**목적**: hybrid-jury-system(혼합형 참심제 웹 애플리케이션)의 자산(asset)·위협(threat)·완화(mitigation)를 명문화. CLAUDE.md PART 10 자산.

**갱신 원칙**: 도메인 변경·Firestore schema 변경·새 위협 발견 시 즉시 업데이트. `tests/test_threat_scenarios.ts`와 1:1 대응.

---

## 1. 시스템 개요

- **도메인**: 혼합형 참심제(국민참여재판) 소개 및 청원 서명 수집 웹 애플리케이션, AI 재판 결과 예측 기능
- **기술 스택**: React + Vite + Tailwind CSS, Firebase (Hosting, Firestore, Functions, Auth), Kakao SDK (지도/공유), Vercel
- **배포 환경**: Firebase Hosting / Vercel, Firebase Functions (서버리스)
- **사용자 클래스**: anonymous(미인증) / user(인증 서명자) / admin(관리자)

---

## 2. 자산 (Asset Inventory)

| ID | 자산 | 민감도 | 우선순위 | 위치 |
|----|----|------|---------|----|
| A1 | 사용자 전화번호 인증 정보 (Firebase Phone Auth) | High | C | Firebase Auth |
| A2 | 판사 프로필 데이터 (이름, 재판 이력) | High | I | Firestore (judges 컬렉션) |
| A3 | 사례 예측 결과 (AI 재판 결과 예측) | Medium | I | Firestore (cases 컬렉션) |
| A4 | 청원 서명 데이터 (signatures) | High | I | Firestore (signatures 컬렉션) |
| A5 | Kakao JS API Key | Medium | C | 환경변수 / 소스코드 |
| A6 | Firebase Admin serviceAccountKey | Critical | C | (로컬 전용, .gitignore 필수) |
| A7 | 관리자 코드 (admin code) | High | C | 환경변수 (C2 fix 2026-05-27) |

---

## 3. 신뢰 경계 (Trust Boundaries)

| 경계 | 외부 (untrusted) | 내부 (trusted) | 검증 메커니즘 |
|------|---------------|-------------|------------|
| B1 | 미인증 방문자 | 인증 서명자 | Firebase Phone Auth |
| B2 | 인증 서명자 | 관리자 | admin code 환경변수 (C2 fix) + Firestore Rules |
| B3 | 클라이언트 | Firestore | Firestore Security Rules |
| B4 | 클라이언트 | Firebase Functions | Firebase Auth 토큰 검증 |

---

## 4. 위협 카탈로그 (Threat Catalog)

### A. 인증·세션 (Auth & Session)

| ID | 위협 | 자산 | 가능성 | 영향 | 완화 | 회귀 테스트 |
|----|----|----|------|----|----|----------|
| T-A1 | Firebase Phone Auth bypass (OTP 재사용) | A1 | Low | High | Firebase 기본 OTP 만료 정책 + 서버사이드 검증 | test_a1_phone_otp_replay |
| T-A2 | Firebase Auth ID Token 위조 | A1 | Low | Critical | Firebase Admin SDK 서버사이드 검증 | test_a2_firebase_token_forgery |
| T-A3 | 세션 만료 미처리 → 장기 익명 접근 | A1 | Med | Med | Firebase 세션 만료 정책 확인 | test_a3_session_expiry |

### B. 권한·Scope

| ID | 위협 | 자산 | 가능성 | 영향 | 완화 | 회귀 테스트 |
|----|----|----|------|----|----|----------|
| T-B1 | 관리자 코드 평문 소스코드 포함 (admin2025) | A7 | High (이전 발생) | Critical | 환경변수 전환 (C2 fix 2026-05-27) | test_b1_admin_code_not_hardcoded |
| T-B2 | 일반 사용자가 판사 데이터 수정 | A2 | Med | High | Firestore Rules: 관리자만 write | test_b2_judge_data_write_unauth |
| T-B3 | 미인증 사용자 청원 서명 조작 | A4 | Med | High | Firestore Rules: auth.uid 필수 + 서명 immutable 강제 | test_b3_signature_tampering_unauth |

### C. Secret·Credential

| ID | 위협 | 자산 | 가능성 | 영향 | 완화 | 회귀 테스트 |
|----|----|----|------|----|----|----------|
| T-C1 | Kakao JS Key 소스코드 하드코딩 | A5 | High (이전 발생) | Med | 환경변수 전환 + 도메인 제한 설정 (C2 fix 2026-05-27) | test_c1_kakao_key_not_hardcoded |
| T-C2 | serviceAccountKey.json git 커밋 | A6 | High (파일 루트 존재 확인됨) | Critical | .gitignore 필수 적용, Firebase IAM 사용 권고 | test_c2_service_account_key_git |
| T-C3 | Firebase 환경변수 클라이언트 번들 노출 | A5 | Med | Med | VITE_PUBLIC_만 허용, 민감 키 서버 함수 전용 | test_c3_env_bundle_leak |

### D. Input·Injection

| ID | 위협 | 자산 | 가능성 | 영향 | 완화 | 회귀 테스트 |
|----|----|----|------|----|----|----------|
| T-D1 | Firestore 쿼리 조작 (클라이언트 직접 필터링) | A2, A4 | Med | High | Firestore Rules 서버사이드 조건 강제 | test_d1_firestore_query_manipulation |
| T-D2 | XSS via 사례 설명 / 청원 텍스트 렌더링 | A3, A4 | Med | Med | DOMPurify 또는 safe renderer, CSP 헤더 | test_d2_xss_case_description |
| T-D3 | AI 예측 API prompt injection (사례 입력) | A3 | Med | Med | 사용자 입력 샌드박싱, 시스템 프롬프트 격리 | test_d3_prompt_injection |

### E. Data Integrity

| ID | 위협 | 자산 | 가능성 | 영향 | 완화 | 회귀 테스트 |
|----|----|----|------|----|----|----------|
| T-E1 | 청원 서명 위변조 (데이터 조작) | A4 | Med | Critical | Firestore Rules: 서명 생성 후 삭제/수정 불가 (immutable) | test_e1_signature_immutability |
| T-E2 | 판사 데이터 의도적 조작 (명예훼손 위험) | A2 | Low | High | 관리자만 write + audit log | test_e2_judge_data_integrity |
| T-E3 | AI 재판 예측 결과 사후 위조 | A3 | Low | High | 예측 결과 생성 시각 + 서명 저장 | test_e3_prediction_result_integrity |

### F. Rate / Abuse

| ID | 위협 | 자산 | 가능성 | 영향 | 완화 | 회귀 테스트 |
|----|----|----|------|----|----|----------|
| T-F1 | 청원 서명 봇 공격 (다수 계정으로 서명 위조) | A4 | High | Critical | Phone Auth 1번호 1서명 강제, Firebase 번호 인증 요금제 | test_f1_signature_bot_attack |
| T-F2 | AI 예측 API 과호출 (Functions 비용 폭발) | A3 | Med | Med | rate limit + 인증 사용자 전용 | test_f2_ai_prediction_dos |

### G. Domain-Specific (참심제 청원 및 재판 예측)

| ID | 위협 | 자산 | 가능성 | 영향 | 완화 | 회귀 테스트 |
|----|----|----|------|----|----|----------|
| T-G1 | AI 재판 예측 결과 오용 (법적 근거로 인용) | A3 | Med | High | 면책 문구 필수 표시, "예측/참고용" 명시 | test_g1_prediction_disclaimer |
| T-G2 | 청원 서명 데이터 위변조 → 과장된 지지 수 | A4 | Med | Critical | Firestore immutable rules + 서버사이드 집계 | test_g2_signature_count_integrity |
| T-G3 | 판사 데이터 기반 명예훼손 소송 위험 | A2 | Med | High | 공개 정보만 수록, 법적 리뷰 필요 (TODO) | test_g3_judge_data_legal_risk |

---

## 5. 완화 매트릭스 (Mitigation Matrix)

| 위협 | Layer 1 (예방) | Layer 2 (탐지) | Layer 3 (복구) |
|------|------------|------------|------------|
| T-B1 | 환경변수 전환 (C2 fix) | admin code 접근 로그 | code rotate |
| T-C1 | 환경변수 + 도메인 제한 | Kakao 콘솔 사용량 | key rotate |
| T-C2 | .gitignore serviceAccountKey | git secret scan | IAM key 재생성 |
| T-E1 | Firestore immutable rules | Firestore audit log | 데이터 복원 |
| T-F1 | Phone Auth 1번호 1서명 | 이상 서명 탐지 | 계정 정지 |

---

## 6. 미결 위협 (Open / DEFER)

| ID | 위협 | 사유 | 예상 시간 | 우선순위 |
|----|----|----|---------|------|
| T-C2 | serviceAccountKey.json .gitignore 즉시 확인 | 파일이 루트에 존재 확인됨 — 즉시 처리 | 0.5h | Critical |
| T-D2 | DOMPurify 적용 확인 | 렌더링 라이브러리 의존 | 1h | High |
| T-G3 | 판사 데이터 법적 리뷰 | 법률 전문가 필요 | 외부 의존 | High |
| T-F2 | AI 예측 Functions rate limit | 미구현 | 2h | Med |

---

## 7. 위협-자산 매트릭스 (heat map)

| 자산 \ 위협 | T-B1 | T-B3 | T-C1 | T-C2 | T-E1 | T-F1 | T-G2 |
|----------|------|------|------|------|------|------|------|
| A1 (Phone Auth) | - | - | - | - | - | 🔴 | - |
| A2 (판사 데이터) | - | - | - | 🔴 | - | - | - |
| A3 (AI 예측) | - | - | - | - | 🟠 | - | - |
| A4 (서명) | - | 🔴 | - | 🔴 | 🔴 | 🔴 | 🔴 |
| A5 (Kakao Key) | - | - | 🔴 | - | - | - | - |
| A6 (Admin SA Key) | 🔴 | - | - | 🔴 | - | - | - |
| A7 (Admin Code) | 🔴 | - | - | - | - | - | - |

범례: 🔴 Critical/High · 🟠 Medium · 🟡 Low

---

## 8. 변경 이력

| 날짜 | 변경 | 작성 |
|------|----|----|
| 2026-05-30 | 초기 작성 — Glasswing 영감 P1-D, admin code 환경변수 전환(C2) + Kakao key 도메인 제한(C2) 반영 | P1-D |
