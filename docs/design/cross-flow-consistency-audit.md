# Cross-flow consistency and implementation-ambiguity audit

**Date:** 5 Sep 2026 · **Verified against** the working tree in this project (`web/**`), read this session
**Status:** audit. **Nothing implemented. No application code changed. This document holds no canon** — where it resolves something, it names the canonical document the resolution belongs to and that document is where an implementer reads it.
**Scope:** the whole approved baseline — P0-1 · P0-2 · P0-3 · P0-4 · P0-5 · the three P1 batch documents · the five P1 documents written this session — read against each other and against source.

**Method.** Nine axes, in the order the brief names them. For each: what the approved documents say, whether they agree, and — where they do not — the resolution under the decision hierarchy (**existing product behaviour → existing UX principles → the stated principle for that screen → cost of being wrong**), recorded rather than applied silently.

**Headline: eight contradictions, six of them between a document and the source, two between two documents. None required overturning an approved product decision.** Every resolution is a correction to a written record or a scoping of an existing rule. Plus **eleven implementation ambiguities**, nine resolved here and two carried as OPEN DECISIONS — and one pre-existing undecided P1 (OD-9) carried forward unchanged.

---

## 1. The eight contradictions

| id | Axis | Contradiction | Resolved in | Cost had it shipped |
|---|---|---|---|---|
| **X-1** | Identity / sharing | **`.gone-card` tells a removed person their itinerary is gone. The store deletes nothing, the kept list on the same screen says it survives, and Share's own hint tells the *owner* the opposite.** Three statements, two false, one screen. | `p1-absence-and-removal-design.md` §2 — two sentences corrected | The single worst copy failure found in the baseline: it contradicts P0-1's product model to the one person whose confidence it costs. |
| **X-2** | Review / destructive | **`Empty this trip` on a joined copy permanently strands the itinerary** — under P0-4's retained base every stop becomes case 7 ("I removed it") and case 7 never reaches the screen. | same, §5.3 — emptying clears `reviewedSnapshot`, entering P0-4's approved no-base mode | An unrecoverable trip, produced by two individually-correct approved designs meeting. |
| **X-3** | State feedback | **The warning strip's rank order is written down three different ways**: `p1-coverage-gaps-design.md` §5, `remind.js`'s own header comment, and `remind.js`'s code. The red loop reminder outranks stuck; both prose versions have it last or absent. | `p1-status-visibility-design.md` §2.2 — the code is right, both prose statements corrected | An implementer reordering the code to match an approved document would have demoted the only time-bound, unrecoverable warning in the app. |
| **X-4** | State feedback | **P0-5's audit claims to be complete and misses the sign-in module.** §1 says "twelve strings, five modules" and enumerates nineteen call sites; `Opening Google…` and `Sending a link to {email}…` are in neither the table nor the canonical label list. | `p1-account-and-sign-in-design.md` §4 — **P0-5 §7's list becomes eighteen labels**, and the second is de-interpolated under P0-5's own §6 rule | Two multi-second waits in the app's first-run flow would have kept the pattern P0-5 exists to remove. |
| **X-5** | Empty states / destructive | **Coverage §2D calls the archive card a P2 cosmetic** ("collapsed archived stops") while it is the reversible first stage of the app's destructive model, and describes the Plan's live-stop delete as a swipe that does not exist. | `p1-plan-editing-design.md` §6, RC-9 / RC-10 | The Plan's safest interaction would have been re-designed as a cosmetic, or a swipe would have been added to live rows that already have a better answer. |
| **X-6** | Sharing / documentation currency | **Two approved documents describe the Share offer phase differently.** P0-1 §4.1 places the role radios on the Share screen; `p1-share-join-review-flow-design.md` §3 (B-11) moves the whole role choice into the invite sheet. Both read as current. | Recorded here. **B-11 wins** — it is the later approved decision and P0-1's §7 copy is unchanged by it, which is why the two look compatible and are not | An implementer reading P0-1 first builds radios at rest on a screen designed to have none. |
| **X-7** | Warning strips | **The `queued` strip renders no action**, against "a warning always names the tap that fixes it". | `p1-status-visibility-design.md` §2.3 — a **knowing exception**, with the rule it satisfies instead | Either a button labelled "wait faster", or a rule quietly broken with no record. |
| **X-8** | Currency | **P0-2 §12.5 lists seven `\|\| '¥'` fallbacks to remove. There are eight** — `itemEditor`'s price-field label is fed from two screens and is not on the list. | `p1-destination-tabs-design.md` §4, RC-19 | A form field labelled in a currency the trip does not have, after every other surface had been fixed. |

