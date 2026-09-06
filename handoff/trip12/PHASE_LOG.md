# Phase log — Trip 12 implementation

Written by the implementation session. `TRIP_IMPLEMENTATION_GUIDE.md` and `DECISIONS.md` are the
brief; this file is the record of what the repository actually said back, what the owner decided in
response, and what each phase changed. Where this file and the guide disagree about a fact, **this
file was checked against the code and the guide was not** — the guide was written by reading
`raw.githubusercontent.com` without running anything.

---

## Phase 0 — repository inspection (complete, no code changed)

### Unknowns the guide left open, now closed

| Guide ref | Question | Answer, from the code |
|---|---|---|
| §16.7 #4 | What does `PlanItem.archived` do — hide or restyle? | **Restyle, and it already does what §9.3 asks.** `store.js:1209-1210` splits `activeItems`/`archivedItems`; `plan.js:141` renders archived stops under an eyebrow reading literally `REMOVED FROM THIS DAY`, as tappable `.archive-card` rows. `store.js:2206` already excludes them from the stop count. Use it directly; build nothing. |
| §16.7 #13 | Does the trip list partition upcoming vs past? | **It groups but never gates.** `store.tripState()` returns `upcoming`/`running`/`finished` and `tripGroups()` sorts into three headed sections. A `finished` trip still renders with an "Open ›" button, styled only by `.trip-plain.done { opacity: .86 }`. Its three callers are grouping, the current-day default and the strip's reminder — none hides anything. **A1 is safe.** Confirmed live: the demo trip (`startDate 2026-03-12`) lists under FINISHED and opens fully. |
| §16.7 #14 | Does a currency-rate input already exist? | **Yes, and A5 is essentially already built.** `trip.js:105` renders `#home-rate` bound to `trip.homeCurrencyRate`, with `store.rateLine()` beneath it and a "Fetch today's rate" button (ECB daily). `store.js:3365-3367` stamps rate, `rateUpdatedAt` and `rateSource` together. `spend.js:67-73` and `shop.js:95` derive at render time; `spend.js` prints `at {rate}` beside the figure. |
| §2.3 | `storage.rules` caps | **20 MB and `image/*`**, as the research bundle said. |
| §2.4 | Which auth method? | **Google (and email-link). Not anonymous.** `persist.js` implements only `signInWithPopup` / `sendSignInLinkToEmail` — there is no `signInAnonymously` call anywhere. `firestore.rules` states it in comments: *"Anonymous accounts are not created any more."* `APP_README.md` is stale iOS documentation. |
| §2.5 | Exact screen list | 19 registered in `app.js`; `web/js/screens/` holds 20 files — the 20th is `parts.js`, a shared component helper imported by 14 modules. |
| §5.4 | `app.css` colour tokens | Two accent hues only — `--jade` and `--amber` — plus `--danger-*`. **The existing palette cannot supply five distinguishable summary labels.** See B5. |
| §6.3 | Where search mounts | Still open by design. `nav.js` has a fixed five-entry `TABS` array and `strip.js` is a single-slot ranked warning strip, so neither takes a search box unmodified. `state` already holds `places`, `subRoutes`, `shopping`, `mustSee` and `days` in memory, so the index belongs in `store.js` either way. |

### Corrections to the guide

Each was checked against the code or recomputed from the bundle.

1. **Record counts. The guide's 523 places / 679 searchable / 241 updates / 438 inserts are wrong.**
   Merging seed + 17 batches keyed by `id`, then merging the 20 `duplicatePairs`, gives
   **532 places · 688 searchable · 250 updates · 455 inserts**. `mustSee` 60, `shopping` 96 and
   `subRoutes` 17 are exact.

   The gap is exactly 9 and reconciles cleanly. §4.8's manifest sums to `Pl 526`, and §4.2 derives
   523 as `526 − 3` (the re-anchored Naruko trio). That derivation drops two terms: **−6** records
   the duplicate merge removes, which the manifest counted (2 each at Hotel Kameya, Hotel Nikko
   Tsukuba, International Resort Hotel Yurakujo), and **+15** night/dawn-pool places with no
   resolvable anchor stop, which a per-stop manifest cannot count at all.
   `526 − 6 − 3 = 517` anchored, `+ 15` unanchored = **532**.

