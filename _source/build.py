#!/usr/bin/env python3
"""206206.com static site generator.

    python3 _source/build.py                # rebuild the site in the repository root
    python3 _source/build.py --render-png   # also render PNG icons + social image (needs cairosvg or rsvg-convert)
    python3 _source/build.py --out _site    # build a separate copy instead (assets are copied in)

Content lives in _source/src/ (pages, guides, data). Styles and scripts live in the root assets/ folder,
which is both source and served output. Site-wide settings: _source/site.json. Runtime settings
(ad slots, YouTube, donation links): assets/js/config.js. The repository root is what GitHub Pages
serves; Jekyll skips the _source folder because its name starts with an underscore.
"""
import argparse
import datetime as dt
import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from skeleton_svg import skeleton_svg  # noqa: E402

ROOT = Path(__file__).resolve().parent          # _source/
REPO = ROOT.parent                               # repository root = published site
SRC = ROOT / "src"
OUT = REPO
GENERATED_JS = {"search-index.js", "bones-data.js", "calcium-foods.js", "calcium-rda.js"}
CFG = json.loads((ROOT / "site.json").read_text(encoding="utf-8"))
SITE_URL = (os.environ.get("SITE_URL") or CFG["site_url"]).rstrip("/")
CUSTOM_DOMAIN = os.environ.get("CUSTOM_DOMAIN", CFG.get("custom_domain", "")).strip()
BASE_PATH = (urlparse(SITE_URL).path.rstrip("/") or "") + "/"
ADS_CLIENT = CFG["adsense_client"]
NAME = CFG["name"]
TAGLINE = CFG["tagline"]
YEAR = dt.date.today().year

esc = html.escape

# ---------------------------------------------------------------- data

# Category colour codes map to CSS tokens: day = anatomy blue, eve = marrow coral,
# night = violet, rest = calcium teal, hist = slate.
CATS = {
    "anatomy": {"name": "Anatomy and learning", "code": "day"},
    "risk": {"name": "Bone health checks", "code": "eve"},
    "nutrition": {"name": "Nutrition", "code": "night"},
    "movement": {"name": "Movement", "code": "rest"},
}

TOOLS = [
    ("bone-explorer", "206 Bone Explorer", "anatomy", "skeleton",
     "Tap any region of an interactive skeleton to see every bone, how many there are and what they do."),
    ("bone-quiz", "Skeleton quiz and flashcards", "anatomy", "quiz",
     "Test yourself on all 206 bones with quick quizzes, flashcards and a bone of the day."),
    ("bone-health-risk-check", "Bone health risk check", "risk", "shield",
     "A private two-minute check of common osteoporosis risk factors, with clear next steps."),
    ("calcium-calculator", "Calcium and vitamin D calculator", "nutrition", "drop",
     "Add up the calcium in what you eat and compare it with the daily target for your age."),
    ("bone-exercise-planner", "Bone exercise planner", "movement", "run",
     "A weekly impact, strength and balance plan matched to your level and your bones."),
]
TOOL_BY_SLUG = {t[0]: t for t in TOOLS}

GUIDE_CATS = {
    "Anatomy": "day",
    "Bone Health": "eve",
    "Conditions": "eve",
    "Nutrition": "night",
    "Movement": "rest",
    "Meaning": "hist",
}

MORE_LINKS = [
    ("about.html", "About 206206"),
    ("what-does-206-mean.html", "What 206 means"),
    ("editorial-policy.html", "How we write and review"),
    ("support.html", "Support us"),
    ("advertise.html", "Advertise and sponsor"),
    ("list-your-practice.html", "List your practice"),
    ("careers.html", "Careers and contributors"),
    ("contact.html", "Contact"),
]

INVOLVED_LINKS = [
    ("find-care.html", "Find a bone and joint specialist"),
    ("list-your-practice.html", "List your practice"),
    ("contests.html", "Contests and prizes"),
    ("support.html", "Support us"),
    ("advertise.html", "Advertise and sponsor"),
    ("careers.html", "Careers and contributors"),
]

COMPANY_LINKS = [
    ("about.html", "About"),
    ("editorial-policy.html", "Editorial policy"),
    ("contact.html", "Contact"),
    ("privacy.html", "Privacy policy"),
    ("terms.html", "Terms of use"),
    ("disclaimer.html", "Medical disclaimer and trademarks"),
]

# ---------------------------------------------------------------- icons

ICON_PATHS = {
    "skeleton": '<circle cx="12" cy="4.5" r="2.5"/><path d="M12 7v8M8 9.5h8M8.5 12h7M9 14.5h6M12 15l-3 6M12 15l3 6M8 9.5 5.5 14M16 9.5l2.5 4.5"/>',
    "quiz": '<rect x="3.5" y="4" width="17" height="14" rx="2"/><path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4V13M12 15.6h.01M8 21h8"/>',
    "shield": '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/><path d="m8.8 12 2.3 2.3 4.4-4.6"/>',
    "drop": '<path d="M12 3.5s-6 6.6-6 11a6 6 0 0 0 12 0c0-4.4-6-11-6-11z"/><path d="M9.5 15a2.6 2.6 0 0 0 2.5 2.5"/>',
    "run": '<circle cx="15" cy="4.5" r="2"/><path d="m6 21 3.5-6 3 2.5V21M8 10.5l3-3 4 1.5 2 3.5 3 1M11 7.5 9.5 13l3 2.5"/>',
    "bone": '<path d="M7.3 4.3a2.6 2.6 0 0 0-3 3.9 2.6 2.6 0 0 0 1.4 4.3l7.8 7.8a2.6 2.6 0 0 0 4.3 1.4 2.6 2.6 0 0 0 3.9-3 2.6 2.6 0 0 0-1.3-4.4L12.6 6.5a2.6 2.6 0 0 0-4.4-1.3 2.6 2.6 0 0 0-.9-.9z"/>',
    "steth": '<path d="M5 3v6a5 5 0 0 0 10 0V3M5 3H3.5M15 3h1.5M10 14v2.5a4.5 4.5 0 0 0 9 0V14"/><circle cx="19" cy="12" r="2"/>',
    "heart": '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
    "trophy": '<path d="M7 4h10v4a5 5 0 0 1-10 0zM7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 13v4M8.5 21h7M9.5 17h5v4h-5z"/>',
    "megaphone": '<path d="M4 10v4h3l7 4V6L7 10zM17 9.5a3.5 3.5 0 0 1 0 5M7 14l1.5 5"/>',
    "clinic": '<path d="M4 21V8l8-5 8 5v13M9 21v-5h6v5M12 8v5M9.5 10.5h5"/>',
    "search": '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    "theme": '<path d="M12 3a9 9 0 1 0 0 18z" fill="currentColor"/><circle cx="12" cy="12" r="9"/>',
    "menu": '<path d="M4 7h16M4 12h16M4 17h16"/>',
    "close": '<path d="M6 6l12 12M18 6 6 18"/>',
    "chev": '<path d="m7 10 5 5 5-5"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    "out": '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    "check": '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    "play": '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
    "link": '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
}


