# Overnight P1 Review Pack — 5 Sep 2026

**Read this first. Everything else is detail behind it.**
Four batches ran overnight against the working tree in this project (`web/**`). **Design only: no application code was changed, no behaviour was modified, nothing was refactored.** Four new design documents, three new artboards, two approved documents annotated (annotation only — no approved decision was altered).

---

## 1. Executive summary

The P0 baseline held. Nothing you approved was overturned, and the P1 work sits on top of it without contradiction.

Reading the source rather than the earlier documents changed three things materially, and all three are **seams between screens**, not the screens themselves:

- **The sharing round trip has a trapdoor.** `Later` on the update banner sets a module flag that is **never reset**, and `go('review')` exists in **exactly one place in the whole app** — on the banner it hides. Tap `Later` and the pending update becomes unreachable until the app restarts. Designed fix: the banner **collapses** to a one-line row instead of disappearing. This closes **D-1** and is the most consequential thing in the batch.
- **The join preview finding was wrong, and the code was right.** `verification-sprint-p0-6.md` §1.8 says the preview "follows `state.selectedDay`". It does not — `firstDay()` picks the first day that has stops, from the snapshot, deterministically on every phone. **D-4 closes with a one-line label** (`Day 1 and Day 2 have nothing on them yet.`), not a behaviour change. Recorded as RC-1 rather than quietly corrected.
- **The Paste gate is the wrong gate.** The parser already grades every row — `read`, `worked`, `unread` — and the screen already renders three different card styles for them, then **asks for an identical confirmation of all three**. Five of the eight rows in the captured frame were read cleanly. The design keeps every question the parser genuinely has and drops the rest. This closes **D-6** and is the one product call I would like you to look at (**OD-2**).

Two things I expected to design turned out to need **recording, not designing**: the sub route's `ok`/`tight` variants (fully specified in `sub.js` already), and the warning strip's rank order (implemented, never written down).

**Six OPEN DECISIONs from P0 are still yours** — R-1, C-1, S-1, S-2, S-3 and the P0-4/P0-5 sign-offs. This batch adds **three**, all small next to R-1.

---

## 2. P0 baseline confirmed

Treated as settled and used as the foundation throughout:

**P0-1** — role enforcement stays and the UI represents it · two roles in the offer phase · the `read` send block with no button · `.chip`+caret for owners, `.badge` for everyone else · the `from Ana` marker (Alternative 3) and its yielding to sync warnings · the `.arrived` arrival banner branched by role · all of its §7 copy.
**P0-2** — a joined copy's money is given, off the snapshot; `joinTrip` already adopts it.
**P0-3** — the four systems' statuses, the reconciliations, the numbering (the decision brief's is canonical).
**P0-4** — three-way with a retained base · the eleven cases · the stacked row · the title from the base · `YOURS`/`THEIRS` · immediate writes plus the app-wide undo bar · the sticky foot and the bulk safety rule · the receipt from `lastReview` · all of its §10 copy.
**P0-5** — pending belongs to the control, outcomes belong to the screen · no spinner, no overlay, no skeleton · synchronous actions get nothing · a pending label never interpolates user data.

**Applied unchanged:** the semantic colour contract (jade given · amber yours/uncertain · ink act · rust broken) · a warning always names the tap that fixes it · never make a person the subject of a negative verb · one ink primary per screen · no new component families · 390 × 844 · existing inconsistencies are preserved, not standardised.

**One approved decision was re-examined and re-confirmed, not changed:** P0-4 §6.1's sticky `.review-foot`. It turns out **Paste already uses `.review-foot` correctly** — a sticky foot with a disabled primary — so the pattern has a working precedent in the same app. The sprint's "defined and unused" is true of Review only (RC-3).

---

## 3. P1 areas designed

| Batch | Deliverable | Covers |
|---|---|---|
| **1 · Share/Join/Review** | `docs/design/p1-share-join-review-flow-design.md` + `P1 Share Join Review Flow.dc.html` | The whole round trip as eleven surfaces · five seam failures (F-1…F-5) · "What they get" moved before the role decision · a link's role made changeable · the post-send state, in the card, derived from `sentAt` · a non-owner's Share screen · Join's three layout defects · which day the preview shows, and why · what the link grants · four promises, not three · the sticky foot · `Making your copy…` and the join failure · arrival on the previewed day · post-join identity mapped to five surfaces · `Later` collapsing · where `Back to the day` lands |
| **2 · Paste** | `docs/design/p1-paste-review-design.md` + `P1 Paste Review.dc.html` | Input → parse → review → row fixes → validation → ready → save → done → failure · the gate inverted to the parser's own grades · a three-tier row with one state glyph · one ladder at a time in a fixed order · `MOVE TO` on long trips · three validators and the rust invalid row · `.progress` removed · two bulk actions · leaving and returning · `Saving…` and the missing failure path · the done receipt saying where things landed |
| **3 · Review bulk** | `docs/design/p1-review-bulk-actions-refinement.md` (+ frames in artboard 1) | A focused refinement of approved P0-4, not a redesign: the foot is always present, its **contents are staged** · no confirmation, because the destructive bulk action no longer exists · one batch undo, and the `finishReview` sequencing change it requires · mixed states and recomputed counts |
| **4 · Coverage gaps** | `docs/design/p1-coverage-gaps-design.md` + `P1 Coverage Gaps.dc.html` | Tile download's missing receipt, dishonest estimate and unmentioned failures · the `0 waiting · oldest 1 Sept` contradiction · the rust stuck state specified from source · `discardPending` kept as an explicit exception · sub route `ok`/`tight` recorded · edge markers and the back-by fallback · cross-tab sync gets nothing, deliberately · the warning strip's rank order written down · seven items deferred with reasons |

---

## 4. New design decisions made autonomously

