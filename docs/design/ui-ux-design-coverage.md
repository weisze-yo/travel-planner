# UI/UX Design Coverage — Travel Planner

**Date:** 5 Sep 2026 · rewritten in full after the final broad design batch · **§0.3, §2 appearance/behaviour columns, §4.3 and §5 updated by the implementation-readiness audit (5/6 Sep).**
**Baseline:** the working tree in this project (`web/**`, `firebase/**`), read this session. Every source claim below was re-verified against it; no application code was changed.
**Purpose:** answer one question — *have we intentionally designed, and has the product owner confirmed, the UI and UX for every important feature, screen, state and interaction in this application?*
**And to be a reliable map of remaining design risk** — which is why §1's vocabulary distinguishes *designed* from *confirmed* from *seen*.

**Read with:** `final-implementation-readiness-review.md` (**start there**) · `implementation-readiness-map.md` (the implementation contract) · `overnight-final-design-review-pack.md` · `cross-flow-consistency-audit.md` (the eight contradictions and eleven ambiguities) · `p2-triage.md` · the thirteen canonical design documents listed in §5 · `screens/current/*.png` (20 frames), `screens/verify/*.png` (16 frames) and **`docs/design/screens/final/*.png` (28 frames, the readiness audit)** — all 390 × 844.

**Source-of-truth order:** the running app → `web/js/**` + `web/css/app.css` → the captured frames → the prose in these documents.

---

## 0. Headline — every figure derived from the §2 rows

| | Count | of |
|---|---|---|
| Meaningful screens/flows inventoried | **71** rows | — |
| **Design CONFIRMED** by the product owner | **56** | 71 |
| **UNDERSTOOD — not yet explicitly confirmed** | **14** | 71 |
| **DESIGN DECISION REQUIRED** | **1** | 71 |
| Behaviour **observed running** | **47** | 71 |
| Behaviour **read in source only** | **23** | 71 |
| Behaviour **not built at all** | **1** | 71 |
| Appearance **CAPTURED** at 390 × 844 | **39** | 71 |
| Appearance **VISUAL NOT VERIFIED** | **32** | 71 |
| Rows carrying an **open decision** | **4** | 71 |

**Arithmetic, so it is checkable:** 56 + 14 + 1 = 71 · 47 + 23 + 1 = 71 · 39 + 32 = 71. The subtotals at the head of each §2 block cover **rows, design status and appearance**; the behaviour figures are counted across the whole matrix (27 rows are marked `SOURCE-ONLY` and one `NOT BUILT`).

**Design completeness: 56 of 71 rows = 79% confirmed, 99% either confirmed or understood, 1 row (1.4%) awaiting a decision before it can be designed.**

> **A `CONFIRMED` row means the product owner approved the design. It does not mean the code matches it.** The readiness audit found three approved surfaces whose implementation contradicts the approved design, two of them on one screen — all three on rows that were already `CONFIRMED`, and one of them on a row that was already `CAPTURED`. The design column and the implementation are two different questions; `implementation-readiness-map.md` §3 answers the second.

### 0.3 What the implementation-readiness audit changed (5/6 Sep)

**No row changed design status, and no approved decision was reopened.** What moved is appearance and behaviour, from the verification pass in §4.3 items 1–3 — 16 new frames at 390 × 844 in `docs/design/screens/final/`, driven through the real app in `web/verify.html`.

| Row | Was | Now | Why |
|---|---|---|---|
| §F · Destination's other four panels | SOURCE-ONLY · VISUAL NOT VERIFIED | **OBSERVED · CAPTURED** (f04–f08) | all five panels opened and seen populated, below the fold |
| §L · Below the fold | SOURCE-ONLY · VISUAL NOT VERIFIED | **OBSERVED · CAPTURED** (f11–f12) | scrolled end to end |
| §L · `Empty this trip` | SOURCE-ONLY · VISUAL NOT VERIFIED | **OBSERVED · CAPTURED** (f13–f14) | confirm armed and read; the destructive commit was not run |
| §D · Archive card | SOURCE-ONLY · VISUAL NOT VERIFIED | **OBSERVED · CAPTURED** (f19) | seen — **and it renders white-on-white.** The row's design is still confirmed; its implementation is finding M-4 |
| §K · Changes on this phone | CAPTURED (v15, jade only) | **VISUAL NOT VERIFIED** | the jade receipt captured in v15 is the *undefined* `.hint-jade` rendering as 16px body text (f20), not the designed jade card. A frame of the wrong thing is not verification |

