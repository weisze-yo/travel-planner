# notes-airports.md — the four airport stops

Research run 7 Sep 2026 against `BRIEF_COWORK_AIRPORT_RESEARCH.md` (FINAL, 7 Sep). Validator used:
`validate_research.py` at `sha256 78b8b1d4b2df9d2f5c3334b51c9c8681c07fcaedcd69317a57ac6de57edfd358`,
taken from branch `claude/inspiring-newton-uzu0mt` (HEAD `7e4d6b0`) — **not** from
`trip12-implementation-handoff.tar.gz`, whose copy is the pre-fix one (`b177628f…`, zero hits for
`def in_region`). Both of the brief's self-check greps returned the expected values (`def in_region`
= 1, `Assembly · Penang` = 2) and the sha256 matched exactly.

Result: **`0 error(s), 0 warning(s)`, exit 0** across all three files.

```
  airport-pen            places=10 mustSee=1 shopping=2 subRoutes=1 essentials=1
  airport-sin            places=21 mustSee=2 shopping=6 subRoutes=2 essentials=2
  airport-hnd            places=12 mustSee=2
```

Checks the validator does **not** do, run by hand: 59 new ids, **0 internal duplicates, 0 collisions
against the 725 ids already in the bundle**, all readable lowercase slugs, every `subRoutes.placeIDs`
and `steps[].placeID` resolving to a place in the same file, and `source` present on all 56
place/mustSee/shopping records (none relying on the warning-only path).

---

## 1. The headline finding, and it is a negative one

**No operator publishes opening hours for any outlet at Penang International Airport.** Not one.
Malaysia Airports' own PEN airport guide lists every shop, restaurant and service with unit codes and
a landside/airside designation, and gives hours for **none** of them; its live Shop & Dine and
Facilities pages are JavaScript single-page apps that return no content, and the map URL 500s. The
only properly published opening time found anywhere at PEN is the Plaza Premium international lounge,
06:00–00:00 — and that is airside near Gate A3.

So the honest state of the PEN batch is: **positions are high-confidence, hours are unknown.** Ten
place records carry a landside/airside classification decoded from MAHB's own unit codes
(`[Level][L/A][FB/R][unit]`, corroborated independently against Plaza Premium's own factsheet and
Starbucks' own store URLs), and eight of them say plainly that whether the shutter is up at 07:00
cannot be established. That is the correct output, not a shortfall: a record that claims a 07:00
opening it cannot source is worse than a record that says nobody publishes one.

Changi is the mirror image. Almost every airside item is **open 24 hours**, so hours are not the
binding constraint there — **terminal and airside-versus-landside are.** But Changi's dining
directory and its per-outlet pages are also JavaScript-driven, so **no airside restaurant's hours and
no food price could be sourced either.** What is solid at Changi is outlet name + terminal + level +
transit-or-public, from Changi Airport Group's own Changi Pay outlet list, which tags every unit
Transit or Public. That is what every SIN record is built on.

## 2. Corrections to assumptions — including two to the brief and one to our own bundle

**2a. PEN: the counters open at 07:15, not 07:00.** SQ publishes no PEN-specific row, so its default
governs: *"Counter Opens – 3 hours before scheduled flight departure"*, *"Counter Closes – 40 minutes
before"*, and *"we will not accept baggage drop-off before check-in counters open."* For SQ131 at
10:15 that is **open 07:15, close 09:35**. The group assembles at 07:00 — fifteen minutes of 35
people and luggage standing in a concourse with nothing to do. That gap became the PEN mustSee
record and the first step of its subRoute, because it is the only free time the morning has.

**2b. PEN: MAHB's own guide contradicts SQ on check-in timing.** MAHB states a generic "counters open
2 hours before … close an hour before", which would read as 08:15/09:15. SQ's rule governs an SQ
flight. Both are recorded in `essentials.tickets`; neither is silently dropped.

**2c. PEN: there is no landside Starbucks.** MAHB puts the unit at `L2AFB08` (airside) and Starbucks'
own locator publishes two PEN stores and labels **both** airside in its canonical store URLs. "Meet
at Starbucks at 07:00" names a rendezvous on the wrong side of security — the single most likely
planning error at this airport, so it is recorded as a place rather than left as an absence.

**2d. PEN: a landside surau is not confirmed.** MAHB publishes exactly three suraus — Level 2
International Departure, Level 2 Domestic Departure, Level 1 Arrival — and **not one carries the
"Public Concourse" marker MAHB applies to the landside ATMs on the same page**, nor is a prayer-room
symbol drawn in the Level 2 landside concourse on its own map. The inference that the Level 2 rooms
are therefore airside is mine, not MAHB's, and is flagged `confidence: low`. Subuh has passed before
07:00 on 8 Sep so the immediate need is low, but **the group must not be promised a landside surau.**

**2e. PEN: two directory entries look stale.** OldTown White Coffee (`L2LFB01`) is absent from
OldTown's own current store locator, which *does* list other airport branches — so the omission is
meaningful. Secret Recipe (`L2LFB03`) is absent from Secret Recipe's own Penang list, and all 19
Penang outlets it does list open at 10:00 or 10:30 — 45 minutes after the group has cleared airside.
Neither was written up as a live option.

**2f. CORRECTION TO THE BRIEF: there is no "T3 Enchanted Garden".** The brief's candidate list has
one. Enchanted Garden is **T2 Transit Level 2**. T3's airside gardens are Butterfly Garden (spanning
Levels 2 *and* 3) and Crystal Garden, plus a koi pond by the A/B gates.

