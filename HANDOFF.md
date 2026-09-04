# Handoff — Travel Planner, after round eight

Written 4 Sept 2026. Read this first if you are picking the work up in a new
session.

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

There are five as of round eight (91 checks), each a standalone script that
prints a PASS/FAIL list. They are
the regression suite; run them all after any change that touches shared code.
They are **not committed** — they live in the session scratchpad. If you are
starting fresh, write new ones rather than hunting for these; the pattern is:

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

Round eight added two more pieces of rigging, both worth rebuilding rather than
skipping, because without them Firebase can only be eyeballed:

- **The rules run for real.** `npm i firebase-tools @firebase/rules-unit-testing
  firebase` in the scratchpad, then `firebase --project demo-travel
  emulators:exec --only firestore "node test.mjs"`. The emulator jar downloads
  once. Twenty-six assertions live there and they are the only proof the rules
  say what the comments claim. Ignore the emulator's "evaluation error" log
  lines on deny paths: it evaluates once before loading the document and once
  after, and the first pass cannot see `resource.data`.
- **A fake Firebase SDK**, served in place of every
  `gstatic.com/firebasejs/*` module by `ctx.route`, backed by a tiny HTTP
  document store so **two browser contexts can share one envelope**. That is
  the only way to test the thing item 31 is about. Two traps in writing one:
  give it Firestore's latency compensation (a poll must not hand back a value
  older than a write the app has just made, and a read that *straddles* a write
  must be thrown away), or you will chase a phantom race in the app for an hour;
  and serve the app so `/j/CODE` returns `index.html`, the way Hosting's rewrite
  does — `http-server` will not do that and pointing its `--proxy` at itself
  loops.

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
