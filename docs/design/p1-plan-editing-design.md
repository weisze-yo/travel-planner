# P1 — Editing the day: the Plan's own interactions

**Date:** 5 Sep 2026 · **Verified against** the working tree in this project (`web/**`), read this session
**Status:** design, for review. **Nothing implemented. No application code changed.**
**Artboard:** `P1 Plan Editing.dc.html` — 390 × 844 frames and 390px-wide crops, light only.
**Canonical:** this document for the eight interactions below. §10 is the only source of copy.

**Source read this session:** `web/js/screens/plan.js` (whole — `render`, `mount`, `stopRow`, `stopChips`, `laneRow`, `loopCard`, `laneForm`, `mountLaneForm`, `addForm`, `archive`, `emptyDay`, every handler) · `web/js/screens/parts.js` `bindDragReorder` (136) · `swipeToDelete` (218) · `undoBar` (385) · `emptyDay` (53) · `dayPills` (40) · `web/js/store.js` `dayIssues` (~996–1080) · `applyIssueFix` (2147) · `archivePlanItem` · `restorePlanItem` · `movePlanItemToDay` · `movePlanItem` · `deletePlanItem` · `setPlanItemWindow` · `captureStop` · `addSubRoute` · `loopEndpointOptions` · `rememberUndo` (~858) · `web/css/app.css` `.plan-*` (612–667, 1110–1153) · `.warn` family (1150–1176) · `.lane-*` (1178–1209) · `.archive-*` (649–667) · `.swipe-*` (1003–1044, 1663–1728) · `.form` (386–398) · `.handle-grip` / `.dragging` / `.drop-into` (400–402).

**Fixed foundations, not reopened:** the **fact-first warning strip** (P0-3 §2.2 — `LISTED AFTER` / `OVERLAPS` / `ENDS WHEN IT STARTS` / `NO TIME`, three slots, the `dayIssues()` split) · the **three-tier empty-state system** (P0-3 §1, incl. S-4: a stopless shared day gets no action) · **P0-5** (pending on the control, `.amber-note` for outcomes, no spinner, synchronous work gets nothing) · **P0-1** (a joined copy is still fully editable) · **P0-4** (a stop moved between days renders as a normal changed row) · the semantic colour contract · "a warning always names the tap that fixes it" · one ink primary per screen · 390 × 844.

**Out of scope, deliberately:** the sub route's own screen (`p1-coverage-gaps-design.md` §3) · Destination (`p1-destination-tabs-design.md`) · the warning strip's *structure*, which is settled · the Paste import (`p1-paste-review-design.md`) · what a stop looks like on the Map.

---

## 1. What this screen already is

The Plan is the app's most-used screen and the least documented interaction set in it. Read end to end, **most of it is already designed, and one part of it is better than any document says.** The corrections matter more than the additions, so they come first.

| Claim in the coverage matrix | Verified | Verdict |
|---|---|---|
| "Delete a stop: swipe → latch 88px → in-row confirm → undo" | `swipeToDelete` is bound to `[data-plan-row]`. **`stopRow()` never sets `data-plan-row`** — it sets `data-row-id`. Only `archive()` sets it, and only in edit mode. | **Wrong. A live stop cannot be swiped at all** (RC-9). |
| "Plan — edit mode: badges become rust `✕`" | `.plan-remove` is a 26px r9 `--danger-bg` / `--danger-fg` `✕`, and it calls **`archivePlanItem`**, not delete. | **Right about the control, wrong about what it does** (RC-9). |
| "Archive card: dark `.dark-card`, collapsed archived stops" (P2) | `.archive-card` is a full dark card under a `REMOVED FROM THIS DAY` eyebrow, holding the name, `was 09:15 · tap to open`, `Add back`, and the `MOVE TO` day chips. Nothing is collapsed. | **Wrong, and it is not P2** — it is half of the app's destructive model (RC-10). |
| "Move a stop to another day: what does the vacated slot do?" | `MOVE TO` exists **only on archived rows**. You cannot move a live stop; you remove it first. And a gap between stops *is* a free-time lane, derived — so the vacated slot becomes free time with no code and no decision. | **The question answers itself in source** (RC-11). |
| "Plan — empty day: approve the tier-1 in-screen block" | `plan.js` has its **own** `emptyDay()` — two `.lane-stub` dashes, a 15px/700 line, a 280px-capped teaching paragraph, ink + ghost actions, and a closing hint. That *is* the tier-1 treatment. | **Already implemented** (RC-12). `parts.js`'s `.empty` twin is used by the **Map sheet**, not by Plan. |
| "Commit-on-blur is invisible; no save affordance" | True, and the reason is stated in `plan.js`'s own header: a whole-node repaint would interrupt typing. | **Stands.** Designed in §4. |
| "Reorder stops: `.dragging` / `.drop-into`, unverified" | Bound only in edit mode, handle-only (`[data-grip]`), `onDrop → movePlanItem`. `.dragging` is `opacity: .4`; `.drop-into` is `inset 0 2px 0 0 var(--amber)`. | **Stands** — never seen, fully specified. Designed in §5. |

