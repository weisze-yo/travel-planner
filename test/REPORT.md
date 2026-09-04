# Test report — round nine

Tested against commit `17475d4`. Another session is landing empty-state work on
`web/js/screens/*` and `web/css/app.css` in parallel; `main` will have moved by
the time this is read. Nothing below is about empty states — that is out of
scope for this pass by request.

Machine test: `test/two-phones.mjs` — **36/36 pass**, unchanged. Every module
in `web/js` still parses. Both confirmed before anything else below.

## Already known (confirmed, not re-explored)

1. **The owner is never told anyone joined.** `joinTrip` (`web/js/store.js:3563`)
   writes the joiner into the *new copy's own* `people` array only (line 3588);
   nothing ever writes back to the owner's `trip.people`. Reproduced live with
   two real Firestore-backed phones: after B joined and B's copy correctly
   showed `owner-ux` and `You`, A's own Share screen still listed only
   `owner-ux · OWNER` — no trace of B.
2. **`link.opens` is a dead number.** Set to `0` once at `store.js:3309` and
   never incremented anywhere in the codebase (checked). Reproduced live: after
   B actually opened the link and joined, A's Share screen still read
   "opened 0 times".

## Broken

### 1. Reloading the app forgets what day you were on — and not to "today"
**Steps:** Open Plan, jump to Day 5, reload the page (or just relaunch).
**Expected:** Land back on Day 5, or at worst on today's real day.
**Actual:** Lands on Day 3 (the demo trip) — every time, regardless of which
day you were on.
**Where:** `store.js:252`, `state.selectedDay = state.trip?.currentDay || 3`,
runs unconditionally on every `boot()`. `currentDay` is a plain field, written
exactly once, at `store.js:706` inside `createTrip()`, to a hardcoded `1`, and
never updated anywhere else in the file (only one write site exists). For a
trip you make yourself, this means **every reload drops you back to Day 1**,
even on the last day of the trip. It is not "today" in any sense — it is
whatever `currentDay` happened to be set to once, at creation.

### 2. "What to wear" never changes, and actively contradicts the forecast above it
**Steps:** Open Prep. Note the forecast in the card header. Switch days.
**Expected:** The clothing suggestion reflects that day's real weather, the
way the header line right above it does.
**Actual:** The header (`wx.high`/`wx.summary`) is correctly dynamic — Day 1
shows "21 °C, clear", Day 4 shows "14 °C, rain" — but the paragraph directly
underneath it is the constant `OUTFIT_SUGGESTION` from `data.js:191`
("16 °C and overcast on this day…"), verbatim, on every single day. On a day
the forecast says 80% rain, the app is telling you to bring "flat shoes" for
a market with "wet aisles" because that string happens to mention rain, not
because it knows it is raining — it is the same sentence on a clear day too.
**Where:** `web/js/screens/prep.js`, `outfitCard()` — reads `store.weather()`
correctly for the header line, then renders `OUTFIT_SUGGESTION` /
`OUTFIT_SUGGESTION_CHIPS` (`data.js:191-192`), which are constants, not
functions of `wx`.

### 3. "Departs in N days" is also a frozen constant
**Steps:** Create a brand new trip with a start date months out. Open Prep.
**Expected:** A countdown computed from today's date and the trip's start
date — the app already has this logic (`tripDayGap()`, `store.js:556`, used
correctly on the Trips home for "TOMORROW" / "IN 14 DAYS").
**Actual:** `departsInDays` is copied wholesale from the demo seed
(`data.js:24`, hardcoded `11`) by `createTrip()`'s spread of `seed.TRIP`, and
nothing ever recomputes it. A trip leaving in 67 days says "departs in 11
days" on day one and never updates. Verified live for a trip created for
2026-11-10.

