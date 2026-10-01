// 표지 HTML → PNG + JPG (리눅스·원격 세션용). render_still.mjs 는 윈도우 경로를 쓴다.
// 사용: CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/blog-covers/render_still_linux.mjs <html> <out.png> [width=1200] [height=900]
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import ffmpegPath from 'ffmpeg-static';

const [html, out, wArg, hArg] = process.argv.slice(2);
const W = Number(wArg || 1200), H = Number(hArg || 900);
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--font-render-hinting=none', '--allow-file-access-from-files'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.resolve(html)).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: out, type: 'png' });
} finally { await browser.close(); }
const jpg = out.replace(/\.png$/, '.jpg');
spawnSync(ffmpegPath, ['-y', '-loglevel', 'error', '-i', out, '-q:v', '3', jpg], { stdio: 'inherit' });
console.log('saved', out, 'and', jpg);
