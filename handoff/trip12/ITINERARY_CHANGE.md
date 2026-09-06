# ITINERARY_CHANGE.md — the 4 September 2026 revision

**Source:** eight screenshots of the ViTrox company app's Day-by-Day Itinerary, taken by the user at
19:16–19:18 on 4 Sep 2026. These supersede `trip12_app_extract.md` (21 Aug 2026) wherever they
disagree. The source hierarchy is unchanged: **the app is authoritative.**

**Nothing was deleted.** Every record for a superseded stop is kept, flagged `"retired": true`, and
declared in a `removedFromDay` manifest so the deploy session files it under
**"Removed from this Day"** with all its detail still viewable.

---

## 1. Four of the seven hotels changed

| Night | Was (21 Aug) | Is now (4 Sep) | What it means |
|---|---|---|---|
| 1 | Hotel Metropolitan Haneda | **Hotel Metropolitan Tokyo Haneda** | **Rename, not a change.** HOTEL METROPOLITAN TOKYO HANEDA is JR East's official English name, same Haneda Innovation City Zone A address, phone unchanged. Renamed in place; day 1's research stands. Its official site has moved to `haneda.hotel-metropolitan.com`. |
| 2 | Hotel Kameya, Naruko Onsen | **Ooedo Onsen Monogatari Naruko Onsen Kounkaku** | Different property, **same town**. The Naruko town research transfers unchanged — both hotels are in 字車湯 and geocode to the same point. Only the on-property records are retired. |
| 3 | Okuiizaka Anabara Onsen Yoshikawaya | **Mercure Miyagi Zao Resort & Spa** | **Moved prefecture** — Iizaka Onsen, Fukushima → Zao, Miyagi. The biggest research loss of the revision. |
| 4 | Ooedo Onsen Monogatari Premium Kinugawa Kanko Hotel | **Kinugawa Onsen Hana no Yado Matsuya** | Different property, **same town**. The Kinugawa town research transfers. But Mission 2 and the whole buffet-sitting analysis were this operator's — both void, both re-solved below. |
| 5–7 | Hotel Nikko Tsukuba · Shinjuku Granbell · International Resort Hotel Yurakujo | unchanged | — |

### Night 3 is the expensive one
The coach transfer after Zao Fox Village drops from **~1 h 5 m / ~45 km to ~30 min / ~18 km** and
check-in moves **17:45 → 17:15** — the new hotel is minutes from the Fox Village. In exchange, Day 4
starts earlier: **breakfast 07:00 (was 07:30), departure 08:00 (was 08:30)**, against a **~2 h /
~130 km** run to Goshikinuma (was ~1 h 30 m / ~68 km).

**The whole Iizaka Onsen cluster is now off-itinerary** — Sabako-yu, Totsuna-bashi, Gyoza no Terui,
Aberu Shoten's radium eggs, Tennoji Anabara-yu, Kyu-Horikiri-tei, Harai-yu. All kept and viewable.

### The app's own Day 3 text was not updated
Header still reads *"Miyagi → Zao → Fukushima"* and the summary *"ending overnight in Fukushima's
Iizaka Onsen"* — but the printed hotel is in **Miyagi**. The app now contradicts itself. Worth
telling People & Culture.

---

## 2. Timing changes

| Day | Change |
|---|---|
| 3 | Transfer after Zao **~1 h 5 m / ~45 km → ~30 min / ~18 km**; check-in **17:45 → 17:15** |
| 4 | Breakfast **07:30 → 07:00**; departure **08:30 → 08:00**; transfer to Goshikinuma **~1 h 30 m / ~68 km → ~2 h / ~130 km** |
| 5 | **Edo Wonderland 2 h 30 → 2 h**; departure **16:30 → 16:00**; dinner **17:15 → 16:45**; check-in **18:30 → 18:00** |
| all | Reference temperatures all revised. Day 8 drops from 32°/25° to 26°/22°; Day 3 from 29°/23° to 24°/20° |

