# notes-expand-d78.md — 30-minute walking radius, Days 7 and 8

Batch: `expand-d78.json`, `"batch": "expand-d78-walk30"`.
49 new `places` + 3 new `shopping`. Validator: 0 errors, 0 warnings. Max walk leg 26 min.
No id collisions and no name collisions with `day7-tokyo.json` / `day8-narita.json`.
No `Ginza` records — that stop is being researched separately.

Per stop: Tokyo Tower 12 · Tsukiji Outer Market 11 · Shisui Premium Outlets 7 ·
International Resort Hotel Yurakujo 6 · Narita T1 South Wing 13.

Dates checked against the real calendar: **Mon 14 Sep 2026** (day 7) and **Tue 15 Sep 2026**
(day 8). September 2026's public holidays are the 21st and 23rd, so neither day is a holiday —
which matters twice below.

---

## 1. CONTRADICTS THE EXISTING RESEARCH

### 1a. The Shisui Premium Outlets coordinate looks wrong by ~2.3 km — and the GSI verdict looks inverted

The handover says GSI "puts Shisui on a block centroid 1.8 km off … do not correct those from GSI —
the existing values reconcile with two independently stated distances." Three independent sources
found this session point the other way.

| Source | Coordinate | Distance from the seed pin `35.7222 / 140.2696` |
|---|---|---|
| Mapion phonebook, 飯積2-4-1 | `35.71381181 / 140.29402333` | **2,394 m** |
| MapFan, 飯積2-4-1 | `35.7129156 / 140.2938173` | ~2,500 m |
| GSI centroid for 飯積 | `35.714443 / 140.290268` | 2,054 m |

Mapion and MapFan agree with each other to within ~100 m, and the GSI block centroid is only
**~370 m** from Mapion — i.e. GSI was roughly right, not 1.8 km off.

The independent cross-check is the onsen next door. 湯楽の里's operator publishes
「酒々井IC及び酒々井アウトレット駅より徒歩約700m」, and Chiba Prefecture's official tourism site
gives its coordinate as `35.719689 / 140.293259`. That point is **657 m** from the Mapion outlet
pin and **2,154 m** from the seed pin. Only the Mapion/MapFan/GSI cluster reconciles with the
published 700 m.

**What I did:** left the `anchorStop` string and the existing records untouched, as instructed.
My seven new in-mall records carry `35.713812 / 140.294023` (Mapion) with
`coordPrecision: "approximate"`. This means the batch is internally consistent but sits ~2.4 km
from the ten existing Shisui records, which all use `35.722829 / 140.2696` (already flagged
`approximate` / `medium` by the earlier session). **A later session should settle this before
import** — one of the two clusters is wrong on the map, and it is the pin the coach driver
would use.

Sources: <https://www.mapion.co.jp/phonebook/M02004/12322/ILSP0055679051_ipclm/> ·
<https://mapfan.com/spots/SCYHC,J,JQ0> · <https://www.yurakirari.com/yura/shisui/> ·
<https://spa-tokyo.net/z-c-shisui-yura/index.html>

### 1b. Tokyo Tower's outdoor staircase cannot be climbed on Mon 14 Sep

Tokyo Tower's own page splits it: **up = 9:00–16:00「土日祝のみ」** (weekends and public holidays
only); **down = 9:00–20:00 daily**. 14 Sep 2026 is a plain Monday, so the group cannot walk up,
but can walk the ~600 steps down from the Main Deck instead of queuing for the lift. Nothing in
the existing records mentions the staircase at all. Cancelled in rain or high wind.
<https://www.tokyotower.co.jp/en/price/>

### 1c. Zojoji's Kuro-honzon is shown on 15 September — one day after the group is there

