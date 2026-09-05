# Existing UI Audit — Travel Planner

> **Refreshed 4 Sep 2026** against `main` @ tree `4698f0e4a8b8`. One commit landed after the first pass and changed real findings — accounts, sharing, the service worker, the rules file. Corrections are marked **[UPDATED 4 Sep]** inline and collected in §18 *Visual Reference Revision*. Where this document still conflicts with the running app, the app wins.

**Repo:** `weisze-yo/travel-planner` @ `main` (tree `e1fcb75ee81b`)
**Live:** https://travel-planner-3e0d3.web.app (Firebase Hosting, `public: "web"`)
**Audited:** 4 Sep 2026
**Method:** full read of `web/css/app.css` and the JS screen modules; the same `web/` bundle run locally and driven through its real screens for observation. The live URL was fetched and its boot markup/meta matches `web/index.html` byte-for-byte, so the deployed build is treated as identical to `main`.

Nothing in the app was changed. `web/**` was copied into this project **read-only as audit reference material**; `docs/design/existing-ui-audit.md` is the only authored file.

Every statement below is tagged **[C] confirmed** (observed running), **[I] inferred** (read in source, not observed), or **[U] unknown**.

---

## 1. Application overview

A mobile-first PWA for planning and logging a guided trip. The organising idea, stated in the CSS header comment and carried through every screen: **jade = the itinerary the tour agent gave you; amber = anything you planned yourself** (free time, sub routes, guessed values); **rust/red = something needing a second look or a destructive action**. [C]

Core model: a **trip** → 6 **days** → **stops** on the main route → **sub routes ("loops")** in the gaps between stops → plus per-trip **shopping list**, **packing prep**, **log/notes**, **must-see shots**, **spend report**, **offline map areas**, and **share/join**. [C]

The repo also contains the design source of truth it was built from: `project/*.dc.html` (Claude Design prototypes, e.g. `Screen.dc.html`, `Plan - times, loops, notes.dc.html`) and `chats/chat1.md`. `web/css/app.css` says its values come straight from `project/Screen.dc.html`. A native SwiftUI target (`TravelPlanner.swiftpm/`) exists in parallel and shares the Firestore shape. [I]

## 2. Technology / UI architecture

