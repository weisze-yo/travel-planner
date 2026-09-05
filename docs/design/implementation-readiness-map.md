# Implementation Readiness Map — Travel Planner

**Date:** 5 Sep 2026 · **Status:** the UX/UI implementation contract for the approved design baseline.
**Read `final-implementation-readiness-review.md` first.** This document is the detail behind it, and it is written for the implementation agent rather than for the product owner.

**What this is.** A statement of what the approved design requires, what the repository already provides, and where the two disagree. It is **not** an engineering task list: it names files and identifiers only where the source already makes a dependency explicit, and it never prescribes an implementation where the design does not constrain one.

**Source of truth, and it matters more here than anywhere else:**

| For | The truth is |
|---|---|
| What the product **should become** | the thirteen canonical design documents (`ui-ux-design-coverage.md` §5) |
| What the product **is today** | the working tree — `web/**`, `firebase/**` — read this session |

**A CONFIRMED row in the coverage matrix means the product owner approved the design. It does not mean the code matches it.** This session found three approved surfaces whose implementation contradicts the approved design, two of them on the same screen. Do not read a CONFIRMED + CAPTURED row as "already built correctly".

---

## 0. The five rules that govern every item below

These are approved, cross-cutting, and they decide most questions an implementer would otherwise raise.

| # | Rule | Canonical in |
|---|---|---|
| 1 | **Pending belongs to the control; outcomes belong to the screen.** No spinner, no overlay, no skeleton. Synchronous work gets nothing at all. | `p0-5-pending-work-design.md` |
| 2 | **Destructive = swipe → in-row confirm → 6s undo.** Exactly two confirm-button exceptions: `Empty this trip` and `discardPending`. The undo label always names the thing, never the act. | audit §8 · `p1-status-visibility-design.md` §3 |
| 3 | **A form that refuses says which field, in that field, in rust — and never pre-disables the button.** Four call sites currently ignore a tap in silence. | `p1-destination-tabs-design.md` §6 (canonical app-wide) |
| 4 | **PR-1 — the app never invents** a person, a place, a picture or an approximate position. | audit §2 |
| 5 | **PR-2 — a return lands on the thing the action was about**, never on whatever was selected before. | audit §9 |

Two more, stated because they are the shape of the whole product and an implementer who forgets them will build the wrong thing:

- **A shared trip is a copy you were handed, not a document you both live in.** Everything you change stays on your phone. Sharing publishes a *snapshot*; an update is reviewed one change at a time. Nothing is ever overwritten without someone pressing Take.
- **Four kinds never travel** — `shopping`, `prep`, `log`, `outfits`. Four approved strings promise this. `share.js` `PRIVATE_KINDS` enforces it.

---

## 1. What is approved — must be implemented exactly

Grouped by the document that is canonical for it. Where a row says *exactly*, the copy is fixed and an implementer may not re-word it: every string lives in that document's copy section.

### P0 — the five systems

| Area | Must be implemented exactly | Canonical |
|---|---|---|
| **Role & copy identity** | three roles; the offer phase shows two; the `read` send block has **no button**; chip + caret for owners, badge for everyone else; the `from Ana` marker on five surfaces; the arrival banner; the corrected Log line | `p0-1-…` |
| **Currency identity** | the guess shown before Create; six states of the derived line; **Create is never gated on currency**; no currency → **no symbol** → summaries say so; provenance on Trip settings; re-derivation is an offer, never an overwrite; four rewritten failure notices | `p0-2-…` |
| **System consolidation** | the three-tier empty-state system and its shared-kinds limit; the fact-first warning strip (four kinds, three slots, two invariants) | `p0-3-…` |
| **Review** | **three-way diff against a retained base**; eleven cases, three of which stop appearing; the **stacked** row; `YOURS` / `THEIRS`; immediate writes plus the app-wide undo; the sticky foot with the bulk-safety rule; five completion states and a receipt that survives navigation | `p0-4-…` + `p1-review-bulk-actions-refinement.md` |
| **Pending work** | eleven rules; the canonical pending labels; zero new CSS | `p0-5-…` |

