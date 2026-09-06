# RESEARCH_COMPLETE.md — handoff to the deploy session

**Session A (research), Cowork, 3 September 2026.**
**Trip 12 departs 8 September 2026 — five days after this session.**

Eight batch files, one per day, plus `notes.md` and eight per-day notes files.
`python3 validate_research.py day*.json` → **0 errors, 0 warnings, exit 0.**

> **Read `notes.md` first.** Five of the fourteen "corrections not to re-introduce" in
> RESEARCH_BRIEF §2 did not survive contact with the operators' own pages — two are wrong, two are
> incomplete, one is refined. `notes.md` also documents four defects in `trip12_app_seed.json`
> itself that will corrupt the import if you don't handle them.

---

## 1. What is in the bundle

| File | Contents |
|---|---|
| `day1-haneda.json` | Haneda T3 · Hotel Metropolitan Haneda |
| `day2-matsushima.json` | Tokyo Stn · Sendai Stn · Fish Market · Zuiganji · Godaido · Bay Cruise · Hotel Kameya |
| `day3-ginzan.json` | Ginzan Onsen Street · Zao Fox Village · Yoshikawaya |
| `day4-aizu.json` | Goshikinuma · Tsurugajo · Ouchi-juku · Ooedo Kinugawa |
| `day5-nikko.json` | Kegon Falls · Nikko Toshogu · Edo Wonderland · Hotel Nikko Tsukuba |
| `day6-hitachi.json` | Hitachi Seaside Park · Kawagoe · Shibuya Crossing · Shinjuku Granbell |
| `day7-tokyo.json` | Tokyo Tower · Tsukiji · Shisui Outlets · Hotel Yurakujo |
| `day8-narita.json` | Narita T1 South Wing |
| `notes.md` | **The §2 audit, the seed defects, the app's own errors, environment constraints** |
| `notes2.md` … `notes8.md` | Per-day working notes, with sources for every claim |
| `seed_duplicates.json` | **20 duplicate venue pairs the importer must merge** — machine-readable |

### Counts

| Batch | places | mustSee | shopping | subRoutes | essentials | outfitByStop |
|---|---:|---:|---:|---:|---:|---:|
| day1-haneda | 9 | 2 | 1 | 0 | 2 | 2 |
| day2-matsushima | 43 | 8 | 7 | 1 | 7 | 7 |
| day3-ginzan | 29 | 5 | 6 | 2 | 3 | 3 |
| day4-aizu | 31 | 8 | 10 | 2 | 4 | 4 |
| day5-nikko | 39 | 8 | 8 | 3 | 4 | 4 |
| day6-hitachi | 34 | 8 | 8 | 2 | 4 | 4 |
| day7-tokyo | 56 | 10 | 15 | 3 | 4 | 4 |
| day8-narita | 12 | 3 | 8 | 2 | 1 | 1 |
| **TOTAL** | **253** | **52** | **63** | **15** | **29** | **29** |

**368 records: 241 enriched in place (seed id reused verbatim) + 127 new.**
Confidence: 170 high · 196 medium · 2 low. Coordinates: 217 verified · 139 approximate.

---

## 2. What was added — the APP_GAP_ANALYSIS §4 list, closed

§4 was the actual job: *"your model asks for things our map never needed."* All of it is now populated.

| Field the app wanted | Before | Now |
|---|---|---|
| `Place.stayMinutes` | **0 of 187** | **253 of 253** |
| `Place.priceTier` | **0 of 187** | **253 of 253** |
| `Place.legs[]` from the anchor stop | **0 of 187** | **253 of 253** |
| `PlanItem.essentials[]` structured `hours` | **0 of 29 stops** (prose only) | **29 of 29 stops** |
| `SubRoute` | **0** | **15**, across 8 stops, each with a get-back-by deadline |
| `shopping.estimate` in yen | **0 of 49** | **63 of 63** |
| Per-stop outfit advice | day-level only (8) | **29 of 29 stops**, photo + practical |

