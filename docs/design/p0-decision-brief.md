# P0 Decision Brief — Travel Planner

**Date:** 4 Sep 2026 · **Verified against** `main` @ tree `1d3df5956fb8`
**Status:** decision brief only. Nothing implemented, nothing redesigned, no code changed, no artboards drawn.
**Companion:** `docs/design/ui-ux-design-coverage.md` (§6 for the full P0/P1/P2 list).

Two of the seven are **not decisions at all** — they are verification gaps (P0-6, and the first half of P0-7). They are kept in the P0 set because they block confident decisions elsewhere, but they need approval to *proceed*, not a judgement call.

---

## P0-1 · A role has no consequence anywhere in the app

**1. What the app does today.** `share.js` defines three roles: `owner`, `edit` ("Can send their changes to everyone else on the trip"), `read` ("Gets updates and can do whatever they like to their own copy"). The role is chosen *before* the link exists, stored on the link and per person, and changeable afterwards from a chip on the person row. `join.js` reads the role off the `published/{code}` envelope; `firestore.rules` limits join-as-editor to appending your own uid. **No screen module branches on role.** There is no read-only rendering anywhere in the product, and no visible difference between a trip you own and a copy you were given — except the Share screen's jade explainer ("They get a copy, not a live view.") and the Log's promise line.

**2. What is unclear or problematic.** The labels are written as permissions and will be read as permissions, but they govern *publishing* only. Meanwhile the thing that genuinely differs — this is a copy, not the original — is stated in two places the user visits once and never again.

**3. Why it matters to the UX.** "Shared" makes almost everyone assume live sync; `share.js` says so in its own header comment. The product's defence against that assumption is currently two sentences on two screens. Every downstream sharing design inherits whether or not "this is a copy" is already established by the chrome.

**4. Kind of decision.** **Product**, then **content/copy**. Not visual — no new component is needed.

**5. Smallest concrete decision.** *Does a joined copy carry a persistent visible marker outside Share and the Log — yes or no?*

**6. Recommended direction.** Yes. One marker, built from existing parts: a `.who-mark` initial or a `.badge` on the trip chip (present on all five tab screens) and on the trip card in My trips, reading as "from Ana" rather than as a status. Keep zero gating — the copy model is the feature. And relabel the roles as publishing verbs: *"Can send updates to everyone"* / *"Receives updates only"*.

**7. Screens/flows affected.** Trip chip (Map, Plan, Shop, Prep, Log) · My trips cards · Share (both phases) · Join · Review · the Log promise line · the Plan update banner.

**8. Does deciding it now unblock later work?** **Yes — it is the root of the dependency chain.** Both the tier-3 empty state and the Review redesign need to know whether ownership is already legible from the chrome before they decide how hard to say it.

---

## P0-2 · The currency guess is invisible

**1. What the app does today.** New in the current commit. `currency.js` maps ISO 3166-1 country → ISO 4217 currency + symbol. `net.js` now returns `countryCode` from the Nominatim result. `store.js` (~736) sets `trip.currencyCode` and `trip.currencySymbol` at trip creation from the reverse-geocoded country of whatever was typed into "City or area". The New trip modal has **no currency field at all**, and on Create the app goes straight to Paste an itinerary. When the lookup fails, one of three strings is written to `trip.locationNotice`:

- `Offline, so "X" could not be located — fix it from Trip settings once you have a signal.`
- `Could not find "X" — the map centre and currency are not set. Fix it from Trip settings.`
- `Could not look up "X" — the map centre and currency are not set. Fix it from Trip settings.`

All three render **only** as a rust hint under the "City or area" field on Trip settings.

**2. What is unclear or problematic.** The user never sees the guess, never confirms it, and is never told when it failed — on the screen where it happened. Two of the three strings tell the user to go to a screen the app does not send them to, and the third does the same with a delay.

**3. Why it matters to the UX.** Money is doubled everywhere in this product — actual against estimate, plus a home-currency conversion with its rate — and the audit identifies that as a core pattern. A silently wrong currency corrupts the shopping estimates, the spend hero, the day chart, the trip stat chips and the conversion line at once. It is also the newest behaviour in the app and the only one with no design at all.

**4. Kind of decision.** **UX/interaction** + **content/copy**, with a small visual addition.

