# notes-topup-tsukuba-shinjuku

Verification of 12 candidate places harvested from `slm37102/tohoku-trip-map` — a map for
**Trip 1, 15–22 August 2026**. Every date- and weekday-tied claim was re-derived for **our**
nights. Nothing was given `confidence: "high"` on their say-so.

**Our nights, and why their reasoning does not transfer**

| | Their map | Ours |
|---|---|---|
| Tsukuba (Hotel Nikko Tsukuba) | **Wednesday** 19 Aug 2026 | **Saturday 12 Sep 2026** — dinner 16:45 offsite, check-in 18:00, usable **18:30–23:00**, breakfast 07:30, coach 08:30 |
| Shinjuku (Granbell, Kabukicho) | **Friday** 21 Aug 2026 | **Sunday 13 Sep 2026** — dinner 17:00 offsite, check-in 18:30, usable **19:00–23:30**, breakfast 07:30, coach 08:30 |

Their Tsukuba plan is built round a line about something running "to 22:00 on Wednesdays". Every
Tsukuba venue below was therefore re-read for **Saturday**, and every Shinjuku venue for **Sunday
night into Monday morning** — Monday 14 Sep being a working day and a Tokyo Tower 09:00 start.

Batch output: `topup-tsukuba-shinjuku.json` — 11 `places`, 1 `shopping`, no `essentials` block
(the existing batches already carry good ones for both hotels), no `images` key, no
`removedFromDay` manifest (no superseded anchorStop is used). Validator: **0 errors, 0 warnings.**

Sport-related content in their `top3` and `run` fields was ignored entirely, as instructed.
Ishii Sports is another agent's job and is not touched here.

---

## Verdicts at a glance

| # | Candidate | Verdict | What their claim got wrong |
|---|---|---|---|
| 1 | Izakaya ROKU, BiVi 3F | **VERIFIED** (new record; floor-level overlap flagged) | Nothing on hours. They never mention it seats 45 and needs a buy-out for 35 |
| 2 | Ramen Tatsuro | **VERIFIED** (new record) | Nothing — but they omit that it has **16 seats** |
| 3 | Aoyama Garari, Q't 3F | **CORRECTED** (new record) | "last order 21:00" — real food L.O. is **22:00** (Hot Pepper 21:45), shop closes 23:00 |
| 4 | Lawson BiVi 2F | **VERIFIED** (new record) | Only the name: it is **ローソン つくば駅バスターミナル店** |
| 5 | Expo Center shop | **REJECTED for our window** (recorded anyway) | "daytime" understates it — **unreachable on this itinerary**, and no JAXA rocket line is advertised |
| 6 | Station-mall omiyage | **ALREADY HAVE IT — corrected** (`a3f5d387ccd7`) | "hoshi-imo and natto sweets" are **not** in this shop's published range |
| 7 | Kabukicho Yokocho | **ALREADY HAVE IT — corrected** (`5e98a1595579`) | Name is 歌舞伎横丁 (Kabuki Yokocho), and it is **10 areas incl. KABUKI CAFE**, not 10 regional stalls |
| 8 | Torikizoku Kabukicho | **CORRECTED** (new record) | **¥370 is stale — it is ¥390** since 1 May 2025. Hours and 04:00 close were right |
| 9 | Ichiran Kabukicho | **VERIFIED** (new record) | Nothing. They omit that it is **25 booths, no tables** |
| 10 | Mega Don Quijote Shibuya | **CORRECTED** (new record) | "3 min" is optimistic — **5 min**. 24 h confirmed |
| 11 | Don Quijote Kabukicho | **ALREADY HAVE IT — corrected** (`cf7c63b3e943`) | "6 min" is optimistic — **8 min**. 24 h confirmed. Our own record cited the **wrong store page** |
| 12 | Omoide Yokocho | **ALREADY HAVE IT — corrected** (`d6w30shin01`) | "15 min, before ~22:00" — it is **11 min** and the lane trades to **01:00 on a Sunday** |

---

## TSUKUBA — anchorStop `Hotel Nikko Tsukuba`, Saturday 12 September 2026

