# P3 — Bookings and transport: the blue layer

**Date:** 29 Sep 2026 · **Verified against** the working tree on `claude/intelligent-pasteur-ebuo53`, read this session
**Status:** design, for review. **Nothing implemented. No application code changed.**
**Artboard:** *Harbour Garden* rev 5, plates 03 (Map) and 04 (Plan).
**Canonical:** this document for the `bookings` kind, its rows on the Plan, and calendar import.
**Depends on:** `p3-information-architecture.md` — D-11 (three route colours), D-15 (Plan is the only editor), D-22 (blue means a reference exists).

**Source read this session:** `src/store.js` plan-row model, `planItem`, `movePlanItemToDay`, `setPlanItemWindow` · `src/data.js` `STOP_SUMMARY_LINES`, the field whitelist 403–420 · `src/screens/plan.js` `stopRow`, `laneRow`, `addForm` · `src/itinerary.js` (348 lines, the parser) · `scripts/import-trip12.mjs` and the `x.flights` bag on the seed · `src/share.js` `SHARED_KINDS` 69.

**Fixed foundations, not reopened:** **every stop is a place** — a stop is a visit *to* a place, never a second kind of record · a stop holds two clock times, not a start plus a duration · free time is a lane, not a row · it must work offline · no paid APIs.

**Out of scope, deliberately:** live flight status · airline or hotel APIs of any kind · seat maps · price tracking.

---

## 1. What exists today

| Claim | Verified | Verdict |
|---|---|---|
| "Flights and hotels are in the app" | Trip 12's real flight details survive as free text in an `x.flights` bag on the seed file. Nothing reads it. | **Wrong. They are a note nobody looks at.** |
| "Every itinerary row is a stop at a place" | Confirmed throughout `plan.js` and `store.js`. There is exactly one row type. | **Right, and it is the constraint this document respects.** |
| "The importer can read a booking" | `itinerary.js` parses pasted text into stops. It has no concept of a reference number, a provider, or a check-in. | **Right that it parses; wrong that it understands bookings.** |
| "Accommodation is represented" | A hotel can be a place, and a check-in can be a stop at it. Nothing records the reservation. | **Half. The building is modelled; the booking is not.** |

---

## 2. The principle, and the trap it avoids

> **A booking is a document about a stop, not a second kind of stop.**

The standing rule is that every stop is a place, and three bugs have come from something keeping its own copy of what a place owns. A `bookings` kind is exactly the shape of that fourth bug if it is done carelessly — a flight with its own airport name, its own coordinates, its own opening hours.

**D-1. A booking never carries place data.** It carries `fromPlaceID` and `toPlaceID`, or `placeID` for a stay. The place owns the name, the coordinates and the address; the booking owns the reference number and the times. If they ever disagree, the place wins.

**D-2. A booking renders on the Plan as a different *kind of row*, not as a stop.** This keeps "every stop is a place" literally true rather than technically true. A booking row is a blue-left-bordered block between stops; it is not in the stop list, it does not take a stop's two clock times, and it cannot be dragged into the middle of one.

---

## 3. The record

```
bookings/{id} = {
  id, type,                       // 'flight' | 'stay' | 'transport'
  dayNumber,                      // the day it appears on
  provider, reference,            // 'KTX' / '8KQ2M4'
  startAt, endAt,                 // ISO, with timezone
  fromPlaceID, toPlaceID,         // transport and flights
  placeID,                        // stays
  detail: { ... },                // type-specific, see below
  cost, currency,                 // optional; links to an expense if paid
  expenseID,
  peopleIDs,                      // who it covers
  note, source                    // 'typed' | 'ics' | 'pasted'
}
```

**D-3. One kind with a `type` discriminator, not three kinds.** Flights, stays and transport share provider, reference, start, end, cost and who it covers, and differ in a handful of fields. Three kinds would mean three entries in the registry, three share rules, three export paths and three migrations — for a difference of four fields.

**D-4. `detail` is the only type-specific bag, and it is never rendered generically.** Each type has its own row layout; `detail` is read by that layout and nothing else.

| Type | `detail` holds |
|---|---|
| `flight` | flight number, terminal, gate, seat, bag allowance, check-in opens |
| `stay` | room count, check-in from, check-out by, breakfast, address line |
| `transport` | coach/car number, seats, platform, operator |

**D-5. `bookings` joins `SHARED_KINDS`.** A booking is a fact about the trip that the whole group needs, and it is the answer to "what time is the train". Costs travel; **the linked expense does not** (`p3-money-and-splitting.md` D-13).

---

## 4. On the Plan

**D-6. A booking row is blue-bordered, on the trip's blue token, and carries its reference.**

```
TRAIN · BOOKED
KTX 101 · 10:00 → 12:40
Coach 4, seats 3A–3C · ref 8KQ2M4
```

Three lines: what kind and its state, the fact, the details. The reference is on the row, not behind a tap, because the moment you need it is the moment someone is asking for it.