**So the real work here is five specifications and two corrections**, not a redesign. The screen's architecture — two times per stop, free time as a slot, a drag that always lands and wears its consequence — is the product's core idea and is not touched.

---

## 2. The one principle this screen adds

> **Edit mode is a mode, and everything destructive lives inside it.**

Verified true today and worth stating because it is what makes the Plan safe: outside the pencil there is **no** control on this screen that can change or destroy anything. The `✕`, the grips, the time inputs, the `MOVE TO` chips, `Add back`, the swipe bins on archived rows and sub-route cards, `+ Add a stop` and `Paste an itinerary` are all gated on `state.editingPlan`. A stop card outside edit mode is a link and nothing else.

Two consequences that resolve questions elsewhere:

1. **The Plan needs no confirmation on entering edit mode and none on leaving it.** There is no dirty state — every commit is immediate (§4) — so the pencil is a lens, not a transaction.
2. **The destructive ladder is two-stage by construction** (§6). Nothing on the Plan deletes on first touch.

---

## 3. Entering and leaving edit mode

**Verified:** the pencil is an `.iconbtn.filled` (40×40, r13, white, `0 2px 10px rgba(20,32,28,.12)`) holding `icon.pencil('#14201C', 17)`. Editing swaps its background to `--jade` inline and its glyph to `icon.tick('#fff', 15)`, and it already carries `aria-pressed` and a branched `aria-label`. Below the pills, an `.hint-amber` appears: *"Drag by the handle. Both times are yours to set — the length follows."*

**Designed: two additions, nothing removed.**

1. **The hint says what the `✕` does**, because that is the one control whose consequence is not guessable from its shape. One clause, appended:

> `Drag by the handle. Both times are yours to set — the length follows, and ✕ takes a stop off the day without deleting it.`

The glyph is written into the sentence rather than described in words, so the sentence points at the thing it is about. This is the only place in the design where a glyph appears inside copy, and it earns it: the alternative — "the cross beside a stop" — makes the reader hunt.

2. **Leaving edit mode with an archive that is not empty says so once.** `archivePlanItem` leaves rows under `REMOVED FROM THIS DAY`, and outside edit mode those rows are visible but their controls are not — so a user who removed three stops and tapped the tick sees a dark section they can no longer act on. One line, in the archive section's head row, outside edit mode only:

> `REMOVED FROM THIS DAY` · `3 kept here · press the pencil to put one back` — 11px `--soft`

**No exit confirmation, no "unsaved changes", no autosave notice.** Every edit is already written; there is nothing to protect. Stated explicitly because it is the obvious thing to add and it would be wrong.

---

## 4. The two times, and the invisible commit

### 4.1 What happens now

Both `.edge` inputs (60px wide, 5·3 pad, 11.5px/700, tabular, r9) commit on `change` — i.e. as focus leaves. Three branches, all verified:

| Input | Behaviour |
|---|---|
| End emptied, or set to `—` | `setPlanItemWindow(..., { end: null })` — an open end, and a real edit |
| Unparseable text | **the input's value is restored** from the item, silently |
| Valid clock | `setPlanItemWindow(..., { [which]: text })`, then the whole node repaints |

`.edge-derived` (10px/700 `--faint`) shows the derived length beneath them, so the third value updates itself.

### 4.2 The three gaps

1. **A silent revert is indistinguishable from a silent accept.** Type `9pm` in the start field, tab away, and the field snaps back to `09:15` with no explanation. The app's own parser accepts `9.15am` and `13:30` (verified in Paste's `WHAT IT LOOKS FOR`), so the user has no way to learn which forms work.
2. **A successful commit has no acknowledgement either** — the repaint is the only signal, and on a value that did not move much it is invisible.
3. **`—` is the app's word for an open end and the placeholder is the only place it is taught.**

### 4.3 Designed

