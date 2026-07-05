// 재판 일정 OG 공유 이미지 자동 생성기 (빌드 시점 실행 · 런타임 비용 0)
//
// src/data/trialSchedule.js 의 TRIAL_EVENTS 데이터로 1200x630 PNG 를 생성한다.
// 다가오는 재판 최대 5건을 렌더 → public/og-trial-schedule.png 로 저장.
// npm run build 시 prebuild 훅으로 자동 실행되어, 일정 변경이 공유 카드에 자동 반영된다.
//
// 렌더러: @resvg/resvg-js (네이티브, Windows/Linux prebuilt). SVG 문자열 → PNG.
// 한글 폰트: scripts/fonts/Pretendard-*.otf (번들). 없으면 시스템 폰트(Malgun Gothic) fallback.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { TRIAL_EVENTS, EVENT_CATEGORIES } from '../src/data/trialSchedule.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const OUT_PATH = join(REPO_ROOT, 'public', 'og-trial-schedule.png');

const WIDTH = 1200;
const HEIGHT = 630;

// ── 카테고리별 색상(SVG용 hex; 데이터의 tailwind dot 클래스에 대응) ──────────
const CATEGORY_COLORS = {
    hearing: '#3b82f6',       // blue-500  (공판기일)
    verdict: '#ef4444',       // red-500   (선고기일)
    appeal: '#a855f7',        // purple-500(항소심)
    warrant: '#f59e0b',       // amber-500 (영장·구속심사)
    investigation: '#6366f1', // indigo-500(수사·소환)
};
const DEFAULT_DOT = '#64748b'; // slate-500

// ── XML/HTML 이스케이프 (동적 텍스트 안전) ─────────────────────────────────
function esc(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// 표시 폭 기준(한글=2, 그 외=1)으로 잘라 말줄임 처리 → 오버플로 방지
function truncate(str, maxUnits) {
    const s = String(str ?? '').trim();
    let units = 0;
    let out = '';
    for (const ch of s) {
        const w = /[ᄀ-ᇿ㄰-㆏가-힣　-〿＀-￯]/.test(ch) ? 2 : 1;
        if (units + w > maxUnits) {
            return out + '…';
        }
        units += w;
        out += ch;
    }
    return out;
}

// 'YYYY-MM-DD' → Date (로컬 자정). 잘못된 값이면 null.
function parseDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(d.getTime()) ? null : d;
}

// M.D 포맷 (예: 2026-07-09 → '7.9')
function formatMD(d) {
    return `${d.getMonth() + 1}.${d.getDate()}`;
}

// ── 표시할 이벤트 선택 ────────────────────────────────────────────────────
// 유효한 날짜가 있는 이벤트만 → 오름차순 정렬 → 오늘(자정) 이후 최대 5건.
// 미래 이벤트가 5건 미만이면 최근 과거 이벤트로 채워 항상 ~5건 확보.
function selectEvents(events) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dated = events
        .map((e) => ({ e, d: parseDate(e.date) }))
        .filter((x) => x.d !== null);

    const future = dated
        .filter((x) => x.d.getTime() >= today.getTime())
        .sort((a, b) => a.d.getTime() - b.d.getTime()); // 가까운 미래 먼저

    let picked = future.slice(0, 5);

    if (picked.length < 5) {
        const past = dated
            .filter((x) => x.d.getTime() < today.getTime())
            .sort((a, b) => b.d.getTime() - a.d.getTime()); // 최근 과거 먼저
        for (const p of past) {
            if (picked.length >= 5) break;
            picked.push(p);
        }
        // 최종적으로 날짜 오름차순으로 표시(읽기 자연스럽게)
        picked.sort((a, b) => a.d.getTime() - b.d.getTime());
    }

    return picked.map(({ e, d }) => {
        const cat = EVENT_CATEGORIES[e.category] || {};
        const label = cat.label || '재판';
        const color = CATEGORY_COLORS[e.category] || DEFAULT_DOT;
        const who = e.defendant && String(e.defendant).trim()
            ? e.defendant
            : (e.title || '');
        return {
            md: formatMD(d),
            label,
            color,
            text: truncate(who, 40), // 표시 폭 40단위(한글 ~20자) 이내
        };
    });
}

