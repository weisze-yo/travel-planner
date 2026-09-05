# Verification Sprint — P0-6 Results

**Date:** 4 Sep 2026 · **Tree:** `1d3df5956fb8` (`main`) — treated as the implementation source of truth
**Frame:** 390 × 844, 1:1, every capture · **Captures:** `docs/design/screens/verify/` (16 frames)
**Scope:** verification only. No application code was changed. Nothing was redesigned, nothing implemented, no problem "fixed".

---

## 0. Method, and what it cannot establish

**Method.** The real `web/` bundle at tree `1d3df5956fb8` was run and driven through its own screen modules. A harness file (`web/verify.html`) mirrors `web/index.html` exactly, minus `<base href="/">` (which resolves relative assets against the origin root and breaks the bundle in a preview subpath) plus a 390 × 844 frame. **No application file was edited.** The real `app.css`, the real `js/app.js` module graph, real Leaflet, real Public Sans.

States were reached through the app's own exported API — `createLink`, `publishUpdate`, `openLink`, `pendingUpdate`, `takeChange`, `keepMine`, `finishReview`, `setPlanItemTime`, `sync.track` — and, where the other phone is involved, by writing the envelope at `travel-planner:shared:{code}`, which is the exact key `readPublished()` answers from. **The Review entries were produced by the real `diffSnapshot()` against a real published snapshot, not authored by hand.**

**The emulator was not run.** `firebase.emulators.json` exists and `persist.js` has a first-class emulator path (gated on `localhost`, read from `travel-planner:emulators`), but starting it needs a shell/Node process this environment does not have. The session therefore ran on the **localStorage backend** (`state.mode === 'local'`).

**What that means this sprint cannot establish** — these remain honestly unverified:

| Not established | Why |
|---|---|
| Real Firestore writes, `published/{code}` rules in force | Never reached a backend |
| The Google popup and the emailed-link round trip | No auth backend |
| Genuine two-device propagation and `watchEnvelope` live arrival | One browser, one identity |
| The rust `.stuck-why` waiting state | `syncState().kind` is `local`; `sync.track()` queues nothing on the localStorage backend. **Structurally unreachable without a configured-but-unreachable Firestore** |
| `opens` counting, `claimEditor`, `announceJoin` | All network-only paths |

**Two contamination disclosures, so no frame is over-trusted:**