**The commit stays on `change` and stays immediate.** Staging would give the Plan a save step the app has nowhere else, and the reason for `change` is structural (the repaint). Three additions, all inside the row:

**1 · A rejected value says why, in the gutter, for that row only.** The `.edge-derived` slot — which is directly beneath the two inputs and holds a derived value that is meaningless while a time is invalid — carries the reason instead, in `--danger-fg`:

> `09:15` · `10:00` · `not a time` *(instead of `45 min`)*

It clears on the next valid commit or the next repaint. **It replaces a value rather than adding a line**, so no row changes height and nothing below it moves — which is the whole reason it goes here and not in the `.amber-note` slot at the top of the scroller (P0-5 R4: that slot is for outcomes, and a typo is not an outcome).

**2 · The accepted forms are named once, in the edit-mode hint**, where the user already is:

> `24-hour or am/pm — 13:30, 9.15am. Leave the end as — for an open end.` — 11px `--soft`, under the `.hint-amber`

This is the same act as Paste's `WHAT IT LOOKS FOR` card, at one line, in the place the times are typed.

**3 · A commit that changes a time gets no acknowledgement, deliberately.** P0-5 R10's sibling: the repaint *is* the receipt, the derived length moves with it, and a flash on every field exit in a column of six rows would be noise. Where a commit has a *consequence beyond the row* — a stop that now overlaps its neighbour — the consequence already appears as a `.warn` strip on the affected row, which is the app's own answer and is better than a confirmation.

**Long/CJK:** neither field takes text; the inputs are `inputmode="numeric"` and their content is always four to five characters. `not a time` is fixed English at 10px in a 60px column — measured: it fits on one line at 10px/700, which is why the string is two short words and not "that is not a time".

---

## 5. Reordering

**Verified:** `bindDragReorder(root, { rowSelector: '[data-row-id]', handleSelector: '[data-grip]', onDrop })` is bound only when `state.editingPlan`. The grip is a `.handle-grip` — 26px wide, `cursor: grab`, `touch-action: none` — holding `icon.grip`. `.dragging` is `opacity: .4` on the row being moved; `.drop-into` is `box-shadow: inset 0 2px 0 0 var(--amber)` on the row it would land above. `onDrop` calls `movePlanItem(day, movedId, beforeId)`.

**Designed: the states are recorded, and one is added.**

| State | Treatment |
|---|---|
| At rest, edit mode | the grip, left of the gutter, 26px |
| Dragging | the row at `opacity: .4` — **existing, unchanged** |
| A landing place | a 2px amber rule inset at the top of the row it will sit above — **existing, unchanged.** Amber is right: a reorder is something *you* planned |
| **Dropped** | the row lands, the day recomputes, and **any row whose times are now wrong wears its `.warn` strip** — existing behaviour, and it is the screen's stated principle (*"the drag always lands"*) |
| **Dropped with no change** | nothing. The drag resolved to the same index; there is no "no change" message |

**One addition: the grip is not the only way.** A drag-only control is unavailable to anyone who cannot drag, and the app has already made this call once — `draggableSheet`'s handle "is also a plain button, because a drag-only control is invisible to anyone who cannot drag". The same reasoning applies here, and the mechanism already exists: **the archive.** Removing a stop and adding it back re-inserts it in time order, which is a keyboard-reachable reorder for the common case (a stop in the wrong place is usually a stop with the wrong time — and the times are editable inputs).

So: **no arrow buttons are added**, and the hint names the alternative rather than the design growing a second control ladder:

> `A stop out of order is usually a stop with the wrong time — fixing the time reorders it.`

Recorded as the accessibility answer for this interaction, and as **the reason arrow buttons were rejected**, so nobody adds them later on accessibility grounds without reading this.

**No reorder across days by drag.** `movePlanItem` takes a day number and a `beforeId` within it; dragging a row off the bottom of a day has no target. Moving between days is §6.3.

---

## 6. The destructive ladder — two stages, and it is good

### 6.1 What is built

**RC-9 / RC-10.** Two different controls, two different meanings, and the coverage matrix conflates them:

| Stage | Control | Where | Calls | Reversible by |
|---|---|---|---|---|
| **1 · off the day** | `.plan-remove` — a 26px r9 `--danger-bg` `✕` on the stop card | edit mode, on the live row | `archivePlanItem` | `Add back` on the archived row, any time |
| **2 · gone** | swipe the **archived** row left → latch at 88px → in-row confirm → 6s undo | edit mode, on the archived row only | `deletePlanItem` | the app-wide undo bar, for 6 seconds |

