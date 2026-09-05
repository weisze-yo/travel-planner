repo: weisze-yo/travel-planner
branch: main
path: web

## Last sync
date: 2026-09-04T15:05:00Z
tree: 1d3df5956fb8 (github_get_tree resolved tree hash, not a commit sha)

### Updated in this project
- **P0-6 verification sprint**: ran the real `web/` bundle at tree 1d3df5956fb8 through its own screen modules and captured 16 previously unseen surfaces at 390 × 844 (`docs/design/screens/verify/`), incl. the join live invite, the review round trip, the sub route, the paste review pass and draw-an-area. Record: `docs/design/verification-sprint-p0-6.md`.
- Found that the role model is **enforced in `store.js` (`myRole`/`isOwner`/`canPublish`) and called by no screen**, so a `read` role sees an enabled `Send n changes` that silently no-ops.
- Full UI/UX design coverage audit: `docs/design/ui-ux-design-coverage.md` — 59 screens/flows, states, and a confirmation matrix.
- Re-verified the whole baseline against live `main`: `app.css`, `index.html`, `sw.js` and 18 of 20 screen modules are byte-identical; `currency.js` is new and `store/persist/sync/net/app/share/trip/map` changed.
- Corrected three wrong claims in the existing docs (no close/delete trip on Trip settings; Android icons now committed; the sharing round trip is no longer blocked — an emulator harness exists).
- Recorded newly landed, undesigned behaviour: city → currency inference, three location-lookup failure notices, cross-tab sync.

### Updated in the 06:50 pass
- Refreshed the UI baseline against the current build: re-read the changed files and re-captured all screens.
- Recorded the account/sign-in change (Google + emailed link, no anonymous auth) and the Firestore `published/{code}` share envelope.
- Re-captured 20 screens in a standard 390 × 844 mobile frame at `docs/design/screens/current/`.
- Corrected `docs/design/existing-ui-audit.md` (§2, §16, §17, new §18) and rewrote `docs/design/existing-ui-visual-reference.md`.

## Sync history
- 2026-09-04T06:50:00Z — tree 4698f0e4a8b8 — baseline refresh: accounts/sharing corrections, 20 screens re-captured.
- 2026-09-04T05:20:00Z — tree e1fcb75ee81b — first pass: full read of `web/`, screen inventory, visual baseline (18 screens).

## Screen map
| Screen | Route | Source files |
|---|---|---|
| My trips | `#trips` | web/js/screens/trips.js |
| Map home | `#map` | web/js/screens/map.js, screens/parts.js |
| Plan | `#plan` | web/js/screens/plan.js |
| Destination | `#dest` | web/js/screens/dest.js |
| Nearby | `#nearby` | web/js/screens/nearby.js |
| Sub route | `#sub` | web/js/screens/sub.js |
| Shopping list | `#shop` | web/js/screens/shop.js |
| Spend report | `#spend` | web/js/screens/spend.js |
| Trip prep | `#prep` | web/js/screens/prep.js |
| Log | `#log` | web/js/screens/log.js |
| Note editor | `#note` | web/js/screens/note.js |
| Trip settings | `#trip` | web/js/screens/trip.js |
| Share | `#share` | web/js/screens/share.js, js/share.js |
| Join | `/j/CODE`, `#join` | web/js/screens/join.js |
| Review | `#review` | web/js/screens/review.js |
| Paste itinerary | `#paste` | web/js/screens/paste.js, js/itinerary.js |
| Map kept on phone | `#areas` | web/js/screens/areas.js, js/tiles.js |
| Draw an area | `#area` | web/js/screens/area.js |
| Changes on this phone | `#stuck` | web/js/screens/stuck.js, js/sync.js |
| Global chrome | — | web/index.html, js/nav.js, js/strip.js, css/app.css |
| Account row + sign-in | #trips, /j/CODE | web/js/screens/trips.js, web/js/screens/parts.js (signInPanel), web/js/persist.js |
| Share envelope (backend) | — | web/js/persist.js (published/{code}), firebase/firestore.rules |
| Currency from city (new) | #trips modal, #trip | web/js/currency.js, web/js/store.js (~736), web/js/net.js, web/js/screens/trip.js |
| Cross-tab sync (new) | — | web/js/app.js (storage listener), web/js/sync.js (reload) |
| Coverage audit | — | docs/design/ui-ux-design-coverage.md, UI UX Design Coverage.dc.html |
| Verification sprint | — | docs/design/verification-sprint-p0-6.md, docs/design/screens/verify/*.png, web/verify.html (harness) |