**Edo Wonderland is the one that costs something.** Last entry is still 16:00 so admission is fine,
but with a 15-minute Sekisho regroup the usable time in a 49.5 ha park falls to about **1 h 45**, and
the roughly **15:50 last theatre start now begins after the coach leaves.** The sub-route deadline
was moved 990 → 960 minutes and the affected steps flagged `droppedByRevision`.

---

## 3. Two problems the revision created, and their answers

### Mission 2 was homeless — it is now in better shape
The app pins the yukata group photo to *"Ooedo Onsen Monogatari Premium Kinugawa Kanko Hotel — Hotel
Lobby, dinner time, hotel-provided yukata"*: **a hotel no longer on the itinerary.**

**Hana no Yado Matsuya puts 大人浴衣 in the room.** The front-desk rack that was the Day 4 bottleneck
is gone. There is also a paid 45-set 浴衣レンタル at ¥3,300 if matching colours are wanted (~¥115,500
for 35). The lounge **花かんざし is on the 5th floor** — the hotel is built down the slope, so you
enter at the top — with Takehisa Yumeji paintings and a glass wall onto the Kinugawa gorge.

**Standing position:** along the gorge glass, group facing **into** the room, so the black window is
behind the camera rather than behind 35 faces. **Open risk:** 47 rooms against the old hotel's 172,
and no published lounge or banquet capacity. Agree the room at check-in, with the 4F dining floor as
the named fallback.

### The Day 4 "Hotel Buffet" is not a buffet
Matsuya serves **和食会席 plated to the table, in private rooms on 4F** — five channels agree and no
buffet appears anywhere in its material. Sittings are **chosen, not assigned: 18:00 / 18:30 / 19:00,
last seating 19:00.** So the six-sitting problem is void.

**Take the 19:00 sitting.** Ten minutes for 35 people into yukata is still not achievable, and a
kaiseki that has started cannot be drifted into — but kaiseki suits a group better than a buffet,
since everyone is seated and served at once.

---

## 4. New conflicts the revision introduced

1. **Hana no Yado Matsuya's latest check-in is 18:00 on two of four channels** — Furunavi and Rakuten
   say 18:00, Yukoyuko 18:30, Yahoo 19:00, OZmall 22:00 — against an **18:20 arrival**. Its own
   domain `matsuya.co.jp` is denied by the egress proxy, so nothing could be confirmed from the
   operator. **Phone from the road on the 11th.**
2. **Mercure Miyagi Zao publishes no latest check-in at all**, and its breakfast opens **exactly
   07:00** for the 08:00 coach — the tightest fit of the eight days. It works, with nothing spare.
   The itinerary calls dinner "Kaiseki"; the hotel's Locavore is a **268-seat buffet, 17:30–21:00**,
   with reviewer reports of peak-hour jams. Confirm which product is booked.
3. **Ooedo Naruko Onsen Kounkaku's breakfast time is unpublished on every channel.** Check-in
   15:00–19:00, so the 18:30 arrival is clear.
4. **Miyagi accommodation tax, ¥300 per night from 13 Jan 2026**, cash at the desk, on top of bathing
   tax — hits nights 2 and 3 and is new since the earlier batches.
5. **鬼怒川公園岩風呂 closed permanently on 31 Mar 2024**, and its address was 日光市藤原19番地 — the
   *same banchi as Matsuya*. The nearest public bath to night 4's door no longer exists.
6. **Takimi Bridge drops from a 17-minute walk to about 5; Fureai Bridge rises from 2 to about 18.**
   The retired Fureai `mustSee` is now wrong for night 4.

All three new hotels take a 45-seat coach: Kounkaku 85 spaces including 10 large buses, Mercure 270
free, Matsuya 18 including 8 buses — **but Matsuya's lot is down a steep drop off Route 121 with the
hotel's own low-clearance warning. Warn the driver.**

---

## 5. Ginza, added as a declared Day 7 backup

`Ginza` is now a whitelisted `anchorStop` in `validate_research.py` and carries a full batch:
**27 places, 4 must-see, 13 buys, 2 loops, full essentials and outfit** — the same depth as Shisui.
`day7-ginza-backup.json` has a top-level `backupFor` block. **Shisui's research is untouched.**

