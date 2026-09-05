# P1 — Paste, end to end

**Date:** 5 Sep 2026 · **Verified against** the working tree in this project (`web/**`), read this session
**Status:** design, for review. **Nothing implemented. No application code changed.**
**Artboard:** `P1 Paste Review.dc.html` — every frame 390 × 844 or a 390px-wide crop, light only.
**Canonical:** this document. §10 is the only source of copy; anything on the artboard that is not in §10 is drift.

**Source read this session:** `web/js/screens/paste.js` (whole — all five phases, both mount paths, every handler) · `web/js/itinerary.js` (the row shape: `grade`, `inferred`, `dayGuessed`, `splittable`, `raw`, `kind`) · `web/js/store.js` `importItinerary`, `readTripFile`, `importTrip`, `activeItems`, `day` · `app.css` `.cand` family, `.progress`, `.review-foot`, `.warn-fix`, `.archive-day`, `.tick`.
**Verification input:** `verification-sprint-p0-6.md` §1.10–1.11 (frames v12, v13) and finding D-6.
**Inherited, not reopened:** P0-5 (pending on the control; `.amber-note` for outcomes only; no spinner) · the semantic colour contract · "a warning always names the tap that fixes it" · no new component families · 390 × 844.

---

## 1. What the screen actually is, measured

The verification sprint's headline — *ten controls in one ~170px row, eight rows deep, every row gated* — is right about the worst case and needs three corrections before anything is redesigned.

| Claim | Verified | Correction |
|---|---|---|
| "Up to ten controls in one row" | true | but **only for a row that is simultaneously end-guessed, splittable, and first-in-group or on a guessed day.** `candidate()` renders each ladder behind its own condition. A clean row has four things: tick, time block, name button, chevron. |
| "Eight rows, every one needing a tick" | true | and the gate is **already visible and already sticky**: `.review-foot` carries `n rows left to check` and a **disabled** `Review and save`. |
| "`.review-foot` is defined and unused" | true of **Review** | **Paste already uses it**, and correctly. It is the working precedent for P0-4 §6.1. |
| "The progress track reads as a loading bar" | true | `.progress` is the *same class* the tile download uses for a real network transfer. Two different meanings, one appearance. |
| "MOVE TO on every row" | false | `movable()` shows it only on the first row of a day group or a row whose day was guessed. |
| "No way to open a row" | not claimed, worth stating | there **is** a full-screen row editor (`rowView`) — name, starts, ends, note, day, map link, `Confirm and next`. It is the fix ladder's destination and no document mentions it. |

**So the real problems are four, and none of them is "too many buttons".**

1. **Three ladders can stack in one card** with no hierarchy between them, so the row's own content (a time and a name) is outweighed by its remedies.
2. **The gate asks for eight identical confirmations of things the parser got right.** Six of the eight rows in the captured frame were graded `read` — nothing was inferred — and each still needed a tap.
3. **`.progress` says "wait", when it means "you are 3 of 8 through a checklist".** Nothing is loading; the user is. Verified shape: `height: 7px`, `border-radius: 4px`, track `--line-2`, **fill `--jade`** — so it is not merely bar-shaped, it is the app's *completion* bar, filling jade exactly as a download does.
4. **`Save` has no failure path.** `mountSummary` awaits `importItinerary` and sets `phase = 'done'` unconditionally; `result` is read with `?.` and a failure would render `0 stops saved` as a success receipt.

---

## 2. The decision that shapes everything: **the gate goes, the grades stay**

**Every row is no longer ticked. Only rows the parser was not sure about are.**

The parser already grades every row and the screen already carries the grade (`row.grade`, and `.cand.plain` / `.cand.worked` / `.cand.unread`):

| Grade | Means | Count in the captured frame | Designed treatment |
|---|---|---|---|
| `read` | every field came off the line | 6 of 8 | **accepted by default.** No tick to give, one tap to drop. |
| `worked` | something was inferred — an end time, a duration, a day | 1 of 8 | **needs one decision**, and the amber line already says which. |
| `unread` | the line could not be parsed at all | 1 of 8 | **needs one decision**, from three ways out. |
| *(invalid)* | not a parser grade — a validator catching a `read` row after an edit (§4) | 1 of the 6 read | **needs one decision**, and it blocks the save until it gets one. |

