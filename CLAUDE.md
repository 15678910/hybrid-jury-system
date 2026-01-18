# 시민법정 프로젝트 지침

## 프로젝트 개요
- **이름**: 시민법정 (시민법관 참심제)
- **기술 스택**: React + Vite + Firebase + Tailwind CSS
- **도메인**: https://시민법정.kr (xn--lg3b0kt4n41f.kr), https://siminbupjung-blog.web.app

## 응답 언어
- 한국어로 응답

## 주요 파일 구조
```
src/
├── App.jsx              # 메인 홈페이지
├── main.jsx             # 라우팅 (React.lazy 코드 분할 적용)
├── components/
│   ├── Header.jsx       # 공통 헤더
│   ├── icons/index.jsx  # 공통 SNS 아이콘
│   └── LoginModal.jsx   # 로그인 모달
├── pages/
│   ├── Blog.jsx         # 블로그 목록
│   ├── BlogPost.jsx     # 블로그 상세
│   ├── Videos.jsx       # 동영상 목록
│   └── ...
├── lib/
│   ├── firebase.js      # Firebase 설정
│   └── auth.js          # 인증 관련
functions/
└── index.js             # Firebase Functions (텔레그램 봇, SSR 등)
```

## 수정 시 주의사항

### 수정 금지 영역
- `functions/index.js`의 크롤러 감지 로직 (`isCrawler` 부분) - SNS 미리보기에 영향
- SNS 공유 URL 도메인 (`xn--lg3b0kt4n41f.kr`) - 한글 도메인 인코딩

### Firebase 배포
```bash
npm run build && firebase deploy --only hosting  # 프론트엔드
firebase deploy --only functions                  # 백엔드 함수
```

## SNS 공유 설정
- **카카오톡**: SDK 키 `83e843186c1251b9b5a8013fd5f29798`
- **페이스북**: 클립보드 복사 방식 사용 (sharer API 불안정)
- **텔레그램**: 캐시 무효화를 위해 URL에 타임스탬프 추가

## 성능 최적화 (적용됨)
- React.lazy() 코드 분할
- Promise.all() 병렬 데이터 페칭
- 로컬 스토리지 캐싱 (블로그, 동영상)
- 공통 아이콘 컴포넌트

## 관리자 기능
- `/admin` - 서명 관리
- `/blog/admin` - 블로그 관리
- `/videos/admin` - 동영상 관리
- `/governance/admin` - 거버넌스 관리
