# P0-4 — Review, redesigned

**Date:** 5 Sep 2026 · **Verified against** the working tree in this project (`web/**`), read this session
**Status:** design, for review. **Nothing implemented. No application code changed.**
**Artboard:** `P0-4 Review.dc.html` — every frame 390 × 844 or a 390px-wide crop, light only.
**Canonical:** this document. §10 is the only source of copy; anything on the artboard that is not in §10 is drift.

**Source read for this session:** `web/js/screens/review.js` (whole) · `web/js/share.js` `diffSnapshot` / `diffStops` / `diffRows` / `stopKey` / `STOP_FIELDS` / `MINE_ALONE` / `strip` / `summarise` (whole file) · `web/js/store.js` `shareSnapshot` (~3306), `publishUpdate` (~3620), `joinTrip` (~3706), `pendingUpdate` (~3783), `mySharedState`, `takeChange`, `keepMine`, `markReviewed`, `finishReview`, `rememberUndo`/`undoLast` (~858), `unsentChanges` · `web/js/screens/parts.js` `undoBar()` · `app.css` `.sides` / `.side` / `.side-k` / `.side-v` / `.review-foot` / `.badge` family.
**Verification inputs:** `verification-sprint-p0-6.md` §1.5–1.7 (frames v05–v09) and findings D-2, D-5.
> **APPROVED, 5 Sep 2026.** This document is baseline. Two P1 documents extend it and neither changes anything in it: `p1-review-bulk-actions-refinement.md` (staged disclosure in the sticky foot of §6.1, and the sequencing change `finishReview` needs for the batch undo of §5.2 to work) and `p1-share-join-review-flow-design.md` (the seams either side of this screen — the Plan banner, `Later`, and where `Back to the day` lands). One reconciliation: §1's "`.review-foot` is defined and unused" is true **of Review**; Paste's review pass already uses it, correctly, which gives §6.1 a working precedent in the same app.

**Inherited, approved, not reopened:** `new-feature-design.md` §4 (hierarchy, jade-for-theirs, day grouping, written absent sides, verb-matched buttons, delta chip, progress in the sub, `.review-foot`, the receipt) — this document extends it and says where it wins · P0-1 (identity is attributed in the header; the marker is not re-litigated) · `p0-3-system-sign-off.md` §3.

---

## 1. What the app does today, precisely

| Fact | Where |
|---|---|
| The diff is **two-way**: my current copy against the incoming snapshot. | `pendingUpdate()` → `share.diffSnapshot(mySharedState(), snapshot)` |
| **No base is retained on the receiving side.** There is no third input. | verified: nothing writes a "last reconciled" snapshot in `joinTrip` or `finishReview` |
| **A base does exist on the sending side**, and is already used. | `publishUpdate()` stores `share.snapshot`; `unsentChanges()` diffs it against the live copy |
| Matching is by id, with a `name+time+day` shape fallback so a rename on one phone and a retime on the other do not produce two stops. | `stopKey()`, `diffStops()` |
| Five fields make a stop "changed", in this order: `time` (starts) · `endTime` (ends) · `name` (is called) · `note` · `subtitle` (where it is). | `STOP_FIELDS` |
| Places, sub routes and must-see spots diff as **whole rows** by `JSON.stringify`, with `MINE_ALONE` fields (`captured`, `bought`, `boughtOn`, `paidAmount`, `packed`) stripped first. | `diffRows()`, `strip()` |
| A decision is **written immediately**, through the same mutations the Plan uses. There is no undo. | `takeChange()` / `keepMine()` |
| A decision **persists**: `markReviewed()` appends the entry id to `trip.declined` (last 400), and `pendingUpdate()` filters those ids out on every render. | `markReviewed()` |
| What is **not** recorded is *which way* you decided. Both `keepMine` and `takeChange` end in the same `markReviewed()`. | verified |
| The only count is `let done = 0` — module-level in `review.js`, reset by the `Back to the day` handler. | `review.js` |
| `finishReview(version)` sets `tookVersion` and **clears `declined`**. | `finishReview()` |
| Bulk actions render **inline at the end of the scroller**; `.review-foot` is defined in `app.css` and unused. | `review.js`, verified v08 |
| Every `.side` is ~150px at 390px, so **no value of realistic length fits one line**. | verified v05–v07 |
| A rename puts **their** name in the card title. | verified v06, finding D-5 |
| `THEY ADDED` compares unlike with unlike: `not on your copy` against a bare time, because the name is in the title. | verified v05 |

