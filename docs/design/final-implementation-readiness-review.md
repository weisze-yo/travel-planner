# Final Implementation-Readiness Review — Travel Planner

**Date:** 5/6 Sep 2026 · **This is the only document you need to read first.**
**Session type:** implementation-readiness audit. **Design and audit only — no application code was written, no `web/**` or `firebase/**` behaviour was modified, nothing was refactored, and no approved UX decision was changed.**
**What was produced:** this review · `implementation-readiness-map.md` (the implementation contract) · 28 new 390 × 844 frames in `docs/design/screens/final/` · targeted updates to `ui-ux-design-coverage.md`.

---

# 1. Final verdict

## **B — READY AFTER OPEN DECISIONS**

**The design baseline is complete and internally consistent enough that a separate implementation agent can build it without making product or design decisions on your behalf — once the four questions in §6 are answered.** That is the direct answer to the question you asked.

**Why B and not C.** Two of the four open decisions change code rather than copy. OD-6 changes what `clearTripContent()` does; OD-9 changes the New-trip modal's exit. An implementation agent that met either question mid-build would have to guess at a product call, which is exactly the failure this session existed to prevent. C would require no material decisions to remain, and four remain.

**Why B and not D, although D is also true.** 32 of 71 rows are still unseen at 390 × 844, so verification debt is real and §5 lists it honestly. But it is no longer the *binding* constraint: the three highest-value verification items were done in this session, and the debt that remains is concentrated in states that need a backend, a second account or a pointer gesture — not in states nobody has bothered to look at. The open decisions are what stand between you and a start.

**Why not A.** No broad design gap remains. One row in the whole matrix cannot be designed until you answer a scope question (install / first run, OD-8), it is P2, and nothing depends on it. Everything else is either confirmed or understood with nothing undecided in it.

**One new design ambiguity was found**, by looking rather than by reading: an **end time before the start** produces a derived length of `19h 15m` instead of a rejection. `parseClock` accepts both values, so the approved `not a time` never fires — the approved design covers *unparseable* input, not an *inverted window*. **This is one line of design, not a design pass**, and the app already has a precedent to reuse (`ENDS WHEN IT STARTS` is an existing warning-strip kind). I have not resolved it, because it is a small product call about what an inverted window *means*.

**The honest headline.** The design is done. What this session proved is that **"the design is confirmed" and "the code matches the design" are two different sentences**, and until now only the first had been checked. Three approved surfaces contradict their approved design in the running app, two of them on the same screen, and all three were on rows already marked CONFIRMED. That is not a reason to delay implementation — it is precisely the list an implementation agent needs, and it is now written down.

---

# 2. Design completion

Every figure counted from the rows of `ui-ux-design-coverage.md` §2. Arithmetic printed so it is checkable.

| | Count | of |
|---|---|---|
| Meaningful screens and flows inventoried | **71** | — |
| **Design CONFIRMED** by you | **56** | 71 |
| **UNDERSTOOD — not yet explicitly confirmed** | **14** | 71 |
| **DESIGN DECISION REQUIRED** | **1** | 71 |
| Behaviour **OBSERVED** running | **47** *(was 43)* | 71 |
| Behaviour **SOURCE-ONLY** | **23** *(was 27)* | 71 |
| Behaviour **NOT BUILT** | **1** | 71 |
| Appearance **CAPTURED** at 390 × 844 | **39** *(was 36)* | 71 |
| Appearance **VISUAL NOT VERIFIED** | **32** *(was 35)* | 71 |
| Rows carrying an open decision | **4** | 71 |

**56 + 14 + 1 = 71 · 47 + 23 + 1 = 71 · 39 + 32 = 71.**

**Design completeness: 79% confirmed, 99% confirmed or understood, one row (1.4%) awaiting a decision before it can be designed. Unchanged from the last pass — no design work was done this session, and none was needed.**

