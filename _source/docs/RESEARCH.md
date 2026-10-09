# 206206.com: research, idea selection and competitor teardown

Research date: October 9, 2026.

## 1. What "206" and "206206" mean

| Meaning | Reach | Commercial value | Trademark exposure |
|---|---|---|---|
| **206 bones in the adult human skeleton** | Global, every language, taught in every school | Health and education: high-CPC verticals (orthopedics, osteoporosis, physiotherapy, imaging), evergreen search demand ("206 bones list", "how many bones in the human body"), B2B lead value | None: a biological fact |
| **206 area code (Seattle, Washington)** | One metro area | Local services directory; strong but geographically narrow | Low, but a local niche caps scale |
| **HTTP 206 Partial Content** | Developers | Powers video seeking, resumable downloads and range reads in data/AI pipelines; low ad CPC, small audience | None |
| **Model number 206** | Consumer products, most famously a European supermini car (6M+ units) | Car-parts or enthusiast site | **High**: a manufacturer's registered mark. Avoided entirely |
| **The number** | 206 = 2 × 103 (semiprime); 206206 = 206 × 7 × 11 × 13 | Repeating-number domains are memorable and valued in numeric-domain markets | None |

**Decision:** build on the skeleton meaning. It is the only interpretation that is global, evergreen, trademark-free and sits on top of high-value health verticals.

## 2. Market numbers behind the decision

- Osteoporosis: about 1 in 3 women and 1 in 5 men over 50 will have an osteoporotic fracture (International Osteoporosis Foundation). Roughly 200 million people affected; IOF's earlier estimate was a fracture every 3 seconds worldwide; its current figure is up to 37 million fragility fractures a year in people over 55.
- About 10 million Americans have osteoporosis and 44 million have low bone mass (Bone Health & Osteoporosis Foundation).
- Osteoarthritis: 528 million people worldwide in 2019 (WHO). US arthritis: 53.2 million adults, 21.2% (CDC, 2019–2021).
- Orthopedic devices market: about US$51.6 billion (2024) rising to US$68.5 billion by 2030, 4.8% CAGR (MarketsandMarkets, 2025). North America holds the largest share.
- USPSTF (January 2025): screen all women 65+ and younger postmenopausal women at increased risk. That is a large, defined audience actively searching for DXA scans and risk checks.

## 3. Revenue model (ranked by expected value)

1. **Care-matching leads** (Find a Specialist funnel + provider listings). Orthopedic, DXA, physiotherapy and sports-medicine providers pay per consented request or monthly. Highest value per visitor.
2. **Google AdSense** (pub-6620975821265271): health and anatomy pages carry high-CPC orthopedic, supplement, device and insurance ads. Labeled slots on every content page + Auto ads.
3. **Sponsorships**: tool "presented by", newsletter, contest naming rights, awareness campaigns (World Osteoporosis Day Oct 20, Osteoporosis Month in May).
4. **Education traffic**: the explorer, quiz and flashcards capture students and teachers (volume, backlinks from schools).
5. **Reader support**: one-time and monthly contributions, allocated to operations, writers and reviewers, prizes, marketing and hiring.
6. **YouTube**: embedded explainers now; the site's own channel (config.js) adds a subscribe path.

## 4. Competitor teardown (28 sites fetched)

Kenhub, Innerbody, Visible Body, TeachMeAnatomy, OrthoInfo (AAOS), Bone Health & Osteoporosis Foundation, International Osteoporosis Foundation, World Osteoporosis Day site, IOF Risk Check, Royal Osteoporosis Society, Arthritis UK, Arthritis Foundation, Physiopedia, ChoosePT, Spine-health, HSS, Cleveland Clinic, Mayo Clinic, Healthline, WebMD, Zocdoc, Healthgrades, Osmosis, AnatomyZone, BoneSmart, STOP Sports Injuries, Orthobullets, Radiopaedia, Osteoporosis Canada.

What we took from them:

| Pattern | Seen on | Implemented as |
|---|---|---|
| Free interactive anatomy as the traffic engine | Innerbody, Visible Body, AnatomyZone | 206 Bone Explorer with clickable skeleton, search, full inventory |
| Spaced practice, flashcards, case of the day | Osmosis, Kenhub, Radiopaedia | Skeleton quiz, flashcards, bone of the day |
| Risk checker as lead magnet | ROS, IOF | Bone health risk check + "email my result" lead form |
| Multi-step booking funnel, location + insurance + reason | HSS, Mayo, Zocdoc | 4-step Find a Specialist funnel with visit checklist |
| Condition hubs filtered by body part | OrthoInfo, Mayo | Conditions A–Z, each with specialist + guide + care link |
| Monthly/one-time donation with presets and allocation | Osteoporosis Canada, Arthritis Foundation | Support page: presets, monthly toggle, allocation bars, pledge fallback |
| Awareness-day campaigns and challenges | IOF/WOD, BHOF, Arthritis UK | Strong Bones Challenge launched for World Osteoporosis Day |
| Medically reviewed byline, dates, sources | Healthline, Cleveland Clinic | Updated date, "checked against sources", editorial policy, sources list on every guide |
| Labeled ad slots between sections | Cleveland Clinic, Spine-health | Labeled lazy ad slots with house-promo fallback |
| Audience split (patients, students, professionals) | Visible Body, BHOF | Newsletter audience select, provider band, teacher contest category |

Gaps we exploit: OrthoInfo shows no review dates; ChoosePT has no reviewer lines; few bone-health sites combine anatomy education with care matching.