### 4. A brand-new trip defaults to Yen, a Tokyo exchange rate, and Tokyo's map — regardless of where you are actually going
**Steps:** Trips home → + New trip → name it, set a city ("Paris"), dates,
days → Create.
**Expected:** Either the currency/centre are left unset until you land
somewhere that can infer them, or the city you just typed drives them.
**Actual:** Live-verified: a trip named "Paris Weekend", city "Paris",
starting 2026-11-10, comes back with `currencySymbol: "¥"`,
`currencyCode: "JPY"`, `homeCurrencyRate: 33.7`, and `latitude/longitude`
sitting on Tokyo (35.68, 139.70). None of the new-trip form's four fields
(name, city, start date, days) ever touch currency — it is inherited
unconditionally from `seed.TRIP` in `createTrip()` (`store.js:694-712`), which
only overrides `id`, `name`, `dateRange`, `dayCount`, `currentDay`,
`startDate`, `locationName`, `weather`. If geocoding the typed city fails —
which the code openly expects (`store.js:714-722`, `catch { /* keep the
default centre */ }`) — the trip is silently left centred on Tokyo with zero
indication to the user that the lookup didn't work. Every shopping estimate
and every distance/travel-time calculation is silently wrong from the first
stop you add until someone thinks to go into Trip settings and fix it by
hand.

### 5. A joined trip's currency and map centre don't come from the shared trip at all
**Steps:** Owner shares a trip (any currency, any city). A phone that has
never made a trip of its own opens the link and joins.
**Expected:** The joined copy uses the shared trip's currency and location —
or at least asks.
**Actual:** `shareSnapshot()` (`store.js:3269-3285`) — the envelope that
actually crosses to the other phone — carries `tripName`, `dateRange`,
`dayCount`, `startDate`, `days`, `subRoutes`, `places`, `mustSee`. It does
**not** carry `currencySymbol`, `currencyCode`, `homeCurrencyRate`,
`latitude`, `longitude`, or `locationName`. `joinTrip()` (`store.js:3563-3610`)
spreads `state.trip || seed.TRIP` for everything it doesn't explicitly
override, so those fields come from whatever trip happened to be open
locally at the moment of joining — for a fresh phone, the untouched demo
trip. Live-verified with two real accounts on the Firestore emulator: a joiner
who had never opened the app before ended up with the demo's ¥/JPY/33.7/Tokyo
values on a supposedly-shared "Fuji Loop" trip, purely by coincidence of both
trips inheriting the same seed defaults (finding 4). Share a trip to Bangkok
with someone whose phone last had a Yen trip open, and their copy will show
Yen prices at a Tokyo rate for a Thailand trip, with no correction path
except manually noticing and fixing it in Trip settings.

### 6. Deleting a sub route breaks the app's own stated delete rule
**Steps:** Open a sub route → pencil (edit) → "Delete this sub route".
**Expected:** The rule that holds everywhere else in this app: swipe left to
a red dustbin, confirm in the row. (`HANDOFF.md`, `test/COVERAGE.md`: "Delete
is always swipe-left to a red dustbin with a confirmation.")
**Actual:** It's a plain button (`sub.js`, `data-act="delete-loop"`, not
inside a `.swipe-row`) wired to a native `window.confirm()` popup
(`sub.js:262-267`) — the one browser-chrome dialog box in an app that
otherwise never shows one. It looks and behaves like nothing else in the
product. (The 6-second undo still fires afterwards — `deleteSubRoute` does
call `removeWithUndo` — so at least that part is intact.)

## Confusing

### 1. A joiner's own Share screen is indistinguishable from the owner's — but it's a second, disconnected share
Opening "Share" from a joined/forked trip shows the exact same layout as the
real owner's screen: "Who has it" lists the real owner and you, then "They
will be able to" / expiry / "Create the link" offers to publish a brand-new
link. Live-verified: a read-role joiner ("Receives updates") on a forked
"Fuji Loop" trip sees a fully working "Create the link" flow with no
indication that a link made here starts an entirely separate, second-
generation share rooted at *their possibly-stale fork*, not at the original
trip. Someone the joiner invites this way joins a copy of a copy, frozen at
whatever version the joiner last took — and nothing on screen says so. A
person looking at this screen cannot tell "is this showing my relationship to
the person who shared with me" from "am I about to start sharing my own
copy with someone else."

### 2. The role/expiry choice and the button that uses it are in different cards
On the empty-link Share screen, "They will be able to" (role) and "Link stops
working after" (expiry) sit in their own section, separated by a green
explainer card, from "The link" section with the actual "Create the link"
button below it. It reads like three settings rather than step 1/2/3 of one
action — easy to tap a role, tap an expiry chip, and not realise nothing has
happened yet until you scroll further and find the button.

### 3. "+ Add someone" doesn't add anyone
On a trip that's already shared, the dashed "+ Add someone" button under
"Who has it" doesn't open a form — it just shows a one-line notice to resend
the same link, joining as whatever role the link already grants. Reasonable
once you know it, but the label promises a per-person invite that doesn't
exist.

