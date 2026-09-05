# P1 — Remaining coverage gaps, designed

**Date:** 5 Sep 2026 · **Verified against** the working tree in this project (`web/**`), read this session
**Status:** design, for review. **Nothing implemented. No application code changed.**
**Artboard:** `P1 Coverage Gaps.dc.html` — 390px-wide crops, light only.
**Canonical:** this document for the five areas below; §7 is the only source of new copy.

**Source read this session:** `web/js/screens/area.js` (the whole download path) · `web/js/screens/areas.js` · `web/js/screens/stuck.js` (whole) · `web/js/sync.js` `pendingCount` / `pendingTries` / `pendingOldest` / `discardPending` / `clearPending` · `web/js/screens/sub.js` (the stat tiles, the `.loop-row` list, the back-by form) · `web/js/app.js` (the `storage` listener) · `web/js/screens/plan.js`.

**Selection rule.** From `ui-ux-design-coverage.md` §2 and the P0-6 sprint's "still not verifiable" list, the items chosen are the ones that are **user-facing, undesigned, cheap to specify, and likely to produce inconsistent UX if left**. Five made the cut. §8 says what was left and why — deliberately, so the next batch does not have to re-derive it.

---

## 1. Tile download — the missing receipt

**What this is, and where it happens.** A tile is one square of the map image. Keeping an area offline downloads every tile covering it — a few hundred — so the map still draws with no signal. The flow is **Map ▸ Kept maps ▸ an area ▸ Keep this area on my phone**: draw or accept a box, pick a detail level, tap `Keep it`. The bar runs in the area's own screen; the receipt lands on Kept maps, where the download returns to. Nothing else in the app downloads tiles.

**The bar is one card inside the area's own screen** on the Map tab — the kept box stays visible above it, the wi-fi toggle and the detail chips stay usable, and the tab bar stays put. There is no overlay and nothing is blocked: the download is a thing happening in a card, not a state the app is trapped in. The three cards below are that screen's own sections, in order.

**Verified state.** `area.js` already has the good parts: a real `.progress` bar driven by `onProgress`, `12.4 MB of 18 MB · 340 of 620 tiles`, a `Stop` button, a `Wait for wi-fi` toggle with a metered-connection refusal, a stopped notice (`Stopped after 340 of 620 tiles. What arrived is kept.`) and a failure notice from `result.reason`. **This is one of the better-designed flows in the app and it is not redesigned.**

**Three real gaps.**

### 1.1 Success says nothing

On success the handler calls `store.saveMapArea(...)` then `reset()`. The user watched a bar for forty seconds and gets a screen change. Every other completed action in this app leaves a fact behind.

**Designed: a jade receipt on the Kept-maps screen it lands on**, in the existing `.hint-jade`, replacing the "Every stop with a position is inside an area you have kept" line for that one visit:

> `Old Quarter & Harbourside is on this phone. 8 MB · 620 tiles · covers 5 of 7 stops.`

Facts only, all four already computed (`result.bytes`, `result.done - result.failed`, and `coverage()`). It is replaced by the ordinary line on the next visit.

### 1.2 The size shown during the download is an estimate presented as a fact

`tiles.size(busy.total * 26000)` — 26 kB per tile, hardcoded. On a dense city it under-reads badly, so the bar's right-hand number can pass its own total.

**Designed:** the counter leads with the honest number and calls the estimate one.

> `340 of 620 tiles · 12.4 MB so far, about 18 MB` — 11px/700 `--amber-fg`, tabular

### 1.3 Failed tiles are counted and never mentioned

`result.failed` is subtracted from the tile count and disappears. A partly failed area is a map with holes in it, and the user will meet them offline, which is the worst place to find out.

**Designed**, only when `failed > 0`, as a `.caveat` under the receipt:

> `12 tiles did not arrive, so a few corners of this area will be blank offline. Refresh the area on wi-fi to fill them in.`

`Refresh` already exists on the area card, so the sentence names a tap that exists.

### 1.4 What is not designed

The `Stop` button gets **no pending state** — it is synchronous (`stop = true`). The download itself needs none: the bar *is* the state, and it is the one place in the app where a real determinate bar is correct (P0-5).

---

## 2. Stuck changes — the rust state, and the contradiction

**Where this is.** A full-screen sheet reached one way only: the rust warning strip on the Plan tab that says something could not be sent. Every edit is written to this phone first and queued for the cloud; when the queue stops draining — signed out, refused, offline for days — the strip appears and this sheet explains it.

**Structurally unverifiable** on the localStorage backend (the sprint established this; `sync.track()` queues nothing there). Designed from source, and flagged as such.

### 2.1 The self-contradicting header

Verified: the push sub renders `${sync.count} waiting${oldest ? ' · oldest …' : ''}`, and `pendingOldest()` answers from the ledger independently of the count. Reachable copy: **`0 waiting · oldest 1 Sept, 23:05`**.

**Designed: one condition, not two.** The oldest stamp is part of the same fact as the count and appears only with it.

> `0 waiting` — when the ledger is empty
> `3 waiting · oldest 1 Sept, 23:05` — otherwise