2. **`Trip.prepCategories` IS a web field — drift 9 is wrong.** `store.js:1930` reads
   `state.trip?.prepCategories || seed.PREP_CATEGORIES`, and `addPrepCategory()` (`store.js:3262`)
   writes it onto the trip. It is absent only from the *demo seed literal*. So A9 has one home, not
   two: `Trip.prepCategories` is authoritative and `PREP_CATEGORIES` is the fallback.

3. **`PlanItem.isSubRouteSummary` is not web-absent — drift 4 is wrong.** `store.js` uses it at
   lines 383, 550 and 1264. Both clients have it. No drift, nothing to align.

4. **There IS test infrastructure — §0, §12 Phase 8 and §14 are wrong to say there is none.**
   `test/` holds 20 Playwright-driven `.mjs` suites (`two-phones.mjs` alone runs 65 checks),
   `setup.sh`, `serve.mjs` and a `package.json` pinning `firebase-tools`. Critically,
   **`firebase.emulators.json` configures Auth (9099) and Firestore (8080) emulators running the
   real `firestore.rules`** — so Phase 2B's dry run and the throwaway import can be rehearsed with
   no credential and no production exposure. A8 still holds: nothing new gets added.

   Two of these matter later: `test/guard.mjs` is a parse + backtick sweep over `web/js` (run it
   with `--experimental-vm-modules`), and `test/contrast.mjs` **gates** on a `NEW_THIS_SESSION` set
   of colour pairs. The five summary-label tokens must be added to that set in Phase 3, or nothing
   stops a later change regressing them.

5. **`ShoppingItem.category` is worse than §4.2c states.** The seed's 49 items do carry `souvenir`,
   but **51 of those ids are re-emitted by later batches with no `category` key**. A whole-document
   `set()` therefore erases it — the merged result is **95 of 96 items with no category**, which
   would silently empty the web shop filter. The importer must merge **field-wise**, not replace
   documents, then backfill per §16.3.

6. **The C3 cross-wire already exists in the data.** `topup-naruko.json`'s `tnk-sh-bathkit`
   ("Towel and body soap for Taki-no-Yu") carries `category: "shopping"` — a `PlaceCategory` value
   on a `ShoppingItem`. It is the only offender; all 532 places carry valid `PlaceCategory` values.

7. **Three contradictions inside the guide.**
   - `startDate`: §4.2d says write the ISO string, then closes "Prefer Timestamps"; §12 Phase 2 and
     §14 demand a Timestamp. **The repository settles it: a string.** `tripState()` and
     `tripDayGap()` call `new Date(trip.startDate)` and `tripGroups()` runs `localeCompare` on the
     raw value — a Firestore `Timestamp` breaks both.
   - Ginza: A6 and §9.4 say `kind: 'main'`, but §4.8's manifest still prints `BACKUP`, the prose
     under it still calls it a backup, and §16.6 step 7 still asks QA to confirm "Ginza marked
     backup". Stale pre-A6 text.
   - Insertion point: §5.4 says "immediately after `.dest-desc` and BEFORE the tab navigation", but
     the live DOM puts the map-link row and a conditional warn strip in that gap. Settled by B4.

8. **A9's stated rationale does not match the prep data.** A9 says "85 prep lines are already
   categorised against [the six]". They are not: all 85 use exactly two categories — `Day bag` (49)
   and `Leave behind` (36). `Leave behind` is a seventh, in neither the current four nor A9's six,
   and five of A9's six have zero lines. No line vanishes (`prepGroups()` builds from the items
   first and only appends missing ordered categories), but the trip's category list needed a
   decision — see B1.

9. **The four new hotel stop ids in §4.2b are unsourced.** `22aa574d12d6`, `def6a0a6a1c8`,
   `bf4e19fcd2f6`, `aae8b34364ff` appear nowhere in the 42-file bundle; only the four *old* ids do,
   in `trip12_app_seed.json`. `to_app_seed.py` did not ship, and the hash could not be reproduced
   from `(day, name)` under md5/sha1/sha256 across 7 separators and 4 prefixes. §4.2b's instruction
   "take ids from the batch files" cannot be followed. Mitigating: everything in the batches anchors
   by `anchorStop` **name**, so these ids are only the identity of new `PlanItem`s. Settled by B2.

