# 시민법정 프로젝트 지침

## 🚨 필수 백업 규칙 (절대 위반 금지)

### 데이터 삭제/수정 전 반드시 백업
**어떤 이유로든 Firestore 데이터를 삭제하거나 대량 수정하기 전에 반드시 백업을 실행해야 합니다.**

```bash
# Firestore 백업 실행 (필수!)
cd functions && node backup_firestore.js
```

### 백업 시점
1. **데이터 삭제 전**: posts, videos, signatures 등 어떤 컬렉션이든 삭제 전 필수
2. **대량 데이터 수정 전**: 여러 문서를 한번에 수정하기 전
3. **작업 시작 전**: 새로운 세션에서 데이터 관련 작업 시작 전
4. **배포 전**: 중요한 변경사항 배포 전

### 백업 파일 위치
- `backups/firestore_backup_YYYY-MM-DDTHH-MM-SS.json`
- 최소 7일간 보관 필수

### 위반 시 결과
- 2026-02-08: 백업 없이 블로그 글 전체 삭제 → **복구 불가, 데이터 영구 손실**

---

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

## 코딩 스타일 규칙

### JavaScript/JSX 필수 규칙
1. **console.log 금지**: 프로덕션 코드에서 `console.log` 사용 금지 (훅으로 경고 표시됨)
2. **불변성 유지**: 객체/배열 수정 시 스프레드 연산자 사용
   ```jsx
   // 나쁜 예
   state.items.push(newItem);

   // 좋은 예
   setItems([...items, newItem]);
   ```
3. **에러 처리**: async/await는 반드시 try-catch로 감싸기
   ```jsx
   try {
     const data = await fetchData();
   } catch (error) {
     console.error('데이터 로드 실패:', error);
     // 사용자에게 에러 표시
   }
   ```

### 보안 규칙
1. **시크릿 하드코딩 금지**: API 키, 토큰 등은 절대 코드에 직접 작성 금지
2. **환경 변수 사용**: 민감 정보는 `.env` 파일 또는 Firebase 환경 설정 사용
   ```jsx
   // 나쁜 예
   const API_KEY = "sk-1234567890";

   // 좋은 예
   const API_KEY = import.meta.env.VITE_API_KEY;
   ```
3. **Firebase 규칙**: Firestore/Storage 보안 규칙으로 데이터 접근 제어

### React 패턴
1. **Custom Hooks**: 재사용 로직은 `use` 접두사로 커스텀 훅 분리
2. **컴포넌트 분리**: 300줄 이상 컴포넌트는 분리 검토
3. **Props 검증**: 중요 props는 기본값 설정 또는 타입 체크

## SNS 공유 설정
- **카카오톡**: SDK 키 `83e843186c1251b9b5a8013fd5f29798`, `Kakao.Share.sendDefault`로 공유 (DOM의 `og:image` 메타태그에서 이미지 읽음)
- **X(Twitter)**: 반드시 `https://twitter.com/intent/tweet?text=...&url=...` 사용 (⚠️ `x.com/intent/post` 절대 금지 - HTTP 400 발생)
- **페이스북**: 클립보드 복사 방식 사용 (sharer API 불안정)
- **텔레그램**: 캐시 무효화를 위해 URL에 타임스탬프 추가
- **이미지 전달 흐름**: BlogPost.jsx → SEOHead(og:image 메타태그) → SNSShareBar.getOgImage()(DOM에서 읽기) → 카카오/SNS에 전달

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

### 🚨 2026-02-08 사건 (절대 반복 금지)
- **사건**: 백업 없이 Firestore의 블로그 글 전체 삭제
- **결과**: 원본 블로그 글 7개 + 이전 사법뉴스 전체 영구 손실
- **원인**: 데이터 삭제 전 백업 미실행
- **교훈**: 어떤 데이터든 삭제/수정 전 반드시 `node backup_firestore.js` 실행

### 절대 수정 금지
- AI 모델 기본값: `useState('claude')` — 임의 변경 금지 (2026-02-24 사건)
- `functions/index.js`의 `isCrawler` 로직 → SNS 미리보기(카카오톡, 페이스북, 텔레그램) 깨짐
- SNS 공유 URL의 도메인 `xn--lg3b0kt4n41f.kr` → 한글 도메인 인코딩이므로 변경 시 공유 링크 전체 실패
- 카카오톡 SDK 키 변경 → SNS 공유 기능 중단
- 사용자 명령 없이 임의로 설정/로직 변경 절대 금지