### The trade-off, worked out
Ginza is only **1.0–1.2 km / 13–16 min from Tsukiji**, not the ~2 km assumed, so the group could be
on the ground at **13:45**. Two schedules:

- **Option A** — depart 15:45, **2 h 00** on the ground (30 min *less* than Shisui), hotel 17:15–17:45,
  18:00 dinner intact.
- **Option B** — depart 16:30, **2 h 30** like-for-like, hotel **18:00–18:30**, dinner slips to 18:45–19:00.

**Ginza → Yurakujo is 53 km straight line / ~68–72 km road, 1 h 30 – 2 h 00** leaving at 16:30 into
Monday eastbound peak, versus Shisui's ~25 min. So Ginza **saves ~60 min inbound and spends 65–95
outbound: a wash at best, 35 minutes worse at worst, with far more variance.**

### The finding that decides it
**A 45-seat coach cannot stay in Ginza.** The only designated facility is 銀座六丁目バス乗降所 on
Mihara-dori beside GINZA SIX: 3 bays, 10:00–21:00, free but 完全予約制 via Times,
「利用時間を1回あたり15分とします」, **drop-off only** — 「待機…は、近隣のバス駐車場を利用ください」.
Two slots must be pre-booked and the coach then parks at Times Harumi 4-chome, about ¥6,000 plus 24
minutes of dead running. Shisui has ~5,000 free spaces and the coach doubles as bag store, shade and
toilet base.

### Monday 14 September facts
**All four big stores are open** — 14 Sep 2026 is a plain Monday, not a holiday (敬老の日 is the 21st).
Mitsukoshi 10:00–20:00 · GINZA SIX 10:30–20:30 · Matsuya 11:00–20:00 · Wako 10:30–19:00. No regular
Monday closures found anywhere in Ginza. **The Chuo-dori pedestrian precinct is weekend-only**
(Sat/Sun/holidays 12:00–18:00 Apr–Sep), so on the 14th it is a live four-lane arterial with signal
crossings at 4-chome and 6-chome only.

Three name traps: **和光本館 is signed SEIKO HOUSE GINZA** (since Jun 2022), **東急プラザ銀座 is now
GinzaNovo** (Dec 2025), and the **San-ai corner of the 4-chome crossing is hoarding** — demolished
Mar 2023, replacement due 2027.

