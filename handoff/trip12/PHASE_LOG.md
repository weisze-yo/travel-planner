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

---

## Phase 2A — the auth/uid gate (mechanism proven; the FACT is still unverified)

**Added:** `scripts/import-trip12.mjs`, `scripts/backup-trip.mjs`, `scripts/lib/merge.mjs`,
`scripts/package.json` (one dependency, `firebase-admin`), and `.gitignore` entries for
service-account keys, trip exports and `scripts/node_modules/`.

### What the gate does, and that it works

| Condition | Result |
|---|---|
| no `--project` | refuses — "There is no default and none is inferred" |
| no `--uid` | refuses, and says where the uid must come from |
| a real project with no `--key` and no `--emulator` | refuses |
| `--trip vitrox-trip12-tohoku` (the real trip) | refuses without `--allow-real-trip`, which asserts a throwaway read-back was reviewed |
| a key whose `project_id` disagrees with `--project` | refuses |
| any real write | prints project, uid, tripId and full path, lists trips already under the uid, prints the whole merge report, then requires the tripId typed back |
| `--dry-run` | never imports `firebase-admin` at all, so it cannot open a connection even by mistake |

### What the emulator CANNOT establish

The Auth emulator's user directory has no relation to the production project. So the emulator
proves the **mechanism** and the **shape of the risk**, and cannot prove the **fact** that
`w1kRlBbw6ChF3gaQXzDf5413EE03` is the uid the owner's device signs in as. That still needs either
a signed-in session on the owner's device or a service-account key. **Phase 2A is therefore not
closed, and no production write may happen.**

What the emulator did establish, against the real `firebase/firestore.rules`, is that the A3 risk
model is exactly right:

| Reader | Result on `users/w1kRlBbw6ChF3gaQXzDf5413EE03/trips/throwaway-t12` |
|---|---|
| that uid | reads the trip |
| a different signed-in uid | `PERMISSION_DENIED` |
| not signed in | `PERMISSION_DENIED` |

A trip written under the wrong uid does not error on write and does not appear on read. It is
silence, which is why the gate refuses to guess.

Corroborating evidence for the uid, none of it sufficient: the sign-in method is confirmed Google
by the code (`persist.js` implements only Google and email-link; `firestore.rules` says anonymous
accounts are no longer created); the project id is confirmed by `web/js/config.js`; the uid is
28 characters, the right shape. **Shape is not proof.**

---

## Phase 2B — dry run and backup (complete, against the emulator)

### The dry run

`node scripts/import-trip12.mjs --project <id> --uid <uid> --dry-run` does the entire merge in
memory and prints what it would do. It reproduces the B3 figures exactly, and reconciles against
the guide's §4.8 manifest stop by stop.

| | |
|---|--:|
| places stored | **565** = 532 research + 33 stop places |
| searchable research records | **688** (532 + 60 + 96) |
| ids updated in place / inserted | **250 / 488** |
| nameJp coverage | **688 / 688** |
| active / retired / with data | **30 / 3 / 33** |
| Day 7 active stops | **5** |
| summary lines · corrections · structured hours | **165 · 196 · 33/33** |
| duplicate pairs merged · coLocated kept | **20 · 3** |
| dangling `anchorPlaceID` · unmappable records | **0 · 0** |

**Manifest cross-check: 31 of 33 stops match §4.8 exactly on all four columns** (places, must-see,
shopping, sub-routes). The 3 that differ are the B3 reconciliation and nothing else — Hotel Kameya
10→5 (the 3 re-anchored Naruko records plus 2 duplicate merges), Hotel Nikko Tsukuba 24→22 and
Yurakujo 22→20 (2 duplicate merges each). Total −9, which is the whole of the 532-vs-523 gap.

### Six things the dry run and the throwaway found

None of these are in the guide. Each would have been a silent failure.

1. **Firestore cannot store an array inside an array**, and two shapes are exactly that:
   `hours.<day>` (`[["09:00","17:00"]]`, on all 33 stops) and `x.legs[].coords` (10 days' route
   geometry). The write fails with `INVALID_ARGUMENT: Cannot convert an array value in an array
   value` and names no field. `toFirestoreShape()` converts them to `{open, close}` and `{lat,lng}`
   — keeping the closing-day check possible, which a flattened string would not — and
   `findNestedArrays()` then asserts none survive, so a third shape fails loudly.