| id | Decision |
|---|---|
| **B-1** | **`Later` collapses the update banner to a one-line amber row rather than dismissing it.** The row is the second door to Review, and the reason the first one may be closed. It re-expands on the next launch or when a newer update arrives. Closes **D-1**. |
| **B-2** | **The join preview keeps the first day that has anything on it**, and gains one line naming the empty days before it. Closes **D-4** — and the *documents* were corrected, not the code (RC-1). |
| **B-3** | **The "What they get" card moves to the offer phase, above the role radios**, and the separate jade explainer merges into it so the copy model is stated once. Closes **D-3**. |
| **B-4** | **The post-send state lives in the card, derived from `share.sentAt`** — `Sent 22:04 · 5 changes are with them` — not as an amber note at the top of the scroller. Closes the hole P0-1 §12.2 left open. |
| **B-5** | **A non-owner never sees Share's offer phase or the link card.** Today a joined copy renders `Create the link` to somebody who owns nothing, because `share` is null (IF-6). |
| **B-6** | **The invite says what the link grants**, in one line on the sending axis, before the preview. |
| **B-7** | **Joining lands on the day the preview showed.** The preview is the only part of the trip the person has seen. |
| **B-8** | **`Making your copy…` goes on the join button, disabled**, and a failure returns the button and shows one amber line. P0-5, applied to the app's second multi-second wait. |
| **B-9** | **Join's link bar truncates the host and never the code**; the inviter gets two lines so no phrase can break across them; `A LOOK AT IT` becomes the eyebrow and the day becomes the content. The three sprint defects become structurally impossible rather than unlikely. |
| **B-10** | **`Back to the day` lands on the day most of the update touched.** |
| **P-1** | **The tick-every-row gate is removed. Rows the parser read cleanly are accepted by default; only `worked`, `unread` and invalid rows need a decision.** See **OD-2**. |
| **P-2** | **One state glyph** (jade ✓ · amber ? · rust ! · grey —) replaces the leading checkbox and the trailing chevron, giving the name 32px back. |
| **P-3** | **One fix ladder at a time**, in a fixed five-step priority order. Worst case falls from ten controls to four. |
| **P-4** | **Three validators** — end before start, two rows at one time, no name — each a rust line with a ladder, and each blocking the save. |
| **P-5** | **`.progress` is removed from Paste** and reserved for real transfers. A count that falls to zero replaces it. |
| **P-6** | **Save gets a failure path.** Today `phase = 'done'` runs whatever `importItinerary` returns. |
| **R-1p** | **Review's bulk buttons are staged**: absent on 3 rows or fewer, behind one `More` on 4+, shown once anything is decided. Always reachable, never pre-armed. |
| **R-2p** | **`finishReview` moves out of the bulk handlers** to `settle()`. Without this the batch undo P0-4 §5.2 specifies cannot work. |
| **C-1p** | **Tile download gets a receipt**, an honestly-labelled estimate, and a caveat naming failed tiles. |
| **C-2p** | **The stuck header states the oldest item only when something is waiting.** |
| **C-3p** | **Cross-tab sync gets no announcement** — P0-5 R5. The one requirement is that the stuck screen re-derives its header, not just its body. |

| **B-11** | **The role choice moves out of the Share screen into the sharing moment** — the invite / create-link sheet, attached to the person or link being created. No radios at rest; no role control for a non-owner; no chip on the owner's own row. P0-1 copy unchanged, placement only. *(From review.)* |
| **B-12** | **"What they get" collapses after its first read** to a `What they get ›` row, one-line summary still showing. Open the first time, because the copy model must land before either share button. *(From review.)* |
| **B-13** | **Both sharing doors are designed** — `Invite someone by email` primary, `Create a link instead` ghost, one join behind both; the link's facts collapse to one line with `Change it` reopening its sheet, which now carries the role row and the expiry. *(OD-4, resolved in review.)* |
| **P-7** | **The paste row state model is stated as a table** — grade decides the starting state; the save unblocks when nothing is left in `?` or `!`; accepted is not a lock. *(From review.)* |
| **C-4p** | **The tile download is a card inside the area's screen**, not an overlay — the box, the wi-fi toggle, the detail chips and the tab bar all stay live. *(From review.)* |

---

## 5. OPEN DECISIONS — three, each with a recommendation

| ID | Area | Decision | Recommendation | Needs my approval? |
|---|---|---|---|---|
| **OD-1** | Share | **Should an owner be able to change a live link's role after handing it out?** | **Yes — add it.** The expiry is already changeable and the role, which matters more, is not; that asymmetry is an accident, not a decision. The mechanism exists (`restateTerms` republishes the envelope; `linkRole` is read off `trip.link.role`). One sentence states the consequence: *"Changing the role changes it for whoever opens the link next. People who have already joined keep the role they have."* | **YES** — a link already in a group chat would grant something different tomorrow |
| **OD-2** | Paste | **Does every parsed row still have to be acknowledged before saving?** | **No.** Accept the rows the parser read cleanly; ask only about the ones it inferred, could not read, or that are invalid. The grades already exist and are already rendered three ways. A wrongly accepted row is one swipe with a 6s undo, and the pasted text is kept for a redo — a gate costing eight taps to prevent a one-swipe mistake is not paying for itself. | **YES** — it changes what the screen promises |
| **OD-4** | Share | **Should sharing be an email invite instead of a link?** Ming's proposal: the owner types an email address, that person sees the trip when they sign in with it, no copy-paste, and the share stays available until the owner removes them. | **RESOLVED IN REVIEW — both are designed, development decides.** Artboard §F and flow doc §3.0/§3.1. They differ in three places (who, when it ends, what it needs) and everything downstream of joining is identical. Email is the better front door and needs an address lookup plus a way to notify; the link needs nothing new. **The line implementation must hold:** "available until removed" governs *who may take a copy*, not *what a copy is* — joining is still one copy, once. | No longer a decision — but **read the caveat**, it is the one way this could break P0-1 and P0-4 |
| **OD-5** | Sub route | **Does the negative time tile keep the label `SHORT BY`?** The lead read it and could not tell whether 25 minutes was missing or spare. | **Rename it `OVER BY`.** The number is the overshoot either way, and "over" is unambiguous against "to spend" in a way that "short" is not. This is existing shipped copy, so it is recorded rather than changed — the sentence beneath it is already clear and does not move. | **Yes, but it is a one-word call** |
| **OD-3** | Stuck changes | **Does `discardPending` stay a confirm-button exception to swipe → in-row → 6s undo?** | **Yes, stay — and say so.** It destroys a queue of invisible writes that cannot be reconstructed; a 6s bar is a *worse* guarantee than a sentence naming the consequence, and there is no row to swipe. One copy change moves the real consequence out of the third clause. | **Yes, but it is a one-minute read** |

