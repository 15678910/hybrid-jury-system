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
        ],
        justiceEvaluation: {
            prosecutionScore: 72,
            courtScore: 85,
            overallScore: 80,
            summary: '문형배 전 헌법재판소장 권한대행은 탄핵심판에서 일관된 헌법 수호 입장을 보였다. 대북전단금지법 등에서 소수의견을 제시하며 독자적 법해석 능력을 보여주었으나, 낙동강 4대강 사업 판결 등 과거 판결에서는 논란이 있었다.',
            issues: [
                {
                    category: '재판부',
                    title: '탄핵심판 일관된 헌법 수호',
                    description: '윤석열 대통령 탄핵심판에서 다수의견으로 파면 결정을 이끌었으며, 헌법재판소장 권한대행으로서 재판 진행의 공정성을 유지했다.',
                    impact: '→ 헌법 수호와 법치주의 실현에 기여'
                },
                {
                    category: '재판부',
                    title: '소수의견을 통한 독자적 법해석',
                    description: '대북전단금지법 합헌 결정에서 7:2 위헌 소수의견을 제시하며 표현의 자유 관점에서 독자적 판단을 보여주었다.',
                    impact: '→ 사법부 독립성과 다양한 법적 견해 제시'
                }
            ]
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 65,
            courtScore: 70,
            overallScore: 68,
            summary: '탄핵심판에서 일관된 입장을 보였으며, 이테크건설 주식 투자 논란이 있었으나 무혐의 처리되었다.',
            issues: [
                {
                    category: '재판부',
                    title: '탄핵심판 헌법 수호 기여',
                    description: '윤석열 대통령 탄핵심판에서 일관된 입장으로 파면 결정에 기여했다.',
                    impact: '→ 헌법 수호 긍정적 평가'
                },
                {
                    category: '재판부',
                    title: '이테크건설 주식 투자 논란',
                    description: '재판관 임명 전 이테크건설 주식 투자 논란이 있었으나 검찰 조사 결과 무혐의 처리되었다.',
                    impact: '→ 무혐의 처리, 공정성 논란 일단락'
                }
            ]
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 60,
            courtScore: 65,
            overallScore: 63,
            summary: '국가보안법 위헌 소수의견, 군형법 위헌 소수의견 등 소수자 인권 보호를 위한 독자적 법해석을 제시했다.',
            issues: [
                {
                    category: '재판부',
                    title: '독자적 법해석 소수의견 제시',
                    description: '국가보안법 제7조 위헌 소수의견, 군형법 92조의6 위헌 소수의견 등 소수자 인권 보호를 위한 독자적 법해석을 지속적으로 제시했다.',
                    impact: '→ 인권 보호 측면에서 긍정적 평가'
                }
            ]
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 65,
            courtScore: 72,
            overallScore: 70,
            summary: '긴급조치 위헌에 일관된 입장을 유지하며 국가배상을 인정하는 등 과거사 피해자 권리 구제에 기여했다.',
            issues: [
                {
                    category: '재판부',
                    title: '긴급조치 위헌 일관된 입장',
                    description: '서울고법 재직 시 긴급조치 9호 국가배상을 인정하고, 헌법재판관으로서도 긴급조치 위헌에 일관된 입장을 유지했다.',
                    impact: '→ 과거사 피해자 권리 구제 기여'
                }
            ]
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 70,
            courtScore: 75,
            overallScore: 73,
            summary: '이명박 1심 징역 15년 선고, 한덕수 탄핵심판에서 나홀로 인용 소수의견을 제시하는 등 독자적 판단을 보여주었다.',
            issues: [
                {
                    category: '재판부',
                    title: '이명박 1심 엄정 선고',
                    description: '서울중앙지법 부장판사 시절 이명박 전 대통령에게 1심 징역 15년을 선고했다.',
                    impact: '→ 권력형 비리 엄정 처벌 긍정 평가'
                },
                {
                    category: '재판부',
                    title: '한덕수 탄핵 나홀로 인용',
                    description: '한덕수 총리 탄핵심판에서 8명 중 유일하게 인용 의견을 제시했다.',
                    impact: '→ 독자적 판단, 소수의견으로 기록'
                }
            ]
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 40,
            courtScore: 35,
            overallScore: 37,
            summary: '윤석열 대통령이 임명한 재판관으로서, 탄핵심판에서 내란죄 성립 필요를 주장하는 소수의견을 제시하여 임명권자 편향 논란이 있다.',
            issues: [
                {
                    category: '재판부',
                    title: '탄핵 소수의견 (임명권자 편향 논란)',
                    description: '윤석열 대통령이 임명한 재판관으로서 탄핵심판에서 "내란죄 성립이 인정되어야만 파면 사유가 된다"는 소수의견을 제시했다.',
                    impact: '→ 임명권자 편향 논란 지속'
                },
                {
                    category: '재판부',
                    title: '한덕수 탄핵 기각 의견',
                    description: '한덕수 총리 탄핵심판에서 기각 의견을 제시했다.',
                    impact: '→ 행정부 편향 논란'
                }
            ]
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 38,
            courtScore: 33,
            overallScore: 35,
            summary: '국민의힘 추천 재판관으로서 정형식 재판관과 동일한 탄핵 소수의견을 제시하여 여당 추천 편향 논란이 있다.',
            issues: [
                {
                    category: '재판부',
                    title: '탄핵 소수의견 (여당 추천 편향 논란)',
                    description: '국민의힘 추천 재판관으로서 정형식 재판관과 동일하게 탄핵 소수의견을 제시했다.',
                    impact: '→ 여당 추천 편향 논란'
                },
                {
                    category: '재판부',
                    title: '한덕수 탄핵 기각',
                    description: '한덕수 총리 탄핵심판에서 기각 의견을 제시했다.',
                    impact: '→ 여당 추천 재판관 입장 일관'
                }
            ]
        }
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
        cases: [],
        justiceEvaluation: {
            prosecutionScore: 60,
            courtScore: 65,
            overallScore: 63,
            summary: '이재명 대통령 지명 헌법재판소장으로서 전 대법관 경력을 바탕으로 취임했으나, 신임이라 평가 데이터가 제한적이다.',
            issues: [
                {
                    category: '재판부',
                    title: '신임 재판소장',
                    description: '전 대법관 경력을 바탕으로 헌법재판소장으로 취임했으나, 신임으로서 평가 데이터가 제한적이다.',
                    impact: '→ 향후 판결에 따라 재평가 필요'
                }
            ]
        }
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
        cases: [],
        justiceEvaluation: {
            prosecutionScore: 55,
            courtScore: 55,
            overallScore: 55,
            summary: '이재명 대통령 임명 신임 재판관으로서 평가 데이터가 부족하다.',
            issues: []
        }
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
        cases: [],
        justiceEvaluation: {
            prosecutionScore: 55,
            courtScore: 55,
            overallScore: 55,
            summary: '야당 추천 신임 재판관으로서 평가 데이터가 부족하다.',
            issues: []
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 42,
            courtScore: 38,
            overallScore: 40,
            summary: '조희대 대법원장은 윤석열 대통령 지명으로 임명되어 사법부 독립성에 대한 우려가 제기된다. 이재명 공직선거법 파기환송 등 정치적으로 민감한 사건에서 논란이 있었으며, 은별이 사건 무죄 확정 등 과거 판결에서도 비판을 받았다.',
            issues: [
                {
                    category: '재판부',
                    title: '사법부 독립성 우려',
                    description: '윤석열 대통령 지명으로 임명된 대법원장으로서, 내란 사건 관련 재판부 배치와 사법행정에 대한 독립성 의문이 제기되고 있다.',
                    impact: '→ 사법부 신뢰도 저하 우려'
                },
                {
                    category: '재판부',
                    title: '은별이 사건 무죄 확정',
                    description: '15세 여중생 성폭력 사건에서 무죄 확정 주심을 맡아 사회적 비판을 받았다. 피해자 보호보다 엄격한 증거법칙을 우선한 판단으로 논란.',
                    impact: '→ 성범죄 피해자 보호에 대한 사법부 인식 비판'
                }
            ]
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 58,
            courtScore: 60,
            overallScore: 59,
            summary: '이재명 공직선거법 위반 파기환송 전원합의체에 참여했으나, 특별히 논란이 된 개별 판결은 적다.',
            issues: [
                {
                    category: '재판부',
                    title: '이재명 공직선거법 파기환송 참여',
                    description: '전원합의체에서 이재명 공직선거법 위반 파기환송에 참여했다.',
                    impact: '→ 정치적 중립성 논란'
                }
            ]
        }
    },
    {
        id: 'lee-heunggu',
        name: '이흥구',
        category: '내란전담재판부(상고심)',
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
            { text: '윤석열 전 대통령 체포방해 상고심 재판장 (대법원 3부). 2026.7.9 특검·윤석열 양측 상고 기각으로 징역 7년 확정 — 윤석열의 12·3 비상계엄 관련 첫 대법원 판단(주심 이숙연). 오석준 대법관 회피로 3인(이흥구·이숙연·노경필) 선고, 10개 혐의 중 8개 유죄', source: { name: '파이낸셜뉴스', url: 'https://www.fnnews.com/news/202607090610347011' } },
            { text: '이재명 공직선거법 위반 반대의견 (2025.05, 10:2 중 반대)', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202505021641001' } },
            { text: '정치적 표현의 자유 확장 주장', source: null }
        ],
        justiceEvaluation: {
            prosecutionScore: 65,
            courtScore: 68,
            overallScore: 67,
            summary: '문재인 정부(김명수 대법원장 제청)가 임명한 대법관. 이재명 공직선거법 파기환송에서 10:2 반대의견을 제시하며 정치적 표현의 자유 확장을 주장했다. 2026.7.9에는 윤석열 체포방해 상고심(대법원 3부) 재판장으로서 주심 이숙연 대법관과 함께 양측 상고를 기각하고 징역 7년을 확정 — 윤석열의 12·3 비상계엄 관련 첫 대법원 판단을 이끌었다.',
            issues: [
                {
                    category: '재판부',
                    title: '윤석열 체포방해 상고심 재판장 — 징역 7년 확정 (2026.7.9)',
                    description: '대법원 3부 재판장으로서 주심 이숙연 대법관과 함께 윤석열 체포방해 사건의 특검·윤석열 양측 상고를 모두 기각하고 원심 징역 7년을 확정. 공수처 수사의 적법성, 대통령 재직 중 피의자 수사 허용, 압수수색 거부에 정당한 사유 필요 등을 인정하고 10개 혐의 중 8개 유죄를 확정. 계엄 583일 만의 윤석열 관련 첫 대법원 판단.',
                    impact: '→ 윤석열 관련 첫 대법원 판단 확정, 내란 본안 상고심 선례'
                },
                {
                    category: '재판부',
                    title: '이재명 공직선거법 반대의견',
                    description: '전원합의체에서 10:2 반대의견을 제시하며 정치적 표현의 자유 확장을 주장했다.',
                    impact: '→ 소수의견으로 독자적 법해석 제시'
                }
            ]
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 50,
            courtScore: 45,
            overallScore: 47,
            summary: '성범죄 피해자 진술 증명력 제한 판결로 비판을 받았으며, 피해자 보호 관점에서 우려가 제기된다.',
            issues: [
                {
                    category: '재판부',
                    title: '성범죄 피해자 진술 증명력 제한',
                    description: '성범죄 피해자 진술의 증명력을 제한하는 판결(천대엽 판결)을 내려 피해자 보호 관점에서 비판을 받았다.',
                    impact: '→ 성범죄 피해자 보호 후퇴 논란'
                }
            ]
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 65,
            courtScore: 68,
            overallScore: 67,
            summary: '이재명 공직선거법 파기환송에서 41페이지 반대의견을 제시하며 정치적 표현의 자유에 대한 상세한 법리를 전개했다.',
            issues: [
                {
                    category: '재판부',
                    title: '이재명 공직선거법 41페이지 반대의견',
                    description: '전원합의체에서 10:2 반대의견 중 41페이지에 달하는 상세한 법리를 전개하며 정치적 표현의 자유를 주장했다.',
                    impact: '→ 충실한 법리 분석으로 사법부 다양성 기여'
                }
            ]
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 55,
            courtScore: 55,
            overallScore: 55,
            summary: '이재명 공직선거법 파기환송 전원합의체에 참여했으나, 특별히 두드러진 개별 판결이 적어 평가 데이터가 제한적이다.',
            issues: []
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 60,
            courtScore: 62,
            overallScore: 61,
            summary: '세월호 선장 살인죄 인정 판결에 관여하는 등 중대 사건에서 엄정한 자세를 보였다.',
            issues: [
                {
                    category: '재판부',
                    title: '세월호 선장 살인죄 인정',
                    description: '광주고법 시절 세월호 선장에 대해 살인죄를 인정하는 판결에 관여했다.',
                    impact: '→ 중대 범죄에 대한 엄정한 사법 판단'
                }
            ]
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 50,
            courtScore: 52,
            overallScore: 51,
            summary: '동성 동반자 건강보험 피부양자 불인정 판결과 취임 전 로펌 고액 의견서 논란이 있다.',
            issues: [
                {
                    category: '재판부',
                    title: '동성 동반자 건강보험 불인정',
                    description: '동성 동반자의 건강보험 피부양자 자격을 불인정하는 판결을 내려 소수자 인권 보호 관점에서 비판을 받았다.',
                    impact: '→ 소수자 권리 보호 후퇴 논란'
                },
                {
                    category: '검찰',
                    title: '로펌 고액 의견서 논란',
                    description: '대법관 취임 전 로펌에서 18억원 상당의 고액 의견서를 작성한 이력이 논란이 되었다.',
                    impact: '→ 사법부 독립성에 대한 우려'
                }
            ]
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 48,
            courtScore: 50,
            overallScore: 49,
            summary: '조국 입시비리 징역 2년 확정 주심으로 정치적으로 민감한 사건을 담당했다.',
            issues: [
                {
                    category: '재판부',
                    title: '조국 입시비리 확정 주심',
                    description: '조국 전 법무부 장관의 입시비리 사건에서 징역 2년 확정 판결의 주심을 맡았다.',
                    impact: '→ 정치적 사건 담당에 따른 중립성 논란'
                }
            ]
        }
    },
    {
        id: 'shin-sukhee',
        name: '신숙희',
        category: '대법원',
        court: '대법원',
        position: '대법관 (대법원 1부)',
        appointedBy: '대법원장 (조희대) 제청, 대통령 (윤석열) 임명 (2024.02.29, 안철상·민유숙 전 대법관 후임)',
        photo: '/신숙희.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '대법관 (2024.02~현재, 대법원 1부)',
            '대법원 양형위원회 상임위원 (고법판사)',
            '대전고등법원 부장판사',
            '사법연수원 제27기 수료'
        ],
        cases: [
            { text: '이종호 전 블랙펄인베스트 대표 "김건희 여사 통한 형량 청탁" 변호사법 위반 상고심 주심 배당 (2026.05 대법원 1부). 도이치모터스 1차 주포 이정필로부터 "김건희 여사나 VIP에게 얘기해서 집행유예로 나오게 해주겠다"며 23차례 8390만원 수수. 1심(2026.02.13) 징역 1년 6개월·추징 7910만원 → 2심(2026.04.15-16 서울고법 형사3부 이승한 부장판사) 징역 1년 2개월·추징 7110만원으로 4개월 감형. 김예성·윤영호 등 일부 혐의는 "도이치 사건과 직접 관련성 없음"을 이유로 민중기 특검 수사 범위 일탈로 공소기각', source: { name: '언론 방송 자막 (사용자 제공)', url: null } },
            { text: '이재명 더불어민주당 대표 공직선거법 위반 파기환송 전원합의체 참여 (2025.05) - 다수의견(10:2)에 동참하고 "지연된 정의는 정의가 아니다"라는 보충의견으로 공직선거법 재판의 신속 심리 중요성을 적극 강조. 4월 22일 2부 배당 후 2시간 만에 전원합의체 회부, 9일 만에 선고된 초고속 심리에 적극 동조한 인물로 평가', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202505030900041' } },
            { text: '대법관 임명 (2024.02.29) - 조희대 대법원장 제청, 윤석열 전 대통령 임명. 안철상·민유숙 전 대법관 후임. 대법원 양형위원회 상임위원(고법판사) 출신', source: { name: '법률신문', url: 'https://www.lawtimes.co.kr/news/195633' } }
        ],
        justiceEvaluation: {
            prosecutionScore: 40,
            courtScore: 35,
            overallScore: 37,
            summary: '조희대 대법원장 제청으로 윤석열 전 대통령이 2024년 2월 임명한 대법관. 이재명 공직선거법 파기환송 전원합의체에서 다수의견에 동참하고 "지연된 정의는 정의가 아니다" 보충의견까지 적극 제시한 인물이, 2026.05 김건희 여사 최측근 이종호의 "김건희 통한 형량 청탁" 변호사법 위반 상고심 주심(대법원 1부)으로 배당받았다. 이재명 사건에서 "신속 심리"를 강조한 잣대가 김건희 측근 사건에서도 동일하게 적용될지가 사법 일관성의 시금석. 박영재(김건희 본인 상고심 주심)·이숙연(윤석열 체포방해 상고심 주심)·신숙희(이종호 상고심 주심) 모두 조희대 제청·윤석열 임명 + 이재명 파기환송 동참자라는 공통점이 사건 배당의 정치적 편중 의혹을 키운다.',
            issues: [
                {
                    category: '재판부',
                    title: '김건희 측근 형량 청탁 사건 주심 - 이재명 "신속 심리" 보충의견과의 이중 잣대 우려',
                    description: '신숙희 대법관은 2025.05 이재명 공직선거법 파기환송 전원합의체에서 "지연된 정의는 정의가 아니다"라며 신속 심리를 강조하는 보충의견을 적극 제시했다. 2026.05 대법원 1부에 배당된 이종호 변호사법 위반 상고심(김건희 여사 통한 형량 청탁 명목 8390만원 수수)에서 주심을 맡은 만큼, 이재명 사건과 동일한 "신속 심리" 기준이 김건희 측근 사건에도 적용될지 사법 일관성이 시험대에 오른다.',
                    impact: '→ 동일 잣대 적용 여부가 신숙희 대법관 개인 평판과 대법원 신뢰의 분수령'
                },
                {
                    category: '재판부',
                    title: '"조희대 라인 + 이재명 파기환송 동참자"에 정치사건 배당 집중 패턴',
                    description: '이재명 공직선거법 파기환송 다수의견(10:2)에 동참한 대법관 중 박영재(김건희 본인 도이치·통일교 상고심 주심, 대법원 2부)·이숙연(윤석열 체포방해 상고심 주심, 대법원 3부)·신숙희(이종호 형량청탁 상고심 주심, 대법원 1부)가 김건희·윤석열·김건희 측근 사건을 각각 주심으로 분담받는 양상. 모두 조희대 대법원장 제청+윤석열 임명이라는 공통 배경을 갖는다는 점에서 정치적으로 가장 첨예한 사건들이 특정 대법관 그룹에 수렴되는 사건 배당의 외관적 편중성이 논란.',
                    impact: '→ 무작위 배당 원칙의 외관적 훼손, 사건 배당 시스템의 투명성 의문'
                },
                {
                    category: '재판부',
                    title: '항소심 공소기각 처리의 대법원 판단 - 특검 수사범위 한계 선례',
                    description: '항소심(서울고법 형사3부)은 이종호의 일부 혐의(김예성·윤영호 관련 등)에 대해 "도이치모터스 사건과 직접 관련성 없음"을 이유로 민중기 특검 수사 범위를 벗어났다며 공소기각 판결. 대법원이 이 공소기각을 유지할지, 또는 특검의 수사 범위를 더 넓게 인정할지가 향후 김건희 본인 상고심 및 다른 특검 사건들에 대한 선례로 작용. 신숙희 주심의 판단이 김건희·통일교·명태균 등 광범위 특검 사건 처리에 연쇄 영향.',
                    impact: '→ 김건희 본인 상고심(박영재 주심) 결과에 선행 판단의 무게'
                },
                {
                    category: '검찰',
                    title: '특검 수사범위 일탈 지적 - 1·2심 공소유지 정합성 문제',
                    description: '항소심이 일부 혐의를 공소기각한 것은 민중기 특검팀이 도이치 사건과 직접 관련성이 약한 개인 형사사건 무마 명목 금품수수까지 기소했다는 점을 법원이 지적한 결과. 특검의 수사 범위 설계와 공소사실 정리에 정합성 부족이 노출됐으며, 대법원이 이를 그대로 유지할 경우 특검 사건들의 일부 공소 유지에 전반적 제동이 걸릴 우려.',
                    impact: '→ 특검 기소 전반의 수사 범위 설계 재검토 필요성'
                }
            ]
        }
    },
    {
        id: 'noh-kyungpil',
        name: '노경필',
        category: '내란전담재판부(상고심)',
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
        ],
        justiceEvaluation: {
            prosecutionScore: 55,
            courtScore: 55,
            overallScore: 55,
            summary: '이재명 공직선거법 파기환송 전원합의체에 참여했으나 평가 데이터가 제한적이다.',
            issues: []
        }
    },
    {
        id: 'park-youngjae',
        name: '박영재',
        category: '대법원',
        court: '대법원',
        position: '대법관 (대법원 2부 · 법원행정처장)',
        appointedBy: '대법원장 (조희대) 제청, 대통령 (윤석열) 임명',
        photo: '/박영재.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '법원행정처장 (2026.01.13~현재, 천대엽 후임, 조희대 대법원장 임명)',
            '대법관 (2024.08~현재, 대법원 2부)',
            '법원행정처 차장',
            '서울고등법원 부장판사',
            '법원행정처 기획조정실장',
            '부산고등법원 부장판사',
            '서울중앙지방법원 부장판사',
            '법원행정처 기획총괄심의관',
            '사법연수원 교수',
            '법원행정처 인사담당관',
            '서울지방법원 판사 (1996년 임관)',
            '사법연수원 제22기 수료'
        ],
        cases: [
            { text: '김건희 도이치모터스 주가조작·통일교 금품수수·명태균 여론조사 등 상고심 주심 (2026.05.26 대법원 2부 배당, 오경미·권영준·엄상필·박영재 대법관 심리). 1심(2026.01) 알선수재 일부만 유죄로 징역 1년 8개월 → 2심(2026.04.28 서울고법) 도이치 주가조작 일부·통일교 샤넬가방 등 추가 유죄로 징역 4년·벌금 5천만원·추징금 8억1천만원(2년 4개월 가중). 특검 "법리오해" 상고, 김건희 측도 상고하여 대법원 심리 본격화. 임명자(윤석열)의 배우자 사건을 임명자의 대법원장(조희대) 추천 대법관이 주심을 맡는 이해상충 구조', source: { name: '뉴스핌', url: 'https://www.newspim.com/news/view/20260526000215' } },
            { text: '법원행정처장 임명 (2026.01.13) - 조희대 대법원장이 천대엽 전 처장 후임으로 임명. 이재명 공직선거법 파기환송 주심을 맡은 직후 행정처장에 발탁된 인사로, "정치적 판결 보상" 논란 제기', source: { name: '뉴스1', url: 'https://www.news1.kr/society/court-prosecution/6037271' } },
            { text: '이재명 공직선거법 위반 파기환송 (2025.05, 대법원 전원합의체 주심)', source: null }
        ],
        justiceEvaluation: {
            prosecutionScore: 40,
            courtScore: 35,
            overallScore: 37,
            summary: '조희대 대법원장 제청으로 윤석열 전 대통령이 2024년 8월 임명한 대법관으로, 이재명 공직선거법 파기환송 주심을 맡은 직후 2026.01 법원행정처장에 발탁됐고, 같은 해 5월 임명자 배우자인 김건희의 도이치 주가조작·통일교 금품수수·명태균 여론조사 상고심 주심까지 배정받았다. 임명자(윤석열)→대법원장(조희대)→피고인 배우자(김건희) 사건이 한 대법관에게 수렴하는 구조적 이해상충이 사법 신뢰의 근본을 흔드는 사례로 지목된다.',
            issues: [
                {
                    category: '재판부',
                    title: '임명자 부부 사건 주심 - 회피 의무 의문',
                    description: '박영재 대법관은 윤석열 전 대통령이 임명(2024.08, 조희대 대법원장 제청)했고, 2026.05.26 대법원 2부에 배당된 김건희의 도이치모터스 주가조작·통일교 금품수수·명태균 여론조사 등 상고심 주심을 맡았다. 임명권자의 배우자 사건을 임명권자의 대법원장이 제청한 대법관이 주심으로 처리하는 것은 법관 윤리에 비추어 회피 사유에 해당할 가능성이 큰 사안으로, 사법의 외관적 공정성을 심각하게 훼손한다.',
                    impact: '→ 회피 미신청 시 결론과 무관하게 사법 신뢰 손상'
                },
                {
                    category: '재판부',
                    title: '이재명 파기환송 주심 직후 법원행정처장 발탁 패턴',
                    description: '이재명 더불어민주당 대표의 공직선거법 위반 사건 파기환송 주심(2025.05)을 맡은 직후, 2026.01.13 조희대 대법원장이 천대엽 후임 법원행정처장에 박영재 대법관을 임명. 정치적으로 첨예한 사건의 주심을 맡은 직후 사법행정 최고 보직에 발탁되는 동선은 "정치적 판결에 대한 보상 인사" 의혹을 키운다.',
                    impact: '→ 사법행정 인사의 정치적 독립성 의문'
                },
                {
                    category: '재판부',
                    title: '조희대 라인 정치사건 집중 - 윤석열·이재명·김건희 한 손에',
                    description: '조희대 대법원장 제청으로 임명된 박영재 대법관은 이재명 공직선거법 파기환송 주심, 김건희 도이치·금품수수 상고심 주심, 그리고 윤석열이 임명한 인물이라는 점에서 12·3 비상계엄 이후 정치적으로 가장 첨예한 사건들을 한 인물이 집중 처리하는 구조에 놓여 있다. 사법행정 권한(법원행정처장)까지 함께 보유하여 권한 집중도가 높음.',
                    impact: '→ 단일 인물에게 다중 정치사건 + 사법행정권 집중으로 견제 메커니즘 약화'
                },
                {
                    category: '검찰',
                    title: '김건희 1·2심 형량 격차 - 공소유지 일관성 의문',
                    description: '1심(2026.01)은 알선수재 일부만 유죄로 1년 8개월에 그쳤으나, 2심(2026.04.28)은 도이치 주가조작 가담·통일교 샤넬가방 수수 등을 추가 유죄로 인정해 징역 4년·벌금 5천만원으로 2년 4개월을 가중. 1심 단계의 공소사실 정리·증거 제출에 미흡함이 있었음을 시사하며, 상고심에서 2심 인정 부분이 다시 뒤집힐 경우 공소유지 실패가 확정될 위험.',
                    impact: '→ 대법원 심리 결과에 따라 공소유지 평가 좌우'
                }
            ]
        }
    },
    {
        id: 'lee-sukyeon',
        name: '이숙연',
        category: '내란전담재판부(상고심)',
        court: '대법원',
        position: '대법관 (대법원 3부)',
        appointedBy: '대법원장 (조희대) 제청, 대통령 (윤석열) 임명',
        photo: '/이숙연.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '대법관 (2024.08~현재, 대법원 3부)',
            '서울고등법원 부장판사',
            '사법연수원 제26기 수료'
        ],
        cases: [
            { text: '윤석열 전 대통령 공수처 체포방해(특수공무집행방해·직권남용권리행사방해) 상고심 주심 (대법원 3부, 재판장 이흥구·주심 이숙연). 윤석열의 12·3 비상계엄 관련 첫 대법원 판단 → 2026.7.9 상고기각으로 징역 7년 확정(1심 5년→2심 7년). 오석준 대법관 회피로 3인(이흥구·이숙연·노경필) 선고, 10개 혐의 중 8개 유죄', source: { name: '파이낸셜뉴스', url: 'https://www.fnnews.com/news/202607091515002040' } },
            { text: '이재명 더불어민주당 대표 공직선거법 위반 사건 파기환송 주심 (2025.05, 대법원 전원합의체) - 정치적 사건 주심 배당으로 중립성 논란', source: null },
            { text: '인사청문회 재산·자녀 논란 (2024.07) - 본인 46억+배우자 117억 = 총 170억 재산 신고. 배우자·장녀 보유 비상장주식 37억2480만원에 대해 "쪼개기 증여", 20대 장녀가 아버지 자금으로 산 비상장주식을 되팔아 약 64배 시세차익을 거둔 "아빠 찬스" 논란이 일며 임명 보류. 가족이 비상장주식 37억을 사회복지공동모금회·청소년행복재단에 기부한 뒤 2024.08 취임', source: { name: 'SBS', url: 'https://news.sbs.co.kr/news/endPage.do?news_id=N1007739488' } }
        ],
        justiceEvaluation: {
            prosecutionScore: 40,
            courtScore: 38,
            overallScore: 39,
            summary: '조희대 대법원장 제청으로 윤석열 전 대통령이 2024년 8월 임명한 대법관. 인사청문회 단계에서 가족 재산 170억, 비상장주식 37억 "쪼개기 증여"·"아빠 찬스"(딸 64배 시세차익) 논란으로 임명이 보류됐다가 가족 기부 후 취임. 임명 이후 이재명 공직선거법 파기환송 주심(2025.05)에 이어 임명자인 윤석열의 12·3 비상계엄 관련 첫 상고심(체포방해 사건, 2026.05.20)의 주심까지 배정받아 정치적으로 가장 민감한 사건이 한 인물에게 집중되는 구조에 놓였다.',
            issues: [
                {
                    category: '재판부',
                    title: '임명자(윤석열) 형사사건 주심 - 회피 의무 의문',
                    description: '이숙연 대법관은 윤석열 전 대통령이 임명(2024.08, 조희대 대법원장 제청)했고, 2026.05.20 대법원 3부에 배당된 윤석열의 공수처 체포방해(특수공무집행방해·직권남용권리행사방해) 상고심 주심을 맡았다. 임명권자의 형사사건을 임명권자의 대법원장이 제청한 대법관이 주심으로 처리하는 것은 사법의 외관적 공정성에 정면으로 위배되며, 회피 신청이 없을 경우 결론과 무관하게 사법 신뢰가 훼손된다. 윤석열의 12·3 비상계엄 관련 첫 대법원 심리라는 점에서 향후 본 내란 재판 상고심 결론에 대한 선례적 영향력이 큼.',
                    impact: '→ 12·3 비상계엄 관련 첫 대법 판단의 외관적 공정성 위협'
                },
                {
                    category: '재판부',
                    title: '정치사건 다중 주심 패턴 - 이재명·윤석열 양측 핵심사건',
                    description: '대법관 취임(2024.08) 이후 단기간에 이재명 더불어민주당 대표 공직선거법 위반 파기환송 주심(2025.05)과 윤석열 전 대통령 체포방해 상고심 주심(2026.05.20)을 연이어 배당받음. 정치적으로 가장 첨예한 양측 사건이 한 대법관에게 수렴하는 것은 사건 배당의 무작위성·중립성에 의문을 제기.',
                    impact: '→ 단일 대법관에 양측 정치사건 집중 - 사건 배당 시스템에 대한 신뢰 손상'
                },
                {
                    category: '재판부',
                    title: '인사청문회 가족 재산 논란 - "아빠 찬스" 시세차익 64배',
                    description: '2024.07 인사청문회에서 본인 46억·배우자 117억 등 총 170억 재산 신고. 특히 20대 장녀가 아버지(조형섭 변호사)의 자금으로 산 비상장주식을 되팔아 약 64배에 이르는 시세차익을 거둔 사실이 드러나며 "쪼개기 증여", "아빠 찬스" 논란이 일어 임명이 한 차례 보류됨. 배우자·장녀가 보유한 비상장주식 37억2480만원을 사회복지공동모금회·청소년행복재단에 기부한 뒤에야 2024.08 취임. 일반 시민의 법감정과 동떨어진 자산 형성 이력이 사법 신뢰에 부담.',
                    impact: '→ 임명 단계의 도덕성 논란이 정치사건 주심 배당 시점에 재부각'
                },
                {
                    category: '재판부',
                    title: '체포방해 상고기각·징역 7년 확정 (2026.7.9) — 임명자 사건에서 유죄 확정',
                    description: '윤석열 체포방해 사건(1심 5년→2심 7년)에 대해 대법원 3부(재판장 이흥구·주심 이숙연)는 2026.7.9 특검·윤석열 양측 상고를 모두 기각하고 징역 7년을 확정. 공수처 체포방해·국무위원 심의권 침해·허위 사후 계엄선포문 작성·외신 허위공보 등 10개 혐의 중 8개 유죄. 대법원은 "공수처 수사는 적법", "대통령이 피의자인 사건은 재직 중에도 수사 허용", "압수수색 거부에는 정당한 사유 필요"라고 판시. 임명권자(윤석열)의 형사사건 주심을 맡은 우려에도 원심 유죄를 확정한 판단으로, 본안 내란 사건(1심 무기징역, 항소심 진행) 상고심의 선례가 될 전망.',
                    impact: '→ 윤석열 관련 첫 대법원 판단, 본안 내란 상고심에 선례적 영향'
                }
            ]
        }
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
        cases: [],
        justiceEvaluation: {
            prosecutionScore: 55,
            courtScore: 55,
            overallScore: 55,
            summary: '한덕수 권한대행 시기 임명된 신임 대법관으로서 평가 데이터가 부족하다.',
            issues: []
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 38,
            courtScore: 35,
            overallScore: 36,
            summary: '조희대 대법원장 추천 재판관으로서 탄핵 소수의견을 제시하고, 한덕수 탄핵에서도 위헌/위법 없음 의견을 제시했다.',
            issues: [
                {
                    category: '재판부',
                    title: '탄핵 소수의견 (임명 배경 논란)',
                    description: '조희대 대법원장 추천 재판관으로서 탄핵심판에서 소수의견을 제시했다.',
                    impact: '→ 임명 배경 편향 논란'
                },
                {
                    category: '재판부',
                    title: '한덕수 탄핵 위헌/위법 없음 의견',
                    description: '한덕수 총리 탄핵심판에서 위헌·위법 행위가 없다는 의견을 제시했다.',
                    impact: '→ 행정부 편향 논란 지속'
                }
            ]
        }
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
            { text: '윤석열 구속취소 결정 — 자의적 법해석 논란 (2025.03): 1954년 형사소송법 제정 이후 71년간 법원·검찰이 일관 적용해 온 \'날짜\' 단위 구속기간 계산을, 윤석열 사건에서만 \'시간\' 단위로 바꿔 해석해 구속을 취소. 정작 지귀연 본인이 집필에 참여한 형사소송법 해설서에는 "구속기간 계산은 시간이 아닌 일(日)로 한다"고 명시돼 있어 자기 저술과 정면 배치', source: { name: '한겨레(단독)', url: 'https://news.nate.com/view/20250311n01412' } },
            { text: '내란 재판 비공개 진행 논란 (2025.04) - 전직 대통령 재판 최초 비공개, 시민단체 공수처 고발', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202504131649001' } }
        ],
        justiceEvaluation: {
            prosecutionScore: 45,
            courtScore: 33,
            overallScore: 38,
            summary: '내란수괴 법정형(사형·무기징역·무기금고)의 제약 하에서 무기징역 선고는 법리적으로 타당하나, 외환유치죄 미기소와 노상원 수첩 증거 관리 부실은 수사의 완결성에 심각한 의문을 제기한다. 무엇보다 지귀연 재판장은 71년간 확립된 구속기간 계산 관례는 물론 본인이 집필한 형사소송법 해설서의 입장("일(日) 단위 계산")마저 뒤집어, 윤석열 사건에서만 \'시간\' 단위로 계산해 구속을 취소한 전력이 있다. 법 문언·확립된 관례·자신의 저술과 모두 배치되는 자의적(恣意的) 법해석이라는 비판이 핵심으로, 여기에 수첩 증거 전면 배척·재판 비공개·재판장 편향 논란이 더해져 사법 중립성에 대한 의문이 항소심의 쟁점이 될 전망이다.',
            issues: [
                {
                    category: '검찰',
                    title: '외환유치죄(형법 93조) 미기소',
                    description: '2024.10~11 드론작전사령부의 북한 드론 5차례 침투에 대해 현역 장교가 "V(윤석열)가 작전 승인반복 지시"라고 증언했으나, 1차 특검에서 외환유치죄 기소 누락.',
                    impact: '→ 외환유치죄 성립 시 사형·무기징역까지 가능한 추가 중형 미반영'
                },
                {
                    category: '검찰',
                    title: '노상원 수첩 증거 관리 부실',
                    description: '핵심 증거인 노상원 지필 수첩의 작성 시기·보관 상태에 대한 검찰의 소명이 불충분하여 1심에서 증거능력 배척.',
                    impact: '→ 2023.10부터의 계획적 내란 준비 입증 실패 → 계획성 가중 미적용'
                },
                {
                    category: '검찰',
                    title: '내란목적살인예비 입증 실패',
                    description: '국회 내 시민 부상 등 물리적 충돌이 있었으나 살인예비 혐의 입증에 미달.',
                    impact: '→ 사형 논거 약화'
                },
                {
                    category: '재판부',
                    title: '노상원 수첩 증거능력 전면 배척',
                    description: '지귀연 부장판사가 수첩의 작성 시기 불명확, 내용 불일치, 형태 조약 등을 이유로 증거능력 전면 배척. 계획성 입증의 핵심 증거 탈락.',
                    impact: '→ 즉흥적 계엄 판단 → 계획성 가중 미적용'
                },
                {
                    category: '재판부',
                    title: '자의적 법해석 — 71년 관례·본인 저서와 배치되는 구속기간 계산',
                    description: '1954년 형사소송법 제정 이후 71년간 법원·검찰이 일관 적용한 \'날짜\' 단위 구속기간 계산을, 지귀연 부장판사는 유독 윤석열 사건에서만 \'시간\' 단위로 바꿔 해석해 구속을 취소했다. 정작 본인이 집필에 참여한 형사소송법 해설서에는 "구속기간 계산은 시간이 아닌 일(日)로 한다"고 적혀 있어, 확립된 관례뿐 아니라 자신의 저술과도 정면 배치되는 자의적 해석이라는 비판을 받는다. 문형배 전 헌법재판소장 권한대행도 "여태까지 날짜로 계산했는데 왜 그 사건만 시간으로 계산하는가, 누가 봐도 의심할 수밖에 없는 사건"이라고 지적했다.',
                    impact: '→ 법 문언·71년 관례·본인 저술과 배치되는 자의적 해석 → 사법 중립성의 근본 훼손'
                },
                {
                    category: '재판부',
                    title: '재판장 편향 논란',
                    description: '지귀연 부장판사는 구속심사 단계부터 편향 논란이 있었으며, 1심 선고 후 북부지법으로 전보 인사.',
                    impact: '→ 사법부 독립성·공정성에 대한 의문 제기'
                }
            ]
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 35,
            courtScore: 20,
            overallScore: 25,
            summary: '검찰은 공소장 설계 단계에서 대법원 포괄일죄 판례를 반영하지 못해 핵심 혐의의 공소시효 도과를 자초했고, 뇌물죄 확장에도 실패했다. 재판부는 대법원 판례에 정면 위배되는 판결을 내렸으며, 구형 대비 1/9이라는 극단적 양형 괴리는 사법 정의에 대한 심각한 의문을 제기한다. 우인성 판사의 과거 판결이 다수 2심에서 뒤집힌 이력은 판결의 안정성에 대한 우려를 더한다.',
            issues: [
                {
                    category: '검찰',
                    title: '도이치모터스 포괄일죄 법리 미적용',
                    description: '대법원은 동종 사건(권오수·이종호)에서 여러 시세 조종 행위를 포괄일죄로 인정했으나, 특검의 공소장은 각 행위를 분리 기재. 재판부가 별개 범죄로 판단하여 2건은 공소시효 도과.',
                    impact: '→ 핵심 혐의 무죄 → 구형 15년의 1/9인 1년8개월만 선고'
                },
                {
                    category: '검찰',
                    title: '정치자금법 뇌물죄 확장 실패',
                    description: '명태균 무상 여론조사를 정치자금법 위반으로만 기소. 뇌물죄로 확장했다면 윤석열과의 공동 혐의 연결이 가능했으나 불발. 검찰 내부에서도 "많은 정황이 확인됐음에도 뇌물죄로 기소하지 못했다" 인정.',
                    impact: '→ 윤석열 연루 차단, 정치자금법 전면 무죄 판결'
                },
                {
                    category: '검찰',
                    title: '공소장 설계 부실 — 방조 혐의 미적용',
                    description: '주가조작에서 공동정범 외에 방조 혐의를 별도 적용했다면 다른 결론이 가능했으나, 공소장에 미포함. 법조계에서 "방조 혐의 미적용이 결과를 갈랐다"는 분석.',
                    impact: '→ 유죄 인정 범위 축소, 추가 양형 기회 상실'
                },
                {
                    category: '재판부',
                    title: '대법원 판례 정면 위배 판결',
                    description: '우인성 부장판사가 도이치모터스 주가조작을 3개 범행으로 분리하여 2건 공소시효 도과를 인정한 것은, 동종 사건 대법원 판결(포괄일죄 인정)에 정면 위배. 특검도 "대법원 판결에 위배되는 판결"이라고 공식 비판.',
                    impact: '→ 도이치모터스 주가조작 전면 무죄'
                },
                {
                    category: '재판부',
                    title: '구형 대비 1/9 양형 괴리',
                    description: '구형 15년 대비 1년8개월은 양형 기준상 통상적 범위(50~70%)를 극단적으로 일탈. 경실련·참여연대 등 시민단체가 "법치 파괴"라고 강력 비판.',
                    impact: '→ 사법부 신뢰도 심각한 훼손'
                },
                {
                    category: '재판부',
                    title: '주가조작 재판 첫 담당 판사 배당',
                    description: '우인성 판사는 주가조작 재판을 처음 담당하는 판사임에도 본 사건에 배당. 과거 판결 다수(이재명 조폭연루설 무죄, 강용석 소년법 무죄 등)가 2심에서 유죄로 뒤집힌 이력.',
                    impact: '→ 전문성 부족 우려, 판결 안정성 의문'
                },
                {
                    category: '재판부',
                    title: '형사소송법 298조 ② 미이행 — 적용법조 변경 요구 불이행',
                    description: '형사소송법 298조 ②는 "법원은 심리의 경과에 비추어 상당하다고 인정할 때에는 공소사실 또는 적용법조의 추가 또는 변경을 요구하여야 한다"고 규정. 우인성 판사는 내란공모·방조범 적용법조 추가를 요구하지 않음. 반면 이진관 판사(형사합의33부)는 동일 조항에 따라 한덕수 사건에서 방조죄→내란중요임무종사로 적용법조 변경을 적극 요구하여 실행.',
                    impact: '→ 방조 혐의 미적용으로 유죄 범위 축소, 이진관 판사와 대조적 법률 의무 불이행'
                }
            ]
        }
    },
    {
        id: 'lee-hyunkyung',
        name: '이현경',
        category: '내란전담재판부',
        court: '서울중앙지방법원',
        position: '형사합의26부 부장판사 (재판장)',
        photo: '/이현경.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울중앙지방법원 형사합의26부 부장판사 / 재판장 (2024~)',
            '의정부지방법원 민사5부 단독 부장판사',
            '청주지방법원 판사',
            '서울중앙지방법원 판사',
            '서울서부지방법원 판사',
            '인천지방법원 판사',
            '창원지방법원 판사 (2003 임관)',
            '사법연수원 32기 수료',
            '제42회 사법시험 합격',
            '이화여자대학교 법학과 졸업',
            '성지여자고등학교 졸업 (경남 통영)'
        ],
        cases: [
            { text: '윤석열 체포방해 경호처 간부 1심 재판장 (2026.7.9) — 박종준 전 처장 징역 4년, 김성훈 전 차장 징역 5년, 이광우 전 경호본부장 징역 2년 6개월(이상 법정구속), 김신 전 가족부장 징역 1년·집행유예 2년. "경호처라는 국가기관의 조직·지휘·체계를 이용해 영장 집행을 장기간 차단한 중대한 범죄"', source: { name: '한국일보', url: 'https://www.hankookilbo.com/news/article/A2026070914350004154' } },
            { text: 'NCT 태일 등 외국인 관광객 집단 성폭행 징역 3년 6개월 (2025.07)', source: null },
            { text: '2003년 창원지법 임관 후 인천·서울서부·서울중앙·청주지법 판사, 의정부지법 부장판사를 거쳐 2024년부터 서울중앙지법 형사합의26부 재판장', source: { name: '나무위키', url: 'https://namu.wiki/w/이현경(법조인)' } }
        ],
        justiceEvaluation: {
            prosecutionScore: 68,
            courtScore: 66,
            overallScore: 67,
            summary: '서울중앙지법 형사합의26부 이현경 부장판사는 2026.7.9 윤석열 체포방해 사건에서 박종준·김성훈·이광우 경호처 3인에게 실형과 법정구속을, 김신에게 집행유예를 선고했다. "경호처라는 국가기관의 조직·지휘·체계를 이용해 법원이 발부한 영장 집행을 장기간 차단한 중대한 범죄"라며 위법한 상부 지시에 대한 복종을 정당한 경호업무로 볼 수 없다고 판단, 영장주의와 법치주의를 정면으로 확인했다. 다만 지휘부(박종준 4년·김성훈 5년) 형량이 구형(각 7년)의 57~71% 수준으로, 국가기관을 동원한 조직적 사법방해의 중대성에 비해 다소 낮다는 평가도 있다.',
            issues: [
                {
                    category: '재판부',
                    title: '경호처 조직 동원 영장집행 방해에 실형·법정구속 — 영장주의 확인',
                    description: '이현경 재판부는 박종준(4년)·김성훈(5년)·이광우(2년 6개월) 3인에게 실형을 선고하고 전원 법정구속했다. "위법한 지시는 거부했어야 한다", "경호처라는 국가기관의 조직·지휘·체계를 이용해 영장 집행을 장기간 차단한 중대한 범죄"라며, 상관의 위법 지시에 대한 맹목적 복종을 정당한 직무수행으로 인정하지 않았다. 법원 영장의 집행을 물리력으로 저지한 행위에 법치주의 원칙을 분명히 한 판단.',
                    impact: '→ 공권력을 이용한 조직적 사법방해에 실형·법정구속, 영장주의·법치주의 확인'
                },
                {
                    category: '재판부',
                    title: '지휘부 형량 구형 대비 57~71% — 사안 중대성 대비 논란 여지',
                    description: '특검은 박종준·김성훈에 각 징역 7년, 이광우 5년, 김신 3년을 구형했으나 선고는 박종준 4년(57%)·김성훈 5년(71%)·이광우 2년 6개월(50%)·김신 집행유예로, 지휘 위계에 따른 차등을 두면서도 대체로 구형의 절반~7할 수준. 국가기관을 동원한 조직적·장기적 사법방해라는 사안의 중대성에 비추어 지휘부 형량이 다소 낮다는 시각과, 초범·가담 정도를 반영한 적정 양형이라는 시각이 병존한다.',
                    impact: '→ 양형 적정성 평가 분화, 항소심 다툼 여지'
                },
                {
                    category: '검찰',
                    title: '내란 특검, 경호처 지휘라인 전원 유죄 견인',
                    description: '내란 특검은 2025.12.4 박종준·김성훈·이광우·김신 등 경호처 지휘라인을 특수공무집행방해·직권남용·범인은닉으로 기소하고, 위법한 상부지시 복종 논리를 배척하는 입증에 주력해 전원 유죄를 이끌었다. 다만 지휘부 구형(7년)이 선고에서 상당폭 감형된 점은 향후 항소심 과제로 남는다.',
                    impact: '→ 경호처 지휘라인 전원 유죄, 지휘부 감형은 항소심 쟁점'
                }
            ]
        }
    },
    {
        id: 'shin-jongoh',
        name: '신종오',
        category: '내란전담재판부(항소심)',
        court: '서울고등법원',
        position: '형사15-2부 부장판사 (재판장)',
        photo: '/신종오.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울고등법원 형사15-2부 부장판사 / 재판장 (2026.02~)',
            '대전고법 청주재판부 고법판사',
            '서울고법 인천재판부 고법판사',
            '서울고법 고법판사 (2010, 2020~2023)',
            '대구고법 고법판사',
            '대법원 재판연구관',
            '서울서부지방법원 판사',
            '울산지방법원 판사',
            '서울지방법원 의정부지원 판사 (2001~)',
            '사법연수원 27기 수료 (1998)',
            '제37회 사법시험 합격 (1995)',
            '서울대학교 법학과 졸업',
            '서울 상문고등학교 졸업'
        ],
        cases: [
            { text: '김건희 항소심 징역 4년 + 벌금 5,000만원 + 추징금 2,094만원 (2026.04.28) — 1심 1년 8개월에서 2.4배 가중', source: { name: '서울신문', url: 'https://www.seoul.co.kr/news/society/2026/04/28/20260428500210' } },
            { text: '도이치모터스 주가조작 — 1심 무죄 → 항소심 일부 유죄 (대법원 포괄일죄 판례 적용)', source: { name: 'MBC', url: 'https://imnews.imbc.com/news/2026/society/article/6818598_36918.html' } },
            { text: '통일교 금품수수 — 1심 일부 유죄 → 항소심 전부 유죄 (그라프 목걸이 6,220만원 상당 몰수)', source: { name: '뉴시스', url: 'https://www.newsis.com/view/NISX20260428_0003610250' } },
            { text: '"철저한 원칙주의" 평가 — 택시기사·노동쟁의·하청 근로자 사건 등에서 1심을 뒤집는 판결 다수', source: { name: '뉴시스', url: 'https://www.newsis.com/view/NISX20260428_0003610250' } },
            { text: '2023년 서울지방변호사회 선정 우수법관', source: { name: '파이낸셜뉴스', url: 'https://www.fnnews.com/news/202604281917153042' } }
        ],
        justiceEvaluation: {
            prosecutionScore: 65,
            courtScore: 60,
            overallScore: 62,
            summary: '서울고법 형사15-2부 신종오 부장판사는 1심(우인성 부장판사)이 정면 위배했던 대법원 포괄일죄 판례를 정확히 적용하여 도이치모터스 주가조작 공소시효 문제를 해소했고, 통일교 금품수수도 알선수재 법리에 따라 전부 유죄로 확대 판단한 점에서 사법 정의 회복의 일면을 보여준다. 그러나 항소심 4년은 특검 구형 15년 대비 27%에 불과하여 양형 기준상 통상 범위(50~70%)에 크게 미달하며, "법의식이 살아있는 나라라면 주가조작만으로도 30~40년형이 가능한 사안"이라는 시민단체·평론가의 비판, "국민 법감정과 매우 동떨어진 판결"이라는 정치권 비판을 받고 있다. 정치자금법 무죄 유지로 윤석열 당선무효 차단 효과가 지속되는 점도 구조적 한계로 지적된다.',
            issues: [
                {
                    category: '재판부',
                    title: '구형 15년 대비 27% — 국민 법감정과 괴리',
                    description: '특검 구형 15년 대비 항소심 4년(약 27%)은 양형기준상 통상 범위(50~70%)에 크게 미달. 정청래 더불어민주당 대표는 "국민 법감정과 매우 동떨어진 판결"이라며 "초범, 나이, 건강 등을 참작했다는데 도저히 납득할 수 없는 결정"이라고 비판. 시민단체·평론가는 "법의식이 살아있는 나라라면 주가조작 범죄만으로도 징역 30~40년 또는 종신형에 처해질 사안"이라며 "철저하게 범죄 기득권층의 입장을 대변한 것"이라고 비평.',
                    impact: '→ 양형의 "절반의 정의" 한계, 사법부에 대한 국민 신뢰 회복 미완'
                },
                {
                    category: '재판부',
                    title: '정치자금법 무죄 유지 — 윤석열 당선무효 차단 효과 지속',
                    description: '명태균 무상 여론조사 등 정치자금법 위반 혐의에 대해 1심과 동일하게 무죄 유지. 김건희 정치자금법 무죄 판결이 윤석열 본인 재판에서 당선무효(벌금 100만원 이상) 차단 효과로 작용. 검찰의 뇌물죄 확장 실패도 미시정.',
                    impact: '→ 윤석열 연루 차단, 국민의힘 선거보조금 약 400억원 반환 회피 가능성'
                },
                {
                    category: '재판부',
                    title: '대법원 포괄일죄 판례 정확한 적용 (긍정 평가)',
                    description: '신종오 재판부는 도이치모터스 시세조종에 대해 대법원이 동종 사건(권오수·이종호)에서 확립한 포괄일죄 법리를 적용. 1심이 부정한 "20억원 계좌 위탁 + 40% 수익약정 + 통정매매 13만 9,383주"를 단일 범의에 의한 포괄일죄로 인정하여 공소시효 문제를 해소. 1심의 대법원 판례 위배를 시정한 의미 있는 판단.',
                    impact: '→ 1심 무죄 판단을 정면 뒤집어 항소심 일부 유죄. 사법 정의 일부 회복'
                },
                {
                    category: '재판부',
                    title: '공동정범 법리 명확화 (긍정 평가)',
                    description: '"시세조종행위에 대해 공동 가공의 의사를 갖고 기능적 행위지배를 통해 가담한 것으로 인정된다" — 대통령 배우자라는 지위 특수성을 고려하면서도 형법상 공동정범의 요건을 엄격히 적용. "죄책을 인정하지 않고 변명으로 일관"한 점도 양형에 반영.',
                    impact: '→ 향후 유사 사건의 명확한 법리 기준 제시'
                },
                {
                    category: '재판부',
                    title: '통일교 금품수수 알선수재 확대 적용 (긍정 평가)',
                    description: '1심이 일부 유죄로 한정한 통일교 금품 수수에 대해 항소심은 알선수재 법리를 폭넓게 적용하여 전부 유죄로 확대. 2022년 4월 7일 첫 번째 샤넬가방도 묵시적 청탁 인식을 인정. 그라프 다이아몬드 목걸이(약 6,220만원 상당) 몰수 결정.',
                    impact: '→ 형량 가중의 핵심 근거, 알선수재 법리의 사법 명확화'
                },
                {
                    category: '검찰',
                    title: '항소심 가중 판결 유도 성공',
                    description: '특검이 항소심에서 1심 무죄 부분에 대한 법리 오류를 적극 주장하여 대법원 포괄일죄 판례를 환기. 1심에서 미흡했던 공소장 설계의 부족분을 항소심 변론으로 보완. 다만 정치자금법 뇌물죄 확장 실패 등은 미시정.',
                    impact: '→ 일부 유죄 전환 및 형량 가중 견인. 그러나 "절반의 성공"'
                },
                {
                    category: '재판부',
                    title: '"철저한 원칙주의" 평가의 양면성',
                    description: '신 부장판사는 법조계에서 "철저한 원칙주의"로 평가받으며, 택시기사·노동쟁의·하청 근로자 사건 등에서 1심을 뒤집은 이력이 다수. 그러나 김건희 사건에서는 양형 측면에서 "원칙주의"가 충분히 발휘되지 못했다는 평가. 영부인이라는 지위와 범죄의 사회적 파급력에 비추어 양형 가중 폭이 부족하다는 시민사회 비판.',
                    impact: '→ 법리 적용은 정확했으나 양형의 균형은 미흡, 상고심 추가 가중 여지 존재'
                }
            ]
        }
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
            { text: '한덕수 내란중요임무종사 징역 23년 선고 (2026.01, 구형 15년보다 8년 높음)', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202601211634001' } },
            { text: '내란우두머리방조 → 공소장 변경 유도: 내란죄는 필요적 공동정범이므로 방조범 불성립 법리 제시, 특검 수용하여 내란중요임무종사로 공소장 변경', source: null },
            { text: '이재명 대장동·성남FC 재판 무기한 연기 (불소추특권)', source: { name: '법률신문', url: 'https://www.lawtimes.co.kr/news/207843' } },
            { text: '대장동·백현동·위례신도시 개발 비리 재판', source: { name: '법률신문', url: 'https://www.lawtimes.co.kr/news/192041' } },
            { text: '이하상 변호사 15일 감치 집행 (2026.02) - 김용현 변호인 법정 소란, 대법원 특별항고 기각', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202602031634001' } }
        ],
        justiceEvaluation: {
            prosecutionScore: 40,
            courtScore: 75,
            overallScore: 60,
            summary: '재판부는 내란우두머리방조 혐의에 대해 "내란죄는 필요적 공동정범이므로 방조범이 성립할 수 없다"는 독자적 법리를 제시하여 공소장 변경을 유도하고, 12·3 비상계엄을 법원 최초로 "내란"으로 규정한 역사적 판결을 내렸다. 검찰의 보수적 구형(15년)을 독립적으로 판단하여 국무총리의 헌법적 책임에 상응하는 징역 23년을 선고했으나, 검찰의 공소사실 구성과 양형 판단에 심각한 문제가 있다.',
            issues: [
                {
                    category: '검찰',
                    title: '내란우두머리방조 혐의 적용의 법리적 오류',
                    description: '특검은 한덕수에게 내란우두머리방조 혐의를 적용했으나, 재판부가 내란죄는 필요적 공동정범이므로 방조범 성립 불가라는 법리를 제시. 특검이 이를 수용하여 내란중요임무종사로 공소장 변경.',
                    impact: '→ 검찰의 공소사실 구성 능력에 대한 근본적 의문'
                },
                {
                    category: '검찰',
                    title: '국무총리 역할의 양형 반영 심각 부족',
                    description: '국무총리는 대통령 유고 시 권한대행을 맡는 헌법상 제2인자임에도, 특검은 내란 가담자들과의 관계 등을 고려해 징역 15년만 구형. 헌법적 직위의 중대성을 현저히 과소평가.',
                    impact: '→ 재판부가 독립적 판단으로 구형을 대폭 초과하는 23년 선고 불가피'
                },
                {
                    category: '재판부',
                    title: '내란 첫 판결의 역사적 법리 확립',
                    description: '12·3 비상계엄을 "국헌문란 목적의 내란"으로 최초 규정하고, 필요적 공동정범에서 방조범 불성립이라는 중요한 법리적 선례를 수립. 이후 내란 재판의 기준점 역할.',
                    impact: '→ 법리 해석과 국민의 법 감정을 균형있게 반영한 판단'
                },
                {
                    category: '재판부',
                    title: '구형 초과 선고의 양형 형평성 논란',
                    description: '다른 피고인들이 구형의 50~70%를 선고받은 것에 비해 한덕수만 153%. 국무총리 직위의 가중이 합리적이라는 평가와 양형 일관성 우려가 병존.',
                    impact: '→ 검찰의 과소 구형에 대한 사법부의 독립적 교정으로 해석 가능'
                }
            ]
        }
    },
    {
        id: 'park-okhee',
        name: '박옥희',
        category: '내란전담재판부',
        court: '서울중앙지방법원',
        position: '형사합의30부 부장판사',
        appointedBy: '',
        photo: '/박옥희.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울중앙지방법원 형사합의30부 부장판사 (현재)'
        ],
        cases: [
            { text: '강의구 전 대통령실 부속실장 사후 계엄선포문 작성·폐기 1심 징역 1년 6개월·법정구속 (2026.05.28) - 허위공문서작성·공용서류손상·대통령기록물법 위반. 특검 구형 5년 대비 약 30%. 재판부: "피고인은 대통령을 지근거리에서 보좌하는 1급 고위공무원인 부속실장임에도 비상계엄이 대통령 서명·국무위원 부서가 담긴 문서로 이뤄지지 않은 하자를 인지한 후 이를 은폐하기 위해 당초 배포된 선포문에 없던 표지를 새로 작성, 죄책이 무겁다", "한덕수 전 국무총리로부터 폐기 요청을 받고 윤석열 전 대통령에게 보고한 뒤 대통령기록물이자 공용서류를 무단 폐기", "윤석열 등 사전지시가 없었는데도 계엄선포문 표지 형식을 작성하고 서명을 받는 등 범행의 주요 실행행위 담당". 유리한 정상: 사실관계 인정, 자신의 이익이 아님, 수사기관에 사실대로 진술', source: { name: '파이낸셜뉴스', url: 'https://www.fnnews.com/news/202605281509504057' } }
        ],
        justiceEvaluation: {
            prosecutionScore: 50,
            courtScore: 60,
            overallScore: 55,
            summary: '형사합의30부(박옥희 부장판사)는 2026.05.28 강의구 전 대통령실 부속실장의 사후 계엄선포문 작성·폐기 사건에서 "1급 고위공무원으로서 죄책이 무겁다"고 명시하며 징역 1년 6개월·법정구속을 선고했다. 같은 날 형사32부(류경진)가 윤석열 위증 사건을 무죄 선고한 것과 정반대 결론으로, 동일 12·3 비상계엄 사건군에서 재판부 간 사실 판단·양형 격차의 한 축을 이룬다. 다만 특검 구형 5년 대비 30% 수준의 선고로, 비상계엄 문서 자체의 절차적 하자를 은폐한 행위의 헌정 파괴적 성격에 비해 양형이 관대하다는 평가도 함께 존재.',
            issues: [
                {
                    category: '검찰',
                    title: '사후 계엄선포문 사건 구형(5년) 대비 30% 선고 - 공소유지 평가의 양면성',
                    description: '특검은 비상계엄 선포 문서의 사후 은폐가 헌정 질서 훼손이라는 점을 들어 5년을 구형했으나, 재판부는 사실관계 인정·본인 이익 아님·수사기관 협조 등을 유리한 정상으로 참작하여 1년 6개월을 선고. 자백·협조라는 정상 참작 사유 자체는 정당하나, 헌정 파괴 행위에 대한 일반적 양형 기준에 비추어 구형 30%는 관대하다는 비판 여지.',
                    impact: '→ 정상 참작 사유의 적정성 여부가 항소심 쟁점 가능성'
                },
                {
                    category: '재판부',
                    title: '"죄책 무겁다" 판시와 법정구속 - 같은 날 형사32부 무죄와의 대비',
                    description: '박옥희 재판부는 강의구를 1급 고위공무원으로서 죄책이 무겁다고 명시하고 법정구속한 반면, 같은 날 같은 법원의 형사합의32부(류경진)는 윤석열 한덕수 재판 위증을 무죄 선고. 동일 12·3 비상계엄 사건군에서 재판부에 따라 결과가 극단적으로 갈리는 사법 일관성 결함을 표면화한 동시에, 박옥희 재판부는 류경진 재판부와 대조적으로 내란 가담자 책임을 인정하는 노선을 유지.',
                    impact: '→ 형사32부(류경진) 4연속 무죄·관대 노선의 반례로 작용'
                },
                {
                    category: '재판부',
                    title: '비상계엄 문서 절차적 하자의 법원 첫 공식 인정',
                    description: '재판부가 "비상계엄이 대통령 서명·국무위원 부서가 담긴 문서로 이뤄지지 않은 하자"를 명시적으로 판시한 것은, 12·3 비상계엄 선포 절차의 위법성을 법원이 공식적으로 인정한 의미. 이는 본안 내란 재판(윤석열·한덕수 등)에서 비상계엄의 합법성 다툼에 선례적 영향을 줄 가능성이 큼.',
                    impact: '→ 본안 내란 재판의 절차 위법성 판단에 선례 형성'
                },
                {
                    category: '재판부',
                    title: '"윤석열 등 사전지시 없이도 주요 실행행위 담당" 인정',
                    description: '재판부가 "윤석열 등 사전지시가 없었는데도 계엄선포문 표지 형식을 작성하고 서명을 받는 등 범행의 주요 실행행위 담당"이라고 판시한 점은, 사후 은폐 행위가 대통령 지시와 독립적으로 부속실장 차원에서 능동적으로 이뤄졌다는 사실 인정. 윤석열 본인의 사후 은폐 관여 여부에 대해서는 별개 판단이 필요하다는 함의도 내포.',
                    impact: '→ 부속실장의 능동적 가담 인정으로 책임 회피 논리 차단'
                }
            ]
        }
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
            { text: '윤석열 한덕수 재판 위증 혐의 1심 무죄 선고 (2026.05.28) - 특검 구형 징역 2년. 윤석열 내란 관련 기소 사건 중 첫 무죄. 재판부 무죄 근거: ① "주관적 평가·법률적 의견 진술은 위증죄 대상 아님" ② "한덕수 건의 이전부터 윤석열이 국무위원 소집 계획 가능성 높음" ③ "기억에 반하는 진술로 단정하기 어려움" ④ "범죄 증명이 없음". 같은 12·3 비상계엄 사건군의 사후 계엄 선포문 작성·폐기 강의구 전 부속실장은 같은 날 형사합의30부(박옥희)에서 징역 1년 6개월·법정구속.', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202605281010001' } },
            { text: '박종준 전 경호처장 비화폰 삭제 증거인멸 1심 무죄 (2026.05.21) - 윤석열·홍장원 비화폰 정보 원격삭제 관여 혐의. 재판부 무죄 근거: ① "조지호 전 경찰청장 등 다른 인물의 비화폰은 삭제하지 않아 인멸 고의 단정 어려움" ② "홍장원이 국회에서 비화폰 통화내역 사진을 공개한 이후 발생한 보안사고에 따른 조치로 볼 가능성" ③ "전자정보 삭제만으로 증거인멸 단정 어려움" ④ "사후적으로 부적절·미흡하더라도 인멸 추정 불가". 매뉴얼에 따른 보안조치 성격으로 판단', source: { name: '파이낸셜뉴스', url: 'https://www.fnnews.com/news/202605211435463959' } },
            { text: '조태용 전 국가정보원장 국정원법 위반·직무유기 등 주요 혐의 무죄, 위증죄로만 징역 1년 6개월 (2026.05.21) - 특검 구형 7년 대비 약 21% 수준. 박종준 무죄와 같은 날·같은 재판부 선고. 재판부는 "홍장원 1차장이 보고한 비상계엄 정치인 체포조 운영 계획을 조태용이 풍문으로 받아들였을 가능성"을 이유로 직무유기 무죄. 참여연대 등 시민단체는 "국정원장이 내란 정황을 보고받고도 국회에 알리지 않은 행위를 면책한 황당한 판결"이라 비판', source: { name: '오마이뉴스', url: 'https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003236340' } },
            { text: '이상민 내란중요임무종사 징역 7년 선고 (2026.02.12) - 특검 구형 15년 대비 47%, "국가 존립을 위태롭게 한 내란 행위에 엄중한 처벌 필요". 같은 사건군에서 한덕수 전 국무총리는 형사합의33부(이진관 부장판사)가 구형과 동일한 징역 23년 선고(2026.01.22)', source: { name: '뉴시스', url: 'https://www.newsis.com/view/NISX20260212_0003513827' } },
            { text: '차명진 전 자유한국당 의원 세월호 유가족 모욕·명예훼손 1심 유죄 - 징역 6개월·집행유예 1년·사회봉사 80시간 (2023.07.06, 인천지방법원 형사14부 류경진 부장판사). 차명진은 세월호 참사 5주기 직전인 2019.04.15 페이스북에 "세월호 유가족들. 자식의 죽음에 대한 세간의 동병상련을 회 처먹고, 찜 쪄먹고, 그것도 모자라 뼈까지 발라 먹고 진짜 징하게 해 처먹는다"는 글 게시. 재판부: "징하게 해 처먹는다 등은 피해자들을 조롱하거나 혐오하는 표현으로, 자극적이고 반인륜적 표현으로 피해자들의 인격을 비난했기 때문에 모욕으로 보기 타당", "정치인의 무게감을 생각할 때 세월호 유가족에게 준 피해가 커 죄질이 가볍지 않음". 차명진 항소했으나 2025.05 서울고법 2심도 동일 형량 유지 (별도로 민사상 유가족 1인당 100만원 배상 판결)', source: { name: '아시아경제', url: 'https://www.asiae.co.kr/article/2023070615140563263' } },
            { text: '인천 편의점 강도살인 사건 무기징역 + 전자발찌 20년 (인천지법)', source: null },
            { text: '잠진도 아내 살인사건 징역 23년 (인천지법)', source: null },
            { text: '38년간 딸 간병 후 살해 60대 어머니 집행유예 - "중증 장애인 가족을 지원하지 않는 국가 시스템의 문제"', source: null },
            { text: '부장판사 뇌물수수 혐의 무죄 판결 (2023, 증거 부족) - 법관 간 편파 논란', source: null }
        ],
        justiceEvaluation: {
            prosecutionScore: 30,
            courtScore: 20,
            overallScore: 25,
            summary: '형사합의32부(류경진 부장판사)는 12·3 내란 관련 핵심 피고인 4명(이상민·박종준·조태용·윤석열)을 연속 심리하며 모두 무죄 또는 구형 대비 21~47% 수준의 관대한 선고를 내렸다. 특히 2026.05.21 단 하루에 박종준 비화폰 삭제 무죄와 조태용 국정원장 주요 혐의 무죄를 동시에 선고했고, 일주일 뒤 윤석열 위증 무죄로 내란 관련 첫 무죄를 만들어내, 같은 날 강의구를 실형·법정구속한 형사30부, 한덕수에게 23년을 선고한 형사33부와 극단적으로 대비되며 "내란 가담자에게 빠져나갈 법리적 출구를 열어주는 재판부"라는 비판을 받는다. 특검의 공소유지 또한 위증죄 법리 구성, 증거인멸 고의 입증, 국정원장 직무유기 인과관계 입증에서 거듭 실패하고 있다.',
            issues: [
                {
                    category: '검찰',
                    title: '위증죄 법리 구성 실패 - 주관적 평가 답변에 위증죄 적용',
                    description: '특검은 윤석열이 "국무위원들이 외관을 갖추려고 온 인형도 아니고" 답변으로 한덕수 건의 이전 국무회의 계획을 부인했다며 위증죄로 기소했으나, 재판부는 "주관적 평가·법률적 의견 진술은 위증죄 대상 아님"이라며 무죄. 더 나아가 재판부가 "처음부터 국무위원 소집 계획 가능성 높음"이라는 사실판단까지 내려 위증의 전제 자체를 부정. 특검이 위증죄 성립 요건(경험사실의 기억에 반한 진술)을 충족하는 구체적 발언을 특정하지 못한 결과.',
                    impact: '→ 윤석열 내란 관련 기소 사건 중 첫 무죄 판결로 이어짐'
                },
                {
                    category: '검찰',
                    title: '박종준 증거인멸 고의 입증 실패',
                    description: '경호처장이 계엄 직후 윤석열·홍장원 비화폰 정보를 원격삭제한 행위에 대해 검찰은 증거인멸로 기소했으나, "조지호 등 다른 인물의 비화폰은 삭제하지 않음", "홍장원의 국회 비화폰 사진 공개 후 보안사고 대응", "전자정보 삭제만으로 인멸 단정 어려움"이라는 변론을 깨지 못함. 삭제 시점·내용·맥락에 대한 직접증거 확보 부족과 매뉴얼상 보안조치 외관 방어를 무력화하지 못한 공소유지 실패.',
                    impact: '→ 내란 핵심 물증(비화폰 통신기록) 영구 소실에도 책임자 면책'
                },
                {
                    category: '검찰',
                    title: '국정원장 직무유기 인과관계 입증 실패',
                    description: '특검은 조태용 국정원장이 홍장원 1차장으로부터 비상계엄 정치인 체포조 계획을 보고받고도 국회에 보고하지 않은 부작위를 직무유기로 기소했으나, 재판부는 "조태용이 그 보고를 풍문으로 받아들였을 가능성"을 이유로 무죄. 보고의 구체적 내용·전달 방식·인지 시점에 대한 정황 증거 축적이 부족하여 "풍문" 항변을 깨지 못한 공소유지 실패. 구형 7년 → 위증죄만 1년 6개월(약 21%) 결과.',
                    impact: '→ 국가 정보 책임자의 내란 인지·방조에 대한 형사책임 면책'
                },
                {
                    category: '검찰',
                    title: '행안부 장관 내란 가담 범위 특정 미흡',
                    description: '행정안전부 장관은 경찰·소방을 관할하는 치안 핵심 부처의 수장임에도, 특검이 가담 행위를 언론사 단전·단수 지시 전달로 좁게 특정. 경찰력 동원 과정에서의 역할, 내란 인지 후 불작위 등이 충분히 규명되지 않음.',
                    impact: '→ 재판부의 감경 판단에 빌미를 제공'
                },
                {
                    category: '재판부',
                    title: '내란 관련 핵심 피고인 4연속 무죄·관대 선고 패턴',
                    description: '이상민(징역 7년, 구형 47%)→박종준(무죄)→조태용(주요 혐의 무죄, 구형 약 21%)→윤석열(위증 무죄)로 이어지는 4연속 판결은 형사합의32부가 내란 가담자에게 일관되게 법리적 출구를 제공하는 패턴을 보인다. 특히 2026.05.21 단 하루에 박종준·조태용 두 명을 동시 면책하고 일주일 만에 윤석열 무죄를 추가한 것은 단순 우연으로 보기 어려운 동일 재판부 단기 집중 패턴.',
                    impact: '→ "또 류경진" — 내란 책임 회피 통로로 재판부 지목, 윤석열 측 "이제 시작" 평가'
                },
                {
                    category: '재판부',
                    title: '같은 날(2026.05.28) 형사30부 실형·법정구속과 정반대 결론',
                    description: '같은 날 서울중앙지법 형사합의30부(박옥희 부장판사)는 사후 계엄 선포문 작성·폐기로 기소된 강의구 전 대통령 부속실장에게 허위공문서작성·공용서류손상·대통령기록물법 위반으로 징역 1년 6개월·법정구속을 선고했다. 동일 12·3 비상계엄 사건군에서 류경진 재판부는 같은 날 윤석열 위증 무죄를 선고하여, 동일 법원 내 재판부에 따라 사실 판단과 양형이 극단적으로 갈리는 사법 일관성 결함이 표면화됐다.',
                    impact: '→ 같은 날·같은 법원에서 한쪽은 실형·법정구속, 다른 쪽은 무죄라는 균열 노출'
                },
                {
                    category: '재판부',
                    title: '형사33부 한덕수 23년 vs 형사32부 관대 양형 - 동일 사건군 양형 격차',
                    description: '서울중앙지법 형사합의33부(이진관 부장판사)는 2026.01.22 한덕수 전 국무총리에게 구형 23년과 동일한 징역 23년·법정구속을 선고하여 내란 중요임무종사·허위공문서작성·대통령기록물법 위반·헌재 위증 등을 모두 유죄로 판단했다. 같은 내란 사건군에서 형사32부 류경진 재판부는 이상민 7년(구형 47%), 박종준 무죄, 조태용 주요혐의 무죄(구형 21%), 윤석열 위증 무죄를 연속 선고. 동일 법원·동일 사건군 내 재판부 간 판단 격차가 사법 신뢰를 심각하게 훼손.',
                    impact: '→ "어느 재판부에 배당되는가가 결과를 결정한다"는 사법 운영의 구조적 결함 부각'
                },
                {
                    category: '재판부',
                    title: '증거인멸 "고의" 해석의 협소함',
                    description: '경호처장이 대통령·국정원 1차장 비화폰을 원격삭제한 행위는 객관적으로 핵심 물증의 소실을 초래했음에도, 재판부는 "조지호 등 다른 사람 비화폰 미삭제" "홍장원 국회 공개 후 보안사고 대응" "매뉴얼상 보안조치"라는 사정을 받아들여 고의를 부정. 그러나 경호 직무상 보안조치라면 사전 절차·기록이 있어야 하나, 계엄 직후 긴급 원격삭제는 통상 보안조치로 보기 어렵다는 점, 그리고 "삭제 대상 선택성" 자체가 핵심 증거(대통령·1차장) 보존 회피를 시사한다는 점에 대한 판단 미흡.',
                    impact: '→ 권력자 측근의 증거인멸 면책 선례 형성'
                },
                {
                    category: '재판부',
                    title: '위증죄 법리해석의 피고인 친화성',
                    description: '"주관적 평가는 위증죄 대상 아님"이라는 법리는 일반론으로는 타당하나, 윤석열의 "인형도 아니고" 답변은 단순 평가가 아닌 "한덕수 건의 이전 국무회의 계획 부존재"를 사실로 부인한 답변으로 해석될 여지가 있다. 또한 재판부가 더 나아가 "처음부터 국무위원 소집 계획 가능성 높음"이라는 사실판단을 무죄 근거로 채택한 것은 피고인 측 주장을 능동적으로 옹호한 것으로, 동일 재판부의 이상민 관대 양형·조태용 무죄와 함께 패턴화된 피고인 친화성을 보여준다.',
                    impact: '→ "위증해도 처벌 어렵다"는 신호로 향후 내란 재판 증언의 진실성 훼손 우려'
                },
                {
                    category: '재판부',
                    title: '국정원장 부작위 책임 면책 - "풍문" 항변 채택의 부당성',
                    description: '국가정보원장이 1차장의 비상계엄 정치인 체포조 운영 계획 보고를 "풍문으로 받아들였을 가능성"을 이유로 직무유기를 무죄로 판단한 것은, 국가 정보 수장에게 부여된 정보 검증·국회 보고 의무의 본질을 형해화한 해석. 1차장의 직접 보고를 풍문으로 처리하는 것이 가능하다면 국정원의 보고 체계 자체가 무력화됨.',
                    impact: '→ 국정원 최고책임자의 내란 인지·방조에 형사 처벌 진입로 차단'
                },
                {
                    category: '재판부',
                    title: '내란중요임무종사 법리해석의 관대함',
                    description: '재판부는 이상민의 가담을 "지시 전달" 수준으로 한정 해석하여 직접 실행행위가 아닌 점을 과도하게 감경. 그러나 행안부 장관은 치안 조직의 수장으로서 내란을 저지할 직접적 책임이 있는 직위이며, 불작위 자체가 내란 가담에 해당할 수 있다.',
                    impact: '→ 내란중요임무종사의 "중요임무" 해석이 지나치게 협소'
                }
            ]
        }
    },
    {
        id: 'baek-daehyun',
        name: '백대현',
        category: '내란전담재판부',
        court: '서울중앙지방법원',
        position: '형사합의35부 부장판사',
        appointedBy: '',
        photo: '/백대현.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울중앙지방법원 형사합의35부 부장판사 (현재)',
            '수원지방법원 부장판사 (형사항소부)',
            '춘천지방법원 강릉지원 판사',
            '광주지방법원 판사 (2015~ 판사 임관)',
            '법무법인 태평양 변호사 (2006~)',
            '서울대학교 법학대학원 졸업',
            '서울대학교 법학과 졸업',
            '사법연수원 제32기 수료'
        ],
        cases: [
            { text: '윤석열 체포방해·직권남용 등 1심 징역 5년 선고 (2026.01.16) - 구형 10년 대비 50%, "일신의 안위 위해 공무원을 사병화" "납득 어려운 변명, 죄질 좋지 않다"', source: { name: '뉴시스', url: 'https://www.newsis.com/view/NISX20260116_0003479984' } },
            { text: '내란특검 추가기소 윤석열 사건 형사35부 배당 (2025.07.21) - 공수처 기소 사건과 병합 가능성, 직권남용·허위공문서작성 등', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202507212036001' } },
            { text: '전장연 전차교통방해 사건 선고 - 문애린 징역 2년 집행유예 4년, 한명희 징역 1년 집행유예 2년 (2026.01.29)', source: null },
            { text: '보이스피싱 콜센터 조직원 항소심 징역 11년 선고 (2024, 수원지법) - 300여명에게 75억원 편취', source: null },
            { text: '경기도의원 자녀 부정채용 전 양평공사 사장 항소심 - 1심 무죄 뒤집고 징역 10월 집행유예 2년 (2024, 수원지법)', source: null }
        ],
        justiceEvaluation: {
            prosecutionScore: 55,
            courtScore: 65,
            overallScore: 60,
            summary: '형사합의35부는 공수처 기소(체포방해·직권남용)와 내란특검 추가기소(직권남용·허위공문서작성) 사건을 모두 배당받아 윤석열 전 대통령의 핵심 재판을 담당하고 있다. 1심에서 구형 10년 대비 50%인 징역 5년을 선고하며 단호한 소송 지휘와 원칙주의적 재판 운영이 주목받았으나, 내란죄 본안 재판이 아닌 부수 혐의 재판이라는 한계가 있다.',
            issues: [
                {
                    category: '검찰',
                    title: '공수처·내란특검 이원 기소에 따른 공소유지 혼선',
                    description: '동일 피고인(윤석열)에 대해 공수처와 내란특검이 각각 기소하여 형사35부에 배당. 공소장 간 혐의 중복과 법리적 정합성 문제가 제기되며, 병합 심리 여부에 따라 재판 효율성과 양형 판단이 달라질 수 있다.',
                    impact: '→ 이원 기소 구조가 재판부의 통합적 판단을 저해할 가능성'
                },
                {
                    category: '검찰',
                    title: '체포방해 구형 10년의 적정성 논란',
                    description: '특수공무집행방해(체포방해)에 구형 10년은 통상적 양형 범위 대비 높은 수준이나, 내란 맥락에서의 체포방해라는 특수성을 고려하면 내란죄 본안과 분리된 구형 전략이 전체 사건의 중대성을 충분히 반영했는지 의문.',
                    impact: '→ 부수 혐의 선 구형 전략이 본안 재판에 미치는 영향 불투명'
                },
                {
                    category: '재판부',
                    title: '단호한 소송 지휘와 원칙주의적 재판 운영',
                    description: '백대현 부장판사는 증인신문 과정에서 쟁점 이탈 시 즉각 제동, 피고인 측 선고일 변경 요구 기각 등 "강직하고 원칙을 중시"하는 재판 운영으로 평가받음. 2022년 서울지방변호사회 우수 법관 선정 경력.',
                    impact: '→ 법원 안팎에서 "정치색이 옅고 원칙적"이라는 평가'
                },
                {
                    category: '재판부',
                    title: '구형 대비 50% 선고와 부수 혐의 재판의 한계',
                    description: '체포방해·직권남용 등 부수 혐의만으로 징역 5년 선고는 내란죄 본안(지귀연 재판부) 선고 전 첫 실형이라는 상징성이 있으나, 내란 가담의 핵심 책임을 묻기에는 구조적 한계. 향후 내란특검 추가기소 사건 심리가 본격화되면 양형 판단이 달라질 수 있다.',
                    impact: '→ 본안 재판과의 양형 정합성 확보가 향후 과제'
                }
            ]
        }
    },
    {
        id: 'han-sungjin',
        name: '한성진',
        category: '내란전담재판부',
        court: '서울중앙지방법원',
        position: '형사합의34부 부장판사',
        appointedBy: '',
        photo: '/한성진.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울중앙지방법원 형사합의34부 부장판사 (현재)',
            '사법연수원 수료'
        ],
        cases: [
            { text: '추경호 전 국민의힘 원내대표 내란중요임무종사(계엄 해제 표결 방해) 1심 심리 (2026.3.25 첫 공판, 2026.6.10 공판기일) - 12·3 계엄 선포 후 국민의힘 의원총회 소집 장소를 국회→당사→국회→당사로 3차례 변경해 소속 의원 90명(108명 중)이 계엄 해제 표결에 불참하도록 유도한 혐의. 계엄 해제 결의안은 재석 190명 전원 찬성으로 통과. 추경호는 "내란몰이 정치공작, 법왜곡"이라며 혐의 전면 부인', source: { name: '시사저널', url: 'https://www.sisajournal.com/news/articleView.html?idxno=367077' } }
        ],
        justiceEvaluation: {
            prosecutionScore: 50,
            courtScore: 50,
            overallScore: 50,
            summary: '서울중앙지법 형사합의34부(한성진 부장판사)는 추경호 전 국민의힘 원내대표의 내란중요임무종사(계엄 해제 표결 방해) 사건을 심리 중이다. 12·3 계엄의 밤 국민의힘 의원총회 장소를 3차례 변경해 소속 의원 다수가 계엄 해제 표결에 불참하게 한 혐의로, 입법부의 계엄 통제 기능 무력화 시도라는 점에서 내란 사건의 중요한 한 축이다. 2026.6.10 공판기일로 재판 진행 중이며 아직 선고 전이다.',
            issues: [
                {
                    category: '검찰',
                    title: '계엄 해제 표결 방해의 인과관계 입증 과제',
                    description: '특검은 의원총회 장소 3회 변경(국회→당사)이 소속 의원들의 계엄 해제 표결 불참을 유도했다고 본다. 그러나 추경호 측은 "직접 증거 없이 억측·상상으로 기소"라며 법왜곡죄를 주장. 장소 변경 지시와 표결 불참 사이의 고의·인과관계를 입증하는 것이 공소유지의 핵심.',
                    impact: '→ 입증 실패 시 내란 가담 핵심 고리 하나가 끊길 위험'
                },
                {
                    category: '재판부',
                    title: '입법부 계엄 통제 무력화에 대한 사법 판단',
                    description: '계엄 해제 표결은 헌법이 부여한 국회의 계엄 통제 권한의 핵심. 재석 190명 전원 찬성으로 통과됐으나 국민의힘 108명 중 90명이 불참한 상황에서, 원내대표의 장소 변경 지시가 내란중요임무종사에 해당하는지에 대한 재판부의 법리 판단이 향후 정치인 내란 가담 사건의 기준이 될 수 있다.',
                    impact: '→ 정치적 행위와 내란 가담의 경계에 대한 선례 형성'
                }
            ]
        }
    },
    {
        id: 'lee-jeongyeop',
        name: '이정엽',
        category: '내란전담재판부',
        court: '서울중앙지방법원',
        position: '형사합의36부 부장판사',
        appointedBy: '',
        photo: '/이정엽.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울중앙지방법원 형사합의36부 부장판사 (현재)',
            '사법연수원 수료'
        ],
        cases: [
            { text: '윤석열·김용현·여인형·김용대 평양 무인기 침투(일반이적·직권남용) 1심 선고 (2026.06.12) - 윤석열 징역 30년, 김용현 징역 30년, 여인형 징역 15년, 김용대(전 드론작전사령관) 징역 3년·집행유예 5년. "무인기 침투 작전이 대한민국 군사상 이익을 침해했고, 윤석열이 김용현 등과 처음부터 작전을 계획" → 일반이적 공동정범 인정. 직권남용: "정치적 이익을 위해 비상계엄 상황을 조성하려는 사적 목적으로 군인들에게 의무 없는 일을 강요"', source: { name: '파이낸셜뉴스', url: 'https://www.fnnews.com/news/202606121114547074' } },
            { text: '[역사적 양형 비교] 대한민국이 최고권력자의 중대 범죄를 처벌한 선례 — ① 전두환(내란수괴) 1심 사형 → 대법원 무기징역 확정(1996.8~1997.4), ② 노태우(내란중요임무종사) 1심 징역 22년6월 → 대법원 17년 확정, ③ 이명박(뇌물·횡령) 대법원 징역 17년 확정(2020.10). 이정엽 재판부의 윤석열 일반이적 징역 30년은 유기징역 법정 상한(30년)을 적용한 것으로, 노태우·이명박(각 17년)을 크게 상회하고 내란수괴 전두환(무기)에 준하는 최고 수준 양형이다. 다만 전두환·노태우(1997)·이명박(2022)이 모두 특별사면으로 형 집행이 중단된 전례가 있어, 30년형의 확정·집행 여부가 사법 단죄의 실질적 관건으로 남는다', source: { name: '한국일보', url: 'https://www.hankookilbo.com/News/Read/A2025012516150004449' } }
        ],
        justiceEvaluation: {
            prosecutionScore: 70,
            courtScore: 80,
            overallScore: 76,
            summary: '서울중앙지법 형사합의36부(이정엽 부장판사)는 12·3 비상계엄의 명분을 만들기 위한 평양 무인기 침투 작전(일반이적) 사건을 심리해, 2026.6.12 윤석열·김용현에게 각 징역 30년, 여인형 15년을 선고했다. "비상계엄 상황 조성을 위한 사적 목적의 군 동원"이라는 직권남용과 "군사상 이익 침해"라는 일반이적 공동정범을 정면으로 인정하여, 12·3 계엄의 사전 기획성을 군사 작전 차원에서 사법적으로 확인한 중대 판결로 평가된다. 윤석열에 부과한 30년은 유기징역 법정 상한으로, 내란수괴 전두환(무기)에 준하고 노태우·이명박(각 17년 확정)을 크게 상회하는 준엄한 양형이다. 1996~97년 전두환·노태우 내란 처벌이 확립한 "성공한 쿠데타도 처벌된다"는 선례를 일반이적 단일 죄명만으로 최고형을 적용해 계승했다는 점에서 사법 단죄의 강도·일관성 측면에서 높게 평가되나, 과거 선례가 모두 특별사면으로 무력화된 만큼 확정·집행이 관건이다.',
            issues: [
                {
                    category: '재판부',
                    title: '평양 무인기 작전의 일반이적 공동정범 인정',
                    description: '재판부는 무인기 침투 작전이 대한민국의 군사상 이익을 침해했고, 윤석열이 김용현 등과 처음부터 작전을 계획했다며 일반이적 공동정범을 인정. 12·3 비상계엄이 우발적·즉흥적 조치가 아니라 사전에 기획된 국헌문란 행위였음을 군사 작전 차원에서 입증한 판단.',
                    impact: '→ 계엄의 사전 기획성을 군사 작전으로 확인한 선례'
                },
                {
                    category: '재판부',
                    title: '직권남용 — "사적 목적의 군 동원" 명확화',
                    description: '"정치적 이익을 위해 비상계엄 상황을 조성하려는 사적 목적으로 군인들에게 의무 없는 일을 강요"했다고 판단. 통수권자가 군을 사적 정치 목적에 동원한 것을 직권남용으로 명확히 규정하여, 본안 내란 재판에도 영향을 줄 수 있는 법리.',
                    impact: '→ 군 통수권의 사적 남용에 대한 사법 판단 기준 제시'
                },
                {
                    category: '재판부',
                    title: '실행자 김용대 집행유예 — 위계별 양형 차등',
                    description: '작전을 직접 지휘한 드론작전사령관 김용대에게는 징역 3년·집행유예 5년을 선고. 윤석열·김용현(각 30년), 여인형(15년)과 비교하면 "상부 지시에 따른 실행자"라는 점을 양형에 반영한 위계별 차등. 다만 군사상 이익을 침해한 일반이적 실행자에게 집행유예가 적정한지에 대한 평가는 갈릴 수 있다.',
                    impact: '→ 지휘 위계에 따른 양형 차등의 적정성 논란 가능'
                },
                {
                    category: '재판부',
                    title: '역사적 내란·국정농단 선례에 부합하는 준엄한 양형',
                    description: '윤석열에 부과한 일반이적 징역 30년은 유기징역 법정 상한(30년)으로, 내란수괴 전두환(1심 사형→대법 무기)에 준하고 내란중요임무종사 노태우·뇌물 이명박(각 17년 확정)을 크게 상회한다. 1996~97년 전두환·노태우 내란 처벌이 확립한 "성공한 쿠데타도 처벌된다"는 선례를 계승하면서, 일반이적이라는 단일 죄명만으로 최고형을 적용해 사법 단죄의 강도와 일관성을 보여줬다. 다만 전두환·노태우(1997)·이명박(2022)이 모두 특별사면으로 풀려난 전례가 있어, 이 선고가 실질적 단죄가 되려면 확정·집행이 전제된다.',
                    impact: '→ 1997년 내란 처벌 선례를 계승·강화한 최고 수준 양형 (단, 사면 변수 상존)'
                }
            ]
        }
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
        photo: '/윤성식.png',
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
        ],
        justiceEvaluation: {
            prosecutionScore: 65,
            courtScore: 70,
            overallScore: 68,
            summary: '송영길 돈봉투 사건 2심에서 전부 무죄를 선고하며 증거능력 판단에서 엄격한 기준을 적용했다. 민청학련 유인태 재심 무죄 등 과거사 사건도 담당했다.',
            issues: [
                {
                    category: '재판부',
                    title: '송영길 돈봉투 사건 2심 전부 무죄',
                    description: '이정근 녹음파일 증거능력 불인정, 먹사연 압수물 위법수집 증거 판단 등 엄격한 증거법칙을 적용하여 전부 무죄를 선고했다.',
                    impact: '→ 증거법칙 엄격 적용, 무죄추정 원칙 존중'
                },
                {
                    category: '재판부',
                    title: '민청학련 유인태 재심 무죄',
                    description: '서울고법에서 민청학련 유인태 재심 사건에 대해 무죄를 선고하며 과거사 정의 실현에 기여했다.',
                    impact: '→ 과거사 피해자 명예 회복 기여'
                }
            ]
        }
    },
    {
        id: 'min-sungchul',
        name: '민성철',
        category: '내란전담재판부(항소심)',
        court: '서울고등법원',
        position: '형사1부 배석판사',
        appointedBy: '',
        photo: '/민성철.png',
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
        ],
        justiceEvaluation: {
            prosecutionScore: 50,
            courtScore: 48,
            overallScore: 49,
            summary: '위안부 피해자 대일 손해배상 소송에서 국가면제를 적용하여 각하한 판결이 항소심에서 파기되어 논란이 있었다.',
            issues: [
                {
                    category: '재판부',
                    title: '위안부 손해배상 소송 각하',
                    description: '2021년 위안부 피해자 대일 손해배상 소송에서 국가면제를 적용하여 각하했으나, 항소심에서 파기되었다.',
                    impact: '→ 피해자 권리 보호 관점에서 비판'
                }
            ]
        }
    },
    {
        id: 'lee-donghyun',
        name: '이동현',
        category: '내란전담재판부(항소심)',
        court: '서울고등법원',
        position: '형사1부 배석판사',
        appointedBy: '',
        photo: '/이동현.png',
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
        ],
        justiceEvaluation: {
            prosecutionScore: 55,
            courtScore: 55,
            overallScore: 55,
            summary: '내란 사건 항소심 배석판사로 지정되었으나, 개별 판결 이력이 적어 평가 데이터가 제한적이다.',
            issues: []
        }
    },
    // 형사12부 (대등재판부 - 부장판사 없이 구성)
    {
        id: 'lee-seungchul',
        name: '이승철',
        category: '내란전담재판부(항소심)',
        court: '서울고등법원',
        position: '형사12부 판사 (대등재판부)',
        appointedBy: '',
        photo: '/이승철.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울고등법원 형사12부 판사 (현재)',
            '사법연수원 제26기 수료'
        ],
        cases: [
            { text: '내란 사건 항소심 대등재판부 (2026.02.05 지정)', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202602052041005' } }
        ],
        justiceEvaluation: {
            prosecutionScore: 55,
            courtScore: 55,
            overallScore: 55,
            summary: '내란 사건 항소심 대등재판부로 지정되었으나, 개별 판결 이력이 적어 평가 데이터가 제한적이다.',
            issues: []
        }
    },
    {
        id: 'cho-jingu',
        name: '조진구',
        category: '내란전담재판부(항소심)',
        court: '서울고등법원',
        position: '형사12부 판사 (대등재판부)',
        appointedBy: '',
        photo: '/조진구.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울고등법원 형사12부 판사 (현재)',
            '사법연수원 제29기 수료'
        ],
        cases: [
            { text: '내란 사건 항소심 대등재판부 (2026.02.05 지정)', source: null }
        ],
        justiceEvaluation: {
            prosecutionScore: 55,
            courtScore: 55,
            overallScore: 55,
            summary: '내란 사건 항소심 대등재판부로 지정되었으나, 개별 판결 이력이 적어 평가 데이터가 제한적이다.',
            issues: []
        }
    },
    {
        id: 'kim-mina',
        name: '김민아',
        category: '내란전담재판부(항소심)',
        court: '서울고등법원',
        position: '형사12부 판사 (대등재판부)',
        appointedBy: '',
        photo: '/김민아.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울고등법원 형사12부 판사 (현재)',
            '사법연수원 제34기 수료'
        ],
        cases: [
            { text: '내란 사건 항소심 대등재판부 (2026.02.05 지정)', source: null }
        ],
        justiceEvaluation: {
            prosecutionScore: 55,
            courtScore: 55,
            overallScore: 55,
            summary: '내란 사건 항소심 대등재판부로 지정되었으나, 개별 판결 이력이 적어 평가 데이터가 제한적이다.',
            issues: []
        }
    },
    // 영장전담판사
    {
        id: 'bu-dongsik',
        name: '부동식',
        category: '영장전담판사',
        court: '서울중앙지방법원',
        position: '내란 영장전담 부장판사',
        photo: '/부동식.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울중앙지방법원 내란·외환·반란 사건 영장전담 부장판사 (2026.2 배정~현재)',
            '부산지방법원 형사4단독 부장판사',
            '서울중앙지방법원 민사89단독 판사',
            '사법연수원 33기'
        ],
        cases: [
            { text: '심우정 전 검찰총장 내란중요임무종사·직권남용 구속영장 기각 — "증거인멸·도망 염려 소명 부족" (2026.7.16)', source: { name: '한국일보', url: 'https://www.hankookilbo.com/news/article/A2026071620110002674' } },
            { text: '김태효 전 국가안보실 1차장 구속영장 발부 — "증거인멸 염려" (2026.7.10)', source: { name: '서울신문', url: 'https://www.seoul.co.kr/news/society/2026/07/10/20260710500260' } },
            { text: '2026.2.12 무작위 추첨으로 내란·외환·반란 사건 영장전담법관 배정 (이종록 부장판사와 함께, 2.23 가동)', source: { name: '서울신문', url: 'https://www.seoul.co.kr/news/society/2026/02/12/20260212500485' } }
        ],
        justiceEvaluation: {
            prosecutionScore: 55,
            courtScore: 60,
            overallScore: 58,
            summary: '내란 사건 영장전담 부장판사로서 김태효(발부)·심우정(기각) 등 계엄 관련 구속영장을 사안별로 판단했다. 증거인멸·도망 염려의 소명 정도를 기준으로 발부와 기각이 엇갈려, 신병 확보의 필요성을 개별 심사한 것으로 평가된다.',
            issues: [
                {
                    category: '재판부',
                    title: '내란 관련 구속영장 개별 심사 (발부·기각 엇갈림)',
                    description: '김태효 전 1차장은 증거인멸 염려를 인정해 구속영장을 발부한 반면, 심우정 전 검찰총장은 증거인멸·도망 염려의 소명이 부족하다며 기각했다.',
                    impact: '→ 사안별 소명 정도에 따른 판단으로 보이나, 유사 계엄 관여 사건 간 기준의 일관성은 향후 지켜볼 지점'
                }
            ]
        }
    },
    {
        id: 'lee-jongrok',
        name: '이종록',
        category: '영장전담판사',
        court: '서울중앙지방법원',
        position: '내란 영장전담 부장판사',
        photo: '/이종록.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울중앙지방법원 내란·외환·반란 사건 영장전담 부장판사 (2026.2 배정~현재, 부동식 부장판사와 함께)',
            '서울중앙지방법원 부장판사',
            '사법연수원 32기'
        ],
        cases: [
            { text: '강호필 전 지상작전사령관 내란중요임무종사 등 구속영장 기각 — "범죄혐의 다툼 여지, 증거인멸·도망 염려 인정 어려움" (2026.7.13)', source: { name: '파이낸셜뉴스', url: 'https://www.fnnews.com/news/202607132359360978' } },
            { text: '김종욱 전 해양경찰청장·안성식 전 기획조정관 내란부화수행·직권남용 구속영장 기각 (2026.7.3, 권창영 2차 종합특검 청구)', source: { name: '경향신문', url: 'https://www.khan.co.kr/article/202607032255001' } },
            { text: '이은우 전 KTV(한국정책방송원) 원장 내란선전 혐의 구속영장 기각 (2026.5.21)', source: { name: '헤럴드경제', url: 'https://biz.heraldcorp.com/article/10743154' } },
            { text: '2026.2.12 무작위 추첨으로 내란·외환·반란 사건 영장전담법관 배정 (부동식 부장판사와 함께, 2.23 가동)', source: { name: '서울신문', url: 'https://www.seoul.co.kr/news/society/2026/02/12/20260212500485' } }
        ],
        justiceEvaluation: {
            prosecutionScore: 45,
            courtScore: 58,
            overallScore: 52,
            summary: '내란 사건 영장전담 부장판사로서 강호필·김종욱·안성식·이은우 등 계엄 관련 인사들의 구속영장을 「범죄혐의 다툼 여지 + 증거인멸·도망 염려 소명 부족」을 이유로 잇따라 기각했다. 신병 확보보다 방어권·불구속 수사 원칙에 무게를 둔 판단이 반복돼, 특검의 신병 확보 전략에는 제동이 걸렸다.',
            issues: [
                {
                    category: '검찰',
                    title: '종합특검 구속영장 잇단 기각',
                    description: '권창영 2차 종합특검이 청구한 내란 관련 구속영장(강호필·김종욱·안성식 등)을 "혐의에 다툼 여지가 있고 증거인멸·도망 염려 소명이 부족하다"며 다수 기각했다.',
                    impact: '→ 불구속 수사 원칙·방어권 보장 측면은 긍정적이나, 특검의 신병 확보와 실체 규명에는 부담. 유사 사건에서 발부·기각 기준의 일관성은 지켜볼 지점'
                }
            ]
        }
    },
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
        ],
        justiceEvaluation: {
            prosecutionScore: 60,
            courtScore: 65,
            overallScore: 63,
            summary: '윤석열 대통령 체포영장 이의신청을 기각하며 영장 절차의 적법성을 유지했다.',
            issues: [
                {
                    category: '재판부',
                    title: '윤석열 체포영장 이의신청 기각',
                    description: '윤석열 대통령 체포영장에 대한 이의신청을 기각하며 영장 절차의 적법성을 유지했다.',
                    impact: '→ 법적 절차 준수 긍정 평가'
                }
            ]
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 58,
            courtScore: 60,
            overallScore: 59,
            summary: '김용현 전 국방부장관 구속영장을 발부하는 등 내란 관련 영장 심사에서 적절한 판단을 보였다.',
            issues: [
                {
                    category: '재판부',
                    title: '김용현 구속영장 발부',
                    description: '내란 핵심 인물인 김용현 전 국방부장관의 구속영장을 발부했다.',
                    impact: '→ 내란 수사 적시 지원'
                }
            ]
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 60,
            courtScore: 65,
            overallScore: 63,
            summary: '윤석열 대통령 구속영장을 발부하며 내란 수사의 핵심 영장을 처리했다.',
            issues: [
                {
                    category: '재판부',
                    title: '윤석열 구속영장 발부',
                    description: '2025년 1월 윤석열 대통령에 대한 구속영장을 발부하며 내란 수사의 핵심 영장을 처리했다.',
                    impact: '→ 법치주의 수호 관점에서 긍정 평가'
                }
            ]
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 60,
            courtScore: 63,
            overallScore: 62,
            summary: '이상민 구속영장 발부, 김건희 구속영장 발부 등 내란 관련 주요 영장을 처리하면서도, IBK 부당대출 구속영장 기각 등 균형 잡힌 판단을 보였다.',
            issues: [
                {
                    category: '재판부',
                    title: '이상민·김건희 구속영장 발부',
                    description: '내란 핵심 인물들의 구속영장을 발부하면서도 IBK 부당대출 사건에서는 기각하는 등 개별 사안별 판단을 보였다.',
                    impact: '→ 사안별 균형 잡힌 영장 심사'
                }
            ]
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 45,
            courtScore: 42,
            overallScore: 43,
            summary: '박성재 전 법무장관 구속영장 기각, 집사게이트 조영탁 구속영장 기각 등 주요 사건에서 기각 결정이 많아 논란이 있다.',
            issues: [
                {
                    category: '재판부',
                    title: '주요 사건 구속영장 연속 기각',
                    description: '박성재 전 법무장관, 집사게이트 조영탁 등 주요 사건에서 구속영장을 기각하여 검찰 수사에 제동을 걸었다는 비판이 있다.',
                    impact: '→ 영장 기각률 논란, 수사 지연 우려'
                }
            ]
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 40,
            courtScore: 38,
            overallScore: 39,
            summary: '윤석열 체포영장 기각, 채해병 사건 관련 5명 구속영장 줄기각, 추경호 구속영장 기각 등 내란 관련 핵심 영장을 다수 기각하여 강한 비판을 받고 있다.',
            issues: [
                {
                    category: '재판부',
                    title: '내란 관련 영장 다수 기각',
                    description: '윤석열 체포영장 기각, 채해병 사건 이종섭 등 5명 구속영장 줄기각, 추경호 구속영장 기각 등 내란 관련 핵심 영장을 다수 기각했다.',
                    impact: '→ 내란 수사 방해 논란, 영장전담판사 공정성 의문'
                },
                {
                    category: '재판부',
                    title: '임성근 구속영장 발부',
                    description: '채상병 사건 임성근에 대해서는 구속영장을 발부하여 일부 균형을 보였다.',
                    impact: '→ 사안별 판단이나 전체적 기각 편향 논란'
                }
            ]
        }
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
        ],
        justiceEvaluation: {
            prosecutionScore: 58,
            courtScore: 60,
            overallScore: 59,
            summary: '윤석열 2차 구속영장을 발부하면서도 대진연 회원 구속영장을 기각하는 등 개별 사안에 따른 판단을 보였다.',
            issues: [
                {
                    category: '재판부',
                    title: '윤석열 2차 구속영장 발부',
                    description: '2025년 7월 윤석열 대통령에 대한 2차 구속영장을 발부했다.',
                    impact: '→ 내란 수사 지원'
                },
                {
                    category: '재판부',
                    title: '대진연 회원 구속영장 기각',
                    description: '대진연 회원 4명의 구속영장을 기각하며 집회 시위 관련 구속에 신중한 태도를 보였다.',
                    impact: '→ 집회 시위 자유 보호 관점에서 긍정적'
                }
            ]
        }
    },
    {
        id: 'jo-sunpyo',
        name: '조순표',
        category: '권력형 비리·선거 재판부',
        court: '서울중앙지방법원',
        position: '형사합의21부 부장판사',
        appointedBy: '미상',
        photo: '/조순표.png',
        rating: 0,
        reviewCount: 0,
        career: [
            '서울중앙지방법원 형사합의21부 부장판사 (2026~현재)',
            "김건희 '매관매직'(알선수재) 사건 1심 재판장 (2026)",
            '윤석열 공직선거법상 허위사실공표 사건 1심 재판장 (2026)'
        ],
        cases: [
            { text: "김건희 '매관매직'(알선수재) 1심 — 징역 7년 선고, 알선수재 세부 5개 혐의 전부 유죄 (2026.6.26, 특검 구형 7년 6개월)", source: { name: '문화일보', url: 'https://www.munhwa.com/article/11598549' } },
            { text: '윤석열 공직선거법상 허위사실공표 사건 심리 — 윤우진 변호사 소개·건진법사 면담 부인 혐의 (2026, 진행 중)', source: { name: '뉴스타파', url: 'https://newstapa.org/article/nsRMe' } }
        ],
        justiceEvaluation: {
            prosecutionScore: 80,
            courtScore: 85,
            overallScore: 83,
            summary: "조순표 부장판사는 김건희 '매관매직'(알선수재) 1심에서 세부 5개 혐의를 전부 유죄로 인정하고 검찰 구형(징역 7년 6개월)에 근접한 징역 7년을 선고하며 \"위법성을 인식하고도 은폐했다\"고 판시, 권력형 비리에 엄정한 판단을 내렸다. 윤석열 공직선거법상 허위사실공표 사건도 심리 중이다. 다만 공개된 경력 정보가 제한적이고 주요 판결 표본이 적어, 추가 판결 누적에 따른 평가 보완이 필요하다.",
            issues: [
                {
                    category: '재판부',
                    title: '김건희 매관매직 전부 유죄·중형 선고',
                    description: '알선수재 세부 5개 혐의를 전부 유죄로 인정하고 구형(7년 6개월)에 근접한 징역 7년을 선고했다. 재판부는 김 여사가 위법성을 인식하고도 은폐했다고 판단했다.',
                    impact: '→ 권력형 비리에 대한 엄정한 사법 판단으로 평가'
                },
                {
                    category: '재판부',
                    title: '제한된 공개 이력·판결 표본',
                    description: '공개된 경력 정보가 제한적이고 평가 가능한 주요 판결 표본이 적어 현 시점의 평가는 잠정적이다. 윤석열 허위사실공표 사건 등 진행 중 재판의 결과가 누적되어야 한다.',
                    impact: '→ 추가 판결 누적 시 평가 보완 필요'
                }
            ]
        }
    }
];