// ── SVG 빌드 ──────────────────────────────────────────────────────────────
function buildSvg(rows) {
    const PAD_X = 72;
    const listTop = 232;      // 헤더/룰 아래 목록 시작 y
    const rowH = 66;          // 행 높이

    const rowSvg = rows
        .map((r, i) => {
            const y = listTop + i * rowH;      // 행 상단
            const cy = y + rowH / 2;           // 행 수직 중앙
            const badgeW = 118;
            const badgeH = 44;
            const badgeX = PAD_X;
            const badgeY = cy - badgeH / 2;
            // 날짜(볼드) x 위치
            const dateX = badgeX + badgeW + 28;
            // 날짜 텍스트 최대폭 예약 후 본문 텍스트 x
            const textX = dateX + 96;
            return `
    <g>
      <rect x="${badgeX}" y="${badgeY.toFixed(1)}" width="${badgeW}" height="${badgeH}" rx="12"
            fill="${r.color}" fill-opacity="0.12" />
      <circle cx="${badgeX + 24}" cy="${cy.toFixed(1)}" r="7" fill="${r.color}" />
      <text x="${badgeX + 42}" y="${(cy + 10).toFixed(1)}" font-size="26" font-weight="700"
            fill="${r.color}">${esc(r.label)}</text>
      <text x="${dateX}" y="${(cy + 11).toFixed(1)}" font-size="34" font-weight="800"
            fill="#0f172a">${esc(r.md)}</text>
      <text x="${textX}" y="${(cy + 11).toFixed(1)}" font-size="34" font-weight="600"
            fill="#1e293b">${esc(r.text)}</text>
    </g>`;
        })
        .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}"
     xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, 'Malgun Gothic', sans-serif">
  <defs>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#1d4ed8" />
      <stop offset="0.5" stop-color="#4f46e5" />
      <stop offset="1" stop-color="#7c3aed" />
    </linearGradient>
  </defs>

  <!-- 배경 -->
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="#f8fafc" />
  <!-- 상단 액센트 바 -->
  <rect x="0" y="0" width="${WIDTH}" height="12" fill="url(#accent)" />

  <!-- 헤더 -->
  <text x="${PAD_X}" y="112" font-size="48" font-weight="800" fill="#0f172a">⚖️ 재판 일정 — 시민법정</text>
  <text x="${WIDTH - PAD_X}" y="110" font-size="24" font-weight="600" fill="#64748b" text-anchor="end">시민법정.kr</text>

  <!-- 구분선 -->
  <line x1="${PAD_X}" y1="152" x2="${WIDTH - PAD_X}" y2="152" stroke="#e2e8f0" stroke-width="2" />
  <text x="${PAD_X}" y="196" font-size="26" font-weight="600" fill="#475569">다가오는 주요 기일</text>
${rowSvg}

  <!-- 하단 구분선 + 푸터 -->
  <line x1="${PAD_X}" y1="${HEIGHT - 78}" x2="${WIDTH - PAD_X}" y2="${HEIGHT - 78}" stroke="#e2e8f0" stroke-width="2" />
  <text x="${PAD_X}" y="${HEIGHT - 38}" font-size="22" font-weight="500" fill="#64748b">공개 보도·법원 기록 기반 · 추측 배제</text>
</svg>`;
}

// ── 폰트 옵션 구성 ────────────────────────────────────────────────────────
function buildFontOption() {
    const regular = join(__dirname, 'fonts', 'Pretendard-Regular.otf');
    const bold = join(__dirname, 'fonts', 'Pretendard-Bold.otf');
    const bundledKr = join(REPO_ROOT, 'public', 'fonts', 'INPILL+HCRBatang.ttf');

    const fontFiles = [regular, bold, bundledKr].filter((p) => existsSync(p));

    if (fontFiles.length > 0) {
        return {
            font: {
                fontFiles,
                loadSystemFonts: false,      // 빌드 재현성: 번들 폰트만 사용
                defaultFontFamily: 'Pretendard',
            },
            source: `bundled: ${fontFiles.map((p) => p.replace(REPO_ROOT + '\\', '').replace(REPO_ROOT + '/', '')).join(', ')}`,
        };
    }

    // Fallback: 시스템 폰트 (Windows 빌드 머신의 Malgun Gothic)
    return {
        font: {
            loadSystemFonts: true,
            defaultFontFamily: 'Malgun Gothic',
        },
        source: 'system-font fallback (Malgun Gothic)',
    };
}

// ── 메인 ──────────────────────────────────────────────────────────────────
function main() {
    const rows = selectEvents(TRIAL_EVENTS);
    if (rows.length === 0) {
        console.warn('[gen-og] 표시할 이벤트가 없습니다. 빈 카드로 생성합니다.');
    }

    const svg = buildSvg(rows);
    const { font, source } = buildFontOption();

    const resvg = new Resvg(svg, {
        fitTo: { mode: 'width', value: WIDTH },
        font,
        background: '#f8fafc',
    });
    const png = resvg.render().asPng();
    writeFileSync(OUT_PATH, png);

    console.log(`[gen-og] wrote ${OUT_PATH}`);
    console.log(`[gen-og] events rendered: ${rows.length} (font: ${source})`);
    for (const r of rows) {
        console.log(`   - ${r.md}  [${r.label}]  ${r.text}`);
    }
}

main();
