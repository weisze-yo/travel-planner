# notes-summaries-d14.md — the five-line `stopSummary` block, Days 1–4 plus the three retired hotels

**What this batch is.** `summaries-d14.json` carries a `stopSummary` block per stop with five lines —
`do`, `eat`, `snack`, `buy`, `see` — built for the app to render directly rather than for the unusable
`x` block the seed's prose lives in. Every line is under 500 characters, every line is non-empty, and
the file passes `validate_research.py` with 0 errors and 0 warnings (the validator ignores unknown
top-level keys, so that is a JSON-well-formedness check, not a content check — the content check is
this file).

It is the first-half companion to `summaries-d58.json`, and it matches that batch's field shape
exactly: `do` / `eat` / `snack` / `buy` / `see` / `confidence` / `correctedFromSeed` / `source`, with
`retired` and `retiredReplacedBy` in place of the sibling's `newStop` where a stop has left the
itinerary. **The two files do not overlap on a single key.** `Ooedo Onsen Monogatari Naruko Onsen
Kounkaku` — night 2's replacement — is the sibling's, and is not re-emitted here.

**The `snack` line is new.** On an all-meals-included coach tour every meal is already booked, so the
question that actually gets asked is *what do I buy and eat standing up in twenty minutes*. Each
`snack` line is judged against the stop's real clock window, and where a stop genuinely has none the
line says so instead of padding. **Three say it plainly:** Zao Fox Village (food in the hands is
banned outside the feeding platform, no kiosk, and the 30-minute radius holds exactly one record),
Hotel Kameya (nothing on the property and the bath town 13–17 minutes down a gorge) and Yoshikawaya
(no lit street, no arcade, shuttle stops at 18:00). Two more are honestly **thin** rather than empty
and say why: Zuiganji (no record of any stall inside the grounds) and Tsurugajo (a ¥600 tea, not
street food, and no record of anything on the Honmaru lawn).

---

## THE COUNT

| | |
|---|---:|
| Active stops named in the brief | 13 |
| Retired stops named in the brief | 3 |
| **Keys emitted** | **16** |

All 13 active stops had seed prose. One of them had it under the **wrong key**: the seed writes night
1 as `Hotel Metropolitan Haneda`, and the stop was renamed in place on 4 Sep 2026 to
`Hotel Metropolitan Tokyo Haneda`. **It is emitted under the NEW key**, with the rename recorded as
the first entry in its `correctedFromSeed` — which is the one difference from the sibling agent's
decision, and deliberate: the sibling declined to emit it precisely because the rename migration was
unowned. It is owned here.

The three retired stops each lead their `do` line with a sentence saying the stop is off the itinerary
and naming its replacement, so a reader who lands on one from the review page's "Removed from this
Day" group is never misled.

---

## Day 1 · Tue 8 Sep

### Haneda Airport — Terminal 3 — lands 21:55 · confidence high
**Carried forward unchanged:** the whole spine of the seed's four lines. The Visit Japan Web QR before
the hall, the one code covering immigration and the customs declaration, the Electronic Customs
Declaration gates, the 2F arrivals regroup, "nothing worth queueing for at 22:00", the Edo Koji
mock-Edo street being worth the detour even shuttered, and "do not shop here — Narita Day 8 is where
the chilled and heavy things belong". All of it is in `day1-haneda.json` and none is contradicted.

**Corrected:**
1. **The konbini is not in a basement.** The seed's "terminal konbini" is, in the earlier project
   text, a basement store. **T3 has no B1 convenience store at all.** The 24-hour one is **Air LAWSON
   on 1F in the Entrance Plaza**, landside, before security, one floor down from 2F arrivals
   (`55e8d4c12bc0`, official tenant page).
2. **The rooftop deck has NOT closed.** The seed says "the rooftop observation deck has closed by the
   time you land". The airport's own service page prints T3's 5F deck as **開場時間24時間** — the only
   Haneda deck open all night, since T1 and T2 both shut at 22:00 (`d1w30t3a`). This is the single
   most useful correction on Day 1, because it turns a dead 30 minutes into the one thing the group
   can actually do.
3. **Added the airside/landside store hours** the seed's one-word "konbini" glosses: 3F airside
   Seven-Eleven 07:00–21:00, 2F departures 06:00–23:30, Edo Koji's restaurants closing about 22:00
   (`essentials.closedNote`).
4. **Added the two other things trading at 21:55:** Izumi Tenku no Yu, a 24-hour natural onsen
   T3-直結 in Haneda Airport Garden at ¥4,800 adult / ¥2,000 child plus a ¥4,000 surcharge for
   02:00–05:00 — explicitly *not* doable in the transfer; and the Japan Promenade souvenir street,
   10:00–20:00 with restaurants 11:00–22:00, shut at **both** ends of this night (`d1w30t3b`,
   `d1w30t3c`).
5. **T3 stays an inference.** The seed's own summary says the app prints no terminal number, and the
   `do` line repeats it rather than letting it harden into a fact (`essentials.transport`,
   `notes.md` §1e).

**Thin:** the `snack` line has **no price**, because no page we hold prices Air LAWSON, so it says
"budget rather than quote". It is a real snack line all the same — a 24-hour konbini one floor from
arrivals is exactly the right answer at 22:30, and the useful part is the *comparison*: buy here,
because Daily Yamazaki beside the hotel lobby shuts at 23:00.

### Hotel Metropolitan Tokyo Haneda — night 1, arrives ~22:50–23:15 · confidence high
**Carried forward unchanged:** THE ROOFTOP as the thing that works whatever time you get in, its
24-hour card-key access and its skyline; Matsuya at HICity Zone B 2F, 24 hours, ticket machine, not
halal, beef and pork; Daily Yamazaki's one-minute walk and 23:00 close; the Ashiyu Sky Deck footbath
on the Zone E rooftop with its fence-free B-runway view; il CIELO's 06:00 breakfast; the locked street
entrance and the card key. All in `day1-haneda.json`.

**Corrected / added:**
1. **The key itself.** Emitted under `Hotel Metropolitan Tokyo Haneda`, with the rename recorded:
   JR East's official English name, same Haneda Innovation City Zone A address, phone 03-3747-1101
   unchanged, official site moved to `haneda.hotel-metropolitan.com`. A rename, **not** a hotel change
   (`renamedStops`, `ITINERARY_CHANGE.md` §1).
2. **Matsuya's "roughly 7% surcharge after 22:00" is dropped.** It has no record in any batch — the
   batch carries only the floor, the 24 hours, the ticket machine and the not-halal warning
   (`20dbdac555d5`).
3. **The footbath sells towels.** Official HICity hours are 05:30–23:30 and **towels are sold on site
   rather than provided** — the seed gives only "open until 23:30", and the operative fact for 35
   people arriving at 23:00 is ¥500 in coins (`971383114439`, `480f5e27bf81`).
4. **il CIELO has a LAST ENTRY of 09:30** and closes 10:00. The seed has the 06:00 opening; the
   last-entry cut-off is what makes pulling the 07:30 sitting forward safe rather than risky
   (`df8d1412618a`).
5. **THE ROOFTOP bans tripods and stepladders** — the operator prints it, and it matters for the
   Mission 5 videographer. Absent from the seed (`8928b51f8fcc`).
6. **Added the 6F coin laundry at ¥300–600** (open with the 24-hour gym — the cheapest laundry
   opportunity in eight days, on night 1 of eight) **and the 5F currency-exchange machine**, for
   anyone who landed without yen at 22:00 when the counters are shut (`d1a01hicity01`).
7. **Added what the 30-minute radius bought for the pre-08:30 window**, since the seed offers only the
   footbath: Anamori Inari's sen-bon torii and Okunomiya 8–9 minutes away (grounds 24時間参拝可能,
   office 09:00–16:00, so no goshuin and no charms), the 2.0 km Soramunade Haneda Ryokuchi riverside
   walkway 11 minutes out with an aircraft terrace, and the 1929 Haneda Grand Torii 5 minutes away
   with its 平和 plaque (`d1w30hma`, `d1w30hmb`, `d1w30hmc`, `052699865bda`).

**The `buy` line is the interesting one.** A hotel at 23:00 has nothing to sell, so rather than pad it
with the konbini the line uses the one genuine take-home in the radius: **Anamori Inari's goshinsuna**
— sacred sand from the Inariyama mound, weightless, flight-safe, no shelf life, self-serve because the
office is shut at both ends of the night, **no published price, so leave a coin** (`d1w30shop01`).

