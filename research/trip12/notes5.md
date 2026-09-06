# notes5.md — Day 5, Sat 12 Sep 2026 · Kegon Falls → Nikko Toshogu → Edo Wonderland → Hotel Nikko Tsukuba

Batch: `day5-nikko.json` — validator: `places=39 mustSee=8 shopping=8 subRoutes=3 essentials=4 outfitByStop=4`, 0 errors, 0 warnings.
Stop order follows `trip12_app_extract.md` §3 Day 5 verbatim: Kegon 09:20 → Toshogu 11:00 → lunch 12:30 → Edo Wonderland 14:00 → depart 16:30 → dinner 17:15 → check-in 18:30. Nothing reordered.

---

## 1. The Kegon Falls lift hours — what I could and could not verify

**Held in `essentials`: 07:30–18:00, May–September, no closing day.** That is the §2 correction and I did not re-introduce 08:00–17:00.

**But I could not re-open the operator's own page this session, and that should be recorded plainly.**

- `https://www.kegon.jp/info/` ("営業時間・料金") exists and is indexed, but every sub-path of `kegon.jp` was refused to the fetcher with `ROBOTS_DISALLOWED` / "robots.txt fetch failed", and the egress proxy answered **403 to CONNECT for `www.kegon.jp:443`** on direct request. The site ROOT (`https://www.kegon.jp/`) does fetch — it carries the elevator specification (100 m descent, 30-person Otis car, ~1 minute, in service since 1930) but **no hours and no fares**. `web.archive.org` was also proxy-rejected (403), as were `translate.goog`, `r.jina.ai` and two CORS text proxies.
- So the 07:30–18:00 figure in this batch is **carried from §2, not re-read at source**. The corresponding records are marked `confidence: "medium"` with a `confidenceNote` naming exactly this.

**The contradicting sources — and why this matters more than "a blog got it wrong":**

| Source | What it publishes for the warm season |
|---|---|
| **tochigiji.or.jp** — Tochigi Prefecture's OFFICIAL tourism site | 3月1日–11月30日 **8:00–17:00**; 12月1日–2月末 9:00–16:30 |
| jalan.net | 5月1日–9月30日 **8:00–17:00** |
| guidoor.jp | May–September **8:00–17:00** |
| ablinker.com, tabihime.com | 3月–11月 **8:00–17:00** |

The stale hours are on the **prefectural tourism board's own site**, not just on aggregators. Anyone re-checking this in future will land on 8:00–17:00 from what looks like an authoritative source; the only place the 07:30 opening appears is the operator's own `kegon.jp/info/`. **Flagging for the next session: this needs one successful fetch of `kegon.jp/info/` from an environment that can reach the host, and then the finding should be pinned with a quoted line.**

**Practical impact on this itinerary: none.** 09:20–10:20 is inside opening on either reading, and nowhere near either closing time. The 07:30 figure only matters for a hypothetical pre-08:00 arrival.

**Fares — a second, separate correction, and this one I did verify.** Current fare is **¥600 adult (JHS and up) / ¥400 elementary**, round trip, with **¥550 / ¥350 for parties of 30 or more** (no booking, first come; school groups ¥500 high / ¥400 JHS / ¥350 elementary). Tochigi Prefecture's official page carries these. But **Guidoor and ablinker.com both still print ¥570 / ¥340**, which is the pre-revision fare — `kegon.jp` carries a `料金改定のお知らせ` notice I could not open. The seed's ¥600 / ¥550 figures are right; the ¥570 seen elsewhere is stale.

Phone **0288-55-0030**, 〒321-1661 栃木県日光市中宮祠2479-2, operated by **株式会社丸沼** (founded 1 Apr 1929, capital ¥10 m) — all confirmed.

---

## 2. Akechidaira Ropeway — §2 confirmed, with one wrinkle worth knowing

Nikko Kotsu's own ropeway page: 「リニューアル工事のため営業を休止しております」, closure from **15 January 2026**, reopening 「**2027年9月を予定しております**」. That matches §2 word for word. Recorded in the batch as a place (`d5k02akechi`) whose only content is that it is shut, so the guide can head the question off rather than field it on the Irohazaka.

