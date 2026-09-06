# TRIP_IMPLEMENTATION_GUIDE.md

**Implementing ViTrox Japan Tohoku Trip 12 into the Travel Planner app.**

Repository inspected: `weisze-yo/travel-planner` @ `main`, 4 September 2026 — public, read via
`raw.githubusercontent.com`. Every path below was verified to exist. Where a fact could not be
established from the repository or the research bundle it is marked
**`NEEDS VERIFICATION IN NEW SESSION`** rather than guessed.

---

## 0. READ THIS BEFORE ANYTHING ELSE — five corrections to the brief you may have been given

The task description that produced this guide contained five assumptions that the repository
contradicts. They are corrected here so no session builds against them.

| Assumption | Reality in the repository |
|---|---|
| "526 place records" | **523 places.** The searchable total is **679** = 523 places + 60 mustSee + 96 shopping. "526" was an intermediate figure from a mid-session build of the review artifact. Use **679** for search acceptance, **523** for places. |
| "The research tested English, 中文 and 日本語" | **No multilingual testing was ever done, and the app does not support it.** `APP_README.md` states under features not yet implemented: *"Language support: Currently English-only; Chinese requires string catalogue."* Neither client has a Japanese-name field. See §10 — a Chinese-language acceptance test is **not achievable** and must not be treated as one. |
| "Existing collapsed/expandable stop UI" | **Does not exist.** `web/js/screens/plan.js` renders every stop inline and is explicitly not collapsible; tapping a stop calls `go('dest', { itemID })`. The collapsible UI described in the research was the *review artifact*, not the app. See §2 and §5. |
| "Existing tests" / "run unit and integration tests" | **There are none.** `.github/workflows/deploy-web.yml` validates `web/js/config.js` and deploys. No lint, no test, no build step exists anywhere in the repo. See §12 Phase 8 and §14. |
| "Run the production build" | **There is no build step for the web app** — it ships as untranspiled ES modules served statically. The iOS app has *never been compiled*: `APP_README.md` says *"The implementation has never been compiled or executed… Expect minor build errors upon first compilation."* |

**One more thing the repository reveals that changes scope:** the README describes this repo as
*"a handoff bundle from Claude Design"* — HTML/CSS/JS mockups exported for a coding agent to
implement for real. Treat the two clients as **unproven code**, not a running product.

---

## 0.5 `DECISIONS.md` is binding — read it second

**`DECISIONS.md` ships beside this guide and contains nine decisions already settled by the trip
owner on 4 September 2026.** They are answers, not questions. **Do not re-litigate any of them.**

| # | Decision |
|---|---|
| **A1** | The trip is **permanent**. No deadline scope cut. Nothing may hide or degrade it because its dates have passed. |
| **A2** | **Web client only** in this pass. iOS is a separate later pass, and **first-time iOS compilation is not an acceptance criterion.** |
| **A3** | **The uid and auth method must be verified before any write. This is a hard gate** — see §12 Phase 2A. |
| **A4** | Trip 12 **coexists** with the demo trip. **Firestore is the source of truth. The 679 records do NOT go into `web/js/data.js`.** |
| **A5** | The **user sets the currency rate in settings**; conversions compute from it. No hardcoded rate. |
| **A6** | **Both Shisui and Ginza are main Day 7 stops.** No backup mechanism. **30 active stops, not 29.** |
| **A7** | Commit the 19 research JSON files under **`research/trip12/`**. |
| **A8** | **No new test framework.** `validate_research.py` plus one data-integrity script. |
| **A9** | **All six** `prepCategories`. |

Where a decision changed a number, this guide has been updated to match. `DECISIONS.md` records why.

---

## 0.6 STEP ZERO — put the research files into the repo, and know your working directory

**The repository does not contain a `research/` directory yet. You must create it.** Everything in
this guide that names a bare filename — `day1-haneda.json`, `validate_research.py`,
`summaries-d58.json` — lives inside the handoff bundle, **not** in the repo as cloned.

**Do this before Phase 0:**
```bash
# from the repository root, with the handoff bundle extracted alongside it
mkdir -p research/trip12
cp <extracted-bundle>/research/trip12/* research/trip12/
cp <extracted-bundle>/TRIP_IMPLEMENTATION_GUIDE.md \
   <extracted-bundle>/DECISIONS.md \
   <extracted-bundle>/APP_ROADMAP.md \
   <extracted-bundle>/RESEARCH_COMPLETE.md \
   <extracted-bundle>/ITINERARY_CHANGE.md \
   <extracted-bundle>/IMAGES.md .
git add research/trip12 *.md && git commit -m "Add Trip 12 research bundle (decision A7)"
```

**What `research/trip12/` must then contain — verify all three counts:**

| Type | Count | What |
|---|--:|---|
| `.json` | **21** | the 17 batch files + 2 summary files + `trip12_app_seed.json` + `seed_duplicates.json` |
| `.md` | **19** | `notes.md`, `notes2`–`notes8`, and the 11 per-batch `notes-*.md` |
| `.py` | **2** | `validate_research.py` and `fetch_images.py` |

> **THE WORKING-DIRECTORY RULE.** Every `validate_research.py` invocation in this guide uses bare
> filenames and therefore **must be run from `research/trip12/`**, or with that path prefixed. The
> canonical command is:
> ```bash
> cd research/trip12 && python3 validate_research.py \
>   day*.json new-hotels.json expand-*.json topup-*.json summaries-*.json
> ```
> Run from the repo root without the `cd`, it matches nothing and **exits 0 having validated zero
> files** — a false pass. If the output does not say `validating 19 file(s)`, you are in the wrong
> directory.

`fetch_images.py` is **not** part of this implementation (§7.12). It ships for a later, separate
image pass.

---

## 1. Executive Summary

### What trip is being added
**ViTrox Japan Tohoku, Trip 12** — 8 days / 7 nights, **Tue 8 September → Tue 15 September 2026**,
~35 Malaysian colleagues on a guided coach tour with a fixed tour-agent itinerary. Singapore Airlines
throughout (SQ131/SQ634 out to Haneda; SQ637/SQ142 home from Narita).

The itinerary is **fixed and not to be redesigned**. It was revised by the tour agent on
**4 September 2026**, which changed four of the seven hotels — see §7.

### What the existing app currently does
Two independent clients over one Firestore layout:

- **`web/`** — a static ES-module PWA. Hash-based routing, 19 screen modules, Leaflet maps vendored
  locally, a service worker, Google / email-link auth. Currently renders a **demo trip seeded from
  hardcoded constants in `web/js/data.js`** (`TRIP`, `DAYS`, `PLACES`, `SUB_ROUTES`, `SHOPPING`,
  `MUST_SEE`, `PREP`, `LOG`, …).
- **`TravelPlanner.swiftpm/`** — a SwiftUI iOS 17+ client over the same collections.

Both read `users/{uid}/trips/{tripId}/…`. There is **no itinerary import** (`APP_README.md` lists
*"Real itinerary import"* as not done), **no search of any kind**, and **no per-stop summary
concept**.

### What this implementation adds
1. **The trip data itself** — 523 places, 60 must-see shots, 96 shopping items, 17 sub-routes, 30
   main itinerary stops across 8 days (Ginza included per decision A6), 3 further stops the agent
   removed on 4 Sep that stay viewable, plus structured opening hours for all 33.
2. **`stopSummary`** — a five-line *Do / Eat / Snack / Buy / See* answer on every stop. 33 stops ×
   5 lines = **165 lines**, already written and verified. This is P0 item 0.
3. **Full-text search** — one box over all 679 records including their Japanese names. P0 item 5.
4. **Two schema-drift bug fixes** between the clients, and a set of researched corrections that must
   survive into the data.
5. **Two new data concepts the schema has no home for**: superseded stops that stay viewable
   (`removedFromDay`), and a backup stop researched alongside a real one (`backupFor`).

### The trip is permanent — decision A1
The trip must be fully usable **before, during and after** 8–15 September 2026. **Nothing may hide,
disable, collapse or degrade it because its dates have passed.** If any existing logic partitions
trips into upcoming versus past, or keys off a countdown, the trip must still open and render
completely. Retired stops, corrections and provenance are part of the permanent record.

`NEEDS VERIFICATION IN NEW SESSION` — check whether `web/js/screens/trips.js` or `trip.js` partitions
on `startDate` or `departsInDays`, and confirm a past-dated trip still opens.

### Intended final user experience
A traveller opens the trip, taps a stop, and the **first thing on screen under the stop name is five
short lines telling them what to do, eat, snack on, buy and photograph there** — with prices, shop
names and the time constraint that applies. Below that sit the tabs holding the evidence: hours,
nearby places, must-see shots, shopping. A search box finds any of 679 records by English or Japanese
name and jumps straight to it. Stops the agent removed are still there, struck through, with the
reason and what replaced them.

---

## 2. Current Application Architecture

Only the parts that matter to this work. **All paths verified present.**

### 2.1 Web client — `web/`

| Path | Why it matters | Expected to modify | Must not break |
|---|---|---|---|
| `web/index.html` | Shell. Loads `vendor/leaflet/leaflet.css`, `css/app.css`, `vendor/leaflet/leaflet.js`, and `js/app.js` as `type="module"`. Containers: `#screen.screen-host`, `#strip`, `#undo`, `#tabbar.tabbar`, `#boot`. | Only if the search box mounts in the shell rather than per-screen. | The `#boot` "Loading your trip…" flow; the four container ids other modules query. |
| `web/js/app.js` | Boot + screen registration. Imports `./util.js` (`$`), `./store.js` (`boot, closeTrip, openLink, state`), `./persist.js` (`readActiveTripID`), `./nav.js` (`register, start`), `./strip.js`, `./sync.js`, then 19 screens from `./screens/`. Hash routing plus `/j/[A-Z0-9-]+` invite paths. | Register a new search screen if you add one. | The invite-link branch and the initial-screen selection logic. |
| `web/js/data.js` | **The DEMO seed — not the app's source of truth.** Exports `TRIP_ID`, `TRIP`, `DAYS`, `PLACES`, `SUB_ROUTES`, `SHOPPING`, `MUST_SEE`, `PREP`, `LOG`, `OUTFIT_SUGGESTION`, `OUTFIT_SUGGESTION_CHIPS`, `OUTFIT_PICKS`, `WEATHER`, `DATE_LABELS`, `NISHI_ESSENTIALS`, `DAY_THREE_ITEMS`, `RECAP_TEXT`, plus lookups `CATEGORY_LABELS`, `MODE_ICONS`, `MODE_LABELS`, `PAYMENTS`, `PACKED_LOCATIONS`, `RETURN_TARGETS`, `BADGES`, `SHOP_CATEGORIES`, `PREP_CATEGORIES`. | **Only two things: the six `PREP_CATEGORIES` (A9) and any new field names. NEVER the 679 records** — see §2.5 and A4. | Every named export: 19 screens import them by name. Removing or renaming one breaks a screen silently. The demo trip must still open. |
| `web/js/screens/plan.js` | The day timeline. `render()` → `stopRow()` per stop, `laneRow()` for gaps. DOM: `.plan-row` > `.plan-gutter` (`.plan-clock`, `.plan-end`) + `.plan-spine` + `.plan-card` (`.plan-name`, `.plan-note`). `stopChips()` adds metadata chips. **Stops are NOT collapsible** — tapping calls `go('dest', { itemID })`. | Optionally a one-line summary teaser on the card. | The edit-mode time inputs, the issue-warning "one-tap fix" affordances, and the `go('dest')` navigation. |
| `web/js/screens/dest.js` | **The stop detail screen — where `stopSummary` belongs.** Takes `params.itemID` or `params.placeID`. Renders, in order: (1) hero with back button + `.hero-badges` (`MAIN ROUTE · STOP {n}`, time window in `.hero-badge.light`); (2) `.dest-name`, `.dest-sub`, `.dest-desc` (`summary`/`note`); (3) Google/Apple map links; (4) **five tabs — Info, Nearby, Must-see, Shop, Notes**; (5) the active panel; (6) a `sheet` overlay editor. `essentials` render **only in the Info panel** as `.card-list` > `.essential` > `.essential-k` / `.essential-v` / `.essential-d`. | Yes — insert the summary block. | The five-tab state machine, the `sheet` editor, and the Info panel's `.essential*` markup. |
| `web/js/screens/nearby.js` | The places pool UI. | Probably not. | Add/remove place behaviour. |
| `web/js/screens/sub.js` | Sub-route screen. | Only if sub-route fields change. | — |
| `web/js/screens/paste.js` | The "paste an itinerary" manual screen. | **Do not use and do not modify.** It cannot carry places, must-see, shopping, prep or images. | Leave entirely alone. |
| `web/js/store.js`, `persist.js`, `sync.js`, `nav.js`, `strip.js`, `util.js` | State, local persistence, Firestore sync, routing, tab strip, DOM helper. | `store.js` if search needs a cross-screen index. | The sync-status chip states (solid / hollow / amber) described in `WEB_APP_GUIDE.md`. |
| `web/js/config.js` | Firebase config. **`.github/workflows/deploy-web.yml` reads `projectId` from this file.** | Only to point at the real project. | Never commit real secrets beyond the public config block. |
| `web/css/app.css` | All styling. | Yes — summary block and search UI. | Existing `.plan-*`, `.dest-*`, `.essential*`, `.card-list`, `.tabbar` rules. |

### 2.5 Where trip data actually comes from — read this before touching `data.js`

**`web/js/store.js` decides the source of truth, and it is not `data.js`.** Verbatim:

```js
let snapshot = await backend.loadAll();
if (!snapshot || !snapshot.trip) {
  if (signedIn()) { return openNothing(); }
  snapshot = tripID === seed.TRIP_ID ? freshSnapshot() : emptySnapshot(tripID);
}
```

Reading it precisely:
1. **The backend snapshot wins whenever it exists.** `persist.js` chooses Firestore for signed-in
   users and `localStorage` otherwise (`state.mode = backend.mode`).
2. `data.js` seeds **only** when there is no snapshot **and** the user is **not** signed in **and**
   `tripID === seed.TRIP_ID`.
3. A signed-in user with no snapshot gets **`openNothing()`** — not the seed.

**Therefore:** Trip 12's id is `vitrox-trip12-tohoku`, which is **not** `seed.TRIP_ID`, so `data.js`
would take the `emptySnapshot(tripID)` branch and never serve it. **Putting the 679 records into
`data.js` cannot work and must not be attempted** (decision A4). The trip goes into Firestore via the
importer, and the demo seed is left alone.

`NEEDS VERIFICATION IN NEW SESSION` — the exact file list under `web/js/screens/` was inferred from
`app.js`'s import list (map, plan, dest, nearby, sub, shop, prep, log, note, trip, trips, spend,
paste, area, areas, stuck, share, join, review = 19). Confirm with `ls web/js/screens/`.