**The control being removed, precisely.** `.tick` is 22px, r7, 1.6px #D2D8D3 on white, holding `icon.tick` at opacity 0 until `.on` makes it jade — so an unticked row shows an *empty white box* on every one of the eight rows, including the five the parser read cleanly. That is the gate this section removes.

**Why this is right, in the hierarchy's order.**

- *Existing product behaviour.* The grades exist, are computed, and are already rendered as three different card styles. The gate ignores them and treats all three the same, which throws away the only work the parser did that the user cares about.
- *Existing UX principles.* Nothing else in this app asks the user to confirm something it is not worried about. Warnings name the tap that fixes them; rows the parser read cleanly have no warning and therefore no tap to name.
- *The stated principle for this screen.* `paste.js`'s own header says the review exists because "this is the one place a wrong row is cheap to remove". **Removing is cheap; confirming is not.** The gate optimises the wrong one of the two.
- *Cost of being wrong.* A wrongly accepted row lands on the Plan, where it is one swipe to delete, with a 6s undo, and the pasted text is kept under `Last import` for a redo. The `done` screen already says so. A gate that costs eight taps to prevent a one-swipe mistake is not paying for itself.

**How a row becomes accepted or resolved, exactly** (asked in review — *"is it resolved automatically until no conflict?"*). Near enough: **the grade decides the starting state, and nothing the parser had to guess at is ever resolved on the user's behalf.**

| Grade | Starts as | To clear it |
|---|---|---|
| `read` | **✓ accepted** | nothing — every field came off the line, so there is no question to ask |
| `worked` | **? needs you** | answer the one ladder, or open the row and confirm → ✓ |
| `unread` | **? needs you** | make it a stop, merge it upward, or skip it → ✓ or — |
| invalid | **! blocked** | a validator caught it after an edit (§4) — fix or drop it |

The save unblocks when **no row is left in `?` or `!`**. A dropped row (`—`) never blocks and never saves. An accepted row can be dropped and restored at any time by tapping its glyph — accepted is a **starting state, not a lock**.

**When the button is enabled, precisely** (asked in review): `Save n stops` is disabled while, and only while, something is genuinely unresolved — a line the parser **could not read**, a row where it **guessed** and nobody has answered, or a row that is **invalid** (§4). It is never gated on rows the parser read cleanly, so on a clean paste it is live on arrival. The count beside it always says what is holding it.

**What replaces it.** `Save n stops` is enabled from the moment the parse returns, and is disabled only while **something is genuinely unresolved** — an `unread` line, or a `worked` row whose inference nobody has answered:

> `3 rows still need you` · `Save 7 stops` **[disabled]**
> `7 stops ready` · `Save 7 stops`

**One-decision-per-difference is preserved, not weakened.** The screen still refuses to write a row it had to guess at without being told. It simply stops asking about the rows it did not guess at.

**Rejected: keeping the gate and adding `Tick all`.** It makes the gate a formality and teaches the user that the ticks mean nothing — which is worse than either honest alternative. Also rejected: dropping the review pass entirely and importing straight to the Plan. The `unread` and `worked` rows are real and the app cannot guess them.

---

## 3. The row at 390px

### 3.1 Structure — three tiers, one visible at rest

```
┌ .cand ────────────────────────────────────────────────┐
│ 09:15   Lumen Crossing                              ✓ │  tier 1, always
│ 10:00   Harbour side · 45 min photo stop              │
├───────────────────────────────────────────────────────┤
│ End time guessed — the line only gave a start         │  tier 2, `worked` only
│ [ Keep 45 min ]  [ Set the end ]  [ No end time ]     │
└───────────────────────────────────────────────────────┘
```

