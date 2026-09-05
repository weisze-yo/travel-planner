# Overnight Final Design Review Pack — 5/6 Sep 2026

**Read this first. Everything else is detail behind it.**
The final broad design batch ran against the working tree in this project (`web/**`, `firebase/**`). **Design only: no application code was changed, no behaviour was modified, nothing was refactored.** Five new canonical design documents, two audit documents, three new artboards, and `ui-ux-design-coverage.md` rewritten in full so its numbers derive from its rows.

---

## 1. Executive summary

**Design completeness: 56 of 71 inventoried screens and flows are CONFIRMED — 79%. A further 14 (20%) are understood with nothing undecided in them. One row (1%) cannot be designed until you answer a question.**

Every figure is a count of rows in `ui-ux-design-coverage.md` §2, and the arithmetic is printed there: 56 + 14 + 1 = 71.

Two things happened this batch, and the second matters more than the first.

**The remaining P1 gaps were designed.** Five documents cover removal and absence, the Plan's editing interactions, the account and sign-in flow, status visibility, and Destination's five panels — plus a triage of all 40 P2 items, of which three needed a small spec and one needs you.

**And reading the source found that nine claims in the coverage matrix were wrong.** Four surfaces the documents called *undesigned* were already built; four *open questions* were already answered by the code; and one screen was telling a user the opposite of what the product model promises. **The most valuable output of this batch was not the new design — it was discovering that the map was wrong.** A matrix that misdescribes the app sends effort at problems that do not exist and hides the ones that do; all nine corrections are recorded as reconciliations rather than silently applied.

**The confirmation number moved from 0 to 56.** Every previous version of the matrix recorded *"UX confirmed: 0 · Visual confirmed: 0"* — nothing in this product had ever been signed off. Your approval of the P0 baseline and the P1 batch is what changed that, and it is the single biggest change in the project's history.

**The honest caveat has flipped.** It used to be *understanding is nearly complete and confirmation is zero*. It is now: **the design baseline is nearly complete and nearly confirmed; what is thin is that 35 of 71 rows have never been seen at 390 × 844.** That is a verification problem, not a design problem, and §9 says what to do about it.

---

## 2. Completed design areas

**P0 — all five, confirmed, nothing awaiting more drawing.**

| Area | Covers |
|---|---|
**P0-1 · Role & copy identity** | the three roles and the two the offer phase shows · the `read` send block with no button · chip+caret for owners, badge for everyone else · the `from Ana` marker on five surfaces · the arrival banner · the corrected Log line
**P0-2 · Currency identity** | the guess shown before Create · six states of the derived line · Create never gated · no currency → no symbol → summaries say so · provenance on Trip settings · re-derivation as an offer, never an overwrite · four rewritten failure notices
**P0-3 · System consolidation** | the three-tier empty-state system and its shared-kinds limit · the fact-first multilingual warning strip · the four systems' statuses and ten corrections to earlier documents
**P0-4 · Review** | three-way with a retained base · eleven cases, three of which stop appearing · the stacked row · the title from the base · `YOURS`/`THEIRS` · immediate writes plus the app-wide undo · the sticky foot and the bulk-safety rule · five completion states and a receipt that survives navigation
**P0-5 · Pending work** | pending belongs to the control, outcomes to the screen · eleven rules · **eighteen** labels · no spinner, no overlay, no skeleton · synchronous work gets nothing · zero CSS

**P1 — twelve areas, confirmed.**

| Area | Document |
|---|---|
Share → Join → Review as one flow, and its five seam failures | `p1-share-join-review-flow-design.md` |
Paste, input to done | `p1-paste-review-design.md` |
Review's bulk actions, staged | `p1-review-bulk-actions-refinement.md` |
Tile download · stuck changes · sub route · cross-tab sync · the strip's sources | `p1-coverage-gaps-design.md` |
**Removal and absence** — five surfaces where something stops existing | `p1-absence-and-removal-design.md` |
**Editing the day** — the Plan's eight interactions and its two-stage destructive ladder | `p1-plan-editing-design.md` |
**The account** — the row, the sheet, the email return leg, sign-out | `p1-account-and-sign-in-design.md` |
**Status visibility** — the sync dot, the strip's order, the undo bar, the blank map | `p1-status-visibility-design.md` |
**Destination's five panels**, the three editors, and the silent-refusal rule | `p1-destination-tabs-design.md` |
Every P2 item classified; three specified | `p2-triage.md` |
Nine axes audited for contradictions; eleven ambiguities resolved | `cross-flow-consistency-audit.md` |
The coverage matrix, rewritten so its numbers derive from its rows | `ui-ux-design-coverage.md` |