2. **Firestore rejects `undefined`.** 63 fields carried it. Pruned deliberately and counted rather
   than using the SDK's `ignoreUndefinedProperties`, which drops silently.

3. **A stop IS a place in this client, and `store.unifyPlaces()` enforces it on every load.** A stop
   imported with `placeID: null` gets a place minted for it with a random `uid('place-')`, has its
   `essentials` moved onto that place and deleted from the item, and everything anchored to its
   item id re-pointed. Importing without pre-migrating would mean the first person to open the trip
   triggers 33 inserts and hundreds of rewrites under their own credentials, with ids that differ
   per device, and a second import would fight the migration it caused. The importer now creates
   the 33 stop places itself with deterministic `sid('place', day, name)` ids. **Verified: the
   snapshot is byte-identical before and after the app loads it — `unifyPlaces()` has nothing to
   do.**

4. **`MustSeeShot.placeID` and `ShoppingItem.placeID` were never set.** `store.shotsFor()` filters
   on `shot.placeID`, and `dest.js` filters shopping on `row.placeID` before falling back to a
   `placeLabel` name match. The seed leaves both empty and the batches carry only `anchorStop`; the
   94 distinct `placeLabel` values are long descriptive strings, not stop names, so the fallback
   could never match either. All 60 shots and all 96 shopping rows were present, correct and
   attached to nothing. Now linked: **60/60 and 96/96**, confirmed by the tab counts matching the
   manifest.

5. **`retired` must be DERIVED, not merged.** The batches set it only on records anchored to a
   superseded hotel. `topup-naruko.json` re-anchors three Naruko records onto the live Kounkaku and
   omits the key — so a field-wise merge carries a stale `true` forward and marks three live
   records dead. It is now recomputed from the final anchor. Retired records: **29** (the guide's
   31 is the pre-dedupe figure; 2 of the 20 duplicate merges were retired records at Kameya).

6. **`PlanItem.chips` is never read by the web client.** `plan.js`'s `stopChips()` computes its own
   chips from shopping, must-see, notes and position, and ignores `item.chips` entirely. So A6's
   `ALTERNATIVE TO SHISUI` chip is in the data and renders nowhere. The guide says this "needs no
   schema change", which is true and beside the point. **Phase 3/7 work; not done here.**

### The schedule gap

`trip12_app_seed.json` carries `time: ''` and `windowLabel: ''` on all 29 stops, and nothing in the
17 batches or the stops' `x` blocks holds a schedule. The tour agent's clock times exist **only** in
the guide's §4.8 manifest. Without them a coach tour renders as 30 stops with no times.

The importer parses that table rather than transcribing it — 33 hand-copied times is 33 chances to
be wrong, and a corrected manifest should move the import with it. All 33 rows parse, all 33 names
join, and `endTime`/`windowLabel` are derived where the duration is parseable. `—` is left empty
rather than invented. Ginza 13:45–16:15 and Shisui 14:30–17:00 overlap on Day 7, visibly and
intentionally (A6).

### Backup

`scripts/backup-trip.mjs` is read-only and has no flag that makes it write. It refuses to write
inside the repository, prints per-collection counts so an empty read-out cannot be mistaken for a
good one, and was run against the throwaway: `days 8 · places 565 · subRoutes 17 · shopping 96 ·
mustSee 60 · prep 85 · log 0 · outfits 8`.

### Proven against the emulator

| Check | Result |
|---|---|
| throwaway import | **840 documents written** |
| read-back | days 8 · places 565 · subRoutes 17 · shopping 96 · mustSee 60 · prep 85 · outfits 8 |
| stops | active 30 · retired 3 · with summary 33 |
| `trip.startDate` | `"2026-09-08"` — a **string**, as the client requires |
| `trip.prepCategories` | the seven, per B1 |
| **idempotency** | identical SHA-256 fingerprint of all documents after a second full run |
| rules isolation | owner reads; another uid and anonymous both `PERMISSION_DENIED` |

### Proven in the real app, with the real data

