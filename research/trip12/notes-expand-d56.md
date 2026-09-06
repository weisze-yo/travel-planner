# notes — expand-d56-walk30 (Days 5–6, walking radius pushed to 30 minutes)

Batch: `expand-d56.json`, **56 new places** across the eight Day 5 / Day 6 anchor stops.
Nothing in `day5-nikko.json` or `day6-hitachi.json` was rewritten. Real dates checked:
**Sat 12 Sep 2026** (Day 5) and **Sun 13 Sep 2026** (Day 6).

Method: walk minutes are straight-line distance × 1.30 for street routing ÷ 80 m/min, the same
factor the earlier batches used, measured from the anchor point named under each heading below.
Coordinates come from the GSI address-search endpoint — its **facility layer** (`dataSource`)
turned out to hold real POI points, not just address blocks, which is where most of the
`verified` coordinates here come from.

---

## 1. THE BIG ONE — Toshogu measured from the Nishi-sando coach park

Because coach parking at 東照宮大駐車場 is banned at weekends and 12 Sep is a Saturday, the
radius was measured from **市営西参道第2・3駐車場, 安川町2-47 (36.753441, 139.599228)** — the
coordinate already verified in `day5-nikko.json` record `d5t01nishisando`.

That moves the centre of the circle ~600 m south-west of the shrine, and it changes the
reachable set more than anything else in this batch:

| From the Nishi-sando coach park | walk | comment |
|---|---|---|
| **Rinnoji Sanbutsudo** (山内2300) | **4 min** | Closer than Toshogu's own Omotemon. Opens **08:00**, an hour before the shrine. |
| **日光珈琲 西参道** (安川町10-20) | **4 min** | The coach park is in 安川町; the bus stop outside is literally 西参道茶屋. |
| Shinkyo bridge | 7 min | |
| Hongu Shrine | 8 min | |
| Yomeimon | 8 min | |
| Nikko Kanaya Hotel | 9 min | |
| Toshogu honden | 11 min | |
| **Tamozawa Imperial Villa** (本町8-27) | **12 min** | 25+ min from the shrine's own lot. The single biggest gain. |
| Taiyuin | 13 min | Straight up the Nishi-sando. |
| Futarasan main shrine | 15 min | |
| **Kanmangafuchi / Narabi-jizo** | 22 min | Nikko City's own access line is "get off at **安川町**, walk about 20 min". |
| Takinoo Shrine | 24 min | |
| Tobu Nikko Station | **31 min — OUTSIDE** | So none of the station-front shops are in range on Saturday. |

**What the Nishi-sando park buys you:** the whole WEST side of Nikko — Tamozawa, Kanmangafuchi,
Taiyuin, the Nishi-sando cafés — which is effectively unreachable from the main lot. **What it
costs you:** nothing on the east side; Shinkyo and Kanaya are *closer* from here, not further.

### Contradiction with the existing batch (not rewritten)
`day5-nikko.json` gives **Shinkyo `walk15`** (`d5t02shinkyo`) and **Kanaya Hotel `walk20`**
(`b88e838c31d0`). From the Nishi-sando coordinate in that same file they are **7** and **9**
minutes. The shrine-interior legs in that file *do* reconcile with a Nishi-sando anchor
(Sanzaru 6 vs 7.9 measured, Yomeimon 8 vs 8.4, Nemuri-neko 12 vs 10.3), so those two eastern
records look as though they were measured from inside the shrine precinct instead. Left as
found — but the Saturday reachable set is materially wider than 15/20 imply.

---

## 2. EDO WONDERLAND — what the lost 30 minutes actually costs

Revised: **14:00 arrival, 2 h (was 2 h 30), depart 16:00 (was 16:30).**

- Last entry is **16:00**, so the group now leaves at the exact minute the gate stops admitting.
  There is no longer any slack at the end of the stop.
- With a realistic 15-minute regroup at the Sekisho, the usable time inside a **49.5 ha** park
  drops from ~2 h 15 to **~1 h 45**.