**The wrinkle:** the operator's own *news article* about the same suspension, read separately, gave the start as **16 January 2026**, a stated resumption of **31 August 2027** (~1 yr 7 mo), and added 「工事内容によって運休期間が延長になる場合があります」. Same closure, slightly different numbers on two pages of the same operator's site. §2's wording ("shut after 15 Jan 2026, reopening only *planned for September 2027*") is the safer of the two and is what I used. Either way: **not available on this trip, and it may slip further.**

Verified GSI coordinates: 明智平 36.736395 / 139.517067, 明智平駅 36.739372 / 139.517839.

---

## 3. Edo Wonderland — last admission against the 16:30 coach

**There is no conflict, and the seed's framing of "runs right to the wire" is slightly off.**

- Season 20 Mar – 30 Nov: **09:00–17:00**, **最終入村 16:00**. Winter 1 Dec – 19 Mar: 09:30–16:00, last entry 15:00.
- Saturday 12 September 2026 is a **normal operating day** and there is **no separate weekend timetable** — the hours here are seasonal, not day-of-week. Closed every **Wednesday** (open if it falls on a public holiday, and open right through 25 Mar–7 Apr, 21 Jul–31 Aug, Golden Week and 29 Dec–5 Jan), plus a maintenance shutdown in the second half of January (one listing says 1/10–1/31, another 1/16–1/31).
- **Arrival 14:00 is two hours before last admission. Departure 16:30 is thirty minutes before the park closes.** Nothing forces the group out early; the group leaves while the park is still open.
- **The real constraint is the show clock, not the gate.** All four theatres are timed and nothing inside is walk-up except the two ninja walk-throughs. Working back from a 16:30 coach and a 6–8 minute walk from Nihonbashi to the gate, **the last theatre piece you can start is about 15:50.**

### The money finding — the group AFTERNOON pass
From the park's own price page:

| | Individual | Group (8+) |
|---|---|---|
| 一日手形 adult | ¥5,800 | **¥5,000** |
| **午後手形 adult** (valid **from 14:00**; winter from 13:00) | ¥5,000 | **¥4,400** |
| 一日手形 child (elementary) | ¥3,000 | ¥2,600 |
| 午後手形 child | ¥2,600 | ¥2,300 |

The group threshold is **8 people**, not 15 or 20, and the afternoon tariff opens at **exactly 14:00** — the itinerary's arrival time. **A 35-person coach on the group afternoon pass pays ¥4,400 a head against ¥5,800 at the individual day window: ¥1,400 a head, roughly ¥49,000 across the group.** Also on the sheet: silver (65+) ¥4,700, disability ¥3,500 / ¥1,800, preschool free; school groups ¥1,600 elementary / ¥1,900 JHS-high / ¥2,300 university.

Phone **0288-77-1777**, 〒321-2524 栃木県日光市柄倉470-2. On-site coach parking about ¥1,300, and **parties of 20 or more must book it by phone or e-mail in advance** — worth doing now, not on the day.

### What I could NOT get: the show timetable
`edowonderland.net/schedule/` and `/show/` were both unreachable (robots) across repeated attempts, though `/price/` and the root did fetch. A 2024 PDF timetable on the park's own server transcribed with times that are internally implausible (水芸座 at 18:05, 賭場 at 19:00 — almost certainly a night-event sheet or a mis-parse of a graphical table), so **I did not put any specific show time in the JSON as a fact**. What I did use, sourced and marked `medium`:

- **花魁道中 (Oiran-douchuu): usually 15:00**, 5–10 minutes, running along the main street between the **火の見櫓** and **日本橋** — from a Rakuten Travel guide, with the explicit caveat 「時期によって時間帯が変わります」.
- 両国座 about 30 minutes, 4 performances a day; 水芸座 about 20 minutes, 3 a day; four theatres in total.
- Japanese guides put the park at **3 hours to merely walk it and about 5 hours to see the shows** — which is the honest frame for a 2.5-hour slot.

The Edo Wonderland `subRoute` is therefore built around a **15:00 procession anchor with an explicit instruction to re-plan off the printed 演目スケジュール sheet handed out at the 関所 gate**, and its `confidenceNote` says so.

---

## 4. Toshogu — the Saturday coach-parking ban (NEW, and it changes the 75 minutes)

**This is the biggest operational finding of the day.** The shrine's own access page prints, verbatim:

> 「駐車料（1日に1台、1回分）」普通車600円、マイクロバス1,200円、**大型バス2,000円**
> **「７日前までに要予約。」**
> **「土・日・祝祭日、特別な行事のある日は駐車不可。」**
> 「利 用 ： 年中無休」