### P1 — twelve areas

| Area | Must be implemented exactly | Canonical |
|---|---|---|
| Share → Join → Review as one flow | the round trip and its five seam failures; a live link's role is changeable | `p1-share-join-review-flow-design.md` |
| Paste | input → review rows → ready → saving → done → failure; the gate inverted; one ladder, one glyph, three validators | `p1-paste-review-design.md` |
| Review's bulk actions | staged disclosure in the sticky foot; `finishReview` moves out of the bulk handlers into `settle()` | `p1-review-bulk-actions-refinement.md` |
| Tile download · stuck changes · sub route · cross-tab sync | the honest estimate, the failed-tile caveat, the rust stuck state, `discardPending` as a confirm exception; cross-tab sync is **a deliberate nothing** | `p1-coverage-gaps-design.md` |
| Removal & absence | the corrected `.gone-card` copy; the stop that has gone; a place with no position; `Empty this trip`; a refused read mid-session | `p1-absence-and-removal-design.md` |
| Editing the day | the eight interactions; the **two-stage** destructive ladder; `not a time`; the `Moved to Day 4.` receipt; add-a-stop refuses out loud with pending on the button | `p1-plan-editing-design.md` |
| The account | the account row's five states; the sheet; **the email/redirect return leg announced on the row**; sign-out | `p1-account-and-sign-in-design.md` |
| Status visibility | the `local` dot becomes **hollow**; the strip's five-slot rank order (red reminder first); the undo bar; the blank map's amber card | `p1-status-visibility-design.md` |
| Destination's five panels | three tier-3 joined-copy empties; Shop and Notes **keep** tier 2; the currency rule on Shop; the silent-refusal rule | `p1-destination-tabs-design.md` |
| Empty states, warning strips, joined identity, currency, navigation return, long content & CJK | as the cross-cutting table in `ui-ux-design-coverage.md` §3 | various |

---

## 2. What already exists — preserve it

**These are not placeholders. They are approved behaviour that reads as accidental and is not.** Several have been mistaken for gaps in earlier passes; four of the nine claims corrected in the last batch were surfaces that turned out to be built.

| Exists | Preserve because |
|---|---|
| **The two-stage destructive ladder on the Plan** — `✕` archives (reversible, row stays on screen with `Add back`); only an **archived** row can be swiped to delete. A live stop cannot be swiped at all. | It is the reason the Plan needs no delete confirmation. Do not add one, and do not make `✕` delete. |
| **Free-time lanes derived from gaps.** When a stop moves, the vacated slot becomes free time by itself. | There is no "vacated slot" state to design or build. Verified this session in `f15`–`f18`. |
| **Plan's empty day**, dashed stubs and all | Already the approved tier-1 treatment. |
| **`stopIndex()` skips `archived`**, so archive and delete are one signal to the other side | The base snapshot must be indexed through the same function. |
| **`MINE_ALONE`** (`captured`, `bought`, `boughtOn`, `paidAmount`, `packed`) stripped before a row diff | A shot you ticked must not read as a difference. |
| **The warning strip's rank order in `remind.js`** — red loop reminder first, then stuck. | The code is right; two prose statements were wrong. **Do not reorder the code to match either.** |
| **All five sync `aria-label`s**, verbatim; two of the five carry a visible sentence | Only the `local` dot's *shape* changes. |
| **The undo bar replaces rather than stacks**, and survives a screen change | One bar, one label, the most recent thing. |
| **Repaint through the store** (`store.selectDay(state.selectedDay)`) on Destination | Do not replace it with local re-render. |
| **A place and the stop that visits it show the same five panels** | They are the same place. Looks like a bug; is not. |
| **`.review-foot`, `.arrived`, `.archive-moved`** — defined in `app.css`, currently unused | Approved designs consume all three. **Do not delete them as dead code.** |
| **The trip's basic facts travel in the envelope**, not as a fourth shared kind | So a join never guesses the name, dates, centre or currency. |