### 1. Izakaya ROKU, BiVi 3F — VERIFIED · new record `tpts01roku`

Their claim: *"150 m, yakitori and fish until midnight, last order 23:00"; "ROKU 16:00–24:00 (LO 23:00)"*.

- Real name **魚が旨い焼き鳥屋 六**. 住所 **茨城県つくば市吾妻1-8-10 BiViつくば3F**.
- **16:00–24:00, 無休** — printed on BiVi's own 3F floor guide, which is the landlord's page.
  Hot Pepper adds **料理L.O. 23:00 / ドリンクL.O. 23:30**. Their reading was accurate.
- **Saturday check:** the hours are printed as 月～日、祝日、祝前日 — one set for every day, so
  Saturday 12 Sep is a normal trading day. Their Wednesday reasoning happens to transfer here.
- Coordinate **36.081648, 140.112738**, verified from the Google-Maps link on the Let's Enjoy Tokyo
  listing; ~135 m straight from the hotel, so their "150 m" is right. Walk **3 min**.
- **CAPACITY, 35 PEOPLE:** 45 seats, maximum party 45, **貸切 from 24 people**. So 35 is possible
  only as a near-total buy-out, booked ahead — same-day online booking closes at 19:00 and request
  bookings close 17:00 the day before. Not a walk-in for a group.
- Budget ¥4,001–5,000 a head → `priceTier: ¥¥`.
- **Fits the window** 18:30–23:00 in full.
- Sources: <https://www.e-bivi.com/tsukuba/shop/floor.jsp?fid=3f>, <https://www.hotpepper.jp/strJ001134361/>

**Overlap flagged:** our `expand-d56.json` record **`d5w30tsuk01` "BiVi Tsukuba izakaya floor"**
already names 「魚が旨い焼き鳥屋 六」 inside its note as one of five tenants. ROKU is not in
`ref/our_names.txt` as a place, so this is emitted as a **new** record rather than a correction —
the added value is the seat count, the charter minimum and the verified building coordinate, none
of which the floor-level record carries. If the import prefers one record per floor, drop
`tpts01roku` and fold its capacity line into `d5w30tsuk01`.

### 2. Ramen Tatsuro — VERIFIED · new record `tpts02tatsuro`

Their claim: *"12 min north, jiro-style bowls to 22:00, no closing days"*.

- Real name **ラーメン龍郎**. 住所 **〒305-0031 茨城県つくば市吾妻3-8-1 吾妻ハイツ105**, ☎ 029-859-3311.
- **11:30–14:30 / 17:30–22:00**, closing days **年末年始 only** — so "to 22:00, no closing days" is
  right, and Saturday 12 Sep is normal. Note 22:00 is the **close**, not a last order.
- Direction and distance right: **due north**, 725 m from Tsukuba Station (Tabelog), 816 m straight
  from the hotel, ~1,020 m walking → **13 min** (their 12 is within a minute).
- Coordinate **36.089272, 140.110931** — GSI 吾妻三丁目8番 block point, so `approximate`.
- **CAPACITY, 35 PEOPLE: 16 seats.** This is a two-or-three-person errand. A group cannot go.
- `confidence: medium` — the shop has no website; hours agree across Hot Pepper and Ibanavi but
  neither is the operator.
- **Fits the window** only until 22:00; leave the hotel by ~21:15.
- Sources: <https://www.hotpepper.jp/strJ000962301/>, <https://ibanavi.net/shop/2396>

### 3. Aoyama Garari, Q't 3F — CORRECTED · new record `tpts03garari`

Their claim: *"3 min, proper izakaya dinner, **last order 21:00**"*.

- Real name **青山がらり つくば店**. 住所 **茨城県つくば市吾妻1-6-1 トナリエつくばスクエアQ't 3F**, ☎ 029-851-1615.
- **THEIR LAST ORDER IS WRONG.** Two readings:
  - **their claim:** last order 21:00
  - **operator's own store page (rush-forward.jp):** **11:00〜23:00, 料理L.O. 22:00, ドリンクL.O. 22:30, 年中無休, 65席**
  - Tonarie's official floor guide agrees: 11:00〜23:00, last order 22:00
  - Hot Pepper splits it 11:00–14:30 + 17:00–23:00 with 料理L.O. **21:45**
  So the true food cut-off is **21:45–22:00**, not 21:00 — a full extra hour of usable evening.