def icon(name, cls="icon"):
    return (f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            f'stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" '
            f'focusable="false">{ICON_PATHS[name]}</svg>')


# The 206206 mark: two linked bone ends drawn as a "2-0-6" rhythm: a bone with a marrow dot.
LOGO = ('<svg class="mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">'
        '<path d="M9.2 5.6a3.4 3.4 0 0 0-3.9 5 3.4 3.4 0 0 0 1.8 5.6l8.6 8.6a3.4 3.4 0 0 0 5.6 1.8 3.4 3.4 0 0 0 5-3.9 3.4 3.4 0 0 0-1.7-5.7L16 6.9a3.4 3.4 0 0 0-5.7-1.7 3.4 3.4 0 0 0-1.1-.9z" '
        'fill="currentColor" fill-opacity=".14" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>'
        '<circle cx="15.6" cy="15.6" r="3.1" fill="var(--amber)"/></svg>')

# ---------------------------------------------------------------- source parsing

FM_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*\n", re.S)


def read_source(path):
    text = path.read_text(encoding="utf-8")
    m = FM_RE.match(text)
    if not m:
        raise SystemExit(f"{path}: missing front matter")
    meta = yaml.safe_load(m.group(1)) or {}
    meta.setdefault("slug", path.stem)
    meta["_path"] = path
    return meta, text[m.end():]


def fmt_date(value):
    if isinstance(value, str):
        value = dt.date.fromisoformat(value)
    return f"{value:%B} {value.day}, {value.year}"


def iso_date(value):
    if isinstance(value, (dt.date, dt.datetime)):
        return value.isoformat()[:10]
    return str(value)[:10]


def abs_url(slug):
    return f"{SITE_URL}/" if slug == "index" else f"{SITE_URL}/{slug}.html"


def page_href(slug):
    return "index.html" if slug == "index" else f"{slug}.html"


# ---------------------------------------------------------------- includes (shortcodes)

def inc_ad(p, ctx):
    if not ctx.get("ads", True):
        return ""
    slot = p.get("slot", "in-article")
    return f'<aside class="ad-slot ad-{esc(slot)}" data-ad="{esc(slot)}" aria-label="Advertisement"></aside>'


CTA_COPY = {
    "care": (
        "Want a specialist to look at your bones or joints?",
        "Tell us what's going on in four quick steps and we'll help you connect with a bone density service, "
        "orthopedic specialist or physiotherapist near you. Free, with no obligation.",
        "find-care.html", "Find a specialist"),
    "risk": (
        "Where do your bones stand?",
        "Take the two-minute bone health risk check. It's private, needs no sign-up, and ends with "
        "questions to bring to your next appointment.",
        "bone-health-risk-check.html", "Take the risk check"),
    "quiz": (
        "Can you name all 206?",
        "Test yourself with quick quizzes and flashcards covering every bone, region by region.",
        "bone-quiz.html", "Start the quiz"),
    "provider": (
        "Treat bones and joints?",
        "List your clinic, imaging center or physiotherapy practice and receive patient inquiries "
        "matched to your services and area.",
        "list-your-practice.html", "List your practice"),
}


def inc_cta(p, ctx):
    kind = p.get("kind", "care")
    title, text, href, label = CTA_COPY[kind]
    return (f'<div class="cta-inline cta-{kind}"><div><p class="cta-title">{title}</p><p>{text}</p></div>'
            f'<a class="btn btn-primary" href="{href}">{label}</a></div>')


CONCERNS = [
    ("bone-density", "Bone density or osteoporosis"),
    ("joint-pain", "Joint pain or arthritis"),
    ("back-neck", "Back or neck pain"),
    ("sports-injury", "Sports injury"),
    ("fracture", "Broken bone recovery"),
    ("physio", "Physiotherapy or rehab"),
    ("foot-ankle", "Foot and ankle"),
    ("other", "Something else"),
]


def inc_lead_band(p, ctx):
    heading = p.get("heading", "Get the right bone and joint care, sooner")
    buttons = "\n".join(
        f'<li><a class="pick" href="find-care.html?concern={k}">{v}</a></li>' for k, v in CONCERNS)
    return f'''<section class="lead-band" aria-labelledby="lead-band-title">
<div class="wrap lead-band-inner">
<div class="lead-band-copy">
<h2 id="lead-band-title">{esc(heading)}</h2>
<p>Answer four quick questions and we'll help you reach a bone density service, orthopedic specialist, rheumatologist or physiotherapist that fits your concern, location and coverage.</p>
<ul class="ticks">
<li>{icon("check")}About a minute, on any device</li>
<li>{icon("check")}Free, with no obligation</li>
<li>{icon("check")}You choose who contacts you, and how</li>
</ul>
</div>
<div class="lead-band-start">
<p class="lead-band-step">Start here: what would you like help with?</p>
<ul class="pick-list">{buttons}</ul>
</div>
</div>
</section>'''