**Also seen, without changing a row's score:** Trip prep and Spend below the fold (f23–f24 — Spend's day bars and category stack are unexercised by the demo's single purchase, so the *structure* is verified and the populated chart is not) · the Shopping list below the fold (f25) · the Plan's edit mode end to end (f15–f18) · **the first real long-text and CJK evidence** on the Plan and Destination (f26–f28 — both wrap cleanly, nothing clips).

**Two suspected defects were measured and dismissed** rather than reported: the hero's `Photo placeholder` chip and the sub-route lane's time column both wrap in the capture renderer and **not** in a real browser (measured `scrollWidth === clientWidth`, single-line heights). Recorded because a capture artifact reported as a defect costs an implementer a day.

### 0.1 What changed this pass, and why the numbers moved so far

**Confirmation went from 0 to 56.** Every previous version of this document recorded *"UX confirmed: 0 · Visual confirmed: 0"* — nothing in the product had ever been signed off. The product owner has now approved the P0 baseline (P0-1 … P0-5), the three P1 batch documents, and the recommendations attached to them. Rows covered by an approved canonical document are therefore **CONFIRMED**, and the five new documents written this session bring the rest.

**Two rows were added:** *install / first run on a phone* (§B) and *a refused read, mid-session* (§I). Both are real user-facing surfaces that no previous pass inventoried.

**The appearance figures are not comparable with the previous pass** (41 of 69 → 36 of 71). The row set changed, and this pass scores a row `CAPTURED` **only when a frame shows the state the row describes** — so "captured at rest" no longer counts for a row about a mid-gesture state, and "captured above the fold" no longer counts for a row whose content is below it. The stricter rule is the point: the appearance column exists to say what has actually been seen.

### 0.2 Nine claims in earlier versions of this document were wrong

All nine were found by reading source this session, and all nine are corrected in a canonical document rather than silently here. **This is the single most useful output of the batch** — a matrix that misdescribes the app sends design effort at problems that do not exist and hides the ones that do.

| # | The claim | The truth | Corrected in |
|---|---|---|---|
| 1 | "Removed from a shared trip" is designed nowhere | **Fully built** — and two of its three sentences contradict the store | `p1-absence-and-removal-design.md` §2 (RC-6) |
| 2 | A place with no location "silently drops out of the map" | **Not silent** — the Plan card carries a standing amber chip and the add outcome names three taps | same, §4 (RC-7) |
| 3 | "Delete a stop — swipe → in-row confirm → undo" on a live row | **A live stop cannot be swiped.** `✕` archives; only an archived row can be swiped | `p1-plan-editing-design.md` §6 (RC-9) |
| 4 | The archive card is a P2 cosmetic, "collapsed archived stops" | **Half the app's destructive model**, and the reason the Plan needs no delete confirmation | same, §6 (RC-10) |
| 5 | "The vacated slot" when a stop moves is an open question | **Not a decision** — lanes are derived from gaps, so the slot becomes free time by itself | same, §6.3 (RC-11) |
| 6 | Plan's empty day needs the tier-1 treatment approved | **Already implemented**, dashed stubs and all | same, §9 (RC-12) |
| 7 | "Five sync states in a **6px** dot, **no label**" | **8px**; all five carry an `aria-label`; **two carry a visible sentence** | `p1-status-visibility-design.md` §1 (RC-14/15) |
| 8 | The warning strip's rank order | **Wrong in an approved document and in `remind.js`'s own comment.** The red loop reminder outranks stuck | same, §2 (RC-16) |
| 9 | Destination's four tab bodies are "four screens, a batch of their own" | **One screen, five panels, all built.** They needed three approved systems applied, not a design | `p1-destination-tabs-design.md` §1 (RC-18) |

Plus **two count corrections**: seven `|| '¥'` fallbacks are actually **eight** (RC-19), and P0-5's canonical pending-label list of sixteen is actually **eighteen** (X-4).

---

## 1. Status vocabulary — used exactly

**Design status** — the column that matters:

| Value | Means |
|---|---|
| `CONFIRMED` | A canonical design document covers this row **and the product owner has approved it.** The document is named in the row. |
| `UNDERSTOOD — NOT YET EXPLICITLY CONFIRMED` | Behaviour is known and nothing about it is undecided, but **no design document covers it and nobody has signed it off.** Existing code is **not** treated as confirmation. |
| `DESIGN DECISION REQUIRED` | A real product or UX question stands here, and it must be answered before the row can be designed. |
| `IMPLEMENTATION-ONLY / LEGACY` | Exists, works, looks accidental, and is deliberately being left alone. |
| `OUT OF SCOPE` | Deliberately excluded. |