---

## 3. What needs modification — existing implementation that contradicts the approved design

Ordered by consequence. Each row states the evidence, so none of it has to be re-discovered.

| # | Surface | Today | Approved | Evidence |
|---|---|---|---|---|
| **M-1** | **Review — the diff** | **two-way**: `pendingUpdate()` → `diffSnapshot(mySharedState(), snapshot)`. No base is retained on the receiving side. A stop **you** added is presented as `THEY REMOVED` and `Take theirs` deletes it with no undo; a stop **you** deleted returns as `THEY ADDED`. | three-way against a retained base; `diffSnapshot(mine, theirs, base)`; with `base == null` it must behave exactly as today (that is the approved no-base mode) | `p0-4-…` §1.1, §2; source confirmed this session — no `reviewedSnapshot` or `lastReview` exists anywhere in `store.js` |
| **M-2** | **Review — the row** | `.sides { display: flex }` — two ~150px columns at 390px, with `word-break: break-word` breaking values mid-word | **stacked, full width, as the default** — one new class `.side.stacked`; this supersedes `new-feature-design.md` §4.5 | `p0-4-…` §3.2 |
| **M-3** | **Review — bulk actions** | two inline buttons at the end of the scroller, roughly two screens below the fold on a 6-entry update; `Take all of theirs` takes everything including rows you changed; both handlers call `finishReview` immediately | staged disclosure in the **sticky `.review-foot`**; bulk never touches a row you both changed; `Take all of theirs` removed in favour of `Take the n you have not touched`; `finishReview` moves into `settle()` so the batch undo has something to put back | `p0-4-…` §6.1 · `p1-review-bulk-actions-refinement.md` |
| **M-4** | **The Plan's archive card** | **renders white.** `.swipe-face { background: #fff }` (`app.css` 1037) overrides `.archive-card { background: var(--dark-card) }` (`app.css` 649); every child colour is light — name `#E4EBE8`, `Add back` white on `rgba(255,255,255,.14)`, `MOVE TO` chips `#E4EBE8`. Measured contrast ≈ **1.1:1**. The second half of the destructive ladder is invisible and unusable. | the dark card the design specifies, unchanged | frame `f19-plan-archive-card-DEFECT.png`; computed styles measured this session. **See also X-11: an approved document asserts the card is already dark.** |
| **M-5** | **The Plan's swipe rows in edit mode** | `plan.js` 373 and 577 interpolate a **string of markup** into an `html` template, so `esc()` escapes the attribute quotes. Live DOM: `data-loop-row="\"day-3\""`, `data-loop-name="\"Market"`, plus a junk attribute `afternoon&quot;`. `deleteLoop('"day-3"')` / `deletePlanItem('"lumen"')` cannot match an id, so **swipe-delete on an archived stop and on a sub-route lane is a no-op**, and the in-row confirm shows a truncated quoted name. A name containing `"` is a markup-injection vector. | the swipe → in-row confirm → 6s undo that both the design and the source comments describe as existing | measured in the live DOM this session; the markup is invalid enough that the capture renderer refused the screen until it was sanitised |
| **M-6** | **Add a stop** | `if (!typed && !placeID) return;` — a silent refusal on a primary. Pending renders as `Adding…` **above** the form and the form closes before the await resolves. | refuses out loud, in the field, in rust; pending on the button (`Add` → `Adding…` `[disabled]`); **the form stays up** until it resolves | `p1-plan-editing-design.md` §7 · rule 1 · rule 3 |
| **M-7** | **The three Destination editors** | `readItemEditor` / `readShotEditor` return `null` on an empty name and their callers `return` silently | the silent-refusal rule, all four call sites | `p1-destination-tabs-design.md` §6 |
| **M-8** | **Destination's panel selection** | `let tab` is module state that **nothing resets**. Measured: open a stop → Shop → navigate to Plan → Trip settings → open a *different* stop → still Shop. | the tab is a lens on one subject; opening a different stop starts at Info | measured this session. **See also X-12: an approved document states this already resets and calls it verified.** |
| **M-9** | **Destination's Shop panel + `itemEditor`** | `state.trip?.currencySymbol \|\| '¥'` (`dest.js` 376, 471) and `itemEditor(item, { symbol = '¥' })` (`parts.js` 493) | no currency → bare tabular numbers; the summary line takes `Prices have no currency yet. Set it in Trip settings.`; the price label drops its parenthetical | `p1-destination-tabs-design.md` §4 · `p0-2-…` §7.1, §12.5 |
| **M-10** | **Destination's five empty states** | four of five are the bare `.empty` one-liner; none is gated on `trip.sharedFrom` | three tier-3 joined-copy empties (Info, Nearby, Must-see) with the jade card and the context line; **Shop and Notes keep tier 2** | `p1-destination-tabs-design.md` §3 |
| **M-11** | **`Empty this trip`'s confirm** | `This cannot be undone. Everything listed above will be deleted.` | `This cannot be undone. Everything listed above goes, including your shopping list, your packing list and your Log.` — **and on a joined copy it also clears the review base** | `p1-absence-and-removal-design.md` §5 · **gated on OD-6** |
| **M-12** | **Trip settings · MONEY** | three `field()`s in one `.row.g8` at 390px: `Your currency`'s label wraps to two lines and its input sits **19px lower** than the other two (measured y = 507 · 507 · 526) | the row reads as one row | frame `f10-trip-settings-money.png` |
| **M-13** | **`keepMySide()`** | clears `people`, `link`, `share`, `removed`, `declined`, `tookVersion` | must **also** clear the review base and the receipt — a former shared copy must not keep a receipt for an update from someone it is no longer connected to | `cross-flow-consistency-audit.md` §10; depends on M-1 |
| **M-14** | **The sign-in notice slot** | `signInNotice` carries pending, a user error, and seven Firebase deployment failures in one string, rendered as an `.amber-note` above the buttons | pending on the two `.sign-btn`s; the notice slot carries only refusals and errors | `p1-account-and-sign-in-design.md` §3, G-2/G-4 |
| **M-15** | **`.sync-dot.grey`** | solid `--faint`; `saved` and `local` mean opposite things and are distinguished by hue alone at 8px | hollow — 8px, transparent, 1.5px `--faint` ring. **One CSS property.** Nothing in `syncDot()` changes. | `p1-status-visibility-design.md` §1 |
| **M-16** | **`areas.js` · STORAGE** | an 18px `.tnum` figure at intrinsic width in a `.row.g8` with no `flex-wrap` and no `white-space: nowrap`. Fits at `0 kB`; a wider value or wider metrics wraps it into the paragraph below. | one row, one line | frame `f22-areas-storage.png` — low severity, one property |

