# notes-topup-naruko — verifying nine candidates harvested from `slm37102/tohoku-trip-map`

**Our anchor:** `Ooedo Onsen Monogatari Naruko Onsen Kounkaku` (大江戸温泉物語 鳴子温泉 幸雲閣),
〒989-6821 宮城県大崎市鳴子温泉字車湯17. **Night 2 = Wed 9 Sep 2026. Dawn = Thu 10 Sep 2026.**
Arrival 18:30 · dinner 19:00 · breakfast 07:30 · coach 08:30.
**Usable windows: 20:00–22:30 Wed evening, 06:00–07:30 Thu dawn.**

The source map is Trip 1, **15–22 Aug 2026** — a Saturday start. Its "your Sunday" and "your Monday"
are 16–17 August. Every weekday-dependent fact below was re-derived for 9/10 September.

## What I measured distances from — stated plainly

The GSI geocoder resolves the hotel's `車湯17番地` to **38.748074, 140.726532**, which is exactly the
coordinate already on file in `new-hotels.json`, and the same point it returns for the superseded
Hotel Kameya's `車湯54-6`. So it is an **aza-level (字車湯) centroid, not the building**. Every walking
figure below is a haversine straight line from that point, multiplied by 1.30 for Naruko's switchback
street grid, at 80 m/min. Naruko is a hill town: 車湯 sits at about 144 m and the station cluster is
below it, so **the walk down is the quoted figure and the walk back up is 2–3 minutes longer.**

Two independent checks say the hotel point is good enough for this purpose:
- The Lawson at `車湯92-45` has a building-level coordinate (38.74868936, 140.72695924) and comes out
  **78 m** away — the source map said 70 m.
- 滝の湯's official Tohoku-tourism coordinate is **38.7415793, 140.7178483**, matching the coordinate
  we already held to five decimals, and landing 1.04 km out — the source map said 1.1 km.

**Caution on the geocoder:** it returns a *block* centroid for the 湯元 aza. `湯元47番地` (滝の湯) and
`湯元31番地` (温泉神社) both resolve to the identical point 38.738983, 140.718002, which is 290 m from
滝の湯's true position. I therefore did **not** overwrite our held building-level coordinates with
geocoder output, and I marked banchi-centroid coordinates `approximate`.

---

## THE FINDING THAT MATTERS MOST — and it was not on their list

**早稲田桟敷湯 Waseda Sajiki-yu is CLOSED 3–10 September 2026.**

> 「源泉関係のメンテナンス工事の為 令和８年９月３日（木）～９月１０日（木） の期間休業します」
> …「源泉の状況により、休業期間が延長となる場合もございます」

Confirmed on **both** official association sites, independently:
- https://www.naruko.gr.jp/鳴子温泉・早稲田桟敷湯　臨時休業のお知らせ　/
- https://www.welcome-naruko.jp/information/鳴子･早稲田桟敷湯-臨時休業-2

The notice's weekdays check out against 2026 (3 Sep and 10 Sep are both Thursdays), which is a good
authenticity signal. **This covers our night AND our dawn.** Our held record `06cb9e37e31a` sells it as
"the latest-closing bath in town, which is the one that still works if the 19:00 kaiseki runs long" —
that advice would walk the group 15 minutes downhill to a locked door. **Corrected in place.**

Knock-on effect: with Waseda shut, **滝の湯 is the only public bath in Naruko Onsen open on our night**,
and Osaki City warns 「一度に多くの人が入浴できない昔ながらの施設です」. One small bath, 35 people, last
entry 20:30. Plan it as a rota or not at all.

Also checked and **clear**: 全国こけし祭り with its 交通規制・入場制限 was **5–6 Sep 2026**, three days
before we arrive. No conflict. No September closure notice exists for 滝の湯, the footbaths or 鳴子峡.

---

## Per candidate

### 1. 滝の湯 Taki no Yu — **VERIFIED (hours/price) + CORRECTED (age)** · reuses `c6843df359bd`
Their claim: "07:30–21:00 · ¥300 · 150-year-old cypress bath, pH2.9 sulfur water", 1.1 km.

- **Hours and price: correct.** Osaki City's own page: 所在地「宮城県大崎市鳴子温泉字湯元47番地1」,
  営業時間「7時30分から21時まで」、「最終受け付けは20時30分です。」, 入浴料「大人300円、子ども100円」,
  番台 080-9633-7930. The ¥300 is current — the association's 2024 notice records
  「大人２００円⇒３００円、小人１００円（変更なし）※令和6年4月1日から料金変更」, so ¥200 is the stale figure.