Also delivered: `closedNote`, `lastAdmission`, `seasonFrom`/`seasonTo`, `groupRate`, `phone`,
`website`, `tickets` and `transport` on all 29 stops; `confidence` + `confidenceNote` + `source`
on every record.

**Seed coverage:** shopping **49/49** enriched, mustSee **34/34** enriched, places **158/187**.
The 29 untouched places are all night/dawn records — **18 of them are duplicates** of places that
*were* enriched (see `seed_duplicates.json`), leaving **11 genuinely unique venues** not enriched:
Tamagawa Sky Bridge, Izumi Tenku no Yu, Tennoji Anabara-yu, Yoshikawaya riverside baths,
Kyu-Horikiri-tei, Harai-yu, Kinuko-no-yu, Kinu Tateiwa suspension bridge, Kinugawa Onsen Station
plaza, Omoide Yokocho, Shinjuku Gyoen. They keep their seed values and are safe to import as-is.

---

## 3. Where the fixed itinerary collides with real opening hours

**This is what the §5 closing-day checker is for.** The brief said six conflicts had surfaced;
this session found **more than twenty**. Ranked by what it actually costs the group.

### Would cost real time or money

| # | Stop | The collision |
|---|---|---|
| 1 | **Nikko Toshogu, Sat 12 Sep** | **Coach parking is BANNED at weekends.** The shrine's own access page: 「土・日・祝祭日、特別な行事のある日は駐車不可」. The 45-seater cannot use 東照宮大駐車場 (¥2,000/day, 7-day advance booking, **weekdays only**). Fallback: 市営西参道第2・3駐車場, 安川町2-47, ¥1,540/day, 140 spaces, 24 h — a **10-minute walk each way out of a 75-minute stop.** |
| 2 | **Narita T1, Tue 15 Sep** | **Narita Nakamise is South Wing 3F, AFTER security** — not the "4F landside street" the seed describes. The old text sends 35 people to the wrong floor on the last morning. |
| 3 | **Edo Wonderland, Sat 12 Sep** | No hours conflict — but the **group rate starts at just 8 people** and the **afternoon 通行手形 opens at exactly 14:00**, the arrival time. Group afternoon ¥4,400 vs ¥5,800 individual day pass = **~¥49,000 saved across 35**, if pre-booked. Groups of 20+ **must** pre-book the coach park by phone/email. |
| 4 | **Tokyo Tower, Mon 14 Sep** | The **¥1,080 agency rate is real** (vs ¥1,350 walk-up) = **¥9,450 on 35 heads** — but only with a prior group booking, and **group settlement is CASH ONLY**. |
| 5 | **Matsushima Bay Cruise, Wed 9 Sep** | **16:00 is the last sailing.** It berths **16:50** and the coach leaves **17:00** — a 10-minute margin with no slack upstream. Board by 15:50. Also unused: the **15+ group discount, ¥1,350 not ¥1,500.** |
| 6 | **Zao Fox Village, Thu 10 Sep** | **Last admission 16:00**, gate closes 16:30, coach scheduled out at **16:40**. Real stop is **80 minutes, not 90**, and the shop shuts with the park. Cash only: **¥52,500 in notes** for 35. |
| 7 | **Ouchi-juku, Fri 11 Sep** | Slot is 14:40–16:40; **the village's shops run 09:00–16:00**, so about half the stop is after it shuts. Kitchens close earlier still: Kintaro Soba 15:00, Yamagataya 15:30, Minatoya L.O. 15:30, Misawaya 16:00. |
| 8 | **Ooedo Kinugawa, Fri 11 Sep** | **Mission 2 (yukata group photo) has about ten minutes** — check-in 18:20, dinner 18:30, and **adult yukata are lent at the front desk, not in the rooms**. The "17:30 / 19:30, 90 min" sittings are **not published anywhere**: the operator says 「チェックイン時にご案内します」 and 「繁忙期の夕食開始時間は6部制となる場合があります」 — up to **six** sittings, assigned at check-in. Also: **check-in 18:20 vs a published latest check-in of 18:00** (Yukoyuko; Rakuten and Trip.com say 19:00 — same operator, three channels). |
| 9 | **Hitachi Seaside Park, Sun 13 Sep** | Park opens **09:30 exactly** and the stop is 09:30–10:30, so any delay comes straight out of the hill time. **Kinen no Mori Rest House opens 10:00** — an hour into the stop, and it is where the hoshi-imo tart and melon soft-serve actually are. The Glass House is at the opposite gate, unreachable in 60 min. The Seaside Train's full loop is 40 min, so it is a one-leg lift, not a tour. |
| 10 | **Yoshikawaya, Thu 10 Sep** | Check-in officially closes **18:00**; the group arrives **17:45**. Breakfast is **07:00**, not the app's 07:30. |