- Concretely: the park runs four theatres (Wikipedia says seven). At 2 h 30 you could take two
  shows plus one walkthrough. At 2 h you get **one theatre + one attraction + Nihonbashi**, and
  that is the ceiling. The 花魁道中 street procession and a booked 江戸職業体験 are now
  **mutually exclusive** with a second show — the timetable will not carry both.
- The choice inside the batch is therefore an either/or, not a list: **地獄寺 OR the Ninja Trick
  Maze** (already in the existing batch), not both. Queues at both peak 14:00–15:00, which is
  precisely the group's window.
- It is a **paid enclosure**, so almost the whole radius is inside the fence. Outside the gate,
  within 30 minutes on foot, there is *nothing but car parks and two rail stations*:
  **小佐越駅 20 min** and **東武ワールドスクウェア駅 30 min**. Tobu World Square is a 90-minute
  attraction sitting right on the 30-minute boundary — reachable on paper, unusable in fact.
- **Group tariff still favours the afternoon pass**: a 14:00 arrival lands on the 団体 afternoon
  通行手形 at ¥4,400 (from 8 people). The shorter stop does not change that.

### Contradiction
The existing `essentials` for Edo Wonderland print the individual gate price as
"¥5,800 and **¥5,000**" (adult / child). Tochigi's official tourism listing prints
**adult ¥5,800, child ¥3,000, senior 65+ ¥4,700**. The ¥5,000 child figure looks wrong.
Address on the same listing: 〒321-2524 栃木県日光市柄倉470-2.

---

## 3. Reachable on foot, but NOT inside the stop's real time budget

| Stop (budget) | Place | walk | why it does not fit |
|---|---|---|---|
| Kegon Falls (1 h) | Chuzen-ji Tachiki Kannon | 22 | 44 min walking of a 60-min stop |
| Kegon Falls | Futarasan Chugushi | 22 | same |
| Kegon Falls | Utagahama promenade | 19 | 38 min walking, before the lift queue |
| Kegon Falls | British Embassy Villa | **30** | on the limit; 60 min round trip |
| Toshogu (1 h 15) | Tamozawa Imperial Villa | 12 | 50 min inside + 24 min walking + the 20-min Nishi-sando round trip |
| Toshogu | Takinoo Shrine | 24 | 48 min walking alone |
| Toshogu | Kanmangafuchi | 22 | 44 min walking alone |
| Toshogu | Taiyuin | 13 | fits only as a **substitute** for Toshogu, never as an addition |
| Edo Wonderland (2 h) | Tobu World Square | 30 | 90-min attraction, and the group is inside another paid park |
| Edo Wonderland | Kosagoe Station | 20 | only value is as a missed-coach fallback |
| Tsukuba (18:00→08:30) | JAXA Space Dome | 28 | opens 10:00, closes 17:00 — never open in the group's window |
| Tsukuba | LALAgarden | 19 | works on the arrival evening only |
| Hitachi (1 h) | Miharashi Hill summit | 17 (existing) | 34 min walking of a 60-min stop |
| Hitachi | Miharashi no Sato | 15 | as above |
| Kawagoe (1 h) | Kita-in + Gohyaku Rakan | 13 | 45 min inside + 26 min walking |
| Kawagoe | Crea Mall | 21 | 42 min walking of a 60-min stop |
| Kawagoe | Kawagoe Hachimangu | 25 | 50 min walking |
| Shibuya (1 h) | @cosme TOKYO, Harajuku | 21 | 42 min walking |
| Shibuya | SHIBUYA SKY | 4 | timed ticket + 60 min inside; **not on this itinerary — Tokyo Tower is the Day 7 tower** |
| Shinjuku (18:30→08:30) | **Shinjuku Gyoen** | 14 | opens 09:00, last entry well before 18:30, coach 08:30 → **unreachable, full stop** |
| Shinjuku | Shinjuku Central Park | 27 | 54 min round trip; dawn walk only |
| Shinjuku | Isetan / BEAMS JAPAN / Takashimaya | 10–21 | all shut ~20:00 → arrival evening only |

**Timed-out by opening hours rather than distance** (kept in the batch so nobody plans them):
Shinjuku Gyoen, JAXA Tsukuba Space Center, the Nonbei Yokocho bars (they open 17:00–18:00, and
the group is at the crossing 15:30–16:30, so the lane is shuttered).

