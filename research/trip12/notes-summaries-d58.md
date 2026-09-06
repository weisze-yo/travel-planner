# notes-summaries-d58.md — the five-line `stopSummary` block, Days 5–8 plus the seed-less stops

**What this batch is.** `summaries-d58.json` carries a `stopSummary` block per stop with five lines —
`do`, `eat`, `snack`, `buy`, `see` — built for the app to render directly, not for the unusable `x`
block the seed's prose lives in. Every line is under 500 characters, every line is non-empty, and the
whole file passes `validate_research.py` with 0 errors and 0 warnings (the validator ignores unknown
top-level keys, so that is a JSON-well-formedness check, not a content check — the content check is
this file).

**The `snack` line is new.** On an all-meals-included coach tour every meal is already booked, so the
question that actually gets asked is *what do I buy and eat standing up in twenty minutes*. Each
`snack` line is judged against the stop's real clock window, not a generic visit, and where a stop
genuinely has no standing food the line says so instead of padding. Four lines say it plainly:
Toshogu (Saturday walk-up, nothing inside the precinct in our records), Shibuya (no stalls at the
junction), Matsuya (no konbini within 500 m, drink corner shut before arrival) and Mercure (no bath
town, nearest Seven-Eleven a 20-minute unlit walk).

---

## THE COUNT — read this first

The brief asks for **18 stops** and **five written from scratch**, but names only **13 + 3 = 16**, and
the arithmetic does not close in the source data either. Checked against the seed and
`validate_research.py`'s own whitelist:

| | |
|---|---|
| ACTIVE stops on the 4 Sep itinerary | 29 |
| ACTIVE stops with **no** seed prose | 4 — `Hotel Metropolitan Tokyo Haneda`, `Ooedo Onsen Monogatari Naruko Onsen Kounkaku`, `Mercure Miyagi Zao Resort & Spa`, `Kinugawa Onsen Hana no Yado Matsuya` |
| of those, genuinely NEW properties | 3 — Kounkaku, Mercure, Matsuya. `Hotel Metropolitan Tokyo Haneda` is a **rename in place** (JR East's official English name, same address, same phone) whose seed prose exists under `Hotel Metropolitan Haneda`, so it is not a from-scratch stop |
| plus the declared BACKUP stop | 1 — `Ginza` |
| **genuinely seed-less stops** | **4**, not five |

So this batch emits **17** keys: the 13 named carry-forward stops, the 3 named from-scratch stops,
plus **`Ooedo Onsen Monogatari Naruko Onsen Kounkaku`** — the one remaining stop in the validator's
ACTIVE set with no seed prose at all, which the brief's own "three are hotels added on 4 Sep" clause
implies but its list omits. It is night 2 (Wed 9 Sep), i.e. outside "the second half", so it is
included as a completion of the from-scratch set rather than as day-5–8 work; drop the key if the
deploy session only wants Days 5–8.

**Not emitted:** `Hotel Metropolitan Tokyo Haneda`. It has seed prose under the old name and its Day 1
research stands, so a `stopSummary` for it belongs with whoever owns the rename migration
(`day1-haneda.json` → `renamedStops`), and `correctedFromSeed: []` would be wrong for it.

---

## Day 5 · Sat 12 Sep

### Kegon Falls — 09:20–10:20 · confidence medium
**Carried forward unchanged:** the whole shape of the seed's four lines survives. The lift (100 m,
one minute, ~70 steps, ¥600/¥550), the free upper rim deck as the plan B, Juichiya's ¥500 yuba
yakisoba from 08:00, the 11:00 soba shutters, Rakusan Koji Kojimaya's ¥1,500/¥2,500 cave-aged wine and
¥2,250 sake, the 97 m × ~7 m drop with the Junitaki seeps, the ~150 m spray, and the 09:20 sun SE at
45° behind you. All of it is in `day5-nikko.json` and none of it is contradicted.

**Corrected / added:**
1. **Group threshold and coach fee.** The seed gives fares but not the mechanics: the group rate is
   **30 or more**, not 35, and the coach pays about **¥2,190** for 県営華厳の滝第一駐車場 at
   日光市中宮祠2480, roughly 07:00–22:00 April–November (`day5-nikko` `d5k01kegonpk`, `essentials`).
2. **Miyamado dropped.** The seed's "Miyamado (09:00–17:00) … additive-free Kekko manju … from ¥1,500
   for ten" has **no record in any batch**, so it is not repeated. The only two lakefront shops we
   hold are Juichiya and Rakusan Koji Kojimaya, and `notes5.md` §"unreachable" states plainly that
   neither publishes an address or a reachable page — their prices and hours are seed-level only.
3. **Chuzenji Kanko Center prices dropped.** The seed's ¥650 yuba and ¥680 tamari pickles are not in
   any batch record. The batch (`802174703d9d`) carries only "the Chuzenji Kanko Center counters open
   at 09:00 and are the first thing available", so the counters are named with the 09:00 opening and
   without the prices.
4. **The lift window is a held project correction, not a re-read.** 07:30–18:00 May–September stands
   against Tochigi Prefecture's own tourism site, Jalan and Guidoor, which all still print
   08:00–17:00 for 1 Mar–30 Nov; `kegon.jp` is robots-blocked on every sub-path and the proxy refuses
   the host. This is why the stop is `medium`, not `high`.

**Thin:** the `snack` line. Two named items, one price, and both from seed-level sources. There is no
verified standing-food record at Kegon at 09:20 — the honest content is "these two, at the very end
of the hour, on the lakefront parade", and the sub-route agrees (`d5sr01kegon`, lakefront counters at
minute 612 = 10:12 for 8 minutes).

### Nikko Toshogu Shrine — 11:00–12:15 · confidence high
**Carried forward unchanged:** the standard order (Omotemon → Sanzaru → Yomeimon → Karamon/Honsha →
Nemuri-neko → Honjido), the Naki-ryu being inside the ¥1,600 ticket with Japanese commentary and no
photography, the ¥500 pre-written goshuin at two offices, the 500-carving 11 m Yomeimon with its
March 2017 restoration, the eight-panel Sanzaru frieze, the ¥1,440-at-35-or-more group rate, the yuba
spelling 湯波 and Ebisuya's ¥2,400–5,000 / Yugen's ¥1,590–2,130.

**Corrected:**
1. **The Saturday coach ban rewrites the arithmetic.** The shrine's own access page prints
   「土・日・祝祭日、特別な行事のある日は駐車不可」, so on 12 Sep the 45-seater cannot use the shrine lot.
   The stop starts from 市営西参道第2・3駐車場 (安川町2-47, 140 spaces, 24 h, ~¥1,540 a large bus) with a
   **10-minute walk each way**, so 75 minutes becomes **about 50 minutes of looking** after internal
   walking. The seed treats the slot as 75 minutes on site. (`d5t01nishisando`, `essentials.transport`,
   sub-route `d5sr02toshogu`.)
2. **Kanaya Hotel Bakery is 10:00–17:00, not the seed's 08:00–18:00**, it sells out by mid-afternoon,
   and it is 1 km below the Omotemon — a coach stop at Shinkyo, not a walk out of the slot. Two
   independent listings (Tochinavi, Hot Pepper); the operator's own `bussanshokai.com` was
   robots-blocked. (`shopping[d1e348592e90]`, `notes5.md` §"Record / Seed said / Verified".)
