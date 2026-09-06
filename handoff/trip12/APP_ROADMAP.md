# APP_ROADMAP.md — what the app needs so nothing researched has to be thrown away

Written 4 Sep 2026, after harvesting `slm37102/tohoku-trip-map` (Trip 1, 15–22 Aug 2026) and
verifying every candidate. This extends `APP_GAP_ANALYSIS.md` §6 rather than replacing it.

**The framing that matters.** By now four separate things have produced data the schema cannot hold:
the original map, the app extract, the 4 Sep itinerary revision, and the third-party map. Each time,
the answer has been an `x` block. That works, but it means the app can *store* the research and
still not *use* it. This document is ordered by how much of the existing research each change
unlocks — not by how hard it is to build.

---

## P0 — required, or data already collected is silently lost

### 0. `stopSummary` — the do / eat / snack / buy / see line per stop
**Have it now: 33 stops × 5 lines = 165 lines, with 196 corrections logged against the original prose.**

This is the single most-used view on a trip like this and the schema has nowhere to put it. The seed
carried four of the five lines as `x.mustDo` / `x.mustEat` / `x.mustBuy` / `x.mustSee` — good writing,
stranded in a block the app ignores. The fifth line, **`snack`**, did not exist and is the one that
matters most here: **every meal on this trip is already booked**, so "what do I buy and eat standing
up in twenty minutes at Ouchi-juku" is the only food question a traveller actually has.

```js
// on PlanItem (the stop), not on Place
summary: {
  do:    'MISSION 1, the banner photo, in the FIRST TWENTY MINUTES on Shirogane Bridge…',
  eat:   'Standing-eat namaage at Nogawa Toufuya, ¥250, CASH ONLY — opens 08:30…',
  snack: 'Two named ones, both by Shirogane Bridge…',
  buy:   'A hand-painted kokeshi from Izu Kokeshi Kobo, 08:30–17:30, from about ¥1,100…',
  see:   'From mid-bridge, the double row of three- and four-storey wooden ryokan…',
  confidence: 'high',
  correctedFromSeed: ['…']      // audit trail; render as a collapsed "N corrections" disclosure
}
```

**Why it belongs at P0 and not in the nice-to-have pile:** the five lines are the only place in the
whole dataset where 526 place records get *resolved into a recommendation*. A traveller standing at
Ginzan at 09:35 cannot read 31 place records. They can read five lines. Everything else in this
document makes the data better; this is what makes it usable.

**Two UI notes learned from building the review page for it:**
- Render it **first**, above hours and above the place tables. It is the answer; everything below is
  the evidence.
- Colour the five labels differently (we used indigo/ochre/vermilion/moss/blue) — people navigate to
  "snack" by colour after the second stop, not by reading the label.
- Seven stops have an **honestly empty** snack line — an airport at 07:30, a hotel with no konbini
  within 500 m. Render that as the sentence it is, never as a blank cell.

### 1. `removedFromDay` — superseded stops that stay viewable
**Have it now. Nothing in the schema can hold it.**

The 4 Sep revision changed four hotels. 34 records are marked `"retired": true` with a
`removedFromDay` manifest carrying `reason`, `replacedBy`, `keepBecause` and
`importAs: "Removed from this Day"`. The explicit instruction is that they must stay **viewable**,
grouped under that label on their original day — not deleted, not merged into the replacement.

```js
// on the day, not the place
removedStops: [{
  stopName: 'Okuiizaka Anabara Onsen Yoshikawaya',
  reason: 'Superseded 4 Sep 2026; night 3 moved prefecture',
  replacedBy: 'Mercure Miyagi Zao Resort & Spa',
  removedOn: '2026-09-04',
  keepBecause: '…',
  recordIDs: ['…']          // places / shopping / mustSee that hang off it
}]
```
**UI:** a collapsed section at the bottom of the day, headed "Removed from this Day (3)", styled
struck-through. Tapping opens the full detail. This is the difference between a planner that
remembers why a plan changed and one that pretends it never did.

### 2. `backupFor` — an alternative stop researched alongside the real one
**Have it now: `Ginza`, 27 places deep, as a declared alternative to Shisui Premium Outlets.**