### 4. Destination tabs remember the wrong thing
`dest.js`'s Info/Nearby/Must-see/Shop/Notes selection is one module-level
variable (`dest.js:24`), not scoped to the stop you're looking at.
Live-verified: switch a stop's tab to "Must-see", then open a completely
different stop from the Map — it opens on "Must-see" too, even though that
stop may have nothing there. A small thing, but it means the tab you land on
depends on invisible history rather than on the place in front of you.

### 5. "Receives updates" quietly means "can edit everything, just can't publish it"
The role picker's copy is accurate if you read it closely ("Receives updates:
gets updates and can do whatever they like to their own copy") but the
internal names are `read`/`edit`, and nothing on the Share screen itself
repeats what the join screen says up front. Live-verified: a "Receives
updates" joiner has the identical Plan pencil, and pressing it enters full
edit mode on their own copy — which is correct by design, but "receives
updates" reads like "read-only" to anyone who hasn't just read the join
screen's fine print.

## Missing

- **No confirmation loop for the owner, at all.** Between findings "Already
  known" #1 and #2, there is currently no signal reaching the owner's phone
  that a link has ever been opened, joined, or is being used by anyone. The
  Share screen's own copy ("Who has it") is the natural place for this and
  currently cannot say anything true there beyond the owner's own name.
- **No warning when a new trip's location can't be found.** Geocoding failure
  is an anticipated code path (`store.js:714-722`) with no user-facing
  message at all — see Broken #4.
- **A real days-until-departure figure**, despite the trip model already
  having the maths for it (`tripDayGap`, used correctly elsewhere) — see
  Broken #3.
- **Item 12's own stated gap, reconfirmed:** pasting a Chinese itinerary
  (`第三天 – 3月14日 星期六`, `下午3:00`) parses correctly — day number, the
  Chinese date label, and the 24h conversion of "下午3:00" to 15:00 all land
  right, and every stop name renders in Chinese with no layout breakage
  anywhere I drove it (trip name, stop name, dest hero, shop item, prep item —
  all checked with a 35-character CJK string, none overflow). The one part
  that is still English, exactly as `HANDOFF.md` already says: every
  generated warning sentence ("End time guessed — the line only gave a
  start", "Keep 1h", "and the rest below it"). Not new, but now verified with
  a real mixed-script paste rather than taken on faith.

## Ranked

1. **Broken #5 (joined trip's currency/coords come from nowhere real)** —
   fix first. It silently corrupts every money figure and every map view on
   the one screen this app exists to get right: a shared trip. It's also the
   root cause that makes #4 look "consistent" by coincidence in testing, which
   would otherwise have hidden it longer.
2. **Broken #4 (new trip defaults to Yen/Tokyo with no signal)** — same class
   of bug, same fix shape (stop inheriting `seed.TRIP`'s incidental fields;
   ask or leave unset instead of silently keeping a foreign default).
   Fix alongside #5; they're one underlying mistake in two call sites.
3. **Broken #1 (day resets to 1 on every reload)** — hits everyone, every
   session, immediately, on any trip that isn't the demo. Cheap fix
   (`currentDay` needs either removing in favour of `tripDayGap` or updating
   on `selectDay`), disproportionate daily annoyance.
4. **Already-known #1 and #2 (owner never told, opens dead)** — not new, but
   they compound directly with Missing's "no confirmation loop" into a
   feature that currently gives the owner no evidence sharing is working at
   all. Worth doing together with Confusing #1, since all three are "the
   owner/joiner can't tell what state the share is in."
5. **Confusing #1 (joiner's Share screen looks like the owner's)** — a
   correctness-adjacent trust problem: someone could genuinely re-share a
   stale fork believing they're extending the original.
6. **Broken #6 (sub route delete breaks the swipe rule)** — small blast
   radius, but it's a standing rule with one silent exception, and the
   exception is the ugliest-looking moment in the app (a native browser
   dialog).
7. **Broken #2 and #3 (Prep's outfit text and days-until-departure are
   frozen)** — cosmetic-adjacent but the app is confidently wrong on a screen
   whose whole job is to be useful right before a trip; also cheap, isolated
   fixes.
8. **Confusing #2, #3, #5** — copy/layout polish. Worth a pass but nothing
   here loses data or misleads about money or location.
9. **Confusing #4 (dest tab stickiness)** — smallest, do last or skip.
