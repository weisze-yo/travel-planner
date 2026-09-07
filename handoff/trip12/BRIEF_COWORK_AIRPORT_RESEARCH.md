# Brief for a research session — the four airport stops

**Status: FINAL — corrected 7 Sep 2026 after the research session's own review of the validator
and the bundle. Every blocker it raised is either fixed in `validate_research.py` or decided below.**

## Read this first: the trip has already departed

Trip 12 flies on **8 September 2026**. This brief was finalised on 7 September, so by the time any
of this research lands, **three of the four locations are in the past** — Penang, the Changi
outbound connection and the Haneda arrival all happen on Day 1. Only the Changi **homebound** window
on 15 September is still ahead of the group.

That is deliberate and the work is still wanted. **Treat this as a permanent improvement to the
trip's research record, not as help for a departure.** It closes the last content gap in a bundle
that is otherwise complete, and it will be correct for the next group that flies the same routing.
So: no need to rush, and no need to prioritise the homebound window over the other three. Accuracy
beats speed everywhere in this brief.

## What this is

An existing app holds a fully researched 8-day trip. The numbers below are the **app's**, and they
differ from the research bundle's own totals because of work done after the research was handed
over — so both are stated, and you should not try to reconcile them:

| | Count | Composition |
|---|--:|---|
| Itinerary stops | **40** active | 30 researched content stops + **10 travel legs added post-handoff** (plus 3 archived superseded hotels, giving the 33 that carry a `stopSummary`) |
| Places | **532** | 517 anchored to a stop + 15 whose anchor was a superseded stop |
| Must-see shots | 60 | |
| Shopping items | 96 | |
| Stops with structured hours | 33 | |
| Lines of per-stop advice | 165 | 33 stops x 5 lines |

**The 10 travel legs are the reason your bundle counts 33 stops and the app counts 40.** They were
added after handoff and carry a time, a coordinate and one honest sentence each. Four of them are
the airports in this brief, which is exactly why this gap exists. It is in production and in use.

**Ten of those 40 stops are travel legs with no content of their own** — assembly, four flights, the
connections and arrivals. They currently carry a time, a coordinate and one honest sentence. The
researched stops around them carry twenty-plus nearby places each with verified hours.

Your job is to close that gap for the **airports**, to the same standard as the existing bundle.
The output must drop into the existing importer **unchanged**.

## The four locations, and what already exists

| Location | Day | What exists now | What is needed |
|---|--:|---|---|
| **Penang International (PEN)** | 1 | Nothing. One line: "Check-in counter by 07:00." | Everything |
| **Singapore Changi (SIN)** | 1 and 8 | Nothing. ~2h10 outbound, 2h15 home — both airside | Everything, **airside only** |
| **Tokyo Haneda T3 (HND)** | 1 | 6 places, a 5-line summary, structured hours | **Gaps only** — see below |
| **Narita T1 South Wing (NRT)** | 8 | **25 places · 3 must-see · 9 shopping · 2 sub-routes.** Already complete | **Nothing. Do not duplicate it.** |

**Read the existing Narita and Haneda records before starting.** They are the standard, and Narita in
particular shows the depth expected.

### The constraints that shape what is useful

These are not generic airport guides. They are for **35 people on a fixed coach-tour schedule**:

- **PEN, Day 1, 07:00 assembly, SQ131 departs 10:15.** Landside only, ~3 hours, most of it queueing.
  What is open at 07:00 matters enormously; what opens at 10:00 is useless.
- **SIN outbound: about 2h10, airside, and very probably within one terminal.** *This is a
  correction: an earlier draft of this brief called it a 55-minute cross-terminal sprint and built
  its guidance on that. Both halves were wrong.* The app's own itinerary has SQ131 landing 11:45 and
  SQ634 leaving 13:55 — two hours ten minutes, not fifty-five minutes — and published schedules put
  both flights at **Terminal 2**, so no terminal change is needed.

  **Two cautions on that.** The terminals come from flight-tracker aggregators, not from the group's
  tickets: the owner searched the trip briefing materials and the company's own emails and **found
  no flight numbers and no terminal assignments in either** — the tour agent holds the tickets. So
  treat T2/T2 as likely, not settled, and **write the records so they survive a terminal change**:
  prefer things reachable from any of T1/T2/T3 via the airside Skytrain, and where a record is
  specific to one terminal, say which terminal in the `note` so a reader in the wrong one knows
  immediately.