- **"150-year-old" is wrong.** Official Tohoku tourism: the building was **rebuilt in 1974** with Agency
  for Cultural Affairs support, in Taishō-era style, and is run by the 滝の湯保存会. The thousand-year
  pedigree belongs to the *spring* — the 御神湯 of 温泉神社, kept by Date-appointed 湯守 — not the timber.
  Both readings: **theirs "150-year-old cypress bath" · actual "1974 reconstruction of a bath with a
  千年の歴史"**. The Aomori-hiba tubs are real (association: 「青森ヒバの浴槽で硫黄の香り」).
- **pH 2.9: not confirmed on any official page.** The association says only "sulfur aroma"; Osaki City
  gives 「皮膚病や高血圧等に効果があります」 and no analysis sheet. Left in the record as inherited, not
  upgraded to a verified figure.
- Distance 1.04 km → **17 min down, ~20 back up**.
- **Window: evening only, and it is a race.** Last entry 20:30. Leave the hotel by 20:00.
  **Does NOT fit dawn** — it opens 07:30, the same minute as breakfast, and the coach goes at 08:30.
- Source: https://www.city.osaki.miyagi.jp/shisei/soshikikarasagasu/narukosogoushisho/chiikishinkoka/4/1/3347.html

### 2. 湯めぐり広場 Yumeguri Hiroba — **ALREADY HAVE IT → correction emitted** · reuses `n2kk-footbath`
Their claim: "Always open · free · hand-baths and hissing source wells on the main street", 1.0 km.

We already hold this at the correct anchor as `n2kk-footbath` (and retired at Kameya as `52d18832135b`).
**I did not add a duplicate; I corrected the existing record**, because three things are now better sourced:

- **"hand-baths" is right, and it is a 手湯, distinct from the 足湯.** The association states
  「温泉街には足湯が３ヵ所、手湯が１ヵ所あります。…ご利用は無料です」 and names all four:
  **湯めぐり駐車場足湯 · ぽっぽの足湯（駅前）· リブマート大崎足湯 · ゆめぐり広場手湯**.
  **リブマート大崎足湯 is a third footbath we did not hold at all.**
- **"on the main street" is wrong.** Osaki City puts ゆめぐり広場「下地獄足湯」 inside the **station's
  湯めぐり駐車場**, reopened 令和2年8月7日, with the 手湯 alongside 「気軽に温泉の湯ざわりを楽しんでもらう」.
  The adjacent 温泉たまご工房 was closed as of that notice.
- **"Always open" remains UNVERIFIED.** Free is official. **No source — association, city or operator —
  publishes any opening or closing hour for any of the four.** Kept `medium`, as their own map conceded.
- Distance 1.05 km → 17 min. **Fits both windows** on the balance of probability, but on an unlit
  station car park at 22:00 the footbath is not the draw the dawn one is.

### 3. ぽっぽの足湯 Poppo no Ashiyu — **ALREADY HAVE IT → folded into the same correction**
Their claim: "Always open · free · station forecourt footbath", 1.1 km — their confidence medium.

Held as `f3afba04e849` (retired) and inside `n2kk-footbath` (live). **Skipped as a separate record** —
same anchor, same 17-minute leg, coordinate within tens of metres. Their medium rating was **correct
and honest**: the association confirms it is free and 駅前, and publishes no hours. My measurement
1.09 km against their 1.1 km. **Fits the dawn window** and is the single best 06:00–07:30 item in town.

### 4. ローソン 大崎鳴子温泉店 — **VERIFIED, the "assumed" is now confirmed** · new `tnk-lawson`
Their claim: "24 hours (ASSUMED)", 70 m from the door.

- **24 hours is now sourced.** Miyagi Prefecture's own みやぎ子育て支援パスポート shop registry prints
  営業時間「**24時間営業**」and 定休日「**なし**」. That is an official prefectural page, not an aggregator.
  Lawson's own store locator could not be read at all (`store.lawson.co.jp` fails robots.txt with
  `[SSL: DH_KEY_TOO_SMALL]`; `e-map.ne.jp/p/lawson/dtl/273318/` returns 404) — the phone is 0229-25-5307
  if anyone wants operator confirmation.
