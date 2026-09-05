# P2 triage — what needs design before implementation, and what does not

**Date:** 5 Sep 2026 · **Verified against** the working tree in this project (`web/**`), read this session
**Status:** triage, for review. **Nothing implemented. No application code changed. Only three items in this document are designed, and they are marked.**
**Purpose:** stop P2 consuming design time it does not need, while making sure nothing in it hides a UX decision the implementation phase would have to invent an answer to.

**Method.** Every P2 row in `ui-ux-design-coverage.md` §2, §3 and §6, plus the eleven P2 implementation notes from `verification-sprint-p0-6.md` §5 and the sixteen classified inconsistencies in coverage §4, put into one of five classes:

| Class | Means | Count |
|---|---|---|
| **A** | Already sufficiently defined by existing patterns or an approved system | **17** |
| **B** | Needs a small design specification before implementation | **5** (3 designed here, 2 deferred with reasons) |
| **C** | Needs a full UX design | **1** |
| **D** | Safely deferred until after implementation | **11** |
| **E** | Out of scope, or legacy that should stay as it is | **6** |

**40 items.** The useful number is not the total: it is **six** — the five B items and the one C item. Everything else is either answered, or answered by leaving it alone.

---

## A · Already defined — 17 items, no design work

Each row names *what* defines it, so the claim is checkable rather than reassuring.

| Item | Defined by |
|---|---|
| **Boot cover** (bone + `MC` mark, fade) | Existing and captured. It is the app's only splash and there is nothing to decide. |
| **`.boot-error` rust card** | The rust idiom (P0-5 §4: "the existing rust idioms where they already exist"). A boot failure is broken, rust says broken, the card names the reload. |
| **Cross-tab sync** | `p1-coverage-gaps-design.md` §4 — designed as **a deliberate nothing**, with the one requirement that the stuck screen re-derives its header. |
| **Archive card** | `p1-plan-editing-design.md` §6 — **and it was mis-classified as P2.** It is half the app's destructive model (RC-10), and it is recorded, not designed. |
| **Add / correct a shopping item** | `p1-destination-tabs-design.md` §5 (the editor, recorded) + §6 (the refusal rule) + P0-2 §7.1 (the currency). Three approved systems, no gap left. |
| **`.hint-jade` undefined in `app.css`** (IF-10) | P0-1 §8 already states its full recipe (`--jade-bg` / 1px `--jade-bd` / r16 / 14px pad, `.eyebrow.jade` head, 12.5px/1.5 `--jade-fg` body). The class needs writing, not designing. **It blocks two approved specs, so it is first in the implementation queue, not last.** |
| **`.review-foot` defined and unused** | P0-4 §6.1 uses it; Paste already uses it correctly (RC-3). |
| **`.archive-moved` defined and unused** (IF-15) | `p1-plan-editing-design.md` §6.3 gives it its string. |
| **`.arrived` defined and unused** | P0-1 §7 gives it its two branches. |
| **`0 waiting · oldest 1 Sept`** | `p1-coverage-gaps-design.md` §2.1 — one condition, not two. |
| **Join bar truncation · from-line wrap · "a look at it" collision** | `p1-share-join-review-flow-design.md` §4.1, §4.2, §4.5 — all three designed out structurally (B-9). |
| **`and 0 more days`** (IF-5) | Same document §7: `.join-more` is omitted at zero. |
| **The paste `.progress` bar** | `p1-paste-review-design.md` §5 — removed and replaced by a count. |
| **Trip settings, no trip open** (fallback render) | Tier 2, the existing `.empty` block. The cause is that no trip is open and the way out is the trips home, which is one tap above it. No new sentence is worth a design pass; if the fallback ever gets copy it takes the tier-2 grammar. |
| **Focus rings** | **E**-adjacent but resolved: `input:focus` already gets a jade border (`app.css` 104). Extending it to buttons is a single rule, and coverage §4.10 already classifies it as *UX-impacting: schedule, don't fix in passing*. No design decision remains — only a decision to do it. |
| **Two amber recipes** (`#FBF1DE` banner vs `#FFFDF7` paper) | Coverage §4.9: **intentional** — they are different objects. Confirmed again this session (`.plan-card.sub`, `.cand.worked` and `.caveat` all use the paper; every banner uses the surface). |
| **Four label families, ten one-off chips** | Coverage §4.4: **intentional, do not merge.** Re-confirmed: `.pill` picks, `.cat` filters, `.chip` states metadata, `.badge` states provenance. Four jobs. |

