# Travel Planner

An offline-first trip planner you install to an iPhone home screen from Safari:
itinerary with two clock times per stop, free-time lanes, places, notes, spend,
packing, offline map areas, and snapshot-based trip sharing.

**Status: implemented, deployed and in production.**

| | |
|---|---|
| Production | https://travel-planner-3e0d3.web.app |
| Deployed from | `main` — every push that touches `web/`, `firebase.json` or the rules deploys via `.github/workflows/deploy-web.yml` |
| Milestone | Round nine, the design-implementation milestone, **CLOSED 6 Sep 2026** (production commit `4f20bbe`, last app-code commit `5e2c8a4`) |
| Current phase | Post-implementation QA — intake and triage of discrepancies found by using the live app; nothing in that backlog is implemented yet |
| Regression suite | 16 committed browser harnesses in `test/` — 485 checks, plus `two-phones.mjs` at 65/65 against the real Auth and Firestore emulators |

## Start here

1. **[HANDOFF.md](HANDOFF.md)** — the working handoff: how to run and test the
   app, the shape of the code, the standing rules, what is decided and must not
   be redesigned, and what is deliberately left open.
2. **[docs/design/transition-audit.md](docs/design/transition-audit.md) §10** —
   the milestone close-out: every batch, every commit, and everything left open
   on purpose.
3. **[docs/design/post-implementation-qa.md](docs/design/post-implementation-qa.md)**
   — where new UI/UX findings go. A screenshot is evidence of what the app does,
   not authorisation to change what it should do: check the canonical design
   documents first.
4. **[WEB_APP_GUIDE.md](WEB_APP_GUIDE.md)** — Firebase project setup, the
   console steps and the deploy secret.

Running it locally is a static server, no build step:

```sh
cd web && npx http-server -p 8099 -c-1 .
```

Run `node --experimental-vm-modules test/guard.mjs` before anything else, and
the rest of `test/` after any change to shared code. See HANDOFF.md for the
traps that cost real debugging time.

## Repo structure

- `web/` — the production web app: vanilla JS, ES modules, no build step.
  `js/store.js` is the single source of truth; `js/screens/*.js` render and call
  mutations. This is what Firebase Hosting serves.
- `test/` — the committed regression suite (Playwright-driven harnesses that
  print PASS/FAIL lists) plus its own README, coverage and report notes.
- `firebase/` — Firestore and Storage security rules. `firebase.json` wires
  hosting, the SPA rewrite, cache headers and the rules.
- `docs/` — the design record and audits (`docs/design/`) and the
  product-owner-facing `manual-testing-guide.md`.
- `project/` — the original Claude Design HTML prototypes (`*.dc.html`) and
  assets. These are the design source of record for what the UI *should* be;
  they are not code and are not built.
- `chats/` — the design-session transcripts behind those prototypes, kept as
  history.
- `DESIGN_REVIEW.html` — the running, human-readable record of what is fixed and
  what is open. Numbers in HANDOFF.md refer to its items.
- `APP_README.md` + `TravelPlanner.swiftpm/` — a parked native SwiftUI
  implementation of the same design. Written but never compiled; **do not touch
  it.**

## Standing rules

These have held across every round and still hold:

- **No paid APIs.** Weather is Open-Meteo, geocoding and place details are
  OpenStreetMap, exchange rates are the European Central Bank — all free and
  keyless.
- **It must work offline.** Every screen reads from the phone; map tiles are the
  only thing that needs the network, which is what the "keep an area" flow is
  for.
- **Sharing is snapshot-and-review, not live sync.** A link hands over a
  snapshot; the recipient gets their own forked trip and reviews later updates
  one change at a time.
- **Delete is always swipe-left to a red dustbin with a confirmation.**
- **Every stop is a place** — a stop is a visit to a place, not a second copy of
  one.
- **Verify in a browser before saying it is done**, then commit and push to
  `main`, which deploys.