### Smaller, but worth knowing

- **Tokyo Station, 09:15–10:05** — Gransta's souvenir and cosmetics units are 全日 **10:00–21:00**: shut for the entire window. Ekiben from 05:30 is fine.
- **Naruko, Thu 10 Sep 08:30 departure** — Mochidokoro Fukase opens 09:00, Sakurai Kokeshi 10:00.
- **Goshikinuma, 60 min** — against a 4 km / 1 h 10–1 h 30 one-way trail. The hour buys **Bishamon-numa only**, from the east. A west-end drop would reach four ponds.
- **Suehiro Shuzo (Aizu)** — 1.2 km / ~18 min each way, fixed tour departures, groups by prior booking: **not reachable** in the Tsurugajo slot.
- **Tokyo Tower Foot Town at 09:00** — the entire food offer including halal **Siddique Palace opens 11:00**. Only Marion Crepes (halal soft serve) and Lawson are open. Main Deck photo service opens 10:00; Cafe La Tour 09:30.
- **Zojoji** — the Sangedatsumon is fully inside a steel 素屋根 **until 2032**, and **Tokugawa shogun cemetery viewing is currently suspended.** This changes the classic group shot; the batch gives the working position.
- **Kawagoe** — the 15:00 bell-tower chime is 30 minutes after the coach leaves. **Ogakiku closes Thursdays**, not Mondays. **MAG'S PARK is now ¥1,800/head** incl. one drink (¥63,000 for 35) — the ¥300/¥600 on travel sites is stale.
- **Tsukiji, Mon 14 Sep** — a full trading day, but 10:50 sits in the **09:00–14:00 public retail** window: the honest line is "specific items have sold out", not "closing". **うおがし銘茶 shut Mondays.** Naritasan, Kawatoyo and the peanut-monaka shop are unreachable in the hour.
- **Hotel Yurakujo** — the free shuttle is **seats-only by law**, so 35 cannot travel together. Bath entry drops to **¥1,000 after 18:00**, making the "¥1,800 voucher" worth that only between 17:30 and 18:00.
- **Hotel Nikko Tsukuba** — breakfast last order **09:00** (not 09:30); Sansui L.O. 20:00, closed Tue; Tao-Li L.O. 19:30, closed Wed. Kanaya Hotel Bakery Shinkyo is **10:00–17:00**, not 08:00–18:00, and 1 km below the Omotemon.
- **Shisui Premium Outlets is the only stop in the whole trip with no conflict at all.**

### Day 8, worked back from the flight

SQ's own Narita row: counters **open 3 h before (07:55)**, **close 40 min before (10:15)** for
SQ637 at 10:55. Narita advises 2 h minimum. Transfer from Tomisato is 20–25 min (hotel says ~20,
app says ~15) → at the counter by 07:50 → **the coach must leave 07:00–07:10, 07:15 at the outside.**
The app's 06:30 breakfast fits that. **The briefing PDF's "6.00am Depart from hotel" does not** —
it lands the group at T1 around 06:20, ninety minutes before the counters open and before the 5F
deck opens at 06:30. Both are recorded in `essentials.transport`; **neither is resolved** — the tour
agent has to.

