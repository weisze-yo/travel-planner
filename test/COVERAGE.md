# What there is to test

Nineteen screens and about two hundred store functions, built over seven
rounds. This is the inventory, so a test pass can be complete rather than
wherever attention happened to land. Written 4 Sept 2026 at commit `0c0b35d`.

Work down it. For each row: does it do what it says, does it survive a
reload, does it hold a long CJK name, and does it say something useful when
it is empty. Record what you find in `test/REPORT.md` — one entry per
finding, each with the exact steps that produce it.

## The rules nothing may break

- No paid APIs. Weather is Open-Meteo, places are OpenStreetMap, rates are
  the ECB. All free and keyless.
- It must work offline. Map tiles are the only thing needing the network.
- Delete is always swipe-left to a red dustbin **with a confirmation**.
- Every stop is a place. A stop is a *visit to* a place, never a second
  kind of record. Three separate bugs have come from something keeping its
  own copy of what a place owns.
- Sharing is snapshot-and-review, not live sync. Everything you change stays
  on your phone until you send an update; the far side reviews it a change
  at a time. Only the itinerary, sub routes, places and must-see spots
  travel. Shopping, packing, the Log and photos never do.

## Screens

| Screen | Tab | What it must do |
| --- | --- | --- |
| `trips` | — | Running / coming up / finished. Cover from a Log photo, a tint, or the phone. Swipe to delete a trip. New trip blocks the screen behind a scrim. A trip you were removed from shows once, not twice. No tab bar here. |
| `map` | Map | Leaflet route, day pills, the pull-sheet at three heights, Nearby for the whole day, a row frames its stop. The stranded banner must name the real reason. |
| `plan` | Plan | Two times per stop with the length derived. Lanes of free time between stops. Three warnings — out of order, overlaps, ends when it starts — each with its one-tap fix. Drag to reorder. Edit mode owns: add a stop, delete a stop, add a sub route, delete a sub route, delete a removed stop. An update banner when one is waiting. |
| `dest` | Map | Info / Nearby / Must-see / Shop / Notes, counts on the tabs. Facts typeable. Shots addable, editable, deletable, with a picture. Shop rows correctable and swipeable. The sub route pinned under Nearby. |
| `nearby` | Map | Sort, filter by category, add a place by name or a pasted map link, add to a loop. |
| `sub` | Map | View mode versus edit mode. Departure and return, both ends chosen by name, reorder, add places, send the walk to Maps. Its own pull-sheet. |
| `shop` | Shop | Grouped by place, day and place filters, tick to bought, type the real price, payment, category, quantity. Correct an item in four fields, including moving it between places. Swipe to delete. |
| `spend` | Shop | Dark hero, per-day chart that is also the filter, where it went, guessed against paid, cash against card, every purchase with the gaps named. |
| `prep` | Prep | Categories, packed progress, add and delete items and categories, what to wear for the day, what you are actually bringing. |
| `log` | Log | One card per day, notes stacked under the place each was written at, times, photos. The privacy line on a shared trip — including when the Log is empty. |
| `note` | Log | Place and day as one changeable line, time, already-here-today, photos, save and delete. |
| `paste` | Plan | Text in, graded rows out — read / worked out / could not read. Day headings. Per-row correction, split a line, move to another day. Nothing lands until the summary. **Or** open a trip file, which says what is in it first. |
| `trip` | Map | Name, dates, length, city. Money and the ECB rate. Forecast. Offline map and unsent changes. Paste an itinerary. Save as a file. Share. Empty this trip, with a confirmation. |
| `share` | — | Before the link: role and expiry chosen first. After: who has it, the update button with a count, the link with its terms, turn it off. |
| `join` | — | Trip first, real stops, the three promises, one button. Sign in after saying yes. Expired, switched off, already joined, offline. |
| `review` | Plan | One row per difference, yours against theirs, take or keep. Take all / keep all. Empty state. |
| `areas` | Map | Kept areas, what each covers, refresh, resize, storage total, stops outside every area. |
| `area` | Map | Draw a box, streets or doorways, size before committing, progress, refuse above the cap, wait for wi-fi. |
| `stuck` | — | Why they are stuck, what would be lost, how many tries, save a copy, share, stop trying with a confirmation. |

## Cross-cutting

- **Boot migrations**, in order: `unifyNotes` → `unifyPlaces` → `unifyWindows`
  → `unifyLoops`. Each must be idempotent — run twice, change nothing the
  second time.
- **The strip** above the tab bar: leave-now, stuck changes, outside every
  kept area. One at a time, ranked, and empty most of the day.
- **Undo**: every delete leaves a six-second undo bar, from one slot.
- **The sync dot** on the trip chip: saving, saved, queued, stuck, local.
- **Offline**: with the network off, every screen still reads and edits.
- **A signed-out phone** gets the sample trip. **A signed-in account with no
  trips** gets an empty trips home and says so.

## Already known, do not re-report

Two findings from 4 Sept, both verified in the code, both still open. Confirm
them, then move on:

1. **The owner is never told anyone joined.** `joinTrip` writes the joiner
   into the *guest's* new trip only; nothing writes them into the owner's
   `trip.people`, and the share sheet reads only that. So it says "Nobody
   else, yet" forever.
2. **`link.opens` is set to 0 and never incremented anywhere.** The share
   sheet's "opened 0 times" is a dead number.
   The envelope's `editors` array is the one channel that does carry
   anything back to the owner, and nothing reads it. A read-only joiner
   never appears in it at all.

## What the machine can already do for you

`test/README.md`. The two-phone test drives two browser contexts against
real Auth and Firestore emulators running this repo's rules — 36 checks.
Extend it rather than starting again.