### Recommendation: keep Shisui
Ginza is the better *place*; Shisui is the better *stop*. The saved hour goes back with interest, the
coach cannot stay, and Shisui is outlet pricing on what the group actually wants. Ginza wins on three
real things: it is genuinely photographable, its souvenirs fly (chopsticks, incense, monaka against
Shisui's refrigerated boiled peanuts), and **LOTTE DUTY FREE on 9F lets you pay in Ginza and collect
at Narita the next day.** If the agent insists, run **Option A with both bay slots pre-booked.**

---

## 6. Nearby places pushed out to a 30-minute walking radius

The exploration radius was widened from "a few minutes' walk" to **anything reachable within 30
minutes on foot**. `validate_research.py` now **errors on any active record with a walk leg over 30
minutes**, and warns rather than errors on retired records so their research is not falsified.

**Places went from 253 to 503.** Distribution of the longest walk leg per place:

| Band | Places |
|---|---:|
| 0–8 min | 335 |
| 9–20 min | 128 |
| 21–30 min | 26 |
| over 30 (retired records only) | 2 |

Four new batches: `expand-d12.json` (39), `expand-d34.json` (46), `expand-d56.json` (56),
`expand-d78.json` (49), plus 10 new shopping items.

### What the wider radius actually bought
- **Matsushima** pays off most: the whole peninsula is inside 30 minutes — Kanrantei, Fukuurabashi,
  Oshima and Togetsukyo, Tenrin-in, Saigyo Modoshi, and the **Michinoku Date Masamune Historical
  Museum** 2 minutes away, ¥1,000, capacity 300, the best unused thing on the peninsula.
- **Tokyo Station's shut-Gransta problem has an answer:** **Maruzen Marunouchi in Oazo opens 09:00**
  with no September closing day, inside the 09:15–10:05 window.
- **Sendai's 35 minutes** now has the **AER 31F terrace, free, 10:00–20:00, 4 minutes away.**
- **Toshogu's radius should be measured from the Nishi-sando coach park**, not the banned main lot —
  which **opens the whole west side of Nikko**: Rinnoji Sanbutsudo 4 min (and it opens 08:00, an hour
  before the shrine), Tamozawa Imperial Villa 12 min (25+ from the main lot), Taiyuin 13,
  Kanmangafuchi 22. Tobu Nikko Station is 31 — outside.
- **Ginzan's Shirogane Park** yields 12 new records in the 9–30 band: the 疎水坑 and 夏しらず坑 mine
  adits, 河鹿橋, 洗心峡, 籟音の滝, 長者の池, 山ノ神神社.
- **Shisui has exactly one thing within 30 minutes on foot:** 酒々井温泉 湯楽の里, 700 m, a genuine
  iodine-rich saline hot spring, 09:00–23:00, ¥950–1,600 — which is sharp, because the group's own
  hotel bath that night is *not* hot-spring water.
- **Zao Fox Village has nothing**, and saying so is the correct answer. One record, 弥治郎こけし村,
  filed with a bus leg.
- **Narita splits into two usable windows**, not one: **07:20–08:40 landside** (the coach beats the
  07:55 counter opening by ~35 min — free ITOKI lounges, 108 seats, 05:00–24:00; Tully's and SUBWAY
  from 07:00; YAMADA TAX FREE from 07:30; 5F SHIKISAI GARDEN from 05:00 with GARDEN WALK 06:30) and
  **09:00–10:20 airside** on 3F. Every Narita record states BEFORE or AFTER security.

### Honest negatives, all recorded
Ryuzu Falls is 5 km / ~80 min — **not** in range. The Italian Embassy Villa is ~34 min on foot.
Doho Park Tsukuba is 41 min. Sokanzan is 35+, so no record was created. Aeon Mall Narita is 6.1 km /
~99 min and Sakura-no-Yama 3.6 km / ~59 min — both outside; the existing bus legs stand. Sendai
Mediatheque is 30 min each way against a 35-minute stop; Akanuma is 60 minutes of walking against a
60-minute stop. Each of these carries the truth in its `note` rather than an implication that it fits.

---

## 7. What the deploy session must do differently

1. **Read the `removedFromDay` manifest in each batch.** Three stops are declared:
   `Hotel Kameya, Naruko Onsen`, `Okuiizaka Anabara Onsen Yoshikawaya`, and
   `Ooedo Onsen Monogatari Premium Kinugawa Kanko Hotel`. Each manifest carries `reason`,
   `replacedBy`, `keepBecause` and `importAs: "Removed from this Day"`.
2. **Import the 34 `"retired": true` records into a group labelled "Removed from this Day"** on their
   original day. They must stay viewable with every field intact — that is the explicit instruction.
   Do not delete them and do not merge them into the replacement hotel.
3. **Handle the night-1 rename**, declared in `day1-haneda.json` under `renamedStops`: the anchorStop
   string changed from `Hotel Metropolitan Haneda` to `Hotel Metropolitan Tokyo Haneda`. Same
   property — migrate rather than duplicate.
4. **Import `Ginza` as a backup stop, not a main itinerary item.** `day7-ginza-backup.json` has a
   top-level `backupFor` block naming `Shisui Premium Outlets` and day 7. Both must coexist.
5. **`validate_research.py` is now v2** and ships in the bundle. v1 is kept as
   `validate_research_v1.py.bak`. The stop whitelist, the 30-minute walk cap and the
   `removedFromDay` checks are all in it — run it before importing anything.
6. **Day 5's sub-route `d5sr03edo` changed** (deadline 990 → 960) and `day5-nikko.json` carries an
   `itineraryRevisions` array recording why. Steps that now fall after departure are flagged
   `droppedByRevision`.