**Also worth one look, though I have decided them:** **B-1** (`Later` collapses — it is the one behavioural change in this batch, and it exists only to restore a door the code removes) and **R-2p** (`finishReview` moves out of the bulk handlers — required for the undo you are being asked to approve in P0-4).

**Still yours from the P0 pack, unchanged and unaddressed here:** **R-1** (three-way Review with a retained base — everything in P0-4 rests on it), **C-1** (bare numbers with no currency), **S-3** (bulk never touches a row you both changed), **S-2** (Latin-first on `body`), **S-1** (the three tier-3 sentences).

---

## 6. Verification findings incorporated

Every P0-6 finding that touches these areas was re-checked against source before it was designed against.

| Sprint finding | Outcome |
|---|---|
| Join bar wraps and pushes the page down | Designed out (B-9) |
| "is sharing a trip with you" wraps mid-phrase | Designed out (B-9) |
| Preview label "a look at it" collides with the day header | Designed out (B-9) |
| Preview shows the selected day, not Day 1 | **Wrong about the mechanism.** Source re-read; behaviour kept and labelled (B-2, RC-1) |
| "Three promises" in the docs, four in the UI | **Four is correct**; the documents are corrected (RC-2) |
| Sticky Join footer never verified | Specified: `.join-foot` is already `flex: none` outside the scroller; the scroller gains matching bottom padding |
| Review bulk actions two screens below the fold | Fixed by P0-4's sticky foot, now staged (R-1p) |
| ~10 controls in one ~170px paste row, 8 rows deep | Confirmed as the **worst case**, not the typical row; fixed by P-3 |
| Every paste row needs a tick | Removed (P-1 / OD-2) |
| The progress track looks like a loading bar | Removed (P-5) |
| Paste `Ready to save` / `Done` never verified | Both read in source and specified; `Done` gains a landing line, `Ready` gains a failure path (P-6) |
| `.review-foot` defined and unused | True of Review; **Paste uses it correctly** (RC-3) |
| `0 waiting · oldest 1 Sept` | Designed out (C-2p) |
| Rust `.stuck-why` structurally unverifiable | Specified from source and flagged as source-only |
| Sub route `ok`/`tight` not triggered | Recorded from source; **not a design decision after all** (RC-5) |
| Tile download progress never captured | Specified; the bar itself is kept, three gaps around it closed (C-1p) |
| `removePerson` has no non-owner guard | Still recorded, still not fixed, per your instruction |

**Reconciliations recorded rather than silently resolved:** RC-1 (preview day), RC-2 (four promises), RC-3 (`.review-foot`), RC-4 (the "What they get" gate is `share.on`, not link existence), RC-5 (sub route `ok`/`tight`).

**New implementation findings recorded, not fixed:** `later` never resets and Review has one entry point · `notice` unrendered on Join · no `setLinkRole` · `joined` derived from the open trip rather than the envelope · `and 0 more days` on a one-day trip · a non-owner sees the offer phase · Paste's save cannot fail · `.progress` shared between a checklist and a transfer · the paste draft is module state and does not survive a reload · `importItinerary` has no partial-failure report · a split row inherits the original's `raw` line.

---

## 6a. Review comments addressed (Lead Ming, 5 Sep)

Ten comments, all on the artboards. Eight were the same request in different places — *show me the full screen where this appears* — which was a fair criticism: the artboards were crops of the parts being changed, with no surrounding screen. Fixed by adding in-situ frames and a "where this lives" note per area. Two were product input.

| Comment | Response |
|---|---|
| Where is the collapsed `Ana's update` row shown? | **Artboard 1 §E, new:** the full Plan screen at 390 × 844 in both states — banner and collapsed row — plus a table of all eleven surfaces and the tab each is on. |
| What is the purpose of "What they get"? | **Answered on the artboard**, under the Share frame: it is the only place the app states that sharing hands over a *copy* rather than a live document, and today it renders after the decision it explains (F-4). |
| "Sending updates" should only be shown to the owner, when sharing | **Correct, and that is the design** — P0-1 §4.3, plus B-5, which fixes the fact that a joined copy renders this offer screen today (IF-6). Stated explicitly on the artboard rather than left implicit. |
| Share by entering an email address instead of a link | **OD-4** — recorded with a recommendation, not absorbed. It changes the sharing model, not the screen. |
| What does `SHORT BY` mean? | **OD-5** — the question is the finding. Explained on the artboard; recommended rename to `OVER BY`. |
| Where does "Changes on this phone" appear? | **Artboard 3, new:** the full screen, plus a note that it is reached one way only — the rust warning strip on the Plan tab. |
| What is tile download, and on which page? | **Artboard 3, new:** a plain-language note — a tile is one square of the map image; keeping an area offline downloads every tile covering it, from Map ▸ Kept maps ▸ an area. |
| Where does the paste `DONE` receipt appear? | **Artboard 2, new:** the full screen, and why it is a screen rather than a toast. |
| When does `Save 8 stops` enable? | **Answered on the artboard:** disabled only while something is genuinely unresolved — an unread line, an unanswered guess, or an invalid row. Never gated on rows the parser read cleanly; on a clean paste it is live on arrival. |
| What does `More` do? | **Answered on the artboard:** it holds the two bulk actions — `Drop the n rows that need me` and `Undo the drops` — kept out of sight because in a well-graded list there is usually nothing to do in bulk. |

No design decision changed as a result. The artboards gained context; the canonical documents gained OD-4 and OD-5.

---

## 6b. Review comments addressed — round 2 (Lead Ming)

Eleven comments. Three were more "show me the full screen", which is now done for every surface in the batch. Two found **real errors in my artboards**. Four changed the design. Two were answered.

