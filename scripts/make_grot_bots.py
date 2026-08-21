#!/usr/bin/env python3
"""Official Grok Bot shapes from the @bot launch video: flat color, white pills."""
from pathlib import Path
from PIL import Image, ImageDraw
import math

OUT = Path("/Users/dknob/kettlebelldan.github.io/public/grot_bot_merge/bots")
OUT.mkdir(parents=True, exist_ok=True)
S = 1024
CX = CY = S / 2


def new():
    return Image.new("RGBA", (S, S), (0, 0, 0, 0))


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4)) + (255,)


def stamp_pills(img, cx, cy, scale, rot_deg=-24, style="pills"):
    if style == "dots":
        specs = [(-0.18, -0.12, 0.22, 0.16), (0.18, -0.16, 0.18, 0.14)]
        rot_deg = -18
    else:
        specs = [(-0.17, -0.14, 0.16, 0.36), (0.18, -0.20, 0.14, 0.32)]
    rad = math.radians(rot_deg)
    cos, sin = math.cos(rad), math.sin(rad)
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for lx, ly, w, h in specs:
        # unrotated local, then we'll rotate the layer around (cx,cy)
        x = cx + lx * scale
        y = cy + ly * scale
        ww, hh = w * scale, h * scale
        d.rounded_rectangle(
            [x - ww / 2, y - hh / 2, x + ww / 2, y + hh / 2],
            radius=min(ww, hh) / 2,
            fill=(255, 255, 255, 255),
        )
    layer = layer.rotate(-rot_deg, resample=Image.Resampling.BICUBIC, center=(cx, cy))
    img.alpha_composite(layer)


def circle(color, r=0.40):
    img = new()
    d = ImageDraw.Draw(img)
    rr = r * S
    d.ellipse([CX - rr, CY - rr, CX + rr, CY + rr], fill=hex_rgb(color))
    stamp_pills(img, CX, CY, rr)
    return img


def bean(color):
    img = new()
    d = ImageDraw.Draw(img)
    # squat oval
    d.ellipse([CX - 0.42 * S, CY - 0.34 * S, CX + 0.42 * S, CY + 0.36 * S], fill=hex_rgb(color))
    stamp_pills(img, CX, CY + 0.02 * S, 0.36 * S)
    return img


def teardrop(color):
    img = new()
    d = ImageDraw.Draw(img)
    col = hex_rgb(color)
    # Smooth water-drop pointing up (matches the blue bot in the video).
    for off, r in (
        (0.14, 0.33),
        (0.00, 0.28),
        (-0.12, 0.21),
        (-0.23, 0.14),
        (-0.32, 0.085),
    ):
        y = CY + off * S
        rr = r * S
        d.ellipse([CX - rr, y - rr, CX + rr, y + rr], fill=col)
    stamp_pills(img, CX + 0.02 * S, CY + 0.12 * S, 0.28 * S, style="dots")
    return img


def heart(color):
    img = new()
    d = ImageDraw.Draw(img)
    col = hex_rgb(color)
    pts = []
    for i in range(240):
        t = 2 * math.pi * i / 240
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((CX + x * 0.022 * S, CY - y * 0.022 * S + 0.04 * S))
    d.polygon(pts, fill=col)
    stamp_pills(img, CX, CY + 0.04 * S, 0.26 * S)
    return img


def blob(color, lobes=4):
    img = new()
    d = ImageDraw.Draw(img)
    col = hex_rgb(color)
    R = 0.22 * S
    if lobes == 3:
        angs = [-90, 30, 150]
        dist = 0.16 * S
    else:
        angs = [-40, 50, 140, 230]
        dist = 0.17 * S
    d.ellipse([CX - 0.26 * S, CY - 0.26 * S, CX + 0.26 * S, CY + 0.26 * S], fill=col)
    for a in angs:
        rad = math.radians(a)
        x = CX + math.cos(rad) * dist
        y = CY + math.sin(rad) * dist
        d.ellipse([x - R, y - R, x + R, y + R], fill=col)
    stamp_pills(img, CX + 0.02 * S, CY - 0.02 * S, 0.30 * S)
    return img


def peanut(color):
    """Vertical double-bump like the orange/teal stack blobs."""
    img = new()
    d = ImageDraw.Draw(img)
    col = hex_rgb(color)
    d.ellipse([CX - 0.34 * S, CY - 0.44 * S, CX + 0.34 * S, CY + 0.04 * S], fill=col)
    d.ellipse([CX - 0.36 * S, CY - 0.08 * S, CX + 0.36 * S, CY + 0.44 * S], fill=col)
    stamp_pills(img, CX, CY - 0.10 * S, 0.30 * S)
    return img


BOTS = [
    ("bot_00", lambda: circle("#111111", 0.40)),
    ("bot_01", lambda: circle("#F39A12", 0.40)),
    ("bot_02", lambda: circle("#2EC8A6", 0.40)),
    ("bot_03", lambda: bean("#E24A1B")),
    ("bot_04", lambda: teardrop("#2F80ED")),
    ("bot_05", lambda: heart("#8A8A8A")),
    ("bot_06", lambda: peanut("#C4782A")),
    ("bot_07", lambda: blob("#2EC8A6", 3)),
    ("bot_08", lambda: blob("#E24A1B", 4)),
    ("bot_09", lambda: blob("#3A3A3A", 4)),
    ("bot_10", lambda: circle("#111111", 0.42)),
]


def trim_pad(im, pad=40):
    bbox = im.getbbox()
    if not bbox:
        return im
    im = im.crop(bbox)
    # square pad
    side = max(im.size) + pad * 2
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - im.size[0]) // 2, (side - im.size[1]) // 2), im)
    return canvas.resize((512, 512), Image.Resampling.LANCZOS)


if __name__ == "__main__":
    for name, fn in BOTS:
        im = trim_pad(fn())
        path = OUT / f"{name}.png"
        im.save(path)
        print("wrote", path, im.size)
