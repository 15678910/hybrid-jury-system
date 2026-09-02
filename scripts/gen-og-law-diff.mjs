// 수사·기소 분리 조문 분석 OG 공유 이미지 생성기 (빌드 시점 실행 · 런타임 비용 0)
//
// public/og-law-diff.png (1200x630) 를 생성한다.
//
// 이미지가 담는 뜻:
//   이 페이지가 남과 다른 지점은 「우려를 반박했다」가 아니라 「우려를 조문에
//   대 보고 결과를 그대로 적었다」는 것이다. 실제 판정은 8건 중 성립 2·부분 성립 5·
//   판단 불가 1 이고 **불성립이 하나도 없다** — 즉 제기된 우려를 기각하지 않았다.
//   그래서 카드 한가운데에 판정 분포 막대를 두어, 글을 읽지 않아도 이 분석이
//   한쪽으로 몰아가지 않았다는 것이 보이게 했다.
//
//   숫자는 전부 src/data/lawDiffs.js · lawIssues.js 의 실제 항목 수다.
//   카드는 본문 맥락 없이 혼자 돌아다니므로 지어낸 수치를 넣지 않는다.
//
// 렌더러: @resvg/resvg-js (SVG 문자열 → PNG)
// 한글 폰트: scripts/fonts/Pretendard-*.otf (번들)

import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

// 새 주소다. 카카오톡·페이스북이 이미지를 30일 캐시하므로 기존 주소를 재사용하지
// 않는다(gen-og-prediction.mjs 의 주석 참조).
const OUT_PATHS = [join(REPO_ROOT, 'public', 'og-law-diff.png')];

const WIDTH = 1200;
const HEIGHT = 630;

const C = {
    bg0: '#0b1220',
    bg1: '#152238',
    line: '#1e3a5f',
    text: '#f1f5f9',
    dim: '#94a3b8',
    accent: '#38bdf8',
    red: '#f87171',      // 성립
    amber: '#fbbf24',    // 부분 성립
    gray: '#64748b',     // 판단 불가
};

// src/data/lawIssues.js · lawDiffs.js 의 실제 집계 (2026-08-31 기준)
const VERDICTS = [
    { key: '성립', n: 2, color: C.red },
    { key: '부분 성립', n: 5, color: C.amber },
    { key: '판단 불가', n: 1, color: C.gray },
];
const TOTAL_ISSUES = VERDICTS.reduce((s, v) => s + v.n, 0); // 8

function esc(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/** 하단 집계 뱃지 */
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
    // ── 판정 분포 막대 ──────────────────────────────────
    const barX = 96;
    const barW = 1008;
    const barY = 374;
    const barH = 26;
    const gap = 6;

    let cursor = barX;
    const segs = VERDICTS.map((v, i) => {
        const w = (barW - gap * (VERDICTS.length - 1)) * (v.n / TOTAL_ISSUES);
        const x = cursor;
        cursor += w + gap;
        const rx = 13;
        const label = `
      <text x="${x + w / 2}" y="${barY - 16}" text-anchor="middle" font-family="Pretendard"
            font-weight="700" font-size="23" fill="${v.color}">${esc(v.key)} ${v.n}</text>`;
        return `${label}
      <rect x="${x}" y="${barY}" width="${w}" height="${barH}" rx="${rx}" fill="${v.color}"
            fill-opacity="${i === 2 ? 0.55 : 0.92}"/>`;
    }).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.bg0}"/>
      <stop offset="100%" stop-color="${C.bg1}"/>
    </linearGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${WIDTH}" height="7" fill="${C.accent}"/>

  <!-- 머리말 -->
  <text x="96" y="96" font-family="Pretendard" font-weight="700" font-size="22"
        letter-spacing="3" fill="${C.accent}">시민법정 · 주권자사법개혁추진준비위(준)</text>

  <!-- 제목 -->
  <text x="96" y="176" font-family="Pretendard" font-weight="700" font-size="72"
        fill="${C.text}">수사·기소 분리</text>

  <!-- 부제 -->
  <text x="96" y="232" font-family="Pretendard" font-weight="400" font-size="31"
        fill="${C.dim}">조문을 <tspan font-weight="700" fill="${C.text}">나란히 놓고</tspan> 확인합니다</text>

  <!-- ── 판정 분포: 이 카드의 핵심 ─────────────────────
       불성립(기각)이 0 건이라는 사실이 이 분석의 성격을 말해 준다. -->
  <text x="${barX}" y="${barY - 54}" font-family="Pretendard" font-weight="400"
        font-size="19" fill="${C.dim}">제기된 우려 ${TOTAL_ISSUES}건의 조문 검증 결과 — 기각(불성립) 0건</text>
  ${segs}

  <!-- 하단 집계 -->
  ${badge(96, 468, 320, '쟁점 검증', '8건 · 기각 0건')}
  ${badge(440, 468, 320, '조문 대비', '공소청법 9 · 중수청법 6')}
  ${badge(784, 468, 320, '되돌리기 방지', '지렛대 4가지')}

  <text x="1104" y="604" text-anchor="end" font-family="Pretendard" font-weight="400"
        font-size="18" fill="${C.dim}">시민법정.kr/law-diff</text>
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

    console.log(`[gen-og-law-diff] wrote ${OUT_PATHS.length} files (font: ${source})`);
}

main();