def inc_provider_band(p, ctx):
    return f'''<section class="alerts-band" aria-labelledby="provider-title">
<div class="wrap alerts-inner">
<div>
<h2 id="provider-title">{esc(p.get("heading", "For clinics and practitioners"))}</h2>
<p>Orthopedic and spine clinics, bone density and imaging centers, rheumatology, physiotherapy, chiropractic and podiatry practices: list your services and receive inquiries from people looking for exactly what you offer.</p>
<p><a href="list-your-practice.html">See listing options</a></p>
</div>
<form class="form form-inline" data-form="provider-quick" data-subject="New provider listing inquiry (quick) — 206206" data-success="Thanks. We'll send listing options for your practice within two business days." novalidate>
<div class="hp" aria-hidden="true"><label>Leave this empty <input type="text" name="_honey" tabindex="-1" autocomplete="off"></label></div>
<label class="field"><span>Practice name</span><input name="practice" type="text" required autocomplete="organization"></label>
<label class="field"><span>City and country</span><input name="location" type="text" required autocomplete="address-level2"></label>
<label class="field"><span>Work email</span><input name="email" type="email" required autocomplete="email"></label>
<label class="check"><input type="checkbox" name="consent_contact" value="yes" required data-consent> <span>Contact me about listing and advertising options. I can opt out at any time.</span></label>
<button class="btn btn-primary" type="submit">Get listing options</button>
<p class="form-status" role="status" aria-live="polite"></p>
</form>
</div>
</section>'''


def tool_item(slug):
    s, name, cat, ic, desc = TOOL_BY_SLUG[slug]
    return (f'<li class="roster-item code-{CATS[cat]["code"]}"><a href="{s}.html">'
            f'<span class="roster-icon">{icon(ic)}</span>'
            f'<span class="roster-text"><strong>{esc(name)}</strong><span>{esc(desc)}</span></span></a></li>')


def inc_tool_list(p, ctx):
    if p.get("group") == "yes":
        out = []
        for key, cat in CATS.items():
            items = "\n".join(tool_item(t[0]) for t in TOOLS if t[2] == key)
            out.append(f'<section class="roster-group" aria-labelledby="grp-{key}">'
                       f'<h3 id="grp-{key}" class="roster-head code-{cat["code"]}">{cat["name"]}</h3>'
                       f'<ul class="roster">{items}</ul></section>')
        return '<div class="roster-groups">' + "\n".join(out) + "</div>"
    only = p.get("only")
    slugs = only.split(",") if only else [t[0] for t in TOOLS]
    return '<ul class="roster">' + "\n".join(tool_item(s.strip()) for s in slugs) + "</ul>"


def guide_item(g):
    code = GUIDE_CATS.get(g["category"], "hist")
    return (f'<li class="guide-item code-{code}"><a href="{g["slug"]}.html">'
            f'<span class="guide-cat">{esc(g["category"])}</span>'
            f'<strong>{esc(g["h1"])}</strong>'
            f'<span class="guide-desc">{esc(g["description"])}</span>'
            f'<span class="guide-time">{g["read_min"]} min read</span></a></li>')


def inc_guide_list(p, ctx):
    guides = ctx["guides"]
    if p.get("category"):
        cats = [c.strip() for c in p["category"].split(",")]
        guides = [g for g in guides if g["category"] in cats]
    limit = int(p.get("limit", 0) or 0)
    if limit:
        guides = guides[:limit]
    return '<ul class="guide-list">' + "\n".join(guide_item(g) for g in guides) + "</ul>"


def video_figure(v):
    vid = esc(v["id"])
    title = re.sub(r"\s+", " ", v["title"])
    return (f'<figure class="video"><button class="yt" type="button" data-yt="{vid}" '
            f'aria-label="Play video: {esc(title)}">'
            f'<img src="https://i.ytimg.com/vi/{vid}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">'
            f'<span class="yt-play">{icon("play")}</span></button>'
            f'<figcaption><strong>{esc(title)}</strong><span>{esc(v["channel"])}</span></figcaption></figure>')


def inc_video_grid(p, ctx):
    videos = ctx["videos"]
    if p.get("topic"):
        topics = [t.strip() for t in p["topic"].split(",")]
        videos = [v for v in videos if v["topic"] in topics]
    if p.get("ids"):
        wanted = [i.strip() for i in p["ids"].split(",")]
        videos = [v for i in wanted for v in ctx["videos"] if v["id"] == i]
    limit = int(p.get("limit", 0) or 0)
    if limit:
        videos = videos[:limit]
    if not videos:
        return ""
    return '<div class="video-grid">' + "\n".join(video_figure(v) for v in videos) + "</div>"


def inc_newsletter(p, ctx):
    return f'''<form class="form form-newsletter" data-form="newsletter" data-subject="New newsletter signup — 206206" data-success="You're subscribed. The next issue of The 206 Brief lands in your inbox." novalidate>
<div class="hp" aria-hidden="true"><label>Leave this empty <input type="text" name="_honey" tabindex="-1" autocomplete="off"></label></div>
<label class="field"><span>Email</span><input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></label>
<label class="field"><span>I'm mostly here for</span><select name="audience"><option>My own bone and joint health</option><option>A parent or family member</option><option>Studying anatomy</option><option>My work as a health professional</option></select></label>
<label class="check"><input type="checkbox" name="consent_newsletter" value="yes" required data-consent> <span>Send me {esc(p.get("name", "The 206 Brief"))}, about two emails a month. Unsubscribe any time.</span></label>
<button class="btn btn-primary" type="submit">Subscribe</button>
<p class="form-status" role="status" aria-live="polite"></p>
</form>'''


def inc_share(p, ctx):
    return f'''<div class="share" data-share>
<span class="share-label">Share</span>
<button type="button" class="chip" data-share-native>{icon("out")}Share</button>
<button type="button" class="chip" data-share-copy>{icon("link")}Copy link</button>
<a class="chip" data-share-to="whatsapp" href="#" target="_blank" rel="noopener">WhatsApp</a>
<a class="chip" data-share-to="facebook" href="#" target="_blank" rel="noopener">Facebook</a>
<a class="chip" data-share-to="linkedin" href="#" target="_blank" rel="noopener">LinkedIn</a>
<a class="chip" data-share-to="x" href="#" target="_blank" rel="noopener">X</a>
</div>'''


def inc_mail(p, ctx):
    label = esc(p.get("label", "Email us"))
    subject = esc(p.get("subject", "Hello from 206206.com"))
    cls = esc(p.get("class", "mail-link"))
    return f'<a class="{cls}" href="contact.html" data-mail data-subject="{subject}">{icon("mail")}{label}</a>'


def inc_icon(p, ctx):
    return icon(p.get("name", "check"))


