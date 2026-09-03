# 카드뉴스 → 릴스·숏츠·틱톡 공용 세로 영상 (1080×1920, H.264, 60초 이하)
#
# 사용: python scripts/gen_reel.py --slug investigation-rules-2026 [--sec 7] [--audio scripts/audio/bgm.mp3] [--out reels/<slug>.mp4]
#
# 왜 Python 인가: 프레임을 그리는 데 Pillow 를 쓴다. node-canvas 는 프로젝트 의존성이 아니라
#   npm install 때마다 지워지고, 새로 넣으려면 네이티브 바이너리를 또 받아야 한다. Pillow 는 이미 있다.
#   인코딩은 npm 의 ffmpeg-static(node_modules/ffmpeg-static/ffmpeg.exe)을 부른다.
#
# 구성: 카드 한 장마다 한 장면. 위쪽에 단계 배지 + 제목(휴대폰에서 읽히는 크기),
#       가운데에 원본 카드(1600×1200 → 1000×750), 아래쪽에 자막 한 줄.
#       장면 사이는 0.6초 크로스페이드, 장면마다 1.00→1.05 느린 줌.
# 안전 영역: 인스타·유튜브·틱톡 UI 가 덮는 하단 약 300px 과 상단 180px 에는 읽어야 할 글자를 두지 않는다.
# 자막 원문: scripts/reel-captions/<slug>.json (카드 생성기의 sub 줄을 옮긴 것). 단계 제목은 src/data/cardNews.js 를 읽는다.
import argparse, json, os, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = ROOT / 'node_modules' / 'ffmpeg-static' / ('ffmpeg.exe' if os.name == 'nt' else 'ffmpeg')
FONTS = ROOT / 'scripts' / 'fonts'
W, H = 1080, 1920
CARD_W, CARD_H = 1000, 750
CARD_X, CARD_Y = (W - CARD_W) // 2, 640
NAVY, NAVY_D, AMBER, INK, MUTED = (31, 59, 87), (15, 34, 55), (245, 158, 11), (244, 247, 250), (184, 199, 214)
XF, FPS = 0.6, 30

ap = argparse.ArgumentParser()
ap.add_argument('--slug', required=True)
ap.add_argument('--sec', type=float, default=7)
ap.add_argument('--audio')
ap.add_argument('--out')
ap.add_argument('--frames-only', action='store_true', help='PNG 프레임만 만들고 인코딩은 건너뛴다 (시안 검토용)')
A = ap.parse_args()
SEC = A.sec
out = Path(A.out) if A.out else ROOT / 'reels' / f'{A.slug}.mp4'
out = out if out.is_absolute() else ROOT / out

if not FFMPEG.exists():
    sys.exit(f'ffmpeg 없음: {FFMPEG} — npm install --save-dev ffmpeg-static')

# 시리즈 데이터는 사이트가 쓰는 cardNews.js 를 그대로 읽는다 (제목이 두 곳에서 갈리지 않게).
js = "import('./src/data/cardNews.js').then(m=>process.stdout.write(JSON.stringify(m.CARD_NEWS_SERIES)))"
raw = subprocess.run(['node', '--input-type=module', '-e', js], cwd=ROOT, capture_output=True, text=True, encoding='utf-8')
if raw.returncode != 0:
    sys.exit(f'cardNews.js 읽기 실패:\n{raw.stderr}')
series = next((s for s in json.loads(raw.stdout) if s['slug'] == A.slug), None)
if not series:
    sys.exit(f'cardNews.js 에 없는 slug: {A.slug}')
cap_path = ROOT / 'scripts' / 'reel-captions' / f'{A.slug}.json'
cap = json.loads(cap_path.read_text(encoding='utf-8')) if cap_path.exists() else {'series': series['short'], 'subs': []}

def font(weight, size):
    p = FONTS / f'notokr-{weight}.ttf'
    if not p.exists():
        sys.exit(f'폰트 없음: {p} (카드 생성기와 같은 폰트가 필요하다)')
    return ImageFont.truetype(str(p), size)

def text_w(d, s, f):
    return d.textlength(s, font=f)

