# 206206.com: phase-wise build prompts

These prompts rebuild or extend 206206.com step by step with an AI coding assistant. Each phase is self-contained: paste it as one message, check the result, then move on. The live repo already contains the output of phases 1 to 8; use phases 9 to 12 to grow it.

**Constants for every phase**
- Domain: 206206.com. Concept: "206 bones, one body", the 206 bones of the adult human skeleton and how to keep them strong.
- Hosting: GitHub Pages free plan, repo `webworksa1/206206-com`, static HTML/CSS/vanilla JS only, built by `build.py` into `_site/`, published from the `gh-pages` branch.
- AdSense publisher: `ca-pub-6620975821265271` (loader in `<head>` of every content page, `google-adsense-account` meta, `ads.txt`).
- Top bar on every page: "Contact, if you are interested in this website / domain name / Sponsorship / Advertisement / Partnership" linking to https://web.works/contact.
- All forms post through FormSubmit to the site inbox. The inbox address must never appear anywhere on the site, in the repo or in page source: it is assembled at submit time from an XOR-obfuscated array in `assets/js/config.js`.
- Health content: general education, never medical advice; every statistic cites its source; no drug doses or brand names.
- Trademark: "206206" used descriptively; no brand that uses 206 as a model number may be named.

---

## Phase 1: Research and positioning

> Research the number 206 and the repeating form 206206 across anatomy, telecom (area code), web technology (HTTP 206), commerce (model numbers) and mathematics. For each meaning, estimate audience size, ad value, lead value and trademark risk. Pick the meaning that is global, evergreen, trademark-free and closest to high-CPC verticals, and justify it with at least five sourced statistics. Then fetch at least 25 leading sites in that niche and list, per site, its single strongest feature, its lead-generation form fields and CTAs, donation/membership patterns, contest/campaign patterns, design patterns and trust signals. Save as `docs/RESEARCH.md`.

## Phase 2: Information architecture and build system

> Create a Python static site generator `build.py` (PyYAML only) that reads `src/pages/*.html` and `src/guides/*.html` with YAML front matter, applies layouts (home, page, hub, tool, guide), expands shortcodes like `{% include ad.html %}`, `{% include cta-inline.html kind="care" %}`, `{% include lead-band.html %}`, `{% include provider-band.html %}`, `{% include video-grid.html topic="..." %}`, `{% include tool-list.html %}`, `{% include guide-list.html %}`, `{% include newsletter.html %}`, `{% include skeleton.html %}` and `{% include bone-table.html %}`, and writes `_site/` with sitemap.xml, robots.txt, ads.txt, a web manifest, a search index, a service worker and canonical, Open Graph and JSON-LD (Organization, WebSite, BreadcrumbList, FAQPage, Article, WebApplication) on every page. Settings live in `site.json` (site URL, custom domain, AdSense client, partner link and text). Every page gets the partner bar, header with mega-menu, footer with newsletter, medical disclaimer and trademark notice, and a search dialog.

## Phase 3: Design system