def inc_skeleton(p, ctx):
    return skeleton_svg(p.get("class", "skeleton"))


def inc_bone_table(p, ctx):
    """Full, crawlable inventory of all 206 bones, grouped by zone (the explorer enhances it)."""
    data = ctx["bones"]
    out = []
    for z in data["zones"]:
        rows = [b for b in data["bones"] if b["zone"] == z["id"]]
        total = sum(b["count"] for b in rows)
        trs = "\n".join(
            f'<tr id="{b["id"]}"><th scope="row">{esc(b["name"])}</th><td class="num">{b["count"]}</td>'
            f'<td>{esc(b["type"])}</td><td>{esc(b["fn"])}</td></tr>' for b in rows)
        out.append(f'<details class="zone-table" id="zone-{z["id"]}" data-zone-table="{z["id"]}"><summary><span>{esc(z["name"])}</span>'
                   f'<b>{total}</b></summary><p class="muted">{esc(z["summary"])}</p><div class="table-wrap"><table>'
                   f'<thead><tr><th scope="col">Bone</th><th scope="col">Count</th><th scope="col">Shape</th>'
                   f'<th scope="col">What it does</th></tr></thead>\n<tbody>\n{trs}\n</tbody></table></div></details>')
    grand = sum(b["count"] for b in data["bones"])
    return f'<div class="bone-tables">{chr(10).join(out)}<p class="bone-total">Total: <b>{grand}</b> bones</p></div>'


INCLUDES = {
    "ad.html": inc_ad,
    "cta-inline.html": inc_cta,
    "lead-band.html": inc_lead_band,
    "provider-band.html": inc_provider_band,
    "tool-list.html": inc_tool_list,
    "guide-list.html": inc_guide_list,
    "video-grid.html": inc_video_grid,
    "newsletter.html": inc_newsletter,
    "share.html": inc_share,
    "mail.html": inc_mail,
    "icon.html": inc_icon,
    "skeleton.html": inc_skeleton,
    "bone-table.html": inc_bone_table,
}
INC_RE = re.compile(r"\{%\s*include\s+([\w\-.]+)\s*(.*?)\s*%\}")
ATTR_RE = re.compile(r'(\w+)="([^"]*)"')


def render_includes(body, ctx):
    def repl(m):
        fn = INCLUDES.get(m.group(1))
        if not fn:
            raise SystemExit(f"{ctx['slug']}: unknown include {m.group(1)}")
        return fn(dict(ATTR_RE.findall(m.group(2))), ctx)
    return INC_RE.sub(repl, body)


# ---------------------------------------------------------------- chrome

def head(meta, ctx):
    slug = meta["slug"]
    canonical = abs_url(slug)
    title = esc(meta["title"])
    desc = esc(meta["description"])
    robots = '<meta name="robots" content="noindex, follow">' if meta.get("noindex") else \
        '<meta name="robots" content="index, follow, max-image-preview:large">'
    base = f'<base href="{BASE_PATH}">\n' if slug == "404" else ""
    adsense = ""
    if ctx["adsense"]:
        adsense = (f'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={ADS_CLIENT}"\n'
                   f'     crossorigin="anonymous"></script>\n')
    og_type = "article" if meta.get("layout") == "guide" else "website"
    jsonld = "".join(f'<script type="application/ld+json">{ld_dumps(obj)}</script>\n' for obj in ctx["jsonld"])
    v = ctx["ver"]
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
{base}<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{canonical}">
{robots}
<meta name="google-adsense-account" content="{ADS_CLIENT}">
<meta name="theme-color" content="#f6f1e7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#14110f" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="{NAME}">
<meta property="og:title" content="{esc(meta.get("og_title", meta["title"]))}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{SITE_URL}/assets/img/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="206206 — {esc(TAGLINE)}: the 206 bones of the human body, explained">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,400;0,700;1,400&amp;family=Fraunces:opsz,wght@9..144,600..900&amp;display=swap">
<link rel="stylesheet" href="assets/css/style.css?v={v}">
<script>try{{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}}catch(e){{}}</script>
{adsense}{jsonld}</head>'''


def ld_dumps(obj):
    """Compact JSON-LD with a line break between list items, so no line grows huge."""
    text = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    return text.replace('},{"@type"', '},\n{"@type"')


def partner_bar():
    return (f'<a class="partner-bar" href="{esc(CFG["partner_url"])}" target="_blank" rel="noopener">'
            f'<span>{esc(CFG["partner_text"])}</span></a>')


def brand(extra=""):
    return (f'<a class="brand{extra}" href="index.html" aria-label="{NAME} home">{LOGO}'
            f'<span class="brand-word">{NAME}</span><span class="brand-sub">{esc(TAGLINE)}</span></a>')


def header(meta):
    active = meta.get("nav", "")

    def cur(key):
        return ' aria-current="page"' if key == active else ""

    groups = []
    for key, cat in CATS.items():
        links = "\n".join(f'<li><a href="{t[0]}.html">{esc(t[1])}</a></li>' for t in TOOLS if t[2] == key)
        groups.append(f'<div class="menu-group code-{cat["code"]}"><p class="menu-head">{cat["name"]}</p><ul>{links}</ul></div>')
    tools_menu = "\n".join(groups) + '<p class="menu-foot"><a href="tools.html">All tools</a></p>'
    more = "\n".join(f'<li><a href="{h}">{esc(n)}</a></li>' for h, n in MORE_LINKS)
    return f'''<header class="site-header">