- 〒989-6821 宮城県大崎市鳴子温泉**車湯**92-45 — **the same aza and the same postcode as the hotel.**
- Building-level coordinate **38.74868936, 140.72695924** → **78 m**, so **their 70 m stands**.
- **Fits both windows outright.** It is the only thing in Naruko that is unambiguously open at 22:15
  and again at 06:00, and it is the fix for 滝の湯 selling no soap.
- Source: https://www.miya-pass.jp/shop/?s=jJZVrkF3

### 5. 旬菜呑処こけし — **CORRECTED** · new `tnk-kokeshi-izakaya`
Their claim: "From 18:30 · irregular closing days", tiny izakaya 7–8 min downhill, 0.6 km.

- **They omitted the closing time.** Hours are **18:30–21:00** (Gnavi and Tabelog agree).
  Both readings: **theirs "from 18:30" · actual "18:30–21:00"**. Only **20:00–21:00** of our window is
  live, and that is after a 19:00 hotel dinner.
- **"Tiny" is right and it is disqualifying: 30 seats**, private rooms 10–20. It cannot take 35.
- 〒989-6822 宮城県大崎市鳴子温泉**字新屋敷26**, tel 0229-83-3122, ¥3,000–3,999, billed as the shop with
  the most 山菜 in Naruko.
- **Their distance is understated, and I can see why.** Gnavi says 徒歩7分 and Tabelog says 10 minutes —
  both **from the STATION**, not from a hotel. From our door it is **0.76 km straight → ~12 min down,
  ~15 back up**. Their "0.6 km" is neither figure.
- **Closing day unresolved** → record is `medium`. Tabelog renders 定休日 as "not fixed"; Gnavi prints
  none; the source map said "irregular". 不定休 is the safe reading. **Phone before walking down.**

### 6. Kompa → **居酒屋 こんぱ · VERIFIED, and the best evening fit** · new `tnk-konpa`
Their claim: "charcoal yakitori, gyutan, basashi" — no hours, no coordinate at all.

- Found on the **association's own shop page**: 〒989-6822 大崎市鳴子温泉**字新屋敷120-1**,
  tel 0229-81-1778, **営業時間「18:00〜23:00」**, **定休日「日曜日・月曜日」**.
  Menu 「馬刺、牛タン、焼き鳥、ラーメン、一品料理」, eaten in front of a fireplace — **their food claim was
  accurate**, they simply had no hours.
- **This is the date-derivation case in miniature.** Closed Sundays and Mondays. On the source trip's
  own Sunday 16 and Monday 17 August it would have been **shut** — which is presumably why their map
  carries no hours for it. **Wed 9 Sep 2026 is a Wednesday: open, 18:00–23:00, covering the entire
  20:00–22:30 window with 30 minutes to spare either side.**
- Coordinate from `字新屋敷120番地` → 38.743282, 140.717728, **`approximate`** (banchi centroid).
  0.93 km → **15 min down, ~18 back up**.
- **The single best 20:00–22:30 answer of all nine candidates.**
- Source: https://www.welcome-naruko.jp/shop/こんぱ

### 7. Egao Shokudo → **ゑがほ食堂 · REJECTED for both windows** · new `tnk-egaho`
Their claim: "late ramen and gyoza" — no hours, no coordinate at all.

- **The name is why it looked unsearchable: ゑがほ食堂**, in pre-war kana (ゑ = we, read "e").
- **Wrong on both counts.** Association page: **営業時間「9:00〜15:00、17:00〜20:00（ラストオーダー19:30）」**,
  定休日 不定休. **Last order is 19:30 — thirty minutes before our window opens.** And it is a
  **soba-and-donburi 食堂**, not a ramen-and-gyoza joint: its own recommendations are
  「カツ丼、天丼、山菜きのこそば、冬季限定鍋焼きうどん」, with 「春は山菜、秋はきのこを採りたてのものを使用」.
  Both readings: **theirs "late ramen and gyoza" · actual "17:00–20:00, LO 19:30, katsudon and soba"**.
- **Fits neither window.** Shut before 20:00; opens 09:00, after the 08:30 coach.
- 〒989-6823 大崎市鳴子温泉字湯元2-4, tel 0229-83-3074. Coordinate is the 湯元2番地 block centroid
  (38.742847, 140.715912 — the same block as the station footbaths), so `approximate`.
