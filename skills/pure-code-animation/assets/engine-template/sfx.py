#!/usr/bin/env python3
# sfx.py —— 读取 sfx_cues.json，用 numpy/scipy 纯代码合成 30 秒立体声，输出 sfx.wav 与 sfx_music.wav。
import json, os, sys
import numpy as np
from scipy import signal

SR = 48000
DUR = 30.0
N = int(round(DUR * SR))
rng = np.random.default_rng(20260928)

def white(n, r=rng): return r.standard_normal(n).astype(np.float64)

def t_arr(sec): return np.linspace(0, sec, int(round(sec * SR)), endpoint=False)

def onepole_lp(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x); prev = 0.0
    # fast lfilter implementation
    b = [1 - a]; a_coef = [1, -a]
    return signal.lfilter(b, a_coef, x)

def bandpass(x, lo, hi):
    lo = max(20.0, lo); hi = min(SR / 2 - 100, hi)
    sos = signal.butter(4, [lo / (SR / 2), hi / (SR / 2)], btype='band', output='sos')
    return signal.sosfilt(sos, x)

def lowpass(x, c):
    sos = signal.butter(4, min(c, SR / 2 - 100) / (SR / 2), output='sos')
    return signal.sosfilt(sos, x)

# ---------------- 音色 ----------------
def s_click(p=1.0):
    d = 0.06; t = t_arr(d)
    f = 1400 - 700 * (t / d)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 42)
    y += white(len(t)) * np.exp(-t * 130) * 0.5
    return y * 0.8 * p

def s_tick(p=1.0):
    d = 0.05; t = t_arr(d)
    y = np.sin(2 * np.pi * 2100 * t) * np.exp(-t * 60)
    y += white(len(t)) * np.exp(-t * 90) * 0.35
    return y * 0.7 * p

def s_pop(p=1.0):
    d = 0.13; t = t_arr(d)
    f = 240 + 520 * np.sin(np.clip(t / d, 0, 1) * np.pi / 2)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 17)
    y += white(len(t)) * np.exp(-t * 40) * 0.18
    return y * 0.85 * p

def s_pa(p=1.0):
    d = 0.18; t = t_arr(d)
    y = white(len(t)) * np.exp(-t * 26)
    y = bandpass(y, 600, 6000)
    y += np.sin(2 * np.pi * 175 * t) * np.exp(-t * 30) * 0.7
    return y * 0.95 * p

def s_slam(p=1.0):
    d = 0.5; t = t_arr(d)
    f = 130 - 92 * np.clip(t / 0.35, 0, 1)
    low = np.sin(2 * np.pi * f * t) * np.exp(-t * 9)
    nb = white(len(t)) * np.exp(-t * 30)
    nb = lowpass(nb, 2200)
    body = white(len(t)) * np.exp(-t * 14)
    body = lowpass(body, 400)
    return (low * 0.9 + nb * 0.8 + body * 0.7) * p

def s_burst(p=1.0):
    d = 0.55; t = t_arr(d)
    hi = white(len(t)) * np.exp(-t * 8); hi = bandpass(hi, 800, 9000)
    rum = np.sin(2 * np.pi * 58 * t) * np.exp(-t * 6)
    mid = white(len(t)) * np.exp(-t * 10); mid = lowpass(mid, 900)
    return (hi * 0.7 + rum * 0.8 + mid * 0.7) * p

def s_thud(p=1.0):
    d = 0.3; t = t_arr(d)
    f = 165 - 105 * np.clip(t / d, 0, 1)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 11)
    y += lowpass(white(len(t)), 500) * np.exp(-t * 26) * 0.4
    return y * p