- **Saturday check:** 年中無休 on the operator's page; Saturday is normal. Their Wednesday framing
  is irrelevant here, but Tonarie prints a standing warning — *"不定期で時短営業"* — so phone
  029-851-1615 on the day.
- Coordinate **36.082012, 140.111302**, verified from the operator's own embedded map. Walk **4 min**
  (216 m straight); their "3 min" is fine.
- **CAPACITY, 35 PEOPLE — THIS IS THE ONE.** 65 seats, **up to 40 on one floor**, **貸切 from 26**.
  Dinner ~¥3,000, or a 宴会 course with nomihodai from ¥5,000. It is the only venue in walking
  distance of the hotel that can seat the whole group in one room.
- **Fits the window** 18:30 to a 22:00 last order, 23:00 close.
- Sources: <https://rush-forward.jp/galali/tsukuba/>, <https://tonarie-tsukuba.jp/floorguide/detail/?scd=000083>, <https://www.hotpepper.jp/strJ000852634/>

### 4. Lawson BiVi 2F — VERIFIED · new record `tpts04lawson`

Their claim: *"24h Lawson in BiVi for anything later"*.

- Real name is **ローソン つくば駅バスターミナル店**, not "Lawson BiVi". 住所 **〒305-0031 茨城県つくば市吾妻1丁目8-10**, ☎ 029-855-5530.
- **Floor confirmed 2F**, and BiVi's own shop page prints **24時間営業 / 休業日：なし** — so the
  24-hour claim holds, on a Saturday like any day.
- Same building as ROKU, coordinate **36.081648, 140.112738**, walk **3 min**.
- Not a duplicate: our dataset's 24-hour konbini near this hotel is **FamilyMart Tsukuba Q't**
  (`f02b36afd49c`) in the Tonarie building. This is the BiVi-side one, so it pairs with a ROKU
  evening and is still open when the group gets back at 23:00.
- **Fits the window** (any hour).
- Source: <https://www.e-bivi.com/tsukuba/shop/index.jsp?bf=1&fmt=1&shopid=9005>

### 5. Expo Center shop — REJECTED for our window, recorded anyway · new record `tpts05expshop`

Their claim: *"JAXA and rocket goods (daytime)"*.

- Real name **サイエンスミュージアムショップ**, inside **つくばエキスポセンター**, 住所 **〒305-0031 茨城県つくば市吾妻2-9**, ☎ 029-858-1100.
- **Museum 09:50–17:00, last admission 16:30. Closed Mondays** (翌平日 if the Monday is a holiday),
  plus 年末年始 and 臨時休館. In December and January it closes Mondays **and** Tuesdays.
- **NOT REACHABLE ON THIS ITINERARY.** The group is at the hotel from **18:00 Saturday** — an hour
  after closing — and the coach leaves **08:30 Sunday**, 80 minutes before it opens. There is no
  moment in Night 5 when this shop is open. Recorded with the verdict in the note so nobody plans it.
- Their "JAXA and rocket goods" overstates the stock: the shop's own page advertises 宇宙食, science
  goods, space goods, 星座グッズ, Cosmo Hoshimaru originals, capsule toys and a "Medaleaf" medal
  press. No JAXA-branded or rocket-specific line is named. The genuinely usable rocket content is
  the **floodlit H-II in the forecourt**, which we already hold.
- `confidence: medium` — no published statement of whether the shop sits inside or outside the
  ticket gate, and it prints no hours of its own.
- **CORRECTION TO OUR OWN DATA (not emitted, flagged here):** both existing forecourt records
  — `9335d452fae7` and `3ccd9b227958` — say the museum ticket is **¥500**. The operator's price
  page gives **¥600 adult (18+) / ¥300 child (4+)**, planetarium a further ¥600/¥300, and groups of
  20+ must reserve in advance. Also worth noting: those two records are near-duplicates of each
  other at the same coordinate.