---

## Day 2 · Wed 9 Sep

### Tokyo Station — 09:15–10:05 · confidence high
**Carried forward unchanged:** Ekibenya Matsuri as the first move (Gransta 1F Central Passage, inside
the gates, 05:30–22:00, 150種類以上, tel 03-3213-4353); Gyuniku Domannaka at ¥1,620 as the No.1
seller, eaten on the 10:05; the shut-souvenir-units diagnosis; (NO) RAISIN SANDWICH at ¥1,580 for
four; and the 1914 Marunouchi domes with eight zodiac reliefs and the four cardinal animals missing.

**Corrected:**
1. **THE SEED DIAGNOSES THE PROBLEM AND MISSES THE ANSWER.** It is right that Gransta's
   雑貨・コスメ・サービス units run 全日 10:00–21:00 and are shut for the entire window, then falls
   back on the bento counters. The fix is four minutes away: **Maruzen Marunouchi Main Store in
   Marunouchi Oazo opens 09:00**, runs to 21:00, has no September closing day, 1F–4F, about a million
   Japanese titles and 120,000 foreign-language, tel 03-5288-8881, tax-free still at the till in 2026
   (`d2w30tka`, `ITINERARY_CHANGE.md` §6).
2. **Everything else in reach is shut, and the seed does not say so.** KITTE, the KITTE Garden roof
   terrace, Intermediatheque and the Marunouchi Naka-dori shops all open 11:00; Naka-dori's pedestrian
   Urban Terrace is weekdays 11:00–15:00; Tokyo Midtown Yaesu is B1 10:00 and 1F–3F 11:00; Coredo
   Muromachi 10:00–11:00; Fukutoku Shrine's goshuin desk 10:00–17:00; and the **Tokyo Station Gallery
   opens 10:00 — five minutes after the group should be on the platform** (`d2w30tkb`–`tkd`, `tkj`,
   `tkl`).
3. **Both prices are seed-level and flagged.** (NO) RAISIN SANDWICH ¥1,580 — the shop's own Gransta
   page 404s — and Gyuniku Domannaka ¥1,620 with its ranking (`d179bc1bcca5`, `6939f7433f8f`).
4. **Added the rally point:** Ginnosuzu, the Silver Bell Square on Gransta B1 inside the gates —
   Tokyo Station's own designated meeting spot, which is what a 35-person head-count before a
   reserved-seat Shinkansen needs (`d2tok001giner`).
5. **The dome choice is made.** The seed says "the North and South gates" without choosing; the batch
   records the **south** one as usually emptier, so that is the one named, with the shooting position
   (centre of the octagon, under the apex, back to the gates) (`819125747a61`, `9a4889e0da9f`).
6. **Two free things ARE open at 09:15**, neither in the seed: Tokyo International Forum's glass hall,
   07:00–23:30, 年中無休, free, nine minutes out; and the Imperial Palace outer garden twelve minutes
   each way — recorded with its honest cost, 24 minutes of walking out of 50 (`d2w30tke`, `d2w30tkf`).
   Nijubashi (32 min of walking), the East Gardens (26) and Nihonbashi (24) are all recorded as **not
   fitting** (`d2w30tkg`, `tkh`, `tki`).

**Not thin:** the `snack` line is short on variety by necessity — inside the gates there is nothing but
the bento and sweets counters — and it says so, then makes the operational point that buying at
Ekibenya Matsuri covers snack and Shinkansen meal in one queue.

### Sendai Station — 11:40–~12:00 · confidence medium
**Carried forward unchanged:** the 3F Gyutan-dori and Sushi-dori walk-through with its six named
specialists; the zunda shake as the one thing that fits 20 minutes with edamame at its September peak;
Hagi no Tsuki at ¥1,590 for six with 14 days 常温 against Kikufuku's frozen daifuku; and Aoba-dori
from the 2F West Exit deck as the day's only Sendai frame.

**Corrected:**
1. **THE SEED'S AOBA-DORI COORDINATE WAS IN THE PACIFIC.** It held 35.926, 140.882 — off Chiba.
   Replaced with the government gazetteer's own point for 青葉通 (`7a27a1e1055d`). The **sightline
   itself stays unverified** for September 2026 because of recurring redevelopment hoardings, and that
   is why this stop is the only Day 1–4 transit stop at `medium`.
2. **Added the free thing that actually fits:** the **AER Observation Terrace, 31F**, top of the
   145.5 m AER tower at 中央1-3-1, free, **10:00–20:00**, two minutes from the 2F west deck — so it is
   open at 11:40, and it is the single best use of a 20-minute in-station gap. Lifts are the
   bottleneck for 35 people (`d2w30sna`).
3. **The zunda shake's ¥420/¥530 is seed-level.** The batch record carries Zunda Saryo, its 3F Zunda
   Komichi position, retail 09:00–21:00 and café 10:00–18:30, and the three-minute drink — **but no
   price** (`a1d972705ada`). The line quotes it as indicative and the correction log says why.
4. **Aji Tasuke Honten is NOT IN THIS SLOT.** The 1948 shop that invented Sendai gyutan, 11:30–20:30,
   closed Tuesdays so Wed 9 Sep is fine — and 36 minutes of walking plus a 45-minute sit-down against
   a 20–35 minute stop (`d2w30snh`).
5. **Added the covered-arcade chain**, which matters in September heat and rain: Hapina Nakakecho
   198.6 m out of the west exit, Clis Road 284 m, then Marble Road Omachi, Brandome and Sunmall
   Ichibancho — units from 10:00, but 26 minutes of walking to reach the department-store belt
   (`d2w30snb`, `snc`, `sng`).
6. **Iroha Yokocho is a night place.** Hours are 店舗による and at midday a large share of the shutters
   are down, so a 12:00 visit is a photograph of an empty lane (`d2w30snf`).
7. **Rikyu's Sendai Station branch hours are unconfirmed** — the chain's own store list redirect-loops
   from this sandbox — so only the arcade's 10:00 opening is carried for it (`7021796b2233`,
   `notes2.md` §6.8).

**The `snack` line is honest about geography:** the only standing food inside the building is the
shake. Everything chewable — Abe Kamaboko's ¥300 hyotan-age on Clis Road, the Asaichi's ¥150 zunda
dango — is a ten- or five-minute walk each way, and the line prices that walk in minutes rather than
pretending it fits. Ito Shoten's ¥500 asa-ramen is named as **already gone**: 07:00–10:00 only.

### Matsushima Fish Market — 13:18–14:18 · confidence high
**Carried forward unchanged:** "order at the 1F counter and eat standing"; the market's own six
Kesennuma longliners as the September strength; the kaki burger as the market's own invention and the
honest *cooked* September oyster; kaki-shoyu and Sanriku Kaiho-zuke from the 1F souvenir wall as the
shelf-stable way home, with wakame as the volume seller; the whole tuna on ice as the picture; and the
450 m / 7-minute walk to Zuiganji being the whole reason this is the Matsushima market and not the one
25 km back in Sendai.

**Corrected — this is the most heavily corrected stop in the batch:**
1. **The kaki burger is ¥600, not ¥380.** The market's own menu. The ¥380 survives only on
   tourism-portal pages (`f017d1965514`).
2. **Maguro-don is ¥1,300–2,400**, rising to ¥3,900 for 極上海鮮丼, not the seed's ¥750–2,400 — and
   **生うに丼 ¥3,950 is a 4月〜8月末 item**, so it is off the menu on 9 Sep (`efa7e3c31a7d`).
3. **THE SEED'S CENTREPIECE IMAGE IS WRONG.** Its `mustSee` has "the ranks of charcoal grills in the
   Yakigaki House standing idle, waiting for the season". The operator writes
   「通年で食べ放題をお楽しみいただけますが、特に、11月～3月の旬の時期のおいしさは格別です」 — year-round,
   with Nov–Mar as the *peak*, not the season — and the weekday clock is 10:00–15:00, so **the grills
   are lit at 13:18**. It is also the **別館 annex, not the 2F** (`e5bb2ba00c92`).
4. **Two operator facts about that annex decide it for 35 people**, and neither is in the seed:
   「※お席のご予約は承っておりませんのでご了承願います」 — **seats cannot be booked at all**, so the group
   queues as walk-ins for a 45-minute sitting inside a 60-minute stop — and
   「牡蠣の育成の状況により、時期が異なる場合もございます」, i.e. **phone ahead**, because 9 Sep is outside
   the Nov–Mar season the operator itself flags (`topup-misc` correction to `e5bb2ba00c92`).
