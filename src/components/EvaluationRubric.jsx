/**
 * EvaluationRubric — AI 사법정의 평가의 산정 기준을 설명하는 공유 패널.
 *
 * 왜 분리했나: 목록 페이지(JudgeEvaluation)와 상세 페이지(JudgeDetail)가
 * 동일한 평가 기준을 보여줘야 하는데, 두 곳에 각각 문구를 두면 시간이 지나며
 * 내용이 어긋난다(실제로 기존 목록 안내문은 "정량적 지표"라 설명했으나 실제
 * 산정 방식과 불일치했음). 단일 출처(single source of truth)로 두어 멱등성 확보.
 *
 * @param {boolean} defaultOpen - 처음부터 펼친 상태로 표시할지 여부
 */
export default function EvaluationRubric({ defaultOpen = false }) {
    return (
        <details
            open={defaultOpen}
            className="bg-blue-50 border border-blue-200 rounded-lg text-left group"
        >
            <summary className="cursor-pointer select-none px-4 py-3 font-semibold text-blue-900 text-sm flex items-center gap-2 list-none">
                <span>📐</span>
                <span>AI 평가 기준 — 점수는 어떻게 산정되나요?</span>
                <span className="ml-auto text-blue-500 text-xs group-open:hidden">자세히 ▾</span>
                <span className="ml-auto text-blue-500 text-xs hidden group-open:inline">접기 ▴</span>
            </summary>

            <div className="px-4 pb-4 pt-1 text-sm text-gray-700 space-y-4 border-t border-blue-100">
                {/* 3가지 지표 */}
                <div>
                    <p className="font-semibold text-gray-900 mb-1 mt-3">① 무엇을 평가하나요 (3가지 지표)</p>
                    <ul className="space-y-1 list-disc list-inside text-gray-700">
                        <li>
                            <b>검찰 공정성</b> — 수사·기소·공소유지의 적정성.
                            <span className="text-gray-500"> 혐의 누락/과잉, 증거 관리 부실, 협력 증인 진술 과의존, 선택적 공소유지, 정치적 표적 논란이 있으면 감점.</span>
                        </li>
                        <li>
                            <b>재판부 공정성</b> — 재판 진행·증거 판단·양형·중립성.
                            <span className="text-gray-500"> 편향·비공개 진행·양형 형평성 논란은 감점, 독립적·합리적 법리 판단은 가점.</span>
                        </li>
                        <li>
                            <b>종합 평가</b> — 위 두 지표와 사건의 사회적 중대성을 종합.
                        </li>
                    </ul>
                </div>

                {/* 점수대 범례 */}
                <div>
                    <p className="font-semibold text-gray-900 mb-2">② 점수대의 의미</p>
                    <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                            <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold whitespace-nowrap">🟢 70~100</span>
                            <span className="text-gray-600"><b>양호</b> — 절차적 공정성·사법 독립이 대체로 지켜짐 (경미한 논란만 존재)</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs font-semibold whitespace-nowrap">🟡 50~69</span>
                            <span className="text-gray-600"><b>논란</b> — 공정성에 대한 의미 있는 쟁점이 복수 존재</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-semibold whitespace-nowrap">🔴 0~49</span>
                            <span className="text-gray-600"><b>심각한 우려</b> — 방어권·증거·중립성 등 핵심 영역에 중대한 문제 제기</span>
                        </div>
                    </div>
                </div>

                {/* 산정 방식 */}
                <div>
                    <p className="font-semibold text-gray-900 mb-1">③ 어떻게 계산하나요</p>
                    <p className="text-gray-600 leading-relaxed">
                        기준 <b>100점</b>(이상적 공정 재판)에서 출발하여, 각 판사 페이지의 <b>‘주요 쟁점’</b>에 정리된
                        사실(모두 보도·판례 <b>출처 명시</b>)을 심각도에 따라 감점합니다.
                        핵심 권리·증거·중립성 훼손은 큰 폭(−15~25), 공소·양형 구조 결함은 중간 폭(−8~15),
                        절차·형평 논란은 작은 폭(−4~8)으로 반영하며, 재판부의 독립적·합리적 판단은 가점(+)합니다.
                        모든 평가는 추측을 배제하고 <b>출처 있는 사실</b>에만 근거합니다.
                    </p>
                </div>

                {/* 면책 */}
                <div className="bg-white/60 border border-blue-100 rounded p-3">
                    <p className="font-semibold text-gray-900 mb-1">④ 한계 (면책)</p>
                    <p className="text-gray-500 leading-relaxed text-xs">
                        본 점수는 시민단체 ‘시민법정’이 공개 자료를 바탕으로 사법 절차의 공정성을 정성적으로
                        분석한 <b>참고 지표</b>이며, 법적 효력이나 해당 판사 개인에 대한 확정적 평가가 아닙니다.
                        절대적 서열이 아니라 쟁점의 <b>상대적 심각도</b>를 시각화한 것으로, 새로운 사실·판결이
                        확인되면 갱신됩니다.
                    </p>
                </div>
            </div>
        </details>
    );
}
