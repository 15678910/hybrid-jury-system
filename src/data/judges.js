// 판사 공통 데이터 (내란 재판 담당 판사 및 영장전담판사)
export const JUDGES_DATA = [
    // 헌법재판소 재판관 6명
    {
        id: 'moon-hyungbae',
        name: '문형배',
        category: '헌법재판소',
        court: '헌법재판소',
        position: '전 헌법재판소장 권한대행',
        appointedBy: '대통령 (문재인)',
        photo: '/문형배.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '헌법재판소 재판관 (2019~2025)',
            '헌법재판소장 권한대행 (2024~2025)',
            '서울대학교 법학전문대학원 교수',
            '사법시험 제32회 합격'
        ],
        cases: [
            { text: '윤석열 대통령 탄핵심판 (2024~2025, 파면)', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202504041431001' } },
            { text: '대북전단금지법 합헌 소수의견 (2023.09, 7:2 위헌 결정)', source: { name: '법률저널', url: 'http://www.lec.co.kr/news/articleView.html?idxno=744297' } },
            { text: '낙동강 4대강 사업 적법 판결 (2011, 부산지법)', source: null }
        ]
    },
    {
        id: 'lee-misun',
        name: '이미선',
        category: '헌법재판소',
        court: '헌법재판소',
        position: '전 헌법재판관',
        appointedBy: '대통령 (문재인)',
        photo: '/이미선.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '헌법재판소 재판관 (2019~2025)',
            '법무법인 지평 구성원 변호사',
            '공익인권변호사모임 희망을만드는법 대표',
            '사법시험 제32회 합격'
        ],
        cases: [
            { text: '윤석열 대통령 탄핵심판 (2024~2025, 파면)', source: { name: '뉴스핌', url: 'https://www.newspim.com/news/view/20250404000769' } },
            { text: '군형법 추행죄 합헌 반대의견 (2023.10, 5:4)', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202310261539001' } },
            { text: '이테크건설 주식 투자 논란 (2018-2019, 무혐의)', source: { name: '한국경제', url: 'https://www.hankyung.com/article/2019041005387' } }
        ]
    },
    {
        id: 'jung-jeongmi',
        name: '정정미',
        category: '헌법재판소',
        court: '헌법재판소',
        position: '헌법재판관',
        appointedBy: '대법원장 (김명수)',
        photo: 'https://www.ccourt.go.kr/images/engNew/2ju/justices-3.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '헌법재판소 재판관 (2023~현재)',
            '법무법인 세종 변호사',
            '법무법인 율촌 변호사',
            '사법시험 제32회 합격'
        ],
        cases: [
            { text: '윤석열 대통령 탄핵심판 (2024~)', source: null },
            { text: '국가보안법 제7조 위헌 소수의견', source: null },
            { text: '군형법 92조의6 위헌 소수의견 (2023.10)', source: { name: 'HRW', url: 'https://www.hrw.org/ko/news/2023/10/31/south-korean-court-upholds-military-sodomy-law' } },
            { text: '종합부동산세 중과 위헌 소수의견', source: null }
        ]
    },
    {
        id: 'kim-hyungdu',
        name: '김형두',
        category: '헌법재판소',
        court: '헌법재판소',
        position: '헌법재판관',
        appointedBy: '대법원장 (김명수)',
        photo: 'https://www.ccourt.go.kr/images/engNew/2ju/justices-10.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '헌법재판소 재판관 (2023~현재)',
            '서울지방변호사회 회장',
            '법무법인 광장 변호사',
            '사법시험 제28회 합격'
        ],
        cases: [
            { text: '윤석열 대통령 탄핵심판 (2024~)', source: null },
            { text: '긴급조치 9호 국가배상 인정 (2020, 서울고법)', source: { name: '한국경제', url: 'https://www.hankyung.com/article/202303069439Y' } },
            { text: '긴급조치 위헌 일관된 입장', source: null }
        ]
    },
    {
        id: 'jung-gyeseon',
        name: '정계선',
        category: '헌법재판소',
        court: '헌법재판소',
        position: '헌법재판관',
        appointedBy: '국회 (야당-더불어민주당)',
        photo: 'https://www.ccourt.go.kr/images/engNew/2ju/justices-14.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '헌법재판소 재판관 (2024~현재)',
            '서울남부지방법원 부장판사',
            '사법연수원 제30기 수료'
        ],
        cases: [
            { text: '윤석열 대통령 탄핵심판 (2024~)', source: null },
            { text: '한덕수 총리 탄핵심판 나홀로 인용 (2025.03)', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202503241326001' } },
            { text: '이명박 1심 징역 15년 선고 (2018, 서울중앙지법)', source: { name: '세계일보', url: 'https://www.segye.com/newsView/20181005004541' } }
        ]
    },
    {
        id: 'jung-hyungsik',
        name: '정형식',
        category: '헌법재판소',
        court: '헌법재판소',
        position: '헌법재판관',
        appointedBy: '대통령 (윤석열)',
        photo: '/정형식.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '헌법재판소 재판관 (2023.12~현재)',
            '대전고등법원장',
            '사법연수원 제17기 수료'
        ],
        cases: [
            { text: '윤석열 대통령 탄핵심판 (2024~2025, 파면) - 소수의견: "내란죄 성립 여부에 관계없이 파면 사유 충족"이라는 다수의견에 반대하며, 내란죄 성립이 인정되어야만 파면 사유가 된다는 의견 제시', source: { name: '한겨레', url: 'https://www.hani.co.kr/arti/society/society_general/1183767.html' } },
            { text: '한덕수 총리 탄핵심판 기각 의견 (2025.03)', source: { name: '한국일보', url: 'https://www.hankookilbo.com/News/Read/A2025032413530004824' } }
        ]
    },
    {
        id: 'cho-hanchang',
        name: '조한창',
        category: '헌법재판소',
        court: '헌법재판소',
        position: '헌법재판관',
        appointedBy: '국회 (여당-국민의힘)',
        photo: 'https://www.ccourt.go.kr/images/engNew/2ju/justices-13.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '헌법재판소 재판관 (2025.01~현재)',
            '법무법인 도울 대표변호사',
            '사법연수원 제18기 수료'
        ],
        cases: [
            { text: '윤석열 대통령 탄핵심판 (2025, 파면) - 소수의견: 정형식 재판관과 같이 "내란죄 성립이 인정되어야만 파면 사유가 된다"는 별개의견 제시', source: { name: '한겨레', url: 'https://www.hani.co.kr/arti/society/society_general/1183767.html' } },
            { text: '한덕수 총리 탄핵심판 기각 의견 (2025.03)', source: { name: '한국일보', url: 'https://www.hankookilbo.com/News/Read/A2025032413530004824' } }
        ]
    },
    {
        id: 'kim-sanghwan',
        name: '김상환',
        category: '헌법재판소',
        court: '헌법재판소',
        position: '헌법재판소장',
        appointedBy: '대통령 (이재명, 소장 지명)',
        photo: 'https://www.ccourt.go.kr/images/engNew/2ju/justices-16.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '헌법재판소장 (2025.07~현재)',
            '전 대법관 (2018~2024)',
            '사법연수원 제14기 수료'
        ],
        cases: []
    },
    {
        id: 'oh-youngjun',
        name: '오영준',
        category: '헌법재판소',
        court: '헌법재판소',
        position: '헌법재판관',
        appointedBy: '대통령 (이재명)',
        photo: 'https://www.ccourt.go.kr/images/engNew/2ju/justices-17.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '헌법재판소 재판관 (2025.07~현재)',
            '서울고등법원 부장판사',
            '사법연수원 제23기 수료'
        ],
        cases: []
    },
    {
        id: 'ma-eunhyuk',
        name: '마은혁',
        category: '헌법재판소',
        court: '헌법재판소',
        position: '헌법재판관',
        appointedBy: '국회 (야당-더불어민주당)',
        photo: 'https://www.ccourt.go.kr/images/engNew/2ju/justices-15.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '헌법재판소 재판관 (2025.07~현재)',
            '서울고등법원 부장판사',
            '사법연수원 제26기 수료'
        ],
        cases: []
    },
    // 대법원
    {
        id: 'cho-heedae',
        name: '조희대',
        category: '대법원',
        court: '대법원',
        position: '대법원장',
        appointedBy: '대통령 (윤석열) 지명',
        photo: '/조희대.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '제17대 대법원장 (2023.12~현재)',
            '대법관 (2017.09~2023.09)',
            '사법연수원 제14기 수료'
        ],
        cases: [
            { text: '이재명 공직선거법 위반 파기환송 (2025.05, 전원합의체)', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202505030900041' } },
            { text: '윤석열 내란 재판 최종 상고심 (예정)', source: null },
            { text: '은별이 사건 무죄 확정 주심 (2017.11, 15세 여중생 성폭력)', source: { name: '서울신문', url: 'https://www.seoul.co.kr/news/politics/2023/12/06/20231206500040' } }
        ]
    },
    {
        id: 'noh-taeark',
        name: '노태악',
        category: '대법원',
        court: '대법원',
        position: '대법관',
        appointedBy: '대법원장 (김명수) 제청, 대통령 (문재인) 임명',
        photo: '/노태악.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '대법관 (2020.03~현재)',
            '서울고등법원 부장판사',
            '사법연수원 제16기 수료'
        ],
        cases: [
            { text: '이재명 공직선거법 위반 파기환송 (2025.05, 전원합의체 참여)', source: null }
        ]
    },
    {
        id: 'lee-heunggu',
        name: '이흥구',
        category: '대법원',
        court: '대법원',
        position: '대법관',
        appointedBy: '대법원장 (김명수) 제청, 대통령 (문재인) 임명',
        photo: '/이흥구.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '대법관 (2020.09~현재)',
            '부산고등법원 부장판사',
            '사법연수원 제22기 수료'
        ],
        cases: [
            { text: '이재명 공직선거법 위반 반대의견 (2025.05, 10:2 중 반대)', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202505021641001' } },
            { text: '정치적 표현의 자유 확장 주장', source: null }
        ]
    },
    {
        id: 'cheon-daeyeop',
        name: '천대엽',
        category: '대법원',
        court: '대법원',
        position: '대법관',
        appointedBy: '대법원장 (김명수) 제청, 대통령 (문재인) 임명',
        photo: '/천대엽.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '대법관 (2021.05~현재)',
            '서울고등법원 수석부장판사',
            '사법연수원 제20기 수료'
        ],
        cases: [
            { text: '이재명 공직선거법 위반 파기환송 (2025.05, 전원합의체 참여)', source: null },
            { text: '성범죄 피해자 진술 증명력 제한 판결 (2024.01, "천대엽 판결")', source: { name: '여성신문', url: 'https://www.womennews.co.kr/news/articleView.html?idxno=256117' } }
        ]
    },
    {
        id: 'oh-kyungmi',
        name: '오경미',
        category: '대법원',
        court: '대법원',
        position: '대법관',
        appointedBy: '대법원장 (김명수) 제청, 대통령 (문재인) 임명',
        photo: '/오경미.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '대법관 (2021.09~현재)',
            '서울중앙지방법원 부장판사',
            '사법연수원 제25기 수료'
        ],
        cases: [
            { text: '이재명 공직선거법 위반 반대의견 (2025.05, 10:2 중 반대)', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202505021641001' } },
            { text: '정치적 표현의 자유 41페이지 반대의견', source: null }
        ]
    },
    {
        id: 'oh-sukjun',
        name: '오석준',
        category: '대법원',
        court: '대법원',
        position: '대법관',
        appointedBy: '대법원장 (김명수) 제청, 대통령 (윤석열) 임명',
        photo: '/오석준.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '대법관 (2022.11~현재)',
            '제주지방법원장',
            '사법연수원 제23기 수료'
        ],
        cases: [
            { text: '이재명 공직선거법 위반 파기환송 (2025.05, 전원합의체 참여)', source: null }
        ]
    },
    {
        id: 'seo-kyunghwan',
        name: '서경환',
        category: '대법원',
        court: '대법원',
        position: '대법관',
        appointedBy: '대법원장 (김명수) 제청, 대통령 (윤석열) 임명',
        photo: '/서경환.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '대법관 (2023.07~현재)',
            '서울고등법원 부장판사',
            '사법연수원 제24기 수료'
        ],
        cases: [
            { text: '이재명 공직선거법 위반 파기환송 (2025.05, 전원합의체 참여)', source: null },
            { text: '세월호 선장 살인죄 인정 (2015, 광주고법)', source: { name: '전자신문', url: 'http://www.etnews.com/20150428000404' } }
        ]
    },
    {
        id: 'kwon-youngjun',
        name: '권영준',
        category: '대법원',
        court: '대법원',
        position: '대법관',
        appointedBy: '대법원장 (김명수) 제청, 대통령 (윤석열) 임명',
        photo: '/권영준.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '대법관 (2023.07~현재)',
            '서울대학교 법학전문대학원 교수',
            '사법연수원 제26기 수료'
        ],
        cases: [
            { text: '이재명 공직선거법 위반 파기환송 (2025.05, 전원합의체 참여)', source: null },
            { text: '동성 동반자 건강보험 피부양자 불인정 (2024)', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202412090600101' } },
            { text: '로펌 고액 의견서 논란 (취임 전 18억)', source: { name: '경실련', url: 'https://ccej.or.kr/posts/YytEWE' } }
        ]
    },
    {
        id: 'eom-sangpil',
        name: '엄상필',
        category: '대법원',
        court: '대법원',
        position: '대법관',
        appointedBy: '대법원장 (조희대) 제청, 대통령 (윤석열) 임명',
        photo: '/엄상필.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '대법관 (2024.02~현재)',
            '서울고등법원 부장판사',
            '사법연수원 제24기 수료'
        ],
        cases: [
            { text: '이재명 공직선거법 위반 파기환송 (2025.05, 전원합의체 참여)', source: null },
            { text: '조국 입시비리 징역 2년 확정 주심 (2024.12)', source: { name: '한국일보', url: 'https://www.hankookilbo.com/News/Read/A2024121211300005361' } }
        ]
    },
    {
        id: 'shin-sukhee',
        name: '신숙희',
        category: '대법원',
        court: '대법원',
        position: '대법관',
        appointedBy: '대법원장 (조희대) 제청, 대통령 (윤석열) 임명',
        photo: '/신숙희.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '대법관 (2024.02~현재)',
            '대전고등법원 부장판사',
            '사법연수원 제27기 수료'
        ],
        cases: [
            { text: '이재명 공직선거법 위반 파기환송 (2025.05, 전원합의체 참여)', source: null }
        ]
    },
    {
        id: 'noh-kyungpil',
        name: '노경필',
        category: '대법원',
        court: '대법원',
        position: '대법관',
        appointedBy: '대법원장 (조희대) 제청, 대통령 (윤석열) 임명',
        photo: '/노경필.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '대법관 (2024.08~현재)',
            '서울고등법원 부장판사',
            '사법연수원 제28기 수료'
        ],
        cases: [
            { text: '이재명 공직선거법 위반 파기환송 (2025.05, 전원합의체 참여)', source: null }
        ]
    },
    {
        id: 'park-youngjae',
        name: '박영재',
        category: '대법원',
        court: '대법원',
        position: '대법관',
        appointedBy: '대법원장 (조희대) 제청, 대통령 (윤석열) 임명',
        photo: '/박영재.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '대법관 (2024.08~현재)',
            '서울고등법원 부장판사',
            '사법연수원 제29기 수료'
        ],
        cases: [
            { text: '이재명 공직선거법 위반 파기환송 (2025.05, 전원합의체 참여)', source: null }
        ]
    },
    {
        id: 'lee-sukyeon',
        name: '이숙연',
        category: '대법원',
        court: '대법원',
        position: '대법관',
        appointedBy: '대법원장 (조희대) 제청, 대통령 (윤석열) 임명',
        photo: '/이숙연.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '대법관 (2024.08~현재)',
            '서울고등법원 부장판사',
            '사법연수원 제28기 수료'
        ],
        cases: [
            { text: '이재명 공직선거법 위반 파기환송 주심 (2025.05)', source: null },
            { text: '법원행정처장 임명 (2026.01, 사법개혁 반대 논란)', source: null }
        ]
    },
    {
        id: 'ma-yongju',
        name: '마용주',
        category: '대법원',
        court: '대법원',
        position: '대법관',
        appointedBy: '대법원장 (조희대) 제청, 대통령 권한대행 (한덕수) 임명',
        photo: '/마용주.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '대법관 (2025.04~현재)',
            '서울고등법원 부장판사',
            '사법연수원 제23기 수료'
        ],
        cases: []
    },
    // 내란전담재판부
    {
        id: 'kim-bokhyung',
        name: '김복형',
        category: '헌법재판소',
        court: '헌법재판소',
        position: '헌법재판관',
        appointedBy: '대법원장 (조희대)',
        photo: 'https://www.ccourt.go.kr/images/engNew/2ju/justices-12.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '헌법재판소 재판관 (2024~현재)',
            '서울고등법원 부장판사',
            '사법연수원 제28기 수료'
        ],
        cases: [
            { text: '윤석열 대통령 탄핵심판 (2024~2025, 파면) - 소수의견: 정형식, 조한창 재판관과 같이 "내란죄 성립이 인정되어야만 파면 사유가 된다"는 별개의견 제시', source: { name: '한겨레', url: 'https://www.hani.co.kr/arti/society/society_general/1183767.html' } },
            { text: '한덕수 총리 탄핵심판 위헌/위법행위 없음 의견 (2025.03)', source: { name: '한국일보', url: 'https://www.hankookilbo.com/News/Read/A2025032413530004824' } }
        ]
    },
    {
        id: 'ji-gwiyeon',
        name: '지귀연',
        category: '내란전담재판부',
        court: '서울중앙지방법원',
        position: '형사합의25부 부장판사 (내란 전담)',
        photo: '/지귀연.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울중앙지방법원 형사합의25부 부장판사 (2023.02~현재)',
            '대법원 재판연구관 (2015~2018, 2020~2023)',
            '부산지방법원 동부지원 부장판사',
            '사법연수원 제31기 수료'
        ],
        cases: [
            { text: '윤석열 대통령 내란 수괴 재판 재판장 (2025~)', source: { name: '머니투데이', url: 'https://www.mt.co.kr/society/2025/01/31/2025013116342094711' } },
            { text: '삼성 이재용 부당합병 전부 무죄 (2024.02)', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202511261859001' } },
            { text: '유아인 마약 징역 1년 (2024.09)', source: { name: '법률신문', url: 'https://www.lawtimes.co.kr/news/201109' } },
            { text: '룸살롱 접대 의혹 (2025, 공수처 수사 중)', source: { name: '머니투데이', url: 'https://www.mt.co.kr/society/2025/01/31/2025013116342094711' } },
            { text: '윤석열 구속취소 결정 시간기준 논란 (2025.03) - 71년 관례인 날짜 기준 대신 시간 기준 적용', source: { name: '법률신문', url: 'https://www.lawtimes.co.kr/news/206153' } },
            { text: '내란 재판 비공개 진행 논란 (2025.04) - 전직 대통령 재판 최초 비공개, 시민단체 공수처 고발', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202504131649001' } }
        ]
    },
    {
        id: 'woo-insung',
        name: '우인성',
        category: '내란전담재판부',
        court: '서울중앙지방법원',
        position: '형사합의27부 부장판사',
        photo: '/우인성.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울중앙지방법원 형사합의27부 부장판사 (현재)',
            '서울서부지방법원 부장판사',
            '대법원 재판연구관 (2012~2014)',
            '사법연수원 제29기 수료'
        ],
        cases: [
            { text: '김건희 주가조작 징역 1년 8개월 (2026.01, 주가조작 무죄)', source: { name: '머니투데이', url: 'https://www.mt.co.kr/society/2026/01/28/2026012814040115676' } },
            { text: '서병호 간첩조작사건 재심 기각 (2025.07, 진화위 재심 권고에도 불구)', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202507181841001' } },
            { text: '장영하 1심 무죄→항소심 유죄 (2024)', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202501241620001' } },
            { text: '가세연 1심 무죄→항소심 유죄', source: { name: '서울경제', url: 'https://www.sedaily.com/article/20002586' } },
            { text: '민주당 돈봉투 1심 유죄→항소심 무죄', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202512181105001' } },
            { text: '강남 의대생 여친 살인 징역 26년 (2024.12, 검찰 사형 구형) - "수능 만점자 사회 기여 가능성" 발언 논란', source: { name: '서울신문', url: 'https://www.seoul.co.kr/news/society/2026/01/29/20260129500294' } }
        ]
    },
    {
        id: 'lee-jingwan',
        name: '이진관',
        category: '내란전담재판부',
        court: '서울중앙지방법원',
        position: '형사합의33부 부장판사',
        photo: '/이진관.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울중앙지방법원 형사합의33부 부장판사 (2025.02~현재)',
            '사법연수원 교수 (2022~2024)',
            '대법원 재판연구관 (2016)',
            '사법연수원 제32기 수료'
        ],
        cases: [
            { text: '한덕수 내란 징역 23년 선고 (2026.01, 구형보다 8년 높음)', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202601211634001' } },
            { text: '이재명 대장동·성남FC 재판 무기한 연기 (불소추특권)', source: { name: '법률신문', url: 'https://www.lawtimes.co.kr/news/207843' } },
            { text: '대장동·백현동·위례신도시 개발 비리 재판', source: { name: '법률신문', url: 'https://www.lawtimes.co.kr/news/192041' } },
            { text: '이하상 변호사 15일 감치 집행 (2026.02) - 김용현 변호인 법정 소란, 대법원 특별항고 기각', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202602031634001' } }
        ]
    },
    {
        id: 'ryu-kyungjin',
        name: '류경진',
        category: '내란전담재판부',
        court: '서울중앙지방법원',
        position: '형사합의32부 부장판사',
        appointedBy: '',
        photo: '/류경진.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울중앙지방법원 형사합의32부 부장판사 (현재)',
            '인천지방법원 부장판사',
            '서울고등법원 판사',
            '의정부지방법원 판사',
            '광주고등법원 판사',
            '전주지방법원 판사',
            '법무법인 태평양 변호사',
            '사법연수원 제31기 수료'
        ],
        cases: [
            { text: '이상민 내란중요임무종사 징역 7년 선고 (2026.02.12) - "국가 존립을 위태롭게 한 내란 행위에 엄중한 처벌 필요"', source: { name: '뉴시스', url: 'https://www.newsis.com/view/NISX20260212_0003513827' } },
            { text: '인천 편의점 강도살인 사건 무기징역 + 전자발찌 20년 (인천지법)', source: null },
            { text: '잠진도 아내 살인사건 징역 23년 (인천지법)', source: null },
            { text: '38년간 딸 간병 후 살해 60대 어머니 집행유예 - "중증 장애인 가족을 지원하지 않는 국가 시스템의 문제"', source: null },
            { text: '부장판사 뇌물수수 혐의 무죄 판결 (2023, 증거 부족) - 법관 간 편파 논란', source: null }
        ]
    },
    // 내란전담재판부 - 서울고등법원 항소심 (2026.02.05 지정)
    // 형사1부
    {
        id: 'yoon-sungsik',
        name: '윤성식',
        category: '내란전담재판부(항소심)',
        court: '서울고등법원',
        position: '형사1부 재판장 (내란 항소심 전담)',
        appointedBy: '',
        photo: '',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울고등법원 형사1부 부장판사 (현재)',
            '대법관 후보 거론',
            '사법연수원 제24기 수료'
        ],
        cases: [
            { text: '송영길 돈봉투 사건 2심 전부 무죄 (2026.02.13) - 이정근 녹음파일 증거능력 불인정, 먹사연 압수물 위법수집 증거 판단', source: { name: '법률신문', url: 'https://www.lawtimes.co.kr/news/articleView.html?idxno=216287' } },
            { text: '내란 사건 항소심 전담 재판장 (2026.02.05 지정)', source: { name: '파이낸셜뉴스', url: 'https://www.fnnews.com/news/202602051604190466' } },
            { text: '민청학련 유인태 재심 무죄 선고 (서울고법) - 긴급조치 위반 사건 재심', source: null }
        ]
    },
    {
        id: 'min-sungchul',
        name: '민성철',
        category: '내란전담재판부(항소심)',
        court: '서울고등법원',
        position: '형사1부 배석판사',
        appointedBy: '',
        photo: '',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울고등법원 형사1부 판사 (현재)',
            '대법원 재판연구관',
            '서울중앙지방법원 부장판사',
            '서울북부지방법원 판사',
            '사법연수원 제29기 수료'
        ],
        cases: [
            { text: '위안부 피해자 대일 손해배상 소송 각하 (2021.04) - 국가면제 적용, 항소심에서 파기', source: { name: '한국경제', url: 'https://www.hankyung.com/article/202104219808Y' } },
            { text: '내란 사건 항소심 배석 (2026.02.05~)', source: null }
        ]
    },
    {
        id: 'lee-donghyun',
        name: '이동현',
        category: '내란전담재판부(항소심)',
        court: '서울고등법원',
        position: '형사1부 배석판사',
        appointedBy: '',
        photo: '',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울고등법원 형사1부 판사 (현재)',
            '사법연수원 교수',
            '부산고등법원 판사',
            '인천지방법원 판사',
            '서울중앙지방법원 판사',
            '사법연수원 제36기 수료'
        ],
        cases: [
            { text: '내란 사건 항소심 배석 (2026.02.05~)', source: null }
        ]
    },
    // 형사12부 (대등재판부 - 부장판사 없이 구성)
    {
        id: 'lee-seungchul',
        name: '이승철',
        category: '내란전담재판부(항소심)',
        court: '서울고등법원',
        position: '형사12부 판사 (대등재판부)',
        appointedBy: '',
        photo: '',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울고등법원 형사12부 판사 (현재)',
            '사법연수원 제26기 수료'
        ],
        cases: [
            { text: '내란 사건 항소심 대등재판부 (2026.02.05 지정)', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202602052041005' } }
        ]
    },
    {
        id: 'cho-jingu',
        name: '조진구',
        category: '내란전담재판부(항소심)',
        court: '서울고등법원',
        position: '형사12부 판사 (대등재판부)',
        appointedBy: '',
        photo: '',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울고등법원 형사12부 판사 (현재)',
            '사법연수원 제29기 수료'
        ],
        cases: [
            { text: '내란 사건 항소심 대등재판부 (2026.02.05 지정)', source: null }
        ]
    },
    {
        id: 'kim-mina',
        name: '김민아',
        category: '내란전담재판부(항소심)',
        court: '서울고등법원',
        position: '형사12부 판사 (대등재판부)',
        appointedBy: '',
        photo: '',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울고등법원 형사12부 판사 (현재)',
            '사법연수원 제34기 수료'
        ],
        cases: [
            { text: '내란 사건 항소심 대등재판부 (2026.02.05 지정)', source: null }
        ]
    },
    // 영장전담판사 7명
    {
        id: 'ma-sungyoung',
        name: '마성영',
        category: '영장전담판사',
        court: '서울중앙지방법원',
        position: '영장전담판사',
        photo: '/마성영.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울중앙지방법원 영장전담판사 (2024~현재)',
            '서울중앙지방법원 판사'
        ],
        cases: [
            { text: '윤석열 대통령 체포영장 이의신청 기각 (2025.01.05)', source: { name: 'JTBC', url: 'https://mnews.jtbc.co.kr/News/Article.aspx?news_id=NB12192513' } }
        ]
    },
    {
        id: 'park-wonjung',
        name: '박원정',
        category: '영장전담판사',
        court: '서울중앙지방법원',
        position: '영장전담판사',
        photo: '',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울중앙지방법원 영장전담판사',
            '서울중앙지방법원 판사'
        ],
        cases: [
            { text: '김용현 전 국방부장관 구속영장 발부 (2024)', source: { name: 'KBS', url: 'https://news.kbs.co.kr/news/view.do?ncd=8117929' } }
        ]
    },
    {
        id: 'myung-jaekwon',
        name: '명재권',
        category: '영장전담판사',
        court: '서울중앙지방법원',
        position: '영장전담판사',
        photo: '/명재권.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울중앙지방법원 영장전담판사 (2024~현재)',
            '서울중앙지방법원 판사'
        ],
        cases: [
            { text: '윤석열 대통령 구속영장 발부 (2025.01.19)', source: { name: 'MBC', url: 'https://imnews.imbc.com/news/2025/society/article/6708128_36466.html' } }
        ]
    },
    {
        id: 'jung-jaewook',
        name: '정재욱',
        category: '영장전담판사',
        court: '서울중앙지방법원',
        position: '영장전담판사',
        photo: '/정재욱.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울중앙지방법원 영장전담판사',
            '서울중앙지방법원 판사'
        ],
        cases: [
            { text: '이상민 내란 공모 구속영장 발부 (2025.01)', source: { name: '헤럴드경제', url: 'https://biz.heraldcorp.com/article/10541569' } },
            { text: '김건희 구속영장 발부 (2025.08.12)', source: { name: '뉴스1', url: 'https://www.news1.kr/society/court-prosecution/5872912' } },
            { text: 'IBK기업은행 부당대출 구속영장 기각 (2025.04)', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202504282244001' } }
        ]
    },
    {
        id: 'park-jungho',
        name: '박정호',
        category: '영장전담판사',
        court: '서울중앙지방법원',
        position: '영장전담판사',
        photo: '/박정호.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울중앙지방법원 영장전담판사',
            '서울중앙지방법원 판사'
        ],
        cases: [
            { text: '박성재 전 법무장관 구속영장 기각 (2025.10)', source: { name: '한국일보', url: 'https://www.hankookilbo.com/News/Read/A2025101414490001186' } },
            { text: '집사게이트 조영탁 구속영장 기각 (2024)', source: { name: '법률신문', url: 'https://www.lawtimes.co.kr/news/211089' } },
            { text: 'MBK파트너스 김병주 구속심사', source: { name: '머니S', url: 'https://www.moneys.co.kr/article/2026011408255176284' } }
        ]
    },
    {
        id: 'lee-jungjae',
        name: '이정재',
        category: '영장전담판사',
        court: '서울중앙지방법원',
        position: '영장전담판사',
        photo: '/이정재.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울중앙지방법원 영장전담판사',
            '서울중앙지방법원 판사'
        ],
        cases: [
            { text: '윤석열 체포영장 기각 (2025.06)', source: { name: '국민뉴스', url: 'https://m.kookminnews.com/a.html?uid=109069' } },
            { text: '채해병 사건 이종섭 등 5명 구속영장 줄기각', source: { name: '서울신문', url: 'https://www.seoul.co.kr/news/society/law/2025/10/24/20251024500006' } },
            { text: '추경호 구속영장 기각 (2025.12)', source: { name: '머니투데이', url: 'https://www.mt.co.kr/society/2025/12/03/2025120216080985064' } },
            { text: '임성근 채상병 구속영장 발부', source: { name: '법률신문', url: 'https://www.lawtimes.co.kr/news/212525' } }
        ]
    },
    {
        id: 'nam-sejin',
        name: '남세진',
        category: '영장전담판사',
        court: '서울중앙지방법원',
        position: '영장전담판사',
        photo: '/남세진.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울중앙지방법원 영장전담판사',
            '서울중앙지방법원 판사'
        ],
        cases: [
            { text: '윤석열 2차 구속영장 발부 (2025.07.10)', source: { name: '뉴스1', url: 'https://www.news1.kr/society/court-prosecution/5837635' } },
            { text: '권성동 정치자금법 위반 구속심문 (2025.09)', source: { name: '머니S', url: 'https://www.moneys.co.kr/article/2025091217453260515' } },
            { text: '대진연 회원 4명 구속영장 기각 (2025.05)', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202505122150001' } },
            { text: '김계환 모해위증 구속영장 기각', source: { name: '서울신문', url: 'https://www.seoul.co.kr/news/society/2025/07/22/20250722500272' } }
        ]
    }
];
