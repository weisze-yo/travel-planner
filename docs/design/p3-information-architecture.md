# P3 — Information architecture: Home, the trip, and the four tabs

**Date:** 29 Sep 2026 · **Verified against** the working tree on `claude/intelligent-pasteur-ebuo53`, read this session
**Status:** design, approved in conversation 28–29 Sep 2026. **Nothing implemented. No application code changed.**
**Artboard:** *Harbour Garden*, revision 5 — Home, Today, Map, Plan, Pocket hub, Must, Money, Phrases, plus the desktop layout and a working light/dark toggle.
**Canonical:** this document for the navigation shape, the colour contract and the responsive contract. The other five P3 documents hang off it and may not contradict it.

**Source read this session:** `src/nav.js` (`TABS` 19–23, `start` 30, `paintTabs` 163–177, the `chrome === false` branch 127–129) · `src/persist.js` `KINDS` 23 · `src/share.js` `SHARED_KINDS` 69, `PRIVATE_KINDS` 72 · `src/data.js` `CATEGORY_LABELS` 253, `SHOP_CATEGORIES` 292, the clash note 441–452 · `src/store.js` `people` (2844, 4623, 5098–5120, 5179), `spendTotals` 2441 · `src/screens/*.js` (file list) · `web/sw.js` `ASSETS` 30–81 · `CLAUDE.md`.

**Fixed foundations, not reopened:** every stop is a place · a stop holds two clock times, never a start plus a duration · free time is a lane between stops, not a row · delete is swipe-left → in-row confirm → 6s undo, with exactly two confirm-button exceptions · sharing is snapshot-and-review, not live sync · it must work offline · no paid APIs · the permanent rejection list in `implementation-readiness-map.md` §5.

**Out of scope, deliberately:** the contents of each feature area, which are the other five documents · the data model, which is Phase 2 · anything in `TravelPlanner.swiftpm/`.

---

## 1. What the app's navigation already is

Read in source rather than remembered, because two of the four things everybody "knows" about it are wrong.

| Common claim | Verified in source | Verdict |
|---|---|---|
| "The app has five tabs: Map, Plan, Shop, Prep, Log" | `nav.js:19–23`. Exactly that, in that order. | **Right.** |
| "The tab bar is always on screen" | `nav.js:163–167` — `paintTabs` sets `tabbar.hidden = true` and empties it whenever there is no active trip. The comment above it already says *"The five tabs only mean something inside a trip."* | **Wrong, and in our favour.** Half of the change this document asks for is already built. |
| "A screen can opt out of the tab bar" | `nav.js:127–129` and 102. `screen.chrome === false` paints no tab, and the tab bar is a *sibling* of the screen host so a screen cannot draw over it. | **Right**, and it is the hook Home needs. |
| "There is a Today screen" | There is not. `map` is the default (`initial = 'map'`, `nav.js:30`). The nearest thing to "now" is the warning strip and the leave-now rules in `remind.js`. | **Wrong. Today does not exist yet** and is the single largest new surface in this plan. |

So the navigation work is **one new screen, one removed tab, one renamed tab, and a hub** — not a rebuild.

---

## 2. The problem this document solves

Three things are true at once, and together they are why the app feels like a set of screens rather than a product.

**2.1 · Home has no identity.** With no active trip the tab bar hides, which is correct, but what remains is `screens/trips.js` wearing the same chrome as everything else. The first thing a stranger sees is a fictional demo city. The market review named "the first five minutes" as one of the app's two clear losses; this is where it happens.

**2.2 · Three of the five tabs are reference material, not places.** Shop, Prep and Log are things you *consult*. Map and Plan are things you *navigate*. Giving all five equal weight means the two that carry the trip get one fifth of the bar each, and it is why adding Money, Phrases and Must had nowhere to go — the bar was already at its documented ceiling (`src/search.js` records why six does not fit at 375px).

**2.3 · Nothing distinguishes "the tour booked this" from "somebody holds a reservation for this".** The app has one visual language for the plan. A KTX seat with a reference number and a coach transfer the tour arranged look identical, and only one of them can be shown at a counter.

---

## 3. Decision: two shells, not one