3. **The seed's open choice is closed.** It says drop "either the 207 steps to the Okumiya or the
   Naki-ryu queue". Resolved: **drop the Okumiya** — the Naki-ryu is explicitly inside the ticket
   (本地堂（鳴龍） is in the published inclusions) and unrepeatable; the Okumiya is 207 steps for a view.
4. **Treasure House is not in the ¥1,600** — ¥1,000/¥400 extra, ¥2,400 combined (¥2,240 at 35+) — and
   40 minutes indoors is half the visit. The seed recommends purchases without saying this.
5. **The seed's Ebisuya/Yugen coordinate is inside the precinct, which is wrong** — both are on the
   Kamihatsuishi/Shinkyo stretch 1.3–1.6 km downhill. Flagged in `8effb3a92604` and reflected as the
   35–40 minute round-trip cost.

**Thin:** the `snack` line, and deliberately so. We hold **no record of any stall inside the
precinct**, and the seed's own snack candidate — deep-fried yuba manju at ¥300 from Sakaeya — is
outside Tobu Nikko Station, 1.3 km below Shinkyo, far outside a 75-minute window that already spends
20 minutes walking. The only verified thing within reach of the Saturday coach lot is Nikko Coffee
Nishi-sando, 4 minutes away, 10:00–17:00, closed Fridays (`d5w30tosho08`) — a café, not street food,
so the line says that rather than inventing a stall.

### Edo Wonderland Nikko Edomura — 14:00–**16:00** · confidence high
**Carried forward unchanged:** the printed 演目スケジュール sheet as the first two minutes, the four
theatres with Minami-machi Bugyosho and Mizugei-za as the visual picks, the two ninja walk-throughs as
the timetable-free half, the named street counters and their price bands, the no-halal-certification
briefing, Echigoya's ¥1,450 袖の下 box, the Nyanmage prices (¥750/9, ¥650/10, plush from ¥1,500), the
15:00 Oiran-douchuu, and the Nihonbashi/49.5 ha frame.

**Corrected:**
1. **The 4 Sep revision.** The stop is **2 hours with a 16:00 departure**, not 2 h 30 to 16:30. The
   seed still prints "14:00–16:30, two and a half hours". (`day5-nikko.itineraryRevisions`,
   `ITINERARY_CHANGE.md` §2.)
2. **"Two or three shows" is no longer achievable.** With a 15-minute Sekisho regroup the usable time
   falls to about **1 h 45**, and the roughly **15:50 last theatre start now begins after the coach
   leaves** — so the realistic maximum is **one theatre plus the procession**.
3. **The group afternoon 手形 is ¥4,400**, against ¥5,800 at the individual day window (団体 from just
   8 people; individual afternoon is ¥5,000), and 14:00 is exactly when the afternoon tariff opens.
   The seed gives no ticket arithmetic at all beyond the ¥2,800 costume.
4. **The sub-route's own last two steps now fall after the coach.** `d5sr03edo` puts Kamado-ya dango
   at minute 970 (16:10) and the Nyanmage/Echigoya stop at 980 (16:20). Both were pulled forward to
   about **15:45** in the `snack` and `buy` lines.
5. **Coach park must be pre-booked** for parties of 20+ (about ¥1,300), by phone or e-mail
   (`essentials.transport`) — absent from the seed.

**Thin:** nothing. This stop has the best snack material of Day 5 (Kamado-ya, cash, standing, priced).

### Hotel Nikko Tsukuba — night 5, check-in **18:00** · confidence high
**Carried forward unchanged:** Tonarie Tsukuba Square's three buildings all closing 20:00 and the
"announce it on the coach before anyone unpacks" instruction, the 600 m Chuo Park loop to the rocket,
the no-shop/no-bar/no-large-bath honesty, Sansui's Hitachi beef with a 20:00 last order, Q't 3F running
to 23:00, natto as the Ibaraki thing to put on breakfast, the fukure-mikan shichimi as the flight buy,
the 50 m H-II floodlit and unfenced, and "do NOT promise JAXA".

**Corrected:**
1. **Check-in is 18:00 and dinner 16:45 en route** (4 Sep revision), not the seed's 18:30/17:15 — so
   the seed's "about 85 minutes" to the 20:00 close is really nearer **120**. (`ITINERARY_CHANGE.md`
   §2; `expand-d56` `d5w30tsuk01` already reasons from a 16:45 dinner.)
2. **Tsukuba no Yoi Shina does NOT stock hoshi-imo or natto sweets.** Its published range is Hojo
   rice, fukure-mikan goods, research-institute items and seasonal produce from about 45 makers. The
   seed sends the group there specifically for hoshi-imo; use **Ropia on Tonarie CREO 1F**.
   (`topup-tsukuba-shinjuku.json`, correction reusing id `a3f5d387ccd7`, confirmed on Rurubu.)