| Concern | What it actually is |
|---|---|
| Framework | **None.** Hand-rolled vanilla ES modules, no React/Vue, no JSX. [C] |
| Build system | **None.** No `package.json`, no bundler; `<script type="module" src="js/app.js">` loads sources directly. Deployed as-is by Firebase Hosting + a GitHub Actions workflow. [C] |
| Rendering | Each screen is an object `{ id, tab, chrome?, render(params) → HTML string, mount(root) }`. `nav.js` **replaces the whole host node** on every paint (clone → `innerHTML`), so handlers can never go stale; that is also why text inputs commit on `change`, not on keystroke. [C] |
| Templating | `util.js` — an `html` tagged template that escapes every interpolation, `raw()` to opt out. [C] |
| Routing | Hash routes (`#map`, `#plan`, …) + `history.pushState`, `popstate` for back/swipe-back. Invite links are a **path**: `/j/8QK2-M7VD`, rewritten to `index.html`. [C] **[UPDATED 4 Sep]** `index.html` now declares `<base href="/">` so those invite paths still resolve the app's relative assets, and `app.js` fetches the link envelope (`openLink(code)`) before the join screen draws. |
| State | Single mutable `state` object in `store.js` (~114 KB, the app's centre of gravity) with `subscribe`/`schedule` coalescing writes into one rAF paint. [C] |
| Data layer | `persist.js`: two interchangeable backends — **Firestore** (`users/{uid}/trips/{tripId}/…`, `persistentLocalCache`, `onSnapshot`) and **localStorage** fallback. `sync.js` keeps a durable outbox ledger in localStorage; "stranded" (configured but unreachable) is a distinct state from "offline". [C] **[UPDATED 4 Sep]** Auth is now a real account — Google popup/redirect or an emailed sign-in link; anonymous sign-in is no longer created (an older anonymous uid is *linked*, so nothing moves). Shared links are a real Firestore collection, `published/{code}`, governed by `firebase/firestore.rules`. Firebase config is committed in `web/js/config.js`, SDK pinned to `10.12.5`. [C] |
| Styling | **One hand-written stylesheet**, `web/css/app.css`, 2,171 lines, CSS custom properties at `:root`. No Tailwind, no CSS-in-JS, no preprocessor. Screens use its class vocabulary plus a small utility layer. [C] |
| UI library | None. Every control is bespoke. [C] |
| Icons | Inline SVG strings in `util.js` (`icon.back/close/chevron/caret/pencil/grip/tick/sort/gear/bin/pin` + 5 tab icons as `(color) => svg`). No icon font, no icon package. [C] |
| Maps | **Leaflet**, vendored at `web/vendor/leaflet/`, OSM raster tiles; all Leaflet chrome hidden by CSS. `tiles.js` caches tiles for kept areas. [C] |
| Fonts | **Public Sans**, self-hosted woff2, weights **400/600/700/800** only (`web/vendor/fonts/`). [C] |
| Offline | `sw.js` service worker + PWA meta. `<link rel="manifest" href="manifest.webmanifest">` is declared but **no manifest file exists in the repo** → almost certainly a 404 and a degraded install prompt. [I] **[UPDATED 4 Sep]** `sw.js` is now at `v5` and caches `screens/share.js`, `screens/join.js`, `screens/review.js` and `js/share.js`; the stale `screens/mustsee.js` entry is gone. The missing manifest is still referenced. |
| Photos | `photos.js` downscales in-browser: 320px thumbnail for a Firestore doc, 1600px for Cloud Storage; per-note budget 600 KB. [I] |

### Screen registry (all 19, from `app.js`)

`map, plan, dest, nearby, sub, shop, prep, log, note, trip, trips, spend, paste, area, areas, stuck, share, join, review`

Tab bar (`nav.js` `TABS`): **Map · Plan · Shop · Prep · Log** — shown only when a trip is open; `trips`, `join`, `stuck`, `share` declare `tab: null`, and `trips`/`join` additionally `chrome: false` (no tab bar at all). Push screens borrow a parent tab (`dest/nearby/sub/area/areas → map`, `spend → shop`, `paste/review → plan`, `note → log`). [C]

## 3. Existing screen inventory

Layout shorthand: **A** = `.head` (white header, bottom hairline) + `.scroll` list; **B** = full-bleed Leaflet map + `.sheet` pulled up over it; **C** = `.head` + form; **D** = push screen with `backHeader()`.

| # | Screen | Route | Purpose | Entry | Layout | Major sections | Primary action | Secondary | States | Source |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | My trips | `#trips` | Trip status board; the app's root when no trip is open | Cold start with no remembered trip; trip chip on Map | A, no tab bar | Header (`My trips` + count) · status groups (`FINISHED` eyebrow) · running-trip card with cover, next stop, footer · plain trip cards with stat chips (`7 stops`, `¥2,400 spent`, `3 notes`) · footer hint | `+ New trip` (opens blocking `.scrim` + bottom `.modal` form: name, city, first day, days) | Open a trip · swipe-left to delete · cover picker (photo or tint) | Confirmed: list, modal, finished group, `Nothing planned yet` empty copy. Inferred: running-trip cover card, "no longer shared with you" `.gone-card`, `Keep my side as its own trip` | `screens/trips.js` |
| 2 | Map (home) | `#map` | Today on a map + the day's stops | Default inside a trip | B | `.map-top` (trip chip w/ sync dot, gear, day pills w/ weather glyph, legend) · numbered pins + route · `.map-sheet` (`DAY 3 · Mar 14` / span title / `Nearby` / `.stop-row` list) | Tap a stop → frames its pin (`.pin-focus`) | Nearby · pin tap → Destination · gear → Trip settings · trip chip → My trips · sheet drag (3 detents 30/50/82%) | Confirmed: loaded, tiles, focus, `No stops yet` empty sheet. Tiles 403'd under local rate-limiting → grey `#E9EAE6` canvas, which doubles as the offline look | `screens/map.js`, `parts.js` |
| 3 | Plan | `#plan` | The day as a timeline, and where it is edited | Plan tab | A | Header (`Day 3` / date / pencil) · day pills · weather banner · timeline: gutter (start/derived end/duration) + spine (dot + solid jade / dashed amber line) + `.plan-card` · free-time lanes with `+` · archive card (dark) · warnings (`.warn` + a named fix) · `moved` banner | Toggle edit (pencil, turns jade) | `+ Add a stop` · `Paste an itinerary` · swipe-delete · drag-reorder by grip · move to another day · `See what changed` → Review | Confirmed: read mode, edit mode, `The day is empty` empty state. Inferred: warnings, archive, moved banner, new-sub-route sheet | `screens/plan.js` |
| 4 | Destination | `#dest` | Everything about one stop/place | Plan card, map pin, nearby card | D + hero | 230px hatched hero (back, `Photo placeholder` tag, `MAIN ROUTE · STOP 1` badge, time) · name/sub · Google Maps / Apple Maps buttons · underline tabs **Info · Nearby · Must-see · Shop · Notes** with counts · `NEED TO KNOW` essentials table · doorway panels · link rows | Open in a maps app | Tab switch · add nearby to a sub route · add/edit a must-see shot · add a note · edit facts (`factsEditor`) | Confirmed: hero, header, buttons, tab row, Info start. Inferred: the other four tab bodies | `screens/dest.js` |
| 5 | Nearby | `#nearby` | Places around today's stops, to fill free time | `Nearby` on Map/sub/dest | D | `Around day 3` / `14 places saved across today's stops` · category chip row (All/Food/Cosmetic & health/Clothing/Shopping/Sights/Rest) · `grouped by stop · sorted by travel time` + sort button · per-stop groups · `.nearby-card` (thumb, name, `walk 2`, `2 min`, `stay ~20 min`, `+`) · dark `.dock` naming the loop in hand + amber `Arrange` | `+` adds the place to the loop in hand | Sort menu (travel/stay time) · category filter · `Arrange` → sub route · card → Destination | Confirmed: all of the above except the open sort menu | `screens/nearby.js` |
| 6 | Sub route | `#sub` | Arrange one self-planned loop inside a gap | `Arrange`, plan lane card | B | Translucent `.sub-card` header · map with amber pins · `.sub-sheet` (68%): loop chips, `.stat` tiles (ok/tight), `.loop-row` list with edge markers, back-by form | Save the loop | Toggle edit · add via Nearby · reorder/drop · switch loop | Inferred throughout (not reached in observation) | `screens/sub.js` |
| 7 | Shopping list | `#shop` | What to buy, where, and what it cost | Shop tab | A | Header (`Shopping list` / `8 items · 3 places`) · day filter chips · place filter chips · place groups (`Nishi Market` / `Day 3 · today, 13:30–15:45`) · items (checkbox, name, detail, `¥5,000 est.`, payment + category selects, paid input when ticked) · fixed `.footer-card` (`ACTUAL SPEND ¥2,400 / ¥37,100 est.`, progress, `1 of 8 bought`, `See the report ›`) | Tick an item bought | Add · correct item (`itemEditor` modal) · filter · swipe-delete · report | Confirmed: list, filters, footer, ticked/unticked, per-item selects | `screens/shop.js` |
| 8 | Spend report | `#spend` | Where the money went | `See the report ›` | D | Ink `.spend-hero` (`SPENT IN 6 DAYS`, `¥2,400`, MYR conversion `at 33.7`, chips `¥400 a day`, `1 purchase`, `8% under plan`) · `DAY BY DAY` bar chart + `Biggest: Day 6` + `Tap a day to filter everything below.` | Tap a day to filter | Back | Confirmed: hero + chart. Inferred: category stack, accuracy tracks, purchase list below | `screens/spend.js` |
| 9 | Trip prep | `#prep` | Packing, against the forecast | Prep tab | A | Header (`Trip prep` / `6 days · departs in 11 days`) · jade progress bar + `6 of 15 packed` · `WHAT TO WEAR ON DAY 3` card (reference thumb, advice, outfit chips) · `WHAT I AM ACTUALLY BRINGING` (input + jade `Add` + suggestion chips) · packing list with `where` chips | Tick items packed | Add a piece · category filter · weather strip | Confirmed: header, progress, wear card, bringing block. Inferred: the list rows below | `screens/prep.js` |
| 10 | Log | `#log` | Trip diary by day | Log tab | A | Header (`Log` / `Meridian City · 3 notes across 2 days`) · `+ Note` · day cards (`Day 3 · Today · Mar 14`, amber `in progress · 1 note · 1 sub route`, per-note `+ Note`) · place head rows + note bodies + photo strips · footer chips (`0 of 4 must-see ✓`, `1 of 1 sub route walked`) | `+ Note` | Open a note · add at a place · swipe-delete · recap card | Confirmed: list, day cards, in-progress state. Inferred: `Log` empty variant, `.recap` | `screens/log.js` |
| 11 | Note editor | `#note` | Write/edit one note | `+ Note`, note tap | C | `✕` + `New note` + jade `Save` · place row (`Not about a place` + `Change`) · `TIME` field · `NOTE` textarea · `+ Photos` drop · hint | Save | Change place · pick time · attach photos · delete | Confirmed as new-note. Inferred: edit-existing, place picker, photo thumbs | `screens/note.js` |
| 12 | Trip settings | `#trip` | Everything about the trip | Gear on Map | D | `THE TRIP` (name, city or area, first day, days + jade `Save trip`) · MONEY · further blocks: paste, share, export, offline areas, stuck changes, close/delete | `Save trip` | Paste · Share · Export JSON · Map kept on phone · Changes on this phone · close/delete trip | Confirmed: header + THE TRIP block. Inferred: everything below the fold | `screens/trip.js` |
| 13 | Share this trip | `#share` | Give someone a copy | Trip settings | D, no tab | `Who has it` (`.who-mark` initial chips, `OWNER`) · `They will be able to` radios (Send updates / Receives updates) · `Link stops working after` chips (24 hours / **7 days** / Until the trip ends) · jade explainer `They get a copy, not a live view.` | Create/copy the link | Change per person · revoke | Confirmed: all of the above | `screens/share.js`, `share.js` |
| 14 | Join | `/j/CODE`, `#join` | What an invited outsider sees in a browser | Invite link | Own layout, no tab bar | `.join-bar` · `.join-head` (from-line, big trip name, meta) · `.join-look` preview cards · sticky `.join-foot` + `.join-fine` · then a sign-in phase (`.sign-btn`, dark variant) | Join the trip | Sign in (email/Apple/Google) · look first | Inferred: `phase = 'look' → 'signin'`, plus dead-link states from `LINK_DEAD_LINES` | `screens/join.js` |
| 15 | Review | `#review` | Decide what to take from someone's update | `See what changed` on Plan | D | Header (`X sent an update` / n things to decide) · `.sides` (mine vs theirs) per entry · `.review-foot` actions · `Nothing to review` variant | Accept/keep per entry | Take all · back | Inferred | `screens/review.js` |
| 16 | Paste an itinerary | `#paste` | Turn a pasted agent itinerary into stops | Plan, Trip settings, after Create | A | Intro (`It is read on this phone; nothing is sent anywhere.`) · monospace `.paste-area` · `Example` / `Clear` / `0 words` · `WHAT IT LOOKS FOR` (day headers, times, incl. `第三天`, `下午3:00`) · then a review pass: `Check what it read`, `.cand` rows (worked / unread / done), per-row screen, guessed inputs in amber | Read it / Import | Example · Clear · tick rows · edit a row | Confirmed: the paste step. Inferred: the review step | `screens/paste.js`, `itinerary.js` |
| 17 | Map kept on this phone | `#areas` | Offline tile areas | Trip settings | D | Empty copy (`No map kept yet…`) · `+ Keep an area` dashed button · amber caveat (`7 stops are outside every kept area` + ink `Draw an area around them`) · `STORAGE 0 kB of map` + swipe-to-remove hint | `+ Keep an area` | Draw around uncovered stops · resize · refresh · swipe-delete | Confirmed incl. empty + amber caveat | `screens/areas.js` |
| 18 | Draw an area | `#area` | Drag a box to keep tiles | `+ Keep an area` | Map + shades | Dimmed top/bottom `.area-shade` · white `.area-box` with 4 round grips · `.area-note` · bottom `.area-sheet` with detail toggles and size warning | Keep this area | Resize · cancel | Inferred | `screens/area.js` |
| 19 | Changes on this phone | `#stuck` | Why edits are not syncing | Trip settings, red strip | D, no tab | `.stuck-why` rust card · waiting count + oldest · copy-out / retry actions | Retry | Copy the data out · dismiss | Inferred | `screens/stuck.js` |

### Global chrome (not screens)

- **Tab bar** `#tabbar` — 5 tabs, 78px, translucent white + blur, active tab a bone-filled 12px pill. [C]
- **Strip slot** `#strip` (`strip.js`) — one amber/red banner above the tab bar for reminders, offline map and sync trouble. [I]
- **Undo slot** `#undo` — one ink `.undo-bar` for the six seconds a deletion can be taken back, app-wide. [I]
- **Boot cover** `#boot` — bone screen, 54px jade `MC` mark, `Loading your trip…`, fades in 250ms; `.boot-error` rust card on failure. [C]

## 4. Existing user flows

1. **Cold start** → boot cover → remembered trip? Map (or the last of map/plan/shop/prep/log asked for in the hash) : My trips. [C]
2. **New trip** → `+ New trip` → blocking modal → Create → **straight into Paste an itinerary** → review rows → stops land on the Plan. [C paste screen / I the import]
3. **Day planning** → Plan → pencil → add stop / paste / reorder / retime → gaps become free time → `+` on a lane → New sub route → pick places on Nearby → Arrange on Sub route. [C to the lane; I after]
4. **On the day** → Map → day pills → stop rows/pins → Destination → Nearby → add to loop. [C]
5. **Shopping** → Shop → filter by day/place → tick bought → enter what was paid → See the report. [C]
6. **Logging** → Log → `+ Note` (or from a place on Destination) → time + text + photos → Save. [C]
7. **Sharing** → Trip settings → Share → permission + expiry → link → recipient opens `/j/CODE` → Join → look → sign in → their own copy → owner sends an update → recipient sees `moved` banner → Review → chooses per entry. [C to Share; I after]
8. **Offline** → Trip settings → Map kept on this phone → Keep/draw an area → tiles cached; sync trouble surfaces as the amber/red strip → Changes on this phone. [C to Areas; I after]

## 5. Visual design analysis

Quiet, dense, editorial. Bone-grey app background, white cards, no gradients except two functional ones (cover wash, `join-foot` fade), no illustration, no photography — real images are hatched placeholders (`repeating-linear-gradient(135deg, #E2E6E2 0 10px, #DADFDA 10px 20px)`). Colour is used **semantically, never decoratively**. Ink is the "act" colour, jade is "given/confirmed", amber is "yours/uncertain", rust is "destructive/broken". Type is small (10–15px in body, 24px screen titles), tight, heavily weighted (600–800 everywhere), with `font-variant-numeric: tabular-nums` on every time and money figure. [C]

## 6. Typography

- Family: `'Public Sans', system-ui, -apple-system, sans-serif`; `-webkit-font-smoothing: antialiased` globally.
- Loaded weights: **400, 600, 700, 800**.
- Screen title `.screen-title` 24px/700/`-.02em`; sub `.screen-sub` 12px muted.
- Push title `.push-title` 17px/700/`-.01em`; sub `.push-sub` 11.5px.
- Section eyebrow `.eyebrow` 10.5px/800/`.06em` soft (jade/amber/rust variants).
- Body copy 12.5–13.5px, line-height 1.45–1.55; `.dest-desc` 13.5/1.55 charcoal.
- Row titles 13.5–14.5px/600–700 (`.plan-name` 14.5/650, `.stop-name` 14/600, `.item-name` 13.5/600).
- Labels/meta 10.5–11.5px, 650–800, colour muted → soft → faint by importance.
- Buttons `.btn` 13px/700 (`.sm` 12.5px); tab labels 9.5px/800.
- Numeric display: `.spend-big` 36px/700/`-.025em`, `.hero-figure` 34px/700, `.spend-v` 20px, `.sheet-span` 20px.
- Monospace: `ui-monospace, Menlo, monospace` for the paste textarea and raw itinerary rows only.
- Hierarchy is carried by **weight + size + colour**, not by family. [C]

## 7. Colour palette (verbatim from `:root`)

| Token | Value | Role |
|---|---|---|
| `--jade` | `#1F6F5C` | Primary. The agent's main route, saved/confirmed, primary CTA fill |
| `--amber` | `#C87F0A` | Secondary. Anything self-planned or guessed |
| `--ink` | `#14201C` | Text, and the "action" surface (dark buttons, docks, undo bar, hero) |
| `--charcoal` | `#3D4C46` | Body text on cards; also `--dark-card` |
| `--muted` | `#6B7A74` | Secondary text |
| `--soft` | `#98A5A0` | Tertiary text, eyebrows |
| `--faint` | `#B4BEB9` | Quaternary (derived values, captions) |
| `--bone` | `#F2F3F1` | App background, chip/pill rest fill, active tab fill, theme-color |
| `--line` | `#E7EAE7` | Card/section border |
| `--line-2` | `#EDEFEC` | Row divider, progress track |
| `--line-3` | `#F0F2F0` | Lightest divider (list rows) |
| `--field` | `#E1E5E1` | Ghost-button border, toggle track |
| `--field-bd` | `#DDE2DE` | Input border |
| `--amber-bg` / `--amber-bd` / `--amber-fg` | `#FBF1DE` / `#EBD9B4` / `#8A5A08` | Amber surface / border / text |
| `--jade-bg` / `--jade-bd` / `--jade-fg` | `#E6EFEB` / `#CFE0D9` / `#5D8C7C` | Jade surface / border / secondary text |
| `--danger-bg` / `--danger-fg` | `#F8E9E9` / `#9B4B4B` | Rust surface / text; `#9B4B4B` is also the delete-track and bin fill |
| `--dark-card` | `#3D4C46` | Archive card |

Un-tokenised colours used repeatedly in rules: `#fff`; `#FFFDF7` (amber paper for self-planned cards); `#E3CFA3` (amber dashed border); `#C9D0CB` (dashed grey border); `#D2D8D3` (checkbox/radio border); `#E4E8E5` (tab-bar top line); `#E9EAE6` (map canvas); `#EFF1EE` (leg/pay chips); `#F7F8F6` / `#FAFBFA` (inset panels); `#9AA6A1` (inactive tab, struck-through text); `#8FB3A6`, `#A8CFC0`, `#C8D6D0`, `#DCE6E1`, `#E4EBE8`, `#9FB2AA` (type on ink/dark cards); `#CBD8D2` (inactive bar fill); shadow ink `rgba(20,32,28, .06–.4)`. No dark mode — `color-scheme: light`. [C]

## 8. Layout system

- App shell `#app`: `max-width: 520px`, centred, `height: 100dvh`, `overflow: hidden`, column flex. Above 560px the page background darkens to `#E4E6E2` and the shell gets a 1px hairline ring — a phone frame on desktop. [C]
- Vertical structure: `.screen-host` (flex 1) → `.screen` (flex column, hidden overflow) → `.scroll` (the only scroller; `overscroll-behavior: contain`) → then `#strip`, `#undo`, `#tabbar` as fixed-height siblings. Scroll position is preserved across re-renders of the *same* screen only. [C]
- Page padding: **16px** horizontal (`.pad16`, `.head`, `.map-top`, sheet heads); cards pad **14px** (`.card.pad`, `.plan-card` 12–13px, list rows 11–14px).
- Header `.head`: `calc(14px + safe-top) 16px 12px`, white, 1px bottom line. Sheet heads `0 16px 12px`.
- Tab bar: `--tabbar-h: 78px`; padding `7px 8px calc(10px + safe-bottom)`; tabs min-height 46px.
- Safe areas: `--safe-top`/`--safe-bottom` from `env()`, applied in headers, hero back button, tab bar, review/join feet, area sheet.
- Sheets: `border-radius 22px 22px 0 0`, shadow `0 -8px 30px rgba(20,32,28,.16)`, three detents **30% / 50% / 82%** remembered per sheet for the session.
- Floating furniture: `.fab` 52px at `right:16px; bottom: calc(42% + 14px)`; `.dock` and `.footer-card` inset `left/right:12px; bottom:12px`; `.modal` the same with `max-height: calc(100% - 40px)`.
- Grid: essentially **no grid** — everything is flex rows/columns with a `gap` utility scale (`.row.g5…g14`, `.col.g4…g14`) and a margin scale (`.mt2…mt18`, `.mb8…mb18`). Fixed-width gutters align columns: stop time 44px, plan gutter 56px (60px editing), plan spine 20px, essentials key 80px, note time 44px, note card left inset 58px.
- Alignment: labels left, times and money right/`tabular-nums`, badges right-aligned in rows. [C]

## 9. Component patterns — the reusable set

Shared JS fragments (`web/js/screens/parts.js`) — the real component library:

| Fragment | What it renders |
|---|---|
| `tripChip()` | White 44px trip bar: 26px jade mark, name, meta, sync dot |
| `syncDot()` | Ring (saving) / jade (saved) / amber (queued) / red (stuck) / grey (local only) |
| `dayPills({small})` | `D1…Dn` pills with that day's weather glyph; active = ink fill |
| `backHeader({title, sub, action})` | The standard push header |
| `checkbox(on, {act,id,size})` | 22px `.box`, jade when on, `role="checkbox"` |
| `weatherBanner()` | Jade banner, glyph + summary + source line + chevron, opens an hourly forecast |
| `emptyDay(weather)` | The standard empty-day sentence |
| `itemEditor` / `readItemEditor` | Shopping-item correction modal (scrim + bottom form) |
| `shotEditor` / `readShotEditor` | Must-see shot modal, optional reference picture |
| `factsEditor` / `readFactsEditor` | Place "need to know" table editor |
| `swipeToDelete(root, …)` | The one delete gesture: rest → dragging → **latched at 88px** (`DELETE` appears) → **confirming in the row** (never a dialog) → gone, with 6s undo. Decisive swipe past 60% skips to confirm |
| `bindDragReorder(root, …)` | Grip-handle reorder, pointer events, `.dragging` / `.drop-into` |
| `draggableSheet(sheet, …)` | The 3-detent sheet, tap-to-step as well as drag |
| `undoBar()` / `bindUndo()` | The app-wide undo line |
| `mapsLinks` | Google/Apple/walking-route deep links |

CSS component vocabulary, with its treatment:

- **Buttons.** `.btn` h42 r12 13px/700 — `.ink` (dark, primary act), `.jade` (save/confirm), `.ghost` (bone fill + `--field` border, weight 650); `.sm` h38; `.grow`/`.wide`; `[disabled]` → `opacity .45; pointer-events none`. `.btn-dashed` h48 r14 1.5px dashed `#C9D0CB` for "add". `.iconbtn` 32px r10; `.iconbtn.filled` 40px r13 white + shadow.
- **Inputs.** Global `input/textarea/select`: 13px, white, 1px `--field-bd`, **r10**, padding `9px 10px`, focus = `border-color: var(--jade)` (no ring). `select` gets a custom caret SVG. `input.guessed` = amber border + `#FFFDF7` fill for machine-guessed values.
- **Forms.** `.form` = white card with a **1.5px ink border**, r16, 14px pad, 8px gap; `.form-title` 12.5/800, `.form-hint` 11px soft, `.form-actions` row.
- **Cards.** `.card` white r16 (`.tight` r14); `.card-list` r16 + `overflow:hidden` for grouped rows; `.plan-card` white r14 + `--line` border (`.sub` = `#FFFDF7` + 1.5px dashed `#E3CFA3`); `.nearby-card` r15; `.trip-card` r15 1.5px border (jade when active); `.day-card` r16; `.cand` r14 with worked/unread/off/done variants.
- **Chips, pills, badges** — four overlapping families: `.pill` (h32 r10 12.5px, ink when on — day/mode selection), `.chip` (r8 10.5px/650 — inline metadata, jade/amber/grey/danger), `.cat` (h30 r9 — category filter, jade when on), `.badge` (r6 9.5px/800/`.04em` — `MAIN`/`SUB` route provenance), plus `.pay-chip`, `.where-chip`, `.pick-chip`, `.mine-chip`, `.hero-chip`, `.leg`/`.leg-total`/`.leg-stay`, `.loop-chip`, `.cand-tick`, `.reading`.
- **Tabs.** Bottom tab bar (icon + 9.5px label, bone pill when active) and in-page underline tabs `.dest-tab` (2px ink underline, count bubble that turns jade when active).
- **Modals/sheets.** One pattern: `.scrim` (`rgba(20,32,28,.34)` + `backdrop-filter: saturate(.55)`) + `.modal` docked 12px from the bottom holding a `.form`. Full-height alternative: `.sheet`. **No centred dialog anywhere**, and destructive confirmation happens *inside the row*.
- **Alerts/banners.** `.hint-amber`, `.warn` (+`.warn-label`/`.warn-text`/`.warn-fix`, where a warning always names the tap that fixes it), `.caveat`, `.stuck-why`, `.moved`, `.arrived`, `.gone-card`, `.stranded`, `.strip` (amber/red), `.undo-bar`.
- **Lists.** Grouped rows inside `.card-list`, separated by `1px --line-3`, group heads at 12–14px pad; `.empty` = 28px/16px centred 12.5px soft copy.
- **Tables.** Only one: the essentials key/value table (`.essential`, 80px uppercase key column).
- **Progress/data-viz.** `.progress` (7px jade), `.bar-track`/`.bar-fill` (10px, rounded at the data end only), `.daybars` (140px columns, jade when selected, `#CBD8D2` otherwise), `.stack`, `.acc-track`, `.toggle` (34×20 switch, jade when on), `.radio` (16px, jade with a 3px inset white ring).
- **Images.** Always hatched placeholders at rest (`.hero`, `.nearby-thumb`, `.log-photo`, `.outfit-ref`, `.shot-img`, `.trip-cover`, `.cover-pick`, `.placeholder-hatch`), `object-fit: cover` once a real photo exists.
- **Map.** `.map-pin` 32px jade circle w/ number; `.slack` 40px ink; `.sub` 18px white + 2.5px amber ring; `.sub-num` 28px amber; `.pin-focus` = 3px jade outline + `scale(1.12)`. All Leaflet controls hidden; `.legend` explains solid jade = main, dotted amber = sub. [C]

## 10. Interaction patterns

- **Radius scale (in use):** 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 22px, plus `50%`. Roughly: badges 6–8, chips 8–10, controls/inputs 10–12, cards 14–16, floating furniture 17–18, sheets 22.
- **Borders:** 1px hairlines for structure; **1.5px** to mean "this is emphasised or yours" (form ink border, dashed amber card, active trip card); 1.6px on checkbox/radio; 2–2.5px for spines, pin rings and the draw-area box; dashed borders always mean "add / not yet real".
- **Shadows:** `0 2px 10px rgba(20,32,28,.07–.12)` floating small; `0 6px 20px .3` FAB; `0 8px 26px .18` / `0 10px 28px .3` docks and strips; `0 -8px 30px .16` sheets (upward); `0 14px 44px .3` modal.
- **Hover:** essentially **none** — a touch-first app; `-webkit-tap-highlight-color: transparent`, scrollbars zeroed globally.
- **Focus:** inputs only, via `border-color: var(--jade)`. **No visible focus ring on buttons anywhere** — an accessibility gap for keyboard users.
- **Active/selected:** a consistent `.on` class convention across pill/cat/chip/tab/box/radio/toggle/trip-card/detail/cover-pick — either an ink fill, a jade fill, or a jade border.
- **Disabled:** `opacity .45` + `pointer-events: none`.
- **Motion:** deliberately sparse — `.swipe-face transform .18s`, `.sheet.settling max-height/height .18s`, `.pin-focus transform .18s`, boot `opacity .25s`, `DELETE` label `.12s`, one `sync-spin` keyframe. `prefers-reduced-motion` is honoured for the swipe transition and the sync ring (but not for the sheet or boot fade).
- **Gestures:** swipe-left to delete (5 states), drag sheets between 3 detents, drag-handle reorder, drag grips to resize a map area, iOS swipe-back via `popstate`.
- **Undo, not confirm:** deletions are reversible for 6s from one app-wide bar; the only blocking interaction in the app is creating a trip. [C for the CSS/JS; C observed for swipe rows, sheets, tabs, filters]

## 11. Responsive behaviour

Single mobile layout, hard-capped at **520px** and centred; one breakpoint at **560px** that only re-skins the page around the shell. Heights are `100dvh` with internal scrollers, so the layout never flows to a desktop shape — on a wide screen it is a centred phone. `viewport-fit=cover, maximum-scale=1` plus `env(safe-area-inset-*)` throughout; `overscroll-behavior-y: none` on body to stop iOS rubber-banding behind the sheet. No tablet or desktop treatment exists. [C]

## 12. Existing inconsistencies (documented, not fixed)

1. **Duplicate rule blocks in `app.css`** — the file is written in dated "rounds"/"sessions", and later sections redefine earlier ones: `.swipe-bin` (68px, centred → 88px, right-padded, with a `::after DELETE`), `.bin`, `.pick-chip` (twice), `.plan-line.sub` (twice), `.mt7`/`.mt8` (twice), `.map-sheet`/`.sub-sheet` max-height (42%/68% → both 50%), `.sheet-grab` (twice), `.badge.jade` added far from `.badge.main`. Cascade order, not intent, decides the winner.
2. **Font weights that do not exist.** `550` (`.essential-v`) and **`650` in ~40 rules** are used, but only 400/600/700/800 are loaded — the browser rounds or synthesises. `.chip` uses 650, `.form-hint` 500-ish variants, etc.
3. **Half-pixel type scale** — 9.5, 10.5, 11.5, 12.5, 13.5, 14.5px alongside 10–24px integers. No named scale; sizes are set per-component and there are ~20 distinct body sizes.
4. **Four overlapping small-label families** (`.chip`, `.cat`, `.pill`, `.badge`) plus ~10 one-off chips (`.pay-chip`, `.leg`, `.where-chip`, `.mine-chip`, `.pick-chip`, `.hero-chip`, `.loop-chip`, `.cand-tick`, `.reading`, `.arrived`) with different radii (6–10px), heights (auto/30/32) and weights (650–800) for the same job.
5. **Radius is not a scale** — 14 distinct values; `.card` 16 vs `.plan-card` 14 vs `.nearby-card` 15 vs `.trip-card` 15 vs `.linkrow` 14, all "a card".
6. **Button heights** 42 / 40 (`.strip-go`, `.sign-btn` 48) / 38 (`.sm`, `.nearby-btn`, `.dock-btn`, `.swipe-ask-*` 36) / 34 (`.note-day`) / 32 (`.pill`) / 30 (`.warn-fix`, `.archive-btn` 28) — six-plus control heights.
7. **Danger colour split** — `--danger-fg: #9B4B4B` is tokenised, but `#9B4B4B` is also hardcoded in `.bin`, `.swipe-ask`, `.strip.red`, `.hero-chip.bad`, `.sync-dot.red`.
8. **~20 recurring un-tokenised colours** (`#FFFDF7`, `#E3CFA3`, `#C9D0CB`, `#D2D8D3`, `#EFF1EE`, `#F7F8F6`, `#FAFBFA`, `#8FB3A6`, `#A8CFC0`, `#CBD8D2`, …) sitting beside a full token set.
9. **Two "amber paper" recipes** — `--amber-bg #FBF1DE` (banners) vs `#FFFDF7` + `#E3CFA3` (self-planned cards) both mean "yours".
10. **Focus states exist only on inputs** — buttons, pills, tabs and swipe rows have no visible focus indicator.
11. **Reduced motion is partial** — honoured for the swipe and the sync ring, ignored for the sheet settle, the pin focus and the boot fade.
12. **Two dividers for one job** — `--line-2` and `--line-3` are both used as list-row separators in different screens.
13. **`!important`** appears once, on `[hidden]`, deliberately and with a comment.
14. **`manifest.webmanifest` is referenced but absent** from the repo. [I]
15. **Inline `style=` overrides** are sprinkled through the screen modules (`style="width:96px"`, `style="height:38px"`, `style="background:var(--jade)"`) where the class vocabulary runs out — a sign the button/width scale is under-specified.
16. **[FOUND 4 Sep] Malformed attributes on the Plan sub-route row.** In edit mode `plan.js` renders the sub-route swipe row with already-quoted values interpolated into quoted attributes, so the DOM ends up with `data-loop-row="&quot;day-3&quot;"`, `data-loop-name="&quot;Market"` and a stray boolean attribute `afternoon=""`. Harmless to the visible UI (the row renders correctly and the swipe still works, since the handlers read `dataset.loopRow` — which now carries embedded quotes), but it is invalid markup and it breaks DOM-serialising tools. Recorded, not fixed.

## 13. Source-code references

```
web/index.html              shell: #screen, #strip, #undo, #tabbar, #boot
web/css/app.css             ALL styling; tokens at :root (lines 33–75)
web/sw.js                   service worker
web/js/app.js               boot + screen registration + initial route
web/js/nav.js               registry, routing, tab bar, undo slot, paint cycle
web/js/util.js              html/esc/raw, delegate, clock/duration/money, icons
web/js/store.js             all state + business logic (~114 KB)
web/js/persist.js           Firestore | localStorage backends
web/js/sync.js              outbox ledger, "stuck" detection
web/js/net.js, tiles.js     network + offline map tiles
web/js/itinerary.js         itinerary parsing for the paste flow
web/js/share.js             link codes, expiry, link states
web/js/photos.js            image downscaling budgets
web/js/remind.js            reminders feeding the strip
web/js/strip.js             the one banner above the tab bar
web/js/data.js              demo trip seed (Meridian City, Tokyo coords)
web/js/screens/parts.js     ← the shared component library
web/js/screens/*.js         19 screens, one file each
web/vendor/leaflet, fonts   Leaflet 1.x, Public Sans 400/600/700/800
project/*.dc.html           original Claude Design prototypes (design source)
chats/chat1.md              design intent transcript
```

## 14. Confirmed vs inferred vs unknown

**Confirmed by running the app:** boot cover; My trips (list, finished group, stat chips, **account row**, new-trip modal, **sign-in sheet**, swipe hint); Map (chrome, pins, route, tiles, day pills, legend, sheet, stop focus, empty sheet); Plan (read mode, edit mode, weather banner, timeline, empty day); Destination (hero, maps buttons, tab row, Info start); Nearby (filters, groups, cards, dock); Shop (filters, groups, items, per-item selects, footer card); Spend (hero + day chart); Prep (progress, wear card, bringing block); Log (day cards, notes, footer chips); Note editor (new); Trip settings (THE TRIP block); Share (people, permissions, expiry, explainer); Paste (input step); Map-kept-on-phone (empty + amber caveat); **Join (expired-link ending)**; tab bar behaviour incl. its absence on My trips and Join; all colour/type/spacing values (read from source).

**Inferred from source only:** Sub route, Draw an area, Review, Join (both phases + dead-link variants), Changes on this phone; the paste review pass; Destination's Nearby/Must-see/Shop/Notes tabs; Trip settings below the fold; Spend's category/accuracy/purchase sections; the strip and undo bar in action; drag-reorder and the full 5-state swipe; the "moved"/"arrived"/"gone" sharing banners; loading and error states beyond boot; multi-person share; Firestore-backed sync (local session ran on the localStorage path).

**Unknown / needs the real device or account:** real behaviour on a signed-in Firestore account with two devices; whether `manifest.webmanifest` 404s in production; iOS PWA install and safe-area rendering on a notched device; offline tile capture at real sizes; real photos in place of the hatch; the SwiftUI app's relationship to the web UI; whether any live user data exists.

## 15. Recommendations for maintaining visual consistency

If a new screen is built tomorrow, reuse in this order:

1. **Start from a screen module of the same shape** — list screen → copy `shop.js`; push/detail → `spend.js` + `backHeader()`; map+sheet → `map.js` + `draggableSheet()`; form → `trip.js` or the `.form` in `parts.js`.
2. **Use `parts.js` before writing anything new** — `backHeader`, `dayPills`, `tripChip`, `checkbox`, `weatherBanner`, `swipeToDelete`, `bindDragReorder`, `draggableSheet`, `undoBar`, the three editors.
3. **Only `:root` tokens for colour**, and keep the semantics: jade = given/confirmed, amber = yours/uncertain, ink = the act, rust = destructive/broken. Do not introduce a new hue.
4. **Structure:** `.screen` → `.head` (16px sides, white, hairline) → `.scroll` → `.card`/`.card-list` at r16 with 14px padding, rows separated by `--line-3`, sections spaced with `.mt12`/`.mt14`.
5. **Controls:** primary = `.btn.ink`, save = `.btn.jade`, secondary = `.btn.ghost`, add = `.btn-dashed`; keep h42 (h38 for `.sm`). Inputs inherit the global rule — do not restyle them locally.
6. **Copy tone:** plain-spoken, lower-case sentences, second person, no marketing voice, no exclamation marks — "Swipe a trip left to delete it.", "It is read on this phone; nothing is sent anywhere.", "They get a copy, not a live view." Warnings always name the tap that fixes them.
7. **Destructive actions:** swipe → confirm **in the row** → 6-second undo. Never add a centred confirmation dialog.
8. **Numbers:** `tabular-nums` on every time and money value; times as `HH:MM`, money via `util.money`.
9. **Images:** if there is no real asset, use the hatch placeholder — that *is* the house style, not a stub.
10. **Because there is no build step**, a new screen means one file in `web/js/screens/`, a `register()` line in `app.js`, and — if unavoidable — a new block at the **end** of `app.css`. Prefer existing classes; the duplicate-block problem in §12 comes from doing otherwise.

---

## 16. Resolved questions

### 16.1 `manifest.webmanifest` — an unused reference, not a live problem

**[UPDATED 4 Sep]** Still missing, still referenced by `index.html` and `sw.js` (now `v5`). The two stale/missing service-worker entries noted below were fixed upstream in the same commit: `screens/mustsee.js` is gone, and `js/share.js`, `screens/share.js`, `screens/join.js` and `screens/review.js` are now cached.

`web/index.html` links it and `web/sw.js` lists it in `ASSETS`, but **no such file exists anywhere in the repo**, and `firebase.json` rewrites `**` → `/index.html`, so the request resolves to the HTML document rather than 404ing outright. Consequences, in order of severity:

- The service worker is written defensively — `Promise.all(ASSETS.map(url => cache.add(url).catch(() => {})))` with the comment "addAll fails the whole install if one file 404s, so add individually" — so **install is unaffected**. [C from source]
- **iOS Add to Home Screen still works**: it is driven by `apple-mobile-web-app-capable`, `apple-mobile-web-app-title`, `apple-touch-icon` and `theme-color`, all present. This is the app's stated target (the deploy workflow ends "Open … on your iPhone in Safari, then Share → Add to Home Screen"). [C]
- **Android/Chrome installability is what is lost** — no manifest means no name/icons/display/start_url, so the install prompt and standalone display are unavailable there. [I]

Verdict: harmless for the intended iOS use, a real gap for Android install. Not touched.

Two related stale references found in the same `ASSETS` list, worth recording: **`./js/screens/mustsee.js` does not exist** (must-see now lives inside `dest.js`), and `js/share.js`, `screens/share.js`, `screens/join.js`, `screens/review.js` are **absent from the list**, so those four are only cached opportunistically by the network-first fetch handler after a first visit. Cold offline start of the sharing screens is therefore unreliable. [I]

### 16.2 SwiftUI target — it exists, and it looks deliberate

`TravelPlanner.swiftpm/` is a real Swift Playgrounds app package: `swift-tools-version 5.9`, `.iOSApplication`, iOS 17, bundle id `com.meridian.travelplanner`, `.phone` only, portrait only, green accent, and a dependency on `firebase-ios-sdk` from 10.29.0 (FirebaseCore/Auth/Firestore/FirestoreSwift/Storage). 22 files: `App/Theme.swift` + `TravelPlannerApp.swift`, `Models/` (`Models.swift`, `SeedData.swift`), `Services/` (`FirebaseBootstrap`, `TripRepository`, `TripStore` 29 KB, `PhotoService`, `WeatherService`), and `Views/` mirroring the web screens (`RootTabView`, `MapHomeView`, `PlanView`, `ShopView`, `PrepView`, `LogView`, `NoteComposerView`, `DestinationView`, `NearbyView`, `SubRouteView`, `MustSeeView`, `Components/CommonViews`). [C from source]

It shares the Firestore layout deliberately — `persist.js` says "the same layout the SwiftUI app uses, so both clients read the same shape". [C] But: **no CI touches it** (the only workflow is `deploy-web.yml`, path-filtered to `web/**`), the web app is what is deployed and what you gave me as the live product, and the two codebases are visually independent (`Theme.swift` is its own token set). [C]

Verdict: it exists and is structurally complete, but it is **not** evidence that new web screens must be built in SwiftUI. Treating the web app as the design target — as you instructed — is consistent with the repo. Whether the Swift target is still being maintained is a question only you can answer.

### 16.3 Firestore — source-level capability, not production-verified

**[UPDATED 4 Sep]** This section was written against the previous build and is superseded in three ways: (a) **anonymous auth is gone** — accounts are Google or an emailed link, and an older anonymous uid is *linked* rather than replaced; (b) **`firebase/firestore.rules` exists** (102 lines, read in full — the earlier "absent from the repo" claim was wrong) and defines two collections, `users/{uid}/…` (owner-only) and `published/{code}` (get-by-code, list denied, owner/editor writes, join-as-editor limited to appending your own uid); (c) **the share envelope is a real Firestore document** per link code, not a localStorage stand-in — localStorage now only mirrors the last-seen envelope for offline. Everything below still describes the storage/sync machinery accurately.

**Documented from source** (`persist.js`, `store.js`, `sync.js`, `net.js`, `config.js`):

- **Architecture.** `users/{uid}/trips/{tripId}` for the trip document, with sub-collections per `KIND` (days/items/notes/etc.). One `onSnapshot` on the trip doc plus one per kind. Copies are batched in chunks of 400 because "Firestore caps a batch at 500 writes". Photos: 320px data-URL thumbnail inside the doc (600 KB budget against the 1 MiB document limit), 1600px original to Cloud Storage.
- **Authentication.** `signInAnonymously` on first run; a real sign-in (email / Apple / Google) happens "at the last possible moment", and `store.signIn()` **keeps the anonymous uid** so existing notes, snapshots and roles keep pointing at it. Apple/Google are noted in `join.js` as needing a real client id and redirect. Rules live in `firebase/firestore.rules` — **referenced by `firebase.json` but not present in the repo** (a deploy of rules would fail, or is done out-of-band). [I]
- **Offline.** `initializeFirestore` with `persistentLocalCache` + `persistentMultipleTabManager`, wrapped in try/catch that falls back to `getFirestore` when IndexedDB is unavailable (private browsing) with a console warning. The service worker caches the app shell network-first, and kept map tiles cache-first in a deliberately un-versioned `travel-planner-tiles` cache so a deploy "must never throw away a download they waited on hotel wifi for".
- **localStorage fallback.** A second backend behind the same interface, used when Firebase is not configured **or cannot be reached**. `state.stranded` distinguishes "configured but unreachable → writes are stuck in this browser" from "offline but Firestore will replay". Every read/write is try/caught for private browsing. Active trip id, the outbox ledger, the local `me` identity and the share envelope all live in localStorage.
- **Sync/outbox.** `sync.js` keeps a durable ledger (last 400 entries) of *what* is outstanding, never the payload ("the data is already in the store"). It survives launches, so "stuck for three days" can be true. Surfaces as the sync dot (ring saving / jade saved / amber queued / red stuck / grey local-only), the amber-or-red strip above the tab bar, and the `#stuck` screen.

**Not verified in production.** My session ran on the **localStorage path** (`state.mode === 'local'`), so no Firestore write, snapshot, multi-device merge, share/review round-trip or Storage upload was exercised. Additionally: the missing `firestore.rules` file means the deployed security rules are unknown, and whether any real user data exists is unknown. Treat every claim in this sub-section as **source-level capability only**.

### 16.4 Existing inconsistencies — preserved

Recorded, not fixed. §12 stands as the register; nothing will be standardised unless the new feature forces it and you approve it. The visual reference repeats the values as they are, including the unloaded 550/650 weights and the 14 radii.

### 16.5 Source-only screens — inspected, not implemented, not drawn

Structure documented (§3 rows 6, 14, 15, 18–19 and the board's section 03); appearance explicitly marked **SOURCE-ONLY — VISUAL NOT VERIFIED**. No time spent implementing or changing them.

### 16.6 Responsive support — mobile only, by construction

- `#app { max-width: 520px; margin: 0 auto; height: 100dvh; overflow: hidden }` — the layout cannot reflow; on any wider viewport it stays a 520px column.
- The **only** breakpoint is `@media (min-width: 560px)`, and it changes nothing structural: page background `#E4E6E2` and a 1px hairline ring on the shell — i.e. a phone-on-desktop presentation frame.
- `viewport-fit=cover, maximum-scale=1`, `env(safe-area-inset-*)` throughout, `overscroll-behavior-y: none`, `-webkit-tap-highlight-color: transparent`, zeroed scrollbars, `touch-action` tuning on swipe rows and sheet handles: every affordance is touch-first. There are **no hover states in the stylesheet** and no visible focus ring on any button.
- `color-scheme: light`; no dark mode, no `prefers-color-scheme` rule.

Verdict: **mobile-first (really mobile-only) is the current and intended target.** Nothing in the source hints at a tablet or desktop layout. No desktop redesign attempted.

---

## 17. Visual Validation

### 17.1 Screens visually verified (20)

Captured from the running `web/` build in the standard **390 × 844** mobile design frame (1:1, identical scale for every screen — the app rendered at 390px wide and captured as-is; no stretching, no re-spacing, no taller canvases). PNGs at `docs/design/screens/current/` — **re-captured 4 Sep 2026** against the current build; the earlier `screens/mobile/` set is superseded and deleted.

`01-trips-home` (with the account row) · `02-sign-in` (new) · `03-new-trip-modal` · `04-map-home` · `05-map-focused` · `06-plan-read` · `07-plan-edit` · `08-plan-empty` · `09-destination` · `10-nearby` · `11-shop` · `12-spend` · `13-prep` · `14-log` · `15-note-editor` · `16-trip-settings` · `17-share` · `18-offline-areas` · `19-paste` · `20-join-dead-link` (new)

Board: **`Existing UI Visual Reference.dc.html`** — the 20 screens annotated, five source-only screens marked as unverified (plus one partly verified), plus pattern/colour/type boards drawn with the literal `app.css` values and the real `util.js` icons.

### 17.2 Screens source-only — VISUAL NOT VERIFIED (5, plus one partly verified)

Sub route (`#sub`) · Draw an area (`#area`) · Review an update (`#review`) · Changes on this phone (`#stuck`) · Paste review pass. **Partly verified:** Join — the expired-link ending is captured (frame 20) and its sign-in phase is the shared panel captured in frame 02, but the live invite (from-line, read-only Day 1, three promises, sticky foot) needs a real published envelope from another account. Each of the five needs a second person, a real drag or an actual sync failure. Structure is described from source; appearance is **not** established and no mockup of them exists.

### 17.3 Important visual observations (from the captures)

1. **The five-tab bar is genuinely absent** on My trips — confirmed, not just declared in source. Trip-level and app-level are different worlds.
2. **Edit is a mode, not a screen.** Plan's pencil turns jade in place; times become inputs, badges become rust `✕`. No separate editor route.
3. **Provenance is always visible on the right** of a row (`MAIN 1`, `SUB`), and always in the badge family — never in the title.
4. **The sorted-by metric is the ink chip.** On Nearby, `walk 2` is grey, `2 min` is ink, `stay ~20 min` is amber: the emphasised chip tells you what the list is ordered by.
5. **Money is always doubled**: actual against estimate, plus a home-currency conversion with its rate. Never a single figure alone.
6. **Advice and record are kept visually separate** on Prep — "what to wear" (suggestion) above "what I am actually bringing" (yours), the amber/jade split doing the work.
7. **Amber = in progress** is used temporally too, not only for authorship: the live day's meta line on Log is amber.
8. **The best pattern in the app** is the offline-areas caveat: name the problem, list exactly what is affected, offer the single fix as one ink button. Worth copying for any new warning.
9. **Empty states teach the data model** rather than apologising ("the gaps between them become free time by themselves").
10. **Hatched placeholders are everywhere** and read as intentional, not broken — hero, thumbs, log photos, covers, outfit reference.
11. **Desktop is a letterbox**: above 560px the 520px shell sits centred on `#E4E6E2` with a hairline. The 520px cap is a web-shell constraint, not a design width — at the 390px design frame the app is simply under the cap and lays out identically.
12. **No focus ring, no hover** anywhere in the captures — consistent with the stylesheet.
13. **Sign-in never blocks the product.** It is offered in two places only — the account row and after accepting an invite — and both state what it buys ("your trips follow you to a new phone", "so your name appears on what you change") rather than gating anything. The signed-out account row reads "Everything is on this phone".
14. **The expired-link screen lists the other endings.** Rather than a bare error, join shows the failure, the one recovery action, and then cards describing what the other outcomes look like — unusual, and the most explanatory screen in the app.

### 17.4 Important reusable patterns (ranked for a new screen)

1. `.screen` → `.head` → one `.scroll` shell, 16px sides.
2. `backHeader()` for any push screen; `✕` + title + jade Save for any editor.
3. `.card-list` r16 with 1px `#F0F2F0` row hairlines.
4. Button ladder: ink act / jade save / ghost alternative / dashed add.
5. `.form` (1.5px ink border) inside `.scrim` + bottom `.modal` for any correction.
6. `swipeToDelete()` + the app-wide undo bar for any removal.
7. `.warn` on the row, naming the fix.
8. `dayPills()`, `tripChip()`/`syncDot()`, `weatherBanner()`, `checkbox()` for trip-scoped chrome.
9. `draggableSheet()` (3 detents) for anything over a map.
10. Ink `.dock` that names its target for any bulk/holding action.

### 17.5 Remaining uncertainties

- Appearance of the six source-only screens.
- Production Firestore behaviour: multi-device sync, share → join → review round-trip, Storage uploads, and the contents of the missing `firebase/firestore.rules`.
- Android installability (missing manifest) and real-device iOS PWA rendering with notch safe areas.
- Whether the SwiftUI target is still maintained, and whether it must track new web screens.
- Real photography in place of the hatched placeholders — no real asset has ever been seen in this UI.
- Whether the demo trip ("Meridian City · Group Tour") is the only data that exists, or whether real user trips are live.

---

## 18. Visual Reference Revision

**4 Sep 2026 — baseline refresh.** Re-inspected the current repository (`main`, tree `4698f0e4a8b8`) and re-ran the current `web/` build. One commit had landed since the first pass, touching `web/index.html`, `web/js/app.js`, `web/js/persist.js` (9.4 KB → 22.6 KB), `web/js/store.js` (114 KB → 130 KB), `web/js/screens/{trips,join,parts}.js`, `web/css/app.css` (+478 bytes), `web/sw.js`, `firebase/firestore.rules` and three docs.

### What was outdated

1. **"Anonymous auth"** — the app no longer creates anonymous accounts. Sign-in is Google (popup, falling back to redirect) or an emailed sign-in link; an existing anonymous uid is *linked* so no data moves. `firestore.rules` states this in its own header comment.
2. **"No sign-in UI outside the join flow"** — there is now a shared `signInPanel()` / `mountSignIn()` in `parts.js`, used both by the trips home and by join.
3. **"Trips home = header + status groups"** — an account row (`.acct`) now sits above the list. This is the only new CSS in the commit.
4. **"The share envelope is localStorage; item 31 is swapping the two"** — it is now a real Firestore collection, `published/{code}`: one document per link code, `get` allowed to anyone holding the code, `list` denied, an editor claimed by adding your own uid and changing nothing else. A localStorage *mirror* of the last-seen envelope remains, for offline.
5. **"`firebase/firestore.rules` is referenced but not present"** — **wrong, and now corrected.** The file exists and is substantial (102 lines); it did not appear in the file listing used at the time because `.rules` is not an importable file type.
6. **"`js/share.js`, `screens/share.js`, `screens/join.js`, `screens/review.js` are missing from the service-worker list"** — fixed upstream; `sw.js` is at `v5` and includes all four, and the stale `screens/mustsee.js` entry is gone.
7. **`index.html`** — now declares `<base href="/">` so an invite path resolves the app's relative assets, and `app.js` awaits `openLink(code)` before rendering the join screen; the landing route is decided by what `boot()` actually opened (`state.tripID`) rather than by what was remembered.
8. **Screen count** — the reference covered 18 screens; it now covers 20.

Still true: `manifest.webmanifest` is referenced by both `index.html` and `sw.js` and still does not exist in the repo.

### What was corrected

- §2 (technology table): data layer, offline, routing rows.
- §16.1 / §16.3: the manifest note, the rules-file claim, and the whole auth/sharing description.
- §17: verified/source-only lists and the visual observations.
- `docs/design/existing-ui-visual-reference.md`: rewritten with the current screen set, the account-row and sign-in patterns, and a revision log of its own.
- `Existing UI Visual Reference.dc.html`: all frames re-captured and re-annotated, two frames added, source-only set reduced from six to five plus one "partly verified".
- Screenshots: `docs/design/screens/mobile/` replaced by `docs/design/screens/current/` (20 frames, all 390 × 844).

### Which screens changed

| Screen | Change |
|---|---|
| Trips home | **Visibly changed** — `.acct` row added above the list; empty-state copy now differs signed in vs signed out || Sign in | **New screen state** — bottom-docked sheet with the shared sign-in panel |
| Join | **Newly verifiable** — the expired-link ending renders and was captured; the live invite still is not reachable |
| Share | Unchanged visually; the backend beneath it is now a real Firestore envelope |
| Map, plan (read/edit/empty), destination, nearby, shop, spend, prep, log, note editor, trip settings, offline areas, paste | **Source files unchanged**; re-captured anyway and confirmed pixel-consistent with the previous pass |

### Remaining uncertainty
- The live invite, review, sub route, draw-area, stuck-changes and paste-review screens are still unrendered (need a second account, a real published envelope, a drag, or a sync failure).
- Production auth is unverified here: my session ran on the localStorage path, so Google popup, the emailed link round-trip, the local→account migration and the `published/{code}` rules were read, not exercised.
- Whether Android installability was ever intended (the manifest is still missing) and how the real device renders safe areas.
- Whether the SwiftUI target tracks these auth changes — it was not touched by this commit.
- Whether further commits have landed since this refresh; re-capture before trusting a frame if the tree hash has moved.
```