> **Home is a place for choosing a trip. Inside a trip is a place for living one. They do not share a chrome.**

| | Home | Inside a trip |
|---|---|---|
| Tab bar | **none** | four tabs |
| Header | `Your trips` + settings gear | trip name + day count + back arrow |
| Content | trip cards, `+ Start a trip`, paste/import affordances | the four tabs |
| Entered by | app launch with no active trip; back arrow from a trip | tapping a trip card |

**D-1. Home renders with `chrome: false`.** The mechanism exists (`nav.js:127`); nothing new is needed but the screen itself. `screens/trips.js` becomes the Home screen and gains the settings gear.

**D-2. The trip name lives in a header inside the trip, with a back arrow, on every tab.** Not in the tab bar and not only on one tab. With Home separated out, "which trip am I in" and "how do I get out" are asked on every screen, and one line answers both. The day count sits on the same line, because the header is also where "Day 4 of 6" belongs once Today exists.

**D-3. Closing a trip goes back to Home rather than to an empty trip shell.** Today `closeTrip()` clears the active-trip key and the tab bar hides; the destination was never designed. It is Home.

---

## 4. Decision: four tabs

> **Today · Plan · Map · Pocket.**

**D-4. `Log` stops being a tab.** It is reference material — photos and notes you consult — and it never answered "where do I go next". It moves into Pocket. This is what takes the bar from five to four and makes the whole rest of this document affordable.

**D-5. `Shop` and `Prep` stop being tabs** and become entries in Pocket alongside Log, Money, Phrases, Must and Docs.

**D-6. `Today` is added, and is the default screen inside a trip.** `initial` changes from `map` to `today`. A traveller opening the app mid-trip wants the next hour, not a map of the whole country.

**D-7. `Map` and `Plan` keep their tabs, with sharpened jobs** (§5).

**D-8. Gather does not get a tab.** It lives on Today, second, directly under the free-time figure. Reasoning in `p3-people-and-coordination.md` §2; recorded here because it is the decision that keeps the bar at four.

**D-9. Only the selected tab shows its label.** Icons at the same stroke weight as the illustrations; the current tab captions itself. Ambiguous in week one, quiet from week two. The existing `.tab-label` span (`nav.js:174`) already renders per-tab, so this is a CSS change.

### 4.1 What each tab owns, and what it may not do

| Tab | Owns | May not |
|---|---|---|
| **Today** | now: free time remaining, the next stop, Gather, the weather line, emergency | edit the plan; show days other than today |
| **Plan** | the day as an editable timeline; adding stops, bookings, notes; the day's sub-tabs (Plan/Transport/Stay/Flights) | be the only way to see the whole trip |
| **Map** | the whole trip at once: route, stops, transport legs, Must pins, "keep this area" | edit times or order |
| **Pocket** | everything you consult: Money, Phrases, Must, Log, Packing, Docs | contain anything that belongs on a day |

---

## 5. Decision: Map is the overview, Plan is the editor

Approved in conversation, 29 Sep. Written here because it settles a question the coverage matrix has carried open since P1.

**D-10. Map shows the whole trip, not one day.** Every day's route end to end, so the shape of the trip is visible in one look. Numbered circles are day stops; the current day's circle is pink and larger.

**D-11. The route is drawn in three colours, with no legend.**

| Stroke | Means |
|---|---|
| Green, solid | the tour moves you — a coach transfer, a walking leg the itinerary sets |
| Blue, dashed | somebody holds a booking reference for this leg |
| Pink, dotted | you went there in your own free time |

The same three meanings as the Plan's rows (§7), so the two screens teach each other.

**D-12. Must places appear on Map as hollow rings**, filterable by the four families. Nothing else in the app can answer "what is near me that I saved", which is the app's other documented loss.

**D-13. Map and Plan open the same place card.** Tapping a pin and tapping a row produce one sheet with one set of actions. Two ways in, one thing to learn. This is a hard constraint on both feature documents.

**D-14. "Keep this area" lives on Map.** It is the only screen that genuinely wants the network, so the offline download belongs where the need is felt rather than in settings. `src/tiles.js` already implements it; only its entry point moves.