| Comment | Response |
|---|---|
| "Align this design with how the current web app is designed" (×2, on the tab bar) | **My error, corrected twice.** First pass fixed the order and colours from `TABS` in `nav.js` (I had invented a `Trips` tab and put Plan first) but still drew placeholder squares. Second pass took the bar from source properly: the five real glyphs from `icon.tabMap/tabPlan/tabShop/tabPrep/tabLog` in **`util.js`** (20×20, stroke 1.7, recoloured by the caller), and the shell from **`app.css`** — `.tabbar` gap 2 / pad 7·8·10 / top rule `#E4E8E5`, `.tab` min-height 46 radius 12, **`.tab.on`'s filled `--bone` pill** (the bar's single most recognisable feature, and it was missing), `.tab-label` 9.5px/700 for every tab. Fixed in all three frames that carry a bar. |
| "What does 'Later' mean?" | The ghost button on the update banner. **Explained on the artboard**, and it is the reason F-1 matters: today `Later` means *gone for the session*, and Review has no other entrance. In this design it means what the word says — the banner shrinks and waits. Kept as `Later` because it is now accurate rather than misleading. |
| "Sending updates should appear only when sharing a link or adding a person, not in general" | **Adopted — B-11.** The role choice moves out of the Share screen and into the invite / create-link sheet, attached to the person or link being created. At rest there are no radios. The owner's row has no chip (an owner can always send); a non-owner sees no role control at all. **No P0-1 copy changed — only placement.** |
| "Is 'What they get' display-only? Can it hide behind a more-information button?" | **Adopted with one condition — B-12.** It hides *after its first read*, as a `What they get ›` row with its one-line summary still visible. It stays open the first time because it is the only place the app says sharing hands over a copy rather than a live view, and that has to land before either share button. |
| "Design both, decide later in development" (OD-4) | **Done.** Both doors are designed in artboard §F and flow doc §3.0 — one Share screen, one join, and a three-row table of exactly where they differ. OD-4 is no longer a decision waiting on you; the caveat about what a standing invite must not become is recorded with it. |
| "Still confused how a row is accepted or resolved — is it resolved automatically until no conflict?" | **Near enough, and now stated exactly**: a four-row grade table on the artboard and in the paste doc. The grade decides the starting state; nothing the parser guessed at is ever resolved on the user's behalf; the save unblocks when no row is left in `?` or `!`; accepted is a starting state, not a lock. |
| "What happens when we exit the Done page? Will the saved stops still appear? If yes, why is this page needed?" | **Verified and answered honestly.** The ✕ and `Open the Plan` already do the same thing in source, and the stops are saved either way. The screen earns its place on two sentences the Plan cannot carry — the unplaced-stop count and `Last import`. **Recommendation: keep it**; if it were ever cut, the unplaced-stop count must move to the Plan's warning strip first. |
| Where do the stuck-changes cards appear? (×2) | **Labelled**: they are three crops of one screen, in order, in one scroller — the full screen sits beside them. |
| Show the tile-download bar in a full screen | **Artboard 3, new:** the full area screen mid-download — the bar is one card, the kept box stays visible, the toggle and chips stay usable, nothing is blocked, no overlay. |

**Artboard errors of mine, found in review and fixed** — all of one kind: **drawing what the app already defines.** Four rounds of it, recorded because the pattern matters more than any single instance:

1. **The tab bar**, three passes — invented tabs (a `Trips` tab, Plan first) → placeholder squares with no active pill, when the real glyphs sit in `util.js` → seven frames missing the bar entirely, which had them specifying layouts against 64px the real 780px screen does not have.
2. **The §F invite sheet**, hand-drawn while `.sheet` / `.sheet-grab` exist in `app.css`; and its caption asserted **z-order** as the reason a scrim spares the tab bar, when the real reason is **containment** — a wrong mechanism stated as a source claim, which is worse than a wrong pixel because a developer could act on it.
3. **The §E Plan rows**, drawn as generic time-and-name cards with a chevron, when `stopRow()` renders a three-column row — `.plan-gutter` (start, end, derived duration) · **`.plan-spine` with its dot and connecting line, the signature element of the screen** · `.plan-card` with a numbered `MAIN n` badge — and no chevron anywhere. The frames whose whole purpose was *"show me the banner in place on the real Plan"* were showing a Plan that does not exist. Rebuilt from source; verified 7 rows, 7 dots, 5 connecting lines, 0 chevrons.
4. **A padlock emoji in the join link bar**, an asset that does not exist — `icon.lock` is absent from `util.js`, so `raw(icon.lock || '')` has always rendered nothing (IF-8). Removed, and the flow doc's §4.1 corrected: it had asserted the glyph as *verified existing state*. **Decided: no glyph, and do not add one** — `.join-bar` is the app's own strip, and a padlock drawn by a page counterfeits the browser's security indicator.

5. **The §E Plan header and day chips**, drawn as a trip-level header with a `⋯` menu, a status dot and a `from Ana` marker. Source (`plan.js` 53–72, `dayPills` in `parts.js`, `app.css` 232–282): the title is the **day** — `.screen-title` 24/700 `Day 3` — the date label is `.screen-sub`, the right-hand control is an `.iconbtn.filled` 40×40 r13 holding `icon.pencil('#14201C', 17)`, `.head-row` has exactly two children, and pills are `.pill.small` h30 with a `.pill-wx` forecast slot. Rebuilt and measured. **Two consequences worth keeping:**
   - **The frames are now explicitly the no-forecast state.** `store.weather()` returning nothing means empty `.pill-wx` slots *and* no `weatherBanner()`, which is the only condition under which the update banner is first in the scroller — so the caption's claim and the drawing now agree. With a forecast, the weather strip sits above it.
   - **The `from Ana` marker is off the Plan header**, where it was ungrounded in `plan.js` **and** contradicted §5 of the flow doc, which places it on the My-trips card, the Map trip chip and Trip settings. §5 was right; the frames were wrong. Fixed in the frames rather than by widening §5 — the marker's whole point is that it names *whose copy this is* on surfaces where a trip is one of several, and the Plan header names a day, not a trip.