**The appearance and behaviour figures moved, and one of them moved *down*.** `Changes on this phone` was scored CAPTURED on the strength of frame v15's "jade receipt". That receipt is the **undefined** `.hint-jade` class rendering as plain 16px body text. A frame of the wrong thing is not verification, so the row was downgraded. **I did not optimise the numbers**; the net gain is +3 captured, and it would have been +4 if I had left that row alone.

---

# 3. What is approved

The completed baseline, as you listed it, confirmed against the documents that carry it.

**P0 — five systems, all confirmed:**

- **P0-1 Role & copy identity** — three roles, two shown in the offer phase, the `read` send block with no button, the `from Ana` marker on five surfaces, the arrival banner, the corrected Log line.
- **P0-2 Currency identity** — the guess before Create, six states of the derived line, Create never gated, no currency → no symbol, provenance on Trip settings, re-derivation as an offer, four rewritten failure notices.
- **P0-3 System consolidation** — the three-tier empty-state system and its shared-kinds limit; the fact-first multilingual warning strip.
- **P0-4 Review** — three-way against a retained base, eleven cases, the stacked row, `YOURS`/`THEIRS`, immediate writes plus app-wide undo, the sticky foot and the bulk-safety rule, five completion states and a receipt that survives navigation.
- **P0-5 Pending work** — eleven rules, the canonical labels, no spinner, no overlay, no skeleton, zero CSS.

**P1 — nine areas, all confirmed:** Share → Join → Review as one flow · Paste Review · Review bulk actions · P1 coverage gaps · Absence and removal · Plan editing · Account and sign-in · Status visibility · Destination tabs.

**Also approved:** the multilingual warning-strip design · the empty-state system · the existing visual language and design principles.

**Cross-cutting, all confirmed:** pending · destructive actions with the confirm-button test and its exactly two exceptions · undo · empty states · warning strips · joined identity · currency · a form that refuses · navigation return (PR-2) · the app never invents (PR-1) · long content and CJK.

**Nothing in this list was reopened, re-litigated or cosmetically adjusted this session.**

---

# 4. Verification completed

**What was actually seen, at 390 × 844, driven through the real application** — the real `app.css` and the real `js/app.js` module graph, in `web/verify.html`, with states reached through the app's own store and router rather than by writing markup. 28 frames, in `docs/design/screens/final/`.

| Target | Frames | What was seen |
|---|---|---|
| **Destination's five panels** — the audit's #1 target | f01–f08 | All five opened and seen **populated and below the fold**: the Info facts table (7 key/value rows), Nearby's 14 cards with the `+`/`✓` control, Must-see's full photo cards, Shop's 4 rows with the summary line, and Notes with its closing explanation. |
| **Trip settings below the fold** — the audit's #2 target | f09–f14 | Scrolled end to end: `THE TRIP`, `MONEY` with its live provenance line (`1 MYR = 33.7 JPY · rate you entered`), `FORECAST`, `WHEN THERE IS NO SIGNAL`, `THE ITINERARY` with all four buttons, and `START THIS TRIP FRESH` **at rest and armed**, including the confirm sentence and the five count chips wrapping to two rows. |
| **The Plan's edit-mode states** — the audit's #3 target | f15–f19 | Edit mode end to end: the jade tick, both `.edge` inputs, the derived-length gutter, `✕` on every live row, the grips, the amber edit hint, two live warning strips with their one-tap fixes, the free-time lane markers (`1H`, `5H`), two `+ Sub route here` stubs, `+ Add a stop`, and **the archive card with `REMOVED FROM THIS DAY`, `was 09:15 · tap to open`, `Add back` and the `MOVE TO` day chips.** |
| **The `.hint-jade` screens** | f20–f22 | `Changes on this phone` and `Map kept on this phone` — the undefined class rendering as unstyled 16px body text, and the amber `7 stops are outside every kept area` card working correctly. |
| **The four un-reviewed screens** | f23–f25 | Spend below the fold (hero, progress bar, accuracy sentence, `EVERY PURCHASE`), Trip prep below the fold (sticky progress, two categories, per-row reasons, the `Suitcase` chip), Shopping list below the fold. |
| **Long text and CJK — the first real evidence** | f26–f28 | A 43-character Japanese stop name and a 44-character Japanese note on the Plan, and the same on Destination's title. **Both wrap cleanly**: the `MAIN 1` badge holds its column, the row grows, nothing clips, nothing overlaps, and Destination's three-line title pushes content down rather than colliding with it. |

