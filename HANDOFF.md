# Handoff — Travel Planner, after round six

Written 4 Sept 2026, at commit `cfb46e8` and after. Read this first if you
are picking the work up in a new session.

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

There are seven, each a standalone Playwright script that prints a PASS/FAIL
list. They are the regression suite; run them all after any change that
touches shared code. They are **not committed** — they live in the session
scratchpad. If you are starting fresh, write new ones rather than hunting for
these; the pattern is:

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

## The shape of the code

| File | What it owns |
| --- | --- |
| `js/store.js` | The single source of truth. ~3,300 lines. Everything derived lives here; screens only render and call mutations. |
| `js/persist.js` | Two backends behind one interface: Firestore, or localStorage. `KINDS` is the list of collections. |
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
Three kinds travel (itinerary + sub routes, places, must-see); four never do
(`shopping`, `prep`, `log`, `outfits`) and `share.js` names both sets so the
promise is checkable. A role is about *publishing*, not permission.

---

## What is still open

Numbers match `DESIGN_REVIEW.html`.

### Item 31 — stand up Firebase properly ← **the user has said yes to this**

The decision is made: a real account, and **a new account starts with no
trips** until one is created or shared in. What is needed:

1. Firebase Auth with Google and email (Apple needs an Apple Developer
   account — confirm before promising it). `js/persist.js` currently does
   anonymous sign-in only.
2. Firestore rules keyed on the signed-in uid, plus a **second collection for
   published snapshots** keyed by link code, readable by anyone holding the
   code and writable only by the trip's owner and editors. The store already
   reads and writes that envelope through `readPublished` / `writePublished`
   in `js/store.js` — swap those two functions and nothing above them changes.
3. `signIn()` in the store already migrates the anonymous identity by keeping
   its id. Keep that: every note and role points at it.
4. Boot currently seeds the demo trip when there is nothing. Change so a
   signed-in account with no trips gets an **empty** trips home, and the demo
   only appears for a phone that has never signed in.

The console steps are the user's to do and cannot be verified from a sandbox.
Write the code, update `WEB_APP_GUIDE.md`, and hand them the console steps.

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
| Item 31, Firebase | There is no screen. It is rules, auth and a console. |
| Item 30, trip files | Two buttons and a card, both already built. |
| Item 16, accessibility | It is testing with a screen reader, not drawing. |
