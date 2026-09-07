# Autonomous session log — 7 Sep 2026 onward

The owner stepped away mid-session and asked for the remaining work to be found, built and
verified without them. This file is the record: every decision taken without them, why, and
what would change if they disagree. It is also where anything **UNRESOLVED** is written down
rather than guessed at.

The one constraint that does not move: **the real Firestore production write is never run from
this session.** The dry run, the verification and the exact final commands are prepared; the
write is the owner's, on their own machine, with their own key.

## Build order, and whose authority it is

The owner's instruction was to respect the build order the Design canvases specify. They do,
in `Seven Decisions.dc.html` §04:

> **§3.5 → §3.2 → §3.1 → §3.3 → §3.6 → §3.7 → §3.4**

§3.5 first because it is a *dependency* — §3.7's two new controls are drawn on it, so shipping
it later means drawing it twice. §3.1 before §3.7 so the tab restructure is drawn against the
row it will actually ship with.

The `Bug Findings Design.dc.html` canvas carries its own order for its ten items — the sixteen
code bugs first (all sixteen already shipped in `d267f50` and `a0569d3`), then B2 and B4, then
B3/B1/B5, then B7, then B6/B8/B9/B10. Where the two canvases overlap, **Seven Decisions is
canonical**: the Bug Findings canvas says so itself — "Four are already answered in the
seven-decision brief … and are not repeated here" (the select, the paid box, the Add-a-stop
card, the Nearby restructure).

## Decisions taken without the owner

### 1 · The PAID field is 38px, from B7, not §3.5's 26px

The two canvases disagree, and the disagreement is substantive rather than a rounding error.
`Seven Decisions` §3.5 draws PAID at **26px / 12px**, sharing one line with the two selects, and
says out loud "both controls and the PAID field now agree". `Bug Findings` B7 draws it at
**38px / 15px** on a line of its **own**, with the estimate beside it, and argues "the money you
are typing is the one thing on this screen worth 15px".

The authority rule says §3.5 wins where they overlap. **They do not actually overlap.** §3.5's
figure describes a single-line layout; B7's describes a two-line one. The layout that already
shipped — bug 24's fix, `.paid-wrap { flex: 1 0 100% }` — is B7's: PAID claims the full width and
the selects sit above it. So B7's sizing is the spec for the layout that exists, and applying
§3.5's 26px to it would be applying a figure drawn for a different arrangement.

It is also the answer to the report. The bug was "the box is too small to read... can't visualize
how much has been entered at all", measured at an 18px sliver. 26px and 12px is barely more than
that; 38px and 15px is a number you can read while paying.

**Reversing it** is one CSS block, `.paid-input` in `app.css`, and one assertion in
`test/select-recipe.mjs`.

### 2 · The 1.5px PAID border is authored, not measured

`test/select-recipe.mjs` expects the computed border to be **1px**, not the authored 1.5px, and
proves why in the same render: a bare `border: 1.5px` div computes to 1px too. Chrome floors
fractional borders. 1.5px stays in the stylesheet because it is the app's own precedent
(`.btn-dashed`, `.plan-card.sub`, the sheet-class ink border) and because Safari — the actual
target, an iPhone 13 — paints it. The test asserts the app and a bare div agree, so a real
override would still be caught.

### 3 · The street on a nearby card comes from OSM's structured address, not from the flat string

B4 asks the card's second line to carry "the street — the useful half of the address, which is
*where* rather than which postcode", and its example turns

    Part of Lot 2219, Section 1, Jalan Raja Uda, Taman Tanjung Aman, 12300 Butterworth, Penang

into `Jalan Raja Uda`. That is the **third** comma-segment. Picking the third segment of an
arbitrary address is exactly the guess that made the original bug wrong — plenty of addresses put
the street first, or second, or nowhere.

So `placeDetails` asks Nominatim for `addressdetails=1` and reads `address.road` (with
`pedestrian` / `footway` / `residential` as the other things OSM files an actual named way under).
The street is then either **known** or **absent**, and absent renders as nothing rather than as a
suburb wearing a street's slot.

**Consequence to know about:** in this sandbox OpenStreetMap is unreachable, so `street` is null
on every place created here and the second line reads `Food · 5 min away`. That is the designed
fallback and the test asserts it explicitly. On a real device with a network, the street appears.
The Nominatim response shape for `addressdetails=1` could not be verified live from here.