- **SIN homebound: 2h15, airside**, arriving 16:55, departing 19:10. Comparable to the outbound
  window rather than the only one.
- **HND, Day 1, lands 21:55.** Almost everything is shut. The existing note already records that the
  terminal restaurants close by 22:00. Fill the gaps *for that hour*, not for a daytime arrival —
  the 22:00-and-after picture is the whole value here, and it is the picture no general airport
  guide bothers to write down.

Time-of-day relevance is the whole point. A record that is correct but shut when the group is there
is worse than no record, because it costs someone a walk.

---

## Output format — this is a contract, not a suggestion

Emit **one JSON file per location**, matching the existing batch shape exactly. The importer reads
these directly.

### `places[]`

```json
{
  "id": "narita-t1-gardenwalk-01",
  "anchorStop": "Narita Airport — Terminal 1 South Wing",
  "name": "GARDEN WALK observation deck, T1 5F",
  "nameJp": "展望デッキ「GARDEN WALK」",
  "category": "sight",
  "priceTier": "¥",
  "stayMinutes": 30,
  "legs": [{ "mode": "walk", "minutes": 7 }],
  "note": "Reopened 9 April 2026 after a full year shut... The airport publishes only the opening: 06:30...",
  "latitude": 35.771944,
  "longitude": 140.386389,
  "coordPrecision": "verified",
  "timeWindow": "day",
  "confidence": "high",
  "confidenceNote": "...",
  "source": "https://..."
}
```

Field rules. **Only some of these are enforced by `validate_research.py`** — the enforced set is
listed at the end of this section, and the rest are conventions you are trusted with, because the
validator cannot check them and a reviewer would not catch them either:

- **`id`** — a **readable lowercase slug**, unique across the whole dataset, e.g.
  `airport-pen-kopitiam-01`. *This is a correction: an earlier draft said "12 lowercase hex". That
  is the shape of the original seed ids and the content-hashed stop ids only — of the 575 places in
  the app, 210 are 12-hex and **365 are readable slugs** like `tmisc-ishii-jimbocho`, which is what
  every researcher has used since. Nothing validates the format either way, so the reason to use a
  slug is that it names itself in an error message.* The bundle will be supplied so you can check
  for collisions.
- **`anchorStop`** — **byte-for-byte** one of the four stop names. This is the join key, it IS
  validated, and all four are now in the validator's whitelist. *Three of them were not: until
  7 Sep 2026 only `Haneda Airport — Terminal 3` was listed, so records for Penang and either Changi
  stop were rejected as unknown stops. Fixed.* The exact strings are listed at the end of this
  brief.
- **`category`** — exactly one of `food` · `cosme` · `cloth` · `shopping` · `sight` · `rest`.
  Nothing else. (There is a *separate* shopping enum — see below. Do not cross them.)
- **`legs[]`** — **required.** How you get there from the anchor stop. `mode` is `walk` · `train` ·
  `bus`. For an airport this is usually a single walk leg, and the minutes should be honest about
  terminal distances.

  **A Changi terminal transfer is a `train` leg, not a walk.** The validator caps a single **walk**
  leg at 30 minutes, and that cap stays — but the Skytrain is a train: it runs airside between T1,
  T2 and T3, free, every few minutes, a 2–4 minute ride, with about 10 minutes door to door once
  you count the walk to the platform. So model a transfer as `[{ "mode": "train", "minutes": 4 },
  { "mode": "walk", "minutes": 6 }]` or similar. Calling it a walk would both break the cap and
  misdescribe the journey.
- **`timeWindow`** — `day` · `night` · `dawn` · `24h`. For a 21:55 Haneda arrival this matters more
  than anywhere else in the trip.
- **`confidence`** — `high` · `medium` · `low`. **If it is not `high`, `confidenceNote` is required
  and the validator fails without it.**
- **`coordPrecision`** — `verified` · `approximate`. Be honest: airports publish building
  coordinates, not shopfronts. `approximate` with a note is correct for an in-terminal unit.

  **The coordinate guard is now per-stop, and it is tight.** It used to be a single Japan box, which
  rejected Penang (5.30, 100.28) and Changi (1.36, 103.99) outright. It was **not** widened into one
  loose box — that would have stopped catching the error it exists for. Each region keeps its own
  box instead: Penang `5.1–5.6 / 100.1–100.6`, Singapore `1.15–1.55 / 103.6–104.1`, Japan
  `30–46 / 128–146`. A Penang-anchored record carrying Japanese coordinates is still rejected, which
  is the point: two coordinates in this bundle were once marked `verified` and were wrong, one by
  260 km because an English homonym sent a geocoder to Hokkaido.