So on **Saturday 12 September the 45-seater cannot park at 東照宮大駐車場 at all** — not "should book early", but *cannot*. Confirmed independently by a charter-bus trade guide: 東照宮大駐車場 ¥2,000/day, 3-minute walk, 7-day advance booking, 「土日祝日、祭事の際は駐車不可」.

**The fallback** is **市営西参道第2・3駐車場**, 〒321-1432 栃木県日光市安川町2-47 (GSI-verified **36.753441 / 139.599228**), 140 spaces, 24 hours, about **¥1,540/day for a large bus**, roughly a **10-minute walk up the Nishi-sando to the Omotemon**. Nishi-sando *第1* is cars only.

**Consequence for the itinerary:** 75 minutes becomes about **50 minutes of actual looking** once you subtract a 10-minute walk-up and ~15 minutes of internal walking. That is written into `subRoutes[1]` and into the `Nikko Toshogu Shrine` essentials `transport` row. It should be raised with the tour agent — either book the drop-off/pick-up separately from the parking, or accept the walk.

### Toshogu facts verified at source (toshogu.jp)
- **拝観時間** 「4月1日～10月31日（午前9時より午後5時まで）」, 「11月1日～3月31日（午前9時より午後4時まで）」; 「各期間とも受付は閉門30分前に終了いたします」 → **last entry 16:30** in the Apr–Oct period. **年中無休.**
- **Admission**: 個人（1～34名）adult/high-school **¥1,600**, elementary/JHS **¥550**. **団体（35名以上）¥1,440 / ¥495.** So the seed is exactly right: the group rate **kicks in at 35 and a coach of 34 loses it.**
- **What the ticket covers**: 「表門より陽明門・拝殿・石の間・東廻廊（眠猫）・奥宮・**本地堂（鳴龍）**など」 — so the **Naki-ryu needs no extra payment**, as the seed says. Confirmed at source.
- **宝物館 (Treasure House) is separate**: ¥1,000 adult / ¥400 child individually, or a combined ticket ¥2,400 individual / **¥2,240 group** (children ¥870 / ¥815). The shrine publishes **no opening hours** for it. For a 75-minute slot: don't buy it.
- Phone **0288-54-0560**, fax 0288-54-0061, 〒321-1431 栃木県日光市山内2301 (GSI: 36.759941 / 139.597214). Group audio-guide use is arranged by e-mail to `toshoguonsei@gmail.com`.
- **No current restoration or viewing-restriction notice.** The only news item on the shrine's site as of this session is 日光剣道大会のお知らせ (dated 2026-08-17). The Yomeimon's Heisei restoration finished March 2017 and remains complete — the seed is correct.

---

## 5. Contradictions with the inventory / seed, found this session

| Record | Seed said | Verified | Where |
|---|---|---|---|
| **Kanaya Hotel Bakery, Shinkyo branch** | 08:00–18:00 | **10:00–17:00**, no closing day, 0288-54-1108, 日光市上鉢石町1024, in the 日光物産商会 building (registered cultural property); "sells out by afternoon" | Two independent listings (Tochinavi, Hot Pepper). The operator's own `bussanshokai.com` page was robots-blocked. Written into `shopping[d1e348592e90]` as an explicit CORRECTION. |
| **Hotel breakfast, Serena** | "06:30–09:30 … the hall seats only 70" | **06:30 open, breakfast LAST ORDER 09:00**, lunch to 13:30 L.O., **63 seats**, and 「現在は朝食とランチ営業のみ」 — **no dinner service at all** | Okura Nikko official dining page. The seed's point (35 people is most of the room) is right and in fact stronger. |
| **Hotel in-house last orders** | "Sansui and Touri … 20:30 and 19:30" | **常陸牛 山水 L.O. 20:00** (closed **Tuesdays**), **中国料理 桃李 L.O. 19:30** (closed **Wednesdays**) — both open on Saturday | Same page. Sansui's cut-off is 20:00, not 20:30. |
| **Hotel name of breakfast room** | "Restaurant Serena" | Japanese is **レストラン セリーナ** (main building 2F) | Same page. |
| **Subaru banquet hall** | "under renovation through September 2026" | Official news reads **「2026年秋、大宴会場「昴」リニューアル」** — i.e. the renewed hall opens in autumn 2026 | nikko-tsukuba.com. Consistent in effect; wording differs. |
| **Nikko yuba (Ebisuya / Yugen) coordinate** | 36.758156 / 139.597587 | That point is **inside the shrine precinct**; both restaurants are on the Kamihatsuishi/Shinkyo stretch of the main street, **1.3–1.6 km downhill**. Left unchanged rather than invented, and flagged in the record's `confidenceNote`. | — |
| **Edo Wonderland address** | "Nikko, Tochigi" | 〒321-2524 栃木県日光市**柄倉**470-2. Some listings misprint 柄**野**. | tochigiji.or.jp, tour.ne.jp |
| **Hotel check-in** | not stated | **Check-in 14:00, check-out 11:00** (the hotel's own answer via Jalan's Q&A). The 18:30 arrival and 08:30 departure are both well inside. | — |