---

## 4. Things that will change what you build

1. **Read `notes.md` §2 before writing the importer.** Four seed defects: all 34 `mustSee`
   `whereToFind` fields held a *time* rather than a standing position (fixed in these batches);
   all 49 `shopping` records have **no coordinates at all** because `to_app_seed.py` drops them;
   the "104 approximate" figure is really 66 places + 38 shopping; and **20 venues exist twice**.
2. **Merge the duplicates using `seed_duplicates.json`.** Each entry gives a `keep` id and a
   `duplicate` id. Writing both creates two pins for one place. Three pairs are flagged
   `coLocated` and should both be kept.
3. **Fix stop record `184f9cf0f25a`** (Narita Airport — Terminal 1 South Wing) in `days[].items[]`:
   its longitude is ~600 m east, out over the apron. It sits outside this session's schema so no
   batch corrects it.
4. **The research wins on conflicts, as planned** — but note that 241 of 368 records **reuse a seed
   id deliberately**, so a `set` with merge updates them in place. The 127 new ids are inserts.
   No id is emitted twice across the eight batches (verified).
5. **`hours` is now structured on all 29 stops**, keyed `mon`..`sun`, `null` for a closed day. This
   is what APP_GAP_ANALYSIS §5's closing-day checker needs. On this trip it would fire on at least
   ten stops without a human looking.

---

## 5. What is NOT delivered — one thing, and it matters

**Zero images. All eight batches omit the `images` key entirely.**

Every licensing route is blocked from this sandbox: `commons.wikimedia.org` and `api.wikimedia.org`
are cache-only, `en.wikipedia.org/w/api.php` is cache-only, `api.openverse.org` and `openverse.org`
both 403, and no reachable venue or tourism-board page states a reuse licence in terms worth
recording. Rather than attach images without a licence — which RESEARCH_BRIEF §3g forbids and the
validator rejects — the key is omitted, which the validator accepts.

**Consequence for the import:** step 4 of the deploy brief (download each licensed image, upload to
Storage under `users/{uid}/…`, carry `license`/`credit`/`sourcePage` onto the record) **has nothing
to do.** Build the code path anyway — the schema and the attribution plumbing are still right — but
expect an empty set, and have the app fall back to the image-search link, exactly as
`ViTrox_Trip12_Japan_Tohoku_Map.html` already does (HANDOFF design invariant 6).

**To fix it:** a session with reachable Commons needs one pass over the 29 stops. Nothing else in
this bundle depends on it.

---

## 6. Still unresolved — the honest list

**Needs the tour agent, not more research:**

- **Which day is the yukata reel** — Mission 2 says Day 4, Mission 4 says "Day 3 with Yukata". Day 4
  is the likelier answer. Decides which night the videographer must be ready.
- **A named post-19:00 buffet sitting at Ooedo Kinugawa**, plus a staffed yukata rack. If the group
  lands an early sitting, Mission 2 has to move to after dinner.
- **The Toshogu weekend coach-parking arrangement** — see §3.1. This one is urgent.
- **Whether Tokyo Tower and Edo Wonderland group rates were pre-booked** — ~¥58,000 combined.
- **Haneda arrival terminal** — T3 is well supported but the app prints no terminal.
- **The Narita group check-in counter island.** A ground handler's map shows "K counter no. 16";
  recorded at medium confidence.

**Could not be verified from here** (each is `confidence: medium` or `low` with a `confidenceNote`
naming exactly what is unverified):

- `kegon.jp` and `edowonderland.net/schedule/` are robots-blocked, so the Kegon lift hours sit at
  medium and the Edo Wonderland sub-route anchors on the usual 15:00 Oiran-douchuu with an explicit
  "re-plan off the printed sheet at the gate".