The merged snapshot was loaded into the app's local backend and driven through the actual screens.

- Day 2 renders 7 stops with their times, and **"REMOVED FROM THIS DAY"** carrying Hotel Kameya —
  §9.3 satisfied entirely by existing UI, with no new code.
- The retired stop **opens**: name, Japanese subtitle, five tabs, Nearby 5, 7 essentials.
- Day 7 renders all five stops in clock order, Ginza before Shisui, overlap visible.
- Ginzan Onsen Street: **Nearby 31 · Must-see 4 · Shop 4** — exactly the manifest.
- Tsukiji Outer Market: **Nearby 28 · Must-see 3 · Shop 9** — exactly the manifest.
- All seven prep groups present. **Zero console errors.**

### Still blocking Phase 2

1. **Phase 2A's uid fact.** Needs a signed-in session on the owner's device or a service-account
   key. Until then no production write.
2. A **production backup** before the first real write — the emulator one does not count, and the
   Spark plan rules out `gcloud firestore export`, so it is the Admin-SDK read-out above.

---

## Owner decisions, continued

| # | Decision |
|---|---|
| **B7** | Day 1's hotel keeps its seed id `d93da2ed9772`. It is a rename of one property, so nothing is re-pointed and there is no retired stop for it. The generated `2b1b645712b1` is unused. |
| **B8** | **No `ALTERNATIVE TO SHISUI` chip.** The 13:45/14:30 overlap on the Day 7 timeline is the signal on its own, and the owner resolves it with ordinary plan editing. |

### Phase 2A closed — the uid is verified, not merely corroborated

The owner signed into the deployed production app at `https://travel-planner-3e0d3.web.app` with
Google and read `firebase.auth().currentUser` in the browser console:

```
uid          w1kRlBbw6ChF3gaQXzDf5413EE03
email        weisze.ai@gmail.com
isAnonymous  false
provider     google.com
```

That is the fact the emulator could not establish, and it matches the value supplied at the start.
**All four A3 facts are now recorded: sign-in method, uid, project id, and a key path the owner
controls.** The gate is satisfied.

### §4.8 schedule — confirmed source of truth

The manifest was generated from full itinerary screenshots the owner supplied in an earlier session,
not invented. No re-verification needed. A stop whose time looks internally inconsistent during
testing should be flagged, not silently corrected.

---

## Item 3 — archive and restore, for a main-route stop

Phase 2B proved this for an *archived hotel* (a stop the importer marks `archived` at import time).
That is not the same item type as a live main-route stop the owner removes by hand, so it was tested
again properly, on **both** Day 7 candidates — Ginza, which the importer creates, and Shisui Premium
Outlets, which comes from the seed. Different provenance; the mechanism should not care.

Driven through the real UI: pencil to edit, **✕** on the card, leave edit mode, then **Add back**.

| Requirement | Ginza | Shisui Premium Outlets |
|---|---|---|
| (a) appears under **REMOVED FROM THIS DAY** | yes, `was 13:45 · tap to open` | yes, `was 14:30 · tap to open` |
| (b) opens with **full info, not a stub** | name, subtitle, 5 tabs — **Nearby 27 · Must-see 4 · Shop 13**, 10 essentials, both map links | name, `酒々井プレミアム・アウトレット`, 5 tabs — **Nearby 17 · Must-see 1 · Shop 4**, 9 essentials, both map links |
| (c) **addable back** | yes, and returns in clock order between Tsukiji and Shisui | yes, and returns in clock order between Ginza and Yurakujo |
| console errors | none | none |

Both tab-count sets match the §4.8 manifest exactly (Ginza 27/4/13, Shisui 17/1/4), so the record
links survive the round trip rather than merely the row.

**No special-case code was needed or added.** The mechanism is generic: `archivePlanItem()` sets
`archived`, `plan.js` renders archived items under the eyebrow, `restorePlanItem()` clears it, and
the day re-sorts by clock.

Two things worth knowing rather than fixing:

- **"Add back" and the "MOVE TO D*n*" buttons only appear in edit mode.** Outside it an archived
  card is a link and nothing more. That is the existing design, and it is why a removed stop looks
  inert until the pencil is tapped.