**Also verified by measurement rather than by eye,** because a frame cannot settle it: the sticky areas (the Plan's day header and Prep's progress header hold while the scroller moves) · the `.scroll` container's real overflow on five screens · the archive card's computed contrast · the Trip-settings MONEY row's 19px misalignment · the mangled swipe-row attributes in the live DOM · Destination's panel selection surviving a screen change and a change of subject.

**Two suspected defects were measured and dismissed rather than reported.** The hero's `Photo placeholder` chip and the sub-route lane's time column both wrap in the capture renderer and **not** in a real browser — measured `scrollWidth === clientWidth` and single-line heights in both cases. Recorded because a capture artifact reported as a defect costs an implementer a day, and because the point of this exercise is confidence rather than a longer list.

**Nothing was marked verified that was not seen.** One state I could not reach honestly — a real drag and a mid-gesture swipe — stayed VISUAL NOT VERIFIED even though I had the screen open, because a pointer gesture is not a tap.

---

# 5. Remaining verification debt

**32 of 71 rows have still never been seen at 390 × 844.** What matters is *why*, because the reason decides whether it is worth buying now.

| Blocked on | Rows | Worth doing before implementation? |
|---|---|---|
| **A real backend** — the rust stuck state, the sharing round trip, the `published/{code}` rules, real propagation, `opens`, the removal detector's trigger, the emailed-link return leg | ~11 | **The emulator run is worth it** (`firebase.emulators.json` exists; it needs a shell process, not a second account). The rest is not: it is the same class of debt implementation itself will retire. |
| **A pointer gesture** — a real grip drag, a mid-gesture swipe, the swipe latch, the in-row confirm | ~4 | **No.** These are the states most likely to change during implementation anyway, and two of the four are broken today for reasons already found by reading (M-5). |
| **Emptied or altered demo data** — Nearby's three empty variants, the Log empty, Plan's empty joined day, Spend's day bars and category stack, `Paste`'s failure path | ~8 | **Marginal.** Each needs the demo trip mutated, which is destructive to the fixture. Cheapest done as part of implementing the empty-state tiers. |
| **One tap, no backend** — the three Destination editors, the four silent-refusal call sites, the trip cover picker, the trip-file path, the add-a-stop form | ~6 | **Yes — this is now the cheapest remaining unit of work**, and it is where the silent-refusal rule will be built anyway. |
| **Not built at all** — install / first run | 1 | Blocked on OD-8. |

**The residual risk in this debt is lower than it was, and I can say why.** The last batch's warning was that *"the same class of error is still latent in the 35"* — nine written claims about the app had been wrong because nobody had looked. This session looked at the three highest-value groups and found **exactly that class of error again, twice**: an approved document asserting the archive card is dark when it renders white, and another asserting Destination's panel selection resets when it does not. Both were caught. The groups that remain are mostly blocked on infrastructure rather than on attention, which is a materially different kind of debt.

---

# 6. OPEN DECISIONS

**Four, and only four. No new product decisions were invented.** Each one is a genuine product call that changes what gets built; none of the recommendations below has been treated as approved, and none has been folded into a design document.

