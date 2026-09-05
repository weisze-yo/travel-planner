# P0-3 — Consolidation & Formal Close of the Four Designed Systems

**Date:** 5 Sep 2026 · **Reconciled against** the working tree in this project (`web/**`), read this session
**Status:** consolidation. **Nothing implemented. No application code changed. Nothing redesigned from scratch.**
**Scope:** the four systems that were designed before this batch — (1) the empty-state system, (2) the multilingual warning strip, (3) Review, (4) role & copy identity — reconciled against the current source and the P0-6 verification findings, with every item given one of three statuses.

**This document is now canonical for the *status* of those four systems.** Where it contradicts an earlier document, this one wins, and §7 lists every such correction so the earlier documents can be read safely.

---

## 0. Status vocabulary — used exactly

| Status | Means |
|---|---|
| **APPROVED** | Either you have confirmed it in writing, **or** it was an open question that the current source answers definitively and the answer carries no product-policy content. Every source-closed item names the file and function that closes it. |
| **NEEDS DECISION** | Requires you. Reserved for genuine product, policy or taste calls — not for anything the source can settle. Each carries a recommendation. |
| **DEFERRED** | Real, understood, deliberately not being designed in this batch, with the reason. |

**Count: 31 APPROVED · 4 NEEDS DECISION · 6 DEFERRED.** The four NEEDS DECISION items are collected in §6 and are the only things in this document that require your attention.

---

## 1. System 1 — the three-tier empty-state system

**Source of the design:** `new-feature-design.md` §2 (grammar, ownership, action rules, copy rules, twelve places → three tiers).
**Reconciled against:** `screens/parts.js` `emptyDay()`, `screens/plan.js`, `screens/trips.js`, `screens/log.js`, `screens/shop.js`, `screens/dest.js`, `store.js` `dayTimeline()` (~1101), `store.js` `joinTrip()` (~3706), `share.js` `SHARED_KINDS` / `PRIVATE_KINDS`, `app.js` (~58).

### 1.1 The grammar itself

| Item | Status | Note |
|---|---|---|
| Three tiers, sorted by "can the person looking at this finish it right now?" | **APPROVED** | The system's load-bearing idea. Nothing in the source or the verification sprint contradicts it. |
| Tier 1 = bone page / centred block / dashed silhouette / one ink action | **APPROVED** | Uses `.lane-stub`'s existing 2px dashed `#DCE2DE` and the existing `.btn` ladder. |
| Tier 2 = the existing inline `.empty` block, no colour, no ink | **APPROVED** | `.empty` is 28px/16px, centred, 12.5px `--soft`. Unchanged. |
| Tier 3 = jade card (`--jade-bg` / `--jade-bd` / r16 / 14px pad), never ink | **APPROVED** | Consistent with P0-1's colour reasoning: a joined copy is *given*, so jade. |
| Yours-inside-theirs = the amber self-planned recipe (`#FFFDF7`, 1.5px dashed `#E3CFA3`) | **APPROVED** | Existing recipe, unchanged. |
| Copy rules §2.5 — name the missing thing, teach the model in sentence two, never make a person the subject of a negative verb | **APPROVED** | P0-1 §2.3 inherited the third rule verbatim, so it is already load-bearing in an approved design. |
| Action rules §2.4 — completable now; one ink primary at most; **the empty state never introduces a control**; no action when the cause is time; no action when the cause is another person; do not zero a summary; filters held at 45% | **APPROVED** | Rule 3 and rule 6 both do real work below. |

### 1.2 The three causes of emptiness — preserved, and now defined against the source

You asked that the distinction between the three causes be preserved. It is, and this is the definition an implementer can test:

| Cause | Test in the source | Tier | Surface |
|---|---|---|---|
| **User-caused emptiness** — the container is yours and you have not filled it | `!trip.sharedFrom` (this is your own trip) **and** the container is one you write to | **1** | bone page or in-screen block, dashed silhouette, one ink action |
| **Shared-state emptiness** — the copy you were handed has it empty | `trip.sharedFrom` is set **and** the empty kind is one of `SHARED_KINDS` (`days`, `places`, `subRoutes`, `mustSee`) | **3** | jade card, no ink, at most one amber action that is *yours* |
| **Just-joined / nothing has arrived yet** — a real third thing, not a variant of the second | `trip.sharedFrom` set **and** `tookVersion === sharedFrom.version` **and** `pendingUpdate() === null` | **3**, with the context line | the jade card **plus** the 22px `.who-mark` + "joined 2 days ago · no updates yet" line |

The third row is what the context line exists for, and §1.4 confirms it is derivable. Without it, tiers 2 and 3 collapse into "someone else's problem" and the app loses the ability to say *nothing has gone wrong, nothing has arrived*.

### 1.3 Reconciliation A — frame 1A's second action does not exist (contradiction, resolved)

`new-feature-design.md` §2.6 describes 1A as having "two real ways forward (start one / **arrive by link**)".

**The source says there is no such way forward.** A join is reachable only by a `/j/{CODE}` path (`app.js` ~58, parsed from `location.pathname`) or `?screen=join`. **There is no code-entry field, no "I have a link" screen, and no `openLink` caller anywhere in the UI.** A button on the empty trips home would therefore be a new control with no destination — which breaks empty-state rule §2.4.3 ("the empty state never introduces a control") and rule §2.4.1 ("only if it can be completed right now").

**Resolution — APPROVED (source-closed):** 1A has **one** ink action (`+ New trip`) and the second way forward is **copy, not a control** — the tier-1 "closing hint" slot, 11px `--soft`:

> `A trip somebody shares with you arrives by opening their link.`

This changes one drawn frame and no principle. If a code-entry screen is ever built, the line becomes a ghost button and nothing else moves.

### 1.4 Reconciliation B — the two data questions are answered (open questions closed)

**`new-feature-design.md` §7.7 — "is the join timestamp available client-side?" → YES. APPROVED (source-closed).**
`joinTrip()` writes `people: [owner, { id, name, role, joinedAt }]` and `sharedFrom: { code, version, from }`. The joining phone's own `joinedAt` is on its own person row — the same field Share manage already renders as "Joined 1 Sept". "**no updates yet**" is derivable too: `tookVersion === sharedFrom.version` with no `pendingUpdate()`. Both halves of the context line are computable with no new data and no network.

**`new-feature-design.md` §7.5 — "tier-3 breadth: is the day the only one?" → NO, and the set is closed. APPROVED (source-closed).**
Only four kinds travel (`SHARED_KINDS`); four never do (`PRIVATE_KINDS`: `shopping`, `prep`, `log`, `outfits`). So:

- **Can be tier 3:** an empty day · a place the sender saved but did not fill in (Info / Must-see tabs on a joined copy) · Nearby around a joined stop · an empty sub-route list on a joined day.
- **Can never be tier 3, ever:** the shopping list, the packing list, the Log, outfits. They are not in a snapshot at all, so they are *always* tier 1 or tier 2 even on a joined trip. "A shared shopping list somebody else keeps" is not a state this product can reach.

That answers the question as asked and gives the rule an implementer needs: **tier 3 is available only for the four shared kinds.**

### 1.5 Reconciliation C — frame 1F's amber action cannot work (contradiction, resolved)

Frame 1F (an empty day in a joined trip) draws an amber `+ Plan free time here` as "the only action".

**The source refuses it.** `dayTimeline()` builds lane rows only inside `stops.forEach(...)`; with no stops there are no lanes, and the only other lane produced is an orphan lane for a sub route that already exists. The code says so in its own words: *"A day with no stops at all still offers somewhere to put free time, but only once it has stops for a sub route to sit between."*

