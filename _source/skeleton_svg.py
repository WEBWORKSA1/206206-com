"""Builds the interactive skeleton SVG used on the home page and the 206 Bone Explorer.

Every clickable region is a <g class="zone" data-zone="..."> whose id matches a zone in
src/data/bones.json. Left and right sides share a zone. Shapes are stylized, not to scale.
"""

W = 300  # viewBox width; the figure is mirrored around x = 150


def mx(x):
    return W - x


def long_bone(x1, y1, x2, y2, w, r1=None, r2=None, both=True):
    """A long bone: outlined shaft with rounded ends (epiphyses), on both sides of the body."""
    out = []
    sides = [(x1, x2)] + ([(mx(x1), mx(x2))] if both else [])
    for a, b in sides:
        out.append(f'<line class="lo" x1="{a}" y1="{y1}" x2="{b}" y2="{y2}" stroke-width="{w + 3}"/>')
        if r1:
            out.append(f'<circle class="b" cx="{a}" cy="{y1}" r="{r1}"/>')
        if r2:
            out.append(f'<circle class="b" cx="{b}" cy="{y2}" r="{r2}"/>')
        out.append(f'<line class="li" x1="{a}" y1="{y1}" x2="{b}" y2="{y2}" stroke-width="{w}"/>')
    return "\n".join(out)


def mirror_path(d_right):
    """Mirror a path made only of absolute M/L/Q/C/Z commands with x,y pairs."""
    import re
    tokens = re.findall(r"[A-Za-z]|-?\d+(?:\.\d+)?", d_right)
    out, coord_index = [], 0
    for t in tokens:
        if t.isalpha():
            out.append(t)
            coord_index = 0
            continue
        v = float(t)
        out.append(str(round(mx(v), 2)) if coord_index % 2 == 0 else t)
        coord_index += 1
    return " ".join(out)


def both_paths(d, cls="b"):
    return f'<path class="{cls}" d="{d}"/>\n<path class="{cls}" d="{mirror_path(d)}"/>'


ZONE_LABELS = {
    "head": "Skull and ears: 28 bones", "neck": "Hyoid: 1 bone", "spine": "Spine: 26 bones",
    "chest": "Chest: 25 bones", "shoulder": "Shoulders: 4 bones", "arm": "Upper arms: 2 bones",
    "forearm": "Forearms: 4 bones", "hand": "Wrists and hands: 54 bones", "pelvis": "Pelvis: 2 bones",
    "thigh": "Thighs: 2 bones", "knee": "Kneecaps: 2 bones", "leg": "Lower legs: 4 bones",
    "foot": "Ankles and feet: 52 bones",
}


def zone(zid, inner):
    label = ZONE_LABELS[zid]
    return (f'<g class="zone" data-zone="{zid}" tabindex="0" role="button" aria-label="{label}">'
            f'<title>{label}</title>\n{inner}\n</g>')


def spine():
    parts = []
    y = 104
    while y < 330:
        w = 12 if y < 140 else (13 if y < 250 else 16)
        parts.append(f'<rect class="b" x="{150 - w / 2}" y="{y}" width="{w}" height="7" rx="2.5"/>')
        y += 9
    parts.append('<path class="b" d="M138 334 L162 334 L150 368 Z"/>')
    parts.append('<path class="b" d="M147 369 L153 369 L150 380 Z"/>')
    return "\n".join(parts)


def ribs():
    parts = ['<rect class="b" x="145" y="130" width="10" height="70" rx="4"/>']
    for i in range(10):
        y = 136 + i * 10
        w = 30 + min(i, 6) * 2.4 - max(0, i - 7) * 4
        end_y = y + 12 + i * 0.6
        d = f"M155 {y} Q{150 + w + 9} {y - 4} {150 + w} {end_y}"
        parts.append(both_paths(d, "rib"))
    return "\n".join(parts)


def hand():
    parts = []
    for side in (1, -1):
        def X(x):
            return x if side == 1 else mx(x)
        for (cx, cy) in [(217, 366), (223, 364), (229, 367), (216, 373), (222, 372), (228, 374), (220, 379), (227, 380)]:
            parts.append(f'<circle class="b" cx="{X(cx)}" cy="{cy}" r="3.2"/>')
        metas = [(214, 382, 206, 398), (218, 384, 214, 406), (223, 384, 223, 408), (228, 384, 231, 406), (232, 382, 238, 402)]
        fingers = [(206, 398, 198, 414, None), (214, 406, 211, 420, 209, 430), (223, 408, 223, 423, 223, 434),
                   (231, 406, 234, 420, 236, 430), (238, 402, 242, 413, 244, 421)]
        for x1, y1, x2, y2 in metas:
            parts.append(f'<line class="lo" x1="{X(x1)}" y1="{y1}" x2="{X(x2)}" y2="{y2}" stroke-width="5"/>'
                         f'<line class="li" x1="{X(x1)}" y1="{y1}" x2="{X(x2)}" y2="{y2}" stroke-width="2.6"/>')
        for f in fingers:
            pts = [(f[0], f[1]), (f[2], f[3])] + ([(f[4], f[5])] if f[4] else [])
            for (a, b), (c, d) in zip(pts, pts[1:]):
                parts.append(f'<line class="lo" x1="{X(a)}" y1="{b + 1.5}" x2="{X(c)}" y2="{d}" stroke-width="4.4"/>'
                             f'<line class="li" x1="{X(a)}" y1="{b + 1.5}" x2="{X(c)}" y2="{d}" stroke-width="2.2"/>')
    return "\n".join(parts)