**Cross-cutting systems, all confirmed:** pending · destructive actions (with the confirm-button test) · undo · empty states · warning strips · joined identity · currency · **a form that refuses** · navigation return · long content and CJK.

---

## 3. Remaining design gaps

### Must be settled before implementation — 4, and only one is a design question

| # | Item | What it needs |
|---|---|---|
| 1 | **OD-6** — may `Empty this trip` delete the shopping list, packing list and Log? | **Your answer.** The confirm now names the consequence; whether the capability should exist is a product call. |
| 2 | **The forced jump to Paste** after creating a trip | **Your answer (OD-9).** Existing behaviour, never decided, and it is the first thing a new user experiences. |
| 3 | **`.hint-jade` is referenced by two screens and undefined in `app.css`** | One CSS rule, from a recipe that already exists (P0-1 §8). **First in the CSS queue, not last** — two approved specs assume it. |
| 4 | **`removedFromTrip()` has no caller anywhere in `web/js/**`** | A detector, whose rule is specified in absence §2.4. Until it exists, the corrected removal screen is unreachable. |

### Safe to defer

| Item | Why |
|---|---|
| **Spend report · Trip prep · Log populated · the Note editor** | **The largest un-reviewed surface left** — four screens, understood, captured above the fold, never design-reviewed. Nothing in them is *undecided*: the currency rule and the empty-state tiers already apply. This is a **review** pass, not a design pass. |
| **OD-7** — should a blank map say why it is blank? | Recommendation is no; the designed card works either way. |
| **OD-8** — install / first run on a phone | A whole flow, and it needs scope from you before it needs a designer. Nothing depends on it. |
| **Trip settings below the fold** | Unrendered, not undecided. |
| **Trip file import's receipt** | Revisit when Paste's `done` screen exists, or there will be two receipts. |
| **`manifest.webmanifest`** | A chore with no design content. |
| **`p2-triage.md` §D and §E** — 17 items | Each is either intentional (the half-pixel type scale, the two amber recipes, the four label families) or invisible to users. |

---

## 4. New decisions made autonomously

**The four corrections that changed what we thought the app was:**

| id | Decision |
|---|---|
| **A-1** | **`.gone-card`'s two false sentences are corrected.** The screen told a removed person their itinerary was gone; the store deletes nothing, the kept list on the same screen said it survived, and Share tells the *owner* the truth. Two sentences, no layout change. **RC-6 / X-1.** |
| **A-2** | **The Plan's destructive ladder is recorded as two-stage** — `✕` archives (reversible, row stays on screen with `Add back`), swipe on the *archived* row deletes with a 6s undo. A live stop cannot be swiped at all. **RC-9 / RC-10**, and it is the reason the Plan needs no delete confirmation. |
| **A-3** | **The warning strip's rank order is corrected in the record, not in the code.** Three orderings existed — an approved document, `remind.js`'s own comment, and its code. The code is right: the red loop reminder outranks stuck. **RC-16 / X-3.** |
| **A-4** | **Destination's "four unseen tab bodies" are one screen with five built panels.** They needed three approved systems applied, not a design. **RC-18.** |

**The design decisions:**