**Behaviour:** `OBSERVED` (read in source **and** seen running, in whole or part) · `SOURCE-ONLY` (**behaviour not verified** — needs a second account, a real gesture, or a real failure) · `NOT BUILT`.

**Appearance:** `CAPTURED` (a 390 × 844 frame exists **of the state this row describes**) · `VISUAL NOT VERIFIED`.

---

## 2. Design coverage matrix — 71 rows

### A · Trips & account — 7 rows · 6 confirmed · 1 understood · 4 captured

| Screen/Flow | Design status | Behaviour | Appearance | Open decision | Pri |
|---|---|---|---|---|---|
| My trips — populated (running cover card · groups · stat chips · `Opening…`) | UNDERSTOOD | OBSERVED | CAPTURED (01) | — | P2 |
| My trips — empty (signed out / signed in) | CONFIRMED — P0-3 §1, frame 1A + §1.3 | OBSERVED | VISUAL NOT VERIFIED | — | — |
| New trip → paste hand-off (modal · the derived currency line · `Creating…`) | CONFIRMED — P0-2 §3–5 · P0-5 · silent refusal in dest-tabs §6 | OBSERVED | CAPTURED (03) | **Yes** — is the forced jump to Paste right? | P1 |
| Account row · sign-in sheet · `CHECK YOUR MAIL` · the email return leg · `Signing out…` | CONFIRMED — `p1-account-and-sign-in-design.md` | OBSERVED | CAPTURED (01, 02) | — | P1 |
| Trip cover picker | CONFIRMED — `p2-triage.md` §B.1 | SOURCE-ONLY | VISUAL NOT VERIFIED | — | P2 |
| Delete a trip (swipe → latch → in-row confirm → 6s undo) | CONFIRMED — the destructive pattern, audit §8 | OBSERVED | CAPTURED (01, at rest) | — | — |
| **Removed from a shared trip** (`.gone-card` · kept list · `Keep my side`) | CONFIRMED — absence §2 · **RC-6** | SOURCE-ONLY — **unreachable, IF-9** | VISUAL NOT VERIFIED | — | P1 |

### B · Global chrome — 7 rows · 5 confirmed · 1 understood · 1 decision · 3 captured

| Screen/Flow | Design status | Behaviour | Appearance | Open decision | Pri |
|---|---|---|---|---|---|
| Boot (bone cover + `MC` · `.boot-error`) | UNDERSTOOD | OBSERVED (cover) | CAPTURED (cover only) | — | P2 |
| Tab bar (present / absent / borrowed parent tab) | CONFIRMED — recorded from `nav.js`, P1 review pack §6b | OBSERVED | CAPTURED | — | — |
| Warning strip — one slot, **five ranked slots**, four sources | CONFIRMED — status-vis §2 · coverage-gaps §5 · **RC-16** | SOURCE-ONLY | VISUAL NOT VERIFIED | — | P1 |
| Undo bar (one app-wide bar, 6s, nine callers) | CONFIRMED — status-vis §3 | SOURCE-ONLY | VISUAL NOT VERIFIED | — | P1 |
| Cross-tab sync (`storage` listener) | CONFIRMED — coverage-gaps §4, **a deliberate nothing** | SOURCE-ONLY | VISUAL NOT VERIFIED | — | P2 |
| Trip chip + sync dot (five states) | CONFIRMED — status-vis §1 · **RC-14/15** | OBSERVED | CAPTURED (rest state) | — | P1 |
| **Install / first run on a phone** | **DESIGN DECISION REQUIRED** | **NOT BUILT** — icons committed, manifest absent | VISUAL NOT VERIFIED | **Yes — OD-8** | P2 |

### C · Map & the day — 3 rows · 1 confirmed · 2 understood · 3 captured

| Screen/Flow | Design status | Behaviour | Appearance | Open decision | Pri |
|---|---|---|---|---|---|
| Map home (tiles · **blank map** · pin focus · `.stranded` · legend) | CONFIRMED — status-vis §4 · **RC-17** | OBSERVED | CAPTURED (04, 05) | **Yes — OD-7**, should a blank map say why? | P1 |
| Day switching (pills + weather glyph) | UNDERSTOOD | OBSERVED | CAPTURED | — | — |
| Map sheet (3 detents · stop rows · Nearby) | UNDERSTOOD | OBSERVED | CAPTURED | — | — |

### D · Planning — 12 rows · 12 confirmed · 5 captured