### 2.2 The rust waiting state, specified

The screen's own three blocks are right and are kept: `Why they are stuck` (rust, with the reason and a full-width rust `Try sending them now`), `WHAT WOULD BE LOST` as a grouped list with date spans, and the copy-out card. Two specifications it lacks:

**The retry is pending on the control** (P0-5 R1/R2), not in an `.amber-note` at the top of the scroller as today:

> `Try sending them now` → `Trying…` **[disabled]**

and its **outcome** stays in the `.amber-note`, which is exactly what amber is for:

> `Still 3 waiting. The cloud refused them: not signed in.` · `All sent.`

**The reason is never absent.** `sync.reason` can be empty, and the fallback (`The cloud has not accepted them yet.`) is already in the source and is correct. Keep it; it is honest about not knowing.

### 2.3 `discardPending` — the destructive-pattern exception

Verified: it is irreversible, uses an inline rust confirm with "This cannot be undone", and is one of the app's two exceptions to swipe → in-row → 6s undo.

**Decision: it stays an exception, and the exception is made explicit rather than removed.** Reasons in the hierarchy's order: it is existing behaviour; it destroys something that cannot be reconstructed (a queue of writes, not a row you can retype); and a 6s undo bar is a *worse* guarantee here than a confirm, because the thing being discarded is already invisible. Swipe-to-discard on a screen with no rows to swipe is not available anyway.

**One copy change**, because the current confirm buries the consequence that actually matters in its third clause:

> `This cannot be undone. Those 3 changes stay on this phone and will never be sent — and if you open this trip on another device, its copy would overwrite them.`

`Yes, stop trying` / `Cancel` unchanged. This closes the coverage matrix's `discardPending` decision **for `discardPending` only**; `Empty this trip` is the other exception and is untouched here.

---

## 3. Sub route — the states that were never triggered

**Reconciliation RC-5:** the coverage matrix says the `ok` / `tight` variants need a design decision. **They are fully specified in the source and need only to be recorded.** Reading `sub.js`:

| | `ok` | `tight` |
|---|---|---|
| Third stat tile | `TO SPEND` / jade | `SHORT BY` / rust (`.stat.tight`) |
| Value | `duration(spendableMinutes)` | `duration(abs(spendableMinutes))` |
| Sentence | `23 min of that is getting between places, so 1h 37m is yours to spread across 3 stops however you like.` | `4 stops and getting back take 25 min more than the window allows. Drop a stop, shorten a stay, or push be back by later.` |
| Sentence colour | `--muted` | `--danger-fg` |
| Back row's sub-line | jade | rust |

**One copy question, raised in review and recorded as OD-5.** The lead read `SHORT BY 25 min` and could not tell whether the 25 minutes was missing or spare. The label is existing shipped copy, so it is **not changed here**; the recommendation is **`OVER BY`** — the number is the overshoot either way, and "over" is unambiguous against `TO SPEND` in a way that "short" is not. The sentence beneath it is already clear and does not move.

**Nothing else is redesigned.** The `tight` sentence already obeys the house rule — it names three taps that fix it. Recorded as the visual baseline, and the artboard renders both so the pair can be seen side by side for the first time.

**The two genuinely unspecified pieces**, both inside the sheet's raised detent:

1. **The edge markers.** `↳` opens the list and `↩` closes it, both in `.loop-n`, both bare glyphs with no label. Designed: they keep the glyphs and gain the day's two endpoints as their names — `↳ From Nishi Market` and `↩ Back to Nishi Market` — so the list reads as a walk rather than as a table with two odd rows.
2. **The back-by form.** Two inputs (`Be back by`, and the start) in edit mode, committing on `change` like the rest of the app. **What a missing back-by time does is the open question**, and it is answered here from the source: `loopSchedule` derives `returnByMinutes` from the lane's window, so clearing the field falls back to the lane end rather than to nothing. **Designed: the placeholder states the fallback** — `15:45 · the end of the gap` — so an empty field is a stated default and not a hole.

---

## 4. Cross-tab sync — the presentation of a silent refresh

**Verified:** `app.js` listens for `storage` and refreshes this tab's sync dot and strip when another tab writes the ledger. Nothing announces it.

**Decision: nothing should.** P0-5 R5 — *work the user did not start gets no indicator.* A second tab is not an event; it is the same person, and the correct outcome of the refresh is that the two tabs simply agree.

**One exception, and it is not a new element.** If the other tab *clears* the outbox while this tab is showing the rust stuck state, this tab's screen changes out from under a rust warning. The existing jade nothing-waiting block already covers the resulting state; what it must not do is keep the rust header. **Specified: the whole `stuck` screen re-derives from `syncState()` on the refresh, header included** — which is what the coverage matrix's "cross-tab sync, never designed" row was actually asking about.

**Recorded, not designed:** two tabs of the *same trip* can both hold module state (`paste.js`'s draft, `plan.js`'s collapsed banner). Neither is persisted, so they cannot conflict; they simply differ. Accepted.

---

## 5. The warning-strip slot — one line, four sources

