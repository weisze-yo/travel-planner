# P0-5 — The Pending-Work System

**Date:** 5 Sep 2026 · **Verified against** the working tree in this project (`web/**`), read this session
**Status:** design, for review. **Nothing implemented. No application code changed.**
**Artboard:** `P0-5 Pending Work.dc.html` — 390px-wide crops and one full frame, light only.
**Canonical:** this document. §7 is the only source of copy.

**Source read for this session:** `web/js/screens/trips.js` (`busy`, all five call sites + the cover picker) · `paste.js` (`busy`, four call sites, and the one existing disabled-while-busy button) · `trip.js` (`notice`, save / rate / forecast / export) · `join.js` (`notice`, `Join this trip`) · `area.js` (`busy` as `{done,total,bytes}`, `stop`, the real progress bar) · `stuck.js` (`notice`, retry / save-a-copy / discard) · `plan.js` + `nearby.js` (`notice`, add-a-place) · `note.js` (`photoNotice`) · `screens/share.js` + `store.js` `publishUpdate` · `screens/review.js` + `store.js` `takeChange`/`keepMine` · `app.css` `.btn[disabled]`, `.amber-note`, `.progress`, `.sync-dot`.

**Inherited, not reopened:** the semantic colour contract · "a warning always names the tap that fixes it" · the app's two blocking interactions (and no third) · P0-1's principle that a control which cannot act should not exist · no new component families.

---

## 1. What the app does today — the full audit

Twelve strings, five modules, one shape: **a module-level `busy` / `notice` string rendered as an `.amber-note` at the top of the scroller.**

| # | Work | String today | The control that starts it | Really async? | Where the message appears |
|---|---|---|---|---|---|
| 1 | Create a trip | `Creating {name}…` | `Create` (jade, in the modal) | **yes** — `geocode` + `fetchRate` | top of My trips, **after the modal has closed** |
| 2 | Open a trip | `Opening…` | the trip card itself | **yes** — `switchTrip` → `boot` | top of My trips, above the account row |
| 3 | Delete a trip | `Deleting…` | the in-row swipe confirm | **yes** | top of My trips |
| 4 | Sign out | `Signing out…` | `Sign out` on the account row | **yes** | top of My trips |
| 5 | Shrink a cover photo | `Shrinking it…` | the `Choose from phone` file label | **yes** | top of the cover screen |
| 6 | Read a trip file | `Reading {file}…` | the file input | **yes** | top of Paste |
| 7 | Make a trip from a file | `Making {name}…` | `Open it` | **yes** | top of Paste |
| 8 | Save an imported itinerary | `Adding them to the trip…` | the save button | **yes** | top of the Paste save phase — **and this button is already disabled while busy** |
| 9 | Save Trip settings | `Saving…` | `Save` | **yes** | top of Trip settings |
| 10 | Fetch the rate | `Fetching the rate…` | the rate `Fetch` | **yes** | top of Trip settings |
| 11 | Fetch the forecast | `Fetching the forecast…` | the forecast `Fetch` | **yes** | top of Trip settings |
| 12 | Join a trip | `Making your copy…` | `Join this trip` (sticky foot, h50) | **yes** | top of Join |
| 13 | Add a place | `Looking up {name}…` / `Reading that link…` / `Adding…` | the add-form save | **yes** | top of Nearby / inside Plan's edit block |
| 14 | Attach photos to a note | `Adding photos…` | the photo label | **yes** | in the note form, near the control |
| 15 | Retry the outbox | `Trying…` | `Retry` | **yes** | top of Changes on this phone |
| 16 | Download tiles | *(no string — a real progress bar)* | `Keep this area` | **yes**, and **measurable** | in place, with bytes, tiles and a `Stop` |
| 17 | Send an update | — | `Send n changes` | **no** — `publishUpdate()` is synchronous; the network write is fire-and-forget | nowhere |
| 18 | Read pasted text | — | `Read it` | **no** — the parse is synchronous | nowhere |
| 19 | A Review decision | — | `Keep mine` / `Take theirs` | **no** — writes are synchronous | nowhere |

**Three defects, and they are the whole brief:**