<div class="wrap header-inner">
{brand()}
<nav class="main-nav" id="main-nav" aria-label="Main">
<ul class="nav-list">
<li class="has-menu"><button type="button" class="nav-btn" aria-expanded="false" aria-controls="menu-tools"{cur("tools")}>Tools{icon("chev", "icon chev")}</button>
<div class="menu menu-wide" id="menu-tools">{tools_menu}</div></li>
<li><a class="nav-link" href="guides.html"{cur("guides")}>Guides</a></li>
<li><a class="nav-link" href="conditions.html"{cur("conditions")}>Conditions</a></li>
<li><a class="nav-link" href="videos.html"{cur("videos")}>Videos</a></li>
<li><a class="nav-link" href="contests.html"{cur("contests")}>Contests</a></li>
<li class="has-menu"><button type="button" class="nav-btn" aria-expanded="false" aria-controls="menu-more"{cur("more")}>More{icon("chev", "icon chev")}</button>
<div class="menu" id="menu-more"><ul>{more}</ul></div></li>
</ul>
<a class="btn btn-primary nav-cta-mobile" href="find-care.html">Find a specialist</a>
</nav>
<div class="header-actions">
<button type="button" class="icon-btn" data-search-open aria-label="Search tools, guides and bones">{icon("search")}</button>
<button type="button" class="icon-btn" data-theme-toggle aria-label="Switch between light and dark theme">{icon("theme")}</button>
<a class="btn btn-primary btn-sm header-cta" href="find-care.html"{cur("care")}>Find a specialist</a>
<button type="button" class="icon-btn menu-toggle" aria-expanded="false" aria-controls="main-nav" aria-label="Open menu">{icon("menu")}</button>
</div>
</div>
</header>'''


def footer(ctx):
    tool_links = "\n".join(f'<li><a href="{t[0]}.html">{esc(t[1])}</a></li>' for t in TOOLS)
    guide_links = "\n".join(f'<li><a href="{g["slug"]}.html">{esc(g["short"])}</a></li>' for g in ctx["guides"])
    involved = "\n".join(f'<li><a href="{h}">{esc(n)}</a></li>' for h, n in INVOLVED_LINKS)
    company = "\n".join(f'<li><a href="{h}">{esc(n)}</a></li>' for h, n in COMPANY_LINKS)
    return f'''<footer class="site-footer">
<div class="wrap footer-top">
<div class="footer-brand">
{brand(" brand-footer")}
<p>The 206 bones of the human body, explained clearly, plus free tools and sourced guides to help you build, protect and repair them at every age.</p>
<p class="footer-mail">{inc_mail({"label": "Email us", "subject": "Hello from 206206.com"}, ctx)}</p>
</div>
<div class="footer-news">
<h2 class="footer-head">The 206 Brief</h2>
<p>New tools, bone health research in plain language, exercise ideas and contest news. About two emails a month.</p>
{inc_newsletter({}, ctx)}
</div>
</div>
<div class="wrap footer-cols">
<div><h2 class="footer-head">Tools</h2><ul>{tool_links}</ul></div>
<div><h2 class="footer-head">Guides</h2><ul>{guide_links}</ul></div>
<div><h2 class="footer-head">Get involved</h2><ul>{involved}</ul></div>
<div><h2 class="footer-head">Company</h2><ul>{company}</ul></div>
</div>
<div class="wrap footer-legal">
<p><strong>Medical disclaimer:</strong> 206206.com provides general health and anatomy education. It is not medical advice and does not replace diagnosis or treatment by a qualified clinician. Tool results are estimates for discussion with a professional. In an emergency, call your local emergency number. <a href="disclaimer.html">Read the full disclaimer</a>.</p>
<p><strong>Trademark and copyright notice:</strong> &ldquo;206206&rdquo; is used here as a descriptive numeric domain name referring to the 206 bones of the adult human skeleton. No trademark rights are claimed in the number, and 206206.com is not affiliated with, sponsored or endorsed by any company, product, carrier, organization or person that uses the numbers 206, 206206 or similar marks. Other product names and trademarks belong to their owners. Original text, tools, illustrations and code &copy; {YEAR} 206206.com; embedded videos remain the property of their creators. <a href="disclaimer.html#trademark">Read the full disclosure</a>.</p>
</div>
</footer>
<dialog class="search-dialog" id="search-dialog" aria-label="Search tools, guides and bones">
<div class="search-box">{icon("search")}<input type="search" id="search-input" placeholder="Search tools, guides and bones" autocomplete="off" aria-controls="search-results" aria-label="Search tools, guides and bones"><button type="button" class="icon-btn" data-search-close aria-label="Close search">{icon("close")}</button></div>
<ul class="search-results" id="search-results" role="listbox" aria-label="Results"></ul>
<p class="search-hint">Try &ldquo;femur&rdquo;, &ldquo;osteoporosis&rdquo; or &ldquo;calcium&rdquo;.</p>
</dialog>'''


def scripts(meta, ctx):
    v = ctx["ver"]
    tags = [f'<script src="assets/js/config.js?v={v}"></script>',
            f'<script src="assets/js/app.js?v={v}" defer></script>']
    for s in meta.get("scripts", []) or []:
        tags.append(f'<script src="assets/js/{s}.js?v={v}" defer></script>')
    return "\n".join(tags)


def breadcrumbs(trail):
    items = ['<li><a href="index.html">Home</a></li>']
    for name, href in trail[:-1]:
        items.append(f'<li><a href="{href}">{esc(name)}</a></li>')
    items.append(f'<li aria-current="page">{esc(trail[-1][0])}</li>')
    return f'<nav class="crumbs" aria-label="Breadcrumb"><ol>{"\n".join(items)}</ol></nav>'


def breadcrumb_ld(trail, slug):
    elems = [{"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE_URL}/"}]
    for i, (name, href) in enumerate(trail, start=2):
        url = abs_url(slug) if i == len(trail) + 1 else f"{SITE_URL}/{href}"
        elems.append({"@type": "ListItem", "position": i, "name": name, "item": url})
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": elems}


def faq_section(faq):
    if not faq:
        return ""
    items = "\n".join(f'<details class="faq-item"><summary>{esc(f["q"])}</summary><div class="faq-a"><p>{esc(f["a"])}</p></div></details>'
                    for f in faq)
    return f'<section class="faq" aria-labelledby="faq-title"><h2 id="faq-title">Questions people ask</h2>{items}</section>'


def faq_ld(faq):
    return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}} for f in faq]}


def sources_section(sources):
    if not sources:
        return ""
    items = "\n".join(f'<li><a href="{esc(s["url"])}" target="_blank" rel="noopener">{esc(s["title"])}</a></li>' for s in sources)
    return (f'<section class="sources" aria-labelledby="src-title"><h2 id="src-title">Sources</h2>'
            f'<p class="muted">We link to official and primary sources so you can check our work. Rules change; confirm anything important with the source.</p>'
            f'<ol>{items}</ol></section>')


def related_section(meta, ctx):
    tools = meta.get("related_tools") or []
    guides = meta.get("related_guides") or []
    if not tools and not guides:
        return ""
    parts = ['<section class="related" aria-labelledby="rel-title"><h2 id="rel-title">Keep going</h2><div class="related-grid">']
    if tools:
        parts.append('<div><h3 class="related-head">Tools</h3><ul class="roster roster-compact">'
                     + "\n".join(tool_item(s) for s in tools if s in TOOL_BY_SLUG) + "</ul></div>")
    if guides:
        gmap = {g["slug"]: g for g in ctx["guides"]}
        parts.append('<div><h3 class="related-head">Guides</h3><ul class="guide-list guide-list-compact">'
                     + "\n".join(guide_item(gmap[s]) for s in guides if s in gmap) + "</ul></div>")
    parts.append("</div></section>")
    return "\n".join(parts)


def org_ld():
    return {"@context": "https://schema.org", "@type": "Organization", "name": NAME,
            "alternateName": TAGLINE, "url": f"{SITE_URL}/",
            "logo": f"{SITE_URL}/assets/img/icon.svg"}


# ---------------------------------------------------------------- layouts

def wrap_page(meta, ctx, main_html):
    body_class = meta.get("body_class", meta.get("layout", "page"))
    no_exit = " data-no-exit" if meta.get("no_exit") else ""
    return f'''{head(meta, ctx)}
