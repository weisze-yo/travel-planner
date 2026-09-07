# Brief for a research session — the four airport stops

**Status: DRAFT for the owner to review before sending. Do not act on this yet.**

## What this is

An existing app holds a fully researched 8-day trip: 40 itinerary stops, 532 nearby places, 60
must-see shots, 96 shopping items, structured opening hours on 33 stops, and 165 lines of written
per-stop advice. It is in production and in use.

**Ten of those 40 stops are travel legs with no content of their own** — assembly, four flights, the
connections and arrivals. They currently carry a time, a coordinate and one honest sentence. The
researched stops around them carry twenty-plus nearby places each with verified hours.

Your job is to close that gap for the **airports**, to the same standard as the existing bundle.
The output must drop into the existing importer **unchanged**.

## The four locations, and what already exists

| Location | Day | What exists now | What is needed |
|---|--:|---|---|
| **Penang International (PEN)** | 1 | Nothing. One line: "Check-in counter by 07:00." | Everything |
| **Singapore Changi (SIN)** | 1 and 8 | Nothing. A 55-min connection outbound, 2h15 home | Everything, **airside only** |
| **Tokyo Haneda T3 (HND)** | 1 | 6 places, a 5-line summary, structured hours | **Gaps only** — see below |
| **Narita T1 South Wing (NRT)** | 8 | **25 places · 3 must-see · 9 shopping · 2 sub-routes.** Already complete | **Nothing. Do not duplicate it.** |

**Read the existing Narita and Haneda records before starting.** They are the standard, and Narita in
particular shows the depth expected.

### The constraints that shape what is useful

These are not generic airport guides. They are for **35 people on a fixed coach-tour schedule**:

- **PEN, Day 1, 07:00 assembly, SQ131 departs 10:15.** Landside only, ~3 hours, most of it queueing.
  What is open at 07:00 matters enormously; what opens at 10:00 is useless.
- **SIN outbound: a 55-minute connection.** Airside, and genuinely tight. Anything requiring more
  than a brisk walk between gates is not merely optional, it is wrong to suggest.
- **SIN homebound: 2h15, airside**, arriving 16:55, departing 19:10. This is the one real window.
- **HND, Day 1, lands 21:55.** Almost everything is shut. The existing note already records that the
  terminal restaurants close by 22:00. Fill the gaps *for that hour*, not for a daytime arrival.

Time-of-day relevance is the whole point. A record that is correct but shut when the group is there
is worse than no record, because it costs someone a walk.

---

## Output format — this is a contract, not a suggestion

Emit **one JSON file per location**, matching the existing batch shape exactly. The importer reads
these directly.

### `places[]`

```json
{
  "id": "67755765f105",
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

Field rules, all enforced by `validate_research.py`:

- **`id`** — 12 lowercase hex, unique across the whole dataset. Must not collide with any existing
  id; the bundle will be supplied so you can check.
- **`anchorStop`** — **byte-for-byte** one of the four stop names. This is the join key. The exact
  strings are listed at the end of this brief.
- **`category`** — exactly one of `food` · `cosme` · `cloth` · `shopping` · `sight` · `rest`.
  Nothing else. (There is a *separate* shopping enum — see below. Do not cross them.)
- **`legs[]`** — **required.** How you get there from the anchor stop. `mode` is `walk` · `train` ·
  `bus`. For an airport this is nearly always a single walk leg, and the minutes should be honest
  about terminal distances, including a realistic transfer between Changi terminals.
- **`timeWindow`** — `day` · `night` · `dawn` · `24h`. For a 21:55 Haneda arrival this matters more
  than anywhere else in the trip.
- **`confidence`** — `high` · `medium` · `low`. **If it is not `high`, `confidenceNote` is required
  and the validator fails without it.**
- **`coordPrecision`** — `verified` · `approximate`. Be honest: airports publish building
  coordinates, not shopfronts. `approximate` with a note is correct for an in-terminal unit.
- **`source`** — the URL the fact came from.

### `mustSee[]`

`id` · `anchorStop` · `title` · `nameJp` · `tag` (e.g. `"DAY 8"`) · `summary` · `whereToFind` ·
`latitude` / `longitude` · `coordPrecision` · `confidence` (+ `confidenceNote`) · `source`.

### `shopping[]`

`id` · `anchorStop` · `name` · `nameJp` · `placeLabel` · `estimate` (integer yen, or `null` for
unpriced — never `0`) · `note` · `latitude` / `longitude` · `coordPrecision` · `confidence` (+
`confidenceNote`) · `source`.

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

**A 55-minute connection does not need a sub-route.** The 2h15 homebound one at Changi might.

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

It enforces the enums, the `confidence`/`confidenceNote` rule, the hours shape, that `legs[]` exists,
and image licensing. It will not catch a wrong fact — only you can.

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