| Tier | Contains | When |
|---|---|---|
| **1 · the row** | start time (44px tabular, `--ink`), derived end beneath it (`--soft`, or `--amber-fg` when inferred), name at 13.5/650, subtitle/note at 11px `--soft`, and **one state glyph on the right** | always |
| **2 · the question** | the amber inference line, then **one** ladder of ≤3 `.warn-fix` buttons | `worked` and `unread` only |
| **3 · the row editor** | the existing full-screen `rowView` — name, starts, ends, note, which day, map link | on tapping the row |

**The state glyph, right-hand end of tier 1** — one 22px slot, four values, replacing today's mixture of a leading tick, a trailing chevron and a `skipped` word:

| Glyph | Means | Tap does |
|---|---|---|
| jade `✓` | accepted (a `read` row, or a `worked`/`unread` row you answered) | drops the row (→ `—`) |
| amber `?` | needs one decision | opens the row editor |
| `—` in `--faint`, the whole card at opacity .45 | dropped | puts it back |
| rust `!` | invalid — see §4 | opens the row editor |

One slot, one meaning, and the leading checkbox column disappears — which is what buys the name 32px of width back.

### 3.2 The fix ladder — one at a time, in a fixed order

Today up to three ladders render at once and they are unordered. **A row shows the highest-priority unanswered ladder and no other**; answering it reveals the next, if there is one. Order:

1. **Could not read this line** (`unread`) — `Make it a stop` · `Add to the row above` · `Skip it`
2. **No time on the line** — `Give it a time` · `Skip it`
3. **End time guessed** — `Keep 45 min` · `Set the end` · `No end time`
4. **Wrong day?** (first-in-group, or `dayGuessed`) — the `MOVE TO` chips + `and the rest below it`
5. **Two names in one line?** (`splittable`) — `Split into two` · `Leave as one`

**Maximum controls in one card at any moment: four** (the `MOVE TO` row on a six-day trip is six day chips plus one action — see §3.3). The worst case falls from ten to four for every ladder but the day one.

**Why sequential and not collapsed behind a "Fix" button.** The amber line has to be visible for the row to be worth stopping at; hiding the remedy behind a tap that first reveals a question the user has already read is a tap for nothing. Sequential ladders keep every visible question one tap from answered.

### 3.3 `MOVE TO`, on a long trip

Six day chips fit one line at 390px; a 14-day trip does not. Designed: the chips render as **the current day, its two neighbours, and `Another day…`** — which opens the row editor at its `WHICH DAY` block, where the full grid already exists and already wraps.

> `MOVE TO` · `D2` · **`D3`** · `D4` · `Another day…` · `and the rest below it`

On trips of six days or fewer this is indistinguishable from today's row.

### 3.4 Day groups

Unchanged: `Day 3 · Sat 14 Mar` at 12.5/700 with the `FROM THE TEXT` / `GUESSED` badge. One addition, on the group head, because it is where a wrong boundary is seen:

> `Day 3 · Sat 14 Mar` · `FROM THE TEXT` · `6 stops` (11px `--soft`)

---

## 4. Validation — what "invalid" means, and how it looks

Today nothing is invalid: a row with no time saves with no time, and an end before its start saves as written. Three conditions are worth catching, and all three are **local to a row**, so all three render in tier 2 as a rust line with a ladder.

| Condition | Line | Ladder |
|---|---|---|
| **End before start** (and not a plausible midnight crossing) | `Ends before it starts — 09:00 after a 13:45 start.` | `Swap them` · `Clear the end` · `Set the end` |
| **Two rows at the same time on one day** | `Nishi Market starts at 13:30 too.` | `Keep both` · `Set a time` |
| **No name** (after a split, or an editor commit that cleared it) | `This row has no name.` | `Name it` · `Drop it` |

**Invalid rows differ from accepted rows on three axes at once**, so the difference survives greyscale: the glyph (rust `!` against jade `✓`), the card's left edge (a 2px rust rule — the only new decoration in this design), and the tier-2 line's colour.

**An invalid row blocks the save**, and an unanswered `worked` row blocks the save. A **dropped** row never blocks anything.

`Keep both` exists because two stops at the same time is legitimate — a market and the café inside it — and the app must not invent a rule the itinerary does not have.

---