**D-15. Plan is where editing happens, and the only place.** Times, order, adding a stop or a booking or a note. Map has no edit affordance at all — a drag on Map is a pan, always.

---

## 6. Decision: Pocket is a hub, then chips

Pocket holds six things: **Money · Phrases · Must · Log · Packing · Docs.**

**D-16. Six chips do not fit on one row at 390px, so Pocket opens as a hub of six tiles.** Two columns, each tile carrying its own live state — `₩186,400 today · Ravi owes you`, `22 of 26 ticked`, `61 found`. A hub whose tiles are worth reading is a screen; a hub that is only a menu is a tax.

**D-17. Once inside one, the chip row replaces the hub.** Four chips fit at 390px; the other two scroll. The hub is reachable by the back arrow, which at that point reads `Pocket` rather than the trip name.

**D-18. Nothing nests deeper than hub → section.** Two taps from the tab bar to anything in Pocket, and a seventh section can be added without redesigning the screen. This is the property that a chip row alone would not have had.

**D-19. The name is `Pocket`, not `Prep`.** Once the tab holds money, phrases, research, photos, packing and documents, "Prep" describes one sixth of it. Approved in conversation 28 Sep.

---

## 7. The colour contract

Five colours and their gradients. This replaces the jade/amber/ink/rust language in `new-feature-design.md`; **the meanings carry over, the hues change.**

| Token | Light | Dark | Means | Replaces |
|---|---|---|---|---|
| `--paper` | `#FCFAEC` | `#141109` | the ground | `--bg` |
| `--fern` | `#4F7942` | `#8CBE76` | **the plan you were given**; the app's own colour | jade |
| `--sea` | `#2C6E8A` | `#77B6D2` | **booked and confirmed** — something with a reference number | *new* |
| `--rose` | `#A8455A` | `#F090A2` | **function**: buttons, the active tab, a selected chip | ink (as primary) |
| `--blush` | `#F7DAD8` | `#3A2724` | **yours** — free time, your own additions | amber |
| `--brown` | `#4A4233` | `#EDE7D8` | all text; the show-this card; emergency | ink (as text) |

**D-20. Pink is a functional colour, not the app's colour.** If pink is on screen there is something to press there. It is never decoration, never a fill behind text, never a heading. Approved in conversation 29 Sep, and it is the rule that keeps the app from reading as a cosmetics brand.

**D-21. Green is the app's colour.** The illustrations, the plan spine, who has arrived, the masthead.

**D-22. Blue means a booking reference exists** — not "transport". A coach transfer the tour arranged is green, because nobody can be asked to show it at a counter. This distinction is the whole reason blue was added.

**D-23. Emergency is brown, not red.** Pink is already a warm red; a red alarm beside a pink button is a guess made in a hurry. Brown with a pale-pink label cannot be mistaken, and it keeps the three-second hold.

**D-24. Measured contrast, not assumed.** `#4A4233` on `#FCFAEC` is 9.5:1. White on `#A8455A` is 5.7:1; white on `#4F7942` is 5.1:1. `#C75F71` measures 3.96:1 and is therefore a fill only, never text. `#50C878` and `#89CFF0` were rejected at 1.9:1 and 1.5:1. `test/contrast.mjs` gains these pairs, and — item 11 of the testing plan — starts reading `web/css/app.css` instead of transcribing constants.

**D-25. Dark mode is the same markup with ten replaced token values.** Not a second stylesheet and not a second design, so it cannot silently drift. Default is `auto`, following the device; a manual override is stored per device and never syncs, because it is a property of the phone and not of the trip.

---

## 8. The responsive contract

**D-26. One codebase, three widths, no separate desktop build.**

| Width | Navigation | Layout |
|---|---|---|
| < 700px | bottom tab bar, four icons | one column |
| 700–1000px | left rail, icons only | two columns |
| > 1000px | left rail, icons + labels | three columns — rail, Plan, Map side by side |

**D-27. Planning happens at a desk, travelling happens on a phone.** The desktop layout's job is the pairing the phone cannot give you: Plan beside Map while you are still deciding. Clicking a pin highlights its row. It is one screen, not two pages.