| Screen/Flow | Design status | Behaviour | Appearance | Open decision | Pri |
|---|---|---|---|---|---|
| Plan — read (timeline · spine · derived length · `n things to look at`) | CONFIRMED — plan-editing | OBSERVED | CAPTURED (06) | — | — |
| Plan — edit mode (jade pencil · two `.edge` inputs · `✕` · grips) | CONFIRMED — plan-editing §3 | OBSERVED | CAPTURED (07, f15–f18) | — | — |
| Plan — empty day | CONFIRMED — plan-editing §9 · **RC-12, already implemented** | OBSERVED | CAPTURED (08) | — | — |
| Plan — empty day, **joined trip** | CONFIRMED — P0-3 §1.5 / S-4 (no action) | SOURCE-ONLY | VISUAL NOT VERIFIED | — | P1 |
| Add a stop (inline form · refuses out loud · pending on the button) | CONFIRMED — plan-editing §7 | OBSERVED | VISUAL NOT VERIFIED | — | P1 |
| Edit a stop — the two times, commit on `change`, **`not a time`** | CONFIRMED — plan-editing §4 | OBSERVED | CAPTURED (07) | — | P1 |
| Delete a stop — **the two-stage ladder** (`✕` → archive → swipe → undo) | CONFIRMED — plan-editing §6 · **RC-9** | OBSERVED — **stage 2 does not work**: map M-5 | VISUAL NOT VERIFIED (mid-gesture) | — | P1 |
| Reorder stops (grip drag · `.dragging` / `.drop-into`) | CONFIRMED — plan-editing §5 | SOURCE-ONLY | VISUAL NOT VERIFIED | — | P1 |
| Move a stop to another day (`MOVE TO` · `Moved to Day 4.`) | CONFIRMED — plan-editing §6.3 · **RC-11** | SOURCE-ONLY | VISUAL NOT VERIFIED — the `MOVE TO` chips are in f19; the `Moved to Day 4.` receipt is not built | — | P1 |
| Warnings on a row (fact-first strip, four kinds) | CONFIRMED — P0-3 §2 | OBSERVED | VISUAL NOT VERIFIED (live) | — | P1 |
| Free-time lanes → new sub route (lane · `+` · the lane form) | CONFIRMED — plan-editing §8 · **RC-13** | OBSERVED | VISUAL NOT VERIFIED | — | P1 |
| Archive card (`REMOVED FROM THIS DAY`, dark) | CONFIRMED — plan-editing §6 · **RC-10** | OBSERVED | **CAPTURED (f19)** — and it renders **white-on-white**: map M-4 | — | P1 |

### E · Sub routes — 2 rows · 2 confirmed · 1 captured

| Screen/Flow | Design status | Behaviour | Appearance | Open decision | Pri |
|---|---|---|---|---|---|
| Sub route — arrange (3 stat tiles · `ok`/`tight` · the coverage line) | CONFIRMED — coverage-gaps §3 · absence §4.2 | OBSERVED | CAPTURED (v11, partial) | — | P1 |
| Sub route — edit · edge markers · back-by form | CONFIRMED — coverage-gaps §3 | SOURCE-ONLY | VISUAL NOT VERIFIED | — | P1 |

### F · Places — 7 rows · 6 confirmed · 1 understood · 3 captured

| Screen/Flow | Design status | Behaviour | Appearance | Open decision | Pri |
|---|---|---|---|---|---|
| Destination — Info (`NEED TO KNOW`, filled and empty) | CONFIRMED — dest-tabs §1, §3 | OBSERVED | CAPTURED (09) | — | — |
| Destination — the other four panels (Nearby / Must-see / Shop / Notes) | CONFIRMED — dest-tabs · **RC-18: built, not unwritten** | **OBSERVED** | **CAPTURED (f04–f08)** | — | P1 |
| Destination — the stop that has gone | CONFIRMED — absence §3 | SOURCE-ONLY | VISUAL NOT VERIFIED | — | P1 |
| Facts / shot / item editors + **the silent-refusal rule** | CONFIRMED — dest-tabs §5, §6 | OBSERVED | VISUAL NOT VERIFIED | — | P1 |
| Nearby — populated (grouped · chips · sort) | UNDERSTOOD | OBSERVED | CAPTURED (10) | — | — |
| Nearby — three empty variants | CONFIRMED — P0-3 §1 (tier 2) | SOURCE-ONLY | VISUAL NOT VERIFIED | — | P1 |
| Add a place · **a place with no position** | CONFIRMED — absence §4 · **RC-7** | SOURCE-ONLY | VISUAL NOT VERIFIED | — | P1 |

