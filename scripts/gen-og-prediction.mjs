// 대법원 재판 결과 예측 OG 공유 이미지 생성기 (빌드 시점 실행 · 런타임 비용 0)
//
// public/og-prediction.png (1200x630) 를 생성한다.
//
// 이미지가 담는 뜻:
//   이 페이지의 주장은 「소수점 둘째 자리 확률」이 아니라 「구간 + 근거」다.
//   그래서 카드 한가운데에 **점 하나가 아닌 구간을 나타내는 막대**를 둔다.
//   점추정(작은 점)과 구간(넓은 띠)을 나란히 보여주면, 글을 읽지 않아도
//   무엇을 다르게 하겠다는 것인지 한눈에 전달된다.
//
// 렌더러: @resvg/resvg-js (SVG 문자열 → PNG)
// 한글 폰트: scripts/fonts/Pretendard-*.otf (번들). AI 이미지 생성기와 달리
//            한글이 정확히 렌더링된다 — OG 이미지는 텍스트가 핵심이므로 중요하다.

import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
/**
 * 두 곳에 쓴다.
 *
 * og-prediction.png — 예전 주소. functions/index.js 의 SSR 메타가 아직 이 주소를
 *   가리키고 있어(함수 배포 전까지) 내용을 최신으로 유지해야 링크 붙여넣기 미리보기가
 *   깨지지 않는다.
 *
 * og-prediction-supreme.png — 새 주소. 카카오톡·페이스북이 이미지를 30일 캐시하므로
 *   같은 주소로 내용만 바꾸면 옛 이미지가 계속 보인다. 주소를 새로 주면 캐시가 없는
 *   상태에서 시작하므로 바로 새 이미지가 뜬다. 사이트 전체 캐시 헤더를 건드리지 않고
 *   이 페이지만 갱신하는 방법이다.
 */
const OUT_PATHS = [
    join(REPO_ROOT, 'public', 'og-prediction.png'),
    join(REPO_ROOT, 'public', 'og-prediction-supreme.png'),
];

const WIDTH = 1200;
const HEIGHT = 630;

const C = {
    bg0: '#0b1220',
    bg1: '#152238',
    line: '#1e3a5f',
    text: '#f1f5f9',
    dim: '#94a3b8',
    accent: '#38bdf8',
    warn: '#fbbf24',
    bad: '#64748b',
};