**D-28. The phone layout is the canonical one.** Every screen is designed at 390 × 844 first, as the existing harnesses already assume. Wider layouts add columns; they never add features, and no behaviour exists only on desktop.

---

## 9. What this costs

Honest, because the estimate is the decision.

| Change | Cost |
|---|---|
| Home as its own shell | **small** — `chrome: false` exists; `trips.js` gains a header and a gear |
| `Today` screen | **large** — a genuinely new screen, and the default |
| Four tabs, Log/Shop/Prep folded into Pocket | **medium** — `nav.js` `TABS`, `screens/prep.js` becomes a hub, three screens get a new parent |
| Trip header with back arrow | **small** — one component, rendered by the shell |
| Map as whole-trip overview | **medium** — `screens/map.js` today renders one day |
| Colour tokens + dark mode | **medium** — `web/css/app.css` is hand-written and tracked; `contrast.mjs` and `css-additions.mjs` both assert on it |
| Responsive columns | **small** — CSS only, no new screens |

**The `Today` screen and the Map rewrite are the two real pieces of work.** Everything else is rearrangement.

---

## 10. Copy

This section is the only source for these strings.

| Where | String |
|---|---|
| Home title | `Your trips` |
| Home empty | `No trips yet.` / `Start one, or paste an itinerary you already have.` |
| Home new-trip | `+ Start a trip` |
| Home secondary | `Or paste an itinerary · import a calendar invite` |
| Trip header, back | `aria-label="Back to your trips"` |
| Trip header, sub | `Day 4 of 6 · Saturday 11 April` |
| Tab labels | `Today` · `Plan` · `Map` · `Pocket` |
| Pocket title | `Everything you reach for` |
| Pocket sub | `Works with no signal.` |
| Pocket sections | `Money` · `Phrases` · `Must` · `Log` · `Packing` · `Docs` |
| Archived trip badge | `Finished` |
| Live trip badge | `Day 4 · happening now` |

---

## 11. Decisions

1. **D-1** Home renders with no tab bar, using the existing `chrome: false` branch.
2. **D-2** The trip name, day count and a back arrow sit in a header on every tab inside a trip.
3. **D-3** Closing a trip returns to Home.
4. **D-4** `Log` stops being a tab and moves into Pocket.
5. **D-5** `Shop` and `Prep` stop being tabs and move into Pocket.
6. **D-6** `Today` is added and becomes the default screen inside a trip.
7. **D-7** `Map` and `Plan` keep their tabs.
8. **D-8** Gather lives on Today, not on a tab of its own.
9. **D-9** Only the selected tab shows its label.
10. **D-10** Map shows the whole trip, not one day.
11. **D-11** The route is drawn in three colours with no legend: green tour, blue dashed booked, pink dotted yours.
12. **D-12** Must places appear on Map as hollow rings, filterable by family.
13. **D-13** Map and Plan open the same place card.
14. **D-14** "Keep this area" lives on Map.
15. **D-15** Plan is the only place that edits.
16. **D-16** Pocket opens as a hub of six tiles, each carrying live state.
17. **D-17** The chip row replaces the hub once inside a section.
18. **D-18** Nothing in Pocket nests deeper than hub → section.
19. **D-19** The tab is named `Pocket`.
20. **D-20** Pink is functional only — if it is on screen, there is something to press.
21. **D-21** Green is the app's own colour.
22. **D-22** Blue means a booking reference exists, not "transport".
23. **D-23** Emergency is brown with a pink label, and keeps its three-second hold.
24. **D-24** Contrast pairs are measured and asserted; `contrast.mjs` reads the real stylesheet.
25. **D-25** Dark mode is ten replaced token values; default `auto`, override stored per device.
26. **D-26** One codebase, three widths.
27. **D-27** Desktop's job is Plan beside Map.
28. **D-28** 390 × 844 is canonical; wider layouts add columns, never features.

---

## 12. What this document deliberately does not decide

- **The contents of each Pocket section.** Five separate documents.
- **Any data-model change.** Phase 2. This document adds no kind and renames no field.
- **Whether the demo city stays.** Phase 8, though Home is where it will be felt.
- **Push notifications.** Designed for, not built: Today is where they would land, and nothing here forecloses them.