**2g. CORRECTION TO THE BRIEF: the Skytrain leg shape is right, the minutes are not sourceable.** The
brief suggests modelling a Changi terminal transfer as `[{train,4},{walk,6}]`. The *shape* is
correct and it passes the walk cap — but **Changi publishes no Skytrain journey time and no frequency
on any page**, checked across the transfer page, the terminal maps, the terminal guides, the transit
guide and the FAQ. SQ's own *Transit Area Wayfinding* PDF is the document that would answer it and is
image-only; it was fetched twice and yielded no text. So the two cross-terminal records here carry
`{train,5}` + `{walk,8}` with an explicit note that **these are estimates, not operator figures**,
and both sub-routes are deliberately confined to a single terminal for exactly this reason. Someone
should open that PDF visually and settle it.

**2h. The terminal question moved, in the brief's favour and against it.** SQ's own page — not an
aggregator — says customers flying to *"South East Asian destinations … Japan … and South Korea
should check in at Terminal 2"*, which **upgrades T2 from a flight-tracker guess to an
operator-supported fact for the two DEPARTURES (SQ634, SQ142)**. The same page then says *"An
arrival terminal will be assigned approximately two hours before the flight lands. Singapore
Airlines flights may arrive at Terminal 1, 2 or 3."* So the arrival terminal is genuinely unknown
until the day. Every SIN record is written to survive that: the T2 items say T2, the T3 items say T3,
and both `stopSummary.do` lines open with "stay in whichever terminal you land in".

**2i. CORRECTION TO OUR OWN BUNDLE: the Haneda onsen's reachability at 23:00 is not established.**
Our existing record (`expand-d12` `d1w30t3b`) has Izumi Tenku no Yu as a 24-hour onsen beside T3.
The onsen's own hours are one fact; **the walkway's are another, and no operator publishes them.** A
signed route from 2F arrivals toward Airport Garden exists and reaches the entrance at 1F past the
group-bus kerb, but no page gives the walkway's floor or hours, and Haneda's own inter-terminal
movement page does not mention it at all. Sumitomo Realty's own grand-opening release describes the
onsen as serving airport users **早朝から深夜まで** — early morning to late night — which is
pointedly *not* 24時間. The operator domains (`haneda-airport-garden.tokyo`, `hanedaonsen.jp`,
`villa-fontaine.co.jp`) were unreachable from this session after retries. `airport-hnd-garden-
walkway-unverified` records this as an open question at `confidence: low`, and the existing onsen
record should be read against it rather than as a settled option.

**2j. Haneda: nobody in this group can reach a chemist.** Matsumoto Kiyoshi on 3F landside is
08:00–22:00 — the group is still in the immigration hall — and it is OTC only (its 調剤受付時間 is
「―」 all seven days). **All three** drugstores in Haneda's own pharmacy directory (BOOKS & DRUGS
NORTH/SOUTH, エアポートドラッグ) are 出国後エリア, airside. There is no landside dispensing pharmacy
in T3 at all. Motion-sickness tablets and plasters get bought in Singapore or wait for morning.