5. **The food hours are sharper than "around 15:00":** on a weekday the 1F counter takes orders
   09:00–15:00 while the annex and the 2F hall run 10:00–15:00, and **15:00 is a hard cut-off, not a
   last order** (`essentials.closedNote`).
6. **Added the 2F ramen counter** — the only sit-down room, all 1F food carried up self-service — with
   しょうゆラーメンミニ ¥600 as the cheap fallback for anyone who ate the 12:15 oyster set, plus
   かきラーメン ¥1,500 and ふかひれラーメン ¥2,200 (`d2fis001ramen`).
7. **Added the best unused thing on the peninsula**, two minutes away at 普賢堂13-13: the **Michinoku
   Date Masamune Historical Museum**, ~200 life-size waxworks, ¥1,000 / ¥500 / ¥300 for school
   groups, 09:00–17:00 with last admission 16:30, 無休, **capacity 300**, and the museum's own advice
   is to allow 30 minutes — it fits this hour **only** if lunch is a stand-up kaki burger
   (`d2w30fma`).

**The `snack` line is the strongest in the batch** because the venue is a stand-and-eat market: a ¥600
burger in the hand, plus the annex's full arithmetic so nobody commits 45 of 60 minutes by accident.

### Zuiganji Temple — 14:20–15:20 · confidence high
**Carried forward unchanged:** the 1609 Hondo for Date Masamune with Kumano cedar and Kyoto craftsmen;
the Seiryuden treasure hall to finish; the Shitchu Peacock Room and the 2008–2018 restoration; the
tuff cave tombs on the approach; the ¥500 goshuin and ¥1,200 seal book at the Kuri exit; the ¥900
group rate at 30+; and Kasho Sanzen's Matsushima Teramachi-Koji zunda shake as the one quick cold
thing on the approach.

**Corrected:**
1. **ACCESSIBILITY IS A HARD LIMIT the seed does not mention.**
   「車いすでの拝観可能な場所は宝物館のみ」 — a wheelchair user reaches the treasure hall and **neither the
   Hondo nor the Kuri**, and the goshuin desk is past the Hondo. It has to be said before the ticket,
   not at the step (`f7e2e77d4f16`, `notes2.md` §2k).
2. **NO DEDICATED PARKING.** 「専用駐車場はありません」, so the 45-seater sets down and parks elsewhere.
   The seed says nothing about the coach (`essentials.transport`).
3. **The group saving is named:** ¥900 at 30+ against ¥1,000 saves **¥3,500** at 35 adults, the
   1 April 2026 rise funded the treasure-hall refit, and the pre-2026 100+ tier no longer appears
   (`essentials.groupRate`, `notes2.md` §3).
4. **The seed's ¥360 zunda shake here is UNCONFIRMED** — no Kasho Sanzen page prices it and one review
   on the tourism-navi listing quotes about ¥280 (`d2zui001sanzen`, `notes2.md` §6.3).
5. **Two seed certainties are downgraded to medium:** whether the Seiryuden is inside the ¥1,000
   ticket is nowhere stated *in words* on the temple's own pages, and whether the cave tombs sit
   inside or outside the ticket gate is likewise unstated (`880a62f5b491`, `4651cfb8ab4d`). The
   Peacock Room carries its own caveat — 「期間を制限して公開」 — so its state on 9 Sep is unknown.
6. **Added the fix for the day's worst shopping squeeze:** Hagi no Tsuki over the same Kasho Sanzen
   counter, same ¥1,590 six-piece box, same 14-day 常温 life, bought inside a one-hour temple stop
   instead of a 20-minute Shinkansen-gate dash at Sendai (`d2sh001haginomatsu`).
7. **Added three neighbours:** Tenrin-in (free, 08:00–17:00, three minutes, Irohahime's temple, **two**
   goshuin, station two of the Sanriku Thirty-three Kannon circuit); Entsuin at 町内67, 年中無休,
   Apr–Nov 09:00–16:00, ¥500 or **¥400 at 15+**, Date Mitsumune's 1646 mausoleum with **no autumn
   colour** before late October; and **Yotokuin, which is 非公開** — walk to the gate, the moss and the
   cedar, but do not promise the Megohime mausoleum interior (`d2w30zgb`, `d2zui002entsu`,
   `d2w30zgc`). Also recorded and unused: Oshima over the Togetsukyo, and the Miyagi Matsushima Rikyu
   rooftop deck (¥400, 10:00–18:00, 20+ priced separately) (`d2w30zga`, `d2w30zgd`).

**Thin, deliberately:** the `snack` line. **We hold no record of any stall inside the grounds**, the
one thing on the approach is a cold shake with an unconfirmed price, and the two free neighbours sell
no food. The line says that rather than inventing a stall, and points at the market as where the hot
food should already have been bought.

### Godaido Hall — 15:22–15:52 · confidence high
**Carried forward unchanged:** the two lattice-floored sukashibashi and the reason they exist; the
absolute shoe rule and the wheelchair exclusion; the hall opening once every 33 years; the seaward
composition with the vermilion Fukuura bridge to the left; and the twelve zodiac animals carved at
their compass directions.

**Corrected — four price/location fixes:**
1. **Genzo's gyutan korokke is ¥400, not ¥350** (the shop's own site), its grilled oysters are
   ¥300–400 but seasonal, and **the kaki chowder is 夏季休止中** (`62aaa38bb809`).
2. **Pensee's oyster curry bread is ¥380, not ¥300 — and it is not on this approach.** It is on the
   1F of Matsushima Rikyu Umi-no-Eki at 町内75-14, about 200 m from the cruise pier, 10:00–17:00,
   不定休 (`3cbd10a22c0e`).
3. **Matsushima Kamaboko Honpo opens 9:30, not 09:00**, its hand-grilling counter is **¥400** a stick
   rather than the seed's ¥300, and **PARTIES OF 10 OR MORE MUST PRE-BOOK it** — which for 35 people
   means a phone call weeks out, not turning up (`16b64d767bbf`, `d2god001matsukama`).
4. **The fix for that, added:** **Abe Kamaboko's own Matsushima Teramachi branch** at 松島町内58 does
   手焼き笹かま at **1枚300円(税込)**, about 10 minutes, and **「予約は不要です」** — the grill 35 people can
   actually walk into, three minutes from here toward the pier. Its 9:00–18:00 hours are Miyagi Navi's
   rather than the operator's and **no closing day is published anywhere**, so it is medium
   (`tmisc-abe-matsu`, `tmisc-abe-teyaki`, `notes-topup-misc.md` §Matsushima).
5. **The seed implies fresh sasakamaboko can be taken home.** It cannot: fresh kamaboko is chilled,
   only the vacuum-packed shelf-stable line flies, and which packs are which is not stated on
   Matsukama's site — so the `buy` line makes it a question to ask at the till.
6. **Added the only room here that can sit a coach party down:** Gyutan Sumiyaki Rikyu Matsushima
   Godaido, 町内112-2, 年中無休, lunch 10:30–15:00 then 15:00–19:00 L.O. 18:30, fifty seats on 1F plus
   group seating upstairs with a bay view (`d2god002rikyu`).
7. **Added two paid neighbours:** Kanrantei and the Matsushima Museum at 町内56, two minutes, Apr–Oct
   08:30–17:00, 無休, ¥300 adult and **¥250 at 30+**, tea from ¥500 on top; and Fukuurabashi, the
   252 m vermilion bridge four minutes east, ¥300, 08:30–17:00 — recorded with the honest budget:
   bridge out and back is about 20 minutes of a 30-minute stop, so it is the bridge and the island
   gate, never the island loop (`d2w30gda`, `d2w30gdb`).

**The `see` line keeps both frames** the batch found: the postcard one from the seaward rail with the
15:22 sun WSW at 28° behind the right shoulder, and the one nobody takes — straight down through the
lattice between your own shoes.

### Matsushima Bay Cruise — Nioumaru course — 16:00–16:50 · confidence high
**Carried forward unchanged:** 16:00 as the last boat; board by 15:50 with the guide holding all 35
tickets; the 50-minute loop from the central pier two minutes from Godaido; the +¥600/+¥300 Green-seat
upgrade as the only purchase that changes the experience; Nio-jima's pipe-smoking guardian and
Kanejima's four surf-cut caves; and "feeding the gulls has been discontinued, so do not promise it".