---

## B · Needs a small specification — 5 items

### B.1 The trip cover picker — **designed here**

The only P2 item with a real unrendered flow. Verified in `trips.js`: `covering` opens a `coverSheet()`; photos come from the trip's own Log; tints are the fallback; there is a refusal (`Open this trip first to change its cover.`), a pending (`Shrinking it…`) and a failure path.

Three specifications, all from approved systems, no new anything:

1. **The refusal is not pending.** `busy = 'Open this trip first to change its cover.'` shares a variable with pending work; P0-5 §3 already carves it out as a **refusal** that stays an `.amber-note`. Recorded, not changed.
2. **`Shrinking it…` goes on the file label**, disabled — P0-5 row 5. Already in P0-5's table; named here so the cover screen is not missed when that table is worked through.
3. **The fallback is a tint and a mark, never a stock photo** — `trips.js`'s own header states this (*"the app cannot invent one … never a stock photo of somewhere you have not been"*). It is a **product principle discovered in P2** and it is worth promoting: it belongs beside the empty-state rules. Recorded as **PR-1** in the consistency audit.

**Nothing else about the cover picker needs design.** It is a grid of photos the user already took.

### B.2 Draw-an-area's two layout defects — **designed here**

Both from the P0-6 sprint, both cosmetic, both one-line fixes, and both worth specifying because a developer would otherwise guess:

| Defect | Specification |
|---|---|
| `.area-note` overlaps the top-left grip — *"the first thing the copy tells you to drag is partly under the copy telling you to drag it"* | The note card moves to the **bottom-left** of the map column, above the sheet, clear of all four grips. Nothing else moves; the box, the grips and the sheet are untouched. |
| The OSM attribution renders **inside** the dimmed `.area-shade`, half-obscured | The attribution moves **below** the shade, into the sheet's top edge, where every other Leaflet screen in the app already puts it. It is a legal requirement, so it must be legible, and this is the only reason this defect is not class D. |

### B.3 The role chip on Share manage (D-7) — **designed, and it was already answered**

*"The role chip is a control dressed as metadata (`.chip`). Does it stay a chip?"*

**It does, and P0-1 §4.2 already resolved it:** the chip gains `icon.caret` for an owner, and a non-owner gets a flat `.badge` instead. Caret = you can change it; no caret = you cannot. `p1-share-join-review-flow-design.md` §3 (B-11) then moved the role *choice* into the invite sheet, leaving the chip as a per-person control on the manage list, which is exactly what a chip-with-caret is for. **D-7 is closed by two approved documents and needs nothing further.**

### B.4 Trip file import (JSON) — **deferred, with a reason**

`Reading x…` → ok / rejected-with-reason → `Making x…` → a new trip. Verified as fully built with a real failure branch (`readTripFile` returns a reason). P0-5 rows 6 and 7 already place both pending labels on their controls.

**Deferred because the one thing it lacks is a receipt**, and the receipt it should have is Paste's `done` screen — which is designed (`p1-paste-review-design.md` §8.3) and not yet implemented. Designing a second receipt before the first exists would produce two. **Revisit when Paste's done screen lands**; the specification is then one sentence.

### B.5 `manifest.webmanifest` — **deferred, and it is not a design item**

Referenced by `index.html`, absent from the repository, with three Android/maskable icons committed. Coverage §4.14 calls it *"UX-impacting, and now clearly unfinished — write the manifest"*, and that is right. **There is no design decision in it**: the name, the two colours and the icons are all already fixed by the app. Deferred to implementation as a chore, listed here so it is not lost.

---

## C · Needs a full UX design — 1 item

### C.1 Install and first run on a phone

The only genuine gap in P2, and it is the one nobody has looked at. Three facts, each verified:

- Three Android install icons are committed and the manifest is not, so **install is intended and half-built** (coverage §0.2).
- `sw.js` exists, so the app is meant to run offline from the home screen.
- **Nothing in the product mentions installing it**, and the app's whole proposition — *it works with no signal* — is only fully true once it is installed.

That is a flow with a trigger, a state and a promise, and none of the three is designed: when is it offered, what does it say, what happens if it is declined, and what does the app look like the first time it opens with no browser chrome and no trips.

**Not designed in this batch, and it is the honest reason:** it is a **new user-facing flow**, not a P2 cosmetic, and it needs the user's input on scope (Android only? iOS "Add to Home Screen" too, which cannot be prompted?) before anything is drawn. **Raised as OD-8** with a recommendation: one line on the trips home, once, after a second launch — not a prompt, not a banner, and never on a first visit.