### 2.2 iOS client — `TravelPlanner.swiftpm/`

`TravelPlanner.swiftpm/Sources/Models/Models.swift` holds the full model set (§3). SwiftUI, iOS 17+,
portrait only, MapKit, bundle id `com.meridian.travelplanner`. **Never compiled.**

### 2.3 Firebase

- `firebase/firestore.rules` — verified verbatim. `users/{userId}` and everything below it require
  `request.auth != null && request.auth.uid == userId`. A separate `published/{code}` envelope
  supports share links with `owner` / `editors` / `snapshot`.
- `firebase/storage.rules` — present. `NEEDS VERIFICATION IN NEW SESSION`: the research bundle states
  a 20 MB cap and an `image/*` requirement; read the file to confirm.
- `firebase.json`, `.firebaserc.sample` — hosting + rules deploy targets.

### 2.4 Auth — resolve this before importing

`APP_README.md` (iOS) says **Anonymous Authentication**. `WEB_APP_GUIDE.md` says **Google sign-in and
email-link**, with anonymous "until users sign in once". The rules key everything to
`request.auth.uid`.

**Consequence:** the uid the trip must land under depends on which client and which sign-in the owner
actually uses. **An anonymous uid is replaced the moment the user signs in** — so importing to an
anonymous uid and then signing in with Google puts the trip somewhere the owner's device cannot see,
silently, with no error, because the rules simply return nothing.

> **Decision A3 makes this a HARD GATE. See §12 Phase 2A. No write of any kind may happen until the
> uid and the auth method are confirmed. The importer must refuse to run without them.**

---

## 3. Existing Trip Data Contract

Taken verbatim from `TravelPlanner.swiftpm/Sources/Models/Models.swift`. **This is the contract.**

> **Do not create a new parallel data model if the existing structure can support this.** Almost all
> of the research fits these types unchanged. Where it does not, §4.4 lists the *additive* fields to
> add — additive because both clients ignore unknown keys today.

### 3.1 Firestore layout (`APP_README.md`, verified)
```
users/{uid}/trips/{tripId}                 Trip document
users/{uid}/trips/{tripId}/days/{dayId}    TripDay, with PlanItem[] nested in `items`
users/{uid}/trips/{tripId}/places/{id}     Place — nearby pool + user-added
users/{uid}/trips/{tripId}/subRoutes/{id}  SubRoute
users/{uid}/trips/{tripId}/shopping/{id}   ShoppingItem
users/{uid}/trips/{tripId}/mustSee/{id}    MustSeeShot
users/{uid}/trips/{tripId}/prep/{id}       PrepItem
users/{uid}/trips/{tripId}/log/{id}        LogEntry
users/{uid}/trips/{tripId}/outfits/{id}    OutfitRecord
```

### 3.2 Enums
```swift
enum PlaceCategory: String { case food, cosme, cloth, shopping, sight, rest }
enum TransportMode:  String { case walk, train, bus }
enum PlanItemKind:   String { case main, sub }
enum ReturnTarget:   String { case coach, nextStop, hotel, station }
enum PaymentMethod:  String { case cash, card, ic, ewallet }
enum ShoppingBadge:  String { case none, ifTime, lastChance }
enum PackedLocation: String { case notPacked, suitcase, carryOn, backpack }
enum ChipTone:       String { case jade, amber, neutral }
```

### 3.3 The types this work touches
```swift
struct TransportLeg { var mode: TransportMode; var minutes: Int }

struct Place {                      // collection: places
  var id: String; var anchorPlaceID: String; var name: String
  var category: PlaceCategory; var priceTier: String; var stayMinutes: Int
  var legs: [TransportLeg]; var note: String; var isUserAdded: Bool
  var latitude: Double?; var longitude: Double?
}

struct EssentialRow { var key: String; var value: String; var detail: String }

struct PlanItem {                   // nested in TripDay.items
  var id: String; var time: String; var durationLabel: String
  var name: String; var subtitle: String; var note: String; var summary: String
  var windowLabel: String; var chips: [String]
  var kind: PlanItemKind; var isSubRouteSummary: Bool; var placeID: String?
  var essentials: [EssentialRow]
  var latitude: Double?; var longitude: Double?
  var archived: Bool; var movedToDay: Int?
}

struct TripDay {                    // collection: days
  var id: String; var dayNumber: Int; var dateLabel: String
  var shortDate: String; var areaSpan: String; var items: [PlanItem]
}

struct SubRoute {                   // collection: subRoutes
  var id: String; var dayNumber: Int
  var anchorPlanItemID: String; var anchorName: String
  var startMinutes: Int; var deadlineMinutes: Int; var placeIDs: [String]
  var returnTarget: ReturnTarget; var returnMinutes: Int
}

struct ShoppingItem {               // collection: shopping
  var id: String; var name: String; var detail: String
  var placeLabel: String; var placeWhen: String; var badge: ShoppingBadge
  var groupOrder: Int; var order: Int
  var estimate: Double?; var paidAmount: Double?; var payment: PaymentMethod
  var bought: Bool; var boughtOn: Date?; var isUnplanned: Bool
}

struct MustSeeShot {                // collection: mustSee
  var id: String; var placeID: String; var title: String; var tag: String
  var summary: String; var whereToFind: String
  var imagePath: String?; var captured: Bool; var order: Int
  var latitude: Double?; var longitude: Double?
}

struct PrepItem {                   // collection: prep
  var id: String; var category: String; var categoryOrder: Int; var order: Int
  var name: String; var why: String; var packed: Bool
  var location: PackedLocation      // Models.swift line 279 — see §4.5 bug (a)
}

struct Trip {
  var id: String; var name: String; var code: String; var dateRange: String
  var dayCount: Int; var currentDay: Int; var departsInDays: Int; var startDate: Date?
  var currencySymbol: String; var homeCurrencyCode: String; var homeCurrencyRate: Double
  var hotelName: String; var stationName: String; var prepCategories: [String]
  var weather: [DayWeather]; var latitude: Double; var longitude: Double
  var weatherUpdatedAt: Date?
}
```

### 3.4 Where the web client's shape differs from Swift — NINE drifts

Verified by reading both files. Two are known bugs from `APP_GAP_ANALYSIS.md`; **seven are new, five
of them found in the final handoff audit.**

| # | Field | `web/js/data.js` | `Models.swift` | Status |
|--:|---|---|---|---|
| 1 | prep packed location | `packedIn` | `location` | **Known bug (a)** — fix per §4.5 |
| 2 | `ShoppingItem.category` | present; `SHOP_CATEGORIES` filters on it | **absent** | **Known bug (b)** — fix per §4.5 |
| 3 | `PlanItem.endTime` | present | absent | NEW |
| 4 | `PlanItem.isSubRouteSummary` | absent | present | NEW |
| 5 | `Trip.currencyCode` | `'JPY'` | absent | **NEW (audit)** |
| 6 | `Trip.rateUpdatedAt` | `null` | absent | **NEW (audit) — use it, see A5 below** |
| 7 | `Trip.rateSource` | `''` | absent | **NEW (audit) — use it, see A5 below** |
| 8 | `Trip.locationName` | `''` | absent | **NEW (audit)** |
| 9 | `Trip.prepCategories` | **not a `TRIP` field** — a separate `PREP_CATEGORIES` export | present on `Trip` | **NEW (audit) — affects A9, see below** |

**Two consequences that change tasks:**

- **A5 is easier than the guide first assumed.** The web `TRIP` already carries `rateUpdatedAt` and
  `rateSource` alongside `homeCurrencyRate`. That is existing scaffolding for a user-set, tracked
  rate — **use those three fields** rather than inventing any. Record who set it and when.
- **A9 has two homes, not one.** On the web side the six categories go in the **`PREP_CATEGORIES`
  export**, because `TRIP` has no `prepCategories` field. Swift's `Trip.prepCategories` is the iOS
  equivalent and is out of scope this pass. **Setting only one of the two is a silent half-fix.**

**Rule for all nine:** align **additively** — add the missing field to whichever client lacks it,
keep both names working during any transition, and never rename or remove an existing one. Only
drifts 1 and 2 are *bugs* that actively corrupt data; the rest are gaps.

`SHOP_CATEGORIES` (web, verbatim): `food` / `clothing` / `souvenir` / `beauty` / `other`.
`PREP_CATEGORIES` (web, verbatim): `['Documents','Outfits','Carry-on','Electronics']` — **but the
research seed's `trip.prepCategories` has six**, adding `Photo missions` and `Day bag`. Reconcile.

---

## 4. New Trip Content To Add

### 4.1 Where the data actually is — use these files, do not regenerate anything

The research bundle ships **17 JSON batch files plus 2 summary files**. Together they are the trip.
**Every figure in this guide was computed from them.** Import them; do not re-derive them.

| File | Contents |
|---|---|
| `day1-haneda.json` … `day8-narita.json` | The eight day batches (day 7 has two files, see below) |
| `day7-ginza-backup.json` | The Ginza backup stop, full depth |
| `new-hotels.json` | The three hotels added on 4 Sep |
| `expand-d12.json`, `expand-d34.json`, `expand-d56.json`, `expand-d78.json` | The 30-minute-walk radius expansion |
| `topup-naruko.json`, `topup-tsukuba-shinjuku.json`, `topup-misc.json` | Verified third-party harvest **+ 17 corrections that reuse existing ids** |
| `summaries-d14.json`, `summaries-d58.json` | **The 165 summary lines** — see §5 |
| `validate_research.py` | The validator. Run it. |
| `seed_duplicates.json` | 20 duplicate venue pairs in the original seed that must be merged |
| `trip12_app_seed.json` | The original 363-record seed the batches extend |
| `notes.md`, `ITINERARY_CHANGE.md`, `APP_ROADMAP.md`, `IMAGES.md`, `notes*.md` | Provenance and reasoning |

**Decision A7: commit all of these to `research/trip12/`** so the import and its validation are
reproducible. They are **inputs, not build artefacts — do not `.gitignore` them.** The importer and
the integrity script both read from that directory.

**Import order is not optional.** Each `topup-*.json` carries an `appliesAfter` block. Import
`day*` → `new-hotels` → `expand-*` → **`topup-*` last**. The top-ups deliberately reuse 17 existing
record ids to correct them; applied earlier, last-write-wins restores the stale value.

### 4.2 Exact record counts (computed, authoritative)

| | Count |
|---|--:|
| Itinerary stops — **active / main** | **30** |
| — of which Day 7 holds | 5, incl. **Ginza** (decision A6) |
| Itinerary stops — removed 4 Sep, still viewable | 3 |
| **Total stops with data** | **33** |
| `places` (unique ids) | **523** |
| `mustSee` (unique ids) | **60** |
| `shopping` (unique ids) | **96** |
| **Searchable records total** | **679** |
| `subRoutes` | **17** |
| Stops with structured `hours` | **33 / 33** |
| Stops with a 5-line summary | **33 / 33** = **165 lines** |
| Records flagged `retired: true` | **31** |
| Ids reused from `trip12_app_seed.json` (update in place) | **241** |
| Brand-new ids (insert) | **438** |

**Three records changed `anchorStop` between batches** and the importer must take the **last** value.
All three are Naruko town places correctly moved off the retired hotel onto the live one:

| id | Name | From | To |
|---|---|---|---|
| `6391d4b9279e` | Naruko Onsen Shrine stairway | `Hotel Kameya, Naruko Onsen` | `Ooedo Onsen Monogatari Naruko Onsen Kounkaku` |
| `c6843df359bd` | Taki-no-Yu public bath | `Hotel Kameya, Naruko Onsen` | `Ooedo Onsen Monogatari Naruko Onsen Kounkaku` |
| `06cb9e37e31a` | Waseda Sajiki-yu public bath | `Hotel Kameya, Naruko Onsen` | `Ooedo Onsen Monogatari Naruko Onsen Kounkaku` |

A naive per-anchor render shows 682 slots for 679 records because of these three. Key by `id`.

### 4.2b C2 — renaming four hotels creates four NEW stop ids, and orphans 20 places

**This is the highest-risk mechanical trap in the import and it is easy to miss.**

Stop ids in the seed are **content-hashed from `(day, name)`** — `to_app_seed.py` computes
`sid('stop', dayNumber, stopName)`. So **renaming a stop changes its id.** Four hotels were renamed
or replaced on 4 Sep, which means the seed's `days[].items[]` still holds the **old** names and the
**old** ids:

| Day | Old name (in the seed today) | Old stop id | New name | **New stop id** |
|--:|---|---|---|---|
| 1 | Hotel Metropolitan Haneda | `d93da2ed9772` | Hotel Metropolitan Tokyo Haneda | **`22aa574d12d6`** |
| 2 | Hotel Kameya, Naruko Onsen | `6c7eb3d0ad36` | Ooedo Onsen Monogatari Naruko Onsen Kounkaku | **`def6a0a6a1c8`** |
| 3 | Okuiizaka Anabara Onsen Yoshikawaya | `bb4932f4f5bd` | Mercure Miyagi Zao Resort & Spa | **`bf4e19fcd2f6`** |
| 4 | Ooedo Onsen Monogatari Premium Kinugawa Kanko Hotel | `5f904002b01d` | Kinugawa Onsen Hana no Yado Matsuya | **`aae8b34364ff`** |

And places link to stops by id: **136 of the seed's 187 places carry a resolving `anchorPlaceID`,
51 are blank (the night/dawn pool), and 20 point at one of the four superseded hotels' stop ids.**

**What goes wrong if this is ignored:** four stops render under their old hotel names; four new stops
never appear; 20 places stay anchored to hotels the group is not staying at; and the day-1 rename is
treated as a hotel change rather than a rename.

