# P1 — Review bulk actions, refined

**Date:** 5 Sep 2026 · **Verified against** the working tree in this project (`web/**`)
**Status:** design, for review. **Nothing implemented. No application code changed.**
**Parent:** `p0-4-review-design.md` — **APPROVED and not reopened.** This document refines one thing: where the bulk actions sit and how they are reached. Everything else in P0-4 (the three-way model, the eleven cases, the stacked row, the title rule, `YOURS`/`THEIRS`, immediate writes plus undo, the receipt) stands exactly as written.
**Artboard:** the `D · Review` section of `P1 Share Join Review Flow.dc.html`.
**Canonical copy:** P0-4 §10, plus the three strings in §6 below, which are additions to it.

---

## 1. What P0-4 already decided, and what is left

**Decided, approved, unchanged:**

- The bulk controls live in the **sticky `.review-foot`** — `flex: none`, 1px `--line` top, white, 12px 16px, buttons h38. (P0-4 §6.1)
- The foot carries a progress line above the buttons: `4 to decide · 2 done`. (§6.1)
- The three-sentence preamble moves under the foot's buttons. (§6.1)
- **`Keep all of mine`** applies to every remaining row including conflicts; **`Take the n you have not touched`** applies only where `mine === base`; **`Take all of theirs` is removed**. (§6.2, A-11, **S-3**)
- When only conflicts remain: `2 left, and you have changed both. They go one at a time.` (§6.2)
- Bulk gets **one undo for the batch**. (§5.2)

**Left open by P0-4, and answered here:** the foot is always on screen, so both bulk controls are permanently in the thumb's reach — **including on the first paint, before a single row has been read.** That is the discoverability fix and it is also the new risk. Three things follow from it.

---

## 2. Q1 — Are two full-width buttons always visible too much?

**Verified problem being solved:** with 6–7 entries the bulk actions sit roughly two screens below the fold, so the cheap way out of a long update is the hardest thing to find (sprint §1.6).

**Verified new risk:** a sticky foot puts a one-tap `Keep all of mine` under the user's thumb *before they have read anything*. On a two-entry update that is the whole screen dismissed by accident.

**Decision: the foot is always present; its contents are staged.**

| State | Foot |
|---|---|
| **Nothing decided yet, and 3 or fewer rows** | progress line only — `3 to decide`. **No bulk buttons.** |
| **Nothing decided yet, 4+ rows** | progress line + one ghost `More` on the right. Tapping it reveals the two bulk buttons in place. |
| **At least one row decided** | progress line + the two bulk buttons, shown. |
| **Only conflicts left** | progress line + `Keep all of mine` + the one-sentence rule. `Take the n…` is absent (P0-4 §6.2). |
| **All decided** | the foot is gone; the receipt is the screen (P0-4 §7.4). |

**Why staged rather than always-shown.** The problem is *reachability*, not *visibility*: the user who wants out of a long update goes looking, and a foot that is always there means they find it in the thumb-zone instead of after two screens of scrolling. Nothing about that requires the destructive-feeling control to be pre-armed on a screen the user has not read yet. One tap of disclosure costs the escaping user nothing and removes the misfire entirely.

**Why 4 as the threshold.** Three rows fit above the fold at 390 × 844 with the stacked layout (~230px per card plus a day eyebrow). If the whole update is on screen, a bulk action saves at most two taps and cannot be the cheap exit that justifies it.

**Rejected: top placement.** The header is where the update identifies itself (`Ana sent an update`), and a bulk control there would be the first thing under the name of the person who sent it — read as "dismiss Ana", which is the framing P0-1 exists to prevent. **Rejected: a scroll-to-end affordance.** It solves reach with a second mechanism where a sticky foot solves it with none.

---

## 3. Q2 — Confirmation

**No confirmation dialog, on either control.** The app has two blocking interactions in total and neither is this. P0-4 §5.2 already gives bulk one undo for the batch, and the app-wide 6s undo bar already exists and is already used four times.