def wrap(d, text, f, max_w, max_lines):
    """한글은 단어 단위로 자르되(keep-all) 한 단어가 너무 길면 글자 단위로 자른다."""
    words = [w for w in __import__('re').split(r'(\s+)', text) if w]
    lines, cur = [], ''
    def push():
        nonlocal cur
        if cur.strip():
            lines.append(cur.strip())
        cur = ''
    for w in words:
        if text_w(d, cur + w, f) <= max_w:
            cur += w; continue
        if cur.strip():
            push()
        if text_w(d, w, f) <= max_w:
            cur = w; continue
        for ch in w:
            if text_w(d, cur + ch, f) > max_w:
                push()
            cur += ch
    push()
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        lines[-1] = lines[-1][:-1] + '…'
    return lines

def background():
    # 세로 그라데이션 — 카드 칩 색(navy)과 같은 계열
    img = Image.new('RGB', (W, H))
    px = img.load()
    for y in range(H):
        t = y / (H - 1)
        c = tuple(round(NAVY_D[i] + (NAVY[i] - NAVY_D[i]) * t) for i in range(3))
        for x in range(W):
            px[x, y] = c
    return img

BG = background()

def render_frame(n):
    img = BG.copy()
    d = ImageDraw.Draw(img, 'RGBA')

    # 상단 칩 (안전 영역 아래 y=200 부터)
    f30 = font(700, 30)
    chip = f"시민법정 카드뉴스  ·  {cap.get('series') or series['short']}"
    cw = text_w(d, chip, f30) + 44
    d.rounded_rectangle((40, 200, 40 + cw, 256), radius=28, fill=(255, 255, 255, 30))
    d.text((62, 208), chip, font=f30, fill=MUTED)

    # 단계 배지 + 페이지
    f44 = font(900, 44)
    badge = f'{n}단계'
    bw = text_w(d, badge, f44) + 48
    d.rounded_rectangle((40, 292, 40 + bw, 362), radius=16, fill=AMBER)
    d.text((64, 298), badge, font=f44, fill=(26, 18, 0))
    f34 = font(700, 34)
    page = f"{n} / {series['count']}"
    d.text((W - 40 - text_w(d, page, f34), 308), page, font=f34, fill=MUTED)

    # 제목 (최대 2줄, 62px)
    f62 = font(900, 62)
    for i, line in enumerate(wrap(d, series['steps'][n - 1], f62, W - 80, 2)):
        d.text((40, 392 + i * 78), line, font=f62, fill=INK)

    # 카드 이미지 — 그림자 + 둥근 모서리
    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((CARD_X, CARD_Y + 18, CARD_X + CARD_W, CARD_Y + CARD_H + 18), radius=22, fill=(0, 0, 0, 115))
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    img.paste(shadow, (0, 0), shadow)
    card = Image.open(ROOT / 'public' / 'cardnews' / A.slug / f'{n}.png').convert('RGB').resize((CARD_W, CARD_H), Image.LANCZOS)
    mask = Image.new('L', (CARD_W, CARD_H), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, CARD_W - 1, CARD_H - 1), radius=22, fill=255)
    img.paste(card, (CARD_X, CARD_Y), mask)

    # 자막 (최대 3줄, 40px) — 카드 아래, 하단 안전 영역(1620~) 위
    subs = cap.get('subs') or []
    if n - 1 < len(subs) and subs[n - 1]:
        f40 = font(700, 40)
        for i, line in enumerate(wrap(d, subs[n - 1], f40, W - 100, 3)):
            d.text((50, 1440 + i * 54), line, font=f40, fill=INK)

    # 하단 안내 (UI 에 가려도 되는 보조 정보)
    d.text((50, 1690), '전체 카드와 조문 원문  →  시민법정.kr/cardnews', font=font(400, 30), fill=MUTED)
    d.rectangle((50, 1745, W - 50, 1747), fill=(255, 255, 255, 90))
    d.text((50, 1765), '주권자사법개혁추진준비위원회', font=font(700, 28), fill=MUTED)
    return img

# ── 프레임 렌더 ──────────────────────────────────────────────────────
tmp = Path(tempfile.mkdtemp(prefix='reel-'))
frames = []
for n in range(1, series['count'] + 1):
    p = tmp / f'f{n}.png'
    render_frame(n).save(p, optimize=False)
    frames.append(p)