- Sources: <https://www.expocenter.or.jp/shop/>, <https://www.expocenter.or.jp/information/price_list/>, <https://www.ibarakiguide.jp/spot.php?mode=detail&code=779>

### 6. Station-mall omiyage — ALREADY HAVE IT, corrected · reuses `a3f5d387ccd7`

Their claim: *"Ibaraki hoshi-imo and natto sweets in the station mall"* — asked to name the shop.

- We already hold it: **つくばの良い品 / Tsukuba no Yoi Shina**, `a3f5d387ccd7` in `day5-nikko.json`.
  Emitted as a **correction reusing that id** rather than a duplicate.
- Address now confirmed **茨城県つくば市吾妻2-128, TXつくば駅構内**; **08:00–20:00, 無休** — the
  seed's hours were right and now have a second source.
- **Their product claim is wrong for this shop.** Its published range is 北条米 and 福来みかん
  products, research-institute goods, and seasonal local produce from about 45 makers / 100+ items.
  **Hoshi-imo and natto sweets are not in it.** For those, our own `4abf04b5ec35` already points at
  the Ropia supermarket on Tonarie CREO 1F — that is the right shelf. We also already carry
  hoshi-imo as a `shopping` item (`1cb5ca338c1d`).
- **Saturday window:** open 08:00–20:00 means only **90 usable minutes (18:30–20:00)** on Saturday
  night, plus a **08:00–08:30 sliver** before Sunday's coach. Worth writing on the rooming list.
- Sources: <https://rurubu.jp/andmore/spot/80006195>, <https://msearch.gsi.go.jp/address-search/AddressSearch?q=つくば駅>

---

## SHINJUKU — anchorStop `Shinjuku Granbell Hotel`, Sunday 13 September 2026

### 7. Kabukicho Yokocho — ALREADY HAVE IT, corrected · reuses `5e98a1595579`

Their claim: *"10 regional food-festival stalls, 6–7 min away, running 06:00–05:00"*.

- We already hold it as **Shinjuku Kabuki Hall / Kabuki Yokocho**, `5e98a1595579` in
  `day6-hitachi.json`, at the same coordinate. Emitted as a **correction reusing that id** — the
  existing record's `confidenceNote` explicitly flagged the 24 h / 06:00–05:00 disagreement, which
  is the thing this pass was asked to settle.
- Correct name: **新宿カブキhall〜歌舞伎横丁** — *Kabuki* Yokocho, not "Kabukicho Yokocho".
  住所 **〒160-0021 東京都新宿区歌舞伎町一丁目29番1**, 東急歌舞伎町タワー **2F**.
- **Their 06:00–05:00 is right, and it comes from the tower operator itself.** See the Sunday
  section below for the full reasoning.
- Stall count is very slightly off: the venue's own site lists **10 stores** — 北海道食祭, 東北食祭,
  関東食祭, 横浜中華食祭, 中部食祭, 近畿食祭, 中四国食祭, 九州沖縄食祭, 韓国食祭 and **KABUKI CAFE**.
  So eight Japanese regional 食祭 plus a Korean one plus a cafe, not ten regional stalls. Our old
  record said "nine"; both were near-misses.
- ~**1,300 seats**, kiosk-fixed prices, picture menus, no seating charge.
- Walk **8 min** from Granbell (453 m straight, ~590 m walking). Their "6–7 min" is measured from
  somewhere closer than our hotel door; the operator's own page says 1 min from Seibu-Shinjuku and
  7 min from Shinjuku Station.
- **CAPACITY, 35 PEOPLE:** ~1,300 seats and kiosk ordering. Still the only Kabukicho room that
  absorbs the whole group with no booking, at any hour.
- `confidence: medium` retained — see below.
- **Fits the window** 19:00–23:30 in full, and well beyond.
- Sources: <https://www.tokyu-kabukicho-tower.jp/floorguide/detail/?scd=000018>, <https://kabukihall.com/>, <https://kabukihall.com/access/>

### 8. Torikizoku Shinjuku-Kabukicho — CORRECTED · new record `tpsj01torikizoku`

Their claim: *"¥370-flat yakitori until 04:00, 6–7 min (verified on the official locator this week)"*.

