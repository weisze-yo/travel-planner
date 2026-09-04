# What to run next

Four sessions, in this order. 1 and 2 touch `web/js/store.js` around sharing;
run them one at a time, not in parallel, or they'll conflict on the same
functions. 3 has no meaningful overlap with 1/2 and can run in parallel with
either if you want the throughput; 4 depends on 2 having landed (it edits
`share.js` again) so run it last.

By the time any of these run, the empty-states session's work is on `main` —
in `web/js/screens/*.js` and `web/css/app.css`. None of the four prompts below
ask for changes to empty states. If a screen you're touching also got new
empty-state markup, work around it, not through it: keep it, don't redesign
it, don't remove it to make your diff simpler.

Every session: pull `main` first, read `test/REPORT.md` and `test/COVERAGE.md`
for context, and finish by running `test/two-phones.mjs` (36 checks) and
`test/refused-rules.mjs` before calling it done — sharing changes especially
must not drop below 36/36. Commit and push per the repo's own rules in
`HANDOFF.md`; verify in a real browser before saying it's done.

---

## Session 1 — a shared or new trip should not silently become someone else's currency and city

**Attach:** this repo. Read `test/REPORT.md` Broken #4 and #5 first — they are
one underlying mistake in two call sites, not two separate bugs.

**The problem:** `createTrip()` in `web/js/store.js` spreads `seed.TRIP`
(the demo's Tokyo/Yen/33.7 data) and only overrides `id`, `name`, `dateRange`,
`dayCount`, `currentDay`, `startDate`, `locationName`, `weather`. Everything
else — `currencySymbol`, `currencyCode`, `homeCurrencyRate`, `latitude`,
`longitude` — rides along from the demo trip regardless of what the user
typed into "City or area". Separately, `shareSnapshot()` never includes
currency or coordinates at all, so `joinTrip()`'s equivalent spread of
`state.trip || seed.TRIP` pulls those fields from whatever trip happens to be
open locally when someone joins — not from the trip they're joining.

**What to fix:**
- A new trip's currency should not default to Yen when the city is, say,
  Paris or Chicago. Decide and implement a sensible source: OpenStreetMap's
  Nominatim reverse-geocode result already used for places carries a country;
  a `country → currency` table is small and keyless (no paid API needed —
  keep the no-paid-APIs rule). If geocoding the typed city fails outright,
  say so on screen (a line under "City or area", not a silent Tokyo fallback)
  rather than pretending the location is known.
- `shareSnapshot()` (`web/js/share.js` owns the *rules* of what travels —
  read its header comment before changing anything) needs to decide whether
  currency/coordinates/locationName belong in the three kinds that already
  travel, or are a fourth thing. They are not shopping/prep/log/outfits, so
  the existing "four kinds never travel" promise is not violated either way —
  but `share.js` names both sets explicitly and whatever you do needs to keep
  matching what it asserts. Once decided, `joinTrip()` should read them off
  the snapshot, not off whatever trip happened to be sitting in `state.trip`.
- Do not touch `hotelName`/`stationName` — they're dead fields (grep confirms
  nothing reads them outside `data.js`); out of scope, leave them.

**Verify:** extend `test/two-phones.mjs` (or add a case) so a trip made with a
real city and currency actually arrives on the joining phone with that
currency and a map centred near that city, not Tokyo's. Also hand-test: create
a trip named "Reykjavik Weekend", city "Reykjavik" — currency should not be
¥/JPY/33.7 afterward.

---

## Session 2 — the owner currently has no way to tell a share is working

**Attach:** this repo, including `firebase/firestore.rules`. Read
`test/REPORT.md`'s "Already known" #1 and #2, and Confusing #1.

**The problem:** three things compound into "the owner has zero feedback that
sharing does anything":
1. `joinTrip()` writes the joiner into their *own* new trip's `people` only —
   never into the owner's `trip.people` (`store.js:3563-3609`).