3. **Serena's breakfast last order is 09:00, not 09:30**, opening 06:30, and the room seats **63** —
   so 35 people are more than half of it and need a pre-set group section. (`d5h01serena`, Okura
   Nikko's own dining page.) Not in the summary lines themselves (breakfast is a Day 6 fact) but it is
   the reason the `do` line does not promise a leisurely morning.
4. **Tsukuba Expo Center admission is ¥600/¥300, not the ¥500 our own earlier forecourt records
   carried** — and the rocket still needs no ticket. (`topup-tsukuba-shinjuku` `tpts05expshop`.)
5. **Named the venue that can take 35.** The seed offers Saino on Q't 3F as "the likeliest
   halal-friendly option, but phone rather than assume" — its halal status is unverified. The room
   that actually seats a coach party is **Aoyama Garari, Q't 3F**: 65 seats, up to 40 on one floor,
   operator prints 11:00–23:00 with food L.O. 22:00, and the widely-published 21:00 last order is
   wrong. ROKU at BiVi is a full buy-out at 35; Ramen Tatsuro has **16 seats**.
   (`topup-tsukuba-shinjuku` `tpts03garari`, `tpts01roku`, `tpts02tatsuro`.)

**Thin:** nothing material. The `snack` line is unusually strong for a hotel night — two confirmed
24-hour konbini within three minutes (FamilyMart in Q't; ローソン つくば駅バスターミナル店 on BiVi 2F,
24時間営業 / 休業日：なし on BiVi's own page) plus Ropia before 20:00.

---

## Day 6 · Sun 13 Sep

### Hitachi Seaside Park — 09:30–10:30 · confidence high
**Carried forward unchanged:** the 09:30 opening bell, Tuesday (not Monday) closing so 13 Sep is
open, ¥450/¥290-at-20+ with no September surcharge, the West Gate as the entrance, Miharashi Hill as
the target, the Seaside Train at ¥600, the hoshi-imo provenance (Hitachinaka and Tokai), Earl's as the
autumn melon shipping mid-July to late October, the pampas grass just past peak, and the low-angle
shoot-into-the-sun trick for translucent lime.

**Corrected — this is the stop with the app's own error in it:**
1. **THE NEMOPHILA ERROR.** The seed's `mustBuy` sells "the green-kochia and nemophila merchandise
   (plush kochia balls, tins, towels) that is only sold here", inheriting the app's Day 6 summary line
   "seaside nemophila fields". **There is no nemophila on 13 September** — it is mid-April to early
   May. What is there is **green kochia at peak**: the park's own kochia page gives 緑葉
   8月中旬〜9月下旬 with the colour change only from late September, about 40,000 plants over 2.3 ha at
   70 cm. The *branding* is genuinely nemophila (ネモフィラブルーティー is on the shop's stock list),
   which is exactly the trap — so the `buy` line sells the tea and says the flower is five months
   away, and the `see` line states the correction outright. (`day6-hitachi` `01ced68d11d2`,
   `3a908417ee96`, `essentials.tickets`; `notes.md` §3.1, `notes6.md` §1.)
2. **The melon and hoshi-imo soft-serve is not at the West Gate.** The seed puts it "from the West
   Gate kiosks". It is at **Kinen no Mori Rest House**, 8 minutes in, together with the Hitachinaka
   干し芋タルト and the melon baum — and **it opens at 10:00**, an hour into a 60-minute stop. The
   09:30 outlet is **Lakeside Cafe** (「9時30分から閉園時間まで」, takeout only). (`d6hitachi02`,
   `d577f5c4daed`.)
3. **The Glass House is unreachable.** True that it is the one place to sit with a full Pacific
   horizon, as the seed says — and it is in the 砂丘エリア by the 海浜口・風のゲート, a 15-minute train
   leg from the West Gate. Not reachable and back inside the hour.
4. **Rental cycles: ¥600 is the THREE-HOUR rate**, ¥800 all day. The seed's "¥600 adult" reads as a
   flat price. (`essentials`, the park's own ticket page; `notes6.md` §2.)
5. **The Ferris wheel is not "two minutes".** BLUE EYES sits inside the **Pleasure Garden, a separate
   payment** from admission — ride tickets in ¥100 units or a ¥3,600 one-day pass — with an
   unpredictable queue against a 10:30 coach. The single-ride fare is not published on any reachable
   page. (`09f1cfbfafb4`, `cd46570f0660`.)
6. **No West Gate hoshi-imo shop exists in our records.** The only West Gate retail is Lakeside
   Cafe's counter, and it trades **物販：平日休業（土日祝日のみ営業）** — weekends and holidays only, so
   Sunday 13 Sep is luck rather than planning. The seed's "hoshi-imo … from the West Gate shop" is
   dropped.

**Thin:** the `snack` line has **no prices**, and says so ("the park publishes no prices, so budget
rather than quote"). Lakeside Cafe's menu — soft-serve, takoyaki, croquettes, coffee — is official;
its prices are published nowhere reachable.

### Kawagoe Old Town (Kurazukuri Street) — 13:30–14:30 · confidence high
**Carried forward unchanged:** the kurazukuri row north from the 1918 former Eighty-Fifth Bank to
Toki no Kane and on to Kashiya Yokocho, "one hour is exactly the street and the sweet lane — do not add
a museum", the ~30 penny-sweet shops and the 2001 100-Fragrant-Landscapes listing, imo-koi as the most
Kawagoe thing you can hold, Fukugura as the standard gift box, Kameya's imo-senbei, the 1894 rebuild
after the 1893 fire, the 100 Soundscapes listing, the missed 15:00 chime, and Osawa House (1792).

**Corrected:**
1. **Koedo Kurari is not on the street, and the COEDO claim is unconfirmed.** It is at 新富町1-10-1 on
   Crea Mall by Hon-Kawagoe — a **15-minute walk** — and the city's own page lists 昭和蔵 sake tasting
   from 32 Saitama breweries with **no mention of COEDO beer**. So the seed's "wash it down at Koedo
   Kurari with COEDO's Beniaka" is both out of range for a one-hour stop and unverified. Dropped
   entirely. Its seed coordinate was also **1.1 km out**. (`1e0a21362096`, `notes6.md` §4.)
2. **Ogakiku closes THURSDAYS, not Mondays.** The seed says "commonly closed Mondays — today is
   Sunday, so it should be open"; the restaurant's own Gnavi listing says 木曜日, with continuous
   10:40–18:00 L.O. on Sundays. Right conclusion, wrong reason — and 50 seats at about ¥4,000 a head
   with a famous queue means 35 people cannot use it. (`f565e4c5eef1`.)
3. **The fu-gashi is 95 cm, not "metre-long".** Matsuriku Seika's own words:
   「長さ(95センチ)も日本一」. 元町2-11-6, 10:00–17:00, **closed Mondays** (Sunday is fine), band
   ¥500–2,000. (`56faaff6ecbe`.)
4. **Kasho Umon's boxed imo-koi is FROZEN** — 賞味期限 製造日より冷凍90日 — so the 5-piece ¥1,250 box
   is not a suitcase gift. Eat it hot at the counter for about ¥250. (`8572e0e989d2`.)
5. **Tamariki Seika dropped.** The seed's "Tamariki Seika's hand-pulled candy" has no record in any
   batch, so it is not repeated; the two verified Kashiya Yokocho buys are the penny sweets (from
   about ¥50) and Matsuriku Seika's fu-gashi.
6. **Every Kawagoe coordinate in the seed is 250–350 m out** (`notes6.md` §4 calls this the most
   consequential finding of that session), so the `do` line is written outward from the city's own
   coach bay — **north side of City Hall, 元町1-3-1, drop-off and pick-up only** — with the city's own
   5- and 7-minute legs and Motomachi Rest House as the 6-minute muster point. None of that is in the
   seed.

**Thin:** nothing. The `snack` line is the strongest of Day 6: a named product, a price, a shop
address, opening hours, a Monday-closure trap avoided, and the sub-route's own 14:14 slot.

### Shibuya Scramble Crossing — 15:30–16:30 · confidence high
**Carried forward unchanged:** free and 24/7, the Sunday-afternoon-not-commuter-surge framing, cross
it twice then get above it, "nothing at the crossing itself — that is the honest answer", the Q FRONT /
Tsutaya screens as the reason it photographs the way it does in films, Okamoto's *Myth of Tomorrow*,
and the food-hall-then-sit advice with the 17:00 unagi dinner intact.

**Corrected:**
1. **The seed's free vantage point does not exist as described.** No official source supports a
   crossing overlook from **Shibuya Scramble Square's 2F walkway**; it is real, free and a fine
   east-side regroup, but nothing describes the view. The verified free options are the **Shibuya Mark
   City 2F glass corridor** (station hours, no ticket,
   「スクランブル交差点を斜め上の低い位置から見ることができます」) and **SHIBU NIWA** on Tokyu Plaza
   Shibuya's 17F (free, 一般の方もご利用を頂けます, closes in bad weather). The corridor also carries
   the Okamoto mural, so **mural and vantage point are one stop, not two** — which is what the `see`
   line now says. (`15437da8658b`, `d6shibuya01`, `7dcc69232de6`, `notes6.md` §5.)
2. **MAG'S PARK is now MAG8 at ¥1,800.** 入場料 1人1,800円（1DRINK付）, 10:00–22:00, last entry 21:30,
   plus ¥1,500 per 150 seconds for the Crossing Photo sky camera. That is **¥63,000 for 35 people**, so
   it is a few volunteers. The ¥300 and ¥600 figures still on travel sites are stale. (`9d55f55c86a4`.)
3. **The B2 hall is Tokyu Food Show EDGE**, a different hall from the original Tokyu Food Show on the
   station side. The seed names the wrong one. (`5ee260408c1b`.)
4. **Don Quijote is MEGA Don Quijote Shibuya Honten and the walk is ~400 m / 5 minutes**, up Center-gai
   with a dogleg onto Inokashira-dori — not the seed's 8 minutes, and not Donki's own optimistic 3.
   (`topup-tsukuba-shinjuku` `tpsj03megadonki`.)
5. **Myth of Tomorrow's coordinate was north of the crossing**; it is in Mark City's 2F concourse
   between the JR Tamagawa-guchi and Keio Inokashira gates. (`f0fd97e06271`.)
6. **Sunset is 17:48, not the seed's 17:54** (the trip's validated solar record; the seed contradicts
   itself between its day record and its stop summary). The "good light, well before sunset" judgement
   holds either way, so this is recorded rather than fought over.

**Thin:** the `snack` line. There is genuinely no stall at the junction, and our records name no
individual priced street-food item within the hour. The line therefore points at Center-gai and the
B2 hall with a **planning figure of about ¥1,500** and says explicitly that it is a budget, not a
quote. The Starbucks 2F window counter is named as the cheapest seated view with the honest caveat
that it is queued out on a Sunday (its current hours are unverified — Starbucks Japan's store page for
this branch 404s).

### Shinjuku Granbell Hotel — night 6, check-in 18:30 · confidence medium
**Carried forward unchanged:** it is the **Kabukicho** Granbell, not the Shibuya one; the walking
times to Higashi-Shinjuku, Golden Gai and JR Shinjuku; the free-evening framing; the Oedo Line two
stops to Tochomae for the free 45F South Observatory at 202 m as better than any paid tower; Kabuki
Hall as the only room in Kabukicho that absorbs 35 people; Don Quijote at ¥5,500 in one transaction
with the matcha KitKat / Tokyo Banana and buy-the-chocolate-last advice; and the 13F rooftop bar as
the reason not to pay for a view.

**Corrected:**
1. **The projection-mapping show is dropped.** The seed promises "a free 10-minute projection-mapping
   show on the building's face from Citizens' Plaza". **No batch record mentions it** — I grepped
   `day6-hitachi.json`, `expand-d56.json`, `topup-tsukuba-shinjuku.json` and `notes6.md` for
   projection / mapping / プロジェクションマッピング / Night & Light and found nothing. Rather than
   import it unverified or spend a fetch on it, the `do` line carries only what the Bureau of Finance's
   own page gives: 入室料金 無料, 入室可能時間 9時30分〜21時30分, closes 1st and 3rd Tuesdays so a Sunday
   is fine. **If anyone wants the show in the app, it needs one targeted check first.**
2. **Kabuki Hall is TEN areas, not nine stalls** — eight regional 食祭 plus 韓国食祭 and KABUKI CAFE,
   about 1,300 seats, 年中無休 — and the Sunday envelope is settled: the tower's own floor guide prints
   **6:00〜翌5:00** with no day-of-week split (the venue's own site says 24時間営業; the two disagree,
   and some 食祭 areas keep a 開店準備時間, so a single stall can be shut inside the envelope).
   (`topup-tsukuba-shinjuku`, correction reusing id `5e98a1595579`.)
3. **Ichiran is the Kabukicho branch, 7 minutes away** at 歌舞伎町1-17-10, not "on Shinjuku-dori" — and
   it is **25 counter booths with no tables**, so for 35 people it is a trickle or a queue, never one
   sitting. Its own late window 22:00–06:00 takes the classic bowl from about ¥980 to ¥1,080 and
   kaedama ¥210 → ¥230. (`tpsj02ichiran`.)
4. **Our own Don Quijote source URL was wrong** — `donki.com` `shop_id=195` is MEGAドン・キホーテ西帯広店
   in Hokkaido. The Kabukicho store is `shop_id=29` at 歌舞伎町1-16-5, 24時間営業 / 定休日なし /
   免税対応, and the seed's 8-minute walk is right against a third-party map claiming 6.
   (`topup-tsukuba-shinjuku`, correction reusing id `cf7c63b3e943`.)
5. **Torikizoku is ¥390 tax-in, not ¥370** (¥370 ran 1 May 2024 → 1 May 2025), Sunday 13:00–04:00, and
   for 35 people there is **no 貸切 and no net booking since 2022** — phone or split branches.
   (`tpsj01torikizoku`.)
6. **The 13F rooftop bar is UNVERIFIED and is flagged as such.** `granbellhotel.jp` blocks automated
   fetching, so the 62 seats, the Sunday 14:00–22:30 window and the waived ¥500 table charge are all
   carried from the seed. The seed states them as fact; the `see` line says "confirm the detail at the
   desk, because granbellhotel.jp blocks automated fetching". **This is why the stop is `medium`.**

**Thin:** the whole stop's in-house detail. The hotel's own site is unreachable, the phone number
comes from a directory rather than the operator, and the 12F breakfast hours are seed-carried too. The
`snack` line is fine — Kabuki Hall kiosks, Torikizoku at a confirmed ¥390, Ichiran's confirmed
late-window prices, Donki 24 h.

---

## Day 7 · Mon 14 Sep

### Tokyo Tower — 09:00–10:30 · confidence high
**Carried forward unchanged:** Main Deck only and use the whole 90 minutes; pre-issued group tickets at
the Foot Town 1F lifts for the 09:00 opening; the Top Deck Tour does not fit (40–60 min alone, 90–120
door to door, reservation-only, 11+ must book through an agency); glass floor first because it jams;
Tower Daijingu on 2F as the highest shrine in the 23 wards with its ¥300 goshuin and ¥700 omamori;
OFFICIAL SHOP THE SKY's ¥280 caramel / ¥600 magnet / ¥410 bottle and GALAXY as the wider 3F
alternative; Cafe La Tour opening 09:30; Marion Crepes' halal-certified soft serve at 09:00; and the
Zojoji Daiden group frame with the Sangedatsumon-in-a-shed warning.

**Corrected:**
1. **The rate question the seed leaves open is resolved, in the agency's favour.** The travel-agency
   page prints 一般団体（20名以上49名以下）大人 **1,080円** with advance reservation required; the public
   fee page's **¥1,350** is the walk-up group discount. That is **¥9,450** of difference for 35 people
   and it hinges only on whether the agent actually pre-booked. And 「団体見学時におきましては、
   クレジットカードによるご精算を承っておりません」 — **group settlement is CASH ONLY**, which the seed
   does not mention at all. Group desk 03-3433-5121 / fax 03-3431-0529. (`essentials.groupRate`,
   `d7tt01`.)
2. **Coach parking is free with a condition and a risk.** 「展望台をご見学になる間、観光バスの駐車料金は
   無料」 only if settled in **one transaction** at the Operation Center; and
   「駐車場が満車時等、留め置きができないときは、一度バスを回送いただく場合があります」 — the driver may be
   sent away and told to return. The seed says only that parking is free. (`d7tt08`.)
3. **Added the Foot Town 2F Lawson**, 09:00–22:30, which takes cards and IC. The seed is right that
   the Foot Town restaurants are shut but misses the one shop that actually solves water and a toilet
   stop for 35 people at 09:00. (`d7tt04`.)
4. **The Main Deck photo service opens 10:00**, so a paid deck portrait only works at 10:00 on the way
   out; the Top Deck photo service (09:00–22:15) and the Foot Town 3F counter (09:00–22:30) open with
   the building. (`d7tt09`.)
5. **Two Zojoji facts the seed does not carry:** the **Tokugawa shogun cemetery viewing is currently
   SUSPENDED** (徳川将軍家墓所 拝観休止のお知らせ on the temple's own front page), and the **Kuro-honzon
   is shown on only three dates a year — 15 January, 15 May and 15 SEPTEMBER** — so the group misses
   it by one day, being at Zojoji on the 14th and Narita on the 15th. (`d7tt03`, `d7w30tt06`.)
6. **A Monday trap worth having:** the open-air staircase can only be walked **DOWN**. Climbing up is
   9:00–16:00 土日祝のみ; coming down is 9:00–20:00 daily. About 600 steps instead of the lift queue,
   cancelled in rain or wind. (`d7w30tt07`.)

**Thin:** the `snack` line has **no prices** and says so. Marion Crepes' halal soft serve and the
Lawson's stock are both confirmed at source, but neither publishes a price we hold. Also noted: Mos
Burger's 11:00 opening is from the operator's June-2024 tenant sheet — the current July-2026 sheet
defers to the chain's own page, which was not read.

### Tsukiji Outer Market — 10:50–11:50 · confidence high
**Carried forward unchanged:** Monday 14 Sep is a full trading day and a holiday Monday would not be;
start at Namiyoke Inari Shrine and work the 4-chome lanes back; the stand-and-eat brief and
never-carry-raw-fish-onto-the-coach rule; Yamacho's ~¥150 skewer as the one guaranteed thing (定休日
なし); Kitsuneya's ¥1,000–1,200 hormone-don standing at a plank counter; Sanokiya's ~¥250 tuna cakes;
Maruyama Nori and Ito Noriten as the flight-safe dry goods; Uogashi Meicha as the Sunday-AND-Monday
trap; the knife shops with Sugimoto and Tojiro as the friendlier prices; and the turret trucks and
the tarpaulin-versus-cranes frame.

**Corrected:**
1. **Sanokiya opens 8:00, not 07:00**, and the market's own directory adds 「なくなり次第終了」 — it
   ends when it sells out, which for a 10:50 arrival is the part that matters. (`5218cebcf469`,
   `d7sh02`.)
2. **Jugetsudo's Kengo Kuma building is the GINZA Kabukiza branch, not Tsukiji.** The Tsukiji shop at
   築地4-7-5 makes no such claim on its own listing. The seed attaches the Kuma design to Tsukiji.
   (`d7tk04`, `631edbd91e98`.)
3. **Ito Noriten is 築地4-14-14**, not the 4-13-18 our inventory carried (a different building), and it
   shuts at 14:00. (`d7tk05`, `bd382508e530`.)
4. **Aritsugu opens 6:00, not 05:30**, closing only on market closing days. (`d7tk06`, `1c0aa6c25b8c`
   as re-emitted in `topup-misc.json`.)
5. **Turret Coffee is out of the lanes.** The address 築地2-12-6 is right, but GSI resolves it about
   **330 m NORTH** of the seed's pin, outside the 4-chome lanes and 5–6 minutes each way toward Tsukiji
   Station — **12 minutes of a 60-minute stop**. The `see` line therefore tells you to shoot a working
   turret in the lanes instead. (`375ea0ec11c2`, `83284e0294a8`, `notes7.md`.)
6. **Added the cash reality**, which the seed omits and which matters for 35 people: most shops are
   yen-cash only, card acceptance varies shop by shop, 「No negotiation can be accepted」, **there is no
   currency exchange counter anywhere in the market**, and the only ATM is the Seven Bank machine at
   the ぷらっと築地 information centre. Budget ¥3,000–5,000 a head in small notes. (`d7tk01`,
   `essentials.groupRate`, `essentials.tickets`.)

**Thin:** nothing. This is the best-sourced stop in the batch — every shop's hours and closing days
come from the market's own directory, and the 60-minute arithmetic comes from sub-route `d7sub1`
(shrine 10:50, Yamacho 11:04, Kitsuneya 11:13 with 22 minutes budgeted for the queue, Maruyama Nori
11:38, regroup 11:45).

### Shisui Premium Outlets — 14:30–17:00 · confidence high
**Carried forward unchanged:** open 10:00–20:00 March–January with one closing day a year in February,
so 14 Sep is open; collect the floor map at the Information Center and split 2.5 hours with a hard
regroup; passports in hand because exemption is shop-by-shop; tax-free still at the till because Japan
does not switch to airport refunds until 1 Nov 2026; the American accessible-luxury brands as the real
draw and the Japanese labels (Onitsuka Tiger, Beams, United Arrows) as the things you cannot buy at
home; keep receipts separate to clear ¥5,000 per store; the flat single-level layout as the reason it
works as a coach stop; and the Narita approach traffic overhead.

**Corrected:**
1. **The peanut line is half wrong.** The seed says "look for boiled and roasted rakkasei; the boiled
   new-crop kind is genuinely in season right now". Boiled **oomasari** is in season (roughly August to
   October, about ¥800 a bag) — but it is sold **wet and refrigerated and cannot fly**; and the
   **ROASTED new crop is not out until mid-October**, which is why the shelves look wrong to anyone
   expecting roasted. If peanuts have to travel home it is peanut monaka. (`bc5a016012e6`, `d7sh04`.)
2. **The working deadline is 16:45, not the 17:00 departure**, because tax-free paperwork happens at
   each shop's own till: the queue is inside the shops and it lands at the end when everyone decides at
   once. 2120区 Ecco is the far end — anyone out there at 16:30 will not clear a till. (Sub-route
   `d7sub3`.)
3. **Added the facilities the seed omits:** lockers at **¥400–1,000** in the lounge behind the
   Information Center (¥600–1,000 at 450区 Calvin Klein and 1500区 United Arrows), **ATMs at 1140区**
   09:30–21:00 (Seven Bank and Chiba Bank), and the **Seven-Eleven at 1845区** 09:30–20:00 with the
   paid parcel desk. (`d7ss04`, `d7ss02`, `d7ss03`.)
4. **The Information Center's position is now precise** — 「フードコート前」, in front of the food court —
   and the site coordinate for it, the coach park and the central-plaza must-see was **corrected by
   2.4 km**: the old pin sat on the 酒々井町 town centroid, and five independent sources put the mall at
   35.714 / 140.294. (`topup-misc.json`, ids `fa666ecac0f8`, `d7ss08`, `d7ms03`.)
5. **Hours split four ways, not three:** shops and food court 10:00–20:00, restaurants 11:00–21:00,
   cafés 9:30–20:00. At 14:30 everything is open, which makes Shisui the one Day 7 stop with no hours
   conflict at all. (`d7ss01` as corrected in `topup-misc.json`.)
6. **Named the rooms that can take 35** — Soryu Togyokudo at 1330区, 92 seats, 11:00–21:00 L.O. 20:30,
   and pork-heavy so it needs checking first — and the **in-mall Kawatoyo unagi branch at 1600区**,
   11:00–21:00, which closes the loop the Naritasan honten leaves open. The seed's food line is
   generic ("there is a food court and a restaurant row"). (`d7w30ss04`, `d7w30ss02`.)

**Thin:** the boiled-peanut record itself. No Shisui tenant page naming a boiled-peanut seller could
be opened, so the stall, the ¥800 and the coordinate are all unconfirmed — the `snack` line leads with
Gong cha (1440区) and Delifrance (1325区), both 9:30–20:00 from the outlet's own column page, and puts
the peanuts second.

### International Resort Hotel Yurakujo — night 7, check-in 17:30 · confidence medium
**Carried forward unchanged:** the name is 湯楽城 and this is the former Radisson Narita; beyond the
gate it is airport-belt farmland with nothing walkable; the attached bath complex is the evening and
**Monday hours apply** — 17:00–22:00 rather than the 13:00 opening of every other day, last admission
21:00, and a 17:30 arrival lands right on it; the 7-Eleven inside the hotel with Chiba souvenirs and an
ATM is the most useful retail on the property; peanut monaka from Nagomi no Yoneya is the proper local
buy; boiled peanuts are in season from early September and roasted not until mid-October; and the
frame is aircraft, at Narita Sakura-no-Yama about 4 km away, free, 06:00–23:00, with three free
large-coach bays.

**Corrected:**
1. **The ¥1,800 voucher is only worth ¥1,800 before 18:00.** The bath's own price page gives the
   weekday adult rate as ¥1,800 but 「18時以後1,000円」 — and dinner is at **18:00**. So the only window
   in which a guest voucher stated as worth ¥1,800 actually is worth that is **17:30–18:00, i.e.
   check-in itself**. The seed states the ¥1,800 value with no catch. (`9ddb57ccd00d`.)
2. **IT IS NOT AN ONSEN.** The operator's own bath list is 露天風呂, 森の湯 (jojoba oil), 白湯 (plain hot
   water), 還元マグマの湯 (Himalayan salt), 低温風呂 34–38°C, sauna and stone-bed sauna, with
   「総檜の水風呂は天然地下水を使用」 for the **cold plunge only** — no spring analysis and no 泉質
   anywhere, despite the 湯 in the name and the site's own 「大型温泉スパ施設」 headline. The seed calls
   it a bath complex with "a medicinal bath", which reads as spring water. (`754752560bb7`,
   `essentials.tickets`, `notes7.md`.)
3. **Tonight's dinner is not the California Restaurant buffet.** The itinerary's 18:00 meal is an
   izakaya dinner, and the likeliest venue is **トミサト酒場** inside the bath building — the operator
   says it is currently **団体のみ**, group bookings only, Monday 17:00–21:30 L.O. 21:00, ordering off
   Tomisatoya's menu, which is exactly what a 35-person party at 18:00 exists for. The seed's 140
   seats and the 1 Jul–30 Sep Hawaiian Buffet are **inventory claims the hotel does not publish**.
   California Restaurant IS confirmed, for **breakfast 6:30–10:30 at ¥1,700–2,900** walk-in.
   (`d7w30yj03`, `2523fa35c7e4`.) Also added: **Mitsuan-seki**, the private room the operator lists
   for 8–50 guests — the one space that seats 35 without splitting them (`d7w30yj04`).
4. **The 7-Eleven is INSIDE the main building on the lobby floor** — the operator's own facility page
   says 「ロビー階には…コンビニエンスストア「セブンイレブン」…がございます」, which kills the "about 80 m
   from the door" claim — and **its hours are published nowhere**, so it must not be sold as 24 hours.
   (`topup-misc.json`, correction reusing id `1c6a9c9d2a24`.)
5. **The peanut monaka is unreachable on this itinerary** at either end of the night: the Naritasan
   approach shops shut about 17:00, check-in is 17:30, and Day 8 leaves after a 06:30 breakfast. So the
   seed's "proper local buy" is an **agent request**, not a group activity. (`e7224e55a638`, `d7yj04`.)
6. **The free shuttle cannot move the group:** 「バスは座席定員制です。立席は法律上お受けできかねます」 —
   seats only, so 35 people cannot leave together for Aeon Mall or Keisei Narita.
   (`essentials.transport`.)

**Thin:** several things, and the stop is `medium` because of them. The Radisson/Delta history and the
September 2022 rename appear nowhere on the hotel's own site (inventory-carried). The 7-Eleven's hours
are unpublished. Whether トミサト酒場 is the venue the agent actually booked is unconfirmed. And the
`snack` line is honest but slim: the lobby 7-Eleven with unknown hours, the 甘味処 dessert counter
beside Tomisatoya on Monday 17:00–21:30, and the flat statement that the next konbini is 1.4 km along
unlit rural road with no continuous footpath.

---

## Day 8 · Tue 15 Sep

### Narita Airport — Terminal 1 South Wing · confidence high
**Carried forward unchanged:** Singapore Airlines checks in on **4F of the South Wing**; eat before you
fly; have every passport out because tax-free is deducted at the till with no refund counter; clear
security by about 09:45; the heavy-and-chilled buy list (Tokyo Banana as the default office omiyage,
Shiroi Koibito tins as the perfect travellers, ROYCE' last and refrigerated, matcha and regional
KitKat, Fugetsudo Gaufre as the safest large sharing box); the 1-litre-per-adult liquor limit; and the
free 5F observation deck as the only place 35 people can spread out.

**Corrected — this is the day with the most seed error:**
1. **Narita Nakamise is South Wing 3F, AIRSIDE.** The airport's own shopping-area page and Fa-So-La's
   own store list both place it on 3F of the South Wing, after security, roughly 07:30–22:00 — **not
   the "4F landside shopping street"** the seed describes. So the seed's headline instruction, "do the
   souvenir run BEFORE security, not after", is **backwards**: the omiyage run moves to **09:50–10:25**
   with a get-back-by of 10:25 (sub-route `d8sr02airside`). This is the single biggest correction in
   the batch. (`d8t1nakamise`, `c7c29543a209`, `b7c7df711eaa`, `notes8.md`.)
2. **The counter clock is exact, not "roughly".** Singapore Airlines' own Narita table opens counters
   **three hours before departure (07:55)** and **closes check-in and baggage acceptance 40 minutes
   before (10:15)**. 10:15 is the day's real deadline, not boarding — and anything liquid over 100 ml
   must be in the checked bag before it. The seed says "roughly 08:00–08:25".
3. **Plenty trades before 07:30.** The seed says the only thing open is the 5F Capsule Marche and the
   vending machines. In fact: **LAWSON B1F 24 hours** (and Narita states only 1F and B1F are 24-hour
   while the upper floors run 05:00–24:00), the **GARDEN WALK deck from 06:30**, **McDonald's 4F
   Central 06:30–21:30 L.O.**, **Tully's, SUBWAY, Fa-So-La GIFT SHOP and DRUG BOX from 07:00**, **YAMADA
   TAX FREE from 07:30**, and the free **ITOKI work and open lounges, 108 seats, from 05:00**. That last
   one is what the 07:20–07:55 dead half hour is actually for. (`61bc7598f85b`, `d8t1lawsonb1`,
   `d8w30nt01`–`d8w30nt04`.)
4. **The 5F deck is a 2026 rebuild.** GARDEN WALK reopened **9 April 2026** after a year shut: the old
   mesh fence replaced by wire at about 7 cm spacing that a phone lens shoots through, a raised **2.5 m
   timber Mountain Deck** to see over it, and **three free hot-water footbaths** at the north end, each
   about 5 m × 0.8 m, one with seasonal aroma salts — bring a towel from the room. And the free
   130-seat **SHIKISAI GARDEN relaxation rooms open at about 13:30**, so they cannot be part of the
   wait. The seed's "free observation deck on 5F, looking straight down Runway A" understates all of
   it. (`67755765f105`, `d8t1ashiyu`, `d8t1shikisairest`, `d8w30nt07`.)
5. **ROYCE' will not survive the journey pristine.** ¥1,215 for 20 pieces, and it prints 要冷蔵 —
   refrigerate at 10°C or below. Narita 10:55 → Penang 20:35 is eleven hours plus a transfer and an ice
   pack will not hold 10°C that far: it arrives **soft, not spoiled**. The seed's "with the ice pack,
   in hand baggage" is right about the method and wrong about the outcome; buy the ROYCE' bar or
   potato-chip chocolate for pristine. (`5bbf8cdda258`.)
6. **Malaysian limits, beyond the seed's 1 litre:** **cigarettes and tobacco are EXCLUDED from the
   traveller exemption altogether** — there is no duty-free cigarette allowance into Malaysia — and
   there is an **RM1,000 (about ¥30,000)** ceiling on other goods per adult arriving by air, so the
   heavy shoppers should keep receipts. (`d8buywhisky`, `b7c7df711eaa`, Royal Malaysian Customs
   traveller guide.)
7. **"Gates via Satellite 3" is not repeated.** It could not be verified from any official page and
   departure gates are not assignable in advance anyway. The terminal itself, by contrast, is now
   **confirmed rather than inferred**: Narita's own airline page prints 「T1 South Wing / 4F」, which
   retires the seed's Star-Alliance-allocation reasoning (right answer, no longer the evidence).
   (`notes8.md` §1.)

**Prices added that the seed lacks:** Shiroi Koibito ¥1,320/18 and ¥1,760/24 (Fa-So-La's own tax-free
list), Tokyo Banana ¥691 / ¥1,296 / ¥1,944 for 4 / 8 / 12 and **not marked up at the airport**, the
Narita-only ISHIYA maneki-neko box ¥1,400/24, Fugetsudo Gaufre ¥1,620/12 with a 180-day shelf life,
ROYCE' ¥1,215/20, and the 1-litre clear liquids bag at about ¥150 from LAWSON B1F or DRUG BOX 4F, both
designated zipper-transparent-bag stores.

**Thin:** the **5F SKY FOOD COURT tenants publish no hours** — the operator states only that the 5F
area opens 05:00 — so the `eat` line names McDonald's, Tully's, SUBWAY and LAWSON, which are sourced,
and flags the food court as unpublished. The seed's "conveyor sushi counter" has no record and is
dropped.

---

## The four stops written from scratch (`newStop: true`, `correctedFromSeed: []`)

### Ooedo Onsen Monogatari Naruko Onsen Kounkaku — night 2, Wed 9 Sep · confidence medium
Built entirely from `new-hotels.json` and `topup-naruko.json`. The strongest material: **two spring
types in one property** (黒湯 on the main building's 6F with its own rotenburo, 白湯 in the annexe 1F,
both 15:00–24:00 and 05:00–10:00), with day visitors confined to the 6F — so the annexe is the quiet
one at 19:00. Check-in is published 15:00–19:00 against an 18:30 arrival, the most comfortable of the
three new hotels. The shop is 15:00–20:30, shut before the 08:30 coach. Naruko kokeshi (the squeaking
head, from about ¥2,640; small ejiko about ¥3,300). Two cash charges at the desk: Miyagi accommodation
tax ¥300 a night from 13 Jan 2026, plus bathing tax.

**Two genuine gaps, both stated in the lines:** the itinerary says 19:00 **Kaiseki** while Ooedo's own
product is a グルメバイキング buffet on 2F (17:00–21:30) — though JTB's meal field for this property
does print 和食会席, so both are real products and the agent must say which is booked; and **no channel
publishes the breakfast service time**, which makes the 07:30 sitting against an 08:30 coach the one
hours check on Night 2 that cannot be verified.

**The `snack` line is the strongest of any hotel night in the batch:** Lawson Osaki Naruko Onsen is
78 m from the door, at 鳴子温泉車湯92-45 — the same aza and postcode as the hotel — and 24 hours is
confirmed on **Miyagi's own shop registry** (営業時間「24時間営業」/ 定休日「なし」). It is also where the
face towel and body soap come from, about ¥600 the pair, because Taki-no-Yu sells neither and on 9 Sep
it is the only public bath open in town (Waseda Sajiki-yu is closed 3–10 Sep for 源泉 maintenance).

### Mercure Miyagi Zao Resort & Spa — night 3, Thu 10 Sep · confidence medium
Arrive 17:15, dinner 18:00, breakfast 07:00, coach 08:00 — **the tightest fit of the eight days**:
Locavore's breakfast opens **exactly** at 07:00 (「7:00〜9:30（最終入場9:00）」). The `do` line is built
round the bath sequence because the baths are the only thing that fits between 17:15 and 18:00:
Fudo-no-Yu (hinoki tub run かけ流し on Togatta Onsen water) plus two indoor 大浴場 and a free sauna,
15:00–23:00 last entry 22:30 and 06:00–10:00 last entry 09:30. **Take your own towel** — the hotel's
own FAQ answers the question 「お部屋からお持ちください」 — and tattoos need two 8 × 10 cm cover
stickers at ¥200 from the desk. 270 free parking spaces, so a 45-seat coach is fine.

**The format conflict is stated outright:** the itinerary calls dinner Kaiseki and **Locavore is a
268-seat buffet**, 17:30–21:00 last entry 20:30, ¥8,000 a head bought separately, with yukata and
slippers expressly allowed. No sittings are published and one guest counted 800 diners against 268
seats, so 35 people arriving unbooked at 18:00 is a real risk — ring 0224-34-3600. **No channel
publishes a latest check-in** either, which with the buffet question is why this is `medium`.

**The `snack` line says there is no street food, because there is not:** a 312-room resort standing
alone on the Zao plateau, with the hotel's own FAQ putting the nearest Seven-Eleven at
「車で約5分（徒歩約20分）」 on an unlit road. So it points at the 1F shop (16:30–21:00), the 20:00–22:00
鳥渡 Night Cap lounge session where reviewers single out Zao cheese and crackers as the free snack,
and the round-the-clock water servers on floors 5–11 — plus the instruction to buy water and an
umbrella **before leaving Zao Fox Village**.

**Deliberately left out:** the indoor pool. Yahoo prints a continuous 18 Jul–23 Sep season at
14:00–21:00 while the hotel's own activities page lists September day-pool days as Fridays and
Saturdays only (4, 5, 11, 12, 18–23) — and 10 Sep is a Thursday. Two sources, flatly contradictory, so
no line promises it.

### Kinugawa Onsen Hana no Yado Matsuya — night 4, Fri 11 Sep · confidence medium
The stop is written round the two things that must be settled at check-in rather than discovered at
19:30: **the kaiseki sitting** and **a room for Mission 2**. The itinerary prints "18:30 Hotel Buffet"
and **this hotel serves no buffet at all** — dinner is 和食会席 plated to the table in private rooms on
4F with the start **chosen**, not assigned: 「午後6時からまたは午後6時30分から、午後7時から」, last
seating 19:00. **Take the 19:00**: ten minutes from an 18:20 arrival into yukata for 35 people plus a
group photograph is not achievable, and a kaiseki that has started cannot be drifted into. Breakfast is
a 和食膳, also chosen from 07:00 / 07:30 / 08:00 against an 08:30 coach — genuine slack.

**Mission 2 survives and improves:** the yukata are **in the room** (大人浴衣 on the amenity list), so
the old front-desk rack queue is gone, and a 45-set colour rental at ¥3,300 exists if matching is
wanted. The lounge 花かんざし is on the **5th floor** because the hotel is built down the slope and you
enter at the top; the backdrop is Takehisa Yumeji paintings, a 夢二人形 dolls cabinet and a glass wall
onto the gorge. Stand the group **along** that glass facing **into** the room — at 18:30 in September
the window is dead black and will silhouette all 35. Warn the driver: the free lot is 18 spaces (8 for
large buses) down a steep drop off Route 121 with the hotel's own low-clearance warning.

**The `snack` line says there is nothing, and that is the finding:** the 5F drink corner runs
14:00–17:00 and is already shut at 18:20; the nearest konbini is **Lawson Kinugawa-Taki, 24 hours
confirmed on Nikko City's own AED register, 1.24 km straight line and about 20 minutes on the road**;
there is no konbini within 500 m; and 鬼怒川公園岩風呂, the public bath at the *same banchi*, closed
permanently on 31 March 2024. In-house the only buy is 花ごよみ to 21:00, plus a frozen-food corner
nothing can be taken home from.

**Everything here is `medium` for one reason:** `matsuya.co.jp` is denied by the egress proxy, so no
figure comes from the operator. The **latest check-in is disputed across four channels** — 18:00
(Furunavi, Rakuten), 18:30 (yukoyuko), 19:00 (Yahoo), 22:00 (OZmall) — against an **18:20 arrival**,
which is after the cut-off on two of them. **Phone 0288-77-1221 from the road on the 11th.**

### Ginza — Day 7 BACKUP for Shisui, from 13:45 · confidence medium
Written as a real 2–2.5 h shopping stop, and the `do` line leads with the finding that actually decides
the trade-off: **a 45-seat coach cannot stay in Ginza.** Chuo-ku's designated bay is 銀座六丁目 on
Mihara-dori beside GINZA SIX — 3 bays, 10:00–21:00, 無料（事前登録予約制） via Times,
「利用時間を1回あたり15分とします」, **drop-off only**
(「待機…は、近隣のバス駐車場を利用ください」) — so **two slots must be booked** (13:45 down, about 16:30
up) and the coach then parks at Times Harumi 4-chome at ¥2,000/hour, roughly ¥6,000 plus 24 minutes of
dead running. Regroup **16:15 on the kerb**, not inside a building: 35 people cannot be found across 12
floors.

**The two things Ginza does that Shisui cannot**, both in the `buy` line: **UNIQLO Ginza** — twelve
floors, about 5,000 m², the largest in the world, three minutes from the bay, 免税対応店 — is one shop,
one till and therefore **one tax-free receipt**, where Shisui fragments a group's spend across ~220
tills that never clear ¥5,000; and **LOTTE DUTY FREE 9F** in GinzaNovo lets you **pay in Ginza and
collect after immigration at Narita tomorrow** (「出国の60日前から1日前までご購入いただけます」), which is
perfect for the spirits and large fragrance that must not ride in a 7 kg cabin bag.

**Monday facts carried into the lines:** all four big stores are open (Mitsukoshi 10:00–20:00, GINZA
SIX 10:30–20:30, Matsuya 11:00–20:00, Wako 10:30–19:00) and **the Chuo-dori pedestrian precinct is
weekend-only** (Sat/Sun/holidays 12:00–18:00 Apr–Sep), so on the 14th it is a live four-lane arterial —
cross only at the 4-chome and 6-chome signals. Two name traps are in the `see` line: 和光本館 is signed
**SEIKO HOUSE GINZA** since June 2022, and the fourth corner of the 4-chome crossing is **hoarding** —
San-ai came down from March 2023, replacement due 2027. (The third trap, 東急プラザ銀座 → **GinzaNovo**
since December 2025, is carried in the `buy` line via the LOTTE address.)

**The `snack` line is the anpan**, and it is a good one: Ginza Kimuraya at 銀座4-5-7, 10:00–20:00,
無休, invented anpan, sakadane anpan over the 1F counter for a few hundred yen, cash quickest at a
counter that busy — and a one-to-two day life, so it is explicitly walk-and-eat and has no business in
a suitcase. The Kabukiza 木挽町広場 basement (9:30–18:30, free, no ticket, seven minutes east) is the
fallback with food stalls and a convenience store.

**Thin:** prices. Kimuraya's anpan is "a few hundred yen" because no price is published on a page we
could read; Kyukyodo's incense is "from a few hundred yen" for the same reason and its hours come from
Time Out rather than the shop; Natsuno's ¥1,500–3,000 chopstick band is from its own store page, which
also notes the shop is 「現在、短縮営業中」 on shortened hours, so the 19:30 close may be earlier.

---

## Things a reader should know about how these lines were built

1. **No new research.** Every fact is traceable to `day5-nikko.json`, `day6-hitachi.json`,
   `day7-tokyo.json`, `day8-narita.json`, `day7-ginza-backup.json`, `new-hotels.json`,
   `expand-d56.json`, `expand-d78.json`, `topup-misc.json`, `topup-tsukuba-shinjuku.json`,
   `topup-naruko.json`, or to a seed line that a batch record explicitly carries forward. **No web
   fetch was made for this batch.**
2. **Where the seed is the only source, the line says so or the fact is dropped.** Dropped for lack of
   any batch record: Miyamado's Kekko manju (Kegon), Tamariki Seika's candy (Kawagoe), the
   Metropolitan Government projection-mapping show (Shinjuku), "gates via Satellite 3" and the
   conveyor-sushi counter (Narita), and COEDO Beniaka at Koedo Kurari (Kawagoe, where the city's own
   page contradicts it).
3. **Capacity and cash for 35 people are carried wherever we hold them:** Toshogu's ¥1,440 needing
   exactly 35 or more, Tokyo Tower's cash-only group settlement and the ¥1,080-vs-¥1,350 question,
   Tsukiji's yen-cash-only lanes and absent currency exchange, Shisui's per-till exemption, MAG8's
   ¥63,000 for 35, Aoyama Garari's 40-on-one-floor against ROKU's buy-out and Tatsuro's 16 seats,
   Ichiran's 25 booths, Beer Hall Lion taking no bookings, Locavore's 268 seats against a reported 800
   diners, Matsuya's 47 rooms and unpublished lounge capacity, Mitsuan-seki's 8–50 private room, and
   Yurakujo's seats-only shuttle.
4. **Every line was judged against the stop's real clock**, including the four cases where the good
   thing opens too late: Kinen no Mori at 10:00 into a 09:30–10:30 stop, Cafe La Tour at 09:30 and the
   whole Foot Town food offer at 11:00 into a 09:00–10:30 stop, the SHIKISAI GARDEN lounges at 13:30
   into an 08:30–09:45 wait, and Mercure's 1F shop reopening at 08:00, exactly when the coach leaves.