---

## 4. What needs new implementation

Nothing in this section is a design question. Every string and every state is already written down.

| # | New | Where it is specified | Depends on |
|---|---|---|---|
| **N-1** | **`.hint-jade`** — one CSS rule, from a recipe that already exists. Today the class is referenced by `areas.js` 64 and `stuck.js` 69 and **undefined**, so both render as unstyled 16px body text, larger than the 12–13px copy around them. | `p0-1-…` §8 | nothing. **First in the CSS queue, not last** — two approved specs assume it |
| **N-2** | **`trip.reviewedSnapshot`** — one stored blob per trip, written in `joinTrip` (the seed snapshot) and in `finishReview` (the snapshot just reviewed); read as `trip.reviewedSnapshot \|\| shareState()?.snapshot \|\| null`. The sending side already does exactly this with `share.snapshot`. | `p0-4-…` §2.2 | nothing — **the one item everything else in Review rests on** |
| **N-3** | **The no-base mode** — degrade to today's two-way diff, say so once in a bone line under the header, badge every changed row `THEY SENT`, and limit bulk to `Keep all of mine`. | `p0-4-…` §2.3 | N-2 |
| **N-4** | **Entry fields `stakes` / `titleFrom` / `cost`**, the conflict badge, the rust cost line, and the eleven cases' badges and nouns. | `p0-4-…` §3.3, §11 | N-2 |
| **N-5** | **`trip.lastReview`** and the receipt — a jade `UPDATE DEALT WITH` card plus the collapsed receipt list, rendered from `lastReview`, surviving navigation and relaunch until a newer snapshot arrives. | `p0-4-…` §7.4 | N-2 |
| **N-6** | **A removal detector** — `removedFromTrip()` exists at `store.js` 3881 and **has no caller anywhere in `web/js/**`**. Until a detector exists, the corrected removal screen is unreachable. The rule is in absence §2.4. | `p1-absence-and-removal-design.md` §2.4 | a real backend to detect against |
| **N-7** | **A reader for the return leg** — `restoreAccount()` computes `notice` (`'email'` / `'redirect'` / an error code), `store.js` 129 stores it on `state.session`, and **nothing reads it**. `state.signInNotice` is a different channel, set only by sign-in errors and `noteSignIn`. The account row substitutes the "just now" sub-line and the flag is consumed on first render. | `p1-account-and-sign-in-design.md` §3, §11.1 | nothing |
| **N-8** | **`not a time`** — the `.edge` `change` handler sets a per-row `badTime` key instead of only restoring the input; `.edge-derived` renders `not a time` in `--danger-fg` until the next valid commit. | `p1-plan-editing-design.md` §4.3 | nothing |
| **N-9** | **`Moved to Day 4.`** — into the existing unused `.archive-moved`. | `p1-plan-editing-design.md` §6.3 | M-4 (the card must be visible first) |
| **N-10** | **The blank map with no kept areas** — one amber card: `NO MAP PICTURE` · `Distances, order and walking times are all worked out on the phone. Only the streets are missing.` · `Keep an area for offline`. The gap is exactly one condition: `outside()` returns null on its first line when no areas are kept. | `p1-status-visibility-design.md` §4 | nothing |
| **N-11** | **A place with no position** — a `.warn` strip on Destination, the Plan's chip on its Nearby card, one coverage line on the sub route. Not a fifth `dayIssues()` kind: a presentational reuse of `.warn`. | `p1-absence-and-removal-design.md` §4 | nothing |
| **N-12** | **The stop that has gone** — a tier-2 empty with one ghost action, not an ink primary. | same, §3 | nothing |
| **N-13** | **A refused read mid-session** — replaces one sentence in Share's non-owner explainer. Jade, not rust: nothing failed and nothing is lost. | same, §6 | a real backend |
| **N-14** | **`.side.stacked`** and **`.review-group`** — appended at the end of `app.css`. That is the whole new CSS for Review. | `p0-4-…` §11.9 | nothing |
| **N-15** | **`manifest.webmanifest`** — referenced by `index.html` 16 and precached by `sw.js` 14, and **absent**, so a `cache.addAll()` rejection fails the whole service-worker install. | **blocked on OD-8** | OD-8 |