1. Early in the session a day-3 stop was edited **in place** (bypassing the store's mutators), which produced a nonsense stop — "Nishi Market (moved)", start `13:45`, end `09:00`. It was repaired from the seed, but the repair did not persist through a reload, and the incoming envelope had already been built from the contaminated snapshot. **Frames 05–10 therefore contain that stop.** It is *my* artifact, not an implementation defect, and no finding below rests on it. `04-plan-update-banner.png` was re-captured on repaired data.
2. The three people on `03-share-manage.png` were written to `state.trip.people` directly. They render through the real `person()` fragment, but they did not arrive through a real join, so the frame verifies the *rendering*, not the join-folding logic.

---

## 1. Newly verified surfaces

### 1.1 Share — offer phase · `01-share-offer.png`
**Tested:** `go('share')` with no link yet.
**Observed:** "Who has it" with a single OWNER row and "Nobody else, yet." · "They will be able to" as two radio rows — **"Send updates"** / **"Receives updates"** with their `can` sentences · "You can change this per person afterwards." · "Link stops working after" 24 hours / **7 days** (selected) / Until the trip ends · the jade explainer "They get a copy, not a live view." with the full consequence paragraph.
**Baseline captured:** yes (re-verified at the new tree; matches existing frame 17).
**Status:** **verified — acceptable as existing behaviour.**

### 1.2 Share — link created · `02-share-linked.png`
**Tested:** `createLink({role:'edit', expiry:'7d'})`.
**Observed:** the radios are **replaced** by a "What they get" card of three bullets — jade "A copy of the itinerary", ink "Nothing else, ever", amber "And it is a copy" — the amber dot doing real semantic work. Then "They have everything you have sent / Change something and this will say what there is to send." and a **disabled ghost `Nothing to send`**. `+ Add someone` appears as a dashed button.
**Baseline captured:** yes.
**Status:** **verified — acceptable.** The three-bullet card is the clearest statement of the copy model anywhere in the app, and it only exists *after* a link is made — i.e. the person who most needs it (someone deciding whether to share) does not see it.
→ **New decision recorded** (D-3 below).

### 1.3 Share — manage, with people · `03-share-manage.png`
**Tested:** three people, one owner, one `edit`, one `read` with a Han name.
**Observed:** push sub becomes "Meridian City · Group Tour · 3 people" · rows are `.who-mark` initial + name + "Joined 1 Sept" · the owner gets the `OWNER` badge, the others get a **tappable chip reading "Can send updates" / "Receives updates"** · `initialFor()` correctly renders **陳** rather than transliterating · "Swipe a person left to remove them… They keep the copy of the itinerary they already have, and stop receiving your updates."
**Baseline captured:** yes.
**Status:** **verified — UX/design decision required.** The role chip is styled as metadata (`.chip`) but is a control, and its two labels are the permission-sounding strings. See §4 / P0-1.

### 1.4 Plan — update waiting banner · `04-plan-update-banner.png`
**Tested:** a real pending update on a repaired day 3.
**Observed:** an amber `.moved` card above the timeline: **"Ana sent an update · 22:02"** / "5 stops · 1 sub route · 1 place. Nothing has changed on your copy — you decide what to take, one thing at a time." / ink **`See what changed`** + ghost **`Later`**.
**Important states observed:** the weather banner above it reads "No live forecast — this trip is in the past", a real and previously unrecorded state (the demo trip's dates are in the past relative to today).
**Baseline captured:** yes.
**Status:** **verified — acceptable, with one discovery.** A ghost **`Later`** exists that no design document mentions. Its behaviour (dismiss for how long? returns when?) is undocumented.
→ **New decision recorded** (D-1).

### 1.5 Review — entries · `05/06/07-review-entries-*.png`
**Tested:** a real `diffSnapshot()` producing **6 entries covering all five verb/kind combinations**: a stop with changed times, a stop renamed to CJK, an added stop with a long CJK name, a removed stop, a changed sub route with a long Latin name, and an added place with a CJK name.
**Observed:**
- Header `Ana sent an update` / `6 things to decide · 4 Sept`; a three-sentence preamble; one card per entry; `.sides` as a two-column grid.
- Verb badges render as expected: `THEY CHANGED` (bone), `THEY ADDED` (jade), `THEY REMOVED` (rust).
- `Day 3` is repeated as a chip on **every** card — there is **no day grouping**.
- Per-card actions are ghost `Keep mine` + jade `Take theirs`.

**Important states observed, and three real problems:**

1. **Side values wrap at 390px even when short.** Each `.side` is ~150px. "09:15 – 10:00 Lumen Crossing" takes two lines; "16:00 – 17:00 Skyline Deck" takes two lines. The long sub-route name wraps to two lines in the *title*, which is fine, but no value of any realistic length fits one line in a side. This confirms the stacked-sides proposal in `new-feature-design.md` §4.5 empirically.
2. **A rename adopts their name before you decide.** The card title for the renamed shrine is **`灰門神社`** — theirs — with the detail line "is called" and only the `YOURS` box carrying "Ashgate Shrine". The card announces the change as already true, and the thing you are being asked about is the title itself.
3. **`THEY ADDED` is asymmetric.** `YOURS` reads "not on your copy" while `THEIRS` reads only "15:00 – 16:30" — the name lives in the title, so the two boxes are not comparing like with like.

**CJK held up well:** the long added title `大稻埕・迪化街老屋與布市半日散步` fits one line at 13.5px/700 and did not overflow; the CJK place name in the sub route rendered cleanly.
**Baseline captured:** yes — first time.
**Status:** **verified — UX/design decision required** (all three points), and it materially strengthens the existing Review redesign rather than contradicting it.

### 1.6 Review — bulk actions · `08-review-bulk-actions.png`
**Tested:** revealed the end of the scroller.
**Observed:** ghost `Keep all of mine` + ink `Take all of theirs`, **inline at the end of the scroll**, followed by "Either way this update is finished with, and the next one starts from where you leave it."
**Status:** **verified — implementation appears problematic.** Confirms `.review-foot` is defined in `app.css` and **not used by the screen**. With 6–7 entries the bulk actions sit roughly two screens below the fold, so the cheap way out of a long update is the hardest thing to find. Recorded, not fixed.

### 1.7 Review — after every entry is decided · `09-review-after-deciding.png`
**Tested:** all entries decided via `keepMine`, then `finishReview(version)`.
**Observed:** **"Nothing to review"** with the *first-visit* copy — "Their copy and yours say the same thing. An update appears here when somebody sends one." — plus a jade `Back to the day`.
**Status:** **verified — implementation appears problematic.** The "Done — *n* changes dealt with" sentence lives behind a **module-level `done` counter** in `review.js`, which is reset by the `Back to the day` handler and is not derived from state. So the receipt is ephemeral: decide seven things, navigate away and back, and the screen says nothing ever happened. There is **no record anywhere of what you decided** — and `takeChange`/`keepMine` write immediately with **no undo bar**, in an app whose stated rule is "undo, not confirm". Recorded, not fixed.
→ **New decision recorded** (D-2).

### 1.8 Join — live invite · `10-join-live-invite.png`
**Tested:** `openLink('ANA1-2345')` against a real envelope, then `go('join')`. **The product's front door, seen for the first time.**
**Observed:** `.join-bar` with the link URL · `.join-head`: a `.who-mark` "A" + "**Ana** is sharing a trip with you", then the big trip name **Meridian City**, the sub "Group Tour", and meta "Mar 12–17 · agent itinerary · 6 days · 7 stops" · a `.join-look` preview card headed "Day 3 · Mar 14 · Sat" listing three stops with subtitles and closing "and 5 more days" · an "If you join" block of **four** jade bullets.
**Important states observed, and three real problems:**
1. **The `.join-bar` does not truncate.** The sandbox origin wrapped to two lines and pushed the entire page down. A long custom domain would do the same on a real phone.
2. **"is sharing a trip with you" wraps mid-phrase** — "with" ends line one, "you" sits alone on line two. The from-line has no wrap control.
3. **The preview card's "a look at it" label breaks over two lines** in a cramped right-hand column, colliding with the day header.
4. **The preview shows Day 3, not Day 1** — it follows `state.selectedDay`, so which day a stranger sees is incidental. Both existing docs say "read-only Day 1".
**Also:** the docs say "three promises"; there are **four** (a copy · yours from then on · you are told and you choose · it works with no signal once opened).
**Baseline captured:** yes — first time. The sticky `.join-foot` and `.join-fine` remain below the fold and uncaptured.
**Status:** **verified — implementation appears problematic** (1–3) **and design decision required** (4).

### 1.9 Sub route · `11-sub-route.png`
**Tested:** `go('sub', {loopID:'day-3'})` on the demo trip's one loop.
**Observed:** real Leaflet tiles · a translucent `.sub-card` header "Market afternoon / Day 3 afternoon · 13:45–15:45 · starts and ends at Nishi Market" with a floating back chevron and pencil · **amber numbered pins 1/2/3** with a dashed amber route and a **40px ink slack pin carrying a swap glyph** · the sheet showing three `.stat` tiles — `YOU HAVE 2h` / `TRAVELLING 23 min` / `TO SPEND 1h 37m` (the last in jade) — then "23 min of that is getting between places, so 1h 37m is yours to spread across 3 stops however you like." and "Tap a place to open it · the pencil to rearrange".
**Baseline captured:** partially — the sheet sits at its default detent and **the `.loop-row` list, the edge markers and the back-by form are still unseen.** Programmatic attempts to raise the sheet were overridden by `draggableSheet`'s own detent logic; it needs a real drag.
**Status:** **verified as far as captured — acceptable.** The three stat tiles are much clearer than the audit's "ok/tight" description implied; the `ok`/`tight` variants were not triggered by this loop, so that question stands.

### 1.10 Paste — input, with the example loaded · `12-paste-input.png`
**Observed:** the intro promise · the mono textarea holding the example itinerary · `Example` / `Clear` / "70 words" · `WHAT IT LOOKS FOR` naming "Day headers — **Day 3**, **14 Mar**, **Sat 14/3**, **第三天** · no header, no new day" and "Times — **09:15**, **9.15am**, **13:30-15:45**, **下午3:00**".
**Status:** **verified — acceptable.**

### 1.11 Paste — the review pass · `13-paste-review-pass.png`
**Tested:** clicked `Example`, then `Read it`. **First time seen.**
**Observed:** header "Check what it read / 8 rows · 2 day groups so far · 8 left to check" · a full-width `.progress` track · "0 of 8 checked · tick, fix or drop the other 8" · a day group headed "Day 3 · Sat 14 Mar" with a jade **`FROM THE TEXT`** badge · `.cand` rows carrying an unticked checkbox, an amber start time with a grey derived end beneath it, the name, the subtitle, and **an amber line naming the guess** — "End time guessed — the line only gave a start", "End worked out from '45 min' on the line".
**Important states observed, and one real problem:**
- **The fix ladder is per row and it is dense.** Row 1 offers ink `Keep 1h` + ghost `Set the end time` + ghost `No end time`, *and* a `MOVE TO` day-pill row (D1–D6, D3 active) *and* a `and the rest below it` chip — **ten controls in one ~170px row**, eight rows deep, with every row needing a tick before `Review and save` enables.
- The `.progress` track reads as an empty loading bar rather than as progress through a checklist.
**Baseline captured:** yes — first time. `Ready to save` and `done` remain uncaptured.
**Status:** **verified — UX/design decision required.** The "tick every row" gate is substantially heavier in practice than either design document implies. This is the strongest argument yet for answering P0-7's gate question, and it should be answered *with this frame in hand*.

### 1.12 Draw an area · `14-draw-an-area.png`
**Tested:** `go('area')`. **First time seen.**
**Observed:** real tiles · dimmed `.area-shade` top and bottom · a white `.area-box` with four round grips · a floating `.area-note` card "Keep this area on the phone / Drag the corners, or pinch the map" · the bottom sheet showing "Old Quarter & Harbourside / 6.9 × 6.3 km" and "SIZE 8 MB".
**Important states observed, and two real problems:**
- The `.area-note` card **overlaps the top-left grip**, so the first thing the copy tells you to drag is partly under the copy telling you to drag it.
- The OSM attribution renders **inside the dimmed shade**, mid-left, half-obscured.
**Baseline captured:** yes — first time. The download progress, the `Stop` button, the detail toggles and the too-big disabled state remain uncaptured (they need a real tile download).
**Status:** **verified — implementation appears problematic** (both points, both cosmetic).

### 1.13 Changes on this phone — nothing waiting · `15-stuck-nothing-waiting.png`
**Observed:** a **`✕`** rather than a back chevron · "Changes on this phone / 0 waiting · oldest 1 Sept, 23:05" · the jade `.hint-jade` "Nothing is waiting. Everything you have changed has reached the cloud." · a card `IF THE CLOUD CANNOT TAKE THEM NOW` → "Put a copy somewhere that is not this phone…" with ink `Save a copy` + ghost `Share` and "Last copy saved: never."
**Important state observed — one real problem:** the sub reads **"0 waiting · oldest 1 Sept, 23:05"**. `pendingOldest()` answers from the ledger independently of the count, so the header can assert an oldest item while claiming nothing is waiting. Incoherent copy in a reachable state.
**Baseline captured:** the **jade** variant only.
**Status:** **verified — implementation appears problematic.** The rust `.stuck-why` variant with real waiting groups is **still not verifiable** — see §0.

### 1.14 Trips home, signed out, local backend · `16-trips-home-local.png`
**Observed:** re-verified at the new tree. The account row reads "Everything is on this phone", the demo trip sits under a `FINISHED` eyebrow (its dates are in the past), and the card shows "Open it to see how ready it is."
**Status:** **verified — acceptable.** One item to confirm on a real device: in this capture the swipe row's rust bin appears to sit partly visible at rest behind the card's right edge. It may be an artifact of the DOM-clone capture rather than a real defect, so it is **recorded as unconfirmed**, not as a finding.

---

## 2. Status roll-up

**Verified and acceptable as existing behaviour (6):** Share offer · Share linked · Plan update banner · Paste input · Sub route (as far as captured) · Trips home on the local backend.

**Verified but UX/design decision required (4):** Share manage (the role chip) · Review entries (wrapping, rename framing, added-row asymmetry) · Join live invite (which day the preview shows) · Paste review pass (the tick-every-row gate).

**Verified but implementation appears problematic (5):** Review bulk actions below two screens of cards · Review's ephemeral receipt and undo-less decisions · Join's untruncated link bar, wrapping from-line and broken "a look at it" label · Draw-an-area's note card over its own grip and the attribution inside the shade · the "0 waiting · oldest 1 Sept" contradiction.

**Still not verifiable (6):** the rust stuck-changes state (structurally needs a configured-but-unreachable backend) · real Firestore/rules enforcement · Google popup and emailed-link round trip · true two-device propagation · the sub-route `.loop-row` list, edge markers and back-by form (needs a real drag) · tile-download progress, `Ready to save`/`done` on Paste, and the sticky feet on Join and Share (below the fold; a real scroll or a taller capture).

---

## 3. Effect on the coverage counts

| | Before | After |
|---|---|---|
| Rows with a captured visual baseline | 27 of 69 | **41 of 69** |
| Rows with no verified appearance | 42 | **28** |
| Behaviour observed running | 34 | **48** |
| Read in source only | 35 | **21** |

Priorities: **no P0 was demoted and none was promoted.** Two P1 items are now evidenced strongly enough to be worth pulling forward (Review's bulk-action placement; the Paste gate), and three new P2 items were added. Detail in §5.

---

## 4. What this tells us about the role/publishing model — for P0-1

This is the sprint's most consequential finding, and it goes further than the coverage audit claimed.

**The audit said:** roles have no UI consequence.
**What is actually true:** the role model **is enforced — silently, in the store — and the UI does not represent it at any point.**

Verified by reading and by probing the live store:

- `myRole()`, `isOwner()` and `canPublish()` are **exported from `store.js`** (lines 3279–3288).
- **No screen module calls any of them.** A grep across all 20 screens and every other module returns zero call sites outside `store.js` itself. The capability to branch on role was built and never wired to anything.
- `publishUpdate()` **returns `null` immediately** when `!canPublish()` (line 3627).
- `setPersonRole()` **returns early** when `!isOwner()` (line 3675).
- `share.js` (the screen) renders `Send n changes` as an enabled jade button whenever `unsent.length` — **with no `canPublish()` check.**

**The consequences, which are UX facts and not code style:**

1. A person holding a `read` link sees an enabled, confidently labelled **`Send 3 changes`** button. Pressing it calls `publishUpdate()`, which returns `null`. **Nothing happens, and nothing says so.** A dead control on the one screen whose whole job is explaining what sharing does.
2. A non-owner tapping a person's role chip gets the chip row, picks a role, and `setPersonRole()` discards it. **The UI shows the new selection; the model never changed.**
3. Conversely, the store is stricter than the product's stated philosophy. `share.js`'s header says a role is "about publishing, not permission" and "neither stops you doing whatever you like to your own copy" — which is true of *editing*, but `canPublish()` is a genuine permission gate, and `isOwner()` is a second one.

**What this means for the P0-1 decision.** The question I framed as "does a joined copy have a visible identity?" is now the *second* question. The first is narrower and more urgent:

> **The role model already exists and is already enforced. Does the UI represent it — or does the enforcement come out?**

Three coherent answers, and the choice is genuinely open:

- **(a) Represent it.** `Send an update` becomes ghost + disabled for a `read` role with one line saying why; the role chip becomes non-interactive for non-owners. Smallest change, uses only existing states (`[disabled]`, `.chip` vs `.badge`), and makes the store's truth visible.
- **(b) Remove the gates.** Let anyone publish, matching the stated philosophy literally. Larger product change, and `firestore.rules` would have to agree.
- **(c) Keep both as they are.** Explicitly accept two dead controls. Defensible only if the roles are considered vestigial and slated for removal.

My recommendation is unchanged in direction but sharper in scope: **(a)**, and it now has priority over the joined-copy marker, because a dead primary button is a worse failure than an absent label. Both still belong to P0-1.

---

## 5. New design decisions discovered (recorded, not solved)

| id | Decision | Where | Kind | Pri |
|---|---|---|---|---|
| **D-1** | What does `Later` on the update banner do — dismiss until when, and does the banner return? Undocumented in every design doc. | Plan update banner | UX | P1 |
| **D-2** | Should a Review decision be undoable, and should the receipt survive navigation? Today decisions write immediately with no undo, and the "n changes dealt with" line is module-level state. | Review | Product + UX | **P0** — folds into P0-4 |
| **D-3** | The three-bullet "What they get" card, which is the clearest statement of the copy model in the app, appears only *after* a link exists. Should it precede the decision to share? | Share offer vs linked | UX + content | P1 |
| **D-4** | Which day does the join preview show? It follows `state.selectedDay`, so it is incidental; both docs assume Day 1. | Join live invite | UX | P1 |
| **D-5** | Does a renamed stop's Review card show *your* name or *theirs* in the title? Today it shows theirs, framing the change as settled. | Review | UX + content | P1 |
| **D-6** | Is the per-row fix ladder on the paste review pass (up to ten controls per row, eight rows) acceptable, and is the tick-every-row gate right? Now evidenced. | Paste review | UX | P1 |
| **D-7** | The role chip is a control dressed as metadata (`.chip`). Does it stay a chip? | Share manage | Visual | P2 |

**New P2 implementation notes (recorded, not fixed):** the `.join-bar` does not truncate a long origin · "is sharing a trip with you" wraps mid-phrase · the join preview's "a look at it" label breaks over two lines · `.area-note` overlaps the top-left grip · OSM attribution renders inside the area shade · "0 waiting · oldest 1 Sept" is self-contradictory · `.review-foot` is defined and unused.

---

## 6. Documentation updated

- **This file** — the verification record.
- **`docs/design/ui-ux-design-coverage.md`** — §2 rows re-statused, counts updated (§0), §5 unrendered table rewritten, D-1…D-7 added to §3, tree hash recorded.
- **`docs/design/existing-ui-visual-reference.md`** — §6 screen list: the source-only set reduced; the "three promises" and "read-only Day 1" claims corrected.
- **`github.md`** — last-sync refreshed with this sprint.
- **`web/verify.html`** — the harness. Not application code, not deployed; kept so the sprint is repeatable.

**Baseline statement:** the 16 frames in `docs/design/screens/verify/` are the current visual baseline for these surfaces at tree `1d3df5956fb8`, subject to the two contamination disclosures in §0.