### 4 · The Edit chip lands on the Nearby TAB only, not on the fuller Nearby screen

B4 draws the Edit chip on a nearby card. There are two renderers for nearby cards: `dest.js`'s
Nearby tab, and `nearby.js`'s fuller screen. The chip is on the first.

`nearby.js` has no sheet infrastructure at all — no scrim, no modal, no sheet state — and §3.7
rebuilds that entire screen (the dock goes, the `+`/`✓` goes, `Sort` goes, the card gains a
sub-route select). Adding a facts sheet to it now means building it twice, and B4's own drawing
places the chip beside §3.7's sub-route select, which does not exist yet.

Both renderers DO get the split name, the ellipsis and the street — those are cheap and belong
everywhere. **§3.7 must carry the Edit chip onto the fuller screen's card**; it is written into
that task so it cannot be lost.

### 5 · "Let it go" asks once before it deletes

B10 says "Let it go removes the card", and drawn as one ghost tap. The card **directly above that
button** lists the shopping list, the packing list and the Log under the heading "Still yours,
untouched". A single ghost tap that deletes all three, seconds after the app promised they were
safe, is the kind of thing the rest of this product is careful never to do — and unlike everything
else destructive here, a deleted trip has no undo (`deleteTrip` does not go through
`removeWithUndo`).

So it takes the app's own second-tap shape — the one the swipe confirm and the empty-trip gate both
use — and the ask names the three things by name. Rust on tint, never a filled rust button, per B6's
own rule. One extra tap; B10's requirement that **the notice ends either way** is met in full, which
was the actual reported bug ("it shows every time I re-enter the app").

### 6 · `join.js`'s "Ask <owner> for a new link" stays

D3's wording is absolute — "nothing in the app composes a sentence on the traveller's behalf any
more" — and B9 applies it to the share screen, which is what was reported.

There is a **second** composed sentence, on the expired-link screen: "Could you send me a new link
for <trip>?", copied to the clipboard. It is left alone. Design never drew that screen, it is not
the reported feature, and deleting it would leave a screen whose whole subject is "your link no
longer works" with no action at all. Flagged rather than swept up.

### 7 · `role="button"` cards had no keyboard at all, and now do

B5 needed the sub-route card to hold a button, which means it cannot BE a button — so it became
`role="button" tabindex="0"`, matching `.plan-card` beside it.

Auditing that first turned up something worse than the change: **there was no keydown handler
anywhere in `web/js`.** `.plan-card` has been focusable and announced as a button and inert on
Enter for as long as it has existed. Rather than widen that silently, `util.js` gained
`bindRoleButtons()` — bound once on the document, because `nav.js` replaces the screen host on
every paint — and `test/accessibility.mjs` gained five checks driven by real keypresses, including
that a button INSIDE such a card does not also fire the card (Enter on the rust ✕ would otherwise
delete the loop and open it).

### 8 · §3.3's photo half has nothing to render on a stop

Reported already and worth repeating here as the finding it is: of the **43 stop-places, zero
carry an image.** The 52 image entries are on 24 must-see records and 2 nearby places.

§3.3's board A is a STOP with a photo. There is no such record and, as the data stands, there will
not be one — `images_patch.json` is keyed by stop NAME, but stop-places are synthesised by the
importer's `unifyPlaces()` and do not exist in the research JSON, so `--apply` attached each image
to whatever record already shared that name.

Both halves are built and both are gated. The deletion half is the whole win in practice (228px
back on every one of 616 records) and Design said as much. The photo half is correct and tested,
and it is what a future batch will land on — but on stops it currently shows nothing, so **the stop
hero treatment §3.3 draws will not appear until the images are attached to stop-places.** That is
an `images_patch.json` / `fetch_images.py` change, not an app one.

### 9 · The licence version is not invented

Design's credit format is `Name · CC BY-SA 4.0 · Commons`. The records store `CC BY-SA` with **no
version** — 33 of them, plus 14 `CC BY`, 3 `CC0`, 2 `public domain`.

`store.imageCredit()` prints the licence exactly as stored, so the bar reads `Name · CC BY-SA ·
Commons`. Design's "never abbreviated to CC" is honoured; adding "4.0" would be asserting a fact
about a licence nobody recorded. If the version matters for compliance it belongs in the data, and
`fetch_images.py` is where it would be captured.

