# P1 — Share → Join → Review, as one flow

**Date:** 5 Sep 2026 · **Verified against** the working tree in this project (`web/**`), read this session
**Status:** design, for review. **Nothing implemented. No application code changed.**
**Artboard:** `P1 Share Join Review Flow.dc.html` — every frame 390 × 844 or a 390px-wide crop, light only.
**Canonical:** this document. §11 is the only source of copy; anything on the artboard that is not in §11 is drift.

**Source read this session:** `web/js/screens/share.js` (whole) · `web/js/screens/join.js` (whole) · `web/js/screens/plan.js` `updateBanner` / `later` / the mount handlers · `web/js/screens/review.js` (whole) · `web/js/share.js` (whole) · `web/js/store.js` `shareSnapshot` · `createLink` · `writePublished` · `watchEnvelope` · `adoptEnvelopeMeta` · `openLink` · `countOpen` · `publishUpdate` · `unsentChanges` · `setLinkLive` · `setLinkExpiry` · `restateTerms` · `setPersonRole` · `removePerson` · `joinTrip` · `pendingUpdate` · `takeChange` / `keepMine` / `markReviewed` / `finishReview`.

**Fixed foundations, not reopened:** **P0-1** (role enforcement is represented, not removed; the offer phase shows two roles; the `read` send block; the `from Ana` marker; the `.arrived` arrival banner; the exact copy in its §7) · **P0-4** (three-way diff, the stacked row, `YOURS`/`THEIRS`, the title from the base, immediate writes plus the app-wide undo bar, the sticky foot, the receipt from `lastReview`, and every string in its §10) · **P0-5** (pending belongs to the control; `.amber-note` is for outcomes only; no spinner) · **P0-2** (a joined copy's money is *given*) · the semantic colour contract and "a warning always names the tap that fixes it".

**Out of scope, deliberately:** the Review row itself and its eleven cases (P0-4) · bulk-action placement (`p1-review-bulk-actions-refinement.md`) · the paste flow (`p1-paste-review-design.md`) · sign-in and the emailed-link return · the dead-link endings, which are already designed and captured · two updates arriving in a row (still DEFERRED in P0-4 §12).

---

## 1. The flow, and where it currently breaks

One person hands another a copy of a trip, and then keeps them up to date. Eleven surfaces, in order:

```
OWNER      Share offer → create link → send it → manage → send an update → sent
RECIPIENT  invite → preview → join → (sign in) → arrival → use it → banner → Review → receipt
```

Read end to end against the source, **five things are missing or wrong, and they are all in the seams**, not in the screens:

| # | Break | Source |
|---|---|---|
| **F-1** | **`Later` removes the only door to Review.** `let later = false` in `plan.js` is module state, set true by the ghost `Later` and **never set back** — the comment says "until the screen is left", which the code does not do. `go('review')` appears exactly once in the whole app, on that banner. Tap `Later` and the update is unreachable until the app is restarted. | `plan.js` 34–35, 77, 163–164 |
| **F-2** | **The join button gives no feedback.** `join.js` sets `notice = 'Making your copy…'` and repaints — but the live-invite view never renders `notice`; only the sign-in view does. `joinTrip()` is a multi-second write (`backend.createTrip`, `openTrip`, then a `put` per day, place, sub route and shot), and the button stays enabled and unchanged throughout. | `join.js` 137–199 |
| **F-3** | **A link's role cannot be changed after it is created, while its expiry can.** `liveLink()` renders the expiry chips and states `Joins as …` as flat text; there is no `setLinkRole`. An owner who picks the wrong role at the offer phase has to revoke and re-share. | `share.js` (screen) `liveLink` · `store.setLinkExpiry` exists, no role twin |
| **F-4** | **The clearest statement of the copy model is behind the decision it explains.** The three-bullet "What they get" card renders only when `shareState()?.on` — i.e. after `createLink`. The person deciding whether to share never sees it. *(D-3, and the gate is `share.on`, not link existence — see §10.)* | `share.js` (screen) `render` → `shared ? sending() : offer()` |
| **F-5** | **The post-send state is an amber note at the top of a scroller**, produced by the `send-update` handler, while the button that caused it sits in a card below. This is exactly the placement P0-5 removed everywhere else. | `share.js` (screen) `send-update` handler |

Plus the three Join layout defects the verification sprint recorded (§4), and the invite's silence about which role the link grants (§4.6).

**Everything else in the flow is sound and is left alone**: the expiry chips, the dead-link endings, the sign-in deferral, the envelope model, `announceJoin`, `countOpen`, and the whole of `share.js` the module.

---

## 2. Principles this flow adds

Three, and they are all consequences of principles already approved.

1. **A door is never removed by a dismissal.** Dismissing a prompt may make it smaller; it may not make the thing behind it unreachable. (This is the general form of F-1, and it is the only new *rule* in this document.)
2. **The copy model is explained before the decision it constrains, not after.** Sharing's whole risk is that "shared" means live sync to almost everyone; the explanation belongs above the first choice.
3. **The two sides of the round trip use the same words for the same thing.** "A copy", "an update", "you decide what to take, one thing at a time" appear on Share, on Join, on the Plan banner and in Review — and nowhere is a fourth synonym introduced.

---

## 3. A · Share

> **Round 2, 5 Sep — the offer phase is restructured.** Review resolved three things about this screen and they change §3.1–3.4 as follows. The reasoning below is kept because it is still why the pieces exist; only their placement changed.
>
> **1 · The role choice leaves the screen and enters the sharing moment.** `SENDING UPDATES` is not a standing section. Both options, the invariant line and the approved P0-1 copy move **into the invite / create-link sheet**, attached to the person or link being created. At rest the Share screen carries no radios at all. The owner's own row has no chip — an owner can always send, and that was never adjustable — and a non-owner sees no role control anywhere. *(B-11)*
> **2 · "What they get" collapses after its first read.** It stays open the first time, because it is the only statement that sharing hands over a copy rather than a live view, and that must land **before** either share button. Afterwards it is a `What they get ›` row that opens the three bullets as a sheet, with its one-line summary still visible above. Collapsed state persists per trip. *(B-12)*
> **3 · Email invites are designed alongside the link, both doors onto the same join.** `Invite someone by email` is the primary and `Create a link instead` the ghost; the link's facts collapse to one line with `Change it` reopening its sheet, which is where the role row (F-3) and the expiry now live. *(OD-4 — resolved in review: design both, decide in development.)*
>
> Artboard: §F of `P1 Share Join Review Flow.dc.html`. **What did not change:** every string, the copy model, the per-person chips, the send block, the non-owner view, and the whole of P0-1.

### 3.0 The two doors, and the one thing the invite must not become

| | Email invite | Link |
|---|---|---|
| Who | one named person | whoever opens it |
| Ends | when the owner removes them | at the expiry |
| Needs | an address lookup, and a way to tell them | nothing that does not exist |

Everything downstream of joining is **identical** — same snapshot, same four promises, same arrival banner, same Review.

**"Stays available until the owner removes them" governs who may take a copy, not what a copy is.** Joining is still *one copy, once*: a person invited today who signs in next week takes the trip as it stands then, not a live view of it. If a standing invite ever came to mean continuing access to a shared document, that is the live-sync model this product deliberately replaced — and it would invalidate P0-1, P0-4 and the four promises together. Any implementation of OD-4 must hold this line.

### 3.1 Offer phase — what you understand before creating a link

Order, top to bottom. **Two structural changes; everything else is P0-1 §4.1 unchanged.**

```
Who has it                       eyebrow            (unchanged)
  [A] Ana · Made this trip  OWNER                   (unchanged)
  Nobody else, yet.                                 (unchanged)

What they get                    eyebrow            ← MOVED HERE (F-4)
  ● A copy of the itinerary      jade dot
  ● Nothing else, ever           ink dot
  ● And it is a copy             amber dot
  ─────────
  Whatever either of you changes stays on your own phone…   ← the old jade
                                                              explainer's body

SENDING UPDATES                  eyebrow            (P0-1)
  Everyone who joins gets their own copy…            (P0-1 invariant line)
  ○ Can send updates  — Their changes go out to everyone on the trip.
  ○ Receives updates  — They get your updates, and change their own copy however they like.
  You can change this per person afterwards.

Link stops working after         eyebrow            (unchanged)
  [24 hours] [7 days] [Until the trip ends]

The link                         eyebrow            (unchanged)
  Send one link to the group chat…                  (unchanged)
  [ Create the link ]
  People who join keep the trip until you remove them…
```

**The "What they get" card is one component, rendered in both phases** — offer and shared. In the offer phase it carries the three bullets plus, under a hairline, the consequence paragraph that today lives in the separate jade `They get a copy, not a live view.` explainer. In the shared phase it carries the three bullets plus the send block (§3.4). **The separate jade explainer is removed**, because keeping both would state the copy model twice in one scroll, forty pixels apart.

**What this card is for.** It is the only place in the app that states what sharing actually hands over — a copy, not a live view. Three bullets: what travels, what never travels, and that it is a copy. Everything else on the screen assumes that model; this card is where it is said.

**Owner-only, and only in this phase.** The role radios, the expiry chips, the link card and `Create the link` are all owner-only (§3.3 and P0-1 §4.3). A non-owner sees the manage view alone.

**Why above the role radios, not below them.** The radios are the first thing that looks like a decision, so they are read first whatever the order; a card *under* them is read after the choice is made. And the card answers the question the radios raise ("what am I giving away?") — the invariant line answers only "who sends".

**Why not a modal or a first-run explainer.** The app has two blocking interactions in total and this is not one of them. A card that is always there costs one scroll and is available on every later visit.

### 3.2 Manage phase — owner

P0-1 §4.2 unchanged: `.who-mark` rows, `Joined 1 Sept`, the `OWNER` badge, the role chip **with its caret**, `YOU` on your own row, **`+ Add someone`** (`.btn-dashed`, h48 r14, 1.5px dashed #C9D0CB — it opens the same invite sheet as the screen's primary, so B-11 relocates the role choice without removing this door), swipe-to-remove and its hint.

**One addition, on the link card (F-3):** a role row above the expiry row, in the same `.chiprow` / `.pick-chip` vocabulary the expiry already uses.

```
[LIVE]  planner.app/j/ANA1-2345
Opened 3 times · 1 person has joined

Whoever opens it joins as        11px --soft
[ Can send updates ] [ Receives updates ]      .pick-chip row

Link stops working after         11px --soft
[ 24 hours ] [ 7 days ] [ Until the trip ends ]

[ Send it ]            [ Copy ]
[ Turn the link off ]
Turning it off stops new people joining. Everyone who already has the trip keeps it.
Changing the role changes it for whoever opens the link next. People who have already joined keep the role they have — change theirs above.
```

**A standing proposal against this whole card: invite by email instead of by link (OD-4).** Raised in review — the owner types an email address, the recipient sees the trip on signing in with it, nothing is pasted, and the share stays available until the owner removes them. It is a better front door and it is **recorded, not absorbed**, because it changes the model rather than the layout: the expiry chips, the opens count and `Copy` all lose their subject, and "available until removed" must not quietly become continuing access to a live document — joining still takes *one copy, once*. Recommendation: build both, link first; the invite becomes a second door onto the same `joinTrip`. Full write-up in `overnight-p1-review-pack.md` §5.

**Why this is the smallest coherent change.** The mechanism already exists: the envelope's `linkRole` is read off `state.trip.link.role` on every `writePublished`, and `restateTerms()` already republishes the envelope when the *expiry* changes. A role twin of `setLinkExpiry` reuses the same path. The asymmetry today is not a decision — the expiry is changeable and the role, which matters more, is not.

**The two counts are stated separately and honestly.** `link.opens` counts real opens of the invite; `people` counts joins that reached this phone. They are different numbers and the screen must not merge them into "3 people have it".

### 3.3 Manage phase — non-owner

P0-1 §4.3 unchanged, in full: role displays are `.badge`, not chips; no `+ Add someone`; no swipe; the whole link section is hidden; one jade `Ana looks after who is on this trip and sends its updates.`

**One clarification this document adds:** on a joined copy `state.trip.link` is `null` and `state.trip.share` is `null`, so `shared` is false and the screen renders the **offer phase** to a non-owner today — role radios, expiry chips, `Create the link`. That is worse than a dead control; it is a dead *screen*. **A non-owner's Share screen is the manage view above and nothing else**: the people list, the role badges, the jade explainer, and the `read`/`edit` send block from P0-1 §4.4. No offer phase, no link card, no `Create the link`.

### 3.4 Send an update, and what the sender sees afterwards (F-5)

Three states, all inside the "What they get" card, under a hairline. **Nothing moves to the top of the scroller.**

| State | Card foot |
|---|---|
| **Nothing to send** | `They have everything you have sent` · `Change something and this will say what there is to send.` · ghost disabled `Nothing to send` — unchanged |
| **Changes waiting** | `5 changes since you last sent one` · `They review it a change at a time — nothing is applied to their day for them.` · jade `Send 5 changes` — unchanged |
| **Just sent** ← new | `Sent 22:04 · 5 changes are with them` · `They decide what to take, one thing at a time. Nothing on their copy has moved on its own.` · ghost disabled `Nothing to send` |

The sent line is a **fact with a timestamp**, in the card, replacing the count line it supersedes. It survives a repaint because it is derived from `shareState().sentAt` and `shareState().version`, not from a handler variable — so leaving Share and coming back still says when the last update went.

**No pending state, verified and deliberate.** `publishUpdate()` is synchronous and `pushPublished()` is fire-and-forget; there is no interval in which "Sending…" could be true. P0-1 §4.4 and P0-5 A-13 both say this; it is restated here because the sent line makes it tempting to add one.

**What the sender is never told, and must not be.** Whether the envelope reached Firestore, whether anyone opened it, whether anyone reviewed it. The app knows `opens` and `joiners`; it does not know delivery or reading, and no string here implies it.

### 3.5 The read recipient on Share

P0-1 §4.4, verbatim and unchanged: no button, a jade `YOUR CHANGES` block reading *"Everything you change stays on your copy. Ana sends the updates for this trip."*, and no sentence naming the absent button.

---

## 4. B · Join

Every element, in render order.

### 4.1 The link bar

**Correction to this section's earlier text, which asserted a lock glyph as existing state.** `join.js` renders `<div class="join-bar">${raw(icon.lock || '')}<span>${url}</span></div>` — and **there is no `icon.lock` in `util.js`**. The `|| ''` fallback is the author's tell that it was never added, so **the bar renders the URL and nothing else**. My frames drew a padlock emoji, which was doubly wrong: it invented an asset, and it used an emoji in a product that has none.

**Decision: no glyph. Do not add `icon.lock`.** `.join-bar` is the *app's own* strip, not browser chrome — a padlock drawn by the page imitates the browser's security indicator, which is the one piece of UI a page must never counterfeit. The real address bar sits directly above it and already carries the genuine one. The strip's job is to show *which* link this is, and the URL does that alone.

**One line, always.** From `app.css` 2024: `padding: 9px 14px` (no fixed height — it sizes to its text), `--bone` fill, 1px `--line` bottom, **11px** tabular `--muted`, `gap: 7px`, no icon. An earlier draft of this section said "28px … 11.5px", which was wrong on both counts. The **code never truncates**; the host does, with an ellipsis, from the middle:

> `planner.app/j/ANA1-2345` → `travel-planner-3e0d3…app/j/ANA1-2345`

CSS shape: a flex row of two children — the host (`flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap`) and the path (`flex: none`). This is the smallest change that makes the defect structurally impossible rather than unlikely.

### 4.2 The inviter (fixes the mid-phrase wrap)

Two lines, so no phrase can break across them — the same fact-first structure approved for the multilingual warning strip, and for the same reason: the height must not move with the script or the length of a name.

```
[A]  Ana                              13px / 700 / --ink
     is sharing a trip with you       11.5px / 400 / --muted
```

`.who-mark` 30px, vertically centred against the two lines. The name truncates with an ellipsis; the relation line never wraps because it is fixed English of five short words. A CJK name occupies one glyph in the mark (`initialFor` takes the surname character — verified with 陳) and up to the full line beside it.

### 4.3 Trip identity

Unchanged: the name in `.join-name` — **24px / 800 / ls -.02em / line-height 1.15** (`app.css` 2037; an earlier draft of this section said 26px/700, which was wrong) — the part after `·` as `.join-sub`, and the meta line from `tripLine()` — `Mar 12–17 · agent itinerary · 6 days · 7 stops`. `tripLine` already suppresses a duplicate day count when the range says it, which is right and is not touched.

### 4.4 Which day the preview shows — resolved

**The source does not do what both design documents and the verification sprint say it does.** `firstDay()` picks **the first day that has any stops**, from the snapshot's own days — not `state.selectedDay`:

```js
const found = days.find((d) => has(d).length) || days[0] || null;
```

The sprint observed Day 3 because the demo snapshot's days 1 and 2 were empty, not because the screen follows the selected day. Recorded as reconciliation **RC-1** (§10).

**Recommendation: keep the first day that has anything on it, and label it.** Reasons, in the decision hierarchy's order:

1. It is existing behaviour, and it is the *better* behaviour: a stranger's first look at a trip should not be an empty day. A hard "Day 1" would show nothing at all for the very common case of a trip whose first day is a flight nobody itemised.
2. It is deterministic and identical on every phone that opens the link — the property the sprint (wrongly) thought was missing.
3. The only cost is that the reader may think the trip starts on day 3. **That is fixed with one line, not with a behaviour change.**

**Added line**, under the three stops and above `and n more days`, only when the shown day is not day 1:

> `Day 1 and Day 2 have nothing on them yet.` — 11px `--soft`

(Pattern: list up to two day numbers, then `Days 1–4 have nothing on them yet.` for three or more.)

This closes **D-4**.

### 4.5 The preview card (fixes the "a look at it" collision)

The label and the day swap jobs. Today the day is an `.eyebrow` in a grow column and `a look at it` is an 11px line squeezed into the right-hand column, where it breaks over two lines and collides with the day.

```
A LOOK AT IT                        .eyebrow, own line, full width
Day 3 · Sat 14 Mar                  13px / 700 / --ink
──────────────────────────────
09:15   Lumen Crossing              44px tabular time column, unchanged
        Harbour side
10:30   Ashgate Shrine
        Shoulders covered
13:30   Nishi Market
        Free time
Day 1 and Day 2 have nothing on them yet.        ← §4.4, conditional
and 5 more days                     .join-more, unchanged
```

Nothing can collide, because nothing shares a line. `dayHeading()` already produces `Day 3 · Sat 14 Mar` and already collapses to `Day 3` on a trip with no dates — unchanged.

Three stops is the existing cap (`.slice(0, 3)`) and is kept: the preview is a look, not the itinerary.

### 4.6 What the link grants — new

The invite never says which role it is offering, so the recipient learns what they can do only after joining. One line, directly under the trip meta, above the preview:

| Link role | Line |
|---|---|
| `edit` | `You will be able to send your changes to everyone on the trip.` |
| `read` | `You will get Ana's updates. Everything you change stays on your copy.` |

11.5px / `--charcoal`, one line, no eyebrow. Both are on the sending axis and neither makes a person the subject of a negative verb (P0-1 principle 3). The `read` line does not say "you cannot send" — it says what does happen.

### 4.7 The promises — four, not three

**Reconciliation RC-2:** the source renders **four** `promise()` bullets plus a jade card. Both `existing-ui-visual-reference.md` and `new-feature-design.md` say three. **Four is correct**; the documents are wrong. The four, verbatim and unchanged:

1. `You get a copy of Ana's itinerary — every stop, the sub routes, the places saved around them and the must-see spots.`
2. `It is yours from then on. Change anything you like; nothing you do here is sent to anyone.`
3. `When Ana changes something you are told, and you choose what to take from it one thing at a time.`
4. `It works with no signal once you have opened it.`

Then the jade card, unchanged: `Your side stays yours.` + the shopping/packing/Log paragraph. It is a fifth statement, and it is the one that makes the other four safe — it keeps its own surface for that reason.

**Kept verbatim on purpose.** These four sentences are the product's promise; the only defect found was a count in a document.

### 4.8 The sticky foot

**Correction to this section's earlier text, which gave the right conclusion for the wrong reason.** `.join-foot` is **`position: sticky; bottom: 0` *inside* the scroller** — not `flex: none` outside it. It is already sticky, as the earlier text said, but by stickiness rather than by layout, and the difference matters: content scrolls *under* it, which is why it is a gradient and not a bar.

Specified from `app.css` 2048–2054:

- **No border and no flat fill** — `background: linear-gradient(to top, #fff 62%, rgba(255,255,255,0))`, so the last promise fades under it instead of being cut by a rule.
- Padding `14px 16px calc(14px + var(--safe-bottom))`.
- One full-width jade button at the inline `height: 50px` `join.js` 169 already sets: `Join this trip`, or `Open this trip` when `linkState` is `joined`.
- `.join-fine` under it: **10.5px, `--soft`, line-height 1.45, `text-align: center`, `margin-top: 9px`**, ≤2 lines — `You sign in next, so the trip follows you to a new phone.` + `Link expires 12 Mar.` when there is an expiry.
- The scroller keeps bottom padding clear of the foot, so nothing rests permanently beneath it.

### 4.9 Loading — `Making your copy…` (F-2)

P0-5 R1/R2, applied to the one control that most needs it:

| | Today | Designed |
|---|---|---|
| Button label | `Join this trip` throughout | `Making your copy…` |
| Button state | enabled, tappable twice | `disabled` — the existing `.btn[disabled]` (opacity .45, pointer-events none) |
| Where the message goes | `notice`, rendered nowhere | on the button |
| `.join-fine` | unchanged | unchanged |

Nothing else on the screen changes; there is no overlay and no spinner. `joinTrip()` writes a trip document, opens it, then writes a row per day, place, sub route and shot — on a slow phone this is seconds, and it is the second of the app's only two multi-second waits.

**If it fails.** `joinTrip()` returns `null` when there is no snapshot to seed from. Today that leaves the screen exactly as it was, with a note nobody sees. Designed: the button returns to `Join this trip`, and one `.amber-note` **above the foot** (an outcome, so amber is right):

> `That did not go through. Nothing was made on this phone — try it again.`

### 4.10 Arrival and handoff

**Where you land: the Plan, on the day the preview showed.** Not day 1, not the day the phone last had open. The preview is the only part of this trip the person has seen, and landing on it makes joining continuous rather than a jump into a stranger's week. `joinTrip` already resolves to a fresh trip with `openTrip(id)`; the day to select is the one `firstDay()` chose, which the screen already computed.

**The arrival banner** is P0-1 §7, unchanged, shown once on that first paint, using the existing `.arrived` class (defined in `app.css`, currently unused):

- `read`: `YOUR COPY` / `This copy is yours. Change anything you like — it stays on this phone.`
- `edit`: `YOUR COPY` / `This copy is yours. When you want everyone else to have your changes, send an update from Share.`

Dismissible, does not return, and nothing depends on it having been read (P0-1 §11.6).

**When sign-in intervenes.** If the joiner is not signed in, `joinTrip()` resolves and the screen switches to the sign-in phase — the copy already exists at that point. The `Not now` ghost then goes to the Plan, and **the arrival banner shows there**, not on the sign-in panel. One arrival, whichever route reached it.

### 4.11 No update yet

A joined copy with `tookVersion === sharedFrom.version` and nothing waiting. Review shows **P0-4 §7.1 exactly as written** — `Nothing to review` / *"Their copy and yours say the same thing. An update appears here when somebody sends one."* — and no new string is introduced.

The understanding that updates will arrive is carried by promise 3, the arrival banner and the `from Ana` marker. Adding a fourth statement of it on an empty screen would be filler.

---

## 5. C · Post-join identity

The P0-1 "from Ana" model, applied. Four things the recipient must understand, and the one place each is said — **no concept is stated twice on the same screen**.

| Understanding | Where it is said | Surface |
|---|---|---|
| **This is my own copy** | `This copy is yours. Change anything you like — it stays on this phone.` | arrival banner, once |
| **…and it stays mine** | `from Ana` beside the trip name | My trips card · Map trip chip · Trip settings push-sub — permanent, never interactive |
| **Whose updates I receive** | `Ana sent an update` | the Plan banner and the Review header (P0-4 §10) |
| **Who can send updates** | `Ana looks after who is on this trip and sends its updates.` | Share, non-owner manage view (P0-1 §7) |
| **What stays local** | `Your shopping list, your packing list and your Log are never in it at all.` | Join's jade card before joining; the Log's own promise line after |

**The marker yields to sync warnings** (P0-1 principle 5) — accepted, unchanged.

**And it is not in the Plan header.** The Plan's head names a *day* (`.screen-title` is `Day 3`), not a trip, so there is nothing there for the marker to qualify. Its three surfaces above are the ones where a trip is one of several and the question "whose is this?" actually arises. An early artboard put it under a trip name in the Plan head; that was drift, and the artboard was corrected rather than this list widened.

**One source note carried forward, not fixed:** `join.js` computes `joined` as `sharePeople().some(p => p.id === me().id)` against **the trip currently open on this phone**, not against the envelope's `joiners`. On a phone whose open trip happens to list this id, a live invite could render as `Open this trip`. Recorded (§10, IF-4).

---

## 6. D · Update → Review as one movement

Three screens, one sentence carried through all of them: *nothing has changed on your copy; you decide what to take, one thing at a time.*

### 6.1 The banner — unchanged in shape

`.moved`, above the timeline, on Plan. Head `Ana sent an update · 22:02`; body `5 stops · 1 sub route · 1 place. Nothing has changed on your copy — you decide what to take, one thing at a time.`; ink `See what changed` + ghost `Later`. All existing, all correct.

### 6.2 `Later` — resolved (F-1, D-1)

**`Later` collapses the banner; it does not remove it.** Tapping it replaces the three-part card with a single 34px amber row, in the same `.moved` palette, that stays on the Plan:

```
┌──────────────────────────────────────────────┐
│ Ana's update · 6 to decide                 › │   34px, --amber-bg / --amber-bd
└──────────────────────────────────────────────┘
```

- Full width, r12, 12px sides, 11.5px/650 `--amber-fg`, chevron right.
- Tapping it opens Review. **This is now the second door, and the reason the first one may be closed.**
- It expands back to the full banner on the next app launch, or immediately when a newer version arrives (a new update is a new thing to say, so it says it in full).
- Deciding everything, or `Keep all of mine`, removes it — `pendingUpdate()` returns null and there is nothing to collapse.

**Why not "dismiss until tomorrow", and why not a badge on the tab bar.** A time-based return needs a stored timestamp and a rule nobody can predict; a tab-bar badge is a new component family on the app's most permanent chrome. A collapsed row is the same object, smaller, in the place the user already looked.

**Collapsed row, and the `What they get ›` disclosure.** Both use **`icon.chevron` verbatim**, which hardcodes `#98A5A0` — so the chevron is grey against the amber row and against the jade label, exactly as `.wx-banner` already renders it. Tinting it to match would mean parameterising the icon the way `icon.pencil` and `icon.tick` already are; that is not worth a source change for two rows, and a grey chevron beside coloured text is already the app's own precedent.

**Copy note:** `Ana's update` uses `possessive()`, which `share.js` already exports and handles (`Your` for you, `Ana's` otherwise). This is the one place a possessive is safe — it is 11.5px sentence case, not a 9.5px uppercase key (P0-4 §4.2).

### 6.3 Into Review, and out of it

Review is P0-4 in full and is not restated here. Two seams belong to this document:

**In.** The Review header (`Ana sent an update`) repeats the banner's head verbatim, so the tap is confirmed by the destination naming itself. The push sub carries the count and the age; P0-4 §7.3 adds `· 2 decided` on a return visit.

**Out.** `Back to the day` returns to the Plan **on the day most of the update touched** — the day with the most decided entries, ties going to the lowest number. Today it returns to whatever day was selected, which after a six-entry update spanning two days is arbitrary. This is a one-line choice with no new state, and it makes the receipt and the day agree.

**The receipt is the end of the flow, not the end of the screen.** P0-4 §7.4–7.5: `lastReview` persists, so the Plan banner is gone and Review still says what happened. Nothing further is added on the Plan — the accepted changes are simply in the day, which is the whole point of taking them.

---

## 7. Self-audit at 390 × 844

| Case | Behaviour |
|---|---|
| **Long Latin inviter name** (`Alexandra Fitzgerald-Moreau`) | Line 1 truncates with an ellipsis; the mark and line 2 are unaffected. Nothing can wrap mid-phrase because the phrase has its own line. |
| **CJK inviter name** (`陳美玲`) | Mark shows 陳. Line 1 at 13px Han is above the floor. Line 2 is unchanged English. |
| **One-character name** (`李`) | Mark `李`, line 1 `李`. No minimum-length assumption anywhere. |
| **No owner name** | `initialFor` → `?`, `ownerName()` → `the owner`; line 1 reads `the owner`, and every sentence that names Ana reads `the owner`. Grammatical in all of them. |
| **Long trip name** | `.join-name` wraps to two lines at 26px — accepted, it is the subject of the screen. The link bar is unaffected (it carries a code, not a name). |
| **Long host / custom domain** | Truncates from the middle; the code survives. §4.1. |
| **A trip with no dates** | `dayHeading` → `Day 3`; `tripLine` drops the range and prints `6 days · 7 stops`. |
| **A snapshot with no stops at all** | `firstDay()` returns `days[0]` with an empty stop list. The preview card shows the day line, no rows, and `and n more days`. No empty-list sentence is invented — the four promises below it carry the screen. |
| **A one-day trip** | `and 0 more days` is wrong. `.join-more` is **omitted** when the count is zero. *(Existing defect: `Math.max(0, dayCount - 1)` prints `and 0 more days`. Recorded, IF-5.)* |
| **Empty share list** | Offer phase, `Nobody else, yet.` — unchanged. |
| **20 people on manage** | One scroller, rows are 56px; nothing sticky is needed because there is no action at the bottom. |
| **Loading** | §4.9 join · §3.4 send has none, by verification · Review has none (decisions are synchronous, P0-5 A-13). |
| **Error** | §4.9 join failure · a refused `publishUpdate` cannot happen on the designed screen, because a `read` user has no button (P0-1) · the dead-link endings are unchanged. |
| **Navigating away and back** | Share: the sent line is derived from `share.sentAt`, so it survives. Join: no state to lose. Plan: the collapsed row survives a screen change and resets on launch. Review: P0-4 §7.3/7.6. |
| **Destructive actions** | Removing a person — swipe, in-row confirm, existing 6s undo (`removePerson` already calls `rememberUndo`). Turning the link off — not destructive, and its two sentences say so. |
| **Undo** | Person removal only; nothing else in this flow destroys anything. Review's undo is P0-4 §5.2. |
| **Focus** | No new focusable no-ops. The non-owner role display is a `<span>`; the collapsed update row is a `<button>` with its full text as its accessible name. |
| **Accessibility** | The `.who-mark` is `aria-hidden` beside the name it duplicates (P0-1 §11.4). The link bar's truncated host is `title`d with the full URL. |

**Consistency check:** every string in §11 is either inherited verbatim from P0-1 §7, P0-4 §10 or the current source, or is new and listed as new. No string contradicts P0-4's terminology (`take` / `keep` / `decide` / `an update`), P0-1's axis (sending, never permission) or P0-5's rules (no pending in `.amber-note`).

---

## 8. Visual treatment

Everything existing. **New CSS: two rules.**

| Element | Treatment |
|---|---|
| Role option rows | existing `.linkrow` — white, r14, pad 13·14, `gap: 11px`, with `.linkrow-t` 13.5/650 and `.linkrow-s` 11.5 `--muted`; the control is `.radio` (16px, 1.6px #D2D8D3 on white; when on, jade fill with an **inset** `0 0 0 3px #fff` ring — no outer halo) |
| "What they get" card | existing `.card`, r16, 13px 14px pad; three `.dot` bullets in jade / ink / **`--amber` #C87F0A**; `.hairline` (`--line-2`, `margin: 14px 0`) above the foot paragraph |
| Link role chips | existing `.chiprow` + `.pick-chip`, identical to the expiry row above it — `--bone` fill, **no border**, pad 5·9, r9, 11.5px/650 `--charcoal`; the selected one is `.pick-chip.on` = **jade**, not ink (`app.css` 1324–1335). The jade is the colour contract working as intended: the chosen term is what the recipient is *given* |
| Sent line | 12px/650 `--ink` + 11px/1.45 `--soft`, in the card, above the disabled button |
| Join link bar | existing `.join-bar`; **new**: `.join-bar span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }` and a `flex:none` code span |
| Join from-block | existing `.join-from` + `.who-mark` — a **light chip**: 30px, r9, `--bone` on 1px `--line`, 12px/800 `--charcoal`, `display:grid; place-items:center` (its source comment: *"a person is one grey chip with an initial, so eight travellers and 中文 names both fit"*). The two lines beside it are 13px/700 `--ink` and 11.5px/400 `--muted` |
| Grant line | 11.5px/1.45 `--charcoal`, 10px above the preview |
| Preview head | `.join-look` — white on 1px `--line`, r13, pad 12·13, `margin: 0 16px`; the `.eyebrow` on its own line, then 13px/700 `--ink`. `.join-more` beneath is 11px `--soft` with `padding-top: 9px` and no weight |
| Empty-days line | 11px `--soft`, above `.join-more` |
| Join foot | existing `.join-foot` — sticky inside the scroller, gradient to `#fff` at 62%, **no border**; the button at its inline 50px; `.join-fine` 10.5px centred |
| Join button, pending | existing `.btn[disabled]` — opacity .45, pointer-events none |
| Arrival banner | existing `.arrived` (P0-1 §8) — a **two-column flex strip**: `align-items: flex-start`, `gap: 10px`, r12, pad 10·12, jade-bg on 1px jade-bd, with `.arrived-t` 12px/800 `--jade` (**not** an `.eyebrow` — no uppercase, no letter-spacing) and `.arrived-s` 11px/1.45 `--jade-fg`, `margin-top: 2px` |
| Collapsed update row | **new**: `.moved-min` — 34px, r12, `--amber-bg` on 1px `--amber-bd`, 11.5px/650 `--amber-fg`, chevron `--amber-fg` at 10px. Same palette as `.moved`, one line high. |

No new colour, no new radius, no new control height, no new component family.

---

## 9. What an implementer needs

1. **`setLinkRole(role)`** in `store.js` — the twin of `setLinkExpiry`: write `trip.link.role`, then `restateTerms()`. Owner-gated by `isOwner()`, like `setPersonRole`.
2. **`share.js` (screen) renders the "What they get" card in both phases**, with the consequence paragraph in the offer phase and the send block in the shared phase. The standalone jade explainer is deleted.
3. **The `send-update` handler stops writing `notice`.** The sent line is derived from `shareState().sentAt` / `.version`.
4. **A non-owner's Share screen never renders `offer()` or the link card.** Gate on `isOwner()`, not on `share.on`.
5. **`join.js` renders `notice` on the join button** as its label, with `disabled`, and clears it on both outcomes; the failure branch shows the `.amber-note` above the foot.
6. **`join.js`'s preview head is restructured** (§4.5) and the link bar gets the two-child flex shape (§4.1).
7. **`firstDay()` also returns the day number**, so the post-join `selectDay` can land on it.
8. **The grant line and the empty-days line** are two new conditional strings in `join.js`.
9. **`plan.js`: `later` becomes `collapsed`**, still module state, and renders `.moved-min` instead of nothing. It resets on launch (module reload) and whenever `waiting.version` changes.
10. **`review.js`'s `Back to the day` picks the busiest day** from the decisions in `lastReview`.
11. **New CSS:** the two `.join-bar` rules and `.moved-min`. Appended at the end of `app.css`.
12. Nothing here changes what travels in a snapshot, the envelope shape, the rules, `MINE_ALONE`, or any mutation.

---

## 10. Reconciliations and findings

**Reconciliations — a design document disagreed with the source; the source was re-read and the conflict recorded.**

| id | Conflict | Verified | Resolution |
|---|---|---|---|
| **RC-1** | `verification-sprint-p0-6.md` §1.8 and coverage §I say the join preview "follows `state.selectedDay`". | `join.js` `firstDay()` picks the first day with stops from the snapshot. | **The source is right and the documents are wrong.** The behaviour is deterministic, not incidental, and it is kept (§4.4). D-4 closes with a labelling change, not a behaviour change. |
| **RC-2** | Two documents say the invite makes "three promises". | Four `promise()` calls, plus a jade card. | **Four is correct.** Kept verbatim; the documents' count is corrected here (§4.7). |
| **RC-3** | `p0-4-review-design.md` §1 and the sprint say `.review-foot` is "defined and unused". | It is unused **by Review** — and **used by Paste's review pass**, as a sticky foot with a disabled primary. | Both statements are true once scoped. P0-4's sticky foot therefore has a working precedent in the same app, which strengthens it. Nothing in P0-4 changes. |
| **RC-4** | D-3 says the "What they get" card appears "only after a link exists". | The gate is `shareState()?.on`, which `createLink` sets. | Same user-visible consequence, different condition. Stated correctly here; closed by §3.1. |

**Implementation findings — recorded, not fixed.**

| id | Finding |
|---|---|
| **IF-1** | `plan.js`'s `later` is never reset, and `go('review')` exists in exactly one place. Tapping `Later` makes a pending update unreachable until the app restarts. Fixed by design in §6.2; the *code* fix is not this document's to make. |
| **IF-2** | `join.js` sets `notice = 'Making your copy…'` and the live-invite view never renders it. |
| **IF-3** | There is no `setLinkRole`, while `setLinkExpiry` exists. |
| **IF-4** | `join.js` derives `joined` from the currently open trip's people rather than the envelope's `joiners`. |
| **IF-5** | A one-day trip's preview reads `and 0 more days`. |
| **IF-6** | A non-owner's Share screen renders the offer phase, including `Create the link`, because `share` is null on a joined copy. |
| **IF-8** | `join.js` calls `raw(icon.lock || '')`, but `icon.lock` does not exist in `util.js` — the link bar has always rendered text only. Design decision: keep it that way (§4.1); the fallback should become an explicit omission rather than a silent one. |
| **IF-7** | `removePerson()` still has no non-owner guard — carried from P0-1 §12.1, still recorded, still not fixed. |

---

## 11. Exact copy

**Canonical. The artboard may show these strings and no others.**

**Share — offer** *(P0-1 §7 unchanged, plus the moved card)*
> `Who has it` · `Nobody else, yet.`
> `What they get`
> **A copy of the itinerary** — The stops, the sub routes, the places and the must-see spots
> **Nothing else, ever** — Your shopping list, your packing list and your whole Log are not in it
> **And it is a copy** — What they change stays on their phone, and what you change stays on yours
> Whatever either of you changes stays on your own phone. When you want them to have your changes you send an update, and they choose what to take from it.
> `SENDING UPDATES`
> Everyone who joins gets their own copy and can change it however they like. This only decides whose changes go out to everyone else.
> **Can send updates** — Their changes go out to everyone on the trip.
> **Receives updates** — They get your updates, and change their own copy however they like.
> You can change this per person afterwards.
> `Link stops working after` · `24 hours` · `7 days` · `Until the trip ends`
> `The link` · Send one link to the group chat. Whoever opens it joins this trip only — your other trips and your account stay yours.
> `Create the link`
> People who join keep the trip until you remove them, even after the link expires.

**Share — the link card** *(new lines marked)*
> `LIVE` / `OFF`
> Opened 3 times · 1 person has joined **(new)**
> Whoever opens it joins as **(new)** · `Can send updates` · `Receives updates`
> Link stops working after **(new label on the existing chip row)**
> `Send it` · `Copy` · `Turn the link off` / `Turn the link back on`
> Turning it off stops new people joining. Everyone who already has the trip keeps it.
> Changing the role changes it for whoever opens the link next. People who have already joined keep the role they have — change theirs above. **(new)**

**Share — send block**
> `5 changes since you last sent one` · They review it a change at a time — nothing is applied to their day for them. · `Send 5 changes`
> `They have everything you have sent` · Change something and this will say what there is to send. · `Nothing to send`
> `Sent 22:04 · 5 changes are with them` **(new)** · They decide what to take, one thing at a time. Nothing on their copy has moved on its own. **(new)** · `Nothing to send`

**Share — non-owner** *(P0-1 §7 unchanged)*
> Ana looks after who is on this trip and sends its updates.
> `YOUR CHANGES` · Everything you change stays on your copy. Ana sends the updates for this trip.

**Join — header**
> `Ana` / is sharing a trip with you
> `Meridian City` · Group Tour · Mar 12–17 · agent itinerary · 6 days · 7 stops

**Join — what the link grants** *(new)*
> You will be able to send your changes to everyone on the trip. *(edit)*
> You will get Ana's updates. Everything you change stays on your copy. *(read)*

**Join — preview**
> `A LOOK AT IT`
> `Day 3 · Sat 14 Mar`
> Day 1 and Day 2 have nothing on them yet. **(new)**
> and 5 more days

**Join — promises** *(unchanged, four)*
> If you join
> You get a copy of Ana's itinerary — every stop, the sub routes, the places saved around them and the must-see spots.
> It is yours from then on. Change anything you like; nothing you do here is sent to anyone.
> When Ana changes something you are told, and you choose what to take from it one thing at a time.
> It works with no signal once you have opened it.
> **Your side stays yours.** Your shopping list, your packing list and everything you write in your Log stay on this phone. They are not part of a shared trip at all, so Ana cannot see them and no update can touch them.

**Join — foot and states**
> `Join this trip` · `Open this trip`
> `Making your copy…` **(new placement)**
> That did not go through. Nothing was made on this phone — try it again. **(new)**
> You sign in next, so the trip follows you to a new phone. · Link expires 12 Mar.

**Arrival** *(P0-1 §7 unchanged)*
> `YOUR COPY` · This copy is yours. Change anything you like — it stays on this phone. *(read)*
> `YOUR COPY` · This copy is yours. When you want everyone else to have your changes, send an update from Share. *(edit)*

**Plan — update banner** *(unchanged)*
> `Ana sent an update · 22:02`
> 5 stops · 1 sub route · 1 place. Nothing has changed on your copy — you decide what to take, one thing at a time.
> `See what changed` · `Later`

**Plan — collapsed update row** *(new)*
> `Ana's update · 6 to decide`

**Review** — every string is P0-4 §10. Nothing is added here.

---

## 12. Status

| Item | Status |
|---|---|
| **A · "What they get" moved to the offer phase; the jade explainer merged into it** (D-3 closed) | DESIGNED |
| A · link role changeable after creation | DESIGNED — needs `setLinkRole`. **OD-1**: a link already in a group chat would silently change what it grants |
| A · post-send state, in the card, derived from `sentAt` | DESIGNED |
| A · a non-owner never sees the offer phase or the link card | DESIGNED |
| A · read recipient, manage views | P0-1, unchanged |
| **B · link bar truncates the host, never the code** | DESIGNED |
| B · inviter on two lines | DESIGNED |
| B · preview head restructured | DESIGNED |
| **B · preview shows the first day with anything on it, and says which days are empty** (D-4 closed) | DESIGNED — **the documents were wrong, not the code** (RC-1) |
| B · the grant line | DESIGNED — new copy |
| B · four promises, verbatim | RECONCILED (RC-2) — no design change |
| B · sticky foot specified | DESIGNED |
| **B · `Making your copy…` on the button** | DESIGNED |
| B · join failure notice | DESIGNED — new copy |
| B · land on the day the preview showed | DESIGNED |
| C · post-join identity | P0-1, applied and mapped |
| **D · `Later` collapses instead of dismissing** (D-1 closed) | DESIGNED — the one behavioural fix in this document, and it only restores a door the code removes |
| D · `Back to the day` lands on the busiest day | DESIGNED |
| Two updates arriving in a row | DEFERRED — unchanged from P0-4 §12 |
| `removePerson` non-owner guard | RECORDED, not fixed (IF-7) |

**One OPEN DECISION is raised by this document: OD-1** (should an owner be able to change a live link's role after handing it out?) — written up in `overnight-p1-review-pack.md` §5, with a recommendation. Everything else above is a UX or copy call and is made.