### G · Lists & money — 5 rows · 3 confirmed · 2 understood · 3 captured

| Screen/Flow | Design status | Behaviour | Appearance | Open decision | Pri |
|---|---|---|---|---|---|
| Shopping list (populated · empty · filters · footer spend card) | CONFIRMED — P0-3 §1 · P0-2 §7.1 | OBSERVED | CAPTURED (11) | — | P1 |
| Add / correct an item (`itemEditor` · swipe-delete) | CONFIRMED — dest-tabs §5–6 | OBSERVED | VISUAL NOT VERIFIED | — | P2 |
| Currency from the city (inferred · unknown · corrected · joined) | CONFIRMED — P0-2 | SOURCE-ONLY | VISUAL NOT VERIFIED | — | — |
| **Spend report** (hero · day bars · category stack · accuracy · two empties) | **UNDERSTOOD — NOT YET EXPLICITLY CONFIRMED** | OBSERVED | CAPTURED (12, f23) — the demo's one purchase leaves the day bars and category stack unexercised | — | P1 |
| **Trip prep** (progress · what-to-wear · packing rows · filter) | **UNDERSTOOD — NOT YET EXPLICITLY CONFIRMED** | OBSERVED | CAPTURED (13, f24) | — | P1 |

### H · Log & notes — 4 rows · 2 confirmed · 2 understood · 2 captured

| Screen/Flow | Design status | Behaviour | Appearance | Open decision | Pri |
|---|---|---|---|---|---|
| Log — populated (day cards · place heads · photo strips · `.recap`) | **UNDERSTOOD — NOT YET EXPLICITLY CONFIRMED** | OBSERVED | CAPTURED (14) | — | P1 |
| Log — empty | CONFIRMED — P0-3 §1, frame 1C | SOURCE-ONLY | VISUAL NOT VERIFIED | — | P1 |
| Log on a shared trip (the corrected promise line) | CONFIRMED — P0-1 §7 | SOURCE-ONLY | VISUAL NOT VERIFIED | — | P1 |
| **Note editor** (new · edit · place picker · photo attach · photo failed · delete) | **UNDERSTOOD — NOT YET EXPLICITLY CONFIRMED** | OBSERVED | CAPTURED (15, new only) | — | P1 |

### I · Sharing, joining, receiving — 11 rows · 9 confirmed · 2 understood · 8 captured

| Screen/Flow | Design status | Behaviour | Appearance | Open decision | Pri |
|---|---|---|---|---|---|
| Share — offer phase (`What they get` first · the role choice in the sharing moment) | CONFIRMED — P0-1 §4.1 · share-flow §3 (B-11, B-12) | OBSERVED | CAPTURED (17, v01) | — | — |
| Share — manage (owner and **non-owner**) | CONFIRMED — P0-1 §4.2–4.3 · share-flow §3.2–3.3 | OBSERVED | CAPTURED (v03) | — | — |
| Send an update · **the sent state** | CONFIRMED — share-flow §3.4 (B-4) · P0-1 §4.4 | OBSERVED | CAPTURED (v02) | — | — |
| The link itself (live · off · expired · opens · revoke · **role changeable**) | CONFIRMED — share-flow §3.2 (OD-1 approved) | SOURCE-ONLY | VISUAL NOT VERIFIED | — | P1 |
| Join — live invite (link bar · inviter · grant line · preview · four promises · foot) | CONFIRMED — share-flow §4 | OBSERVED | CAPTURED (v10) | — | — |
| Join — sign-in phase | CONFIRMED — `p1-account-and-sign-in-design.md` | OBSERVED | CAPTURED (02, panel only) | — | P1 |
| Join — already joined | UNDERSTOOD (IF-4 recorded) | SOURCE-ONLY | VISUAL NOT VERIFIED | — | P1 |
| Join — dead link (expired · off · missing · offline) | UNDERSTOOD | OBSERVED | CAPTURED (20, expired) | — | — |
| Receiving an update — the banner, and `Later` collapsing | CONFIRMED — share-flow §6.2 (B-1) | OBSERVED | CAPTURED (v04) | — | — |
| Review an update (three-way · stacked row · undo · sticky foot · receipt) | CONFIRMED — P0-4 · bulk-actions refinement | OBSERVED | CAPTURED (v05–v09) | — | — |
| **A refused read, mid-session** | CONFIRMED — absence §6 | SOURCE-ONLY | VISUAL NOT VERIFIED | — | P1 |