- **`source`** — the URL the fact came from.

**What `validate_research.py` actually enforces** (it exits non-zero on these, and only these):
`anchorStop` against its whitelist · the superseded-stop declaration · `confidence` against its
enum **and** the rule that anything below `high` carries a `confidenceNote` · `category`,
`timeWindow`, `coordPrecision` and leg `mode` against their enums · `stayMinutes` in 1–600 ·
`legs[]` present and well-shaped · the walk radius · `note` present · the `hours` shape ·
`estimate` a number or null · `placeLabel` present · image licensing · and the per-stop coordinate
box.

**What it does NOT check, contrary to an earlier draft of this brief:** `id` format or uniqueness,
`nameJp`, and `priceTier` are **not validated at all**, and a missing `source` is only a **warning**
— it will not fail the run. Those four are on you. A green validator run is not a review.

### `mustSee[]`

`id` · `anchorStop` · `title` · `nameJp` · `tag` (e.g. `"DAY 8"`) · `summary` · `whereToFind` ·
`latitude` / `longitude` · `coordPrecision` · `confidence` (+ `confidenceNote`) · `source`.

### `shopping[]`

`id` · `anchorStop` · `name` · `nameJp` · `placeLabel` · `estimate` · `note` · `latitude` /
`longitude` · `coordPrecision` · `confidence` (+ `confidenceNote`) · `source`.

> **`estimate` must be `null` for Penang and Singapore. Put the price in the `note` instead.**
>
> `estimate` is a **bare number with no currency of its own**, and the app renders it with the
> TRIP's symbol — which for this trip is `¥` — then sums it into one yen spend total. An `estimate`
> of `12` for something priced RM12 would display as **¥12** and add 12 to a yen total: silently
> wrong, in the one place the app shows a number the user acts on. Converting to yen was considered
> and rejected — it puts a fabricated figure into the user's own spend report at a rate that moves.
>
> So: `"estimate": null`, and the real price stated in the `note` with its currency, in the register
> the bundle already uses — *"RM12, cash only"*, *"SGD 8.50 at the kiosk, card accepted"*. Narita
> and Haneda records keep integer yen as before. (A currency field on `ShoppingItem` is the correct
> long-term answer and is deliberately out of scope: it is a schema change plus every reader in the
> app, and it is not being started the day before departure.)

**`placeLabel` should say where and when**, in the style of the existing records:
`"Narita Nakamise, T1 South Wing 3F — AFTER security, roughly 07:30–22:00"`.

> **The one enum trap.** `ShoppingItem.category` is a *different* enum from `Place.category`:
> `food` · `clothing` · `souvenir` · `beauty` · `other`. They share only `food`, which is what makes
> crossing them silent — a place category on a shopping item simply vanishes from the shop filter
> with no error. **Omit `category` on shopping records** and the importer defaults it correctly.

### `essentials{}` — keyed by the exact stop name

```json
{ "hours": { "mon": [["09:00","17:00"]], "tue": null, ... },
  "closedNote": "...", "lastAdmission": null, "seasonFrom": null, "seasonTo": null,
  "groupRate": null, "phone": "...", "phoneNote": "...", "website": "...",
  "tickets": "...", "transport": "...", "confidence": "high", "source": "https://..." }
```

`null` for a weekday means **closed that day**. An array may hold two spans for a lunch break.

### `subRoutes[]` — optional, and only where one is genuinely useful

`id` · `anchorStop` · `title` · `note` · `startMinutes` · `deadlineMinutes` (minutes from midnight) ·
`placeIDs[]` · `totalWalkMinutes` · `steps[]` of `{ name, placeID, atMinutes, minutes, walkMinutes,
note }` · `confidence` · `source`.

> **Use the `steps[]` shape written above.** The existing bundle has two inconsistent shapes in it
> (10 sub routes use one, 4 use another) and 3 sub routes carry no steps at all. That inconsistency
> is known and is on the owner's list to reconcile; it is not yours to fix, and nothing here depends
> on it — just do not copy whichever variant you happen to open first.