| ID | Question | Recommendation | Affected UX | My approval needed |
|---|---|---|---|---|
| **OD-6** | May `Empty this trip` delete the Shopping List, Packing List and Log? | **Yes — keep the capability and use the corrected confirmation.** A per-kind picker is a better product and a new screen; naming the consequence honestly is the smallest change that stops the surprise. | `Empty this trip` (Trip settings, last card) · the corrected confirm string · `clearTripContent()`'s scope · the joined-copy review base | **YES** |
| **OD-9** | After creating a trip, should the app continue forcing the user into Paste? | **Keep the behaviour and add nothing.** It is the app's own opinion about what a new trip needs, the back gesture works, and every currency string in P0-2 §5 works either way. If you disagree, the alternative is one ghost on the modal — not a new screen. | New-trip modal → Paste hand-off · the first thing every new user experiences | **YES** |
| **OD-7** | Should the blank map explain *why* it is blank? | **No.** `tiles.js` reports per-tile failures rather than causes, the user's action is identical either way, and a sentence that guesses wrong about someone's connection is worse than one that does not guess. | Map home's blank state · the new amber `NO MAP PICTURE` card (which works either way) | Only if you disagree |
| **OD-8** | Is install / first-run UX in scope, and on which platforms? | **Android only — one unobtrusive line on the trips home after a second launch. Not a prompt, not a banner, never on a first visit.** iOS cannot be prompted at all. | The one genuinely undesigned user-facing flow left · `manifest.webmanifest`, which is referenced twice and absent | **YES**, but it is a scope question rather than a design one |

**What each one costs to get wrong, stated plainly:**

- **OD-6** — four approved strings promise the three private kinds are never in a snapshot and no update can reach them. All four are true. And one ghost button deletes them with no undo. Source confirms it: `clearTripContent()` removes `places`, `subRoutes`, `shopping`, `mustSee`, `prep`, `log`, `outfits`. If the answer is "no", the capability comes out and the confirm's corrected sentence is unnecessary.
- **OD-9** — this has never been decided and it is the first thing a new user experiences. `trips.js` 155 is a bare `go('paste')` after `createTrip`. Keeping it costs nothing; changing it is one ghost button.
- **OD-7** — low stakes, and recorded only so the answer exists. Without it, a future implementer adds the guess.
- **OD-8** — three install icons are committed and the manifest is absent, so install is half-built. Worse than half: `sw.js` precaches `./manifest.webmanifest`, and a `cache.addAll()` rejection fails the whole service-worker install. The app's whole proposition — *it works with no signal* — is only fully true once installed.

**Previously open, now closed by your approval and not reopened here:** R-1 · C-1 · S-1 · S-2 · S-3 · S-4 · OD-1 · OD-2 · OD-3 · OD-4 · OD-5. **Eleven closed, four open.**

---

# 7. Implementation findings

**Recorded, not fixed.** Full classification (A existing and correct · B missing but specified · C needs modification · D design ambiguous · E dead/legacy) in `implementation-readiness-map.md` §6; the ordered work in its §3 and §4.

**The three that would cost the most to discover mid-build — all new this session, all found by looking:**

| # | Finding | Why it matters |
|---|---|---|
| **M-4** | **The Plan's archive card renders white, not dark.** `.swipe-face { background: #fff }` (`app.css` 1037) overrides `.archive-card { background: var(--dark-card) }` (`app.css` 649) — equal specificity, later declaration wins — while every child colour stays light: the stop name `#E4EBE8`, `Add back` white on `rgba(255,255,255,.14)`, the `MOVE TO` chips `#E4EBE8`. **Measured contrast ≈ 1.1:1.** | **Half of the approved destructive model is invisible.** And `p1-plan-editing-design.md` §6 asserts the card *is* a full dark card, twice, calling it verified — so an implementer reading the document would never look. Frame `f19`. |
| **M-5** | **Attribute markup is escaped into nonsense in Plan edit mode.** `plan.js` 373 and 577 interpolate a *string of markup* into an `html` template, and `esc()` escapes the attribute quotes. Live DOM: `data-loop-row="\"day-3\""`, `data-loop-name="\"Market"`, plus a junk attribute `afternoon&quot;`. | **Swipe-delete on an archived stop and on a sub-route lane cannot work** — `deletePlanItem('"lumen"')` matches no id — and the in-row confirm shows a truncated, quoted name. It is also invalid HTML and a markup-injection vector on any name containing `"`. This is stage 2 of the ladder M-4 makes invisible: two independent defects on one approved surface. |
| **M-1** | **Review is a two-way diff with no retained base.** `pendingUpdate()` → `diffSnapshot(mySharedState(), snapshot)`; there is no `reviewedSnapshot` or `lastReview` anywhere in `store.js`. A stop **you** added is badged `THEY REMOVED`, and `Take theirs` deletes it with no undo. | **Already documented** in `p0-4-…` §1.1 — I am re-listing it only because it is the largest single piece of new implementation in the whole baseline and everything else in Review depends on it. Not a new discovery; a confirmed one. |