- **THE PRICE IS STALE.** Two readings:
  - **their claim:** ¥370 flat
  - **actual, and on Torikizoku's own store page:** **¥390 tax-included**
  The chain's history is ¥350 (28 Apr 2022) → ¥360 (1 May 2023) → **¥370 (1 May 2024)** → **¥390
  (1 May 2025)**, with no chain-wide rise announced as of May 2026. Their ¥370 is exactly one price
  revision out of date — consistent with a Trip 1 note written against older material. A 35-person
  bill therefore comes in about 5% above what their map implies.
- **THE HOURS ARE RIGHT, AND THEY HOLD ON A SUNDAY.** 鳥貴族 新宿歌舞伎町店, 住所 **〒160-0021
  東京都新宿区歌舞伎町1丁目17-12 6F**, ☎ 050-3647-3726. Official locator: **Mon–Fri 15:00–04:00,
  Sat–Sun 13:00–04:00.** Hot Pepper reads it 16:00 / 15:00 open, same **04:00** close. Closed only
  31 Dec – 1 Jan. So the 04:00 finish is true on Sunday night into Monday morning — no pullback.
- Walk **7 min** (444 m straight, ~600 m walking) from Granbell. Their "6–7 min" is right.
- Coordinate **35.69442, 139.70158**, `approximate` — derived from the verified point for Ichiran
  next door in the same 歌舞伎町1-17 block, because GSI resolves 歌舞伎町 only to the district
  centroid (35.695393, 139.701294).
- **CAPACITY, 35 PEOPLE — THE REAL PROBLEM.** 100 seats (12 counter + 88 table), maximum party 100,
  but **貸切 is not offered** and **net reservations ended 17 April 2022**. A 35-person walk-in at
  19:00 on a Sunday will not be seated together. Phone 050-3647-3726 ahead, or split across the
  branches below.
- **Three Kabukicho branches, all late on a Sunday** — useful for splitting 35:
  | Branch | Address | Sun hours | Seats |
  |---|---|---|---|
  | 新宿歌舞伎町店 | 歌舞伎町1-17-12 6F | 13:00–04:00 | 100 |
  | 新宿歌舞伎町セントラルロード店 | 歌舞伎町1-14-3 6F (川新ビル) | 15:00–04:00 | 86 |
  | 新宿区役所通り店 | 歌舞伎町1-2-3 B1F (レオ新宿ビル) | 16:00–**04:30** | 118 |
  (Not emitted as separate records — I could not obtain street-level coordinates for the other two
  and would not invent them.)
- **Fits the window** 19:00–23:30 in full.
- Sources: <https://en.map.torikizoku.co.jp/detail/299/>, <https://en.map.torikizoku.co.jp/detail/400/>, <https://en.map.torikizoku.co.jp/detail/612/>, <https://www.pricey.jp/web/articles/4494>, <https://www.hotpepper.jp/strJ001044076/>

### 9. Ichiran Kabukicho — VERIFIED · new record `tpsj02ichiran`

Their claim: *"the 24h tonkotsu booths, 6–7 min; late-night surcharge after 22:00"*.

- **All three verified on Ichiran's own store page.** 一蘭 新宿歌舞伎町店, 住所 **〒160-0021
  東京都新宿区歌舞伎町1-17-10**, ☎ 050-3733-3393. **24 hours, no closing days.**
- **Late-night surcharge confirmed**, and the operator prints the window as **22:00 to 06:00 the
  next day** — so most of our 19:00–23:30 slot sits inside it. Chain pricing puts the classic bowl
  at about **¥980 → ¥1,080** and 替玉 **¥210 → ¥230** after 22:00. Anyone going after 22:00 pays
  roughly ¥100 more per bowl.
- **Sunday check:** 24 hours with no day-of-week variation and no closing days, so Sunday into
  Monday is unaffected.
- Coordinate **35.694394, 139.701561**, `verified` from the Google-Maps link on the Let's Enjoy
  Tokyo listing. Walk **7 min** from Granbell. Their "6–7 min" is right. Literally next door to
  Torikizoku 新宿歌舞伎町店.
