# The test baseline — measured, not remembered

**Measured 23 September 2026** against commit `64cb7ec` on
`claude/intelligent-pasteur-ebuo53`, by running every harness end to end.

This file exists because the numbers in `HANDOFF.md`, `README.md`,
`DESIGN_REVIEW.html` and `docs/design/transition-audit.md` §10.2 were **wrong by
roughly half**, and had been for weeks. All of them said *"sixteen harnesses, 485
checks"* and listed all sixteen by name. Fourteen more harnesses had landed in
the later design rounds and were never counted. Nobody could tell whether the
suite was passing, because nobody knew what passing looked like.

**Do not quote a check count from memory or from another document. Re-run the
suite and update this file.**

## The numbers

| | |
|---|---|
| Browser harnesses | **29** |
| Checks | **920** |
| Failures | **0** |
| Wall time, run serially | **~4 minutes** |
| Plus `contrast.mjs` | 24 gated colour pairs (19 + 5), its own format, not in the 920 |
| Plus `guard.mjs` | 37 modules parse · 0 backticks in HTML comments (it walks `src/` now) |
| Plus the emulator pair | `two-phones.mjs` (65) and `refused-rules.mjs` (9) — not run here; they need the Firebase emulators |

## Per harness

| Harness | Checks |
|---|---|
| `absence-and-status` | 37 |
| `accessibility` | 14 |
| `backend-gated` | 25 |
| `contrast` | — (24 gated pairs, own format) |
| `css-additions` | 25 |
| `currency` | 56 |
| `dim-and-stick` | 18 |
| `empty-states` | 37 |
| `image-slot` | 32 |
| `install-line` | 22 |
| `loop-delete-and-removal` | 27 |
| `map-link` | 27 |
| `name-vs-address` | 21 |
| `nearby-managing` | 70 |
| `opacity-never-state` | 33 |
| `outfit-prose` | 30 |
| `pending-and-refusals` | 57 |
| `plan-delete` | 11 |
| `plan-editing` | 31 |
| `provenance-derived` | 20 |
| `review-three-way` | 71 |
| `role-and-identity` | 40 |
| `search` | 55 |
| `select-recipe` | 56 |
| `settings-and-share` | 25 |
| `sub-route-remove` | 6 |
| `swipe-delete` | 10 |
| `time-windows` | 29 |
| `warning-strip` | 35 |
| **Total** | **920** |

Where a number differs from the old documented one, the number here is the one
the harness actually printed. Several drifted upward as checks were added
without the counts being revised — `accessibility` 9 → 14, `empty-states` 35 →
37, `warning-strip` 34 → 35, `currency` 55 → 56, `pending-and-refusals` 56 → 57.

## How to re-run it

```sh
npm run test:guard   # always first
npm test             # builds, starts both servers, runs all 29, prints the total
```

`test/run.mjs` starts the servers itself and reuses one already on the port.
Useful flags: `--jobs 4` (faster, less stable — the harnesses synchronise with
fixed sleeps), `--only <substring>`, `--junit out.xml`.

When this baseline was first measured that command did not exist: it meant
starting `http-server` on 8099 from `web/` in one terminal, `test/serve.mjs` on
8123 in another, running twenty-eight scripts by hand and adding up the PASS
lines yourself. That is the practical reason the count was allowed to drift.

The two emulator harnesses are not part of `npm test` — they need `test/setup.sh`
and a running Firebase emulator pair, and they are their own CI job.

## What this baseline does not cover

Measured honestly, so the gaps are not mistaken for coverage:

- `sub-route-remove` was added 23 Sep 2026 after the TypeScript pass found that
  `screens/sub.js` still called `store.toggleSubRoutePlace`, renamed weeks
  earlier to `setSubRoutePlace` — so the ✕ that takes a place out of a sub route
  threw and did nothing. No harness had ever clicked it. A dead handler is
  invisible to every other kind of check: the markup renders and the module
  parses.
- **Four modules have no test of any kind** — `src/tiles.js` (slippy-map maths
  and the whole offline-map feature), `src/remind.js` (the leave-now rules,
  documented as pure and the most unit-testable file in the repo),
  `src/itinerary.js` (the 348-line parser), `src/currency.js`.
- **Two screens have none** — `note.js` and `area.js`.
- **The four boot migrations** (`unifyNotes` → `unifyPlaces` → `unifyWindows` →
  `unifyLoops`) are asserted nowhere, and neither is their idempotency.
- **"Every screen works offline"** — the app's founding promise — is not tested.
  Harnesses abort a fixed list of hosts during boot, which is not the same thing.
- **There is no unit test and no unit-test runner.** Every check above drives a
  real browser.
- `contrast.mjs` transcribes its colour values as constants rather than reading
  `web/css/app.css`, so the stylesheet can drift away from the test silently.
- Synchronisation is by fixed `waitForTimeout` sleeps, which is flaky by
  construction on a loaded machine.
- **Eighteen harnesses do not stub the network**, and the development container
  cannot reach the internet from Chromium — so a test written here can come to
  depend on a broken network without anyone noticing. `name-vs-address.mjs` did
  exactly that: "a link whose name has no comma gains no Address row" held only
  while the reverse-geocode failed, and the first CI run on a networked runner
  returned the live Japanese address for Tsukiji instead. It is fixed and now
  refuses the hosts explicitly via `blockOutside(page)` from
  `test/lib/runtime.mjs`. The other seventeen pass on a networked runner today,
  but none of them says whether that is by design. Adding `blockOutside` where
  the result should not depend on connectivity is worth a pass of its own.
- **`test/accessibility.mjs` uses `page.accessibility.snapshot()`, which
  Playwright has removed.** It works only on the pinned 1.56.1, which is why
  `package.json` pins an exact version rather than a range. Rewrite it off that
  API before raising the pin.
Two entries that used to be here are now closed: the suite ran nowhere but the
development container (Playwright, Chromium and the server root were all
hardcoded), and nothing ran in CI at all. Both were fixed on 23 Sep 2026 —
`test/lib/runtime.mjs` resolves the runtime, and `.github/workflows/tests.yml`
runs the guard, the typecheck ratchet, the browser suite and the emulator pair
on every push.

Each remaining item is a numbered item in the testing plan for the next build.
