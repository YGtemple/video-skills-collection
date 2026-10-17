#!/usr/bin/env python3
# metrics.py —— 逐帧差分量：平均帧差、连续静止帧占比、黑+红面积。目标见 prompt 第三节。
import glob, os
import numpy as np
from PIL import Image

SR_W, SR_H = 160, 90
frames = sorted(glob.glob(os.path.join(os.path.dirname(__file__), 'frames', 'frame_*.png')))
assert len(frames) == 900, len(frames)

small = np.zeros((len(frames), SR_H, SR_W, 3), dtype=np.float32)
for i, f in enumerate(frames):
    im = Image.open(f).convert('RGB').resize((SR_W, SR_H))
    small[i] = np.asarray(im, dtype=np.float32)

# 逐帧差
d = np.abs(np.diff(small, axis=0)).mean(axis=(1, 2, 3))
avg_diff = d.mean()

# 完全静止阈值
static = d < 0.5
# 标记属于“连续≥3帧静止”的帧（0.1s）
dead = np.zeros(len(frames), dtype=bool)
run = 0
for i in range(len(static)):
    run = run + 1 if static[i] else 0
# 正向扫描记录每个静止run的起点长度，再回填
i = 0
while i < len(static):
    if static[i]:
        j = i
        while j < len(static) and static[j]:
            j += 1
        if (j - i) >= 3:
            dead[i:j] = True
        i = j
    else:
        i += 1
dead_pct = dead.mean() * 100

# 黑 + 红面积（对所有帧取均值）
R = small[:, :, :, 0]; G = small[:, :, :, 1]; B = small[:, :, :, 2]
black = (R < 62) & (G < 52) & (B < 46)
red = (R > 150) & (G < 95) & (B < 75)
br_pct = ((black | red).mean()) * 100

print(f'平均帧差      : {avg_diff:6.2f}   目标 ≥ 6   -> {"PASS" if avg_diff >= 6 else "FAIL"}')
print(f'连续静止帧占比: {dead_pct:6.2f}%  目标 ≤ 10% -> {"PASS" if dead_pct <= 10 else "FAIL"}')
print(f'黑+红 面积    : {br_pct:6.2f}%  目标 ≥ 12% -> {"PASS" if br_pct >= 12 else "FAIL"}')
# 额外：找出最长静止run的位置
runs = []
i = 0
while i < len(static):
    if static[i]:
        j = i
        while j < len(static) and static[j]: j += 1
        runs.append((i, j - i)); i = j
    else: i += 1
runs.sort(key=lambda x: -x[1])
print('最长静止片段(帧起点, 长度):', runs[:5], ' 时间:', [(round(a/30,2), round(l/30,2)) for a,l in runs[:5]])