- `granbellhotel.jp` blocks automated fetching — the 13F bar's Sunday hours, the 12F breakfast times
  and the waived ¥500 charge are carried from the seed at medium. Address 歌舞伎町2-14-5 and phone
  03-5155-2666 are confirmed from directories.
- Hotel Kameya's bath hours and names (`hmihotelgroup.com` subpages redirect-loop).
- Ooedo Kinugawa's bath and Premium Lounge hours; Yoshikawaya's private-bath hire and 3F shop hours.
- Shisui's per-wing brand allocation and any on-site coordinate (floor map served only via an
  external interactive map).
- The Narita 5F deck's closing time and its Apr–Sep / Oct–Mar split; SKY FOOD COURT tenant hours.
- Two records at Ouchi-juku (**Man'ya**, **Koyasu Kannon-do**) are the only `low` confidence records
  in the bundle: they publish nothing and the aggregator pages are empty templates with `tel:null`.
- Six day-5 records carry `latitude: null` rather than a guessed coordinate.

**Deliberately not promoted to `verified`:** GSI resolves Shisui only to a block centroid 1.8 km off
and Hotel Yurakujo only to a point 1.2 km off. The seed's hotel value is retained because it
reconciles exactly with two independently stated distances (3.95 km to Sakura-no-Yama, 1.35 km to
the 7-Eleven) that the GSI point does not.

---

## 7. One caution, unchanged from APP_GAP_ANALYSIS §7

**You fly on the 8th.** The deploy session writes to a live Firebase project and changes two schema
fields. `ViTrox_Trip12_Japan_Tohoku_Map.html` is finished, works offline, and already holds the
record layer for notes and photos on the coach. **Take that on the trip**, whatever happens to the
import — and note that this session did **not** touch it, so it is exactly as verified.

The findings in §3 that change what the group should *do* — Toshogu's Saturday parking, Narita
Nakamise's real floor, Zao's 16:00 last admission, the ten-minute yukata window, the two unbooked
group rates — are worth passing to the trip leader **by hand, this week**, independently of whether
the app import ever runs.

---

## 8. Revision — 4 September 2026

**The tour agent changed the itinerary the day after this handoff was written.** `ITINERARY_CHANGE.md`
is the authoritative record; this section is the summary.

**Four of seven hotels changed.** Night 1 was renamed (same property). Nights 2 and 4 moved to
different properties in the same towns, so the town-level research transfers. **Night 3 moved
prefecture** — Iizaka Onsen, Fukushima to Zao, Miyagi — which puts the entire Iizaka cluster
off-itinerary. **34 records were retired, none deleted**, each flagged `"retired": true` and declared
in a `removedFromDay` manifest for import under **"Removed from this Day"**.

**Ginza was added as a declared Day 7 backup** for Shisui Premium Outlets, researched to the same
depth (27 places, 4 must-see, 13 buys, 2 loops, full essentials). Both coexist. **Recommendation:
keep Shisui** — a 45-seat coach cannot stay in Ginza (15 minutes, drop-off only, pre-booked), and the
hour saved inbound comes back with interest on the run to Tomisato.

**Nearby places were pushed out to a 30-minute walking radius**, taking places from 253 to 503.

### Revised totals

| | Before | After |
|---|---:|---:|
| places | 253 | **503** |
| mustSee | 52 | **60** |
| shopping | 63 | **94** |
| subRoutes | 15 | **17** |
| essentials | 29 stops | **33** (29 active + Ginza + 3 retired) |
| outfitByStop | 29 stops | **33** |
| unique ids | 383 | **674** — 241 reused from the seed, 433 new, zero collisions |

`python3 validate_research.py day*.json new-hotels.json expand-*.json` → **0 errors, 2 warnings**
(both warnings are retired records whose walk legs exceed the new 30-minute cap, deliberately left as
researched).

### New files in the bundle
`ITINERARY_CHANGE.md` · `new-hotels.json` + `notes-new-hotels.md` · `day7-ginza-backup.json` +
`notes-ginza.md` · `expand-d12.json` · `expand-d34.json` · `expand-d56.json` · `expand-d78.json` +
their four notes files · `validate_research.py` **v2** (v1 kept as `validate_research_v1.py.bak`).

---

## 9. Third-party map harvest — 4 September 2026

`slm37102/tohoku-trip-map` (**Trip 1, 15–22 Aug 2026** — different dates, different hotels) was
harvested for research value under RESEARCH_BRIEF §1's rule: *a source of research, never of Trip 12
facts.* **22 candidates were checked one at a time against operator and official sources.**

**Result: 33 new places, 5 new buys, and 17 corrections to records we already held.** Three new
batches — `topup-naruko.json`, `topup-tsukuba-shinjuku.json`, `topup-misc.json`.

**IMPORT ORDER MATTERS.** Each top-up batch carries an `appliesAfter` block and must be imported
**last**, after every `day*`, `new-hotels` and `expand-*` batch. The 17 corrections deliberately
reuse existing record ids; applied earlier, last-write-wins lets the stale value win.

### The two findings that justify the whole exercise
1. **Waseda Sajiki-yu is closed 3–10 September 2026** for source maintenance — over our night *and*
   dawn. Our own record sold it as the fallback bath. It would have walked the group to a locked door.
2. **The Shisui coordinate is resolved and `notes.md` §5's warning is withdrawn.** The seed geocoded
   the 酒々井町 **town polygon**, not the mall — wrong by ~2,392 m. Five independent sources agree
   within 554 m of 35.714/140.294. 15 records corrected; the stop record `21c5d54201ee` must be
   fixed in `days[].items[]` by the deploy session, like `184f9cf0f25a`.

### Four errors it exposed in OUR research
Our Don Quijote Kabukicho record cited **shop_id 195 — 西帯広, Hokkaido** (correct: 29). The Expo
Center forecourt records say ¥500; it is **¥600 adult / ¥300 child**, and the two records are
near-duplicates on one coordinate. Our Abe Kamaboko record was the **Sendai** branch only. Our
Tsukuba station-mall record claimed hoshi-imo and natto sweets that are **not in that shop's range**.

### And the naming curiosity
**和楽足湯 is read わらしゆ — WARASHIYU.** Obanazawa City prints the furigana. Our kanji was right and
our romanisation was wrong; theirs was right. It is a compression pun.

### What was dropped, at the user's request
All sport content — 12 climbing gyms, 8 gear shops, per-hotel running routes, the `runs` map layer.
**One exception kept: Ishii Sports** (石井スポーツ 登山本店, Jimbocho), as an ordinary shop record.
Verified 10:00–20:30, 無休 — their handoff had left it unverified. **It is not reachable inside the
Day 7 itinerary**: Tsukiji→Jimbocho is 22 minutes door to door each way, so 44 of the group's 60
Tsukiji minutes would be transit. The window that works is the free evening of **Sun 13 Sep from
Shinjuku Granbell — Toei Shinjuku line, direct, 10 min, ¥220.** The record says so.

### Of their 22 candidates
4 were **wrong as stated**, 6 needed **correcting**, 6 we **already had**, 6 **verified clean**.
Notable misses: "Egao Shokudo, late ramen and gyoza" is ゑがほ食堂, a soba-and-donburi diner closing
**20:00**; the Naruko gorge lookout is **09:00–16:00**, not "always accessible"; Torikizoku is
**¥390** since May 2025, not ¥370; and Taki no Yu's "150-year-old cypress" building was **rebuilt in
1974**.

### New document
**`APP_ROADMAP.md`** — what the app needs so nothing researched has to be thrown away, ordered by how
much existing research each change unlocks. P0 is the four things that silently lose data today:
`removedFromDay`, `backupFor`, record precedence, and a coordinate state for "confidently wrong, now
fixed". P1 is what turns facts into advice — ranked `top3`/`eat3` recommendations, a `needsRide`
verdict, `snack` as its own purpose, and negative knowledge as first-class data.

---

## 10. Per-stop summaries and searchability — 4 September 2026

### The five-line summary now exists for every stop
`trip12_app_seed.json` carried four lines of per-stop prose — `x.mustDo`, `x.mustEat`, `x.mustBuy`,
`x.mustSee` — for the 29 original stops. Good writing, stranded in a block the app ignores, and
**our batches never carried it forward**. It also had no `snack` line, which on an all-meals-included
coach tour is the only food question a traveller actually has.

**Now: 33 stops × 5 lines (`do` · `eat` · `snack` · `buy` · `see`) = 165 lines**, in
`summaries-d14.json` (16 stops) and `summaries-d58.json` (17 stops). Coverage is complete: **29
active + 1 backup (Ginza) + 3 retired**. Every line is under 500 characters and built only from
records already in our batches — synthesis, not new research.

**196 corrections were logged against the seed's prose**, each in a `correctedFromSeed` array on the
stop. The ones that change what someone does:

- **Narita** — the seed says do the souvenir run *before* security. Narita Nakamise is South Wing 3F
  **airside**, so the whole omiyage plan moves to 09:50–10:25 after immigration.
- **Toshogu** — the Saturday coach ban means ~50 minutes on site, not 75, once the Nishi-sando walk
  is counted both ways.
- **Hitachi** — the seed inherited the app's nemophila error, and put the melon soft-serve at the
  West Gate kiosks when it is at Kinen no Mori, which opens 10:00 into a 09:30–10:30 stop.
- **Ouchi-juku** — Kintaro Soba is open on Fri 11 Sep; Misawaya has no closing day; Minatoya is
  10:30–16:00, not 09:30–17:00.
- **Matsushima** — a new finding: the cruise's **15:50 boarding call does not fit a 30-minute Godaido
  stop**, so Godaido is really 23 minutes.
- **Shibuya** — no source supports the crossing view from Scramble Square 2F; the free vantage is
  Mark City's 2F glass corridor. MAG'S PARK is now MAG8 at ¥1,800 (¥63,000 for 35).

**Seven stops have an honestly empty `snack` line** — an airport at 07:30, a hotel with no konbini
within 500 m, Zao Fox Village where food in hand is banned outside the feeding platform. Each says so
rather than padding.

### The review page is now searchable
With 526 places across 33 collapsible stops, a record could be present, correct and unfindable:
**Ishii Sports was the 28th row of a 28-row table inside a collapsed stop.** The page now has one
search box covering `name`, `nameJp` and `note` across places, must-see shots and shopping; selecting
a result jumps to the day, expands the stop and highlights the row. Searching Japanese matters —
these places are often more findable as 蒲鉾 or こけし than by a romanisation, and the romanisations
are themselves unreliable (和楽足湯 is **Warashiyu**, not "Waraku Ashiyu").

### Where Ishii Sports lives
`topup-misc.json`, `places[]`, id `tmisc-ishii-jimbocho`, **anchored to `Tsukiji Outer Market`**
(Day 7) because that is the nearest itinerary stop. 石井スポーツ 登山本店, Jimbocho, verified
10:00–20:30, 無休. Its `note` states plainly that it does **not** fit the Day 7 itinerary — 44 of the
group's 60 Tsukiji minutes would be transit — and that the window which works is the free evening of
**Sun 13 Sep from Shinjuku Granbell: Toei Shinjuku line, direct, 10 min, ¥220.**

### APP_ROADMAP.md updated
`stopSummary` is promoted to **P0 item 0** — it is the only place where 526 place records resolve
into a recommendation, and a traveller standing at Ginzan at 09:35 can read five lines but not 31
records. Full-text search is added as **P0 item 5**, with the Ishii case as the worked example.
