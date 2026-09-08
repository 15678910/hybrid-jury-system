# 카드뉴스 → 30초 AI 뉴스 (세로 1080×1920, AI 음성 낭독 + 자막 + 음악 베드)
#
# 사용: python scripts/gen_news.py --slug investigation-rules-2026 [--music public/music.mp3] [--out reels/<slug>-news.mp4]
#
# 대본: scripts/news-scripts/<slug>.json  { voice, rate, segments:[{img, text}] }
#   각 세그먼트마다 edge-tts 로 한국어 신경망 음성을 만들고, 그 길이만큼 해당 카드 이미지를 보여 준다.
#   자막(낭독문)은 Pillow 로 프레임에 구워 넣으므로 ffmpeg 자막 필터가 필요 없다.
# 음성: edge-tts(온라인, 무료). 음악: --music 이 있으면 낭독 아래에 -20dB 로 깔고 시작/끝 페이드.
# 렌더: 세그먼트 이미지 concat(각자 제 길이) → 무음 영상 → 음성+음악 mux.
import argparse, asyncio, json, os, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import edge_tts

try:
    sys.stdout.reconfigure(encoding='utf-8')  # ≈·한글 print 가 cp949 에서 깨지지 않게
except Exception:
    pass

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = ROOT / 'node_modules' / 'ffmpeg-static' / ('ffmpeg.exe' if os.name == 'nt' else 'ffmpeg')
FONTS = ROOT / 'scripts' / 'fonts'
W, H = 1080, 1920
CARD_W, CARD_H = 1000, 750
CARD_X, CARD_Y = (W - CARD_W) // 2, 560
NAVY, NAVY_D, RED, INK, MUTED = (31, 59, 87), (12, 26, 43), (200, 40, 40), (244, 247, 250), (183, 199, 214)

ap = argparse.ArgumentParser()
ap.add_argument('--slug', required=True)
ap.add_argument('--music')
ap.add_argument('--out')
ap.add_argument('--music-db', default='-20dB')
A = ap.parse_args()
if not FFMPEG.exists():
    sys.exit(f'ffmpeg 없음: {FFMPEG}')
spec = json.loads((ROOT / 'scripts' / 'news-scripts' / f'{A.slug}.json').read_text(encoding='utf-8'))
segs = spec['segments']
voice = spec.get('voice', 'ko-KR-InJoonNeural')
rate = spec.get('rate', '+0%')
out = Path(A.out) if A.out else ROOT / 'reels' / f'{A.slug}-news.mp4'
out = out if out.is_absolute() else ROOT / out

def font(w, s):
    p = FONTS / f'notokr-{w}.ttf'
    if not p.exists():
        sys.exit(f'폰트 없음: {p}')
    return ImageFont.truetype(str(p), s)

def wrap(d, text, f, max_w, max_lines):
    words = [w for w in __import__('re').split(r'(\s+)', text) if w]
    lines, cur = [], ''
    def push():
        nonlocal cur
        if cur.strip(): lines.append(cur.strip())
        cur = ''
    for w in words:
        if d.textlength(cur + w, font=f) <= max_w: cur += w; continue
        if cur.strip(): push()
        if d.textlength(w, font=f) <= max_w: cur = w; continue
        for ch in w:
            if d.textlength(cur + ch, font=f) > max_w: push()
            cur += ch
    push()
    if len(lines) > max_lines:
        lines = lines[:max_lines]; lines[-1] = lines[-1][:-1] + '…'
    return lines

def roundrect(d, xy, r, **kw):
    d.rounded_rectangle(xy, radius=r, **kw)

def bg():
    img = Image.new('RGB', (W, H)); px = img.load()
    for y in range(H):
        t = y / (H - 1)
        c = tuple(round(NAVY_D[i] + (NAVY[i] - NAVY_D[i]) * t) for i in range(3))
        for x in range(W): px[x, y] = c
    return img
BG = bg()

def frame(seg, idx, total):
    img = BG.copy(); d = ImageDraw.Draw(img, 'RGBA')
    # 상단: AI 뉴스 배지 + 시리즈 (상단 안전영역 아래)
    f_badge = font(900, 40)
    badge = 'AI 뉴스'; bw = d.textlength(badge, font=f_badge) + 44
    roundrect(d, (40, 200, 40 + bw, 268), 14, fill=RED)
    d.text((62, 208), badge, font=f_badge, fill=(255, 255, 255))
    f_ser = font(700, 30)
    d.text((40 + bw + 20, 214), spec.get('series', ''), font=f_ser, fill=MUTED)
    # 진행 점
    dotx = W - 40 - total * 26
    for i in range(total):
        on = i == idx
        d.ellipse((dotx + i * 26, 224, dotx + i * 26 + 16, 240), fill=(RED if on else (90, 105, 122)))
    # 카드 이미지 (그림자 + 둥근 모서리)
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((CARD_X, CARD_Y + 16, CARD_X + CARD_W, CARD_Y + CARD_H + 16), radius=22, fill=(0, 0, 0, 120))
    img.paste(sh.filter(ImageFilter.GaussianBlur(20)), (0, 0), sh.filter(ImageFilter.GaussianBlur(20)))
    card = Image.open(ROOT / 'public' / 'cardnews' / A.slug / f"{seg['img']}.png").convert('RGB').resize((CARD_W, CARD_H), Image.LANCZOS)
    mask = Image.new('L', (CARD_W, CARD_H), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, CARD_W - 1, CARD_H - 1), radius=22, fill=255)
    img.paste(card, (CARD_X, CARD_Y), mask)
    # 자막(낭독문) — 카드 아래, 하단 안전영역 위. 큰 글씨 최대 4줄.
    f_cap = font(900, 52)
    lines = wrap(d, seg['text'], f_cap, W - 110, 4)
    y = 1430
    for ln in lines:
        d.text((55, y), ln, font=f_cap, fill=INK); y += 66
    # 하단 안내
    d.text((55, 1770), '전체 카드·조문 원문 → 시민법정.kr/cardnews', font=font(400, 28), fill=MUTED)
    return img