- **CAPACITY, 35 PEOPLE: 25 counter booths, 0 tables, 0 private rooms.** The group cannot sit
  together at any hour — it is a three-or-four-at-a-time trickle, or a queue. This is the single
  most important thing their note omits.
- `confidence: high` on hours/address/booths/surcharge window; the ¥980/¥1,080 figures carry a
  `confidenceNote` because they are the chain's standard prices from a price tracker, not read off
  this branch's menu.
- **Fits the window**, with the surcharge caveat.
- Sources: <https://en.ichiran.com/shop/tokyo/kabukicho/>, <https://www.nogu.biz/2026/03/ichiran.html>

### 10. Mega Don Quijote Shibuya — CORRECTED · new record `tpsj03megadonki`, anchored to `Shibuya Scramble Crossing`

Their claim: *"24h, 3 min away"* from Shibuya Crossing.

- **MEGAドン・キホーテ渋谷本店**, 住所 **〒150-0042 東京都渋谷区宇田川町28-6**, ☎ 0570-076-311.
  **24時間営業, 定休日なし, 免税対応** — confirmed on Don Quijote's own store page.
- **THEIR WALK IS OPTIMISTIC.** Two readings:
  - **their claim:** 3 min
  - **actual:** 262 m straight line from the crossing, but the route climbs Center-gai and doglegs
    onto Inokashira-dori — about 400 m, **5 min**, and slower than that in the 15:30 Sunday crowd.
- Coordinate **35.660339, 139.697739** — `verified`, GSI resolved 宇田川町28番6号 exactly (Shibuya
  geocodes cleanly, unlike Kabukicho).
- Anchored to **Shibuya Scramble Crossing** as instructed. The group is at the crossing at **15:30
  Sunday**, so this is the daytime shopping stop, not a night one — and tax-free is still deducted
  **at the till** until 1 Nov 2026, so there is no refund desk to find at Narita.
- A separate annex, **MEGAドンキ渋谷別館**, is about a minute further on.
- Not a duplicate: `ref/our_names.txt` holds *don quijote ginza honkan* and *don quijote shinjuku
  kabukicho* only.
- **CAPACITY:** a 24-hour discount store, no seating issue — but 35 people through one tax-free
  counter is the bottleneck; send them in waves.
- **Fits** the 15:30 Shibuya stop.
- Source: <https://www.donki.com/store/shop_detail.php?shop_id=442>

### 11. Don Quijote Kabukicho — ALREADY HAVE IT, corrected · reuses `cf7c63b3e943`

Their claim: *"24h, 6 min"*.

- We already hold it as a **`shopping`** record, `cf7c63b3e943` in `day6-hitachi.json`. Emitted as a
  **correction reusing that id, in the same section**, so the import replaces rather than doubles it.
- **THE IMPORTANT FIX IS OUR OWN.** Our record cited
  `donki.com/store/shop_detail.php?shop_id=195` — **that page is MEGAドン・キホーテ西帯広店, in
  Hokkaido.** The Kabukicho store is **shop_id=29**. Corrected in the emitted record.
- On the correct page: **ドン・キホーテ 新宿歌舞伎町店**, 住所 **〒160-0021 東京都新宿区歌舞伎町1-16-5**,
  ☎ 0570-010-411, **24時間営業, 定休日なし, 免税対応**. So their 24 h claim holds, Sunday included,
  and our record's "carried over from the seed" hedge can be dropped — `confidence` goes
  medium → **high**.
- **Their 6 min is optimistic**; it is **8 min** (472 m straight, ~640 m walking), which is what our
  existing record already said.
- Coordinate now **35.69379, 139.701744**, upgraded medium → `verified`, taken from the Google-Maps
  link on the tax-free-shop directory listing. It matches the seed's estimate (35.69374, 139.70173)
  to within about 5 m — the seed's Kabukicho guess was right after all. This point is also what
  let me place the 歌舞伎町1-17 block for Torikizoku and Ichiran.
- ¥5,500 tax-free threshold unchanged.
- **Fits the window** (any hour).
- Sources: <https://www.donki.com/store/shop_detail.php?shop_id=29>, <https://www.taxfreeshops.jp/ja/shop/1323>

