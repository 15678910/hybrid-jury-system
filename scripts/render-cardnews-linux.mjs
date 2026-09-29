// 카드뉴스 HTML → PNG (1600×1200) — 리눅스(원격 세션)용. render-cardnews.sh 는 윈도우 Chrome 경로를 쓴다.
// 사용: CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/render-cardnews-linux.mjs <html접두어> <docs폴더명> <카드이름접두어> <public slug> <장수>
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [PRE, DOCDIR, NAME, SLUG, N] = process.argv.slice(2);
if (!N) { console.error('인자: <html접두어> <docs폴더명> <카드이름접두어> <public slug> <장수>'); process.exit(1); }
const docOut = path.join(ROOT, 'docs', 'cardnews', DOCDIR);
const pubOut = path.join(ROOT, 'public', 'cardnews', SLUG);
fs.mkdirSync(docOut, { recursive: true });
fs.mkdirSync(pubOut, { recursive: true });

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 1 });
  for (let i = 1; i <= Number(N); i++) {
    await page.goto(pathToFileURL(path.join(ROOT, 'scripts', `${PRE}${i}.html`)).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const out = path.join(docOut, `${NAME}_${i}단계.png`);
    await page.screenshot({ path: out });
    fs.copyFileSync(out, path.join(pubOut, `${i}.png`));
    console.log(path.basename(out));
  }
} finally {
  await browser.close();
}