### 이미지/사진 관련
- `public/` 폴더의 인물 사진(PNG)은 auto-crop 처리 완료 상태 → 재업로드 시 동일하게 crop 필요
- 위키미디어 이미지 URL은 `/thumb/.../{크기}px-` 형식 유지 필요
- 인물 사진 컨테이너: `w-12 h-12 rounded-full object-cover` → 크기 변경 시 전체 레이아웃 확인

### 배포 관련
- 프론트엔드만 수정 시 `firebase deploy --only hosting` 사용 (functions 배포 불필요)
- `npm run build` 실패 시 배포 절대 금지
- `.firebase/hosting.ZGlzdA.cache`는 자동 생성 파일 → 커밋에 포함해도 무관하나 수동 수정 금지

### Git 커밋 검증 규칙 (2026-03-06 추가)
- **커밋 전 필수 확인**: `git status`로 수정된 파일 목록과 staging된 파일 목록 비교
- **`git add` 시 특정 파일 지정**: `git add -A` 대신 변경 파일을 명시적으로 나열
- **핵심 데이터 파일 우선 확인**: `judges.js`, `firebase.json`, `main.jsx` 등 핵심 파일이 staging에 포함되었는지 반드시 확인
- **커밋 메시지와 실제 변경 내용 일치**: 커밋 메시지에 "판사 추가", "데이터 수정" 등이 포함되면 해당 데이터 파일이 반드시 커밋에 포함되어야 함

### 🚨 2026-03-06 사건 (App Check Enforce 장애)
- **사건**: App Check를 Firestore/Storage에 Enforce 적용 → 사이트 전체 데이터 0으로 표시
- **원인**: reCAPTCHA 토큰이 100% Unverified 상태에서 Enforce 적용 → 모든 요청 차단
- **교훈**: Firebase Console에서 보안 설정 변경 시 반드시 다음 순서를 따를 것:
  1. Monitoring 모드로 먼저 적용 → 토큰 Verified 비율 확인
  2. Verified 비율이 90% 이상일 때만 Enforce 전환
  3. Enforce 후 즉시 사이트 접속하여 데이터 로딩 확인
  4. 문제 발생 시 즉시 Unenforce로 롤백
- **현재 상태**: Cloud Firestore = Monitoring, Storage = Unenforced

### 🚨 2026-03-06 사건 (백대현 판사 데이터 유실)
- **사건**: `judges.js`에 백대현 판사 추가 후 git commit 시 해당 파일을 staging하지 않아 데이터 유실
- **원인**: `git add`에서 수정된 `judges.js`를 누락, 커밋 메시지만 "백대현 판사 추가"로 작성
- **2차 오류**: 복구 시 `cases` 필드를 `{title, date, description}` 형식으로 작성 → React Error #31 발생
- **교훈**:
  1. `git add` 후 반드시 `git status`로 모든 수정 파일이 staging되었는지 확인
  2. 커밋 전 `git diff --cached`로 실제 커밋 내용 검증
  3. judges.js의 cases 필드는 반드시 `{ text: '...', source: '...' }` 형식 사용
  4. 판사 추가 후 라이브 사이트에서 해당 카테고리 탭 클릭하여 실제 표시 확인

### 🚨 2026-03-08 사건 (김용현 AI 점수 인코딩 장애)
- **사건**: curl에서 한국어 파라미터(`defendant=김용현`)를 보내 AI 평가 실행 → Firestore에 깨진 문서 키(U+FFFD)로 저장됨
- **원인**: Windows curl이 한국어를 CP949/깨진 UTF-8로 전송 → Cloud Function이 U+FFFD로 받음 → 잘못된 키로 문서 생성
- **2차 원인**: AI가 프롬프트의 "100점 금지" 지시를 무시하고 검찰 공정성 100점 반환
- **교훈**:
  1. curl로 한국어 파라미터 전송 금지 — 브라우저 또는 Postman 사용
  2. AI 점수는 프롬프트만으로 제어 불가 — 코드 레벨 클램핑 필수
  3. Firestore 문서 키에 한국어 사용 시 인코딩 검증 필수
- **적용된 방어 조치**:
  - `safeDecodeKorean()` 유틸리티 함수 (U+FFFD 감지 + 거부)
  - Step B 후 점수 클램핑: 빈 이슈 배열 → 최대 75점, 절대 최대 99점

### AI 점수 출력 후처리 규칙 (2026-03-08 추가)
- `evaluateJudicialIntegrity` 함수의 Step B 결과에 반드시 코드 레벨 클램핑 적용
- 100점 절대 금지: `Math.min(score, 99)` 적용
- 빈 이슈 배열 → 해당 점수 최대 75점: `Math.min(score, 75)`
- 클램핑 로직 위치: Step B JSON 파싱 직후, 결과 병합 직전
- **이 클램핑 로직을 제거하거나 우회하지 말 것**

