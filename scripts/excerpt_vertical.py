# 가로(16:9) 해설 영상에서 구간 몇 개를 골라 이어 붙여 세로(1080×1920) 릴스용 발췌판을 만든다.
# 인스타그램 릴스는 길이 제한이 있어 12분짜리 해설편을 그대로 올릴 수 없다(2026-09-30).
#
# 사용: python scripts/excerpt_vertical.py --in public/cardnews/<slug>/explainer.mp4 \
#         --clips "0-15.2,124.0-163.8,..." --title "첫 줄\n둘째 줄" --note "전체 12분 57초 해설 → 시민법정.kr" \
#         --out reels/<이름>.mp4
#   그다음 종료카드: python scripts/append_endcard.py --in reels/<이름>.mp4 --slug <slug> --play <영상이름> ...
#   (음악·종료카드 기준은 docs/cardnews/영상_제작_기준.md)
#
# 구간 경계는 자막이 바뀌는 순간으로 잡는다 — 자막 영역만 잘라 장면 전환을 찾으면 문장 경계가 정확히 나온다:
#   ffmpeg -i <영상> -an -vf "crop=1280:130:0:560,fps=10,select='gt(scene,0.02)',showinfo" -f null - 2>&1 | grep pts_time
# 구간마다 앞뒤 0.25초 오디오 페이드로 음악이 끊기는 소리를 줄인다(마지막 구간 끝은 원본의 엔딩 스웰을 살려 페이드하지 않는다).
import argparse, os, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = ROOT / 'node_modules' / 'ffmpeg-static' / ('ffmpeg.exe' if os.name == 'nt' else 'ffmpeg')
FONTS = ROOT / 'scripts' / 'fonts'
W, H = 1080, 1920

ap = argparse.ArgumentParser()
ap.add_argument('--in', dest='inp', required=True)
ap.add_argument('--clips', required=True, help='초 단위 "시작-끝" 을 쉼표로')
ap.add_argument('--title', required=True, help='왼쪽 위 상시 제목(두 줄은 \\n)')
ap.add_argument('--note', default='', help='영상 아래 안내 한 줄')
ap.add_argument('--out', required=True)
A = ap.parse_args()

def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size)

inp = ROOT / A.inp if not Path(A.inp).is_absolute() else Path(A.inp)
out = ROOT / A.out if not Path(A.out).is_absolute() else Path(A.out)
out.parent.mkdir(parents=True, exist_ok=True)
clips = [tuple(float(x) for x in c.split('-')) for c in A.clips.split(',')]

# ── 배경(배지·상시 제목·안내) ── 모션 엔진 essay 화면과 같은 자리: 배지 왼쪽 위, 그 아래 금색 제목
bg = Image.new('RGB', (W, H), (0, 0, 0))
d = ImageDraw.Draw(bg)
bf = font('blackhansans.ttf', 32)
badge = 'AI 1분 개벽늬우스'
bw = d.textlength(badge, font=bf) + 38
d.rounded_rectangle((40, 100, 40 + bw, 156), radius=10, fill=(215, 38, 30))
d.text((40 + 19, 110), badge, font=bf, fill=(255, 255, 255))
tf = font('Pretendard-Bold.otf', 44)
y = 180
for line in A.title.replace('\\n', '\n').split('\n'):
    d.text((44, y), line, font=tf, fill=(229, 197, 102)); y += 60
vid_h = round(W * 9 / 16)            # 608
vid_y = (H - vid_h) // 2 - 20        # 가운데보다 살짝 위
if A.note:
    nf = font('Pretendard-Bold.otf', 38)
    tw = d.textlength(A.note, font=nf)
    d.text(((W - tw) / 2, vid_y + vid_h + 70), A.note, font=nf, fill=(200, 205, 214))
bgp = out.with_suffix('.bg.png'); bg.save(bgp)

# ── 구간 자르기 → 이어 붙이기 → 배경 위에 얹기 ──
parts, fc = [], []
for i, (s, e) in enumerate(clips):
    dur = e - s
    last = i == len(clips) - 1
    fade = f'afade=t=in:st=0:d=0.25' + ('' if last else f',afade=t=out:st={dur - 0.25:.3f}:d=0.25')
    fc.append(f'[0:v]trim={s}:{e},setpts=PTS-STARTPTS[v{i}];[0:a]atrim={s}:{e},asetpts=PTS-STARTPTS,{fade}[a{i}]')
    parts.append(f'[v{i}][a{i}]')
fc.append(f"{''.join(parts)}concat=n={len(clips)}:v=1:a=1[cv][ca]")
fc.append(f'[cv]scale={W}:{vid_h},setsar=1[sv];[1:v][sv]overlay=0:{vid_y}:shortest=1,format=yuv420p[ov]')
cmd = [str(FFMPEG), '-y', '-i', str(inp), '-loop', '1', '-i', str(bgp), '-filter_complex', ';'.join(fc),
       '-map', '[ov]', '-map', '[ca]', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '21',
       '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', str(out)]
r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
bgp.unlink(missing_ok=True)
if r.returncode != 0:
    sys.exit('실패:\n' + '\n'.join(r.stderr.splitlines()[-15:]))
total = sum(e - s for s, e in clips)
print(f'완료: {out} ({total:.1f}s, {W}×{H}, 구간 {len(clips)}개)')