print(f"프레임 {len(frames)}장 → {tmp}")
out.parent.mkdir(parents=True, exist_ok=True)
(out.parent / f'{A.slug}.frames.txt').write_text('\n'.join(map(str, frames)), encoding='utf-8')
if A.frames_only:
    sys.exit(0)

# ── ffmpeg: 카드에만 느린 줌 + 크로스페이드 체인 (+ 음악) ──────────────
# 줌은 카드 이미지에만 건다. 화면 전체에 걸면 칩·제목·하단 안내 같은 고정 요소까지 커져서
# 크로스페이드 중 두 장면의 글자가 어긋나 겹쳐 보인다(첫 시안에서 확인).
# 방법: 고정 요소가 그려진 프레임(chrome) 위에, zoompan 한 카드를 둥근 모서리 마스크로 잘라 올린다.
N = len(frames)
total = N * SEC - (N - 1) * XF
D = int(SEC * FPS)
mask_p = tmp / 'mask.png'
m = Image.new('L', (CARD_W, CARD_H), 0)
ImageDraw.Draw(m).rounded_rectangle((0, 0, CARD_W - 1, CARD_H - 1), radius=22, fill=255)
m.save(mask_p)

args = [str(FFMPEG), '-y']
for n, f in enumerate(frames, start=1):
    args += ['-loop', '1', '-t', str(SEC), '-framerate', str(FPS), '-i', str(f)]               # 2(n-1)   : chrome
    args += ['-i', str(ROOT / 'public' / 'cardnews' / A.slug / f'{n}.png')]                       # 2(n-1)+1 : 카드 원본(단일 프레임)
args += ['-loop', '1', '-t', str(SEC), '-framerate', str(FPS), '-i', str(mask_p)]                # 2N       : 마스크
fc = [f"[{2*N}:v]format=gray,split={N}" + ''.join(f'[m{i}]' for i in range(N))]
for i in range(N):
    # 단일 프레임 입력에 zoompan d=D → 정확히 SEC 초 분량. 지터를 줄이려고 2배로 키운 뒤 건다.
    fc.append(f"[{2*i+1}:v]scale={CARD_W*2}:{CARD_H*2},zoompan=z='min(1+0.05*on/{D},1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={D}:s={CARD_W}x{CARD_H}:fps={FPS},format=rgba[c{i}]")
    fc.append(f'[c{i}][m{i}]alphamerge[ca{i}]')
    fc.append(f'[{2*i}:v]fps={FPS},format=rgba[b{i}]')
    fc.append(f'[b{i}][ca{i}]overlay={CARD_X}:{CARD_Y}:shortest=1,format=yuv420p,setsar=1[v{i}]')
last = 'v0'
for i in range(1, N):
    off = f'{i * SEC - i * XF:.3f}'
    name = 'vout' if i == N - 1 else f'x{i}'
    fc.append(f'[{last}][v{i}]xfade=transition=fade:duration={XF}:offset={off}[{name}]')
    last = name
if N == 1:
    fc.append('[v0]copy[vout]')
if A.audio:
    ap_ = Path(A.audio) if Path(A.audio).is_absolute() else ROOT / A.audio
    if not ap_.exists():
        sys.exit(f'음악 파일 없음: {ap_}')
    args += ['-i', str(ap_)]
    fc.append(f'[{2*N+1}:a]atrim=0:{total},asetpts=PTS-STARTPTS,volume=-12dB,afade=t=in:st=0:d=1,afade=t=out:st={total-1.5:.2f}:d=1.5[aout]')
args += ['-filter_complex', ';'.join(fc), '-map', '[vout]']
if A.audio:
    args += ['-map', '[aout]', '-c:a', 'aac', '-b:a', '160k']
args += ['-t', str(total), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
         '-movflags', '+faststart', '-r', str(FPS), str(out)]
print(f'인코딩 중… ({N}장 × {SEC}s, 전환 {XF}s → {total:.1f}s)')
r = subprocess.run(args, capture_output=True, text=True, encoding='utf-8', errors='replace')
if r.returncode != 0:
    sys.exit('ffmpeg 실패:\n' + '\n'.join(r.stderr.splitlines()[-25:]))
mb = out.stat().st_size / 1048576
print(f'완료: {out.relative_to(ROOT)} ({mb:.1f} MB, {total:.1f}s, {W}×{H})')