## 5. Progress, without looking like loading

**`.progress` is removed from this screen.** It is the tile downloader's bar and it means a transfer is running.

What replaces it is a **count in the header sub, and nothing else**:

> `Check what it read`
> `8 rows · 2 days · 3 need you`

and, in the sticky foot:

> `3 rows still need you` → `7 stops ready`

**Why no bar at all, not even a re-styled one.** The number the user cares about is not "how far through" but "how many left", and there are never more than a handful. A bar that fills as you tick things is a reward mechanic for confirming a parser's output; a count that falls to zero is the same information with none of that.

**Reserving `.progress`.** It stays exactly as it is, for the two places where something really is transferring: the tile download, and nothing else in the app today.

---

## 6. Bulk actions

Two, and only two, both in the sticky foot behind a `More` disclosure — because in a well-graded list there is usually nothing to do in bulk:

| Control | Applies to | Safety |
|---|---|---|
| `Drop the 3 rows that need me` | only `worked`/`unread`/invalid rows | It drops nothing the parser read cleanly, and dropped rows stay in the list, greyed and restorable. It is the honest exit from a bad paste. |
| `Undo the drops` | the last bulk drop | one undo for the batch, via the existing app-wide bar |

**No `Accept everything`.** Under §2 the clean rows are already accepted; the only thing such a button could do is answer the questions the screen exists to ask.

---

**Where `More` lives and what it holds** (asked in review): the sticky foot, right of the count. It holds these two actions and nothing else, out of sight because in a well-graded list there is usually nothing to do in bulk. Dropped rows stay in the list, greyed, and return with one tap.

---

## 7. Leaving and coming back

Verified: `phase`, `text`, `read`, `openRow` and `result` are **module state in `paste.js`**. So:

| Journey | Today | Designed |
|---|---|---|
| Tab away mid-review, tab back to Paste | the review pass is exactly as you left it, ticks and all | **unchanged, and it is good** — nothing is lost and nothing needs saying |
| Back arrow from the review pass | drops to the paste box with the text intact | **unchanged**, plus one line under the box: `Your rows are still there — Read it picks up where you left off.` **Requires that `Read it` reuse the existing `read` when the text has not changed**, instead of re-parsing and discarding the answers. |
| Reload the app mid-review | everything is gone; nothing was written | **stated, not fixed.** The screen writes nothing until Save, which is the promise it makes at the top (`Nothing is added to the trip yet`). A draft that survives a reload would be the first stored draft in the app. Recorded as **IF-3**. |
| Come back after saving | `reset()` on both `done` handlers, so Paste is empty again | **unchanged.** The receipt is on the Plan by then. |

---

## 8. Save, done, and failure

### 8.1 Ready to save

The existing summary screen is sound and is kept: the big count, `ACROSS n days`, the day-by-day list with spans, and the `TWO THINGS IT DID NOT DO` caveat. Three edits:

1. The sub becomes `n stops ready · nothing written yet` (today it asserts `All 8 rows checked`, which under §2 is no longer the claim being made).
2. The caveat's second sentence is unchanged; its first is unchanged; **the count of dropped rows moves into the summary card** where the other counts are.
3. `Back to the rows` stays, and stays a ghost.

### 8.2 Saving — pending on the control

P0-5 R1/R2, replacing today's `busy` amber note above the button:

> `Save 7 stops to the trip` → `Saving…` **[disabled]**

The `.amber-note` is not used for this. It is used for the failure below, which is an outcome.

### 8.3 Done

**What leaving does, and whether this screen is needed** (asked in review). **Verified in source: the back arrow and `Open the Plan` already do the same thing** — both run `reset(); go('plan', {}, { replace: true })`. The control is `icon.back`, not a close cross: `paste.js` 707 renders this screen through `backHeader`, like every other push screen in the app. **The stops are already saved either way**; the write finished before this screen appeared, so nothing here is a commit step and nothing is lost by leaving.

So the screen earns its place on one thing: **what it says that the Plan cannot.** Two sentences — *n stops have no position*, so they are missing from the map until someone pastes a map link, and *the pasted text is kept under `Last import`*, which is the only undo this flow has. Neither is visible on the Plan, and both matter later.