<body class="layout-{esc(body_class)}"{no_exit}>
<a class="skip" href="#main">Skip to content</a>
{partner_bar()}
{header(meta)}
<main id="main">
{main_html}
</main>
{footer(ctx)}
{scripts(meta, ctx)}
</body>
</html>
'''


def page_head_block(meta, trail=None):
    crumbs = breadcrumbs(trail) if trail else ""
    lede = f'<p class="lede">{meta["lede"]}</p>' if meta.get("lede") else ""
    return f'<div class="wrap page-head">{crumbs}\n<h1>{esc(meta.get("h1", meta["title"]))}</h1>\n{lede}</div>\n'


def layout_home(meta, body, ctx):
    return render_includes(body, ctx)


def layout_page(meta, body, ctx):
    trail = meta.get("trail") or [(meta.get("crumb", meta.get("h1", meta["title"])), page_href(meta["slug"]))]
    if meta["slug"] != "404":
        ctx["jsonld"].append(breadcrumb_ld(trail, meta["slug"]))
    content = render_includes(body, ctx)
    width = "prose-page" if meta.get("prose") else "page-body"
    inner = f'<div class="wrap {width}">{content}</div>'
    if meta.get("prose"):
        inner = f'<div class="wrap prose-wrap"><article class="prose">{content}</article></div>'
    extra = faq_section(meta.get("faq")) + sources_section(meta.get("sources"))
    if meta.get("faq"):
        ctx["jsonld"].append(faq_ld(meta["faq"]))
    extra_html = f'<div class="wrap after-article">{extra}</div>' if extra else ""
    return page_head_block(meta, trail) + inner + extra_html


def layout_hub(meta, body, ctx):
    trail = [(meta.get("crumb", meta.get("h1")), page_href(meta["slug"]))]
    ctx["jsonld"].append(breadcrumb_ld(trail, meta["slug"]))
    return page_head_block(meta, trail) + f'<div class="wrap page-body">{render_includes(body, ctx)}</div>'


def layout_tool(meta, body, ctx):
    slug = meta["slug"]
    _, name, cat, ic, desc = TOOL_BY_SLUG[slug]
    trail = [("Tools", "tools.html"), (name, page_href(slug))]
    ctx["jsonld"].append({"@context": "https://schema.org", "@type": "WebApplication", "name": meta.get("h1", name),
                          "url": abs_url(slug), "description": meta["description"],
                          "applicationCategory": "HealthApplication", "operatingSystem": "Any",
                          "isAccessibleForFree": True,
                          "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
                          "publisher": {"@type": "Organization", "name": NAME, "url": f"{SITE_URL}/"}})
    ctx["jsonld"].append(breadcrumb_ld(trail, slug))
    if meta.get("faq"):
        ctx["jsonld"].append(faq_ld(meta["faq"]))
    tool_html, _, article = body.partition("<!--article-->")
    tool_html = render_includes(tool_html, ctx)
    article = render_includes(article, ctx)
    aside_ad = inc_ad({"slot": "sidebar"}, ctx)
    kind = meta.get("cta", "care")
    title, text, href, label = CTA_COPY[kind]
    aside = f'''<aside class="tool-aside">
<div class="aside-card"><p class="cta-title">{title}</p><p>{text}</p><a class="btn btn-primary btn-block" href="{href}">{label}</a></div>
{aside_ad}
</aside>'''
    lede = f'<p class="lede">{meta["lede"]}</p>' if meta.get("lede") else ""
    if meta.get("wide"):
        aside = ""
    layout_cls = "tool-layout tool-wide" if meta.get("wide") else "tool-layout"
    return f'''<div class="wrap page-head tool-head code-{CATS[cat]["code"]}">{breadcrumbs(trail)}