### 한국어 파라미터 안전 처리 규칙 (2026-03-08 추가)
- `functions/index.js`에서 한국어 파라미터 수신 시 반드시 `safeDecodeKorean()` 사용
- 중복 try-catch 패턴 대신 유틸리티 함수 호출
- U+FFFD 감지 시 null 반환 → 400 에러로 응답

### CI 테스트 규칙 (2026-03-08 추가)
- `.github/workflows/ci.yml`의 테스트 단계를 절대 주석 처리하지 말 것
- `judges.js` 스키마 검증 테스트(`src/data/judges.test.js`)는 삭제 금지
- 새 데이터 파일 추가 시 해당 스키마 검증 테스트도 함께 추가

### 보안/인프라 변경 시 자체 검증 필수
- Firebase 보안 규칙, App Check, CORS 등 변경 후 **반드시 사이트 접속 테스트**
- 배포 후 최소 3개 페이지 확인: 메인, 서명, 블로그
- 데이터가 0이거나 빈 화면이면 즉시 롤백 후 원인 분석

### 🚨 2026-03-14 사건 (Firestore 필드명 불일치 → 카카오톡 잘못된 이미지)
- **사건**: 블로그 글 카카오톡 공유 시 해당 글의 이미지가 아닌 기본 사이트 이미지(`og-image.jpg`)가 전달됨
- **원인**: `AdminBlog.jsx`는 Firestore에 `imageUrl` 필드로 저장하는데, `BlogPost.jsx`는 `post.featuredImage || post.thumbnailUrl`로 읽음 → 항상 `undefined` → SEOHead가 기본 OG 이미지 렌더링 → 카카오 SDK가 기본 이미지 전달
- **교훈**:
  1. **Firestore 필드명 일관성 검증 필수**: 데이터 저장(write) 코드와 읽기(read) 코드의 필드명이 반드시 일치하는지 확인
  2. 새 기능 추가 시 AdminBlog의 저장 필드명(`imageUrl`, `title`, `content`, `summary`, `author`, `date`, `category`)을 기준으로 읽기
  3. SNS 공유 수정 시 반드시 실제 공유 테스트 (카카오톡, X 등)
- **Firestore posts 컬렉션 필드명 (정본)**:
  ```
  title, content, summary, imageUrl, author, date, category,
  writerCode, views, likes, likedIPs, createdAt
  ```

### 🚨 2026-03-14 사건 (X/Twitter 공유 API 엔드포인트 오류)
- **사건**: X 공유 버튼 클릭 시 HTTP 400 에러
- **원인**: `x.com/intent/post`는 유효하지 않은 엔드포인트. 이전에 `intent/tweet` → `intent/post`로 잘못 변경했음
- **교훈**:
  1. **X(Twitter) 공유 URL은 반드시 `https://twitter.com/intent/tweet`** 사용 (이것이 공식 API)
  2. `x.com/intent/post`는 존재하지 않는 엔드포인트 → HTTP 400
  3. SNS API 변경 시 반드시 실제 브라우저에서 공유 테스트 후 배포

### 🚨 2026-03-14 사건 (이미지 잘림 - CSS aspect-ratio + object-cover)
- **사건**: 블로그 카드 및 본문의 이미지 상단 제목 텍스트가 잘려서 표시
- **원인**: `aspect-video`(16:9) + `object-cover`가 이미지를 강제 비율로 잘라냄. `max-h-96`이 높이를 384px로 제한
- **교훈**:
  1. 이미지에 텍스트가 포함된 카드뉴스/OG이미지는 `object-cover` 사용 금지
  2. Blog.jsx 이미지: `aspect-video`와 `object-cover` 없이 원본 비율 유지
  3. BlogPost.jsx 이미지: `max-h-96`과 `object-cover` 없이 원본 비율 유지
  4. 이미지 잘림 수정 시 목록 페이지(Blog.jsx)와 상세 페이지(BlogPost.jsx) 모두 확인

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
5. **SNS 공유용 OG 이미지 설정 필수**: 각 페이지별 고유 OG 이미지를 설정해야 카카오톡/페이스북/X 공유 시 해당 페이지의 이미지가 표시됨
   - `functions/index.js`의 `createStaticPageHandler`에 이미지 URL 전달
   - 또는 페이지 컴포넌트에서 `SEOHead`의 `image` prop으로 페이지별 이미지 지정
   - OG 이미지 없으면 기본 사이트 이미지(`og-image.jpg`)가 표시되어 어떤 페이지를 공유했는지 구분 불가