### 1.1 The three rows two-way diffing gets wrong

This is the argument for §2, and it is not about presentation. All three are reachable today.

1. **A change only *you* made is presented as theirs.** You retime a stop; they send an update that does not touch it. `mine ≠ theirs`, so an entry appears, badged `THEY CHANGED`, offering `Take theirs` — which **reverts your own edit** and describes it as accepting somebody else's change.
2. **A stop *you* deleted comes back as an addition.** You remove a stop; their snapshot still has it. The row is badged `THEY ADDED` and `Add it` re-adds the thing you deleted, as if they had just proposed it.
3. **A stop *you* added is presented as their removal.** You add a stop; it is not in their snapshot. The row is badged `THEY REMOVED` — and `Take theirs` **deletes the stop you just made**, with no undo.

In all three, the screen names the other person as the author of your own work, and one of the two buttons destroys it. This is the "the decision being presented is not the decision being made" problem, at its sharpest.

---

## 2. A · Two-way or three-way — decided: **three-way**

### 2.1 The decision

**Retain the last reconciled snapshot as a base.** One stored blob per trip: `trip.reviewedSnapshot`.

**Why this is not a large change:** the sending side already does exactly this. `publishUpdate()` keeps `share.snapshot` and `unsentChanges()` diffs against it — the same size of blob, the same write frequency, the same shape. Three-way makes the two sides **symmetric** rather than adding a mechanism.

**Written in three places, and nowhere else:**

| When | Base becomes |
|---|---|
| `joinTrip()` | the snapshot you were seeded from — so at t0, `base === mine` exactly |
| `finishReview(version)` | the snapshot just reviewed — their state at that version, whatever you took from it |
| `publishUpdate()` | already writes `share.snapshot`; an owner's base **is** their last published snapshot |

**Read as:** `base = trip.reviewedSnapshot || shareState()?.snapshot || null`.

### 2.2 Exact semantics

For every field of every matched row, and for row presence, with `B` = base, `M` = mine, `T` = theirs. **An entry is produced only when `M ≠ T`** (unchanged from today), and its *classification* comes from the base:

| # | B / M / T | Case | Entry? | Badge | Stakes |
|---|---|---|---|---|---|
| 1 | `M === T` | **unchanged** | no | — | — |
| 2 | `M === B`, `T ≠ B` | **they changed it** | **yes** | `THEY CHANGED` bone | keeping yours costs nothing |
| 3 | `T === B`, `M ≠ B` | **I changed it** | **no — dropped** | — | this is the row that today reverts your edit |
| 4 | `M ≠ B`, `T ≠ B`, `M ≠ T` | **both changed it** | **yes** | `THEY CHANGED` + rust `YOU CHANGED IT TOO` | **both answers cost something** |
| 5 | not in `B`, not in `M`, in `T` | **they added it** | **yes** | `THEY ADDED` jade | adding is free; leaving it out costs nothing |
| 6 | in `B`, in `M`, not in `T` | **they removed it** | **yes** | `THEY REMOVED` rust | removing is destructive; keeping is free |
| 7 | in `B`, not in `M`, in `T` | **I removed it** | **no — dropped** | — | today this re-adds what you deleted |
| 8 | not in `B`, in `M`, not in `T` | **I added it** | **no — dropped** | — | today `Take theirs` deletes what you added |
| 9 | as 2 or 4, changed set `= {name}` | **renamed** | yes | as 2/4, noun `renamed` | §4 |
| 10 | as 2 or 4, changed set ⊆ `{time, endTime}` | **a different time** | yes | as 2/4, noun + delta chip | — |
| 11 | as 2 or 4, changed set ⊆ `{subtitle, note}` | **where it is / its note** | yes | as 2/4, noun from `STOP_FIELDS` | — |

**Consequences worth stating:**

- **Three of the eleven cases stop appearing at all** (3, 7, 8) — the three failures in §1.1. The list gets shorter *and* truer; nothing is hidden that you did not do yourself.
- **Case 4 is the only row where either answer costs something**, and it is the only row that gets extra weight. This is what makes the screen asymmetric in the way the stakes already are.
- **"Whatever you skip is not asked about again" becomes structural.** Keep yours at version V, and at V+1 your side differs from base while theirs matches it → case 3 → not asked. It returns only if they change the same thing again, which is a genuinely new question. `trip.declined` stops being the mechanism that prevents re-asking across versions and becomes what it should be: within-update bookkeeping.
- **Matching is unchanged.** Ids first, with the existing shape fallback. The base classifies; it does not match. (Cheap, and it means a base that is stale in some corner can never *invent* a row — only fail to soften one.)

