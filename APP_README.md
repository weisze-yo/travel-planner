# Travel Planner — iOS app

Native SwiftUI implementation of the Claude Design handoff in `project/Travel Planner.dc.html`
(turn 2 — the iteration that includes all 13 change requests and Jelene's review comments).

- **UI:** SwiftUI, iOS 17+, iPhone portrait
- **Map:** MapKit — real tiles, real pins, real polylines, with hand-off links to Google Maps and Apple Maps
- **Backend:** Firebase — Firestore for trip data, Anonymous Auth for the account, Cloud Storage for log photos
- **Weather:** Open-Meteo (no key, no entitlement) feeding the day pills, the Plan banner, the Prep forecast strip and the outfit advice

Everything is English for now; the string content is centralised enough that 中文 is
a follow-up pass rather than a rewrite (see *Not done yet* below).

## Opening it

The app is a Swift Playgrounds app package (`TravelPlanner.swiftpm`), so there is no
`.xcodeproj` to get out of sync:

```bash
open TravelPlanner.swiftpm     # opens in Xcode 15+
```

Xcode treats it as an iOS app target and resolves the Firebase SPM dependency on first
open (a couple of minutes). Then pick an iPhone simulator and run.

To run on a physical device, set `teamIdentifier` in `Package.swift` to your Apple
Developer team, or let Xcode set signing automatically when it prompts.

## Connecting Firebase (required before first run)

1. In the [Firebase console](https://console.firebase.google.com), create a project.
2. **Add app → iOS**, bundle id `com.meridian.travelplanner` (or change
   `bundleIdentifier` in `Package.swift` to whatever you prefer and use that).
3. Download `GoogleService-Info.plist` and drop it into
   `TravelPlanner.swiftpm/Sources/Resources/`, named exactly that. It is git-ignored;
   `GoogleService-Info-SAMPLE.plist` next to it documents the same steps.
4. In the console enable:
   - **Authentication → Sign-in method → Anonymous**
   - **Firestore Database** (production mode)
   - **Storage** (only needed for log photos)
5. Publish the rules in `firebase/`:

```bash
firebase deploy --only firestore:rules,storage
```

Without step 3 the app opens on a "No Firebase configuration found" screen that tells
you the same thing.

## What happens on first launch

The app signs in anonymously and seeds the demo trip from `SeedData.swift` — the
Meridian City group tour from the design, with Day 3 fully populated: 8 itinerary rows,
14 nearby places, a 3-stop sub route, 8 shopping items, 4 must-see shots, 15 packing
items and 2 log days. That gives you something to tap through immediately, and it
mirrors the mockups screen for screen.

Seeding only happens when the trip document does not exist, so it never overwrites real
data. To start clean, delete `users/{uid}/trips/meridian-city` in the Firestore console.

Place names are the design's fictional ones; coordinates are real central-Tokyo values
so the map has real streets under them. Swap both when you import a real itinerary.

## Firestore layout

```
users/{uid}/trips/{tripId}                 Trip: name, dates, currency, forecast, prep categories
users/{uid}/trips/{tripId}/days/{dayId}    TripDay, itinerary rows nested in order
users/{uid}/trips/{tripId}/places/{id}     Nearby pool + places the traveller added
users/{uid}/trips/{tripId}/subRoutes/{id}  One sub route per day
users/{uid}/trips/{tripId}/shopping/{id}   Shopping items
users/{uid}/trips/{tripId}/mustSee/{id}    Must-see shots
users/{uid}/trips/{tripId}/prep/{id}       Packing items
users/{uid}/trips/{tripId}/log/{id}        One note per day
users/{uid}/trips/{tripId}/outfits/{id}    What the traveller actually packed, per day
```

Lists that change a row at a time each get their own collection, so two devices editing
different rows never clobber each other. A day's itinerary is one document because
reordering rewrites the whole sequence anyway.

Firestore's on-device cache is enabled (`PersistentCacheSettings`), so the trip is
readable and editable without signal — which is when free time usually happens.

## Code map

```
Sources/App/          TravelPlannerApp (entry), Theme (design tokens)
Sources/Models/       Models (Codable domain types), SeedData (the demo trip)
Sources/Services/     FirebaseBootstrap, TripRepository, TripStore, WeatherService, PhotoService
Sources/Views/        RootTabView + one folder per screen
```

`TripStore` is the single source of truth: it owns the trip, mirrors the prototype's
derived values (sub-route arrival times and buffer, spend by payment method, packing
progress) and writes every mutation through to Firestore.

## Screens, against the design

| Design | Screen | Notes |
|---|---|---|
| 2a | `Views/Map/MapHomeView` | Map is home. Main route solid jade and numbered, sub route dashed amber, every pin opens its place. Day pills carry the day's weather. Pencil bottom-right opens Plan in edit mode; pulling the sheet header up opens Plan. |
| 2b | `Views/Plan/PlanView` | MAIN/SUB badges, weather banner, Edit mode: hold the handle to drag, ✕ removes into a dark archive with Add back and Move to, times become editable, + Add a stop picks from saved or nearby places. |
| 2c | `Views/Destination/DestinationView` | Need-to-know table, Google/Apple Maps hand-off, five tabs, doorways to Nearby and Must-see, shop-here, Add a note. Also renders sub-route places. |
| 2d | `Views/Destination/NearbyView` | Every place, no time gate. Sort icon top right (travel time / stay time), category filter row, multi-leg journeys spelled out, + Add a place myself geocodes the name with MapKit. |
| 2e | `Views/Destination/SubRouteView` | Drag the handle to reorder — arrival times and buffer recompute. Return row is editable (coach / next stop / hotel / station + minutes). Send walk to Maps. |
| 2f | `Views/Shop/ShopView` | Optional estimate, PAID field on tick, date stamped on tick and cleared on untick, payment chip cycles, manual add with the place as a dropdown of your own stops, footer breaks spend down by payment method. |
| 2g | `Views/Destination/MustSeeView` | Example shots with a tick when you have got it, outfit advice derived from the day's real forecast, plus "what I am actually bringing". |
| 2h | `Views/Prep/PrepView` | Six-day forecast strip, why-lines, packed-in chip cycles through Not packed / Suitcase / Carry-on / Backpack, add items and categories. |
| 2i | `Views/Log/LogView` | Day cards with photos, spend and chips, plus the after-the-trip recap card. |
| 2j | `Views/Log/NoteComposerView` | Day, date, place and note. Photos upload to Cloud Storage. Spend is not entered — it totals from the shopping list. |

Deliberate departures from the prototype:

- **Tab bar glyphs** are SF Symbols rather than the prototype's CJK placeholder glyphs.
- **Font** is the system font, not Public Sans. To match the mockups exactly, add the
  Public Sans `.ttf` files to `Sources/Resources`, declare them in the app manifest, and
  point `Typo` at them.
- **The map** is real MapKit, so it looks like a map rather than the prototype's
  illustrated SVG. Route colours, pin shapes and numbering follow the design.
- **Photos** are diagonal-hatch placeholders exactly where the prototype had them; the
  log is the one place real photos are uploaded and shown.
- **Trips screen** (`1j` in turn 1) is not built — turn 2 does not include it, so the
  header chip shows the current trip without navigating.
- **Sub-route walk distance** is derived from moving minutes at an 80 m/min pace rather
  than a fabricated figure.

## Not done yet

- **中文 / language toggle.** The EN button on the map explains this rather than
  pretending to switch. Doing it properly means a string catalogue
  (`Localizable.xcstrings`) plus zh values for the seeded content — the design already
  specifies every string, in `Screen.dc.html`.
- **Real itinerary import** (paste / photo / PDF of an agent itinerary). Seeding stands
  in for it.
- **Sign in with Apple.** Anonymous auth works today; linking preserves the uid.
- **Live currency rate.** `Trip.homeCurrencyRate` is a stored number (33.7 ¥/RM).
- **Offline map tiles.** Firestore data is cached; MapKit tiles are not.
- **Travel times** on nearby places are the design's static figures. MapKit
  `MKDirections` could compute them per leg.

## Verification status

**Not compiled or run.** This was implemented in a Linux container with no Xcode, so no
part of it has been through the Swift compiler or a simulator. Treat every screen as
unverified until you have tapped through it on a device.

What was done instead:

- A second reviewer read every file against the iOS 17 / Swift 5.9 / Firebase 10.29 APIs.
  It found four real defects, all fixed: `TripStore` missing `import SwiftUI` (which
  covers `ObservableObject`, `@Published` and `move(fromOffsets:toOffset:)`),
  `FirebaseBootstrap` missing `import Combine`, `.onAppear(perform:)` handed a function
  with a default argument, and an `Int(Double)` trap reachable by typing a very large
  price into the PAID field.
- Every initializer label, argument order and memberwise-init call was checked by hand,
  and a delimiter/interpolation balance pass runs clean across all 22 files.

Expect a handful of small build errors on first open regardless — that is the normal cost
of writing Swift without a compiler in the loop.