| id | Decision |
|---|---|
| **A-5** | **Emptying a joined copy clears the review base**, entering P0-4's already-approved no-base mode — otherwise every stop becomes case 7 and the itinerary is permanently unrecoverable. Two correct designs meeting badly. **X-2.** |
| **A-6** | **The stop that has gone gets a header, a subject and one way back.** A tier-2 empty with one ghost action, not an ink primary — it is a recovery, not an intention. |
| **A-7** | **A place with no position** gets a `.warn` strip on Destination, the Plan's chip on its Nearby card, and one coverage line on the sub route. Not silent before; now complete. **RC-7.** |
| **A-8** | **`Empty this trip` stays a confirm-button exception, scoped** — and the confirm names the three private kinds, because they are the surprise. See **OD-6**. |
| **A-9** | **A refused read mid-session** replaces one sentence in Share's non-owner explainer. Jade, not rust: nothing failed and nothing is lost. |
| **A-10** | **A rejected time says `not a time`** in the derived-length slot — replacing a value rather than adding a line, so no row changes height. |
| **A-11** | **The `local` sync dot becomes hollow.** `saved` and `local` mean opposite things and were distinguished by hue alone at 8px. One CSS property; shape now carries the difference. **RC-14/15.** |
| **A-12** | **The blank map with no kept areas** gets one amber card. The gap was exactly one condition: `outside()` returns null on its first line when no areas are kept — the state a first-time user offline is most likely to be in. **RC-17.** |
| **A-13** | **The email/redirect return leg is announced on the account row.** `restoreAccount()` computes a notice, stores it on `state.session`, and **nothing reads it** — the one flow whose point is that it finishes on a later launch had no arrival. |
| **A-14** | **The silent-refusal rule, canonical app-wide:** a form that refuses says which field, in that field, in rust, and never pre-disables the button. Four call sites were silently ignoring a tap on a primary. |
| **A-15** | **Three tier-3 empties on Destination — and two that must stay tier 2.** The shopping list and the Log never travel, so "someone else left this empty" is not a reachable state. On the two tabs that are yours alone, a joined trip is indistinguishable from your own. |
| **A-16** | **Two principles stated for the first time:** **PR-1** the app never invents a person, a place or a picture; **PR-2** a return lands on the thing the action was about, never on whatever was selected before. Both were already true in five and six places respectively. |
| **A-17** | **The confirm-button test**, derived from its two exceptions rather than asserted: permitted only where the thing destroyed cannot be reconstructed **and** there is no row to swipe. Exactly two actions pass. |
| **A-18** | **The undo-label rule:** the label names the thing, never the act alone — because the bar survives a screen change. |
| **A-19** | **The `queued` strip keeps no action button**, as a knowing exception with the rule it satisfies instead: a condition with no fix states that it needs none, in the same breath. |
| **A-20** | **Cross-tab sync, the trip cover picker, Draw-an-area's two defects, and the role chip (D-7)** — small specs and closures in `p2-triage.md`; D-7 was already answered by two approved documents. |

---

## 5. OPEN DECISIONS — four

| ID | Area | Question | Recommendation | Why it matters | Your approval needed? |
|---|---|---|---|---|---|
| **OD-6** | Trip settings | May `Empty this trip` delete the shopping list, packing list and Log? | **Yes, keep the capability — the corrected confirm is enough.** A per-kind picker is a better product and a new screen; naming the consequence honestly is the smallest change that stops the surprise. | Four approved strings promise those three kinds are never in a snapshot and no update can reach them. All true — and one ghost button deletes them with no undo. | **YES** |
| **OD-9** | New trip | After creating a trip, the app jumps straight to Paste with no "I'll do this later" that isn't the back gesture. Keep it? | **Keep it, and add nothing.** It is the app's own opinion about what a new trip needs, the back gesture works, and every currency string works either way. If you disagree, the alternative is one ghost on the modal — not a new screen. | It is the first thing every new user experiences, and it has never been decided. | **YES** |
| **OD-7** | Map | Should a blank map try to say *why* it is blank — no signal versus the tile server refusing? | **No.** The user's action is identical either way, `tiles.js` reports per-tile failures rather than causes, and a sentence that guesses wrong about someone's connection is worse than one that does not guess. | Only that a future implementer might add the guess. Low stakes; recorded so the answer exists. | Only if you disagree |
| **OD-8** | Install | Is installing the app to the home screen in scope, and on which platforms? | **Android only, one line on the trips home after a second launch — not a prompt, not a banner, never on a first visit.** iOS cannot be prompted at all. | Three install icons are committed and the manifest is absent, so install is half-built; and the app's whole proposition — *it works with no signal* — is only fully true once installed. This is the one genuinely undesigned user-facing flow left. | **YES**, but it is a scope question, not a design one |

