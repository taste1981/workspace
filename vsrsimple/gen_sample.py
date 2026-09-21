"""Generate test images for the WebNN SR webapp (2:3 aspect, 480x720).

Usage: python gen_sample.py   -> writes samples/sr_test_pattern_480x720.png
                                 and samples/sr_test_smooth_480x720.png
"""
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'samples')
W, H = 480, 720


def font(size, bold=False):
    for path in (r'C:\Windows\Fonts\segoeuib.ttf' if bold else
                 r'C:\Windows\Fonts\segoeui.ttf',
                 r'C:\Windows\Fonts\arialbd.ttf',
                 r'C:\Windows\Fonts\arial.ttf'):
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def gradient_v(w, h, top, bottom):
    t = np.linspace(0, 1, h)[:, None, None]
    top_a = np.array(top, dtype=np.float64).reshape(1, 1, 3)
    bottom_a = np.array(bottom, dtype=np.float64).reshape(1, 1, 3)
    return np.broadcast_to(top_a * (1 - t) + bottom_a * t,
                           (h, w, 3)).astype(np.uint8)


def zone_plate(w, h, k=0.012, gray=True):
    y, x = np.mgrid[0:h, 0:w]
    r2 = (x - w / 2) ** 2 + (y - h / 2) ** 2
    z = 0.5 + 0.5 * np.sin(k * r2)
    img = (z * 255).astype(np.uint8)
    if gray:
        return np.stack([img] * 3, -1)
    hue = 0.5 + 0.4 * np.sin(0.0009 * r2)
    return (np.stack([z * 255 * (0.5 + 0.5 * np.sin(hue * 2 * np.pi)),
                      z * 255 * (0.5 + 0.5 * np.sin(hue * 2 * np.pi + 2.09)),
                      z * 255 * (0.5 + 0.5 * np.sin(hue * 2 * np.pi + 4.19))],
                     -1)).astype(np.uint8)


def checker(w, h, cell):
    y, x = np.mgrid[0:h, 0:w]
    c = (((x // cell) + (y // cell)) % 2) * 255
    return np.stack([c] * 3, -1).astype(np.uint8)


def build_pattern():
    img = np.zeros((H, W, 3), np.uint8)
    img[:] = gradient_v(W, H, (34, 52, 72), (18, 90, 78))
    im = Image.fromarray(img)
    d = ImageDraw.Draw(im)

    # --- title block: sharp text at decreasing sizes -------------------
    d.text((28, 24), 'Super Resolution', font=font(58, bold=True),
           fill=(255, 255, 255))
    d.text((28, 96), '3x luma upscale test', font=font(30),
           fill=(255, 214, 120))
    d.text((28, 140), 'Small text 22px -- edge sharpness', font=font(22),
           fill=(230, 240, 250))
    d.text((28, 172), 'Smaller text 16px -- more detail', font=font(16),
           fill=(200, 215, 230))
    d.text((28, 198), 'Tiny text 12px - finest detail', font=font(12),
           fill=(170, 190, 210))

    # --- pattern band: zone plate + checkerboards -----------------------
    d.rectangle([16, 232, 232, 440], outline=(200, 220, 240), width=2)
    im.paste(Image.fromarray(zone_plate(216, 208, gray=False)),
             (17, 233))
    d.rectangle([252, 232, 464, 300], outline=(200, 220, 240), width=2)
    im.paste(Image.fromarray(checker(212, 68, 16)), (253, 233))
    d.rectangle([252, 316, 392, 372], outline=(200, 220, 240), width=2)
    im.paste(Image.fromarray(checker(140, 56, 8)), (253, 317))
    d.rectangle([408, 316, 464, 372], outline=(200, 220, 240), width=2)
    im.paste(Image.fromarray(checker(56, 56, 4)), (409, 317))
    d.rectangle([252, 388, 464, 440], outline=(200, 220, 240), width=2)
    im.paste(Image.fromarray(checker(212, 52, 2)), (253, 389))

    # --- fine geometry: concentric circles + spokes ---------------------
    cx, cy, R = 120, 545, 84
    d.ellipse([cx - R, cy - R, cx + R, cy + R], outline=(255, 255, 255), width=2)
    for r in range(R - 12, 8, -12):
        d.ellipse([cx - r, cy - r, cx + r, cy + r],
                  outline=(220, 235, 250), width=1)
    for ang in range(0, 360, 15):
        import math
        x2, y2 = cx + R * math.cos(math.radians(ang)), \
            cy + R * math.sin(math.radians(ang))
        d.line([cx, cy, x2, y2], fill=(255, 214, 120), width=1)
    # diagonal hair lines
    for i in range(-40, 41, 4):
        d.line([240 + i, 452, 464, 452 + i * 2], fill=(235, 245, 255), width=1)

    # --- color band: patches + smooth gradient (chroma fusion test) -----
    cols = [(230, 60, 60), (60, 200, 90), (70, 120, 235), (240, 205, 60)]
    for i, c in enumerate(cols):
        d.rectangle([28 + i * 110, 648, 118 + i * 110, 700], fill=c)
    t = np.linspace(0, 1, 428)
    for i, tt in enumerate(t):
        d.line([(26 + i, 618), (26 + i, 636)],
               fill=(int(70 + 180 * tt), int(80 + 90 * (1 - tt)),
                     int(180 - 110 * tt)))
    # radial smooth gradient disc (natural-content proxy)
    yy, xx = np.mgrid[0:120, 0:120]
    rr = np.sqrt((xx - 60) ** 2 + (yy - 60) ** 2)
    g = np.clip(1 - rr / 60, 0, 1)
    disc = np.stack([(60 + 190 * g), (150 - 90 * g), (200 - 130 * g)],
                    -1).astype(np.uint8)
    im.paste(Image.fromarray(disc), (330, 560))

    d.rectangle([4, 4, W - 5, H - 5], outline=(255, 255, 255), width=2)
    return im


def build_smooth():
    """Soft natural-content proxy: smooth gradients + gentle blobs."""
    img = gradient_v(W, H, (120, 60, 90), (30, 110, 160))
    im = Image.fromarray(img)
    d = ImageDraw.Draw(im)
    import math
    rng = np.random.default_rng(7)
    for _ in range(26):
        x, y = rng.uniform(0, W), rng.uniform(0, H)
        r = rng.uniform(24, 70)
        d.ellipse([x - r, y - r, x + r, y + r],
                  fill=tuple(rng.integers(40, 220, 3).tolist()))
    yy, xx = np.mgrid[0:H, 0:W]
    v = 0.55 + 0.45 * np.sin(xx / 45) * np.cos(yy / 60)
    im2 = np.asarray(im).astype(np.float64) * v[..., None]
    im = Image.fromarray(np.clip(im2, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    d.text((28, 30), 'Smooth gradients', font=font(40, bold=True),
           fill=(255, 255, 255))
    d.text((28, 84), 'gentle texture, no hard edges', font=font(20),
           fill=(240, 244, 250))
    d.rectangle([4, 4, W - 5, H - 5], outline=(255, 255, 255), width=2)
    return im


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, fn in (('sr_test_pattern_480x720.png', build_pattern),
                     ('sr_test_smooth_480x720.png', build_smooth)):
        path = os.path.join(OUT, name)
        fn().save(path, 'PNG')
        print(f'wrote {path} ({os.path.getsize(path)} bytes)')


if __name__ == '__main__':
    main()