### J · Import — 4 rows · 3 confirmed · 1 understood · 2 captured

| Screen/Flow | Design status | Behaviour | Appearance | Open decision | Pri |
|---|---|---|---|---|---|
| Paste — input (`WHAT IT LOOKS FOR`, incl. `第三天`) | CONFIRMED — paste §1 | OBSERVED | CAPTURED (19, v12) | — | — |
| Paste — review rows (**the gate inverted**, one ladder, one glyph, three validators) | CONFIRMED — paste §2–4 (OD-2 approved) | OBSERVED | CAPTURED (v13) | — | — |
| Paste — ready → saving → done → **failure** | CONFIRMED — paste §8 | SOURCE-ONLY | VISUAL NOT VERIFIED | — | P1 |
| Trip file import (JSON) | UNDERSTOOD — receipt **deferred**, `p2-triage.md` §B.4 | SOURCE-ONLY | VISUAL NOT VERIFIED | — | P2 |

### K · Offline & sync — 4 rows · 4 confirmed · 2 captured

| Screen/Flow | Design status | Behaviour | Appearance | Open decision | Pri |
|---|---|---|---|---|---|
| Map kept on this phone (cards · **the jade receipt** · storage line · swipe) | CONFIRMED — coverage-gaps §1.1 | OBSERVED | CAPTURED (18) | — | — |
| Draw an area (shades · box + grips · note card · size) | CONFIRMED — `p2-triage.md` §B.2 (two defects designed out) | OBSERVED | CAPTURED (v14) | — | P2 |
| Tile download (bar · honest estimate · `Stop` · failed-tile caveat) | CONFIRMED — coverage-gaps §1 | SOURCE-ONLY | VISUAL NOT VERIFIED | — | P1 |
| Changes on this phone (jade · **rust stuck** · retry · `discardPending`) | CONFIRMED — coverage-gaps §2 (OD-3 approved) | OBSERVED | **VISUAL NOT VERIFIED** — v15's jade is the undefined `.hint-jade` (f20), not the designed card | — | P1 |

### L · Trip settings — 5 rows · 3 confirmed · 2 understood · 3 captured

| Screen/Flow | Design status | Behaviour | Appearance | Open decision | Pri |
|---|---|---|---|---|---|
| Above the fold (`THE TRIP` · **MONEY + provenance** · weather source) | CONFIRMED — P0-2 §6 | OBSERVED | CAPTURED (16, f09–f10) — MONEY's three-across row misaligns at 390: map M-12 | — | — |
| Below the fold (forecast · offline · paste · export JSON · share) | **UNDERSTOOD — NOT YET EXPLICITLY CONFIRMED** | **OBSERVED** | **CAPTURED (f11–f12)** | — | P1 |
| **Empty this trip** (the second confirm exception · the joined-copy base) | CONFIRMED — absence §5 | **OBSERVED** (confirm armed; commit not run) | **CAPTURED (f13–f14)** — the confirm still carries the pre-correction copy: map M-11 | **Yes — OD-6**, may it delete the Log? | P1 |
| Location lookup failed (four rewritten notices) | CONFIRMED — P0-2 §9 | SOURCE-ONLY | VISUAL NOT VERIFIED | — | — |
| No trip open (fallback render) | UNDERSTOOD — `p2-triage.md` §A | SOURCE-ONLY | VISUAL NOT VERIFIED | — | P2 |

---

## 3. Cross-cutting concerns — not rows, designed once

Excluded from the 71 deliberately: each is a rule that applies across rows, and counting them would double-count the rows they govern.