> Write `assets/css/style.css` as a token-based design system: bone-ivory background, marrow-coral accent (#c4402a, white text passes 4.5:1), calcium teal, anatomy blue and violet category colors, warm ink for dark bands. Fraunces for display, Atkinson Hyperlegible Next for body text (chosen for older readers). Full dark mode via `prefers-color-scheme` and a manual toggle stored in localStorage. Components: hero, roster tool lists, guide lists, stats, lead band, provider band, forms (choice chips, segmented controls, multi-step funnel with progress bar), tool layout with sticky aside, results panels, prose with callouts and tables, labeled ad slots, video facades, tiers, panels, countdown, donation amounts and allocation bars, FAQ accordions, search dialog, modal, toast, cookie notice, sticky mobile CTA, print styles. Mobile-first, 16px gutters, no horizontal scroll at 390px.

## Phase 4: Data and the interactive skeleton

> Create `src/data/bones.json` with 13 zones (head, neck, spine, chest, shoulder, arm, forearm, hand, pelvis, thigh, knee, leg, foot) and 62 bone groups, each with id, name, other names, region, zone, count, shape type, function and a fact; the counts must total exactly 206 (axial 80, appendicular 126) and the build must assert it. Write `skeleton_svg.py` to generate an accessible, stylized front-view skeleton SVG in which each zone is a focusable `<g class="zone" role="button">` with a title. Build the 206 Bone Explorer (`assets/js/tools/explorer.js`): click or keyboard-select a zone to list its bones as cards, chips for every zone, live search by any name, deep links (`#zone-hand`, `#femur`), an overview tally, and a crawlable full inventory table rendered at build time.

## Phase 5: Tools

> Build four more vanilla-JS tools, each with a tool page (UI, then an explanatory article, FAQ and sources): (1) Skeleton quiz with five question generators, 10-question rounds, streaks saved locally, flashcards and a deterministic bone of the day; (2) Bone health risk check covering sex, age, low-trauma fracture after 50, parental hip fracture, long-term glucocorticoids, height loss, rheumatoid arthritis, secondary causes, early menopause, falls, smoking, alcohol, BMI from height and weight in either unit system, activity, calcium and vitamin D, producing a three-tier result with explanations, a FRAX link, a find-care CTA and an "email my result" lead form, clearly labeled as not a diagnosis; (3) Calcium and vitamin D calculator using NIH ODS RDAs and ULs by life stage and verified food values, with steppers, supplement input, gauge and safety tips; (4) Bone exercise planner that turns age, fitness, bone status, balance, days and equipment into a 7-day impact, strength, balance and posture plan following WHO 2020 guidelines and Royal Osteoporosis Society advice, with low-impact substitutions for spinal fractures or falls and a print button.

## Phase 6: Content

> Write nine long-form guides (1,400 to 2,100 words, original wording, each with 5–6 FAQs and 6–10 verified sources): all 206 bones listed by region; why babies have more bones; what 206 means; osteoporosis; bone density (DXA) tests and T-scores; calcium and vitamin D; exercises for strong bones; broken bone healing; arthritis and joint pain. Add a Conditions A–Z hub with 24 conditions (what it is, who it affects, which specialist, links to guides and the care funnel), a Tools hub, a Guides hub and a Videos page with verified YouTube embeds (check every ID through YouTube oEmbed) loaded through privacy-enhanced facades.

## Phase 7: Lead generation and monetization

> Build `find-care.html`: a 4-step funnel (concern; who, age, duration, history; kind of care, timing, coverage, visit type, country and city; contact details with separate consents for contact, sharing with up to three providers and the newsletter), emergency warning, progress saved locally without personal details, deep-link presets (`?concern=bone-density`), a generated visit checklist and a summary. Add a lead band with eight concern shortcuts on every tool and guide page, a sticky mobile CTA, an exit-intent "Strong Bones Starter Kit" modal and a provider listing page with a B2B form. Add labeled AdSense slots (in-article, sidebar, after-tool, home) filled from slot ids in `config.js`, falling back to house promos.

## Phase 8: Community, donations, careers and legal

> Build `support.html` (one-time/monthly toggle, preset amounts, custom amount, allocation to operations, writers and reviewers, contest prizes, marketing, hiring; PayPal/Stripe/Buy Me a Coffee/Ko-fi/Patreon buttons appear when links are set in `config.js`, otherwise a pledge form), `contests.html` and `contest-rules.html` (Strong Bones Challenge: idea and class-art categories, $300 in prizes, countdown, skill-based judging criteria, no purchase necessary, void where prohibited), `advertise.html` (six packages and a rate-card form), `careers.html` (nine roles including clinical reviewers), `about.html`, `editorial-policy.html`, `contact.html`, `privacy.html` (AdSense cookie disclosure, health-data handling, rights under GDPR, PIPEDA, Law 25, India's DPDP Act and US state laws), `terms.html` and `disclaimer.html` (medical disclaimer, money disclosure, trademark and copyright disclosure). Then run `tests/qa.py` (links, anchors, duplicate ids, JSON-LD, partner bar, AdSense meta, inbox exposure) and fix everything it reports.

---

## Phase 9: Go live (owner tasks)

> Walk me through: submitting one form and activating FormSubmit; adding the site to AdSense and turning on Auto ads plus Google's EEA consent message; pointing 206206.com DNS to GitHub Pages (four A records, four AAAA records, `www` CNAME), setting `custom_domain` and `site_url` in `site.json`, rebuilding, publishing and enforcing HTTPS; verifying in Google Search Console and submitting the sitemap; uploading the PNG icons and social image; filling YouTube, donation and GA4 settings in `config.js`.

## Phase 10: Programmatic SEO expansion

> Generate one page per bone group (62 pages) from `bones.json` using a new `bone` layout: hero with the skeleton highlighting that bone's zone, facts table, common injuries, related conditions, quiz CTA, care CTA, two ad slots, breadcrumb and FAQ JSON-LD. Then generate one page per zone (13 pages). Add all to the sitemap and search index. Keep every claim sourced.

## Phase 11: Growth features

> Add: a printable, labeled skeleton worksheet generator for teachers; a fracture-recovery timeline tool; a fall-risk home checklist with a printable result; Spanish and French versions of the top five pages with hreflang; a weekly "bone of the week" newsletter template; a supporters wall and contest winners gallery driven by JSON files.

## Phase 12: Optimization loop

> Using Search Console and AdSense data, list the top 20 pages by impressions and RPM, rewrite titles and descriptions for CTR, move the highest-earning ad slot above the fold on the top 5 guides, A/B the find-care CTA wording on the lead band, and add internal links from the top guides to the funnel. Report changes and expected impact.
