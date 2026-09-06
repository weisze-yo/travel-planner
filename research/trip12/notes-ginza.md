# notes-ginza.md — GINZA as a BACKUP for Day 7, Mon 14 Sep 2026

Researched 4 Sep 2026. Output: `day7-ginza-backup.json`
(`places=27 mustSee=4 shopping=13 subRoutes=2 essentials=1 outfitByStop=1`, validator **0 errors, 0 warnings**).

Ginza is a declared **backup** that may replace **Shisui Premium Outlets (14:30, 2h30)**. Shisui's
research is untouched and both coexist. `anchorStop` is `"Ginza"` verbatim throughout, and the batch
carries the required top-level `backupFor` key.

---

## 1. The single most useful finding: a 45-seat coach cannot stay in Ginza

This is not a detail, it is the whole shape of the stop.

Chuo-ku operates the only designated tourist-coach facility in Ginza:
**銀座六丁目バス乗降所**, on 三原通り alongside GINZA SIX. GINZA SIX's own facilities page confirms it
(「三原通りに面して、観光バス乗降所を設置」). Chuo-ku's page gives the rules:

| | |
|---|---|
| Location | 「銀座六丁目10番先から同12番先（三原通り）」 |
| Bays | 3 |
| Hours | 「午前10時から午後9時まで」 |
| Fee | 「無料（事前登録予約制）」 — free, but **advance registration and reservation**, via Times Bus Reservation Service |
| **Max stay** | **「利用時間を1回あたり15分とします」 — 15 minutes per use** |
| **Waiting** | **Forbidden.** 「待機（降車から乗車までの間）は、近隣のバス駐車場を利用ください」 |
| Enquiries | 03-3546-5443 (中央区 環境土木部交通課) |

So the agent must book **two** 15-minute slots — one to set down, one to collect — and the coach must
go and park somewhere else for the three hours in between. The realistic place is the
**Times Harumi 4-chome Bus Pool** (晴海4-6): 8 large-bus bays, 24 h, **¥2,000/hour**, no advance
reservation, about **2.9 km / 12 minutes each way**. Roughly **¥6,000 plus 24 minutes of dead
running** for a three-hour Ginza stop. The alternatives are worse — Kyobashi Edogran (京橋2-2-1)
takes 2 buses, ¥1,500 for the first 30 min then ¥1,000/30 min, Japan Bus Association members only,
reservation required; Ichibabashi (築地4-15-2) ¥2,200/hour and closes 17:00; Marunouchi Kajibashi
(丸の内3-8-2) 22 bays at ¥2,800 for the first hour but books **by FAX** up to the end of the month
three months ahead.

**Compare Shisui**, from its own facility sheet: 「約5,000台（無料）」. Free, on site, and the coach
sits with the group for the whole 2h30. For 35 people in 26°C and humidity, the coach at Shisui is
also the bag store, the toilet fallback, the shade and the regroup point. **In Ginza the group loses
all of that** — there are no public coin lockers named on any operator page I could open. The nearest
equivalent is GINZA SIX's **TERMINAL GINZA on 1F**, which does 「観光案内、外貨両替、免税、手荷物一時預かり、宅配」
— same-day luggage storage as well as tax-free and currency exchange, two minutes from the kerb. That
is a genuinely good substitute, but it is a desk, not a coach, and it is only useful if the group
stays near GINZA SIX.

---

## 2. The real arrive / depart window, and what the Tomisato transfer costs

### The approach

Tsukiji ends 11:50; lunch (Crab Miso Set) 12:15. Lunch for 35 people runs 60–75 minutes, so the
group is free about **13:20–13:30**.

**Correction to the brief:** Ginza is **not ~2 km from Tsukiji**. Ginza 4-chome (35.6716, 139.7648)
to Namiyoke Inari at the Tsukiji Outer Market is **913 m straight line**; to the market centre
**772 m**. Walking that is **1.0–1.2 km, 13–16 minutes**. By coach it is 10–12 minutes in Ginza
traffic, plus the 15-minute set-down slot.

Either way the group is on the pavement in Ginza at about **13:45**.

Versus Shisui: 60 km, **1h10** — which is exactly why the itinerary has lunch at 12:15 and arrival
at 14:30. **Ginza gives back about 60 minutes on the approach.** That part of the brief's premise
is correct.

### The departure — where the hour goes straight back