6. **Push-screen chrome across all three artboards** — `backHeader` recreated with typographic stand-ins: a text `‹` where `icon.back` is an 11×18 SVG, a text `✕` where `icon.close` is 16×16, a text `⌄` where `icon.caret` is 10×6 (and P0-1 §4.2 specifically specifies "the role chip **with its caret**"), plus `.push-title` at 16px with no letter-spacing (17px / -.01em) and `.push-sub` missing its 1px top margin. The `‹` measured **4.46px wide** — a 4px glyph standing in for the primary navigation control, one line away in `util.js` from the pencil I had just lifted correctly. All rewritten from source, `.head-row.center` included. **Two by-products:**
   - **The paste receipt's control is a back arrow, not a cross** — `paste.js` 707 goes through `backHeader` like every other push screen. My frame drew `✕` and, worse, three sentences of my own prose reasoned *about* that cross ("make the ✕ honest"). Corrected in the artboard and in `p1-paste-review-design.md` §8.3. Ming's comment anchor was moved onto the button, not dropped.
   - **The area screen has no push header at all.** `area.js` floats a `.map-top` column — a 40×40 `.iconbtn.filled` and the white `.area-title` card — over the live map, with everything else in an absolutely-positioned `.area-sheet` (r22 top, `0 -8px 30px rgba(20,32,28,.18)`) headed by the km × km and `SIZE` pair. I had drawn a flowing push screen with a header strip. Rebuilt; the download row is one row inside that sheet.

7. **The same fix, applied to half its instances.** Round 6 replaced the push header by matching a whole-block string, which hit **2 of the 4** `Share this trip` headers — so §A still carried the exact defect I had just reported as fixed, and my own §6b asserted every glyph was now from source. Re-done as a regex sweep on the inner glyph row across all three artboards, then verified by counting stand-ins to zero (4 headers now identical: `button 32×32 r10`, `d="M9 1L2 9l7 8"`, title `17px/700 ls-.17px`, sub `mt1px`). Also swept: **seven text `›` glyphs → `icon.chevron`** — four on the collapsed update row and the `What they get` disclosures, and three on paste candidate rows, where `paste.js` 291 renders `raw(icon.chevron)`. The three `›` left in the warning-strip rank diagram are annotation separators, not UI, and stay. **Lesson recorded: a fix verified on one instance is not a fix — sweep and count to zero.**

