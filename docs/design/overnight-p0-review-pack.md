# Overnight P0 Review Pack — 5 Sep 2026

**Read this first. Everything else is detail behind it.**
Four batches ran overnight against the working tree in this project (`web/**`). **Design only: no application code was changed, no behaviour was modified, nothing was refactored.** Five new design documents, three new artboards, two existing documents annotated.

---

## 1. Executive summary

P0-2, P0-3, P0-4 and P0-5 are designed and written up. The four already-designed systems are reconciled against the current source and formally statused: **31 approved, 4 needing your decision, 6 deliberately deferred**.

Reading the source rather than the earlier documents changed three of the four batches materially:

- **Currency (P0-2).** The failure copy tells the user to fix the currency on Trip settings, and **Trip settings cannot fix it** — `updateTrip()` re-geocodes a changed city but never re-derives currency. Meanwhile an unset currency is not neutral: every money consumer falls back to `'¥'`, so a trip whose lookup failed prices itself in the demo trip's yen and converts at 1:1. The design fixes the *reporting* (the guess and its failures are shown in the New trip modal, before Create) and the *rendering* (no currency → no symbol, and the summary says so).
- **Review (P0-4).** Two-way diffing produces **three reachable rows that name the other person as the author of your own work, and one of the two buttons destroys it**: your edit reverted, your deleted stop re-added, your new stop deleted with no undo. Three-way diffing removes all three from the list. The base it needs is one blob per trip — and the *sending* side already keeps exactly that blob and diffs against it, so this makes the two sides symmetric rather than adding a mechanism.
- **Pending work (P0-5).** Turned out to be a convention, not a component: **zero CSS additions**, sixteen labels, and one rule — pending belongs to the control, outcomes belong to the screen. Three of the actions the brief listed are **synchronous** and must *not* get a pending state.

Nothing you previously approved was overturned. One earlier *recommendation* was narrowed, and it is flagged as such (**A-1** below).

---

## 2. What was designed

| Batch | Deliverable | Covers |
|---|---|---|
| **1 · P0-2** | `docs/design/p0-2-currency-design.md` + `P0-2 Currency Identity.dc.html` | Where the guess appears · the six states of the derived line (idle / pending / resolved / no-currency-known / not found / offline) · Create never gated · correction from Trip settings, with re-derivation as an offer that never overwrites · the interaction with existing pricing · exact copy · every loading, error and empty state |
| **2 · P0-3** | `docs/design/p0-3-system-sign-off.md` (+ annotations on two existing docs) | The four designed systems reconciled and statused · the three causes of emptiness defined against the source · the warning-strip contradiction resolved · six of `new-feature-design.md`'s eight open questions closed from source · ten corrections to earlier documents |
| **3 · P0-4** | `docs/design/p0-4-review-design.md` + `P0-4 Review.dc.html` | Three-way semantics as an eleven-case table · the stacked 390px row · the rename title · `YOURS`/`THEIRS` settled · immediate writes plus the existing undo bar · the conflict case · sticky-foot bulk with a safety rule · five completion states and a receipt that survives navigation |
| **4 · P0-5** | `docs/design/p0-5-pending-work-design.md` + `P0-5 Pending Work.dc.html` | All nineteen async and pseudo-async call sites audited · eleven rules · sixteen labels · the three cases that must get nothing · cancellation, navigation, double-tap, accessibility |

---

## 3. What was approved or inherited from previous work

**From you, and treated as settled:** role enforcement stays and the UI represents it · the joined-copy marker (Alternative 3) · the marker is not on all five tabs and no omnipresent bar is invented · the marker yields to sync warnings · the fact-first warning strip and its CJK wrapping behaviour · `removePerson()` stays a recorded finding and is not fixed in this phase.

**Inherited design principles, applied unchanged in all four batches:** the semantic colour contract (jade given · amber yours/uncertain · ink act · rust broken) · "a warning always names the tap that fixes it" · never make a person the subject of a negative verb · one ink primary per screen · no new component families · 390 × 844 as the primary constraint · existing inconsistencies are preserved, not standardised.

**From `new-feature-design.md` §4, kept for Review:** the four-question hierarchy, the title naming the subject, jade for theirs, day grouping, written absent sides, verb-matched buttons, the delta chip, progress in the push sub, `.review-foot`, and the receipt.

---

## 4. New design decisions made autonomously