| | Shisui | Ginza |
|---|---|---|
| Straight-line to Yurakujo (Tomisato) | **7.2 km** | **53.0 km** |
| Road distance | ~14 km | **~68–72 km** (首都高都心環状 → 湾岸/京葉道路 → 東関東自動車道 → 富里/酒々井IC) |
| Drive time | **~25 min** (itinerary: 17:00 → 17:30) | **1h30–2h00** departing 16:30 on a Monday; ~1h05 only if the roads are empty, which at 16:30 they are not |
| Departure conditions | Leaves a car park 14 km from the hotel | Leaves central Tokyo **eastbound at the start of Monday evening peak** |

**Cost of the Tomisato transfer if Ginza replaces Shisui: about +65 to +95 minutes, and a much wider
variance.** The saved hour on the approach is spent, with interest, on the way out.

### The two schedules that actually work

**Option A — protect the 18:00 izakaya.** Arrive Ginza **13:45**, board **15:45**, depart **15:45**.
On the ground: **2h00** — *thirty minutes less than Shisui's 2h30*. Hotel 17:15–17:45. Dinner intact.

**Option B — protect the 2h30.** Arrive **13:45**, regroup **16:15**, board and depart **16:30**.
On the ground: **2h30**. Hotel **18:00–18:30**. **The 18:00 izakaya slips to 18:45–19:00**, and a
typhoon-month shower or one closure on the Higashi-Kanto pushes it later.

The `subRoutes` in the batch are built for Option B (start 825 = 13:45, deadline 975 = 16:15), which
is the version that matches Shisui's 2h30 like-for-like. Option A simply drops the last two steps.

### Net verdict on time

Ginza saves ~60 min inbound and costs ~65–95 min outbound: **a wash at best, 5–35 minutes worse at
worst, and it converts a low-risk 25-minute transfer into a high-variance 1h30–2h00 one at the exact
hour Tokyo's eastbound network is worst.** It also adds ~¥6,000 of coach parking and removes the
coach from the group for the whole stop. There is a third, hidden cost: Shisui is 20 minutes from
Narita, so an overrun there is absorbed by tomorrow's short airport run; an overrun leaving Ginza
lands on tonight's dinner.

**A note on the hybrid, since someone will ask:** doing Ginza *and* Shisui does not work. Ginza to
Shisui is ~60 km / 1h10; a 12:15 lunch, 13:45–15:00 Ginza and a 1h10 drive puts the group at Shisui
at 16:10 with 50 minutes before the 17:00 departure. Not worth 60 km.

---

## 3. Tax-free mechanics: Ginza vs the single Shisui counter

The policy itself is settled and I did not re-litigate it: **still at-the-till until 31 Oct 2026**,
**¥5,000 tax-excluded per store per day**, Visit Japan Web accepted in place of the passport book.
Japan Tourism Agency: 「2026年11月１日の販売からは…『リファンド方式』に移行します」.

What differs is the **plumbing**, and it is the one respect in which Ginza is genuinely better:

- **Shisui has no central desk at all.** The existing research is explicit: the operator's own
  service page lists no tax-free counter, so all ~220 shops do their own paperwork at their own
  tills. A group's spend fragments into small receipts that never clear ¥5,000.
- **Ginza offers two consolidated counters.**
  - **GINZA SIX, 1F TERMINAL GINZA — 「免税カウンター 10:30 - 20:30」.** Pools exemption across
    participating tenants: one queue can cover several shops. Two minutes from the coach bay.
  - **Ginza Mitsukoshi — 「新館7階」**, inside the 海外顧客サービスセンター. Also pools the whole
    store — but it is **seven floors up**, so allow lift time as well as queue time. Mitsukoshi
    does **not** publish that counter's own hours, minimum or handling fee.
- **Everywhere else in Ginza is per-till**, exactly like Shisui: UNIQLO, MUJI, Loft, Matsumoto
  Kiyoshi, Don Quijote, BicCamera (one counter on 1F, store-wide).
- **One thing Shisui cannot do at all: LOTTE DUTY FREE Tokyo Ginza, 9F** (「銀座5-2-1 GinzaNovo 8-9階」,
  11:00–21:00). Pay in Ginza, get a voucher, **collect after immigration at Narita** —
  「出国の60日前から1日前までご購入いただけます」. The group flies from Narita T1 tomorrow, so this is
  inside the window, and it is the right way to buy spirits and large fragrance that must not ride
  in a 7 kg cabin bag. 8F is ordinary take-away tax-free, no passport needed.