---

## 5. What must NOT be changed

**This section exists to protect the approved baseline from improvisation.** Every item below was decided deliberately, most of them against a plausible-sounding alternative that was considered and rejected. If an item here looks wrong during implementation, it is a question for the product owner — not a fix.

**Approved product decisions — closed, do not reopen:**

R-1 three-way Review · C-1 bare numbers with no currency · S-1 the tier-3 sentences · S-2 Latin-first on `body` · S-3 bulk never touches a row you both changed · S-4 no action on a stopless shared day · OD-1 a live link's role becomes changeable · OD-2 Paste stops asking about rows it read cleanly · OD-3 `discardPending` stays a confirm exception · OD-4 both sharing doors designed · OD-5 `OVER BY`.

**Explicitly rejected — do not add:**

| Do not add | Because |
|---|---|
| A confirm on the Plan's `✕` | It archives. The archive **is** the confirm, and `Add back` is the undo. |
| A per-kind picker on `Empty this trip` | A better product and a new screen. The counts card plus an honest confirm is the approved smallest change. |
| A second arrival banner, for the account | The app has one arrival banner and it belongs to joining a trip. The account row is where the account speaks. |
| A stacked or plural undo bar | One bar, one label, the most recent thing. |
| A fifth sync colour, a label under the dot, or a numeral in the dot | The palette has four semantics and grey is not one of them. |
| A spinner, an overlay or a skeleton, anywhere | P0-5. Synchronous work gets nothing at all. |
| A guess about *why* the map is blank | `tiles.js` reports per-tile failures, not causes. **Pending OD-7.** |
| A sentence that names a person as the subject of a negative verb | P0-1. Enforcement is shown by absence. |
| A stock photo, an avatar, a placeholder person, an approximate position | PR-1. |
| Pagination or a virtual list in Review | The foot's `Keep all of mine` is the honest exit from a long update. |
| A pre-disabled primary on any form that can refuse | Rule 3. The refusal is a sentence in a field, not a dead button. |
| An "I'll do this later" ghost on the New-trip modal | **Pending OD-9.** If the answer is "keep it", nothing is added. |