**5. Smallest concrete decision.** *Does the New trip modal show the inferred currency before Create — yes or no?* (The failure-reporting location follows from the answer.)

**6. Recommended direction.** Yes — as a derived, editable line in the modal: "Prices in ¥ JPY — from Kyoto, Japan", set in `input.guessed` (amber border, `#FFFDF7` fill), which is already the app's convention for a machine guess. On failure, say so there in one line and let Create proceed with currency unset rather than guessing. This uses an existing control and an existing colour rule; nothing new is invented.

**7. Screens/flows affected.** New trip modal · Trip settings (MONEY + the City field) · Shop footer card · Spend hero and day chart · shopping item rows · My trips stat chips.

**8. Does deciding it now unblock later work?** Partly. It is **independent of the sharing cluster**, so it can be decided and designed in parallel without waiting on anything.

---

## P0-3 · Sign off the four already-designed areas

**1. What the app does today.** Nothing — these are designs, not behaviour. Four sessions produced: the three-tier empty-state system (`new-feature-design.md` §2), the warning-strip subject line (`multilingual-warning-strip-design.md`), and the Review redesign (§4). Nine matrix rows are marked DESIGNED — AWAITING SIGN-OFF. `new-feature-design.md` §7 carries eight unanswered questions.

**2. What is unclear or problematic.** Whether you accept them. The empty-state work in particular is a *grammar*, not a screen: it decides how every future empty surface behaves.

**3. Why it matters to the UX.** Twelve empty places in the app resolve to three tiers. If the grammar is wrong or unapproved, every screen designed after it either contradicts it or has to be redone.