<h1>{esc(meta.get("h1", name))}</h1>{lede}</div>
<div class="wrap {layout_cls}">
<section class="tool-main" aria-label="{esc(name)}">{tool_html}</section>
{aside}
</div>
<div class="wrap">{inc_ad({"slot": "after-tool"}, ctx)}</div>
<div class="wrap article-wrap"><article class="prose">{article}{related_videos(meta, body, ctx)}{inc_share({}, ctx)}</article></div>
<div class="wrap after-article">{faq_section(meta.get("faq"))}{sources_section(meta.get("sources"))}{related_section(meta, ctx)}</div>
{inc_lead_band({}, ctx)}'''


H2_RE = re.compile(r'<h2 id="([^"]+)">(.*?)</h2>', re.S)


VIDEO_TOPICS = {
    "list-of-206-bones": "anatomy", "why-babies-have-more-bones": "anatomy", "what-does-206-mean": "anatomy",
    "osteoporosis-guide": "osteoporosis", "bone-density-test-guide": "osteoporosis",
    "calcium-and-vitamin-d-guide": "nutrition", "exercises-for-strong-bones": "exercise",
    "broken-bone-healing-guide": "fractures,anatomy", "arthritis-and-joint-pain-guide": "arthritis,exercise",
    "bone-explorer": "anatomy", "bone-quiz": "anatomy", "bone-health-risk-check": "osteoporosis",
    "calcium-calculator": "nutrition", "bone-exercise-planner": "exercise",
}


def related_videos(meta, body, ctx):
    """A 'Watch' block on guides and tools that don't already embed videos: more engagement, more time on page."""
    if "video-grid" in body:
        return ""
    topic = meta.get("video_topic") or VIDEO_TOPICS.get(meta["slug"])
    if not topic:
        return ""
    grid = inc_video_grid({"topic": topic, "limit": "3"}, ctx)
    if not grid:
        return ""
    return (f'<section class="related-videos" aria-labelledby="watch-title"><h2 id="watch-title">Watch and learn</h2>'
            f'<p class="muted">Short explainers from trusted creators. Videos load only when you press play. '
            f'<a href="videos.html">All videos</a></p>{grid}</section>')


def layout_guide(meta, body, ctx):
    slug = meta["slug"]
    trail = [("Guides", "guides.html"), (meta["h1"], page_href(slug))]
    updated = meta.get("updated", CFG["launched"])
    ctx["jsonld"].append({"@context": "https://schema.org", "@type": "Article", "headline": meta["h1"],
                          "description": meta["description"], "datePublished": iso_date(CFG["launched"]),
                          "dateModified": iso_date(updated), "mainEntityOfPage": abs_url(slug),
                          "image": f"{SITE_URL}/assets/img/og-image.png",
                          "author": {"@type": "Organization", "name": "206206 editorial team", "url": f"{SITE_URL}/editorial-policy.html"},
                          "publisher": {"@type": "Organization", "name": NAME, "url": f"{SITE_URL}/",
                                        "logo": {"@type": "ImageObject", "url": f"{SITE_URL}/assets/img/icon.svg"}}})
    ctx["jsonld"].append(breadcrumb_ld(trail, slug))
    if meta.get("faq"):
        ctx["jsonld"].append(faq_ld(meta["faq"]))
    content = render_includes(body, ctx)
    toc = "\n".join(f'<li><a href="#{hid}">{re.sub("<[^>]+>", "", text)}</a></li>' for hid, text in H2_RE.findall(content))
    code = GUIDE_CATS.get(meta["category"], "hist")
    return f'''<div class="wrap page-head guide-head code-{code}">{breadcrumbs(trail)}
