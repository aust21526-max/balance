# usage: python3 color_check.py reference.png render.png
# Mean saturation / brightness per 4x4 grid cell, render minus reference (both resized to 9:16).
import sys
import numpy as np
from PIL import Image

def cells(path, grid=4):
    img = Image.open(path).convert("RGB").resize((144, 256)).convert("HSV")
    hsv = np.asarray(img).astype(float) / 255.0
    h, w = hsv.shape[:2]
    return np.array([(c[..., 1].mean(), c[..., 2].mean()) for y in range(grid) for x in range(grid)
                     for c in [hsv[y * h // grid:(y + 1) * h // grid, x * w // grid:(x + 1) * w // grid]]])

d = cells(sys.argv[2]) - cells(sys.argv[1])
for name, col in (("saturation", 0), ("brightness", 1)):
    worst = d[np.abs(d[:, col]).argmax(), col]
    print(f"{name}: mean delta {d[:, col].mean():+.3f}, worst cell {worst:+.3f}")