**Required handling — do all five:**
1. **Day 1 is a RENAME, not a replacement.** Same property (JR East's official English name), same
   address, same phone. **Migrate** stop `d93da2ed9772` → `22aa574d12d6`: update the item's `name`,
   re-point its places, and do **not** create a retired stop for it. `day1-haneda.json` declares this
   in a `renamedStops` block.
2. **Days 2, 3, 4 are replacements.** Keep the old stop item, mark it retired (§9), **and** add the
   new hotel as a new stop item with its new id.
3. **Re-anchor the 20 places.** For each, decide from the batches whether it belongs to the retired
   hotel (an on-property record: its bath, breakfast, lobby) or transfers to the replacement (a
   town-level record). **The batches already answer this** — three records were explicitly
   re-anchored in `topup-naruko.json` (§4.2), and each `removedFromDay` manifest's `keepBecause`
   explains which way the rest go.
4. **Never recompute a stop id from a name at import time.** Take ids from the batch files. Any
   future rename must be a declared migration, not a silent re-hash.
5. **Verify after import:** zero places with a dangling `anchorPlaceID`; exactly 3 retired stops;
   `days[].items[]` contains the four new names and none of the four old ones as *active*.

### 4.2c C3 — two different enums are both called `category`. Do not cross-wire them.

| Used on | Field | Valid values | Source |
|---|---|---|---|
| `Place` | `category` | `food` · `cosme` · `cloth` · `shopping` · `sight` · `rest` | `PlaceCategory` in `Models.swift` |
| `ShoppingItem` | `category` | `food` · `clothing` · `souvenir` · `beauty` · `other` | `SHOP_CATEGORIES` in `web/js/data.js` |

**`food` is the only value they share**, which is exactly what makes the mistake silent. A place
category written onto a shopping item (`sight`, `rest`, `cosme`, `cloth`, `shopping`) is not in
`SHOP_CATEGORIES`, so the item **disappears from the web shop filter** with no error — the same class
of failure as known bug (b) in §4.5.

Rules:
- Import `Place.category` from the batches' `category` field — all values are already valid
  `PlaceCategory` members (verified).
- Import `ShoppingItem.category` from the seed's `category` (`souvenir` throughout) or map
  deliberately. **Do not copy a place's category onto a shopping item.**
- If you add a shared helper or type alias, name them distinctly — e.g. `PlaceCategory` vs
  `ShopCategory`. Never one shared `Category`.
- Add an integrity assertion: every `shopping[].category` ∈ `SHOP_CATEGORIES`, every
  `places[].category` ∈ `PlaceCategory`.

### 4.2d C4 — type coercion. Web now; iOS later.

The batches are JSON; the Swift models expect richer types. **Per decision A2 the iOS client is out
of scope for this pass**, so these are recorded for the later iOS pass and for whichever the web
client actually needs.

| Field | In the JSON | Swift expects | Handling |
|---|---|---|---|
| `Trip.startDate` | `"2026-09-08"` (string) | `Date?` | **CORRECTED IN AUDIT — match the web client, which uses a STRING.** `web/js/data.js`'s `TRIP.startDate` is `'2026-03-12'`, a plain string. Writing a Firestore Timestamp instead would risk breaking the client that is actually in scope. **Write the ISO string** `"2026-09-08"`. Converting to a Timestamp is **iOS-pass work**, and the iOS pass must migrate it — record that, do not pre-empt it here. |
| `ShoppingItem.estimate` | integer yen, or `null` | `Double?` | Coerce to a number. `null` is valid and means unpriced. |
| `ShoppingItem.paidAmount`, `boughtOn` | absent / `null` | `Double?`, `Date?` | Leave unset. Do not write `0` or an epoch date — both read as real user input. |
| `LogEntry.updatedAt` | absent | `Date` (non-optional) | Only matters if you write log entries. **Do not seed any.** |
| `Trip.weatherUpdatedAt`, `departsInDays` | absent | `Date?`, `Int` | Leave unset / compute for display only. **A1: never gate visibility on `departsInDays`.** |
| enums (`PlaceCategory`, `TransportMode`, `PaymentMethod`, `ShoppingBadge`, `PackedLocation`, `ReturnTarget`) | plain strings | strict Swift enums | Every value in the batches is already a valid member — **verified**. Do not invent a new one; Swift decoding fails hard on an unknown case. |

**Web-pass requirement:** whatever the web client writes must be **Swift-decodable later**. Choosing
a string date now creates an iOS migration later. Prefer Timestamps.

### 4.3 Trip-level information → the `Trip` document

| `Trip` field | Value |
|---|---|
| `id` / `tripId` | `vitrox-trip12-tohoku` |
| `name` | `ViTrox Japan Tohoku · Trip 12` |
| `code` | `T12` |
| `dateRange` | `8–15 Sep 2026 · agent itinerary · 8 days` |
| `dayCount` | `8` |
| `startDate` | `2026-09-08` |
| `currencySymbol` / `homeCurrencyCode` / `homeCurrencyRate` | `¥` / `MYR` / seed with `33.7`, **then let the user change it — decision A5** |
| `hotelName` | `Hotel Metropolitan Tokyo Haneda` (night 1) |
| `stationName` | `Penang International Airport (assemble 07:00)` |
| `latitude` / `longitude` | `37.5` / `140.0` (region centroid) |
| `prepCategories` | **`['Documents','Outfits','Carry-on','Electronics','Photo missions','Day bag']` — all six. SETTLED by decision A9.** **This has TWO homes, not one:** on the web side the six go in the **`PREP_CATEGORIES` export** in `web/js/data.js` (which has four today), because the web `TRIP` object has **no `prepCategories` field** — see drift 9 in §3.4. Swift's `Trip.prepCategories` is the iOS equivalent and is out of scope this pass. **Setting only one of the two is a silent half-fix.** 85 prep lines are already categorised against these six. |
| `currentDay` | `1` |
| `departsInDays` | Swift-only field. Compute for **display only**. **Decision A1: never gate visibility on it** — the trip must stay fully open when it goes to zero or negative. `NEEDS VERIFICATION IN NEW SESSION` — is it derived or stored? |

**Currency rate — decision A5 resolves this by removing the choice.** The seed says
`homeCurrencyRate: 33.7`; the ViTrox app's own converter read `100 JPY = 2.5458 MYR` on 21 Aug 2026,
i.e. ~**39.3 ¥/RM**. Rather than pick one:

> **A5: expose the rate in trip settings as a user-editable value and compute every conversion from
> whatever the user has set.**

This is a **small feature, not just a data value** — treat it as in scope:
- `Trip.homeCurrencyRate: Double` **already exists in both clients.** No schema change.
- **The web `TRIP` also already carries `rateUpdatedAt` and `rateSource`** (drift 6 and 7 in §3.4) —
  existing scaffolding for exactly this. **Use all three**: store the rate, stamp when it was set,
  and record where it came from (`'user'`, or the researched seed). Do not invent new fields.
- Seed it with the researched value; persist whatever the user sets.
- **Every displayed home-currency figure must derive from the current stored rate at render time.**
  Store **no precomputed MYR values** anywhere in the data — the 96 shopping estimates stay in yen.
- Show the rate near converted figures so a stale rate is visible rather than silent.
- This does **not** ask for a live FX feed; `APP_README.md` correctly lists that as unimplemented.

`NEEDS VERIFICATION IN NEW SESSION` — find the settings screen (likely `web/js/screens/trip.js`) and
every place a converted figure is shown (likely `web/js/screens/spend.js` and the shopping screen).
**Confirm whether a rate input already exists before adding one.**

Flights, baggage, crew, missions, contests and the source-conflict register live in the seed's
`trip.x` block. `Trip` has no field for any of them. Write them through in `x` (§4.4).

### 4.4 Fields the research needs that the schema lacks — add these, additively

Both clients ignore unknown keys today, which is what makes this safe. **Add, do not restructure.**

| Add to | Field | Type | Why |
|---|---|---|---|
| `Place`, `MustSeeShot`, `ShoppingItem` | `nameJp` | `String?` | **679 of 679 records carry one and neither client has the field.** Search in Japanese is impossible without it (§6). Highest-value single addition. |
| `Place` | `timeWindow` | `'day'\|'night'\|'dawn'\|'24h'` | 84 `rest`-category records only make sense at night or dawn |
| `Place`, `MustSeeShot`, `ShoppingItem` | `confidence` | `'high'\|'medium'\|'low'` | Every record has one |
| ″ | `confidenceNote` | `String?` | Required whenever `confidence != high` |
| ″ | `coordPrecision` | `'verified'\|'approximate'` | 2 records were once marked verified and were wrong by 260 km and 2.4 km |
| ″ | `source` | `String?` | The URL the fact came from |
| ″ | `retired`, `retiredReason`, `retiredReplacedBy` | `Bool` / `String?` | §9 |
| ″ | `coordFix`, `nameNote` | `String?` | Audit trail for corrected coordinates and readings |
| `PlanItem` | **`stopSummary`** | object, §5 | **P0 item 0** |
| `PlanItem` | `hours`, `closedNote`, `lastAdmission`, `seasonFrom`, `seasonTo`, `groupRate`, `phone`, `website` | see §4.6 | Structured, so the closing-day checker can run |
| `TripDay` | `dateISO`, `sun`, `outfitPhoto`, `outfitPractical`, `removedStops[]` | | §9; sun drives all photo timing |
| `SubRoute` | `title`, `steps[]`, `note`, `totalWalkMinutes` | | Our loops carry per-step arrive/stay/walk |
| `Trip` | `x` | object | Flights, crew, missions, conflicts |

### 4.5 Two existing bugs to fix BEFORE importing — both corrupt data silently

**(a) `prep` packed-location field name differs between clients.**
`Models.swift` line 279 writes `var location: PackedLocation`; `web/js/data.js` writes `packedIn`.
Same Firestore document, different key — pack on the phone, open the web app, the state is gone.
**Standardise on `packedIn`** (it is what the seed data uses) and migrate `location` → `packedIn`.

**(b) `shopping.category` exists in web, not in Swift.**
`web/js/data.js` writes `category` and `SHOP_CATEGORIES` filters on it; `ShoppingItem` in
`Models.swift` has no such property, so an item edited on iOS is written back **without it** and
vanishes from the web filter. **Add `category: String` to `ShoppingItem`.** Valid ids: `food`,
`clothing`, `souvenir`, `beauty`, `other`.

Also decide the two **new** drifts found this session: `PlanItem.endTime` (web only) and
`PlanItem.isSubRouteSummary` (Swift only).

### 4.6 `essentials` — mapping structured hours onto `EssentialRow`

We emit 33 `essentials` blocks with these keys: `hours`, `closedNote`, `lastAdmission`, `seasonFrom`,
`seasonTo`, `groupRate`, `phone`, `phoneNote`, `website`, `tickets`, `transport`, `confidence`,
`source` (+ `confidenceNote` on 19, `lastAdmissionNote` and `seasonNote` on 1 each).

`EssentialRow` is `{key, value, detail}` — flat strings. So:
1. **Keep the structured object** on `PlanItem` as the new fields in §4.4. This is what makes the
   closing-day checker possible and is the whole reason the research collected structured hours.
2. **Also project it into `essentials: [EssentialRow]`** for display, so the existing Info panel
   keeps working untouched. Suggested projection — `NEEDS VERIFICATION IN NEW SESSION` on exact
   row order and labels:
   `Hours` → rendered weekday grid or a one-line summary, `detail` = `closedNote`;
   `Last admission`, `Tickets`, `Group rate`, `Phone`, `Website`, `Transport`, `Season`.

`hours` shape, verbatim from the batches:
```json
"hours": {"mon": [["09:00","17:00"]], "tue": null, "wed": [["09:00","16:30"]], ...}
```
`null` means **closed that day**. An array may hold multiple spans (a lunch break).

### 4.7 `subRoutes` — a mapping gap you must close

Ours carry `anchorStop` (a stop **name**). Swift's `SubRoute` needs `anchorPlanItemID` (a stop
**id**), plus `dayNumber`, `returnTarget` and `returnMinutes`, none of which we emit.

**Resolve `anchorStop` → the `PlanItem.id` of the stop with that exact `name`, on import.** Set
`dayNumber` from the day the stop sits on. For `returnTarget` use `coach` for every one of the 17 —
this is a coach tour and every loop's deadline is the coach departure. Derive `returnMinutes` from
`deadlineMinutes`. Keep our `title`, `steps[]`, `note`, `totalWalkMinutes` as additive fields.

### 4.8 The 33 stops — exact manifest

`Pl` places · `MS` mustSee · `Sh` shopping · `SR` subRoutes · `Sum` has a 5-line summary · `Ess` has
structured essentials. **Stop strings must match byte-for-byte** — they are the join key used
throughout the batches and the validator whitelist.

| Day | Time | Dur | Stop (exact `anchorStop` string) | State | Pl | MS | Sh | SR | Sum | Ess |
|---|---|---|---|---|--:|--:|--:|--:|:-:|:-:|
| 1 | `21:55` | arrive | `Haneda Airport — Terminal 3` | active | 6 | 0 | 0 | 0 | Y | Y |
| 1 | `—` | overnight | `Hotel Metropolitan Tokyo Haneda` | active | 11 | 2 | 2 | 0 | Y | Y |
| 2 | `09:15` | 50 min | `Tokyo Station` | active | 17 | 1 | 1 | 0 | Y | Y |
| 2 | `11:40` | 35 min | `Sendai Station` | active | 15 | 1 | 4 | 0 | Y | Y |
| 2 | `13:18` | 1 h | `Matsushima Fish Market` | active | 6 | 1 | 1 | 0 | Y | Y |
| 2 | `14:20` | 1 h | `Zuiganji Temple` | active | 10 | 1 | 3 | 1 | Y | Y |
| 2 | `15:22` | 30 min | `Godaido Hall` | active | 8 | 2 | 1 | 0 | Y | Y |
| 2 | `16:00` | 1 h | `Matsushima Bay Cruise — Nioumaru course` | active | 9 | 1 | 1 | 0 | Y | Y |
| 2 | `18:30` | overnight | `Ooedo Onsen Monogatari Naruko Onsen Kounkaku` | active | 18 | 1 | 3 | 0 | Y | Y |
| 2 | `—` | removed | `Hotel Kameya, Naruko Onsen` | REMOVED | 10 | 1 | 1 | 0 | Y | Y |
| 3 | `09:30` | 2 h | `Ginzan Onsen Street` | active | 31 | 4 | 4 | 2 | Y | Y |
| 3 | `15:10` | 1 h 30 | `Zao Fox Village` | active | 7 | 1 | 1 | 0 | Y | Y |
| 3 | `17:15` | overnight | `Mercure Miyagi Zao Resort & Spa` | active | 12 | 1 | 3 | 0 | Y | Y |
| 3 | `—` | removed | `Okuiizaka Anabara Onsen Yoshikawaya` | REMOVED | 9 | 0 | 2 | 0 | Y | Y |
| 4 | `10:00` | 1 h | `Goshikinuma Ponds` | active | 15 | 1 | 1 | 0 | Y | Y |
| 4 | `13:10` | 1 h 30 | `Tsuruga Castle (Tsurugajo)` | active | 20 | 4 | 6 | 1 | Y | Y |
| 4 | `14:40` | 2 h | `Ouchi-juku` | active | 16 | 1 | 3 | 1 | Y | Y |
| 4 | `18:20` | overnight | `Kinugawa Onsen Hana no Yado Matsuya` | active | 15 | 2 | 3 | 0 | Y | Y |
| 4 | `—` | removed | `Ooedo Onsen Monogatari Premium Kinugawa Kanko Hotel` | REMOVED | 8 | 2 | 1 | 0 | Y | Y |
| 5 | `09:20` | 1 h | `Kegon Falls` | active | 13 | 2 | 1 | 1 | Y | Y |
| 5 | `11:00` | 1 h 15 | `Nikko Toshogu Shrine` | active | 17 | 3 | 2 | 1 | Y | Y |
| 5 | `14:00` | 2 h | `Edo Wonderland Nikko Edomura` | active | 15 | 2 | 2 | 1 | Y | Y |
| 5 | `18:00` | overnight | `Hotel Nikko Tsukuba` | active | 24 | 1 | 3 | 0 | Y | Y |
| 6 | `09:30` | 1 h | `Hitachi Seaside Park` | active | 14 | 2 | 1 | 0 | Y | Y |
| 6 | `13:30` | 1 h | `Kawagoe Old Town (Kurazukuri Street)` | active | 19 | 3 | 4 | 2 | Y | Y |
| 6 | `15:30` | 1 h | `Shibuya Scramble Crossing` | active | 18 | 2 | 2 | 0 | Y | Y |
| 6 | `18:30` | overnight | `Shinjuku Granbell Hotel` | active | 17 | 1 | 1 | 0 | Y | Y |
| 7 | `09:00` | 1 h 30 | `Tokyo Tower` | active | 27 | 5 | 2 | 0 | Y | Y |
| 7 | `10:50` | 1 h | `Tsukiji Outer Market` | active | 28 | 3 | 9 | 2 | Y | Y |
| 7 | `14:30` | 2 h 30 | `Shisui Premium Outlets` | active | 17 | 1 | 4 | 1 | Y | Y |
| 7 | `13:45` | 2 h–2 h 30 | `Ginza` | BACKUP | 27 | 4 | 13 | 2 | Y | Y |
| 7 | `17:30` | overnight | `International Resort Hotel Yurakujo` | active | 22 | 1 | 2 | 0 | Y | Y |
| 8 | `—` | departure | `Narita Airport — Terminal 1 South Wing` | active | 25 | 3 | 9 | 2 | Y | Y |
**Day headers, dates and sun times** come from each day batch and from `sun.json`. Reference
temperatures on the revised itinerary: D1 27°/23° · D2 27°/18° · D3 24°/20° · D4 27°/19° ·
D5 30°/25° · D6 30°/24° · D7 26°/23° · D8 26°/22°.