**Do not delete as dead code:** `.review-foot` · `.arrived` · `.archive-moved` · `removedFromTrip()` · `state.session.notice` · `clearUndo()`. Five of the six are consumed by approved designs that are not built yet; the sixth is harmless.

---

## 6. Known technical findings

**Record, do not fix while reading this.** Each is classified as the audit asked: **A** existing and correct · **B** missing but explicitly specified by design · **C** existing but implementation needs modification · **D** design still ambiguous · **E** dead / legacy.

| Symbol or finding | Class | State |
|---|---|---|
| `.hint-jade` | **B** | Referenced by `areas.js` 64 and `stuck.js` 69; **undefined in `app.css`**. Renders as unstyled 16px body text — verified in `f20`. Recipe exists (P0-1 §8) → **N-1**. |
| `.trip-chip` | **A** | `app.css` 481, used by `parts.js` 19. Fixed `height: 44px`, so the chip cannot grow: name line + **one** meta line fits, a second would clip. Correct as designed. |
| `.trip-mark` | **A** | `app.css` 493; used by `parts.js` 20 and `share.js` 186/199. `.trip-mark-lg` (1535) is the cover picker's. Distinct from `.strip-mark` (1769) — three similarly-named classes, all real, none interchangeable. |
| `.who-mark` | **A** | `app.css` 1967 (+ `.acct .who-mark` 2185); used by `join.js` 119 and `trips.js` 207. |
| `.pill` | **A** | `app.css` 266–282; used by `parts.js` 47 (day pills) and by `plan.js` 538 / `shop.js` 226 as a filter chip with an inline white override. The override is legacy-shaped but harmless and out of scope. |
| `.stat` | **A** | `app.css` 792–798 with `.ok` / `.tight` variants — the sub route's three stat tiles. Matches `p1-coverage-gaps-design.md` §3. |
| `.sync-ring` | **A** | `app.css` 1823, with the `prefers-reduced-motion` opt-out at 1833; used by `parts.js` 32. **10px**, not 6px. One property changes on its sibling `.sync-dot.grey` → **M-15**. |
| `.map-pin` | **A** | `app.css` 440–464 with `.slack` / `.sub` / `.sub-num`; used by `map.js` 220/227 and `sub.js` 360/366. |
| `.review-foot` | **A** + **B** | Defined and correct (`app.css` 1416, `flex: none`, 1px top line, `safe-bottom` padding, a `[disabled]` state). **Consumed only by `paste.js` 255.** Review needs it → **M-3**. Do not delete. |
| `.arrived` | **B** | `app.css` 2075–2086 (`.arrived-t`, `.arrived-s`) — defined, **no JS caller**. The only `arrived` hits in JS are unrelated prose. P0-4's receipt consumes it → **N-5**. Do not delete. |
| `.archive-moved` | **B** | `app.css` 667 — defined, **no JS caller**. Exactly the class the `Moved to Day 4.` receipt needs → **N-9**. Do not delete. |
| `removedFromTrip()` | **B** | `store.js` 3881, exported, **no caller anywhere in `web/js/**`**. Needs a detector → **N-6**. |
| `state.session.notice` | **B** | `restoreAccount()` (`persist.js` 233–252) computes it; `store.js` 129 stores it on `state.session`; **nothing reads it**. The value is a raw token (`'email'` / `'redirect'` / an error code), so the reader must map tokens to the copy in the account design's §3 table. `state.signInNotice` is a **different** channel → **N-7**. |
| **`.archive-card` is white, not dark** | **C** | `.swipe-face { background: #fff }` (1037) beats `.archive-card { background: var(--dark-card) }` (649) — equal specificity, later declaration. All child colours are light. ≈1.1:1 → **M-4**. |
| **Attribute mangling in `plan.js` 373 / 577** | **C** | A markup string interpolated into an `html` template is escaped by `esc()`. Breaks archived-stop and sub-route swipe-delete, mangles the confirm label, emits invalid HTML, and is a markup-injection vector on a name containing `"` → **M-5**. |
| **Destination's `tab` never resets** | **C** | Module state with no reset → **M-8**. |
| **Trip settings MONEY row misaligns at 390** | **C** | Measured 19px offset → **M-12**. |
| **`areas.js` STORAGE row has no horizontal slack** | **C** | One property → **M-16**. Low severity. |
| **An end time before the start** | **D** | Demo Day 3: `13:45` start, `09:00` end → derived length `19h 15m`, plus an `OVERLAPS` strip. `parseClock` accepts both values, so `not a time` never fires — the approved design covers *unparseable* input, not an *inverted window*. **One line of design is needed:** is an inverted window a rejection, an overnight window, or a warning-strip case? `ENDS WHEN IT STARTS` already exists as a strip kind, which is the cheapest precedent. Verified in `f15`. |
| **`manifest.webmanifest`** | **B** | Referenced twice, absent; fails the SW install → **N-15**, blocked on OD-8. |
| `remind.js`'s header comment | **E** | States a rank order its own `strip()` does not implement. **Correct the comment, never the code.** |
| `clearUndo()` | **E** | Exported, called by nothing. Harmless — the timer does the job. |
| `movedToDay` | **E** | Set to `null` in three places in `store.js` and **never set to a day**. Either the field the `Moved to Day 4.` receipt should use, or dead. Decide when implementing **N-9**; do not delete first. |
| `strandedReason()` | **A** | Three genuinely different sentences for three genuinely different causes. Not about tiles — it is `state.stranded`, the app configured for a cloud and running local anyway. |