### 12. Omoide Yokocho — ALREADY HAVE IT, corrected · reuses `d6w30shin01`

Their claim: *"15 min, for atmosphere before ~22:00"*.

- We already hold it, `d6w30shin01` in `expand-d56.json`, at the same coordinate. Emitted as a
  **correction reusing that id**.
- **BOTH HALVES OF THEIR CLAIM ARE WRONG.**
  - Walk: **their 15 min** vs **our 11 min** (西新宿1-2, straight under the JR tracks).
  - Closing: **their "~22:00"** vs the actual — the alley's flagship **岐阜屋** (西新宿1-2-1) prints
    **日月火水木 09:00–翌01:00, 金土 09:00–翌02:00, 定休日なし**. On **Sunday 13 Sep** it is
    therefore trading until **01:00 Monday**, three hours past their cutoff. The 22:00 figure appears
    to be their own guess, not a published hour: the alley's official site publishes **no** alley-wide
    hours at all and explicitly says to check each shop.
- Official scale, from the alley's own site: about **80 shops over 630 tsubo, ~60 of them food**.
  Our record said "about 60 tiny counters" — right, for the food ones.
- **CAPACITY, 35 PEOPLE:** 岐阜屋's **55 seats** is the only room in the lane that takes a real
  group; everything else is six to ten stools. Split the group or don't go. Cash in many.