| id | Decision |
|---|---|
| **A-1** | The New trip modal shows the guess as a **derived amber line** under the city field, **not** as an editable `input.guessed` field. This **narrows** the P0-2 brief's recommendation; reasons in `p0-2-currency-design.md` §8A. The disclosure requirement is met in full. |
| **A-2** | The currency lookup is triggered by the **city field's `change`**, not by Create — so the outcome is on screen before the decision to create. |
| **A-3** | Create is **never gated** on currency, in any state, including offline. |
| **A-4** | "Located, but no currency known" is treated as a **real fifth state** and gets a notice. Today it writes nothing at all. |
| **A-5** | Re-derivation on Trip settings is an **offer** (`Kyoto is in Japan. Price this trip in ¥ JPY?`) when a currency is already set, and a silent adoption when it is not. Money the user typed is never overwritten. |
| **A-6** | Review keeps `YOURS` / `THEIRS`. `ANA'S` / `MINE` is **rejected** on the CJK evidence already accepted in P0-1 §5 — a name-bearing 9.5px uppercase key is script-dependent by construction. |
| **A-7** | The Review card title is **the subject as you know it** (base name → yours → theirs). Closes D-5. |
| **A-8** | Stacked sides become the **default** at 390px, not an over-60-character overflow case. |
| **A-9** | Review decisions join the **existing app-wide 6s undo bar**; a row returns to the list when its decision is undone; bulk gets one undo for the batch; `finishReview` is not undoable. Closes D-2. |
| **A-10** | The conflict case keeps **two buttons** plus one rust line naming what leaves. No merge editor, no third control. |
| **A-11** | **`Take all of theirs` is removed** and replaced by `Take the n you have not touched`. This changes an existing control, and the reason is in the table below. |
| **A-12** | Pending work: **no spinner, no indeterminate bar, no toast, no skeleton, no overlay** — a label swap plus the existing disabled state, and `.amber-note` reserved for outcomes. |
| **A-13** | Synchronous actions (`Send n changes`, `Read it`, Review decisions) get **no pending state**. |
| **A-14** | A pending label **never interpolates user data** (`Creating {name}…` → `Creating…`). Four strings; the one place P0-5 overrides existing copy. |
| **A-15** | Frame 1A's second action becomes **copy, not a control** — there is no join-by-code screen in the app for it to lead to. |
| **A-16** | Tier 3 on a **stopless** shared day offers **no action** — `dayTimeline()` cannot produce a lane without stops. |

---

## 5 & 6. Genuine OPEN DECISIONs, with recommendations

Five, and one of them is the big one. Everything else above is a UX or copy call and is made.

| ID | Decision | Recommendation | Why | Needs my approval? |
|---|---|---|---|---|
| **R-1** | **Retain a last-reconciled snapshot per trip so Review can diff three ways.** | **Yes — retain it.** | It removes three reachable rows in which the app credits your own work to somebody else and offers to destroy it. One blob per trip; the sending side already stores exactly this and diffs against it, so the two sides become symmetric. Legacy trips degrade honestly to today's two-way diff with a stated label. | **YES — everything in P0-4 rests on this** |
| **C-1** | With no currency set, do money figures show a **bare number**, or should money be hidden until a currency exists? | **Bare number**, with one amber line on the two screens that summarise money. | A number with no symbol is still true; hiding shopping estimates punishes the user for a failed lookup. The alternative is defensible only if unlabelled money is worse than absent money — a product-policy call. | **YES** |
| **S-3** | Review's bulk safety rule: **a bulk action may never decide a row where both of you changed the same thing.** | **Adopt it.** | It is what lets bulk actions exist at all without breaking one-decision-per-difference. `Keep all of mine` stays available for everything (it changes nothing on your copy); `Take the n you have not touched` applies only where taking costs you nothing. | **YES** |
| **S-2** | Does the Latin-first font stack apply to **place names only**, or to **`body`**? | **`body`.** | Public Sans has no CJK glyphs, so *every* CJK string in the app already renders from an accidental system fallback — not just names. One line at the end of `app.css` makes existing behaviour deliberate, and Latin-first keeps digits, times and badges on Public Sans. | **YES — one line, wide effect** |
| **S-1** | Sign off the **three tier-3 sentences** — the only place the product names another person. | **Approve as written.** | They already obey the rule P0-1 inherited: the copy is the subject of the first sentence, the person appears only with a positive verb. Rewriting risks reintroducing blame. | **Yes, but it is a two-minute read** |

