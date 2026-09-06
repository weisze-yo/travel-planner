# notes-expand-d34.md — Days 3–4, 30-minute walking radius

Batch: `expand-d34.json`, `"batch": "expand-d34-walk30"` — 46 new places, 2 new shopping items.
Scope: five anchor stops (`Ginzan Onsen Street`, `Zao Fox Village`, `Goshikinuma Ponds`,
`Tsuruga Castle (Tsurugajo)`, `Ouchi-juku`). Nothing in `day3-ginzan.json` or `day4-aizu.json` was
edited, re-verified or duplicated; the four retired hotel stops were not touched.

Real dates checked against: **Thu 10 Sep 2026** (day 3) and **Fri 11 Sep 2026** (day 4).

---

## 1. Findings that contradict or add to the existing research

### 1.1 Morohashi Museum of Modern Art is SHUT — and it is right at the Goshikinuma trailhead
諸橋近代美術館 (the Dali collection, 桧原字剣ヶ峰, next door to the Goshikinuma east entrance) is
**closed for renovation from 10 November 2025 until approximately April 2027**. It is therefore shut
on 11 September 2026. It is the most obvious wet-weather substitute at this stop and it is not
available. Filed as `d4w30gos03` with a blunt note so nobody walks over.
Source: <https://www.urabandai-inf.com/?page_id=25000>

### 1.2 Takimikan's soba restaurant is CLOSED THURSDAYS — day 3 is a Thursday
そば処 瀧見亭, the soba restaurant at 瀧見舘 above Ginzan, is **closed Thursdays** and opens at
**11:00**. The group is at Ginzan 09:30–11:30 on **Thursday 10 September**, so it is doubly
unusable: shut on the day, and it would open 30 minutes before the coach leaves. The walk up is
still worth it purely as the one place you look *down* on the ryokan rows. `d3w30gin13`.
Source: <https://www.onsen1.org/ginzanonsen/takimikan.html>

### 1.3 Two of Ginzan's three public baths are closed; only しろがね湯 works
- **しろがね湯** — open, Obanazawa City publishes 09:00–16:00, last entry 15:30, ¥500 / ¥200. Filed
  as `d3w30gin15`. Note: it is a small wooden bathhouse. 35 people cannot use it.
- **おもかげ湯** — Obanazawa City's own page says **現在休業中** (currently closed). Not filed.
- **かじか湯** — reported **closed since about 2022** by first-hand visitor accounts, which redirect
  people to しろがね湯. Not filed. Older guides still list it at ¥300, 08:00–20:00; expect
  disappointment if anyone goes looking.

Also note the two hour-sets in circulation for しろがね湯 (09:00–16:00 from the city, 08:00–17:00
from a travel aggregator). The city's figure is used.
Sources: <https://www.city.obanazawa.yamagata.jp/kanko/kankochi/1346>,
<https://4travel.jp/dm_shisetsu/11373974>

### 1.4 The Fukushima Prefectural Museum is 4 minutes from the coach bay, not "a little further out"
GSI puts 城東町1-25 at **37.488377, 139.933807** and 追手町4-47 (Tsurugajo Kaikan, the coach bay) at
**37.489838, 139.933334** — about **180 m apart**. The museum is effectively next to where the coach
parks, in the castle's Sannomaru. Open Fridays, ¥400 adult, **free for all school students**.
The existing `essentials` transport note for Tsurugajo does not mention it at all.

### 1.5 The Goshikinuma west end is a 7-minute *bus* hop, not a 4 km walk
The route bus links 五色沼入口 and 裏磐梯高原駅 in about **7 minutes, roughly hourly** — and the
group's own coach can do the same. That converts the unreachable half of the trail into short walks
from the west: 柳沼 3 min, 青沼 18, るり沼 21, 弁天沼 30. This is the concrete version of the advice
already in the existing `essentials` block ("drop at the WEST end"). Filed as
`d4w30gos04`–`d4w30gos08` with bus+walk legs.
Source: <https://www.jalan.net/news/article/699004/>