**Corrected:**
1. **THE GROUP FARE IS ¥1,350, not ¥1,500.** 「団体（15名以上）1割引」 is on the operator's own fare
   table, so the seed's "groups of 15 or more get 10% off … so ask" understates it: the discount is
   published, and it is about **¥5,250 across 35 people**. The Green supplement is **not** discounted;
   web booking carries its own further discount and group bookings are called back to confirm
   (`essentials.groupRate`, `notes2.md` §1).
2. **THE BOARDING CALL COLLIDES WITH GODAIDO, and nothing in the seed or the app says so.** Boarding
   is 15:50; Godaido is scheduled 15:22 **for 30 minutes**; the pier is 280 m and 5 minutes on. So the
   group must leave Godaido at about **15:45 and the real Godaido stop is 23 minutes, not 30**. This
   is a synthesis of two records we already hold (`essentials.transport` against the app's Day 2
   times) and it is the one new arithmetic finding in this half of the batch.
3. **Matsushima Kushiya is not "directly opposite the pier":** 1F of Matsushima Rikyu Umi-no-Eki,
   about 200 m and three minutes away — and it **shuts at 17:00, the same minute the coach leaves**,
   which is sharper than the seed's "soon after the last cruise returns" (`2e5d5567ff7b`).
4. **Kanejima's coordinate is DOWNGRADED from the seed's "verified" to unconfirmed** — the GSI
   gazetteer returns no entry at all for 鐘島 — and **Nio-jima's was corrected by about 3.5 km** to the
   gazetteer point 38.3281, 141.0869 in Shiogama waters off the Urato islands (`680c2696e33b`,
   `7dac0410cca7`).
5. **The seed asks for a scrubbed-cruise fallback and names the wrong ones.** It offers the Zuiganji
   museum or Entsuin, both behind you by 16:00. The one at the pier is **Kaki Matsushima Kouha's Sky
   Restaurant**, 磯崎75-14, directly in front of the 遊覧船乗り場, 11:00–17:00 Tue–Fri, **closed
   Mondays** so open on a Wednesday, oysters year-round at ¥2,200–2,900 — and it seats a group
   (`d2cru002kouha`).
6. **Added Futagojima**, gazetteer-verified at 38.3646, 141.0646 about 600 m off the pier: the first
   islet of the loop, and also visible from the Godaido seaward rail thirty minutes earlier, which
   makes it the day's easiest before-and-after pair (`d2cru001futago`).
7. **Added the after-17:00 reality:** every shop in Matsushima closes at 17:00, and the only things
   still trading are **FamilyMart Matsushima Kaigan-dori** at 普賢堂32-4 — 24 hours, 22 free spaces so
   the coach can pull in, ATM, toilets, five eat-in seats — and **Matsushima Kaigan Station** six
   minutes from the pier, which is also the escape route to Sendai in 40 minutes (`d2w30bcb`,
   `d2w30bca`).

**The `snack` line carries the clock, not just the food.** Abe's ¥300 no-booking grill takes ten
minutes, and ten minutes do not exist between 15:52 and a 15:50 boarding call — so the line tells the
reader to do it **inside the Godaido half-hour**, on the way past.

---

## Day 3 · Thu 10 Sep

### Ginzan Onsen Street — 09:30–11:30 · confidence high
**Carried forward unchanged:** Mission 1 on Shirogane Bridge in the first ten to twenty minutes and the
reason (09:30–10:00 is the quietest the bridge gets, and by 11:00 the day-trip coaches make it the
worst choke point); the 400 m car-free street on the right bank and the five minutes on to Shirogane
Falls; Nogawa Toufuya's ¥250 standing-eat namaage, cash only; Haikara-san no Curry Pan at about ¥250;
Meiyu-an beside the bridge, 08:00–17:30; Yagihashi Shoten's Yamagata jizake; the double row of wooden
ryokan with Notoya's kote-e facade and lookout tower; and Shirogane Falls at 22 m, splitting in two.

**Corrected:**
1. **THE FOOTBATH'S NAME IS WARASHIYU.** 和楽足湯 is read わらしゆ — Obanazawa City prints the furigana
   「和楽足湯(わらしゆ)」 — because 足湯 is folded into a compression pun rather than read separately. The
   seed's "Waraku Ashiyu" is the naive character-by-character reading and is **wrong**. The kanji it
   holds is right. Everything else stands: 06:00–22:00, free, source-fed, on the river by Shirogane
   Bridge, and **bring your own towel, because nothing on the street sells one** (`topup-misc`
   correction to `70e89c03f9e4`, `notes-topup-misc.md` §3).
2. **Nogawa Toufuya opens 08:30, not 07:30** (Rurubu: 「8時30分～売り切れ次第終了」). The conflict is
   **recorded rather than resolved**: Yamagata Prefecture's own page lists the shop closed **Mondays**
   with a ¥160 cotton-tofu pack as its only product, and the two cannot both be current. Thursday is
   unaffected either way (`843768da18f4`).
3. **KARINTO-MANJU IS NOT SHELF-STABLE and ¥790 is stale.** The maker's own shop lists 6 for **¥900**,
   10 ¥1,470, 12 ¥1,760, 16 ¥2,330, with 賞味期限90日間 at −18 °C and **three days once thawed**. The
   seed's "shelf-stable and ideal for carrying back to Malaysia" is wrong — buy it hot at the counter
   (`f3d29551b6bd`).
4. **Yagihashi's tastings start at ¥300, not ¥500**, bottles run ¥450–1,890, 銀山新畑448, 08:30–18:00,
   no closing day — and a bottle is over the 100 ml cabin limit, so checked baggage only against 25 kg
   and five more shopping days (`06a9959f36e3`).
5. **The curry pan's home is settled.** はいからさん通り is a **shop**, not a street; it closed to
   relocate; and Yamagata Prefecture's official tourism site prints
   「購入は明友庵又は大正ろまん館でどうぞ」 — **including the coach lot**, which opens 09:00 against a 09:30
   arrival (`topup-misc` `d3shopcurry1`).
6. **The coach question the seed leaves open is answered.** No vehicle of any size enters the street;
   the transfer is at Taisho Roman-kan (10 coach bays plus 100 cars, **lot** 08:30–17:30, **building**
   09:00–17:30); the ¥500 all-day on-demand shuttle is run by Ginzanso on 080-9283-2268; and the
   **winter park-and-ride ENDED 1 March 2026** with no 2026-27 period announced, so it does not apply
   on 10 September (`essentials.transport`, `notes3.md` §2).
7. **Added the ¥7,000 two-hour official Ginzan guide**, through Obanazawa City Tourism and Products
   Association on 0237-23-4567, two weeks ahead — two hours is exactly this stop's length
   (`essentials.groupRate`).
8. **Added what the widened radius bought above the street, all free:** the **銀鉱洞**, a lit walkable
   17th-century silver working 15 minutes past the falls, open in September and closed only from first
   snow to yama-biraki — the thing the name *Ginzan* actually refers to; the **夏しらず坑** cold-air adit
   locals call 天然のクーラー; the **疎水坑** drip tunnel; **せことい橋**, where both falls show at once; and
   **籟音の滝**, with the only tables above the street. **こうもり穴 is 通行止め** and **Wamoyou is closed
   Thursdays** (`d3ginzanmine1`, `d3w30gin01`–`05`, `d3w30gin12`).
9. **Takimitei is out on two counts:** the one place you look *down* on the ryokan rows is **closed
   Thursdays** and opens 11:00 anyway, against an 11:30 departure — so the ten-minute climb is a
   viewpoint only (`d3w30gin13`).

**Also carried:** Izunohana at 銀山新畑440 is the only house on the street serving the **tempura soba the
app promises at 12:00** — 11:00–18:00, L.O. 17:30, closed Wednesdays so open Thursday — but 11:00 is
the last 30 minutes of the stop, and the 12:00 lunch is a coach transfer away at Taisho Roman-kan
(¥1,800 tempura soba, group 御膳 ¥2,100–3,000). Both are flagged as **inference** in the batch, since
the app names no lunch venue.

**Deliberately left out:** the seed's claim that Obanazawa watermelon is worth looking for at the
Roman-kan produce stand. Peak shipping is 7月下旬〜8月中旬 and it is **finished** by 10 September.