| Concern | Status |
|---|---|
| **Pending / loading** | CONFIRMED — P0-5, eleven rules, **eighteen** labels (X-4), zero CSS |
| **Destructive actions** | CONFIRMED — swipe → in-row confirm → 6s undo, with **the confirm-button test** and exactly two exceptions (audit §8) |
| **Undo** | CONFIRMED — one app-wide bar; the label names the thing (status-vis §3) |
| **Empty states** | CONFIRMED — three tiers, the shared-kinds limit, and the first real application in dest-tabs §3 |
| **Warning strips** | CONFIRMED — fact-first, four kinds, three slots, two invariants; one presentational reuse outside `dayIssues()` (audit §7) |
| **Shared / joined identity** | CONFIRMED — P0-1, five surfaces, the marker yields to sync warnings |
| **Currency** | CONFIRMED — P0-2; **seven** `\|\| '¥'` fallbacks plus one `symbol = '¥'` default parameter = **eight sites** (RC-19, reworded X-10) |
| **A form that refuses** | CONFIRMED — dest-tabs §6, canonical app-wide, four call sites |
| **Navigation return** | CONFIRMED — **PR-2**: a return lands on the thing the action was about (audit §9) |
| **The app never invents** | CONFIRMED — **PR-1**: no stock photo, no avatar, no placeholder person, no approximate position (audit §2) |
| **Long content & CJK** | CONFIRMED — S-2 (Latin-first on `body`), plus the per-surface cases in every document's self-audit |
| **Focus / keyboard** | IMPLEMENTATION-ONLY / LEGACY — `input:focus` only; extending it is one rule, scheduled not designed (`p2-triage.md` §A) |
| **Reduced motion** | IMPLEMENTATION-ONLY / LEGACY — partial; P0-5 R3 means the surface only shrinks (`p2-triage.md` §D) |
| **Permission / access failure** | CONFIRMED — absence §6 (mid-session) + the existing dead-link endings (cold open) |
| **RTL** | OUT OF SCOPE — no claim made (P0-3 §2.3) |
| **Responsive** | OUT OF SCOPE — one mobile layout, 520px cap |
| **Dark mode** | OUT OF SCOPE — `color-scheme: light` |

---

## 4. Remaining design risk, ranked

**This is the section to read if you read only one.** Risk is *what an implementer could still get wrong*, not what is unpainted.

### 4.1 Must be settled before implementation — 4 items

| # | Item | Why it blocks |
|---|---|---|
| 1 | **OD-6** — may `Empty this trip` delete the shopping list, packing list and Log? | The confirm now names the consequence; whether the *capability* should exist is a product call, and the answer changes what `clearTripContent()` does. |
| 2 | **The forced jump to Paste** after creating a trip (§A row 3) | Existing behaviour, never decided. Every currency string in P0-2 §5 works either way, so it is not a blocker for P0-2 — but it is the first thing a new user experiences. |
| 3 | **`.hint-jade` is undefined in `app.css`** (IF-10) | Two screens reference it and two approved specs assume it. One rule, first in the CSS queue, not last. |
| 4 | **`removedFromTrip()` has no caller** (IF-9) | `.gone-card`'s corrected copy is unreachable until a detector exists. The rule is specified; the trigger is not built. |
| 5 | **One new design ambiguity, found by verification** | An **end time before the start** (demo Day 3: `13:45` → `09:00`) yields a derived length of `19h 15m`. `parseClock` accepts both values, so `not a time` never fires — the approved design covers *unparseable* input, not an *inverted window*. **One line of design, not a pass:** rejection, overnight window, or a warning-strip case (`ENDS WHEN IT STARTS` is the cheapest precedent). |

**Everything else the readiness audit found is an implementation defect, not a design gap** — sixteen of them, classified and ordered in `implementation-readiness-map.md` §3 and §6. Three are on approved surfaces whose code contradicts the approved design (M-4, M-5, M-8); none of them changes a design decision.

### 4.2 Safe to defer — the honest list

| Item | Why deferring is safe |
|---|---|
| **OD-7** — should a blank map say *why*? | Recommendation is no; the designed card works either way. |
| **OD-8** — install / first run | A whole flow, and it needs scope input before design. Nothing else depends on it. |
| **Spend report and Trip prep** (§G rows 4–5) | **The largest un-reviewed surface left**: two full screens, understood, captured above the fold only, never design-reviewed. Nothing about them is *undecided* — the currency rule and the empty-state tiers both apply — so they are a review pass, not a design pass. |
| **Log — populated** and **the Note editor** | Same shape: understood, captured, never reviewed. The note editor's "no explicit save state" is the app-wide commit-on-`change` pattern, not a local gap. |
| **Trip settings below the fold** | Unrendered, not undecided. |
| **Trip file import's receipt** | Revisit when Paste's `done` screen exists, or there will be two receipts. |
| **`manifest.webmanifest`** | A chore with no design content. |
| **Everything in `p2-triage.md` §D and §E** | 17 items, each either intentional or invisible to users. |

### 4.3 Verification, not design — the cheapest remaining unit of work

Ordered by cost. **None of it is design, and all of it reduces the 32 `VISUAL NOT VERIFIED` rows.** Items 1–3 were **done in the readiness audit (5/6 Sep)** — see §0.3.