2. `link.opens` is set to `0` once and never incremented anywhere.
3. A joiner's own Share screen reuses the owner's exact layout with no
   indication that creating a link there starts a second, disconnected share
   rooted at their own fork (Confusing #1) — related, because once the owner
   can actually see who joined, the screen also needs to be honest that a
   second-generation share is a different thing.

**What to fix:**
- Get the owner's `trip.people` updated when someone joins. This is a write
  across an ownership boundary (a guest's phone writing into the owner's
  document), so it needs a security-rules change, not just a store.js change
  — `firebase/firestore.rules` already lets an editor write into
  `published/{code}` (see `claimEditor`/`restateTerms` for the existing
  pattern of a guest updating a doc they don't own); the new write needs the
  same care. Write the real rules-unit test for it (the existing 26
  assertions in the emulator test are "the only proof the rules say what the
  comments claim" — extend them, don't skip them).
- Increment `link.opens` on a real open — decide whether "open" means "viewed
  the invite" or "joined" (the current UI copy says "opened N times", so
  probably every real view, deduped somehow so refreshing the same tab
  doesn't inflate it — use your judgement and say what you chose).
- Once the owner's Share screen can show real joiners, revisit Confusing #1:
  give a joiner's own Share screen something that distinguishes "this is my
  relationship to the trip I was given" from "I am about to publish my own
  link" — at minimum a line of copy; a full redesign of that screen is not
  asked for here.

**Verify:** run `test/two-phones.mjs` and confirm a new assertion that A's
Share screen lists B after B joins, and that `link.opens` is nonzero after B
opens the link. Run `test/refused-rules.mjs` too — a rules change here is
exactly the kind of thing that can accidentally make sharing refuse
everything.

---

## Session 3 — Prep's numbers are frozen, not computed

**Attach:** this repo. Read Broken #1, #2, #3 in `test/REPORT.md`. No sharing
or rules work here — this is `web/js/store.js`, `web/js/screens/prep.js`,
`web/js/data.js` only.

**What to fix:**
- `state.selectedDay = state.trip?.currentDay || 3` (`store.js:252`) resets
  the viewed day to a static field on every boot. Either stop using
  `currentDay` for this and compute it the way `tripDayGap()` already does
  for the Trips home ("today" for a running trip), or persist the
  last-viewed day per trip and restore that instead. Either is defensible;
  picking neither and leaving it as-is is not — reloading mid-trip currently
  loses your place every time.
- `departsInDays` (`data.js:24`, and carried through by `createTrip`) is
  never recomputed. `tripDayGap(trip)` (`store.js:556`) already does this
  calculation correctly and is already used correctly elsewhere (the Trips
  home's "IN 14 DAYS" chip). Wire Prep's header to it instead of the frozen
  field.
- `OUTFIT_SUGGESTION` / `OUTFIT_SUGGESTION_CHIPS` (`data.js:191-192`) are not
  just static — they're demo flavour text about a specific market
  ("the aisles are wet near the fish stalls") dressed up to look like
  generated advice. This is a content decision, not a one-line wire-up:
  either write a small rule-based generator (temperature band → layer,
  rain % → footwear/umbrella, wind if you have it) that produces a real
  sentence per day, or drop the invented-specificity ("the market is grey
  stone and steel") in favour of something that stays true when it's not
  about a market at all. Don't just splice `wx.high`/`wx.summary` into the
  existing sentence and call it done — read what it currently says on a
  rainy day first.

**Verify:** switch through all six demo days on Prep and Plan after a reload
mid-trip; the suggestion text and the departure countdown should visibly
track the day/date shown, not repeat the same line every time.

---

## Session 4 — the one delete that doesn't match the rest of the app, and three small share-screen confusions

**Attach:** this repo. Run after Session 2 has landed (this touches
`share.js` again). Read Confusing #2, #3, #4, #5 and Broken #6.

**What to fix:**
- `web/js/screens/sub.js`: "Delete this sub route" is a plain button behind
  `window.confirm()` (around line 211 for the button, 259-267 for the
  handler) — the one place in the app that isn't swipe-left-to-a-red-dustbin.
  Bring it in line with `swipeToDelete` in `parts.js`, the same pattern every
  other list in the app uses. `deleteSubRoute` already registers the 6-second
  undo correctly — don't touch that part.
- `web/js/screens/share.js`: the role/expiry pickers (`offer()`) and the
  "Create the link" button they feed are in visually separate cards with a
  green explainer between them. Tighten this into one clear sequence, or at
  least make it obvious the picks above feed the button below.
- Same file: "+ Add someone" currently just shows a notice to resend the
  existing link. Either make the button say that plainly ("Resend the link"),
  or build the per-person invite the current label implies — your call, but
  don't leave the label promising something the button doesn't do.
- `web/js/screens/dest.js`: the tab selection (`let tab = 'info'` near the
  top of the file) is module-level, so it carries over when you open a
  different stop entirely. Scope it to the stop/place being viewed, or
  reset it to `'info'` on a genuinely different subject.

**Verify:** delete a sub route and confirm it looks and behaves like deleting
anything else in the app (swipe, in-row confirm, undo bar). Open two
different stops in a row and confirm the tab resets sensibly.