**Day 7 holds five stops** because `Ginza` is a backup for `Shisui Premium Outlets`. Both must exist
and coexist (§9.4). Ginza's `13:45` time is the *proposed* arrival if the swap happens, not a
scheduled one.

---

## 5. `stopSummary` — P0 item 0

### 5.1 What it is and why it ranks first
Five short lines per stop — **Do · Eat · Snack · Buy · See** — that resolve 679 records into an
*answer*. A traveller standing at Ginzan Onsen at 09:35 cannot read 31 place records. They can read
five lines.

The original seed already carried four of the five as per-stop prose in `x.mustDo` / `x.mustEat` /
`x.mustBuy` / `x.mustSee`. Good writing, stranded in a block both clients ignore. The fifth line,
**`snack`**, did not exist and is the one that matters most on this trip: **every meal is already
booked by the tour agent**, so "what do I buy and eat standing up in twenty minutes" is the only food
question a traveller actually has.

### 5.2 Content — the exact source. Do NOT regenerate.
**All 165 lines already exist, written and verified:**

- `summaries-d14.json` → `stopSummary` — **16 stops** (Haneda T3, Hotel Metropolitan Tokyo Haneda,
  Tokyo Station, Sendai Station, Matsushima Fish Market, Zuiganji, Godaido, Bay Cruise, Ginzan,
  Zao Fox Village, Goshikinuma, Tsurugajo, Ouchi-juku + the **3 retired** stops)
- `summaries-d58.json` → `stopSummary` — **17 stops** (Kegon, Toshogu, Edo Wonderland, Hotel Nikko
  Tsukuba, Hitachi, Kawagoe, Shibuya, Shinjuku Granbell, Tokyo Tower, Tsukiji, Shisui, Yurakujo,
  Narita T1 + the **4 new/backup** stops: Kounkaku, Mercure Miyagi Zao, Hana no Yado Matsuya, Ginza)

16 + 17 = **33 stops × 5 lines = 165 lines. Zero key overlap.** Verified: no empty line, every line
under 500 characters (max 499, mean 478), and every key matches the validator whitelist byte-for-byte.

> **The full text is deliberately not duplicated into this guide.** It is ~79 KB and copying it here
> would create a second source of truth that silently drifts from the JSON the importer reads. The
> two files ship in the same bundle as this guide. **Read them, import them verbatim, change no
> wording.** If you believe a line is wrong, do not edit it — record it and report it (§15).

### 5.3 Data contract
Field name: **`stopSummary`**, on **`PlanItem`** (the stop), not on `Place`. Shape as it exists in
the source files:

```json
"Ouchi-juku": {
  "do":     "…",
  "eat":    "…",
  "snack":  "…",
  "buy":    "…",
  "see":    "…",
  "confidence": "high",
  "correctedFromSeed": ["one short string per correction"],
  "source": "https://…"
}
```
Plus, where applicable: `"newStop": true` (the 4 stops with no seed prose) and
`"retired": true` + `"retiredReplacedBy": "…"` (the 3 removed stops).

- **Keyed by the exact stop name string.** Join to `PlanItem` by `name`, then store on the item.
- **Empty / unknown values are never blank.** Seven lines say plainly that there is nothing —
  "no standing food here; the nearest konbini is a 20-minute unlit walk". **Render that sentence.
  Never render an empty cell, a dash, or "N/A".**
- **Translations: not required, and not possible today.** See §10.
- `correctedFromSeed` is the audit trail — **196 entries across the 33 stops.** It must remain
  inspectable (§5.5).

### 5.4 UI — where it goes in `web/js/screens/dest.js`
`dest.js` renders: hero → `.dest-name` / `.dest-sub` / `.dest-desc` → map links → **five tabs
(Info · Nearby · Must-see · Shop · Notes)** → active panel → sheet overlay. `essentials` render
**only inside the Info panel**.

**Insert the summary block immediately after `.dest-desc` and BEFORE the tab navigation.**

That satisfies the research's "above hours and tables" requirement in this app's actual structure:
the five lines are the answer, and everything in the tabs — hours, nearby, must-see, shop — is the
evidence. Putting it inside the Info tab would bury the answer behind a tab click.

Requirements:
- **The five labels must be visually distinguishable**, not five identical paragraphs. People
  navigate to "Snack" by colour after the second stop, not by reading labels. The review artifact
  used indigo / ochre / vermilion / moss / blue for Do / Eat / Snack / Buy / See — reuse those roles
  or pick five from `web/css/app.css`'s existing palette. `NEEDS VERIFICATION IN NEW SESSION` —
  read `app.css` for the existing token names; do not introduce a second palette.
- Responsive: a grid that reflows to one column on a phone. Lines average 478 characters, so a
  three-column layout needs ~268px minimum per column.
- **No collapsing.** The summary is always open. Only `correctedFromSeed` collapses.

### 5.5 The correction disclosure
Render `correctedFromSeed` as a collapsed `<details>` labelled **"N corrections to the original
prose"**, expanding to the list. It is closed by default and open on demand.

**Do not hide, drop, or silently apply the corrections without the disclosure.** Their whole purpose
is that a reader can see what changed and why — that is how the Waseda Sajiki-yu closure and the
Narita airside error became visible at all.

### 5.6 `plan.js` — optional, low risk
A one-line teaser on `.plan-card` (the `do` line truncated) is a reasonable addition. **Do not make
stops collapsible on the plan screen** — that is not how this app works, and `go('dest', {itemID})`
is the established navigation.

---

## 6. Full-Text Search — P0 item 5

### 6.1 Why this is P0, with the canonical failure
With **679 records across 33 stops**, a record can be present, correct, and completely unfindable.
The proof: **Ishii Sports was the 28th row of a 28-row table inside a stop detail on Day 7.** The
owner looked for it, could not find it, and reasonably concluded it was missing. Nothing was wrong
with the data. The UI simply had no way to reach it. See §8.

### 6.2 Required behaviour — established, do not extend
| Aspect | Requirement |
|---|---|
| **Scope** | All **679** records: 523 `places` + 60 `mustSee` + 96 `shopping` |
| **Fields searched** | `name`, **`nameJp`**, and `note` (`summary` for mustSee, `placeLabel` for shopping) |
| **Minimum query** | 2 characters. Below that, show nothing — do not render 679 rows |
| **Ranking** | Prefix matches on `name` or `nameJp` first, then substring matches anywhere in the haystack. Cap the result list at **30** |
| **Result row shows** | Record name, `nameJp` if present, `Day N · Stop name`, and the kind (`place` / `must-see` / `buy`) |
| **On select** | (1) switch to the itinerary/plan view, (2) navigate to that record's **day**, (3) open that record's **stop**, (4) scroll the matching row into view, (5) **flash-highlight it** for ~2.4s, (6) clear the query and close the result list |
| **Empty state** | `Nothing matches "<query>".` — never a blank panel |
| **Clearing** | `Escape` clears the field and closes results; clicking outside closes results without clearing |
| **Japanese** | Must work. `こけし` → 8 hits, `蒲鉾` → 5, `銀山` → 6, `東照宮` → 6, `足湯` → 8, `Ishii` → 1 |
| **Performance** | Build the index once at load, in memory: ~679 entries, one lowercased haystack string each. Linear scan is fine — the reference implementation caps the scan at 400 candidates. No library, no worker, no debounce needed at this size |

### 6.3 Where it mounts
**`NEEDS VERIFICATION IN NEW SESSION`.** Two viable options; pick after reading `nav.js` and
`strip.js`:
- **(a) A new registered screen** — `web/js/screens/search.js`, registered in `app.js` alongside the
  other 19, reachable from `#tabbar`. Most consistent with the existing architecture.
- **(b) A persistent field in the shell** — mounted in `web/index.html` near `#strip`. Better
  ergonomics, but it must not disturb the four container ids other modules query.

Navigation must go through the existing router (`go(...)` / `register` / `start` in `nav.js`), **not
a second ad-hoc mechanism.**

### 6.4 The index needs `nameJp` to exist first
`Place`, `MustSeeShot` and `ShoppingItem` have **no Japanese-name field in either client** (§3.3,
§4.4). All 679 records carry one. **Search in Japanese is impossible until `nameJp` is added.**
Do §4.4 before §6, and treat the Japanese search tests in §14 as blocked until it lands.

This matters more than it sounds: many of these places are more findable as `蒲鉾` or `こけし` than by
romanisation, **and the romanisations are themselves unreliable** — `和楽足湯` is read *Warashiyu*,
not the character-by-character "Waraku Ashiyu" (§7.5).

---

## 7. Important Research Corrections — implementation checklist

These are facts the data must carry. Each was verified against an operator or official source. **Do
not soften, summarise or drop any of them.** The full reasoning is in `notes.md`,
`ITINERARY_CHANGE.md` and the `notes*.md` files.

### 7.1 Narita — the souvenir run is AIRSIDE
- [ ] The original prose said do the omiyage run **before** security. **Wrong.**
- [ ] **Narita Nakamise is Terminal 1 South Wing 3F, after immigration.**
- [ ] The omiyage plan moves to the **airside window, ~09:50–10:25**.
- [ ] The landside window (~07:20–08:40) is for the free ITOKI lounges, the 5F deck, and food.
- [ ] Every Narita record must state **BEFORE** or **AFTER** security explicitly.
- [ ] Terminal is now **confirmed, not inferred**: Narita's own airline page prints Singapore
      Airlines as *T1 South Wing / 4F*.

### 7.2 Toshogu — Saturday coach ban costs 25 minutes on site
- [ ] The shrine's own access page: 「土・日・祝祭日、特別な行事のある日は駐車不可」. **12 Sep 2026 is a
      Saturday**, so the 45-seat coach cannot use 東照宮大駐車場.
- [ ] Fallback: 市営西参道第2・3駐車場, 安川町2-47, ¥1,540/day, 140 spaces, 24 h.
- [ ] **~10 minutes' walk each way, out of a 75-minute stop → about 50 minutes on site.** The stop's
      summary and essentials must say this.
- [ ] Measure the 30-minute radius **from Nishi-sando**, not the banned main lot — which is what puts
      Rinnoji Sanbutsudo 4 min away (and it opens 08:00, an hour before the shrine).

### 7.3 Hitachi Seaside Park — two separate errors
- [ ] **Nemophila:** the company app's Day 6 summary promises "seaside nemophila fields". Nemophila
      is mid-April to early May. **On 13 September there are none.** What is there: **green kochia at
      peak** (緑葉 mid-Aug to late Sep, ~40,000 plants over 2.3 ha at ~70 cm) and pampas grass just
      past peak. The red kochia, cosmos and roses are all October.
- [ ] **Melon soft-serve location:** it is at **Kinen no Mori Rest House**, **not the West Gate
      kiosks** as the original prose said — and Kinen no Mori **opens 10:00**, an hour into a
      **09:30–10:30** stop. Say so.
- [ ] The park opens **09:30 exactly**, so any delay comes straight out of hill time. Glass House is
      at the opposite gate and unreachable in 60 minutes. Group rate **¥290 for 20+**.
- [ ] The park closes **Tuesdays** in September — Sun 13 Sep is open.

### 7.4 Matsushima — Godaido is 23 minutes, not 30
- [ ] The 16:00 bay cruise is the **last sailing**; it berths **16:50** against a **17:00** coach
      departure.
- [ ] **The 15:50 boarding call does not fit a 30-minute Godaido stop.** Godaido's real allocation is
      **≈23 minutes** (15:22 → ~15:45), not the 30 printed.
- [ ] Board by **15:50**. The 15+ group discount is **¥1,350, not ¥1,500**.

### 7.5 Warashiyu — verify the reading propagated everywhere
- [ ] `和楽足湯` is read **わらしゆ — WARASHIYU**. Obanazawa City prints the furigana. It is a
      compression pun; "Waraku Ashiyu" is the naive character-by-character read and is **wrong**.
- [ ] **This is an explicit validation task.** After import, grep the whole dataset:
      `grep -rn "Waraku Ashiyu" <data>` — every surviving hit must sit **inside an explanation of why
      that reading is wrong** (the `nameNote` field, and one `correctedFromSeed` entry). Any other
      occurrence is a miss and must be fixed.

### 7.6 Zao Fox Village — 80 usable minutes, not 90
- [ ] Operator: `9:00~16:30(最終入場16:00) 夏季営業`. **Last admission 16:00**, gate closes 16:30,
      coach scheduled out **16:40**.
- [ ] Real usable stop: **80 minutes**. The shop shuts with the park. **Cash only, ¥1,500 × 35 =
      ¥52,500 in notes.** No group rate published.

