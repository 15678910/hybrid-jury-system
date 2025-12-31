# 프로젝트 설정 정보

## 개발 환경
- **로컬 테스트 주소**: http://localhost:5174
- **개발 서버 실행**: `npm run dev`

## 배포
- **배포 명령어**: `npm run build && firebase deploy`
- **배포 도메인**: 시민법정.kr (xn--lg3b0kt4n3ucs0e.kr)

## 관리자 페이지
- **거버넌스 관리자**: /governance/admin?admin=SbAdmin2025!
- **블로그 관리자**: /blog/admin
- **동영상 관리자**: /videos/admin
- **서명 관리자**: /admin

## 환경변수 (.env)
- VITE_ADMIN_PASSWORD: 관리자 비밀번호
- VITE_ADMIN_CODE: 관리자 코드
- VITE_WRITER_CODE: 작성자 코드

## 카카오 로그인
- 앱 키: 83e843186c1251b9b5a8013fd5f29798
- 허용된 도메인: localhost:5174, 시민법정.kr
