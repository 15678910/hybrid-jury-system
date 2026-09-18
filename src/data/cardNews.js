// 카드뉴스 시리즈 목록 — /cardnews 와 /cardnews/:slug 가 읽는다.
// 이미지는 public/cardnews/<slug>/<n>.png (1600×1200). 원본과 생성기는
// docs/cardnews/ 와 scripts/gen-cardnews-*.mjs 에 있다. 새 시리즈를 넣을 때는
// ① public/cardnews/<slug>/ 에 PNG 를 1.png 부터 순서대로 복사하고 ② 여기에 항목을 추가하고
// ③ functions/index.js 의 CARD_NEWS_META 에도 같은 slug 로 제목·설명을 넣는다(SNS 미리보기용).
//    제목·설명은 두 파일이 글자까지 같아야 한다 — 공유 버튼은 화면 DOM(여기)을, 링크 미리보기는
//    함수(CARD_NEWS_META)를 읽으므로 다르면 같은 링크가 두 가지 제목으로 퍼진다.
// 최신 시리즈가 위로 오도록 date 내림차순으로 적는다.

export const CARD_NEWS_SERIES = [
    {
        slug: 'future-fund-key-2026',
        news: '/cardnews/future-fund-key-2026/news.mp4?v=20260912d',
        // 모션 그래픽판 AI 뉴스 — scripts/gen_motion_news.py (장면: scripts/motion-scenes/<slug>.json). 카드판(news)과 나란히 보여준다.
        motion: '/cardnews/future-fund-key-2026/motion.mp4?v=20260912c',
        // 제안편 — 반도체 세수를 어떻게 쓸 것인가. essay 는 지식채널e풍(내레이션 없음, 글자와 음악), news 는 현빈 음성 뉴스판.
        // scripts/motion-scenes/semiconductor-windfall-e.json · scripts/news-scripts/semiconductor-windfall-2026.json
        // ⏸ 배경음악·현빈 낭독 확정 전까지 비활성. 확정되면 아래 주석을 풀고 파일을 public/cardnews/future-fund-key-2026/ 에 두고 ?v= 를 올린다.
        extra: [
            // 세 나라의 곳간편 — 노르웨이 GPFG·캐나다 CPP Investments·네덜란드 ABP(vs FES) 와 미래대응기금법안 대비. 현빈 낭독 13문장.
            // scripts/motion-scenes/three-funds-2026.json · scripts/news-scripts/three-funds-2026.json · 음성 scripts/audio/news-three/
            { kind: '제안편', label: '세 나라의 곳간 — 노르웨이·캐나다·네덜란드는 무엇을 정부 밖에 두었나 (현빈 낭독, 2분 33초)', src: '/cardnews/future-fund-key-2026/three-funds-news.mp4?v=20260915a', download: '제안편_세나라의곳간.mp4' },
            // 16:9 해설편 본편 — 구법·신법 조문 대조 → 지역 배분 → 세 나라와 대안 → 헌법 제1조. 44화면 12분 54초. wide: 가로 영상(aspect-video, 그리드 전체 폭).
            // scripts/motion-scenes/fund-explainer-2026.json · scripts/news-scripts/fund-explainer-2026.json · 렌더 --wide. 현재 무료 음성(InJoon) 시안, 현빈 녹음 후 교체 예정.
            { kind: '해설편 1', label: '구법과 신법, 그리고 세 나라의 곳간 (12분 54초)', src: '/cardnews/future-fund-key-2026/explainer.mp4?v=20260916a', download: '해설편1_구법과신법.mp4', wide: true },
            // 해설편 2 — 조문 낭독편: 신·구조문대비표 원문을 조문마다 현행→개정안→쉬운 말로→효과 순으로 낭독(diff 장면). 핵심 18조문. 무료 음성 시안, 현빈 녹음 후 교체.
            // scripts/motion-scenes/fund-articles-2026.json · scripts/news-scripts/fund-articles-2026.json
            { kind: '해설편 2', label: '조문 낭독편 — 여섯 법안 핵심 18조문을 한 줄씩 읽는다 (12분 30초)', src: '/cardnews/future-fund-key-2026/articles.mp4?v=20260917a', download: '해설편2_조문낭독.mp4', wide: true },
            // 해설편 3 — 조문 낭독편 부록: 특별회계법 2건·기금법 계정 구조·교부금법 제3조③④·국가재정법 제90조② 등 나머지 13조문. 무료 음성 시안.
            { kind: '해설편 3', label: '조문 낭독편 부록 — 나머지 13조문 (9분 2초)', src: '/cardnews/future-fund-key-2026/articles-appendix.mp4?v=20260917a', download: '해설편3_조문낭독_부록.mp4', wide: true },
            // 헌법편 — essay 모드(검은 화면·글자만·자막 없음). 노르웨이 정부연금기금법 조문 vs 한국 법안 여섯 쌍 → 헌법 제54조·제1조. 25화면 6분 2초, 현빈 낭독(scripts/audio/news-constitution).
            // scripts/motion-scenes/fund-constitution-e.json · scripts/news-scripts/fund-constitution-e.json · 렌더 --essay
            { kind: '미래대응기금편', label: '국회는 심의·확정한다 — 노르웨이 법 vs 한국 법안, 그리고 헌법 제1조 (현빈 낭독, 6분 2초)', src: '/cardnews/future-fund-key-2026/constitution-essay.mp4?v=20260918a', poster: '/cardnews/future-fund-key-2026/constitution-essay-poster.jpg?v=20260918a', download: '헌법편_노르웨이법vs한국법안.mp4' },
            // ⏸ 아래 두 편은 배경음악 확정 대기
            // { kind: '제안편', label: '반도체 세수, 어디로 가지? — 글로 읽는 2분 30초', src: '/cardnews/future-fund-key-2026/proposal-essay.mp4?v=20260915a', download: '제안편_어디로가지.mp4' },
            // { kind: '제안편', label: '반도체 세수, 어디로 가지? — 현빈 낭독판', src: '/cardnews/future-fund-key-2026/proposal-news.mp4?v=20260915a', download: '제안편_어디로가지_낭독.mp4' },
        ],
        reel: '/cardnews/future-fund-key-2026/reel.mp4?v=20260911b',
        title: '나라 곳간은 만들되, 열쇠는 입법부가 — 162조 미래대응기금 카드뉴스',
        short: '미래대응기금 10단계',
        description: '9월 3일 국회에 제출된 2027년 예산안의 162조 미래대응기금과 함께 낸 법안 여섯 건을 조문으로 확인합니다. 국가재정법 제70조의 30% 특례와 한도 없는 세입 보전 전출, 제90조 초과세수 순서의 변경, 55년 된 교육교부금 자동 연동 폐지와 학령인구 계수 35%, 그리고 돈이 흐르는 방향을 짚고, 노르웨이·앨버타·네덜란드의 곳간과 대조한 뒤 열쇠를 국회에 두는 다섯 가지 대안을 제안합니다.',
        date: '2026-09-10',
        count: 10,
        steps: [
            '나라 곳간은 만들되, 열쇠는 입법부가',
            '무엇으로 채우고, 어떻게 통과시키나',
            '문제 ① 국회 심의를 비켜 가는 두 개의 문',
            '문제 ② 초과세수의 순서가 바뀐다 — 국가재정법 제90조',
            '문제 ③ 55년 자동 배분 대신 정부의 공식',
            '문제 ④ 돈이 흐르는 방향이 표가 있는 쪽이다',
            '세 나라의 곳간 — 노르웨이·앨버타·네덜란드',
            '다섯 가지 대안',
            '나라 곳간의 이름',
            '대리인 이재명 대통령에게 묻는다',
        ],
        tags: ['미래대응기금', '국가재정법 제70조', '국가재정법 제90조', '교육교부금'],
    },
    {
        slug: 'decree-process-2026',
        news: '/cardnews/decree-process-2026/news.mp4?v=20260908c',
        motion: '/cardnews/decree-process-2026/motion.mp4?v=20260912a',
        reel: '/cardnews/decree-process-2026/reel.mp4?v=20260908b',
        title: '대통령령은 어떻게 법이 되나 — 공소청 직제안 입법예고·국회·법원 절차 카드뉴스',
        short: '대통령령 절차 7단계',
        description: '법무부가 9월 4일 입법예고한 공소청 직제안과 검사정원법 시행령을 계기로, 대통령령이 만들어지는 절차를 조문으로 확인합니다. 헌법 제75조·제89조, 행정절차법의 입법예고 40일 원칙, 국회법 제98조의2의 국회 검토 절차와 그 한계를 원문으로 대조하고, 닷새짜리 예고에 단축 사유가 없다는 점과 직제안의 법률 위반 여부를 판정한 뒤, 상위법 개정·대법원 명령규칙 심사·헌법소원이라는 세 가지 길을 제안합니다.',
        date: '2026-09-08',
        count: 7,
        steps: [
            '대통령령은 누가 만드나',
            '입법예고는 왜, 얼마나',
            '이번엔 5일이었다',
            '국회는 무엇을 할 수 있나',
            '법률 위반인가',
            '되돌리는 길 셋',
            '이재명 정부에 묻는다',
        ],
        tags: ['대통령령', '입법예고', '행정절차법', '국회법 제98조의2'],
        related: { label: '수사·기소 분리 조문 분석', to: '/law-diff' },
    },
    {
        slug: 'prosecution-office-org-2026',
        news: '/cardnews/prosecution-office-org-2026/news.mp4?v=20260908f',
        motion: '/cardnews/prosecution-office-org-2026/motion.mp4?v=20260912a',
        reel: '/cardnews/prosecution-office-org-2026/reel.mp4?v=20260908b',
        title: '법무부 입법예고 「공소청과 그 소속기관 직제」 제정안 카드뉴스 — 이재명 정부에 묻는다',
        short: '공소청 직제안 7단계',
        description: '법무부가 9월 4일 입법예고한 공소청 직제안(대통령령)을 보도자료 원문과 공소청법·형소법·중수청법·검사정원법 조문으로 대조합니다. 수사 부서 110곳을 지우고도 검사 2,292명은 그대로인 정원, 검사가 경찰을 통제하는 「사법통제부」, 중수청 합동수사과와 1대1로 앉는 대응 부서 5곳 — 준비위는 검사 정원 3분의 1 이상 감축과 불송치 심사에 시민이 앉는 구조를 제안하고, 「지휘」를 지운 정부가 「통제」라는 이름으로 되돌릴 것인지 묻습니다.',
        date: '2026-09-08',
        count: 7,
        steps: [
            '「직제」는 누가 정하나',
            '없어진 것과 남은 것',
            '「사법통제부」',
            '합동수사 「대응 부서」 5곳',
            '무엇이 문제인가',
            '제안 — 9월 9일 전에',
            '이재명 정부에 묻는다',
        ],
        tags: ['공소청 직제', '입법예고', '사법통제부', '검사 정원'],
        related: { label: '수사·기소 분리 조문 분석', to: '/law-diff' },
    },
    {
        slug: 'investigation-rules-2026',
        title: '법무부 입법예고 「검사와 특별사법경찰관의 상호협력에 관한 규정 제정안」 카드뉴스',
        short: '수사준칙 개정안·특사경 제정안 7단계',
        // 릴스(세로 영상) — public/cardnews/<slug>/reel.mp4. 있으면 상세 페이지 상단에 임베드된다.
        // scripts/gen_reel.py 로 만든 뒤 720×1280 웹용으로 재인코딩해 커밋한다(원본은 reels/, gitignore).
        reel: '/cardnews/investigation-rules-2026/reel.mp4?v=20260908b',
        // AI 1분 개벽뉴스(세로 영상, AI 음성 낭독) — scripts/gen_news.py. 720×1280 재인코딩 커밋.
        news: '/cardnews/investigation-rules-2026/news.mp4?v=20260908f',
        motion: '/cardnews/investigation-rules-2026/motion.mp4?v=20260912a',
        description: '수사·기소 분리 형소법(2026.10.2 시행)에 맞춰 법무부가 입법예고한 수사준칙 개정령안과 특사경 협력규정 제정안을 조문으로 대조합니다. 법이 지운 「지휘」가 대통령령에서 되살아나는지 — 제29조의2 ② 호송 의무, 제8조의3 「요청」과 「요구」, 제정안 제25조 「이행해야 한다」를 확인하고 이재명 정부에 묻습니다.',
        date: '2026-09-02',
        count: 7,
        steps: [
            '법은 「지휘」를 지웠다',
            '제29조의2 ② — 「호송」',
            '제8조의3 — 「요청」과 「요구」',
            '특사경 — 「지도·조언」의 무게',
            '무엇이 문제인가',
            '제안 — 9월 4일 전에',
            '이재명 정부에 묻는다',
        ],
        tags: ['수사준칙', '입법예고', '수사·기소 분리'],
        related: { label: '수사·기소 분리 조문 분석', to: '/law-diff' },
    },
    {
        slug: 'judgment-disclosure',
        title: '판결서 공개 — 6단계 카드뉴스',
        short: '판결서 공개 6단계',
        description: '헌법 제109조는 재판을 공개한다고 선언하는데 판결문은 왜 읽기 어려운가. 형사·민사 판결서 열람 조문을 원문으로 대조하고, 2027.12.31 시행되는 형사 미확정 판결서 공개까지 — 막히는 지점 다섯과 남은 과제를 정리합니다.',
        date: '2026-09-02',
        count: 6,
        steps: [
            '재판은 공개다 — 그런데 판결문은?',
            '형사와 민사가 다르다',
            '막히는 지점 다섯',
            '이미 바뀌고 있다',
            '제안 — 남은 것을 완성하라',
            '이것은 별도 쟁점이 아니다',
        ],
        tags: ['판결서 공개', '헌법 제109조', '시민 감시'],
        related: { label: '수사·기소 분리 조문 분석', to: '/law-diff' },
    },
    {
        slug: 'criminal-procedure-2026',
        title: '형사소송법 개정 — 수사·기소 분리 카드뉴스',
        short: '형소법 개정 9단계',
        description: '2026.10.2 시행되는 검찰청 폐지·공소청·중수청 체제가 무엇을 바꾸는지 조문으로 확인합니다. 시민의 절차가 어떻게 달라지는지, 중수청이 「검찰 중심」이 되면 어떤 문제가 생기는지, 글을 몰라도 작동하는 권리까지 — 9단계로 정리했습니다.',
        date: '2026-09-02',
        count: 9,
        steps: [
            '지금 제도는?',
            '뭐가 달라지나',
            '시민의 절차는 어떻게 달라지나',
            '중수청이 「검찰 중심」이 되면?',
            '중수청, 어떻게 짜야 하나',
            '변호사 시장은 어떻게 커지나',
            '왜 논란이 되나',
            '대안은 무엇인가',
            '글을 몰라도 작동하는 권리',
        ],
        tags: ['형사소송법', '공소청', '중수청'],
        related: { label: '수사·기소 분리 조문 분석', to: '/law-diff' },
    },
];

export const getCardNewsSeries = (slug) => CARD_NEWS_SERIES.find((s) => s.slug === slug) || null;

export const cardImageUrl = (slug, n) => `/cardnews/${slug}/${n}.png`;