# ── 세그먼트별 TTS + 프레임 ───────────────────────────────────────────
tmp = Path(tempfile.mkdtemp(prefix='news-'))
async def tts(text, path):
    await edge_tts.Communicate(text, voice, rate=rate).save(str(path))

def dur(path):
    r = subprocess.run([str(FFMPEG), '-i', str(path)], capture_output=True, text=True, encoding='utf-8', errors='replace')
    import re
    m = re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)', r.stderr)
    h, mi, s = m.groups(); return int(h) * 3600 + int(mi) * 60 + float(s)

auds, frames, durs = [], [], []
total = len(segs)
for i, seg in enumerate(segs):
    ap_ = tmp / f'a{i}.mp3'
    asyncio.run(tts(seg['text'], ap_))
    d_i = dur(ap_) + 0.15   # 문장 끝 짧은 여유
    auds.append(ap_); durs.append(d_i)
    fp = tmp / f'f{i}.png'; frame(seg, i, total).save(fp); frames.append(fp)
    print(f"세그먼트 {i+1}/{total}: {durs[i]:.2f}s")
T = sum(durs)
print(f'총 길이 ≈ {T:.1f}s')

# ── 이미지 concat(각자 제 길이) → 무음 영상 ───────────────────────────
listf = tmp / 'list.txt'
lines = []
for fp, dd in zip(frames, durs):
    lines.append(f"file '{fp.as_posix()}'"); lines.append(f"duration {dd:.3f}")
lines.append(f"file '{frames[-1].as_posix()}'")  # concat demuxer: 마지막 파일 한 번 더
listf.write_text('\n'.join(lines), encoding='utf-8')
silent = tmp / 'silent.mp4'
subprocess.run([str(FFMPEG), '-y', '-f', 'concat', '-safe', '0', '-i', str(listf),
                '-vf', 'fps=30,format=yuv420p,setsar=1', '-r', '30', str(silent)],
               capture_output=True, text=True, encoding='utf-8', errors='replace')

# ── 음성 concat ───────────────────────────────────────────────────────
avf = tmp / 'alist.txt'
avf.write_text('\n'.join(f"file '{a.as_posix()}'" for a in auds), encoding='utf-8')
voicemp3 = tmp / 'voice.mp3'
subprocess.run([str(FFMPEG), '-y', '-f', 'concat', '-safe', '0', '-i', str(avf), '-c', 'copy', str(voicemp3)],
               capture_output=True, text=True, encoding='utf-8', errors='replace')

# ── mux: 영상 + 음성 (+ 음악 베드) ────────────────────────────────────
out.parent.mkdir(parents=True, exist_ok=True)
args = [str(FFMPEG), '-y', '-i', str(silent), '-i', str(voicemp3)]
if A.music:
    mp = Path(A.music) if Path(A.music).is_absolute() else ROOT / A.music
    if not mp.exists(): sys.exit(f'음악 없음: {mp}')
    args += ['-i', str(mp)]
    fc = (f"[2:a]atrim=0:{T:.3f},asetpts=PTS-STARTPTS,volume={A.music_db},"
          f"afade=t=in:st=0:d=1,afade=t=out:st={max(T-1.5,0):.2f}:d=1.5[mus];"
          f"[1:a]volume=+2dB[v];[v][mus]amix=inputs=2:duration=first:dropout_transition=0[aout]")
    args += ['-filter_complex', fc, '-map', '0:v', '-map', '[aout]']
else:
    args += ['-map', '0:v', '-map', '1:a']
args += ['-c:v', 'libx264', '-crf', '23', '-preset', 'medium', '-pix_fmt', 'yuv420p',
         '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', str(out)]
r = subprocess.run(args, capture_output=True, text=True, encoding='utf-8', errors='replace')
if r.returncode != 0:
    sys.exit('ffmpeg mux 실패:\n' + '\n'.join(r.stderr.splitlines()[-20:]))
mb = out.stat().st_size / 1048576
print(f'완료: {out.relative_to(ROOT)} ({mb:.1f} MB, ≈{T:.1f}s, {W}×{H})')