**2k. Haneda publishes no meeting point on the 2F arrivals floor.** Its only two T3 meeting points
are one floor **up**, on 3F departures: 時計塔 near H counter and 時計塔 near C counter. No 団体 or
ツアー reception area is published for T3 at all. For 35 people the regroup point has to be agreed on
the coach in Singapore, not found on a sign at 22:15.

**2l. Haneda: the chartered-coach kerb is on 1F and the pool has a 30-minute cap.** Scheduled buses
use 1F Lane 3, stops 1–11; a charter does not. It registers at the international bus pool, pays
¥2,000, collects documents, and then faces **8 pool spaces, a 1-hour pool cap and a 30-MINUTE
boarding-area cap, with no advance booking.** Against 35 people clearing customs across roughly
22:10–22:40, that means the coach cannot idle at the kerb from 21:55 — the driver has to time pool
exit to the group's actual exit. This is the single biggest operational risk in the arrival window
and it was not in the bundle before.

**2m. Haneda: the deck record is confirmed, and T3's prayer rooms are unique.** T1's and T2's
observation decks both shut at 22:00 (T2's indoor FLIGHT DECK TOKYO at 23:00), so our existing
"T3's 5F deck is the only one open at 22:30" record is right. Separately: T1 has **no** prayer rooms
and T2's pair are 出国後エリア, so **T3's two 3F rooms are the only landside prayer rooms anywhere at
Haneda** — with 清浄施設 (ablution facilities) stated by the operator.

**2n. Changi landside traps, all from Changi's own Public/Transit tags.** Unreachable in transit:
**Jewel entirely** — *"If you are transiting through Changi Airport, you will need to clear arrival
immigration to enter Singapore and visit Jewel"* — and with it the Rain Vortex, Shiseido Forest
Valley, Canopy Park, YOTELAIR and Changi Lounge; **The Wonderfall** (T2 Public L2, easily confused
with Dreamscape, which *is* airside); **Flap Pix** (T2 Public L3); **Kinetic Rain** (T1 Public L2);
**Arrival Garden** (T1 Public); **ST3PS** (T3 basement, Public); and **the S$5 Hub & Spoke showers**
(T2 Public L1) — airside the cheapest shower is S$20 at Ambassador. **All four viewing malls are
Public**, and T2's is additionally *"temporary closed from 19 June to 30 September 2026"*, which
covers both trip dates — so airside plane-spotting is Gourmet Garden's windows (*"16 different
tailfins"*) or the Sunflower Garden deck. **Terminal 4 is out entirely**: Changi states it *"is not
connected to T1-T3 by Skytrain or walkable routes in the transit area"*, so Petalclouds and the T4
Immersive Wall are unreachable despite being airside. And **Swee Choon is landside** despite
appearing in CAG's own 2023 T2-reopening factsheet's transit list — the brand's own page and CAG's
own current Changi Pay list both put it in T2 Public. Two current sources beat one old factsheet.

**2o. Changi: screening is at the gate holdroom.** Connecting passengers *"undergo security screening
before heading to the boarding gate"* — not once at a central checkpoint. So anything liquid bought
airside is re-screened at the gate, and 35 people are one gate queue. Both windows' `lastAdmission`
work back from this rather than from the departure time.

**2p. Changi: halal is verified for exactly three operators, and no more.** In writing: **Encik Tan**
(its operator Fei Siong calls it *"a Halal-certified mini food atrium"*), **IRVINS** (marked per
product on its own shop pages), and **Old Chang Kee** (brand-published claim, though the certifying
body is not stated, so the certification itself stays unverified). Everything else is unverified —
including The Satay Club, Ya Kun, Wee Nam Kee, The Hainan Story and every Straits Food Street stall.
MUIS's own certification directory was unreachable from this session; it is the authoritative check
and should be run by hand for any outlet 35 people are actually pointed at. Halal-directory
aggregators were deliberately not used. At PEN only **McDonald's Malaysia** is halal-verified (its
own JAKIM statement); Nasi Kandar Line Clear, Pinang Kopitiam and the rest are **not**, and Pinang
Kopitiam is explicitly flagged because a Malaysian kopitiam frequently serves pork.