---

## D · Safely deferred until after implementation — 11 items

Each of these is real, none of them changes a model, and every one of them is cheaper to settle against running code than against a document.

| Item | Why deferring is safe |
|---|---|
| **Partial `prefers-reduced-motion`** (honoured for swipe + the sync ring, ignored for sheet settle, pin focus, boot fade) | Three CSS media-query additions with no design content. The design position is already stated: P0-5 R3 means nothing new animates, so the surface only shrinks. |
| **14 radii for "a card"** | Coverage §4.5: accidental but harmless. Normalising touches every screen for no user-visible gain. |
| **Six-plus control heights** | Same. And P0-5 §4 depends on heights *not* moving during a label swap, which is already true. |
| **Half-pixel type scale, ~20 body sizes** | Coverage §4.3: **intentional in effect** — the density is the design language. |
| **Font weights 550/650 not loaded** | Synthesised, visually stable, and 650 is load-bearing in a dozen approved specs. Loading a real 600 would change the look of the app. **Leave it.** |
| **Danger colour hardcoded beside its token** | One string. |
| **~20 recurring un-tokenised colours** | Tokenising them changes nothing a user sees. |
| **Two dividers for one job** | Same. |
| **Inline `style=` overrides in screen modules** | A symptom of the control-height spread, not a problem itself, and several of them are load-bearing (the pencil's jade background, the 46px share buttons, the 50px join foot). |
| **Malformed attributes on the Plan sub-route row** | Breaks DOM tooling, not users. Coverage §4.16: fix when that file is next opened — and `p1-plan-editing-design.md` opens it. |
| **Duplicate rule blocks in `app.css`** (incl. `.pick-chip` twice, `.swipe-bin`/`.bin` twice — IF-14) | Cascade order decides the winner and the winner is the intended one. Harmless **until someone edits the losing block**, which is the one thing to watch during implementation. |

---

## E · Out of scope, or legacy that stays — 6 items

| Item | Position |
|---|---|
| **Dark mode** | Out of scope. `color-scheme: light`, no `prefers-color-scheme` rule, and the whole palette is built on one bone background. |
| **Responsive beyond one mobile layout** | Out of scope, confirmed intent. 520px cap, one cosmetic breakpoint at 560px. |
| **RTL (Arabic, Hebrew)** | Deferred in P0-3 §2.3 with no claim made. The isolated warning-name line should behave; it has not been seen. **Do not claim support.** |
| **One deliberate `!important`** | Intentional (coverage §4.13). |
| **The app's lack of visible focus on buttons** | Legacy, and it is a *decision to schedule*, not a decision to make (A above). |
| **`window.prompt` on a cross-device email link** (IF-20) | Legacy and correct: the alternative is failing silently. Styling it needs a screen that does not exist. |

---

## The three P2 items that stopped being P2

Recorded because a mis-classified item is worse than an unclassified one — it gets skipped by both the design phase and the implementation phase.

| Item | Was | Is |
|---|---|---|
| **The archive card** | P2, "collapsed archived stops" | **Half the app's destructive model** — `p1-plan-editing-design.md` §6, RC-10 |
| **`.hint-jade` undefined** | not classified at all | **A blocker for two approved specs** — class A by definition (the recipe exists), first in the implementation queue |
| **Install / first run** | not classified at all | **The one C item** — a real undesigned user-facing flow, OD-8 |

---

## Status

| Item | Status |
|---|---|
| 40 P2 items classified A–E, with the defining document named for every A | DONE |
| Trip cover picker | **DESIGNED** (B.1) — three specifications, no new anything; PR-1 promoted |
| Draw-an-area's two defects | **DESIGNED** (B.2) — the note card and the attribution both move |
| The role chip (D-7) | **CLOSED** (B.3) — already answered by P0-1 §4.2 and B-11 |
| Trip file import receipt | **DEFERRED** (B.4) — revisit when Paste's `done` screen exists |
| `manifest.webmanifest` | **DEFERRED** (B.5) — a chore, not a design item |
| **Install and first run** | **NOT DESIGNED — OD-8.** The one P2 item that needs the user before it needs a designer |
| 11 items deferred to implementation, 6 out of scope | DONE, with reasons |
| Three items re-classified out of P2 | DONE |

**One OPEN DECISION is raised: OD-8** — *is installing the app to the home screen in scope, and on which platforms?* Recommendation in the review pack.
