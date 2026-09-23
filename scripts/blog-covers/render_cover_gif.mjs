// 표지 애니메이션 HTML → 프레임 PNG → 애니메이션 GIF (+ 마지막 프레임 PNG 포스터)
// 사용: node render_cover_gif.mjs <html> <out.gif> [durationSec=9.5] [fps=12]
import { createRequire } from 'node:module';
const puppeteer = createRequire('C:/Users/lacoi/Desktop/hybrid-jury-system/package.json')('puppeteer-core');
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [html, outGif, durArg, fpsArg] = process.argv.slice(2);
const DUR = Number(durArg || 9.5), FPS = Number(fpsArg || 12);
const FF = 'C:/Users/lacoi/Desktop/hybrid-jury-system/node_modules/ffmpeg-static/ffmpeg.exe';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const frameDir = path.join(path.dirname(outGif), 'frames_cover');
fs.rmSync(frameDir, { recursive: true, force: true });
fs.mkdirSync(frameDir, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--force-device-scale-factor=1', '--hide-scrollbars', '--font-render-hinting=none', '--disable-gpu'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(html).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await new Promise(r => setTimeout(r, 400));
  const n = Math.round(DUR * FPS);
  for (let i = 0; i < n; i++) {
    const t = i / FPS;
    const count = await page.evaluate((t) => window.seek(t), t);
    if (i === 0) console.log('animations:', count);
    await page.screenshot({ path: path.join(frameDir, `f_${String(i).padStart(4, '0')}.png`), type: 'png' });
  }
  console.log('frames:', n);
} finally { await browser.close(); }

// 마지막 프레임을 포스터로
fs.copyFileSync(path.join(frameDir, `f_${String(Math.round(DUR * FPS) - 1).padStart(4, '0')}.png`), outGif.replace(/\.gif$/, '_poster.png'));

// GIF: 팔레트 생성 → 적용. 마지막 프레임을 1.5초 더 잡아 루프 전에 멈춰 보이게 한다.
const vf = `fps=${FPS},split[s0][s1];[s0]palettegen=max_colors=160:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`;
const r = spawnSync(FF, ['-y', '-framerate', String(FPS), '-i', path.join(frameDir, 'f_%04d.png'), '-vf', vf, '-loop', '0', outGif], { stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status);
// 마지막 프레임 지연: ffmpeg 로 tpad 하면 프레임 수가 늘어 용량이 커지므로 별도 처리 없이 둔다(아래 mp4 도 함께 생성)
const mp4 = outGif.replace(/\.gif$/, '.mp4');
spawnSync(FF, ['-y', '-framerate', String(FPS), '-i', path.join(frameDir, 'f_%04d.png'), '-vf', `tpad=stop_mode=clone:stop_duration=1.5,format=yuv420p`, '-c:v', 'libx264', '-crf', '20', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
console.log('GIF bytes:', fs.statSync(outGif).size, 'MP4 bytes:', fs.statSync(mp4).size);