```js
{ kind: 'backup', backupFor: 'Shisui Premium Outlets', day: 7,
  recommendation: 'keep-primary',           // or 'prefer-backup' | 'undecided'
  tradeoff: 'Better place, worse stop — a 45-seat coach cannot stay in Ginza.' }
```
**UI:** the day shows the primary stop with a "1 alternative" chip. Both are fully browsable; neither
is the truth until the agent decides. Without this, a researched alternative either overwrites the
real plan or gets dropped.

### 3. Record precedence — because corrections now arrive out of band
**Have it now: 17 records are corrected by a later batch that deliberately reuses their `id`.**

The topup batches carry `appliesAfter`, and applying them in the wrong order lets the stale value
win. The app needs to model that a record has a **history**, not just a current value:
```js
{ id: '06cb9e37e31a', …,
  supersedes: { correctedOn: '2026-09-04', was: 'sold as the fallback bath',
                now: 'closed 3–10 Sep 2026 for source maintenance',
                source: 'https://…' } }
```
This is the same idea as APP_GAP_ANALYSIS §3's "provenance & confidence", but the trigger is
different: not *how sure* we are, but *what we used to think*. **On this trip it would have stopped
the group walking downhill to a locked bathhouse.**

### 4. `coordPrecision` needs a third value: `wrong-and-fixed`
Two records this session were marked `verified` and were badly wrong — one in the Pacific Ocean
260 km from Sendai, one geocoding a **town polygon** 2.4 km from Shisui Premium Outlets. `verified` /
`approximate` cannot express "this was confidently wrong and has been corrected against five
sources". Add `coordFix: {was, why, sources[]}` and show a small marker on the pin.

---

### 5. Full-text search is not optional at this size
**Learned the hard way this session.** With 526 places across 33 collapsible stops, a record can be
present, correct, and completely unfindable — Ishii Sports was the 28th row of a 28-row table inside
a collapsed stop on Day 7. The user could not find it and reasonably concluded it was missing.

Any UI over this dataset needs a single search box that covers `name`, `nameJp` and `note` across
places, must-see shots and shopping, and on selection **jumps to the day, expands the stop, and
highlights the row**. Searching `nameJp` matters more than it sounds: half these places are more
findable as 蒲鉾 or こけし than by romanisation, and the romanisations are themselves unreliable — see
和楽足湯/Warashiyu.

---

## P1 — turns a store of facts into advice

### 5. Ranked recommendations, not flat lists
The third-party map's single best idea. It carries, per hotel:
- **`top3`** — the three best things to do *tonight*, in order, each already reasoned against the
  arrival time.
- **`eat3`** — three numbered dinner options with walking minutes and last orders.
- **`morning`** — a short narrative for the dawn window before the coach.

Our data has all the ingredients and none of the ordering. A 35-person group at 20:00 does not want
eleven places sorted by distance; it wants **"go here, and if it's full, here."**

```js
Place.rank        = 1 | 2 | 3 | null     // within (stop, purpose)
Place.purpose     = 'dinner' | 'supper' | 'bath' | 'stroll' | 'omiyage' | 'dawn'
Place.rankWhy     = 'Only place open across the whole 20:00–22:30 window'
```
Cheap to add, and it is what makes the app worth opening at 20:00 in Naruko.

### 6. `needsRide` — stop pretending everything is walkable
We now cap walking at 30 minutes and push anything further onto a train or bus leg. But "3.6 km,
train, 15 min, one change, ¥290" is a materially different proposition from a 6-minute walk, and the
UI currently cannot say so. Their map had a blunt `ride: true`. Better:
```js
legs: [{mode:'walk',minutes:4},{mode:'train',minutes:15,changes:1,fare:290},{mode:'walk',minutes:3}]
reachable: { doorToDoor: 22, oneWay: true, verdict: 'not-within-stop' }
```
**Ishii Sports is the worked example:** open at 10:50, but 44 of the group's 60 Tsukiji minutes are
transit. The honest answer is "not on Day 7 — go from Shinjuku on Sunday evening instead", and the
app should be able to *render* that conclusion rather than leave a pin looking reachable.