- **Kept as a record rather than dropped**, per instruction, so nobody re-harvests it as a late option.

### 8. 鳴子峡レストハウス — **CORRECTED, and rejected for both windows** · new `tnk-narukokyo` + `tnk-narukokyo-sept`
Their claim: "Lookout always accessible", 3.8 km, needs a ride. "August is quiet green; the famous
colours are late October".

- **"Always accessible" is wrong.** Osaki City, official: the rest house runs
  「**令和8年4月28日（火曜日）から令和8年11月下旬まで**」, **「9時から16時まで」**, tel 0229-87-2050 —
  and the **遊歩道 sections carry the same 9:00–16:00**. The **見晴台 is the rest house's own terrace**
  (the prefecture files the spot as 「鳴子峡(レストハウス見晴台)」), so it closes with the building.
  Both readings: **theirs "lookout always accessible" · actual "rest house and trails 9:00–16:00,
  28 Apr–late Nov; only the car park is 終日"**.
- **What IS open round the clock:** the Nakayamadaira-side **car park**, 「4月中旬から11月下旬まで 終日」,
  **12 large-bus bays** plus 253 cars, 大型バス permitted. **And it is FREE in September** — the tariff
  (普通車500円 / 中型バス1,000円 / **大型バス1,500円** / 二輪200円) runs only **11 Oct – 24 Nov**.
  Their record gave no parking information at all; a coach fits and pays nothing on our date.
- **The trail is mostly shut by rockfall**, independent of season: only
  「中山平口から約350ⅿ、鳴子口から約230m」 are walkable, out-and-back.
- **Distance: their 3.8 km is right.** 3.75 km straight from our door (rest house at
  38.729013, 140.690887, building-level), **about 6 km by road, ~12 minutes** by coach or taxi.
  **Given a `{"mode":"bus","minutes":12}` leg, never a walk** — a 45-minute walk would have failed the
  30-minute rule, and there is no scheduled public bus. Taxi: **有限会社鳴子中央タクシー, 0120-224482**
  (字新屋敷87-3, 38.74475, 140.71775). The rail alternative — Naruko Onsen → 中山平温泉 one stop, then
  ~2.0 km straight / ~28 min on foot from the station at 38.72630, 140.66807 — is real but useless at
  dawn and brushes the walk cap; recorded here as prose, not as a leg.
- **September appearance, plainly:** 「例年10月中旬から11月中旬にかけては、赤や黄色の美しい紅葉に染まります」.
  On **10 September there is no colour at all** — peak is **five to nine weeks later**. It is a
  deep-green basalt gorge with the 大深沢 stream in it: handsome, and completely unlike every photograph
  used to sell it. Their "August is quiet green" was the one seasonal claim they got right; it holds for
  September too. Osaki adds 「気象状況により予告なく閉鎖する場合があります」 — and we are in peak typhoon month.
- **VERDICT: fits NEITHER window.** Shut at 20:00–22:30 (and an unlit mountain road); shut at
  06:00–07:30, since it opens at 09:00 — **half an hour after our coach leaves.**
- **The one way it works, and it is worth raising with the agent:** the gorge sits on **Route 47 heading
  west**, which is exactly the direction of Thursday's run to Ginzan Onsen. The car park is free and
  already open at any hour in September, so **a 15-minute photo stop needs nothing to be open**; departing
  08:45 instead of 08:30 would also put the group at the rest house door as it unlocks at 09:00.
  Filed as a note, not as a change — the itinerary is fixed.
- Sources: https://www.city.osaki.miyagi.jp/shisei/soshikikarasagasu/narukosogoushisho/chiikishinkoka/5/3/3087.html
  and https://www.city.osaki.miyagi.jp/kanko/sizen/4/6032.html

### 9. 温泉神社 Naruko Onsen Shrine — **ALREADY HAVE IT → correction emitted** · reuses `6391d4b9279e`
Their claim: "Grounds ~07:00–22:00", 1.2 km, on the hill above Taki no Yu.

Held twice, both retired at Kameya: `6391d4b9279e` (stairway) and `404b89bd0e46` (dawn duplicate).
**I corrected the stairway record and skipped the duplicate**, because their hours claim needs refuting:

