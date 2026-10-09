# 206206.com: Every Bone Counts

The 206 bones of the human body, explained: an interactive skeleton, a quiz and flashcards, a bone health risk check, a calcium and vitamin D calculator, a bone exercise planner, nine sourced guides and a conditions A–Z. Monetized with Google AdSense, YouTube embeds, a care-matching lead funnel, provider listings, sponsorships, contests and reader support.

**Live:** https://webworksa1.github.io/206206-com/ (GitHub Pages, free plan, served from the `gh-pages` branch)

## What's inside

| Area | Pages |
|---|---|
| 5 tools | 206 Bone Explorer (clickable skeleton, search, full inventory), skeleton quiz + flashcards + bone of the day, bone health risk check, calcium and vitamin D calculator, bone exercise planner |
| 9 guides | all 206 bones listed, why babies have more bones, what 206 means, osteoporosis, bone density (DXA) tests, calcium and vitamin D, exercises for strong bones, broken bone healing, arthritis and joint pain |
| Hubs | tools, guides, conditions A–Z (24 conditions), videos (14 verified embeds) |
| Lead generation | `find-care.html` (4-step funnel with visit checklist and opt-in sharing), lead band on every tool and guide, risk-check "email my result", exit-intent Starter Kit, sticky mobile CTA, `list-your-practice.html` (B2B provider listings), provider band, newsletter |
| Revenue and community | `support.html` (one-time and monthly, allocation incl. hiring), `advertise.html` (6 packages + rate-card form), `contests.html` + `contest-rules.html` (Strong Bones Challenge, $300), `careers.html` |
| Trust | `about.html`, `editorial-policy.html`, `privacy.html`, `terms.html`, `disclaimer.html` (medical disclaimer, trademark and copyright disclosure) |

Every page carries the partner bar linking to https://web.works/contact. All forms post through FormSubmit to the site inbox, which is never shown on the site: it's assembled at submit time from an obfuscated array in `assets/js/config.js`.

## Project layout

The repository root is the published site. The generator and its sources live in `_source/`, which GitHub Pages' Jekyll step skips because the folder name starts with an underscore.

```
*.html, sitemap.xml,      built pages and site files (generated: don't edit by hand)
robots.txt, ads.txt, sw.js
assets/css/style.css      design system (light and dark)                 (edit here)
assets/js/config.js       the only script to edit: ad slots, GA4, YouTube, donation links, form alias
assets/js/app.js          navigation, search, forms, funnel, ads, video, share, donations, skeleton, consent
assets/js/tools/          explorer, quiz, risk, calcium, planner + core.js
assets/js/*-data.js etc.  generated from _source/src/data
_source/build.py          static site generator
_source/skeleton_svg.py   generates the interactive skeleton SVG
_source/site.json         site URL, custom domain, AdSense publisher id, partner link
_source/src/pages/        pages: front matter + HTML (tool pages: tool UI, then <!--article-->)
_source/src/guides/       long-form guides
_source/src/data/         bones.json (must total 206), calcium-foods.json, calcium-rda.json, videos.json
_source/tests/qa.py       links, anchors, ids, JSON-LD, partner bar, AdSense meta, inbox exposure
_source/docs/             RESEARCH.md (number research, idea choice, 28-site teardown), PROMPTS.md (phase-wise build prompts)
```

## Build and check

```bash
pip install pyyaml cairosvg
python3 _source/build.py --render-png   # rebuilds the pages in the repository root
python3 _source/tests/qa.py             # must print "No problems found."
```

Commit to `main`, then bring `gh-pages` up to date with `main` (GitHub > Pull requests > New, base `gh-pages`, compare `main`, merge), or switch Settings > Pages to deploy from `main` / root.

## Go-live checklist

1. **Forms (2 minutes):** submit any form on the live site once. FormSubmit emails the site inbox an activation link; click **Activate**. Optional: paste the random-string alias FormSubmit provides into `formAlias` in `assets/js/config.js`.
2. **Images:** run `python3 _source/build.py --render-png` locally and upload `assets/img/og-image.png`, `apple-touch-icon.png`, `icon-192.png` and `icon-512.png` (GitHub > Add file > Upload files) on `main` and `gh-pages`.
3. **AdSense:** add the site in AdSense, enable Auto ads, and turn on Google's consent message for the EEA, UK and Switzerland. `ads.txt` is generated with `pub-6620975821265271`; it's read from the domain root, so it takes effect on the custom domain. For fixed units, paste slot ids into `SITE.adsense.slots` in `config.js`; until then those spots show house promos.
4. **Custom domain 206206.com:** DNS A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (AAAA `2606:50c0:8000::153` to `8003::153`), `www` CNAME to `webworksa1.github.io`. Then set `"custom_domain": "206206.com"` and `"site_url": "https://206206.com"` in `_source/site.json`, rebuild and publish (a `CNAME` file is written automatically), and tick **Enforce HTTPS** in Settings > Pages.
5. **Search Console:** verify the domain and submit `sitemap.xml`.
6. **YouTube, donations, analytics:** fill `youtube.channel`, `donate.*` and `ga4` in `config.js`. With no donation links, the support page uses a pledge form.
7. **Contest:** Season 1 promises $300 in prizes and closes November 30, 2026. Change amounts and dates in `_source/src/pages/contests.html`, `contest-rules.html` and `index.html` before promoting it if needed.
8. **Clinical review:** recruit a licensed reviewer and add named review lines to guides (see `editorial-policy.html`).

## Legal

"206206" is used as a descriptive numeric domain name referring to the 206 bones of the adult human skeleton. No trademark is claimed in the number, and the site isn't affiliated with any company, product, carrier or organization that uses 206 or 206206. Content is general education, not medical advice. See `disclaimer.html`. Inquiries about this website, the domain, sponsorship, advertising or partnership: https://web.works/contact