def s_whoosh(dur, p=1.0):
    seg = 0.045; nseg = max(2, int(dur / seg))
    out = np.zeros(0)
    fl = np.geomspace(220, 2600, nseg)
    for i in range(nseg):
        L = int(seg * SR * 1.6)
        x = white(L)
        x = bandpass(x, fl[i] * 0.5, fl[i] * 1.5)
        # crossfade window
        w = np.hanning(L)
        if i == 0:
            out = x * w
        else:
            ov = L // 2
            out = np.concatenate([out, np.zeros(L - ov)])
            out[i * (L - ov): i * (L - ov) + L] += x * w
    env = np.linspace(0.2, 1.0, len(out)) ** 1.4
    return out * env * 0.8 * p

def s_whip(p=1.0):
    y = s_whoosh(0.22, p)
    crack = s_pa(0.8)[:int(0.05 * SR)]
    y = np.concatenate([y, crack])
    return y

def s_low(p=1.0):
    d = 0.9; t = t_arr(d)
    y = np.sin(2 * np.pi * 52 * t) * np.exp(-t * 4.5)
    y += np.sin(2 * np.pi * 38 * t) * np.exp(-t * 3.5) * 0.6
    return y * p

def s_buzz(p=1.0):
    d = 0.6; t = t_arr(d)
    sq = lambda f: np.sign(np.sin(2 * np.pi * f * t))
    y = (sq(150) * 0.5 + sq(159) * 0.5) * 0.5
    env = np.clip(1 - np.clip((t - 0.5) / 0.1, 0, 1), 0, 1)
    return y * env * 0.8 * p

def s_snap(p=1.0):
    d = 0.13; t = t_arr(d)
    y = white(len(t)) * np.exp(-t * 60); y = bandpass(y, 1200, 7000)
    g = np.zeros(len(t)); g[:] = 1
    e = np.exp(-t * 90)
    e += np.where(t >= 0.06, 0.7 * np.exp(-(t - 0.06) * 90), 0)
    return y * e * 0.8 * p

def s_spring(p=1.0):
    d = 0.55; t = t_arr(d)
    # 频率指数衰减的弹簧
    phase = 2 * np.pi * (130 * t + (470 / 9) * (1 - np.exp(-9 * t)))
    wob = 0.6 + 0.4 * np.sin(2 * np.pi * 18 * t) * np.exp(-t * 6)
    y = np.sin(phase) * np.exp(-t * 5) * wob
    return y * 0.8 * p

def s_type(p=1.0):
    d = 0.05; t = t_arr(d)
    y = white(len(t)) * np.exp(-t * 85)
    y = bandpass(y, 900, 6000)
    y += np.sin(2 * np.pi * 420 * t) * np.exp(-t * 60) * 0.25
    return y * 0.55 * p

def s_dong(p=1.0):
    d = 0.26; t = t_arr(d)
    y = np.sin(2 * np.pi * 520 * t) * np.exp(-t * 22)
    y += np.sin(2 * np.pi * 820 * t) * np.exp(-t * 40) * 0.4
    y += white(len(t)) * np.exp(-t * 120) * 0.3
    return y * 0.9 * p

def s_tear(p=1.0):
    d = 0.42; t = t_arr(d)
    crack = (0.45 + 0.55 * (white(len(t)) > 0).astype(float))
    y = white(len(t)) * crack
    y = bandpass(y, 1400, 8000)
    env = smooth_env(t / d) * (0.6 + 0.4 * white(len(t)))
    return y * env * 0.8 * p

def smooth_env(x):
    return np.clip(np.sin(np.clip(x, 0, 1) * np.pi), 0, 1)

def s_cymbal(p=1.0):
    d = 1.3; t = t_arr(d)
    y = np.zeros(len(t))
    for f in [3200, 4100, 5400, 6300, 7600]:
        y += np.sin(2 * np.pi * f * t) * 0.18
    y += bandpass(white(len(t)), 4000, 11000) * 0.5
    return y * np.exp(-t * 3.2) * 0.8 * p