**Resolution — APPROVED (source-closed):** on a **stopless** shared day, tier 3 offers **no action at all**. This is already legal under the tier-3 rule ("at most one ghost/amber action… or nothing") and under rule §2.4.5 ("no action when the cause is another person"). The amber `+ Plan free time here` stays in the design but only for a shared day that **has** stops and a gap of at least `MIN_LANE_MINUTES` (45) — which is exactly when the app can honour it.

This also closes **`new-feature-design.md` §7.6** ("can a loop exist on a day with no stops?"): **no**, and no behaviour change is proposed to make one.

### 1.6 The tier-3 sentences

| Item | Status |
|---|---|
| The three tier-3 sentences ("Day 4 is empty in the copy you were sent." / "Anything Ana adds arrives with the next update." / "Nothing changes on your side until you have looked through it.") | **NEEDS DECISION — copy sign-off** (§6, item **S-1**). Recommendation: approve as written. They are the only place the product names another person, and they already obey P0-1's principle 3. |

---

## 2. System 2 — the multilingual warning strip

**Source of the design:** `multilingual-warning-strip-design.md` (structure D, fact-first) **plus its 4 Sep follow-up**, which closed Q1 and Q2 and fixed the four-kind mapping.
**Also touching it:** `new-feature-design.md` §3, which designed the *same strip differently*.
**Reconciled against:** `store.js` `dayIssues()` (~996), `app.css` `.warn` / `.warn-label` / `.warn-text` / `.warn-fix`.

### 2.1 The contradiction, and which one survives

These two documents specify incompatible strips:

| | `new-feature-design.md` §3.3 ("S3") | `multilingual-warning-strip-design.md` ("D", fact-first) |
|---|---|---|
| Kind label | keeps `OVERLAPS` / `OUT OF ORDER` | **the relation becomes the label** — `OVERLAPS` / `LISTED AFTER` |
| Name | a `flex` sibling on a shared "subject" line, beside a relation word (`WITH` / `AFTER`) and a time | **its own line**, 13px/700 ink, nothing else on it |
| Numbers | the time is on the subject line, `flex:none` | **a fact line** — `Starts 13:30 · this stop 13:25`, tabular, `·` separated |
| Consequence sentence | kept ("These two are on top of each other.") | **dropped — the label says it** |
| New CSS | `.warn-subject`, `.warn-rel`, `.warn-name`, `.warn-when` | `.warn-name` + a fact line; the label is the existing `.warn-label` |

**Resolution — APPROVED. Fact-first (D) is the design; `new-feature-design.md` §3 is SUPERSEDED in full.**

Three reasons, and they are not merely chronological: (a) you have confirmed the fact-first structure and its CJK wrapping behaviour; (b) the later document tested three structures against three scripts at the real 290px strip width and D was the only structure whose **height does not move with script or name length**; (c) S3 still puts a relation word and a name on one line, so the browser is still asked to size a boundary between two scripts — the exact failure the work set out to remove.

### 2.2 The strip, consolidated — this is the implementable spec

Three slots, in this order. **A slot is omitted, never filled with a substitute.**