**Recommendation: keep it.** A back arrow beside an identical primary is fine when the screen is a receipt — nothing here can be cancelled, and the title `Saved` says so before either control is read. **If it were ever cut**, the unplaced-stop count would have to move onto the Plan's warning strip first — otherwise the flow ends by silently hiding its one caveat.

**Where this appears:** a full screen, reached from Trips ▸ Paste an itinerary, only after `Save n stops to the trip` returns successfully. A screen rather than a toast because the whole receipt has to be readable — particularly the caveat about stops with no position, which the user needs later. Closing it resets Paste to an empty box.

The existing receipt is kept almost whole — it is one of the better screens in the app. **Its verified shape** (`paste.js` 705–730): one borderless white `.card.pad` containing `.eyebrow.jade` `DONE` (`--jade`), the saved sentence at `.f125 lh155 --charcoal`, the unlocated sentence as `.f115 lh145 mt10 muted` **inside the same card**, and `.btn.jade` `Open the Plan` **inside the card**; the `Last import` footnote is bare `.f11 soft lh145` text outside it. The caveat stays muted text — it must **not** be promoted to an `.amber-note`, because amber marks outcomes (P0-5) and this is a caveat about what the outcome does not cover.

Two changes:

1. **It says where things landed**, as a fact rather than a button alone: `Day 3 · 6 stops · Day 4 · 2 stops`, one line under the sentence.
2. **`Open the Plan` lands on the first day that got stops**, not on whatever day was selected.

### 8.4 Failure and retry — new

`importItinerary` can fail (a full quota, a refused write) and today the screen shows a success receipt with zeroes. Designed:

> `.amber-note`, above the save button, and the button returns to `Save 7 stops to the trip`:
> `Nothing was saved. Your rows are still here — try again.`

and, when the store gave a reason:

> `Nothing was saved: <reason>. Your rows are still here — try again.`

The rows are genuinely still there (module state), so the sentence is true. This is the same shape as the join failure in the sharing flow, deliberately.

**Partial failure is not designed as a state** — `importItinerary` writes day by day and could in principle half-succeed. Whether it reports that is an implementation question, and until it does, the honest receipt is the one it can back. Recorded as **IF-4**.

---

## 9. Self-audit at 390 × 844

| Case | Behaviour |
|---|---|
| **Long stop name** | Tier 1's name wraps to two lines at 13.5/650; the time column and glyph are fixed, so nothing pushes out. Removing the leading checkbox gives it 32px more than today. |
| **CJK stop name** (`大稻埕・迪化街老屋與布市半日散步`) | One line at 13.5px, verified in the sprint's Review frames at the same size. Line-height 1.35 for CJK. |
| **CJK day header** (`第三天`) | Already parsed and already rendered; the group head is 12.5/700 and does not wrap. |
| **A 14-day trip** | §3.3 — three chips and `Another day…`. |
| **One row, one day** | No group head is suppressed; a single group still gets its head, because the badge is the statement about where the day came from. |
| **60 rows** | One scroller, day heads, sticky foot. The `3 rows still need you` count is what makes a long list tractable; there is no pagination. |
| **A dropped row** | Never blocks the save and never saves, so it is excluded from every count describing what will be created — one row dropped from eight parsed makes the foot read `Save 7 stops`. |
| **Nothing pasted** | Unchanged: `Nothing pasted yet — put the itinerary in the box above.` as an `.amber-note` — an outcome, correctly amber. |
| **Every row unread** | The foot reads `8 rows still need you`, the save is disabled, and `Drop the 8 rows that need me` is the exit. No special screen; the general case is already the right one. |
| **Every row clean** | The foot reads `8 stops ready` on arrival and the save is live — 8 of 8, because nothing was dropped. The screen is then a confirmation, which is the truth of that case. |
| **Empty state** | The paste box with the example is the empty state, and it is already designed and captured. |
| **Loading** | Parsing is synchronous — **no pending state**, per P0-5 A-13. The only pending here is `Saving…` (§8.2) and `Reading file.json…` on the trip-file path (unchanged, already on-control-adjacent). |
| **Error** | §8.4 save failure · the existing `readTripFile` reason line · the existing nothing-pasted line. |
| **Navigation away and back** | §7. |
| **Destructive** | Dropping a row is reversible in place (`—` → tap → back). The bulk drop gets one undo. Nothing here deletes anything from the trip. |
| **Undo** | The bulk drop only; per-row drops are their own toggle. |
| **Focus** | The row becomes one `<button>` (the whole tier-1 area) plus the glyph, instead of three separate tab stops — fewer, clearer stops. `.warn-fix` buttons are already focusable. |
| **Accessibility** | The glyph is a `<button>` with `aria-label` `Accepted — tap to drop Lumen Crossing`; the amber inference line is inside the row's accessible description, not orphaned. |

