# Handoff — Travel Planner, after round nine

Written 4 Sept 2026, rewritten 6 Sept 2026 when round nine closed. Read this
first if you are picking the work up in a new session.

**Current state: implemented, deployed and in production** at
<https://travel-planner-3e0d3.web.app>. Round nine — the
design-implementation milestone — is CLOSED; see the round-nine section at the
bottom of this file, which is the authoritative account of where the work
stands, and `docs/design/transition-audit.md` §10 for the batch-by-batch
close-out. The current phase is post-implementation QA intake
(`docs/design/post-implementation-qa.md`), and nothing in that backlog has
been implemented.

---

## What this app is

A vanilla-JS web app in `web/`, no build step, ES modules, installed to an
iPhone home screen from Safari. There is also a parked native app in
`TravelPlanner.swiftpm` — **do not touch it**.

Standing rules that have held for six rounds and still hold:

- **No paid APIs.** Weather is Open-Meteo, geocoding and place details are
  OpenStreetMap, rates are the European Central Bank. All free, all keyless.
- **It must work offline.** Every screen reads from the phone. Map tiles are
  the only thing that needs the network, which is what `web/js/tiles.js` and
  the "keep an area" flow exist for.
- **Delete is always swipe-left to a red dustbin with a confirmation.**
- **Every stop is a place.** A stop is a *visit to* a place, not a different
  kind of record. Two bugs have already come from something keeping its own
  copy of what a place owns; if you find a third, the place wins.
- **Verify in a browser before saying it is done.** Then commit with the
  user's name and push to `main`, which deploys.

## How to work on it

```sh
cd web && npx http-server -p 8099 -c-1 .
```

