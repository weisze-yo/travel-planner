# Design → Implementation Transition Audit

**Date:** 5 Sep 2026 · **Session type:** review, reconciliation, planning. **No application code was changed.**
**Audited against:** `main` @ `39e00b3` (app code unchanged since `4233c9a`).
**Updated 5 Sep 2026:** all five open decisions are now answered — see §5. **Verdict is now READY FOR IMPLEMENTATION.**
**Read first:** `final-implementation-readiness-review.md` (including its appended §13, the decision record), then `implementation-readiness-map.md` (including its appended §9). This document does not replace either. It reconciles the map against the code as it stands **today**, because the map was written against a snapshot that is behind `main`.

**The single most important thing in this document:** the map is accurate in substance and four of its findings are already fixed. Verify by symbol, never by line number — the map's line numbers have drifted by 20–170 lines.

---

## 1. Repository and production state

| | |
|---|---|
| Branch | `main` |
| HEAD | `39e00b3` (this audit's design-record commit; docs only) |
| Last app-code commit | `4233c9a` |
| Working tree | clean |
| Deployed | `4233c9a` — deploy run 27, **success**, 5 Sep 12:57 UTC |
| Production | https://travel-planner-3e0d3.web.app |

Production verified by fetching deployed assets: `js/store.js` carries `isSharedEmptyKind`/`sharedEmptyContext`; `css/app.css` carries `:focus-visible` and **not** `.hint-jade` or `.side.stacked`; `manifest.webmanifest` returns 200.

**Commits since the design snapshot (tree `1d3df59`), all of which the map does not account for:**

`6ad71f0` rules in CI · `1b0786d` swipe direction-lock fix · `d6c12ff` plan.js attribute fix · `9a21d8d` design record · `949e04d` empty-state tiers + fact-first warning strip · `1a5d655` focus rings + contrast · `4233c9a` design review update.

---

## 2. Corrections to the implementation-readiness map

Each was verified against the current tree. **These are corrections to the record, not changes to any approved design decision.**

| Map says | Actually | Evidence |
|---|---|---|
| **M-5** Plan edit-mode attributes are escaped into nonsense; archived and lane swipe-delete cannot work | **FIXED** in `d6c12ff`. `plan.js` 403 and 620 wrap the attribute fragment in `raw()` with `esc()` on each value. | `test/plan-delete.mjs` — 11/11, including "the rendered `data-plan-row` attribute is the clean id, not quote-corrupted" and a real CDP-touch delete that persists |
| **M-8** Destination's panel selection never resets | **FIXED** in `aefe1d0`. `dest.js` 26 holds `tabSubject`; 97–100 resets `tab = 'info'` when `it.anchorID !== tabSubject`. Matches the approved intent (a lens on one subject). | source; `test/empty-states.mjs` exercises the panels |
| **M-10** Four of Destination's five empties are the bare `.empty` one-liner; none gated on `trip.sharedFrom` | **FIXED** in `949e04d`, exactly as `p1-destination-tabs-design.md` §3 requires: Info (266), Nearby (328), Must-see (389) go tier 3 via `emptyShared()`; **Shop (434) and Notes (480) keep tier 2**. | `test/empty-states.mjs` — 35/35, incl. "Shop tab NEVER goes tier 3, even joined" |
| **N-15** `manifest.webmanifest` is absent; the SW install fails on it | **FALSE FINDING.** The file has been in the repo since `283bc79` (the first web commit), is valid, lists four icons, and serves **200 in production**. The service-worker install does not fail. | `web/manifest.webmanifest`; `curl` against production |
| **X-10** Eight currency-symbol sites: seven `\|\| '¥'` plus one default parameter | **Nine.** The seven fallbacks are confirmed (`dest.js` ×2, `shop.js`, `spend.js`, `trips.js` ×2, `store.js`) — but there are **two** default parameters: `parts.js` 545 `itemEditor({ symbol = '¥' })` **and `util.js` 108 `money(amount, symbol = '¥')`**, which the map does not name. All 23 `money()` callers pass a symbol today, so `util.js`'s default is dormant — and will silently reintroduce ¥ the moment a fallback is removed and a caller omits the argument. | `grep` over `web/js/**` |
| **D — inverted end time** "is an inverted window a rejection, an overnight window, or a warning-strip case?" | **The code already answers it, deliberately.** `itemWindow()` (`store.js` 1062) computes `end >= start ? end - start : (end + 1440) - start` under the comment *"A window that crosses midnight is a night market, not an error."* And `reversed` is `end === start`, so `ENDS WHEN IT STARTS` fires **only on identical times** — its label is exact. The `19h 15m` on demo Day 3 is that rule working, not a missing rule. | `store.js` 1062–1075, 1100–1110 |

**Line-number drift, for the map's most-cited symbols:**

| Symbol | Map | Today |
|---|---|---|
| `myRole()` | `store.js` 3375 | **3401** |
| `removedFromTrip()` | `store.js` 3881 | **4046** |
| `clearTripContent()` | — | **3208** |
| `\|\| '¥'` in `dest.js` | 376, 471 | **396, 491** |
| `itemEditor` default | `parts.js` 493 | **545** |
| `\|\| '¥'` in store | `store.js` 1801 | **1901** |
| `.hint-jade` callers | `areas.js` 64, `stuck.js` 69 | **unchanged** |

---

## 3. Findings confirmed still open

Verified in the current tree this session. Nothing here is new design; all of it is in the map.

**Measured in a real browser at 390 × 844:**

- **M-4 · the Plan's archive card renders white.** A probe carrying `class="swipe-face archive-card"` — the exact markup `plan.js` 623 emits — computes `rgb(255,255,255)`. `.archive-card` alone computes `rgb(61,76,70)`. Contrast of `.archive-name` on what ships: **1.21:1**. On what the design specifies: **7.48:1**. `.swipe-face` (`app.css` 1031) is declared after `.archive-card` (649) at equal specificity.
- **M-12 · Trip settings MONEY row.** Three inputs at y = **506, 506, 525** — the 19px offset, reproduced exactly. `Your currency` is the label that wraps.
- **N-1 · `.hint-jade` is undefined.** Computes to 16px `rgb(20,32,28)` on transparent with no padding — unstyled body text, larger than the 12–13px copy around it. Referenced by `areas.js` 64 and `stuck.js` 69. Undefined in production too.

**Confirmed by source:**

M-1 (`diffSnapshot(mine, theirs)` is two-arg; no `reviewedSnapshot`, no `lastReview` anywhere) · M-2 (`.sides { display: flex }`, no `.side.stacked`) · M-3 (inline `keep-all`/`take-all` at `review.js` 76–77; `finishReview` called straight from both handlers) · M-6 (`plan.js` 178 `if (!typed && !placeID) return;`; `addOpen = false` at 184 closes the form before the await at 188) · M-7 (`readItemEditor`/`readShotEditor`/`readFactsEditor` return `null`; every caller `return`s in silence) · M-9 · M-11 (confirm still reads *"Everything listed above will be deleted."*; `clearTripContent()` does remove `shopping`, `prep`, `log`, `outfits` — OD-6's premise is accurate) · M-13 · M-14 · M-15 (`.sync-dot.grey { background: var(--faint) }`, solid) · M-16 · N-2 → N-14 except N-15.

**P0-1 re-confirmed:** `myRole()` is exported at `store.js` 3401 and **no screen module calls it**. A `read` user still sees an enabled send control that silently does nothing.

---

## 4. What is already correct and must not regress

Verified this session, not assumed:

| Behaviour | Evidence |
|---|---|
| Location and currency inherit from the snapshot on join | `joinTrip` (`store.js` 3830) reads `locationName`, `latitude`, `longitude`, `currencySymbol`, `currencyCode` off `snapshot`, and sets `sharedFrom` |
| Swipe → in-row confirm → 6s undo, under a real finger | `test/swipe-delete.mjs` 9/9, `test/plan-delete.mjs` 11/11, both driven by CDP touch events |
| Destination's panel resets on a different subject | `dest.js` 97–100 |
| The three-tier empty-state system, and its shared-kinds limit | `test/empty-states.mjs` 35/35 |
| The fact-first warning strip in three scripts | `test/warning-strip.mjs` 34/34 |
| Focus rings and contrast | `test/accessibility.mjs` 9/9, `test/contrast.mjs` 5/5 |
| Every module parses | `vm.SourceTextModule` sweep over `web/js/**` — clean |
| The manifest and all five icons ship | `web/manifest.webmanifest`, `web/icons/` |

**Not re-run this session** (needs the Firebase emulators): `test/two-phones.mjs` and `test/refused-rules.mjs`. Last recorded: **60/60** at `d6c12ff`. Treat that as recorded, not re-verified.

**Do not delete:** `.review-foot` · `.arrived` · `.archive-moved` · `removedFromTrip()` · `state.session.notice` · `clearUndo()` · `movedToDay`.

---

## 5. Decisions — all closed

**Answered by the product owner, 5 Sep 2026.** Canonical record: `final-implementation-readiness-review.md` §13, mirrored into `implementation-readiness-map.md` §9. **Nothing in this section is waiting on anyone.**

| ID | Answer | What it means for the build |
|---|---|---|
| **OD-6** | **YES** | `Empty this trip` may delete the Shopping List, Packing List and Log alongside everything else. Implement the corrected confirmation that names them. On a joined copy it also clears the review base — so M-11 stays sequenced after N-2. |
| **OD-9** | **Add the choice** | The design's own named alternative, taken: **one ghost on the New-trip modal, label `I'll do this later`,** landing on the trip just created. Not a new screen, not a step inside Paste, not a changed default — Paste stays the default path. The map's §5 row for this flips from rejected-pending to approved. Review §13.1 is canonical. |
| **OD-7** | **NO** | The blank map ships its approved amber card and never guesses the cause. N-10 unblocked; "a guess about why the map is blank" remains a permanent rejection. |
| **OD-8** | **YES**, Android only | One unobtrusive install line on Trips Home after a second launch. No first-visit prompt, no banner; iOS is not prompted. **N-15 is withdrawn — the scope is the line alone** (see below). |
| **D-1** | **No flag** | `itemWindow()`'s overnight rule is now an approved decision rather than an unexamined one. A `19h 15m` derived length is correct output. Add no plausibility check, no rust line, no fifth `dayIssues()` kind, no automatic correction; leave the explanatory comment in place. |

### 5.1 OD-8 is smaller than the review's rationale implies

The review argued install was "half-built" because the manifest was absent and *"a `cache.addAll()` rejection fails the whole service-worker install."* **Both halves are wrong**, verified here:

- `web/manifest.webmanifest` has shipped since `283bc79`, is valid, names four icons, and returns **200 in production**.
- `sw.js` line 65 is `Promise.all(ASSETS.map((url) => cache.add(url).catch(() => {})))`, under the comment *"addAll fails the whole install if one file 404s, so add individually."* There is no `addAll` and no install failure. `existing-ui-audit.md` §282 already said the service worker is defensive and *"install is unaffected"*; the review contradicted its own earlier document.

**Android installability already works today.** The approved work under OD-8 is the Trips-Home line and nothing else. Do not touch `web/manifest.webmanifest`, `web/icons/` or `web/sw.js`.

## 6. Implementation roadmap

Re-evaluated against the current tree. Batch 0 items are one-liners; batches are ordered so no file is touched twice for avoidable reasons.

| # | Batch | Scope | Gated on |
|---|---|---|---|
| **0** | Three CSS additions | `.hint-jade` (N-1) · `.sync-dot.grey` → hollow (M-15) · `.side.stacked` + `.review-group` (N-14) | nothing |
| **1** | Pending + silent refusals | P0-5's eleven rules · M-6 add-a-stop · M-7 the three Destination editors · M-14 the sign-in notice slot | nothing. **Before the screens change again** |
| **2** | Currency, **and the OD-9 ghost with it** | **nine** sites, not eight (§2) · P0-2's six states of the derived line · Create never gated · **the `I'll do this later` ghost** — P0-2's derived currency line and the OD-9 ghost are both on the New-trip modal, so it is opened once, not twice | nothing |
| **3** | Review | **N-2 `trip.reviewedSnapshot` first** · three-way diff (third arg; `null` ⇒ today's behaviour) · N-3 no-base mode · N-4 entry fields and the eleven cases · M-2 stacked row · M-3 sticky foot, staged bulk, `finishReview` → `settle()` · N-5 `lastReview` + receipt · M-13 `keepMySide()` · **M-11 `Empty this trip` (OD-6 = yes), which also clears the base** | N-2 |
| **4** | Plan editing | **M-4 the archive card first** (it is the ladder's visible half) → N-9 `Moved to Day 4.` · N-8 `not a time` · **M-5 needs no work — already fixed** · **D-1 needs no work — the overnight rule is approved as it stands** | M-4 → N-9 |
| **5** | Destination · status · absence | M-9 the Shop currency rule · N-10 blank map · N-11 no position · N-12 the stop that has gone · M-12 · M-16 · **M-8 and M-10 need no work — already fixed** | batch 2 for M-9 |
| **6** | Backend-gated | N-6 the removal detector · N-13 a refused read · N-7 the return-leg reader (**buildable now**; seeing it needs real auth) | a backend |
| **7** | P0-1 role wiring | `myRole()` reaches no screen; the `read` send block, the marker on five surfaces, the arrival banner | nothing — **the map does not schedule this and it is the oldest confirmed gap** |
| **8** | Install line | The Trips-home line only, Android, after a second launch. **The manifest, the icons and the service worker already ship and are correct — do not touch them.** | nothing |

**No batch is gated on an open decision.** The whole roadmap is buildable now, in the order given.

---

## 7. Testing per batch

The suite lives in `test/` and is committed. Run on 8099 for the Track B harnesses, 8123 for the older ones; `test/serve.mjs` provides Hosting's `**` → `/index.html` rewrite.

| Batch | Add | Always re-run |
|---|---|---|
| 0 | computed-style assertions: `.hint-jade` is a jade card at 12–13px; `.sync-dot.grey` has a transparent centre and a 1.5px ring | `contrast.mjs`, `accessibility.mjs` |
| 1 | one case per refusal site: the message appears **in the field**, in rust; the button carries the pending label and `[disabled]`; the form stays up until the await resolves; a double tap does nothing | full suite |
| 2 | a trip with no currency renders bare tabular numbers everywhere; a probe that fails if any `\|\| '¥'` or `= '¥'` reappears; **the ghost lands on the trip just created, and Paste is still the default path** | full suite |
| 3 | three-way with `base = null` produces byte-identical entries to today; a stop you added is never badged `THEY REMOVED`; bulk skips rows you both changed; the receipt survives navigation and relaunch | `two-phones.mjs` must stay at or above its recorded count |
| 4 | the archive card's computed contrast ≥ 4.5:1 (the probe in §3 inverted into an assertion); `not a time` renders and clears | `plan-delete.mjs`, `swipe-delete.mjs` — real CDP touch, never `page.click()` |
| 5 | tier assertions keyed off `store.sharedEmptyContext()`, not markup; the blank-map card renders with **no** cause sentence | `empty-states.mjs` |
| 6 | emulator-backed | `two-phones.mjs`, `refused-rules.mjs` |
| 7 | a `read` role reaches no enabled send control | `two-phones.mjs` |

Cross-cutting, every batch: modules parse (`vm.SourceTextModule`, not `node --check`); zero page errors; 390 × 844; CJK and mixed-script content in real fields with measured layout (`scrollWidth` vs `clientWidth`), not eyeballed.

---

## 8. Deployment

Unchanged and working: push to `main` → `.github/workflows/deploy-web.yml` → Hosting **and** Firestore rules. Path filter is `web/**`, `firebase.json`, `firebase/firestore.rules`, and the workflow. A docs-only commit correctly does not deploy.

Per batch: tests green → commit → push → wait for the run → confirm **both** steps green → fetch the changed asset from production and confirm it carries the change → drive the live URL at 390 × 844 → next batch.

---

## 9. Verdict

**READY FOR IMPLEMENTATION.**

All five decisions are recorded (§5). No batch is gated. The regression suite is green at `4233c9a`: 35 + 34 + 11 + 9 + 9 + 5 checks, zero page errors, every module parsing. `two-phones.mjs` (60 recorded at `d6c12ff`) and `refused-rules.mjs` need the Firebase emulators and were not re-run in this session — treat that count as recorded, not re-verified, and run them before any batch that touches sharing, the snapshot path or the rules.

The implementation session stops only for a genuinely **new** product ambiguity that the canonical documents cannot settle. The five above are settled.