def s_ding(p=1.0):
    d = 1.7; t = t_arr(d)
    base = 740
    ratios = [1, 2.0, 2.42, 3.0, 4.46]
    amps = [1, 0.5, 0.34, 0.22, 0.12]
    y = np.zeros(len(t))
    for r, a in zip(ratios, amps):
        y += np.sin(2 * np.pi * base * r * t) * a * np.exp(-t * (3.2 + r))
    return y * 0.8 * p

def s_riser(dur, p=1.0):
    t = t_arr(dur)
    f = 300 + (1900 - 300) * (t / dur) ** 1.5
    sine = np.sin(2 * np.pi * f * t)
    nb = white(len(t)); nb = bandpass(nb, 400, 5000)
    env = (t / dur) ** 1.3
    return (sine * 0.6 + nb * 0.5) * env * 0.8 * p

def s_hum(dur, p=1.0):
    t = t_arr(dur)
    y = np.zeros(len(t))
    for hh, a in [(1, 1), (2, 0.5), (3, 0.28), (4, 0.16)]:
        y += np.sin(2 * np.pi * 60 * hh * t) * a
    clicks = (white(len(t)) * (np.random.default_rng(7).random(len(t)) > 0.997)).astype(float)
    y += clicks * 0.4
    return y * 0.16 * p

def s_glitch(p=1.0):
    d = 0.1; t = t_arr(d)
    bits = (white(len(t)) > 0).astype(float) * 2 - 1
    gate = (np.sin(2 * np.pi * 170 * t) > 0).astype(float)
    y = bits * gate * 0.5
    y += np.sin(2 * np.pi * (900 + 1400 * t / d) * t) * 0.3
    return y * np.clip(1 - t / d, 0, 1) * 0.7 * p

def s_room(p=1.0):
    y = white(N)
    # pink-ish: simple
    y = onepole_lp(y, 2600)
    y2 = onepole_lp(white(N), 400)
    return (y * 0.5 + y2 * 0.5) * 0.022 * p

SYNTH = {
    'click': lambda c: s_click(), 'tick': lambda c: s_tick(), 'pop': lambda c: s_pop(),
    'pa': lambda c: s_pa(0.7 if c.get('pitch') == 0.7 else 1.0),
    'slam': lambda c: s_slam(), 'burst': lambda c: s_burst(), 'thud': lambda c: s_thud(),
    'whoosh': lambda c: s_whoosh(c.get('dur', 0.4)), 'whip': lambda c: s_whip(),
    'low': lambda c: s_low(), 'buzz': lambda c: s_buzz(), 'snap': lambda c: s_snap(),
    'spring': lambda c: s_spring(), 'type': lambda c: s_type(), 'dong': lambda c: s_dong(),
    'tear': lambda c: s_tear(), 'cymbal': lambda c: s_cymbal(), 'ding': lambda c: s_ding(),
    'riser': lambda c: s_riser(c.get('dur', 0.5)), 'hum': lambda c: s_hum(c.get('dur', 1)),
    'glitch': lambda c: s_glitch(),
}