### 7.7 Waseda Sajiki-yu — closed over the group's night
- [ ] **Closed 3–10 September 2026** for 源泉 maintenance, confirmed on two official association
      sites, and it may be extended. Our own earlier record sold it as "the bath that still works if
      dinner runs long" — that would have walked the group to a locked door.
- [ ] Consequence: **Taki-no-Yu is the only public bath open in Naruko that night** (07:30–21:00,
      last entry 20:30, ¥300), in a facility Osaki City itself warns cannot take many bathers at once.

### 7.8 Shisui coordinate — the seed geocoded the town, not the mall
- [ ] The seed pin `35.7222 / 140.2696` is **~2,392 m WNW of the mall**. GSI returns that point for
      the *town polygon* 「千葉県印旛郡酒々井町」.
- [ ] Correct position: **`35.713812 / 140.294023`** — five independent sources agree within 554 m.
      Cross-check: the neighbouring onsen publishes 徒歩約700m to the outlet, which is 634 m to
      consensus and 2,154 m to the seed pin.
- [ ] **15 place/shopping records are already corrected in the batches.** The remaining one is the
      **stop** record `21c5d54201ee`, which lives in `days[].items[]` and is **outside the batch
      schema** — the importer must fix it there.

### 7.9 Narita stop coordinate
- [ ] Stop record `184f9cf0f25a` (`Narita Airport — Terminal 1 South Wing`) has a longitude ~600 m
      east, out over the apron. Also in `days[].items[]`. **Fix on import.**

### 7.10 Twenty duplicate venues in the original seed
- [ ] `seed_duplicates.json` lists **20 pairs** where one real venue exists twice under two
      content-hashed ids — once anchored to a stop, once as a night/dawn spot. THE ROOFTOP, Hanazono
      Shrine, Godzilla Head, Golden Gai, Ashiyu Sky Deck, Haneda Grand Torii and 14 more.
- [ ] **Write the `keep` id and merge the `duplicate`'s `timeWindow` / `hoursText` / `hotelKm` onto
      it.** Importing both creates two pins for one place.
- [ ] Three pairs are flagged `coLocated` — genuinely different venues sharing a building coordinate.
      **Keep both** of those.

### 7.11 Other corrections that change a plan
- [ ] **Edo Wonderland** lost 30 minutes on 4 Sep — 14:00–16:00, not 14:00–16:30. Last entry is still
      16:00 so admission is fine, but the ~15:50 last theatre start now begins **after the coach
      leaves**. Sub-route `d5sr03edo`'s deadline was moved 990 → 960 minutes and its late steps
      flagged `droppedByRevision`.
- [ ] **Tokyo Tower** group rate: **¥1,080** agency/advance (`/fee/agency/`) vs ¥1,350 walk-up
      (`/fee`). Both are Tokyo Tower's own. **Group settlement is CASH ONLY.**
- [ ] **Tokyo Tower Foot Town** — the entire food offer including the halal Siddique Palace **opens
      11:00**, against a 09:00 arrival.
- [ ] **Zojoji** — the Sangedatsumon is inside a steel 素屋根 **until 2032** and shogun-cemetery
      viewing is **suspended**. The classic group shot changes.
- [ ] **Ouchi-juku** — Kintaro Soba Yamamotoya **is open Fri 11 Sep** (its own site's September
      closures: 2,3,4,8,10,17,18,24,25,30). **Misawaya has no closing day.** **Minatoya is
      10:30–16:00.** Village shops run 09:00–16:00 against a 14:40–16:40 slot.
- [ ] **Tokyo Station** — Gransta souvenir units open 10:00, shut for the whole 09:15–10:05 window.
      **Maruzen Marunouchi in Oazo opens 09:00** and is the answer.
- [ ] **Tax-free is at-the-till until 31 Oct 2026** (refund system from 1 Nov). ¥5,000 tax-excluded
      per store per day; Visit Japan Web accepted in place of a passport. **No departure refund
      counter to queue for at Narita.**
- [ ] **Tsukiji is a full trading day on Mon 14 Sep**, but 10:50 sits inside the 09:00–14:00 retail
      window — the honest framing is "specific items have sold out", not "closing". うおがし銘茶 is
      shut Mondays.
- [ ] **Kawagoe** — every anchor was 250–350 m NE; Koedo Kurari was 1.1 km out. **MAG'S PARK is now
      MAG8 at ¥1,800/head** (¥63,000 for 35). **Ogakiku closes Thursdays**, not Mondays.
- [ ] **Aoba-dori** (`7a27a1e1055d`) was marked `verified` at `35.926, 140.882` — **in the Pacific,
      260 km from Sendai.** Now `38.2606, 140.8751`.
- [ ] **Our own errors found late:** the Don Quijote Kabukicho record cited `shop_id 195` = 西帯広,
      **Hokkaido** (correct: 29); the Expo Center ticket is **¥600/¥300**, not ¥500, and its two
      forecourt records are near-duplicates on one coordinate.
- [ ] **Miyagi accommodation tax ¥300/night from 13 Jan 2026**, cash at the desk, on nights 2 and 3.
- [ ] **鬼怒川公園岩風呂 closed permanently 31 Mar 2024** — same banchi as the night-4 hotel. The
      nearest public bath to that door no longer exists.

### 7.12 Zero images — and why
- [ ] **No record carries an `images` key.** Commons and `api.wikimedia.org` are cache-only from the
      research sandbox, `en.wikipedia.org/w/api.php` likewise, Openverse 403s. Rather than attach
      images without a licence — which the validator rejects — the key is omitted.
- [ ] **Build the Storage upload path anyway** (`MustSeeShot.imagePath` and the equivalent for
      places, carrying `license` / `credit` / `sourcePage`) but **expect an empty set**, and fall back
      to an image-search link.
- [ ] `fetch_images.py` ships in the bundle and will work from a normal network. `IMAGES.md` explains
      it. **That is a separate task — do not run it as part of this implementation.**

---

## 8. Ishii Sports — the canonical discoverability acceptance test

### 8.1 Where it is
| | |
|---|---|
| File | `topup-misc.json` → `places[]` |
| id | `tmisc-ishii-jimbocho` |
| name | `Ishii Sports Tozan Honten, Jimbocho` |
| nameJp | `石井スポーツ 登山本店` |
| `anchorStop` | **`Tsukiji Outer Market`** (Day 7) |
| category / priceTier | `shopping` / `¥¥` |
| `stayMinutes` | 30 |
| `legs` | `[{walk 4}, {train 15}, {walk 3}]` — 22 min door to door |
| coords | `35.696281 / 139.759399`, `verified` |
| confidence | `high` — 10:00–20:30, 無休, from the operator's own page and Chiyoda City's |

### 8.2 Why it was invisible
It sorted **last** in a 28-row table (ride-legs sort after walk-legs) inside a stop detail on Day 7.
Present, correct, unreachable. **This is the test that proves the search feature works.**

### 8.3 Required behaviour
1. Type `Ishii` → **exactly 1 result**, showing `Day 7 · Tsukiji Outer Market · place`.
2. Select it → navigate to **Day 7**, open **Tsukiji Outer Market**, scroll the row into view,
   flash-highlight it, clear the query.
3. `石井` must also find it — which requires `nameJp` (§6.4).

### 8.4 The distinction that must survive — indexed near ≠ recommended at
**It is anchored to Tsukiji because that is the nearest itinerary stop, NOT because it is a Day 7
activity.** Its own `note` says so:

> *"BE PLAIN: this does NOT fit the itinerary. The Tsukiji slot is 10:50–11:50 and the round trip is
> 44 min in transit, leaving about 15 min in the shop with no margin — and Day 7 has no other gap.
> The real window is the free evening of Sun 13 Sep from Shinjuku Granbell: Toei Shinjuku line,
> Shinjuku to Jimbocho direct, 10 min, ¥220, shop open to 20:30."*

**Do not render an anchored place as a recommended activity for that stop.** Any UI that lists
`places` under a stop must keep the `note` visible, and must not imply that 30 `stayMinutes` fits
inside a 60-minute stop. Consider surfacing a `reachable` verdict (§11 P1) so the conclusion is
rendered rather than left for the reader to infer from a 22-minute leg chain.

This generalises: **679 records are indexed by proximity to a stop. That is an index, not an
itinerary.** Records with a `train` or `bus` leg, and the 84 `rest`-category night/dawn places, are
especially prone to being misread as scheduled activities.

---

## 9. Retired, backup and non-active stops

### 9.1 There IS an existing mechanism — check it before inventing one
`PlanItem` already has:
```swift
var archived: Bool
var movedToDay: Int?
```
**Use `archived` rather than adding a new flag.** `NEEDS VERIFICATION IN NEW SESSION` — read
`web/js/screens/plan.js` and `dest.js` to establish what `archived: true` currently *does*. The
requirement is that a retired stop stays **viewable**, so:
- If `archived` hides the item → you need a distinct presentation, not a different flag. Render
  archived items in a labelled section rather than filtering them out.
- If `archived` merely restyles it → use it directly.

`web/js/data.js`'s plan-item shape includes `archived` too, so both clients know the field.

### 9.2 The three retired stops
Superseded by the tour agent on **4 September 2026**. Each day batch declares them in a
`removedFromDay` manifest with `reason`, `replacedBy`, `keepBecause` and
`importAs: "Removed from this Day"`.

| Retired stop | Day | Replaced by | Records |
|---|--:|---|--:|
| `Hotel Kameya, Naruko Onsen` | 2 | `Ooedo Onsen Monogatari Naruko Onsen Kounkaku` | 10 pl · 1 ms · 1 sh |
| `Okuiizaka Anabara Onsen Yoshikawaya` | 3 | `Mercure Miyagi Zao Resort & Spa` | 9 pl · 2 sh |
| `Ooedo Onsen Monogatari Premium Kinugawa Kanko Hotel` | 4 | `Kinugawa Onsen Hana no Yado Matsuya` | 8 pl · 2 ms · 1 sh |

**31 records carry `retired: true`.** Night 3 is the significant loss — it moved *prefecture*, from
Iizaka Onsen in Fukushima to Zao in Miyagi, so the whole Iizaka cluster is off-itinerary.

### 9.3 Required behaviour for retired stops
| Surface | Behaviour |
|---|---|
| **Itinerary display** | Present on their original day, **visibly struck through or clearly marked**, in a section labelled **"Removed from this Day"**. Never deleted. Never merged into the replacement hotel. |
| **Stop detail** | Opens normally. Show the `removedFromDay` manifest — `reason`, `replacedBy`, `keepBecause` — **at the top, before the summary**, so nobody is misled. Their 5-line summary already opens with a sentence saying the stop is off the itinerary. |
| **Search** | **Included**, but every result row must be marked retired so a searcher is not sent to a hotel the group is not staying at. |
| **Stop summaries** | All 3 have one. `retired: true` + `retiredReplacedBy` are set on the summary object. |
| **Navigation** | Reachable, not featured. Do not put them in "next stop" / "current day" flows. |
| **Counts** | **Exclude from active counts.** The trip has **30 active/main stops** (Ginza included per A6). Any "N stops" figure shown to a user must be **30**, not 33. Same for the day: Day 2 has 7 active stops plus 1 removed. |

Add `removedStops[]` to `TripDay` (§4.4) carrying `{stopName, reason, replacedBy, removedOn, keepBecause, recordIDs[]}`.

### 9.4 `Ginza` — a MAIN Day 7 stop (decision A6)

**Decision A6 settles this: import Ginza as a normal main-route stop, alongside Shisui. Do NOT build
a backup-stop mechanism.** The owner decides between them later by editing the plan.

| Surface | Behaviour |
|---|---|
| `kind` | **`main`** — not `backup` |
| Itinerary | **Day 7 holds five main stops:** Tokyo Tower · Tsukiji Outer Market · Shisui Premium Outlets · **Ginza** · International Resort Hotel Yurakujo |
| Counts | **Included in the 30 active/main stops.** |
| Removal later | The owner uses **existing plan editing** — `PlanItem.archived` and `movedToDay` already exist. Build nothing new. |
| Search | An ordinary stop |
| Summary | Present (`newStop: true`, in `summaries-d58.json`) |

**The `backupFor` block in `day7-ginza-backup.json` becomes descriptive metadata, not a mechanism.**
Keep it in the data — it holds the trade-off reasoning — but build no feature around it.

**One consequence to handle honestly.** Ginza's `13:45` and Shisui's `14:30` **overlap**, so the Day 7
timeline shows a schedule that cannot literally be run. That is **accepted and intentional** pending
the owner's edit — **but it must not read as a bug**:
- Give Ginza a visible chip such as **`ALTERNATIVE TO SHISUI`**. `PlanItem.chips: [String]` already
  exists in both clients, so this needs no schema change.
- Keep Ginza's `note` and five-line summary visible; they already carry the trade-off.
- **Do not silently re-time, reorder or hide either stop to tidy the timeline.**
- If `plan.js` raises an overlap "issue warning", that is acceptable and arguably correct.
  **Do not suppress it.**

**The research recommendation stays in the data as advice:** keep Shisui. The only designated Ginza
coach facility is 銀座六丁目バス乗降所 — 3 bays, 10:00–21:00, free but 完全予約制 via Times,
「利用時間を1回あたり15分とします」, **drop-off only**; the coach must then park at Times Harumi 4-chome
(~¥6,000 plus 24 min of dead running). Shisui has ~5,000 free spaces and the coach doubles as bag
store, shade and toilet base. Ginza is the better *place*; Shisui is the better *stop*.
**That is advice for the owner to act on in the app — not a decision for the importer.**

---

## 10. Multilingual Requirements — read this before promising anything

### 10.1 What the repository actually supports
**`APP_README.md`, features not yet implemented, verbatim:**
> *"Language support: Currently English-only; Chinese requires string catalogue"*

There is **no i18n layer, no string catalogue, and no language switcher** in either client.
`web/index.html` has no locale handling. **The app is English-only today.**

### 10.2 Correcting the brief
The task description said *"the research tested English, 中文 and 日本語"*. **It did not.** No
multilingual testing was performed at any point, and none was possible — there is nothing to test.
**A Chinese-language acceptance test cannot be part of this implementation** and must not be listed
as one. (§14 reflects this.)

### 10.3 What IS required, and it is narrow
| Item | Requirement |
|---|---|
| **`nameJp` on records** | **Required.** All 679 records carry a Japanese name. Add the field (§4.4). This is **data, not UI translation** — the Japanese name is the venue's real name and is often the only reliable way to find it, on a map or in the shop window. |
| **Japanese in `note` / summary text** | **Already present and must be preserved byte-for-byte.** Notes quote operators directly: 「土・日・祝祭日、特別な行事のある日は駐車不可」, 「最終入場16:00」, 和楽足湯(わらしゆ). Do not transliterate, strip or "clean" these. |
| **Search across languages** | Query matching must work on `nameJp` as raw substring. **No tokenizer, no romaji↔kana conversion, no IME assistance** — none was established, none is required. Japanese input is typed by the user's own IME. |
| **UI chrome translation** | **Out of scope.** Not established, not supported, do not build it. |

