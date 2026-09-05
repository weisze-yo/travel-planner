# P1 — Absence and removal: when something stops existing

**Date:** 5 Sep 2026 · **Verified against** the working tree in this project (`web/**`), read this session
**Status:** design, for review. **Nothing implemented. No application code changed.**
**Artboard:** `P1 Absence and Removal.dc.html` — 390 × 844 frames and 390px-wide crops, light only.
**Canonical:** this document for the five surfaces below. §9 is the only source of copy; anything on the artboard that is not in §9 is drift.

**Source read this session:** `web/js/screens/trips.js` (`removedCard`, `keep-side`, `message-owner`, the account row, all five `busy` sites) · `web/js/store.js` `removedFromTrip` (3881) · `removal` (3893) · `keptAfterRemoval` (3895) · `keepMySide` (3920) · `clearTripContent` (3086) · `adoptEnvelopeMeta` (~3538) · `openLink` (~3578) · `finishReview` (3871) · `web/js/screens/dest.js` (`subject()`, the no-subject branch, `nearbyPanel`, `shopPanel`) · `web/js/screens/plan.js` (`stopChips`, `archive`, `archivePlanItem`/`deletePlanItem` bindings) · `web/js/screens/nearby.js` (the add-a-place outcomes) · `web/js/screens/trip.js` (the `START THIS TRIP FRESH` card, `confirming`) · `web/css/app.css` `.gone-card` / `.kept-line` / `.empty` / `.chip.amber` / `.stranded` / `.dot`.

