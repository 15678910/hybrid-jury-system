#!/usr/bin/env python
# AI 1분 개벽늬우스 — 모션 그래픽판 생성기.
# 사용: python scripts/gen_motion_news.py --slug future-fund-key-2026 --voice-dir scripts/audio/news-fund --music public/music.mp3
#       [--gap 0.8] [--fps 30] [--out reels/<slug>-motion.mp4] [--stills 2,30,68]
# 흐름: 대본(scripts/news-scripts/<slug>.json) + 장면(scripts/motion-scenes/<slug>.json) + 문장별 음성
#   → 문장 뒤 무음(gap) 붙여 WAV 통일 → 길이로 타임라인 → node scripts/render_motion.mjs (헤드리스 크롬 프레임 → 무음 mp4)
#   → 음성 concat + 음악 베드 mux. 화면 시간과 음성 길이가 같은 값이라 끝까지 어긋나지 않는다.
# 음성 엔진: --voice-dir(문장별 1.mp3..N.mp3) 가 기본. 없으면 edge-tts(대본 JSON 의 voice/rate).
import argparse, json, re, subprocess, sys, os
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parents[1]
FFMPEG = ROOT / 'node_modules' / 'ffmpeg-static' / ('ffmpeg.exe' if os.name == 'nt' else 'ffmpeg')

ap = argparse.ArgumentParser()
ap.add_argument('--slug', required=True)
ap.add_argument('--voice-dir')
ap.add_argument('--music')
ap.add_argument('--music-db', default='-20dB')
ap.add_argument('--outro', type=float, default=0.0, help='마지막 낭독이 끝난 뒤 화면을 N초 더 잡고 음악을 --outro-db 로 올린다(엔딩 스웰)')
ap.add_argument('--outro-db', type=float, default=-8.0, help='엔딩 스웰 목표 음량(dB). amix 가 6dB 낮추므로 종료카드 --music-db 는 이 값−6 으로 준다')
ap.add_argument('--gap', type=float, default=0.8)
ap.add_argument('--fps', type=int, default=30)
ap.add_argument('--out')
ap.add_argument('--stills', help='초 단위 목록(예: 2,30,68). 영상 대신 정지 프레임 PNG 만 뽑는다(시안 확인용)')
ap.add_argument('--reuse-frames', action='store_true', help='tmp 의 silent.mp4 를 다시 쓰고 음성·음악 믹스만 다시 한다(음악 교체 등)')
ap.add_argument('--wide', action='store_true', help='16:9 해설편(1920×1080). 장면에 illus 를 주면 왼쪽 선화 + 오른쪽 내용')
ap.add_argument('--essay', action='store_true', help='essay 화면(검은 배경·글자)에 낭독을 얹는다. 화면 시간 = 낭독 길이와 장면 노출 시간 중 큰 쪽')
ap.add_argument('--silent', action='store_true', help='내레이션 없이 장면 JSON 의 dur(초)로 타임라인을 만든다(지식채널e풍 essay 모드). 음악만 깐다')
A = ap.parse_args()
if not FFMPEG.exists():
    sys.exit(f'ffmpeg 없음: {FFMPEG}')

scenes_path = ROOT / 'scripts' / 'motion-scenes' / f'{A.slug}.json'
scenes_doc = json.loads(scenes_path.read_text(encoding='utf-8')) if scenes_path.exists() else {}
scenes = scenes_doc.get('scenes', [])
if A.silent:
    # essay 모드: 대본 파일이 없어도 된다. 장면마다 dur(초) 필수
    spec = {'title': scenes_doc.get('title', 'AI 1분 개벽늬우스'), 'series': scenes_doc.get('series', '')}
    segs = [{'text': '', 'dur': float(sc.get('dur', 4.0))} for sc in scenes]
else:
    spec = json.loads((ROOT / 'scripts' / 'news-scripts' / f'{A.slug}.json').read_text(encoding='utf-8'))
    segs = spec['segments']
    if scenes and len(scenes) != len(segs):
        sys.exit(f'장면 수({len(scenes)})와 대본 문장 수({len(segs)})가 다릅니다: {scenes_path}')