### 1.6 Ouchi-juku has one thing that outlives the 16:00 shop close
**大内宿町並み展示館** (the rebuilt honjin, mid-street) runs **09:00–16:30**, ¥250/¥150, group 30+
¥200/¥100, closed only 29 Dec–3 Jan. It is the only paid attraction still open in the back half of
the 14:40–16:40 slot. `d4w30ouc01`. Source: <https://shimogo.or.jp/?page_id=840>

### 1.7 高倉神社 is the *only* shrine at Ouchi-juku
Visitor accounts state this explicitly (「大内宿にある唯一の神社」). There is **no 湯殿神社** at
Ouchi-juku — if that name appears anywhere in the trip material it is wrong. The 見晴台 lookout and
子安観音堂 (both already in `day4-aizu.json`) are up the stone steps *east* of the street; Takakura
Shrine is a separate walk *west* across the paddies. Its 半夏まつり is **2 July**, not September.

---

## 2. Reachable on foot but NOT inside the stop's time budget

| Place | Anchor | Walk | Why it does not fit |
|---|---|---|---|
| 山ノ神神社 `d3w30gin11` | Ginzan, 2 h | 30 min | Obanazawa City's own course time is **1h40 for 4 km**, against a 2 h stop that also absorbs the 10-min shuttle each way. |
| 滝の不動尊 `d3w30gin10` | Ginzan, 2 h | 25 min | 25 up + 20 back = 45 min of the 120, on unpaved forest path, before any looking. |
| 儀賀市郎左衛門像 `d3w30gin09` | Ginzan, 2 h | 20 min | Just past the Ginko-do tunnel; the 2 km / 50 min loop is the realistic ceiling here. |
| そば処 瀧見亭 `d3w30gin13` | Ginzan, 2 h | 10 min | Opens **11:00**; coach leaves 11:30. And closed Thursdays. |
| 赤沼 `d4w30gos01` | Goshikinuma, **1 h** | 30 min | Out and back is **60 min of walking against a 60-min stop**. Nothing left. |
| 弁天沼 `d4w30gos07` | Goshikinuma, 1 h | bus 7 + 30 | Only works as the turnaround of a west-end walk, never as an addition to an east-end one. |
| 中瀬沼探勝台 `d4w30gos09` | Goshikinuma, 1 h | bus 5 + 15 | Round loop is ~45 min on top of the road leg. |
| 七日町通り `d4w30tsu11` | Tsurugajo, 1 h 30 | 24 min | 48 min of the 90 spent walking. A substitute for the castle, not an addition. |
| 阿弥陀寺・御三階 `d4w30tsu12` | Tsurugajo, 1 h 30 | 27 min | 54 min of the 90 spent walking. |
| 末廣酒造 嘉永蔵 `d4w30tsu09` | Tsurugajo, 1 h 30 | 19 min | 38 min return; only works if someone skips the keep entirely. |
| 福島県立博物館 `d4w30tsu01` | Tsurugajo, 1 h 30 | 4 min | The *walk* is trivial; the **galleries need 60–90 min**, which the slot does not have alongside the castle. Wet-weather plan only. |
| 石原屋 `d4w30ouc05` | Ouchi-juku, 2 h | 9 min | Kitchen shuts **15:30** — 50 min into the slot. |
| 大内宿食の館 `d4w30ouc07` | Ouchi-juku, 2 h | 6 min | Shuts **16:00**, same wall as the shops. First hour only. |

