#!/usr/bin/env python
# 타악기 배경 트랙 합성기 — 외부 음원 없이 numpy 로 만든다(저작권 없음).
# 화면 전환 시각(spec.json 의 segments[].t0)에 큰북이 떨어지고, 전환 1.2초 전부터 라이저가 올라간다.
# 사용: python scripts/gen_percussion.py --spec reels/tmp-motion-<slug>/spec.json --out reels/<slug>-perc.wav [--bpm 84] [--seed 7]
import argparse, json, math, wave, struct
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('--spec', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--bpm', type=float, default=84)
ap.add_argument('--seed', type=int, default=7)
ap.add_argument('--tail', type=float, default=3.0, help='영상 뒤 종료 카드 길이만큼 여유(초)')
ap.add_argument('--drive', type=float, default=1.0, help='비트 세기. 1.0 기본, 1.5 강한 북, 0.6 절제')
ap.add_argument('--quiet', default='', help='정적 장면 번호(1부터, 쉼표). 북을 끊고 초침·심장박동만 남긴 뒤 한 번 친다 — 지식채널e식 「말하기 전의 침묵」')
ap.add_argument('--style', default='war', choices=['war','samba','afro','tension','tribal'], help="war: 타이코풍 큰북 / samba: 바투카다 / afro: 아프로 그루브 / tension: 맥박·초침·상승 드론·가속·급정지 / tribal: 시네마틱 트라이벌(큰북 앙상블+젬베+롤+급정지)")
ap.add_argument('--clock', action='store_true', help='시계 초침(매 박 틱톡)과 심장박동 층을 깐다')
A = ap.parse_args()

SR = 44100
spec = json.load(open(A.spec, encoding='utf-8'))
T = float(spec['total']) + A.tail
N = int(T * SR)
L = np.zeros(N); R = np.zeros(N)
LB = np.zeros(N); RB = np.zeros(N)   # 큰북 전용 버스(덕킹 기준)
BASS_HITS = []
rng = np.random.default_rng(A.seed)
starts = [float(s['t0']) for s in spec['segments']]
ends = starts[1:] + [float(spec['total'])]

def env(n, attack, decay, curve=5.0):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    d = np.exp(-curve * np.clip((t - attack) / max(decay, 1e-4), 0, None))
    return a * d

def add(sig, t0, gain=1.0, pan=0.0, bus='o'):
    i = int(t0 * SR)
    if i >= N or i < 0: return
    n = min(len(sig), N - i)
    l = gain * (1 - max(pan, 0)); r = gain * (1 + min(pan, 0))
    if bus == 'b':
        LB[i:i+n] += sig[:n] * l; RB[i:i+n] += sig[:n] * r; BASS_HITS.append(i)
    else:
        L[i:i+n] += sig[:n] * l; R[i:i+n] += sig[:n] * r

def boom(dur=1.6, f0=110, f1=42, gain=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 9)          # 피치 급강하
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * env(n, 0.002, dur * 0.9, 4.5)
    click = rng.normal(0, 1, n) * env(n, 0.0005, 0.02, 8) * 0.35
    sub = np.sin(2 * np.pi * 38 * t) * env(n, 0.01, dur, 3.0) * 0.5
    x = body + click + sub
    return np.tanh(x * 1.6) * gain

def tom(dur=0.55, f0=170, f1=95, gain=0.6):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 14)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * env(n, 0.002, dur * 0.8, 5) + rng.normal(0, 1, n) * env(n, 0.0005, 0.015, 8) * 0.25
    return np.tanh(x * 1.3) * gain

def tick(dur=0.05, gain=0.18):
    n = int(dur * SR)
    x = rng.normal(0, 1, n)
    # 간이 하이패스: 차분
    x = np.diff(x, prepend=0) * 0.8
    return x * env(n, 0.0005, dur * 0.6, 7) * gain