out = Path(A.out) if A.out else ROOT / 'reels' / f'{A.slug}-motion.mp4'
out = out if out.is_absolute() else ROOT / out
tmp = ROOT / 'reels' / f'tmp-motion-{A.slug}'
tmp.mkdir(parents=True, exist_ok=True)

def run(args):
    r = subprocess.run([str(a) for a in args], capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode != 0:
        sys.exit('실패: ' + ' '.join(map(str, args[:3])) + '\n' + '\n'.join(r.stderr.splitlines()[-15:]))
    return r

def dur(path):
    r = subprocess.run([str(FFMPEG), '-i', str(path)], capture_output=True, text=True, encoding='utf-8', errors='replace')
    m = re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)', r.stderr)
    h, mi, s = m.groups(); return int(h) * 3600 + int(mi) * 60 + float(s)

def synth(text, path, i):
    if A.voice_dir:
        src = ROOT / A.voice_dir / f'{i + 1}.mp3'
        if not src.exists(): sys.exit(f'음성 파일 없음: {src}')
        return src
    import asyncio, edge_tts  # 폴백: 무료 edge 음성
    asyncio.run(edge_tts.Communicate(text, spec.get('voice', 'ko-KR-InJoonNeural'), rate=spec.get('rate', '+0%')).save(str(path)))
    return path

# ── 문장별 음성 → 무음(gap) 덧붙인 WAV, 길이 = 화면 시간 ──
auds, timeline, t = [], [], 0.0
if A.silent:
    for i, seg in enumerate(segs):
        timeline.append({'t0': round(t, 3), 'dur': seg['dur'], 'gap': 0, 'text': '', 'scene': scenes[i]}); t += seg['dur']
    segs = []  # 아래 음성 루프를 건너뛴다
for i, seg in enumerate(segs):
    src = synth(seg['text'], tmp / f'a{i}.mp3', i)
    wav = tmp / f'a{i}.wav'
    run([FFMPEG, '-y', '-i', src, '-af', f'apad=pad_dur={A.gap:.3f}', '-ar', '44100', '-ac', '1', wav])
    d = dur(wav)
    if A.essay and scenes:
        # 글자가 다 뜰 시간을 보장한다(장면별 노출 시간의 0.85배 이상). 낭독이 더 길면 낭독을 따른다.
        need = float(scenes[i].get('dur', 0)) * 0.85
        if d < need:
            run([FFMPEG, '-y', '-i', src, '-af', f'apad=pad_dur={A.gap + (need - d):.3f}', '-ar', '44100', '-ac', '1', wav]); d = dur(wav)
    if A.outro and i == len(segs) - 1:
        run([FFMPEG, '-y', '-i', wav, '-af', f'apad=pad_dur={A.outro:.3f}', wav.with_name('alast.wav')]); wav = wav.with_name('alast.wav'); d = dur(wav)
    auds.append(wav)
    timeline.append({'t0': round(t, 3), 'dur': round(d, 3), 'gap': A.gap, 'text': seg['text'],
                     'scene': scenes[i] if scenes else None})
    print(f'문장 {i + 1}/{len(segs)}: {d:.2f}s'); t += d
T = t
print(f'총 길이 ≈ {T:.1f}s')

render_spec = {'title': spec.get('title', 'AI 1분 개벽늬우스'), 'series': spec.get('series', ''),
               'segments': timeline, 'total': round(T, 3), 'width': 1920 if A.wide else 1080, 'height': 1080 if A.wide else 1920,
               'essay': bool(A.silent or A.essay), 'wide': bool(A.wide)}
spec_path = tmp / 'spec.json'
spec_path.write_text(json.dumps(render_spec, ensure_ascii=False, indent=1), encoding='utf-8')

node_cmd = ['node', str(ROOT / 'scripts' / 'render_motion.mjs'), '--spec', str(spec_path), '--fps', str(A.fps)]
if A.stills:
    r = subprocess.run(node_cmd + ['--stills', A.stills, '--still-dir', str(tmp)], text=True, encoding='utf-8', errors='replace')
    sys.exit(r.returncode)

