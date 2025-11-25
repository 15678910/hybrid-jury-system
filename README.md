# 혼합형 참심제 웹 애플리케이션

국민이 참여하는 공정한 재판, 혼합형 참심제를 소개하고 지지서명을 받는 웹 애플리케이션입니다.

## 🚀 배포 방법

### 방법 1: Vercel (추천 - 가장 쉬움)

1. **GitHub에 코드 올리기**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Vercel에서 배포**
   - [Vercel](https://vercel.com) 접속
   - GitHub 계정으로 로그인
   - "New Project" 클릭
   - GitHub 저장소 선택
   - "Deploy" 클릭
   - 완료! 자동으로 URL 생성됨

### 방법 2: Netlify

1. **빌드하기**
   ```bash
   npm install
   npm run build
   ```

2. **Netlify에 배포**
   - [Netlify](https://netlify.com) 접속
   - "Add new site" → "Deploy manually"
   - `dist` 폴더를 드래그 앤 드롭
   - 완료!

### 방법 3: GitHub Pages

1. **GitHub Pages 설정 추가**
   - vite.config.js에 base 경로 추가:
   ```js
   export default defineConfig({
     plugins: [react()],
     base: '/YOUR_REPO_NAME/',
   })
   ```

2. **배포 스크립트 실행**
   ```bash
   npm install
   npm run build
   git add dist -f
   git commit -m "Deploy"
   git subtree push --prefix dist origin gh-pages
   ```

## 🛠️ 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 📋 주요 기능

- ⚖️ 혼합형 참심제 제도 소개
- 🌍 해외 사례 비교 (독일, 일본, 프랑스)
- ✍️ 지지서명 기능 (개인/단체)
- 📊 실시간 가입현황 통계
- 💬 AI 챗봇 FAQ 상담
- 🔐 관리자 모드 (엑셀 다운로드)

## 🔑 관리자 비밀번호

기본 비밀번호: `admin2025`

**⚠️ 배포 전 반드시 변경하세요!**
`src/App.jsx`의 `ADMIN_PASSWORD` 상수를 수정하세요.

## 📝 라이센스

© 주권자사법개혁추진위원회(준)