## 3. Schema notes for the implementation session

- **`estimate` is `null` on all eight PEN/SIN shopping records**, with the price and its currency in
  `note` — per the brief, because the app renders `estimate` with the trip's `¥` and sums it into one
  yen total. `S$9.50` would display as `¥9`. HND emits no shopping records at all.
- **`priceTier` convention used here**: `free`, `RM`, `S$`, `S$$`, `¥`. It is not validated and no
  existing convention covers non-yen stops; this is a guess that reads correctly and should be
  reviewed rather than trusted.
- **`nameJp` is empty on all 29 SIN records and 11 of 13 PEN records**, per the brief — the signage
  at Changi and PEN is already the English name and filling it in would duplicate `name` and rank the
  same record twice in search. The **two** exceptions are genuine: **Ban Heang / 萬香饼家**, where the
  company's own site uses the Chinese name, appearing on both its place and its shopping record. All
  14 HND records carry Japanese names.
- **`category` has no slot for a service.** ATMs, currency exchange, a coach kerb, a meeting point,
  free wifi and a re-screening warning are none of food/cosme/cloth/shopping/sight/rest. I followed
  this bundle's own precedent — `day1-haneda` files the Electronic Customs Declaration gates as
  `sight` — and used `sight` as the functional-landmark catch-all, `rest` for prayer rooms, snooze
  lounges, showers and smoking rooms. **Suggested app change: a `service` (or `admin`) member on
  `PlaceCategory`**, because roughly a third of what is genuinely useful at an airport is neither a
  sight nor a rest, and the current mapping makes the Nearby filter lie.
- **Negative-knowledge records carry a real `stayMinutes`** even where the answer is "you cannot go
  there" (`airport-sin-out-jewel-unreachable` uses `1`, the minimum the validator allows). If the app
  renders `stayMinutes` as a promise, these three records will read oddly — worth a look.

## 4. What I deliberately left out — one line per location

- **Penang** — every claim about what is *open* at 07:00: no operator publishes hours for any PEN
  outlet, so positions and halal status are recorded and opening times are recorded as unknown rather
  than estimated.
- **Singapore Changi (both windows)** — all per-outlet opening hours and every food price: Changi's
  dining pages are JavaScript-only and return none, so nothing was carried over from aggregators, and
  no Skytrain journey time was written down because Changi publishes none.
- **Tokyo Haneda T3** — `essentials`, `stopSummary` and `outfitByStop` for this stop: rich blocks
  already exist in `day1-haneda.json` and `summaries-d14.json`, and the importer is last-write-wins,
  so emitting new ones would clobber them. **The implementation session must not add them for T3.**
  Also left out: any shopping record, because the existing `stopSummary.buy` already argues correctly
  that Day 8 at Narita is where the buying belongs.
- **All four stops** — `outfitByStop`, per the brief's own instruction, and I agree with its
  reasoning: a terminal interior has no backdrop to dress for, and the Day 1 and Day 8 blocks already
  cover a 20-hour travel day better than a departure hall could. Coverage stays **33 of 33 content
  stops**. No block is argued for here.
- **Narita T1 South Wing** — nothing emitted, per the brief. Its existing 25 places, 3 must-see,
  9 shopping and 2 sub-routes were read as the standard for depth and register, not extended.

## 5. Things worth one phone call, and who should make it

| Call | Ask | Why it changes the plan |
|---|---|---|
| **PEN +604 252 0252** | Which counter cluster SQ131 uses on 8 Sep; which Level 2 *landside* outlets are open at 07:00, and whether Line Clear on Level 1 is; and whether there is a surau in the Level 2 **public concourse** | Three gaps no published source closes, and all three move 35 people to a different part of the building |
| **Haneda +81 3-5757-8111** | Whether the 5F deck is open (Haneda's own deck page gives this number for exactly that), and whether Edo Koji's lanterns stay lit after the tenants close | The deck can be shut for 天候や保安上の理由 without notice; if the lanterns go dark the second mustSee collapses to a dim corridor |
| **The tour agent** | The bus-pool timing on arrival — 8 spaces, 1-hour pool cap, 30-minute boarding cap — and the actual flight terminals from the tickets | The kerb constraint is the night's real risk, and SQ's own terminal rule only settles the two departures |