---

## 4. Reachable on foot? NO — outside the 30-minute radius

- **Ryuzu Falls (竜頭滝)** — GSI facility point 36.758846, 139.451297. **5.0 km / ~80 min** on
  foot from the Kegon coach lot. Firmly outside. Reachable only by the Tobu bus toward Yumoto
  Onsen. No place record: the bus journey time could not be verified at source
  (`nikko-kankou.org/spot/6` refused the fetcher).
- **Italian Embassy Villa Memorial Park** — its own site gives "歌ヶ浜駐車場から徒歩約15分", and
  Utagahama is 19 min from the coach lot, so **~34 min** on foot. Recorded instead with a
  `walk 10 + bus 5 + walk 10` leg, which is the operator's own routing.
- **Matsumi Park, Tsukuba** — two conflicting coordinates. GSI's **facility** point
  (36.091658, 140.107530) puts it **19 min** from the hotel; the **street-block** centroid for
  天久保四丁目2番 (36.104794, 140.109543) puts it at **40 min**. The facility point matches the
  commonly published "~1.5 km from Tsukuba Station", so that is what the record uses. Flagging
  it because the two differ by 1.5 km.
- **Doho Park (洞峰公園), Tsukuba** — 二の宮2-20 → 36.059723, 140.121521, **~41 min**. Out.
- **Anything outside the Hitachi West Gate** — the West Gate faces only the park's own 2,000-space
  car park and the Hitachinaka toll road. Ajigaura beach and Ajigaura Station are both well over
  30 minutes; Nakaminato fish market is 8 km. The West Gate radius is *entirely inside the park*.
- **あんよの湯 footbath** — I planned to add this at Chuzenji and it is **not there**: Nikko City's
  own page places it in **奥日光湯元温泉**, ~11 km up the valley. Dropped. Flagged so nobody
  re-adds it on the strength of a search result.

---

## 5. Seasonality — mid-September, and three more April traps

Sat 12 Sep ref 30°/25°, Sun 13 Sep ref 30°/24°, peak typhoon month, **no autumn colour anywhere**:

