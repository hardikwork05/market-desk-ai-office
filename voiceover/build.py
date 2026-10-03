# Lay the cleaned clips on one track timed to the captions, then join it to the video.
import numpy as np, subprocess, json, wave
SR, FPS_IN, FPS_OUT = 44100, 24, 21
SCALE = FPS_IN / FPS_OUT
STARTS = [2.2, 9.2, 16.2, 23.2, 30.2, 37.2, 44.7, 52.2, 59.7, 66.7, 73.7, 80.7, 87.7, 94.7, 100.7]
TOTAL = 110 * SCALE
GAIN = 10 ** (3.5 / 20)
track = np.zeros(int(TOTAL * SR) + SR, dtype=np.float32)
t, plan = 0.0, []
for i in range(15):
    y = np.load('c%02d.npy' % (i + 1)) * GAIN
    st = max(STARTS[i] * SCALE + 0.25, t + 0.3)
    a = int(st * SR)
    track[a:a + len(y)] += y
    t = st + len(y) / SR
    plan.append((round(STARTS[i] * SCALE, 2), round(st, 2), round(t, 2)))
track = track[:int(TOTAL * SR)]
print('peak %.3f' % np.max(np.abs(track)))

pcm = (np.clip(track, -1, 1) * 32767).astype('<i2')
w = wave.open('voice.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
for i, p in enumerate(plan): print(i + 1, 'caption at', p[0], 'voice', p[1], '->', p[2])
json.dump(plan, open('plan.json', 'w'))