### Zao Fox Village — printed 15:10–16:40, real 80 minutes · confidence medium
**Carried forward unchanged:** the whole shape of the seed's four lines. Two circuits, high then low,
because the foxes move with the sun; the gate briefing and every rule in it (keep walking, never crouch
or sit to fox level, remove dangling straps and charms, no food or drink in the hands, do not reach
out — they bite); "nothing — this is a genuine no-eating stop"; the entrance shop taking cards when
admission does not, with the real-fur warning and the photography ban; the hollow seen from the upper
path; the full list of no-photography zones; and the September moulting warning.

**Corrected / sharpened:**
1. **The seed flags the closing conflict; the batch settles the sourcing.** The operator prints
   「9:00~16:30(最終入場16:00) 夏季営業」, and Miyagi Prefecture, Shiroishi City, Zao Town and Jalan all
   place 10 September inside the summer period. **Every page still showing 09:00–17:00 and ¥1,000 —
   Shiroishi City tourism, Miyagi DMO, Discover SENDAI, Jalan — is stale**, and that stale 17:00 is
   very likely where a 16:40 departure came from. Real stop **80 minutes**: board 16:30, regroup call
   about 16:15 (`essentials`, `notes3.md` §1).
2. **Added the cash arithmetic** the seed's "Admission ¥1,500, cash" leaves implicit: **¥52,500 in
   notes** for 35 people, **no group rate published**, no reservation required or accepted, and the
   shop is the only card counter on site (`essentials.groupRate`, `tickets`).
3. **The fox-holding experience is RESOLVED as unavailable**, where the seed leaves it open: 11:00 and
   14:00 only, about 5 minutes, ¥1,000 cash, against a 15:10 arrival — brief it on the coach rather
   than letting 35 people queue at a closed counter. **Medium only**, because the operator's own
   notice page is robots-blocked to us: phone 0224-24-8812 (`d3zaohug1`, `notes3.md` §4–5).
4. **Added the elevated feeding platform** as the single place feeding is allowed, with the operator's
   own reason — feeding anywhere else teaches the foxes to jump at people — and the note that it is
   also the one frame where foxes look *up* at the camera (`d3zaofeed1`).
5. **Added the small-animal section** (rabbits, miniature horses, goats, guinea pigs) outside the
   free-roam enclosure: the answer for anyone in 35 who will not walk among loose foxes but does not
   want 80 minutes on the coach. Photography banned there too (`d3zaosmall1`).
6. **Added the operator's own wording behind the rules**, which is what makes a group keep them:
   「Spending a long time at eye level with the foxes is dangerous, as they may gather and act
   aggresively towards you」 and 「Foxes have the tendency to break and bury objects they find on the
   ground, so make sure not to drop anything」 — so a phone on a wrist strap is a phone in a hole
   (`notes3.md` §4, `outfitByStop`).
7. **THE WALKING RADIUS IS EMPTY, and saying so is the answer.** One record inside reach:
   **弥治郎こけし村** at 白石市福岡八宮字弥治郎北72-1, free entry, paint-your-own kokeshi ¥850 including the
   blank, 09:00–17:00 Apr–Oct, closed Wednesdays — filed with a **bus** leg, because it is 4.2 km
   straight line and 6–7 km by mountain road (`d3w30zao01`, `ITINERARY_CHANGE.md` §6).
8. **The Castle-kun community bus runs Tuesdays and Fridays only**, so on a Thursday the coach is the
   only way in or out and nobody can make their own way back (`essentials.transport`).

**The `snack` line is honestly EMPTY**, and the rule is the reason rather than an absence of shops: no
kiosk, no restaurant, and food or drink in the hands forbidden outside the feeding platform. The line
turns that into the two useful instructions — water aboard beforehand, and plan to change before the
18:00 dinner, because the animal smell gets into fabric.

**Not claimed:** that anything is on sale at Zao Fox Village other than shop merchandise. We hold no
record of water, drinks or food being sold on site, so the line says "bring water aboard beforehand"
rather than "buy water here".

---

## Day 4 · Fri 11 Sep — and note the day now starts an hour earlier

`ITINERARY_CHANGE.md` §2: **breakfast 07:30 → 07:00, departure 08:30 → 08:00**, against a transfer to
Goshikinuma that grew from ~1 h 30 m / ~68 km to **~2 h / ~130 km** because night 3 moved to Zao. The
10:00 arrival is preserved, with nothing spare — which is why the Goshikinuma `do` line carries it.

### Goshikinuma Ponds — 10:00–11:00 · confidence high
**Carried forward unchanged:** be realistic — the hour buys Bishamon-numa and little else; the paved
barrier-free path five minutes to the deck and rowboat pier, then the north-shore boardwalk; the
west-end drop as the alternative (Yanagi-numa, Ao-numa, Ruri-numa, Benten-numa); the turquoise
"Goshikinuma" soft-serve, **bright pond-blue, not matcha**, as the group-photo prop; Aizu yama-shio at
about ¥450 from Urabandai Bussankan; the honest warning that the east trailhead plaza sells only maps
and postcards and the visitor centre has no shop at all; and Bishamon-numa's cobalt-emerald water from
dissolved volcanic minerals under Mt Bandai's blown-out crater wall.

**Corrected / added:**
1. **The trail figure is the visitor centre's own:** about **4 km and 1 h 10 – 1 h 30 one way**, which
   refines the seed's "3.6–4 km and 90 minutes". Conclusion unchanged (`essentials.transport`).
2. **The west-end alternative becomes concrete rather than a suggestion:** the route bus links
   五色沼入口 and 裏磐梯高原駅 in about **seven minutes, roughly hourly**, and the group's own coach can
   do the same — putting Yanagi-numa 3 minutes in, Ao-numa 18, Ruri-numa 21 and Benten-numa 30, i.e.
   **four blue ponds in the same hour** (`d4w30gos04`–`07`, `notes-expand-d34.md` §1.5).
3. **THE PARKING IS TWO LOTS AND ONLY ONE TAKES A COACH.** The seed's 92-space car park is the
   **五色沼入口観光プラザ**; the **Urabandai Visitor Centre** publishes its own
   「普通車70台 大型バス5台 身障者用3台」, usable 24 hours, with free 24-hour toilets including an accessible
   one. **The five large-bus bays are at the Visitor Centre** — that is the number the driver needs
   (`d4goshiplaza`, `51fcab58541f`, `notes4.md` §4g).
4. **Added the Visitor Centre's calendar:** 09:00–17:00 April–November, **closed Tuesdays** (open if
   the Tuesday is a holiday, shut the next day) — so Friday 11 Sep is open, and it still has no shop.
5. **Added the rowboat with its honest cost:** hand-rowed boats on Bishamon-numa beside the first
   deck, running except in winter, but a **30-minute commitment out of a 60-minute stop** — a sub-group
   option, and the association publishes no hours, price or operator (`d4goshiboat0`).
6. **THE DALI COLLECTION NEXT DOOR IS SHUT.** The Morohashi Museum of Modern Art is closed for
   renovation **from 10 November 2025 until about April 2027**, so nobody should walk over expecting
   the ¥1,300 galleries, and its car park and lakeside grounds are not a substitute (`d4w30gos03`,
   `notes-expand-d34.md` §1.1).
7. **Added the wet-weather neighbour:** the Bandaisan Eruption Memorial Museum at the east trailhead,
   on the 1888 eruption that made these ponds, with a 42 m cylindrical-screen film — 08:00–17:00
   April–November, last entry 16:30, ¥600 museum / ¥800 for the 3D World — but its closing days are
   **不定休**, so telephone 0241-32-2888 (`d4w30gos02`).
8. **Aka-numa is the exact limit and does not fit:** 5 minutes to the Bishamon deck plus 25 more, so
   out and back is 60 minutes of walking against a 60-minute stop (`d4w30gos01`).

**Thin on price:** the soft-serve has **no published price** and the yama-shio's ~¥450 is the seed's
and unverified, both flagged in the lines themselves. The `snack` line compensates with what we do
hold: the plaza's 09:00–16:30 window, the free 24-hour toilets, and the honest warnings — nothing on
the trail, mosquitoes and horseflies still active, **bears in the area** per the visitor centre.

### Tsuruga Castle (Tsurugajo) — 13:10–14:40 · confidence high
**Carried forward unchanged:** Mission 3 shot FIRST, before the ticket; the keep's five floors of
local-history museum, the Tetsumon, the reconstructed Minamihashiri-Nagaya and Hoshii-yagura, the 5F
observation deck and Rinkaku; the ¥360 group rate at 30–99; Rinkaku's ¥600 matcha with a jouyo-manju
of grated yam and rice flour; Tsurugajo Kaikan as the shopping stop with akabeko, okiagari-koboshi and
Aizu lacquerware; kozuyu as the dish to have explained; the akagawara tiles relaid in 2011 as the only
red-tiled keep in Japan; and the Rokabashi bridge over the fan-sloped ogi-no-kobai wall.