**Also worth one look, though I have decided them:** **S-4** (a stopless shared day has no action — accept, the alternative is a behaviour change to make one empty frame less quiet) and **A-11** (`Take all of theirs` removed — under three-way it would silently discard your own edits on exactly the rows the screen exists to protect).

---

## 7. Files created or updated

**Created**

| Path | What |
|---|---|
| `docs/design/p0-2-currency-design.md` | canonical currency design |
| `docs/design/p0-3-system-sign-off.md` | canonical status of the four designed systems |
| `docs/design/p0-4-review-design.md` | canonical Review design |
| `docs/design/p0-5-pending-work-design.md` | canonical pending-work design |
| `docs/design/overnight-p0-review-pack.md` | this file |
| `P0-2 Currency Identity.dc.html` | artboard — modal states, Trip settings, unset-currency rendering, the non-obvious-currency countries |
| `P0-4 Review.dc.html` | artboard — full frame, the eleven cases, before/after row, undo bar, foot states, five completion states |
| `P0-5 Pending Work.dc.html` | artboard — before/after "Opening…", every control's pending state, real progress, the do-not-add cases |

**Updated (annotation only, no design changed)**

| Path | What |
|---|---|
| `docs/design/new-feature-design.md` | a reconciliation banner at the top and a SUPERSEDED note on §3. Its body is otherwise untouched. |
| `docs/design/multilingual-warning-strip-design.md` | a status line: fact-first is approved and canonical. |

**Not touched:** `existing-ui-audit.md`, `existing-ui-visual-reference.md`, `p0-decision-brief.md`, `verification-sprint-p0-6.md`, `p0-1-role-and-copy-identity-design.md`, `ui-ux-design-coverage.md` (its P0 numbering conflict is recorded, not edited — see §9), and every file under `web/**` and `firebase/**`.

**Artboard convention:** the established one — a `.dc.html` at the project root, 390 × 844 frames or 390px-wide crops, canvas mode. `docs/design/screens/` holds captured screenshots of the *running app*, and nothing was captured this session, so nothing was added there.

---

## 8. Source findings that affect future implementation

Recorded, not fixed. Each was verified this session.

1. **`trip.currencySymbol || '¥'`** in `shop.js`, `spend.js`, `dest.js` (×2), `trips.js` (×2) and `store.js` `dayChips()`; **`homeCurrencyCode || 'RM'`** and **`homeCurrencyRate || 1`** alongside them. An unset currency renders as yen and converts at parity.
2. **`updateTrip()` never re-derives currency.** Currency is derived only inside `createTrip`, so the remedy two failure notices prescribe cannot work.
3. **`createTrip` writes no notice** when a city is located but its country has no currency row (`aw`, `cw`, `pr`, `re`, `bm`, and anything Nominatim returns without a country code).
4. **Create is already network-blocking:** `createTrip` awaits `geocode` and `fetchRate` *before* the trip exists, with the modal already closed and the app about to jump to Paste.
5. **The two-way diff mislabels three cases** (`I changed it`, `I removed it`, `I added it`) and offers a destructive button on each.
6. **Review decisions do persist** (`trip.declined`, filtered by `pendingUpdate()`); what is not recorded is *which way* you decided, and the only count is `let done = 0` at module scope in `review.js`.
7. **`.review-foot` is defined in `app.css` and unused** by the screen.
8. **`rememberUndo(label, restore)` is app-wide and already used four times** — and never by Review.
9. **`dayTimeline()` cannot produce a lane on a day with no stops**, and says so in its own comment.
10. **There is no join-by-code UI.** A join is reachable only via a `/j/{CODE}` path or `?screen=join`; nothing in the app calls `openLink`.
11. **`removePerson()` guards only against removing the owner**, not against a non-owner calling it. **Recorded and not fixed, per your instruction.**
12. **`myRole()` / `isOwner()` / `canPublish()` are exported from `store.js` with zero call sites outside it** (carried from the P0-6 sprint; unchanged).
13. **The Paste save button is the only control in the app that disables itself while busy** — it is the model P0-5 generalises.
14. **`share.js` exports `possessive()`** ("Ana's" but "Your"), unused by Review. Available, and deliberately not used (A-6).
15. **Snapshots already carry currency**, and `joinTrip()` already adopts it — so a joined copy's money is *given*, which is what P0-2's third provenance line says.