**4. Kind of decision.** An **approval gate** spanning all four kinds. The individual open questions split across product (conflict data, whether a loop can exist on a stopless day), content (the tier-3 sentences), and visual (the Latin-first font stack's scope).

**5. Smallest concrete decision.** *Approve or amend each of the three systems, and answer the eight open questions.* Realistically this is three separate yes/no/amend calls.

**6. Recommended direction.** Split it rather than deciding it as one block: approve **tier 1 and tier 2** and the **warning subject line** now — they are self-contained and depend on nothing. Hold **tier 3** until P0-1 is answered, and hold the **Review redesign** until P0-1 and P0-4 are both answered, since both change what Review has to say.

**7. Screens/flows affected.** All twelve empty places (My trips, Plan, Log, Shop, Nearby ×3, Destination ×4, Spend ×2, Review) · Plan warnings · Review.

**8. Does deciding it now unblock later work?** **Yes — the largest single downstream blocker**, but only partially resolvable today because two of its four parts depend on P0-1 and P0-4.

---

## P0-4 · Review shows two sides but cannot tell you who changed what

**1. What the app does today.** `share.js` `diffSnapshot(mine, theirs)` is a **two-way** diff. Matching is by id, with a name+time+day fallback so a rename on one phone and a retime on the other don't produce two stops. `MINE_ALONE` already excludes fields that are yours alone (`bought`, `packed`, `captured`, `paidAmount`). **No base copy is retained anywhere** — there is no third input to compare against. `review.js`'s own header states the position explicitly: *"So there is no conflict here, in the technical sense — only a list of differences with two sides shown."* Each row offers `Keep mine` / `Take theirs`; whatever you keep is never asked about again. `Keep all of mine` marks the whole update decided.

**2. What is unclear or problematic.** This is a **deliberate stance, not an oversight** — which changes the question. The problem is not that conflict isn't resolved; it's that the UI presents every row identically, so the user cannot tell a `Keep mine` that costs nothing (they never touched it) from one that discards their own edit. The screen is symmetric; the stakes are not.

**3. Why it matters to the UX.** It is the one screen in the product where two people's work meets, and the decision being presented is not the decision being made. It is also the screen the whole "a copy, not a live view" model exists to make safe.

**4. Kind of decision.** **Product first** — retain a base snapshot or don't — then **UX**, then **copy**. If the answer is "don't", it becomes a pure copy decision.

**5. Smallest concrete decision.** *Retain the last-applied snapshot as a base, so a three-way diff is possible — yes or no?* Everything else in Review follows from this one answer.

**6. Recommended direction.** Yes, retain it. It is one stored blob per trip, it costs nothing at read time, and it converts an ambiguous screen into a truthful one — only the rows where you *also* edited need extra weight, and `new-feature-design.md` already draws that treatment (`YOU EDITED THIS TOO`, rust). If the answer is no, then the copy has to stop implying symmetry, and `Keep mine` needs a label that doesn't sound free.

**7. Screens/flows affected.** Review (all states) · the Plan update banner · `share.js` diff · the store's publish/apply path.

**8. Does deciding it now unblock later work?** **Yes — it blocks the Review design entirely**, and Review is one of the four things awaiting sign-off in P0-3.

---

## P0-5 · Pending work has no pattern

**1. What the app does today.** Five screens keep a module-level `busy` or `notice` string rendered as an `.amber-note` at the **top of the scroller**. Verified strings: `Creating x…`, `Opening…`, `Deleting…`, `Signing out…`, `Shrinking it…`, `Saving…`, `Fetching the rate…`, `Fetching the forecast…`, `Making your copy…`, `Reading x…`, `Making x…`, `Adding them to the trip…`. Only `area.js` has a real progress bar (bytes and tiles, with a `Stop`). Buttons are generally **not** disabled during the wait — the exceptions are `+ New trip` while the modal is open, Paste's save, Paste's `Review and save`, and Draw-an-area's `Keep this area` when the area is too big.

**2. What is unclear or problematic.** Three things at once: there is no single pattern; the message appears far from the control that was pressed (on My trips it renders above the account row, while the button pressed was in the header or a card below); and most actions can be double-tapped mid-flight.

**3. Why it matters to the UX.** Opening a trip and joining a trip are the two multi-second waits in the product, and both are among the first things a new user does. A wait with no local feedback reads as a dead tap.

**4. Kind of decision.** **UX/interaction**, plus a small visual pattern.

**5. Smallest concrete decision.** *One pending pattern anchored to the control that started the work, or keep the top-of-scroll amber note?*

**6. Recommended direction.** In-control pending — label swap plus `[disabled]` (which already means `opacity .45; pointer-events: none`) on the button that was pressed — and keep `.amber-note` for **outcomes and errors only**, which is what it is actually good at. Keep the real progress bar wherever there is real progress to report. No new component; this is a convention, not a control.

**7. Screens/flows affected.** My trips (open/create/delete/sign out/cover) · New trip modal · Paste (all three phases + file import) · Draw an area · Join · Trip settings (save, rate, forecast) · Share.

**8. Does deciding it now unblock later work?** **No.** It is additive and independent — but it is also the cheapest of the seven, and it touches the most screens, so it is good value whenever it lands.

---

## P0-6 · The share → join → review round trip has never been seen

**1. What the app does today.** The live invite (from-line, big trip name, read-only Day 1 preview, three promises, sticky foot), the sent-update result, the Review entries and the Plan update banner are all **source-only**. Forty-two matrix rows have no verified appearance, and they cluster in exactly the flows a second person triggers.

**2. What is unclear or problematic.** **Nothing is unclear as a decision.** This is not a design question — it is an evidence gap. It was previously recorded as blocked on a second account; that is no longer true, because `firebase.emulators.json` (auth on 9099, Firestore on 8080, `singleProjectMode`) and `firebase-tools` in `test/` landed in the current commit.

**3. Why it matters to the UX.** The join screen is the product's front door — the first and sometimes only thing anyone who is not the owner ever sees — and nobody has looked at it.

**4. Kind of decision.** **Verification-only.** It needs approval to proceed, not a judgement.

**5. Smallest concrete decision.** *Approve a verification sprint: render the ten unseen surfaces at 390 × 844 from the emulator harness, no redesign.*

**6. Recommended direction.** Do it, and deliberately do not redesign anything while doing it. Capture, annotate, update the visual reference, mark the result as current baseline.

**7. Screens/flows affected.** Join (live invite) · Share (manage + send result) · Review (entries, long text, CJK, multi-day, done) · Plan update banner · Sub route · Paste review · Draw an area · Changes on this phone.

**8. Does deciding it now unblock later work?** **It is the opposite of a blocker — it is an unblocker.** P0-1, P0-3 and P0-4 are all easier and safer to decide with the actual frames in hand.

---

## P0-7 · The paste review pass

**1. What the app does today.** Three phases. **Input:** mono textarea, Example / Clear / word count, `WHAT IT LOOKS FOR` (including `第三天` and `下午3:00`), and the promise "It is read on this phone; nothing is sent anywhere." **Review rows:** `.cand` rows in worked / unread / off / done variants, a per-row editor, machine-guessed values in amber `input.guessed`, a progress bar reading "`n` of `m` checked · tick, fix or drop the other `k`", a skipped-lines note, and **`Review and save` disabled until every row is ticked**. **Ready to save:** "All `n` rows checked · nothing written yet", plus `TWO THINGS IT DID NOT DO` naming stops with no position. Then a done phase. Only the input step has ever been captured.

**2. What is unclear or problematic.** Two separable things, and they should not be conflated: the **appearance is unverified** (a verification gap), and there is one genuine **UX question** — whether requiring every row to be ticked before saving is the right gate, given that an agent's PDF can produce many rows and the reward for ticking is only that the button lights up.

**3. Why it matters to the UX.** It is the mandatory second step of creating a trip — the app jumps here automatically after Create — and it is where a machine's guesses become the user's itinerary. It is also the only place `input.guessed` appears, so it is the one screen where the "amber = uncertain" rule does real work.

**4. Kind of decision.** **Verification first**, then a **UX/interaction** decision.

**5. Smallest concrete decision.** *Is "tick every row" the right gate — yes or no?* Ask it after the screen has been rendered, not before.

**6. Recommended direction.** Render it as part of the P0-6 sprint, then decide. My lean: keep the gate — it is the mechanism that makes the user responsible for the machine's guesses — but add a bulk way to drop the unread rows, so the gate is cheap to satisfy honestly rather than by tapping through.

**7. Screens/flows affected.** Paste (all three phases + the row editor) · the New trip → Paste hand-off · Plan immediately after an import.

**8. Does deciding it now unblock later work?** **No.** But its verification half should ride along with P0-6 at no extra cost.

---

## Dependencies between the seven

```
P0-6  verification ──┬─→ P0-1 ──┬─→ P0-4 ──→ P0-3 (Review sign-off)
   (evidence)        │          └─→ P0-3 (tier-3 sign-off)
                     └─→ P0-3 (informs all four)

P0-3 (tier 1, tier 2, warning strip)  ── independent, approvable today
P0-2  currency          ── fully independent
P0-5  pending pattern   ── fully independent
P0-7  paste             ── verification half rides with P0-6; UX half independent
```

- **One real chain:** P0-6 → P0-1 → P0-4 → P0-3. Four items, in that order.
- **Three independents:** P0-2, P0-5, and P0-3's first two parts.
- **P0-3 is not one decision** — it is four, and only two of them are blocked.
- **Decisions vs verification:** P0-1, P0-2, P0-4, P0-5 and half of P0-3 are decisions. P0-6 and half of P0-7 are verification. Do not let the verification items sit in a queue behind decisions; they cost nothing to answer and they make the decisions cheaper.

---

## Recommended first item: **P0-1**

**Why P0-1 and not the others:**

1. **It is the root of the only dependency chain.** P0-4 and two-thirds of P0-3 sit behind it. Nothing else in the P0 set gates as much.
2. **It is answerable today, without any frames.** It is a product stance — *does a copy have a visible identity?* — not a visual judgement, so the missing screenshots do not hold it up. P0-4 and P0-3's Review half genuinely do need P0-1's answer first; P0-1 needs nothing.
3. **It is the cheapest P0 to answer and the most expensive to answer late.** Either answer costs one marker built from existing parts. But every sharing screen designed before it is decided has to guess how hard to say "this is a copy", and the tier-3 empty state is *entirely* about that question.
4. **It is the one place the product currently contradicts itself.** `share.js` states plainly that a role is about publishing, not permission — and the Share screen offers those roles as if they were access control. That is not an unverified appearance; it is a decision that was never made.

**What I need from you:** yes or no on a persistent joined-copy marker outside Share and the Log — and, if yes, confirmation that the role labels become publishing verbs.

**In parallel, at no cost to you:** approve P0-6 (verification sprint). It needs no decision, it is no longer blocked by the missing second account, and it makes P0-4 and the Review sign-off materially safer. Those two together — one decision from you, one sprint from me — clear the path to everything else.

---

*Stopping here for approval.*