### Beyond the radius entirely — deliberately NOT filed as places
- **大内ダム (Ouchi Dam)** — published coordinate **37°20′34″N 139°52′20″E = 37.34278, 139.87222**
  (Dam Binran / Dam Mania). That is ~1.4 km straight line from the thatched street but **~140 m
  higher**, up a switchback road: realistically **2–3 km and 35–50 minutes each way on foot**, so it
  breaks the 30-minute cap and would eat the whole 2 h slot. The dam crest does give a full view of
  the village and there is a ~1-hour path round the reservoir. Worth raising with the tour agent as
  a *coach* detour (about 6 minutes' drive), not as a walk. Source:
  <https://dammania.net/fukusima/oouti.html>
- **みどろ沼 (Midoro-numa)** — 33 min from the east trailhead (5 + 25 + 3) and ~33 from the west.
  Over the cap from both ends, which is why the filed pond set jumps from 赤沼 to 弁天沼.
- **会津武家屋敷** and **飯盛山** — roughly 2.5 km and 2.8 km from the Tsurugajo coach bay, i.e.
  32–40 minutes each way. Over the cap and far over the slot.
- **弥治郎こけし村** — see §3, filed with a *bus* leg only.

---

## 3. Zao Fox Village: there is genuinely nothing within 30 minutes on foot

This is the honest answer, not a thin one. The village sits at about 590 m in 白石市福岡八宮字川原子,
in working farmland. Checks made:

- Shiroishi City's own tourism listings and the venue's neighbour listings turn up **no shop, cafe,
  restaurant, shrine, temple, waterfall or viewpoint** within a 2.4 km radius.
- Visitor accounts describe it as "forest in the middle of nowhere", "no other facilities nearby",
  and note a **neighbouring pig farm** (which accounts for the smell reviewers mention). The
  approach is an unlit mountain road with no pavement.
- **八宮神社** — searched for on the strength of the district name 八宮. Nothing near the village
  surfaced. Not filed rather than guessed at.
- **川原子ダム** — real, and in the same 川原子 district (Shiroishi City lists it as a 1969
  agricultural irrigation facility at 白石市福岡字八宮). **Not filed: no publishable coordinate and
  no confirmed distance from the fox village were obtainable.** Shiroishi City's page gives neither,
  the Mapion/NAVITIME POI pages return 403, and the one Miyagi-tourism page for it is served in
  broken encoding. If someone wants this, it needs a map check, not another web search.
  Source: <https://shiroishi.ne.jp/location/2562>
- The only filed record is **弥治郎こけし村** `d3w30zao01`, and it is filed with a **bus leg, not a
  walk**: GSI puts 弥治郎 at 38.02763, 140.575333 against the village's 38.0408, 140.5304 — about
  **4.2 km straight line, 6–7 km by road, 50+ minutes on foot**. Free entry, ¥850 paint-your-own,
  09:00–17:00 April–October, **closed Wednesdays so Thursday 10 Sep is open**.

One consequence for the real 80-minute stop (15:10 arrival, 16:00 last admission, 16:30 gate): there
is nowhere to wait, shelter, or buy anything outside the gate. Everything the group needs is inside
it or on the coach.

---

## 4. Unverifiable / weak, and flagged as such in the records

- **All 17 Ginzan records carry approximate coordinates.** GSI resolves 山形県尾花沢市銀山新畑 only
  to a **district centroid at 38.577953, 140.547714 — about 1.5 km from the onsen street**. No
  building-level fix was obtainable for any Ginzan feature. Every record therefore reuses one of two
  verified points already in `day3-ginzan.json`: the **street entrance** (38.57004167, 140.530925)
  for anything on the street, and **Shirogane Falls** (38.572292, 140.532444) for anything in
  Shirogane Park, with the offset stated in `confidenceNote`. This matches the convention the
  existing batch already used for 銀鉱洞 and others.
- **Ginzan walk minutes in Shirogane Park are derived, not measured.** They come from Obanazawa
  City's four published course lengths (0.8 km / 20 min, 2 km / 50 min, 4 km / 1h40) apportioned by
  each feature's position in the published spot order. Stated in every `confidenceNote`.
- **こうもり穴 closure** (`d3w30gin12`) is from a 2024 first-hand walk-through ("現在通行止め"), not
  from Obanazawa City, which does not list the feature at all. Filed as a warning, medium confidence.
- **磐梯山噴火記念館 closing days are 不定休** — irregular, not a weekday. The Friday opening
  **cannot be confirmed from any published calendar**. Telephone 0241-32-2888 before relying on it.
  Hours 08:00–17:00 April–November, ¥600 museum / ¥800 3D World.
- **Goshikinuma west-end records carry NO coordinates at all** (`d4w30gos04`–`d4w30gos09`). GSI
  resolves 北塩原村桧原 only to **37.691696, 140.084763 — about 4 km north** of the ponds, and the
  east-trailhead points already in the batch would be 3–4 km wrong for a west-end pond. Omitting the
  field was judged better than filing a knowingly wrong point.
- **中瀬沼 bus leg is an estimate.** 裏磐梯サイトステーション is at 桧原小野川原1092-65, a different
  字 from the Goshikinuma entrance's 剣ヶ峰; no published road distance or bus time between them was
  found. The 15-minute walk to the deck and the 45-minute loop *are* published.
- **石原屋's coordinate** (37.33464873, 139.861212358) is published by a commercial travel database,
  not by the shop or Shimogo Town, and is quoted to ~1 mm of precision it cannot possibly support.
  Filed as approximate. Its closing days are 不定休, so 11 September cannot be confirmed.
- **大和屋** (`d4w30ouc06`) publishes **no hours, no closing day and no price** anywhere reachable.
  Dishes and address (大内字山本6) are from visitor reports; the village default 09:00–~16:00 stands
  in. The tochi-daifuku shopping item therefore carries `estimate: null`.
- **大内宿食の館** (`d4w30ouc07`) — the 大内1053 street number sits outside the preserved 字山本 /
  字宮ノ前 blocks, so it is on the approach rather than among the thatched houses, but its exact
  position and therefore the 6-minute leg are not confirmed.
- **高倉神社 / paddy-lane coordinates** use the GSI centroid for 下郷町大内 (**37.334476,
  139.857742**), which does fall in the paddy flat west of the street on the shrine approach. The
  honden itself is further west and uphill. GSI would not resolve 大内字宮ノ前 any finer — the
  documented rural-字 failure mode.
- **Mid-September rice at Ouchi-juku** (`d4w30ouc04`) is general Aizu harvest timing, not a dated
  2026 field report. **No soba-flower field at Ouchi-juku could be confirmed** — searched and not
  found, so it is not claimed.
- **鶴ヶ城 park monuments** (稲荷神社, 荒城の月碑, 北出丸, 内堀一周) reuse the verified Honmaru
  south-east corner as their point; the inner-moat circuit length (~2 km) is derived from the
  published 18.7 ha park footprint, not from an official route map.
- **甲賀町口門跡's coordinate** (37.496272, 139.931876) comes from a walking-route site, not the city.
- **宮泉銘醸** — address GSI-verified to the building, but tasting-room hours and whether a 35-person
  group can turn up unannounced were not confirmed from the brewery's own page.

## 5. Seasonality restated for these five stops

- **Ginzan on 10 Sep is a wall of deep green**, dark timber and grey-green river. No snow, no autumn
  colour, no illumination. 長者の池's hydrangeas are a June–July draw and will be over.
  夏しらず坑 — the adit that vents cold air all summer — is the most useful thing above the street on
  a hot, humid September morning.
- **Goshikinuma on 11 Sep**: the draw is **mineral pond colour, not foliage**. No autumn colour.
  Trail is rocky in places and muddy after rain, and Urabandai is **black bear habitat**; the
  visitor centre says so on its own trail page.
- **Ouchi-juku on 11 Sep**: green thatch, ripening rice, no snow lanterns, no autumn colour.
- Peak typhoon month throughout. The `d3w30gin14` 銀山荘 record is filed partly as the shelter and
  toilet point if a downpour catches the group between the street and the Taisho Roman-kan coach lot.

## 6. Environment notes for the next session

- `msearch.gsi.go.jp` is **403 at the egress proxy for curl and Python** (`connect_rejected`,
  policy denial). It works fine through **WebFetch** — ask for the raw JSON verbatim. Remember
  `coordinates: [LONGITUDE, LATITUDE]`.
- GSI resolves **urban Aizu-Wakamatsu addresses to the building** (城東町1-25, 追手町4-47, 花春町8-1,
  東栄町8-7, 日新町12-38, 七日町4-20 all returned exact points). It resolves **rural 字 addresses only
  to a district or village centroid** — 銀山新畑 1.5 km off, 桧原 4 km off, 大内 to a centroid,
  弥治郎 to the wrong sub-district. The warnings in the brief hold.
- Newly robots-blocked or erroring this session: `dali.jp` (robots), `chikuhobby.com` (robots),
  `www.navitime.co.jp/poi` (403), `jalan.net/news/article/872365` (redirect loop),
  `fukutabi.net` and `watarubuu.at-ninja.jp` (broken character encoding — unreadable).