# ---------------- 混音 ----------------
def build(music=False):
    L = np.zeros(N); R = np.zeros(N)

    def place(y, t_start, gain, pan=0.0):
        i0 = int(round(t_start * SR))
        if i0 >= N or len(y) == 0: return
        ie = min(N, i0 + len(y))
        y = y[:ie - i0]
        a = (pan + 1) * np.pi / 4
        L[i0:ie] += y * gain * np.cos(a)
        R[i0:ie] += y * gain * np.sin(a)

    cues = json.load(open(os.path.join(os.path.dirname(__file__), 'sfx_cues.json')))
    for idx, c in enumerate(cues):
        name = c['s']
        if name == 'room':
            y = s_room()
            place(y, 0, 1.0, 0)
            continue
        if name not in SYNTH: continue
        y = SYNTH[name](c)
        end_aligned = name in ('whoosh', 'riser', 'whip')
        t_start = c['t'] - (c.get('dur', 0) if end_aligned else 0)
        if name == 'whip': t_start = c['t'] - 0.22
        pan = 0.0
        if name in ('whoosh', 'whip', 'tear', 'cymbal', 'burst', 'glitch'):
            pan = 0.28 if idx % 2 else -0.28
        place(y, t_start, 0.9, pan)

    if music:
        mL, mR = build_music()
        L += mL; R += mR

    # 真静音窗口（定格）：含房间底噪全部归零
    a0 = int(15.10 * SR); a1 = int(15.66 * SR)
    L[a0:a1] = 0; R[a0:a1] = 0

    # 软限幅 + 峰值 -1 dBFS
    stereo = np.stack([L, R], axis=1)
    peak = np.max(np.abs(stereo))
    stereo = np.tanh(stereo / (peak + 1e-9) * 1.25)
    stereo = stereo / np.max(np.abs(stereo)) * (10 ** (-1 / 20))
    # 保证精确长度
    stereo = stereo[:N]
    return stereo

