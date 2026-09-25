# CLAUDE.md — working on Travel Planner

Read this before touching anything. It carries the rules that have held across
nine rounds, the traps that have each cost real debugging time, and the list of
decisions that are closed. The repo has a documented history of sessions
re-deriving all three and occasionally re-litigating settled design decisions.

## What this is

An offline-first trip planner, installed to an iPhone home screen from Safari
and served by Firebase Hosting. `store.js` is the single source of truth;
`screens/*.js` render and call mutations.

**`src/` is the source. `web/js/` is generated and is not in git.**

```sh
npm run build          # src/ -> web/js/, one file to one file
```

`.ts` goes through `tsc`; `.js` is copied byte for byte (routing unconverted
JavaScript through tsc reformats thousands of unchanged lines). There is no
bundler and there must not be one while `web/sw.js` carries a hand-written list
of every JS file — hashed filenames would break the offline shell silently.
`npm test` and `npm run serve` build first. Everything else under `web/` — the
CSS, icons, `index.html`, `sw.js`, `vendor/` — is hand-written and tracked.

The conversion to TypeScript is file by file, smallest and most depended-upon
first. Converted so far: `util.ts`.

Live at <https://travel-planner-3e0d3.web.app>. `TravelPlanner.swiftpm/` is a
parked native implementation — **do not touch it.**

## Standing rules — these have never moved

- **No paid APIs.** Weather is Open-Meteo, geocoding and places are
  OpenStreetMap, rates are the ECB. All free, all keyless.
- **It must work offline.** Every screen reads from the phone. Map tiles are the
  only thing needing the network, which is what `src/tiles.js` and "keep an area"
  exist for.
- **Every stop is a place.** A stop is a *visit to* a place, never a second kind
  of record. Three bugs have come from something keeping its own copy of what a
  place owns. If you find a fourth, the place wins.
- **A stop holds two clock times**, not a start plus a duration. The length is
  derived grey text.
- **Free time is a lane between stops**, not a row on the itinerary.
- **Delete is swipe-left → in-row confirm → 6s undo.** Exactly two confirm-button
  exceptions: `Empty this trip` and `discardPending`.
- **Sharing is snapshot-and-review, not live sync.** A link hands over a copy;
  the recipient forks it and reviews later updates one change at a time.
- **Verify in a browser before saying it is done.**

## Before you say anything is done

```sh
npm run test:guard     # always first — see the trap below
npm test               # 30 harnesses, 931 checks, builds and starts its own servers
npm run typecheck      # a ratchet: fails if the type-error count goes UP
```

`npm test` is the whole browser suite in one command. It reuses a server already
on 8099/8123 if you have one. Useful flags: `--jobs 4` (faster, less stable),
`--only <substring>`, `--junit out.xml`.

The two emulator harnesses are separate — they need `test/setup.sh` and a
running Firebase emulator pair. See `test/README.md`.

**`test/BASELINE.md` is the only check count to trust.** It is measured by
running the suite. Every other document in the repo quoted 485 checks for weeks
after the real number had reached 914. Do not quote a count from memory, and
update BASELINE.md when you change it.

## Traps that have each cost an hour or more

1. **A backtick inside an HTML comment inside an `html` template literal ends
   the template.** With an even number in one file the module still *parses* —
   `node --check` and `vm.SourceTextModule` both say it is fine — and the screen
   renders wrong or throws `html(...).x is not a function` at runtime, a long
   way from the cause. It has bitten four times. `test/guard.mjs` catches it;
   run it first, every time.
2. **`delegate(root, selector, handler)` calls `handler(element, event)` —
   element first.** Screens re-render wholesale, so handlers are delegated.
3. **`serviceWorkers: 'block'`** in a harness context, or the service worker
   mediates fetches and `ctx.route` never fires.
4. **Route tiles with a RegExp, not a glob.** The host is
   `a.tile.openstreetmap.org`, so `'**/tile.openstreetmap.org/**'` misses. Use
   `/tile\.openstreetmap\.org/`.
5. **Set the active trip with `addInitScript`.** `app.js` calls `closeTrip()`
   when no trip is remembered, which clears the key, so setting it after `goto`
   is undone.
6. **Navigate with `nav.go(id)`**, not by setting `location.hash` — there is no
   hashchange listener.
