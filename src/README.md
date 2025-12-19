# 혼합형 참심제 프로젝트 - 누락 파일 복구

## 📦 생성된 파일 목록

### 1. **faqMatcher.js** - FAQ 매칭 시스템
- **위치**: `src/lib/faqMatcher.js`
- **설명**: 키워드 기반 FAQ 검색 및 매칭 로직
- **기능**:
  - 질문에서 키워드 자동 추출
  - 우선순위 기반 매칭 점수 계산
  - 최적 FAQ 찾기
  - 관련 FAQ 목록 반환
  - 카테고리별 필터링

### 2. **Poster.jsx** - 포스터 모달 컴포넌트
- **위치**: `src/components/Poster.jsx`
- **설명**: 첫 방문 시 보여지는 소개 포스터 팝업
- **기능**:
  - 3개의 슬라이드 포스터
  - 이전/다음 네비게이션
  - 서명/자세히보기 버튼
  - 반응형 디자인

### 3. **Resources.jsx** - 자료실 컴포넌트
- **위치**: `src/components/Resources.jsx` 
- **설명**: 법률안, 연구자료, 해외사례 등 다운로드 자료실
- **기능**:
  - 카테고리별 필터링 (법률안, 연구, 해외사례, 언론)
  - 자료 카드 레이아웃
  - 다운로드 기능
  - 태그 시스템

### 4. **FAQTest.jsx** - FAQ 테스트 페이지 (수정됨)
- **위치**: `src/components/FAQTest.jsx`
- **설명**: FAQ 매칭 시스템 테스트 UI
- **수정 사항**: UTF-8 인코딩 문제 해결

### 5. **CozeFloatingChat.jsx** - 챗봇 컴포넌트 (개선됨)
- **위치**: `src/components/CozeFloatingChat.jsx`
- **설명**: Coze AI 챗봇 플로팅 버튼
- **개선 사항**: 
  - `botId` prop을 동적으로 활용
  - 접근성(aria-label) 추가
  - URL 동적 생성

---

## 🔧 설치 방법

### 1. 파일 배치
```bash
# 프로젝트 루트에서

# 라이브러리 파일
mkdir -p src/lib
cp faqMatcher.js src/lib/

# 컴포넌트 파일들
cp Poster.jsx src/components/
cp Resources.jsx src/components/
cp FAQTest.jsx src/components/
cp CozeFloatingChat.jsx src/components/
```

### 2. 디렉토리 구조
```
src/
├── components/
│   ├── App.jsx (기존)
│   ├── Poster.jsx (새로 추가)
│   ├── Resources.jsx (새로 추가)
│   ├── FAQTest.jsx (업데이트)
│   └── CozeFloatingChat.jsx (업데이트)
├── lib/
│   └── faqMatcher.js (새로 추가)
└── data/
    └── faq.json (기존)
```

---

## ✅ 사용 방법

### FAQMatcher 사용 예시
```javascript
import { FAQMatcher } from './lib/faqMatcher';
import faqData from './data/faq.json';

// 초기화
const matcher = new FAQMatcher(faqData);

// 질문 매칭
const result = matcher.findMatch('혼합형 참심제가 무엇인가요?');
console.log(result.question, result.answer);

// 여러 관련 FAQ 찾기
const matches = matcher.findMatches('시민법관', 5);

// 통계 확인
const stats = matcher.getStats();
console.log(`총 ${stats.total}개 FAQ`);
```

### Coze 챗봇 사용
```javascript
// App.jsx에서
<CozeFloatingChat botId="7580759900293578757" />

// 또는 다른 botId 사용
<CozeFloatingChat botId="your-bot-id" />
```

---

## 🎨 추가 설정 필요 사항

### 1. 포스터 이미지 추가
`Poster.jsx`에서 포스터 이미지를 추가하려면:
```javascript
// public/posters/ 폴더에 이미지 저장 후
const posters = [
  {
    id: 1,
    title: '혼합형 참심제란?',
    image: '/posters/poster1.jpg', // 실제 이미지 경로
    alt: '혼합형 참심제 설명 포스터'
  },
  // ...
];
```

### 2. 자료실 PDF 파일 추가
`Resources.jsx`에서 실제 다운로드 가능한 파일 링크:
```javascript
// public/documents/ 폴더에 PDF 저장 후
const resources = [
  {
    id: 1,
    link: '/documents/law-proposal.pdf', // 실제 파일 경로
    // ...
  }
];
```

### 3. 환경 변수 설정
`.env` 파일에 추가:
```bash
VITE_ADMIN_PASSWORD=your-secure-password
```

---

## 🐛 문제 해결

### 1. FAQ 매칭이 작동하지 않을 때
- `faqMatcher.js`가 `src/lib/` 폴더에 있는지 확인
- import 경로가 올바른지 확인: `import { FAQMatcher } from '../lib/faqMatcher'`

### 2. 포스터가 표시되지 않을 때
- `Poster.jsx`가 import 되었는지 확인
- `showPosterModal` state가 제대로 관리되는지 확인

### 3. 자료실 다운로드 문제
- PDF 파일들이 `public/documents/` 폴더에 있는지 확인
- 파일 경로가 올바른지 확인

### 4. 챗봇이 표시되지 않을 때
- Coze URL이 올바른지 확인: `https://www.coze.com/s/{botId}/`
- z-index 충돌 확인 (현재 z-[9999] 사용)

---

## 📋 체크리스트

파일 설치 후 확인사항:

- [ ] `faqMatcher.js`가 `src/lib/`에 있음
- [ ] `Poster.jsx`, `Resources.jsx`가 `src/components/`에 있음
- [ ] `FAQTest.jsx`, `CozeFloatingChat.jsx` 업데이트됨
- [ ] App.jsx에서 모든 컴포넌트가 import됨
- [ ] 포스터 이미지 준비 (선택사항)
- [ ] 자료실 PDF 파일 준비 (선택사항)
- [ ] 환경 변수 설정 (VITE_ADMIN_PASSWORD)
- [ ] 개발 서버 재시작 (`npm run dev`)

---

## 💡 추가 개선 제안

1. **포스터 이미지**: 디자이너와 협업하여 전문 포스터 제작
2. **자료실 PDF**: 실제 법률안, 연구 자료 PDF 준비
3. **FAQ 확장**: faq.json에 더 많은 질문 추가
4. **다국어 지원**: i18n 라이브러리로 영어/한국어 지원
5. **분석 추적**: Google Analytics로 사용자 행동 추적

---

## 📞 지원

문제가 발생하면:
1. 콘솔 에러 메시지 확인
2. 파일 경로가 올바른지 확인
3. import 구문이 정확한지 확인
4. 필요시 개발 서버 재시작

---

## 📄 라이선스

이 프로젝트는 주권자사법개혁추진준비위원회의 소유입니다.
