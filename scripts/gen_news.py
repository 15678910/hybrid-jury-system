# 카드뉴스 → AI 개벽뉴스 (세로 1080×1920, AI 음성 낭독 + 자막 + 음악 베드)
#
# 사용: python scripts/gen_news.py --slug investigation-rules-2026 [--music public/music.mp3]
#         [--engine edge|elevenlabs] [--out reels/<slug>-news.mp4]
#
# 대본: scripts/news-scripts/<slug>.json
#   { title, series, voice, rate, engine, elevenVoiceId, elevenModel, segments:[{img, text}] }
#   각 세그먼트마다 AI 음성을 만들고, 그 길이만큼 해당 카드 이미지를 보여 준다.
#   자막(낭독문)은 Pillow 로 프레임에 구워 넣으므로 ffmpeg 자막 필터가 필요 없다.
#
# 음성 엔진:
#   edge       — edge-tts(마이크로소프트 신경망, 온라인·무료). 기본값.
#   elevenlabs — ElevenLabs(더 자연스러운 발음, 유료). API 키가 필요하다.
#                ⚠️ 키는 환경변수 ELEVENLABS_API_KEY 로만 읽는다 — 코드·대본에 절대 적지 말 것.
#                   PowerShell 한 세션: $env:ELEVENLABS_API_KEY="발급받은키"  (닫으면 사라짐)
#                   또는 functions/.env 에 ELEVENLABS_API_KEY=... (이미 gitignore).
#                voice_id 는 대본의 elevenVoiceId 또는 --eleven-voice 로 준다(ElevenLabs 계정에서 확인).
# 음악: --music 이 있으면 낭독 아래에 -20dB 로 깔고 시작/끝 페이드.
# 렌더: 세그먼트 이미지 concat(각자 제 길이) → 무음 영상 → 음성+음악 mux.
import argparse, asyncio, json, os, subprocess, sys, tempfile, urllib.request, urllib.error
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import edge_tts

try:
    sys.stdout.reconfigure(encoding='utf-8')  # ≈·한글 print 가 cp949 에서 깨지지 않게
except Exception:
    pass

def load_env_file(p):
    # functions/.env 등에서 KEY=VALUE 를 읽어 os.environ 에 없으면 채운다(키를 코드에 두지 않기 위함).
    try:
        for line in Path(p).read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    except Exception:
        pass

def tts_polly(text, path, voice, poly_engine, rate):
    # AWS Polly (신경망 한국어 Seoyeon). SSML 로 속도·억양 제어.
    # 자격증명은 표준 AWS 방식으로만 읽는다(코드에 두지 않는다):
    #   환경변수 AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_DEFAULT_REGION,
    #   또는 ~/.aws/credentials.  채팅에 키를 붙여넣지 말 것.
    try:
        import boto3  # pip install boto3
    except ImportError:
        sys.exit('boto3 가 없다. pip install boto3 후 AWS 자격증명을 환경변수로 설정해라(키를 채팅에 넣지 말 것).')
    region = os.environ.get('AWS_DEFAULT_REGION') or os.environ.get('AWS_REGION') or 'ap-northeast-2'
    try:
        client = boto3.client('polly', region_name=region)
        pct = 100 + int(str(rate).replace('%', '').replace('+', '') or 0)
        esc = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        ssml = f'<speak><prosody rate="{pct}%">{esc}</prosody></speak>'
        r = client.synthesize_speech(Text=ssml, TextType='ssml', OutputFormat='mp3',
                                     VoiceId=voice, Engine=poly_engine)
        Path(path).write_bytes(r['AudioStream'].read())
    except Exception as e:
        sys.exit(f'Polly 오류: {e}\n자격증명·리전(현재 {region})·음성({voice}) 을 확인해라.')