---

## 9. Contradictions discovered and resolved

| # | Contradiction | Resolution |
|---|---|---|
| 1 | **Two incompatible warning-strip designs.** `new-feature-design.md` §3 puts a relation word, the name and a time on one flex row and keeps a consequence sentence; the multilingual document makes the relation the label, gives the name its own 13px ink line, and drops the sentence. | **Fact-first wins** (you confirmed it; it is also the only structure whose height does not move with script or name length). `new-feature-design.md` §3 marked SUPERSEDED in the file itself. |
| 2 | Frame **1A** offers "arrive by link" as a way forward. | No such destination exists in the app. Becomes a copy line (A-15). |
| 3 | Frame **1F** offers `+ Plan free time here` on an empty shared day. | `dayTimeline()` refuses it. Tier 3 there has no action (A-16). |
| 4 | §4.5 stacks Review's sides only above ~60 characters. | Verification measured *every* value wrapping at 390px. Stacked is the default (A-8). |
| 5 | §7.2 and coverage §3A.4 imply Review decisions are lost on navigation. | They persist; the *direction* is unrecorded. Corrected in `p0-3-system-sign-off.md` §3.3. |
| 6 | **`ui-ux-design-coverage.md` §6 numbers the P0 items differently** from `p0-decision-brief.md` (coverage P0-1 = brief P0-3; coverage P0-7 = brief P0-2). | **The decision brief's numbering is canonical** — P0-1 role/identity, P0-2 currency, P0-3 sign-off, P0-4 Review, P0-5 pending, P0-6 verification, P0-7 paste. Recorded; the coverage file is not edited, to avoid touching a document nothing in this batch depends on. |
| 7 | The P0-2 brief recommended an editable `input.guessed` currency field in the modal. | **Narrowed**, not reversed: the guess is still shown before Create, as a derived line. Flagged as A-1 rather than applied quietly. |
| 8 | `Take all of theirs` exists today and three-way makes it unsafe. | Removed and replaced (A-11), with the reasoning stated in `p0-4-review-design.md` §6.2. |

---

## 10. Recommended next design phase

1. **P0-7 — the paste review pass.** The only P0 with a live UX question and no design, and it now has a captured frame: ten controls in a ~170px row, eight rows deep, behind a tick-every-row gate. Decide the gate with the frame in hand.
2. **The send-update / post-send state.** The last hole in the sharing round trip: what the sender sees after `Send n changes` (P0-1 §12.2), plus **D-3** (the "What they get" card appears only *after* a link exists) and **D-1** (what `Later` on the update banner does). Three small decisions, one screen, and they finish the flow P0-1 and P0-4 opened.
3. **Then implementation, in this order** — cheapest and most independent first: **P0-5** (zero CSS, touches the most screens) → **P0-2** (independent of the sharing cluster) → **P0-4** (needs the base field, so it wants a clear run) → the empty-state and warning-strip systems.
4. **Not yet:** the P1 set (Destination's four unseen tab bodies, the sub route's `ok`/`tight` variants, the warning-strip slot's arbitration, the two confirm-button destructive actions) and the P2 cosmetics. Nothing in this batch depends on them.

---

## Tomorrow morning

**Read:** this file. Then, if you want the reasoning, `p0-4-review-design.md` §1.1 (three paragraphs — the three rows two-way diffing gets wrong) and `p0-2-currency-design.md` §1.3 (the two currency defects). The three artboards are illustrations; you do not need them to decide.

**Approve or amend five things:**

1. **R-1 — three-way Review, with a retained base.** Everything in P0-4 rests on it.
2. **C-1 — bare numbers when a trip has no currency** (recommended), or hide money until one is set.
3. **S-3 — bulk actions never touch a row you both changed** (recommended).
4. **S-2 — the Latin-first font stack goes on `body`** (recommended), not just place names.
5. **S-1 — the three tier-3 sentences**, as written (a two-minute read).

**Glance at, but I have decided:** A-1 (the guess is a derived line, not an editable field — a narrowing of an earlier recommendation of mine), A-11 (`Take all of theirs` is removed), A-16 (a stopless shared day gets no action).

**Nothing was implemented, and nothing in `web/**` changed.** Say the word on the five and I can either move to P0-7 and the post-send state, or start implementing in the order in §10.