Zojoji shows the Kuro-honzon (Ieyasu's black Amida, in the Ankokuden) publicly on only three
dates a year: **15 Jan, 15 May, 15 Sep**. The group is at Zojoji on the 14th and at Narita on the
15th. Filed as `d7w30tt06`. The existing `d7tt02`/`d7tt03` records correctly state the
Sangedatsumon shed and the suspended shogun cemetery — both confirmed again on the temple's own
precinct page, no contradiction there. <https://www.zojoji.or.jp/keidai/>

### 1d. Hotel Yurakujo's bath complex contains five restaurants, one of them groups-only

The existing records have the bath complex and the California Restaurant, and treat the buffet as
the evening's food. The operator's own 湯楽城 food page lists **five** outlets inside the bath
building, all on a Monday schedule of **17:00–21:30, L.O. 21:00** (versus 13:00 Tue–Sun):

- **富里屋** — soba, udon, kaisen-don, tempura fried to order
- **七栄屋** — Chinese; ramen, mapo tofu
- **トミサト酒場** — izakaya, and the operator says it is **currently 団体のみ, group bookings only**
- **密庵席** — private dining room for **8–50 guests**
- **甘味処** — Japanese and Western sweets
- a bar, currently closed

トミサト酒場 is very plausibly the itinerary's 18:00 izakaya dinner, and 密庵席 is the only room on
the property that seats 35 without splitting the party. Neither is confirmed as the agent's
booking — that needs a phone call to 0476-93-1234. <https://chi-hotelsresorts.com/yurakujo/food/>

### 1e. Azabudai Hills Market opens 10:00, not early

A secondary source implied an early-morning opening. The official page says **10:00–20:00**,
33 shops, Garden Plaza C 1F/B1F. Recorded so the earlier claim is not repeated: on a 09:00–10:30
Tokyo Tower slot the market is effectively unavailable.
<https://www.azabudai-hills.com/azabudaihillsmarket/index.html>

### 1f. Address disagreement for 酒々井温泉 湯楽の里

The operator gives 〒285-0912 **千葉県印旛郡酒々井町飯積1-1-1**. Jalan gives 香取郡酒々井町**飯田**1-1-1;
spa-tokyo.net gives 香取郡酒々井町**飯沢**1-1-1. 酒々井町 is in 印旛郡, not 香取郡, so both aggregators
are wrong on the county and probably on the hamlet. Used the operator's own string.

### 1g. Confirmations, not contradictions

- **Aeon Mall Narita** — the existing corrected coordinate `35.795254 / 140.318909` is right
  (GSI, 成田市ウイング土屋24) and it is **6,098 m straight-line from the hotel, ~99 min on foot**.
  Comfortably outside the 30-minute radius; the existing `bus 30` leg stands.
- **Narita Sakura-no-Yama** — existing verified `35.776066 / 140.363754` is **3,611 m from the
  hotel, ~59 min on foot**. Also outside the radius; the existing `bus 10` leg stands.
- **Hotel Yurakujo's own coordinate** — Narita City Tourism Association gives
  `35.744242 / 140.343731` against the seed's `35.74406 / 140.34459`, ~80 m apart. The hotel pin
  is fine. Address confirmed 千葉県富里市七栄650-35, tel 0476-93-1234.
  <http://www.nrtk.jp/mypage/00089.html>

---

## 2. REACHABLE ON FOOT BUT NOT INSIDE THE STOP'S TIME BUDGET

The two Tokyo stops are the problem. A 30-minute radius means a 60-minute round trip, and
Tokyo Tower has 90 minutes while Tsukiji has 60.

### Tokyo Tower — 09:00–10:30, 90 minutes

| Place | Walk each way | Verdict |
|---|---|---|
| Roppongi Hills 66 Plaza / Maman / Mohri Garden | 24 min | **Out.** 48 min walking. Everything ticketed there opens 10:00. Mapped to show the boundary. |
| Kyu Shiba Rikyu Onshi Teien | 20 min | **Out.** 40 min walking + 40 min inside = 80 of 90, and the deck itself is the point of the stop. |
| Shiba Daijingu | 11 min | Marginal — 22 min walking + 15 min = 37. Only if the group skips the Main Deck queue. |
| Atago Shrine + 86 steps | 12 min | Marginal — 49 min all in, and it is the single best thing in the band. Works only as the *sole* off-site excursion. |
| Shiba Maruyama Kofun | 9 min | Fits, if combined with the Zojoji records already on the map. |
| Azabudai Hills Market | 9 min | **Out on hours, not distance** — opens 10:00, coach leaves 10:30. |
| RED° TOKYO TOWER (Foot Town 3–5F) | 2 min | **Out on hours** — opens 10:00, leaves ~30 min. 不定休, so it may not open at all. |
| Zojoji jizo rows / Kyozo / Kuromon / bell tower / Ankokuden | 6–7 min | All fit. Free, outdoors, no hours. The realistic answer for this stop. |

Reinforces the existing established fact: Foot Town's whole food offer, halal Siddique Palace
included, opens 11:00. At 09:00 only Marion Crepes and the 2F Lawson are open, and RED° is shut.

### Tsukiji Outer Market — 10:50–11:50, 60 minutes

| Place | Walk each way | Verdict |
|---|---|---|
| Hamarikyu Gardens | 14 min | **Out.** 28 min walking, plus buying 35 tickets, plus 50 min inside. It IS inside the radius (~1.1 km) — that question is now answered — but not inside the hour. |
| Nakajima-no-Ochaya tea house | ~20 min | **Out.** Inside Hamarikyu, a further 6 min from the gate. |
| Tsukuda Kobashi / Sumiyoshi Shrine | 19 min | **Out.** 38 min walking of a 60-min stop. |
| Tenyasu / Tanakaya / Marukyu tsukudani | 18 min | **Out** as a group stop; viable only if two or three people go instead of eating. Best buy of Day 7 all the same. |
| Tsukishima Monja Street | 16 min | **Out twice.** 32 min walking, and most of the street opens 11:00–17:00 with many houses evening-only, while monja itself takes 60–90 min at the table. |
| Kachidoki Bridge | 8 min | **Fits** — 16 min walking + 15 min looking = 31. The only 8–30-min item at Tsukiji that fits. |
| Kachidokibashi Museum | 9 min | **Out — CLOSED.** See §3. |
| Sumida River Terrace (Tsukiji side) | 7 min | Fits. Ten minutes, no shade, so a breeze stop not a rest. |
| Tsukiji Hongwanji + Cafe Tsumugi | 5 min | Fits. The 18品の朝ごはん does not — it is a morning set that sells out, and 10:50 is late. |

### Shisui Premium Outlets — 14:30–17:00, 150 minutes

**酒々井温泉 湯楽の里 is the only thing within 30 minutes' walk of the mall, and it is 700 m away.**
22 min walking + a 90-minute bath = 112 of 150 minutes, so it *technically* fits — but it would
consume the shopping stop, and the group then checks into a hotel with its own bath complex at
17:30. Reachable, verified, and almost certainly the wrong call. Filed with that framing.

Everything else at Shisui is inside the mall. See §4 for how thin the surroundings really are.

### International Resort Hotel Yurakujo — 17:30 arrival, 07:00 departure

| Place | Walk each way | Verdict |
|---|---|---|
| Crane Chiba Tomisato riding club, 七栄650-203 | ~9 min | **Out on hours.** 09:00–17:00 and **closed Tuesdays** — closing as the coach arrives at 17:30 on Monday, and shut all day on Tue 15 Sep. Same address block as the hotel (七栄650). |
| Direx Tomisato, 七栄646-189 | ~26 min | **Out on safety, not distance.** ~2.0 km of unlit rural road with no continuous footpath, after dark. Take a taxi. Same warning the existing 7-Eleven record already gives. |
| Aeon Mall Narita | ~99 min | Not in the radius at all. |
| Narita Sakura-no-Yama | ~59 min | Not in the radius at all. |

The hotel's own "nearby sightseeing" page lists 18 attractions — Naritasan, 成田ゆめ牧場,
航空科学博物館, 房総のむら, 佐原, 香取神宮, DIC川村記念美術館, さくらの山公園 and so on — and
**not one of them is walkable**; every entry needs a car or the shuttle. That page is the best
single confirmation of how isolated the property is.
<https://chi-hotelsresorts.com/facility/area_guide.html>

### Narita T1 — arrive ~07:20, SQ637 10:55

Everything here is inside the terminal; the walk legs are terminal-internal, not street walks.
The binding constraint is not distance, it is the security line. See §5.

---

## 3. CLOSING-DAY TRAPS ON THESE EXACT DATES

- **かちどき橋の資料館 — CLOSED Mon 14 Sep.** The Tokyo Metropolitan Government's own page:
  「毎週火曜日・木曜日・金曜日・土曜日」, 09:30–16:30, free, 中央区築地6丁目地先 beside the old
  market's Kachidoki gate. Tuesday/Thursday/Friday/Saturday only. Inside is the original
  substation that drove the bascule machinery and a 1:100 model.
  <https://www.kensetsu.metro.tokyo.lg.jp/road/iji_syuzen/hozen/kachidoki>
- **Crane Chiba Tomisato riding club — closed Tuesdays**, so shut on Day 8 as well as effectively
  shut on Day 7. <https://www.city.tomisato.lg.jp/fanclub/0000014132.html>
- **Tokyo Tower up-staircase — unavailable on a weekday.** §1b.
- **RED° TOKYO TOWER — 不定休.** Cannot be ruled closed on 14 Sep without phoning.
- Open on 14 Sep, confirmed: Atago Shrine (09:00–16:00), Hamarikyu and Kyu Shiba Rikyu (both
  closed only 29 Dec–1 Jan), Nakajima-no-Ochaya, 酒々井温泉 湯楽の里 (no regular closing day),
  Cafe Tsumugi (無休).
- Re-confirms the existing findings: Tsukiji itself trades normally on Mon 14 Sep, and
  うおがし銘茶 is shut Mondays. Suehiro Noujou is closed Mondays (existing record) — it *is* open
  on Tue 15 Sep, but the coach leaves the hotel at 07:00 and the shop opens 09:00, so it stays
  out of reach.

---

## 4. HOW MUCH GENUINELY EXISTS WITHIN 30 MIN ON FOOT OF SHISUI

**One thing, and it is a good one.** 酒々井温泉 湯楽の里, published as 徒歩約700m from Shisui IC
and the outlet bus stop: a genuine natural hot spring —
「含よう素-ナトリウム-塩化物強塩泉」, 98.3 mg/kg iodine, drawn on site — 09:00–23:00, last entry
22:00, no regular closing day, adult ¥950–1,600, tattoos refused, towels rentable. Which sets up
the sharpest fact of Day 7: **the group's hotel bath complex is not hot-spring water, and this
one is.**

Beyond that, the answer really is nothing. The outlet sits on farmland at the 酒々井IC exit of the
Higashi-Kanto Expressway. Its nearest railway station is a **15-minute bus ride** (JR Shisui West
Exit, ¥310) or **20 minutes** (Keisei Shisui East Exit). Searches for convenience stores,
supermarkets, roadside stations or sights in 酒々井町飯積 returned nothing but job adverts and the
outlet's own listings. The nearest named sight, 本佐倉城跡, is ~4 km west. The mall's own 7-Eleven
at block 1845 (already on the map) is the convenience store.

So the Shisui work in this batch is deliberately **inward-facing**, which is the honest answer:

- **The restaurant strip, with block numbers** — うなぎ川豊 1600, すし銚子丸 1335,
  蒼龍唐玉堂 1330 (92 seats, tel 043-308-8689), だし処はんなり 1605, カプリチョーザ 1320,
  ぼてぢゅう屋台 in the food court, どうとんぼり神座 1120, 鳥開 1115, ゴンチャ 1440,
  デリフランス 1325. **The 1100-block and food-court tenants close 20:00; the 1300–1600
  restaurants run to 21:00.**
- うなぎ川豊 at block 1600 closes a loop in the existing research: Kawatoyo Honten at Naritasan is
  filed as out of reach on this itinerary, and its branch is inside the outlet, on foot, during
  the shopping stop.
- 蒼龍唐玉堂's 92 seats is the only published seat count at Shisui and the only room that could
  take a coach party without splitting it.
- The bus stop: Tokyo Station (Bus Terminal Tokyo Yaesu B1F, bay A02, Choshi express) ~50 min
  ¥1,300; Narita Airport ~15 min ¥500; both first-come with no reservation. That is the escape
  route if anyone misses the coach.
  <https://www.premiumoutlets.co.jp/shisui/access/access_bus.html>

**Tax-free tills at Shisui: could not be confirmed on the outlet's own site.** Its
`/service/` and `/access/` paths throw "too many redirects", the floor map is interactive-only,
and `/service/taxfree.html` 404s. The established fact — deduction **at the till** until
31 Oct 2026, ¥5,000 tax-excluded per store per day, Visit Japan Web accepted — implies there is
**no** central refund counter to find, which matches how at-the-till works, but I could not
verify it from the operator. 220 stores as of this research.

---

## 5. NARITA T1 SOUTH WING — THE LANDSIDE / AIRSIDE PICTURE

The whole of Day 8 turns on this. Every Narita record in the batch states BEFORE or AFTER
security in its `note`.

### The timeline

| | |
|---|---|
| 06:30 | breakfast, California Restaurant (opens at that exact minute) |
| 07:00–07:10 | coach leaves the hotel |
| ~07:20–07:30 | arrive T1 — **35 minutes before the counters open** |
| 07:55 | SQ counters open (South Wing, check-in rows **A–K**) |
| ~08:30 | party checked in |
| ~08:30–09:00 | security + immigration |
| 10:15 | counters close |
| ~10:15–10:25 | boarding |
| 10:55 | SQ637 off |

So there are **two** usable windows, not one: roughly **07:20–08:40 landside** and roughly
**09:00–10:20 airside**. The landside window is the one nobody plans for, and it is the longer of
the two if the coach leaves at 07:00.

### LANDSIDE — before security

- **4F, South Wing** (where the group actually stands): **ITOKI work lounge + open lounge, free,
  05:00–24:00, 108 seats (49 + 59)**, power at the desks, wifi, airfield view — the answer to the
  35-minute wait for 35 people. **Tully's Coffee 07:00–21:00** and **SUBWAY 07:00–21:00** are
  beside it and already open on arrival. **Pokémon Store 09:00–20:00** — too late to be safe.
- **4F, Central Building:** **UNIQLO 08:00–20:00**; a CRAYON SHINCHAN pop-up 08:00–20:00 (not
  filed — it is a pop-up and may be gone by September).
- **4F, Central Building New Wing:** **YAMADA TAX FREE 07:30–21:00** — T1's only electronics
  specialist, open before the counters. Best landside buy on the schedule.
- **5F, Central Building — SHIKISAI GARDEN**, reopened 9 Apr 2026, ~¥2.5 bn, ~5,000 m² indoors
  plus a ~3,000 m² deck: general area from **05:00**; **GARDEN WALK deck from 06:30**, free, with
  a raised 2.5 m **Mountain Deck** and the old mesh replaced by **7 cm wire** for photography;
  **three footbaths, each 5 m × 0.8 m**, north side, one with seasonal aroma salts;
  the **茶の間 (48 seats) / 居の間 (12) / 書の間 (45)** relaxation rooms (~130 seats with
  perimeter seating); **SKY FOOD COURT**; **Capsule Marche 05:00–23:00**; the projection-mapped
  bamboo corridor **"in sync"**; **空の環 (Sky Ring)**, a woven bamboo sculpture by
  **Tanabe Chikuunsai IV**; **フレーベル館 Kinder Platz** 10:00–19:00, ¥2,200 child / ¥1,100 adult
  (opens after the group is airside — noted so nobody plans around it); and
  **食べられる標本室 by 日本草研究所** with herbal-tea tasting.
- **B1F:** LAWSON, and the JR / Keisei station.
- **1F:** international arrivals, buses, taxis.

### AIRSIDE — after security AND passport control, all on 3F

- **South Wing 3F — 成田なかみせ / Narita Nakamise.** This is the group's own concourse.
  Standalone **Chanel, Hermès, Tiffany & Co., Gucci, Cartier, Bvlgari**; **Fa-So-La Cosmetics &
  Perfumery**; the **liquor & tobacco** hall; **ANA DUTY FREE SHOP**; **Fa-So-La TAX FREE
  Akihabara** (two units); **Kagura**; and **Tokyo Food Bar** — the South Wing's own airside
  eating room, so anyone already at a far gate does not have to backtrack.
- **Central Building 3F**, the concourse the South Wing feeds into: **Matsumoto Kiyoshi**
  (the airside drugstore — the real J-beauty stop), **7-Eleven** (water and onigiri at konbini
  prices, after the 100 ml rule bites), **Fa-So-La TAX FREE ASAKUSA**, **KAIZOSHA SHOTEN**
  bookstore, **IPPUDO**, **McDonald's**, **JAPANESE GRILL & CRAFT BEER TATSU**, **MITSUMOTO TEI**,
  **Ploom SHOP**, **FaSoLa STARS DUTY FREE**, **THE LIQUOR NARITA AIRPORT**.
- **North Wing 3F — NARITA NORTH STREET** (Chanel, Bottega Veneta, Prada, Dior, Burberry,
  JAPAN DUTY FREE, Sushi Kyotatsu, Doutor, Komeraku, Snack & Cafe AVION). **Do not plan on it.**
  SQ637 is a Star Alliance South Wing departure and I could **not** verify that the two wings are
  connected airside. Filed here, not as a record.

Wings: **South Wing = Star Alliance** (ANA, **Singapore Airlines**, Thai, Air China, Lufthansa,
Ethiopian). North Wing = SkyTeam and others (ZIPAIR, Korean, Delta, KLM, Air France, Vietnam,
Peach). <https://kaigai-note.com/narita-terminal1-guide/>

### The one thing to say out loud

**There is no departure tax-refund counter at Narita on 15 Sep** (established fact, tax-free is
at-the-till until 31 Oct 2026). So the landside 4F shops — YAMADA TAX FREE, UNIQLO — deduct at
their own registers on ¥5,000 tax-excluded, Visit Japan Web accepted; and everything airside on
3F is already duty- or tax-free with no paperwork at all. Nobody needs to look for a counter, and
nobody should waste the 09:00–10:20 airside window trying to find one.

---

## 6. WHAT COULD NOT BE VERIFIED

Everything below is marked `confidence: "medium"` with a `confidenceNote` in the batch.

**Blocked or broken sources (retried once, then moved on):**

- `tsukijihongwanji.jp` — robots.txt fetch timeout. **Tsukiji Hongwanji's main-hall opening and
  closing hours on a Monday are therefore unverified**; Cafe Tsumugi's hours come from Rurubu
  instead.
- `borderless.teamlab.art` — robots-blocked. **teamLab Borderless at Azabudai Hills is not in the
  batch at all**, though it is ~9 min from Tokyo Tower and would otherwise belong.
- `tokyotower.co.jp/foottown/` and `/fee/` — "too many redirects". Foot Town's per-floor tenant
  list could not be retrieved; the staircase facts come from `/en/price/`, which does resolve.
- `premiumoutlets.co.jp/shisui/service/`, `/access/`, `/brands/category.html?cat=` — "too many
  redirects" or 404. The `/en/` and `/column/` paths work, which is where the block numbers came
  from. The floor map is served only through an external interactive map (platinumaps), which
  returns a loading image.
- `navitime.co.jp/around/` — 403 for both convenience-store and ATM categories, so the "what is
  near Shisui" question was answered by keyword searching instead of a POI radius query.
- `ds-direx.co.jp` and Yahoo Maps place pages — robots-blocked. **Direx Tomisato's opening hours
  are unknown**; the coordinate is the GSI 七栄646 block centroid, not the shop front.
- `elife-coffeebreak.com`, `hayato-travel.com`, `cosmospc-recruit.jp` — robots-blocked or 404.
  **ドラッグストアコスモス 富里七栄店 has no retrievable address, so it is NOT in the batch.**
- `city.tomisato.lg.jp/fanclub/0000014142.html` — 403 (the hotel's own city page); the sibling
  page for the riding club resolved.

**Facts I would want a phone call to settle before this reaches 35 people:**

1. Whether **トミサト酒場** is the booked 18:00 izakaya, and whether **密庵席** is available for
   35 on Mon 14 Sep. Tel 0476-93-1234.
2. Whether **RED° TOKYO TOWER** is open on 14 Sep (不定休) and what a day pass actually costs —
   the venue publishes prices only per plan.
3. **Narita's airside 3F shop hours.** The airport's own after-security mall page names every shop
   and restaurant but publishes **no hours for any of them**. Every airside record in the batch
   carries that as its `confidenceNote`. For a 09:00–10:20 window this is the gap that matters
   most.
4. **Shiba Toshogu's gate hours** — only the 09:00–17:00 goshuin desk is published; the grounds
   are unenclosed but no opening hour is stated.
5. **The tsukudani shops' hours, closing days and payment methods.** The Fisheries Agency guide
   gives founding years and addresses only. The brief asked which Tsukiji stalls are cash-only and
   sell out — that applies to the *existing* outer-market records; of my new Tsukiji records the
   free and ticketed sites take cards or nothing, and **Tenyasu / Tanakaya / Marukyu payment is
   unverified — assume cash on a 1837-vintage counter.**
6. **The 18品の朝ごはん price and its exact serving window**, and whether Cafe Tsumugi can seat a
   group.
7. **Shiba Maruyama Kofun's dimensions** — Minato City calls it Tokyo's largest keyhole mound but
   publishes no length; the widely-quoted 106 m is not on an official page I could reach.
8. **Roppongi Hills' open-air plaza hours** — 66 Plaza and Mohri Garden are treated as always
   open; Mori Building publishes no hours for them.
9. **Tsukishima's individual monja shop hours** — the 11:00 figure is a generalisation across
   ~70 independent shops.

**Coordinate honesty:** 21 of the 49 new records use a GSI block centroid or a precinct/mid-span
point rather than a geocoded doorway, and each says so in its `confidenceNote`. Only three are
`verified`: the Tokyo Tower site itself (two records) and 天安本店 at 佃1-3-14. Walking minutes
throughout are derived from straight-line distance with a 1.3 street factor at 80 m/min, except
湯楽の里 (operator's published 700 m) and the Shisui in-mall records (extrapolated from the block
numbering already on the map). None are measured routes.

**Not researched, and should not be added without a check:** the Nakagin Capsule Tower, which
routinely still appears in Tsukiji/Shimbashi listings. I did not verify its status this session.

---

## 7. DAY 7 IS THE LAST SHOPPING DAY — WHAT SURVIVES THE FLIGHT

25 kg hold / 7 kg cabin on Singapore Airlines, then a 7-hour leg and a 2h15 Singapore connection.
Three new `shopping` records, all chosen on that test:

- **天安本店 tsukudani, boxed (~¥1,500)** — 佃1-3-14, on the island where tsukudani was invented,
  same address since 1837. Simmered in soy and sugar, so **ambient shelf-stable, sealed, boxed,
  cooked** — no refrigeration, no customs question, negligible weight. The best Day 7 buy nothing
  in the existing research reaches. 18 min walk from the outer market over Kachidoki Bridge.
- **佃源田中屋 anago tsukudani (~¥1,200)** — the specific item, not the category; the shop's own
  staff pitch it with bread or pasta rather than rice, which sells better into a Malaysian
  household. Buying across Tanakaya, 天安 and 丸久 spreads 35 people over three counters instead
  of emptying one.
- **YAMADA TAX FREE beauty appliances (~¥25,000)** — T1 4F landside, **07:30**, before the
  counters open. Last chance at Japanese hair tools, headphones, cameras, watches. Two flight
  rules stated in the record: **100 V needs a converter in Malaysia**, and **lithium batteries
  must travel in the 7 kg cabin bag**, not the hold.

Not filed as buys, deliberately: the Shisui outlet clothing (already covered by the existing
block records, and it is soft goods that compress — the real constraint there is the 25 kg, not
survivability), and the airside Narita Nakamise boutiques, where the binding limit is the **7 kg
cabin allowance** rather than shelf life — a watch box or one bottle is fine, several bags are not.

## 8. SEASONALITY

Mid-September, hot and humid, reference temperatures 26°/23° on Day 7 and 26°/22° on Day 8, peak
typhoon month, no autumn colour anywhere. Relevant to specific records:

- Both Tokyo garden records (Hamarikyu, Kyu Shiba Rikyu) are green, not coloured — the 300-year
  pine and Nebukawa-yama's stonework are evergreen features and cost nothing on this date, which
  is why they are the ones I named.
- The Atago steps, Shiba Maruyama Kofun's unpaved mound and the Sumida River Terrace are all
  full-sun and unshaded at 09:00–11:00. The kofun in particular is bad in the wet.
- The Tokyo Tower outdoor staircase is **cancelled in rain or high wind**, which in September is
  a real probability, not a footnote.
- Tomisato is watermelon country and 富里スイカ is a June–July crop, so there is no watermelon
  season to sell the group on. Suehiro Noujou would have been the place for it, and it is closed
  Mondays anyway.
- The GARDEN WALK footbaths at Narita are the one weather-proof winner: 06:30, free, indoors-ish,
  and pleasant even at 26°.