8. **Five named components restyled from memory — the ones the canonical docs cite *by class*.** Read `app.css` 330–351, 1967–1998, 2024–2054 and swept all three artboards:
   - **`.who-mark` was inverted.** It is a **light** chip — `--bone` on 1px `--line`, 12px/800 `--charcoal`, r9, `display:grid` — and its own source comment says why: *"a person is one grey chip with an initial, so eight travellers and 中文 names both fit."* I had drawn dark ink squares and jade circles. All 8 instances now one definition.
   - **`.btn.ghost` had no fill and the wrong border token** — it is `--bone` on `--field` (#E1E5E1) at weight 650, not transparent on `--line` at 700. 15 instances across the three files, plus invented 48px primaries pulled back to the 46px `share.js` sets inline.
   - **`.join-name` is 24px/800**, not 26px/700 — and **§4.3 of the flow doc asserted 26/700 as verified fact.** Same failure as the §4.1 lock glyph: a wrong number recorded as existing state. Both fixed.
   - **`.join-foot` is a sticky gradient, not a bordered white bar**, and `.join-fine` is 10.5px **centred**. §4.8 also explained its stickiness by the wrong mechanism — it is `position: sticky` *inside* the scroller, not `flex: none` outside it, which is exactly why it is a gradient (content scrolls under it). Right conclusion, wrong reason, same as the scrim caption. Rewritten.
   - **`.moved` — the central element of §D/§E, which I called "unchanged in shape"** — is r12 / pad 11·12, and `.moved-h` is 10.5px/800/ls.05em, not 12.5px/800 flat. Fixed. (The body line was right: `waiting.line` arrives pre-composed, so the flat sentence is correct and `.moved-l` is not needed.)
   - Also: `Stop trying to send these…` is **bare 12px rust text**, not a bordered button, and its label had drifted.

9. **Six more named components — and three were in the very `app.css` block I had open the round before.** `.join-look` (white on `--line` r13, not #FAFBFA on `--line-2` r16) · `.join-more` (11px `--soft` with `padding-top:9px`, no weight) · `.join-bar` (pad 9·14 and 11px, sizing to its text — and **§4.1 still asserted "28px … 11.5px" as spec**, in the same section I had just rewritten for the lock glyph) · `.pick-chip` (bone, **no border**, and `.on` is **jade, not ink** — my ink version also contradicted the colour contract, since the chosen term is what the recipient is *given*) · `.arrived` (a **two-column flex strip**, `gap:10px`, r12, with a 12px/800 jade title — I had drawn a card with an uppercase `.eyebrow`) · `.badge` (pad 3·7 — my `MAIN n` badge was right and every OWNER/YOU/LIVE badge in the same file was wrong).
   **Two components I had mis-identified entirely**, caught by checking the class before swapping: the area screen's DETAIL controls are **`.detail`** (flex:1 cards, bone on `--field`, `.on` = 1.5px ink border), not `.pick-chip` — so a blanket jade swap would have been a second error on top of the first; and Paste's day chips are **`.archive-day`** (h26, r8, `.on` #A8CFC0) with `.warn-fix` ladders (h30, white on `--field`) and a `.pick-chip.soft` label. Also the wi-fi switch is `.toggle` (34×20, 16px knob), not a 40×24 invention.

10. **Five components in the §A frames — and §A *is* current `share.js` `offer()`, so it was pure recreation of a screen that already exists.** `.radio` (16px, 1.6px #D2D8D3 on white; when on, jade with an **inset** 3px white ring — I had drawn an outer jade halo and a fattened border, a visibly different control) · `.linkrow` (white, r14, pad 13·14, `gap: 11px`, `.linkrow-t` 13.5/650 — I had a transparent 11·12 row with no radius) · `.dot.amber` (`--amber` **#C87F0A**; I had invented #C89A3C — on the bullet for "And it is a copy", the copy-model line) · `.hairline` (`--line-2`, `margin: 14px 0`; three variants in one file) · `.amber-note` (650, r10, pad 8·10 — the class that carries a P0-5 rule).
   **Two further finds while sweeping:** `.progress` is **h7, r4, with a jade fill** — I had drawn 6px amber bars in both the tile download and the paste checklist, so the element P1 Paste argues *reads as loading* was not even the element it argues about. And the join preview's `.join-look` has **no divider** in source — the hairline I drew inside it was invented, and is removed rather than restyled.
   **One doc/artboard contradiction closed:** `+ Add someone` (`.btn-dashed`, h48 r14) was missing from the §F manage frame while §3.2 asserted it unchanged. Drawn, with a line stating it opens the same invite sheet as the screen's primary — so B-11 relocates the role choice without removing a door.

11. **Five more, and two were the controls the arguments are about.** `.tick` — **the very gate this design removes** — is 22px, r7, 1.6px #D2D8D3 on **white**, holding `icon.tick` at opacity 0 until `.on`; I had drawn a 20px transparent square with no glyph, so §A's "today" frame misrepresented the control whose removal is OD-2. `.cand` tokens (base `--line`, `.worked` **1.5px** `--amber-bd`, and `margin-bottom: 8px`, which I had dropped) · `.linkrow-s` (11.5px `--muted` `mt1` — I read `.linkrow` and `.linkrow-t` at 720–722 and stopped one line short) · the invite sheet's email field, which is the **global `input`** (13px, 1px `--field-bd`, r10, pad 9·10, white, sizing to ≈37px — not a fixed 46px box) · `.stuck-why` (border #E7CDCD).
   **One gap closed rather than restyled:** `.cand.unread` (#F7F8F6, 1.5px dashed #C9D0CB) was never drawn, although §3.2's ladder order *leads* with the unread case. Added as a row with its three-button `.warn-fix` ladder — and the frame's counts, foot label, caption and bulk-action label all reconciled from "2 need you" to "3", since adding a row that needs a decision changes every number that describes the screen.

12. **The unread row I had just added broke three things — all arithmetic, none cosmetic.**
   - Its glyph was rust `!`, which in this design means **invalid**; `unread` is amber `?` ("needs a decision"). Two visually identical rows meant two different things, and the frame contradicted the legend printed beside it *and* the grade table below it. Fixed.
   - **`Save 8 stops` cannot be 8 with a row dropped.** This design's own rule is that a dropped row never saves, so eight parsed minus one dropped is **`Save 7 stops`** — and the Done receipt's day split had to follow (`Day 3 · 5 · Day 4 · 2`).
   - **§10's copy block never added up in the first place**: `8 stops ready` beside `1 row dropped` out of `8 rows` implies nine. One arithmetic is now fixed and stated in §10 — **8 parsed → 1 dropped → 7 saved, 3 needing a decision** — with a note that the header, foot, bulk label, summary card and Done receipt are five statements about one list.
   Also two `.cand` children never read: **`.cand-raw`** is a bordered white code block (r9, pad 8·9, white on `--line`), not bare text — it is the element that shows the user their own unparsed line; and **`.cand-acts`** carries `padding-left: 33px`, the indent that aligns a ladder under the *name* rather than under the tick (and `0` on unread rows). The TODAY frame is the "before" the ten-controls argument rests on, so its ladders were mis-indented.

13. **The frame stopped fitting its own content — and what got clipped was a state the frame exists to demonstrate.** Adding the unread row pushed the DESIGNED frame 46px past its scroller, cutting the **dropped** row in half. That row is one of the four glyph states the caption beneath it enumerates and §3.1's table lists, so the artboard was naming four states while showing three and a half. Fixed by deleting a **redundant second `✓` row** — `Ashgate Shrine` already demonstrates the accepted state, so `Harbour Steps` was showing nothing new — rather than by shrinking the row paddings or the `.cand-raw` block, which are now source-accurate and would simply drift again. **No count changed:** the frame draws a subset of the eight parsed rows either way, and the `6 stops` group badge is a claim about the day group, not about what is drawn. Verified: `? ✓ ! ? —` all intact, 45px clear, zero overflow in all three frames.

14. **The same class again, one level up: two documents censused the *same* frame differently.** §2's grade table said **5 read · 2 worked · 1 unread** (2 + 1 = 3 blockers, no invalid row in the census), while §10's arithmetic said the three blockers were **one worked, one unread, one invalid** — and the artboard printed both, its annotation card claiming "two were worked" beside a frame drawing §10's composition. Either the drawn invalid row was an uncounted **fourth** blocker, in which case every "3" on the screen understated by one, or the census was wrong.
   **Resolved as 6 `read` · 1 `worked` · 1 `unread`**, with Nishi Market a read row a validator caught after an edit. Every frame stays exactly as drawn, no count moves — and it **strengthens the section's own argument**, since the gate would have demanded a tap for six cleanly-read rows rather than five. The root confusion is now stated explicitly in both §2 and §10: **invalid is not a fourth parser grade, it is a state a read row can enter**, which is precisely why the census and the blocker count are different numbers.

15. **One stale count survived in the annotation prose** — the "answers for Ming" panel explaining *when the save enables* still said `2 rows still need you`, sitting beside a frame printing `3`. The panel whose whole job is to explain the counts was the thing contradicting them. It survived because my round-14 sweep targeted the frames and the canonical document, **not the artboards' own explanatory prose**. Now swept across all three artboards and audited by extracting every `\d+ (rows?|stops?)` phrase from the rendered page: `8 rows` parsed · `3 need you` · `Save 7 stops` · `Day 3 · 5 stops` + `Day 4 · 2 stops` · the `6 stops` group badge — all consistent, no stale variant anywhere.

16. **The Done receipt was restructured while §8.3 said it was "kept almost whole"** — and `paste.js` 705–730 was never read (the transcript only greps that file for `Open the Plan` and `reset()`). Source is **one borderless white `.card.pad`** holding `.eyebrow.jade` (`--jade` #1F6F5C), the saved sentence, the unlocated sentence as **muted text inside the same card**, and `.btn.jade` **inside the card**; the `Last import` footnote is bare `.f11 soft` text outside it. I had drawn a jade-tinted bordered card, a `--jade-fg` eyebrow, the caveat **promoted to its own amber box**, the footnote in a second white card, and the button moved to a sticky foot. **The amber promotion was the substantive error:** amber marks outcomes under P0-5, and the unlocated count is a caveat about what the outcome does not cover — boxing it in amber restates the receipt as a warning. Rebuilt from source in both places the receipt is drawn (the full screen and its crop, which had drifted apart from each other).
   Also `.cand-when` in the TODAY frame: start is **12px/700** and `.cand-when-end` is **10px/650**, with the worked row's end in **#B08A3E** rather than `--soft` — a distinct tint I had flattened, and one of the few places the app tints a *derived* value differently from a read one.

**None of it changed a design decision**, and none of it is quietly patched. **Rule: if the app defines it — an asset, a component, a row, or a rule — read it. Never draw a stand-in, never omit chrome the crop did not need, never invent an asset, and never explain a mechanism you have not verified.**

**Tab-bar presence is now decided by source, not by which crop I happened to draw.** `paintTabs(screen.chrome === false ? null : (screen.tab || current.id))` in `nav.js`, with its own comment: *"Every other screen keeps it, including the ones that highlight no tab."* Grepped across `web/js/screens/**`, **only `trips.js` and `join.js` set `chrome: false`**. So every 390 × 844 frame in this batch now carries the bar except the invite, and the tab state matches the screen:

| Screen | `tab` | Bar |
|---|---|---|
| Share (`share.js`) | `null`, no `chrome:false` | renders, **nothing highlighted** |
| the invite / sign-in (`join.js`) | `chrome: false` | **no bar** |
| Plan (`plan.js`) | `plan` | Plan |
| Paste, all phases (`paste.js`) | `plan` | Plan |
| Review (`review.js`) | `plan` | Plan |
| Changes on this phone (`stuck.js`) | `null`, no `chrome:false` | renders, **nothing highlighted** |
| an area (`area.js`) | `map` | Map |

A sheet does not hide the bar — and **not because of stacking**: `.scrim` is `z-index: 20`, *above* `.tabbar`'s 10. What protects it is **containment**. Every scrim is rendered inside `section.screen`, and `.screen` and `.screen-host` are both `position: relative`, so an `inset: 0` scrim resolves against the host box — which is `flex: 1` above `#tabbar` in the app column. Consequence for whoever implements this: **raising the scrim's z-index would not dim the bar, and moving a scrim out of the screen would.** The §F invite sheet is drawn on the real `.sheet` / `.sheet-grab` shell (radius 22, `0 -8px 30px rgba(20,32,28,.16)`, a 40×4 `#D8DDD9` grab in an `8px 0 10px` wrapper) over the scrim's `rgba(20,32,28,.34)`.

**This matters beyond fidelity: the bar is 64px.** Frames drawn without it were claiming 844px of content height where the real screen has 780px — so the Share offer scroll, the paste review list and the stuck sheet were each specified against 64px they do not have. Every frame in the batch has been re-measured with the bar in place.

---

## 7. Files created or updated

**Created**

| Path | What |
|---|---|
| `docs/design/p1-share-join-review-flow-design.md` | canonical share → join → review flow design |
| `docs/design/p1-paste-review-design.md` | canonical paste design, input to done |
| `docs/design/p1-review-bulk-actions-refinement.md` | focused refinement of approved P0-4 §6 |
| `docs/design/p1-coverage-gaps-design.md` | canonical for five remaining P1 areas |
| `docs/design/overnight-p1-review-pack.md` | this file |
| `P1 Share Join Review Flow.dc.html` | artboard — Share offer before/after, the link card, the sent state, the whole invite, the three defects at size, join pending and failure, arrival, `Later` collapsing, the four foot states |
| `P1 Paste Review.dc.html` | artboard — the review pass before/after, the ladder order, save pending and failure, the done receipt |
| `P1 Coverage Gaps.dc.html` | artboard — tile progress and receipt, the stuck header and rust state, the discard confirm, `ok`/`tight` side by side, the loop rows and back-by, the two deliberate nothings |

**Updated (annotation only, no approved decision changed)**

| Path | What |
|---|---|
| `docs/design/p0-4-review-design.md` | an APPROVED banner naming the two P1 documents that extend it, and the `.review-foot` reconciliation |
| `docs/design/p0-1-role-and-copy-identity-design.md` | §12.6 marked D-3 CLOSED, with a pointer; the original note kept beneath it |

**Not touched:** `existing-ui-audit.md`, `existing-ui-visual-reference.md`, `new-feature-design.md`, `multilingual-warning-strip-design.md`, `p0-2-currency-design.md`, `p0-3-system-sign-off.md`, `p0-5-pending-work-design.md`, `p0-decision-brief.md`, `verification-sprint-p0-6.md` (a record of a session; its errors are reconciled in the P1 documents, not edited into it), `ui-ux-design-coverage.md`, and every file under `web/**` and `firebase/**`.

**Artboard convention:** the established one — a `.dc.html` at the project root, 390 × 844 frames or 390px-wide crops, canvas mode. `docs/design/screens/` holds captures of the *running app*; nothing was captured this session, so nothing was added there.

---

## 8. Remaining P1 gaps

Named so the next batch does not re-derive them. Reasons in `p1-coverage-gaps-design.md` §8.

1. **Destination's four unseen tab bodies** — Nearby / Must-see / Shop / Notes. Four screens, a batch of their own; the empty variants are already designed.
2. **Removed from a shared trip** (`.gone-card`) — the last unowned piece of the sharing model.
3. **A place saved without a location** — a real product decision, and it interacts with Paste's `unlocated` count, so it wants doing with that in hand.
4. **The stop that is no longer on your plan** — a dead end with no way back; needs the removal model first.
5. **`Empty this trip`** — the other confirm-button exception. OD-3 sets the precedent; applying it is a five-minute pass.
6. **The sync dot's five states in 6px** — a genuine visual decision on the app's most permanent chrome.
7. **The email sign-in return path** — still unrenderable without a backend.

---

## 9. What should be designed next

1. **Nothing, until R-1 is answered.** P0-4 rests on it and two P1 documents now rest on P0-4.
2. **Then the removal model** — "removed from a shared trip" plus the stop-no-longer-on-your-plan dead end. They are the same question (what happens when something you were looking at stops existing) and they finish the sharing model.
3. **Then Destination's four tab bodies** — the largest remaining block of unseen, purely local UI, and it depends on nothing.
4. **Then implementation**, in the P0 pack's order — P0-5 (zero CSS, most screens) → P0-2 → P0-4 → the empty-state and warning-strip systems — with the P1 seam fixes folded in where they touch the same file. `Later` (B-1) is worth pulling forward regardless of the order: it is a handful of lines and it currently strands a user's only route to an update.

---

## 10. Is the product approaching a complete design baseline?

**Yes, and it is closer than the counts suggest.**

Before this batch the coverage matrix had **41 of 69 rows with a captured visual baseline** and **37 rows carrying a decision flag**. This batch designs or formally records **eleven of those rows** — the Share cluster (4), Join (2), Review's bulk (1), Paste (2), tile download (1), stuck changes (1) — and closes **four of the seven P0-6 decisions** (D-1, D-3, D-4, D-6).

What that leaves:

- **Every P0 is designed.** Six await your sign-off; none awaits more drawing.
- **The sharing round trip is designed end to end** for the first time — Share, Join, arrival, identity, banner, Review, receipt — with one hole left in it (removal).
- **Both import paths are designed**: paste, and the trip file.
- **The gaps that remain are local and shallow** — one flow (removal), one screen family (Destination's tabs), one visual question (the sync dot), and a handful of P2 cosmetics. None of them changes a model; all of them fit inside a settled vocabulary.

**The honest caveat is unchanged from the P0 pack: understanding is nearly complete and confirmation is nearly zero.** Fifty-plus decisions are designed and recommended; six are waiting on you and everything downstream of R-1 is provisional until it is answered. The design baseline is not complete because it is under-designed — it is incomplete because it is unsigned.

---

## Tomorrow morning

**Read:** this file. Then, only if you want the reasoning: `p1-share-join-review-flow-design.md` §1 (the five-row table of what is broken in the seams — two minutes) and `p1-paste-review-design.md` §2 (the argument for dropping the gate — three paragraphs).

**Approve or amend four new things** (two raised by Ming in review):

1. **OD-1 — a live link's role becomes changeable** (recommended), with the sentence that states the consequence.
2. **OD-2 — Paste stops asking you to confirm rows it read cleanly** (recommended). The one product call in this batch.
3. **OD-3 — `discardPending` stays a confirm-button exception**, with one copy change (recommended).
4. **OD-5 — the sub route's negative tile becomes `OVER BY`** (recommended). One word, existing shipped copy.

**Resolved in review, no longer needing you:** **OD-4** — both sharing doors are designed (artboard §F, flow doc §3.0). Worth one read for its caveat only: a standing invite must govern *who may take a copy*, not *what a copy is*, or it breaks P0-1 and P0-4 together.

**Artboard errors of mine, found in review and fixed:** all one kind — **drawing what the app already defines** — across ten rounds, ending with twenty-one named components reconciled against `app.css` (`.who-mark`, `.btn`/`.btn.ghost`/`.btn-dashed`, `.join-name`, `.join-foot`/`.join-fine`, `.join-look`, `.join-more`, `.join-bar`, `.pick-chip`, `.arrived`, `.badge`, `.detail`, `.archive-day`, `.warn-fix`, `.toggle`, `.radio`, `.linkrow`, `.dot`, `.hairline`, `.amber-note`, `.progress`). Every round closed by sweeping and counting to zero, not by checking one frame. **None changed a design decision.** Details in §6b.

**Five wrong facts were recorded in canonical docs as verified state, and all five are corrected:** the join link bar's lock glyph (**IF-8** — it has always rendered text only) and its metrics (pad 9·14/11px, not "28px/11.5px"), `.join-name` (24px/800, not 26/700), `.join-foot`'s stickiness (`position: sticky` inside the scroller, not `flex: none` outside it — which is why it is a gradient), and the paste receipt's control (`icon.back`, not a cross). These matter more than the pixels: a developer reading the spec would have implemented every one of them.

**A twelfth round found the more interesting class of error: arithmetic, not appearance.** Adding one `unread` row to a frame changed five numbers that describe that screen, and I propagated none of them — while §10's copy block had never added up (8 saved + 1 dropped out of 8 parsed). One arithmetic is now fixed in the canonical doc and used everywhere: **8 parsed → 1 dropped → 7 saved.** It generalises past this batch: **a count in an artboard is a claim about a list, and a screen usually makes several of them at once.**

**Rounds twelve to fifteen were all one error in different clothes: a screen makes several simultaneous claims about one list, and I kept changing one of them.** A row's glyph, the header count, the foot count, the bulk-action label, the summary card, the Done receipt, two separate censuses in the prose, **and the annotation panels that explain the counts** all describe the same eight rows. Each round fixed the instances I thought to look at and missed the next surface out. **Rule: when a frame's contents change, re-derive every number and every census that describes it — in the frame, in the captions, in the annotation panels, and in the canonical document — then audit by extracting every count from the rendered page rather than by checking the ones you remember.**

**The pattern, stated plainly, because it is the useful output of eleven rounds:** I read source for *behaviour* — what a function returns, when a state can occur, which handler fires — and drew *appearance* from memory, including for components the canonical documents name by class, and including screens (§A's Share offer, §A's Paste review) that exist in the app today. The two sharpest instances are both **the control the argument is about**: `.progress` is a **jade 7px** bar, and P1 Paste's case is that it *reads as loading* — I had drawn it amber at 6px; and `.tick` is a **22px white box holding a hidden tick glyph**, the gate OD-2 proposes removing — I had drawn a 20px transparent square. In both, the artboard argued about an element it had not reproduced. The habits that close it: **before drawing any element the docs name by class, or any screen that already exists, read it**; **before claiming a value or a mechanism as existing state, read the line that sets it**; and **when a class block is read, read to the end of it.**

**Glance at, but I have decided:** **B-1** (`Later` collapses instead of dismissing — today it strands the only route to a pending update), **B-2** (the join preview keeps its current day and gains a label; the *documents* were wrong, not the code), **R-2p** (`finishReview` moves out of the bulk handlers, so P0-4's batch undo can exist).

**Still waiting on you from the P0 pack, and blocking implementation:** **R-1** (three-way Review with a retained base), **C-1**, **S-1**, **S-2**, **S-3**.

**Nothing was implemented, and nothing in `web/**` or `firebase/**` changed.**
