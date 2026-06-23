// 클라우드 자동 재판일정 갱신 스크립트 (GitHub Actions cron + Claude 웹검색)
//
// 동작:
//   1) src/data/trialSchedule.js 를 읽는다
//   2) Claude API(claude-opus-4-8) + 웹검색 서버툴로 최신 재판 뉴스를 교차검증해
//      변경이 있으면 "갱신된 전체 파일"을 받아온다 (2개 이상 출처 검증·추측 금지 규칙 적용)
//   3) 안전 가드(앵커/항목 수/길이) 통과 + 실제 변경이 있을 때만 파일을 덮어쓰고
//      changed=true 를 출력 → 워크플로가 build/test 통과 시 PR을 생성한다
//
// 안전장치(Model A — 사람 검토):
//   - 자동 배포 금지. 변경은 PR로만 올라가고 사람이 검토·머지한다.
//   - ANTHROPIC_API_KEY 시크릿이 없으면 아무것도 하지 않고 정상 종료한다.
//   - 빌드/테스트는 워크플로 단계에서 게이트. 여기서는 파일 무결성만 1차 검증.
//
// 절대 금지(프롬프트로 강제): functions/index.js isCrawler, SNS 도메인, 카카오 키,
//   AI 모델 기본값 수정. 추측·미검증 법률정보 기재. 특정 판사/검사 단정 비방.

import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const TRIAL_FILE = join(REPO_ROOT, 'src', 'data', 'trialSchedule.js');
const SUMMARY_FILE = join(REPO_ROOT, 'auto-update-summary.md');

const MODEL = 'claude-opus-4-8';
const API_URL = 'https://api.anthropic.com/v1/messages';

function setOutput(key, value) {
    const out = process.env.GITHUB_OUTPUT;
    if (out) appendFileSync(out, `${key}=${value}\n`);
}

function finishNoChange(reason) {
    console.log(`[auto-trial-update] 변경 없음/스킵: ${reason}`);
    setOutput('changed', 'false');
    process.exit(0);
}

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
    finishNoChange('ANTHROPIC_API_KEY 시크릿 미설정 (GitHub Settings → Secrets에 추가하면 활성화)');
}

const currentFile = readFileSync(TRIAL_FILE, 'utf8');

const PROMPT = `당신은 한국의 사법개혁 시민단체 사이트 '시민법정'의 재판 일정 데이터를 관리하는 편집자입니다.
아래 \`src/data/trialSchedule.js\` 파일을 최신 뉴스로 정확히 갱신하는 것이 임무입니다.

# 절차
1. 웹검색으로 다음 사건의 "오늘 기준 최신" 진행 상황을 찾으세요(새 공판/선고 기일, 특검 구형량, 선고 결과, 기일 연기, 영장 발부/기각, 신규 피의자):
   - 12·3 내란(insurrection): 윤석열·추경호·한덕수·박성재·이완규·김명수 등 군 수뇌부 등 내란 재판, 일반 검색 '내란 재판 선고 구형 영장'
   - 검찰 조작·봐주기 의혹(fabrication): 이화영 국민참여재판 항소심, 심우정·전무곤·이창수 등 검찰 고위직 특검 수사·기소, 박상용 검사 징계·기소
   - 권력형 비리·정치 재판(political): 김건희 매관매직(알선수재)·도이치모터스·통일교, 김건희-명태균 공천개입, 오세훈 정치자금법
2. 위 파일의 현재 항목과 대조해 "변화가 있는 것만" 반영하세요.

# 정확성 규칙 (엄수)
- 반드시 서로 다른 언론사 2곳 이상으로 교차검증된 사실만 반영. 날짜·구형량·형량·결과를 추측하거나 미검증으로 적지 말 것. 모르면 적지 마세요.
- 특정 판사·검사를 단정적으로 비방하는 표현 금지. 한쪽 당사자(변호인 등) 주장은 '주장'으로 명시.
- 기존 항목을 임의 삭제하지 말 것(선고가 끝난 항목도 결과를 갱신해 유지). 새 항목 추가 또는 기존 항목 갱신만.

# 스키마 (기존 항목과 동일하게)
각 이벤트 객체: { id, date('YYYY-MM-DD' 또는 null), approxLabel?(date가 null일 때), time?, category, group, title, defendant, court, judge, room?, note, source:{ name, url } }
- category 는 다음 중 하나만: 'hearing'(공판기일) | 'verdict'(선고기일) | 'appeal'(항소심) | 'warrant'(영장·구속심사) | 'investigation'(수사·소환)
- group 은 다음 중 하나만: 'insurrection'(12·3 내란) | 'fabrication'(검찰 조작 의혹·정치사건) | 'political'(권력형 비리·정치 재판)
- note 는 검증된 사실 요약. source 는 신뢰 가능한 언론사명+URL 1개(본문에 2곳 이상 교차검증했더라도 source 필드는 대표 1곳).

# 출력 형식 (정확히 지킬 것)
검색·검토 후, 마지막 답변은 아래 형식만 출력하세요(설명 문장 금지):

- 변경이 없으면:
STATUS: NO_CHANGES

- 변경이 있으면:
STATUS: CHANGES
<summary>
(한국어 마크다운. 변경 항목별로 '사건명: 이전→이후 (출처 언론사명+URL)' 한 줄씩)
</summary>
<file>
(갱신된 trialSchedule.js 전체 내용. 기존 항목을 그대로 보존하고 변경/추가분만 반영. import/export/EVENT_CATEGORIES/CASE_GROUPS 등 구조를 100% 유지. 코드 외 설명·마크다운 펜스 금지)
</file>

# 현재 파일 내용
\`\`\`javascript
${currentFile}
\`\`\``;