**The rest, in one line each:**

- **M-2 / M-3** — Review's row is side-by-side (`.sides { display: flex }`) where the approved default is stacked; bulk actions sit inline at the end of the scroller, roughly two screens below the fold, and `Take all of theirs` takes rows you changed.
- **M-6 / M-7** — four primary buttons silently ignore a tap: `Add a stop` (`plan.js` 178) and the three Destination editors. Add-a-stop also puts its pending above the form and closes the form before the await resolves.
- **M-8** — **Destination's panel selection never resets.** Measured: open a stop → Shop → Plan → Trip settings → open a *different* stop → still Shop. `p1-destination-tabs-design.md` §2 states it resets and calls that verified.
- **M-9** — the `|| '¥'` currency fallback is live on Destination's Shop panel (`dest.js` 376, 471) and as `itemEditor`'s default parameter (`parts.js` 493).
- **M-10** — four of Destination's five empty states are the bare `.empty` one-liner; none is gated on `trip.sharedFrom`.
- **M-11** — `Empty this trip`'s confirm still reads `This cannot be undone. Everything listed above will be deleted.` (frame `f14`), not the corrected sentence naming the three private kinds.
- **M-12** — Trip settings' MONEY row misaligns at 390: `Your currency`'s label wraps to two lines and its input sits **19px lower** than the other two (measured y = 507 · 507 · 526). Frame `f10`.
- **M-13 / M-14 / M-15 / M-16** — `keepMySide()` does not clear the base or receipt · `signInNotice` carries pending, user errors and deployment errors in one string · `.sync-dot.grey` is solid where the approved `local` dot is hollow (one CSS property) · `areas.js`'s STORAGE row has no horizontal slack.
- **N-1** — **`.hint-jade` is undefined.** Referenced by `areas.js` 64 and `stuck.js` 69; renders as unstyled 16px body text, larger than the 12–13px copy around it (frame `f20`). One rule, from a recipe that already exists. **First in the CSS queue, not last.**
- **N-6 / N-7** — `removedFromTrip()` has no caller anywhere in `web/js/**`; `restoreAccount()`'s `notice` is stored on `state.session` and read by nothing (`state.signInNotice` is a different channel, and the stored value is a raw token that needs mapping to copy).
- **N-15** — `manifest.webmanifest` is referenced by `index.html` 16 and precached by `sw.js` 14, and absent. The SW install fails on it.
- **Do not delete as dead code:** `.review-foot` · `.arrived` · `.archive-moved` · `removedFromTrip()` · `state.session.notice` · `clearUndo()` · `movedToDay`. Six of the seven are consumed by approved designs that are not built yet.
- **One design ambiguity (D):** an end time before the start yields `19h 15m` rather than a rejection. See §1.

---

# 8. Documentation inconsistencies

**Six reconciled. In every case the canonical document was identified and the *record* was corrected — no approved product decision was changed, and no approved document's design content was overwritten.**