def foot():
    parts = []
    for side in (1, -1):
        def X(x):
            return x if side == 1 else mx(x)
        for (cx, cy, r) in [(167, 632, 5), (175, 633, 4), (164, 640, 3.4), (171, 641, 3.2), (178, 641, 3.2), (184, 639, 3)]:
            parts.append(f'<circle class="b" cx="{X(cx)}" cy="{cy}" r="{r}"/>')
        metas = [(162, 645, 158, 662), (167, 646, 166, 664), (172, 646, 173, 664), (178, 645, 180, 662), (184, 643, 187, 659)]
        for x1, y1, x2, y2 in metas:
            parts.append(f'<line class="lo" x1="{X(x1)}" y1="{y1}" x2="{X(x2)}" y2="{y2}" stroke-width="5"/>'
                         f'<line class="li" x1="{X(x1)}" y1="{y1}" x2="{X(x2)}" y2="{y2}" stroke-width="2.6"/>')
            parts.append(f'<line class="lo" x1="{X(x2)}" y1="{y2 + 2}" x2="{X(x2 + (x2 - x1) * 0.4)}" y2="{y2 + 9}" stroke-width="4.4"/>'
                         f'<line class="li" x1="{X(x2)}" y1="{y2 + 2}" x2="{X(x2 + (x2 - x1) * 0.4)}" y2="{y2 + 9}" stroke-width="2.2"/>')
    return "\n".join(parts)


def skeleton_svg(cls="skeleton", label="Interactive skeleton. Choose a region to see its bones."):
    head = ('<ellipse class="b" cx="150" cy="48" rx="33" ry="37"/>'
            '<path class="b" d="M127 66 Q128 96 150 101 Q172 96 173 66 Q160 74 150 74 Q140 74 127 66 Z"/>'
            '<ellipse class="hole" cx="138" cy="52" rx="8" ry="7"/><ellipse class="hole" cx="162" cy="52" rx="8" ry="7"/>'
            '<path class="hole" d="M150 60 L145.5 71 L154.5 71 Z"/>'
            '<path class="seam" d="M136 86 L164 86 M141 82 L141 90 M147 82 L147 90 M153 82 L153 90 M159 82 L159 90"/>')
    neck = '<path class="hy" d="M139 111 Q150 121 161 111"/>'
    shoulder = (both_paths("M155 124 Q177 116 201 126", "clav")
                + both_paths("M190 130 L211 132 L197 176 Z", "b scap"))
    arm = long_bone(205, 136, 214, 248, 9, 7.5, 6.5)
    forearm = long_bone(209, 258, 216, 358, 4.5, 4.5, 3.5) + long_bone(218, 258, 228, 358, 5, 4, 4.5)
    pelvis = (both_paths("M152 336 C170 320 199 322 202 340 C202 358 188 374 171 382 C162 386 155 380 155 371 Z")
              + '<ellipse class="hole" cx="171" cy="370" rx="7" ry="5.5"/><ellipse class="hole" cx="129" cy="370" rx="7" ry="5.5"/>')
    thigh = long_bone(172, 388, 166, 512, 10, 6, 8) + '<circle class="b" cx="161" cy="381" r="7"/><circle class="b" cx="139" cy="381" r="7"/>'
    knee = '<circle class="b pat" cx="166" cy="524" r="6.5"/><circle class="b pat" cx="134" cy="524" r="6.5"/>'
    leg = long_bone(166, 536, 165, 624, 8, 6.5, 5) + long_bone(179, 540, 177, 620, 3.6, 3.6, 3.6)
    body = "\n".join([
        zone("spine", spine()),
        zone("chest", ribs()),
        zone("shoulder", shoulder),
        zone("pelvis", pelvis),
        zone("arm", arm),
        zone("forearm", forearm),
        zone("hand", hand()),
        zone("thigh", thigh),
        zone("knee", knee),
        zone("leg", leg),
        zone("foot", foot()),
        zone("head", head),
        zone("neck", neck),
    ])
    return (f'<svg class="{cls}" viewBox="0 0 300 680" role="group" aria-label="{label}" '
            f'xmlns="http://www.w3.org/2000/svg">\n{body}\n</svg>')


if __name__ == "__main__":
    print(skeleton_svg())
