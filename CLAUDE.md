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

## 자주 발생하는 실수 (반복 방지)

### 절대 수정 금지
- `functions/index.js`의 `isCrawler` 로직 → SNS 미리보기(카카오톡, 페이스북, 텔레그램) 깨짐
- SNS 공유 URL의 도메인 `xn--lg3b0kt4n41f.kr` → 한글 도메인 인코딩이므로 변경 시 공유 링크 전체 실패
- 카카오톡 SDK 키 변경 → SNS 공유 기능 중단

### 이미지/사진 관련
- `public/` 폴더의 인물 사진(PNG)은 auto-crop 처리 완료 상태 → 재업로드 시 동일하게 crop 필요
- 위키미디어 이미지 URL은 `/thumb/.../{크기}px-` 형식 유지 필요
- 인물 사진 컨테이너: `w-12 h-12 rounded-full object-cover` → 크기 변경 시 전체 레이아웃 확인

### 배포 관련
- 프론트엔드만 수정 시 `firebase deploy --only hosting` 사용 (functions 배포 불필요)
- `npm run build` 실패 시 배포 절대 금지
- `.firebase/hosting.ZGlzdA.cache`는 자동 생성 파일 → 커밋에 포함해도 무관하나 수동 수정 금지

### 카카오 로그인
- 이메일 권한은 비즈앱 전환 필요 → 현재 `profile_nickname`, `profile_image`만 사용
- 모바일/데스크톱 로그인 플로우가 다름 (리다이렉트 vs 팝업) → 한쪽만 수정하지 말 것

## 작업 템플릿

### 코드 수정 요청 시
1. 수정 대상 파일을 먼저 읽고 현재 상태 파악
2. `functions/index.js`의 `isCrawler` 로직 영향 여부 확인
3. SNS 공유 URL이 포함된 경우 도메인 인코딩 검증
4. 수정 완료 후 `npm run build`로 빌드 확인

### 새 페이지 추가 시
1. `src/pages/`에 컴포넌트 생성
2. `src/main.jsx`에 `React.lazy()` 라우트 추가
3. `src/components/Header.jsx`에 메뉴 항목 추가
4. `functions/index.js`에 SSR 메타태그 추가 (SEO 필요 시)

### 인물 사진 추가/교체 시
1. 위키미디어 검색 우선 → 없으면 공식 사진(korea.kr) → 없으면 사용자 업로드
2. 사용자 업로드 PNG는 Python Pillow로 auto-crop (투명/흰색 여백 제거)
3. `SentencingAnalysis.jsx`의 `PERSON_PHOTOS` 객체에 경로 추가
4. 빌드 후 배포

## 배포 전 체크리스트
- [ ] `npm run build` 오류 없음
- [ ] 메인 페이지(`/`) 정상 로딩
- [ ] 블로그 목록/상세 페이지 정상
- [ ] SNS 공유 버튼 동작 확인 (카카오톡, 텔레그램)
- [ ] 모바일 반응형 확인
- [ ] 관리자 페이지 접근 가능

## 복잡한 작업 프로세스 (팁 #2)
큰 기능 추가나 리팩토링 시 다음 순서를 따른다:
1. **계획 단계**: "plan this"로 요구사항 정리 → 작업 범위 확정
2. **구현 단계**: 계획에 따라 코드 작성 (서브에이전트에 위임)
3. **검증 단계**: architect 에이전트로 코드 리뷰 및 검증
4. **실패 시**: 즉시 재계획 → 다른 접근법 시도 (같은 방법 반복 금지)

적용 대상: 3개 이상 파일 수정, 새 기능 추가, 구조 변경 등

## 버그 수정 워크플로우 (팁 #5)
Firebase Functions 관련 버그 발생 시:
1. `firebase functions:log --only <함수명>` 으로 로그 수집
2. 로그 내용을 Claude에 제공하여 원인 분석 요청
3. 수정 후 반드시 로그 재확인으로 해결 검증
4. 프론트엔드 버그: 브라우저 콘솔 에러 메시지 복사 → Claude에 제공

## 변경 이유 설명 (팁 #10)
다음 영역 수정 시 반드시 "왜 이렇게 변경했는지" 설명을 포함할 것:
- `functions/index.js` — SSR, 크롤러 감지, 텔레그램 봇 로직
- `src/lib/auth.js` — 카카오 로그인 플로우 (모바일/데스크톱 분기)
- `src/main.jsx` — 라우팅 구조, 코드 분할
- SNS 공유 관련 코드 — 도메인 인코딩, 캐시 무효화 로직