**Fixed foundations, not reopened:** **P0-1** (everyone edits their own copy, always · enforcement shown by absence · never make a person the subject of a negative verb · the `from Ana` marker) · **P0-2** (a joined copy's money is given; no currency, no symbol) · **P0-4** (three-way Review with a retained base, the no-base degradation and its `THEY SENT` badge) · **P0-5** (pending on the control; `.amber-note` for outcomes) · **P1 coverage gaps §2.3** (an irreversible queue may stay a confirm-button exception) · the semantic colour contract · "a warning always names the tap that fixes it" · one ink primary per screen · 390 × 844.

**Out of scope, deliberately:** the sharing round trip itself (`p1-share-join-review-flow-design.md`) · the Review row (P0-4) · Destination's populated tab bodies (`p1-destination-tabs-design.md`) · trip deletion from My trips, which already follows swipe → in-row confirm → 6s undo and is not changed.

---

## 1. Why these five belong in one document

Every one of them is the same question with a different subject: **something the user was looking at, or expected to be there, is not — and the app has to say what is gone, what is not, and what to do next.** The app answers that question five times and answers it differently each time, including once by contradicting itself inside a single screen.

| # | Surface | Today | Verdict |
|---|---|---|---|
| **A** | Removed from a shared trip (`.gone-card`) | Fully built — and **three of its statements disagree with each other and with the store** | **Copy correction. The layout is right.** |
| **B** | The stop that is no longer on your plan | One `.empty` sentence, no way back, no tab bar to leave by | **Designed — a dead end is closed** |
| **C** | A place or stop with no position | Surfaced in **two** places already; the audit's "silent" claim is wrong | **Reconciled, plus one missing consequence** |
| **D** | `Empty this trip` | An irreversible confirm that deletes the Log, on a screen that explains it as a first-run demo reset — and it strands a joined copy | **Designed — the exception is scoped** |
| **E** | A refused read mid-session | No screen; only the cold-open dead-link endings exist | **Designed — one line, no new screen** |

---

## 2. A · Removed from a shared trip — the contradiction, resolved

### 2.1 What is actually built

**Reconciliation RC-6. `p1-coverage-gaps-design.md` §8 and `overnight-p1-review-pack.md` §8 both say this is "designed nowhere" and "the last unowned piece of the sharing model".** It is not. `trips.js` `removedCard()` renders **the most complete removal treatment in the app**, above the trips list, and it has been there all along:

```
No longer shared with you              .eyebrow.rust
┌ .gone-card (danger-bg, r14, 13·14) ─────────────────┐
│ Meridian City                        .gone-t 14/800 │
│ Ana removed you on 3 Sept. The schedule and the     │
│ places have gone from this phone — you'll no        │
│ longer see changes to them.          .gone-s 11.5   │
└─────────────────────────────────────────────────────┘
Still yours, untouched                 .eyebrow
┌ .card (12·13) ──────────────────────────────────────┐
│ ● The whole itinerary — 7 stops and the places…     │
│ ● Your shopping list, all 12 items and what you…    │
│ ● Your Log — 9 notes and 14 photos                  │
│ ● Your packing list, which was never shared         │
└─────────────────────────────────────────────────────┘
[ Keep my side as its own trip ]  [ Message Ana ]
Keeping it makes a trip only you can see, with the dates,
your lists and your Log. The stops don't come with it.
```

The shape is right and is **not redesigned**: a rust statement of what changed, a plain card of what did not, one jade primary, one ghost, one closing line. It is the three-tier empty-state grammar applied to a loss, and it obeys "a number is the reassurance".

### 2.2 The contradiction — three statements, two of them false

`keptAfterRemoval()` and `removedFromTrip()` were read line by line. **`removedFromTrip()` deletes nothing.** It writes `removed: {by, on, at}` and clears `people`, `link` and `share`. No day, no item, no place, no sub route is touched. `keepMySide()` deletes nothing either — it clears the same three fields plus `removed`, `declined` and `tookVersion`.

So the screen makes three claims about one fact:

| Claim | Where | True? |
|---|---|---|
| "The schedule and the places have gone from this phone" | `.gone-s`, the rust card | **False.** Nothing was removed. |
| "The whole itinerary — 7 stops and the places around them" is still yours | the kept list, row 1 | **True**, and it is computed from the live days. |
| "The stops don't come with it" | the closing line under `Keep my side` | **False.** `keepMySide()` keeps every day and item. |

And the same screen family says the true thing on the *sender's* side: Share manage's own hint reads *"They keep the copy of the itinerary they already have, and stop receiving your updates."* **The owner is told the truth and the removed person is told the opposite.** That is a direct contradiction of P0-1's product model — *everyone edits their own copy, always* — stated to the one person whose confidence it costs.

### 2.3 The resolution

**The store is right, the kept list is right, and two sentences are wrong.** Fix the two sentences; change no behaviour, no layout, no control.

**`.gone-s` becomes** — what actually stopped, and nothing more:

> `Ana removed you on 3 Sept. Their updates stop here; everything on this phone stays exactly as it is.`

**The closing line becomes** — what keeping it does, accurately:

> `Keeping it makes a trip only you can see. Everything above comes with it — it simply stops being a shared copy.`

Both are on the sending axis (P0-1 principle 1): what ends is *receiving updates*, not *having a trip*. Neither makes the removed person the subject of a negative verb — Ana is the subject of the only removal verb, and it is a statement of fact rather than an accusation. The rust surface is **kept**: something the user did not choose has happened, and rust is the app's word for that. Rust does not have to mean "you have lost data"; here it means "this has been done to you", which is why the card is a statement and the reassurance is the card below it.

**One row of the kept list is re-ordered, not rewritten.** `keptAfterRemoval()` returns `plan · shopping · log · prep`. Leave the strings; the itinerary row goes **first** already, which is correct — it is the row the rust card used to contradict.

### 2.4 What still has no answer, and gets one

**Nothing calls `removedFromTrip()`.** Grepped: it is exported and has no caller in `web/js/**`. Removal is detected nowhere, so `.gone-card` is currently **unreachable**. The trigger belongs to the sharing round trip, and this document states the rule it must satisfy rather than the mechanism:

> **A removal is noticed only when the app next reads the envelope, and it is never noticed twice.** `adoptEnvelopeMeta` already folds joiners on every envelope read; the removal test is the mirror of it — this phone's id is absent from `joiners` while `sharedFrom` is set. It writes `removed` once; `removal()` being non-null is what suppresses re-detection.

**Recorded as IF-9, not fixed.** No design here depends on when it fires, only on what it says when it does.

**Where it appears.** On My trips, above the list, because the trip is one of several and this is a statement about one of them. **Not** on the trip's own screens: the trip still works, and a rust card on the Plan would say a day is broken when nothing is. The trip's own copy of the `from Ana` marker stays until `Keep my side` is tapped (P0-1 §5), and that is the only trace inside the trip.

**`Message Ana`** — unchanged. It copies `About Meridian City — could we talk about it?` to the clipboard and falls back to putting the text in the `busy` slot when the clipboard refuses. That fallback is an **outcome that is a payload** and is protected by P0-5 §3; it must not be tidied into a pending string.

**After `Keep my side`.** The cards go, the trips list re-renders, the trip is an ordinary trip. No receipt: the absence of the rust card *is* the receipt, and the trip is right there under `ON NOW`. Adding a jade "kept" line would be a fourth statement about a fact the screen already shows.

---

## 3. B · The stop that is no longer on your plan

### 3.1 What is there

`dest.js` `render()` opens with `subject(params)`, and when it resolves to nothing:

```js
return html`<section class="screen"><div class="empty">This stop is no longer on your plan.</div></section>`;
```

One `.empty` sentence (28px/16px pad, centred, 12.5px `--soft`), centred in an otherwise blank screen. Verified consequences:

- **There is no header**, so there is no back chevron. Destination is a push screen; its back control lives in `.hero-back` inside the hero, which this branch does not render.
- **The tab bar is present** (`dest.js` sets `tab: 'map'`, no `chrome: false`), so the screen is escapable — by leaving the whole area, to Map. **The audit's "a dead end with no action" is half right:** it is a dead end *within* the flow, and the only way out changes tab.
- It is reachable three ways: a Nearby row for a place deleted on another phone; a Review `Take theirs` that removed the stop you had open; a stale `itemID` in a restored screen stack after `deletePlanItem`.

### 3.2 Designed

Three things, and the third is the one that matters.

**1 · It gets the screen's own header.** `backHeader({ title: 'That stop has gone', sub: <trip name> })` — the same push chrome as every other push screen, so `icon.back` is where it is on all of them.

**2 · It says which stop, when it can.** `params.itemID` is a dead id, but the caller usually knows the name: Nearby passes `anchorName`, the Plan passes nothing. So the title is fixed and the **body names the subject when a name was passed** and does not when it was not:

> `Nishi Market is not on this trip any more.` *(name known)*
> `That stop is not on this trip any more.` *(name not known)*

**3 · It names the tap.** One sentence of consequence and **one ghost action**, and the action is chosen by what the app can actually do:

| Case | Second line | Action |
|---|---|---|
| A trip is open (the normal case) | `It was removed from the plan. Everything else on the trip is untouched.` | ghost `Back to the day` → `go('plan')` |
| Reached from Nearby | same | ghost `Back to the places` → `back()` |

Not an ink primary: nothing here is the user's next intention, it is a recovery. One action, not two — P0-5's rule that a control which cannot act should not exist applies to a "Find it again" that has nothing to find.

**Why not close the screen automatically.** A screen that removes itself while you are reading it is the same failure as `Later` removing the door to Review: the app decides for the user what they were doing. One sentence and one tap is cheaper than a jump nobody asked for.

**Empty-state tier:** this is **tier 2** — the existing inline `.empty` block, no colour, no ink — because the cause is neither the user's incompleteness (tier 1) nor another person's copy (tier 3). It is a stale reference, and the tier-2 treatment plus a back action is exactly the "no action when the cause is time" rule with the one action that *is* completable now.

---

## 4. C · A place or a stop with no position

### 4.1 Reconciliation RC-7 — it is not silent

**`ui-ux-design-coverage.md` §2F and §3A.6 say a place saved without a location "silently drops out of the map and the walking route, explained once in a notice that then goes away".** Source says three things are already true:

1. **The add outcome is a full sentence**, not a shrug. `nearby.js`: *`"X" was saved without a location, so it will not appear on the map or in the walking route. Nothing was found by that name nearby — try a fuller name, the street, or paste a map link.`* It names the consequence **and** three taps that fix it. `plan.js`'s add path has the shorter twin: *`"X" was added without a location, so it will not show on the map.`*
2. **The Plan card carries a standing amber chip.** `stopChips()` computes `unlocated = item.placeID && !store.place(item.placeID)?.latitude` and renders `<span class="chip amber">No position · add a link</span>` — permanent, on the row, naming the fix. This is the app's own answer and it is a good one.
3. **The Nearby row says so too**, quietly: `nearby-note` appends ` · no location` (both in Destination's Nearby panel and on the Nearby screen).

So the claim to correct is "silent". **What is genuinely missing is narrower and worth designing:**

| Gap | Why it matters |
|---|---|
| The chip is on the **Plan** only | The stop's own Destination screen shows the hatched hero and both Maps buttons with no position behind them, and says nothing. |
| A **place** (not a stop) has no chip anywhere | ` · no location` in an 11px `--muted` metadata line, mid-sentence after the category, is not a warning and does not name a tap. |
| The **sub route** silently omits it | `loopSchedule` walks positioned stops; an unlocated place picked into a loop is in the list and not in the walk. Nothing says which. |

### 4.2 Designed — three sentences, no new component

**1 · Destination, when the subject has no coord.** One `.warn` strip (the existing row-warning recipe: amber-bg, r10, 9·10 pad) directly under the two Maps buttons — the controls it is about:

> `NO POSITION` · `The map cannot place this one, so it is off the route too.` · `Paste a map link` *(`.warn-fix.first`, opens the facts editor at its map-link field)*

This is the strip's normal job, in its normal shape, in the one place the consequence is complete: the two Maps buttons above it are exactly what a position would make work.

**2 · The Nearby row gets the chip the Plan row has.** ` · no location` comes out of the metadata line and becomes the same `.chip.amber` reading `No position`, on its own chip row. Shorter than the Plan's chip, because a Nearby card has no room for `· add a link` and the card is one tap from the screen that fixes it.

**3 · The sub route says how many it could not walk.** `sub.js`'s existing `TRAVELLING` tile is derived from positioned stops only. One line under the three tiles, **only when the count is non-zero**:

> `1 of 4 places has no position, so it is not in the walk.` — 11px `--soft`

Not amber: nothing is wrong with the loop, and the tiles above it are correct for what they measure. This is a caveat about coverage, which is the same job the tile-download caveat does in `p1-coverage-gaps-design.md` §1.3, and it takes the same quiet treatment.

**What is not designed.** No blocking, no refusal, no "you must add a link". Saving a place with no position is legitimate — a stall with a name and no address is still worth remembering — and the product's position is that everything works without a signal. The app's job is to say what is not included, once, wherever the number is stated.

**Interaction with Paste.** The done receipt's `2 still need a position…` sentence (`p1-paste-review-design.md` §10) is the same fact counted at import time. Both stay: one is a receipt, the other is a standing state. They must use the same words for the same thing — `no position` — and neither says "unlocated", which is an internal word.

---

## 5. D · `Empty this trip`

### 5.1 What it is, verified

Trip settings, last card, `START THIS TRIP FRESH` in `--danger-fg`. Its explanation: *"The app ships with a demo itinerary so the screens have something in them. This empties the trip and keeps its settings — use it once you are ready to put your own itinerary in."* Then five `.chip` counts (stops · places · shopping · packing · notes), then ghost `Empty this trip…` → an inline rust confirm:

> `This cannot be undone. Everything listed above will be deleted.`
> `Yes, empty the trip` *(danger-bg fill, danger-fg text)* · `Cancel` *(ghost, 96px)*

`clearTripContent()` removes every row of `places`, `subRoutes`, `shopping`, `mustSee`, `prep`, `log`, `outfits`, blanks every day's `items` and `areaSpan`, and clears `prepCategories`. It does **not** touch `link`, `share`, `sharedFrom`, `removed`, `people`, `tookVersion`, `declined`, or the trip's settings.

### 5.2 Three problems, in order of consequence

**1 · It deletes the four private kinds — the ones the whole sharing model promises are yours.** `shopping`, `prep`, `log`, `outfits` are `PRIVATE_KINDS`; four separate approved strings promise they are never in a snapshot and no update can reach them. All four are true. And one ghost button on Trip settings deletes them with no undo. The promise is about *sharing*, not about this control — but a user who has read "your Log is never in it at all" four times will not expect `Empty this trip` to be where it goes.

**2 · The copy explains a first-run purpose for a permanently available control.** "The app ships with a demo itinerary" is true of the seed trip and false of every trip the user made. On a trip with 9 notes and 14 photos, the card's own explanation does not describe what the button does.

**3 · On a joined copy it strands the itinerary permanently — and P0-4 is what makes it permanent.** Under three-way Review with a retained base, emptying a joined trip leaves `reviewedSnapshot` holding every stop while `mine` holds none. Every stop is then **case 7 — "I removed it" — and case 7 never reaches the screen**. So the next update from Ana offers nothing, and the itinerary cannot be recovered by any route in the app. This is a real interaction between an existing destructive action and an approved design, and it is invisible in both documents.

### 5.3 Designed

**It stays a confirm-button exception, on the same reasoning `p1-coverage-gaps-design.md` §2.3 approved for `discardPending`** — it destroys several kinds at once, across screens, with no row to swipe and nothing a 6s bar could restore. Three changes, all copy and one field:

**1 · The card explains what it does, not why it shipped.** The demo sentence moves to a second clause where it is still true:

> `Empties this trip and keeps its settings — the dates, the currency and the map centre stay. Use it when you are ready to put your own itinerary in, or to clear the demo the app ships with.`

**2 · The confirm names the private kinds, because they are the surprise.** The counts card above it already lists them; the confirm's job is to say which of them cannot come back:

> `This cannot be undone. Everything listed above goes, including your shopping list, your packing list and your Log.`

`Yes, empty the trip` / `Cancel` unchanged. No count is interpolated into the confirm — the chips above it carry the numbers, and a chip row and a sentence stating the same five numbers is the four-surfaces problem in one card.

**3 · On a joined copy, emptying resets the review base.** `clearTripContent()` also sets `reviewedSnapshot = null`, which puts the trip into P0-4's **already-approved no-base mode**: the next update arrives badged `THEY SENT`, every row is offered, and the itinerary is recoverable one decision at a time. No new state, no new mode, no new copy — it is the degradation P0-4 §2.3 designed for exactly this case (*"any trip whose base was lost"*). And the trip enters it at most once: the next `finishReview` writes a base again.

Plus **one added line on the card, joined copies only**, so the recovery is stated before the tap rather than discovered after it:

> `This is Ana's copy. Emptying it does not leave the trip — the next update she sends will offer everything back.` — 11px `--soft`, under the counts

**What is deliberately not designed.** A per-kind picker ("empty the itinerary but keep my Log"). It is a better product and it is a new screen; the counts card plus an honest confirm is the smallest change that stops the surprise. Recorded as **OD-6** with a recommendation, because "should this control be able to delete the Log at all?" is a product call and not mine.

---

## 6. E · A refused read, mid-session

### 6.1 The gap

The dead-link endings (`expired` · `off` · `missing` · `offline`) are designed, captured and unchanged — but they are all **cold-open** states: `openLink(code)` on a phone that does not have the trip. The mid-session case has no screen at all:

- `watchEnvelope` is watching a `published/{code}` document that is revoked, expired or rules-denied while the joined copy is open.
- `openLink` sets `state.invite = { code, envelope, reached }` and `reached: false` is only ever read by the join screen.

So on a joined copy whose envelope has gone, **the app simply stops receiving updates and says nothing, forever.** Nothing is broken — the copy works, which is the whole model — but the user is left believing updates will arrive.

### 6.2 Designed — one line, no new screen

The place this belongs is the surface that already claims updates arrive: **Share, non-owner view**, whose jade explainer today reads *"Ana looks after who is on this trip and sends its updates."* When the envelope cannot be read, that sentence is no longer true, and it is replaced — same block, same jade, one different sentence:

> `Ana's link has stopped working, so no more updates can arrive. Everything on this phone stays as it is.`

**Jade, not rust.** Nothing has failed on this phone and nothing is lost; the copy is complete and working. Rust would say broken, and it would be the second time the app told a user their working trip was damaged (§2.2 was the first).

**And nothing else changes.** No banner on the Plan, no chip, no strip. A link ending is not an event the user has to act on in the moment — there is no tap that fixes it, so by the house rule it is not a warning. It is a fact, available where the question is asked.

**One condition, stated so it is testable:** the line shows when `sharedFrom` is set and the last envelope read did not reach one (`state.invite.reached === false`, or `watchEnvelope` reporting a permission error). A *transient* failure — offline — must not trip it, so the rule is **the last read that actually got an answer**, not the last attempt. Offline is already covered: the sync dot and the strip own connectivity, and P0-5 R5 says work the user did not start gets no indicator.

---

## 7. Self-audit at 390 × 844

| Case | Behaviour |
|---|---|
| **Long owner name in `.gone-s`** (`Alexandra Fitzgerald-Moreau`) | Wraps inside the rust card at 11.5px/1.5. `.gone-t` is the trip name and is unaffected. Nothing truncates: the card sizes to its text. |
| **CJK owner name** (`陳美玲`) | `Ana removed you` → `陳美玲 removed you`; one line at 11.5px. The name is a restatement of a person already named on Share, not a value to find, so 11.5px is the knowing exception P0-2 §11 records — it is not the warning strip's subject line. |
| **No owner name** | `ownerName()` → `the owner`; every sentence in §9 reads grammatically with it (`the owner removed you on 3 Sept`). |
| **Long trip name in `.gone-t`** | 14px/800, wraps to two lines, card grows. It is the subject of the card. |
| **A removal on a trip with nothing in it** | `keptAfterRemoval()` returns four rows with zero counts (`0 stops`, `Your Log — 0 notes`). Designed: **rows with a zero count are omitted**, and if all four are zero the whole `Still yours, untouched` block is omitted with its eyebrow. Do not zero a summary (empty-state rule §2.4.7). The rust card and both buttons stay. |
| **`That stop has gone` with a very long stop name** | The name is in the body at 12.5px, wraps freely. The push title is fixed English. |
| **A stop with no position AND an order warning** | Two `.warn` strips stack on the Plan card, existing behaviour, unchanged — `stopRow` already maps every issue. The position strip is on Destination, not the Plan, so they never stack on one card. |
| **Every place in a sub route unlocated** | `4 of 4 places have no position, so none of them is in the walk.` — the same line, pluralised; `TRAVELLING` already reads `—`, which is correct and unchanged. |
| **`Empty this trip` on a trip with no Log** | The confirm still names the three private kinds. It is a statement about what the control does, not a count, and the chip row above says `0 notes`. |
| **`Empty this trip` twice** | Second time the counts are all zero and the card is honest; nothing guards it, and nothing needs to. |
| **Loading** | None of these five is async. `Keep my side` is a synchronous `putTrip` + `refreshTrips` → **no pending state** (P0-5 R10). `Empty this trip` is synchronous. `Message Ana` awaits the clipboard, which resolves in a frame; its outcome is the existing `Message copied.` |
| **Error** | `Message Ana`'s clipboard refusal → the existing payload fallback. Nothing else here can fail. |
| **Navigation away and back** | `removal()` is trip state and persists. `confirming` in `trip.js` is module state and is cleared by the back handler — verified, and correct: a confirm must never be armed on return. `That stop has gone` re-derives from a dead id and stays dead until the stack is left. |
| **Destructive actions** | `Empty this trip` — confirm-button exception, scoped in §5.3. Removing a person / a trip / a stop / an area — all unchanged, all swipe → in-row confirm → 6s undo. `Keep my side` is **not destructive**: it keeps everything and drops a relationship. |
| **Undo** | None of the three destructive-adjacent actions here gains one. `Empty this trip` cannot have one (§5.3); `Keep my side` needs none (nothing is lost, and re-joining is a link away). |
| **Focus** | Two new controls, both real `<button>`s inside `backHeader` and a `.btn.ghost`. The `.warn-fix` on Destination is already focusable. No focusable no-ops added. |
| **Accessibility** | The kept list's `.dot` bullets are decorative beside their sentences and should be `aria-hidden`. The `No position` chip is not a control; the tap is the `.warn-fix` beside it, which carries its own label. |

---

## 8. Visual treatment

Everything existing. **New CSS: none.**

| Element | Treatment |
|---|---|
| `.gone-card` | existing — 1px `--danger-bg` on `--danger-bg`, r14, pad 13·14, `margin-bottom: 14px`; `.gone-t` 14px/800 `--ink`; `.gone-s` 11.5px/1.5 `--danger-fg`, `margin-top: 5px` |
| Kept list | existing `.card` at `padding: 12px 13px` with `.kept-line` rows (flex, `gap: 8px`, 12px/1.45 `--charcoal`, `margin-bottom: 7px`) and a 7px jade `.dot` at `margin-top: 6px` |
| Removal actions | existing `.btn.jade.grow` (h42) + `.btn.ghost.none` at the inline `width: 104px` `trips.js` already sets |
| `That stop has gone` | existing `backHeader` — `.head`, `.head-row.center`, 32×32 `.iconbtn` holding `icon.back`, `.push-title` 17px/700 ls −.01em, `.push-sub` 11.5px `--muted` mt1 — over the existing `.empty` (pad 28·16, centred, 12.5px/1.5 `--soft`) and one `.btn.ghost` |
| Destination's position warning | existing `.warn` (mt10, pad 9·10, r10, `--amber-bg`) with `.warn-label` 10.5/800/.06em `--amber-fg`, `.warn-text` 11.5/1.4, and a `.warn-fix.first` (h30, ink fill) |
| `No position` on a Nearby card | existing `.chip.amber` — pad 4·8, r8, `--amber-bg` / `--amber-fg`, in a chip row under `.nearby-note` |
| Sub-route coverage line | 11px `--soft`, line-height 1.45, under the three `.stat` tiles — which are `flex: 1`, pad 9·11, `--bone`, r12, with `.stat-k` 10px/800/.04em `--soft` and `.stat-v` 15px/700 mt2; the third tile is `.stat.ok` (a **jade-bg tile**, jade key *and* value) or `.stat.tight` (danger-bg, danger-fg) |
| `Empty this trip` confirm | unchanged — 12.5px/650 `--danger-fg` line, then the inline-styled danger button + `.btn.ghost` at `width: 96px` |
| Joined-copy line on the card | 11px `--soft`, lh 1.45, under the chip row |
| Share's non-owner explainer | unchanged block, one different sentence. **`.hint-jade` is referenced by `areas.js` and `stuck.js` and is not defined in `app.css`** — see IF-10; the block's recipe is P0-1 §8 and is unchanged by this document |

No new colour, no new radius, no new control height, no new component family.

---

## 9. Exact copy

**Canonical. The artboard may show these strings and no others** — plus, in a `TODAY` frame, the existing source strings being corrected, quoted verbatim as the “before” (the two false sentences in §2.2, and Nearby's ` · no location`). Trip names, place names and every count on the artboard are illustrative data, not copy: the `Empty this trip` chip row (`7 stops · 11 places · 12 shopping · 8 packing · 9 notes`) is computed by `trip.js` and the kept list's numbers by `keptAfterRemoval()`.

**Removed from a shared trip** *(two corrections; everything else is existing and unchanged)*
> `No longer shared with you`
> `Meridian City`
> Ana removed you on 3 Sept. Their updates stop here; everything on this phone stays exactly as it is. **(corrected)**
> `Still yours, untouched`
> The whole itinerary — 7 stops and the places around them *(existing, from `keptAfterRemoval`)*
> Your shopping list, all 12 items and what you bought *(existing)*
> Your Log — 9 notes and 14 photos *(existing)*
> Your packing list, which was never shared *(existing)*
> `Keep my side as its own trip` · `Message Ana`
> Keeping it makes a trip only you can see. Everything above comes with it — it simply stops being a shared copy. **(corrected)**
> `Message copied.` *(existing outcome)*

**That stop has gone** *(new)*
> `That stop has gone`
> Nishi Market is not on this trip any more. *(name known)*
> That stop is not on this trip any more. *(name not known)*
> It was removed from the plan. Everything else on the trip is untouched.
> `Back to the day` · `Back to the places`

**No position** *(one new strip, one relabelled chip, one new line)*
> `NO POSITION` · The map cannot place this one, so it is off the route too. · `Paste a map link` **(new)**
> `No position` **(new — replaces ` · no location` in the Nearby metadata line)**
> `No position · add a link` *(existing Plan chip, unchanged)*
> 1 of 4 places has no position, so it is not in the walk. **(new)**
> `"Nishi Market" was saved without a location, so it will not appear on the map or in the walking route. Nothing was found by that name nearby — try a fuller name, the street, or paste a map link.` *(existing, unchanged)*
> `"Nishi Market" was added without a location, so it will not show on the map.` *(existing, unchanged)*

**Empty this trip** *(two corrections, one new line)*
> `START THIS TRIP FRESH`
> Empties this trip and keeps its settings — the dates, the currency and the map centre stay. Use it when you are ready to put your own itinerary in, or to clear the demo the app ships with. **(corrected)**
> This is Ana's copy. Emptying it does not leave the trip — the next update she sends will offer everything back. **(new, joined copies only)**
> `Empty this trip…`
> This cannot be undone. Everything listed above goes, including your shopping list, your packing list and your Log. **(corrected)**
> `Yes, empty the trip` · `Cancel`
> `The trip is empty. Add your first stop from Plan → Edit.` *(existing outcome, unchanged)*

**A link that has stopped working** *(new — replaces the non-owner explainer's sentence while it applies)*
> Ana's link has stopped working, so no more updates can arrive. Everything on this phone stays as it is.

---

## 10. What an implementer needs

1. **Two strings in `trips.js` `removedCard()`** (§9). No layout change, no control change.
2. **`keptAfterRemoval()` rows with a zero count are dropped** by the render, and the whole block plus its eyebrow is omitted when nothing survives.
3. **A removal detector**, wherever the envelope is read: `sharedFrom` set and this id absent from `joiners` → `removedFromTrip({ by: ownerName(), on })`, once, guarded by `removal()`. **This is the only behavioural addition in this document and it is what makes `.gone-card` reachable at all** (IF-9).
4. **`dest.js`'s no-subject branch** gets `backHeader`, the two-branch body sentence, and one ghost action whose destination depends on whether `params.placeID`/`anchorName` was passed.
5. **`dest.js` renders a `.warn`** under the Maps row when the subject has no coord; its `.warn-fix` opens the facts editor.
6. **`nearby.js` and `dest.js` `nearbyPanel`** move ` · no location` out of `.nearby-note` into a `.chip.amber` reading `No position`.
7. **`sub.js`** adds the coverage line under the stat tiles when a picked place has no position.
8. **`trip.js`:** two strings, plus the joined-copy line gated on `state.trip?.sharedFrom`.
9. **`clearTripContent()` also clears `reviewedSnapshot`** — one line, and it is what stops §5.2's problem 3. It depends on P0-4 being implemented; before that, `reviewedSnapshot` does not exist and the line is a no-op.
10. **Share's non-owner explainer takes a second sentence variant**, chosen by whether the last completed envelope read reached one.
11. **New CSS: none.** Note separately that **`.hint-jade` must be added to `app.css`** with P0-1 §8's recipe — it is referenced by two screens and undefined (IF-10). That is a pre-existing gap this document did not create and does not depend on.

---

## 11. Reconciliations and findings

**Reconciliations — a document disagreed with the source; the source was re-read and the conflict recorded.**

| id | Conflict | Verified | Resolution |
|---|---|---|---|
| **RC-6** | `p1-coverage-gaps-design.md` §8 and the P1 review pack §8 call "removed from a shared trip" *designed nowhere* and *the last unowned piece of the sharing model*. | `trips.js` `removedCard()` renders a complete treatment: rust card, kept list from `keptAfterRemoval()`, two actions, a closing line. | **The documents are wrong.** It is built, and it was the most complete removal treatment in the app before this pass. What it needed was not a design but a **copy correction** — two of its three claims contradicted the store (§2.2). |
| **RC-7** | Coverage §2F / §3A.6: a place with no location "silently drops out of the map and the walking route". | The Plan row carries a standing `.chip.amber` `No position · add a link`; the add outcome is a three-tap sentence; Nearby appends ` · no location`. | **"Silently" is wrong.** The real gaps are narrower: Destination says nothing, a place's marker is metadata rather than a warning, and the sub route omits it from the walk without saying so (§4.1). |
| **RC-8** | Coverage §2L: "there is no close-trip and no delete-trip on Trip settings" — carried forward correctly, and the framing "the two most destructive actions in the app are unseen" was retired. | Confirmed again this session. `Empty this trip` is the destructive action there, and it deletes the four `PRIVATE_KINDS`. | **The correction stands, and it understated the case.** The action that *is* there deletes the Log — which four approved strings promise no update can reach. Scoped in §5. |

**Implementation findings — recorded, not fixed.**

| id | Finding |
|---|---|
| **IF-9** | `removedFromTrip()` is exported and **has no caller anywhere in `web/js/**`**. `.gone-card`, `keptAfterRemoval()` and `keepMySide()` are therefore all unreachable today. |
| **IF-10** | **`.hint-jade` is used by `areas.js` and `stuck.js` and is not defined in `app.css`.** Both jade explainer blocks render as unstyled body text. Several approved documents (P0-1 §8, `p1-coverage-gaps-design.md` §1.1) cite it as an existing class, and the P0-6 sprint recorded it as observed — from the DOM, not from its appearance. |
| **IF-11** | `clearTripContent()` deletes `shopping`, `prep`, `log` and `outfits` — the four `PRIVATE_KINDS` — with no undo, from a card whose copy describes clearing a demo itinerary. |
| **IF-12** | `dest.js`'s no-subject branch renders a `.screen` with **no `.head`**, so the only escape is the tab bar. Every other push screen has a back control. |
| **IF-13** | `state.invite.reached` is written by `openLink()` and read only by the join screen; a mid-session envelope failure is not surfaced anywhere. |
| **IF-14** | `.pick-chip` is **defined twice** in `app.css` (879 and 1324) with different rules; the later block wins (`.on` is jade). Cosmetically harmless, already recorded as audit inconsistency #1, restated here because two approved documents specify the class. |

---

## 12. Status

| Item | Status |
|---|---|
| **A · `.gone-card`'s two false sentences corrected** | DESIGNED — copy only. **RC-6: the screen was built, not missing** |
| A · zero-count kept rows omitted; block omitted when empty | DESIGNED |
| A · the removal detector's rule stated | SPECIFIED — **IF-9**, the one behavioural addition |
| A · `Message Ana`'s clipboard fallback | UNCHANGED — protected by P0-5 §3 |
| **B · the stop-gone dead end gets a header, a subject and one way back** | DESIGNED — new copy |
| **C · a place with no position: not silent (RC-7); three gaps closed** | DESIGNED — one strip, one chip, one line |
| **D · `Empty this trip` stays a confirm exception, scoped** | DESIGNED — **OD-6** on whether it may delete the Log at all |
| D · emptying a joined copy clears the review base | DESIGNED — uses P0-4's approved no-base mode, no new state |
| **E · a refused read mid-session** | DESIGNED — one sentence, jade, on Share |
| A per-kind picker for `Empty this trip` | **REJECTED for now** — a new screen for a control most users press once (§5.3) |
| Auto-closing the stop-gone screen | **REJECTED** — the app must not decide what the user was doing (§3.2) |
| Any rust surface on a working joined copy | **REJECTED** — §2.3 and §6.2, twice for the same reason |

**One OPEN DECISION is raised: OD-6** — *may `Empty this trip` delete the shopping list, the packing list and the Log?* Recommendation in the review pack. Everything else above is a UX or copy call and is made.

---

## IMPLEMENTED — `f3f19d0` (§3, §4), `3453aa2` (§2.4, §6), `939d656` (§5), 5 Sep 2026

**Appended only. Nothing above this line was changed.**

**§3 · the stop that has gone.** It gets the screen's own header — so there is
a back chevron, which there was not — names the subject when the caller passed
one, and offers a single ghost. Tier 2, as specified.

**§4 · a place with no position**, on all three surfaces: the `.warn` strip
under Destination's two Maps buttons, the `No position` chip on the Nearby row
(taken out of the metadata line, on both the Nearby screen and Destination's
Nearby panel), and the sub route's coverage line. No user-facing string says
"unlocated" — asserted against the rendered page.

> **§4.2's fix button names a field the app does not have.** It says `Paste a
> map link` "opens the facts editor at its map-link field". `store.PLACE_FACTS`
> is Opening hours · Phone · Website · Getting in · Worth knowing, and nothing
> in the app accepts a pasted link for an *existing* place — `parseMapLink` is
> only reached through `capturePlace`/`captureStop` when something is first
> created. The button therefore opens the facts editor, which is where a
> place's details are corrected, and **it does not yet complete the fix the
> strip's own rule demands**. Adding a geocoding field to that sheet is real
> new behaviour and §4.2 says "three sentences, no new component", so this is
> reported rather than invented. **It is the one item this session leaves
> genuinely unfinished.**

**§2.4 · the removal detector.** `removedFromTrip()` finally has a caller: the
exact mirror of `adoptEnvelopeMeta`, on every envelope read, suppressed by
`removal()` being non-null.

> **One guard §2.4 does not state, and without which the rule is wrong.**
> `announceJoin` only writes a joiner when the guest is signed in and not
> anonymous, so a read-only guest who never signs in is **never in `joiners`
> at all** — and "absent from joiners" therefore read as "removed" for every
> one of them. The first version fired on every joined copy immediately. The
> detector now records `listedInShare` the first time it sees itself listed,
> and only absence *after* that is a removal; it is stored on the trip so a
> removal that happens while the app is closed is still noticed. Caught by the
> emulator test, which is the only place it could have been caught.

**§5 · `Empty this trip`, OD-6 = YES.** The corrected confirmation names the
three private kinds, the card explains what the control does rather than why
it shipped, the joined-copy line is stated before the tap, and emptying a
joined copy resets the review base — which is what makes the itinerary
recoverable instead of permanently stranded as case 7.

**§6 · a refused read, mid-session.** Same block, same jade, one different
sentence. Only a real answer counts: `watchPublished` gained an `onError` that
fires on permission-denied / not-found / unauthenticated alone, so being
offline can never trip it.

> **§6.2 quotes a sentence that does not exist.** It gives the non-owner
> explainer as "Ana looks after who is on this trip and sends its updates."
> The block reads "This is your copy of X's trip." followed by an explanation
> of the second, separate share. The replacement goes into that block, which
> is the one the section means; the quotation is stale, not a missing feature.
> (The quoted sentence *does* now exist — it is the non-owner Share explainer
> added by P0-1 §4.3 in `322098b`.)

**Verified:** `test/absence-and-status.mjs` 37 checks, `test/backend-gated.mjs`
25 checks, `test/review-three-way.mjs` 69 checks, and — for the detector, end
to end across two real devices — `test/two-phones.mjs` 65/65.
