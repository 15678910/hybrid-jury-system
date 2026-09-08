# 세로 영상 끝에 「전체 보기」 종료 카드(QR + 주소)를 붙인다 — 숏츠·릴스에서 사이트 유입용.
#
# 사용: python scripts/append_endcard.py --in reels/x.mp4 --slug <slug> --out public/cardnews/<slug>/x.mp4 [--music public/music.mp3]
#
# 영상 픽셀은 SNS 에서 클릭되지 않으므로, 끝 3초에 QR 과 주소(시민법정.kr/cardnews/<slug>)를 크게 띄워
# 보는 사람이 찍거나 입력해 들어오게 한다. QR 은 스캔 호환을 위해 punycode ASCII URL 을 담는다.
import argparse, os, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import qrcode

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = ROOT / 'node_modules' / 'ffmpeg-static' / ('ffmpeg.exe' if os.name == 'nt' else 'ffmpeg')
FONTS = ROOT / 'scripts' / 'fonts'
PUNY_ORIGIN = 'https://xn--lg3b0kt4n41f.kr'   # 시민법정.kr
NAVY, NAVY_D, RED, INK, MUTED = (31, 59, 87), (12, 26, 43), (200, 40, 40), (244, 247, 250), (183, 199, 214)

ap = argparse.ArgumentParser()
ap.add_argument('--in', dest='inp', required=True)
ap.add_argument('--slug', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--music')
ap.add_argument('--seconds', type=float, default=3.0)
A = ap.parse_args()
if not FFMPEG.exists():
    sys.exit(f'ffmpeg 없음: {FFMPEG}')
inp = Path(A.inp) if Path(A.inp).is_absolute() else ROOT / A.inp
out = Path(A.out) if Path(A.out).is_absolute() else ROOT / A.out

def probe_wh(p):
    r = subprocess.run([str(FFMPEG), '-i', str(p)], capture_output=True, text=True, encoding='utf-8', errors='replace')
    import re
    m = re.search(r'(\d{2,4})x(\d{2,4})', r.stderr)
    return (int(m.group(1)), int(m.group(2))) if m else (720, 1280)

W, H = probe_wh(inp)
def font(name, s):
    p = FONTS / name
    return ImageFont.truetype(str(p), s)

def title_font(s):
    p = FONTS / 'blackhansans.ttf'
    return ImageFont.truetype(str(p), s) if p.exists() else font('notokr-900.ttf', s)

# ── 종료 카드 이미지 ───────────────────────────────────────────────────
url_puny = f'{PUNY_ORIGIN}/cardnews/{A.slug}'
img = Image.new('RGB', (W, H))
px = img.load()
for y in range(H):
    t = y / (H - 1)
    px_row = tuple(round(NAVY_D[i] + (NAVY[i] - NAVY_D[i]) * t) for i in range(3))
    for x in range(W):
        px[x, y] = px_row
d = ImageDraw.Draw(img)
def ctext(y, s, f, fill):
    w = d.textlength(s, font=f); d.text(((W - w) / 2, y), s, font=f, fill=fill)

# 배지
fb = title_font(int(W * 0.075))
badge = 'AI 1분 개벽늬우스'; bw = d.textlength(badge, font=fb)
d.rounded_rectangle(((W - bw) / 2 - 26, int(H * 0.10), (W + bw) / 2 + 26, int(H * 0.10) + fb.size + 26), 14, fill=RED)
ctext(int(H * 0.10) + 12, badge, fb, INK)
ctext(int(H * 0.185), '전체 카드 · 조문 원문 · 영상', font('notokr-700.ttf', int(W * 0.05)), MUTED)

# QR (punycode URL)
qr = qrcode.QRCode(border=2, box_size=10, error_correction=qrcode.constants.ERROR_CORRECT_M)
qr.add_data(url_puny); qr.make(fit=True)
qimg = qr.make_image(fill_color=(20, 30, 45), back_color=(255, 255, 255)).convert('RGB')
qs = int(W * 0.52); qimg = qimg.resize((qs, qs), Image.NEAREST)
qx, qy = (W - qs) // 2, int(H * 0.30)
d.rounded_rectangle((qx - 22, qy - 22, qx + qs + 22, qy + qs + 22), 24, fill=(255, 255, 255))
img.paste(qimg, (qx, qy))
ctext(qy + qs + 44, '카메라로 스캔하세요', font('notokr-700.ttf', int(W * 0.044)), MUTED)

# 주소
ctext(int(H * 0.78), '시민법정.kr', title_font(int(W * 0.085)), INK)
ctext(int(H * 0.845), f'/cardnews/{A.slug}', font('notokr-400.ttf', int(W * 0.038)), MUTED)
ctext(int(H * 0.90), '주권자사법개혁추진준비위원회', font('notokr-700.ttf', int(W * 0.036)), MUTED)

tmp = Path(tempfile.mkdtemp(prefix='endcard-'))
card = tmp / 'card.png'; img.save(card)

# ── 종료 클립(이미지 N초 + 음악 tail) ─────────────────────────────────
endclip = tmp / 'end.mp4'
args = [str(FFMPEG), '-y', '-loop', '1', '-t', str(A.seconds), '-i', str(card)]
if A.music:
    mp = Path(A.music) if Path(A.music).is_absolute() else ROOT / A.music
    args += ['-i', str(mp), '-map', '0:v', '-map', '1:a',
             '-af', f'atrim=0:{A.seconds},asetpts=PTS-STARTPTS,volume=-18dB,afade=t=out:st={max(A.seconds-1.2,0):.2f}:d=1.2']
else:
    args += ['-f', 'lavfi', '-t', str(A.seconds), '-i', 'anullsrc=r=44100:cl=stereo', '-map', '0:v', '-map', '1:a']
args += ['-r', '30', '-vf', f'scale={W}:{H},format=yuv420p,setsar=1', '-c:v', 'libx264', '-crf', '26',
         '-preset', 'medium', '-c:a', 'aac', '-b:a', '128k', '-t', str(A.seconds), str(endclip)]
r = subprocess.run(args, capture_output=True, text=True, encoding='utf-8', errors='replace')
if r.returncode != 0:
    sys.exit('종료 클립 생성 실패:\n' + '\n'.join(r.stderr.splitlines()[-15:]))

# ── 본편 + 종료 클립 concat (재인코딩) ────────────────────────────────
out.parent.mkdir(parents=True, exist_ok=True)
fc = (f'[0:v]scale={W}:{H},setsar=1,fps=30[v0];[1:v]scale={W}:{H},setsar=1,fps=30[v1];'
      f'[v0][0:a][v1][1:a]concat=n=2:v=1:a=1[v][a]')
args2 = [str(FFMPEG), '-y', '-i', str(inp), '-i', str(endclip), '-filter_complex', fc,
         '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '26', '-preset', 'medium',
         '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', str(out)]
r2 = subprocess.run(args2, capture_output=True, text=True, encoding='utf-8', errors='replace')
if r2.returncode != 0:
    sys.exit('concat 실패:\n' + '\n'.join(r2.stderr.splitlines()[-15:]))
mb = out.stat().st_size / 1048576
try:
    shown = out.relative_to(ROOT)
except ValueError:
    shown = out
print(f'완료: {shown} ({mb:.1f} MB, {W}x{H}, +{A.seconds}s 종료카드)')