def riser(dur=1.2, gain=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    # 밴드패스 흉내: 이동평균 창을 점점 줄여 밝아지게
    out = np.zeros(n)
    win = np.linspace(40, 4, n).astype(int)
    cs = np.cumsum(np.insert(noise, 0, 0))
    for k in range(0, n, 256):
        w = max(int(win[k]), 2); j = min(k + 256, n)
        idx = np.arange(k, j)
        lo = np.clip(idx - w, 0, n); hi = np.clip(idx, 0, n)
        out[k:j] = (cs[hi] - cs[lo]) / w
    amp = (t / dur) ** 2.2
    return out * amp * gain

def clock_tick(hi=True, gain=0.22):
    n = int(0.03 * SR); t = np.arange(n) / SR
    f = 3200 if hi else 2400
    x = np.sin(2 * np.pi * f * t) * env(n, 0.0003, 0.012, 9) + rng.normal(0, 1, n) * env(n, 0.0002, 0.004, 9) * 0.5
    return x * gain

def heartbeat(gain=0.7):
    # 쿵-쿵 (lub-dub): 55Hz 두 번, 0.18초 간격
    n = int(0.9 * SR); t = np.arange(n) / SR
    def thump(t0, g):
        e = np.exp(-np.clip(t - t0, 0, None) * 14) * (t >= t0)
        return np.sin(2 * np.pi * 52 * (t - t0)) * e * g
    x = thump(0.0, 1.0) + thump(0.18, 0.75)
    return np.tanh(x * 1.4) * gain

# ── 바투카다 악기 ──
def surdo(low=True, dur=0.9, gain=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f0, f1 = (95, 58) if low else (130, 82)
    f = f1 + (f0 - f1) * np.exp(-t * 12)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * env(n, 0.002, dur * 0.85, 4.2) + rng.normal(0, 1, n) * env(n, 0.0004, 0.012, 9) * 0.3
    return np.tanh(x * 1.5) * gain

def caixa(gain=0.5, accent=1.0):
    n = int(0.12 * SR); t = np.arange(n) / SR
    snare = rng.normal(0, 1, n); snare = np.diff(snare, prepend=0) * 0.9
    body = np.sin(2 * np.pi * 190 * t) * env(n, 0.001, 0.05, 8) * 0.5
    x = snare * env(n, 0.0005, 0.07 if accent > 0.8 else 0.045, 7) + body
    return np.tanh(x * 1.4) * gain * accent

def repinique(gain=0.6):
    n = int(0.16 * SR); t = np.arange(n) / SR
    f = 260 + 160 * np.exp(-t * 40)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * env(n, 0.001, 0.1, 7) + rng.normal(0, 1, n) * env(n, 0.0003, 0.02, 9) * 0.6
    return np.tanh(x * 1.6) * gain

def tamborim(gain=0.35):
    n = int(0.05 * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 820 * t) * env(n, 0.0005, 0.03, 9) + np.sin(2 * np.pi * 1640 * t) * env(n, 0.0005, 0.015, 9) * 0.4
    return x * gain

def agogo(hi=True, gain=0.22):
    n = int(0.22 * SR); t = np.arange(n) / SR
    f = 1480 if hi else 1110
    x = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t)) * env(n, 0.0005, 0.16, 6)
    return x * gain

def shaker(gain=0.14, accent=1.0):
    n = int(0.06 * SR)
    x = rng.normal(0, 1, n); x = np.diff(np.diff(x, prepend=0), prepend=0) * 0.5
    return x * env(n, 0.004, 0.035, 7) * gain * accent

# ── 아프로 악기 ──
def dundunba(dur=0.42, gain=1.0):
    # 큰북: 짧고 단단하게 — 피치 70→52Hz, 강한 스틱 클릭, 짧은 감쇠 → 「울림」이 아니라 「비트」
    n = int(dur * SR); t = np.arange(n) / SR
    f = 52 + 18 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * env(n, 0.0015, dur * 0.7, 6.5)
    knock = np.sin(2 * np.pi * 180 * t) * env(n, 0.0005, 0.03, 9) * 0.5
    click = rng.normal(0, 1, n) * env(n, 0.0003, 0.012, 10) * 0.45
    return np.tanh((body + knock + click) * 1.9) * gain

def sangban(muted=False, gain=0.6):
    n = int((0.16 if muted else 0.38) * SR); t = np.arange(n) / SR
    f = 88 + 22 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * env(n, 0.0015, (0.08 if muted else 0.3), 6) + rng.normal(0, 1, n) * env(n, 0.0003, 0.01, 10) * 0.3
    return np.tanh(x * 1.5) * gain

def kenkeni(gain=0.4):
    n = int(0.14 * SR); t = np.arange(n) / SR
    f = 150 + 40 * np.exp(-t * 35)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * env(n, 0.001, 0.1, 7) + rng.normal(0, 1, n) * env(n, 0.0003, 0.008, 10) * 0.3
    return np.tanh(x * 1.4) * gain