**Consistency check:** no string here contradicts P0-1 (nothing in Paste names another person), P0-4 (this screen never says `take` / `keep` / `theirs`) or P0-5 (pending only on `Save`, `.amber-note` only for outcomes). The verbs are the screen's own: `read`, `need you`, `drop`, `save`.

---

## 10. Exact copy

**Canonical. The artboard may show these strings and no others.**

**Header**
> `Check what it read`
> `8 rows · 2 days · 3 need you`
> `8 rows · 2 days · all read cleanly`

**One arithmetic, used everywhere.** The worked example in this document and its artboard is **8 parsed rows → 1 dropped → 7 saved**. Its census is **6 `read` · 1 `worked` · 1 `unread`**, and **3 rows need a decision**: the `worked` row, the `unread` row, and one of the six read rows that a validator caught after an edit (§4). Invalid is not a fourth parser grade — it is a state a read row can enter, which is why the census and the blocker count differ. Every count below follows from it. An earlier draft of this section did not add up — it said `8 stops ready` alongside `1 row dropped` out of `8 rows`, implying nine. The header, the foot, the bulk-action label, the summary card and the Done receipt are five statements about one list: change one number and all five change.

**Day group**
> `Day 3 · Sat 14 Mar` · `FROM THE TEXT` / `GUESSED` · `6 stops`

**Inference lines** *(existing, from the parser, unchanged)*
> `End time guessed — the line only gave a start`
> `End worked out from '45 min' on the line`
> `No time on the line — set one, or leave it`
> `COULD NOT READ THIS LINE`

**Ladders**
> `Make it a stop` · `Add to the row above` · `Skip it`
> `Give it a time` · `Skip it`
> `Keep 45 min` · `Set the end` · `No end time`
> `MOVE TO` · `D2` · `D3` · `D4` · `Another day…` · `and the rest below it`
> `Two names in one line?` · `Split into two` · `Leave as one`

**Validation** *(new)*
> `Ends before it starts — 09:00 after a 13:45 start.` · `Swap them` · `Clear the end` · `Set the end`
> `Nishi Market starts at 13:30 too.` · `Keep both` · `Set a time`
> `This row has no name.` · `Name it` · `Drop it`

**Row state, spoken** *(new — `aria-label` only)*
> `Accepted — tap to drop Lumen Crossing`
> `Needs a decision — tap to open Lumen Crossing`
> `Dropped — tap to put Lumen Crossing back`

**Sticky foot**
> `3 rows still need you` · `7 stops ready`
> `Save 7 stops`
> `More` · `Drop the 3 rows that need me` · `Undo the drops`

**Back to the box** *(new)*
> `Your rows are still there — Read it picks up where you left off.`

**Ready to save**
> `Ready to save`
> `7 stops ready · nothing written yet`
> `WHAT WILL BE CREATED` · `ACROSS 2 days`
> `7 stops · 1 row dropped · 3 fixed by hand`
> `DAY BY DAY`
> `TWO THINGS IT DID NOT DO` *(both sentences unchanged)*
> `Save 7 stops to the trip` · `Saving…` · `Back to the rows`
> `Day 3 already has 5 stops from earlier. Its new ones are added alongside, not over them.` *(unchanged)*