def tts_elevenlabs(text, path, voice_id, model):
    key = os.environ.get('ELEVENLABS_API_KEY')
    if not key:
        sys.exit('ELEVENLABS_API_KEY 가 없다. 환경변수나 functions/.env 에 넣어라(채팅에 붙여넣지 말 것).')
    if not voice_id:
        sys.exit('elevenVoiceId 가 없다. 대본 JSON 의 elevenVoiceId 또는 --eleven-voice 로 지정해라.')
    body = json.dumps({
        'text': text,
        'model_id': model,
        'voice_settings': {'stability': 0.4, 'similarity_boost': 0.8, 'style': 0.15, 'use_speaker_boost': True},
    }).encode('utf-8')
    url = f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128'
    req = urllib.request.Request(url, data=body, method='POST', headers={
        'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            Path(path).write_bytes(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f'ElevenLabs 오류 {e.code}: {e.read().decode("utf-8","replace")[:300]}')

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
ap.add_argument('--engine', choices=['edge', 'elevenlabs', 'polly'])
ap.add_argument('--eleven-voice')
ap.add_argument('--voice-dir', help='세그먼트별 음성 파일(1.mp3..N.mp3)이 든 폴더. speakclone 등에서 받은 음성을 쓸 때.')
A = ap.parse_args()
if not FFMPEG.exists():
    sys.exit(f'ffmpeg 없음: {FFMPEG}')
load_env_file(ROOT / 'functions' / '.env')  # ELEVENLABS_API_KEY 를 여기서도 읽는다
spec = json.loads((ROOT / 'scripts' / 'news-scripts' / f'{A.slug}.json').read_text(encoding='utf-8'))
segs = spec['segments']
TITLE = spec.get('title', 'AI 1분 개벽뉴스')
voice = spec.get('voice', 'ko-KR-InJoonNeural')
rate = spec.get('rate', '+0%')
engine = A.engine or spec.get('engine', 'edge')
eleven_voice = A.eleven_voice or spec.get('elevenVoiceId')
eleven_model = spec.get('elevenModel', 'eleven_multilingual_v2')
polly_voice = spec.get('pollyVoice', 'Seoyeon')
polly_engine = spec.get('pollyEngine', 'neural')
out = Path(A.out) if A.out else ROOT / 'reels' / f'{A.slug}-news.mp4'
out = out if out.is_absolute() else ROOT / out

def font(w, s):
    p = FONTS / f'notokr-{w}.ttf'
    if not p.exists():
        sys.exit(f'폰트 없음: {p}')
    return ImageFont.truetype(str(p), s)

# 제목 배지 서체 — 대본 JSON 의 titleFont(scripts/fonts/ 기준 파일명) 또는 기본 레트로체.
_TITLE_FONT_FILE = spec.get('titleFont', 'blackhansans.ttf')
def title_font(s):
    p = FONTS / _TITLE_FONT_FILE
    return ImageFont.truetype(str(p), s) if p.exists() else font(900, s)

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
    # 상단: 개벽늬우스 배지(레트로 서체) + 시리즈 (상단 안전영역 아래)
    f_badge = title_font(46)
    badge = TITLE; bw = d.textlength(badge, font=f_badge) + 48
    roundrect(d, (40, 196, 40 + bw, 274), 14, fill=RED)
    d.text((64, 206), badge, font=f_badge, fill=(255, 255, 255))
    # 진행 점 (오른쪽)
    dotx = W - 40 - total * 26
    for i in range(total):
        on = i == idx
        d.ellipse((dotx + i * 26, 227, dotx + i * 26 + 16, 243), fill=(RED if on else (90, 105, 122)))
    # 시리즈 — 배지 아래 줄 (겹침 방지)
    d.text((44, 292), spec.get('series', ''), font=font(700, 30), fill=MUTED)
    # 카드 이미지 (그림자 + 둥근 모서리)
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((CARD_X, CARD_Y + 16, CARD_X + CARD_W, CARD_Y + CARD_H + 16), radius=22, fill=(0, 0, 0, 120))
    img.paste(sh.filter(ImageFilter.GaussianBlur(20)), (0, 0), sh.filter(ImageFilter.GaussianBlur(20)))
    card = Image.open(ROOT / 'public' / 'cardnews' / A.slug / f"{seg['img']}.png").convert('RGB').resize((CARD_W, CARD_H), Image.LANCZOS)
    mask = Image.new('L', (CARD_W, CARD_H), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, CARD_W - 1, CARD_H - 1), radius=22, fill=255)
    img.paste(card, (CARD_X, CARD_Y), mask)
    # 자막(낭독문) — 카드 아래, 하단 안전영역 위. 릴스 제목과 같은 크기(62px·900).
    f_cap = font(900, 62)
    lines = wrap(d, seg['text'], f_cap, W - 90, 4)
    y = 1390
    for ln in lines:
        d.text((45, y), ln, font=f_cap, fill=INK); y += 76
    # 하단 안내
    d.text((55, 1770), '전체 카드·조문 원문 → 시민법정.kr/cardnews', font=font(400, 28), fill=MUTED)
    return img

# ── 세그먼트별 TTS + 프레임 ───────────────────────────────────────────
tmp = Path(tempfile.mkdtemp(prefix='news-'))
voice_dir = Path(A.voice_dir) if A.voice_dir else None
if voice_dir and not voice_dir.is_absolute():
    voice_dir = ROOT / voice_dir
if voice_dir:
    print(f'음성: 폴더 사용 {voice_dir} (세그먼트별 1.mp3..{len(segs)}.mp3)')
else:
    _info = {'elevenlabs': f'(voice {eleven_voice}, {eleven_model})',
             'polly': f'(Polly {polly_voice}/{polly_engine}, rate {rate})'}.get(engine, f'({voice}, rate {rate})')
    print(f'음성 엔진: {engine} {_info}')

def synth(text, path, i):
    if voice_dir:
        import shutil
        for ext in ('mp3', 'wav', 'm4a'):
            src = voice_dir / f'{i+1}.{ext}'
            if src.exists():
                shutil.copy(src, path); return
        sys.exit(f'음성 파일 없음: {voice_dir}/{i+1}.mp3 (세그먼트마다 1.mp3..{len(segs)}.mp3 이 있어야 한다)')
    elif engine == 'elevenlabs':
        tts_elevenlabs(text, path, eleven_voice, eleven_model)
    elif engine == 'polly':
        tts_polly(text, path, polly_voice, polly_engine, rate)
    else:
        asyncio.run(edge_tts.Communicate(text, voice, rate=rate).save(str(path)))

def dur(path):
    r = subprocess.run([str(FFMPEG), '-i', str(path)], capture_output=True, text=True, encoding='utf-8', errors='replace')
    import re
    m = re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)', r.stderr)
    h, mi, s = m.groups(); return int(h) * 3600 + int(mi) * 60 + float(s)

auds, frames, durs = [], [], []
total = len(segs)
for i, seg in enumerate(segs):
    ap_ = tmp / f'a{i}.mp3'
    synth(seg['text'], ap_, i)
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