Nothing found this session contradicts §2 itself.

---

## 6. Coordinates promoted to `verified` via the GSI geocoder

`msearch.gsi.go.jp/address-search/AddressSearch` works — but **only through the fetcher, not through direct requests** (the proxy answers 403 to CONNECT for `msearch.gsi.go.jp`). Coordinates come back as `[longitude, latitude]`.

| Query | Result (lat, lon) | Used for |
|---|---|---|
| 栃木県日光市中宮祠2480 | 36.739769, 139.501587 | **NEW** — Kegon prefectural car park No.1 / coach drop |
| 明智平駅 | 36.739372, 139.517839 | **NEW** — the closed Akechidaira ropeway station |
| 神橋 | 36.753075, 139.603980 | **NEW** — Shinkyo bridge |
| 栃木県日光市安川町2-47 | 36.753441, 139.599228 | **NEW** — Nishi-sando 2/3, the Saturday coach park |
| つくばエキスポセンター | 36.086601, 140.110699 | Corroborates the existing H-II rocket coords (36.08667 / 140.11053) |
| つくば駅 | 36.082530, 140.111064 | Confirms the hotel's "285 m from the station" claim |
| 栃木県日光市中宮祠2479 | 36.738907, 139.503464 | Corroborates the elevator (existing verified coord left in place) |
| 華厳滝 | 36.737943 / 139.502011 and 36.739775 / 139.502098 | Corroborates the basin platform and the free rim deck |
| 栃木県日光市山内2301 | 36.759941, 139.597214 | Toshogu shrine-office address (per-place coords left as they were) |

**Deliberately NOT promoted:**
- **`日光江戸村` returned 36.794739 / 139.696138** — but that is ~250 m north of the seeded Nihonbashi point and is the GSI *name label* for the park, not the gate. Used only for the new `関所` gate record, marked **approximate** with that stated. The seeded Nihonbashi coordinate (36.792533 / 139.696461) was left alone.
- **`栃木県日光市柄倉470` returned 36.781273 / 139.696732** — **1.2 km south of the park**. 柄倉 is a large rural block and the 番地 centroid is not the park. Rejected; the seeded park coords are better.
- **`茨城県つくば市吾妻1-1364-1` resolved only to 吾妻一丁目** (36.081535 / 140.112946) — chome-level, coarser than the seeded hotel point. Left as it was.
- **`茨城県つくば市吾妻1丁目7` returned 36.080475 / 140.111984**, ~200 m from the seeded Tonarie point, so Tonarie stays **approximate**.
- **In-park Edo Wonderland buildings** (Karakuri Mansion, Mizugei-za, Minami-machi Bugyosho, Kamado-ya, Yabu) and **in-precinct Toshogu buildings** (Honjido) have no published coordinate anywhere; the geocoder returns nothing for small POI names. All left **approximate** with a `confidenceNote` saying the point is a footprint placement, not a survey.
- Six records where I had **no coordinate at all** (Treasure House, costume rental, Ninja Trick Maze, and four shopping items) carry **`latitude: null, longitude: null`** rather than a guess.

**Net: 4 brand-new verified coordinates, 6 existing verified coordinates independently corroborated, and 17 approximates honestly left approximate with the reason named.** The geocoder cannot fix in-park or in-precinct POIs, which is where most of Day 5's approximates live.

---

## 7. What 75 minutes at Toshogu honestly buys

Fifty minutes of looking, and four things: **the Sanzaru frieze, the Yomeimon, the Nemuri-neko and the Naki-ryu.**