def bell(gain=0.2):
    n = int(0.18 * SR); t = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 1320 * t) + 0.4 * np.sin(2 * np.pi * 1320 * 2.41 * t)) * env(n, 0.0005, 0.12, 6)
    return x * gain

def djembe_slap(gain=0.5):
    n = int(0.09 * SR); t = np.arange(n) / SR
    x = rng.normal(0, 1, n); x = np.diff(x, prepend=0)
    x = x * env(n, 0.0003, 0.05, 8) + np.sin(2 * np.pi * 480 * t) * env(n, 0.0005, 0.03, 9) * 0.5
    return np.tanh(x * 1.6) * gain

def djembe_tone(gain=0.45):
    n = int(0.16 * SR); t = np.arange(n) / SR
    f = 250 + 60 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * env(n, 0.001, 0.11, 6) + rng.normal(0, 1, n) * env(n, 0.0003, 0.006, 10) * 0.25
    return np.tanh(x * 1.3) * gain

def roll_tom(low=True, gain=0.5):
    n = int(0.11 * SR); t = np.arange(n) / SR
    f0, f1 = (150, 100) if low else (240, 160)
    f = f1 + (f0 - f1) * np.exp(-t * 40)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * env(n, 0.0008, 0.07, 8) + rng.normal(0, 1, n) * env(n, 0.0003, 0.008, 10) * 0.35
    return np.tanh(x * 1.6) * gain

def drum_roll(t0, t1, g0, g1, iv0, iv1, curve=1.6):
    # t0~t1 동안 두두다다: 간격 iv0→iv1(초), 세기 g0→g1. 두 번은 저음, 두 번은 고음, 좌우 교대
    tt, i = t0, 0
    while tt < t1:
        u = (tt - t0) / max(t1 - t0, 1e-3)
        low = (i // 2) % 2 == 0
        add(roll_tom(low, g0 + (g1 - g0) * u ** 0.8), tt, 1.0, pan=(-0.35 if i % 2 else 0.35))
        tt += iv0 + (iv1 - iv0) * (u ** curve); i += 1

def tension_drone():
    # 55Hz + 58Hz 맥놀이(불안), 220/223Hz 얇은 현이 뒤로 갈수록 올라온다. 전체 길이에 걸쳐 크레셴도
    t = np.arange(N) / SR
    g = np.linspace(0.06, 0.20, N)
    low = np.sin(2 * np.pi * 55 * t) + np.sin(2 * np.pi * 58 * t) * 0.8
    hi = (np.sin(2 * np.pi * 220 * t) + np.sin(2 * np.pi * 223.3 * t)) * np.linspace(0.0, 0.35, N)
    return (low * 0.5 + hi) * g

def gate_silence(t0, dur):
    # 급정지: t0 부터 dur 초 동안 기타 버스를 0 으로 (큰북 버스는 그대로)
    i = int(t0 * SR); j = min(int((t0 + dur) * SR), N)
    if 0 <= i < j:
        L[i:j] = 0; R[i:j] = 0

def drone(gain=0.10):
    t = np.arange(N) / SR
    x = np.sin(2 * np.pi * 55 * t) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.11 * t)) + 0.4 * np.sin(2 * np.pi * 82.4 * t)
    return x * gain

