/**
 * 25명 피고인 사법 정의 평가 + AI 판사 비교 데이터
 *
 * upload_claude_predictions.js에서 merge하여 Firestore에 업로드
 */

const AI_JUDGE_STATUS = {
    korea: '대법원 2026.2.13 재판지원 AI 시범 운영 개시. 사법인공지능심의관 직위 신설(2026.1). 양형 기준 자동 분류·제시 기능 포함.',
    global: '에스토니아: 7,000유로 이하 소액분쟁 AI 판사 도입. 중국: 스마트법원 시스템으로 판사 업무 1/3 감소. 미국: COMPAS 양형 예측 알고리즘 활용.'
};

const JUDICIAL_INTEGRITY_DATA = {

// ── 1. 윤석열 ──────────────────────────────────────────
'윤석열': {
    judicialIntegrity: {
        prosecutorialIssues: [
            { title: '외환유치죄(형법 93조) 미기소', description: '2024.10~11 드론작전사령부의 북한 드론 5차례 침투에 대해 현역 장교가 "V(윤석열)가 작전 승인·반복 지시"라고 증언했으나, 1차 특검에서 외환유치죄 기소 누락.', severity: 'critical', impact: '외환유치죄 성립 시 사형·무기징역까지 가능한 추가 중형 미반영' },
            { title: '노상원 수첩 증거 관리 부실', description: '핵심 증거인 노상원 자필 수첩의 작성 시기·보관 상태에 대한 검찰의 소명이 불충분하여 1심에서 증거능력 배척.', severity: 'major', impact: '2023.10부터의 계획적 내란 준비 입증 실패 → 계획성 가중 미적용' },
            { title: '내란목적살인예비 입증 실패', description: '국회 내 시민 부상 등 물리적 충돌이 있었으나 살인예비 혐의 입증에 미달.', severity: 'major', impact: '사형 논거 약화' }
        ],
        judicialIssues: [
            { title: '노상원 수첩 증거능력 전면 배척', description: '지귀연 부장판사가 수첩의 작성 시기 불명확, 내용 불일치, 형태 조악 등을 이유로 증거능력 전면 배척. 계획성 입증의 핵심 증거 탈락.', severity: 'major', impact: '즉흥적 계엄 판단 → 계획성 가중 미적용' },
            { title: '재판장 편향 논란', description: '지귀연 부장판사는 구속심사 단계부터 편향 논란이 있었으며, 1심 선고 후 북부지법으로 전보 인사.', severity: 'major', impact: '사법부 독립성·공정성에 대한 의문 제기' }
        ],
        omittedEvidence: [
            { title: '북한 드론 5차례 침투 작전', description: '드론작전사령부가 2024.10~11 최소 5차례 북한에 드론 침투. 현역 장교 "V(윤석열)가 작전 승인·반복 지시" 증언 확보.', status: '2차 특검 핵심 수사 대상' },
            { title: 'HID 요원 국내 동원', description: '대외 정보 수집 전문 부대인 HID가 비상계엄 당일 경기 판교에 대기. 평시 국내 작전 임무가 없는 부대.', status: '2차 특검 수사 중' },
            { title: '안가회동 세부 모의 미공개 내용', description: '5차례 안가회동의 전체 내용 중 일부만 재판에 반영. 미공개 모의 내용 추가 확보 필요.', status: '추가 증거 수집 중' }
        ],
        integrityScore: {
            prosecution: 45,
            judiciary: 40,
            overall: 42,
            reasoning: '내란수괴 법정형(사형·무기징역·무기금고)의 제약 하에서 무기징역 선고는 법리적으로 타당하나, 외환유치죄 미기소와 노상원 수첩 증거 관리 부실은 수사의 완결성에 심각한 의문을 제기한다. 재판부의 수첩 증거 배척과 재판장 편향 논란은 항소심에서 핵심 쟁점이 될 전망이다.'
        }
    },
    aiJudgeComparison: {
        differences: [
            { aspect: '증거 평가', humanJudge: '노상원 수첩 전면 배척', aiJudge: '필적 감정·잉크 시기 분석 AI로 정량적 증거능력 판단', advantage: '증거 판단의 객관성·재현성 확보' },
            { aspect: '외환죄 판단', humanJudge: '1차 특검에서 미기소, 1심 미심리', aiJudge: '관련 증거 자동 탐색, 혐의 누락 가능성 경고', advantage: '혐의 누락 방지 시스템' },
            { aspect: '양형 결정', humanJudge: '법정형 구조상 사형·무기징역만 가능', aiJudge: '동일 법정형 구조 적용, 선례 가중치 반영', advantage: '선례 기반 일관된 양형' }
        ],
        aiPredictedOutcome: '무기징역 (법정형 구조상 동일, 외환유치죄 추가 시 경합범 가중)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '내란수괴 법정형의 제약 하에서 양형 자체는 동일하나, AI 시스템이었다면 외환유치죄 관련 증거를 자동 탐색하여 누락을 방지하고, 노상원 수첩의 증거능력을 정량적으로 평가할 수 있었다. 사건의 전모를 빠짐없이 심리하는 것이 사법 정의의 핵심이다.'
    }
},

// ── 2. 김용현 ──────────────────────────────────────────
'김용현': {
    judicialIntegrity: {
        prosecutorialIssues: [
            { title: '안가회동 전체 모의 내용 미소명', description: '5차례 안가회동의 일부만 공판에 현출. 전체 모의 내용과 참석자 역할 분담의 세부사항이 충분히 밝혀지지 않음.', severity: 'major', impact: '범행 전모 파악 제한' },
            { title: '부정선거 수사 지시 관련 추가 혐의 미기소', description: '내란과 별도로 부정선거 수사를 지시한 직권남용·공무집행방해 가능성이 있으나 추가 기소 없음.', severity: 'major', impact: '추가 형량 미반영' }
        ],
        judicialIssues: [
            { title: '내란중요임무종사 양형 편차', description: '노태우(22년6월→17년) 대비 30년은 상대적으로 높으나, 직접 기획·총괄 역할 고려 시 적정 범위 내.', severity: 'minor', impact: '양형 적정성 논란 제한적' }
        ],
        omittedEvidence: [
            { title: '안가회동 전체 녹취·메모', description: '5차례 회동의 전체 내용 중 일부만 증거로 채택됨.', status: '추가 증거 확보 가능성' }
        ],
        integrityScore: {
            prosecution: 55,
            judiciary: 60,
            overall: 57,
            reasoning: '구형 무기징역 대비 30년은 양형기준 범위 내로 상대적으로 적정한 판결이다. 안가회동 전체 내용이 공판에 반영되지 못한 점은 수사의 완결성에 아쉬움을 남기지만, 전체적인 사법 절차는 큰 결함 없이 진행되었다.'
        }
    },
    aiJudgeComparison: {
        differences: [
            { aspect: '공범 역할 평가', humanJudge: '재판장 재량으로 역할 비중 판단', aiJudge: '공범별 행위 기여도를 통신·회동·지시 횟수 등으로 정량 분석', advantage: '공범 간 양형 균형 자동 조정' },
            { aspect: '선례 비교', humanJudge: '판사 개인의 선례 인지 범위에 의존', aiJudge: '전체 내란 판례 자동 비교·분석', advantage: '선례 누락 없는 종합 비교' }
        ],
        aiPredictedOutcome: '징역 25~30년 (현행과 유사, 역할 비중 기반 정량 산출)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '김용현 사건의 양형은 상대적으로 적정 범위에 있으나, AI 시스템은 공범 간 역할 비중을 정량적으로 분석하여 더 정밀한 양형 균형을 달성할 수 있다.'
    }
},

// ── 3. 한덕수 ──────────────────────────────────────────
'한덕수': {
    judicialIntegrity: {
        prosecutorialIssues: [
            { title: '국무총리 역할의 양형 반영 부족 (구형)', description: '검찰의 구형 15년이 국무총리의 헌법적 중대성을 충분히 반영하지 못했다는 재판부 판단. 검찰이 직위의 가중 효과를 과소평가.', severity: 'major', impact: '재판부가 구형을 53% 초과하는 23년 선고' }
        ],
        judicialIssues: [
            { title: '구형 초과 선고의 이례성', description: '구형 15년을 8년 초과하는 23년 선고는 극히 이례적. 다른 피고인들이 구형의 50~70%를 선고받은 것과 대비되어 양형 예측 불가능성 증대.', severity: 'critical', impact: '양형 체계의 예측 가능성 심각 훼손' },
            { title: '피고인 간 양형 형평성 문제', description: '동종 사건 다른 피고인은 구형의 50~70% 선고, 한덕수만 153%. 국무총리 직위 가중이 다른 장관급과의 형평성에서 논란.', severity: 'major', impact: '양형 기준의 일관성 의문' }
        ],
        omittedEvidence: [],
        integrityScore: {
            prosecution: 45,
            judiciary: 45,
            overall: 45,
            reasoning: '검찰의 구형이 지나치게 낮았다는 재판부 판단은 이해할 수 있으나, 구형을 53% 초과하는 선고는 양형 체계의 예측 가능성을 심각하게 훼손한다. 검찰과 재판부 모두에 문제가 있는 사안이다.'
        }
    },
    aiJudgeComparison: {
        differences: [
            { aspect: '구형 반영', humanJudge: '구형 15년을 8년 초과하여 23년 선고', aiJudge: '양형기준 범위 내 산출, 구형 초과 시 사유 자동 명시', advantage: '양형 예측 가능성 확보' },
            { aspect: '직위 가중', humanJudge: '국무총리 직위의 헌법적 중대성을 재량 반영', aiJudge: '직위별 가중 계수를 사전 정의하여 일관 적용', advantage: '직위 가중의 투명성·일관성' }
        ],
        aiPredictedOutcome: '징역 18~22년 (양형기준 내 직위 가중 적용)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '구형 15년 대비 23년이라는 구형 초과 선고는 양형 체계의 예측 불가능성을 극명하게 보여준다. AI 시스템은 양형기준 범위를 엄격히 준수하면서도, 직위의 헌법적 중대성을 사전 정의된 가중 계수로 일관되게 반영할 수 있다.'
    }
},

// ── 4. 김건희 ──────────────────────────────────────────
'김건희': {
    judicialIntegrity: {
        prosecutorialIssues: [
            { title: '도이치모터스 포괄일죄 법리 미적용', description: '대법원은 동종 사건(권오수·이종호)에서 여러 시세 조종 행위를 포괄일죄로 인정했으나, 특검의 공소장은 각 행위를 분리 기재. 재판부가 별개 범죄로 판단하여 2건은 공소시효 도과.', severity: 'critical', impact: '핵심 혐의 무죄 → 구형 15년의 1/9인 1년8개월만 선고' },
            { title: '정치자금법 뇌물죄 확장 실패', description: '명태균 무상 여론조사를 정치자금법 위반으로만 기소. 뇌물죄로 확장했다면 윤석열과 공동 혐의 연결이 가능했으나 불발. 검찰 내부에서도 "많은 정황이 확인됐음에도 뇌물죄로 기소하지 못했다" 인정.', severity: 'critical', impact: '윤석열 연루 차단, 정치자금법 전면 무죄 판결' },
            { title: '공소장 설계 부실 — 방조 혐의 미적용', description: '주가조작에서 공동정범 외에 방조 혐의를 별도 적용했다면 다른 결론이 가능했으나, 공소장에 미포함. 법조계에서 "방조 혐의 미적용이 결과를 갈랐다"는 분석.', severity: 'major', impact: '유죄 인정 범위 축소, 추가 양형 기회 상실' }
        ],
        judicialIssues: [
            { title: '대법원 판례 정면 위배 판결', description: '우인성 부장판사가 도이치모터스 주가조작을 3개 범행으로 분리하여 2건 공소시효 도과를 인정한 것은, 동종 사건 대법원 판결(포괄일죄 인정)에 정면 위배. 특검도 "대법원 판결에 위배되는 판결"이라고 공식 비판.', severity: 'critical', impact: '도이치모터스 주가조작 전면 무죄' },
            { title: '구형 대비 1/9 양형 괴리', description: '구형 15년 대비 1년8개월은 양형 기준상 통상적 범위(50~70%)를 극단적으로 일탈. 경실련·참여연대 등 시민단체가 "법치 파괴"라고 강력 비판.', severity: 'critical', impact: '사법부 신뢰도 심각한 훼손' },
            { title: '주가조작 재판 첫 담당 판사 배당', description: '우인성 판사는 주가조작 재판을 처음 담당하는 판사임에도 본 사건에 배당. 과거 판결 다수(이재명 조폭연루설 무죄, 강용석 소년원 무죄 등)가 2심에서 유죄로 뒤집힌 이력.', severity: 'major', impact: '전문성 부족 우려, 판결 안정성 의문' }
        ],
        omittedEvidence: [
            { title: 'HID 부대 판교 대기 증거', description: '비상계엄 당일 국군정보사 소속 HID(공작부대) 요원들이 경기 판교에 대기. 평시 국내 작전 임무가 없는 대외 정보 수집 전문 부대.', status: '2차 특검 수사 중' },
            { title: '북한 드론 5차례 침투 — 외환유치죄 미적용', description: '2024.10~11 드론작전사령부가 최소 5차례 북한에 드론 침투. 현역 장교 "V(윤석열)가 작전 승인·반복 지시" 증언. 외환유치죄(형법 92조) 적용 시 사형·무기징역까지 가능.', status: '2차 특검 핵심 수사 대상' },
            { title: '노상원 수첩 증거능력 배척 논란', description: '1심 재판부가 작성시기 불명확, 내용 불일치, 형태 조악 등을 이유로 증거능력 배척. 2023.10부터 비상계엄 준비 증거. 2차 특검이 보강·대체 증거 수사 중.', status: '2차 특검 재수사 중' }
        ],
        integrityScore: {
            prosecution: 35,
            judiciary: 20,
            overall: 25,
            reasoning: '검찰은 공소장 설계 단계에서 대법원 포괄일죄 판례를 반영하지 못해 핵심 혐의의 공소시효 도과를 자초했고, 뇌물죄 확장에도 실패했다. 재판부는 대법원 판례에 정면 위배되는 판결을 내렸으며, 구형 대비 1/9이라는 극단적 양형 괴리는 사법 정의에 대한 심각한 의문을 제기한다. 우인성 판사의 과거 판결이 다수 2심에서 뒤집힌 이력은 판결의 안정성에 대한 우려를 더한다.'
        }
    },
    aiJudgeComparison: {
        differences: [
            { aspect: '포괄일죄 판단', humanJudge: '범행을 3개로 분리하여 2건 공소시효 도과 판단', aiJudge: '대법원 판례 데이터베이스 자동 매칭으로 포괄일죄 일관 적용', advantage: '대법원 판례 일탈 원천 방지' },
            { aspect: '양형 일관성', humanJudge: '구형 15년 대비 1/9 수준인 1년8개월 선고', aiJudge: '양형기준 권고 범위(50~70%) 내에서 일관된 산출', advantage: '양형 편차 최소화' },
            { aspect: '증거 판단', humanJudge: '노상원 수첩 증거능력 전면 배척', aiJudge: '필적·잉크·내용 일관성 AI 분석으로 정량적 증거능력 판단', advantage: '증거 판단의 투명성·재현성' },
            { aspect: '외부 영향 배제', humanJudge: '정치적 고려 가능성을 완전히 배제할 수 없음', aiJudge: '알고리즘 기반 중립적 판단, 외부 변수 차단', advantage: '정치적 외압 완전 배제' }
        ],
        aiPredictedOutcome: '징역 5~8년 (포괄일죄 적용 시 주가조작 유죄 + 정치자금법 유죄 + 알선수재)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '동일 사건에서 대법원 판례와 1심 판결이 정면 충돌하고, 구형 대비 1/9이라는 극단적 양형 괴리가 발생한 것은 인간 판사의 재량 남용 가능성을 보여준다. AI 사법 시스템은 전체 판례를 실시간으로 참조하여 판례 일탈을 방지하고, 양형 기준 범위 내에서 일관된 결론을 도출할 수 있다. 이 사건은 AI 판사 도입의 필요성을 가장 극명하게 보여주는 사례이다.'
    }
},

// ── 5. 조지호 ──────────────────────────────────────────
'조지호': {
    judicialIntegrity: {
        prosecutorialIssues: [
            { title: '경찰 조직 내 하급자 범행 범위 미확정', description: '경찰청장 지시로 동원된 경찰관들의 개별 책임이 규명되지 않아 조직적 내란 가담의 전모가 미파악.', severity: 'major', impact: '경찰 조직 동원의 체계적 실태 미해명' }
        ],
        judicialIssues: [
            { title: '상급자 지시 감경 범위의 적정성', description: '구형 20년 대비 60%인 12년 선고. 경찰청장의 독자적 판단 여지가 어디까지인지에 대한 판단이 충분치 않다는 지적.', severity: 'major', impact: '8년 감경의 적정성 논란' },
            { title: '건강 상태 감경의 적정성', description: '혈액암 2기 보석 유지. 인도적 고려와 양형 책임 사이의 균형 문제.', severity: 'minor', impact: '보석 유지로 실질 구금 기간 단축' }
        ],
        omittedEvidence: [
            { title: '경찰 동원 세부 지시 내역', description: '경찰청장→각 경찰서 지시 체계의 전체 내용이 충분히 공판에 현출되지 않음.', status: '추가 확인 필요' }
        ],
        integrityScore: {
            prosecution: 55,
            judiciary: 55,
            overall: 55,
            reasoning: '상대적으로 적정한 범위의 판결이나, 상급자 지시 감경과 건강 상태 고려의 균형에 대한 논란이 존재한다.'
        }
    },
    aiJudgeComparison: {
        differences: [
            { aspect: '건강 상태 반영', humanJudge: '재량적 건강 고려 (혈액암 2기 보석)', aiJudge: '의료 데이터 기반 정량적 건강 위험도 산출', advantage: '건강 감경의 객관적 기준 확립' },
            { aspect: '상급자 지시 감경', humanJudge: '재량으로 40% 감경 (20→12년)', aiJudge: '지시-자율 비율을 지휘체계 분석으로 정량 산출', advantage: '감경 비율 산출의 투명성' }
        ],
        aiPredictedOutcome: '징역 12~15년 (현행과 유사, 건강 감경 정량화)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '건강 상태에 따른 형 집행 유예·감경은 AI의 의료 데이터 분석이 보다 객관적인 기준을 제공할 수 있다.'
    }
},

// ── 6. 노상원 ──────────────────────────────────────────
'노상원': {
    judicialIntegrity: {
        prosecutorialIssues: [
            { title: '노상원 수첩 증거 관리 실패', description: '핵심 증거인 자필 수첩이 1심에서 증거능력 배척. 작성 시기 증명, 보관 경위 소명, 내용 검증 등 증거 확보·보전 과정의 부실이 지적됨.', severity: 'critical', impact: '2023.10부터의 내란 준비 계획 입증 실패' },
            { title: '정보사 HID 운용 실태 미소명', description: '국군정보사 소속 HID 부대의 국내 작전 준비 실태와 정보사령관의 구체적 지시 내용이 충분히 밝혀지지 않음.', severity: 'major', impact: '내란 준비의 구체성·체계성 입증 부족' }
        ],
        judicialIssues: [
            { title: '수첩 증거능력 배척 기준의 엄격성', description: '자필 메모의 증거능력 판단에서 지나치게 엄격한 기준을 적용했다는 법조계 비판. 일반적으로 자필 메모는 진술증거가 아닌 물적 증거로 보아 증거능력이 인정되는 경우가 많음.', severity: 'major', impact: '내란 계획 시점을 2024.12.3으로 한정 → 계획성 감경' },
            { title: '군 지휘체계 감경의 적정성', description: '정보사령관이 군 지휘체계의 단순 하위자인지 논란. 정보 수집·분석의 독자적 자율성을 가진 보직임에도 5년 감경(20→15) 적용.', severity: 'minor', impact: '감경 범위의 적정성 의문' }
        ],
        omittedEvidence: [
            { title: '수첩 내 추가 기재 내용', description: '수첩 전문이 아닌 일부만 공판에 현출. 2차 특검이 수첩 전체 내용 재검토 중.', status: '2차 특검 재검토' },
            { title: 'HID 요원 구체적 활동 내역', description: '판교 대기 외 추가 활동 내역. 국내 사찰·정보 수집 등.', status: '수사 진행 중' }
        ],
        integrityScore: {
            prosecution: 40,
            judiciary: 45,
            overall: 42,
            reasoning: '핵심 증거(자필 수첩)의 증거 관리 부실은 수사기관의 중대한 실책이다. 재판부의 엄격한 증거능력 판단은 법리적 논쟁의 여지가 있으며, 항소심에서 재검토 가능성이 높다.'
        }
    },
    aiJudgeComparison: {
        differences: [
            { aspect: '증거능력 판단', humanJudge: '수첩 전면 배척 (작성 시기·형태 불확실)', aiJudge: '필적·잉크·내용 일관성 AI 분석으로 정량적 증거능력 판단', advantage: '증거 평가의 객관성·재현성 확보' },
            { aspect: '군 지휘체계 감경', humanJudge: '재량적 5년 감경 (20→15년)', aiJudge: '직급·독자적 권한 범위를 정량 분석하여 감경 비율 산출', advantage: '감경 근거의 투명성' }
        ],
        aiPredictedOutcome: '징역 17~20년 (수첩 증거 부분 채택 시 계획성 가중)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '자필 메모의 증거능력 판단은 AI의 필적 감정·시기 추정 기술이 인간 판사보다 정밀하고 객관적이다. AI 시스템이었다면 수첩 증거를 전면 배척하는 대신 정량적 신뢰도 평가를 통해 부분적으로 채택할 수 있었다.'
    }
},

// ── 7. 김봉식 ──────────────────────────────────────────
'김봉식': {
    judicialIntegrity: {
        prosecutorialIssues: [
            { title: '경찰청 하부 지휘체계 수사 미진', description: '서울경찰청장이 동원한 경찰 병력의 구체적 활동 내역과 하부 지시 체계가 충분히 규명되지 않음.', severity: 'major', impact: '경찰 조직 동원의 전모 미파악' }
        ],
        judicialIssues: [
            { title: '보석 허가 후 법정구속의 정합성', description: '2025.6.26 보석 허가 → 2026.2.19 법정구속. 동일 사안에 대해 보석 판단과 선고 시점의 구속 판단이 달라진 일관성 문제.', severity: 'major', impact: '보석 기준의 일관성 논란' }
        ],
        omittedEvidence: [],
        integrityScore: {
            prosecution: 55,
            judiciary: 55,
            overall: 55,
            reasoning: '구형 20년 대비 10년(50%)은 양형기준 범위 내로 상대적으로 적정한 판결이다. 보석과 법정구속 전환의 일관성 문제가 지적될 수 있으나 전체적으로 심각한 결함은 없다.'
        }
    },
    aiJudgeComparison: {
        differences: [
            { aspect: '보석·구속 판단', humanJudge: '보석 허가 후 법정구속으로 전환 (판단 변동)', aiJudge: '도주·증거인멸 위험도를 정량 분석하여 일관된 기준 적용', advantage: '보석 기준의 일관성 확보' }
        ],
        aiPredictedOutcome: '징역 10~12년 (현행과 유사)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '보석 허가 후 법정구속으로의 전환은 동일 사안에 대한 판단 일관성 문제를 노출한다. AI 시스템은 보석·구속 판단에 일관된 정량적 기준을 적용할 수 있다.'
    }
},

// ── 8. 목현태 ──────────────────────────────────────────
'목현태': {
    judicialIntegrity: {
        prosecutorialIssues: [
            { title: '경찰 하급자 독자적 판단 범위 소명 미흡', description: '국회경비대장으로서 상급자 지시 이행과 독자적 판단 범위의 구분이 충분히 소명되지 않음.', severity: 'minor', impact: '상급자 지시 감경의 적정성에 영향' }
        ],
        judicialIssues: [
            { title: '불구속→법정구속 전환', description: '재판 중 불구속 상태에서 3년 실형 선고로 법정구속. 양형 적정성 범위 내이나 피고인 입장에서 예측 불가.', severity: 'minor', impact: '양형 예측 가능성 문제' }
        ],
        omittedEvidence: [],
        integrityScore: {
            prosecution: 60,
            judiciary: 60,
            overall: 60,
            reasoning: '구형 7년 대비 3년(43%)으로 상급자 지시 감경이 적절히 반영된 판결이다. 전체적으로 사법 절차에 큰 문제는 없다.'
        }
    },
    aiJudgeComparison: {
        differences: [
            { aspect: '상급자 지시 감경', humanJudge: '재량적 감경 (7→3년, 57% 감경)', aiJudge: '지휘체계 내 자율성 비율을 정량 분석하여 감경률 산출', advantage: '감경 기준의 객관화' }
        ],
        aiPredictedOutcome: '징역 3~5년 (현행과 유사)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '하급자에 대한 상급자 지시 감경의 적정성은 AI가 지휘체계 분석을 통해 보다 정밀하게 판단할 수 있다.'
    }
},

// ── 9. 김용군 ──────────────────────────────────────────
'김용군': {
    judicialIntegrity: {
        prosecutorialIssues: [
            { title: '헌병대장의 내란 가담 범의 입증 부족', description: '군 지휘체계 내 하급자의 독자적 범의(국헌문란 목적 인식·공유)를 입증하지 못함.', severity: 'major', impact: '무죄 판결의 직접적 원인' },
            { title: '상급자 지시와 범의 공유 구분 소명 미흡', description: '김용현·박안수의 지시를 이행한 것과 내란 목적을 공유한 것의 구분을 검찰이 충분히 소명하지 못함.', severity: 'major', impact: '공범 요건 불성립' }
        ],
        judicialIssues: [
            { title: '동일 지휘체계 범의 인정 기준 불일치', description: '동일 지휘체계 내 상급자(김용현 30년, 박안수 재판 중)는 유죄이나 하급 실행자인 김용군은 무죄. 범의 인정 기준의 일관성에 의문.', severity: 'major', impact: '군 지휘체계 내 범의 판단 기준 불명확' }
        ],
        omittedEvidence: [],
        integrityScore: {
            prosecution: 40,
            judiciary: 55,
            overall: 47,
            reasoning: '검찰이 군 지휘체계 내 하급자의 범의를 충분히 입증하지 못한 것이 무죄의 주된 원인이다. 재판부의 무죄 판단은 증거 부족에 기반한 것으로 법리적으로 타당하나, 동일 지휘체계 내 상급자 유죄와의 불연속성은 범의 판단 기준의 체계화가 필요함을 보여준다.'
        }
    },
    aiJudgeComparison: {
        differences: [
            { aspect: '범의 공유 판단', humanJudge: '증거 불충분으로 범의 부정', aiJudge: '지휘체계 통신·행동 패턴 분석으로 범의 추론 모델 적용', advantage: '정황 증거의 체계적 분석' },
            { aspect: '공범 판단 기준', humanJudge: '개별 판사 재량으로 공범 요건 판단', aiJudge: '공범 판례 데이터베이스 기반 일관된 기준 적용', advantage: '동일 지휘체계 내 일관된 판단' }
        ],
        aiPredictedOutcome: '범의 입증 여부에 따라 무죄~징역 5년',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '동일 지휘체계 내에서 상급자는 유죄(30년), 하급자는 무죄라는 판단의 불연속성은 범의 인정 기준의 명확한 체계화가 필요함을 보여준다. AI 시스템은 지휘체계 내 명령·실행 관계를 체계적으로 분석하여 일관된 범의 판단을 제공할 수 있다.'
    }
},

// ── 10. 윤승영 ─────────────────────────────────────────
'윤승영': {
    judicialIntegrity: {
        prosecutorialIssues: [
            { title: '수사기획조정관 역할 범위 소명', description: '경찰청 국수본 수사기획조정관의 구체적 역할과 내란 가담 범위 특정이 충분치 않음.', severity: 'minor', impact: '양형에 제한적 영향' }
        ],
        judicialIssues: [],
        omittedEvidence: [],
        integrityScore: { prosecution: 60, judiciary: 65, overall: 62, reasoning: '구형 7년 대비 4년6개월(64%)은 양형기준 통상 범위 내로, 상대적으로 적정한 양형이다.' }
    },
    aiJudgeComparison: {
        differences: [
            { aspect: '역할 비중 평가', humanJudge: '재량적 판단', aiJudge: '조직 내 의사결정 기여도 정량 분석', advantage: '역할 평가의 객관성' }
        ],
        aiPredictedOutcome: '징역 4~5년 (현행 유사)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '조직 내 중간 관리자의 역할 비중 평가에 AI의 정량 분석이 더 정밀한 기준을 제공할 수 있다.'
    }
},

// ── 11. 이상민 ─────────────────────────────────────────
'이상민': {
    judicialIntegrity: {
        prosecutorialIssues: [
            { title: '행안부 장관 내란 가담 범위 특정 미흡', description: '행정안전부 장관으로서의 구체적 가담 행위와 일반 직무 수행의 경계가 충분히 구분되지 않음.', severity: 'major', impact: '가담 범위 한정적 인정' }
        ],
        judicialIssues: [],
        omittedEvidence: [],
        integrityScore: { prosecution: 50, judiciary: 60, overall: 55, reasoning: '행안부 장관의 역할 특정이 충분치 못한 측면이 있으나, 구형 10년 대비 7년(70%)은 양형기준 상단으로 적정 범위이다.' }
    },
    aiJudgeComparison: {
        differences: [
            { aspect: '장관급 역할 평가', humanJudge: '재량적 직무 범위 판단', aiJudge: '행정조직 내 권한·지시 체계 분석', advantage: '직무 범위와 범행의 구분 명확화' }
        ],
        aiPredictedOutcome: '징역 7~8년 (현행 유사)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '행정 공무원의 직무 수행과 범행 가담의 경계를 AI가 보다 명확히 구분할 수 있다.'
    }
},

// ── 12~25. 재판 진행 중 피고인 ──────────────────────────
'곽종근': {
    judicialIntegrity: {
        prosecutorialIssues: [{ title: '특수전사령부 동원 전모 미규명', description: '특수전 병력의 구체적 작전 명령 체계와 투입 범위에 대한 수사가 진행 중.', severity: 'major', impact: '군 핵심 전력 동원의 전모 미파악' }],
        judicialIssues: [],
        omittedEvidence: [{ title: 'HID 부대 연계 의혹', description: '특수전사령부와 HID 부대 간 연계 활동 여부.', status: '수사 중' }],
        integrityScore: null
    },
    aiJudgeComparison: {
        differences: [{ aspect: '양형 일관성', humanJudge: '동종 사건 다른 재판부에서 양형 편차 발생 가능', aiJudge: '전체 판례 기반 일관된 양형 산출', advantage: '재판부 간 양형 편차 해소' }],
        aiPredictedOutcome: '징역 15~20년 (내란중요임무종사, 군 핵심 지휘관)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '복수 재판부에서 진행되는 동종 내란 사건의 양형 일관성을 AI가 보장할 수 있다.'
    }
},

'김태효': {
    judicialIntegrity: {
        prosecutorialIssues: [{ title: '안보실의 내란 관여 범위 수사 중', description: '국가안보실 제1차장으로서 비상계엄 기획에 어떤 역할을 했는지 수사 진행 중.', severity: 'major', impact: '안보실 관여 범위에 따라 양형 변동' }],
        judicialIssues: [],
        omittedEvidence: [],
        integrityScore: null
    },
    aiJudgeComparison: {
        differences: [{ aspect: '양형 일관성', humanJudge: '동종 사건 다른 재판부에서 양형 편차 발생 가능', aiJudge: '전체 판례 기반 일관된 양형 산출', advantage: '재판부 간 양형 편차 해소' }],
        aiPredictedOutcome: '징역 7~12년 (안보실 역할 범위에 따라)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '대통령실 참모의 역할과 독자적 가담의 경계를 AI가 체계적으로 분석할 수 있다.'
    }
},

'문상호': {
    judicialIntegrity: {
        prosecutorialIssues: [{ title: '정보사 HID 운용 책임 수사 중', description: '국군정보사령관으로서 소속 HID 부대의 국내 작전 대기를 지시·묵인한 책임 여부.', severity: 'critical', impact: '정보사령관의 직접 지시 여부가 핵심' }],
        judicialIssues: [],
        omittedEvidence: [
            { title: 'HID 판교 대기 지시 경위', description: '정보사령관의 HID 운용 지시 내용과 경위.', status: '수사 중' },
            { title: '드론작전 관여 여부', description: '정보사 소속 드론작전사령부와의 연계.', status: '수사 중' }
        ],
        integrityScore: null
    },
    aiJudgeComparison: {
        differences: [{ aspect: '양형 일관성', humanJudge: '동종 사건 다른 재판부에서 양형 편차 발생 가능', aiJudge: '전체 판례 기반 일관된 양형 산출', advantage: '재판부 간 양형 편차 해소' }],
        aiPredictedOutcome: '징역 10~15년 (HID 동원 책임 인정 시)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '정보기관 활동의 범죄성 판단에 AI의 체계적 분석이 필요하다.'
    }
},

'박성재': {
    judicialIntegrity: {
        prosecutorialIssues: [{ title: '법무부 장관 내란 가담 범위 특정 난항', description: '법무부 장관의 직무 수행과 내란 가담의 경계 규명이 난항 중.', severity: 'major', impact: '가담 범위 특정에 따라 양형 변동' }],
        judicialIssues: [],
        omittedEvidence: [],
        integrityScore: null
    },
    aiJudgeComparison: {
        differences: [{ aspect: '양형 일관성', humanJudge: '동종 사건 다른 재판부에서 양형 편차 발생 가능', aiJudge: '전체 판례 기반 일관된 양형 산출', advantage: '재판부 간 양형 편차 해소' }],
        aiPredictedOutcome: '징역 5~10년 (가담 범위에 따라)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '행정부 장관의 직무 수행과 범행 가담의 경계를 AI가 명확히 구분할 수 있다.'
    }
},

'박안수': {
    judicialIntegrity: {
        prosecutorialIssues: [{ title: '계엄사령관 직접 명령 전모 수사 중', description: '계엄사령관으로서 군 병력 동원의 전체 지시 체계와 구체적 작전 명령의 전모.', severity: 'critical', impact: '내란중요임무종사의 핵심 실행자 역할 입증' }],
        judicialIssues: [],
        omittedEvidence: [{ title: '계엄군 작전 명령서', description: '계엄사령관 명의 구체적 작전 명령의 전체 내용.', status: '증거 확보 진행 중' }],
        integrityScore: null
    },
    aiJudgeComparison: {
        differences: [{ aspect: '양형 일관성', humanJudge: '동종 사건 다른 재판부에서 양형 편차 발생 가능', aiJudge: '전체 판례 기반 일관된 양형 산출', advantage: '재판부 간 양형 편차 해소' }],
        aiPredictedOutcome: '징역 20~30년 (계엄사령관, 내란 핵심 실행)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '군 최고 지휘관의 내란 가담은 AI의 지휘체계 분석이 역할 비중을 정밀하게 평가할 수 있다.'
    }
},

'박종준': {
    judicialIntegrity: {
        prosecutorialIssues: [{ title: '경호처의 국회 봉쇄 관여 범위', description: '경호처 병력의 국회 진입 저지 활동과 경호처장의 지시 관계 규명.', severity: 'major', impact: '경호처 활동의 내란 가담 해당 여부' }],
        judicialIssues: [],
        omittedEvidence: [],
        integrityScore: null
    },
    aiJudgeComparison: {
        differences: [{ aspect: '양형 일관성', humanJudge: '동종 사건 다른 재판부에서 양형 편차 발생 가능', aiJudge: '전체 판례 기반 일관된 양형 산출', advantage: '재판부 간 양형 편차 해소' }],
        aiPredictedOutcome: '징역 7~12년 (경호처 동원 범위에 따라)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '경호 임무와 내란 가담의 경계를 AI가 객관적으로 분석할 수 있다.'
    }
},

'심우정': {
    judicialIntegrity: {
        prosecutorialIssues: [{ title: '검찰총장의 내란 가담 범위 수사 중', description: '검찰 조직의 비상계엄 관련 역할과 검찰총장의 지시·묵인 여부 수사.', severity: 'major', impact: '사법기관 수장의 가담은 가중 사유' }],
        judicialIssues: [],
        omittedEvidence: [],
        integrityScore: null
    },
    aiJudgeComparison: {
        differences: [{ aspect: '양형 일관성', humanJudge: '동종 사건 다른 재판부에서 양형 편차 발생 가능', aiJudge: '전체 판례 기반 일관된 양형 산출', advantage: '재판부 간 양형 편차 해소' }],
        aiPredictedOutcome: '징역 5~10년 (사법기관 수장 가중)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '사법기관 수장의 가담은 직위 가중에 대한 일관된 기준이 필요하다.'
    }
},

'여인형': {
    judicialIntegrity: {
        prosecutorialIssues: [{ title: '방첩사 국내 사찰·공작 활동 수사 중', description: '국군방첩사의 국회의원·시민 사찰, 여론조작 공작 등의 전모 수사.', severity: 'critical', impact: '방첩사 활동 전모에 따라 중형 가능' }],
        judicialIssues: [],
        omittedEvidence: [{ title: '방첩사 내부 문건', description: '국내 사찰·공작 관련 내부 보고서와 지시 문건.', status: '추가 확보 중' }],
        integrityScore: null
    },
    aiJudgeComparison: {
        differences: [{ aspect: '양형 일관성', humanJudge: '동종 사건 다른 재판부에서 양형 편차 발생 가능', aiJudge: '전체 판례 기반 일관된 양형 산출', advantage: '재판부 간 양형 편차 해소' }],
        aiPredictedOutcome: '징역 12~20년 (사찰·공작 범위에 따라)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '군 정보기관의 국내 활동에 대한 사법 판단은 AI의 체계적 분석이 필수적이다.'
    }
},

'이진우': {
    judicialIntegrity: {
        prosecutorialIssues: [{ title: '수방사 병력 동원 전모 수사 중', description: '수도방위사 병력의 비상계엄 투입 경위와 구체적 작전 내용 수사.', severity: 'major', impact: '수도권 군사력 동원의 직접 책임' }],
        judicialIssues: [],
        omittedEvidence: [],
        integrityScore: null
    },
    aiJudgeComparison: {
        differences: [{ aspect: '양형 일관성', humanJudge: '동종 사건 다른 재판부에서 양형 편차 발생 가능', aiJudge: '전체 판례 기반 일관된 양형 산출', advantage: '재판부 간 양형 편차 해소' }],
        aiPredictedOutcome: '징역 10~15년 (수방사 동원 범위에 따라)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '군 지휘관의 병력 동원 책임에 대한 일관된 양형 기준이 필요하다.'
    }
},

'조태용': {
    judicialIntegrity: {
        prosecutorialIssues: [{ title: '국정원의 비상계엄 관련 역할 수사 중', description: '국가정보원의 사전 정보 수집·분석과 내란 가담 관계 규명.', severity: 'major', impact: '정보기관 수장의 인지·가담 범위에 따라 양형 결정' }],
        judicialIssues: [],
        omittedEvidence: [],
        integrityScore: null
    },
    aiJudgeComparison: {
        differences: [{ aspect: '양형 일관성', humanJudge: '동종 사건 다른 재판부에서 양형 편차 발생 가능', aiJudge: '전체 판례 기반 일관된 양형 산출', advantage: '재판부 간 양형 편차 해소' }],
        aiPredictedOutcome: '징역 7~15년 (관여 범위에 따라)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '정보기관의 역할과 내란 가담의 관계를 AI가 체계적으로 분석할 수 있다.'
    }
},

'최상목': {
    judicialIntegrity: {
        prosecutorialIssues: [{ title: '2차 비상계엄 시도 관련 혐의 수사 중', description: '권한대행 기간 2차 비상계엄 시도 혐의의 구체적 내용 수사.', severity: 'major', impact: '내란 연장 시도의 독자적 책임' }],
        judicialIssues: [],
        omittedEvidence: [],
        integrityScore: null
    },
    aiJudgeComparison: {
        differences: [{ aspect: '양형 일관성', humanJudge: '동종 사건 다른 재판부에서 양형 편차 발생 가능', aiJudge: '전체 판례 기반 일관된 양형 산출', advantage: '재판부 간 양형 편차 해소' }],
        aiPredictedOutcome: '징역 5~10년 (내란 연장 시도 범위에 따라)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '권한대행의 내란 관련 행위에 대한 양형은 전례가 없어 AI의 체계적 분석이 필요하다.'
    }
},

'추경호': {
    judicialIntegrity: {
        prosecutorialIssues: [{ title: '국회 계엄 해제 표결 방해 혐의 수사 중', description: '여당 원내대표로서 국회의원 국회 진입 저지·표결 방해 혐의.', severity: 'major', impact: '입법부 기능 마비 기여 여부' }],
        judicialIssues: [],
        omittedEvidence: [],
        integrityScore: null
    },
    aiJudgeComparison: {
        differences: [{ aspect: '양형 일관성', humanJudge: '동종 사건 다른 재판부에서 양형 편차 발생 가능', aiJudge: '전체 판례 기반 일관된 양형 산출', advantage: '재판부 간 양형 편차 해소' }],
        aiPredictedOutcome: '징역 3~7년 (표결 방해 범위에 따라)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '국회의원의 입법 방해 행위에 대한 양형은 AI의 일관된 기준이 필요하다.'
    }
},

'이완규': {
    judicialIntegrity: {
        prosecutorialIssues: [{ title: '계엄 포고령 법적 검토 책임', description: '법제처장으로서 위헌적 계엄 포고령의 법적 검토·승인에 관여한 책임.', severity: 'major', impact: '법적 정당성 부여의 책임' }],
        judicialIssues: [],
        omittedEvidence: [],
        integrityScore: null
    },
    aiJudgeComparison: {
        differences: [{ aspect: '양형 일관성', humanJudge: '동종 사건 다른 재판부에서 양형 편차 발생 가능', aiJudge: '전체 판례 기반 일관된 양형 산출', advantage: '재판부 간 양형 편차 해소' }],
        aiPredictedOutcome: '징역 5~10년 (법적 검토 책임 범위에 따라)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '법률 전문가의 위법 행위 가담은 AI의 체계적 분석이 역할 책임을 정밀하게 평가할 수 있다.'
    }
},

'김주현': {
    judicialIntegrity: {
        prosecutorialIssues: [{ title: '민정수석의 사전 모의 관여 수사 중', description: '대통령실 민정수석으로서 비상계엄 사전 모의·법적 검토 관여 범위 수사.', severity: 'major', impact: '대통령실 내부 모의의 구체적 역할' }],
        judicialIssues: [],
        omittedEvidence: [],
        integrityScore: null
    },
    aiJudgeComparison: {
        differences: [{ aspect: '양형 일관성', humanJudge: '동종 사건 다른 재판부에서 양형 편차 발생 가능', aiJudge: '전체 판례 기반 일관된 양형 산출', advantage: '재판부 간 양형 편차 해소' }],
        aiPredictedOutcome: '징역 5~10년 (모의 관여 범위에 따라)',
        aiJudgeStatus: AI_JUDGE_STATUS,
        necessityReasoning: '대통령실 참모의 사전 모의 관여는 AI가 의사결정 기여도를 정량적으로 분석할 수 있다.'
    }
},

'김건희_별건': null  // 김건희는 위 '김건희' 키로 통합 처리
};

module.exports = { JUDICIAL_INTEGRITY_DATA, AI_JUDGE_STATUS };