<p class="guide-cat">{esc(meta["category"])}</p>
<h1>{esc(meta["h1"])}</h1>
<p class="guide-meta"><span>Updated <time datetime="{iso_date(updated)}">{fmt_date(updated)}</time></span><span>{meta.get("read_min", 6)} min read</span><span>By the <a href="editorial-policy.html">206206 editorial team</a></span><span>Checked against the sources listed below</span></p>
</div>
<div class="wrap guide-layout">
<aside class="guide-aside">
<nav class="toc" aria-labelledby="toc-title"><p class="toc-title" id="toc-title">On this page</p><ol>{toc}</ol></nav>
{inc_ad({"slot": "sidebar"}, ctx)}
</aside>
<article class="prose">{content}{related_videos(meta, body, ctx)}{inc_share({}, ctx)}</article>
</div>
<div class="wrap after-article">{faq_section(meta.get("faq"))}{sources_section(meta.get("sources"))}{related_section(meta, ctx)}</div>
{inc_lead_band({}, ctx)}'''


LAYOUTS = {"home": layout_home, "page": layout_page, "hub": layout_hub, "tool": layout_tool, "guide": layout_guide}

# ---------------------------------------------------------------- build


def asset_version():
    h = hashlib.sha1()
    for p in sorted((REPO / "assets").rglob("*")):
        if p.is_file() and p.name not in GENERATED_JS and p.suffix != ".png":
            h.update(p.read_bytes())
    return h.hexdigest()[:10]


def load_guides():
    guides = []
    for path in sorted((SRC / "guides").glob("*.html")):
        meta, body = read_source(path)
        meta.setdefault("short", meta["h1"])
        guides.append((meta, body))
    order = ["list-of-206-bones", "osteoporosis-guide", "bone-density-test-guide", "calcium-and-vitamin-d-guide",
             "exercises-for-strong-bones", "broken-bone-healing-guide", "arthritis-and-joint-pain-guide",
             "why-babies-have-more-bones", "what-does-206-mean"]
    guides.sort(key=lambda g: order.index(g[0]["slug"]) if g[0]["slug"] in order else 99)
    return guides


SHORT_GUIDE_NAMES = {
    "list-of-206-bones": "All 206 bones, listed",
    "osteoporosis-guide": "Osteoporosis",
    "bone-density-test-guide": "Bone density (DXA) tests",
    "calcium-and-vitamin-d-guide": "Calcium and vitamin D",
    "exercises-for-strong-bones": "Exercises for strong bones",
    "broken-bone-healing-guide": "Broken bone healing",
    "arthritis-and-joint-pain-guide": "Arthritis and joint pain",
    "why-babies-have-more-bones": "Why babies have more bones",
    "what-does-206-mean": "What 206 means",
}


def build(render_png=False):
    in_place = OUT.resolve() == REPO.resolve()
    if in_place:
        for old in REPO.glob("*.html"):
            old.unlink()
    else:
        if OUT.exists():
            shutil.rmtree(OUT)
        OUT.mkdir(parents=True)
    ver = asset_version()
    videos = json.loads((SRC / "data" / "videos.json").read_text(encoding="utf-8"))
    bones_data = json.loads((SRC / "data" / "bones.json").read_text(encoding="utf-8"))
    assert sum(b["count"] for b in bones_data["bones"]) == 206, "bones.json must add up to 206"
    guide_pairs = load_guides()
    guides = []
    for meta, _ in guide_pairs:
        meta["short"] = SHORT_GUIDE_NAMES.get(meta["slug"], meta["h1"])
        guides.append(meta)

    pages = [read_source(p) for p in sorted((SRC / "pages").glob("*.html"))] + guide_pairs
    sitemap, search = [], []
    for meta, body in pages:
        slug = meta["slug"]
        layout = meta.get("layout", "page")
        ads = meta.get("ads", True) and slug != "404"
        # The AdSense loader (Auto ads) runs on every page with publisher content. It's left off the
        # 404 page and the two lead-form pages so ads never sit next to form buttons.
        adsense = slug != "404" and not meta.get("no_adsense")
        ctx = {"adsense": adsense, "slug": slug, "ver": ver, "guides": guides, "videos": videos, "bones": bones_data, "ads": ads, "jsonld": []}
        if slug == "index":
            ctx["jsonld"].append(org_ld())
            ctx["jsonld"].append({"@context": "https://schema.org", "@type": "WebSite", "name": NAME,
                                  "alternateName": TAGLINE, "url": f"{SITE_URL}/"})
        if layout == "tool":
            meta.setdefault("scripts", [])
            meta["scripts"] = ["tools/core"] + [s for s in meta["scripts"]]
            meta.setdefault("nav", "tools")
        if layout == "guide":
            meta.setdefault("nav", "guides")
        main_html = LAYOUTS[layout](meta, body, ctx)
        page = wrap_page(meta, ctx, main_html)
        out_name = "index.html" if slug == "index" else f"{slug}.html"
        (OUT / out_name).write_text(page, encoding="utf-8")
        if not meta.get("noindex"):
            lastmod = iso_date(meta.get("updated", CFG["launched"]))
            sitemap.append((abs_url(slug), lastmod, meta.get("priority", 0.6)))
            kind = {"tool": "Tool", "guide": "Guide"}.get(layout, "Page")
            search.append({"t": meta.get("h1", meta["title"]), "u": out_name, "d": meta["description"], "k": kind,
                           "x": " ".join(str(k) for k in (meta.get("keywords", []) or []))})

    # assets and static files
    if not in_place:
        shutil.copytree(REPO / "assets", OUT / "assets", dirs_exist_ok=True)
        (OUT / ".nojekyll").write_text("", encoding="utf-8")
    for p in (ROOT / "static").iterdir():
        if p.is_file() and p.name != "sw.js":
            shutil.copy2(p, OUT / p.name)
    if CUSTOM_DOMAIN:
        (OUT / "CNAME").write_text(CUSTOM_DOMAIN + "\n", encoding="utf-8")

    bones = bones_data
    def js_lines(items):
        return "[\n" + ",\n".join(json.dumps(x, ensure_ascii=False, separators=(",", ":")) for x in items) + "\n]"
    (OUT / "assets" / "js" / "bones-data.js").write_text(
        "window.BONES={\"zones\":" + js_lines(bones["zones"]) + ",\n\"bones\":" + js_lines(bones["bones"]) + "};\n", encoding="utf-8")
    for b in bones["bones"]:
        search.append({"t": b["name"], "u": f"bone-explorer.html#{b['id']}", "d": f"{b['region']} · {b['count']} in the body. {b['fn']}",
                       "k": "Bone", "x": " ".join(b.get("aka", []))})
    for name in ("calcium-foods", "calcium-rda"):
        data = json.loads((SRC / "data" / f"{name}.json").read_text(encoding="utf-8"))
        var = "CALCIUM_FOODS" if name == "calcium-foods" else "CALCIUM_RDA"
        (OUT / "assets" / "js" / f"{name}.js").write_text(
            f"window.{var}=" + js_lines(data) + ";\n", encoding="utf-8")
    search.sort(key=lambda r: {"Tool": 0, "Guide": 1, "Page": 2, "Bone": 3}[r["k"]])
    (OUT / "assets" / "js" / "search-index.js").write_text(
        "window.SEARCH_INDEX=[\n" + ",\n".join(json.dumps(r, ensure_ascii=False, separators=(",", ":")) for r in search) + "\n];\n",
        encoding="utf-8")

    urls = "\n".join(f"  <url><loc>{u}</loc><lastmod>{d}</lastmod><priority>{p}</priority></url>" for u, d, p in sitemap)
    (OUT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n',
        encoding="utf-8")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n", encoding="utf-8")
    (OUT / "ads.txt").write_text(f"google.com, {ADS_CLIENT.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n", encoding="utf-8")
    manifest = {
        "name": f"{NAME} — {TAGLINE}", "short_name": NAME,
        "description": "The 206 bones of the human body explained, with free bone health tools and guides.",
        "start_url": "./?source=pwa", "scope": "./", "display": "standalone",
        "background_color": "#14110f", "theme_color": "#14110f",
        "icons": [
            {"src": "assets/img/icon.svg", "sizes": "any", "type": "image/svg+xml"},
            {"src": "assets/img/icon-maskable.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "maskable"},
            {"src": "assets/img/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "assets/img/icon-512.png", "sizes": "512x512", "type": "image/png"},
        ],
    }
    (OUT / "site.webmanifest").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    sw = (ROOT / "static" / "sw.js")
    if sw.exists():
        (OUT / "sw.js").write_text(sw.read_text(encoding="utf-8").replace("__VERSION__", ver), encoding="utf-8")

    if render_png:
        render_pngs()
    print(f"Built {len(pages)} pages into {OUT} (assets v{ver}, site {SITE_URL})")


def render_pngs():
    """Render PNG icons and the social image from the SVG sources (cairosvg or rsvg-convert)."""
    img = REPO / "assets" / "img"
    dest = OUT / "assets" / "img"
    jobs = [("og-image.svg", "og-image.png", 1200, 630), ("icon.svg", "icon-192.png", 192, 192),
            ("icon.svg", "icon-512.png", 512, 512), ("icon.svg", "apple-touch-icon.png", 180, 180)]
    try:
        import cairosvg
    except ImportError:
        cairosvg = None
    for src, out, w, h in jobs:
        if not (img / src).exists():
            print(f"Skipping {out}: {src} not found")
            continue
        if cairosvg:
            cairosvg.svg2png(url=str(img / src), write_to=str(dest / out), output_width=w, output_height=h)
        else:
            subprocess.run(["rsvg-convert", "-w", str(w), "-h", str(h), str(img / src), "-o", str(dest / out)], check=True)
    print("Rendered PNG images.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--render-png", action="store_true", help="render PNG icons and social image (needs cairosvg or rsvg-convert)")
    ap.add_argument("--out", help="output folder (default: the repository root)")
    args = ap.parse_args()
    if args.out:
        OUT = (REPO / args.out).resolve()
    build(render_png=args.render_png)