# ── 배치 ──
beat = 60.0 / A.bpm
# 1) 저음 드론(긴장 유지)
d = drone(); L[:] += d; R[:] += d
# 2) 장면 전환: 라이저 → 큰북
D = A.drive
quiet = {int(x) - 1 for x in A.quiet.split(',') if x.strip()}
if A.style == 'tribal':
    # 시네마틱 트라이벌: afro 큰북 모티프 + 젬베 층 + 두두다다 롤 가속 + 전환 급정지 + 상승 드론
    td = tension_drone(); L[:] += td * 0.7; R[:] += td * 0.7
    e8 = beat / 2.0
    DUN = [1,0,0,1,0,1,0,0, 1,0,1,0,0,1,0,0]
    SLAP = [0,1,0,0,0,1,0,1]
    TONE = [0,0,1,0,0,0,1,1]
    for k, (s, e) in enumerate(zip(starts, ends)):
        dur = e - s
        if k > 0: gate_silence(s - 0.22, 0.22)
        # 들어오는 한 방: 큰북 셋 겹침(저·중) + 슬랩
        t_hit = s + (0.35 if k in quiet else 0.0)
        add(dundunba(0.9, 1.3 * D), t_hit, 1.0, bus='b'); add(boom(dur=1.4, f0=100, f1=40, gain=0.7 * D), t_hit, 1.0, bus='b')
        add(djembe_slap(0.6 * D), t_hit, 1.0)
        if k in quiet:
            tt = s + 1.4
            while tt < e - 0.4:
                add(heartbeat(gain=0.6 * D), tt, 1.0); tt += 1.05
            c = 0
            while s + c * beat < e - 0.3:
                add(shaker(0.07 * D), s + c * beat, 1.0, pan=0.4); c += 1
            if k < len(starts) - 1:
                drum_roll(e - 1.3, e - 0.2, 0.10 * D, 0.65 * D, beat / 4, 0.045, curve=1.8)
                add(riser(1.2, 0.55 * D), e - 1.2, 1.0)
            continue
        nxt_quiet = (k + 1) in quiet
        stop_at = e - (0.9 if nxt_quiet else 0.22)
        i = 0
        while s + i * e8 < stop_at - 1.4:
            tt = s + i * e8
            frac = (tt - s) / max(dur, 1e-3)
            p16 = i % 16; p8 = i % 8
            full = frac > 0.18
            if DUN[p16] and i > 0:
                add(dundunba(0.45, (0.8 + 0.4 * frac) * D), tt, 1.0, bus='b')
                if frac > 0.5: add(sangban(False, 0.35 * D), tt, 1.0, pan=0.15)   # 후반엔 중간북이 큰북에 겹친다
            if full and SLAP[p8]: add(djembe_slap((0.3 + 0.15 * frac) * D), tt, 1.0, pan=-0.25)
            if full and TONE[p8]: add(djembe_tone((0.28 + 0.12 * frac) * D), tt, 1.0, pan=0.25)
            for h in (0.0, 0.5):
                add(shaker((0.08 if full else 0.05) * D, 1.0 if h == 0 else 0.55), tt + h * e8, 1.0, pan=0.5)
            # 후반 40%: 두두다다 롤이 박 사이를 메운다
            if frac > 0.6 and p8 in (3, 7):
                drum_roll(tt, tt + e8, 0.25 * D, 0.4 * D, e8 / 4, e8 / 6, curve=1.0)
            i += 1
        # 마지막 1.4초: 가속 롤 + 라이저 → 급정지
        drum_roll(max(stop_at - 1.4, s + 0.3), stop_at, 0.45 * D, 1.0 * D, beat / 4, 0.04, curve=1.8)
        add(riser(1.2, 0.6 * D), stop_at - 1.2, 1.0)
    starts_done = True
elif A.style == 'tension':
    td = tension_drone(); L[:] += td; R[:] += td
    for k, (s, e) in enumerate(zip(starts, ends)):
        dur = e - s
        # 들어오는 순간: 0.22초 완전 정지 뒤 한 방
        if k > 0: gate_silence(s - 0.22, 0.22)
        hit_g = (1.35 if k in quiet or k in (0, len(starts) - 1) else 1.1) * D
        add(dundunba(0.9, hit_g), s + (0.35 if k in quiet else 0.0), 1.0, bus='b')
        add(riser(0.16, 0.5 * D), s + (0.35 if k in quiet else 0.0) - 0.16, 1.0)
        if k in quiet:
            # 정적 화면: 심장박동 + 초침만, 마지막 1.2초 라이저
            tt = s + 1.4
            while tt < e - 0.4:
                add(heartbeat(gain=0.6 * D), tt, 1.0); tt += 1.05
            c = 0
            while s + c * 0.5 < e - 0.3:
                add(clock_tick(hi=(c % 2 == 0), gain=0.13), s + c * 0.5, 1.0, pan=0.35 if c % 2 else -0.35); c += 1
            if k < len(starts) - 1:
                drum_roll(e - 1.3, e - 0.2, 0.10 * D, 0.6 * D, beat / 4, 0.045, curve=1.8)
                add(riser(1.2, 0.55 * D), e - 1.2, 1.0)
            continue
        nxt_quiet = (k + 1) in quiet
        stop_at = e - (0.9 if nxt_quiet else 0.22)
        # 1) 바닥: 두두다다 롤이 처음부터 깔린다. 8분음 → 16분음으로 빨라지고 세진다
        body_end = stop_at - 1.4
        if body_end > s + 0.6:
            drum_roll(s + 0.5, body_end, 0.16 * D, 0.42 * D, beat / 2, beat / 4, curve=1.2)
        # 2) 큰북은 1·3박, 후반으로 갈수록 세게 — 롤 위에 박을 박는다
        b = 0
        while s + b * beat < stop_at:
            tt = s + b * beat
            frac = (tt - s) / max(dur, 1e-3)
            if b > 0 and b % 2 == 0:
                add(dundunba(0.42, (0.6 + 0.5 * frac) * D), tt, 1.0, bus='b')
            add(clock_tick(hi=(b % 2 == 0), gain=0.10 + 0.05 * frac), tt, 1.0, pan=0.35 if b % 2 else -0.35)
            b += 1
        # 3) 마지막 1.4초: 가속 롤(16분음 → 64분음 수준) + 크레셴도 + 라이저 → 급정지
        drum_roll(max(stop_at - 1.4, s + 0.3), stop_at, 0.42 * D, 0.95 * D, beat / 4, 0.04, curve=1.8)
        add(riser(1.2, 0.55 * D), stop_at - 1.2, 1.0)
    starts_done = True