const headers = {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
};

// 서버측 웹검색 루프는 pause_turn 으로 끊길 수 있어 이어서 호출한다.
async function callClaude() {
    const messages = [{ role: 'user', content: PROMPT }];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15 * 60 * 1000); // 15분 백스톱
    try {
        for (let i = 0; i < 8; i++) {
            const body = {
                model: MODEL,
                max_tokens: 24000,
                thinking: { type: 'adaptive' },
                tools: [{ type: 'web_search_20260209', name: 'web_search' }],
                messages,
            };
            const res = await fetch(API_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Anthropic API ${res.status}: ${text.slice(0, 800)}`);
            }
            const data = await res.json();
            messages.push({ role: 'assistant', content: data.content });

            if (data.stop_reason === 'pause_turn') continue; // 서버 도구 루프 계속
            if (data.stop_reason === 'refusal') throw new Error('모델이 요청을 거부(refusal)');
            if (data.stop_reason === 'max_tokens') throw new Error('출력이 max_tokens로 잘림 — 안전하게 중단');

            const finalText = (data.content || [])
                .filter((b) => b.type === 'text')
                .map((b) => b.text)
                .join('');
            return finalText;
        }
        throw new Error('pause_turn 연속 한도 초과');
    } finally {
        clearTimeout(timer);
    }
}

function extract(tag, text) {
    const m = text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    return m ? m[1].trim() : null;
}

function countIds(s) {
    return (s.match(/\bid:\s*['"]/g) || []).length;
}

try {
    const out = await callClaude();

    if (/STATUS:\s*NO_CHANGES/.test(out)) {
        finishNoChange('모델 판단: 오늘 재판 일정 변화 없음');
    }
    if (!/STATUS:\s*CHANGES/.test(out)) {
        finishNoChange(`출력에서 STATUS를 찾지 못함(형식 이탈). 앞부분: ${out.slice(0, 200)}`);
    }

    const summary = extract('summary', out) || '(요약 없음)';
    let newFile = extract('file', out);
    if (!newFile) finishNoChange('<file> 블록을 찾지 못함');

    // 코드펜스가 섞여 들어온 경우 제거
    newFile = newFile.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim() + '\n';

    // 안전 가드: 구조 앵커, 항목 수, 길이 (삭제·붕괴 방지)
    const anchorsOk = newFile.includes('EVENT_CATEGORIES') && newFile.includes('CASE_GROUPS') && newFile.includes('export');
    const idsOld = countIds(currentFile);
    const idsNew = countIds(newFile);
    const lenOk = newFile.length >= currentFile.length * 0.7;
    if (!anchorsOk || idsNew < idsOld || !lenOk) {
        finishNoChange(`안전 가드 실패 — anchors:${anchorsOk} ids:${idsOld}->${idsNew} len:${currentFile.length}->${newFile.length}. 자동 적용 거부(수동 확인 필요).`);
    }

    if (newFile.trim() === currentFile.trim()) {
        finishNoChange('생성 결과가 현재 파일과 동일');
    }

    writeFileSync(TRIAL_FILE, newFile, 'utf8');
    writeFileSync(
        SUMMARY_FILE,
        `## 🤖 재판 일정 자동 갱신 (검토 필요)\n\n` +
        `Claude(${MODEL}) + 웹검색으로 교차검증한 **초안**입니다. 사실관계·출처를 확인 후 머지하세요.\n\n` +
        `### 변경 요약\n${summary}\n\n` +
        `> ⚠️ 이 PR은 자동 생성된 초안입니다. 법률 정보 정확성은 사람이 최종 확인해야 합니다.\n`,
        'utf8'
    );
    console.log('[auto-trial-update] 변경 감지 — 파일 갱신 및 요약 작성 완료');
    setOutput('changed', 'true');
    process.exit(0);
} catch (err) {
    console.error('[auto-trial-update] 오류:', err && err.message ? err.message : err);
    process.exit(1);
}