- The three hotels the agent removed show `was  · tap to open` with no time, because the §4.8
  manifest gives them `—` and no schedule exists for them anywhere. A stop the owner removes by
  hand keeps its own time, as above. Cosmetic; noted for Phase 7 rather than invented now.

---

## Execution change — the production write moves to the owner's machine

This cloud session cannot reach the owner's filesystem and has no secure way to receive a
service-account key, so **the production backup and the real import are both run by the owner
locally**, from written instructions. This session will not ask for the key or its contents again.

`handoff/trip12/RUNBOOK.md` is that document: exact commands, the commit to pull, the one dependency,
and the full ordered sequence — clone, install, dry run, backup, review, throwaway import, review in
the app, real import, clean up. It also carries the rollback position and the failure modes worth
recognising.

**Nothing in this repository has ever written to production.**

---

## Review round 1 — findings from throwaway-t12, and what was done

The owner reviewed `throwaway-t12` in the deployed app. The real trip has NOT been written.

### 1 & 2 — the trip had no travel in it

Days 1 and 8 rendered as though the trip began at Haneda at 21:55 and ended at an untimed Narita.
Neither the 17 batches nor `days[].items[]` carried any flight or transfer: the outbound and return
exist in the research **only as prose**, in `trip.x.flights` and each day's `x.summary`.