### 10.4 Explicit non-goals
- Do **not** add a language switcher.
- Do **not** add a string catalogue "while you're in there".
- Do **not** machine-translate any researched note. These are verified quotes from operators;
  translating them destroys their evidentiary value.
- If Chinese support is wanted later it is a separate project. `APP_README.md` already scopes it.

---

## 11. `APP_ROADMAP.md` changes

**`APP_ROADMAP.md` already exists in the research bundle and already contains both items.** It was
written and then updated during the research. **Preserve and update it — do not duplicate the items
or rewrite the file.**

Current state, verified:
- **P0 item 0 — `stopSummary`.** Already present, with the schema, the "render it first" UI note, the
  five-colour label note, and the honestly-empty-line rule.
- **P0 item 5 — full-text search.** Already present, with the Ishii case as the worked example and
  the `nameJp` searchability point.
- Also P0: `removedFromDay` (item 1), `backupFor` (item 2), record precedence (item 3), and a
  coordinate state for "confidently wrong, now fixed" (item 4).
- P1: ranked `top3` / `eat3` advice, `needsRide`, `snack` as its own purpose, negative knowledge as
  first-class data. P2: the extended closing-day checker. P3: the group-trip layer.

**What the implementation session should do to it:**
1. **Tick items as they land** — mark P0 items 0–5 done with the commit or PR that did each.
2. **Add a "Status" column or a dated note**; do not delete the rationale — it is why the items are
   ordered that way.
3. **Note the two new client drifts** found this session (`PlanItem.endTime` web-only,
   `PlanItem.isSubRouteSummary` Swift-only) alongside the two known bugs in §4.5.
4. **Do not renumber the items.** Other documents reference "P0 item 0" and "P0 item 5" by number.

`APP_ROADMAP.md` also carries a **"What NOT to build"** section: the source map's climbing gyms, gear
shops and running routes were **deliberately dropped** at the owner's request — not a sports person.
The single exception kept is **Ishii Sports**, as an ordinary shop record. **Do not reinstate any
sport layer.** If an activity layer is ever wanted, the roadmap specifies a user-selectable
`interests: ['climbing']` tag on places rather than a top-level collection.

---

## 12. Implementation Order

Ten phases. **Do not begin a phase until the previous one's acceptance criteria pass.**

### Phase 0 — Repository inspection (no code changes)
**Objective:** replace every `NEEDS VERIFICATION IN NEW SESSION` in this guide with a fact.
**Tasks:**
- `ls -R web/js` — confirm the 19 screen modules and the 7 support modules.
- Read `web/js/screens/dest.js` fully. Locate the exact insertion point after `.dest-desc`, before
  the tab nav.
- Read `web/js/screens/plan.js` fully. Confirm `archived` handling.
- Read `web/css/app.css` — find the existing colour tokens. **Do not introduce a second palette.**
- Read `web/js/store.js`, `nav.js`, `strip.js` — decide where search mounts (§6.3).
- Read `firebase/storage.rules` — confirm the size cap and content-type rule.
- `git log --oneline -20` — understand recent history before touching anything.
- Confirm there is no test runner: check for `package.json`, `*.test.js`, `Tests/`.
**Acceptance:** a written list of resolved unknowns and any that remain. **Report the remaining ones
rather than guessing.**

### Phase 1 — Schema preparation
**Objective:** make the models able to hold the research.
**Files:** `web/js/data.js` (required); `TravelPlanner.swiftpm/Sources/Models/Models.swift`
(**optional — decision A2 puts iOS out of scope this pass**).
**Tasks:** add the §4.4 additive fields to the **web** client; fix the two bugs in §4.5; decide the
two new drifts; **extend the `PREP_CATEGORIES` export to all six (decision A9 — note it has TWO homes, §3.4 drift 9;
the web `TRIP` object has no `prepCategories` field, so the export is the web home)**.
**In `data.js` change ONLY the schema-shaped constants — the six `PREP_CATEGORIES` and any new field
names. Never the 679 records (decision A4).** Keep every export name: 19 screens import them by name.
Swift edits, if made, are additive and **must not be required by any acceptance criterion.**
**Depends on:** Phase 0.
**Acceptance:** the **web** client declares `nameJp`, `timeWindow`, `confidence`, `coordPrecision`,
`source`, `retired*`, and `PlanItem.stopSummary` + the structured hours fields. `packedIn` is the
single prep key. `ShoppingItem` has `category` (§4.2c — **the shop enum, not `PlaceCategory`**).
`PREP_CATEGORIES` has six entries. No existing field renamed or removed; the demo trip still opens.

### Phase 2A — AUTH + UID VERIFICATION GATE (blocking, no writes)
*Phases 2A and 2B are both gates. Neither writes production data. Phase 2 is the first phase that
writes anything at all.*
**Objective:** establish, beyond doubt, where the trip must be written. **Decision A3 makes this a
hard gate: no Firestore write, no `set`, no batch, not even against a throwaway `tripId`, until all
four facts below are confirmed and recorded.**

**Why this is safety-critical.** `firebase/firestore.rules` scopes everything to
`request.auth.uid == userId`. The repo's two documents disagree on the auth method (§2.4), and an
anonymous uid is replaced on first sign-in. Getting this wrong writes 679 records where the owner
cannot see them and produces **no error** — the rules just return nothing.

**The four facts, all required:**
1. **The sign-in method actually in use** on the device the owner will read the trip on
   (anonymous · Google · email-link).
2. **The exact uid**, read from that signed-in session — not from a document, not from memory.
   For the web client: sign in, then read it in the console or from the app's own state.
3. **The Firebase project id.**
4. **The service-account key path** — outside the repo, and covered by `.gitignore`.

**Enforcement — build these into the importer itself, not just the process:**
- **Refuse to run** without an explicitly supplied `--uid` and `--project`. No default, no fallback,
  no auto-detection.
- **Print the uid, project and target `tripId`, and require explicit confirmation** before the first
  write.
- **Verify the uid is readable** — attempt a read under `users/{uid}` and report what came back.
- **Run against a throwaway `tripId` first** and print the read-back for review.
- **Refuse to touch the real `tripId`** until the throwaway run has been reviewed.

**Depends on:** Phase 0, and **the human**. This is the one phase that cannot be completed by
inspection.
**Acceptance:** all four facts recorded in writing; the importer demonstrably refuses to run without
them; a throwaway-`tripId` read-back reviewed and approved.
**If the human is unavailable: STOP HERE. Do not proceed to Phase 2. Do not guess. Do not import to
a uid you inferred.**

### Phase 2B — DRY RUN + BACKUP (still no production writes)
**Objective:** prove the importer is correct, and make the existing data recoverable, before touching
the real trip.
**Blocked by Phase 2A.**

**1. A true dry-run mode — writes nothing at all.**
The importer must support `--dry-run`, which performs the **entire** merge in memory and prints what
it *would* do, **without opening a write to Firestore**. It must report:
- per-collection counts it would write, split **insert vs update**;
- the ids it would **update in place** (expect **241**) and **insert** (expect **438**);
- every `anchorPlaceID` that would be left **dangling** (expect **0**);
- the four hotel stop-id migrations (§4.2b) it would perform;
- the 20 duplicate-pair merges (§7.10);
- any record whose `category` is not valid for its collection (§4.2c);
- anything it cannot map, by id.

**A throwaway `tripId` is NOT a dry run** — it still writes. Do the dry run first, read the report,
*then* the throwaway trip, *then* the real trip.

**2. Back up what already exists.**
`WEB_APP_GUIDE.md` states the project fits the **free Spark plan** (Storage aside). **Managed
Firestore export (`gcloud firestore export`) requires the Blaze plan and may not be available** —
`NEEDS VERIFICATION IN NEW SESSION`: check the project's billing plan before assuming it works.

If Blaze is unavailable, back up by **reading everything out to JSON with the Admin SDK** — a
read-only script over `users/{uid}/trips/{tripId}/` and all nine sub-collections, written to a
timestamped local file outside the repo. **This is required, not optional**, because Phase 2 mutates
existing documents: the `packedIn` migration, the `ShoppingItem.category` backfill, the 20 duplicate
merges and two stop-coordinate fixes all touch data that is already there.

**Acceptance:** a dry-run report reviewed against the §14 counts; a backup file existing outside the
repo with a verified non-zero record count for every collection that had one.
**Do not proceed to Phase 2 without both.**

### Phase 2 — Importer + trip data
**Objective:** the trip exists in Firestore, idempotently.
**Blocked by Phase 2A and Phase 2B. Do not begin until both have passed.**
**Files:** a new repeatable importer script in the repo (**not** a one-off paste, and **not**
`web/js/screens/paste.js`).
**Tasks:**
- Read `trip12_app_seed.json` + all 17 batches; merge in the order in §4.1 with **`topup-*` last**.
- Key everything by `id`; **research wins** on conflict. 241 ids update in place, 438 insert.
- Take the **last** `anchorStop` for the three records in §4.2.
- **Handle the four renamed/replaced hotel stops and re-anchor the 20 orphaned places — §4.2b.**
  Day 1 is a *rename* (migrate `d93da2ed9772` → `22aa574d12d6`, no retired stop). Days 2–4 keep the
  old stop as retired **and** add the new hotel under its new id. **Never recompute a stop id from a
  name** — take ids from the batch files.
- **Add Ginza as a fifth MAIN stop on Day 7 (decision A6)**, with an `ALTERNATIVE TO SHISUI` chip.
- **Keep the two `category` enums apart — §4.2c.** A place category on a shopping item makes the item
  vanish from the web shop filter, silently.
- **Write `startDate` as a Timestamp, not a string — §4.2d.**
- Resolve `subRoutes.anchorStop` → `anchorPlanItemID` (§4.7).
- Merge the 20 duplicate pairs from `seed_duplicates.json` (§7.10).
- Fix the two stop coordinates in `days[].items[]`: `21c5d54201ee`, `184f9cf0f25a`.
- Project `essentials` into `[EssentialRow]` **and** keep the structured object (§4.6).
- Write through every `x` block rather than dropping it.
- Use the **Admin SDK** with a service-account key kept outside the repo and in `.gitignore` — the
  rules scope to `request.auth.uid == userId`, so a client SDK signing in anonymously would mint a
  different uid.
- **Batched writes, `set` with merge, 500-op batch limit.** Running twice must update, never duplicate.
- Print a summary and verify by reading back: counts per collection, plus any record that failed.
**Depends on:** Phase 1 and **Phase 2A (the auth gate)**.
**Per decision A4: write to FIRESTORE. Do NOT put the 679 records into `web/js/data.js`** — §2.5
explains why `data.js` could not serve them anyway.
**Per decision A7: the importer reads its inputs from `research/trip12/`.**
**Acceptance:** `cd research/trip12 && python3 validate_research.py day*.json new-hotels.json expand-*.json topup-*.json summaries-*.json`
prints **`validating 19 file(s)`** and exits **0**. (Run from the repo root it matches nothing and
exits 0 on zero files — see §0.6.) Read-back counts: `places` 523, `mustSee` 60, `shopping` 96, `subRoutes` 17, `days` 8,
**30** active/main stops. Run the importer twice — the second run changes no counts.
**Run it against a throwaway `tripId` first.**

### Phase 3 — `stopSummary`
**Objective:** five lines on every stop, above the tabs.
**Files:** `web/js/screens/dest.js`, `web/css/app.css`, plus the Swift stop-detail view.
**Tasks:** import the 165 lines from `summaries-d14.json` + `summaries-d58.json` verbatim; render
after `.dest-desc` and before the tab nav; five visually distinct labels; the `<details>` correction
disclosure; honestly-empty lines rendered as their sentence.
**Depends on:** Phases 1–2.
**Acceptance:** all 33 stops show five non-empty lines. The 7 empty-by-design lines show their
sentence, not a blank. `correctedFromSeed` collapses and expands; total across stops = **196**.
Summary sits above the tabs on every stop.

### Phase 4 — Full-text search
**Objective:** 679 records findable.
**Files:** new `web/js/screens/search.js` **or** the shell, per §6.3; `web/css/app.css`; `app.js`
registration; possibly `store.js` for the index.
**Tasks:** build the in-memory index once; implement §6.2 exactly; wire selection through the
existing router.
**Depends on:** Phase 1 (`nameJp`) and Phase 2 (data).
**Acceptance:** §8.3 Ishii test passes. `こけし` 8, `蒲鉾` 5, `銀山` 6, `東照宮` 6, `足湯` 8. Two-char
minimum. Empty state renders. Escape clears. Retired results marked.

### Phase 5 — Corrections and cleanup
**Objective:** every §7 item is represented in the data.
**Tasks:** walk the §7 checklist item by item and confirm each in the imported data. Run the
Warashiyu grep (§7.5). Verify the two `days[].items[]` coordinate fixes landed.
**Acceptance:** every §7 box ticked with the record id or field that carries it.

### Phase 6 — Multilingual validation (narrow)
**Objective:** Japanese data survives intact.
**Tasks:** confirm `nameJp` populated on all 679; confirm Japanese inside `note` / summary text is
byte-identical to the source JSON; confirm search matches `nameJp`.
**Acceptance:** no mojibake anywhere; a diff of any note against its source JSON is empty.
**Non-goal:** UI translation (§10.4).

### Phase 7 — UI polish
**Objective:** it looks like part of the app.
**Tasks:** summary colours from the existing palette; responsive reflow; search on phone widths;
`prefers-reduced-motion` respected by the flash-highlight; keyboard focus visible.
**Acceptance:** no horizontal body scroll at 375 px; existing `.plan-*` / `.dest-*` / `.essential*`
styling unchanged.

### Phase 8 — Tests
**Objective:** leave the repo more verifiable than you found it.
**Reality:** **there is no test infrastructure.** No `package.json` test script, no test runner, no
`Tests/` target, and `.github/workflows/deploy-web.yml` runs no test step. `APP_README.md` says the
iOS code has never been compiled.
**Tasks:** do **not** stand up a whole framework unasked. Do add:
- a **data-integrity script** in the repo asserting the Phase 2 acceptance counts, the 165 lines, the
  196 corrections and the Warashiyu rule — runnable with plain `node` or `python3`;
- `validate_research.py` wired into that script;
- optionally, a step in `deploy-web.yml` that runs it before deploying.
**Acceptance:** one command re-verifies the import.
**Decision A8 settles the open question: do NOT add a test framework.** No Jest, Vitest, Playwright,
Swift test target or linter. `validate_research.py` plus the one integrity script is the whole
verification story, and it must assert the §14 data counts.