Chromium is at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` and
Playwright is at `/opt/node22/lib/node_modules/playwright/index.js`
(CommonJS — `import pw from '…'; const { chromium } = pw;`).

**Check that every module still parses before running anything.** `node
--check` treats these as CommonJS and will not catch a broken template
literal; this will:

```sh
node --experimental-vm-modules -e "
const fs=require('fs'), vm=require('vm'), path=require('path');
const walk=(d)=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):(e.name.endsWith('.js')?[path.join(d,e.name)]:[]));
for(const f of walk('js')){ try{ new vm.SourceTextModule(fs.readFileSync(f,'utf8'),{identifier:f}); }catch(e){ console.log(f+': '+e.message); } }"
```

### The browser harnesses

There are sixteen as of round nine (485 checks), each a standalone script that
prints a PASS/FAIL list. They are the regression suite; run them all after any
change that touches shared code.

**They are committed — they live in `test/`.** Do not write new ones before
looking there. The per-harness breakdown is in the round-nine section below and
in `docs/design/transition-audit.md` §10.2, and `test/README.md`,
`test/COVERAGE.md` and `test/REPORT.md` carry the running notes. The pattern
they all follow is:

```js
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
  serviceWorkers: 'block',   // or page routes will not intercept tile fetches
});
await ctx.addInitScript(() => {
  // only on a cold start, or reboots between identities lose their trip
  if (!localStorage.getItem('travel-planner:active-trip')) {
    localStorage.setItem('travel-planner:active-trip', 'meridian-city');
  }
});
```

Three traps that have each cost an hour:

1. `serviceWorkers: 'block'` — without it the service worker mediates fetches
   and `ctx.route` never fires.
2. Route tiles with a **RegExp**, not a glob: the host is
   `a.tile.openstreetmap.org`, so `'**/tile.openstreetmap.org/**'` does not
   match. Use `/tile\.openstreetmap\.org/`.
3. `app.js` calls `closeTrip()` when no trip is remembered, which *clears*
   the key — so setting it after `goto` is undone. Use `addInitScript`.
4. Navigate with `nav.go(id)`, not by setting `location.hash` — there is no
   hashchange listener.
5. `page.waitForFunction` polls in Playwright's *isolated* world, where
   `import('/js/store.js')` is a second, freshly booted copy of the store
   rather than the app's. Poll with `page.evaluate` in a loop instead.

### Testing Firebase for real

Firebase can only be eyeballed without rigging, so there is rigging, and by
round nine it is **committed rather than living in a scratchpad**:

- **`test/two-phones.mjs`** — two browser contexts with nothing in common,
  between them the real Firebase SDK, the real Auth emulator and the real
  Firestore emulator running this repo's `firebase/firestore.rules`. 65/65 at
  round nine. It is also the proof the rules say what their comments claim:
  one account cannot read another's trip, checked by Google's own engine
  rather than a re-implementation.
- **`test/refused-rules.mjs`** — swap in a deny-all ruleset and check the app
  says so in words that name the fix instead of blaming the network. It
  restores `firebase/firestore.rules` byte-identical when it is done.
- **`test/setup.sh`** vendors the pinned SDK into `web/vendor/firebase-local/`
  (gitignored) and installs `firebase-tools` under `test/`; **`test/serve.mjs`**
  serves `web/` on :8123 with Hosting's rewrite, so `/j/CODE` returns
  `index.html`. `http-server` will not do that rewrite and pointing its
  `--proxy` at itself loops. `test/README.md` has the three-terminal recipe.

Two things from round eight that the committed rigging replaced, recorded so
nobody rebuilds them: the fake Firebase SDK served over `ctx.route` (the real
SDK against real emulators is better in every way), and a separate
26-assertion `@firebase/rules-unit-testing` script, which was **never
committed** — `two-phones.mjs` covers the rules end to end instead. If you do
want isolated per-rule assertions, that script is worth rewriting; when you
run one, ignore the emulator's "evaluation error" log lines on deny paths, as
it evaluates once before loading the document and once after, and the first
pass cannot see `resource.data`.

## The shape of the code

| File | What it owns |
| --- | --- |
| `js/store.js` | The single source of truth. ~3,300 lines. Everything derived lives here; screens only render and call mutations. |
| `js/persist.js` | Signing in, and two backends behind one interface: Firestore when there is an account, localStorage otherwise. `KINDS` is the list of collections. |
| `js/share.js` | Sharing, pure: link codes, expiries, roles, and the snapshot diff. |
| `js/sync.js` | The pending-writes ledger, so "stuck for three days" survives a relaunch. |
| `js/tiles.js` | Slippy-map maths and the capped tile downloader. |
| `js/remind.js` | The leave-now rules, pure. |
| `js/itinerary.js` | The text parser. |
| `js/screens/*.js` | One object each: `render()` returns a string, `mount(root)` binds delegated handlers. |
| `js/screens/parts.js` | Anything two screens share, including the three editor sheets. |

Screens re-render wholesale on every store change, so handlers are bound with
`delegate(root, selector, handler)` — **note the signature is
`handler(element, event)`, element first.**

Boot runs four idempotent migrations in order: `unifyNotes()` →
`unifyPlaces()` → `unifyWindows()` → `unifyLoops()`.

## Where the design decisions are written down

`DESIGN_REVIEW.html` is the running record: what is fixed, what is open, and
what each open item is actually asking for. It is written for the user to
read, not for a machine. Update it at the end of a round.

---

## What is DONE and must not be redesigned

These were decided by the user and built. Do not re-litigate them.

- **A stop holds two clock times**, not a start plus a duration. The length
  is derived grey text.
- **Free time is a lane between stops**, not a row on the itinerary. A sub
  route lives inside a lane.
- **A note belongs to a place and a time.** Many per day.
- **Pasting an itinerary** grades every row and lands nothing until you
  confirm.
- **Sharing is snapshot-and-review** (see below). It is *not* live sync.
- **Adding a sub route, deleting one, and deleting a removed stop are edits**
  and live behind the pencil on the Plan.
- **The trips home has no tab bar.** The five tabs belong to a trip.

### The sharing model, in one paragraph

Everything you change stays on your phone, online or off. Sharing publishes a
**snapshot**; whoever opens the link gets **their own forked trip** seeded
from it. When the owner or an editor presses *Send an update*, a new snapshot
goes into the envelope at `travel-planner:shared:<code>` and the other side
**reviews it a change at a time** — yours against theirs, one decision each.
That envelope is a Firestore document at `published/<code>` as of round eight,
mirrored into localStorage so it is readable with no signal.
Three kinds travel (itinerary + sub routes, places, must-see); four never do
(`shopping`, `prep`, `log`, `outfits`) and `share.js` names both sets so the
promise is checkable. A role is about *publishing*, not permission.

---

## What is still open

Numbers match `DESIGN_REVIEW.html`. Item 31's code is done; what is left of it
is a console, and that is the user's.

### Item 31 — **done in round eight**, except the console

Built, checked, deployed. What remains is steps 1–8 of `WEB_APP_GUIDE.md`,
which need the user's own Google account and cannot be run or verified from a
sandbox.

What was built, and the decisions inside it — do not re-litigate these:

- **Anonymous sign-in is gone.** Not replaced-alongside: gone. An anonymous uid
  is an account nobody can get back, which is the opposite of the point. A
  phone that still carries one from the old build **keeps it**, and signing in
  calls `linkWithPopup` / `linkWithCredential` so the uid never moves and every
  trip under it stays reachable. New phones are never given one.
- **Not signed in → the `local` backend.** That is what makes item 31's fourth
  point fall out rather than needing a special case: the demo trip lives on a
  phone that has never signed in, is never written to any account, and comes
  back when you sign out. `state.stranded` now means *signed in but stuck on
  localStorage*, which is a different thing from nobody having signed in.
- **Email is a link, not a password.** `sendSignInLinkToEmail`, and
  `completeEmailLink()` finishes it on the launch that opens the link. There is
  no password field anywhere and nothing to reset.
- **Trips made before an account are carried into it** by `carryLocalTrips()`,
  under the ids they already had, so a link handed out earlier still points at
  the same trip. The demo is the one exception and the sign-in sheet says so.
- **The envelope is `published/{code}`,** one document per link. `readPublished`
  is still synchronous — every caller is inside a render — so localStorage is
  now a *mirror* of that document, refreshed by `watchEnvelope()`. Firestore is
  the source of truth; the mirror is what this phone last saw, and is what makes
  it readable with no signal. The old bare-snapshot format is still read, so
  links handed out before this round still open.
- **The envelope carries uids** (`owner`, `editors`) because the rules do, and
  `linkRole` / `live` / `expiresAt` because switching a link off has to reach
  the other phone. Two functions above `writePublished` changed by one line each
  for that: `setLinkLive` and `setLinkExpiry` now call `restateTerms()`.
- **`/j/CODE` really works now.** `app.js` reads the code out of the path and
  `openLink()` fetches the envelope, so the join screen renders from the
  *envelope* on a phone that has never seen the trip. `index.html` has a
  `<base href="/">` for this — without it every relative script resolves against
  `/j/` and the one screen a stranger ever sees is blank.
- **Apple sign-in is not offered.** On the web it needs a Services ID and a
  signing key from the Apple Developer Program at $99 a year, and the no-paid
  rule holds.

Two follow-ups, both small and both deliberate rather than forgotten:

1. **Publishing without an account only reaches this phone.** The rules have no
   uid to check, so `writePublished` mirrors and stops. The guide says so; no
   screen does. If the user wants a nudge in the share sheet, that is a UI
   decision and wants drawing rather than guessing.
2. **A demo trip somebody has been using as their own does not follow them into
   an account.** It stays on the phone rather than being deleted, and both
   sign-in sheets say so. Carrying it would break item 31's fourth point; the
   only honest alternative is a "make this trip mine" step, which is a design
   question, not a bug.

### Item 30 — trip files *(built; the rest is polish)*

Export and import as JSON are done. What is left is the format's own
documentation for a human writing one by hand.

### Item 08, 10, 07 — **done this round.**

### Item 12 — more than one language

The user's decision: people will type Chinese, Japanese and Korean into the
itinerary, and **the UI must not break whatever they type**. This is mostly a
robustness pass, not a translation project:

- No fixed-width or single-line-clamped text that a CJK string overflows.
- `initialFor()` in `js/share.js` already takes the first character rather
  than transliterating; check every other place a name is abbreviated.
- The parser reads CJK day headers and times already; every *warning* it
  generates is a built English sentence, which is the real gap.

### Item 02 — empty states for every screen

The user has agreed these need designing. Several exist and are good
(`emptyLog()`, `emptyDay()`); several are one grey sentence. Worth a pass
across all of them, ideally drawn first.

### Item 16 — the accessibility pass

Agreed as needed. The two densest controls are the swipe rows and the sheet
handle; both currently have keyboard-reachable alternatives but have not been
tested with VoiceOver.

### Items 13, 14, 15 — closed by the user

- **13 dark mode:** light only for now.
- **14 search:** future enhancement, no work.
- **15 trip recap:** removed from the app this round.

---

## What is worth doing in Claude Design rather than in code

My honest split. Everything else is engineering and belongs in a code
session.

| Worth drawing first | Why |
| --- | --- |
| **Item 02, empty states** | Twelve screens, and the answer is a visual system, not twelve sentences. This is exactly what artboards are for. |
| **The review screen** (item 32) | Built and working, but it is new UI with no artboard behind it. Two columns and a decision per row is my guess, not a design. |
| **Item 12's warning strips** | If a warning has to read well in three scripts, seeing it drawn in all three is the only way to know. |

| Not worth drawing | Why |
| --- | --- |
| Item 31, Firebase | Done. There was no screen: it was rules, auth and a console. |
| Item 30, trip files | Two buttons and a card, both already built. |
| Item 16, accessibility | It is testing with a screen reader, not drawing. |

---

# Round nine — the design-implementation milestone, CLOSED 6 Sep 2026

**Production commit: `4f20bbe`** (last app-code commit `5e2c8a4`).
**If you are picking this up fresh, read `docs/design/transition-audit.md` §10
first** — it is the close-out and it lists every batch, every commit and
everything deliberately left open.

## What happened

The approved UX/UI design package was implemented in nine batches. Each one:
built → tested → full regression → committed → pushed to `main` → deploy
watched to green on **both** the Hosting and Firestore-rules steps → verified
against the deployed build. Nothing was left half-done between batches.

The headline fixes, if you only read one paragraph: **Review became a
three-way diff**, so it stops offering to undo your own edits — a stop you
added is no longer presented as one they removed. **A `read` user is no longer
shown a send button that silently does nothing**, which was the oldest
confirmed gap. **The Plan's archive card rendered white on white** at 1.21:1
and is now the 7.48:1 the design intended. **A trip with no currency stopped
pretending to be priced in yen.**

## The test suite is the regression suite, and it is committed

Sixteen browser harnesses in `test/`, 485 checks, plus `two-phones.mjs` at
65/65 against real Auth and Firestore emulators. Run them all after any change
to shared code. Counts and the per-harness breakdown are in the audit's §10.2.

**Run `node --experimental-vm-modules test/guard.mjs` first, every time.** It
does the module-parse sweep AND catches the one trap that cost two debugging
rounds in this round alone:

> **A backtick inside an HTML comment inside an `html` template literal ends
> the template.** With an even number of them in one file the module still
> PARSES — `node --check` and `vm.SourceTextModule` both say it is fine — and
> the screen renders wrong or throws `html(...).x is not a function` at
> runtime, a long way from the comment that caused it. It bit four times.

Everything in "The browser harnesses" and "Testing Firebase for real" above
holds; both were rewritten when this milestone closed, so the counts and the
`test/` paths there are the current ones.

Two environment facts worth knowing before you waste an hour:

- **Chromium cannot reach the internet through the session relay** —
  `ERR_CONNECTION_RESET` on every proxy configuration, while `curl` works
  fine. To verify a deploy, pull the deployed files with `curl`, serve them
  locally, and drive those. Label that **VERIFIED FROM DEPLOYED SOURCE**, not
  "verified in production" — they are not the same claim.
- **Some states cannot be observed on a phone with no account**, because
  `nav.js` paints inside `requestAnimationFrame` while `boot()` awaits only
  microtasks, which never yield to the event loop. Where a pending frame was
  genuinely needed, the NETWORK the app really uses was slowed through
  `page.route` — never the app. P0-5 §6 forbids padding a wait to make it
  visible, and that rule was kept.

## What is open, and what is not

**Not open, and not to be reopened:** OD-6, OD-7, OD-8, OD-9 and D-1 are
answered and built; the eleven earlier decisions and the rejection list in
`implementation-readiness-map.md` §5 stand.

**Open, both deliberate and neither blocking:** `removePerson()` still has no
owner guard (mitigated in the UI by not binding the gesture for a non-owner),
and the card-level `Opening…` state cannot render without an account, which is
correct behaviour rather than a defect.

**Manual tests:** the Android install and the iOS Safari negative both PASS.
The iOS VoiceOver test on a read-only Share screen is **DEFERRED** by the
product owner as out of scope for this milestone. **Do not remove or change
any accessibility code because of that deferral** — a deferred test is not a
deferred implementation, and the `read` send block, the `aria-hidden` marker,
`aria-busy` and the five sync `aria-label`s all stay.

## The next phase is NOT this one

New UI/UX discrepancies found by using the running app go into
`docs/design/post-implementation-qa.md` — an intake and classification
backlog, with a reporting template and a rule that matters: **a screenshot is
evidence of what the app does, not authorisation to change what it should
do.** Compare against the canonical documents first; if they settle it, it is
a defect and it is fixed; if they do not, it is a question for the product
owner. Nothing in that backlog has been implemented.