# ---------------- 配乐（120BPM） ----------------
def build_music():
    L = np.zeros(N); R = np.zeros(N)
    S16 = 0.125  # 16 分音符
    t0 = 1.0
    end = 29.5

    # 乐器
    def kick():
        d = 0.28; t = t_arr(d); f = 150 * np.exp(-t * 18) + 45
        return np.sin(2 * np.pi * f * t) * np.exp(-t * 9)
    def snare():
        d = 0.22; t = t_arr(d)
        y = bandpass(white(len(t)), 1500, 7000) * np.exp(-t * 18)
        y += np.sin(2 * np.pi * 190 * t) * np.exp(-t * 26) * 0.4
        return y
    def hat(op=1.0):
        d = 0.06; t = t_arr(d)
        y = bandpass(white(len(t)), 6000, 12000) * np.exp(-t * 60)
        return y * 0.5 * op
    def saw(f, d, det=0.0):
        t = t_arr(d)
        ph = 2 * np.pi * f * t
        y = (np.mod(ph / (2 * np.pi), 1) * 2 - 1)
        if det:
            ph2 = 2 * np.pi * f * (1 + det) * t
            y = (y + (np.mod(ph2 / (2 * np.pi), 1) * 2 - 1)) / 2
        return y
    def bass_note(f, d, grit=0.6):
        y = saw(f, d) * 0.6 + np.sin(2 * np.pi * f * t_arr(d)) * 0.4
        y = onepole_lp(y, 700)
        return y * np.clip(1 - t_arr(d) / d, 0, 1) ** 0.5
    def chord_stab(freqs, d, dist=1.0, mellow=False):
        y = np.zeros(int(d * SR))
        for f in freqs:
            s = saw(f, d, 0.012)
            y += s / len(freqs)
        if mellow:
            y = onepole_lp(y, 1400)
            env = smooth_env(t_arr(d) / 0.04) * np.exp(-t_arr(d) * 4)
        else:
            y = np.tanh(y * 2.4 * dist)
            y = onepole_lp(y, 2600)
            env = np.exp(-t_arr(d) * 6)
        return y * env
    def ride(op=0.6):
        d = 0.12; t = t_arr(d)
        y = bandpass(white(len(t)), 4000, 10000) * np.exp(-t * 22)
        return y * op

    # 和弦定义（频率）
    def hz(n):  # MIDI
        return 440 * 2 ** ((n - 69) / 12)
    CH = {
        'C': [hz(48), hz(55), hz(60)],
        'C5': [hz(48), hz(52), hz(55), hz(59)],
        'Am7': [hz(45), hz(52), hz(55), hz(59)],
        'E': [hz(52), hz(56), hz(59)],
    }

    def section(t):
        if t < 2.95: return 'big'
        if t < 5.5: return 'punk'
        if t < 7.0: return 'tension'
        if t < 10.0: return 'punk'
        if t < 14.6: return 'double'
        if t < 15.1: return 'big'
        if t < 16.5: return 'none'
        if t < 20.0: return 'jazz'
        if t < 22.0: return 'double'
        if t < 23.5: return 'riser'
        if t < 27.0: return 'double'
        if t < 27.6: return 'none'
        return 'end'

    def place(y, ts, gain, pan=0.0):
        i0 = int(round(ts * SR))
        if i0 >= N or len(y) == 0: return
        ie = min(N, i0 + len(y)); y = y[:ie - i0]
        a = (pan + 1) * np.pi / 4
        L[i0:ie] += y * gain * np.cos(a)
        R[i0:ie] += y * gain * np.sin(a)

    i = 0
    while t0 + i * S16 < end:
        ts = t0 + i * S16
        s_in = ts - int(ts)
        beat = i % 4          # 16th in quarter
        bar = (i // 8) % 2
        st = section(ts)

        if st == 'big':
            if beat == 0: place(kick(), ts, 1.0)
            if beat == 2: place(snare(), ts, 0.7)
            if beat in (0, 2): place(hat(0.5), ts, 0.5)
            if beat == 0: place(chord_stab(CH['C'], 0.9, mellow=False), ts, 0.5, -0.15)
            if beat == 0: place(bass_note(hz(36), 0.5), ts, 0.7)
        elif st == 'punk':
            if beat == 0: place(kick(), ts, 1.0)
            if beat == 2: place(snare(), ts, 0.9)
            if beat in (0, 2): place(hat(0.7), ts, 0.6)
            if beat in (1, 3): place(hat(0.5), ts, 0.4)
            if beat == 0: place(bass_note(hz(36), 0.24), ts, 0.8)
            if beat == 2: place(bass_note(hz(36), 0.24), ts, 0.7)
            if beat in (1, 3): place(chord_stab(CH['C'], 0.16), ts, 0.4, 0.2)
        elif st == 'double':
            if beat == 0: place(kick(), ts, 1.0)
            if beat == 2: place(snare(), ts, 0.9)
            place(hat(0.6), ts, 0.5)
            if beat in (0, 2): place(bass_note(hz(36), 0.12), ts, 0.7)
            if beat in (1, 3): place(bass_note(hz(43), 0.12), ts, 0.5)
            if beat == 0: place(chord_stab(CH['C'], 0.3), ts, 0.4, -0.2)
        elif st == 'tension':
            place(hat(0.4), ts, 0.35)
            if beat == 0: place(bass_note(hz(36), 0.3, 0.4), ts, 0.4)
        elif st == 'jazz':
            # swing
            swing = 0.04 if beat in (1, 3) else 0
            if beat in (0, 2): place(ride(0.5), ts + swing, 0.5)
            if beat in (1, 3): place(ride(0.35), ts + swing, 0.4)
            if beat == 0 or (beat == 2 and bar == 1):
                chord = CH['C5'] if bar == 0 else CH['Am7']
                place(chord_stab(chord, 0.5, mellow=True), ts, 0.5, -0.2 if bar == 0 else 0.2)
            if beat == 0: place(bass_note(hz(36 if bar == 0 else 33), 0.4, 0.4), ts, 0.45)
        elif st == 'riser':
            place(hat(0.3), ts, 0.25)
        elif st == 'end':
            if i == int((27.6 - t0) / S16):
                place(chord_stab(CH['E'], 2.0), 27.6, 0.6, 0)
        i += 1

    return L, R

# ---------------- 输出 ----------------
import wave
def write_wav(stereo, name):
    pcm = np.int16(np.clip(stereo, -1, 1) * 32767)
    path = os.path.join(os.path.dirname(__file__), name)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print('wrote', name, 'len', len(stereo) / SR)

if __name__ == '__main__':
    write_wav(build(music=False), 'sfx.wav')
    write_wav(build(music=True), 'sfx_music.wav')