elif A.style == 'afro':
    e8 = beat / 2.0
    # 2마디(8분음 16) 큰북 모티프: 쿵 . . 쿵 . 쿵 . . | 쿵 . 쿵 . . 쿵 . .
    DUN = [1,0,0,1,0,1,0,0, 1,0,1,0,0,1,0,0]
    SAN = [0,0,1,0,0,0,'m',0, 0,0,1,0,0,0,'m',0]
    BELL = [1,0,1,0,1,1,0,1]
    KEN = [1,0,1,1,0,1,1,0]
    SLAP = [0,1,0,0,0,1,0,1]
    for k, (s, e) in enumerate(zip(starts, ends)):
        dur = e - s
        if k in quiet:
            add(dundunba(0.7, 1.35 * D), s + 0.35, 1.0, bus='b'); add(djembe_slap(0.5 * D), s + 0.35, 1.0)
            tt = s + 1.5
            while tt < e - 0.3:
                add(dundunba(0.5, 0.75 * D), tt, 1.0, bus='b'); add(dundunba(0.4, 0.5 * D), tt + 0.22, 1.0, bus='b'); tt += 2 * beat
            c = 0
            while s + c * beat < e:
                add(bell(0.10 * D), s + c * beat, 1.0, pan=0.4); c += 1
            continue
        nxt_quiet = (k + 1) in quiet
        stop_at = e - (0.9 if nxt_quiet else beat)
        add(dundunba(0.4, 0.8 * D), s - e8, 1.0, bus='b'); add(dundunba(0.4, 0.9 * D), s - e8 / 2, 1.0, bus='b')
        add(dundunba(0.7, 1.3 * D), s, 1.0, bus='b'); add(djembe_slap(0.6 * D), s, 1.0); add(sangban(False, 0.6 * D), s, 1.0)
        i = 0
        while s + i * e8 < stop_at:
            tt = s + i * e8
            frac = (tt - s) / max(dur, 1e-3)
            p16 = i % 16; p8 = i % 8
            mid = frac > 0.2
            if DUN[p16] and i > 0:
                add(dundunba(0.42, (0.95 + 0.25 * frac) * D), tt, 1.0, bus='b')
            if SAN[p16] and mid:
                add(sangban(SAN[p16] == 'm', 0.5 * D), tt, 1.0, pan=0.2)
            if BELL[p8]: add(bell((0.16 if mid else 0.11) * D), tt, 1.0, pan=0.45)
            if KEN[p8] and mid: add(kenkeni(0.3 * D), tt, 1.0, pan=-0.35)
            if SLAP[p8] and mid: add(djembe_slap(0.32 * D), tt, 1.0, pan=-0.2)
            for h in (0.0, 0.5):
                add(shaker((0.09 if mid else 0.06) * D, 1.0 if h == 0 else 0.55), tt + h * e8, 1.0, pan=0.5)
            if mid and i % 32 in (28, 29, 30, 31):
                add(djembe_tone(0.35 * D), tt, 1.0, pan=-0.1); add(djembe_tone(0.25 * D), tt + e8 / 2, 1.0, pan=0.1)
            i += 1
        if nxt_quiet:
            add(riser(0.9, 0.5 * D), e - 0.9, 1.0)
    starts_done = True