10. **`.gitignore` has no service-account key entry.** Required by the A3 gate and §16.1. Phase 2A.

### Verified as stated

Validator prints `validating 19 file(s)`, exit 0, 2 known warnings. 165 summary lines over 33 stops,
zero empty, max 499 chars, mean 479. 196 `correctedFromSeed`. 4 `newStop`, 3 `retired`. 20 places
orphaned onto superseded hotel stops (187 seed places = 51 blank + 136 resolving + 20). 31 records
`retired: true`. 100% `nameJp` coverage. 3 records changed `anchorStop`, last value wins. Ishii
Sports exactly as §8.1 describes. All 17 `subRoutes` carry `anchorStop` and none carry
`anchorPlanItemID` / `dayNumber` / `returnTarget` / `returnMinutes`, as §4.7 says. Stop-count
arithmetic gives 30 active + 3 retired = 33.

**The §4.4 additive premise holds.** `persist.js` reads with `d.data()` and writes whole rows with
`setDoc`; every mutator in `store.js` spreads the record it edits rather than rebuilding it. No
field whitelist exists anywhere. An unknown key survives load, render, edit and save.

---

## Owner decisions, 6 September 2026

Settled in response to the Phase 0 findings. Like `DECISIONS.md`, these are answers, not questions.

| # | Decision |
|---|---|
| **B1** | **Prep categories:** Trip 12's `Trip.prepCategories` carries A9's six **plus `Leave behind`** as a seventh. |
| **B2** | **Stop ids:** generate fresh ids under a declared `sid()` convention rather than trying to reproduce the four unsourced hex values. |
| **B3** | **Counts:** the corrected **532 / 688 / 250 / 455** replace the guide's 523 / 679 / 241 / 438 as the acceptance criteria. |
| **B4** | **Insertion point:** `stopSummary` goes immediately after `.dest-desc`, **before** the map-link row and warn strip — descriptive content grouped together, actionable and status elements below it. |
| **B5** | **Palette:** a new hue may be introduced for a label whose meaning is genuinely new; an existing hue must not be reused for a different meaning. Colour is never the only cue — every label pairs its colour with text and an icon. |
| **B6** | **Service-account key:** not requested yet. Phase 2A and 2B run against the local Auth + Firestore emulator. A key is handed over only for the real backup and the production write. |

### B2 — the stop-id convention

The original `sid()` could not be recovered, so this is a **new convention matching the old shape**
(12 lowercase hex), declared here and frozen from this point:

```
sid(kind, ...parts) = sha256( [kind, ...parts]
                                .map(p => String(p).normalize('NFC').trim())
                                .join('|') ).hexdigest()[:12]
```

Stops use `sid('stop', dayNumber, stopName)`. Checked against all 847 ids in the merged dataset:
**no collisions, all distinct, correct shape.**

| Day | Stop | Frozen id |
|--:|---|---|
| 1 | Hotel Metropolitan Tokyo Haneda | `2b1b645712b1` |
| 2 | Ooedo Onsen Monogatari Naruko Onsen Kounkaku | `a71e35e75317` |
| 3 | Mercure Miyagi Zao Resort & Spa | `7d9bf6b4f593` |
| 4 | Kinugawa Onsen Hana no Yado Matsuya | `b0e04f3c52d4` |
| 7 | Ginza | `03776664f553` |

Ginza is included because it is a new Day 7 stop with no seed id of its own (A6).

**These ids are frozen. A stop id must never change after the first write.** Any future rename is a
declared migration, never a silent re-hash — that is the rule the four superseded hotels broke.

### B5 — the five summary-label colours

`--jade` (good / done / primary), `--amber` (needs attention) and `--danger-fg` (destructive) all
carry existing meanings; none of Do / Eat / Snack / Buy / See means any of those, so all five are
new hues, placed in the cool arc the existing palette leaves empty.