**What carries the weight instead is the label.** `Take the 4 you have not touched` states its scope and its count; `Keep all of mine` changes nothing on your copy and needs no protection at all. Under the P0-4 safety rule the only genuinely destructive bulk action — one that could discard your own edits — **does not exist**.

---

## 4. Q3 — Undo, and what the row list does afterwards

One undo entry per batch, using `rememberUndo`, with the labels P0-4 §10 already fixes: `Kept all of yours` · `Took the 4 you have not touched`.

**Undoing a bulk action returns every row it decided to the list**, in its original order — the same rule as a single row (P0-4 §5.2), applied to n of them. This is what makes the batch undo true rather than partial.

**What it does not undo:** `finishReview`. Today both bulk handlers call `finishReview(waiting.version)` immediately, which sets `tookVersion` and clears the reviewed set — after which the undo has nothing to put back. **Designed: a bulk action decides its rows and stops there.** `finishReview` runs when the list is empty, exactly as it does after the last individual decision (`settle()`), and by then the 6s window has either been used or has closed. This is a sequencing change, not a new mechanism, and without it the batch undo cannot exist.

---

## 5. Q4 — Mixed states, and the counts

The foot's two numbers come from state, never from a counter:

> `4 to decide · 2 done`

- `to decide` = entries not in `trip.reviewed`.
- `done` = entries in it — which under P0-4 §5.4 also records *which way*, so the receipt in §7.3 can list them.
- `Take the n you have not touched` = the count of remaining rows with `stakes === 'free'`. **The label's number is recomputed on every paint**, so it can never promise a scope it no longer has.
- When that count is zero the button is **absent**, not disabled — a disabled control here would assert an action that is not available and never will be on this update.

**A mixed foot is normal**, and it is the state P0-4 §7.3 designed the `See the 2 you have decided` disclosure for. The two live in the same place and do not conflict: the disclosure is under the last card, the counts are in the foot.

---

## 6. Copy — additions to P0-4 §10

Three strings. Everything else the foot says is already canonical in P0-4 §10.

> `More` — the disclosure, ghost, right-aligned in the progress row, 4+ undecided rows only
> `3 to decide` — the progress line before anything is decided (P0-4 already fixes `4 to decide · 2 done` for the mixed case)
> `Nothing was decided.` — the `.amber-note` shown if a bulk action's rows all fail to apply, which `takeChange` can report

---

## 7. Self-audit at 390 × 844

| Case | Behaviour |
|---|---|
| Two full-width h38 buttons + 8px gap | 373px of content width; each button is 182px, enough for `Take the 12 you have not touched` at 12.5/700 to wrap to two lines at worst. **The foot grows; it does not truncate a count.** |
| A three-digit count | Same; the label wraps, the foot is 2px taller. |
| Long day name / CJK entries | The foot is independent of the list; nothing in it carries user data. |
| One entry | Foot shows `1 to decide` and no bulk buttons. |
| Scroller padding | The scroller gets bottom padding equal to the foot's height plus `env(safe-area-inset-bottom)`, so the last card clears it (P0-4 §11.8). |
| Navigating away mid-batch | Decisions are already written; the foot recomputes from state on return. |
| Focus | `More` is a real `<button>`; revealing the bulk row does not move focus. |
| Reduced motion | The reveal is a height change with no transition — the app has no disclosure animation to match. |

---

## 8. Status

| Item | Status |
|---|---|
| Sticky `.review-foot` as the home for bulk | P0-4 §6.1, unchanged |
| Bulk safety rule | P0-4 §6.2 / **S-3**, unchanged |
| **Staged disclosure: no bulk buttons until a row is decided, or behind `More` on 4+ rows** | DESIGNED — this document |
| No confirmation; the label carries the scope | DESIGNED |
| **`finishReview` moves out of the bulk handlers to `settle()`** | DESIGNED — required for the batch undo to work |
| `Take the n…` absent, never disabled, at zero | DESIGNED |
| Three new strings | DESIGNED |