elif A.style == 'samba':
    six = beat / 4.0   # 16분음 격자
    TAMB = [1,0,0,1,0,0,1,0, 1,0,1,0,0,1,0,0]            # 탐보림 카헤테이루 (16분음 ×16)
    AGO  = ['H',0,0,'L',0,0,'H',0, 'L',0,'H',0,0,'L',0,0]
    CAIXA_ACC = [1.0,0.45,0.6,1.0, 0.45,0.6,1.0,0.45]      # 8분음 두 박 = 16분음 8개
    for k, (s, e) in enumerate(zip(starts, ends)):
        dur = e - s
        if k in quiet:
            # 정적: surdo 심장박동(2박마다)과 아주 작은 shaker 만. 글자 뜬 뒤 tutti 한 번
            add(surdo(True, 1.6, 1.2 * D), s + 0.35, 1.0); add(repinique(0.5 * D), s + 0.35, 1.0)
            tt = s + 1.4
            while tt < e - 0.3:
                add(surdo(True, 0.9, 0.55 * D), tt, 1.0); tt += 2 * beat
            continue
        nxt_quiet = (k + 1) in quiet
        stop_at = e - (0.9 if nxt_quiet else 2 * six)   # 마지막 16분음 둘은 비운다(파라지냐)
        # 전환 tutti: surdo 둘 + repinique + caixa 강세
        add(surdo(True, 1.4, 1.15 * D), s, 1.0); add(surdo(False, 0.8, 0.7 * D), s, 1.0)
        add(repinique(0.8 * D), s, 1.0); add(caixa(0.7 * D), s, 1.0)
        if k > 0:
            # 들어오기 직전 repinique 콜(16분음 3연타)
            for j in range(3):
                add(repinique(0.45 * D + 0.1 * j), s - six * (3 - j), 1.0)
        i = 0
        while s + i * six < stop_at:
            tt = s + i * six
            frac = (tt - s) / max(dur, 1e-3)
            p8 = i % 8; p16 = i % 16
            full = frac > 0.22                     # 도입 22% 는 surdo·shaker 만
            # surdo: 2박(p8==4) 강, 1박(p8==0) 약, 3박째 앞 싱코페이션(p16==11) 필
            if p8 == 4: add(surdo(True, 0.9, (0.9 + 0.2 * frac) * D), tt, 1.0)
            if p8 == 0 and i > 0: add(surdo(False, 0.7, 0.55 * D), tt, 1.0)
            if p16 == 11 and full: add(surdo(False, 0.5, 0.45 * D), tt, 1.0, pan=0.2)
            # caixa: 모든 16분음
            if full: add(caixa(0.42 * D, CAIXA_ACC[p8]), tt, 1.0, pan=-0.15)
            # shaker: 모든 16분음, 다운비트 강세
            add(shaker(0.13 * D, 1.0 if p8 in (0, 4) else 0.6), tt, 1.0, pan=0.45)
            if full:
                if TAMB[p16]: add(tamborim(0.32 * D), tt, 1.0, pan=0.3)
                if AGO[p16]: add(agogo(AGO[p16] == 'H', 0.2 * D), tt, 1.0, pan=-0.4)
            # repinique 필: 후반 2마디마다 4박 뒤 3연타
            if frac > 0.6 and p16 == 13:
                for j in range(3): add(repinique(0.35 * D), tt + j * six, 1.0)
            i += 1
        if nxt_quiet:
            add(riser(0.9, 0.5 * D), e - 0.9, 1.0)
        else:
            add(surdo(True, 0.6, 0.6 * D), e - 2 * six, 1.0)   # 멈추기 직전 마지막 surdo
    starts_done = True
else:
  starts_done = False
