# DECISIONS.md — settled by the trip owner, 4 September 2026

**These are answers, not questions.** The implementation session must treat every decision here as
final and must **not** re-litigate them. Where a decision changes a number or a behaviour,
`TRIP_IMPLEMENTATION_GUIDE.md` has been updated to match — this file is the record of *why*.

| # | Decision | Status |
|---|---|---|
| A1 | The trip must be permanently available — no deadline-driven scope cut | **SETTLED** |
| A2 | Web client first; iOS is a separate later pass | **SETTLED** |
| A3 | UID and auth method must be verified before any write — hard gate | **SETTLED as a gate** |
| A4 | Trip 12 coexists with the demo; Firestore is the source of truth | **SETTLED** |
| A5 | The user sets the currency rate in settings; conversions compute from it | **SETTLED** |
| A6 | Both Shisui and Ginza are main Day 7 stops; the user edits the plan later | **SETTLED** |
| A7 | Commit the 19 research JSON files under `research/trip12/` | **SETTLED** |
| A8 | No new test framework — `validate_research.py` plus light integrity checks | **SETTLED** |
| A9 | All six `prepCategories` | **SETTLED** |

---

## A1 — The trip must always be alive

**Decision:** the trip is a permanent record. There is no "ship before departure" deadline and no
reduced scope. It must be fully usable **before, during and after** 8–15 September 2026.

**Implementation consequences — these are requirements, not notes:**
- **Nothing may gate on the trip being in the future.** No screen may hide, disable, collapse or
  degrade the trip because `startDate` has passed. If any current logic keys off
  `departsInDays`, a countdown, or "upcoming vs past", the trip must remain fully open when that
  value goes negative or zero.
- **Retired stops, corrections and provenance stay forever.** They are part of the record.
- **`Trip.departsInDays` must not be relied on for visibility.** Compute it for display only.
- **No expiring content.** Do not build anything that assumes the trip is current.

`NEEDS VERIFICATION IN NEW SESSION` — check whether `web/js/screens/trips.js` or `trip.js`
partitions trips into upcoming/past, and whether anything filters on `startDate`. If it does, the
trip must still open and render completely.

---

## A2 — Web first; iOS is a separate pass

**Decision:** target `web/` only. iOS is a later, separate piece of work.

**Consequences:**
- **First-time iOS compilation is NOT an acceptance criterion.** Removed from §14.
- `TravelPlanner.swiftpm/Sources/Models/Models.swift` remains the **authoritative schema reference**
  — it is the most complete written contract — but it is **not required to build** in this pass.
- Swift model edits are **optional and additive** in this pass. If made, they must not be required
  for any acceptance criterion. See C4 for the type-coercion work that iOS will need *later*.
- Do not spend time debugging Swift build errors. `APP_README.md` says the iOS code has never been
  compiled and to expect errors — that is a known, accepted, out-of-scope condition.

---

## A3 — UID and authentication: a hard gate before any write

**Decision:** do **not** guess, infer or hardcode the uid or the sign-in method. **This is
safety-critical.** The implementation session is **explicitly forbidden from importing** until both
are confirmed.

**Why it is safety-critical.** `firebase/firestore.rules` scopes everything to
`request.auth.uid == userId`. The two repository documents disagree: `APP_README.md` (iOS) says
Anonymous Authentication; `WEB_APP_GUIDE.md` (web) says Google sign-in and email-link, with anonymous
only *until the user signs in once*. **An anonymous uid is replaced when the user signs in.** Import
to the wrong one and the trip is written where the owner's device cannot see it — silently, with no
error, because the rules simply return nothing.

**The gate — all four must be satisfied and recorded before a single write:**
1. The **sign-in method actually in use** on the device the owner will read the trip on.
2. The **exact uid**, obtained from that signed-in session — not from a document, not from memory.
3. The **Firebase project id**.
4. The **service-account key path**, outside the repo and covered by `.gitignore`.

**Enforcement, to be built into the importer itself:**
- The importer **must refuse to run** without an explicitly supplied `--uid` and `--project`. No
  default, no fallback, no "detect it".
- It must **print the uid, project and target `tripId` and require confirmation** before writing.
- It must run against a **throwaway `tripId` first**, and the read-back must be reviewed.
- It must **verify the uid exists** and, where possible, that a document is readable under it.
- If any of the four is missing: **stop and ask.** Do not proceed. Do not improvise.

---

## A4 — Trip 12 coexists with the demo; Firestore is the source of truth

**Decision:** Trip 12 lives in **Firestore**. The demo trip stays exactly as it is.
**Do not put trip content into `web/js/data.js`.**

**Why this matters — the architecture already decides it.** `web/js/store.js`:
```js
let snapshot = await backend.loadAll();
if (!snapshot || !snapshot.trip) {
  if (signedIn()) { return openNothing(); }
  snapshot = tripID === seed.TRIP_ID ? freshSnapshot() : emptySnapshot(tripID);
}
```
The backend snapshot wins when present. `data.js` seeds **only** when there is no snapshot, the user
is **not** signed in, and `tripID === seed.TRIP_ID`. Trip 12's id is `vitrox-trip12-tohoku`, which is
**not** `seed.TRIP_ID` — so `data.js` would never serve it anyway.

**Consequences:**
- `web/js/data.js` is edited **only** for schema-shaped constants — the new additive field names, and
  the six `PREP_CATEGORIES` (A9). **Never for the 679 records.**
- Every export in `data.js` keeps its name. Nineteen screens import them by name.
- The demo trip must still open and work after this change.
- Trip 12 must appear in the trip list alongside the demo.

---

## A5 — The user sets the currency rate; conversions compute from it