### 인물 사진 추가/교체 시
1. 위키미디어 검색 우선 → 없으면 공식 사진(korea.kr) → 없으면 사용자 업로드
2. 사용자 업로드 PNG는 Python Pillow로 auto-crop (투명/흰색 여백 제거)
3. `SentencingAnalysis.jsx`의 `PERSON_PHOTOS` 객체에 경로 추가
4. 빌드 후 배포

## 배포 워크플로우 (2026-02-25 업데이트)
**반드시 로컬 프리뷰 확인 후 사용자 승인을 받아 배포한다.**

```
코드 수정 → npm run build → 로컬 프리뷰(preview_start) → 스크린샷 공유 → 사용자 승인 → 배포
```

- 로컬 프리뷰 서버: `.claude/launch.json` → `npm run dev` (port 5173)
- **사용자 승인 없이 `firebase deploy` 절대 금지**
- 프리뷰 확인 도구: `preview_screenshot`, `preview_snapshot`, `preview_inspect` 활용

## 판사 데이터 자동 관리 규칙

### 🔄 세션 시작 시 자동 체크 (필수)
매 세션에서 판사 관련 작업이 감지되면, 자동으로 다음을 수행:
1. **웹 검색**: "내란전담재판부 판사 명단 최신" 검색
2. **비교**: `src/data/judges.js`의 현재 판사 목록과 대조
3. **누락 감지**: 새로 배정/변경된 판사가 있으면 자동 추가
4. **사용자 알림**: "판사 X명 누락 발견, 자동 추가합니다" 안내

### 새 판사 추가 시 자동 완성 항목 (사진 외 전부 자동)
| 항목 | 자동화 | 방법 |
|------|--------|------|
| 기본 정보 (이름, 소속, 직위) | ✅ 자동 | 웹 검색 |
| career (경력) | ✅ 자동 | 웹 검색 (나무위키, 법률신문 등) |
| cases (주요 판결) | ✅ 자동 | 웹 검색 (뉴스 기사) |
| justiceEvaluation (사법정의평가) | ✅ 자동 | 판결 데이터 기반 AI 분석 |
| photo (인물 사진) | ❌ 수동 | 사용자가 public/에 직접 추가 |

### 판사 추가 자동 워크플로우
```
1. 웹 검색으로 판사 정보 수집 (경력, 판결, 뉴스)
2. justiceEvaluation AI 분석 생성 (검찰/재판부 이슈 포함)
3. judges.js에 완성된 데이터 삽입
4. npm run build로 검증
5. 사용자에게 "사진만 public/{이름}.png에 추가해주세요" 안내
6. 사진 추가 확인 후 배포
```

### judges.js 데이터 형식 (반드시 준수)
판사 데이터의 `cases` 필드는 다음 형식만 허용:
```javascript
cases: [
    { text: '사건 설명 (연도, 법원)', source: 'URL 또는 null' }
]
```
**금지 형식** (React Error #31 발생):
```javascript
// ❌ 절대 사용 금지
cases: [{ title: '...', date: '...', description: '...' }]
cases: [{ name: '...', detail: '...' }]
```

### 스크립트 (수동 사용 시)
```bash
node scripts/add-judge.cjs --name "판사이름" --category "내란전담재판부" --court "서울중앙지방법원" --position "형사합의00부 부장판사"
```

## 배포 전 체크리스트
- [ ] `npm run build` 오류 없음
- [ ] 로컬 프리뷰에서 변경사항 확인 완료
- [ ] SentencingAnalysis.jsx 미수정 확인
- [ ] AI 모델 기본값 `claude` 유지 확인
- [ ] 메인 페이지(`/`) 정상 로딩
- [ ] 블로그 목록/상세 페이지 정상
- [ ] SNS 공유 버튼 동작 확인 (카카오톡 이미지 정확성, X/Twitter, 텔레그램)
- [ ] 블로그 수정 시: Firestore 필드명 일치 확인 (`imageUrl`, NOT `featuredImage`/`thumbnailUrl`)
- [ ] X 공유 URL: `twitter.com/intent/tweet` 사용 확인 (intent/post 금지)
- [ ] 모바일 반응형 확인
- [ ] 관리자 페이지 접근 가능
- [ ] **사용자 배포 승인 받음**
- [ ] Git: 커밋할 모든 수정 파일이 staging 되었는지 `git status` 확인
- [ ] judges.js 수정 시: cases 필드 `{ text, source }` 형식 확인
- [ ] 판사 추가 시: 라이브 사이트 judge-evaluation 페이지에서 해당 카테고리 확인

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