**Corrected:**
1. **THE SEED'S SAKE GEOGRAPHY IS WRONG BOTH WAYS.** Miyaizumi Meijo is not "next to the castle": GSI
   puts 東栄町8番7号 about **340 m and 5 minutes from the coach bay** and roughly **600 m from the
   keep**. It publishes no shop hours, no phone and no price list, and **寫樂 is an allocation label
   frequently unavailable at the brewery itself — do not promise the group a bottle** (`977d07731774`,
   `notes4.md` §4d).
2. **Suehiro Shuzo Kaeigura is not a walk-in tour and not walkable.** Fixed departures at 10:00,
   11:00, 13:00, 14:00, 15:00, 16:00 (March–November), 「団体様は要予約」, closed the 2nd Wednesday so
   open on the 11th — and **1.2 km / about 18 minutes each way**, i.e. 38 minutes of a 90-minute stop
   before you see anything. Café 蔵喫茶 杏 10:00–16:30, L.O. 16:00, tel 0242-27-0002 (`7d9f3decc2be`,
   `notes4.md` §4c).
3. **THE PRESERVE THE SEED RECOMMENDS DOES NOT TRAVEL.** Boxed nishin no sansho-zuke ships 「冷蔵便」
   with 「出荷日より14日」 — refrigerated, 14 days — against four more coach days and a 7-hour flight.
   The version that flies is 会津高砂屋's 「にしん 山椒漬 ドライ 70g 864円（税込）」 or its three-kind
   assortment at ¥1,188 (`8cf52a1d9c2e`, `d4shopdryhrr`, `notes4.md` §4h).
4. **The group rate is confirmed and priced:** ¥360 / ¥135 at 30–99 against ¥410 / ¥150, ¥460 with
   Rinkaku against ¥520, ¥730 for the three-facility pass with Oyakuen, and holders of a Japanese
   disability certificate free — about **¥1,750 saved on the keep alone** at 35 adults
   (`essentials.groupRate`, `notes4.md` §4j).
5. **Rinkaku's 呈茶 starts at 08:30** and runs to 16:00 on the tourism bureau's own notice; the seed
   has the ¥600 and the 16:00 cut-off but not the opening (`d8d4384afd4d`).
6. **MISSION 3 HAS NO RAIN PLAN IN THE SEED** and the Honmaru lawn has no cover of any kind. The
   declared answer is the building the coach is already parked at: **Tsurugajo Kaikan**, 追手町4-47,
   **20 large-bus bays** plus 100 cars, 09:30–17:00 from 11 April to 10 November, tel 0242-28-2288 —
   backed against the souvenir-hall wall rather than the glazed frontage, at zero transfer cost.
   Secondary, if the keep must stay in shot: the **Minamihashiri-Nagaya**, the only roofed space inside
   the castle, about 18 m × 2.5 m, so **two rows maximum** (`d4w30tsu02`, `d4msrainfall`,
   `d4tsuruganag`).
7. **Added the free things around the paid keep:** Tsurugajo Inari-jinja's vermilion torii tunnel and
   600-year-old zelkova between the north gate and the Honmaru, the Kojo-no-Tsuki monument,
   Kita-demaru and the Ote-mon site 12 minutes round the moat, and a free **2 km / 30-minute
   inner-moat lap** that is shaded most of the way in mid-September (`d4w30tsu04`–`07`).
8. **Fukushima Prefectural Museum is the wet-weather plan on paper only:** 4 minutes from the coach
   bay, 09:30–17:00, last entry 16:30, ¥400 adult and free for all school students, closed Mondays so
   open on the 11th — but its galleries want 60–90 minutes, which this slot does not have alongside
   the castle (`d4w30tsu01`).

**Thin:** the `snack` line, and it says so. **We hold no record of a stall on the Honmaru lawn.** What
exists is Rinkaku's ¥600 tea inside the park and the Kaikan's restaurants, souvenir hall, gelato and
last toilets at the coach bay — so the line's real content is the instruction: **fill water bottles at
the Kaikan on the way IN**, eight minutes before the photo, not on the way out. The temperature figure
in `outfitByStop` (28–30 °C, ~79 % humidity) is not quoted, because the app's revised Day 4 reference
is 26°/21° and the two disagree; "almost entirely unshaded" carries the same instruction without
picking a number.

### Ouchi-juku — 14:40–16:40 · confidence high
**Carried forward unchanged:** the full 500 m of thatch, about 40 kayabuki farmhouses, an Important
Preservation District since 1981; the water channels down both sides; the Miharashidai climb budgeted
at 20–25 minutes; takato / negi soba eaten with a whole raw spring onion for chopsticks; Misawaya's
¥1,500 in a 350-year-old farmhouse and Yamagataya's ¥1,250 cash-only; Man'ya's ~¥550 iwana and
Minatoya's shingoro; "buy before 16:00 — several tills close before the street does"; and the slot
being the best light of the trip, 37° down to 14° with golden light from about 16:00.

**Corrected:**
1. **KINTARO SOBA YAMAMOTOYA IS OPEN ON FRIDAY 11 SEPTEMBER.** The seed's "closed Thursdays AND
   Fridays, so it will be shut on 11 September" is wrong. The shop is **不定休** on its own site and
   five independent listings, and it **publishes its actual September closures**: 2, 3, 4, 8, 10, 17,
   18, 24, 25, 30. The 11th is not among them. The Thu+Fri *pattern* is real — 3/4, 17/18, 24/25 —
   which is almost certainly where the seed's claim came from, but the week of the 7th is the
   exception. The dates carry 「※天候やその他理由により急遽お休みになる場合があります」, so still ring
   0241-68-2912 (`d4ouchikinta`, `notes4.md` §1a).
2. **MISAWAYA HAS NO CLOSING DAY.** The seed says "usually closed Wednesdays"; the operator's own site
   prints 営業時間「午前9時30分～午後4時」 and **定休日「なし」**. The seed's conclusion survives but the
   reasoning inverts: Misawaya is the **last kitchen serving**, to 16:00, and therefore the fallback
   if the group runs late rather than the one to write off (`f7248e95eb9c`, `notes4.md` §4b).
3. **AJIDOKORO MINATOYA IS 10:30–16:00 with L.O. 15:30**, not the seed's 09:30–17:00, at 大内山本34,
   tel 0241-68-2933 — fifty minutes into a slot that runs to 16:40, which is exactly why eating goes
   at the front (`f3ae598d5f82`, `notes4.md` §4e).
4. **Yamagataya's group menu is real and unusable:** 「AM 9:00〜PM 3:30」, the only house here with a
   published group page — **10 to 50 people**, sets ¥1,700–¥2,800 a head, **cash only**, everyone on
   the same set, 「急なご予約はお受けできません」. A perfect fit for 35 people, wasted because it shuts 50
   minutes after the coach arrives (`544e6b9d8704`, `notes4.md` §4i).
5. **Man'ya is the weakest record on the day.** It publishes nothing of its own and the aggregator
   listings are empty templates, so the ~¥550 iwana, its hours and its closing days are **all
   uncorroborated** — stated as such in the `snack` line (`cf52295ef726`).
6. **THE ONE THING THAT OUTLIVES THE 16:00 CLOSE, added:** the **Ouchi-juku Machinami Exhibition
   Hall**, the rebuilt honjin at mid-street with irori, dirt floor, Edo furnishings and the lord's own
   separate entrance — **09:00–16:30**, ¥250 / ¥150 and ¥200 / ¥100 at 30+, closed only 29 Dec–3 Jan.
   It is the only paid attraction still open in the back half of this slot (`d4w30ouc01`,
   `notes-expand-d34.md` §1.6).
7. **The seed's "the village preserve that actually travels" does not.** Boxed nishin no sansho-zuke
   is 「冷蔵便」, 「出荷日より14日」; the dried 70 g at ¥864 is the substitute (`8cf52a1d9c2e`,
   `d4shopdryhrr`).