**D-7. Blue means a reference exists. It does not mean "transport".** A coach transfer the tour arranged is a green stop, because nobody can be asked to show it. This is the distinction that earned blue a place in the palette at all, and it must not erode.

**D-8. A stay renders once, on the day it starts,** with the nights it covers stated: `Haeundae · check in from 15:00 · 2 nights`. Not on every day it spans — a three-night hotel drawing on three days pushes the actual plan off the screen.

**D-9. The day's sub-tabs are `Plan · Transport · Stay · Flights`.** `Plan` is the timeline; the other three are that day's bookings by type, in list form, for when you are looking for one specific document rather than reading the day.

**D-10. A booking with no times still renders**, at the top of the day, under `NO TIME YET` — the same treatment the warning strip already gives a timeless stop. A hotel you have booked but not checked the check-in time for is real information.

---

## 5. On the Map

**D-11. A transport booking draws its leg as a blue dashed line** between `fromPlaceID` and `toPlaceID`. A stay draws as a pin at its place. A flight draws as a blue dashed line between airports, straight — the app does not pretend to know the route.

**D-12. Tapping a leg opens the same place card as everything else** (IA D-13), showing the booking rather than a place.

---

## 6. Calendar import

This is the cheapest available answer to the app's weakest moment — "the trip filled itself in".

**D-13. The app imports `.ics` files, and nothing else.** Airline and hotel confirmations arrive as calendar invites. Parsing `.ics` is free, offline, and needs no account with anybody — which is the entire reason it is here rather than an email integration.

**D-14. An import is a review, not an apply.** It lands in the existing paste-review flow (`p1-paste-review-design.md`), one proposed booking at a time, each accepted or rejected individually. The app has a good review surface already; an importer that writes straight through would be the only thing in the app that does.

**D-15. What is parsed, and what is not.**

| Parsed | Handling |
|---|---|
| `DTSTART` / `DTEND` with `TZID` | converted to the trip's local time and shown in it; the original zone is kept in `detail` |
| All-day events (`VALUE=DATE`) | become a booking with no time, per D-10 — never midnight-to-midnight |
| `SUMMARY`, `LOCATION`, `DESCRIPTION` | provider and reference extracted by pattern; anything unmatched goes to `note` verbatim |
| `UID` | stored, so re-importing an updated invite updates rather than duplicates |
| Recurrence (`RRULE`) | **not supported.** A recurring booking is not a thing a trip has. Rejected with a reason |
| Attendees, alarms, attachments | ignored |

**D-16. The place is matched, never invented.** `LOCATION` is matched against the trip's existing places first, then geocoded via OpenStreetMap on review, and if neither works the booking is created with no place and says so. It never fabricates coordinates — the standing rule against invented positions.

**D-17. Timezone handling is the risk, and is tested against real invites.** A flight landing the day after it departs, an invite in a zone the phone is not in, a DST boundary. These are the cases that make an import silently wrong rather than visibly broken.

---

## 7. Test obligations

1. **`.ics` parsing against real airline and hotel invites**, including a cross-midnight flight, a `TZID` the device is not in, an all-day hotel event and a DST boundary.
2. **Re-importing the same `UID` updates, does not duplicate.**
3. **An `RRULE` invite is refused with a stated reason**, not silently dropped.
4. **A booking carries no place data** — asserted structurally, so the fourth copy-of-a-place bug cannot be introduced.
5. **A stay renders once**, on its start day, whatever its length.
6. **`bookings` round-trips** export/import, share, "empty this trip" and the pending ledger — the five-test checklist for a new kind.
7. **`itinerary.js` gets its first unit tests** while it is being touched; it is 348 lines with zero coverage.

---

## 8. Decisions

1. **D-1** A booking never carries place data; the place wins on any conflict.
2. **D-2** A booking is its own kind of row on the Plan, not a stop.
3. **D-3** One `bookings` kind with a `type` discriminator.
4. **D-4** `detail` is type-specific and never rendered generically.
5. **D-5** `bookings` is shared; the linked expense is not.
6. **D-6** A booking row shows kind, fact and reference — reference always visible.
7. **D-7** Blue means a reference exists, not "transport".
8. **D-8** A stay renders once, on its start day, stating the nights.
9. **D-9** The day's sub-tabs are Plan · Transport · Stay · Flights.
10. **D-10** A booking with no times renders under `NO TIME YET`.
11. **D-11** Transport and flight legs draw as blue dashed lines; stays as pins.
12. **D-12** A leg opens the same place card as everything else.
13. **D-13** `.ics` import only; no email or airline integration.
14. **D-14** An import is a review, one booking at a time, through the existing flow.
15. **D-15** Recurrence is refused; attendees, alarms and attachments are ignored.
16. **D-16** Places are matched or geocoded on review, never invented.
17. **D-17** Timezone cases are tested against real invites.