**Decision:** do not hardcode a rate. Expose it in trip settings as a user-editable value and
calculate all conversions from whatever the user has set.

**This resolves the conflict** between the seed's `33.7 ¥/RM` and the ViTrox app's `100 JPY =
2.5458 MYR` (≈39.3) by removing the need to choose.

**Consequences:**
- `Trip.homeCurrencyRate: Double` **already exists** in both clients. This is exposing and using an
  existing field, not adding one.
- Seed it with the researched value and let the user change it. Store the value the user set.
- Every displayed home-currency figure must derive from the current stored rate at render time —
  no precomputed MYR values anywhere in the data.
- `APP_README.md` lists live conversion as not implemented; this decision does **not** ask for a live
  feed, only a user-set rate.
- Suggest showing the rate next to converted figures, so a stale rate is visible rather than silent.

`NEEDS VERIFICATION IN NEW SESSION` — locate the settings screen (likely `web/js/screens/trip.js`)
and every place a converted figure is displayed (likely `web/js/screens/spend.js` and the shopping
screen). Confirm whether a rate input already exists before adding one.

---

## A6 — Both Shisui and Ginza are main stops on Day 7

**Decision:** import **both** as normal main-route stops on Day 7. The user will decide later by
editing the plan. Do **not** build a special backup mechanism for this.

**This changes the counts. The guide has been updated:**

| | Was | **Now** |
|---|--:|--:|
| Active / main stops | 29 | **30** |
| Backup stops | 1 | **0** |
| Retired stops | 3 | 3 |
| **Stops with data** | 33 | **33** |

**Consequences:**
- Ginza is `kind: 'main'`, **not** `kind: 'backup'`. The `backupFor` block in
  `day7-ginza-backup.json` becomes **descriptive metadata**, not a UI mechanism. Keep it in the data
  — it holds the trade-off reasoning — but do not build a backup-stop feature.
- **Day 7 has five main stops:** Tokyo Tower · Tsukiji Outer Market · Shisui Premium Outlets ·
  Ginza · International Resort Hotel Yurakujo.
- **The user removes one later using the existing plan editing** — `archived` and `movedToDay`
  already exist on `PlanItem`. No new mechanism.
- **One honest consequence to handle:** Ginza's 13:45 and Shisui's 14:30 **overlap**, so the Day 7
  timeline will show a schedule that cannot literally be run. That is accepted and intentional
  pending the user's edit — **but it must not read as a mistake.** Give Ginza a visible chip such as
  `ALTERNATIVE TO SHISUI` (`PlanItem.chips` already exists) and keep its note and summary visible,
  which already carry the coach-parking trade-off. Do not silently reorder or re-time either stop to
  hide the overlap.
- The research recommendation remains **keep Shisui** (a 45-seat coach cannot stay in Ginza:
  15 minutes, drop-off only, pre-booked, then park at Harumi). That recommendation stays in the data
  as advice. **It is the owner's decision to make in the app, not the importer's.**

---

## A7 — Commit the research JSON under `research/trip12/`

**Decision:** commit all 19 JSON files plus the validator to `research/trip12/` so the import and its
validation are reproducible.

**Consequences:**
- Path: `research/trip12/`. Roughly 600 KB.
- Include: the 9 day batches, `new-hotels.json`, the 4 `expand-*`, the 3 `topup-*`, the 2
  `summaries-*`, `trip12_app_seed.json`, `seed_duplicates.json`, `validate_research.py`.
- Also commit the notes and provenance documents alongside them — they are why the facts are what
  they are.
- The importer reads from this directory. The integrity script (A8) runs the validator against it.
- **These files are inputs, not build artefacts. Do not add them to `.gitignore`.**

---

## A8 — No new test framework

**Decision:** do not introduce a test framework. Use `validate_research.py` plus lightweight
data-integrity checks.

**Consequences:**
- **`validate_research.py` must exit 0** over all 19 files. This is a real acceptance gate.
- Add one **data-integrity script**, runnable with plain `node` or `python3`, asserting: the
  collection counts, 30 active / 3 retired / 33 with data, 165 summary lines across 33 stops, 196
  corrections, zero duplicate ids, and the Warashiyu rule.
- Optionally wire it into `.github/workflows/deploy-web.yml` **before** the deploy step, once it
  passes locally.
- **Do not** add Jest, Vitest, Playwright, a Swift test target, or a linter.
- **Do not fabricate test results.** If something is unverified, say so.

---

## A9 — All six prep categories

**Decision:** `['Documents', 'Outfits', 'Carry-on', 'Electronics', 'Photo missions', 'Day bag']`

**Consequences:**
- `web/js/data.js`'s `PREP_CATEGORIES` currently has **four** and must be extended to these six, in
  this order.
- `Trip.prepCategories` carries the same six.
- 85 prep lines are already categorised against them — with four categories, two categories' worth
  of items would silently misgroup or vanish from the Prep screen.
- The two additions exist because this is a company trip with assigned photo/video missions and a
  daily coach day-bag, neither of which fits the four generic categories.

---

## Still open — NOT decided here

These remain for the implementation session to verify (they are lookups, not judgement calls) or for
the owner to answer when reached:

1. **The uid, auth method, project id and key path** — A3's gate. **Blocking.**
2. `archived` semantics — does it hide or restyle? Blocks the retired-stop rendering.
3. Where the search box mounts — new screen vs shell.
4. Whether a rate input already exists in the settings screen (A5).
5. Whether the trip list partitions upcoming vs past (A1).
6. `EssentialRow` projection order and labels.
7. `web/css/app.css` colour tokens for the five summary labels.
8. `web/js/screens/` exact file list.
9. `firebase/storage.rules` caps — moot while there are zero images.