- `confidence: high` (alley official site plus 岐阜屋's page on it).
- **Fits the window** 19:00–23:30 comfortably, with hours to spare.
- Sources: <https://shinjuku-omoide.com/>, <https://shinjuku-omoide.com/shop/gifuya>

---

## Settled question 1 — Sunday night in Kabukicho

All three late venues claim very late hours. What is actually true on **Sunday 13 September into
Monday 14 September 2026**, with Monday a working day:

| Venue | Published Sunday close | Pullback vs Friday/Saturday? |
|---|---|---|
| 新宿カブキhall〜歌舞伎横丁 (Tokyu Tower 2F) | **05:00** Monday | **No.** One envelope, all days |
| 鳥貴族 新宿歌舞伎町店 | **04:00** Monday | **No.** Sat and Sun are one block: 13:00–04:00 |
| 鳥貴族 新宿区役所通り店 | **04:30** Monday | No. Sat–Sun 16:00–04:30 |
| 一蘭 新宿歌舞伎町店 | **24 hours** | **No.** No day-of-week variation, no closing days |
| 思い出横丁 · 岐阜屋 | **01:00** Monday | **Yes, one hour** — Fri/Sat run to 02:00 |

**So the answer is: the three headline venues do not pull back on a Sunday** — and that is not an
assumption, it is what the operators print. But the fear behind the question is well founded, because
**neighbours in the very same building do pull back on Sunday**, and by a lot:

| Tokyu Kabukicho Tower tenant | Fri | Sat | **Sun** |
|---|---|---|---|
| Water Terrace, 5F | 15:30–**05:00** | 13:00–**05:00** | 13:00–**23:30** |
| namco TOKYO, 3F | 11:00–01:00 | 11:00–01:00 | 11:00–01:00 (Mon–Thu only 23:00) |
| XCASINO, 5F | 17:00–23:30 | 14:00–23:30 | 14:00–23:30 |
| 新宿カブキhall, 2F | 06:00–05:00 | 06:00–05:00 | **06:00–05:00** |

Water Terrace loses **five and a half hours** on a Sunday. Anyone reasoning "the tower is open till
05:00" as a blanket fact would be wrong about that floor and right about the food floor. Two caveats
on the food floor itself, both from the operator: individual 食祭 areas keep a **開店準備時間**, so a
single stall can be shut inside the envelope; and the tower's floor guide (**6:00〜翌5:00**) and the
venue's own site (**24時間営業, 年中無休**) still disagree — which is why that record stays
`confidence: medium`.

Other Sunday-evening options inside the same tower, for a 19:00–23:30 window, if the food floor is
crowded: SHOGUN BURGER 1F to 23:00 (L.O. 22:30), 和牛特区 1F dinner to 23:00 (L.O. 22:00), SHARI 5F
dinner to 23:00, Starbucks 1F to 22:00.

## Settled question 2 — where 35 people can and cannot go

| Venue | 35 in one sitting? | Detail |
|---|---|---|
| **青山がらり つくば店** | **Yes, booked** | 65 seats, up to 40 on one floor, 貸切 from 26. The Tsukuba answer |
| **魚が旨い焼き鳥屋 六** | **Yes, as a buy-out** | 45 seats, max party 45, 貸切 from 24. Same-day online cuts off 19:00 |
| **新宿カブキhall〜歌舞伎横丁** | **Yes, unbooked** | ~1,300 seats, kiosk ordering, no seating charge. The Kabukicho answer |
| **思い出横丁** | Only in pieces | 岐阜屋 55 seats; everything else 6–10 stools |
| **鳥貴族 新宿歌舞伎町店** | **Risky** | 100 seats, but **no 貸切** and **no net booking since Apr 2022**. Phone, or split across three branches (100 + 86 + 118) |
| **一蘭 新宿歌舞伎町店** | **No** | **25 counter booths, no tables.** A trickle or a queue, never one sitting |
| **ラーメン龍郎** | **No** | **16 seats** |
| Don Quijote Kabukicho / MEGA Donki Shibuya | n/a | Retail. The tax-free counter is the queue, not the seats |
| Lawson BiVi 2F / Tsukuba no Yoi Shina | n/a | Retail |
| Science Museum Shop | n/a | Shut whenever we are there. Groups of 20+ must pre-book the museum anyway |

## Unverifiable or left hedged

- **新宿カブキhall opening envelope** — two official pages disagree (06:00–05:00 vs 24 h). No
  per-stall last orders published anywhere. Record kept `medium`.
- **ラーメン龍郎** — no operator website exists. Hours agree across two directories only; record
  kept `medium`, coordinate is a GSI block point.
- **Science Museum Shop** — no published statement of whether it sits inside the ticket gate, and it
  publishes no hours of its own. Record kept `medium`. Moot in practice: shut in both our windows.
- **つくばの良い品** — 08:00–20:00 now has a second source but still not the shop's own page; kept
  `medium`, coordinate is the GSI つくば駅 station-box point.
- **Kabukicho coordinates generally** — GSI resolves 歌舞伎町 only to the district centroid
  (35.695393, 139.701294) at every level tried, including 丁目/番 forms. Ichiran and Don Quijote were
  recovered from Google-Maps links embedded in third-party listings; Torikizoku 新宿歌舞伎町店 is
  placed from Ichiran's next-door point and marked `approximate`. Nominatim and Overpass are both
  blocked from this environment, and Yahoo/Navitime refuse automated fetching.
- **Torikizoku セントラルロード店 and 区役所通り店** — verified hours and seat counts, but no
  street-level coordinate obtainable, so they live in this file and in `tpsj01torikizoku`'s note
  rather than as records of their own.
- **Aoyama Garari food last order** — 22:00 (operator and mall) vs 21:45 (Hot Pepper). The record
  takes the operator's figure and names the discrepancy. Tonarie's standing 時短営業 warning means
  the day-of phone call is not optional.
- **granbellhotel.jp** blocks automated fetching, as flagged in the brief; nothing here needed it.

## Things flagged for someone else

- **`9335d452fae7` and `3ccd9b227958`** (both "H-II rocket / Expo Center forecourt", `day5-nikko.json`)
  say the museum ticket is **¥500**. It is **¥600 adult / ¥300 child**, planetarium ¥600/¥300 extra,
  20+ must pre-book. The two records are also near-duplicates of each other at the same coordinate.
  Not corrected here — out of this batch's scope, and they are `sight` records where the price is
  incidental.
- **`244a0f8595cf`** ("Q't 3F dining floor") carries a `medium` hedge that its 23:00 close is a
  seed figure. It is now confirmed for at least one 3F tenant: Aoyama Garari closes 23:00 per the
  chain operator and per Tonarie. Left alone to avoid overwriting a record this pass did not
  fully re-derive.
