// 모션 그래픽 프레임 렌더러 — scripts/motion/engine.html 을 헤드리스 크롬으로 열고
// window.seek(t) 로 프레임마다 시각을 맞춘 뒤 스크린샷을 ffmpeg 에 파이프해 무음 mp4 를 만든다.
// 사용: node scripts/render_motion.mjs --spec <spec.json> --out <silent.mp4> [--fps 30] [--stills 2,30,68 --still-dir <dir>]
// 크롬은 로컬 설치본(puppeteer-core)을 쓴다. 의존성: devDependencies 의 puppeteer-core, ffmpeg-static.
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1]] : []).filter(Boolean));
if (!args.spec) { console.error('사용: --spec <json> --out <mp4> [--fps 30] [--stills 2,30,68 --still-dir <dir>]'); process.exit(2); }

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FF = path.join(ROOT, 'node_modules', 'ffmpeg-static', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
const ENGINE = path.join(ROOT, 'scripts', 'motion', 'engine.html');
const fps = Number(args.fps || 30);
const spec = JSON.parse(fs.readFileSync(args.spec, 'utf-8'));
const W = spec.width || 1080, H = spec.height || 1920;

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--force-device-scale-factor=1', '--hide-scrollbars', '--font-render-hinting=none', '--disable-gpu'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(ENGINE).href, { waitUntil: 'load' });
  await page.evaluate((s) => window.__init(s), spec);
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await new Promise(r => setTimeout(r, 600)); // 웹폰트(Noto Serif KR) 도착 여유

  if (args.stills) {
    const dir = args['still-dir'] || path.dirname(args.out || args.spec);
    fs.mkdirSync(dir, { recursive: true });
    for (const s of args.stills.split(',').map(Number)) {
      await page.evaluate((t) => window.seek(t), s);
      const p = path.join(dir, `still_${String(s).replace('.', '_')}s.png`);
      await page.screenshot({ path: p, type: 'png' });
      console.log('still', p);
    }
  } else {
    if (!args.out) throw new Error('--out 이 필요합니다');
    const total = spec.total;
    const n = Math.ceil(total * fps);
    const ff = spawn(FF, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps), args.out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      const t = i / fps;
      await page.evaluate((tt) => window.seek(tt), t);
      const buf = await page.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) await once(ff.stdin, 'drain');
      if (i % 300 === 0) console.log(`frame ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end();
    const [code] = await once(ff, 'close');
    if (code !== 0) throw new Error('ffmpeg 종료 코드 ' + code);
    console.log(`완료: ${args.out} (${n} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
} finally {
  await browser.close();
}