8. **Added two frames nobody takes and one name correction:** the **paddy lane west of the village**,
   where the whole thatched row photographs from level ground with no cars and no crowd, the rice heavy
   and turning gold in mid-September; and **Takakura-jinja's torii of unfinished, unpainted timber
   standing in the middle of the street** — it is the **only** shrine at Ouchi-juku, so any mention of
   a 湯殿神社 here is wrong, and its 半夏まつり is **2 July**, not September (`d4w30ouc02`–`04`,
   `notes-expand-d34.md` §1.7).
9. **Two more houses against the same wall:** Ishihara-ya at 大内山本5, ume-oroshi soba and properly
   whisked matcha, **09:30–15:30**, 不定休; and Ouchi-juku Shoku-no-Yakata at 大内1053 on the approach
   below the preserved street, **09:00–16:00, closed Mondays**, shut entirely 1 Dec–31 Mar
   (`d4w30ouc05`, `d4w30ouc07`).

**The `buy` line is built round the one counter that survives the clock:** Kintaro Soba Yamamotoya's
**souvenir side, 09:30–16:00**, which stays open after its 15:00 soba kitchen shuts. Its own listed
best-seller is three-year miso, 1,300 g — fermented and sealed, so it travels — but **no counter price
is published**, so ~¥1,500 is an estimate and the line says so.

---

## The three RETIRED stops

All three are still displayed under **"Removed from this Day"** in the review page, so each gets a full
five-line block, `"retired": true`, `"retiredReplacedBy"`, and **a first sentence in `do` that says
plainly the stop is off the itinerary and names the replacement**. Their remaining lines are written in
the past tense where the fact belonged to the property, and in the present where the fact belongs to
the town and therefore transfers.

### Hotel Kameya, Naruko Onsen → Ooedo Onsen Monogatari Naruko Onsen Kounkaku · confidence medium
**Why the town research survives:** both addresses sit in **字車湯** — Kameya at 車湯54-6, Kounkaku at
字車湯17 — and **the GSI geocoder resolves them to the identical point**, so every leg in the Naruko
cluster transfers unchanged and must not be re-walked (`removedFromDay` in both `day2-matsushima.json`
and `new-hotels.json`).

**Carried forward:** the 黒湯 across three baths; Mochidokoro Fukase's ¥400-for-two kuri-dango and its
09:00 opening against an 08:30 coach; Sakurai Kokeshi's head-squeak and the separately-turned head and
body; the shrine stairway above Taki-no-Yu as the free steam vantage; and "do not promise autumn
colour — Naruko-kyo peaks late October".

**Corrected / flagged:**
1. **Kameya's bath hours and bath names could not be re-sourced.** `hmihotelgroup.com` subpages
   redirect-loop from this sandbox; Jalan states only that bathing runs between 15:00 check-in and
   10:00 check-out; no posted closing time exists anywhere. The three-bath description is the seed's,
   and the 黒湯 wording is the hotel's own via JTB (`9e6b9eac61e8`, `notes2.md` §6.2). **This is why
   the stop is medium.**
2. **The seed's own open question is now moot:** whether Kameya's complimentary Taki-no-Yu ticket
   applied to a group tour rate was never answerable from a reachable page.
3. **Waseda Sajiki-yu is the one that mattered and the seed does not say why:** 09:00–21:30, last
   entry 21:00, ¥660 — the **latest-closing** bath in town, and therefore the only one that still
   worked if the 19:00 kaiseki ran long (`06cb9e37e31a`).
4. **Sakurai Kokeshi's coordinate was promoted** from its official address 〒989-6823
   大崎市鳴子温泉字湯元26, weekend hours added (from 09:30), and the maker writes the squeak as
   「キュキュッと音がする」. The ¥2,640 / ¥3,300 prices are from a retailer stocking Sakurai's work, not
   Sakurai's own list (`0c341e352614`, `0fcd6683028c`).
5. **The kokeshi-festival claim is unverified.** The seed's "71st All-Japan Kokeshi Festival and 35th
   Naruko Lacquerware Exhibition ran 5–6 September, three days before you arrive" was **not**
   re-checked. If the group is told "you just missed it", verify first (`notes2.md` §6.9).
6. **Miyagi accommodation tax, ¥300 a night, cash at the desk on top of bathing tax**, has applied
   since 13 January 2026 and post-dates the seed entirely (`ITINERARY_CHANGE.md` §4.4).

**The `snack` line is honestly EMPTY**, and it is the sharpest single contrast between the retired hotel
and its replacement: nothing on the property, nothing in town at 22:00, and the bath town 0.95–1.2 km
away, 13–17 minutes each way **down and back up a gorge** — against Kounkaku's Lawson **78 m from the
door, 24 hours**. The line spends its remaining space on the fact that actually costs money at 21:00:
**Taki-no-Yu sells neither soap nor towel and has no showers or taps**, so both come from the room plus
¥300 in coins.

### Okuiizaka Anabara Onsen Yoshikawaya → Mercure Miyagi Zao Resort & Spa · confidence high
**Why nothing survives:** night 3 **moved prefecture**, Fukushima → Miyagi. This is the only one of the
three hotel moves where the surroundings had to be researched from scratch, and the whole Iizaka
cluster is off-itinerary: Sabako-yu, Totsuna-bashi, Gyoza no Terui, Aberu Shoten, Tennoji Anabara-yu,
Kyu-Horikiri-tei, Harai-yu. The revision also cut the transfer from Zao Fox Village from ~1 h 05 /
45 km to ~30 min / 18 km and pulled check-in from 17:45 to **17:15** (`removedFromDay`,
`ITINERARY_CHANGE.md` §1).

**Carried forward:** the two riverside open-airs Saruami-no-Yu and Kamoshika-no-Yu over the Surikami
rapids with the evening/morning gender swap; the kaiseki centred on Fukushima beef on a ceramic plate
with a fruit-based sauce; enban gyoza at Gyoza no Terui, a disc of 22 flipped onto the plate; radium
eggs and their Taisho-era origin story; the Surikami gorge as the property's best (unphotographable)
view; and Totsuna-bashi, 51.7 m, 1915, floodlit since 2009.

**Corrected:**
1. **BREAKFAST WAS 07:00, not the app's or the seed's 07:30**, and check-in officially ran
   **15:00–18:00** against a 17:45 arrival — so a coach delayed by September weather arrived into
   check-in and the kaiseki at the same moment, and the hotel's own line is answered only 09:00–18:00,
   i.e. it closes exactly as the group arrives (`notes3.md` §3, `essentials`).
2. **The property had more baths than the seed lists:** two large indoor baths **藤太の湯** and
   **弁天の湯** as well as the two rotenburo, all four 14:00–24:00 and 05:00–10:00 with the swap, plus a
   reservable **barrier-free private bath 湯野〜YUNO〜**, 06:00–23:00 in hourly slots — the answer for
   anyone in 35 who would not undress in a shared bath. Hire charge not published (`d3yoshbath1`,
   `d3yoshkashi1`).
3. **The book lounge is 15:00–23:00 AND 07:00–10:00.** The seed gives only the evening session; the
   morning one covers the gap between a 07:00 breakfast and the 08:30 coach (`d3yoshlounge1`).
4. **Added the group capacity**, which answers the seed's own worry about being put in a banquet hall:
   a 529 m² convention hall divisible in three (450 theatre, 240–400 at round tables), the 320-mat
   **天翔** hall, the 88-mat **羽衣** hall and six 16–20 mat **花の庄** private rooms at 15–24 each — 35
   people fit in 羽衣 or across two 花の庄 rooms (`essentials.groupRate`).
5. **The seed's "Aberu Shoten, closed Tuesdays" is not stated on the shop's own site**, which gives
   only 「営業時間／8:00～19:00」 — unverified, and irrelevant on a Thursday (`f37a89859d00`,
   `notes3.md` §3).
6. **Tennoji Anabara-yu's hours are confirmed exactly as briefed**, from Fukushima City itself:
   Thursday 13:00–21:00 with last entry 20:40, Friday from 06:00, closed Wednesdays, ¥400 for age 12
   and over, tel 024-542-0400, 230 m east of the door (`essentials.transport`).
7. **Gyoza no Terui's ¥1,200 disc price is not on the restaurant's own site** and is carried at medium;
   and the walk to it is realistically a **5-minute taxi each way**, not the 30-minute river walk,
   because the shuttle stops at 18:00 (`834cb646605c`).