### Phase 9 — Build / deploy
**Objective:** it ships.
**Reality:** the web app has **no build step** — untranspiled ES modules served statically.
**Tasks:**
```bash
# local deploy
npm install -g firebase-tools
firebase login
cp .firebaserc.sample .firebaserc      # then set the project id
firebase deploy --only hosting,firestore:rules
# add ,storage only if Storage is enabled
```
GitHub Actions deploys on push to `main` when `web/`, `firebase.json` or the workflow changes; it
reads `projectId` from `web/js/config.js` and needs the `FIREBASE_SERVICE_ACCOUNT` secret.
**iOS is OUT OF SCOPE this pass (decision A2).** Do not attempt a first compile and do not spend
time on Swift build errors. It is a separate later pass.
**Acceptance:** hosting deploy succeeds; the web app boots past `#boot` and renders Day 1; the demo
trip still opens; Trip 12 appears in the trip list alongside it.

### Phase 10 — Final verification
Run §14 end to end. **Do not declare done because the app builds** (§15).

---

## 13. Exact prompt for the new Claude Code session

Copy everything between the markers into a fresh Claude Code session opened in the repository root.

```text
You are an IMPLEMENTATION session. The research is finished; your job is to build, not to research.

FIRST, read these three files in full before touching any code:
  TRIP_IMPLEMENTATION_GUIDE.md      <- your specification. Follow it.
  DECISIONS.md                      <- nine decisions ALREADY SETTLED by the owner. Do not
                                       re-litigate any of them. They are answers, not questions.
  APP_ROADMAP.md                    <- why the priorities are ordered this way.

THE SETTLED DECISIONS, in brief (DECISIONS.md has the reasoning):
  A1 The trip is PERMANENT. Nothing may hide or degrade it because its dates have passed.
  A2 WEB CLIENT ONLY this pass. iOS is a separate later pass. First-time iOS compilation is NOT
     an acceptance criterion - do not attempt it, do not debug Swift build errors.
  A3 The uid and auth method MUST be verified before any write. HARD GATE - Phase 2A.
  A4 Trip 12 COEXISTS with the demo trip. Firestore is the source of truth. The 679 records do
     NOT go into web/js/data.js - see guide section 2.5 for why they could not work there anyway.
  A5 The USER sets the currency rate in trip settings; every conversion computes from it. No
     hardcoded rate, no precomputed MYR values in the data.
  A6 BOTH Shisui and Ginza are main Day 7 stops. No backup mechanism. 30 active stops, not 29.
  A7 Commit the 19 research JSON files under research/trip12/. They are inputs, not artefacts.
  A8 NO new test framework. validate_research.py plus one data-integrity script.
  A9 All SIX prepCategories: Documents, Outfits, Carry-on, Electronics, Photo missions, Day bag.
     NOTE: these have TWO homes. On the web side they go in the PREP_CATEGORIES export, because
     web TRIP has no prepCategories field; Swift's Trip.prepCategories is the iOS equivalent and is
     out of scope. Setting only one of the two is a silent half-fix.

You are adding a fully researched trip — ViTrox Japan Tohoku Trip 12, 8-15 September 2026, 8 days,
~35 people on a guided coach tour — into this existing Travel Planner app (a web PWA in web/ and a
SwiftUI client in TravelPlanner.swiftpm/, both over one Firestore layout).

STEP ZERO, BEFORE PHASE 0. The repository does NOT contain a research/ directory yet - you must
create it. The JSON files named below ship in the handoff bundle, not in the repo as cloned:
  mkdir -p research/trip12
  cp <extracted-bundle>/research/trip12/* research/trip12/
  cp <extracted-bundle>/*.md .
  git add research/trip12 *.md && git commit -m "Add Trip 12 research bundle (decision A7)"
Then verify research/trip12/ holds 21 .json, 19 .md and 2 .py files. See guide section 0.6.

WORKING-DIRECTORY RULE - this one bites silently. Every validate_research.py command in the guide
uses bare filenames and MUST run from research/trip12/:
  cd research/trip12 && python3 validate_research.py \
    day*.json new-hotels.json expand-*.json topup-*.json summaries-*.json
It must print "validating 19 file(s)" and exit 0. Run from the repo root the globs match nothing and
it exits 0 having validated ZERO files - a FALSE PASS. If you do not see "19 file(s)", you are in the
wrong directory and have verified nothing.

The trip data already exists as JSON in this bundle. DO NOT regenerate, re-derive, re-research or
"improve" any of it:
  day1-haneda.json day2-matsushima.json day3-ginzan.json day4-aizu.json
  day5-nikko.json day6-hitachi.json day7-tokyo.json day7-ginza-backup.json day8-narita.json
  new-hotels.json expand-d12.json expand-d34.json expand-d56.json expand-d78.json
  topup-naruko.json topup-tsukuba-shinjuku.json topup-misc.json
  summaries-d14.json summaries-d58.json      <- the 165 stop-summary lines
  trip12_app_seed.json seed_duplicates.json validate_research.py
Provenance and reasoning live in notes.md, ITINERARY_CHANGE.md, IMAGES.md and notes*.md. Read them
when you need to know WHY a fact is what it is. Never contradict them.

START WITH PHASE 0 of the guide: inspect the repository and resolve every item the guide marks
"NEEDS VERIFICATION IN NEW SESSION". Read web/js/screens/dest.js, web/js/screens/plan.js,
web/js/data.js, web/css/app.css, web/js/store.js, web/js/nav.js and
TravelPlanner.swiftpm/Sources/Models/Models.swift before you plan anything.

DO NOT START CODING until you can state, in your own words:
  - where stopSummary must render in dest.js and why it goes above the tab navigation
  - which NINE fields differ between web/js/data.js and Models.swift, which 2 are known bugs that
    actively corrupt data, and why Trip.rateUpdatedAt / Trip.rateSource make decision A5 easier
  - why Trip.startDate must be written as an ISO STRING (the web client uses a string) and NOT as a
    Firestore Timestamp, even though Swift wants a Date
  - why import order puts topup-*.json last
  - why renaming four hotels creates four NEW content-hashed stop ids, and what happens to the
    20 places whose anchorPlaceID points at a superseded hotel (guide section 4.2b)
  - why Place.category and ShoppingItem.category are DIFFERENT enums that share only the value
    "food", and what breaks silently if you cross-wire them (guide section 4.2c)
  - why 679 records are searchable but only 30 stops are main
  - why Ishii Sports is anchored to Tsukiji but is not a Day 7 activity

Then execute the guide's phases IN ORDER. Do not start a phase until the previous phase's acceptance
criteria pass. Work incrementally and commit per phase with a message naming the phase.

Phase 0   Repository inspection            Phase 4   Full-text search (P0 item 5)
Phase 1   Schema preparation (web)         Phase 5   Corrections and cleanup
Phase 2A  AUTH + UID GATE  <-- BLOCKING    Phase 6   Multilingual validation (data only)
Phase 2B  DRY RUN + BACKUP <-- BLOCKING    Phase 7   UI polish
Phase 2   Importer + trip data             Phase 8   Data-integrity script
Phase 3   stopSummary  (P0 item 0)         Phase 9   Deploy (web only)
                                           Phase 10  Final verification (section 14)

Phases 2A and 2B are BOTH gates and NEITHER writes production data. Phase 2 is the first phase that
writes anything at all.

*** PHASE 2A IS A HARD GATE. ***
You may NOT write anything to Firestore - not a single set(), not a batch, not even against a
throwaway tripId - until you have, in writing, all four of:
  1. the sign-in method actually in use on the owner's device
  2. the exact uid, read from that signed-in session
  3. the Firebase project id
  4. the service-account key path, outside the repo and gitignored
The importer itself must REFUSE to run without an explicit --uid and --project: no default, no
fallback, no auto-detection. It must print uid/project/tripId and require confirmation, run against
a throwaway tripId first, and refuse the real tripId until that read-back has been reviewed.
If the owner is unavailable: STOP. Do Phases 0 and 1, then wait. Do not guess a uid. Getting this
wrong writes 679 records where the owner cannot see them, with NO error, because the rules simply
return nothing.

*** PHASE 2B IS ALSO A GATE. ***
Before the first production write you must ALSO have:
  1. A --dry-run of the importer that writes NOTHING and reports: 241 updates / 438 inserts,
     0 dangling anchorPlaceID, the 4 hotel stop-id migrations, the 20 duplicate merges, and any
     record it cannot map. A throwaway tripId is NOT a dry run - it still writes.
  2. A BACKUP of what already exists, outside the repo. Phase 2 mutates existing documents (the
     packedIn migration, the ShoppingItem.category backfill, 20 duplicate merges, 2 stop-coordinate
     fixes). Note: managed Firestore export needs the BLAZE plan and this project is documented as
     Spark - check the billing plan, and if it is Spark, read everything out to JSON with the Admin
     SDK instead.
Order is strict: dry run -> backup -> throwaway tripId -> review in the app -> real tripId.

HARD RULES
1. Preserve existing behaviour. Every export in web/js/data.js is imported by name by a screen -
   do not rename or remove any. Do not break the five-tab state machine in dest.js, the edit-mode
   time inputs in plan.js, the invite-link branch in app.js, or the sync-status chip.
2. Extend the existing data model additively. Both clients ignore unknown keys - that is what makes
   this safe. Do NOT build a parallel data model, and do not restructure Place, PlanItem, TripDay,
   SubRoute, ShoppingItem or MustSeeShot.
3. Do not invent data. If a fact is not in the JSON or the notes, it does not go in. No placeholder
   places, no guessed hours, no invented coordinates.
4. Do not treat search anchoring as an itinerary recommendation. A place anchored to a stop is
   indexed near it, not scheduled at it. Keep every note visible.
5. Never hide the corrections. correctedFromSeed must stay inspectable behind a "N corrections"
   disclosure. Do not silently rewrite a researched fact.
6. One search implementation only, routed through the existing nav.js. No second router.
7. Do not reinstate any sport layer (climbing gyms, gear shops, running routes). They were dropped
   deliberately. Ishii Sports stays, as an ordinary shop record.
8. Do not add UI translation or a language switcher. The app is English-only by design today;
   nameJp is DATA, not localisation.
9. Do not modify unrelated features, and do not "tidy" code you were not asked to touch.
10. There are no tests and no web build step in this repo. Do not fabricate passing tests, and do
    NOT stand up a test framework - decision A8 settles that. Use validate_research.py plus one
    lightweight data-integrity script.
11. Do NOT put trip content into web/js/data.js. store.js loads the backend snapshot first and only
    falls back to data.js when there is no snapshot AND the user is not signed in AND
    tripID === seed.TRIP_ID. Trip 12's id is vitrox-trip12-tohoku, so data.js could never serve it.
    Change data.js ONLY for the six PREP_CATEGORIES and new field names.
12. Never recompute a stop id from a stop name. Stop ids are content-hashed from (day, name), so a
    rename silently produces a different id. Take ids from the batch files.
13. Keep the two category enums apart. Place.category is food/cosme/cloth/shopping/sight/rest.
    ShoppingItem.category is food/clothing/souvenir/beauty/other. They share only "food".
14. iOS is out of scope. Do not attempt a first Swift compile and do not make it an acceptance
    criterion. Models.swift stays the authoritative schema REFERENCE, but it need not build.
15. Never let validate_research.py pass on zero files. It must print "validating 19 file(s)".
16. Write Trip.startDate as an ISO string, not a Timestamp - match the web client (rule above).
17. Do not write anything to Firestore before BOTH gates (2A auth, 2B dry-run + backup) have passed.

BEFORE WRITING TO FIREBASE: see the Phase 2A gate above. Use the Admin SDK - a client SDK signing in
anonymously mints a DIFFERENT uid and writes where the owner's device cannot see it. Run against a
throwaway tripId first and show the read-back counts before touching the real trip.

VERIFY as you go. After each phase, state the acceptance criteria from the guide and whether each
passed. The importer must be idempotent: run it twice and show that counts do not change.

REPORT BLOCKERS, DO NOT GUESS. If the repository contradicts the guide, or a required decision is
not yours to make (the currency rate, the target uid, whether Ginza replaces Shisui, whether to add
a test framework), STOP and ask. An unanswered question is a better outcome than an invented answer.

Finally: do not declare the task complete merely because the app builds and deploys. Work through
section 14's checklist item by item and report each result.
```

---

## 14. Validation / acceptance checklist

Corrected against what the repository can actually support. Items the repo cannot support are marked
**N/A** with the reason.

### Gate (Phase 2A) — verify before anything else
- [ ] Sign-in method in use on the owner's device is **recorded in writing**
- [ ] Target **uid** recorded, read from that signed-in session
- [ ] Firebase **project id** recorded
- [ ] Service-account **key path** outside the repo and gitignored
- [ ] Importer **refuses to run** without explicit `--uid` and `--project`
- [ ] Throwaway-`tripId` read-back reviewed and approved before the real trip

### Dry run and backup (Phase 2B) — before any production write
- [ ] `--dry-run` completed and its report reviewed: **241 updates / 438 inserts**, **0 dangling
      `anchorPlaceID`**, 4 hotel stop-id migrations, 20 duplicate merges, 0 unmappable records
- [ ] Billing plan checked — managed export needs Blaze; on Spark an Admin-SDK JSON read-out was used
- [ ] A **backup file exists outside the repo**, with a non-zero count for every collection that had one
- [ ] Throwaway-`tripId` import reviewed in the app **before** the real `tripId`

### Data
- [ ] `days` = **8**; **30 active/main** stops incl. Ginza (A6), 3 retired present (**33 with data**)
- [ ] `places` = **523**, `mustSee` = **60**, `shopping` = **96**, `subRoutes` = **17**
- [ ] Searchable total = **679**
- [ ] Zero duplicate ids in any collection
- [ ] The 20 `seed_duplicates.json` pairs merged; the 3 `coLocated` pairs both kept
- [ ] 241 seed ids updated in place; 438 inserted; nothing from the original seed deleted
- [ ] The 3 re-anchored records took their **last** `anchorStop`
- [ ] **Four hotel stops handled (§4.2b):** day 1 migrated `d93da2ed9772` → `22aa574d12d6` as a
      *rename* with no retired stop; days 2–4 have both the retired old stop and the new hotel under
      its new id (`def6a0a6a1c8`, `bf4e19fcd2f6`, `aae8b34364ff`)
- [ ] **Zero places with a dangling `anchorPlaceID`**; the 20 orphans re-anchored per the manifests
- [ ] **No stop id was recomputed from a name** at import time
- [ ] **Ginza is a `main` Day 7 stop** with an `ALTERNATIVE TO SHISUI` chip; Day 7 has 5 main stops
- [ ] **Every `shopping[].category` ∈ `SHOP_CATEGORIES`; every `places[].category` ∈ `PlaceCategory`**
      (§4.2c — no cross-wiring)