Every figure the owner supplied matches `trip.x.flights` exactly, and the day summaries corroborate
both ends ("Assemble at the Penang International Airport check-in counter by 07:00"; "Breakfast at
06:30, then a short coach to Narita"). So this is transcription from the bundle, not new fact.

**10 travel legs added**, `kind: 'main'` with `x.stopKind` of `airport`/`transit` — the values the
seed already uses — and `travelLeg: true` so they stay countable apart from the 30 researched stops.

| Day 1 | Day 8 |
|---|---|
| 07:00 Assembly · Penang International Airport | 06:30 Depart Yurakujo for Narita |
| 10:15 SQ131 · PEN → SIN | *(07:20 Narita T1 — see below)* |
| 11:45 Arrive Singapore Changi | 10:55 SQ637 · NRT → SIN |
| 13:55 SQ634 · SIN → HND | 16:55 Arrive Singapore Changi |
| *(21:55 Haneda T3 — already existed)* | 19:10 SQ142 · SIN → PEN |
| 21:55 Tour bus to the hotel, ~5 min | 20:35 Arrive Penang International |

Two judgement calls, both flagged rather than buried:

- **The Haneda arrival was not duplicated.** The owner's list has "21:55 Arrive Haneda, take tour bus
  to the hotel" as one line, but `Haneda Airport — Terminal 3` already exists at 21:55 with 6 places,
  a summary and essentials. Only the coach transfer was added, sharing 21:55 — no source gives the
  time the coach actually pulls away, and the sort is stable so it stays directly after the arrival.
- **Narita T1 now reads 07:20.** The §4.8 manifest prints `—` for it, which was fine when nothing on
  Day 8 needed ordering; with the day running 06:30 to 20:35 an untimed stop sorts to the very end,
  behind the arrival in Penang. 07:20 is derived, not invented: §7.1 puts the landside window at
  ~07:20–08:40, and 06:30 plus the short coach lands there. **This is the one clock time in the trip
  that is not printed on the agent's sheet.**

### 3 — sub-routes: two bugs, both mine, both generic

**All 17 were wrong, not one.**

- **16 of 17 had no `name`.** The batches carry `title`; only `d2sr001zuiganji` carries `name`. The
  merge assigned `title = title ?? name`, which is backwards for 16 of them. The client renders
  `route.name` everywhere and `store.js:537` **rewrites a nameless loop to "Free time" on load** — so
  every loop but one would have lost its title the moment the trip was opened. Now `name` is set
  from `title`, both are kept, and `departMinutes` / `returnByMinutes` are written explicitly so the
  client stops backfilling them on load (`store.js:542` does exactly that).

- **The Zuiganji loop fell to the bottom of Day 2**, under the night's hotel. Root cause is in
  `dayTimeline()`: a stop opens a lane at its own start only when it runs ≥ `SELF_LANE_MINUTES` (90).
  Zuiganji is 60 minutes with a 54-minute loop inside it, so the loop's 14:20 start belonged to no
  lane at all and fell through to the orphan "free time" row at the end of the day. Fixed generically
  in `store.js`: **a stop that actually has a loop starting inside its own window is a self-lane stop
  whatever its length.** The 90-minute rule stays as the other way to qualify, so the demo is
  unaffected.

**Audit result, driven through the real UI, all 8 days: 17 of 17 loops now sit under their correct
anchor stop, zero orphans**, and the per-stop counts match the §4.8 `SR` column exactly.

### 4 — "Fetch today's rate": a real service-worker bug, and the button works

The console warning was real and the fix is real, but the rate mechanism was never broken.

`web/sw.js` fell back with `.catch(() => caches.match(request))` in two of its three branches.
`caches.match()` resolves to **`undefined`** when nothing matches, and `respondWith(undefined)` is
itself an error — which is literally the message *"FetchEvent.respondWith received an error:
Returned response is null"*. Worse, it **replaced** the real network failure, so every uncached
offline request looked like a service-worker bug rather than like being offline.

Fixed: all three branches now fall back through `offlineFallback`, which returns `Response.error()`
when there is no cache hit. The page then sees an ordinary network failure and handles it.

Tested three ways in the browser, service worker blocked so the network could be controlled:

| Path | Result |
|---|---|
| API reachable (stubbed 200) | **rate updates** 33.7 → 39.31, field, stored value and `rateSource` all change, notice reads `Rate updated: 1 MYR = 39.31 JPY · ECB 2026-09-07` |
| API unreachable | **not silent** — the screen shows `Failed to fetch`, and the stored rate is left alone |
| Typed by hand and saved | **works** — 33.7 → 39.3 stored, `rateSource` cleared to mean "rate you entered" |
| `respondWith` errors, after the fix | **none**, in all three |

So: the button is wired correctly and does update the rate when the API answers. The warning meant
the fetch failed and the service worker mislabelled it. Why it failed on that machine cannot be
determined from here — `api.frankfurter.app` is unreachable from this sandbox too — but the app will
now report the real reason. **None of this blocks the trip:** the rate is seeded at 33.7 and the
field is editable by hand, offline, which is all decision A5 requires.

### 5 — "Nearby" places: investigated, not built (see the report to the owner)

Measured across all 532 non-stop places. Content exists and is already shown; **structure** does not.

| Field | Coverage |
|---|--:|
| `note` (rendered today as the description) | **532 / 532**, mean 321 chars, 73% mention opening hours |
| `nameJp` · `priceTier` · `timeWindow` · `confidence` · `source` | 517 / 532 |
| `stayMinutes` · `legs` | 532 / 532 |
| `confidenceNote` | 322 / 532 |
| **`essentials` · `hours` · `phone` · `website`** | **0 / 532** |

Opening a nearby place today shows its name, `Food · ¥¥`, and the full researched note — which for
73% of them contains the hours, and often the phone. The **Info** tab is empty because
`Place.essentials` is empty; the **Nearby / Must-see / Shop** tabs are empty because those records
anchor to the 33 stops, which is the intended model, not a bug.


---

## Review round 2 — the post-mortem, and what it changes

### Why the last audit passed while the bug was still on screen

**Because it tested different code than the owner was running.** The lane fix lives in
`web/js/store.js`, and `web/` has never been deployed: `.github/workflows/deploy-web.yml` triggers
only on a push to `main`, and this branch has never been merged — `origin/main` is still at
`eff90ee`. So the app at travel-planner-3e0d3.web.app runs the pre-work build.

My audit loaded the new snapshot into **my working tree's** `store.js`. The owner loaded the same
snapshot into the **deployed** `store.js`. Same data, different code, different answer — and my
report claimed a verification it had not performed.

Proven by running the identical audit against both, from one snapshot:

| Build | Zuiganji stop row | its loop |
|---|--:|--:|
| `origin/main` — what is deployed today | 3 | **row 7 — not under it** |
| this branch | 3 | **row 4 — directly under it** |

The lesson, and the rule from here: **a fix in `web/` is not verified until it is verified against
the build the owner is actually running.** The audit harness now serves both — `web/` and a copy
with `origin/main`'s `store.js` and `sw.js` — and every UI claim below says which build it holds
for.

This also answers item 3 with no further investigation: the service-worker fix is `web/sw.js`, also
undeployed. A hard refresh cannot install a worker that was never uploaded. **Step 6b of the runbook
is new and deploys the web app.**

### The Ginzan counts: the data is right, and I could not reproduce the regression

Measured three ways, all agreeing:

| Stop | Nearby | Must-see | Shop |
|---|--:|--:|--:|
| **Ginzan Onsen Street** (Day 3) | **31** | **4** | **4** |
| **Ginza** (Day 7) | **27** | **4** | **13** |

The reported 27 · 4 · 13 is Ginza's row exactly, not approximately. The current merge gives Ginzan
31 · 4 · 4, the §4.8 manifest agrees, and a full re-run of the per-stop reconciliation still shows
only the three known differences (Kameya, Nikko Tsukuba, Yurakujo). Nothing in this round touched
Ginzan: the travel legs are on days 1 and 8, the lane fix reads data and writes none, and the
shopping backfill only fills an absent `category`.

**But the throwaway trip is genuinely not trustworthy to review**, and that is my fault for saying
to re-import into the same id. Reproduced with the real `unifyPlaces()`:

| | places |
|---|--:|
| import v1 (no stop places) | 532 |
| after the app's own migration wrote back | 574, of which **42 were minted by the app** with random `place-*` ids |
| after v2 merged on top (`set` + `merge` never deletes) | **617** — 575 mine plus 42 orphans |

So `throwaway-t12` holds ~42 place records nothing points at, from a model that no longer exists.
Ginzan still read 31 · 4 · 4 in that reproduction, so this does not explain the reported numbers —
but it does mean the trip being reviewed is a hybrid of two imports and a browser migration.
**Round 3 goes to a fresh `throwaway-t12b`.** The real trip is unaffected: it will be written once,
with `placeID` already set, so `unifyPlaces()` has nothing to do.

### Fixed this round

- **A duplicate stop name.** Both Singapore connections were called `Arrive Singapore Changi (SIN)`.
  `stopByName` here is keyed by name and so is `unifyPlaces()` in the client, which reuses a place of
  the same name — so the two would have merged into one stop. Now distinguished by their onward
  flight, with an assertion in the merge so a duplicate name can never pass silently again.
- **Coordinates on all 10 travel legs**, so each pins on the map and gets its Google/Apple links.
  Airports at their own coordinates, each flight at the airport it leaves from, the two transfers at
  the hotels they serve. Verified: no "NO POSITION" strip, both map links present.
- **The Shop day filter, which already existed and was inert.** `shop.js` renders "All days" plus a
  button per day from `shopDayOptions()`, but `itemDay()` reads the day out of `placeWhen` as text
  and no batch ever set that field — so every item answered `null` and the filter had nothing to
  offer. Writing `placeWhen` from the stop each item is linked to makes the existing feature work
  with **no UI change**: all 96 items resolve, across all 8 days. This one works on the deployed
  build too.

### Which fixes need the deploy, and which do not

| Fix | Deployed build | After step 6b |
|---|---|---|
| Travel legs, times, coordinates, map links | ✅ works | ✅ |
| Narita 07:20 ordering | ✅ works | ✅ |
| Sub-route real titles (not "Free time") | ✅ works | ✅ |
| Shop day filter | ✅ works | ✅ |
| Duplicate stop name | ✅ works | ✅ |
| **Zuiganji loop under its own stop** | ❌ still wrong | ✅ |
| **Service worker: `Returned response is null`** | ❌ still logs | ✅ |

---

## Post-import: the prep recategorisation, and two briefs

The real trip is imported and confirmed — 850 documents to `vitrox-trip12-tohoku`, counts matching.

### Prep categories — approved and committed

`handoff/trip12/PREP_CATEGORIES_PROPOSAL.md` is the human record; `scripts/lib/prep-categories.mjs`
is the machine one. Both were written from the same table, and `buildSnapshot` now asserts that every
one of the 85 lines matches **exactly one** rule and that **no rule goes unused** — so a fragment that
stops matching because the prose was edited fails loudly instead of quietly dropping a line into a
category nobody chose.

Ten categories, in this order, verified rendering in the app:

| bring | | avoid | |
|---|--:|---|--:|
| Documents | 5 | Don't wear | 19 |
| Money | 10 | Don't do | 12 |
| Outfits | 11 | Don't expect | 5 |
| Electronics | 1 | | |
| Photo kit | 5 | | |
| Health & comfort | 10 | | |
| Day bag | 7 | | |

Both structure calls confirmed by the owner: **Money stays its own category**, and **Photo kit stays
separate from A9's Photo missions** — equipment is not the same list as assignments.

### Two briefs drafted, not sent

- `handoff/trip12/BRIEF_CLAUDE_DESIGN.md` — four presentation decisions: the morning/night hint on a
  31-row Nearby list, **the per-day outfit prose that exists in the data and is rendered nowhere**,
  an image slot whose absent state is permanent rather than a loading state, and where search mounts
  given the tab bar holds five and the strip holds one. Carries the token table, the meanings already
  attached to `--jade` / `--amber` / `--danger`, and the WCAG-AA bar that `test/contrast.mjs` gates.
- `handoff/trip12/BRIEF_COWORK_AIRPORT_RESEARCH.md` — Penang, both Changi connections and the gaps at
  Haneda T3. Narita T1 is already complete and is explicitly excluded. Carries the field-by-field
  batch schema, the two-`category`-enum trap, the sourcing standard including the two coordinate
  errors that standard exists to prevent, and the byte-exact `anchorStop` strings.

Both are drafts for the owner to review and send; neither has been sent.

---

## Nearby places get an Info tab (Option A), and the briefs are final

### Option A, implemented

Opening a nearby place used to show its name, `Food · ¥¥` and its full researched note — then an
**empty Info panel** reading *"Nothing here yet. Pasting a map link fills in whatever OpenStreetMap
has — hours…"*. On a record that is in fact fully researched, that reads as missing data.

`Place.essentials` was simply never set. `projectPlaceEssentials()` now fills it from what each
record already knows, in the same `[EssentialRow]` shape the stops use:

| Row | From |
|---|---|
| Price | `priceTier` |
| Time needed | `stayMinutes` |
| Getting there | the `legs[]` chain, with the one-way total as the detail |
| Best time | `timeWindow` — Daytime / After dark / Before dawn / Any hour |
| Confidence | `confidence`, with `confidenceNote` as the detail |
| Position | `coordPrecision`, with `coordFix` as the detail |
| Source | `source` |

**532 of 532 filled, 3,634 rows, mean 6.8 per place.** It invents nothing: no hours, no phone, no
website, because those genuinely do not exist per place and claiming them would be worse than an
empty panel. The 73% of notes that state opening hours in prose already render as the description.

`Position` earns its row because two coordinates in this dataset were once marked `verified` and
were wrong — one by 260 km, one by 2.4 km. Whether a pin was confirmed or inferred is worth saying.

Verified in the app **on both builds**, since this is data-only and needs no redeploy: the empty
message is gone, a nearby place shows seven rows, and a *stop* still shows its own eight starting
with `Hours` rather than the projected set.

### Search stays in the design round — the reasoning

Checked against the code rather than estimated. **No scroll-into-view or flash-highlight machinery
exists anywhere in `web/`**, so the expensive half of search is built from scratch; `go('dest', …)`
already handles navigating *to* a record, and `app.css:1055` already has a
`prefers-reduced-motion` block for the animation to live in.

So the implementation is the largest remaining item — but the **design ask** is two artboards, and
the post-selection behaviour was specified in §6.2 long ago and is not a design question. Section
3.4 is therefore kept and explicitly bounded: invocation and result row only, with the settled
mechanics listed as fixed.

Keeping it costs one artboard set now. Dropping it would not shrink the implementation by a line —
it would only guarantee a second design round whose latency gates the biggest remaining piece of
work. The mounting decision also interacts with the other three asks: if search takes a sixth tab,
the bar's rhythm changes under every screen, which is not a thing to discover after the fact.
