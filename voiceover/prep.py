# Clean each voice clip: trim edge silence, cap long pauses, even out loudness.
# Then try a few video speeds and report how the narration lines up with the captions.
import subprocess, sys, json
import numpy as np

SR = 44100
STARTS = [2.2, 9.2, 16.2, 23.2, 30.2, 37.2, 44.7, 52.2, 59.7, 66.7, 73.7, 80.7, 87.7, 94.7, 100.7]
CAP_END = 108.2
MAX_PAUSE = float(sys.argv[1]) if len(sys.argv) > 1 else 0.5
TARGET_RMS_DB = -20.0   # speech-only RMS target, before the final limiter


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def envelope(x, win=0.02):
    n = int(SR * win)
    pad = np.pad(x ** 2, (n // 2, n - n // 2 - 1), mode='edge')
    c = np.cumsum(np.insert(pad, 0, 0.0))
    return np.sqrt((c[n:] - c[:-n]) / n)


def silences(x, thr_db=-40.0, min_len=0.15):
    env = envelope(x)
    quiet = env < 10 ** (thr_db / 20)
    out, i, n = [], 0, len(x)
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            if (j - i) / SR >= min_len:
                out.append((i, j))
            i = j
        else:
            i += 1
    return out


def clean(x):
    sil = silences(x)
    n = len(x)
    # Edges: keep 40 ms of room either side of the speech.
    a = sil[0][1] - int(0.04 * SR) if sil and sil[0][0] == 0 else 0
    b = sil[-1][0] + int(0.08 * SR) if sil and sil[-1][1] >= n - 1 else n
    a, b = max(0, a), min(n, b)
    keep, pos, cut = [], a, 0.0
    fade = int(0.012 * SR)
    for s, e in sil:
        if s <= a or e >= b:
            continue
        d = (e - s) / SR
        if d > MAX_PAUSE:
            drop = int((d - MAX_PAUSE) * SR)
            mid = (s + e) // 2
            c0, c1 = mid - drop // 2, mid + (drop - drop // 2)
            seg = x[pos:c0].copy()
            seg[-fade:] *= np.linspace(1, 0, fade)
            keep.append(seg)
            pos = c1
            x[c1:c1 + fade] *= np.linspace(0, 1, fade)
            cut += drop / SR
    keep.append(x[pos:b].copy())
    y = np.concatenate(keep)
    y[:fade] *= np.linspace(0, 1, fade)
    y[-fade:] *= np.linspace(1, 0, fade)
    # Loudness: match the RMS of the voiced parts only.
    env = envelope(y)
    voiced = y[env > 10 ** (-40 / 20)]
    rms_db = 20 * np.log10(np.sqrt(np.mean(voiced ** 2)) + 1e-9)
    y *= 10 ** ((TARGET_RMS_DB - rms_db) / 20)
    return y, cut, rms_db


clips, info = [], []
for i in range(15):
    x = load('%02d.mp3' % (i + 1))
    y, cut, rms = clean(x)
    clips.append(y)
    info.append((len(x) / SR, len(y) / SR, cut, rms, float(np.max(np.abs(y)))))
    np.save('c%02d.npy' % (i + 1), y)

print('clip  raw   clean  pause-cut  voiced-rms  peak-after-gain')
for i, r in enumerate(info):
    print('%2d   %5.2f  %5.2f   %5.2f     %6.1f      %.2f' % (i + 1, *r))
durs = [r[1] for r in info]
print('total speech %.1f s' % sum(durs))


def plan(scale, tempo=1.0, lead=0.25, gap=0.3):
    t, rows = 0.0, []
    for i, d in enumerate(durs):
        cap = STARTS[i] * scale
        nxt = (STARTS[i + 1] if i < 14 else CAP_END) * scale
        st = max(cap + lead, t + gap)
        en = st + d / tempo
        rows.append((st, en, st - cap, en - nxt))
        t = en
    return rows


for fps in (24, 23, 22, 21, 20):
    for tempo in (1.0, 1.04, 1.07):
        rows = plan(24 / fps, tempo)
        late = max(r[2] for r in rows)
        over = max(r[3] for r in rows)
        print('fps %d tempo %.2f: video %.1f s, worst late start %.2f s, worst overrun past next caption %.2f s, voice ends %.1f' %
              (fps, tempo, 110 * 24 / fps, late, over, rows[-1][1]))
json.dump(durs, open('durs.json', 'w'))