- [ ] `Trip.startDate` written as a **Timestamp**, not a string (§4.2d)
- [ ] `PREP_CATEGORIES` has **six** entries in the A9 order
- [ ] **The trip opens and renders fully with a past `startDate`** (decision A1)
- [ ] **The demo trip still opens**, and Trip 12 appears alongside it (decision A4)
- [ ] **No trip content in `web/js/data.js`** — grep it for any of the 679 record ids: zero hits
- [ ] **33 stop summaries** exist; **165 lines**; none empty; 7 honestly-empty lines render as prose
- [ ] **196 `correctedFromSeed` entries** total, all inspectable
- [ ] Structured `hours` on **33 / 33** stops; `null` days render as closed
- [ ] Importer run twice → identical counts
- [ ] Stop coords `21c5d54201ee` and `184f9cf0f25a` fixed in `days[].items[]`

### Search
- [ ] All **679** records indexed
- [ ] English: `Ishii` → 1 · `yuba` → 4 · `Warashiyu` → 2
- [ ] Japanese: `こけし` → 8 · `蒲鉾` → 5 · `銀山` → 6 · `東照宮` → 6 · `足湯` → 8
- [ ] Notes searched, not just names
- [ ] **Chinese search — N/A.** No Chinese data or i18n exists (§10). Do not test or claim it.
- [ ] Selecting a result → correct day, stop opened, row scrolled into view, flash-highlighted
- [ ] Two-character minimum; empty state message; Escape clears; retired results marked
- [ ] Under 100 ms per keystroke at 679 records

### Corrections (§7)
- [ ] Narita — omiyage is airside, every record says BEFORE/AFTER security
- [ ] Toshogu — Saturday coach ban, ~50 min on site not 75
- [ ] Hitachi — no nemophila; melon soft-serve at Kinen no Mori (opens 10:00), not West Gate
- [ ] Matsushima — 15:50 boarding call; Godaido ≈23 min not 30
- [ ] **Warashiyu grep**: every surviving "Waraku Ashiyu" is inside an explanation of why it is wrong
- [ ] Zao 80 usable minutes · Waseda Sajiki-yu closed 3–10 Sep · Shisui coordinate corrected
- [ ] Edo Wonderland deadline 960 not 990 · Tokyo Tower ¥1,080 cash-only

### UI
- [ ] **Currency rate is user-editable in trip settings and every conversion derives from it**
      (decision A5); no precomputed MYR values in the data; the rate is visible near converted figures
- [ ] Summary renders **above the tab navigation** on every stop
- [ ] Five categories visually distinguishable, using the existing palette
- [ ] Correction disclosure opens and closes
- [ ] Retired stops show their `removedFromDay` manifest before the summary
- [ ] Search usable at 375 px; no horizontal body scroll
- [ ] Existing screens still work: plan timeline, all five dest tabs, nearby add/remove, sub-route,
      shopping checkboxes, prep packing, log, share/join
- [ ] `prefers-reduced-motion` respected

### Build / test
- [ ] **Lint — N/A.** No linter configured. Do not add one unasked.
- [ ] **Unit / integration tests — N/A.** None exist. The Phase 8 data-integrity script stands in.
- [ ] Data-integrity script passes
- [ ] `validate_research.py` over all 19 JSON files exits **0**
- [ ] **Web production build — N/A.** No build step; static ES modules
- [ ] `firebase deploy --only hosting,firestore:rules` succeeds
- [ ] App boots past `#boot`, renders Day 1, **zero console errors**
- [ ] Hash routes and the `/j/CODE` invite path still resolve
- [ ] **iOS compilation — OUT OF SCOPE (decision A2).** Not an acceptance criterion this pass.
      Do not attempt it; do not report it as a failure.

---

## 15. What NOT to do

1. **Do not redo the research.** 19 JSON files and 20 notes documents are the output of a long
   verification effort. Re-deriving a fact risks reintroducing an error that was already killed.
2. **Do not invent place data.** No placeholder places, no guessed hours, no invented coordinates.
   Two coordinates in this dataset were once confidently wrong — one by 260 km, one by 2.4 km.
3. **Do not create duplicate place records.** 20 known duplicate pairs must be *merged*, not
   imported twice. Key by `id`, always.
4. **Do not replace the existing data structures.** They fit this content almost entirely. Add
   fields; do not restructure `Place`, `PlanItem`, `TripDay`, `SubRoute`, `ShoppingItem`,
   `MustSeeShot`.
5. **Do not remove existing itinerary information.** The 31 retired records and the 3 retired stops
   must stay viewable. That is an explicit requirement, not a nice-to-have.
6. **Do not treat search anchoring as an itinerary recommendation.** Ishii Sports is anchored to
   Tsukiji and is explicitly *not* a Day 7 activity. 679 records are indexed by proximity; that is an
   index, not a schedule.
7. **Do not hide the corrections.** `correctedFromSeed` stays inspectable. It is how a wrong fact
   gets caught next time.
8. **Do not silently rewrite a researched fact.** If you think a line is wrong, record it and report
   it. Do not edit the prose.
9. **Do not introduce a second search implementation** or a second router. Route through `nav.js`.
10. **Do not modify unrelated features.** `paste.js` in particular: leave it alone.
11. **Do not add a language switcher or translate researched notes.** They are verified operator
    quotes; translation destroys their evidentiary value.
12. **Do not reinstate the sport layers.** Deliberately dropped.
13. **Do not fabricate test results.** There is no test infrastructure. Say so.
14. **Do not consider the task complete because the app builds.** It building proves nothing about
    679 records, 165 summary lines or 196 corrections.
15. **Do not commit the service-account key.** Keep it outside the repo and in `.gitignore`.
16. **Do not write to the real trip before a throwaway `tripId` has been reviewed.**
17. **Do not write ANYTHING to Firestore before the Phase 2A gate passes.** Not a probe, not a test
    document, not a throwaway trip. The uid must be confirmed first (decision A3).
18. **Do not put the 679 records into `web/js/data.js`.** It is the demo seed, not the source of
    truth, and it could not serve Trip 12 anyway (§2.5, decision A4).
19. **Do not recompute a stop id from a stop name.** Ids are content-hashed from `(day, name)`;
    a rename silently mints a new id and orphans everything pointing at the old one (§4.2b).
20. **Do not cross-wire the two `category` enums** (§4.2c). They share only `food`, so the mistake
    is silent and costs items from the shop filter.
21. **Do not attempt a first iOS compile** or treat it as a failure (decision A2).
22. **Do not hardcode a currency rate** or precompute MYR figures into the data (decision A5).
23. **Do not build a backup-stop mechanism for Ginza.** It is a main stop (decision A6).
24. **Do not re-litigate `DECISIONS.md`.** Those nine are settled.

---

## 16. Final handoff

### 16.1 Files expected to change
| Path | Change |
|---|---|
| `web/js/data.js` | **Only** the six `PREP_CATEGORIES` (A9) and new field names. **Never the 679 records** (A4, §2.5) |
| `web/js/screens/trip.js` | Expose the user-editable currency rate (A5) — `NEEDS VERIFICATION IN NEW SESSION`: confirm this is the settings screen |
| `web/js/screens/spend.js` + the shopping screen | Derive every converted figure from the stored rate (A5) |
| `TravelPlanner.swiftpm/Sources/Models/Models.swift` | **Optional this pass (A2).** Additive fields; `location` → `packedIn`; `ShoppingItem.category`. Not required to build. |
| `web/js/screens/dest.js` | `stopSummary` block above the tab nav; retired-stop manifest |
| `web/css/app.css` | Summary block, five label colours, search UI, flash-highlight |
| `web/js/app.js` | Register the search screen (if §6.3 option (a)) |
| `web/js/screens/plan.js` | Optional summary teaser; retired-stop presentation |
| `web/js/store.js` | Search index, if it belongs in shared state |
| `APP_ROADMAP.md` | Tick P0 items 0–5; add the two new drifts. **Do not renumber.** |
| `.github/workflows/deploy-web.yml` | Optionally run the data-integrity script before deploy |
| `.gitignore` | Ensure the service-account key path is covered |

### 16.2 Files expected to be added
- The importer script (repeatable, Admin SDK, idempotent, batched).
- `web/js/screens/search.js` — if §6.3 option (a).
- The Phase 8 data-integrity script.
- **`research/trip12/` — the 19 research JSON files plus `validate_research.py` and the notes.
  SETTLED by decision A7.** ~600 KB. They are **inputs, not build artefacts** — do not `.gitignore`
  them. The importer and the integrity script both read from here.

### 16.3 Data migrations
1. **`prep.location` → `prep.packedIn`** across existing documents. One-way; write both briefly if
   clients deploy at different times.
2. **`shopping.category`** backfilled on any existing item lacking it — default `souvenir`.
3. **Duplicate merge** per `seed_duplicates.json` — 20 pairs.
4. **Two stop coordinates** in `days[].items[]`.
None of these are destructive if done with `set` + merge — **but all four mutate documents that
already exist.** The backup in **Phase 2B is mandatory**, and note that managed Firestore export
needs the Blaze plan; on Spark, read everything out to JSON with the Admin SDK instead.

### 16.4 Tests to add / update
No framework exists. Add the Phase 8 data-integrity script asserting: collection counts; 165 summary
lines across 33 stops; 196 corrections; zero duplicate ids; the Warashiyu rule; `validate_research.py`
exit 0. Wire it into `deploy-web.yml` only after it passes locally.

### 16.5 Build / deployment commands
```bash
# validate the research bundle — MUST be run from research/trip12/ (see 0.6)
cd research/trip12
python3 validate_research.py day*.json new-hotels.json expand-*.json topup-*.json summaries-*.json
# must print "validating 19 file(s)" and exit 0
cd ../..

# 1. DRY RUN — writes nothing (Phase 2B)
node scripts/import-trip12.js --project <id> --uid <uid> --key <path> --dry-run
# 2. BACKUP — read-only export to JSON outside the repo (Phase 2B)
node scripts/backup-trip.js  --project <id> --uid <uid> --key <path> --out ../trip-backup.json
# 3. THROWAWAY trip — first real writes, then review in the app
node scripts/import-trip12.js --project <id> --uid <uid> --key <path> --trip throwaway-t12
# 4. THE REAL TRIP — only after the throwaway read-back is approved
node scripts/import-trip12.js --project <id> --uid <uid> --key <path> --trip vitrox-trip12-tohoku

# deploy web
cp .firebaserc.sample .firebaserc     # set the project id
firebase deploy --only hosting,firestore:rules

# iOS
open TravelPlanner.swiftpm
```
Command names in the importer line are **suggested, not existing** — you are creating that script.

### 16.6 Final manual QA
1. Open the trip. Confirm **30** active/main stops across 8 days, five of them on Day 7.
2. Day 3 → confirm `Mercure Miyagi Zao Resort & Spa` is night 3 and
   `Okuiizaka Anabara Onsen Yoshikawaya` appears under "Removed from this Day", struck through, with
   its reason.
3. Open Ginzan Onsen Street. **Five summary lines above the tabs.** Expand "9 corrections".
4. Info tab → weekday hours grid; Wednesday marked closed for Izunohana.
5. Search `Ishii` → 1 result → select → lands on Day 7, Tsukiji open, row highlighted. Read the note
   and confirm it reads as "not a Day 7 activity".
6. Search `こけし` → 8 results, all reachable.
7. Day 7 → both `Shisui Premium Outlets` and `Ginza` present, Ginza marked backup.
8. Day 5 → Toshogu summary states the Saturday parking ban and ~50 minutes.
9. Day 6 → Hitachi says green kochia, **no nemophila**; melon soft-serve at Kinen no Mori, opens 10:00.
10. Day 8 → Narita omiyage is **airside**.
11. Phone width 375 px — summary reflows to one column, no horizontal scroll.
12. Console clean.

### 16.7 Known uncertainties
| # | Uncertainty | Owner |
|---|---|---|
| 1 | **Target uid and sign-in method — STILL OPEN and BLOCKING.** A3 makes it a hard gate (Phase 2A), but the facts must come from the owner. | Human, **before any write** |
| 2 | ~~Currency rate~~ — **SETTLED by A5**: user-editable in settings, conversions computed from it. | ✅ |
| 3 | ~~Ginza vs Shisui~~ — **SETTLED by A6**: both main on Day 7; the owner edits the plan later. | ✅ |
| 4 | **`archived` semantics** — does it hide or restyle? | Phase 0 |
| 5 | **Where search mounts** — new screen vs shell. | Phase 0 |
| 6 | ~~Commit the research JSON?~~ — **SETTLED by A7**: yes, under `research/trip12/`. | ✅ |
| 7 | ~~Test framework?~~ — **SETTLED by A8**: none; validator + one integrity script. | ✅ |
| 8 | ~~iOS first compile~~ — **SETTLED by A2**: out of scope this pass. | ✅ |
| 9 | **Zero images.** The Storage path has nothing to upload yet (§7.12). | Separate task |
| 10 | ~~`PREP_CATEGORIES` 4 vs 6~~ — **SETTLED by A9**: all six. | ✅ |
| 13 | **Does the trip list partition upcoming vs past?** A1 requires a past-dated trip to open fully. | Phase 0 |
| 14 | **Does a currency-rate input already exist** in the settings screen? A5 needs one. | Phase 0 |
| 11 | **`PlanItem.endTime` / `isSubRouteSummary`** drifts — align which way? | Phase 1 |
| 12 | **`EssentialRow` projection** — exact row order and labels for structured hours. | Phase 0/2 |

### 16.8 Definition of DONE
All of the following, simultaneously:
1. `validate_research.py` over all 19 JSON files exits **0**.
2. Firestore read-back: `places` 523, `mustSee` 60, `shopping` 96, `subRoutes` 17, `days` 8,
   **30 active/main stops**, 3 retired present.
3. The importer is **idempotent** — proven by running it twice with identical counts.
4. **33 stops × 5 summary lines = 165**, rendering above the tab navigation, with the 196 corrections
   inspectable.
5. Search finds all **679** records; the **Ishii test** and all five Japanese tests pass.
6. Every box in §7 ticked, with the record id or field that carries it named.
7. Retired stops viewable, marked, excluded from active counts; Ginza present as a backup.
8. No existing screen or route regressed; zero console errors.
9. The Phase 8 data-integrity script passes and is in the repo.
10. `APP_ROADMAP.md` updated, items not renumbered.
11. Every remaining uncertainty in §16.7 either resolved or **explicitly reported unresolved**.
12. **The Phase 2A gate was passed before any write**, with all four facts recorded.
13. **Decisions A1–A9 all honoured**, and none re-litigated.
14. **`web/js/data.js` contains no Trip 12 record data**, and the demo trip still opens.

**It building and deploying is necessary and nowhere near sufficient. iOS compiling is not part of
this pass at all.**