The swipe's own label is already exact: **`Off the trip for good — not into the archive`**. Sub-route cards have their own swipe with `The places you picked stay saved`.

**This is the best destructive model in the app** — a reversible removal that keeps the thing visible and openable, then a deliberate second gesture for the irreversible one — and it has never been written down. It is also the answer to two questions asked elsewhere: it is why the Plan needs no delete confirmation on the live row, and it is why "the vacated slot" is not a decision (§6.3).

### 6.2 Designed — three statements, no new control

1. **The archive section is named for what it is, and says how to undo it.** Its eyebrow stays `REMOVED FROM THIS DAY`; the count line in §3 tells the reader the way back. `.archive-was` already reads `was 09:15 · tap to open`, which is the other half — an archived stop is still a place with its notes, shopping and must-see spots, and tapping it opens Destination. Unchanged.
2. **The `✕` names its consequence in the hint**, not in a tooltip (§3).
3. **The swipe's in-row confirm and its 6s undo are unchanged**, and the undo label is the existing app-wide one.

### 6.3 The vacated slot — RC-11, answered from source

**Nothing has to be decided, because a gap is not a hole.** `dayTimeline()` derives a free-time lane from every gap between positioned stops of at least `MIN_LANE_MINUTES` (45). Remove the 14:00 stop and the 13:00–16:00 gap becomes one lane, drawn dashed amber, with `+ Sub route here · 13:00 – 16:00` in edit mode. The day closes up *and* keeps the gap — the two options the coverage matrix framed as alternatives are the same behaviour, seen from either end.

**One consequence worth stating:** a lane appears where a stop used to be, so removing a stop **adds a row** to the day in edit mode. That is correct and should not be suppressed: the lane is where the freed time went, and it is the thing you would want to do something with.

**Moving a stop to another day** is `MOVE TO` on the archived row: `D1 D2 D4 D5 D6` (the current day filtered out), `.archive-day` chips at h26/r8 over `rgba(255,255,255,.14)`. `movePlanItemToDay` restores it into the target day. Designed additions:

- **The chips say where it went.** `.archive-moved` (11px/650 `#A8CFC0`) already exists in `app.css` and is **unused by `plan.js`** — a defined class for exactly this receipt. It gets its string: > `Moved to Day 4.` — in the card, replacing the `MOVE TO` row for that item until the next repaint.
- **`MOVE TO` on a long trip** follows Paste's answer (`p1-paste-review-design.md` §3.3) rather than inventing a second one: on trips of six days or fewer, every day chip; above that, **the two neighbouring days and `Another day…`**, which opens the day picker the chips already are, in a scroller. One vocabulary for "pick a day" across two screens.

---

## 7. Adding a stop

### 7.1 What is built

`+ Add a stop` (`.btn-dashed`, h48 r14) opens an inline `.form` — white, 1.5px `--ink` border, `gap: 8px`, `.form-title` 12.5/800 `Add a stop`. Fields: a name/link input; a `…or pick somewhere you have saved` select when places exist; two `.pill.small` radios (`The agent's route` / `My own plan`) carrying native inputs with `accent-color:#14201C`; `Starts` (82px, default `09:00`) and `Ends` (82px, placeholder `—`); a jade `Add`; a 38px ghost `✕`. `.form-hint` explains links and the blank end.

`add-save` → `captureStop({ input, time, endTime, kind, placeID })`, with `notice = 'Reading that link…'` for a URL and `'Adding…'` otherwise, rendered as an `.amber-note` **above** the form. Outcomes: `result.reason` on failure, the "added without a location" caveat when unlocated, empty on success.

### 7.2 Three gaps

1. **`if (!typed && !placeID) return;` — a silent refusal.** Tapping `Add` with nothing typed does nothing, says nothing. This is the same defect as the New trip modal's silent name validation, and the same fix applies.
2. **Pending is in the wrong place** — `Adding…` renders above the form while the button pressed is inside it (P0-5 R1).
3. **The select prefills the name but not the times or the kind**, so picking a saved place still leaves `09:00`. Correct — a saved place has no time — and worth stating so nobody "improves" it.

### 7.3 Designed