1. **No single pattern.** Two variable names, three placements, one real progress bar, and one button that disables itself (#8) while fifteen do not.
2. **The message is far from the control.** On My trips the note renders above the account row while the button pressed was in the header (#1, #4) or in a card below (#2, #3). A wait with no local feedback reads as a dead tap — and opening a trip and joining a trip are the two multi-second waits in the product, both among the first things a new user does.
3. **Most actions can be double-tapped mid-flight.** Two `Create`s, two `Open`s, two `Join`s. The mechanism to prevent it already exists and is used once.

**And one thing today does right, which this design keeps:** the same slot carries **outcomes** — `Message copied.`, `Saved. Keep it somewhere that is not this phone.`, `"X" was saved without a location…`, `Still 2 waiting.` — and that is what an amber note at the top of a scroller is genuinely good at.

---

## 2. The rule

> **Pending belongs to the control. Outcomes belong to the screen.**

Nine rules, in force order. Together they are the whole system; there is no new component.

**R1 · Anchor.** A pending state renders **on the control that started the work** — label swap plus `[disabled]`. Never as a line somewhere else on the screen.

**R2 · Label.** The label becomes the control's own verb in the present participle, with an ellipsis: `Create` → `Creating…`, `Save` → `Saving…`, `Join this trip` → `Making your copy…`. It says what is happening, not that something is happening.

**R3 · No spinner, ever.** The app has exactly one animated indicator — the sync dot's ring — and it means "the outbox is working". A second animation vocabulary would make every wait look like a sync. A word is enough; the app is a text-forward product and says so everywhere else.

**R4 · `.amber-note` is for outcomes and errors only.** It stops carrying "in progress" entirely. This empties the top-of-scroller slot of pending text and leaves it doing the one job it does well.

**R5 · Work the user did not start gets no indicator.** Boot, the cross-tab `storage` refresh, the automatic forecast refresh after a date change, the fire-and-forget `pushPublished` — all silent. The sync dot already covers the one background process worth reporting, and it is the only one that gets a chip.

**R6 · Real progress only when it is real.** Where the work reports units — tiles and bytes — keep the existing `.progress` bar, the counter and the `Stop`. **Never an indeterminate bar**: a bar that does not measure anything is a spinner with extra pixels.

**R7 · The disabled state *is* the double-tap prevention.** `.btn[disabled]` already means `opacity: .45; pointer-events: none`. No timers, no debouncing, no guard copy. Where the control is not a `<button>` (a trip card, a file label), the same two properties apply to it directly.

**R8 · Navigation during pending is allowed, and pending state is disposable.** `nav.js` replaces the whole host node on every paint, so a module-level pending flag dies when you leave — which is correct: the work continues, and **the outcome surfaces where the result lives**, not where the button was. Three flows are the exception and keep their surface until the work resolves, because the surface *is* the work: **Create** (the modal stays up), **Join** (the sticky foot), **the Paste save**.

**R9 · Cancellation only where the work is long, measurable and resumable.** That is the tile download, and nothing else. Everything else is a few seconds and would leave half-written state. No `Cancel` on Create, Join, Save or a fetch.

### 2.1 The corollary that prevents invented waits

**R10 · Synchronous work gets no pending state at all.** `Send n changes`, `Read it` and the Review decisions are synchronous; a label that flickers to `…` for one frame is worse than nothing, and it would imply a network round trip that is not happening. Verified per call site in §1 (#17–#19). Anyone implementing this must not "complete the set".

### 2.2 The one thing that also disables its siblings

**R11 · A navigating action disables its family.** While `Opening…`, `Creating…` or `Making your copy…` is in flight, the other controls **of the same family** (the other trip cards; the modal's `Cancel`) go non-interactive too, because two navigations cannot both win. Siblings are made non-interactive **without fading** — only the pressed control carries the visual state, so it stays obvious which tap the app is answering.

---

## 3. The cases, resolved

Every row from §1, with its designed treatment. `[disabled]` is implied wherever a label swaps.

| # | Control | Pending treatment | Outcome treatment |
|---|---|---|---|
| 1 | `Create` (modal) | `Creating…` on the button; **the modal stays up** (R8) | none on success — the app moves to Paste. A failed location lookup surfaces per `p0-2-currency-design.md` §5 |
| 2 | a trip card | an amber `Opening…` chip replaces the card's stat chips; the card itself goes `[disabled]`; the other cards go non-interactive (R11) | none — the trip opens |
| 3 | the in-row delete confirm | the confirm button's label → `Deleting…` | the existing 6s undo bar, unchanged |
| 4 | `Sign out` | `Signing out…` | none — the account row re-renders as signed out, which is the outcome |
| 5 | `Choose from phone` | `Shrinking it…` on the label-button | the existing error string, as an `.amber-note` in the cover screen |
| 6 | the file input's label | `Reading {file}…` on the label-button | the rejection reason, `.amber-note` |
| 7 | `Open it` | `Making {name}…` | the failure reason, `.amber-note` (success navigates) |
| 8 | the Paste save | `Adding them to the trip…` — **already correct today**, and it is the model for every other row | the done phase, unchanged |
| 9 | `Save` | `Saving…` | none needed — the fields are the receipt. (Today's `Saving…` at the top is the *only* feedback and it vanishes; the label swap replaces it.) |
| 10 | rate `Fetch` | `Fetching the rate…` | `rateLine()` updates in place — the outcome is the value |
| 11 | forecast `Fetch` | `Fetching the forecast…` | the banner updates in place; a failure gets an `.amber-note` |
| 12 | `Join this trip` | `Making your copy…` on the h50 sticky-foot button | none — the copy opens |
| 13 | the add-a-place save | `Looking up {name}…` / `Reading that link…` on the button | the existing four outcome strings, `.amber-note`, unchanged — **including** the "saved without a location" caveat, which is a real outcome and must stay |
| 14 | the photo label | `Adding photos…` on the label-button | the existing inline-storage notice / error, unchanged, where it already is |
| 15 | `Retry` | `Trying…` | `Still 2 waiting.` / `All sent.` — `.amber-note`, unchanged |
| 16 | `Keep this area` | the existing real progress bar, counter and `Stop` (R6, R9) | the existing stopped / failed strings |
| 17 | `Send n changes` | **none** (R10) | out of scope — the post-send state is P0-1 §12.2 |
| 18 | `Read it` | **none** (R10) | the existing `Nothing pasted yet…` error |
| 19 | `Keep mine` / `Take theirs` | **none** (R10) | the undo bar, per `p0-4-review-design.md` §5.2 |

**Two behaviours in `trips.js` that are not pending at all and stop borrowing the pending slot:**

- `busy = 'Open this trip first to change its cover.'` — a **refusal**. It stays an `.amber-note`, which is correct, but it should not share a variable with pending work.
- `busy = text` (the whole share message, when the clipboard is unavailable) — an **outcome that is a payload**. Unchanged in behaviour; recorded so nobody "tidies" it into a pending string.

---

## 4. Visual treatment

Nothing new. Literal values from `app.css`.

| Element | Treatment |
|---|---|
| Pending label | the control's existing type and height; only the text changes. `.btn` h42 / 13px, `.btn.sm` h38 / 12.5px, the Join foot h50 |
| Disabled | existing `.btn[disabled]` — `opacity: .45; pointer-events: none`. Applied to non-button controls (a card, a file label) as the same two properties |
| Card-level pending (#2) | one `.chip.amber` reading `Opening…` in the card's chip row, in place of the stat chips; the card at `opacity: .45` |
| Siblings of a navigating action | `pointer-events: none` **only** — no opacity change (R11) |
| Outcome / error | existing `.amber-note` — 12px / 650 / `--amber-fg`, at the top of the scroller, exactly where it is now |
| Broken outcome | the existing rust idioms where they already exist (`.boot-error`, the rust field hint). No new rust surface is introduced by this design |
| Real progress | existing `.progress` (h7, r4, `--line-2` track, jade fill) + the bytes/tiles counter + the ghost `Stop` |
| Sync's own indicator | the existing 6px sync dot and its ring. **Untouched.** Pending work must never render into the trip chip |

**Type and geometry never change during a pending state.** A label swap that resizes a button moves the layout underneath it, and `Creating…` is longer than `Create`. So: `.btn` keeps its height and its `flex` behaviour, the label is centred, and any button whose pending label is materially longer than its resting label is `width: 100%` or `flex: 1` already — verified true for all fifteen.

---

## 5. Where this differs from a "loading system"

Recorded because the temptation is real and the brief warned against it.

**Not designed, deliberately:** a skeleton-screen family · a global loading overlay · a toast system · an indeterminate progress component · a `<Spinner>` · a shared `usePending` abstraction · optimistic-UI rollback. Each would be a new vocabulary for a product whose entire feedback language is a word, a colour and a disabled state.

**What this design actually is:** a **convention** — where the pending text goes, what it says, and what disables — plus the removal of pending text from a slot that should only hold outcomes. The CSS additions are **zero**. The changes are per-call-site and mechanical.

---

## 6. Edge cases

| Case | Behaviour |
|---|---|
| **The work finishes before the next paint** | The label swap never renders. Correct, and it is why R10 exists: no minimum display time, no artificial delay to "show" a pending state. |
| **The work fails** | The label reverts and the outcome appears as an `.amber-note`. The control is live again immediately — a failed action must always be retryable in one tap. |
| **The user leaves mid-flight** | The pending flag dies with the screen (R8). The work completes; the outcome lands where the result lives. Nothing is queued to be shown later. |
| **Two waits at once on one screen** | Cannot happen for the pressed control (R7) and is prevented within a family (R11). Across families — a rate fetch and a forecast fetch — both are legal, both anchored to their own button, and each reverts independently. |
| **A pending state during offline** | Unchanged: the same label, and the outcome is the existing offline reason. Nothing in this design assumes a connection. |
| **CJK / long interpolated values** | Three labels interpolate user data: `Creating {name}…`, `Reading {file}…`, `Making {name}…`, `Looking up {name}…`. Inside a button, a long name would wrap or overflow. **Rule: a pending label never interpolates.** They become `Creating…`, `Reading it…`, `Making it…`, `Looking it up…`. The name is already on screen — in the field the user just typed it into. This is a small copy change and it is the one place this design overrides an existing string. |
| **Reduced motion** | Nothing animates, so nothing to honour. An improvement over a spinner by construction. |
| **Screen readers** | A label swap is announced; a note at the top of a scroller usually is not. The pressed control should carry `aria-busy="true"` while pending — the one accessibility addition, and it costs one attribute. |

---

## 7. Exact copy

**Canonical.**

**Pending labels — never interpolated (§6)**
> `Creating…` · `Opening…` · `Deleting…` · `Signing out…` · `Shrinking it…` · `Reading it…` · `Making it…` · `Adding them to the trip…` · `Saving…` · `Fetching the rate…` · `Fetching the forecast…` · `Making your copy…` · `Looking it up…` · `Reading that link…` · `Adding photos…` · `Trying…`

**Kept exactly as they are** *(outcomes, refusals and payloads — all existing strings, unchanged)*
> `Message copied.` · `Open this trip first to change its cover.` · `Nothing pasted yet — put the itinerary in the box above.` · `Saved. Keep it somewhere that is not this phone.` · `Stopped. Those changes stay on this phone only.` · `All sent.` · `Still 2 waiting.` · `Saved. Open it again from Paste an itinerary → Choose a trip file.` · `This looks like mobile data. Turn "Wait for wi-fi" off to download anyway.` · `Stopped after 240 of 900 tiles. What arrived is kept.` · the two "saved without a location" caveats · the two photo-storage notices

**No new outcome string is introduced by this design.**

---

## 8. What an implementer needs

1. **Per call site, three lines:** set a pending key that identifies *which* control is busy (not a free string), swap that control's label, add `[disabled]` + `aria-busy`.
2. **`busy` / `notice` stop being pending strings.** They keep their existing job — outcomes, errors, refusals, payloads — and every `busy = 'Verbing…'` assignment becomes a pending key instead. The `.amber-note` render lines stay exactly where they are.
3. **The pending key is screen-local** (module scope, as now) and is cleared on unmount by virtue of the module being re-entered. No global store field, no new state slice.
4. **Sixteen labels** in §7. Four of them drop an interpolation.
5. **Non-button controls** needing the treatment: the trip card (`[data-open-trip]`), the two file labels (cover, trip file), the photo label. Each is already a real element; each takes `opacity: .45; pointer-events: none`.
6. **Do not touch** `area.js`'s progress path, the sync dot, or the three synchronous actions in §3 (#17–#19).
7. **Zero CSS additions.**

---

## 9. Status

| Item | Status |
|---|---|
| The rule: pending on the control, outcomes on the screen | DESIGNED — awaiting sign-off |
| R1–R11 as stated, including "no spinner" and "no indeterminate bar" | DESIGNED — awaiting sign-off |
| Sixteen pending labels, four of them de-interpolated | DESIGNED — awaiting sign-off |
| `.amber-note` reserved for outcomes, errors, refusals and payloads | DESIGNED — awaiting sign-off |
| Card-level pending for "Open a trip" | DESIGNED — awaiting sign-off (the weakest-feedback case in the product today) |
| A navigating action disables its family without fading it | DESIGNED — awaiting sign-off |
| Synchronous actions get nothing (#17–#19) | DESIGNED — awaiting sign-off. **The rule most likely to be "helpfully" broken later.** |
| `aria-busy` on the pending control | DESIGNED — awaiting sign-off |
| The tile download's real progress and `Stop` | **UNCHANGED** — already correct |
| The Paste save button | **UNCHANGED** — already the model |
| Paste's `.progress` reading as a loading bar rather than a checklist | **DEFERRED** — it is P0-7's, and it is a *progress* question, not a pending one |
| What the sender sees after `Send n changes` | **DEFERRED** — P0-1 §12.2 |
| A skeleton / overlay / toast / spinner family | **REJECTED** (§5) |

**No OPEN DECISION.** Every choice here follows from the existing vocabulary; none of it is product policy.

---

## IMPLEMENTED — `63b9c06`, 5 Sep 2026

**Appended only. Nothing above this line was changed.**

Batch 1 of `transition-audit.md` §6 implemented this document in full, across
every async call site in the app. **Zero CSS was added**, as §5 requires.

All sixteen labels in §7 ship, five of them de-interpolated per §6 (the fifth
is `Sending the link…`, added by `p1-account-and-sign-in-design.md` §4).
`busy` / `notice` stop carrying pending text entirely (R4) and keep only
outcomes, refusals and payloads — `test/pending-and-refusals.mjs` greps the
deployed source of five modules so a `busy = 'Verbing…'` cannot quietly
return. R7's disabled state is the double-tap prevention, with no timers.
R11's family rule ships with `pointer-events` alone and no opacity change on
siblings. R8's three surfaces stay up; Plan's add-a-stop and Nearby's
add-a-place are the same shape and now do too. R10's three synchronous actions
get nothing, and the harness asserts `Read it` never becomes `Reading…`.

**Verified locally:** 56 checks at 390 × 844, 0 page errors, real CJK in real
fields, three stable runs.

**Two corrections to this document, from building it:**

1. **§4's claim that "any button whose pending label is materially longer than
   its resting label is `width: 100%` or `flex: 1` already — verified true for
   all fifteen" is FALSE** for the forecast `Refresh` button, which is
   `.btn.ghost.sm.none` in a row with a `.grow` sibling. Measured: 75px at
   rest, 167px carrying `Fetching the forecast…`. The canonical label ships as
   written; the label does not clip and the row still fits 358px, and the
   geometry is asserted in the harness rather than assumed.

2. **The card-level `Opening…` (#2) cannot be observed on a phone with no
   account, and is NOT claimed as verified.** `nav.js` paints inside
   `requestAnimationFrame` and `switchTrip` → `boot` awaits only microtasks,
   which never yield to the event loop, so the open completes before any frame
   runs. Measured, not assumed: a `MutationObserver` over the whole body
   across a real open records zero appearances of the chip, with the Firebase
   SDK fetch delayed 3s and the CPU throttled 20×. That is §6 working exactly
   as designed — no minimum display time, no artificial delay — so nothing in
   `web/` was padded to make a test pass. On a signed-in phone `boot` awaits
   Firestore over the network and the frame is real.