---

## 7. Dependency order

Only dependencies the source or the approved documents make explicit. Everything at the same level is independent.

```
0 ── .hint-jade                     one CSS rule; two screens are wrong until it lands
     .sync-dot.grey → hollow        one CSS property
     .side.stacked / .review-group  appended CSS, no behaviour
        │
1 ── P0-5 pending                   zero CSS, most screens; touches almost every
     Rule 3 silent refusals         file, so it goes before the files change again
     (Plan add · 3 Destination editors)
        │
2 ── P0-2 currency                  7 `|| '¥'` fallbacks + itemEditor's default
        │                           parameter = 8 sites; independent of Review
        │
3 ── trip.reviewedSnapshot          ── the one item everything in Review rests on
        ├── three-way diff (+ third argument, null ⇒ today's behaviour exactly)
        ├── no-base mode + THEY SENT
        ├── stakes / titleFrom / cost, the eleven cases
        ├── sticky foot + staged bulk + finishReview → settle()
        ├── trip.lastReview + the receipt
        ├── keepMySide() clears base + receipt
        └── Empty this trip clears the base   ← also gated on OD-6
        │
4 ── Plan editing                   M-4 (the card must be visible) before N-9
     .archive-card dark ─→ Moved to Day 4.    (the receipt)
     plan.js attribute fix ─→ archived + lane swipe-delete work at all
     not a time (independent)
        │
5 ── Destination                    tier-3 empties · currency rule · tab reset
     Status visibility              blank map · strip order is documentation only
     Absence                        no position · the stop that has gone
        │
6 ── Backend-gated, in any order    removal detector (N-6) · a refused read (N-13)
        │                           · the emailed-link return leg's reader (N-7 is
        │                           buildable now; seeing it needs real auth)
        │
7 ── OD-8, if approved              manifest.webmanifest · the install line
```