| ID | Problem | Canonical | Reconciliation |
|---|---|---|---|
| **X-10** | **Stale count, propagated.** `ui-ux-design-coverage.md` §3 and `overnight-final-design-review-pack.md` §6 state "**eight** `\|\| '¥'` fallbacks (RC-19)", correcting P0-2 §12.5's seven. `p1-destination-tabs-design.md` §4 says "seven", then "the eighth", then "the other six" — three numbers in one section. | The source. | **There are seven `\|\| '¥'` fallbacks** (`dest.js` ×2, `shop.js`, `spend.js`, `trips.js` ×2, `store.js` 1801) **plus one `symbol = '¥'` default parameter** (`parts.js` 493) = **eight currency-symbol *sites***. P0-2 was right about fallbacks; RC-19 was right about sites; the wording conflated them. Matrix §3 reworded; §5 warns against the phrase. |
| **X-11** | **Stale source claim in an approved document.** `p1-plan-editing-design.md` §6 states the archive card "is a full dark card" and §9 that `.archive-name` is "13.5px/650 **on the dark card**" — asserted as verified. | The design's *intent* (dark) is canonical; the *claim about the source* is wrong. | The card renders **white**; see M-4. The design decision stands untouched and becomes a build item. Recorded in the matrix §5's supersession list so nobody implements from the false claim. |
| **X-12** | **Stale source claim in an approved document.** `p1-destination-tabs-design.md` §2: "Tab state is module-level … and **resets on a screen change. Verified.**" | The design's intent ("opening a different stop should start at Info") is canonical. | It does **not** reset — measured across a screen change *and* a change of subject. The intent stands and becomes M-8. |
| **X-13** | **Artboard / matrix disagreement about what a frame proves.** The matrix scored `Changes on this phone` CAPTURED on frame v15's "jade receipt". | The strict rule already in the matrix §1: CAPTURED only when a frame shows the state the row describes. | v15 shows the **undefined** `.hint-jade`, not the designed jade card. Row downgraded to VISUAL NOT VERIFIED — the one figure in this document that moved the wrong way, on purpose. |
| **X-14** | **A structural misreading risk, not a contradiction.** Nothing in the matrix said that CONFIRMED and CAPTURED together do not imply "built correctly" — and three rows now prove they do not. | The matrix. | A statement added at the head of §0 and to the map's preamble. This is the single most useful correction in this session's paperwork. |
| **X-15** | **Terminology, deliberate and previously unexplained.** `share.js` `PRIVATE_KINDS` has **four** members (`shopping`, `prep`, `log`, `outfits`); the approved confirm names **three** ("your shopping list, your packing list and your Log"). | `p1-absence-and-removal-design.md` §5, which already states four correctly. | The copy folds `outfits` into "your packing list", which is what a user calls it. **Correct and intentional** — recorded so an implementer does not "fix" the sentence to four kinds. |

**On the recurring FRAME vs CAPTION vs ANNOTATION vs CANONICAL MARKDOWN failure.** No new instance was found this session, and the reason is worth stating: the three artboards written in the last batch declare themselves illustrative, and `p1-destination-tabs-design.md` declares **"Artboard: none"** outright. **The process rule holds and is restated: the markdown is canonical and an artboard illustrates it. Any string on an artboard that is not in a design document's copy section is drift, and is a bug in the artboard rather than a decision.** The 28 frames added this session are **verification evidence of the current build, not design artefacts** — several of them show defects, and none of them is canonical for anything.

---

# 9. Implementation readiness map

**→ `docs/design/implementation-readiness-map.md`**

It contains, in this order: the five cross-cutting rules that decide most questions · what is approved and must be built exactly · **what already exists and must be preserved** (thirteen items, several of which have been mistaken for gaps before) · **sixteen modifications** where the code contradicts the approved design · **fifteen pieces of new implementation**, each pointing at the document that already specifies it · **what must not be changed**, including twelve explicitly rejected additions · the technical findings, classified A–E · and the dependency order.

---

# 10. Recommended implementation order

High level only. The full graph, with the reasons the dependencies exist, is in the map's §7.

1. **Three CSS one-liners first** — `.hint-jade`, the hollow `local` dot, and Review's two new classes. Two screens are visibly wrong until the first one lands.
2. **P0-5 pending, and the four silent refusals with it.** Zero CSS, most screens. Doing it after the screens change means touching them twice.
3. **P0-2 currency** — eight sites, independent of everything else.
4. **`trip.reviewedSnapshot`, then the rest of Review.** Nothing else in Review is worth starting first: the row's content, its badges and its bulk eligibility are all functions of the base.
5. **Plan editing** — the archive card's colour before the move receipt; the attribute fix before either swipe-delete can work at all.
6. **Destination, status visibility, absence** — independent of each other.
7. **Backend-gated items** — the removal detector, the refused read, seeing the return leg.
8. **OD-8, if approved** — the manifest and the install line.

