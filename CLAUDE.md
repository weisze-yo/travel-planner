# Travel Planner

An offline-first trip planner installed to an iPhone home screen from Safari.
Vanilla JS, ES modules, **no build step**. `web/` is what Firebase Hosting
serves. It is in production at https://travel-planner-3e0d3.web.app.

The current phase is post-implementation QA. Before any UI change, read
`docs/design/post-implementation-qa.md` §0. For depth, go to `HANDOFF.md`,
the working handoff, and read the section you need rather than the whole file.

## Commands

```sh
node --experimental-vm-modules test/guard.mjs   # FIRST, always: parse sweep + backtick trap
test/run.sh                                     # guard + all browser harnesses (~75 s, parallel)
test/run.sh search plan-*                       # a subset, by name or glob
cd web && npx http-server -p 8099 -c-1 .        # run the app by hand
```

`test/run.sh` starts the :8099 static server and the :8123 rewrite server
(`test/serve.mjs`) when they are not already up. The emulator pair
(`two-phones.mjs`, `refused-rules.mjs`) needs `test/setup.sh` plus the Firebase
emulators. See `test/README.md`. Run it for anything that touches sharing,
sync, persistence or `firebase/firestore.rules`.

## Code map

- `web/js/store.js` is the single source of truth. Everything derived lives
  there, and screens only render and call mutations.
- `web/js/screens/*.js`: each screen has `render()`, which returns a string,
  and `mount(root)`. Screens re-render wholesale, so bind handlers with
  `delegate(root, sel, handler)`. The handler is `(element, event)`, element
  first.
- `persist.js` holds the two backends: Firestore when signed in, localStorage
  otherwise. `share.js` holds the sharing rules and the snapshot diff.
  `sync.js` is the pending-writes ledger.
- Boot migrations run `unifyNotes → unifyPlaces → unifyWindows → unifyLoops`
  in that order, and each must be idempotent.

## Standing rules (never break)

- No paid APIs. Use Open-Meteo, OpenStreetMap and the ECB, all keyless.
- It works offline. Only map tiles need the network.
- Sharing is snapshot-and-review, not live sync. The itinerary, sub routes,
  places and must-see travel. Shopping, prep, log and outfits never do.
- Delete is always swipe-left to a red dustbin, with a confirmation.
- Every stop is a place. When something keeps its own copy of what a place
  owns, the place wins.
- Verify in a browser before saying something is done.
- Don't re-litigate what HANDOFF.md lists as DONE, or anything on the
  rejection list in `docs/design/implementation-readiness-map.md` §5.
- If the design doesn't settle a UI question, ask the product owner rather
  than guessing.

## Don't touch

`TravelPlanner.swiftpm/` (the parked native app), `web/vendor/`, and any
service-account key or trip backup. Hooks enforce all three.

## Traps that each cost an hour

- A backtick inside an HTML comment inside an `html` template literal ends the
  template, yet the file still parses. `guard.mjs` catches it, and a hook runs
  it after every `web/js/` edit.
- In harnesses:
  - Set `serviceWorkers: 'block'`.
  - Route tiles with a RegExp, not a glob.
  - Seed localStorage in `addInitScript`.
  - Navigate with `nav.go(id)`.
  - Poll with `page.evaluate` in a loop, not `waitForFunction`.
- Chromium can't reach the internet from the cloud sandbox. To verify a deploy,
  `curl` the deployed files and serve them locally.

## Git and deploy

Every push to `main` that touches `web/`, `firebase.json` or the rules
deploys to production (`.github/workflows/deploy-web.yml`). Work on a branch.
Pushing to `main`, force-pushing, a manual `firebase deploy`, or a real
`scripts/import-trip12.mjs` run needs the user's explicit OK, and a hook asks.

## Multi-agent workflow

`/orchestrate <task>` runs one change through the pipeline in `.claude/`:

| Role | Where | Owns | Cannot |
| --- | --- | --- | --- |
| Orchestrator | main session (`/orchestrate`, or `claude --agent orchestrator`) | brief, delegation, git, human gates | edit code |
| `engineer` | `.claude/agents/engineer.md` | `web/`, `firebase/`, `scripts/` | edit `test/`, commit |
| `tester` | `.claude/agents/tester.md` | `test/`, running the suite | edit outside `test/` |
| `reviewer` | `.claude/agents/reviewer.md` | verdict on the diff | edit anything |