**The practical consequence:** Ginza's counters only help if the group *concentrates*. The moment 35
people disperse along 1.1 km of Chuo-dori, Ginza behaves exactly like Shisui — per-till, small
receipts, nothing clears ¥5,000. The advice is therefore identical to Shisui's: **spend deep in few
shops.** `subRoutes` d7gzsub1 is built around that, and around the fact that UNIQLO Ginza is twelve
floors of one shop with one receipt, three minutes from the coach.

Also carried over: cosmetics and food are 消耗品, sealed at the till, **not to be opened in Japan**.

---

## 4. Monday closures — all four big stores are OPEN on 14 Sep 2026

**14 September 2026 is a plain Monday, not a public holiday.** 敬老の日 (Respect for the Aged Day) is
the third Monday of September, which in 2026 falls on **21 September**; 秋分の日 is 23 September. So
no holiday timetable, and no holiday crowds.

| Store | Hours | Monday 14 Sep | Source |
|---|---|---|---|
| **Ginza Mitsukoshi** | 「営業時間：午前10時～午後8時」 | **OPEN** — no regular closing day. Earliest opener of the four. | mistore.jp own access page |
| **GINZA SIX** | 「ショップ・カフェ 10:30〜20:30」, 「レストラン 11:00〜23:00」 | **OPEN** — the only 休館日 in the current calendar is **1–2 January** (「GINZA SIX全体が休館」) | ginza6.tokyo own hours page |
| **Matsuya Ginza** | B2F–8F 11:00–20:00; 8F Restaurant City to 22:00 (L.O. 21:00) | **OPEN** — closed **only 1 and 2 January** | Ginza Information Management official listing |
| **Wako / SEIKO HOUSE GINZA** | 10:30–19:00 | **OPEN** — 「無休（年末年始を除く）」 | Chuo-ku Tourism Association |

**No regular Monday closures anywhere in Ginza that I could find.** That is a real advantage over,
say, Hitachi Seaside Park's Tuesdays. Shisui is equally safe (「年1回（2月）」).

**Two name traps that will waste the group's time if not briefed:**

1. **和光本館 is signed SEIKO HOUSE GINZA**, and has been since 10 June 2022. The shop inside is
   still Wako; the building name on the facade is not. Anyone told to "meet at Wako" and looking for
   the word *Wako* will be standing under a sign that says SEIKO.
2. **東急プラザ銀座 no longer exists by that name.** It was renamed **GinzaNovo** and reopened in
   December 2025 (「『東急プラザ銀座』が名称変更し、2025年12月にオープンしました」). Same address,
   銀座5-2-1, hours 11:00–21:00. A further glass-facade rebuild runs to 2027. Any 2024-vintage
   itinerary or map naming Tokyu Plaza Ginza is stale.

**Early closers that matter against a 16:30 coach** — none of them are a problem, but worth naming:
Kabukiza's Kobikicho Hiroba 18:30, Wako and Kyukyodo and Ginza Sony Park 19:00, Natsuno 19:30.
**And one trap:** MUJI Ginza's **tax-free desk closes 20:30, thirty minutes before the shop**.

---

## 5. The weekend-only pedestrian precinct — CONFIRMED, and it does NOT run on 14 September

This was worth checking and the answer is unambiguous.