7. **Never poll store state with `page.waitForFunction`.** It runs in
   Playwright's isolated world, where `import('/js/store.js')` boots a *second*
   copy of the store. Poll with `page.evaluate` in a loop.
8. **`context.setOffline()` does not stop a service worker fetching.** An
   "offline" test built on it is unsound — measured: the shell cache grew from
   35 to 38 modules *during* an offline load, because the service worker
   reached the network for real. `test/offline-cold-boot.mjs` runs its own
   server and closes it instead. Also: `web/sw.js` carries a hand-written
   precache list, and `npm run build` now fails if it does not match what is
   emitted — three modules had already slipped out of it.
9. **`test/refused-rules.mjs` swaps `firebase/firestore.rules` for a deny-all
   ruleset.** It restores it in a `finally` and refuses to run against a dirty
   file — but if you ever find that file holding deny-all rules, a run crashed:
   `git checkout firebase/firestore.rules`, and **do not deploy**. The deploy
   publishes that file to production.

## The data model, and what it costs to change

There is **no schema and no validation anywhere** — `src/data.js:330-338`
states that as a deliberate contract. Records are whatever was written, so new
*fields* are additive and free. New *kinds* are not.

`KINDS` lives at `src/persist.js:23`, and is **hand-copied into more than ten
other places**: `store.js` (`openNothing`, `closeTrip`, `exportTrip`,
`importTrip`, `clearTripContent`, the snapshot builders), `sync.js` `KIND_NAMES`,
`share.js` `SHARED_KINDS`/`PRIVATE_KINDS`, `scripts/backup-trip.mjs`,
`scripts/import-trip12.mjs`. Miss one and data is silently dropped from export,
from "empty this trip", or from a share. The Firestore rules need no change —
`users/{userId}/{document=**}` already covers any new collection.

Boot runs four idempotent migrations in order, inline, with no version number:
`unifyNotes()` → `unifyPlaces()` → `unifyWindows()` → `unifyLoops()`.

## Design decisions that are closed

`docs/design/implementation-readiness-map.md` §5 is the permanent rejection
list. **If something there looks wrong, it is a question for the product owner,
not a fix.** Among them: no confirm on the Plan's ✕ (it archives; the archive is
the confirm), no spinner/overlay/skeleton anywhere, no fifth sync colour, no
stacked undo bar, no stock photos or invented positions, no pre-disabled primary
on a form that can refuse.

`docs/design/p0-3-system-sign-off.md` wins wherever design documents disagree.
Artboards in `project/*.dc.html` are illustrative and settle nothing.

New UI/UX findings go to `docs/design/post-implementation-qa.md`, under its rule:
**a screenshot is evidence of what the app does, not authorisation to change
what it should do.**

## Git

Work on the branch you were given; never push to a different one without
permission. Pushes to `main` deploy, and deploys are now gated on the suite.
Commit in the user's name.

## Where the plan lives

The current programme is a phased rebuild: foundations and a full design pass
before new features, TypeScript for the app and tooling, Python retained only
for the research/data pipeline, and everything built so an App Store listing
stays possible. See the market review at `docs/market-review-2026.html` for why.

## Multi-agent workflow

`/orchestrate <task>` runs one change through the pipeline in `.claude/`:

| Role | Where | Owns | Cannot |
| --- | --- | --- | --- |
| Orchestrator | main session (`/orchestrate`, or `claude --agent orchestrator`) | brief, delegation, git, human gates | edit code |
| `engineer` | `.claude/agents/engineer.md` | `src/`, the hand-written files under `web/`, `firebase/`, `scripts/`, `build.mjs` | edit `test/` or `web/js/`, commit |
| `tester` | `.claude/agents/tester.md` | `test/`, running the suite, `test/BASELINE.md` | edit outside `test/` |
| `reviewer` | `.claude/agents/reviewer.md` | verdict on the diff | edit anything |

Four hooks hold the rules even for an agent that never read this file:
`protect-paths.mjs` denies `TravelPlanner.swiftpm/`, `web/js/`, `web/vendor/`,
service-account keys and trip backups; `guard-after-edit.mjs` runs the backtick
guard after every `src/` edit; `guard-bash.mjs` asks before a push to `main`, a
force push, a manual `firebase deploy` or a live Trip 12 import; `role-scope.mjs`
keeps the Engineer and the Tester out of each other's files.