for k, (s, e) in enumerate(zip(starts, ends) if not starts_done else []):
    dur = e - s
    if k in quiet:
        # 정적 장면: 들어오기 0.9초 전부터 모든 북을 비우고(아래 패턴에서 제외), 글자가 뜬 뒤 한 번 친다
        add(boom(dur=2.4, f0=95, f1=38, gain=1.25 * D), s + 0.35, 1.0)
        # 심장박동 + 초침만
        hb = 0.0
        while s + 0.9 + hb < e - 0.3:
            add(heartbeat(gain=0.55 + 0.25 * (hb / max(dur, 1))), s + 0.9 + hb, 1.0); hb += 1.0
        if A.clock:
            c = 0
            while s + c * 0.5 < e:
                add(clock_tick(hi=(c % 2 == 0), gain=0.16), s + c * 0.5, 1.0, pan=0.35 if c % 2 else -0.35); c += 1
        continue
    big = (1.15 if k in (0, len(starts) - 1) else 1.0) * D
    add(boom(dur=1.8, gain=big), s, 1.0)
    nxt_quiet = (k + 1) in quiet
    if k > 0 and (k - 1) not in quiet:
        pass
    if k > 0:
        add(riser(1.2, 0.45 * D), s - 1.2, 1.0)
    cutoff = e - (0.9 if nxt_quiet else 0.35)   # 다음이 정적 장면이면 0.9초 먼저 끊는다
    b = 0
    while s + b * beat < cutoff:
        tt = s + b * beat
        frac = (tt - s) / max(dur, 1e-3)
        pos = b % 4
        if b > 0 and pos == 0:
            add(boom(dur=1.1, f0=105, f1=44, gain=(0.62 + 0.28 * frac) * D), tt, 1.0)
        if pos == 2:
            add(boom(dur=0.9, f0=95, f1=42, gain=(0.48 + 0.22 * frac) * D), tt, 1.0)
        if pos in (1, 3):
            add(tom(dur=0.5, gain=(0.5 + 0.3 * frac) * D), tt, 1.0, pan=0.3 if pos == 1 else -0.3)
        if pos == 3 and (b // 4) % 2 == 1:
            add(boom(dur=0.6, f0=100, f1=46, gain=0.55 * D), tt + beat * 0.5, 1.0)
        # 틱: 전반 8분음, 후반 16분음으로 몰아간다 (가속)
        subs = (0.0, 0.5) if frac < 0.55 else (0.0, 0.25, 0.5, 0.75)
        for h in subs:
            add(tick(gain=(0.12 + 0.12 * frac) * D), tt + h * beat, 1.0, pan=(-0.5 if h in (0.5, 0.75) else 0.5))
        b += 1
    if A.clock:
        c = 0
        while s + c * 0.5 < cutoff:
            add(clock_tick(hi=(c % 2 == 0), gain=0.11), s + c * 0.5, 1.0, pan=0.35 if c % 2 else -0.35); c += 1
    if nxt_quiet:
        # 정적 직전: 라이저 대신 짧은 되감기(역 리버스 느낌의 노이즈 스웰)로 숨을 멈춘다
        add(riser(0.9, 0.6 * D), e - 0.9, 1.0)
# 3) 마지막 장면: 세 번 두드림 + 여운
last = starts[-1]
for j, off in enumerate((1.6, 2.0, 2.4)):
    add(boom(dur=2.2, gain=0.9 + 0.1 * j), last + off, 1.0, bus='b')
add(boom(dur=3.0, f0=90, f1=36, gain=1.0), float(spec['total']) - 0.05, 1.0, bus='b')

# ── 덕킹: 큰북이 칠 때 나머지를 순간 −5dB 눌러 비트를 앞세운다 (120ms 회복) ──
if BASS_HITS:
    duck = np.ones(N)
    rec = int(0.12 * SR); shape = np.linspace(0.56, 1.0, rec) ** 0.7
    for i in sorted(set(BASS_HITS)):
        j = min(i + rec, N); duck[i:j] = np.minimum(duck[i:j], shape[:j - i])
    L *= duck; R *= duck
L += LB; R += RB
# ── 마스터: 소프트 리미트, 정규화(−14 dBFS peak 근사), 페이드 ──
mix = np.stack([L, R], axis=1)
mix = np.tanh(mix * (0.9 + 0.5 * (A.drive - 1)))
peak = np.max(np.abs(mix)) or 1.0
mix = mix / peak * 0.92
fade_in = int(0.8 * SR); fade_out = int(2.5 * SR)
mix[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
mix[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None]
pcm = (mix * 32767).astype('<i2')
with wave.open(A.out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(f'완료: {A.out} ({T:.1f}s, 전환 {len(starts)}회, {A.bpm} BPM)')