---

# 11. What NOT to redesign during implementation

**This is here to protect the approved baseline from implementation-agent improvisation.** The full list, with the reason each item was chosen over its plausible alternative, is the map's §5.

**Do not reopen the eleven closed decisions.** R-1 · C-1 · S-1 · S-2 · S-3 · S-4 · OD-1 · OD-2 · OD-3 · OD-4 · OD-5.

**Do not add, however sensible it looks:** a confirm on the Plan's `✕` (it archives — the archive *is* the confirm) · a per-kind picker on `Empty this trip` · a second arrival banner for the account · a stacked or plural undo bar · a fifth sync colour, a label under the dot, or a numeral in it · a spinner, an overlay or a skeleton anywhere · a guess about why the map is blank · a sentence that makes a person the subject of a negative verb · a stock photo, an avatar, a placeholder person or an approximate position · pagination or a virtual list in Review · a pre-disabled primary on any form that can refuse · an "I'll do this later" ghost on the New-trip modal.

**Do not "fix" these — they are correct:** `remind.js`'s rank order in **code** (the red loop reminder outranks stuck; two prose statements were wrong, not the code — correct the comment, never the order) · `✕` archiving instead of deleting · a live stop not being swipeable · free-time lanes derived from gaps, so a vacated slot needs no state · `stopIndex()` skipping archived rows · `MINE_ALONE` stripping your own ticks before a diff · the five sync `aria-label`s · the undo bar replacing rather than stacking · Destination repainting through the store · a place and the stop that visits it showing the same five panels · the confirm copy naming three private kinds where the source has four.

**Do not delete as dead code:** `.review-foot` · `.arrived` · `.archive-moved` · `removedFromTrip()` · `state.session.notice` · `clearUndo()` · `movedToDay`.

**And one process rule.** If something in the approved design looks wrong while building it, that is a question for you — not a fix. Two of this session's findings are cases where an approved *document* was wrong about the *source*; **zero** are cases where an approved *decision* was wrong.

---

# 12. Tomorrow morning

1. **Read this document.** Nothing else is required.
2. **Answer the four product decisions in §6.** OD-6 and OD-9 need you and change code. OD-8 is a scope call. OD-7 only if you disagree with "no". *(If you also want to settle the inverted-time-window ambiguity in §1 while you are here, it is one line — but it can equally wait for the Plan-editing step.)*
3. **Approve or reject the verdict: B — READY AFTER OPEN DECISIONS.**
4. **Start implementation only when the verdict permits it** — and hand the implementation agent `implementation-readiness-map.md`, not the thirteen design documents.

**You do not need to open a single artboard, and you do not need to look at any of the 28 frames.** They are evidence behind §4 and §7; three of them show defects that are already written down in words.

**The one sentence worth carrying out of this session:** the design is finished and internally consistent, and the thing that was never checked — whether the code agrees with it — turns out to disagree in sixteen specific, written-down places. That is a good position to start implementing from, and it was not true yesterday.

---

# 13. DECISIONS RECORDED — 5 Sep 2026

**Appended only. Nothing above this line was changed.** The product owner answered the four open decisions in §6, and the design ambiguity in §1. **§6 now carries no open decisions.**

| ID | Decision | Matches §6's recommendation? |
|---|---|---|
| **OD-6** | **YES.** `Empty this trip` may delete the Shopping List, the Packing List and the Log alongside everything else it already clears. Use the corrected confirmation that names the consequences. | Yes |
| **OD-9** | **Add the choice.** The app no longer forces the user into Paste with only the back gesture as a way out. | **No — the alternative was taken** |
| **OD-7** | **NO explanatory message.** A blank map does not guess why it is blank. | Yes |
| **OD-8** | **YES, at the approved scope.** Android only; one unobtrusive install line on the trips home after a second launch. No first-visit prompt, no banner. iOS is not prompted. | Yes |
| **D-1** | **No flag.** The existing intentional overnight-window behaviour stands. Do not introduce a warning and do not reinterpret the derived duration unless a later canonical design explicitly requires it. | n/a — new |

