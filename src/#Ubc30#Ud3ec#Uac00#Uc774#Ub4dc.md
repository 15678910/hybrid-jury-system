# 🎵 포스터 모달 기능 배포 가이드

## ✅ 수정 완료 내용

### 1. App.jsx 수정사항
- ✅ `showPosterModal` state 추가
- ✅ 네비게이션에 "🎵 포스터 보기" 버튼 추가 (보라색)
- ✅ 포스터 모달 렌더링 코드 추가

### 2. Poster.jsx 수정사항
- ✅ `audioRef` useRef 추가 (음악 재생용)
- ✅ `onClose` props 지원 (모달 닫기)
- ✅ X 닫기 버튼 추가
- ✅ "지금 참여하기" 버튼 클릭 시 모달 닫고 스크롤 기능

---

## 📋 배포 체크리스트

### 1단계: 파일 교체
```bash
# 프로젝트 디렉토리로 이동
cd C:\Users\lacoi\Desktop\hybrid-jury-system

# 기존 파일 백업 (선택사항)
copy src\App.jsx src\App.jsx.backup
copy src\Poster.jsx src\Poster.jsx.backup

# 새 파일로 교체
# 다운로드 받은 App.jsx와 Poster.jsx를 src\ 폴더에 복사
```

### 2단계: 필수 파일 확인
public 폴더에 다음 파일이 있는지 확인:
- [ ] `참심제_웹자보qrcode.png` (포스터 이미지)
- [ ] `시민법정_참심제_reggae1.mp3` (배경 음악)

### 3단계: 빌드 및 배포
```bash
# 개발 서버로 테스트
npm run dev

# 브라우저에서 http://localhost:5173 접속하여 확인
# - 상단 네비게이션에 "🎵 포스터 보기" 버튼이 보이는지 확인
# - 버튼 클릭 시 모달이 열리는지 확인
# - X 버튼으로 닫히는지 확인
# - "지금 참여하기" 버튼이 작동하는지 확인

# 문제 없으면 프로덕션 빌드
npm run build

# dist 폴더가 생성됨
```

### 4단계: 서버 배포
```bash
# Vercel, Netlify, GitHub Pages 등에 배포
# 또는 dist 폴더 내용을 호스팅 서버에 업로드
```

---

## 🔍 트러블슈팅

### 문제 1: "🎵 포스터 보기" 버튼이 안 보임
**원인**: App.jsx가 제대로 교체되지 않음
**해결**: 
1. src/App.jsx 파일을 다시 확인
2. 591-603번째 줄에 포스터 보기 버튼 코드가 있는지 확인
3. 브라우저 캐시 삭제 (Ctrl + Shift + R)

### 문제 2: 모달이 열리지만 음악이 재생되지 않음
**원인**: 브라우저 자동재생 정책 또는 파일 경로 문제
**해결**:
1. public 폴더에 mp3 파일이 있는지 확인
2. 개발자 도구(F12) → Console에서 에러 확인
3. 사용자가 "🎵 음악 재생하기" 버튼을 클릭하도록 안내

### 문제 3: 포스터 이미지가 안 보임
**원인**: 이미지 파일 경로 문제
**해결**:
1. public 폴더에 `참심제_웹자보qrcode.png` 파일이 있는지 확인
2. 파일명이 정확히 일치하는지 확인 (한글 파일명)

### 문제 4: 모달이 닫히지 않음
**원인**: Poster 컴포넌트에 onClose props가 없음
**해결**:
1. Poster.jsx가 제대로 교체되었는지 확인
2. 3번째 줄에 `function Poster({ onClose })`가 있는지 확인

---

## 🎯 테스트 시나리오

### 데스크톱 테스트
1. [ ] 페이지 로드 시 네비게이션에 "🎵 포스터 보기" 버튼이 보임
2. [ ] 버튼을 클릭하면 전체 화면 모달이 열림
3. [ ] 모달이 열리면 음악이 자동 재생됨 (또는 재생 버튼이 표시됨)
4. [ ] 우측 상단 X 버튼을 클릭하면 모달이 닫힌다
5. [ ] "💪 지금 참여하기" 버튼을 클릭하면:
   - [ ] 모달이 닫힘
   - [ ] 참여하기 섹션으로 스크롤됨

### 모바일 테스트
1. [ ] 작은 화면에서도 포스터가 잘 보임
2. [ ] 터치로 버튼들이 작동함
3. [ ] 스크롤이 부드럽게 작동함

---

## 📝 주요 변경 코드

### App.jsx - State 추가 (57번째 줄 근처)
```javascript
const [showPosterModal, setShowPosterModal] = useState(false);
```

### App.jsx - 네비게이션 버튼 (595-600번째 줄)
```javascript
<button 
    onClick={() => setShowPosterModal(true)} 
    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition font-bold"
>
    🎵 포스터 보기
</button>
```

### App.jsx - 모달 렌더링 (푸터 다음)
```javascript
{showPosterModal && (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 overflow-auto">
        <Poster onClose={() => setShowPosterModal(false)} />
    </div>
)}
```

### Poster.jsx - audioRef 선언 (4번째 줄)
```javascript
const audioRef = useRef(null)
```

---

## 🚀 배포 후 확인사항

### 라이브 사이트에서 확인
- [ ] https://시민법정.kr 접속
- [ ] 네비게이션에 "🎵 포스터 보기" 버튼 확인
- [ ] 버튼 클릭 → 모달 열림 확인
- [ ] 음악 재생 확인
- [ ] 닫기 버튼 작동 확인
- [ ] 참여하기 버튼 작동 확인

### 브라우저별 테스트
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] 모바일 브라우저

---

## 💡 추가 개선 아이디어 (선택사항)

1. **모바일 햄버거 메뉴 추가**
   - 작은 화면에서도 포스터 보기 버튼 접근 가능

2. **음악 컨트롤 추가**
   - 재생/일시정지 토글
   - 볼륨 조절

3. **소셜 공유 기능**
   - 카카오톡, 페이스북 공유 버튼

4. **포스터 다운로드 기능**
   - 이미지 저장 버튼 추가

---

## 📞 지원

문제가 계속되면:
1. 개발자 도구(F12) → Console 탭에서 에러 메시지 확인
2. 에러 메시지 스크린샷과 함께 문의

---

**작업 완료일**: 2025-11-27
**버전**: 2.0
**상태**: ✅ 배포 준비 완료