Chuo-dori's 歩行者天国 runs **Saturdays, Sundays and public holidays only**, from noon:
**12:00–18:00 April–September**, **12:00–17:00 October–March**, over the roughly **1,100 m** from the
Ginza-dori entrance to the 銀座八丁目交差点. Corroborated in English by japan-guide ("from noon to
18:00 (until 17:00 from October through March)… only on weekend afternoons") and by
en.wikipedia's Ginza article. Chuo-ku's own page confirms the closed **section** verbatim —
「歩行者天国（中央通り・銀座通り入り口から銀座八丁目交差点までの間）実施時間中は、自転車も通行できません」 —
but does not publish the days and hours, referring enquiries to 環境土木部交通課 on 03-6278-8171.

**14 September 2026 is a Monday and not a holiday, so there is no hokoten.** Chuo-dori is a live
four-lane arterial with buses and taxis for the entire 13:45–16:30 window. Consequences the app
should surface:

- No strolling in the road, no road-centre photographs, no crossing except at the signals.
- The signalled crossings the group can actually use are **4-chome** and **6-chome**.
- Budget a full signal cycle every time 35 people change side. Two or three crossings is fine; a
  route that zig-zags across Chuo-dori will lose ten minutes to red lights.
- The whole "Ginza on a Sunday afternoon" image people have — wide empty avenue, street
  performers, cafés spilling out — is **not what they will get**. This is precisely the kind of
  mismatch that disappoints, and it is the strongest single argument for briefing it in advance.

## 5b. And one corner of the 4-chome crossing is a building site

The **San-ai Dream Center (三愛ドリームセンター, 銀座5-7-2)** — the round glass tower that was one of
the four landmark corners — was demolished. Ricoh's own release:
「解体工事の期間は2023年3月から約2年間を予定しています」 and the replacement targets
「2027年の竣工を目指し」 (architect 小堀哲夫). **In September 2026 that corner is construction, not
landmark.** The photo brief in `mustSee[0]` tells the photographer to stand tight to the GINZA
PLACE kerb specifically to keep the hoarding out of frame.

For the record, the four corners of 中央通り × 晴海通り as researched:
**NW = Wako / SEIKO HOUSE GINZA** (per japan-guide, "the northwest corner of the district's
centrally located Ginza 4-Chome junction of Chuo Dori and Harumi Dori");
**NE = Ginza Mitsukoshi**; **SE = GINZA PLACE** (銀座5-8-1, Ginza Station exit A4);
**SW = the San-ai site, under construction.**

**The mid-afternoon shot, worked out.** Sun over Ginza on 14 Sep 2026, from the same NOAA routine
used for the rest of the trip (35.6716 / 139.7648): 13:30 az 226°/alt 48.5°, 14:30 az 241°/alt 38.6°,
**15:00 az 248°/alt 33.1°**, 16:00 az 258°/alt 21.5°, 16:30 az 263°/alt 15.5°. Chuo-dori runs on a
bearing of about **29°/209°**; Harumi-dori about **133°/313°**.

- **Stand on the SE corner, in front of GINZA PLACE, and shoot NORTH-WEST** at the clock tower. The
  WSW sun sits roughly 80–100° to your **left**: the curved granite corner and the tower are
  side-lit, faces are lit, and there is no sun in frame.
- **Do NOT shoot it from the Mitsukoshi corner.** That view faces roughly 250° — straight into the
  sun. Silhouette and flare.
- The avenue shot wants the **north end** instead: from outside Ginza Loft (銀座2-4-6) looking SSW
  down Chuo-dori, the sun at 248°–258° is 40–50° off the view axis to the right — cross-light down
  the facades, no sun in frame.
- Sunglasses off for the group photo: at 33° altitude between granite walls the light is
  omnidirectional and dark lenses erase the eyes.

---

## 6. Coordinates

**The GSI geocoder is BLOCKED from direct HTTP in this session** — `curl`/`urllib` to
`msearch.gsi.go.jp` both got `403 Forbidden` on CONNECT from the egress proxy
(`connect_rejected`, organisation policy). Per the proxy README I did not retry or route round it.
**It works through the WebFetch pathway**, which is how every coordinate here was obtained. Worth
recording for the next session: use WebFetch, not curl, for
`https://msearch.gsi.go.jp/address-search/AddressSearch?q=…`.

**19 addresses resolved to 号 level (~20 m) and are marked `verified`:**
銀座4-5-11 (Wako/SEIKO HOUSE), 6-10-1 (GINZA SIX), 4-6-16 (Mitsukoshi), 3-6-1 (Matsuya),
2-7-15 (G.Itoya), 2-4-6 (Loft), 3-3-5 (MUJI), 6-9-5 (UNIQLO), 5-2-1 (GinzaNovo / Lotte),
5-7-4 (Kyukyodo), 7-9-20 (Beer Hall Lion), 4-5-7 (Kimuraya), 6-7-4 (Natsuno),
5-5-1 (MatsuKiyo GINZA FLAG), 5-8-9 (MatsuKiyo Miyuki Ave.), 4-12-15 (Kabukiza),
5-3-1 (Ginza Sony Park), 5-8-1 (GINZA PLACE), 5-7-19 (Akebono).

**4 marked `approximate`, each with a `confidenceNote` naming exactly why:**

- **The coach bay** — the published location is a kerb range (「銀座六丁目10番先から同12番先」), not an
  address. I geocoded both bracketing blocks (銀座6-10-1 → 35.669445/139.763351 and 銀座6-12 →
  35.669136/139.764618) and took the kerb midpoint on Mihara-dori, **35.66950 / 139.76450**. No
  coordinate is published for the bays themselves.
- **Don Quijote Ginza** — the operator publishes 銀座8-10 with no 号, so GSI returns only the
  番-level block point.
- **BicCamera Yurakucho** — 有楽町1-11-1 resolves only to 有楽町一丁目11番.
- **Times Harumi bus pool** — 晴海4-6 is a block, and the pool spans it.

**Walk legs** are computed from the anchor as `haversine × 1.30` route factor at 70 m/min plus a
signal allowance, then rounded up. They are **derived, not measured**, and every `subRoute` says so
in its `confidenceNote`. All 27 records are inside the 30-minute cap; the longest is BicCamera
Yurakucho at 14 minutes. The one non-walk leg is the Harumi bus pool, `{mode: bus, minutes: 12}`.

---

## 7. What I could NOT verify — read this before trusting a field

1. **Wako's hours are not confirmed at source.** `wako.co.jp` returned **403** on both the store page
   and the top page. The 10:30–19:00 and 「無休（年末年始を除く）」 come from the **Chuo-ku Tourism
   Association**. Other secondary listings say **11:00–19:00**. If the 10:30 opening matters,
   telephone. `confidence: medium` on the record and in `essentials`.
2. **Ginza Mitsukoshi's tax-free counter publishes no hours.** Its own page states only
   「各種設備 新館7階」. The counter's opening time, the minimum and whether a handling fee applies
   are all unknown. Assume store hours and allow lift time.
3. **Ginza Akebono** — `ginza-akebono.co.jp` is robots-disallowed from this sandbox. Address is
   GSI-verified; **hours, closing day and prices are indicative only.**
4. **Kyukyodo** — `kyukyodo.co.jp` robots-disallowed. Hours 11:00–19:00 and the product range come
   from a Time Out Tokyo listing. **No closing day confirmed.**
5. **GINZA PLACE publishes no building hours** — only 「店舗ごとに異なるのでショップ情報をご確認ください」.
   **NISSAN CROSSING and the Sony showroom hours are therefore unverified**, and so is whether entry
   is free (it has always been, but not from a page I could open).
6. **Matsumoto Kiyoshi Ginza Miyuki Ave.** — the branch directory gives the address but **no hours**,
   and does not flag tax-free for that specific branch.
7. **GinzaNovo's renovation extent is unknown.** The rename and 11:00–21:00 hours are from GO TOKYO,
   but **how much of the building is hoarded off for the 2027 facade works on 14 Sep 2026 could not
   be established** from the operator's own site. If the group is being sent there for Lotte Duty
   Free, confirm 8F/9F access first.
8. **Coach parking fees are from a bus-industry listing**, not from each operator. Kyobashi Edogran,
   Ichibabashi, Harumi and Kajibashi prices should be confirmed by the agent before being quoted.
9. **No vehicle dimension limits are published for the Ginza 6-chome bay.** Chuo-ku says 観光バス and
   three bays, but gives no length, height or weight cap. **A 45-seat/12 m coach is almost certainly
   fine — but the agent should confirm when booking the slot**, because there is no fallback bay in
   Ginza if it is not.
10. **Kabukiza's Kobikicho Hiroba on a non-performance day.** 9:30–18:30 and free access are stated,
    but not whether those hours hold when nothing is playing.
11. **Natsuno is 「現在、短縮営業中」** — on shortened hours by its own admission — so the published
    10:30–19:30 may close earlier, and same-day engraving turnaround is not guaranteed.
12. **GINZA SIX's rooftop garden details** (4,000 m², 370 m corridor, Tokyo Tower and Skytree
    sightlines) are from a secondary feature article. The **7:00–23:00 and the free access are
    official**. It closes in bad weather, and September is peak typhoon month.
13. **Images: the `images` key is omitted from every record, deliberately.** Wikimedia Commons, the
    Wikimedia APIs and Openverse are all unreachable from this sandbox, and no Ginza venue page found
    this session grants reuse in terms I could cite. Per RESEARCH_BRIEF §3g and §4.7, omitted rather
    than filled with anything unlicensed.

**Corrections to the task brief's own figures**, for the record rather than to argue:

- Ginza is **~1.0–1.2 km / 13–16 min walk** from Tsukiji Outer Market, not ~2 km. (913 m
  straight-line to Namiyoke Inari.)
- Ginza to Shisui is **45.9 km straight-line**, consistent with the brief's ~60 km by road.
- Shisui to the Yurakujo hotel is **7.2 km straight-line / ~14 km road**, consistent with the figure
  already in `day7-tokyo.json`.
- Ginza to the Yurakujo hotel is **53.0 km straight-line**, so **~68–72 km by road** — the brief's
  "60 km further from the Narita hotel" is right in spirit and slightly conservative.

---

## 8. Recommendation: KEEP SHISUI

Ginza is the better *place*. Shisui is the better *stop*. Six reasons, in order of weight:

1. **The coach-time saving is illusory.** ~60 min saved inbound, ~65–95 min spent outbound, and the
   outbound leg is the one that runs into Monday evening peak eastbound out of central Tokyo. Net:
   a wash to 35 minutes worse, with far more variance.
2. **Ginza breaks tonight's schedule or shortens the stop.** Either the group gets **2h00** instead
   of 2h30 (Option A), or the **18:00 izakaya slips to 18:45–19:00** (Option B). Shisui's 17:00
   departure / 17:30 check-in / 18:00 dinner has ~35 minutes of slack in it. Ginza has none.
3. **The coach cannot stay.** Fifteen minutes, drop-off only, reservation-only, two slots to book,
   ¥6,000 and 24 minutes of dead running to park at Harumi — and for the whole three hours the
   group has no bag store, no toilet fallback and no shade base. Shisui has 「約5,000台（無料）」 and
   the coach parked outside. For 35 people in 26°C humidity this matters more than it reads.
4. **Price.** Shisui is outlet pricing on the accessible-luxury and Japanese labels the group
   actually wants. Ginza's equivalents are full retail, and the department stores are full retail at
   the top end. As a *shopping* stop for 35 Malaysian colleagues, Shisui simply buys more.
5. **The tax-free advantage is conditional.** Ginza's two consolidated counters are a real
   improvement over Shisui's nothing — but only if the group concentrates in GINZA SIX or
   Mitsukoshi. Disperse along Chuo-dori and it is per-till, exactly like Shisui.
6. **On a Monday, Ginza is not showing its best face.** No pedestrian precinct, a live four-lane
   arterial, and one of the four landmark corners hoarded off until 2027.

**But three things Ginza is genuinely better at, and they are not trivial:**

- **It is worth looking at.** The existing Shisui research says, of its own stop, "nobody will submit
  a photo contest entry from here." Ginza gives four real photographs: the Wako clock tower, the
  avenue, the GINZA SIX roof with Skytree, and Kabukiza. If Day 7's photo budget has already been
  spent at Zojoji and Tokyo Tower in the morning, that is worth less; if not, it is worth a lot.
- **The souvenirs actually fly.** Chopsticks, incense, washi, boxed monaka, MUJI retort curries,
  Itoya pens — all flat, ambient, unbreakable, no shelf life. Shisui's one seasonal buy, boiled
  Chiba peanuts (おおまさり), is refrigerated and **cannot fly**. Swapping to Ginza measurably
  improves what gets home.
- **LOTTE DUTY FREE 9F.** Pay in Ginza, collect after immigration at Narita tomorrow. Shisui cannot
  do this at all, and it is the correct way to buy spirits and large fragrance the day before a
  25 kg / 7 kg flight.

### If the agent insists on Ginza

Do it as **Option A: 13:45–15:45, two hours, depart 15:45.** Accept the shorter stop and keep the
18:00 dinner — arriving in Tomisato at 17:15–17:45 leaves the day's shape intact. Then:

1. **Book both 15-minute bay slots now** (Times Bus Reservation Service, 銀座六丁目バス乗降所), and
   confirm the bay takes a 45-seat coach — Chuo-ku publishes no dimension limit and there is no
   fallback.
2. **Book the Harumi 4-chome bus pool** for the wait, or accept ¥2,800/hour at Kajibashi.
3. **Brief on the coach before the doors open:** passports IN HAND; the coach will NOT be outside;
   the exact pick-up kerb and time; Chuo-dori is a live road today, cross at 4-chome and 6-chome
   signals only; regroup on the Mihara-dori kerb, **not inside a building** — 35 people cannot be
   found across twelve floors of UNIQLO.
4. **Run `subRoutes` d7gzsub1 minus its last two steps** — UNIQLO, then the clock tower, then
   Mitsukoshi with the 新館7階 counter cleared by 15:15.
5. **Use TERMINAL GINZA on 1F of GINZA SIX as the bag drop**, since the coach is 3 km away.
6. **Say out loud that there is no pedestrian precinct on a Monday**, because that is the specific
   expectation that will otherwise be disappointed.