- **Nikko Sannai** (Rinnoji's Shoyoen, Toshogu, Taiyuin) turns **late October**.
- **Oku-Nikko** (Kegon, Chuzenji lakeshore, Ryuzu) turns **mid-to-late October** — and it turns
  *before* the town does, which is the opposite of what most people assume. On 12 September the
  lake, the falls basin and the Utagahama view are solid green.
- **Kanmangafuchi** is a maple gorge; green in September, and **leeches after rain**.
- **Hitachi Seaside Park** — the existing batch already killed the app's "nemophila fields" line.
  Three *more* named West Gate gardens are spring features: **たまごの森フラワーガーデン is
  mid-APRIL tulips**, **スイセンガーデン is daffodils**, and the pampas grass is just past its
  late-Aug/early-Sep peak. Cosmos do not start until October. What is actually there on 13 Sep is
  **green kochia** on Miharashi Hill and buckwheat/zinnia in Miharashi no Sato.
- **Kawagoe** — the Kawagoe Festival is **17–18 Oct 2026**, so the floats are indoors at the
  Matsuri Kaikan, not on the street.

## 6. Weekend crowding — this changes the advice, not just the mood

- **Toshogu, Sat 12 Sep** — the reason the coach is at Nishi-sando at all. Yomeimon is
  shoulder-to-shoulder. The batch's counter-move is deliberate: **Rinnoji (4 min, opens 08:00)**,
  **Hongu Shrine (8 min, unstaffed and usually empty)**, **Futarasan (15 min)** and
  **Takinoo (24 min)** are all World-Heritage-core and none of them queue like Toshogu.
- **Kawagoe, Sun 13 Sep** — Ichibangai is at its worst on a Sunday afternoon. **Hikawa Shrine
  (6 min)** and **Honmaru Goten (8 min, closed Mondays so open on the 13th)** are both closer to
  the coach bay than Toki no Kane and carry a fraction of the crowd. Both **city museums are also
  closed Mondays**, so Sunday is the good day for them.
- **Shibuya, Sun 13 Sep 15:30** — peak scramble. Shibuya PARCO's Nintendo TOKYO runs on
  **numbered entry tickets** that can be gone by early afternoon on a Sunday, and SHIBUYA SKY
  sells out. **Shibuya Stream (5 min)** drains the crowd almost completely and is the batch's
  answer for anyone who wants to sit down.

---

## 7. Unverifiable / low-confidence, and why

**Blocked or broken this session** (each retried once):

- `edowonderland.net` — **the whole domain**, not just `/schedule/`: `/`, `/en/attractions/` and
  `/sitemap/` all refused (robots.txt fetch failure / disallow). Every Edo Wonderland in-park
  record is therefore **medium** confidence, sourced from Tochigi's prefectural listing plus
  English Wikipedia. Names confirmed that way: 若松屋, 江戸生活文化伝承館, 大江戸天満宮前 口入屋,
  地獄寺, archery/shuriken dojo.
- `nikko-kankou.org` — **intermittent**: `/spot/137` fetched fine, but `/spot/45`, `/spot/6`,
  `/spot/16`, `/spot/602` and `/spot/` all failed with a robots.txt ConnectTimeout.
- `hitachikaihin.jp/guide/map.html` — **404**. `hitachikaihin.jp/pleasure/` — redirect loop.
  The park publishes **no coordinates and no inter-area walking times** for its facilities, only
  "nearest gate" and Seaside Train stop numbers. So **all seven Hitachi records carry no
  coordinate** and their legs are scaled off the verified West Gate times already in
  `day6-hitachi.json` (Lakeside Cafe 2, Kinen no Mori 8, Ferris wheel 8, Miharashi summit 17,
  Glass House train 15 + walk 5).
- `shibuya-scramble-square.com` — TLS/robots failure on both paths tried, so **no SHIBUYA SKY
  price is quoted**.
- `kitain.net/hakan/` — robots-disallowed, so Kita-in's current fee and closure days are unread.
- `hikawa-jinja.net` — **does not resolve**; the live domain is `kawagoehikawa.jp`.
- `chuzenjiko-cruise.com` — robots.txt SSL failure; cruise hours taken from Tochigi's listing.

**Specific facts I chose NOT to state because I could not confirm them:**

- **Kawagoe Hikawa Shrine's 縁結び玉** — the widely repeated "20 a day, from 08:00" is not on the
  shrine's own site. Deliberately omitted from the record.
- **Senba Toshogu's opening days** — several third-party pages say the inner precinct is open
  **Sundays only**, which would matter enormously on 13 Sep. Kita-in's own page covers the
  history only. Recorded as **unknown**, not as a Sunday opening.
- **Tamozawa Imperial Villa admission** — the operator (`park-tochigi.com`) prints
  **¥510 / ¥410 for 20+**; `tochigiji.or.jp` prints **¥600 / ¥500**. The record uses the
  operator's figure and the discrepancy is logged here.
- **Rinnoji's own admission page has a typo**: "11月〜3月 午前8時(開門)〜**午前**4時(閉門)".
  It plainly means 午後4時. Verified figures taken from the same page: 三仏堂 ¥400 / ¥360 group,
  大猷院 ¥550 / ¥495, 宝物殿・逍遥園 ¥300 / ¥270, 輪王寺券 ¥900 / ¥810 — **団体 is 35名以上**,
  the same threshold as Toshogu, so a coach of 34 pays full price at both.

**Coordinate quality in this batch:** 39 `verified`, 3 `approximate`, **14 with no coordinate at
all** rather than a guessed one.

Two systematic GSI limits worth recording for the next session:

1. **Kabukicho has no per-building geocoding.** Every 歌舞伎町 street address — 1-29-1, 1-16-5,
   2-43 — returns the single district centroid 35.695393, 139.701294. That is why the Okubo Park
   record was dropped from the batch (see §8) and why no Kabukicho Tower record was added.
2. **Rural Nikko resolves only to 字 centroids.** 日光市中宮祠2578 returns 36.766666, 139.430939 —
   about **1.3 km** from anywhere in Chuzenji Onsen. Useless. The *facility* layer is what saves
   it: 二荒山神社中宮祠, 歌ヶ浜, 立木観音, 竜頭滝, 輪王寺, 東照宮, 神橋, 日光江戸村, 小佐越駅,
   松見公園, 筑波宇宙センター and 喜多院 all returned real POI points.

---

## 8. Found, researched, then dropped from the batch

Kept out to hold the file near the 35–50 target. All are real and in-radius; re-add if wanted.

| Place | Stop | walk | why dropped |
|---|---|---|---|
| Nikko Natural Science Museum (日光自然博物館) | Kegon | 3 | under the 8-min band; shares the coach-lot address block, no separate coordinate. Good typhoon fallback. |
| Rinnoji Treasure Hall & Shoyoen (宝物殿・逍遥園) | Toshogu | 4 | under band; ¥300/¥270, 20–30 min. Its draw is late-October maple. |
| 日光珈琲 御用邸通 (本町3-13) | Toshogu | 6 | under band and a near-duplicate of the Nishi-sando branch. Closed Mon + 1st/3rd Tue, so open 12 Sep. Coordinate verified 36.753128, 139.595337. |
| **日光東照宮美術館** | Toshogu | 13 | no coordinate. **A different building from the 宝物館 already in `day5-nikko.json`** — separate ~¥800 ticket, Taikan/Gakuryo painted doors. |
| 大江戸天満宮前 口入屋 (job-experience desk) | Edo Wonderland | 9 | a booking desk, and the 2 h stop makes a booked experience unrealistic anyway. |
| ローソン つくば駅バスターミナル店 (24 h) | Tsukuba | 3 | near-duplicate of the FamilyMart already listed; genuinely 24 h, in BiVi. |
| 茨城県つくば美術館 (吾妻2-8) | Tsukuba | 4 | 09:30–17:00, closed Mon → a 4-minute walk to a locked door on this schedule. |
| つくばカピオ (竹園1-10-1) | Tsukuba | 8 | nothing to buy; only value was as a marker on the pedestrian-deck loop. |
| 大草原フラワーガーデン・大草原 | Hitachi | train 10 + 5 | weakest of the far-park areas in September. |
| 蓮馨寺・おびんずるさま (連雀町7-1) | Kawagoe | 12 | free and pleasant, but minor next to Kita-in. |
| 成田山川越別院 本行院 (久保町9-2) | Kawagoe | 11 | flea market is the 28th, not the 13th. |
| スターバックス 川越鐘つき通り店 (幸町15-18) | Kawagoe | 4 | under band, but **the only reliable air-con, toilets and seating on Ichibangai** on a hot Sunday. Strongest candidate for re-adding. |
| 川越 中市本店 — ねこまんま焼きおにぎり (幸町5-2) | Kawagoe | 6 | under band. The one Kawagoe snack that is not sweet-potato. |
| SHIBUYA109 (道玄坂2-29-1) | Shibuya | 3 | under band; Center-gai covers the same need. |
| **渋谷PARCO — Nintendo TOKYO / Pokémon Center** | Shibuya | 6 | under band, but high draw. Sunday numbered-entry tickets can be gone by early afternoon. |
| 代々木公園 (代々木神園町2-1) | Shibuya | 20 | 40 min round trip kills the 60-min stop; green and humid in September. |
| ニュウマン新宿・バスタ新宿 (新宿4-1-6) | Shinjuku | 15 | useful mainly as an independent-travel fallback. |
| **大久保公園 (歌舞伎町2-43)** | Shinjuku | 4 | dropped for lack of any coordinate — **but keep the warning**: its perimeter is a known night-time solicitation and touting spot, 4 minutes from the hotel door. A visiting group standing there after dark will be approached. Daytime, event-days only. |

## 9. Shopping

No `shopping` array. Nothing in the 8–30 minute band turned up a *named product* that is not
already covered by the 49 existing shopping records — the closest were **Saza Coffee's Tokugawa
Shogun blend** (whole beans, BiVi Tsukuba, to 19:00) and **BEAMS JAPAN Shinjuku's** prefectural
craft floors, and both are described inside their `places` records rather than invented as
product lines I could not price at source.
