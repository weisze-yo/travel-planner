# UI/UX Design Coverage — Travel Planner

**Date:** 4 Sep 2026 (verified 14:15 UTC; visual baseline extended by the P0-6 verification sprint, 15:0x UTC — see `verification-sprint-p0-6.md`)
**Baseline:** `weisze-yo/travel-planner` @ `main`, tree **`1d3df5956fb8`** — re-verified against the live repository for this pass.
**⚠ The existing design documents are one commit stale.** They describe tree `4698f0e4a8b8`; `main` has moved. Six source files changed, one new module landed, and **three statements in the existing docs are now wrong**. See §0.2 before trusting any earlier claim.
**Purpose:** answer one question — *have we intentionally designed and confirmed the UI and UX for every important feature, screen, state and interaction in the existing application?*
**Not** a redesign. Nothing in `web/**` was changed. No new artboards were drawn for this pass.

**Read with:** `existing-ui-audit.md` (behaviour + values) · `existing-ui-visual-reference.md` (the design language) · `new-feature-design.md` (three areas already designed, unconfirmed) · `multilingual-warning-strip-design.md` (one area already designed, unconfirmed) · `screens/current/*.png` (20 frames, 390 × 844).

**Source-of-truth order:** the running app → `web/js/**` + `web/css/app.css` → the captured frames → the prose in these docs.

---

## 0. Headline

| | Count |
|---|---|
| Meaningful screens/flows inventoried | **69** (19 routes + 6 global chrome surfaces, decomposed into flows) |
| Behaviour **observed running** (UNDERSTOOD or PARTIAL) | **48** of 69 |
| Behaviour **read in source only**, never observed | **21** of 69 |
| **UX confirmed by you** | **0** |
| **Visual design confirmed by you** | **0** |
| Rows with a *captured visual baseline* (not the same as confirmed) | **41** of 69 |
| Rows with **no verified appearance at all** | **28** of 69 |
| Rows already **designed and awaiting sign-off** (the four design sessions) | **9** |
| Rows carrying a **DESIGN DECISION REQUIRED** flag | **37** (40 distinct decisions: 7 P0 · 22 P1 · 11 P2) |

### 0.1 How these are counted

One row = one screen or flow. Every figure above is a count of §2 matrix rows, and the two visual figures partition them: **41 captured + 28 not verified = 69**. "Decision required" is *not* a third slice of that axis — a row can have a captured frame and still need a decision (Map home, the shopping footer, the note editor), which is why the 32 overlaps both columns.

Three rows are new in this pass — trip-currency derivation, the location-lookup failure states, cross-tab sync — all newly landed behaviour that no design document covers.

Two caveats the counts hide: Spend and Prep are captured **above the fold only**, and Trip delete is captured **at rest only**, not mid-gesture. Both are counted as captured.

The two numbers that matter: **understanding is nearly complete, confirmation is at zero.** Nothing in this product has ever been explicitly signed off — the audit established what the app *does*, not what it *should* do. Per your instruction, existing code is not treated as confirmation.

---

## 0.2 Baseline drift — verified against `main` @ `1d3df5956fb8`

Checked file-by-file against the local read-only copy (tree `4698f0e4a8b8`). **`app.css`, `index.html`, `sw.js` and 18 of the 20 screen modules are byte-identical** — the design language has not moved. What did:

| File | Δ | What it is |
|---|---|---|
| `web/js/currency.js` | **new**, 3,935 B | Keyless ISO 3166-1 → ISO 4217 country/currency table + symbol map |
| `web/js/store.js` | +4,536 B | A new trip's currency is now **derived from the city typed into "City or area"**, via the reverse-geocoded country (`store.js` ~736). Three new failure notices |
| `web/js/net.js` | +143 B | Returns `countryCode` from the Nominatim result |
| `web/js/screens/trip.js` | +158 B | The "City or area" field takes a **rust warning hint** (`trip.locationNotice`) |
| `web/js/persist.js` | +3,703 B | Storage/sharing work |
| `web/js/sync.js` | +1,478 B | `reload()` — re-reads the outbox ledger on demand |
| `web/js/app.js` | +313 B | A `storage` event listener: **another tab writing the ledger now refreshes this tab's sync dot and strip** |
| `web/js/share.js` | +491 B | Sharing internals |
| `web/js/screens/map.js` | −58 B | Trim, no visible change found |
| `web/icons/` | **+3 files** | `icon-192`, `icon-512`, `icon-maskable-512` — **Android install icons** |
| `firebase.emulators.json`, `test/` | **new** | Auth + Firestore emulator config and `firebase-tools` |

### Three statements in the existing docs are now wrong