- **"Grounds ~07:00–22:00" is unsourced precision.** **No official page, no operator page and no
  association page publishes any 参拝時間 for this shrine.** The grounds are ungated and free, so the
  *substance* of "open at all hours" is fine — but the specific bracket is invented, and the 22:00 end
  is the dangerous half. Both readings: **theirs "grounds ~07:00–22:00" · actual "no published hours;
  ungated and free; steep unlit stone stairway"**.
- **Verified 住所: 宮城県大崎市鳴子温泉湯元31-1**, and "on the hill above Taki no Yu" is right — the torii
  stands by 滝の湯 at the top of the 湯の街通り slope, then 急な階段. Reported as ~200 m south of the
  station; our held coordinate sits 250 m south of the station block, so it is building-level and
  consistent — **kept `verified`, not overwritten with the geocoder's 湯元 block centroid.**
  1.21 km from our door → **20 min**, before the steps.
- **Dawn yes, evening no.** Our own solar table: **10 Sep sunrise 05:15, civil dawn 04:48** — the
  06:00–07:30 window is in **full daylight**. Wednesday's **civil dusk is 18:20**, so 22:00 is more than
  three hours into full dark on an unlit stairway that the town itself signposts as hazardous in
  winter. Recommend the dawn slot only.
- 御朱印 is genuinely available (the association mentions it) but **only when the 社務所 is staffed** —
  a dawn visit gets the view, not the stamp. That inherited line survives the re-check.

---

## Shopping — one entry, and why only one

`tnk-sh-bathkit` — **a face towel plus a small body soap at the Lawson, about ¥600.** This is the one
genuinely buyable thing the research turned up that we do not already hold: 滝の湯 has no showers, no
taps and sells no soap or shampoo; on 9 Sep it is the only public bath open; and the 24-hour Lawson is
78 m from the hotel door. Marked `medium` — the store and its 24-hour operation are official, but no
per-store stock list or price is published, so the ¥600 is a konbini price band, not a quoted figure.

Naruko kokeshi (`n2kk-sh-kokeshi`, `0fcd6683028c`) and Fukase's kuri-dango (`n2kk-sh-kuridango`,
`27db6aa32d15`) are **already held at the right anchor** and were not re-emitted.

## Deliberate omissions

- **No `essentials` block.** `new-hotels.json` already carries a long, well-sourced essentials entry for
  the Kounkaku, including the ¥300 Miyagi accommodation tax and the kaiseki-vs-buffet conflict. Emitting
  a thinner second block keyed to the same stop risks the import overwriting the good one. Nothing I
  found this session changes it.
- **No `removedFromDay` manifest, and it is not an oversight.** Every record here is anchored to the
  live `Ooedo Onsen Monogatari Naruko Onsen Kounkaku`, including the four that reuse ids previously
  anchored to the superseded `Hotel Kameya, Naruko Onsen`. Re-anchoring is the point of those
  corrections. **The import session should note that `c6843df359bd`, `06cb9e37e31a` and `6391d4b9279e`
  arrive here with a NEW anchorStop and without `retired: true`** — they are being promoted out of
  "Removed from this Day" onto the live hotel, and `06cb9e37e31a` in particular reverses its advice.
- **No images**, per instruction.

## Could not verify

1. **Lawson's hours from Lawson itself.** Confirmed on Miyagi's official registry instead; the
   operator's own locator is technically unreachable from here (`SSL: DH_KEY_TOO_SMALL` / 404).
2. **旬菜呑処こけし's closing day.** Three sources, three different renderings; no operator page.
3. **Any opening hour for any of the four footbaths and the hand bath.** Nobody publishes one. Free is
   official; "always open" is not, and stays `medium`.
4. **滝の湯's pH 2.9.** No official analysis sheet found; left as inherited, not upgraded.
5. **Whether the Waseda Sajiki-yu closure gets extended past 10 Sep.** The notice itself warns it may
   「延長となる場合もございます」. It already covers both our dates, so this only matters if anyone hoped
   for a reprieve — they should not.

## Environment note for the next session

**`msearch.gsi.go.jp` is blocked at the egress policy for direct `curl` in this session** — the proxy
answers 403 to CONNECT and logs it as a policy denial (`curl -sS "$HTTPS_PROXY/__agentproxy/status"`
shows the rejections). `curl` to ordinary sites is blocked the same way. **Both WebFetch and WebSearch
reach everything fine, geocoder included**, so route geocoding through WebFetch, asking for the raw JSON.
Coordinates still come back `[LONGITUDE, LATITUDE]`.