1. ~~**Destination's five populated panels**~~ — **DONE** (f01–f08). All five seen populated and below the fold. Found: `tab` never resets (map M-8), the `|| '¥'` fallback live on the Shop panel (M-9), and four bare `.empty` one-liners where three tier-3 empties belong (M-10).
2. ~~**Trip settings below the fold · `Empty this trip`**~~ — **DONE** (f09–f14). Found: the MONEY row misaligns at 390 (M-12) and the confirm still carries the pre-correction copy (M-11). **The cover picker and the trip-file path remain unverified.**
3. ~~**The Plan's edit-mode states**~~ — **DONE** (f15–f19), the highest-value item in the whole list. Found: the archive card renders **white-on-white** (M-4) and the archived / lane swipe-delete is a **no-op** because of escaped attribute markup (M-5). **A real drag and a mid-gesture swipe remain unverified** — both need a pointer gesture, not a tap.
4. **The rust stuck state** — **structurally needs a configured-but-unreachable Firestore.** `sync.track()` queues nothing on the localStorage backend. Still the hardest thing to see in the product.
5. **The sharing round trip on the emulator** — `firebase.emulators.json` exists; this is no longer blocked on a second account, only on a shell process. *(Closes the `published/{code}` rules, real propagation, `opens`, and the removal detector's trigger.)*
6. **The emailed-link return leg** — needs a real auth backend. Still blocked.
7. **Newly on this list:** the three Destination editors and the four silent-refusal call sites (one tap each, no backend) · Nearby's three empty variants (needs an emptied trip) · Spend's day bars and category stack (needs more than one purchase in the demo data).

---

## 5. The canonical documents — which one is current for what

An implementer reads **one** document per surface. Where two overlap, the later one wins and says so.

| Document | Canonical for |
|---|---|
`p0-1-role-and-copy-identity-design.md` | roles, the joined-copy marker, the arrival banner, the `read` send block. **Its §4.1 offer-phase *placement* is superseded by share-flow §3 (B-11); its copy is not** (X-6) |
`p0-2-currency-design.md` | currency inference, the derived line, provenance, the no-currency rules. **Eight fallbacks, not seven** (RC-19) |
`p0-3-system-sign-off.md` | the *status* of the four early systems; empty-state tiers; the fact-first warning strip |
`p0-4-review-design.md` | Review, end to end. Extended (not changed) by the bulk-actions refinement and share-flow §6 |
`p0-5-pending-work-design.md` | pending and outcomes. **Eighteen labels, not sixteen** (X-4) |
`p1-share-join-review-flow-design.md` | the whole Share → Join → Review round trip and its seams |
`p1-paste-review-design.md` | Paste, input to done |
`p1-review-bulk-actions-refinement.md` | Review's staged foot and the `finishReview` sequencing |
`p1-coverage-gaps-design.md` | tile download · stuck changes · sub route · cross-tab sync. **Its §5 rank order is superseded by status-vis §2** (RC-16) |
`p1-absence-and-removal-design.md` | removal · the stop that has gone · no position · `Empty this trip` · a refused read |
`p1-plan-editing-design.md` | the Plan's eight interactions, the two-stage destructive ladder |
`p1-account-and-sign-in-design.md` | the account row, the sheet, the return leg, sign-out |
`p1-status-visibility-design.md` | the sync dot, the strip's order, the undo bar, the blank map |
`p1-destination-tabs-design.md` | Destination's five panels, the three editors, **the silent-refusal rule** |
`p2-triage.md` | every P2 item's class, and the three small specs inside it |
`cross-flow-consistency-audit.md` | the eight contradictions, two synthesised principles, eleven ambiguities |
`implementation-readiness-map.md` | **the implementation contract** — what is approved, what exists, what must change, what must not be touched, the technical findings and the dependency order |
`final-implementation-readiness-review.md` | **the readiness verdict** and the four open decisions. Read it before anything else |

**Superseded in whole or part, do not implement from:** `new-feature-design.md` §3 (the warning strip — superseded in full) and §4.5 (stacked sides are the default) · `existing-ui-audit.md`'s Trip-settings close/delete claim · `verification-sprint-p0-6.md` §1.8's join-preview mechanism (RC-1) · every claim in §0.2 above · **`p1-plan-editing-design.md` §6's claim that the archive card is already dark (X-11)** · **`p1-destination-tabs-design.md` §2's claim that the panel selection resets on a screen change (X-12)** · **the phrase "eight `\|\| '¥'` fallbacks" wherever it appears — there are seven, plus one `symbol = '¥'` default parameter, making eight *sites* (X-10)**.

**One process rule, restated because it has been broken repeatedly:** the markdown is canonical and an artboard illustrates it. Any string on an artboard that is not in a design document's copy section is drift, and is a bug in the artboard rather than a decision.