1. **"Trip settings … close/delete trip"** (audit §3 row 12, §4, and the visual reference's screen list). **There is no close-trip and no delete-trip on Trip settings.** The last card is `START THIS TRIP FRESH` → `Empty this trip…`, which expands to an **inline rust confirm** ("This cannot be undone." / `Yes, empty the trip` / `Cancel`) and calls `clearTripContent()`. Deleting a trip happens only by swiping it on My trips. The audit's P1 framing of "the two most destructive actions in the app are unseen" was based on a feature that does not exist.
2. **"`manifest.webmanifest` is referenced but absent → is Android install even in scope?"** Still absent — but three Android/maskable icons have now been committed. Android install is evidently **intended and half-done**, which turns an open question into a straightforward gap.
3. **"Blocked on a second account / a real device"** (audit §17.5, visual reference §6). An **emulator harness now exists** (`firebase.emulators.json` with auth on 9099 and Firestore on 8080, `singleProjectMode`, plus `firebase-tools` in `test/`). The share → join → review round trip, the `published/{code}` rules and the local→account migration are **no longer blocked** — they are simply unexercised.

### Newly landed behaviour that no design document covers

- **Currency now comes from the city.** Type "Kyoto" into a new trip and the trip prices in ¥/JPY. Nothing in the UI says this happened, and nothing offers to confirm it.
- **Three new failure notices**, all written to `trip.locationNotice` at creation time:
  - `Offline, so "X" could not be located — fix it from Trip settings once you have a signal.`
  - `Could not find "X" — the map centre and currency are not set. Fix it from Trip settings.`
  - `Could not look up "X" — the map centre and currency are not set. Fix it from Trip settings.`
  **All three are only visible on Trip settings**, as a rust hint under one field. The mistake is made in the New trip modal, and the app immediately pushes the user to Paste an itinerary — so the notice sits on a screen they have no reason to open. Three copy strings that tell the user to go somewhere else are the app's only account of a silent failure that affects every money figure in the trip.
- **Cross-tab sync.** Two tabs of the app now agree about what is queued. Never designed, never drawn.
- **A second confirm-button destructive action.** `Empty this trip` joins `discardPending()` in using an inline confirm with an explicit "cannot be undone", against the app's stated single destructive pattern (swipe → in-row confirm → 6s undo). Two exceptions is no longer an exception.

**Verification limit:** the deployed app at `travel-planner-3e0d3.web.app` was reached and its boot document matches `web/index.html`, which is byte-identical between the two trees — so the deployed build is treated as `main`. The 20 captured frames still match their source files (18 of 20 screen modules unchanged; `map.js`'s trim produced no visible difference, `trip.js`'s change is below the captured fold).

---

## 1. Status vocabulary

**Existing UI understood?**

| Value | Means |
|---|---|
| `UNDERSTOOD` | Behaviour read in source **and** observed running |
| `PARTIAL` | Some states observed, others only read |
| `SOURCE-ONLY` | Read in source, never observed — needs a second account, a real drag, or a real sync failure |

**UX confirmed? / Visual design confirmed?**

| Value | Means |
|---|---|
| `NOT CONFIRMED` | Understood, never explicitly confirmed by you |
| `DESIGNED — AWAITING SIGN-OFF` | A design session produced a treatment; you have not approved it |
| `DECISION REQUIRED` | There is a real question here; see §3 |
| `CAPTURED` | A 390 × 844 frame of the current appearance exists |
| `NOT VERIFIED` | No frame, no observation — appearance unknown |
| `LEGACY` | Implementation-only; exists but looks accidental |
| `OUT OF SCOPE` | Deliberately excluded |

---

## 2. Design coverage matrix

### A. Trips & account

| Area | Screen/Flow | States that exist or should | UI understood? | UX confirmed? | Visual confirmed? | Needs decision? | Pri |
|---|---|---|---|---|---|---|---|
| Trips | My trips — populated | running-trip cover card · coming-up group · `FINISHED` group · stat chips · footer hint · `Opening…` busy line | UNDERSTOOD | NOT CONFIRMED | CAPTURED (01) | No | — |
| Trips | My trips — empty | first-use signed-out · first-use signed-in (different copy) | UNDERSTOOD | DESIGNED — AWAITING SIGN-OFF (`new-feature-design` 1A) | NOT VERIFIED | **Yes** — approve tier-1 full-page treatment | P0 |
| Trips | New trip → paste hand-off | blocking scrim + bottom modal · validation (name required, silent) · `Creating…` · auto-jump to Paste | UNDERSTOOD | NOT CONFIRMED | CAPTURED (03) | **Yes** — is the forced jump to Paste right? | P1 |
| Trips | Account row + sign-in | signed out · signed in · sign-in sheet · `CHECK YOUR MAIL` · email round-trip return · `Signing out…` | PARTIAL | NOT CONFIRMED | CAPTURED (01, 02) | **Yes** — the email return path is unrendered | P1 |
| Trips | Trip cover picker | photos-from-log · tints · "open this trip first" refusal · `Shrinking it…` · photo-failed | SOURCE-ONLY | NOT CONFIRMED | NOT VERIFIED | No | P2 |
| Trips | Delete a trip | swipe → latch → in-row confirm → 6s undo · `Deleting…` | UNDERSTOOD | NOT CONFIRMED | CAPTURED (partial, 01) | No | — |
| Trips | Removed from a shared trip | `.gone-card` · "keep my side as its own trip" | SOURCE-ONLY | DECISION REQUIRED | NOT VERIFIED | **Yes** — when does this fire, and what survives? | P1 |

### B. Global chrome

| Area | Screen/Flow | States | UI understood? | UX confirmed? | Visual confirmed? | Needs decision? | Pri |
|---|---|---|---|---|---|---|---|
| Chrome | Boot | bone cover + `MC` mark · `.boot-error` rust card | PARTIAL | NOT CONFIRMED | CAPTURED (cover only) | No | P2 |
| Chrome | Tab bar | present inside a trip · **absent** on trips/join/stuck/share · borrowed parent tab on push screens | UNDERSTOOD | NOT CONFIRMED | CAPTURED | No | — |
| Chrome | Warning strip (one slot, four sources) | empty (most of the day) · loop reminder (+ estimated fine print, dismiss) · queued · stuck (red) · outside-kept-area | SOURCE-ONLY | DECISION REQUIRED | NOT VERIFIED | **Yes** — the ranking, and "said once" dismissal | P1 |
| Chrome | Undo bar | one app-wide ink bar, 6s, any deletion | SOURCE-ONLY | NOT CONFIRMED | NOT VERIFIED | No | P1 |
| Chrome | Cross-tab sync | a `storage` listener refreshes this tab's dot and strip when another tab writes the ledger | SOURCE-ONLY | NOT CONFIRMED | NOT VERIFIED | No | P2 |
| Chrome | Trip chip + sync dot | saving (ring) · saved (jade) · queued (amber) · stuck (red) · local-only (grey) | PARTIAL | DECISION REQUIRED | CAPTURED (rest state) | **Yes** — five states in a 6px dot, no label | P1 |

### C. Map & the day

| Area | Screen/Flow | States | UI understood? | UX confirmed? | Visual confirmed? | Needs decision? | Pri |
|---|---|---|---|---|---|---|---|
| Map | Map home | tiles loaded · **no tiles (grey `#E9EAE6`)** · pin focus · `.stranded` banner · legend | UNDERSTOOD | DECISION REQUIRED | CAPTURED (04, 05) | **Yes** — offline map and failed map look identical | P1 |
| Map | Day switching | day pills w/ weather glyph · past/current/future day · empty day | UNDERSTOOD | NOT CONFIRMED | CAPTURED | No | — |
| Map | Map sheet | 3 detents (30/50/82%) remembered per session · stop rows · `No stops yet` · Nearby | UNDERSTOOD | NOT CONFIRMED | CAPTURED (04) | No | — |

### D. Planning (Plan)

| Area | Screen/Flow | States | UI understood? | UX confirmed? | Visual confirmed? | Needs decision? | Pri |
|---|---|---|---|---|---|---|---|
| Plan | Plan — read | timeline · derived end/duration · weather banner · `n things to look at` | UNDERSTOOD | NOT CONFIRMED | CAPTURED (06) | No | — |
| Plan | Plan — edit mode | pencil turns jade in place · times become inputs · badges become rust `✕` · grips appear | UNDERSTOOD | NOT CONFIRMED | CAPTURED (07) | No | — |
| Plan | Plan — empty day | weather still shown · `emptyDay()` copy · two implied actions | UNDERSTOOD | DESIGNED — AWAITING SIGN-OFF (1B) | CAPTURED (08) | **Yes** — approve the tier-1 in-screen block | P0 |
| Plan | Plan — empty day, **joined trip** | same day, someone else's copy | SOURCE-ONLY | DESIGNED — AWAITING SIGN-OFF (1F) | NOT VERIFIED | **Yes** — approve the tier-3 jade card / no-ink rule | P0 |
| Plan | Add a stop | inline add in edit mode · guessed values | PARTIAL | NOT CONFIRMED | NOT VERIFIED | No | P1 |
| Plan | Edit a stop | inline time/name commit on `change`, not keystroke | UNDERSTOOD | DECISION REQUIRED | CAPTURED (07) | **Yes** — commit-on-blur is invisible; no save affordance | P1 |
| Plan | Delete a stop | swipe → latch 88px → in-row confirm → undo | UNDERSTOOD | NOT CONFIRMED | NOT VERIFIED (mid-gesture) | No | P1 |
| Plan | Reorder stops | grip drag · `.dragging` / `.drop-into` | SOURCE-ONLY | NOT CONFIRMED | NOT VERIFIED | No | P1 |
| Plan | Move a stop to another day | picker · consequence for the day it leaves | SOURCE-ONLY | DECISION REQUIRED | NOT VERIFIED | **Yes** — what does the vacated slot do? | P1 |
| Plan | Warnings on a row | `OUT OF ORDER` · `OVERLAPS` · named fix (first ink, alternatives ghost) | PARTIAL | DESIGNED — AWAITING SIGN-OFF (`multilingual-warning-strip`) | NOT VERIFIED (live) | **Yes** — approve structure D + Latin-first stack | P0 |
| Plan | Free-time lanes → new sub route | lane stub · `+` · lane sheet · no-positioned-stops fallback copy | PARTIAL | DECISION REQUIRED | NOT VERIFIED | **Yes** — can a loop exist on a day with no stops? | P1 |
| Plan | Archive card | dark `.dark-card`, collapsed archived stops | SOURCE-ONLY | NOT CONFIRMED | NOT VERIFIED | No | P2 |

### E. Sub routes

| Area | Screen/Flow | States | UI understood? | UX confirmed? | Visual confirmed? | Needs decision? | Pri |
|---|---|---|---|---|---|---|---|
| Sub | Sub route — arrange | translucent header · amber pins + ink slack pin · three stat tiles (`YOU HAVE` / `TRAVELLING` / `TO SPEND`) · **`.loop-row` list still below the default detent** | PARTIAL | DECISION REQUIRED | CAPTURED (v11, partial) | **Yes** — `ok`/`tight` variants were not triggered; the row list needs a real drag | P1 |
| Sub | Sub route — edit / back-by | reorder · drop a stop · back-by form · switch loop | SOURCE-ONLY | DECISION REQUIRED | NOT VERIFIED | **Yes** — what does missing the back-by time do? | P1 |

### F. Places

| Area | Screen/Flow | States | UI understood? | UX confirmed? | Visual confirmed? | Needs decision? | Pri |
|---|---|---|---|---|---|---|---|
| Dest | Destination — Info | hatched hero · maps buttons · underline tabs w/ counts · `NEED TO KNOW` filled · **`NEED TO KNOW` empty** | UNDERSTOOD | NOT CONFIRMED | CAPTURED (09) | No | — |
| Dest | Destination — other four tabs | Nearby / Must-see / Shop / Notes — each with its own empty state | SOURCE-ONLY | DESIGNED (empties only, 1E) | NOT VERIFIED | **Yes** — four unseen tab bodies behind a seen tab row | P1 |
| Dest | Destination — stop gone | "This stop is no longer on your plan." — a bare `.empty`, no way back | SOURCE-ONLY | DECISION REQUIRED | NOT VERIFIED | **Yes** — a dead end with no action | P1 |
| Dest | Facts editor / shot editor / item editor | scrim + bottom modal + `.form`, three variants | PARTIAL | NOT CONFIRMED | NOT VERIFIED | No | P1 |
| Nearby | Nearby — populated | grouped-by-stop (day scope) · single-anchor scope · category chips · sort menu | UNDERSTOOD | NOT CONFIRMED | CAPTURED (10) | No | — |
| Nearby | Nearby — three empty variants | nothing around the day · nothing around this stop · nothing in this category | SOURCE-ONLY | DESIGNED — AWAITING SIGN-OFF (tier 2) | NOT VERIFIED | No | P1 |
| Nearby | Add a place | found · **saved without a location** (drops off map + route) · dock naming the loop | SOURCE-ONLY | DECISION REQUIRED | NOT VERIFIED | **Yes** — a place that silently cannot be routed | P1 |

### G. Lists & money

| Area | Screen/Flow | States | UI understood? | UX confirmed? | Visual confirmed? | Needs decision? | Pri |
|---|---|---|---|---|---|---|---|
| Shop | Shopping list | populated · empty · day/place filters · ticked + paid input · footer spend card | UNDERSTOOD | DESIGNED (empty only, 1D) | CAPTURED (11) | **Yes** — approve "remove the footer, don't zero it" | P1 |
| Shop | Add / correct an item | add form · `itemEditor` modal · swipe-delete | PARTIAL | NOT CONFIRMED | NOT VERIFIED | No | P2 |
| Money | Currency from the city | derived from the reverse-geocoded country at trip creation · derived-and-silent · not-derived · manual override on Trip settings | SOURCE-ONLY | DECISION REQUIRED | NOT VERIFIED | **Yes** — a guess that sets every money figure, never shown as a guess | **P0** |
| Spend | Spend report | ink hero · day bars + tap-to-filter · category stack · accuracy tracks · purchase list · two empties | PARTIAL | NOT CONFIRMED | CAPTURED (12, above fold) | No | P1 |
| Prep | Trip prep | progress · what-to-wear · what-I-am-bringing · packing rows w/ where-chips · category filter | PARTIAL | NOT CONFIRMED | CAPTURED (13, above fold) | No | P1 |

### H. Log & notes

| Area | Screen/Flow | States | UI understood? | UX confirmed? | Visual confirmed? | Needs decision? | Pri |
|---|---|---|---|---|---|---|---|
| Log | Log — populated | day cards · amber in-progress day · place head rows · photo strips · footer chips · `.recap` | UNDERSTOOD | NOT CONFIRMED | CAPTURED (14) | No | — |
| Log | Log — empty | its own full-screen variant (no day cards at all) | SOURCE-ONLY | DESIGNED — AWAITING SIGN-OFF (1C, proposes showing the day scaffold) | NOT VERIFIED | **Yes** — scaffold-anyway vs today's bare sentence | P1 |
| Log | Log on a shared trip | the "never shared" promise line, naming the other travellers | SOURCE-ONLY | NOT CONFIRMED | NOT VERIFIED | No | P1 |
| Note | Note editor | new · edit existing · place picker · time · photo attach · **photo failed** · inline-storage notice · delete | PARTIAL | NOT CONFIRMED | CAPTURED (15, new only) | **Yes** — no explicit save state; `Save` is always live | P1 |

### I. Sharing, joining, receiving

| Area | Screen/Flow | States | UI understood? | UX confirmed? | Visual confirmed? | Needs decision? | Pri |
|---|---|---|---|---|---|---|---|
| Share | Share — before a link exists | role radios · expiry chips · jade explainer | UNDERSTOOD | NOT CONFIRMED | CAPTURED (17) | No | — |
| Share | Share — after (manage) | offer phase · linked ("What they get" 3 bullets + `Nothing to send`) · people list w/ `OWNER` badge · per-person role chip · CJK initial | UNDERSTOOD | DECISION REQUIRED | CAPTURED (v01–v03) | **Yes** — the role model is **enforced in the store and unrepresented in the UI**: a `read` user gets an enabled `Send n changes` that silently no-ops | **P0** |
| Share | Send an update | `Send n changes` (jade) · `Nothing to send` (ghost, disabled) · **no sent state** · no `canPublish()` check on the button | UNDERSTOOD | DECISION REQUIRED | CAPTURED (v02) | **Yes** — what does the sender see after sending, and does a `read` role see the button at all? | **P0** |
| Share | The link itself | live · switched off · expired · opened-n-times · revoke | SOURCE-ONLY | NOT CONFIRMED | NOT VERIFIED | No | P1 |
| Join | Join — live invite | from-line · big name · preview card of **the selected day, not Day 1** · **four** promises · sticky foot (still below fold) | UNDERSTOOD | DECISION REQUIRED | CAPTURED (v10) | **Yes** — which day the preview shows (D-4); + 3 recorded layout defects | P1 |
| Join | Join — sign-in phase | shared `signInPanel()` · local-trips migration copy | PARTIAL | NOT CONFIRMED | CAPTURED (02, panel only) | No | P1 |
| Join | Join — already joined | "Open this trip", deliberately not an error | SOURCE-ONLY | NOT CONFIRMED | NOT VERIFIED | No | P1 |
| Join | Join — dead link | expired · switched off · missing · **offline** · + "the other endings" cards | PARTIAL | NOT CONFIRMED | CAPTURED (20, expired) | No | — |
| Plan | Receiving an update | `.moved` banner on Plan · ink `See what changed` + **ghost `Later`** (undocumented) | UNDERSTOOD | DECISION REQUIRED | CAPTURED (v04) | **Yes** — is one banner on one screen enough, and what does `Later` do (D-1)? | P1 |
| Review | Review an update | entries as `.sides` (**every value wraps at 390px**) · rename adopts **their** title · added-row asymmetry · bulk actions ~2 screens below fold · **receipt is ephemeral, decisions have no undo** · CJK held up | UNDERSTOOD | DESIGNED — AWAITING SIGN-OFF (3A/3B/3C) | CAPTURED (v05–v09) | **Yes** — approve the redesign; decide conflict, undo + receipt (D-2), rename framing (D-5) | **P0** |

### J. Import

| Area | Screen/Flow | States | UI understood? | UX confirmed? | Visual confirmed? | Needs decision? | Pri |
|---|---|---|---|---|---|---|---|
| Paste | Paste — input | intro · mono textarea · Example / Clear / word count · `WHAT IT LOOKS FOR` (incl. `第三天`, `下午3:00`) · nothing-pasted error | UNDERSTOOD | NOT CONFIRMED | CAPTURED (19) | No | — |
| Paste | Paste — review rows | day groups + `FROM THE TEXT` badge · rows naming each guess in amber · **up to ten controls in one row** (`Keep 1h`/`Set the end time`/`No end time` + `MOVE TO` D1–D6 + `and the rest below it`) · tick-every-row gate | UNDERSTOOD | DECISION REQUIRED | CAPTURED (v13) | **Yes** — the gate is far heavier than documented (D-6) | **P0** |
| Paste | Ready to save → done | `nothing written yet` summary · `TWO THINGS IT DID NOT DO` (unlocated stops) · `Adding them to the trip…` · result | SOURCE-ONLY | DECISION REQUIRED | NOT VERIFIED | **Yes** — what does "done" look like, and where does it land? | P1 |
| Paste | Trip file import (JSON) | `Reading x…` · ok · rejected with reason · `Making x…` → new trip | SOURCE-ONLY | NOT CONFIRMED | NOT VERIFIED | No | P2 |

### K. Offline & sync

| Area | Screen/Flow | States | UI understood? | UX confirmed? | Visual confirmed? | Needs decision? | Pri |
|---|---|---|---|---|---|---|---|
| Offline | Map kept on this phone | empty · populated cards · **amber uncovered caveat** · storage line · swipe-remove · refresh | UNDERSTOOD | NOT CONFIRMED | CAPTURED (18) | No | — |
| Offline | Draw an area | dimmed shades · white box + 4 grips · `.area-note` · size + MB estimate. **Note card overlaps its own top-left grip; attribution sits inside the shade** | UNDERSTOOD | NOT CONFIRMED | CAPTURED (v14) | No — 2 P2 defects recorded | P2 |
| Offline | Tile download | progress bar · bytes/tiles counter · `Stop` · failed-with-reason · wait-for-wifi | SOURCE-ONLY | NOT CONFIRMED | NOT VERIFIED | No | P1 |
| Sync | Changes on this phone | **jade nothing-waiting captured** (incl. `Save a copy`/`Share`); header can read "0 waiting · oldest 1 Sept" — self-contradictory. Rust `.stuck-why` **structurally unverifiable on the local backend** | PARTIAL | DECISION REQUIRED | CAPTURED (v15, jade only) | **Yes** — `discardPending()` is irreversible and breaks the app's one destructive pattern | P1 |

### L. Trip settings

| Area | Screen/Flow | States | UI understood? | UX confirmed? | Visual confirmed? | Needs decision? | Pri |
|---|---|---|---|---|---|---|---|
| Settings | Trip settings — above the fold | `THE TRIP` form · `Saving…` notice · MONEY (symbol/codes/rate source) · weather source | UNDERSTOOD | NOT CONFIRMED | CAPTURED (16) | No | — |
| Settings | Trip settings — below the fold | FORECAST · offline block · paste · **export JSON** · share · `START THIS TRIP FRESH` w/ counts | SOURCE-ONLY | NOT CONFIRMED | NOT VERIFIED | No — corrected: there is no close/delete trip here | P1 |
| Settings | Empty this trip | `Empty this trip…` → inline rust confirm → `clearTripContent()`, **irreversible**, no undo | SOURCE-ONLY | DECISION REQUIRED | NOT VERIFIED | **Yes** — second confirm-button destructive action | P1 |
| Settings | Location lookup failed | three `locationNotice` strings (offline / not found / lookup failed), shown **only** as a rust hint on Trip settings | SOURCE-ONLY | DECISION REQUIRED | NOT VERIFIED | **Yes** — failure is invisible where it is caused | **P0** |
| Settings | No trip open | fallback render | SOURCE-ONLY | NOT CONFIRMED | NOT VERIFIED | No | P2 |

### Cross-cutting states (not screens, but they must be designed once)

| Concern | Where it appears | Status | Needs decision? | Pri |
|---|---|---|---|---|
| **Pending / loading** | `busy` string in trips, paste, area, join; `notice = 'Saving…'` in trip settings; real progress bar only in Draw-an-area | LEGACY — an amber text line at the top of a scroller, often far from the control pressed | **Yes** — one pattern, or leave as-is | **P0** |
| **Long content & CJK** | plan-card titles, day headers, sub-route names, trip names, `areaSpan`, note text, Review values | Designed for **warnings only**; unaddressed everywhere else | **Yes** — scope the Latin-first stack to names or to `body` | P1 |
| **Shared / read-only** | nowhere — roles govern publishing, not permission; no screen renders a read-only state | DECISION REQUIRED | **Yes** — does a joined copy have any visible identity? | **P0** |
| **Permission / access** | Firestore rules only (`published/{code}`: get-by-code, list denied) | OUT OF SCOPE for UI, but the *failure* of a rule has no screen | **Yes** — what does a refused read look like? | P1 |
| **Focus / keyboard** | inputs only; no visible focus on any button, pill, tab or swipe row | LEGACY | No — accept or schedule | P2 |
| **Reduced motion** | honoured for swipe + sync ring; ignored for sheet settle, pin focus, boot fade | LEGACY | No | P2 |
| **Responsive** | one mobile layout, 520px cap, one cosmetic breakpoint at 560px | OUT OF SCOPE (confirmed intent) | No | — |
| **Dark mode** | `color-scheme: light`, no `prefers-color-scheme` rule | OUT OF SCOPE | No | — |

---

## 3. Design gaps, grouped

### A. UX decisions

1. **Roles have no consequence.** `share.js` says a role is "about publishing, not permission" — yet the Share screen offers "Can send updates" vs "Receives updates" as if it were access control, and no screen anywhere renders differently for a joined copy. Does a joined trip get a visible identity?
2. **What the sender sees after Send an update.** There is a jade `Send n changes` button and no sent state, no delivery indication, no "3 people have it".
3. **Conflict.** `review.js` cannot distinguish "you changed this too" from "you never touched it", so "keep mine" sometimes silently discards work and sometimes costs nothing.
4. **Settled rows disappear.** A decided Review entry is removed from the list, which contradicts "undo, not confirm".
5. **The vacated slot** when a stop moves to another day: does the day close up, or keep the gap as free time?
6. **A place saved without a location** silently drops out of the map and the walking route, explained once in a notice that then goes away.
7. **A stop that no longer exists** shows a bare sentence with no way back.
8. **Discarding stuck changes** is irreversible and uses a confirm button — the only destructive action in the app that is not swipe → in-row → undo.
9. **The forced jump to Paste** after creating a trip: there is no "I'll do this later" that isn't the back gesture.
10. **A refused read** (expired envelope, revoked link, rules denial) mid-session has no screen; only the cold-open join path has dead-link states.
11. **The currency guess is invisible.** A new trip's currency is inferred from the city; the trip then prices everything in it, and nothing ever says so or offers to confirm it.
12. **The location-lookup failure is reported on the wrong screen.** It happens in the New trip modal and is told only to Trip settings — which the app does not send the user to.
13. **[v] A `read` role sees an enabled `Send n changes` button that silently does nothing** — `publishUpdate()` returns null without `canPublish()`, and the button has no such check. A non-owner's role-chip change is likewise discarded. See `verification-sprint-p0-6.md` §4.
14. **[v] Review decisions cannot be undone and leave no receipt** (D-2) — `takeChange`/`keepMine` write immediately with no undo bar, and the "n changes dealt with" line is module-level state reset on navigation.
15. **[v] `Later` on the update banner is undocumented** (D-1).
16. **[v] The join preview shows the selected day, not Day 1** (D-4).
17. **[v] A renamed stop's Review card is titled with *their* name** (D-5), framing the change as settled before you decide.
18. **[v] The paste review row carries up to ten controls** (D-6), eight rows deep, behind a tick-every-row gate.
19. **[v] The "What they get" card appears only after a link exists** (D-3) — the clearest statement of the copy model is hidden from the person deciding whether to share.
20. **Two destructive actions now use a confirm button** (`Empty this trip`, `discardPending`) against the app's single stated pattern. Are these deliberate exceptions for the irreversible cases, or should they be brought into the swipe/undo pattern?

### B. Visual decisions

11. **Five sync states in one 6px dot**, no label, in a 44px chip.
12. **Offline map and failed map are the same grey canvas** (`#E9EAE6`); only the Map screen carries the `.stranded` banner.
13. **Long content and CJK** beyond warnings — the four-line plan card, the wrapped day header, the sub-route name in a 150px column.
14. **Twenty-two rows have no verified appearance**, concentrated in exactly the flows a second person triggers.
15. **`.review-foot` exists in `app.css` and is unused** — Review's bulk actions currently sit at the end of the scroll, below five cards.

### C. Interaction decisions

16. **Commit-on-`change`** for inline plan edits (a consequence of the whole-node repaint) — no save affordance, no dirty state.
17. **The mid-gesture swipe states** (latch at 88px, in-row confirm, decisive-swipe shortcut) have never been captured, only read.
18. **Drag-reorder** and **grip-resize on the draw-area box** are entirely unverified.
19. **The warning strip slot** arbitrates four sources by rank, shows one at a time, and dismisses "said once, back only if the walk gets 10 minutes longer". Never reviewed.
20. **Sheet detents remembered per session** — helpful or disorienting on return?

### D. Content / copy decisions

21. **Sign-off on the tier-3 sentences** — the only place the product names another person ("Day 4 is empty in the copy you were sent").
22. **Relation-word vocabulary** for warnings (`WITH`, `AFTER` today) — fixed set, or per-issue?
23. **Role labels** on Share, which currently read as permissions.
24. **Empty-state copy across twelve places**, proposed as three tiers, unapproved.
25. **The `Nothing to send` disabled label** — accurate, and slightly accusatory.

---

## 4. Existing inconsistencies — classified (audit §12)

Per Step 8: only the meaningful ones are carried forward.

| # | Inconsistency | Verdict |
|---|---|---|
| 1 | Duplicate rule blocks in `app.css` (cascade order decides the winner) | **Accidental but harmless** — until someone edits the losing block |
| 2 | Font weights 550/650 used, not loaded | **Accidental but harmless** — synthesised; visually stable |
| 3 | Half-pixel type scale, ~20 body sizes | **Intentional** in effect — the density *is* the design language |
| 4 | Four label families + ~10 one-off chips | **Intentional** — the visual reference argues each family has a distinct job. Do not merge |
| 5 | 14 radii for "a card" | **Accidental but harmless** |
| 6 | Six-plus control heights | **Accidental but harmless** |
| 7 | Danger colour hardcoded beside its token | **Accidental but harmless** |
| 8 | ~20 recurring un-tokenised colours | **Accidental but harmless** |
| 9 | Two "amber paper" recipes | **Intentional** — `#FBF1DE` banner vs `#FFFDF7` paper are different objects |
| 10 | Focus only on inputs | **UX-impacting** — accessibility. Schedule, don't fix in passing |
| 11 | Partial `prefers-reduced-motion` | **UX-impacting**, low blast radius |
| 12 | Two dividers for one job | **Accidental but harmless** |
| 13 | One deliberate `!important` | **Intentional** |
| 14 | `manifest.webmanifest` referenced, absent | **UX-impacting, and now clearly unfinished** — three Android/maskable icons have been committed, so install is intended. Write the manifest |
| 15 | Inline `style=` overrides in screen modules | **Accidental but harmless** — a symptom of #6, not a problem itself |
| 16 | Malformed attributes on the Plan sub-route row | **Accidental but harmless** to users; breaks DOM tooling. Record, fix when that file is next opened |

Nothing here is being standardised. This is not a CSS cleanup.

---

## 5. Visual verification against the current build

The 20 frames in `docs/design/screens/current/` were re-captured on 4 Sep 2026 against tree `4698f0e4a8b8` and match the current source. No drift was found in this pass; the documentation is current baseline.

Still unrendered, and why:

| Surface | Blocked on |
|---|---|
**Verified 4 Sep 2026 by the P0-6 sprint** (16 frames, `docs/design/screens/verify/`): Share offer · Share linked · Share manage · Plan update banner · Review entries ×3 · Review bulk actions · Review after deciding · Join live invite · Sub route (partial) · Paste input · Paste review pass · Draw an area · Changes on this phone (jade only) · Trips home on the local backend.

Still unrendered, and why:

| Currency-from-city + its 3 failure notices | Nothing — never designed at all |
| Trip settings below the fold, `Empty this trip` confirm | Nothing — just unrendered |
| Rust `.stuck-why` waiting state | **Structurally needs a configured-but-unreachable Firestore** — `sync.track()` queues nothing on the local backend |
| Real Firestore writes, rules enforcement, Google popup, emailed-link return, true two-device propagation | A running emulator (needs a shell process) |
| Sub route `.loop-row` list, edge markers, back-by form | A real drag — `draggableSheet` overrides programmatic detents |
| Tile download progress, Paste `Ready to save`/`done`, sticky feet on Join and Share | Below the fold; a real scroll or a taller capture |
| Review — entries | An actual received update |
| Send-an-update result | Two accounts |
| Sub route | A day with a loop and a real drag |
| Paste — review pass | A pasted itinerary driven through to the row editor |
| Draw an area + tile download | A real capture at real sizes |
| Changes on this phone | A real sync failure with a non-empty outbox |
| Mid-gesture swipe, drag-reorder | Frame-accurate gesture capture |

All of these are renderable from fabricated state without touching application code. **And as of this pass the sharing round trip is no longer even blocked on a second account** — `firebase.emulators.json` provides auth and Firestore emulators, so join, review and the `published/{code}` rules can be exercised locally. That is the cheapest next unit of work, and it is *verification*, not design.

---

## 6. Prioritised unresolved design decisions

Full write-ups (where · current behaviour · why uncertain · why it matters · recommended direction · what must be decided) are in the chat report accompanying this document and summarised here.

**P0 — blocks understanding of the product or affects major workflows**

| # | Decision |
|---|---|
| P0-1 | Sign off (or amend) the three designed areas: the three-tier empty-state system, the warning-strip subject line, and the Review redesign — plus the 8 open questions in `new-feature-design.md` §7 |
| P0-2 | Does a joined copy have a visible identity anywhere outside Share and the Log's promise line? |
| P0-3 | Is conflict detection in scope for Review, or is silent take/keep acceptable? |
| P0-4 | One pattern for pending work, or keep the amber `busy` line |
| P0-5 | Establish the appearance of the share → join → review round trip (verification, not redesign) |
| P0-6 | The paste review pass — the highest-risk unrendered flow |
| P0-7 | **New.** The city → currency inference and its three failure notices: does the user ever see the guess, and where is the failure reported? |

**P1 — important inconsistency or missing state**

Destination's four unseen tab bodies · sub route (`ok`/`tight`, back-by) · the warning-strip slot and its dismissal · Nearby's unlocated place · the stop-no-longer-on-your-plan dead end · stuck-changes discard · Trip settings below the fold (close/delete trip) · the sync dot's five states · offline-vs-failed map · long content & CJK breadth · the vacated slot on a day move · commit-on-blur editing · the Log empty state (scaffold vs sentence) · the shopping footer card · sign-in email return · removed-from-a-shared-trip.

**P2 — minor refinement**

Focus rings · partial reduced motion · radius/height/type normalisation · the missing manifest · the malformed sub-route attributes · duplicate CSS blocks · trip cover picker · trip-file import · archive card · boot error.

---

## 7. Recommended order

1. **Answer P0-1 through P0-4** (four decisions, no drawing). They change what the already-drawn artboards mean.
2. **Answer P0-7** (currency inference) — it is the newest behaviour, it touches every money figure, and it has no design at all.
3. **Verification sprint (P0-5, P0-6):** render the 10 unseen surfaces from fabricated state (or the emulator harness), 390 × 844, no redesign. This closes the largest part of the 42-row appearance gap and turns `SOURCE-ONLY` into `UNDERSTOOD`.
4. **Design the sharing round trip properly** — it is the one workflow where every remaining P0 lands at once.
5. **Then the P1 content**, in this order: Destination tabs → sub route → warning-strip slot → the two confirm-button destructive actions → long-content/CJK breadth.
6. **P2 last, or never** — most of §4 is "accidental but harmless" and should stay that way until a file is being opened anyway.

Implementation should not begin until items 1–4 are confirmed. Items 5–6 can proceed in parallel with implementation of the confirmed areas.

**One process note.** The existing design documents went stale in a single commit, and three of their claims were wrong before anyone noticed. Whatever we confirm should record the tree it was confirmed against, so the next pass can tell a confirmed decision from an expired one.