**Two of the eight (X-1, X-2) are the ones worth reading the detail of.** The other six are corrections to records.

---

## 2. Identity — consistent, and one thing worth stating

**Checked:** owner · joined copy · `from Ana` · role terminology · who can send updates.

| Question | Answer, and where it is settled |
|---|---|
| What is a joined copy? | Your own trip, seeded from a snapshot, fully editable. P0-1 §1, and every document since. |
| Where does it say whose it is? | The My-trips card, the Map trip chip, Trip settings' push sub. Not on the Plan (a day is not a trip), not on all five tabs (no such surface exists). P0-1 §5, re-confirmed against `plan.js` this session. |
| Who can send updates? | `owner` and `edit`. `read` receives, and **the control does not exist** rather than being disabled. P0-1 §4.4. |
| What words are used? | `Can send updates` / `Receives updates` — the sending axis, never permission. The role ids `edit` and `read` **never surface**. P0-1 §3.2. |
| Does the marker survive removal? | **Yes, until `Keep my side` is tapped.** `removedFromTrip` clears `people`, `link` and `share` but not `sharedFrom`; `keepMySide` clears the relationship. Verified this session, and it is right: until you decide, it is still the copy Ana sent you. |

**One synthesised principle, now true in five places and never written down:**

> **PR-1 · The app never invents a person, a place or a picture.** A cover photo comes from the trip's own Log or from a tint and the trip's mark — *never a stock photo of somewhere you have not been* (`trips.js`'s own header). A `.who-mark` is one glyph of a real name, never an avatar. A missing name is `the owner`, never a placeholder person. A place with no position is said to have none, never given an approximate one. A must-see spot with no picture says `example photo`.

Recorded because it is the rule behind four separate approved decisions (P0-1's Alternative 3, the cover fallback, the no-position treatment, and the hatched hero) and the next person to fill an empty surface will need it.

---

## 3. Sharing — consistent post-P1, one currency risk

**Checked:** Share · Join · post-join · sending updates · receiving updates.

The round trip is coherent end to end after the P1 batch: the copy model is stated before the decision that needs it (B-3), the role choice sits in the sharing moment (B-11), the post-send state is a fact with a timestamp derived from `sentAt` (B-4), a non-owner never sees the offer phase (B-5), the invite says what it grants (B-6), joining lands on the previewed day (B-7), and `Later` collapses instead of removing the only door (B-1).

**Three words are used for one thing across nine surfaces, and they agree:** *a copy* · *an update* · *you decide what to take, one thing at a time*. Checked on Share (both phases), the invite's four promises, the arrival banner, the Plan banner, the collapsed row, Review's header and preamble, and the receipt. **No fourth synonym anywhere.**

**The risk is not a contradiction, it is currency (X-6).** Three documents now describe the Share screen and the newest one moves a component the oldest one places. Mitigation, and it is the reason §6 of this audit exists: **the coverage matrix must name the document that is current for each surface**, not merely that a surface is designed.

**One gap remains in the model and is unchanged:** a removal is detected nowhere (`removedFromTrip` has no caller — IF-9). The screen it drives is now correct; nothing calls it yet.

---

## 4. Review — consistent, and one clarification an implementer needs

**Checked:** update banner · Review · three-way diff · mine/theirs terminology · decisions · undo · completion receipt.

All consistent. `YOURS` / `THEIRS` are the keys (P0-4 §4.2, with `ANA'S`/`MINE` rejected on the same script evidence P0-1 used); the person is named once per screen, in the header; the title is the subject as *you* know it; decisions write immediately and join the app-wide undo bar; the receipt comes from `lastReview` and survives navigation.

**Three clarifications, all resolved from source this session, all implementation-critical:**

1. **"They removed it" means archived *or* deleted.** `share.js` `stopIndex()` skips `item.archived`, so a stop the owner *archived* is absent from their snapshot and produces `THEY REMOVED` on the recipient's copy. Correct, subtle, and undocumented. **The base snapshot must be indexed through the same `stopIndex`** — which it is, if `diffSnapshot` takes the base as a third argument and indexes it with the existing function (P0-4 §11.2).
2. **`Take theirs` on a removal hard-deletes; it does not archive.** `takeChange` filters the item out of `d.items`. **This is correct and must not be "fixed" to match the Plan's two-stage ladder:** archiving it would file a stop *the other person* removed into *your* `REMOVED FROM THIS DAY` section, which is your own removal shelf. The Review row's two buttons **are** the in-row confirm, and the undo bar follows — so the app-wide destructive pattern holds, in its own idiom (§8).
3. **`keepMySide()` must clear P0-4's new fields.** It clears `declined` and `tookVersion` today; under P0-4 it must also clear `reviewedSnapshot` and `lastReview`. Otherwise a trip that has stopped being a shared copy keeps a receipt for an update from someone it is no longer connected to, and holds a base that can never be diffed against anything. **Resolution: it clears both.** Recorded here and carried into the coverage matrix; it belongs to P0-4 §11 when that document is next opened.

---

## 5. State feedback — one pattern, two knowing exceptions, one list extended

**Checked:** pending · success · warning · error · stuck · offline.

P0-5's rule holds everywhere it has been applied this session — the join button, the sign-in buttons, sign-out, add-a-stop, the paste save, the retry, the cover picker. Its two hardest rules survived contact:

- **R10 (synchronous work gets nothing)** was tested against nine new controls this session — `Keep my side`, `Empty this trip`, `Add back`, `MOVE TO`, the time commits, the drag drop, `Create and pick places`, `Use a different address`, every Review decision — and **none of them gained a pending state.** That is the rule doing its job; it is also the rule most likely to be broken later, exactly as P0-5 §9 predicts.
- **R4 (`.amber-note` for outcomes only)** now has one more consumer removed (sign-in) and one refusal correctly redirected to a field (§6 of the Destination document).

**Two knowing exceptions to "a warning always names the tap that fixes it", and they are the same shape:**

| Exception | Why it is not a warning |
|---|---|
| The `read` user's send block (P0-1 §4.4) | There is no tap that fixes it, so it is a fact about who sends, not a warning |
| The `queued` strip (X-7) | The condition resolves itself, and the body spends its whole length saying so |

**One new rule that both satisfy, stated so a third exception has a test to meet:** *a condition with no fix states that it needs none, in the same breath, and takes no action button.*

**P0-5 §7's canonical label list goes from sixteen to eighteen** (X-4): `Opening Google…` and `Sending the link…`. The second is the fifth de-interpolated label.

---

## 6. Empty states — the three tiers hold, and the private kinds are the proof

**Checked:** the three-tier system's coherence across every surface designed to date.

**It holds, and this session was its first real test** — five panels in one screen, three of which change tier on a joined copy and two of which **must not** (`p1-destination-tabs-design.md` §3). The rule that produced that answer is P0-3 §1.4's shared-kinds limit, and the outcome is the promise working: on the two tabs that are yours alone, a joined trip is indistinguishable from your own.

Tier assignments made this session, all against §1.2's three-cause test:

| Surface | Cause | Tier |
|---|---|---|
| Destination Info / Nearby / Must-see, joined copy | shared-state emptiness | **3**, jade, no ink |
| Destination Shop / Notes, joined copy | user-caused — the kind never travels | **2**, unchanged |
| The stop that has gone | neither: a stale reference | **2**, plus one recovery action |
| Removed from a shared trip | not an empty state at all — a loss statement | `.gone-card`, its own recipe |
| The Plan's empty day | user-caused | **1** — and **already implemented** (RC-12) |
| The blank map with no kept areas | a missing picture, not a missing thing | not an empty state — an amber condition card |

**One clarification:** `.gone-card` is deliberately outside the tier system. A tier answers "why is this container empty"; the removal card answers "what just happened to you". Confusing the two is how the false sentence in X-1 got written.

---

## 7. Warning strips — structure consistent, one reuse to be explicit about

**Checked:** the multilingual fact-first structure's consistency.

The four kinds, three slots and two invariants (P0-3 §2.2) are unchanged and unchallenged. The `dayIssues()` split into `{relation, name, when, consequence}` is still the only data-shape change it needs.

**One implementation ambiguity, resolved.** `p1-absence-and-removal-design.md` §4.2 puts a `NO POSITION` strip on Destination, using `.warn` / `.warn-label` / `.warn-text` / `.warn-fix`. **That is a presentational reuse of the strip outside `dayIssues()`, and it must not become a fifth issue kind.** The test: `dayIssues()` answers *"what is wrong with this row relative to the rest of the day"* — order, overlap, reversal, no time. A place with no coordinates is wrong relative to nothing; it is a property of the place. Same strip, different source, no new kind.

It also satisfies the strip's own invariant: **it has no name line, because there is no other party** — and P0-3 §2.2's rule is that a slot is *omitted, never substituted*. Two of the four real kinds (`reversed`, `notime`) already do exactly this, so the pattern is established.

**One label-drift note:** source says `OUT OF ORDER`; P0-3 §2.2 approves `LISTED AFTER`. Not a contradiction — a designed change awaiting implementation — recorded as IF-18 so the two are not read as disagreeing.

---

## 8. Destructive actions — the rule, and exactly two exceptions

**Checked:** swipe deletion · confirmations · undo · trip reset · everything else destructive.

**The pattern:** swipe → latch at 88px → in-row confirm → 6s app-wide undo. Nine users: a trip, a stop (once archived), a sub route, a place, a shopping item, a must-see spot, a note, a kept area, a person.

**The rule that now covers the whole app, derived from the two exceptions rather than asserted:**

> A **confirm button** is permitted only where **both** are true: the thing destroyed cannot be reconstructed by the user, and **there is no row to swipe.** Everything else is swipe → in-row confirm → 6s undo.

| Action | Pattern | Passes the test? |
|---|---|---|
| `discardPending` | confirm button | **Yes** — a queue of invisible writes, on a screen with no rows (`p1-coverage-gaps-design.md` §2.3, OD-3) |
| `Empty this trip` | confirm button | **Yes** — seven kinds at once, across screens, nothing to swipe (`p1-absence-and-removal-design.md` §5.3, OD-6) |
| Everything else | swipe → undo | — |

**Four things that look destructive and are not, stated because each one invites a confirmation nobody should add:**

| Action | Why not destructive |
|---|---|
| The Plan's `✕` | Archives. The row stays on screen with `Add back` on it. |
| `Keep my side as its own trip` | Keeps everything and drops a relationship. |
| `Sign out` | The identity id survives; the trips stay; signing back in is the same person (`store.js`'s own comment). |
| `Turn the link off` | Stops new joins. Everyone who has the trip keeps it, and the screen says so in two sentences. |

**And two undo-shaped rules now stated once each:** `finishReview` is not undoable (it is the act of leaving, and every row was individually undoable at the time — P0-4 §5.2); a bulk action gets **one** undo for the batch, never one per row.

**The undo bar's own rule, from `p1-status-visibility-design.md` §3:** the label names the *thing*, never the act alone — because the bar survives a screen change, and `Deleted` is unusable once you have left the list it came from.

---

## 9. Navigation — one principle, now true in six places

**Checked:** where you came from · where you go after an action · what happens if you leave mid-operation · what happens when you return.

**The principle, synthesised from six independently-made decisions that all agree:**

> **PR-2 · A return lands on the thing the action was about, never on whatever was selected before it.**

| Decision | Lands on |
|---|---|
| Join → arrival (B-7) | the day the invite previewed |
| Review → `Back to the day` (B-10) | the day most of the update touched |
| Paste → `Open the Plan` | the first day that got stops |
| The stop that has gone | the day, or the places list you came from |
| `MOVE TO` on an archived row | the day it went to is named in the card |
| Trip open from My trips | Map, at the trip's current day |

**Leaving mid-operation — one rule, one shape, and three named exceptions** (P0-5 R8): module-level pending dies with the screen, the work continues, and the outcome surfaces where the *result* lives. The exceptions are the three surfaces that **are** the work: the New trip modal, the Join foot, the Paste save. `p1-plan-editing-design.md` §7.3 adds a fourth of the same shape (the add-a-stop form stays up), stated rather than assumed.

**Returning — what survives and what does not**, checked module by module this session:

| Survives (store or phone) | Dies with the screen (module state) |
|---|---|
| `state.editingPlan` — edit mode is a lens, not a transaction | `addOpen`, `form`, `notice`, `laneSheet` (Plan) |
| `state.undo` — the six seconds belong to the deletion | `tab`, `sheet` (Destination) |
| `awaitingEmail()` — the wait is in someone's inbox | `signingIn`, `busy`, `covering` (Trips) |
| `trip.reviewed` / `lastReview` (P0-4) | `phase`, `text`, `read`, `openRow`, `result` (Paste — IF-3) |
| `removal()`, `sharedFrom`, every trip field | `confirming` (Trip settings — **and it is cleared by the back handler, which is correct: a confirm must never be armed on return**) |
| The collapsed update row survives a screen change and resets on launch (B-1) | `later`'s replacement — by design |

**One inconsistency accepted, not resolved:** Paste's draft is the only multi-step piece of work in the app that a reload loses (IF-3). It writes nothing until Save and says so at the top, so nothing is *lost* — but nothing is recoverable either. `p1-paste-review-design.md` §13 rejects a stored draft for now, on the grounds that it would be the app's first. Re-confirmed: still right, still the only case.

---

## 10. Implementation ambiguities

Read as if another developer received only the design documents and this repository. **Eleven found; nine resolved here or in a canonical document, two carried as OPEN DECISIONS.**

| # | A developer would have to guess | Resolution |
|---|---|---|
| 1 | Whether `.hint-jade` exists | **It does not** (IF-10). Write it from P0-1 §8's recipe. **It blocks two approved specs, so it is the first CSS task, not the last.** |
| 2 | What `keepMySide()` does to P0-4's `reviewedSnapshot` and `lastReview` | **Clears both** (§4.3). |
| 3 | Whether `NO POSITION` is a fifth `dayIssues()` kind | **No** — a presentational reuse of `.warn` (§7). |
| 4 | Whether "they removed it" covers an archived stop | **Yes** — `stopIndex()` skips `archived`, so archive and delete are one signal (§4.1). |
| 5 | Whether `Take theirs` on a removal should archive rather than delete | **Delete.** Archiving would file someone else's removal on your own shelf (§4.2). |
| 6 | Which document is current for the Share offer phase | **B-11** in `p1-share-join-review-flow-design.md` §3; P0-1's §7 copy is unchanged (X-6). |
| 7 | How many `\|\| '¥'` fallbacks there are | **Eight**, not seven (X-8). |
| 8 | How many canonical pending labels there are | **Eighteen**, not sixteen (X-4). |
| 9 | The warning strip's rank order | **Five slots, red reminder first** (X-3). Do not reorder the code to match either prose version. |
| 10 | Whether the app should offer to install itself | **OD-8** — undesigned, and it needs the user before a designer (`p2-triage.md` §C.1). |
| 11 | Whether `Empty this trip` may delete the Log at all | **OD-6** — the confirm now names it; whether the capability should exist is a product call. |

**Three near-misses worth naming**, because each would have looked like a bug rather than an ambiguity:

- **`removedFromTrip()` has no caller** (IF-9). A developer implementing `.gone-card`'s corrected copy would find the screen unreachable and might assume the copy was speculative.
- **`state.session.notice` is computed and read by nothing** (IF-21). The email round trip's only record of itself is discarded, which reads as "the flow is unfinished" rather than "one line is missing".
- **Three defined-and-unused CSS classes** (`.review-foot` by Review, `.arrived`, `.archive-moved`), each of which an approved document now consumes. A developer finding them unused might delete them.

---

## 11. What this audit did not find

Stated so the absence is evidence rather than silence.

- **No approved product decision was contradicted by another approved product decision.** X-6 is a placement supersession, X-2 is two correct designs meeting badly, and the other six are records disagreeing with source.
- **No colour is used against its meaning** in any document written to date. Re-checked across all thirteen: jade = given, amber = yours or uncertain, ink = the act, rust = broken. The two places this session pushed hardest — a working joined copy after removal, and a working trip with a blank map — both correctly refused rust.
- **No document introduces a new component family.** Net new CSS across the entire baseline: `.warn-name` · `.warn-fact` · tier-1/tier-3 block classes · `.side.stacked` · `.review-group` · `.moved-min` · two `.join-bar` rules · `.cand.invalid` · **`.hint-jade`** (which is a repair, not an addition) · one property change on `.sync-dot.grey` · one property on `.acct-sub`.
- **No string makes a person the subject of a negative verb.** Checked line by line across the five new documents, including the two places it was hardest: the removal card and the "link has stopped working" line.
- **No new blocking interaction.** The app has two, and it still has two.

---

## 12. Status

| Item | Status |
|---|---|
| Nine axes audited across thirteen documents and the source | DONE |
| **Eight contradictions found; all eight resolved and recorded** | DONE — X-1…X-8 |
| Two synthesised principles stated for the first time (PR-1, PR-2) | DONE |
| The confirm-button test, derived from its two exceptions | DONE (§8) |
| The knowing-exception test for "a warning names its tap" | DONE (§5) |
| Eleven implementation ambiguities; nine resolved | DONE (§10) |
| **OD-6** (may `Empty this trip` delete the Log?) · **OD-7** (should a blank map say why?) · **OD-8** (is install in scope?) | CARRIED to the review pack |
| **OD-9** (is the forced jump to Paste after creating a trip right?) | CARRIED — **not found by this audit**: it is a pre-existing undecided P1 (coverage §A row 3), neither a contradiction nor an ambiguity, and it is listed here only so the review pack's four open decisions and this document's list agree |
| Any approved product decision overturned | **NONE** |
