# 🔐 관리자 보안 설정 가이드

## 📋 목차
1. 비밀번호 변경 방법
2. Firebase 인증 설정
3. Vercel 환경변수 설정
4. 추가 보안 권장사항

---

## 1️⃣ 비밀번호 변경 방법 (간단한 방법)

### Step 1: .env.local 파일 생성
프로젝트 루트에 `.env.local` 파일을 만들고:

```
VITE_ADMIN_PASSWORD=여기에_강력한_비밀번호
```

### Step 2: 강력한 비밀번호 생성
- 최소 12자 이상
- 대소문자, 숫자, 특수문자 조합
- 예: `MyStr0ng!P@ssw0rd#2024`

### Step 3: .gitignore 확인
`.env.local` 파일이 Git에 커밋되지 않도록:

```
# .gitignore
.env.local
.env.development.local
.env.test.local
.env.production.local
```

---

## 2️⃣ Firebase 인증 설정 (권장 방법)

### Step 1: Firebase 프로젝트 생성
1. https://console.firebase.google.com 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력: `hybrid-jury-system`
4. Google Analytics 비활성화 (선택사항)

### Step 2: Authentication 활성화
1. 왼쪽 메뉴에서 "Authentication" 클릭
2. "시작하기" 클릭
3. "이메일/비밀번호" 활성화
4. "사용자 추가"로 관리자 계정 생성
   - 이메일: admin@example.com
   - 비밀번호: 강력한_비밀번호

### Step 3: Firestore Database 설정
1. 왼쪽 메뉴에서 "Firestore Database" 클릭
2. "데이터베이스 만들기" 클릭
3. 위치: asia-northeast3 (서울)
4. 보안 규칙:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 관리자만 읽기/쓰기 가능
    match /signatures/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 4: Firebase 설정 복사
1. 프로젝트 설정 → 일반 탭
2. "앱 추가" → 웹(</>) 선택
3. 앱 등록 후 Firebase 설정 복사
4. `.env.local`에 추가:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Step 5: Firebase 패키지 설치
```bash
npm install firebase
```

### Step 6: Admin-Firebase.jsx 사용
- `Admin.jsx`를 `Admin-Firebase.jsx`로 교체
- 또는 파일 이름 변경

---

## 3️⃣ Vercel 환경변수 설정

### Vercel Dashboard에서 설정

1. Vercel 대시보드 접속: https://vercel.com
2. 프로젝트 선택
3. "Settings" → "Environment Variables" 클릭
4. 환경변수 추가:

**기본 인증 방식:**
- Name: `VITE_ADMIN_PASSWORD`
- Value: `강력한_비밀번호`
- Environment: Production, Preview, Development 모두 체크

**Firebase 인증 방식 (추가):**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

5. "Save" 클릭
6. 프로젝트 재배포:
```bash
vercel --prod
```

---

## 4️⃣ 추가 보안 권장사항

### ✅ URL 숨기기
현재: `https://사이트.com/admin`

**개선 방법:**
1. 복잡한 URL 사용: `/admin-secret-path-2024`
2. Admin.jsx에서 URL 매핑 변경

### ✅ IP 제한 (Vercel Pro 이상)
1. Vercel Firewall 설정
2. 특정 IP만 /admin 접근 허용

### ✅ 2단계 인증 (2FA)
Firebase Authentication에서:
1. Phone Authentication 활성화
2. 이메일 + 전화번호 인증

### ✅ 로그인 시도 제한
```javascript
// Admin.jsx에 추가
const [loginAttempts, setLoginAttempts] = useState(0);

const handleLogin = (e) => {
    e.preventDefault();
    
    if (loginAttempts >= 5) {
        alert('너무 많은 로그인 시도. 10분 후 다시 시도하세요.');
        return;
    }
    
    // ... 로그인 로직
    
    if (실패) {
        setLoginAttempts(prev => prev + 1);
    } else {
        setLoginAttempts(0);
    }
};
```

### ✅ HTTPS 강제
Vercel은 자동으로 HTTPS를 제공합니다.

### ✅ 비밀번호 해싱
서버 사이드에서 bcrypt 사용 (Node.js 백엔드 필요)

---

## 🎯 빠른 시작 체크리스트

- [ ] `.env.local` 파일 생성
- [ ] 강력한 비밀번호 설정
- [ ] `.gitignore`에 `.env.local` 추가
- [ ] Vercel 환경변수 설정
- [ ] 로컬 테스트: `npm run dev`
- [ ] 배포: `vercel --prod`
- [ ] 관리자 로그인 테스트: `https://사이트.com/admin`

---

## 🔥 긴급 보안 사항

**절대 하지 마세요:**
- ❌ 비밀번호를 코드에 하드코딩
- ❌ `.env.local` 파일을 Git에 커밋
- ❌ 비밀번호를 간단하게 설정 (예: admin, 1234)
- ❌ HTTP로 관리자 페이지 접속

**반드시 하세요:**
- ✅ 환경변수 사용
- ✅ HTTPS 사용
- ✅ 강력한 비밀번호
- ✅ 정기적인 비밀번호 변경

---

## 📞 문제 해결

### Q: Vercel 환경변수가 작동하지 않습니다
A: 환경변수 저장 후 **재배포**가 필요합니다:
```bash
vercel --prod
```

### Q: Firebase 인증 오류
A: Firebase Console에서:
1. Authentication → Settings
2. 승인된 도메인에 Vercel 도메인 추가

### Q: 비밀번호를 잊어버렸습니다
A: 
1. `.env.local` 파일 확인
2. Vercel Dashboard → Environment Variables 확인
3. Firebase는 "비밀번호 재설정" 가능

---

## 📚 추가 자료

- Firebase 문서: https://firebase.google.com/docs
- Vercel 환경변수: https://vercel.com/docs/environment-variables
- 비밀번호 생성기: https://passwordsgenerator.net