### 2.3 When there is no base

Legacy trips joined before the field exists, and any trip whose base was lost. **Degrade to today's two-way diff**, and say so once, in a bone (not amber, not rust — nothing is broken) line under the header:

> `This update is being compared without a starting point, so both sides are shown as they are.`

In that mode every changed row is badged **`THEY SENT`** rather than `THEY CHANGED`, because the app genuinely does not know who moved. No row is dropped, no conflict badge is shown, and bulk actions are limited to `Keep all of mine` only (§7.3). A trip enters this mode at most once: the first `finishReview` writes a base.

### 2.4 What was considered and rejected

- **Keep two-way and fix the copy** (the brief's fallback). Rejected: no wording makes `Take theirs` on case 8 anything other than "delete the stop you just added". Copy cannot fix a mislabelled author.
- **Derive the base from the envelope** (`readPublished(code)` at `sharedFrom.version`). Rejected: the mirror holds only the *latest* envelope; the version you reconciled with is gone the moment a new one arrives.
- **Store a per-field change log instead of a snapshot.** Rejected: strictly more code, more storage over time, and it answers the same question a snapshot answers by subtraction.
- **Ask the user "did you change this?"**. Rejected on sight — the app knows.

---

## 3. B · The row, restructured for 390px

### 3.1 The problem, measured

`.sides` is a two-column grid; each `.side` is ~150px at 390px. Verified: `09:15 – 10:00 Lumen Crossing` takes two lines, `16:00 – 17:00 Skyline Deck` takes two lines. **No value of realistic length fits.** So the two-column layout costs two wrapped lines per side and gains nothing.

### 3.2 The structure

Stacked, full width, in the existing `.card` (r16, 12px 13px pad). **Stacking is the default, not an overflow case** — this supersedes `new-feature-design.md` §4.5, which stacked only above ~60 characters.

```
┌ .card ─────────────────────────────────────────────┐
│ [THEY CHANGED]  a different time    [YOU CHANGED IT TOO] │  badge row
│ Lumen Crossing                     13.5/700 ink, lh 1.25 │  the subject
│ Day 3 · stop 2 of 6                11px --soft           │  context
│ ┌ YOURS ───────────────────────────────────────────┐ │
│ │ 09:15 – 10:00                                    │ │  full width
│ └──────────────────────────────────────────────────┘ │
│ ┌ THEIRS ──────────────────────────────────────────┐ │
│ │ 10:30 – 11:15                                    │ │  jade
│ └──────────────────────────────────────────────────┘ │
│                [ 1h 15m later ]      amber delta chip   │
│ Takes theirs and drops your 09:15 start.  rust, case 4  │
│ [ Keep mine ]            [ Take theirs ]   h38, equal   │
└────────────────────────────────────────────────────┘
```

**Vertical cost is roughly neutral.** Two stacked boxes at one line each replace two side-by-side boxes at two wrapped lines each. What grows is only the genuinely long value, which now has 318px instead of 150px to be long in.

**Both boxes keep the existing recipe** exactly: r10, 8px 9px pad, key 9.5/800/.05em, value 12px/1.4; yours `#FAFBFA` / `#EDEFEC`, theirs `--jade-bg` / `--jade-bd`. Only `grid-template-columns` changes — one new class, `.side.stacked`.

### 3.3 The eleven cases as they render

| Case | Badge row | Title | YOURS | THEIRS | Buttons |
|---|---|---|---|---|---|
| **unchanged** | never rendered | | | | |
| **they changed it** | `THEY CHANGED` bone + noun | the subject, from the **base** | your value | their value | `Keep mine` / `Take theirs` |
| **I changed it** | never rendered | | | | |
| **both changed it** | `THEY CHANGED` + rust `YOU CHANGED IT TOO` | base subject | your value | their value | `Keep mine` / `Take theirs` + the rust cost line |
| **they added it** | `THEY ADDED` jade + `a stop` | **their** name (there is no other) | `not on your day` in `--faint` | `10:30 – 11:15 · 上野公園` — time **and** name, so the pair compares like with like | `Leave it out` / `Add it` |
| **they removed it** | `THEY REMOVED` rust + `a stop` | base subject | your value | `off the day` in `--jade-fg` | `Keep it` / `Remove it` |
| **renamed** | as above + `renamed` | **the name in the base** — never theirs (§4) | your name | their name | as above |
| **a different time** | as above + `a different time` | base subject | `09:15 – 10:00` | `10:30 – 11:15` | as above, plus the delta chip |
| **where it is** | as above + `where it is` | base subject | your subtitle | their subtitle | as above |
| **its note** | as above + `its note` | base subject | your note (may be long → the box grows) | their note | as above |
| **a place / sub route / must-see spot** | as above + the kind noun | the row name | the row name or its value | theirs | as above |

**Absent sides are written, never blank** — `not on your day`, `off the day` — so the two boxes always align. (Inherited from §4.3, and the verification frames confirm the empty box is a real defect today.)

**The delta chip** appears only when both sides are clock values: `.chip.amber`, `1h 15m later` / `45 min earlier` / `20 min shorter`. Nobody should do arithmetic on two 12px numbers.

**Day grouping** replaces the repeated `Day 3` chip: one `DAY 3 · SAT 14 MAR · 3 THINGS` eyebrow per day, and the per-card context line carries position (`stop 2 of 6`) instead of the day.

---

## 4. C · "Theirs" versus "mine", and the renamed stop

### 4.1 The rename — resolved

Today the card title for a stop they renamed is **their** new name, with the detail line "is called" and your name tucked in the `YOURS` box. The card announces the change as already true, and the thing being decided is the title itself.

**Rule: the title is the subject as *you* know it.** Precisely:

1. the name in the **base** — the name both copies agreed on before either side moved; else
2. **your** current name; else
3. theirs (which is only reachable on case 5, "they added it", where there is no other name and no decision has been pre-empted).

So a rename renders as: title `Ashgate Shrine` · noun `renamed` · `YOURS` = `Ashgate Shrine` · `THEIRS` = `灰門神社`. The incoming name appears exactly once, in the box that is labelled as theirs, which is the only place it is true.

This closes **D-5**.

### 4.2 `ANA'S` / `MINE` — considered and rejected

`share.js` already exports `possessive()` ("Ana's" but "Your"), so `ANA'S` is available at no cost, and it would name the person on every row.

**Rejected, on evidence already accepted in P0-1 §5:** a name-bearing label at 9.5px/800 uppercase is **script-dependent by construction**. Uppercasing does nothing to Han or kana, and 9.5px Han is not legible — the same reason the `SHARED COPY` / `FROM ANA` badge was rejected as the joined-copy marker. `陳美玲'S` is worse still: a Latin possessive suffix welded to Han glyphs.

**Decision: the keys stay `YOURS` and `THEIRS`.** They are short, script-neutral and already understood. The person is named **once per screen**, in the header that already reads `Ana sent an update` — which is also where P0-1 put identity. One name, in one place, at a legible size.

*(If a future screen needs the name per row, it belongs in the 11px context line at 11px sentence case, not in a 9.5px uppercase key.)*

---

## 5. D · Decisions

### 5.1 Immediate, not staged

**Unchanged: a decision writes immediately**, through the same mutations the Plan uses, so an accepted change is indistinguishable from one you made.

Staging (decide several, then `Apply`) was considered and rejected: it introduces a dirty state and a save step the app does not have anywhere — the whole product commits on `change` — and it would make the review screen the one place where pressing a button does not do anything yet.

### 5.2 Undo, using the bar that already exists

`store.js` has `rememberUndo(label, restore)` — a 6s app-wide bar, rendered by `parts.js` `undoBar()` in a global slot in `nav.js`, already used by place delete, stop delete, area remove and person remove. **Review decisions join it. No new component, and the app's stated rule — "undo, not confirm" — starts applying to the one screen where it was missing.**

| Decision | `restore()` puts back | Undo label |
|---|---|---|
| `Take theirs` on a change | the affected row(s), deep-copied before the write, and the entry id removed from `reviewed` | `Took theirs for Lumen Crossing` |
| `Add it` | removes the added row again | `Added 上野公園` |
| `Remove it` | the removed row, deep-copied first | `Removed Skyline Deck` |
| `Keep mine` / `Leave it out` / `Keep it` | nothing to the day — only the entry id is removed from `reviewed`, so the row comes back | `Kept yours for Lumen Crossing` |

Two rules: **the row returns to the list when a decision is undone** (it must, or the undo is only half true), and **bulk actions get one undo for the whole batch**, not one per row (`Kept all of yours`, `Took the 4 you have not touched`).

`finishReview` is *not* undoable — it is the act of leaving, and by then every row has been decided and each was individually undoable at the time. Stated so nobody designs a second undo for it.

### 5.3 Case 4 — the three-way conflict, with no third control

A both-changed row keeps **two** buttons. No merge editor, no "keep both", no field-level picker: the app has no such interaction anywhere, and inventing one on its most consequential screen is the opposite of the smallest coherent change.

What case 4 gets instead is **one rust line, above the buttons, naming what the destructive answer costs**:

> `Takes theirs and drops your 09:15 start.`

That is the whole asymmetry treatment: the badge says you are involved, the line says what leaves. `Keep mine` needs no such line — nothing of theirs is lost by keeping yours; their copy is unaffected either way, which is the product's entire model.

### 5.4 What a decision records

Replace `trip.declined: [id]` with:

```
trip.reviewed: [{ id, choice: 'took' | 'kept', title, outcome, at }]   // last 400
```

`outcome` is the one-line fact the receipt shows (`Day 3 · now 10:30 – 11:15`, `Day 3 · still 09:15 – 10:00`, `Day 3 · off the day`). `pendingUpdate()` filters on `reviewed.map(r => r.id)` exactly as it filters `declined` today — same mechanism, one field wider.

This is the **only** new data shape in the decision path, and it is what makes §7 possible.

---

## 6. E · Bulk actions — placement and safety

### 6.1 Placement

**The sticky `.review-foot`** — already in `app.css` (`flex:none`, 1px top line), already what the audit describes, currently unused. Verified problem: with 6–7 entries the two bulk buttons sit roughly two screens below the fold, so the cheap way out of a long update is the hardest thing to find.

The foot carries three things, in this order:

```
┌ .review-foot (fixed, 1px --line top, white) ──────────┐
│ 4 to decide · 2 done                11px --soft        │
│ [ Keep all of mine ]  [ Take the 4 you have not touched ] │
└───────────────────────────────────────────────────────┘
```

The three-sentence preamble moves to fine print **under** the foot's buttons (inherited from §4.4) — same words, out of the way of the first row.

### 6.2 Safety — the rule that lets bulk exist at all

> **A bulk action may never decide a row where both of you changed the same thing.**

So:

| Bulk control | Applies to | Why it is safe |
|---|---|---|
| `Keep all of mine` | **every** remaining row, including case 4 | It changes nothing on your copy. It is the "I do not want to do this now" exit, and it must never be gated. |
| `Take the *n* you have not touched` | only rows where `mine === base` (cases 2, 5, 6 without a conflict) — **never case 4** | On these rows, taking theirs discards nothing of yours. The count is in the label, so the button says how much it is doing. |
| ~~`Take all of theirs`~~ | **removed** | Under three-way it would silently discard your own edits on exactly the rows the screen exists to protect. Nothing else in the app has a one-tap control that destroys work with no per-item view. |

`Take the n…` is **absent** when `n === 0`. When only conflicts remain, the foot reads:

> `2 left, and you have changed both. They go one at a time.`

That sentence is the safety rule, said in the app's own voice, at the moment it applies.

### 6.3 One-decision-per-difference is preserved

The principle was never "every row must be tapped"; it was "no single tap may resolve a difference the user has not seen the stakes of". `Keep all of mine` resolves nothing destructively. `Take the n you have not touched` resolves only rows with no stakes. Everything with stakes still takes one decision of its own. Both bulk actions are covered by one undo.

---

## 7. F · Completion, return and persistence

Five states, all reachable, all specified.

### 7.1 Nothing to review — first visit

Existing copy, unchanged: *"Their copy and yours say the same thing. An update appears here when somebody sends one."* + jade `Back to the day`. Reached when there is no waiting snapshot and no `lastReview`.

### 7.2 In progress

Header `Ana sent an update` / push sub `6 things · 20 min ago`. Entries, day-grouped. Sticky foot with progress. Unchanged in shape.

### 7.3 Partially decided, returning later

The state today's screen cannot show, though the data is there (`trip.declined`). Decided rows are gone from the list, so the screen silently looks like a smaller update.

**Designed:** the push sub does the counting — `6 things · 2 decided · 20 min ago` — the foot's progress line says `4 to decide · 2 done`, and one ghost control sits under the last card:

> `See the 2 you have decided`

which expands the receipt list inline (`.card-list`, r16, hairline rows), each row tagged `TAKEN` (jade) or `KEPT` (bone) with its `outcome` line. Collapsed by default: it is a check, not the task.

### 7.4 Completed — the receipt

On the last decision (or a bulk action), `finishReview(version)` runs as it does today, and **writes the receipt** instead of discarding it:

```
trip.lastReview = { version, from, at, decisions: [...reviewed] }
```

The screen then shows (inherited from §4.6, now with a real source):

1. A jade receipt card — `UPDATE DEALT WITH`, `5 things decided — 3 taken, 2 left as yours.`, then the existing sentence about the copy being yours again.
2. **The receipt list** — every decision as a fact about your day, tagged `TAKEN` / `KEPT`. This is where the disappearing rows come back, once.
3. Jade `Back to the day`, then the fine print about where the next update appears.

`done`, the module-level counter, is deleted. Every number on this screen comes from `lastReview`.

### 7.5 Returning to Review after finishing

Navigate away, come back, relaunch the app: **the receipt is still there**, rendered from `lastReview`, until a newer snapshot arrives (at which point 7.2 replaces it). This is the fix for the verification finding: today you decide seven things, leave, come back, and the screen says nothing ever happened.

`lastReview` is one blob, replaced not appended — the app does not need a history of updates, only the last one, which is the one you might still be checking.

### 7.6 Navigation away and back, mid-review

No change and no warning. Decisions are already written and already persisted (`reviewed`), the update is not "in progress" in any sense the app has to protect, and there is no dirty state to lose. Leaving mid-review is legitimate: the Plan banner's ghost `Later` exists for exactly that.

*(What `Later` does — dismiss until when, does the banner return — is **D-1**, still undocumented and still out of scope. It is not blocked by anything here; noted so it is not lost.)*

---

## 8. Long content, CJK and edge cases

| Case | Behaviour |
|---|---|
| **Long value** (a note, a long sub-route name) | The box grows. It has 318px, not 150px, and it wraps normally. Nothing truncates, nothing is hidden behind a "more". |
| **CJK title** | 13.5/700 at line-height **1.35**, Latin-first stack. Verified holding at 390px in v05–v07, including `大稻埕・迪化街老屋與布市半日散步` on one line. |
| **CJK value** | 12px/1.4 in the side box. 12px is above the CJK floor for a *value* the user reads in place, and unlike the warning strip's subject it is not a needle to find in a haystack — it is one of two labelled boxes. |
| **CJK rename** | The whole point of §4.1: the title stays in the script you know it by, and the incoming script appears once, in `THEIRS`. |
| **A rename plus a retime on the same stop** | One entry, changed set `{name, time}` → noun `renamed, a different time`. The `STOP_FIELDS` order already produces a readable list. |
| **A rename on one phone, a retime on the other** | Ids match (both descend from the same stop), so it is one row, case 4. The `stopKey` shape fallback is not needed and not consulted. |
| **A stop moved to another day** | `payload.wasDay` exists. Rendered as a normal changed row with `Day 4 · 19:00` against `Day 5 · 19:30`; the noun reads `moves out of this day`. Inherited from §4.5. |
| **Many entries (20+)** | Day eyebrows, one scroller, sticky foot. No pagination, no virtual list: the foot's `Keep all of mine` is the honest exit from a long update, and it is now always in reach. |
| **An entry whose payload no longer applies** (you deleted the stop they changed) | `takeChange()` returns `false` today and the row stays. Designed: it is case 7 (`I removed it`) under three-way and **never reaches the screen**. This is a whole class of dead row removed by §2. |
| **`MINE_ALONE` fields** | Untouched. A shot you have ticked, an item you have bought, an amount you have paid never appear as differences. Verified, and it is the promise the private kinds rest on. |
| **Two updates in a row, second arriving mid-review** | Out of scope here and unchanged: `pendingUpdate()` reads the latest envelope, so the newer version wins on the next paint. Flagged as **DEFERRED**, not designed — it needs the live two-device propagation that is still unverified. |

---

## 9. Visual treatment

Literal values, all existing. **New CSS: `.side.stacked` and `.review-group`. That is all.**

| Element | Treatment |
|---|---|
| Card | existing `.card`, r16, 12px 13px pad, 12px bottom margin |
| Verb badges | existing `.badge` family — `THEY CHANGED` bone (`--bone` / `--charcoal`), `THEY ADDED` `.badge.jade`, `THEY REMOVED` `.badge.rust`, `THEY SENT` bone (no-base mode) |
| Conflict badge | `.badge.rust` — `YOU CHANGED IT TOO`, right-aligned in the badge row |
| Noun | 11px `--soft`, beside the badge |
| Title | 13.5px / 700 / `--ink`, line-height 1.25 (**1.35** for CJK) |
| Context line | 11px `--soft`, 2px top margin |
| Side boxes | existing `.side` / `.side.theirs` recipe, `grid-template-columns: 1fr` via `.side.stacked`, 8px gap |
| Absent side value | `--faint` #B4BEB9 (yours) / `--jade-fg` #5D8C7C (theirs) |
| Delta chip | `.chip.amber`, centred under the pair, `tabular-nums` |
| Cost line (case 4) | 11.5px / 650 / `--danger-fg` #9B4B4B, 8px above the buttons |
| Decision buttons | `.btn.ghost` + `.btn.jade`, h38, equal width, `gap: 8px` — deliberately the lightest thing on the card |
| Day eyebrow | `.eyebrow` 10.5/800/.06em, 14px above the group |
| Sticky foot | existing `.review-foot` — `flex:none`, 1px `--line` top, white, 12px 16px; buttons h38 |
| Foot progress line | 11px `--soft`, `tabular-nums`, above the buttons |
| No-base line | 11px / 400 / `--soft`, under the header |
| Receipt card | `--jade-bg` / `--jade-bd` / r16 / 14px pad, `.eyebrow.jade` head |
| Receipt list | `.card-list` r16, rows split by `--line-3`, `TAKEN` `.badge.jade` / `KEPT` `.badge` |
| Undo bar | the existing app-wide bar. Not restyled, not re-placed. |

No new colour, no new radius, no new control height, no new component family.

---

## 10. Exact copy

**Canonical. The artboard may show these strings and no others.**

**Header**
> `Ana sent an update`
> `6 things · 20 min ago`
> `6 things · 2 decided · 20 min ago`

**Preamble** *(unchanged, moved under the sticky foot)*
> Your copy has not changed. Take what you want from theirs; anything you keep is not asked about again. What you have bought, packed or written is not in here at all — it never leaves this phone.

**No-base mode**
> `This update is being compared without a starting point, so both sides are shown as they are.`

**Badges**
> `THEY CHANGED` · `THEY ADDED` · `THEY REMOVED` · `THEY SENT` *(no-base only)* · `YOU CHANGED IT TOO`

**Nouns**
> `a different time` · `renamed` · `where it is` · `its note` · `a stop` · `a place` · `a sub route` · `a must-see spot` · `moves out of this day` · `renamed, a different time`

**Side keys**
> `YOURS` · `THEIRS`

**Absent sides**
> `not on your day` · `off the day`

**Delta chips**
> `1h 15m later` · `45 min earlier` · `20 min shorter`

**The cost line, case 4 only**
> `Takes theirs and drops your 09:15 start.`
> *(pattern: `Takes theirs and drops your ‹the value that leaves›.` — one clause, the value, no adjectives)*

**Buttons**
> `Keep mine` / `Take theirs` — a change
> `Leave it out` / `Add it` — an addition
> `Keep it` / `Remove it` — a removal

**Sticky foot**
> `4 to decide · 2 done`
> `Keep all of mine`
> `Take the 4 you have not touched`
> `2 left, and you have changed both. They go one at a time.`

**Partially decided**
> `See the 2 you have decided`

**Undo labels**
> `Took theirs for Lumen Crossing` · `Kept yours for Lumen Crossing` · `Added 上野公園` · `Removed Skyline Deck` · `Kept all of yours` · `Took the 4 you have not touched`

**Receipt**
> `UPDATE DEALT WITH`
> `5 things decided — 3 taken, 2 left as yours.`
> Your copy is yours again until the next update arrives.
> `TAKEN` · `KEPT`
> `Day 3 · now 10:30 – 11:15` · `Day 3 · still 09:15 – 10:00` · `Day 3 · off the day`
> `Back to the day`
> An update appears here when somebody sends one.

**Nothing to review, first visit** *(unchanged)*
> `Nothing to review`
> Their copy and yours say the same thing. An update appears here when somebody sends one.

---

## 11. What an implementer needs

1. **`trip.reviewedSnapshot`** — written in `joinTrip` (the seed snapshot), in `finishReview` (the snapshot just reviewed). Read as `trip.reviewedSnapshot || shareState()?.snapshot || null`.
2. **`diffSnapshot(mine, theirs)` gains a third argument** — `diffSnapshot(mine, theirs, base)`. With `base == null` it must behave **exactly** as today (that is the no-base mode, and it keeps the function testable against current behaviour). With a base it classifies per §2.2 and drops cases 3, 7, 8.
3. **Entries gain three fields:** `stakes: 'free' | 'both'` (drives the conflict badge, the cost line and bulk eligibility), `titleFrom: 'base' | 'mine' | 'theirs'`, and `cost` (the value that would leave, for the case-4 line).
4. **`trip.reviewed`** replaces `trip.declined` (§5.4). `pendingUpdate()` filters on the ids.
5. **`trip.lastReview`** written by `finishReview` (§7.4). One blob, replaced.
6. **`review.js` loses `let done = 0`** and every number comes from state.
7. **`rememberUndo`** is called by `takeChange` / `keepMine` and by the two bulk actions, with a deep copy taken **before** the write (the pattern `deletePlace` already uses).
8. **`.review-foot` is finally used**, and the scroller gets bottom padding for it.
9. **New CSS:** `.side.stacked` (one column) and `.review-group` (the day eyebrow's spacing). Appended at the end of `app.css`.
10. Nothing here changes what travels in a snapshot, what `MINE_ALONE` protects, how matching works, or the mutations a take runs through.

---

## 12. Status

| Item | Status |
|---|---|
| **A · three-way, with a retained base** | DESIGNED — awaiting sign-off. **The one item everything else rests on.** |
| Cases 3, 7 and 8 stop appearing | DESIGNED — awaiting sign-off (the three §1.1 failures) |
| No-base degradation + `THEY SENT` | DESIGNED — awaiting sign-off |
| **B · stacked row as the default** | DESIGNED — awaiting sign-off (verified need) |
| The eleven cases, badges and nouns | DESIGNED — awaiting sign-off |
| Written absent sides; the addition made comparable | DESIGNED — awaiting sign-off |
| **C · the title is the subject as you know it** (D-5 closed) | DESIGNED — awaiting sign-off |
| `ANA'S` / `MINE` | **REJECTED** with reasons (§4.2), on evidence already accepted in P0-1 |
| **D · immediate writes, plus the existing undo bar** (D-2 closed) | DESIGNED — awaiting sign-off |
| Case 4 keeps two buttons + one rust cost line | DESIGNED — awaiting sign-off |
| `trip.reviewed` records the direction of each decision | DESIGNED — awaiting sign-off |
| **E · sticky foot; bulk never touches a conflict; `Take all of theirs` removed** | DESIGNED — awaiting sign-off. Bulk safety is **S-3** in the P0-3 doc — the one policy call here. |
| **F · five completion states, receipt from `lastReview`** | DESIGNED — awaiting sign-off |
| Two updates arriving in a row | **DEFERRED** — needs live two-device propagation, still unverified |
| `Later` on the Plan banner (D-1) | **DEFERRED** — untouched, unblocked |
| A merge / field-level picker for case 4 | **REJECTED** (§5.3) |
| Staged decisions with an `Apply` step | **REJECTED** (§5.1) |

**No OPEN DECISION is raised here beyond S-3.** Three-way is a product decision, and it is being *recommended* rather than left open because the brief already asked for a three-way model if it gives materially more truthful UX — §1.1 is that evidence, and the storage pattern it needs already exists on the sending side.

---

## IMPLEMENTED — `7c8bb6e`, 5 Sep 2026 (partial: §9's new CSS only)

**Appended only. Nothing above this line was changed.**

Batch 0 of `transition-audit.md` §6 appended **the whole of the new CSS this
document asks for** (§3.2, §9, and item 9 of the implementer's list):
`.side.stacked` and `.review-group` in `web/css/app.css`. `.side.stacked` puts
each value box in a full-width column — measured 318px instead of 155px at
390 × 844 — with the 8px gap kept; `.review-group` carries the day eyebrow's
14px spacing.

Both are **inert until batch 3's markup opts in**. `.sides` is used by
`review.js` alone, so the `flex-wrap` that makes stacking possible changes
nothing that renders today; `test/css-additions.mjs` asserts that a row
*without* `.stacked` still lays out side by side, so the no-regression claim
is measured rather than assumed. A long CJK value in a stacked box was
measured with `scrollWidth` vs `clientWidth` and does not overflow.

Everything else in this document — `trip.reviewedSnapshot` (N-2), the
three-way diff, the no-base mode, the eleven cases, the sticky foot and staged
bulk, `trip.lastReview` and the receipt — is **batch 3** and is not
implemented by this commit. The diff is still two-way.