**The `snack` line is honestly EMPTY** and the geography is the reason: Anabara is a six-ryokan pocket
2 km upstream of Iizaka with one public bath, no shopping street and no lit road outside the door. The
line names the in-house substitute — the book lounge and its 4,000 manga titles, **including the
07:00–10:00 session the briefing misses** — and the operational consequence: anything else was a
5-minute taxi each way and **both taxis had to be booked before dinner**, because the shuttle stopped
at 18:00.

### Ooedo Onsen Monogatari Premium Kinugawa Kanko Hotel → Kinugawa Onsen Hana no Yado Matsuya · confidence medium
**Why the town survives but the legs do not:** the replacement is 1.3 km north at 日光市藤原19, beside
Kinugawa-Koen Station rather than in the town centre, so **Takimi Bridge falls from a 17-minute walk to
about 5 and Fureai Bridge rises from 2 to about 18** — which makes the retired Fureai `mustSee` simply
wrong for night 4. **Two things here are void:** Mission 2 was pinned to *this* lobby, and the whole
six-sitting buffet analysis was *this* operator's (`removedFromDay`, `ITINERARY_CHANGE.md` §1, §3,
§4.6).

**Carried forward:** the IWATO buffet off a 14 m live kitchen and its named local items; nokke-don as
the breakfast signature; the pork-on-the-line and no-halal-certification warning with a week's notice
needed; the lobby shop's dried Nikko yuba, Tochiotome sweets, Jingoro senbei and frozen gyoza, and the
rental-only colour yukata; Fureai Bridge's oni murals and floodlighting; and the derelict riverside
hotels from Takimi Bridge, one of them this hotel's own east annexe, closed 2008.

**Corrected:**
1. **THE SEED'S COACH CLAIM IS WRONG.** It says "the coach drops at the front door then parks
   off-site". The hotel's own booking data prints 「有（無料）200台 予約不要」 — **200 free on-site spaces,
   no reservation**. Still fix the 08:30 pick-up at the front door (`d4kinucoach0`, `notes4.md` §4f).
2. **THE SEED'S SITTINGS ARE NOT PUBLISHED ANYWHERE.** Its "17:30 and 19:30, ninety minutes each"
   appears on no operator page. What the operator prints is
   「繁忙期の夕食開始時間は6部制となる場合があります。チェックイン時にご案内します」 — up to **six** sittings,
   assigned at check-in — against a day-use venue window of 17:00–21:00. So the itinerary's 18:30 was
   a special group sitting that had to be confirmed in writing (`14fb5925b0ae`, `notes4.md` §2).
3. **Check-in was disputed across the operator's own channels** — Yukoyuko 15:00–18:00, Rakuten and
   Trip.com 15:00–19:00 — against an **18:20 arrival**, i.e. at or past the tightest of them
   (`essentials`, `notes4.md` §5).
4. **Mission 2's ten-minute problem was this hotel's alone, and the yukata were the cause:**
   「フロントの浴衣コーナーにて貸し出しをしております」 — adult yukata lent at the front desk while children's
   were laid out in the room, so 35 people choosing and sizing at the desk was the slow step, not the
   walk to the restaurant. The replacement puts **大人浴衣 in the room**, so the bottleneck is gone
   (`be86fd1fc62b`, `ITINERARY_CHANGE.md` §3).
5. **The seed's bath and lounge hours are uncorroborated.** 15:00–24:00 / 05:00–10:00 baths and a
   14:00–22:00 Premium Lounge are **not published by the operator**; only the lobby shop (07:30–20:00)
   and karaoke (15:00–22:00, three rooms) have operator hours (`essentials.closedNote`,
   `0abf71302fe1`).
6. **The lobby shooting position was resolved against the seed's silence:** front-desk wall and the
   self-playing grand piano **behind** the group, never the entrance doors, because after 18:00 that
   glass is black and it silhouettes 35 faces — and white balance locked to about 3000–3200 K rather
   than left on auto to swing between warm lobby and cool glass (`ec229901d7fd`, `c07f12a723dc`).
7. **The context the seed could not have:** **鬼怒川公園岩風呂 closed permanently on 31 March 2024**, and
   its address was 日光市藤原19番地 — the **same banchi as the replacement hotel** — so the nearest public
   bath to night 4's door no longer exists (`ITINERARY_CHANGE.md` §4.5).

**The `snack` line is thin rather than empty**, and it says why: nothing commercial in Kinugawa is open
after 20:00, so the operator's own answer was indoors — the free Premium Lounge in the lobby with
coffee, soft drinks and alcohol included — **and its hours are not published**, so the seed's
14:00–22:00 is flagged rather than repeated. The lobby shop's 07:30–20:00 is the one operator-sourced
window in the whole block.

---

## Things a reader should know about how these lines were built

1. **No new research.** Every fact is traceable to `day1-haneda.json`, `day2-matsushima.json`,
   `day3-ginzan.json`, `day4-aizu.json`, `expand-d12.json`, `expand-d34.json`, `new-hotels.json`,
   `topup-misc.json`, `ITINERARY_CHANGE.md`, `notes.md`, `notes2.md`, `notes3.md`, `notes4.md`,
   `notes-expand-d12.md`, `notes-expand-d34.md`, `notes-topup-misc.md`, or to a seed line that a batch
   record explicitly carries forward. **No web fetch was made for this batch**, and none was needed.
   `topup-naruko.json` was read and contributed nothing here: all eleven of its records anchor to
   `Ooedo Onsen Monogatari Naruko Onsen Kounkaku`, which is the sibling's key.
2. **Where the seed is the only source, the line says so or the fact is dropped.**
   - *Dropped for lack of any batch record:* Matsuya HICity's "roughly 7% surcharge after 22:00"
     (night 1).
   - *Carried with an explicit flag:* the Sendai zunda shake at ¥420/¥530; (NO) RAISIN SANDWICH at
     ¥1,580; Gyuniku Domannaka at ¥1,620; the Zuiganji goshuin at ¥500 / ¥1,200; Aizu yama-shio at
     ~¥450; Man'ya's ~¥550 iwana; the three-year miso at ~¥1,500; dried Nikko yuba at ~¥800; Sakurai's
     ¥2,640 / ¥3,300 kokeshi; and the Matsushima souvenir-wall bottle at ~¥700.
   - *Contradicted and replaced:* the kaki burger, the maguro-don range, Genzo, Pensee, Matsukama's
     opening and grill price, the Nogawa opening, the karinto-manju box, Yagihashi's tasting floor,
     Minatoya's hours, Misawaya's closing day, Kintaro Soba's closing days, the cruise group fare, and
     the Aoba-dori coordinate.
3. **Capacity and cash for 35 people are carried wherever we hold them:** Zao's ¥52,500 cash-only in
   notes and the shop as the only card counter; the cruise's ¥1,350-at-15+ and its ¥5,250 saving;
   Zuiganji's ¥900-at-30+ and ¥3,500 saving; Tsurugajo's ¥360-at-30-99 and ¥1,750 saving, plus the
   Kaikan's 20 large-bus bays; the fish market explicitly accepting 大型自動車; Ouchi-juku's ¥3,000
   coach fee, first-come with **no reservation possible**, and Yamagataya's 10–50 cash-only one-set
   group menu; Matsukama's 10-or-more pre-booking rule against Abe's 予約不要; Yakigaki House taking no
   seat bookings at all; the Miharashidai's 14 minutes each way; Yoshikawaya's 羽衣 and 花の庄 rooms;
   and the Ginzan street being 4–5 m wide, which is why the banner shot has exactly one location.
4. **Every line was judged against the stop's real clock**, including the seven cases where the good
   thing is shut: Gransta's souvenir units until 10:00 into a 09:15–10:05 window; the Tokyo Station
   Gallery at 10:00, five minutes after the platform call; Izunohana at 11:00 into a stop ending
   11:30; Zao's gate at 16:30 against a 16:40 departure; Ouchi-juku's kitchens at 15:00–16:00 into a
   slot running to 16:40; Mochidokoro Fukase at 09:00 and Sakurai Kokeshi at 10:00 against an 08:30
   coach; and Haneda's Japan Promenade at 10:00–20:00, shut at both ends of night 1.
5. **One new arithmetic finding**, from two records we already held rather than anything external:
   **the cruise's 15:50 boarding call does not fit a 30-minute Godaido stop.** Godaido 15:22 + 30 min
   = 15:52, plus 280 m / 5 minutes to the pier = about 15:57 — three minutes before the last boat of
   the day. So Godaido is really a **23-minute** stop and the group must leave at about 15:45. It is
   in the cruise's `do` line and its `correctedFromSeed`.