**Two ordering notes worth stating:**

- **P0-5 before everything except the three CSS one-liners.** It has zero CSS, it touches almost every screen, and doing it after the screens change means touching them twice.
- **Nothing in Review is worth starting before `reviewedSnapshot` exists.** Building the stacked row or the sticky foot first is safe but pointless: the row's content, its badges and its bulk eligibility are all functions of the base.

---

## 8. What this map deliberately does not contain

- **Any code.** No application file was modified this session.
- **Any new design.** Two contradictions found this session (M-4, M-8) are corrections to *source claims in approved documents*, not changes to approved decisions.
- **Engineering detail the design does not constrain** — module boundaries, data-layer shape, test strategy, migration mechanics for `reviewedSnapshot` on existing trips. Those are the implementer's calls.
- **The four OPEN DECISIONS.** They are in `final-implementation-readiness-review.md` §6 and only the product owner closes them. Two of them (OD-6, OD-9) change code; do not proceed on the recommendation alone.

---

## 9. DECISIONS RECORDED — 5 Sep 2026

**Appended only. Nothing above this line was changed.** The four open decisions and the one design ambiguity are closed. Canonical record: `final-implementation-readiness-review.md` §13.

| ID | Answer | Effect on this map |
|---|---|---|
| **OD-6** | **YES** — `Empty this trip` may delete Shopping, Packing and Log; use the corrected confirmation | **M-11 is unblocked** and implemented as written. On a joined copy it also clears the review base (so it stays sequenced after N-2). |
| **OD-9** | **Add the choice** | §5's row *"An 'I'll do this later' ghost on the New-trip modal"* **flips from rejected-pending to approved.** One ghost on the modal, label `I'll do this later`, landing on the trip just created. Not a new screen, not a step inside Paste, not a changed default. §13.1 of the review is canonical for it. |
| **OD-7** | **NO** cause sentence | **N-10 is unblocked** and ships with its approved copy only. §5's *"a guess about why the map is blank"* stands as a permanent rejection. |
| **OD-8** | **YES**, Android only, one line on the trips home after a second launch | **N-15 is withdrawn.** `web/manifest.webmanifest` has shipped since `283bc79` and returns 200 in production, and `sw.js` line 65 adds assets individually with `.catch(() => {})` — it does not use `addAll`, so no install failure exists to fix. The approved work is **the install line alone**; do not touch the manifest, the icons or the service worker. See review §13.2. |
| **D-1** | **No flag** | The class-**D** row *"An end time before the start"* in §6 becomes **A — existing and correct.** `itemWindow()`'s overnight rule is an approved decision. Do not add a plausibility check, a rust line, a fifth `dayIssues()` kind, or an automatic correction; leave the explanatory comment in place. See review §13.3. |

**Every other rejection in §5 stands, and the eleven closed decisions (R-1 · C-1 · S-1 · S-2 · S-3 · S-4 · OD-1 · OD-2 · OD-3 · OD-4 · OD-5) are unchanged.**

**Before working from §3, §4, §6 or §7, read `transition-audit.md`.** This map was written against tree `1d3df59`; four of its findings (M-5, M-8, M-10, N-15) are already resolved in `main`, two of its counts are wrong, and every line number it cites has drifted.