**Failure** *(new)*
> `Nothing was saved. Your rows are still here — try again.`
> `Nothing was saved: <reason>. Your rows are still here — try again.`

**Done** *(existing, plus one line)*
> `Saved` · `7 stops on your itinerary`
> `DONE`
> `7 stops saved from your itinerary. 3 new places were created for them, and 1 matched somewhere you had already saved.`
> `Day 3 · 5 stops · Day 4 · 2 stops` **(new)**
> `2 still need a position, so they will not appear on the map until you open one and paste its map link. Everything else — times, notes, shopping, must-see shots — works on them straight away.`
> `Open the Plan`
> `There is no undo, but the text you pasted is kept with the trip: paste again and it is waiting under Last import.` *(unchanged)*

---

## 11. What an implementer needs

1. **The gate inverts.** `outstanding()` becomes *rows that are `unread`, or `worked` with an unanswered inference, or invalid* — not *rows without a tick*. `wanted()` becomes *every row that is not dropped*.
2. **`row.checked` becomes `row.dropped`**, and its default flips. A `read` row is in by default.
3. **One state glyph** replaces the leading `.tick` and the trailing chevron/`skipped`.
4. **`candidate()` renders one ladder**, chosen by the §3.2 order, instead of every applicable ladder.
5. **`movable()` returns the three-neighbour chip set** on trips longer than six days, with `Another day…` opening `rowView`.
6. **Three validators** (§4), computed per row on every regrade, exposed as `row.invalid = { line, fixes }`.
7. **`.progress` is removed from `reviewView`.** Counts only.
8. **`Read it` reuses the existing parse** when the text is unchanged, so backing out of the review does not discard the answers.
9. **`mountSummary`'s save checks its result** and branches to §8.4 instead of always reaching `done`.
10. **`Save` uses the label swap plus `[disabled]`** (P0-5), and the `busy` amber note above it goes.
11. **New CSS:** `.cand.invalid` (a 2px rust left rule) and the glyph slot. That is all — `.cand`, `.cand-when`, `.cand-acts`, `.warn-fix`, `.archive-day`, `.review-foot` are all reused as they are.
12. Nothing here changes the parser, `importItinerary`, or what a saved stop looks like.

---

## 12. Findings recorded, not fixed

| id | Finding |
|---|---|
| **IF-1** | `mountSummary` sets `phase = 'done'` regardless of what `importItinerary` returns; a failed import renders as a receipt for zero stops. |
| **IF-2** | `.progress` is shared between the paste checklist and the tile download, which are different kinds of thing. |
| **IF-3** | The whole paste draft is module state: a reload loses it. The screen promises nothing is written, so nothing is *lost* — but nothing is recoverable either. |
| **IF-4** | `importItinerary` has no partial-failure report, so a half-written import cannot be described honestly. |
| **IF-5** | `data-split` derives new rows with `{...row}`, so a split row inherits the original's `raw` line — the row editor then shows a line that describes two stops for each half. Cosmetic; recorded. |

---

## 13. Status

| Item | Status |
|---|---|
| **The tick-every-row gate is removed; clean rows are accepted by default** (D-6 closed) | DESIGNED — **OD-2**, the one product call here |
| Three-tier row; one state glyph; leading checkbox removed | DESIGNED |
| One ladder at a time, in a fixed order | DESIGNED |
| `MOVE TO` on trips longer than six days | DESIGNED |
| Three validators and the rust invalid row | DESIGNED — new behaviour, no new screen |
| `.progress` removed; counts instead | DESIGNED |
| Two bulk actions behind `More` | DESIGNED |
| Leaving and returning | SPECIFIED — existing behaviour, one addition (`Read it` reuses the parse) |
| `Saving…` on the control | DESIGNED (P0-5) |
| Save failure and retry | DESIGNED — new copy |
| Done receipt says where things landed | DESIGNED |
| A draft that survives a reload | **REJECTED** for now — it would be the app's first stored draft (IF-3) |
| Partial-failure reporting | **DEFERRED** — needs a store change to be describable (IF-4) |