### 10 · The Add-a-stop hint carries facts from both canvases, and one moved to its field

Three sentences wanted that hint slot:

- B3: `Lands on the main route, between X and Y.` — the placement rule that replaced the radios
- §3.6: `The times either side stay where they are.` — the reassurance about inserting
- B3: `Leave the end blank for the last stop of a day.`

All three at once made the hint **three lines of prose inside a docked form**, which measured 309px
and left the day exactly one whole row. So the third moved to the field it is about: the Ends label
reads `Ends · optional`. The fact is still stated, at the moment it applies, and the form came down
to 293px.

`test/provenance-derived.mjs` was retargeted to check the fact EXISTS anywhere in the form rather
than that it is in the hint — the assertion is about the fact surviving, not its address.

### 11 · A tap on the dimmed tab bar does nothing, where §3.6 says it should cancel

§3.6: "everything that is not the itinerary or the form goes to 40% and stops taking taps... A tap
on any of them cancels."

The header and both footer controls do cancel. The **tab bar does not** — it is dimmed and inert,
so a tap there does nothing.

The tab bar is a **sibling of the screen host** in `index.html`, outside anything a screen module
can render into. Making it cancel means either injecting an app-level element or wiring a custom
event from nav.js back into whichever screen has a form open, and that is more machinery than the
difference is worth. Inert-and-visibly-out-of-play is honest; it just is not also a cancel target.

The dim itself is handled properly: the state is a `body` class and **nav.js clears it on every
paint**, so it cannot survive navigating away. That is gated — a leak would show up as a
permanently grey tab bar and would otherwise be found by a user, not a test.

### 12 · Opening the form scrolls the day to the insertion point

Not in §3.6, and required by it. The section's premise is that "the three stops NEAREST THE
INSERTION POINT stay at full contrast and fully scrollable" — that is the whole reason it is not a
sheet.

Measured on the demo trip, opening the form left **one** whole row visible, because the top of the
Plan scroller is the weather banner and the edit hint, not the day. Design's artboard is centred on
the insertion point; it does not open at the top of the day and hope.

So opening the form scrolls the stop it lands after to just under the header — **once per opening**,
tracked by a flag, because `mount` runs on every paint and scrolling unconditionally would fight
the reader's own thumb. Three whole rows now sit between the header and the form, and that row
count is the assertion rather than §3.6's 232px figure, which was measured on Trip 12's Day 4 whose
rows are shorter than the demo's.

## UNRESOLVED — needs the owner

### U1 · `outfitByStop` — 33 researched records, ~1,400 characters each, never imported

Found while building §3.2. Ten research files carry an `outfitByStop` map: **33 records, keyed by
stop name**, each with a `photo` and a `practical` paragraph of 300–1,600 characters. Day 2 alone
has seven.

**Nothing imports it.** `merge.mjs` builds the `outfits` collection from `seed.outfits` only, and
`import-trip12.mjs`'s KINDS list has no path to it either. It is the same class of miss as
`stopSummary` before the Must tab and the airport batch before `unconsumedBatches` — research
written, validated, committed, and never read.

**§3.2 is NOT blocked by it.** The eight per-day records in the seed already carry
`x.suggestionPhoto` / `x.suggestionPractical`, which is exactly what §3.2 draws — Design's own
Day 2 artboard text is that record, trimmed — and all eight are in the built snapshot. §3.2 ships
complete against them.

What is unresolved is what to DO with the finer-grained 33:

- Design's §3.2 card is **per day** and shows **one** pair. The 33 are **per stop**.
- Concatenating a day's stops would put ~7,500 characters on one card, which is the wall §3.2
  exists to avoid.
- Showing only the first stop's would hide 26 of 33 records.
- The natural home is the **stop's own screen**, next to `stopSummary` — item 3's precedent
  exactly — which is §3.3/§3.7 territory and a design ask, not an implementation one.

**Not guessed at, and not swept up.** No importer change was made for it, so nothing about the
combined re-import changes. It needs either a Design section or an owner decision.

### U2 · The same outfit prose is stored twice

`days[].x.outfitPhoto` and `outfits[].x.suggestionPhoto` are **byte-identical on all eight days**,
as are the practical pair. §3.2 reads the `outfits` copy, because that is the per-day collection the
editor writes to and the one the app already had.

The `days` copy is now redundant. It is left alone: removing a field is a data change with no
benefit, and something outside this repo may read it.