| Line | Token | Hex | Hue | On white | On `--bone` |
|---|---|---|--:|--:|--:|
| **Do** | `--sum-do` | `#26327A` | 231° | 11.54 | 10.37 |
| **Eat** | `--sum-eat` | `#7C2F72` | 308° | 8.38 | 7.53 |
| **See** | `--sum-see` | `#6A4FA8` | 258° | 6.37 | 5.72 |
| **Buy** | `--sum-buy` | `#1A7396` | 197° | 5.33 | 4.79 |
| **Snack** | `--sum-snack` | `#B23F68` | 339° | 5.52 | 4.96 |

All five clear WCAG AA (4.5:1) on both backgrounds. Every pair is separated by luminance **or** hue
— no weak pairs. The luminance ramp is deliberate, so the five stay distinguishable in greyscale.

**Colour is the third cue, never the first.** Each line always renders its uppercase text label and
its own icon; a reader who cannot separate the hues loses nothing. That is what makes five hues in
one arc acceptable — under deuteranopia several of them converge, and the text carries the meaning.

When these land in `app.css` (Phase 3), they must also be added to `test/contrast.mjs`'s gated
`NEW_THIS_SESSION` set.

---

## Phase 1 — schema preparation (complete)

**Changed: `web/js/data.js` only.** No record data touched; no other file modified.

1. **`PREP_CATEGORIES` extended from four to A9's six**, with a comment recording that it is the
   *fallback* — `store.prepGroups()` reads `trip.prepCategories` first — and that a trip may carry
   groups beyond the list without them vanishing. B1's seventh category is Trip 12 content and is
   written by the importer onto the trip document in Phase 2, not here.

2. **An additive record schema section appended**, declaring the §4.4 fields as exported constants
   so the importer and the integrity script have one place to agree with:
   `TIME_WINDOWS`, `CONFIDENCE_LEVELS`, `COORD_PRECISION`, `STOP_SUMMARY_LINES`, `HOURS_DAYS`,
   `RECORD_FIELDS`, `PLAN_ITEM_FIELDS`, `TRIP_DAY_FIELDS`, `SUB_ROUTE_FIELDS`,
   `PLACE_CATEGORY_IDS`, `SHOP_CATEGORY_IDS`.

   The last two exist to keep the C3 enums apart: they are derived from the existing
   `CATEGORY_LABELS` and `SHOP_CATEGORIES` rather than retyped, so they cannot drift, and they give
   the integrity script two separately named lists to assert each `category` field against.

### Not done in Phase 1, and why

- **§4.5 bug (a) `packedIn`.** The web already writes `packedIn` everywhere; only `Models.swift:273`
  writes `location`. iOS is out of scope (A2) and has never been compiled, so no document has ever
  been written with `location` — the migration is a no-op until iOS ships. Recorded, not performed.
- **§4.5 bug (b) `ShoppingItem.category`.** The web already has it (`data.js`, `SHOP_CATEGORIES`,
  `store.setShoppingCategory`). Only Swift lacks it. Same reasoning.
- **The two "new drifts".** `PlanItem.endTime` is genuinely web-only — keep it; Swift gains it in the
  iOS pass. `isSubRouteSummary` is not a drift at all (correction 3); nothing to do.
- **`Models.swift`.** A2 makes it optional and forbids it being required by any acceptance
  criterion. Left untouched to keep the diff honest.

### Phase 1 verification

| Check | Result |
|---|---|
| `data.js` exports | 22 to 33. **Nothing removed or renamed**; 11 added. |
| Every named import of `data.js` across all 37 modules | all resolve |
| `node --experimental-vm-modules test/guard.mjs` | **37 modules, 0 problems** |
| `node test/contrast.mjs` | **PASS** — 5/5 gated pairs still clear AA |
| Demo trip opens | **yes** — Day 3, 7 stops, correct names, tab bar live |
| Demo `dest` renders | Nishi Market, 5 tabs, 8 essentials |
| `.dest-body` child order | `dest-name · dest-sub · dest-desc · row · dest-tabs` — B4's insertion point is index 3 |
| Six prep categories reachable | all six present in the demo Prep screen |
| Currency rate input | `#home-rate`, type `number`, value `33.7`, fetch button present |
| Console | **zero app errors** (CDN fetches fail in this sandbox; the app falls back to local mode by design) |