silent = tmp / 'silent.mp4'
if A.reuse_frames and silent.exists():
    print(f'프레임 재사용: {silent} (장면·타이밍이 바뀌지 않았을 때만)')
else:
    r = subprocess.run(node_cmd + ['--out', str(silent)], text=True, encoding='utf-8', errors='replace')
    if r.returncode != 0: sys.exit('프레임 렌더 실패')

# ── 음성 concat → mp3 ──
if A.silent:
    out.parent.mkdir(parents=True, exist_ok=True)
    if not A.music: sys.exit('--silent 에는 --music 이 필요합니다')
    mp = Path(A.music) if Path(A.music).is_absolute() else ROOT / A.music
    vol = A.music_db if A.music_db != '-20dB' else '-12dB'  # 내레이션이 없으니 음악을 조금 키운다
    run([FFMPEG, '-y', '-i', silent, '-stream_loop', '-1', '-i', mp, '-filter_complex',
         f"[1:a]atrim=0:{T:.3f},asetpts=PTS-STARTPTS,volume={vol},afade=t=in:st=0:d=1.5,afade=t=out:st={max(T-2.5,0):.2f}:d=2.5[aout]",
         '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', out])
    print(f'완료: {out} (essay, ≈{T:.1f}s, 1080×1920)'); sys.exit(0)
avf = tmp / 'alist.txt'
avf.write_text('\n'.join(f"file '{a.as_posix()}'" for a in auds), encoding='utf-8')
voicemp3 = tmp / 'voice.mp3'
run([FFMPEG, '-y', '-f', 'concat', '-safe', '0', '-i', avf, '-c:a', 'libmp3lame', '-q:a', '2', voicemp3])

# ── mux: 영상 + 음성 (+ 음악 베드) — gen_news.py 와 같은 믹스 ──
out.parent.mkdir(parents=True, exist_ok=True)
args = [FFMPEG, '-y', '-i', silent, '-i', voicemp3]
if A.music:
    mp = Path(A.music) if Path(A.music).is_absolute() else ROOT / A.music
    if not mp.exists(): sys.exit(f'음악 없음: {mp}')
    args += ['-stream_loop', '-1', '-i', mp]   # 음악이 영상보다 짧으면 반복
    if A.outro:
        # 낭독 끝(Tn)에서 1초 동안 music_db → outro_db 로 올리고 끝까지 유지. 페이드아웃은 종료카드에서.
        # volume 의 수식은 dB 가 아니라 선형 배율이다 → 10^(dB/20) 로 바꿔 넣는다
        Tn = T - A.outro - A.gap; a = 10 ** (float(A.music_db.replace('dB', '')) / 20); b = 10 ** (A.outro_db / 20)
        vexpr = f"'if(lt(t,{Tn:.3f}),{a:.5f},if(lt(t,{Tn + 1:.3f}),{a:.5f}+({b:.5f}-{a:.5f})*(t-{Tn:.3f}),{b:.5f}))'"
        fc = (f"[2:a]atrim=0:{T:.3f},asetpts=PTS-STARTPTS,volume={vexpr}:eval=frame,afade=t=in:st=0:d=1[mus];"
              f"[1:a]volume=+2dB[v];[v][mus]amix=inputs=2:duration=first:dropout_transition=0[aout]")
    else:
        fc = (f"[2:a]atrim=0:{T:.3f},asetpts=PTS-STARTPTS,volume={A.music_db},"
              f"afade=t=in:st=0:d=1,afade=t=out:st={max(T - 1.5, 0):.2f}:d=1.5[mus];"
              f"[1:a]volume=+2dB[v];[v][mus]amix=inputs=2:duration=first:dropout_transition=0[aout]")
    args += ['-filter_complex', fc, '-map', '0:v', '-map', '[aout]']
else:
    args += ['-map', '0:v', '-map', '1:a']
args += ['-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', out]
run(args)
mb = out.stat().st_size / 1048576
try: shown = out.relative_to(ROOT)
except ValueError: shown = out
print(f'완료: {shown} ({mb:.1f} MB, ≈{T:.1f}s, {"1920×1080" if A.wide else "1080×1920"})')