## 13.1 OD-9 — what was approved, precisely

§6 recommended keeping the behaviour. The owner chose the alternative, which §6 itself named and bounded:

> *"If you disagree, the alternative is one ghost on the modal — not a new screen."*

So this is the conditional in `implementation-readiness-map.md` §5 resolving the other way, **not** an override of a rejection. That row — *"An 'I'll do this later' ghost on the New-trip modal · Pending OD-9. If the answer is 'keep it', nothing is added"* — is now **approved to add**, in exactly the shape it names:

- **One ghost button on the New-trip modal.** Not a new screen, not a second step, not a skip link inside Paste.
- **Label: `I'll do this later`** — the phrase every document uses for this control, adopted verbatim so no new copy is invented. No design document carries it in a copy section, so it is recorded here and this section is canonical for it.
- **It lands on the trip that was just created**, per PR-2 (a return lands on the thing the action was about). The trip already exists at that point; `trips.js`'s `go('paste')` after `createTrip` is the only line involved.
- Everything else on the modal is unchanged, and Paste remains the default path.

**The owner's phrase "or another choice" is deliberately not treated as latitude.** Anything other than the ghost above — a third button, a new screen, a changed default — would be new design and is out of scope. If the wording of the label is to change, that is one line and a question for the owner, not an implementer's call.

## 13.2 OD-8 — the scope is smaller than §6 states

§6's rationale reads: *"three install icons are committed and the manifest is absent, so install is half-built. Worse than half: `sw.js` precaches `./manifest.webmanifest`, and a `cache.addAll()` rejection fails the whole service-worker install."*

**Both halves of that are wrong**, verified against the working tree (see `transition-audit.md` §2):

- `web/manifest.webmanifest` has been in the repository since `283bc79`, is valid, names four icons, and **returns 200 in production**.
- `sw.js` does not use `addAll`. Line 65 is `Promise.all(ASSETS.map((url) => cache.add(url).catch(() => {})))`, under the comment *"addAll fails the whole install if one file 404s, so add individually."* The install cannot fail on a single asset. `existing-ui-audit.md` §282 already said so; §6 contradicted it.

**Therefore OD-8's approved work is the install line alone.** The manifest, the icons and the service worker are complete and correct. Android installability already works today. Nothing is to be added to `web/manifest.webmanifest`, `web/icons/` or `web/sw.js` under this decision.

## 13.3 D-1 — the behaviour that stands

`itemWindow()` (`store.js`, locate by symbol) computes `end >= start ? end - start : (end + 1440) - start` under the comment *"A window that crosses midnight is a night market, not an error."* `reversed` is `end === start`, so `ENDS WHEN IT STARTS` fires only on identical times and its label is exact.

**This is now an approved decision rather than an unexamined one.** A derived length such as `19h 15m` from a `13:45 → 09:00` window is correct output, not a defect. Do not add a plausibility check, a rust line, a fifth `dayIssues()` kind, or an automatic correction. The comment at `itemWindow()` should be left as it is — it is the record of the decision.

## 13.4 What this changes elsewhere

- **§6 of this document** carries no open decisions. Read it with this section.
- **`implementation-readiness-map.md` §5** — the "I'll do this later" row flips from rejected-pending to approved. Every other rejection in that list stands, and OD-6/OD-7's conditional notes resolve as recorded above.
- **`p1-absence-and-removal-design.md` §5** — OD-6 answered YES, so the corrected `Empty this trip` confirmation is to be implemented as written, and on a joined copy it also clears the review base.
- **`p1-status-visibility-design.md` §4** — OD-7 answered NO, so the blank-map card ships with its approved copy and no cause sentence.
