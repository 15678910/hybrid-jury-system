// 표지 HTML → 정지 이미지(PNG, 선택적으로 JPG). 사용: node render_still.mjs <html> <out.png> [width=1200] [height=896]
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const puppeteer = createRequire('C:/Users/lacoi/Desktop/hybrid-jury-system/package.json')('puppeteer-core');
const [html, out, wArg, hArg] = process.argv.slice(2);
const W = Number(wArg || 1200), H = Number(hArg || 896);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--force-device-scale-factor=1', '--hide-scrollbars', '--font-render-hinting=none', '--allow-file-access-from-files'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(html).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: out, type: 'png' });
} finally { await browser.close(); }
// JPG 도 함께(카카오·SNS 미리보기 호환, 용량 절감)
const FF = 'C:/Users/lacoi/Desktop/hybrid-jury-system/node_modules/ffmpeg-static/ffmpeg.exe';
spawnSync(FF, ['-y', '-loglevel', 'error', '-i', out, '-q:v', '3', out.replace(/\.png$/, '.jpg')], { stdio: 'inherit' });
console.log('saved', out, 'and', out.replace(/\.png$/, '.jpg'));