### 7. `snack` as its own purpose, separate from `eat`
Their schema splits `eat` (a sit-down meal) from `snack` (something eaten walking). On a coach tour
with all meals included, **the snack list is the one people actually use** — every meal is already
booked, so "what do I buy and eat in 20 minutes at Ouchi-juku" is the real question. We have the
content; `category: 'food'` flattens it.

### 8. Negative knowledge as first-class data
Two collections in their map hold nothing but rejections, and both are more useful than they look:
- **`dropped_too_far`** — candidates considered and rejected, with the distance and the reason.
- **`closed_but_still_listed_online`** — places that are *permanently shut* but still rank in search.

We generated the same knowledge this session and it currently lives only in prose: Waseda Sajiki-yu
shut 3–10 Sep, 鬼怒川公園岩風呂 closed permanently in Mar 2024, Rec's Yoyogi / PEKI PEKI / GRAVITY
RESEARCH Ginza / Noboridokoro Hatchobori all closed years ago, Ryuzu Falls at 80 minutes on foot,
Akanuma at 60 minutes against a 60-minute stop.

```js
rejected: [{ name, nameJp, reason: 'too-far'|'closed'|'wrong-season'|'no-time',
             detail: 'Closed permanently 31 Mar 2024', source, lat, lon }]
```
**UI:** a "Considered and ruled out" list per stop. It stops the next researcher redoing the work,
and it stops a traveller with a phone finding the closed place and going anyway.

---

## P2 — the closing-day checker, extended

APP_GAP_ANALYSIS §5 proposed a hours-vs-date checker. The research since then says it needs to cover
four more cases, all of which bit on this trip:

| Case | The example from this trip |
|---|---|
| **Temporary closure for a date range** | Waseda Sajiki-yu, closed 3–10 Sep 2026 for source maintenance — a normal weekly-hours check passes it |
| **Last admission vs stop end** | Zao Fox Village admits until 16:00, closes 16:30, coach leaves 16:40 |
| **Sub-venue opens later than its parent** | Kinen no Mori Rest House opens 10:00 inside a 09:30–10:30 stop; Tokyo Tower's whole food offer opens 11:00 for a 09:00 arrival |
| **Vehicle access, not opening hours** | Toshogu bans coach parking at weekends. The shrine is open; the coach cannot park |

```js
closures: [{ from:'2026-09-03', to:'2026-09-10', reason:'源泉 maintenance', mayExtend:true, source }]
lastAdmission: '16:00',
vehicleAccess: { coach:'weekdays-only', note:'土・日・祝祭日は駐車不可', source }
```
And the check should run against **the group's actual window at that stop**, not just the date —
which needs `PlanItem.time` and `durationLabel` populated, which the app extract already has.

---

## P3 — the group-trip layer, unchanged in priority but sharper in scope

APP_GAP_ANALYSIS §6 already lists this. Two things learned since:

1. **A mission can be orphaned by an itinerary change.** Mission 2 was pinned to a hotel that left
   the itinerary on 4 Sep. A mission needs to reference a *stop* and survive that stop being
   replaced — with a visible "this mission's location no longer exists" state.
2. **Missions need a capacity and a dress-code precondition.** "35 people plus a 240×100 cm banner"
   is a spatial requirement; "hotel-provided yukata" is a supply requirement that turned out to
   depend on whether the hotel lends them in the room or at the front desk. Both decide whether the
   mission is possible before anyone arrives.

---

## What NOT to build

**Do not build the sport layers.** The source map carries 12 climbing gyms, 8 gear shops and per-hotel
running routes, and a `runs` map layer. Dropped at the user's request — not a sports person. The one
exception kept is **Ishii Sports**, held as an ordinary shop record near Tsukiji, because its
mountaineering floor is worth a look regardless of climbing. If the app ever wants an activity layer,
make it a **user-selectable interest tag** on places (`interests: ['climbing']`) rather than a
top-level collection, so one traveller's hobby does not become everyone's schema.