| | Today | Designed |
|---|---|---|
| Empty name | silent no-op | the name field takes the existing rust field-hint treatment (`trip.js`'s `field(..., warn)` pattern): `A name, or a map link.` The button stays enabled — the app does not pre-disable, it answers |
| Pending | `Adding…` above the form | on the button: `Add` → `Adding…` **[disabled]**, or `Reading that link…` for a URL. **The form stays up** until it resolves (P0-5 R8's third exception is Create; this is a fourth of the same shape, and it is stated here rather than assumed) |
| Success | form closes, `notice = ''` | unchanged — the stop is in the day, which is the receipt |
| Success, unlocated | the existing caveat as an `.amber-note` | unchanged, and it now agrees with the standing chip (`p1-absence-and-removal-design.md` §4) |
| Failure | `result.reason` as an `.amber-note` | unchanged — an outcome, correctly amber, correctly at the top |

**`Reading that link…` keeps its interpolation-free form** (P0-5 §6: a pending label never interpolates), and `Adding…` was already right.

---

## 8. A new sub route, from a lane

**Verified:** `laneRow` draws a lane for every gap; outside edit mode an **empty** lane is not drawn at all (`if (!editing && !lane.loops.length) return ''`) — a deliberate call recorded in the source: *"drawing a dashed '+ Sub route here' button in every one of them turned the Plan into a form."* In edit mode the lane offers `+ Sub route here · 13:45 – 15:45` (`.lane-add`, h38, dashed) or `+ Another sub route here` (`.lane-add.more`, h32) when one already exists.

Tapping it replaces the whole Plan with `laneForm` — a full screen, `icon.close` in a `.head-row.center`, `New sub route` / `Day 3 afternoon · <lane label>`, then `NAME`, `LEAVE`, `BE BACK BY`, and `START AT` / `END AT` selects drawn from the day's positioned stops. `Create and pick places` → `addSubRoute` → `go('nearby', { loopID, anchorID: startPlaceID })`.

**Two things are already answered here that documents list as open:**

- **"Can a loop exist on a day with no stops?"** — `inside.length` is zero, the two selects are omitted, and the form says so: *"This day has no stops with a position yet, so the sub route starts and ends wherever you are."* So **yes**, and the copy is honest about what it costs. This *appears* to contradict P0-3 §1.5 / S-4, which says a stopless shared day gets no action — but the two are about different things: §1.5 is about a **lane** existing to tap (it does not, so there is no entry point on a stopless day), while this form's fallback covers a day that has stops with **no positions**. Recorded as **RC-13**, resolved: both statements are true, and neither changes.
- **The back control is `icon.close`, not `icon.back`** — correct, because this form replaces the Plan rather than pushing over it, and cancelling returns to the same day. Stated because `paste.js`'s receipt was mis-drawn the other way round in a previous batch.

**Designed: two additions.**

1. **`Create and pick places` gets pending on the control** — `addSubRoute` is synchronous, so **it gets none** (P0-5 R10). What it gets instead is the fact that it navigates: nothing else. Stated so nobody adds a spinner to a screen change.
2. **Cancelling from the name field says nothing and loses nothing** — `laneSheet = null`, no lane is created, no draft is kept. Correct, and the header's `✕` is the affordance. No confirmation: there is nothing to lose but four form fields, one of which is optional.

---

## 9. Self-audit at 390 × 844

| Case | Behaviour |
|---|---|
| **Long stop name** | `.plan-name` is 14.5px/650 lh 1.25 in a `flex: 1; min-width: 0` column beside a `flex: none` badge — wraps to as many lines as it needs, card grows, gutter and spine unaffected. Verified in `app.css`; **this is the layout the CJK work depends on and it must not be lost.** |
| **CJK stop name** | Same column, line-height rises to 1.35 (P0-3 §2.3). The Latin-first stack applies (S-2, `body`). |
| **Long name in the archive** | `.archive-name` 13.5px/650 on the dark card, same wrap. |
| **A 14-day trip** | `MOVE TO` → two neighbours + `Another day…` (§6.3). Day pills are already a horizontal scroller (`.chiprow`, `overflow-x`), unchanged. |
| **A day with one stop** | No gap, so no lane, so no sub route can be started there. Correct, and `laneForm`'s fallback covers the no-position case (§8). |
| **A day with 20 stops** | One scroller. Edit mode adds a 26px grip column and widens the gutter 56 → 60px; the card column loses 4px. Measured: the name column keeps 249px in edit mode against 253px at rest. |
| **Every stop removed** | The archive holds them all and `emptyDay()` renders above it — the tier-1 block and the dark archive on one screen. Correct: the day *is* empty, and the way back is right there. |
| **Empty state** | `plan.js emptyDay()` — already the tier-1 treatment (RC-12). On a **joined** trip it becomes P0-3 §1.5's tier-3 jade card with **no action**. |
| **Loading** | `Adding…` / `Reading that link…` on the add button (§7.3). Everything else on this screen is synchronous and gets nothing (P0-5 R10): the pencil, the `✕`, `Add back`, `MOVE TO`, the time commits, the drag drop, `Create and pick places`. |
| **Error** | An unparseable time → `not a time` in the gutter (§4.3). `captureStop` failure → the existing `result.reason` as an `.amber-note`. Nothing else here can fail. |
| **Navigation away and back** | `addOpen`, `notice`, `form` and `laneSheet` are module state and die with the screen — correct, and the *edits* are all already written. `state.editingPlan` is **store** state, so edit mode survives a tab change and a return, which is right: it is a lens, not a transaction. |
| **Destructive actions** | Two stages, both existing (§6). `✕` → archive, reversible with `Add back`, no confirm and none needed. Swipe on an archived row → in-row confirm → 6s undo. Sub-route card swipe → same, with `The places you picked stay saved`. |
| **Undo** | The app-wide 6s bar, on `deletePlanItem` and `deleteSubRoute` only. `archivePlanItem` needs none — the row is on screen with a button on it. |
| **Focus** | `input:focus` already gets a jade border (`app.css` 104) so the two `.edge` inputs are the one focusable set on this screen that shows focus. The grip is a `div` with `cursor: grab` and is **not** focusable — recorded, and §5 states the non-drag route rather than making it one. |
| **Accessibility** | The pencil already carries `aria-pressed` and a branched label. `.plan-card` is `role="button" tabindex="0"` with the stop name as its label. The two time inputs carry `Starts` and `Ends, or a dash for an open end`. `aria-busy` goes on the add button while pending (P0-5 §6). |

---

## 10. Exact copy

**Canonical. The artboard may show these strings and no others** — plus, in a `TODAY` frame, existing source strings quoted verbatim as the “before”. Stop names, times and counts on the artboard are illustrative data, not copy.

**Existing strings the artboard draws, unchanged**
> `+ Add a stop` · `Paste an itinerary` · `+ Sub route here · 13:45 – 15:45` · `+ Another sub route here`
> `OVERLAPS` *(the kind label; P0-3 §2.2 keeps it)* · `Runs to 10:00 · this starts 09:45` *(the fact line)* · `Start 10:00` — **the one and only fix `dayIssues()` offers for an overlap** (`act: 'retime'`, the running stop's end; there is no second option)
> `Day 3` · `Sat 14 Mar` · `1 thing to look at` · `MAIN 1`

**Edit mode**
> Drag by the handle. Both times are yours to set — the length follows, and ✕ takes a stop off the day without deleting it. **(corrected — one clause added)**
> 24-hour or am/pm — 13:30, 9.15am. Leave the end as — for an open end. **(new)**
> A stop out of order is usually a stop with the wrong time — fixing the time reorders it. **(new)**

**A rejected time**
> `not a time` **(new — in the derived-length slot, `--danger-fg`)**

**The archive**
> `REMOVED FROM THIS DAY` *(existing)*
> 3 kept here · press the pencil to put one back **(new, outside edit mode only)**
> `was 09:15 · tap to open` · `Add back` · `MOVE TO` · `D1` … *(existing)*
> `Another day…` **(new, trips over six days)**
> Moved to Day 4. **(new — into the existing unused `.archive-moved`)**
> `Off the trip for good — not into the archive` *(existing swipe label)*
> `The places you picked stay saved` *(existing swipe label, sub routes)*

**Adding a stop**
> `Add a stop` · `Name, or paste a Google / Apple Maps link` · `…or pick somewhere you have saved` · `The agent's route` · `My own plan` · `Starts` · `Ends` · `Add` *(all existing)*
> A name, or a map link. **(new — the field hint on a silent refusal)**
> `Adding…` · `Reading that link…` *(existing strings, new placement — on the button)*
> `"Nishi Market" was added without a location, so it will not show on the map.` *(existing outcome)*

**A new sub route** *(all existing, unchanged)*
> `New sub route` · `Day 3 afternoon · 13:45 – 15:45`
> `Free time, 13:45 – 15:45` · Both ends are editable — the sub route protects the later one.
> `NAME` · `LEAVE` · `BE BACK BY` · `START AT` · `END AT`
> Both ends come from the day's stops, and they need not match — end at the station and the walk is one way.
> This day has no stops with a position yet, so the sub route starts and ends wherever you are.
> `Create and pick places` · `Cancel`
> A day can hold a sub route in every gap. Two sub routes never share a window, so the times in one can never move the other.

**The empty day** *(existing `plan.js emptyDay()`, verbatim, unchanged — RC-12)*
> `The day is empty`
> Add the stops your agent gave you and the gaps between them become free time by themselves. Start with the hotel as the first and last stop — a sub route needs somewhere to leave from and come back to.
> `+ Add the first stop` · `Paste an itinerary`
> Paste a map link and the stop arrives with its position, and its hours where OpenStreetMap has them.

---

## 11. What an implementer needs

1. **`plan.js`'s edit hint takes one added clause**, and one new 11px line beneath it (§10).
2. **The `.edge` `change` handler**, on an unparseable value, sets a per-row `badTime` key instead of only restoring the input; `.edge-derived` renders `not a time` in `--danger-fg` while it is set, and it clears on the next valid commit.
3. **`archive()`'s head row** gains the count line when `!editing`.
4. **`archive()`'s `MOVE TO`** renders the neighbour set + `Another day…` above six days, and writes `.archive-moved` after `movePlanItemToDay` (the class exists and is unused).
5. **`add-save` refuses out loud**: the name field takes the existing warn-hint treatment rather than returning silently.
6. **`add-save` moves its pending onto the button** and keeps the form up until `captureStop` resolves; the two outcome branches keep the `.amber-note` they already use.
7. **Nothing else changes.** Not the commit event, not the two-stage destructive ladder, not the lane derivation, not `emptyDay()`, not the drag, not `laneForm`.
8. **New CSS: none.** `.archive-moved` already exists; `.warn`, `.edge-derived`, `.amber-note` and the rust field hint are all in use elsewhere.

---

## 12. Reconciliations and findings

| id | Conflict | Verified | Resolution |
|---|---|---|---|
| **RC-9** | Coverage §2D: "Delete a stop — swipe → latch → in-row confirm → undo", and edit mode's `✕` described as the delete. | `swipeToDelete` is bound to `[data-plan-row]`; `stopRow` sets `data-row-id`. `✕` calls `archivePlanItem`. | **A live stop cannot be swiped, and `✕` does not delete.** The ladder is two-stage (§6.1). The matrix's row describes stage 2 only, and attributes it to stage 1's control. |
| **RC-10** | Coverage §2D: "Archive card — dark `.dark-card`, collapsed archived stops", priority P2. | A full dark card with `Add back`, `MOVE TO`, and an openable name. Nothing collapses. | **Not P2 and not collapsed** — it is the reversible half of the app's best destructive model, and the reason the Plan needs no delete confirmation. |
| **RC-11** | Coverage §2D and §3A.5: "the vacated slot — does the day close up, or keep the gap as free time?" | Lanes are derived from gaps; `MOVE TO` exists only on archived rows. | **Both, and it is not a decision.** Removing a stop turns its slot into a free-time lane automatically (§6.3). |
| **RC-12** | Coverage §2D: Plan's empty day is "DESIGNED — AWAITING SIGN-OFF (1B) … approve the tier-1 in-screen block". | `plan.js emptyDay()` already renders dashed stubs, a 15px/700 line, a capped teaching paragraph, ink + ghost actions and a closing hint. | **Already implemented.** 1B's design is a description of shipped behaviour, and the copy is kept verbatim (as `new-feature-design.md` §2.6 itself says). The sign-off is a confirmation, not a change. |
| **RC-13** | P0-3 §1.5 / S-4: a stopless shared day gets **no action**, and "can a loop exist on a day with no stops? **no**". `laneForm` has a fallback for a day with no positioned stops. | Both are true of different things: no **lane** is drawn on a stopless day, so there is no entry point; the fallback covers a day whose stops have **no positions**. | **No contradiction, and neither statement changes.** Recorded so the fallback copy is not read as overturning S-4. |

**Implementation findings — recorded, not fixed.**

| id | Finding |
|---|---|
| **IF-15** | `.archive-moved` is defined in `app.css` (667) and used by no screen — the third such class found (`.review-foot` by Review, `.arrived`, and now this). |
| **IF-16** | The add form's kind radios are `.pill.small` wrapping a native `<input type="radio">` with an inline `accent-color`, the only native radio rendering in the app; `.radio` is the house control. Cosmetically harmless; recorded, not standardised. |
| **IF-17** | `parts.js emptyDay()` (the `.empty` sentence) and `plan.js emptyDay()` (the tier-1 block) are two different empty-day treatments; the first is used by the **Map sheet**, the second by Plan. Both are legitimate under the tier system — the Map sheet's list is a tier-2 slot — but they share a function name. |
| **IF-18** | `dayIssues()`'s `order` label is `OUT OF ORDER` in source; P0-3 §2.2 approves `LISTED AFTER`. Not a contradiction — a designed change awaiting implementation — recorded so the two are not read as disagreeing. |
| **IF-19** | The `.handle-grip` is a `div`, so reordering has no keyboard route. §5 names the non-drag alternative rather than adding controls; recorded as the accessibility position for this interaction. |

---

## 13. Status

| Item | Status |
|---|---|
| **Edit mode is the boundary of everything destructive** | RECORDED from source — the principle §2, never stated before |
| **The two-stage destructive ladder** (`✕` → archive → swipe → undo) | RECORDED from source — **RC-9 / RC-10** |
| The `✕`'s consequence named in the edit hint | DESIGNED — copy |
| Archive count line outside edit mode | DESIGNED — new copy |
| **A rejected time says `not a time` in the gutter** | DESIGNED — the only new state on the row |
| Accepted time formats named in the hint | DESIGNED — new copy |
| A successful commit gets no acknowledgement | DESIGNED — a deliberate nothing (P0-5 R10) |
| Drag states recorded; arrow buttons rejected with a reason | RECORDED + DESIGNED (§5) |
| **The vacated slot is a derived lane** | RECORDED from source — **RC-11**, not a decision |
| `MOVE TO` on trips over six days; `Moved to Day 4.` receipt | DESIGNED — reuses Paste's vocabulary and an unused class |
| Add-a-stop refuses out loud; pending on the button | DESIGNED (P0-5) |
| The lane form, incl. its no-positions fallback | RECORDED from source — **RC-13** |
| **Plan's empty day is already the tier-1 treatment** | RECORDED — **RC-12** |
| Staged edits with a save step | **REJECTED** — the app commits on `change` everywhere (§4.3) |
| Arrow buttons for reordering | **REJECTED** — §5, with the alternative named |
| A confirmation on entering or leaving edit mode | **REJECTED** — there is no dirty state (§3) |

**No OPEN DECISION is raised by this document.** Every choice follows from existing behaviour or an approved system.

---

## IMPLEMENTED — `63b9c06` (§7) and `2745799` (§4.3, §6.3), 5 Sep 2026

**Appended only. Nothing above this line was changed.**

**§7 · add a stop** (batch 1). The silent `if (!typed && !placeID) return;` now
answers in the name field, in rust, with §7.3's `A name, or a map link.`; the
button is never pre-disabled; pending moved onto the button; and **the form
stays up** until the work resolves. It also keeps what was typed when the work
fails, so a retry is one tap rather than a re-type.

**§4.3 · `not a time`** (batch 4). The `.edge-derived` slot carries the reason
in `--danger-fg`, replacing the derived value rather than adding a line, so no
row changes height. It clears on the next valid commit, exactly one row
refuses at a time, and it is not in the `.amber-note` slot — a typo is not an
outcome. All four asserted.

**§6.3 · `Moved to Day 4.`** (batch 4), into `.archive-moved`, and **M-4
first**: the archive card rendered white because `.swipe-face { background:
#fff }` beat `.archive-card` at equal specificity from a later line. Measured
on what shipped: 1.21:1 on the name. Measured after: **7.48:1**, exactly the
figure the design intends.

**One thing §6.3 did not anticipate.** `movePlanItemToDay` really relocates the
row, so by the time the receipt is due the card it would print into has left
the day. The receipt is therefore held in screen state and stands where the
card was, and the archive block renders for a bare receipt so that moving the
*last* archived stop does not take its own receipt with it. It clears on a day
change.

**`movedToDay` is left exactly as it was** — set to null in three places, read
by nothing. The map asked for a decision on it when implementing this: it
cannot do this job, because the item carrying it is no longer on the day that
needs to display it. Reported as still unused rather than pressed into service.

**D-1 needed no work.** The harness asserts a 13:45 → 09:00 window still
derives `19h 15m`, that it is not flagged `reversed`, that the "night market,
not an error" comment is still in place as the record of the decision, and
that no plausibility check was added.