| Slot | Element | Type | Rule |
|---|---|---|---|
| 1 · relation label | existing `.warn-label` | 10.5px / 800 / `.06em` / `--amber-fg` #8A5A08 | Words only — **never a number**. Present in every kind. |
| 2 · name line | new `.warn-name` | 13px / 700 / `--ink` #14201C / line-height 1.3 (1.45 wrapped) | The **other** party's name, verbatim. No quotes, no ellipsis, no truncation, no `nowrap`. `text-wrap: pretty`, `line-break: strict`, `overflow-wrap: anywhere`. Omitted when there is no other party. |
| 3 · fact line | new `.warn-fact` (replaces `.warn-text`'s role) | 11.5px / 400 / `--amber-fg` / `tabular-nums` | Numbers, other-then-self, joined by `·`. Never a comma. Never repeats the name. |
| 4 · fixes | existing `.warn-fix` row (h30, `.first` ink) | unchanged | Unchanged. Still names the tap that fixes it. |

**The four kinds, final:**

| Kind | Label | Name line | Fact line |
|---|---|---|---|
| `order` | `LISTED AFTER` | the earlier-listed stop | `Starts 13:30 · this stop 13:25` |
| `overlap` | `OVERLAPS` | the stop still running | `Runs to 14:30 · this starts 14:00` |
| `reversed` | `ENDS WHEN IT STARTS` | — | `Starts and ends 16:10` |
| `notime` | `NO TIME` | — | `No start time yet.` |

**The load-bearing invariants** (both APPROVED, both inherited unchanged):

1. **Generated copy and the user's name never occupy the same line.** No template may interpolate a name into a sentence.
2. **The presence of the ink line is itself the signal** — ink line = another stop is involved; no ink line = this row only. Nothing is ever substituted into the empty slot to make the three kinds look alike.

### 2.3 CJK behaviour — preserved verbatim

| Item | Status |
|---|---|
| Only the name column wraps, and within itself; `line-break: strict`; `overflow-wrap: anywhere`; **nothing is truncated**, ever — a warning must not hide the thing it warns about | **APPROVED** |
| The name is 13px because CJK resolves worse at the same px; 11.5px is below the floor | **APPROVED** |
| Line-height 1.3 for the name (1.45 wrapped); plan-card titles rise 1.25 → 1.35 | **APPROVED** |
| Never italicise, never letter-space CJK | **APPROVED** |
| The Latin/CJK boundary is spaced by layout, never by a character | **APPROVED** — and fact-first makes it moot: the boundary no longer exists on a line. |
| Mixed Latin+CJK ("AEON MALL 幕張新都心") is the common case, one 13/700 line, one stack | **APPROVED** |
| Card layout keeps `min-width:0` on the name column and `flex:none` on the badge/window — already correct in `app.css`, **must not be lost** | **APPROVED** |
| **RTL (Arabic, Hebrew) untested** | **DEFERRED** — no RTL claim is made. The isolated name line should behave; it has not been seen. |
| The Latin-first font stack itself (`'Public Sans','Hiragino Sans',…`) | **APPROVED** as a stack |
| **Where the stack applies** — names only, or `body`? | **NEEDS DECISION** (§6, item **S-2**) |

### 2.4 The other closed question

**`new-feature-design.md` §7.3 / coverage §3D.22 — "relation words: fixed vocabulary?" → APPROVED (closed by the follow-up).** The vocabulary is the four kinds in §2.2, and it is not a vocabulary of loose adjectives: each kind gets one label, written in words, and a new issue kind must bring its own label rather than reusing a generic one. `dayIssues()` produces exactly these four today.

### 2.5 The one data-shape change

`store.js` `dayIssues()` must split its single `text` string into `{ relation, name, when, consequence }` — presentational only, no new warning fires, no condition changes. **APPROVED** (it is the mechanical consequence of §2.2, and both design documents already require it).

---

## 3. System 3 — Review

**Source of the design:** `new-feature-design.md` §4 (hierarchy, row structure, yours/theirs treatment, decision interaction, edge cases, completion).
**Reconciled against:** `screens/review.js` (whole), `share.js` `diffSnapshot()` / `diffStops()` / `diffRows()` / `MINE_ALONE`, `store.js` `pendingUpdate()` / `takeChange()` / `keepMine()` / `markReviewed()` / `finishReview()` / `rememberUndo()`, and the P0-6 verification frames v05–v09.

**Deliberate limit:** the deep questions — two-way versus three-way, row structure, rename framing, bulk safety, receipt — are **P0-4's**, and are designed in `docs/design/p0-4-review-design.md`. This section does only what you asked: fold in the verification findings, mark what survives, and say plainly which parts of §4 the P0-4 document replaces.

### 3.1 What survives from §4 unchanged

| Item | Status |
|---|---|
| The four-question hierarchy (what changed → what kind → yours vs theirs → what am I deciding), with the decision **deliberately the lightest thing on the card** | **APPROVED** |
| The row title names the **subject** (the place), never the verb | **APPROVED** — and P0-4 sharpens *which* subject (§3.3). |
| Theirs is **jade**, not amber and not red/green; nothing in the list is wrong | **APPROVED** |
| Day grouping as a `DAY 3 · FRI 14 MAR · 3 THINGS` eyebrow; presentation only, ids and mutations untouched | **APPROVED** — verification confirmed the need: `Day 3` currently repeats as a chip on **every** card. |
| An absent side is **written, not blank** (`not on your day`, `off the day`) | **APPROVED** — verification confirmed `THEY ADDED` renders an asymmetric pair today. |
| Verb-matched buttons where the generic pair is wrong (`Leave it out` / `Add it` on an addition) | **APPROVED** |
| A delta chip for clock pairs (`45 min later`) | **APPROVED** |
| Progress in the push sub instead of a bare count | **APPROVED** |
| Bulk actions become the sticky `.review-foot` (defined in `app.css`, unused by the screen) | **APPROVED in principle**; the *safety* of bulk is P0-4 §E. |
| The three-sentence preamble moves out of the way of the first row | **APPROVED** |
| CJK: 13.5/700 title at line-height 1.35, same Latin-first stack | **APPROVED** — verification: CJK titles held up at 13.5/700, including `大稻埕・迪化街老屋與布市半日散步`. |

### 3.2 What the verification sprint adds, and what it does to §4

| Finding (v05–v09) | Effect |
|---|---|
| **Every side value wraps at 390px, even short ones** (each `.side` is ~150px; `09:15 – 10:00 Lumen Crossing` takes two lines) | §4.5 stacked the sides only "above roughly 60 characters". **Superseded:** stacking is now the *default*, not an overflow case. P0-4 §B. |
| **A rename adopts their name in the card title before you decide** | §4 did not cover it. Resolved in P0-4 §C. Recorded as D-5. |
| **`THEY ADDED` is asymmetric** (`not on your copy` against a bare time, because the name lives in the title) | §4.3's "written absent side" is the right shape but must also make the pair comparable. P0-4 §B. |
| **Bulk actions sit ~2 screens below the fold** | Confirms §4.4's sticky-foot proposal empirically. |
| **The receipt is ephemeral** — `done` is a module-level counter reset by the `Back to the day` handler | Confirms the need for §4.6's receipt, and P0-4 gives it a store-backed source. |
| **Decisions have no undo**, in an app whose rule is "undo, not confirm" | P0-4 §D, using the existing app-wide 6s undo bar. |

### 3.3 Reconciliation D — a source correction the earlier documents get wrong

Both `new-feature-design.md` §7.2 and `ui-ux-design-coverage.md` §3A.4 describe decided rows as simply vanishing, and the verification record can be read as "decide seven things, navigate away, and nothing was remembered".

**More precisely, and this matters for P0-4:** a decision **does** persist. `markReviewed(id)` writes the entry id into `trip.declined` (capped at the last 400), and `pendingUpdate()` filters those ids out of the diff on every render. So *which* differences you have dealt with survives navigation, a reload and a relaunch, until `finishReview()` clears the list.

**What is genuinely lost is *what you chose*.** `keepMine()` and `takeChange()` both end in the same `markReviewed()` call, so nothing records the direction of the decision, and the only count is the ephemeral module-level `done`. That is the actual gap, and it is why a receipt needs one new stored value rather than a new mechanism. **APPROVED (source-closed correction.)**

### 3.4 Explicitly handed to P0-4

Retaining a base snapshot (three-way) · the stacked row structure and the nine difference cases · the rename title · `YOURS`/`THEIRS` versus `ANA'S`/`MINE` · undo and the receipt · bulk-action placement and safety · the five completion states. All in `p0-4-review-design.md`. **No part of §4 is deleted; where the two disagree, P0-4 wins and says so.**

---

## 4. System 4 — role & copy identity (P0-1)

**Source of the design:** `p0-1-role-and-copy-identity-design.md`. Confirmed by you, including the two judgement calls.

| Item | Status |
|---|---|
| Role enforcement stays as it is; the UI represents it truthfully; a joined copy carries a persistent quiet identity | **APPROVED** (product direction, confirmed) |
| The five UX principles, incl. "enforcement is shown by absence, not by refusal" and "identity is a person, not a connection" | **APPROVED** |
| The offer phase shows two options; `owner` is not a grant | **APPROVED** |
| Terminology: keep the role ids, keep `Can send updates` / `Receives updates`, change the eyebrow to `SENDING UPDATES`, add the invariant line, stop stripping `Can `, fix `ROLES.owner.can` | **APPROVED** |
| The `read` user's send block: **no button**, jade `YOUR CHANGES` explainer in its place | **APPROVED** |
| Chip + caret for the owner, flat `.badge` for everyone else | **APPROVED** |
| Non-owner manage view: no add, no swipe, no link section, one jade explainer | **APPROVED** |
| Alternative 3 — `.who-mark` + "from Ana" wherever the trip already identifies itself | **APPROVED** |
| **The marker does not appear on all five tabs**; no new omnipresent bar is invented | **APPROVED — confirmed by you** |
| **The marker yields to sync warnings** when the trip chip is occupied by sync status — intentional priority, not a defect | **APPROVED — confirmed by you** |
| Arrival banner, branched by role, using the existing unused `.arrived` class | **APPROVED** |
| The corrected Log line | **APPROVED** |
| `removePerson()` has no non-owner guard — a non-owner can prune their own copy's people list | **APPROVED AS A RECORDED FINDING, NOT FIXED** — confirmed by you: it stays recorded through the design phase. The design's UI-level mitigation (the gesture is simply not bound for non-owners) stands. Carried in the review pack §8. |
| `CAN SEND UPDATES` at 9.5px/800 uppercase — the tightest type fit introduced | **DEFERRED** to implementation; needs a look at 390px. |
| What the sender sees after sending | **DEFERRED** — belongs to the send-update decision, not here. |
| Whether Review's side keys become `ANA'S` / `MINE` | **Handed to P0-4** — answered there (§C): they do not. |
| D-3 — the three-bullet "What they get" card appears only *after* a link exists | **DEFERRED** (P1). It would sit naturally beside the new invariant line; moving it is a separate decision. |

**Cross-check performed:** P0-1's marker and the tier-3 empty state both use a `.who-mark` on the same screens. They do not collide — tier 3's mark sits **inside the jade card** as part of the context line ("joined 2 days ago · no updates yet"), while the marker sits in the **trip chip / card meta line**. One is about *this container*, the other about *this trip*. No change to either design; recorded so an implementer does not merge them.

---

## 5. Cross-system consistency check

Everything below was verified across all four systems this session.

1. **Colour semantics hold.** Jade = given (tier 3, theirs, the joined-copy explainers) · amber = yours or uncertain (the self-planned recipe, the warning strip, the currency guess) · ink = the act (tier 1's one primary) · rust = broken (a failed lookup, a genuine conflict). No system uses a colour against its meaning.
2. **No new component in any of the four.** Every element resolves to an existing `app.css` class. The only new rules are `.warn-name` + `.warn-fact` (§2.2), tier-1/tier-3 block classes, `.side.stacked`, and `.review-group` — all compositions of existing tokens, all appended at the end of `app.css` per the audit's rule.
3. **One ink primary per screen** is preserved everywhere, including tier 3 (which has none).
4. **"A warning always names the tap that fixes it"** holds in the warning strip (the `.warn-fix` ladder), in the currency work (Trip settings named as the place), and in Review (the decision row *is* the tap). The one place it deliberately does not apply is the `read` user's send block — there is no tap that fixes it, which is why it is not a warning (P0-1 §4.4).
5. **Nobody is the subject of a negative verb** in any string across the four systems. Checked line by line.
6. **390 × 844 holds** in all four: the warning strip is fixed at three short lines in every script; tier 1's block sits above the fold with the tab bar present; tier 3's card is 4 lines plus a context line; Review's stacked row is the P0-4 change that makes the 390px case honest.
7. **No existing inconsistency is standardised in passing.** The 14 radii, six control heights, duplicate CSS blocks and half-pixel type scale are all untouched, per audit §12 and your rule 6.

---

## 6. NEEDS DECISION — all four, with recommendations

Only these four. Nothing else in this document is waiting on you.

| id | Decision | Recommendation | Why |
|---|---|---|---|
| **S-1** | Sign off the three tier-3 sentences — the only place the product names another person. | **Approve as written.** | They already obey the rule P0-1 inherited (the copy is the subject; the person appears only with a positive verb). Rewriting them risks reintroducing blame. |
| **S-2** | Where does the Latin-first font stack apply — place names only (warnings, plan titles, Review values), or `body`? | **`body`.** | Public Sans has no CJK glyphs, so *every* CJK string in the app is already rendering from an accidental system fallback — not just names. Declaring it on `body` makes the existing behaviour deliberate and keeps digits, times and badges on Public Sans because it stays Latin-first. It is one line at the end of `app.css`. The narrow scope leaves day headers, trip names, note bodies and `areaSpan` on an undeclared fallback for no benefit. |
| **S-3** | Review's bulk actions: is "bulk may never touch a row where both of you changed the same thing" the right safety rule? | **Yes.** | It is the rule that lets bulk exist at all without breaking one-decision-per-difference. Designed in P0-4 §E; flagged here because it is a *policy* about safety, not a layout call. |
| **S-4** | Empty-state tier 3 on a **stopless** shared day offers no action at all (§1.5). | **Accept.** | The alternative is a behaviour change in `dayTimeline()` so a lane can exist with no stops — a product change to make one empty frame less quiet. Not worth it. |

---

## 7. Corrections to earlier documents — read these before trusting the originals

Recorded rather than silently applied, so the earlier documents stay legible.

| # | Document | Correction |
|---|---|---|
| 1 | `new-feature-design.md` **§3 (whole section), §6.4, and the `.warn-subject`/`.warn-rel`/`.warn-when` line in §8** | **SUPERSEDED** by the fact-first strip (§2 above). Do not implement §3. |
| 2 | `new-feature-design.md` §2.6, frame **1A** | The "arrive by link" action **does not exist as a destination**; it becomes a closing copy line (§1.3). |
| 3 | `new-feature-design.md` §2.6, frame **1F** | The amber `+ Plan free time here` **cannot fire on a stopless day**; tier 3 there has no action (§1.5). |
| 4 | `new-feature-design.md` §7.1 | Conflict detection **is** in scope and is designed; see P0-4 §A. |
| 5 | `new-feature-design.md` §7.2 | Partially wrong: decisions **do** persist (via `trip.declined`); what is lost is *which way* you decided (§3.3). |
| 6 | `new-feature-design.md` §7.3, §7.5, §7.6, §7.7 | All four **closed** — §2.4, §1.4, §1.5, §1.4 respectively. Of the eight §7 questions, **six are now closed**; the remaining two are S-1 (copy sign-off) and S-2 (stack scope). |
| 7 | `new-feature-design.md` §4.5 | Stacked sides are the **default**, not a >60-character overflow case (§3.2). |
| 8 | `ui-ux-design-coverage.md` §6 | Its P0 list is numbered **differently** from `p0-decision-brief.md` (coverage P0-1 = brief P0-3; coverage P0-7 = brief P0-2, and so on). **The decision brief's numbering is canonical** — P0-1 role/identity, P0-2 currency, P0-3 sign-off, P0-4 Review, P0-5 pending, P0-6 verification, P0-7 paste. Coverage §6 should be renumbered when that file is next opened; it is not edited here, to avoid touching a document nothing else in this batch depends on. |
| 9 | `ui-ux-design-coverage.md` §3A.4 / §3A.14 | Refined by §3.3 above: the receipt is ephemeral and the *direction* of a decision is unrecorded; the decisions themselves persist. |
| 10 | `multilingual-warning-strip-design.md` | **No corrections.** Its follow-up section is current and its structure is the one being implemented. Its two remaining opens are S-2 (shared with the other document) and RTL (deferred). |

---

## 8. Could another AI implement from these documents?

Checked deliberately, since it is the point of this batch.

| System | Implementable without guessing? | The remaining prerequisite |
|---|---|---|
| Empty states, tiers 1 & 2 | **Yes.** Twelve places, three surfaces, exact type and colour, copy rules, action rules. | none |
| Empty states, tier 3 | **Yes**, with the three-cause test in §1.2 and the shared-kinds limit in §1.4. | S-1 (copy sign-off) is a wording call, not a blocker |
| Warning strip | **Yes.** Four kinds, three slots, exact type, the `dayIssues()` split, wrapping rules. | S-2 decides one line of CSS |
| Review | **Not from `new-feature-design.md` §4 alone** — read `p0-4-review-design.md` with it. | P0-4 sign-off |
| Role & copy identity | **Yes.** Copy is exact in §7 of its own document, states are enumerated, no new component. | none |

**One process rule, restated because it has already been broken twice:** the markdown is canonical; an artboard illustrates it. Any string on an artboard that is not in a design document's copy section is drift, and should be treated as a bug in the artboard rather than as a decision.

---

## IMPLEMENTED — 5 Sep 2026

Built against this document as it stood at commit `9a21d8d` (tree unchanged from what this document reconciled against). Landed as two commits on `claude/travel-planner-track-b-9zyxkc`:

- **`949e04d`** — the empty-state system (§1, tiers 1–3) and the warning strip (§2, fact-first). `store.isSharedEmptyKind(kind)` and `store.sharedEmptyContext()` are the literal implementations of the §1.2 source tests; `dayIssues()` now returns `{label, name, fact}` exactly as §2.2/§2.5 specify, with `OUT OF ORDER` renamed to `LISTED AFTER` per the final table. S-2 was decided `body` (the recommended direction) and is one rule at the end of `app.css`.
- **`1a5d655`** — the accessibility pass named in DESIGN_REVIEW.html item 16 (not itself a system in this document's scope, but touches the same files): `:focus-visible` on every button, and the `.who-mark` in the new tier-3 context line is `aria-hidden` per `p0-1-role-and-copy-identity-design.md` §11.4.

**Decisions taken, both already recommended in §6 and not re-litigated:**
- **S-1** (the three tier-3 sentences) — approved as written, used verbatim.
- **S-2** (Latin-first stack scope) — `body`.
- **S-4** (stopless shared day, no action) — accepted; `dayTimeline()` untouched.
- **S-3** (Review's bulk safety rule) — still out of scope; Review was not touched.

**Reconciliations from §7 exercised as written:** 1A's "arrive by link" landed as the closing-hint copy line, no second control. 1F's amber action does not fire on a stopless day; it does fire, unchanged copy ("+ Plan free time here"), on a shared day that has stops and a lane wide enough for `dayTimeline()` to have built in the first place — which was always the resolution's own condition.

**Not deployed as of this note** — the session that built this pushed to a non-`main` branch; see `DESIGN_REVIEW.html`'s masthead for the current status. This does not change anything above: the commits are real, tested (35 + 34 + 9 new browser checks, full existing suite re-run clean), and complete against this document.