**Previously open, now closed by your approval:** R-1 (three-way Review) · C-1 (bare numbers with no currency) · S-1 (the tier-3 sentences) · S-2 (Latin-first on `body`) · S-3 (bulk never touches a row you both changed) · S-4 (no action on a stopless shared day) · OD-1 (a live link's role becomes changeable) · OD-2 (Paste stops asking about rows it read cleanly) · OD-3 (`discardPending` stays a confirm exception) · OD-4 (both sharing doors designed) · OD-5 (`OVER BY`). **Eleven decisions closed; four open.**

---

## 6. Implementation ambiguities found

Eleven, from reading the documents as if they were all a developer had. **Nine are resolved; two are the OPEN DECISIONS above.** Full detail in `cross-flow-consistency-audit.md` §10.

| Would have had to guess | Answer |
|---|---|
| Whether `.hint-jade` exists | **It does not.** Write it from P0-1 §8. |
| What `keepMySide()` does to P0-4's `reviewedSnapshot` and `lastReview` | **Clears both** — a former shared copy must not keep a receipt for an update from someone it is no longer connected to. |
| Whether `NO POSITION` is a fifth `dayIssues()` kind | **No** — a presentational reuse of `.warn`. `dayIssues()` answers "what is wrong with this row relative to the day"; a missing coordinate is a property of the place. |
| Whether "they removed it" covers an *archived* stop | **Yes.** `share.js` `stopIndex()` skips `archived`, so archive and delete are one signal — and the base snapshot must be indexed through the same function. |
| Whether `Take theirs` on a removal should archive rather than delete | **Delete.** Archiving would file someone else's removal onto your own `REMOVED FROM THIS DAY` shelf. The Review row's two buttons **are** the in-row confirm; the undo bar follows. |
| Which document is current for the Share offer phase | **B-11** in share-flow §3. P0-1's copy is unchanged, which is why the two look compatible and are not. |
| How many `\|\| '¥'` fallbacks there are | **Eight**, not seven. |
| How many canonical pending labels there are | **Eighteen**, not sixteen — P0-5's audit missed the sign-in module entirely. |
| The warning strip's rank order | **Five slots, red reminder first.** Do not reorder the code to match either prose version. |

**Three near-misses**, each of which would read as a bug rather than a gap: `removedFromTrip()` has no caller · `state.session.notice` is computed and read by nothing · three defined-and-unused CSS classes (`.review-foot`, `.arrived`, `.archive-moved`) that approved documents now consume — a developer finding them unused might delete them.

---

## 7. Coverage matrix status

From `ui-ux-design-coverage.md` §0, every figure counted from its rows:

| | Count |
|---|---|
| Rows inventoried | **71** (69 + install/first run + a refused read mid-session) |
| **CONFIRMED** | **56** |
| **UNDERSTOOD — not yet explicitly confirmed** | **14** |
| **DESIGN DECISION REQUIRED** | **1** |
| Behaviour **OBSERVED** | **43** |
| Behaviour **SOURCE-ONLY** | **27** |
| Behaviour **NOT BUILT** | **1** |
| Appearance **CAPTURED** | **36** |
| **VISUAL NOT VERIFIED** | **35** |
| Rows carrying an open decision | **4** |

**Arithmetic:** 56 + 14 + 1 = 71 · 43 + 27 + 1 = 71 · 36 + 35 = 71.

**The appearance figures are not comparable with the previous pass** (41 of 69). The row set changed, and this pass scores `CAPTURED` **only when a frame shows the state the row describes** — "captured at rest" no longer counts for a row about a mid-gesture state, and "above the fold" no longer counts for a row whose content is below it. The stricter rule is the point.

---

## 8. Files created or updated

**Created — canonical design documents**

| Path | Canonical for |
|---|---|
`docs/design/p1-absence-and-removal-design.md` | removal · the stop that has gone · no position · `Empty this trip` · a refused read |
`docs/design/p1-plan-editing-design.md` | the Plan's eight interactions and the two-stage destructive ladder |
`docs/design/p1-account-and-sign-in-design.md` | the account row, the sheet, the return leg, sign-out |
`docs/design/p1-status-visibility-design.md` | the sync dot, the strip's order, the undo bar, the blank map |
`docs/design/p1-destination-tabs-design.md` | Destination's five panels, the three editors, the silent-refusal rule |
`docs/design/p2-triage.md` | every P2 item's class; three small specs |
`docs/design/cross-flow-consistency-audit.md` | the eight contradictions, two principles, eleven ambiguities |
`docs/design/overnight-final-design-review-pack.md` | this file |

**Created — artboards** (visual verification, not canon)

| Path | Frames |
|---|---|
`P1 Absence and Removal.dc.html` | the removal card today vs corrected · the stop-gone screen, both states, full 390 × 844 · three no-position crops · `Empty this trip` at rest and confirming · the link-stopped sentence |
`P1 Plan Editing.dc.html` | edit mode in place, full 390 × 844 · the rejected time · the move receipt and the archive count line · the add form refusing and pending |
`P1 Status Visibility.dc.html` | **all five sync states at real size, side by side, for the first time** · the strip's five-slot order · the blank map · the undo bar |

**Rewritten**

| Path | What |
|---|---|
`docs/design/ui-ux-design-coverage.md` | **rewritten in full.** 71 rows, the new status vocabulary, every figure derived from the rows, the nine corrected claims in §0.2, remaining risk ranked in §4, and a "which document is current for what" table in §5 |

**Not touched:** every file under `web/**` and `firebase/**` · `existing-ui-audit.md` · `existing-ui-visual-reference.md` · `new-feature-design.md` · `multilingual-warning-strip-design.md` · `p0-decision-brief.md` · `verification-sprint-p0-6.md` (a record of a session; its errors are reconciled in the P1 documents, not edited into it) · the five P0 documents and the four earlier P1 documents (their corrections are recorded as reconciliations in the documents that supersede them, per your instruction not to overturn approved work silently).

---

## 9. Recommended next step

**B — a final implementation-readiness audit. Not implementation, and not another broad design batch.**

**Why not another design batch (A).** There is nothing broad left. 56 of 71 rows are confirmed, 14 more are understood with nothing undecided in them, and the single row that needs design (install / first run) needs a scope answer from you before a designer. The four "safe to defer" screens — Spend, Prep, Log populated, the Note editor — need a *review*, not a design: both systems that would govern them are already approved and applied.

**Why not implementation (C), on evidence.** Three specific findings, each of which would cost more to discover mid-build than to close now:

1. **35 of 71 rows have never been seen at 390 × 844** — and this batch found that *nine written claims about the app were wrong* precisely because nobody had looked. The same class of error is still latent in the 35. §4.3 of the matrix orders the verification by cost, and the first two items need no second account, no emulator and no gesture.
2. **Two approved specs depend on a CSS class that does not exist** (`.hint-jade`), and **one designed screen depends on a function nothing calls** (`removedFromTrip`). Both are small. Both would be found at the worst moment.
3. **Two OPEN DECISIONS change code**, not copy: OD-6 changes what `clearTripContent()` does, and OD-9 changes the New-trip modal's exit.

**What the readiness audit should do**, in order, and it is a short job:

1. **Take the two answers** (OD-6, OD-9) and fold them into their documents.
2. **Do the cheap verification pass** — matrix §4.3 items 1–3: Destination's five panels, Trip settings below the fold, the Plan's edit-mode states. One session, no backend. It closes roughly a dozen `VISUAL NOT VERIFIED` rows and is the only remaining place a wrong written claim could still be hiding.
3. **Walk the eleven ambiguities and the four "must settle" items** against the repository, and produce a build order — P0-5 first (zero CSS, most screens), then the `.hint-jade` rule, then P0-2, then P0-4, with the P1 seam fixes folded in where they touch the same file.
4. **Then implementation can begin**, area by area, against a matrix that has been checked rather than written.

---

## 10. Tomorrow morning

1. **Read this file.** Nothing else is required.
2. **Answer four questions** in §5 — OD-6 and OD-9 need you; OD-8 is a scope call; OD-7 only if you disagree with "no".
3. **Say yes to the readiness audit** in §9, or redirect it.

**You do not need to open any artboard.** The three new boards are visual verification of decisions already made in the markdown; the only one worth a glance is `P1 Status Visibility.dc.html`, because the five sync states have never been seen side by side and one of them changes.

**One thing worth knowing before you decide anything:** the most useful work in this batch was reading the source, not drawing. Nine written claims about this app were wrong, four "undesigned" surfaces were already built, four "open questions" were already answered in code, and one screen was telling a user the opposite of what the product promises. **The design phase is close to done. The checking phase has barely started, and it is where the remaining risk is.**