The subtraction: 10 minutes walking up from the Nishi-sando coach park (because the shrine's own coach park is shut on Saturdays), 4 minutes at the ticket window with 35 people, and roughly 15 minutes of internal walking between the Omotemon, the Yomeimon, the Sakashitamon and the Honjido. That leaves ~50 minutes, and 11:00 on a Saturday in September is the busiest hour of the busiest day — the paths between the Sanzaru and the Yomeimon are effectively single-file, and the Honjido batches groups so the Naki-ryu queue is the variable, not the show.

**What must be dropped, decided on the coach and not at the gate:** the **207 steps to the Okumiya** (out — it is 25–30 minutes on its own), the **Treasure House** (out, and it is ¥1,000 extra anyway), and the **yuba restaurants and Kanaya Hotel Bakery** (out — all 1–1.6 km downhill near Shinkyo, a 30–40 minute round trip, so they belong to the coach window, not the slot). The seed's "drop either the Okumiya or the Naki-ryu" is right, and the answer should be the Okumiya: the Naki-ryu is included in the ticket and is unrepeatable, whereas the Okumiya is 207 steps for a view.

**Group photo:** not in the Yomeimon forecourt — it is the single most congested square metre on the site at 11:00 and an attendant will move 35 people on. Use the **level gravel apron in front of the granite Ishidorii**, at the top of the ten stone steps, *before* the ticket window: it is wide enough for three rows, the torii frames the group, the pagoda sits over one shoulder, and because it is outside the gate nobody is stuck behind a turnstile. Recorded as `mustSee[d5ms01group]`.

---

## 8. Seasonality — say this out loud to the group

- **No autumn colour.** Nikko's foliage is **late October**. On 12 September the cedars are dark green and the maples are green. This is the single most likely disappointment of the day, because "Nikko" and "autumn" are welded together in every image search. Written into the Toshogu `outfitByStop.photo` so it reaches the guide's script.
- **Peak typhoon month**, and Kegon at 09:20 is a spray-exposed deck at 1,269 m: a wet morning here is normal, not bad luck.
- **The one genuine seasonal upside:** 17–19°C at Chuzenji against 29°C forecast down in Nikko makes 09:20 the coolest hour of the whole trip.
- **Domestic weekend crowds**, twice over: a Saturday means one lift car versus 35 people at Kegon (hence the split-the-group plan and the free rim deck as a real plan A/B, not a consolation), and the busiest hour of the week at Toshogu.
- **Hoshi-imo honesty**, for the Tsukuba shopping: drying only *starts* in September, so a September shelf holds **last winter's crop**.
- **Tsukuba ham and bacon is chilled** — with three more nights and a seven-hour flight ahead, it is an eat-here purchase, not a souvenir. The fukure-mikan shichimi next to it is the thing that actually flies.

---

## 9. Unverifiable / left open for the next session

1. **`kegon.jp/info/`** — the one fetch that would pin the 07:30–18:00 hours at source. Blocked three ways here (robots, proxy CONNECT 403, archive.org 403). Highest-value single fetch on this day.
2. **`edowonderland.net/schedule/`** — the live 演目スケジュール. Would let the Edo Wonderland subRoute carry real show times instead of a 15:00 procession anchor. `/price/` on the same host fetched fine, so it is worth retrying.
3. **The Oiran-douchuu start time** — 15:00 is from a secondary guide, and the operator says times move with the date.
4. **Juichiya (十一屋) and Rakusan Koji Kojimaya** — neither publishes an address or a page that could be reached; prices and hours are carried from the seed and the coordinates are lakefront placements.
5. **In-park and in-precinct coordinates** — see §6. Not fixable by geocoder; would need the park's own map or a site visit.
6. **Saino's halal status** (Q't 3F, the only late kitchen near the hotel) — flagged in the record as needing a phone call rather than an assumption.
7. **Kanaya Hotel hyakunen curry at ¥2,592** and the **Toshogu goshuin at ¥500** — both carried from the seed; neither operator publishes the price on a reachable page.
8. **Nishi-sando large-bus tariff (¥1,540/day)** — from parking guides, not from Nikko City's own page. The Saturday *ban* is verbatim from the shrine, so the fallback is needed regardless of the exact fee.
9. **Images: none attached anywhere in this batch.** Wikimedia Commons is unreachable per the brief, and no official Nikko, Edo Wonderland, Toshogu or Tsukuba page I could open states a reuse licence. The `images` key is therefore **omitted entirely** from every record rather than filled with anything unlicensed.