function esc(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/** 하단 원칙 뱃지 */
function badge(x, y, w, label, sub) {
    return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="86" rx="12"
            fill="#0f1b2e" stroke="${C.line}" stroke-width="1.5"/>
      <text x="${x + w / 2}" y="${y + 36}" text-anchor="middle"
            font-family="Pretendard" font-weight="700" font-size="26" fill="${C.text}">${esc(label)}</text>
      <text x="${x + w / 2}" y="${y + 65}" text-anchor="middle"
            font-family="Pretendard" font-weight="400" font-size="17" fill="${C.dim}">${esc(sub)}</text>
    </g>`;
}

function buildSvg() {
    // ── 구간 막대 좌표 ──────────────────────────────────
    const barX = 96;
    const barW = 1008;
    const barY = 330;

    // 점추정(왼쪽 작은 점)과 구간(넓은 띠)의 대비
    const pointX = barX + barW * 0.30;
    const rangeX = barX + barW * 0.54;
    const rangeW = barW * 0.30;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.bg0}"/>
      <stop offset="100%" stop-color="${C.bg1}"/>
    </linearGradient>
    <linearGradient id="range" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${C.accent}" stop-opacity="0.35"/>
      <stop offset="50%" stop-color="${C.accent}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${C.accent}" stop-opacity="0.35"/>
    </linearGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${WIDTH}" height="7" fill="${C.accent}"/>

  <!-- 머리말 -->
  <text x="96" y="96" font-family="Pretendard" font-weight="700" font-size="22"
        letter-spacing="3" fill="${C.accent}">시민법정 · 주권자사법개혁추진(준)</text>

  <!-- 제목 -->
  <text x="96" y="176" font-family="Pretendard" font-weight="700" font-size="72"
        fill="${C.text}">대법원 재판 결과 예측</text>

  <!-- 부제 -->
  <text x="96" y="232" font-family="Pretendard" font-weight="400" font-size="31"
        fill="${C.dim}">확률을 팔지 않고 <tspan font-weight="700" fill="${C.text}">근거를 팝니다</tspan></text>

  <!-- ── 구간 막대: 이 카드의 핵심 은유 ───────────────── -->
  <text x="${barX}" y="${barY - 26}" font-family="Pretendard" font-weight="400"
        font-size="19" fill="${C.dim}">파기 가능성</text>

  <rect x="${barX}" y="${barY}" width="${barW}" height="14" rx="7" fill="#152a44"/>

  <!-- 점추정 — 근거보다 정밀해 보이는 숫자.
       ※ 특정인이 제시한 실제 수치를 쓰지 않는다. 공유 카드는 본문 맥락 없이
          혼자 돌아다니므로, 실제 수치를 넣으면 카드가 본문보다 세게 말하게 된다.
          본문의 입장은 「계산이 틀렸다」가 아니라 「방법을 공개하라」이다. -->
  <circle cx="${pointX}" cy="${barY + 7}" r="11" fill="${C.bad}"/>
  <text x="${pointX}" y="${barY + 52}" text-anchor="middle" font-family="Pretendard"
        font-weight="700" font-size="27" fill="${C.bad}">72.48%</text>
  <text x="${pointX}" y="${barY + 80}" text-anchor="middle" font-family="Pretendard"
        font-weight="400" font-size="18" fill="${C.bad}">근거 없는 소수점</text>

  <!-- 구간 — 우리가 내는 형태 -->
  <rect x="${rangeX}" y="${barY - 5}" width="${rangeW}" height="24" rx="12" fill="url(#range)"/>
  <text x="${rangeX + rangeW / 2}" y="${barY + 58}" text-anchor="middle" font-family="Pretendard"
        font-weight="700" font-size="34" fill="${C.accent}">60~75%</text>
  <text x="${rangeX + rangeW / 2}" y="${barY + 88}" text-anchor="middle" font-family="Pretendard"
        font-weight="400" font-size="18" fill="${C.text}">기저율·조문·표본 공개</text>

  <!-- 하단 원칙 -->
  ${badge(96, 468, 320, '기저율 공개', '숫자가 어디서 왔는가')}
  ${badge(440, 468, 320, '조문 근거', '법원조직법 제7조①')}
  ${badge(784, 468, 320, '적중률 검증', '틀린 예측도 남긴다')}

  <text x="1104" y="604" text-anchor="end" font-family="Pretendard" font-weight="400"
        font-size="18" fill="${C.dim}">시민법정.kr/prediction</text>
</svg>`;
}

function buildFontOption() {
    const regular = join(__dirname, 'fonts', 'Pretendard-Regular.otf');
    const bold = join(__dirname, 'fonts', 'Pretendard-Bold.otf');
    const fontFiles = [regular, bold].filter((p) => existsSync(p));

    if (fontFiles.length > 0) {
        return {
            font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Pretendard' },
            source: `bundled (${fontFiles.length} files)`,
        };
    }
    return {
        font: { loadSystemFonts: true, defaultFontFamily: 'Malgun Gothic' },
        source: 'system-font fallback',
    };
}

function main() {
    const svg = buildSvg();
    const { font, source } = buildFontOption();

    const resvg = new Resvg(svg, {
        fitTo: { mode: 'width', value: WIDTH },
        font,
        background: C.bg0,
    });
    const png = resvg.render().asPng();
    for (const out of OUT_PATHS) writeFileSync(out, png);

    console.log(`[gen-og-prediction] wrote ${OUT_PATHS.length} files (font: ${source})`);
}

main();