Not in the batch brief, included because it is the cheapest remaining P1 and it is what makes §2 and §4 legible on the Plan. **The arbitration is not redesigned** — the source's rank order is kept and simply written down, because no document has ever stated it:

> **rust stuck** › **outside a kept area** › **queued** › **loop reminder**

**Two rules added, both already implied by approved work:**

1. **The identity marker yields to all four** (P0-1 principle 5) — already approved, restated here because this is the document that lists the slot's contents.
2. **A dismissed loop reminder returns only when the walk gets 10 minutes longer** — existing behaviour, kept, and it is the only dismissible source. The other three are conditions, not messages: they leave when the condition leaves.

---

## 6. Self-audit at 390 × 844

| Case | Behaviour |
|---|---|
| Long area name in the receipt | Wraps to two lines in `.hint-jade`; the four facts are on their own line below. |
| CJK area name | Same; `areaName()` derives from the trip's own place names, so CJK is normal here. |
| A download of 4 tiles | The bar is still correct; the counter reads `4 of 4 tiles · 0.1 MB so far, about 0.1 MB`. No special case. |
| A download that fails entirely | Existing `result.reason` notice; no receipt, no caveat. Unchanged. |
| 0 waiting | `0 waiting`, jade block, no rust anywhere, no `TRIED TO SEND` card (already gated on `sync.count`). |
| 400 waiting | The grouped list is the point; it is a scroller and it stays one. |
| `sync.reason` empty | The existing fallback sentence. |
| A sub route with no stops | Already handled: `TRAVELLING —`, the whole window as `TO SPEND`, and the "Nothing picked yet" sentence. Unchanged, and it is the P0-3 A-16 case. |
| A sub route 25 min over | `SHORT BY 25 min`, rust, the three-tap sentence. |
| Loading | Tile download: the bar. Retry: `Trying…` on the control. Nothing else here is async. |
| Error | Tile failure notice · retry outcome in `.amber-note` · nothing else can fail. |
| Destructive | `discardPending` — §2.3, an explicit exception. Removing an area — swipe + the existing `Its tiles go; the trip and its stops stay` label. |
| Undo | Area removal has the app-wide bar. `discardPending` deliberately does not (§2.3). |
| Focus | No new controls except `More`-less; the edge markers stay non-interactive text. |

---

## 7. New copy

**Canonical for these five areas.**

**Tile download**
> `340 of 620 tiles · 12.4 MB so far, about 18 MB`
> `Old Quarter & Harbourside is on this phone. 8 MB · 620 tiles · covers 5 of 7 stops.`
> `12 tiles did not arrive, so a few corners of this area will be blank offline. Refresh the area on wi-fi to fill them in.`

**Stuck changes**
> `0 waiting` · `3 waiting · oldest 1 Sept, 23:05`
> `Trying…`
> `This cannot be undone. Those 3 changes stay on this phone and will never be sent — and if you open this trip on another device, its copy would overwrite them.`

**Sub route**
> `↳ From Nishi Market` · `↩ Back to Nishi Market`
> `15:45 · the end of the gap` *(placeholder)*

Everything else in these areas is existing copy and is unchanged.

---

## 8. What was deliberately left for the next batch

Named so the next pass does not re-derive the list.

| Item | Why not now |
|---|---|
| **Destination's four unseen tab bodies** (Nearby / Must-see / Shop / Notes) | Four screens, not four states. The empty variants are already designed (`new-feature-design.md` 1E); the populated bodies are a batch of their own. |
| **Nearby's unlocated place** | A real product decision (a place that silently cannot be routed), and it interacts with the Paste import's `unlocated` count. Worth doing with that in hand. |
| **The stop-no-longer-on-your-plan dead end** | One sentence and one button, but it needs the removal-notification model to be settled first. |
| **`Empty this trip`** | The second confirm-button exception. §2.3 sets the precedent for how to write one; applying it there is a five-minute pass. |
| **The sync dot's five states in 6px** | A genuine visual decision, and it is the app's most permanent chrome. It deserves its own frame set, not a paragraph here. |
| **The email sign-in return path** | Unrenderable without a backend; still blocked. |
| **Removed from a shared trip** (`.gone-card`) | Designed nowhere and reachable only through a real two-device round trip. It is the last unowned piece of the sharing model. |

---

## 9. Status

| Item | Status |
|---|---|
| Tile download receipt, honest estimate, failed-tile caveat | DESIGNED — new copy |
| Stuck header: the oldest stamp only with a non-zero count | DESIGNED |
| Retry pending on the control; outcome in `.amber-note` | DESIGNED (P0-5) |
| `discardPending` stays a confirm-button exception, with one copy change | DESIGNED — **OD-3** |
| Sub route `ok` / `tight` | RECORDED from source — **not a design decision after all** (RC-5) |
| Sub route edge markers named; back-by fallback stated in the placeholder | DESIGNED — new copy |
| Cross-tab sync gets no announcement; the stuck screen re-derives fully | DESIGNED — a deliberate nothing |
| Warning-strip rank order written down | RECORDED from source |
| Seven items deferred, with reasons | §8 |