Both Changi windows are around two hours, so either could carry one. Only write a sub route where
the walking order genuinely matters; two hours in one terminal usually does not need choreographing.

### `stopSummary{}` — five lines per stop, keyed by exact stop name

```json
{ "do": "...", "eat": "...", "snack": "...", "buy": "...", "see": "...",
  "confidence": "high", "source": "https://..." }
```

- **`snack` is deliberately separate from `eat`**: on this trip every meal is pre-booked, so "what
  can I buy and eat standing up in twenty minutes" is the question people actually have.
- **A line is never blank and never "N/A".** Where there is nothing, say so in a sentence — the
  existing bundle has seven such lines and they read like *"no standing food here; the nearest
  konbini is a 20-minute unlit walk"*. At Haneda at 22:00 expect to write several of these.
- Existing lines run to about 480 characters. Match that register: specific, priced, time-bounded.

---

## The sourcing standard

This is the part that matters most, and the reason the existing bundle is trusted.

1. **Operator and official sources first.** The airport's own page, the shop's own page, the city's
   tourism office. Not aggregators, not review sites, not a blog that quotes an operator.
2. **Never guess a coordinate.** Two coordinates in the existing dataset were once marked `verified`
   and were wrong — one by 260 km (an English homonym sent a geocoder to Hokkaido), one by 2.4 km (a
   geocoder returned a *town polygon* instead of the mall). Both cost real work to catch. Prefer the
   operator's own published location; mark `approximate` and say why when you only have the building.
3. **Search in the local language where it helps.** The existing bundle found records under Japanese
   names that were invisible under romanisation — and the romanisations are themselves unreliable
   (和楽足湯 is read *Warashiyu*, not the character-by-character "Waraku Ashiyu").

   **`nameJp` at Penang and Changi: leave it empty unless a shopfront genuinely shows local-script
   signage that differs from its English name.** It currently sits at 100% across the 673 records
   that have it — all 517 anchored places, all 60 must-see and all 96 shopping — but that is a
   *consequence* of every record so far being in Japan, not a contract. The field's job is to hold
   **what is written on the door**, which is what makes a place findable when the English name on a
   list does not match the sign in front of you. At Penang and Changi the sign is usually already
   the English name, so filling this in would mean duplicating `name` — and a future search would
   then rank the same record twice for one query. **Do not synthesise a value to protect the
   coverage figure.** Where a stall really does show Chinese, Malay or Tamil signage that differs,
   put that in, script and all: that is the field working as intended.
4. **Confidence is a real field, not decoration.** `high` means an operator or official source said
   it directly. Anything less needs `confidenceNote` saying exactly what is uncertain.
5. **State negative knowledge.** "Shut by 22:00", "airside only, you cannot reach it before
   immigration", "opens 10:00, an hour after the group leaves" are among the most valuable facts in
   the existing bundle. A correction to a plausible assumption is worth more than another shop.
6. **Do not invent to fill a quota.** A location with six good records beats one with twenty where
   fourteen are padding. Under-delivering honestly is fine; fabricating is not.

## How to check your own work

The bundle ships `research/trip12/validate_research.py`. It must exit **0**:

```sh
cd research/trip12 && python3 validate_research.py <your-new-files>.json
```

It enforces the list under "What `validate_research.py` actually enforces" above — and nothing
else. It will not catch a wrong fact, a duplicate id, a missing `nameJp`, or a missing `source`.
Only you can.

## Deliverables

1. One JSON file per location: `airport-pen.json`, `airport-sin.json`, `airport-hnd.json`.
2. A `notes-airports.md` in the style of the existing `notes-*.md`: what you checked, what you
   could not verify, and **every correction you made to an assumption** — that file is how the
   existing bundle's errors got caught.
3. A one-line statement per location of what you deliberately left out and why.

## Exact `anchorStop` strings — byte-for-byte

```
Assembly · Penang International Airport
Arrive Singapore Changi — connection to SQ634
Arrive Singapore Changi — connection to SQ142
Haneda Airport — Terminal 3
```

Note the two **different** Changi stops — outbound (55 min) and homebound (2h15). They are separate
stops with separate constraints and must not be merged.

`Narita Airport — Terminal 1 South Wing` is **already complete**. Do not emit records for it.
