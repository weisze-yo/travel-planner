# P0-2 — Currency Inference & Currency Identity

**Date:** 5 Sep 2026 · **Verified against** the working tree in this project (`web/**`), read this session
**Status:** design, for review. **Nothing implemented. No application code changed.**
**Artboard:** `P0-2 Currency Identity.dc.html` — every frame 390 × 844, light only.
**Canonical:** this document. The artboard illustrates it and adds nothing to it; §9 is the only source of copy.

**Source read for this session:** `web/js/currency.js` (whole) · `web/js/net.js` `geocode()` (the `countryCode` return) · `web/js/store.js` `createTrip()` (~694–762), `updateTrip()` (~3034–3053), `rateLine()` (~3022), `shareSnapshot()` (~3306), `joinTrip()` (~3720–3745) · `web/js/screens/trips.js` `addForm()`, `[data-act="add-save"]` · `web/js/screens/trip.js` (the `THE TRIP` and `MONEY` cards, `[data-act="save"]`) · `web/js/screens/shop.js`, `spend.js`, `dest.js`, `trips.js` (every money consumer) · `web/js/data.js` (`seed.TRIP`).

**Inherited and not reopened:** the semantic colour contract (jade = given · amber = yours/uncertain/a guess · ink = the act · rust = broken) · "a warning always names the tap that fixes it" · fact-first warning structure (`multilingual-warning-strip-design.md`, approved) · the three-tier empty-state grammar · P0-1's rule that where a capability does not exist the control does not exist · P0-5's pending rule (this document depends on it and states the dependency at §7.4).

---

## 1. What the app actually does today

Verified by reading, not assumed.

### 1.1 The inference

`createTrip({ name, startDate, dayCount, locationName })`:

1. Builds the trip from `seed.TRIP` but **deliberately blanks** `currencySymbol`, `currencyCode`, `homeCurrencyRate`, `rateSource`, `rateUpdatedAt`, `latitude`, `longitude`, `locationNotice`. `homeCurrencyCode` is **not** blanked — it stays `'MYR'` from the seed.
2. If a city was typed and the app is online, it `await`s `geocode(place)`.
3. On a hit: sets `latitude`/`longitude`, then `currencyForCountry(hit.countryCode)`. If the table knows the country it sets `currencySymbol` + `currencyCode`, then `await`s `fetchRate(code, 'MYR')` and, on success, sets `homeCurrencyRate`, `rateSource` (`ECB <date>`) and `rateUpdatedAt`.
4. Then `backend.createTrip`, `openTrip`, `updateTrip({startDate, dayCount})`.

**Create is already a network-blocking act.** The two `await`s happen *before* the trip exists. The caller in `trips.js` closes the modal *first* (`addOpen = false`), writes `busy = "Creating {name}…"` to the top of the My-trips scroller, and on resolution runs `go('paste')`. So the user waits on two network calls with the form already gone, and is then moved to a different screen.

### 1.2 The five outcomes, and how many the app accounts for

| # | Outcome | What is set | What the user is told |
|---|---|---|---|
| 1 | **Resolved** — country known to the table | coords, symbol, code, and usually the rate | **nothing** |
| 2 | **Resolved, rate failed** | coords, symbol, code; rate `null` | nothing (Trip settings' `rateLine()` later reads "Not set yet — enter it, or fetch it once a currency is set.") |
| 3 | **Located, currency unknown** — Nominatim returned no `country_code`, or a country the table has no row for | coords only; **currency stays empty** | **nothing at all — no notice is written** |
| 4 | **Not found** | nothing | `locationNotice`: `Could not find "X" — the map centre and currency are not set. Fix it from Trip settings.` |
| 5 | **Offline / lookup threw** | nothing | `locationNotice`: the `Offline, so "X"…` or `Could not look up "X"…` string |

Outcome 3 is an **unhandled state**, not a copy problem: the trip is placed on the map and priced in nothing, silently. The table covers ~190 rows but genuinely omits, among others, `aw` Aruba, `cw` Curaçao, `pr` Puerto Rico, `re` Réunion, `bm` Bermuda, `gp`, `mq`, `nc`-adjacent territories, and every entry Nominatim returns without an `address.country_code`.

### 1.3 Two defects that decide this design

**(a) An unset currency is not neutral — it renders as ¥.** Every consumer reads `state.trip?.currencySymbol || '¥'`:

- `screens/shop.js` (item rows + footer spend card), `screens/spend.js` (hero + day chart), `screens/dest.js` (`shopPanel`, `sheetMarkup`), `screens/trips.js` (both card variants), `store.js` `dayChips()`.

So outcomes 3, 4 and 5 produce a trip that **prices everything in the demo trip's yen** while the store correctly believes the currency is unset. The home side does the same: `≈ ${homeCurrencyCode || 'RM'}` against `homeCurrencyRate || 1`, i.e. an unset rate silently means **1:1**.

**(b) The remedy the copy prescribes does not restore the currency.** Two of the three notices say "Fix it from Trip settings." On Trip settings, changing `City or area` runs `updateTrip()`, which re-geocodes, sets `latitude`/`longitude`, and **clears `locationNotice`** — but it never calls `currencyForCountry`. The currency is *only* ever derived inside `createTrip`. So following the instruction clears the warning, fixes the map, and leaves the money exactly as broken as it was — now with nothing on screen to say so. The user must know to type `JPY` and `¥` into two free-text fields by hand.

Both are UX facts, not code style, and this design has to answer them.

---

## 2. The decision, stated

1. **The inferred currency is shown in the New trip modal, before Create** — as a derived line under the `City or area` field, in the app's existing "machine guess" idiom (amber).
2. **The lookup is triggered by the city field, not by Create.** It runs on `change` (the app's universal commit event), so the answer — success or failure — is on screen *before* the decision to create, on the screen where the mistake was made.
3. **Create is never gated on the currency.** It stays enabled in every state, including offline and unresolved.
4. **An unresolved currency is rendered as unresolved, not as yen.** Money with no currency shows the number without a symbol, and the two screens that *summarise* money say so in one amber line.
5. **Correction lives in Trip settings' MONEY card**, which already owns it, and the city field there gains the re-derivation the notices already promise — as an **offer**, never an overwrite.
6. **The country is always named beside the currency.** A symbol alone is ambiguous (`$` is USD, ARS, MXN; `¥` is JPY and CNY; `£` is GBP and EGP; `kr` is ISK, DKK, SEK and NOK), so every provenance line carries **symbol + ISO code + the place it came from**.

---

## 3. Where the guess appears during New trip

The modal keeps its four fields, its two buttons and its `.form-hint`. One derived line is added, directly beneath `City or area`, in the slot a form hint already occupies. **No new field, no new control, no second modal step.**

```
┌ .form (white, 1.5px ink border, r18) ───────────────┐
│ New trip                              12.5/800      │
│ [ Where are you going? ]                            │
│ [ City or area (centres the map) ]                  │
│ ▸ the derived line — one of the six states in §4    │
│ [ date ]                    [ 5 ]                   │
│ [ Create ]            [ Cancel ]                    │
│ It goes straight to pasting the itinerary in…       │
└─────────────────────────────────────────────────────┘
```

**Why here and not as an editable currency field.** Considered and rejected (§8, alternative A). The app's own convention is that a machine guess becomes editable **in a review pass** — that is what `input.guessed` is for, and it exists in exactly one place: the Paste review rows. The New trip modal is not a review pass; it is four facts and a button. Two currencies (`currencyCode` and `homeCurrencyCode`) plus a rate cannot be edited responsibly in it, and Trip settings already has all three fields laid out. The modal's job is to *disclose* the guess and name where it is corrected.

**Why below the city field and not at the bottom of the form.** It is derived from that field and changes when that field changes; it is the field's own consequence. This is the same relationship `locationNotice` already has with the `City or area` field on Trip settings — the hint slot under the input — so the two screens agree.

---

## 4. States of the derived line

One element, six states. Type: 11px / 400 / line-height 1.45, 2px top margin — the existing `.form-hint` geometry — recoloured per state. No icon, no spinner glyph.

| # | State | Colour | Line (exact copy in §9) |
|---|---|---|---|
| 0 | **Idle** — city empty or untouched | `--soft` #98A5A0 | the existing hint: `Used to centre the map and to look up places you add` |
| 1 | **Pending** — lookup in flight | `--amber-fg` #8A5A08 | `Looking up Kyoto…` |
| 2 | **Resolved** | `--amber-fg` on nothing (text only) | `Prices in ¥ JPY — from Kyoto, Japan` |
| 3 | **Located, no currency known** | `--amber-fg` | `Oranjestad, Aruba — no currency known for it, so prices stay unset. Set one in Trip settings.` |
| 4 | **Not found** | `--danger-fg` #9B4B4B | `Nothing found for "Kyotoo" — the map centre and the currency stay unset. Try another spelling, or set both in Trip settings.` |
| 5 | **Offline** | `--danger-fg` | `No signal, so "Kyoto" was not looked up. The trip is made anyway — set the currency in Trip settings, or fix the city there once you have a signal.` |

**Why amber for a success (state 2) and not jade.** Because it is a *guess*, and amber is the app's word for "yours or uncertain". Jade would mean "given and settled", which is what the currency becomes only once the user has seen it or set it. This is the same reasoning that puts `input.guessed` in amber on the Paste review pass, and it is the reason the line is worth adding at all: a silent correct guess and a silent wrong guess look identical.

**Why rust (not amber) for states 4 and 5.** Something the user asked for did not happen. Amber is "uncertain"; rust is "broken". The failure of a lookup is the latter, and the app already uses rust for exactly this string family (`trip.locationNotice` renders as a rust field hint today, verified in `screens/trip.js`).

**State 3 is new behaviour, not just new copy.** The store must write a notice for the located-but-unpriced case, which today it does not.

### 4.1 Text-only, deliberately

No border, no fill, no strip. The modal is already a bordered white card on a scrim with an ink border — putting an amber `.hint-amber` block inside it would make a warning of a normal outcome and would push `Create` toward the fold on a 390 × 844 frame. Type colour carries the whole distinction, which is what `.form-hint` already does.

---

## 5. Create, and what happens after it

**Create is enabled in all six states.** Nothing about money should stop a trip existing; the app's stated position is that everything works with no signal, and a trip with no currency is a working trip with unpriced numbers.

| When Create is pressed | Behaviour |
|---|---|
| **The lookup has already answered** (states 2–5, the normal case) | Unchanged: `Create` swaps to `Creating…` and disables (P0-5), the trip is made, the app goes to Paste. No further currency message — it was read in the modal. |
| **The lookup is still in flight** (state 1) | The modal **stays up** with `Creating…` on the button until `createTrip` resolves, rather than being torn down over a wait that has an outcome. If the outcome is a failure (states 3–5), it is carried to the **top of the Paste screen** as one `.amber-note`, because Paste is the screen the app actually moves to. |
| **No city was typed** | Unchanged in every respect. There is nothing to infer and nothing is said. |

**The single most important change in this section:** the failure is reported on a screen the user is *on*. Today all three failure strings are written to a screen the app never sends anyone to. The modal reports it in the ordinary case; Paste reports it in the raced case; Trip settings keeps it as the standing record. No string is ever the only account of a failure on a screen nobody opens.

**Not designed here, deliberately:** whether the forced jump to Paste is right at all. That is an existing P1 decision (`ui-ux-design-coverage.md` §2A) and this design works either way.

---

## 6. Correcting it later — Trip settings

### 6.1 The MONEY card gains a provenance line

The card keeps its three fields (`Symbol`, `Spending in`, `Your currency`) and its `Rate` field with `rateLine()`. One 11px `--soft` line is added under the first row, answering "where did this come from":

| Case | Line |
|---|---|
| Derived at creation and untouched | `From Kyoto, Japan — the city above.` |
| Typed or changed by the user | `You set this.` |
| Came from a joined copy | `From the copy you joined.` |
| Empty | `Not set — prices show without a symbol until this is filled in.` |

The joined-copy case is real and already implemented: `joinTrip()` copies `currencySymbol`, `currencyCode` and `homeCurrencyRate` off the snapshot and clears `locationNotice`. It ties to P0-1: a joined trip's money is *given*, like the rest of the copy.

### 6.2 The city field re-derives — as an offer

Changing `City or area` on Trip settings today re-geocodes and clears the notice. Designed behaviour, in two branches:

- **Currency is currently unset** → adopt the derived currency silently and say so in the field's hint, jade because it is now settled: `Kyoto, Japan — prices set to ¥ JPY.`
- **Currency is already set and the new country's currency differs** → **never overwrite.** The MONEY card shows one amber row: `Kyoto is in Japan. Price this trip in ¥ JPY?` with a single ink `.btn.sm` `Use ¥ JPY`. Dismissed by changing nothing; it disappears once the currencies agree or the user acts.

**Why an offer.** Money the user has typed is theirs; re-deriving over it is the store making a product decision on their behalf. The offer is also the honest way to handle the trip that was created offline: come back with a signal, fix the city, and the currency follows — which is what the offline notice promises and what today's code does not deliver.

**Rate.** Adopting a currency (either branch) leaves `homeCurrencyRate` alone and does not fetch anything. `rateLine()` already tells the truth about an unset rate, and the existing `Fetch` control already exists for the user to act. No automatic network on a settings edit.

---

## 7. Interaction with existing pricing

### 7.1 An unset currency renders as unset

The `|| '¥'` fallback in five modules is a defect with a UX consequence and this design replaces it with one rule:

> **No currency, no symbol.** A money value with no `currencyCode` renders as the bare number with `tabular-nums` and nothing in front of it.

And, so that a bare number is never mysterious, the two places that *summarise* money carry one line:

- **Shop** — the footer spend card: `Prices have no currency yet. Set it in Trip settings.`
- **Spend** — under the ink hero: the same line.

Everywhere else (item rows, day chart, place sheets, My-trips stat chips) shows the bare number and no line. This follows the approved empty-state rule "**do not zero a summary**" and its sibling: do not *label* a summary with a currency the trip does not have.

**My trips stat chips:** the money chip is **omitted**, not zeroed and not yen-labelled, when the currency is unset — again the approved rule.

### 7.2 The home-currency conversion

`homeCurrencyRate || 1` silently converts at parity. Designed rule: **with no rate there is no conversion row.** The `≈ RM` block on Shop and Spend is not rendered when `homeCurrencyRate == null`, exactly as a summary card is removed rather than zeroed. `rateLine()` on Trip settings already names the fix, and it is where the fix is.

### 7.3 Nothing is migrated

No existing trip is recomputed, re-geocoded or re-priced by this design. A trip already priced in ¥ because of the fallback is indistinguishable in storage from a trip genuinely priced in ¥ (`currencyCode` is empty in the first case), so the rule in §7.1 corrects it the first time the trip is opened after implementation, with no data change.

### 7.4 Dependency on P0-5

The `Creating…` label swap, the disabled state and the "the surface that owns the work stays up until the work resolves" rule are **P0-5's**, stated in `p0-5-pending-work-design.md` §4 and §6. This document only names which controls they apply to (`Create`, and the Trip settings `Save`/`Fetch` pair). If P0-5 is rejected, the modal keeps `busy` at the top of the My-trips scroller and everything else in this document still stands.

---

## 8. Alternatives considered

**A · An editable currency field in the New trip modal** (`input.guessed`, amber border + `#FFFDF7` fill — the exact treatment named in the P0-2 decision brief §6). **Rejected, with reasons stated because this narrows an earlier recommendation.** It is the more literal reading of "show the guess", and `input.guessed` is the app's established amber-means-guessed control. But: (a) currency is three coupled values — trip currency, home currency, rate — and one editable field either implies the other two or invites a wrong pair; (b) `input.guessed` earns its editability in the Paste review pass, where the *point* of the screen is correcting the machine; the create modal's point is starting; (c) it grows the modal by a labelled field-row on a 390 × 844 frame where `Create` and the hint are already near the fold; (d) `Symbol` / `Spending in` / `Your currency` / `Rate` already exist, laid out, on Trip settings. The disclosure requirement — the user sees the guess before Create and is told when it failed — is met in full by the derived line. **This is a narrowing of the brief's recommendation, not a reversal: the guess is still shown in the modal before Create.** Recorded in the review pack as an autonomous decision.

**B · Confirm the currency as a step after Create.** Rejected. It puts a modal between the user and the itinerary they came to paste, and the app has exactly two blocking interactions today; this is not worth being the third.

**C · Guess from the trip name instead of the city.** Rejected. `name` is "Where are you going?" and is frequently a label ("Japan with Mum"), not a place. The city field exists and is already geocoded.

**D · Keep silence, and only fix the failure copy.** Rejected. It leaves outcome 1 — the *common* one — unaccounted for, and a silent correct guess and a silent wrong guess are the same screen.

**E · A currency picker (list of ISO codes).** Rejected as out of scope and out of character: `Spending in` is a free-text three-letter field today, `currency.js` is deliberately a keyless table, and a 160-row picker is a new component family for a value most trips never change.

---

## 9. Exact copy

**The canonical strings. The artboard may show these and nothing else.**

**New trip modal — the derived line**
> `Used to centre the map and to look up places you add` *(idle — unchanged existing hint)*
> `Looking up Kyoto…`
> `Prices in ¥ JPY — from Kyoto, Japan`
> `Oranjestad, Aruba — no currency known for it, so prices stay unset. Set one in Trip settings.`
> `Nothing found for "Kyotoo" — the map centre and the currency stay unset. Try another spelling, or set both in Trip settings.`
> `No signal, so "Kyoto" was not looked up. The trip is made anyway — set the currency in Trip settings, or fix the city there once you have a signal.`

**Create button while working** *(P0-5)*
> `Creating…`

**Paste screen, only when the lookup raced Create and failed**
> `Kyoto was not found, so this trip has no map centre and no currency. Both are on Trip settings.`

**Trip settings — MONEY provenance line**
> `From Kyoto, Japan — the city above.`
> `You set this.`
> `From the copy you joined.`
> `Not set — prices show without a symbol until this is filled in.`

**Trip settings — city field hint, after a change that resolves**
> `Kyoto, Japan — prices set to ¥ JPY.`

**Trip settings — the offer, when a set currency disagrees with the new city**
> `Kyoto is in Japan. Price this trip in ¥ JPY?`
> button: `Use ¥ JPY`

**Trip settings — the standing failure record** *(replacing the three current `locationNotice` strings; same slot, same rust hint)*
> `Nothing was found for "Kyotoo". The map centre and the currency are not set.`
> `No signal when this trip was made, so "Kyoto" was never looked up. The map centre and the currency are not set.`
> `"Kyoto" could not be looked up. The map centre and the currency are not set.`
> `Oranjestad, Aruba is on the map, but no currency is known for it. Set one below.`

*(All four drop "Fix it from Trip settings." — the user is already on Trip settings when they read it. The current strings tell the reader to go where they are.)*

**Shop footer card and Spend hero, currency unset**
> `Prices have no currency yet. Set it in Trip settings.`

---

## 10. Visual treatment

Literal values from `app.css`. **Nothing new.**

| Element | Treatment |
|---|---|
| Derived line, idle | existing `.form-hint` — 11px / 400 / `--soft` #98A5A0 / lh 1.45 |
| Derived line, pending + resolved + no-currency | same geometry, colour `--amber-fg` #8A5A08 |
| Derived line, not found + offline | same geometry, colour `--danger-fg` #9B4B4B |
| MONEY provenance line | 11px / 400 / `--soft`, 6px top margin, under the first field row |
| Trip settings city hint (resolved) | the existing field-hint slot, colour `--jade` #1F6F5C |
| Trip settings failure hint | unchanged — the existing rust field hint (`screens/trip.js` passes `Boolean(trip.locationNotice)` as the warn flag) |
| The re-derive offer | one row inside the MONEY card: amber text `--amber-fg` 12px/650 + ink `.btn.sm` (h38, 12.5px) `Use ¥ JPY`, `gap: 8px`, `flex-wrap` |
| Shop / Spend unset line | `.amber-note` — 12px / 650 / `--amber-fg`, in the card it belongs to |
| Money with no currency | the number only, `tabular-nums`, at its existing size and weight |
| `Creating…` | the existing `.btn.jade` with `[disabled]` (`opacity .45; pointer-events: none`) |

No new colour, no new radius, no new control height, no new component, no new CSS class beyond what P0-5 may add.

---

## 11. Long content, CJK and edge cases

| Case | Behaviour |
|---|---|
| **Long city + country** ("Ōtsuchi, Iwate Prefecture, Japan") | The derived line wraps to two lines at 11px within the modal's ~318px content width. Nothing truncates: it is a hint, not a row, and the modal grows by one line height. |
| **CJK city name** (`京都市`) | The line reads `Prices in ¥ JPY — from 京都市, 日本` if Nominatim answers in the local language. 11px is below the CJK floor established in the warning-strip work, **and this is accepted here**: the place name in this line is a *restatement of what the user just typed*, not a value they must find (the load-bearing rule — "generated copy and the user's name never share a line" — is about the warning strip's subject, which is another stop's name). If it ever becomes a value the user must read, it moves to its own 13px line by the same rule. Recorded as a knowing exception, not an oversight. |
| **Symbol collisions** | Never resolved by symbol alone. Every provenance line is `symbol + code + place`, so `$ USD — from Quito, Ecuador` and `$ ARS — from Buenos Aires, Argentina` are distinguishable at a glance. |
| **Currencies with no symbol in `SYMBOLS`** | `currencyForCountry` returns `{code, symbol: code}`, so the line reads `Prices in BWP BWP — from Gaborone, Botswana`. **Designed fix, presentational:** when symbol and code are equal, print the code once: `Prices in BWP — from Gaborone, Botswana`. |
| **Shared currency, different country** | Any Eurozone city gives `Prices in € EUR — from Lisbon, Portugal`. Correct and useful: it names the city, so the user can see the inference was about the right place. |
| **A country whose currency is not its own** (Ecuador/El Salvador/Timor-Leste → USD, Greenland → DKK, Côte d'Ivoire/Senegal → XOF, Palestine → ILS, Cook Islands → NZD) | The reason these are dangerous is that the user *cannot check them from the country name*, which is precisely why the line names the country and the code together rather than the symbol alone. No extra explanation is added: `Prices in $ USD — from Quito, Ecuador` is checkable. |
| **The trip name field is the place, the city field is empty** | Nothing is inferred; no line. Unchanged. |
| **A city that resolves to a different country than the user meant** ("Springfield") | The line is the whole defence: it names the country it found. Correcting the city re-runs the lookup. |
| **Two lookups in flight** (user edits the city twice quickly) | Only the last answer may write. A stale answer is discarded, never rendered — otherwise the line can end up describing the previous city. |
| **Rate fetch fails** | Silent, as today. The currency line is unaffected; `rateLine()` on Trip settings carries it. |

---

## 12. What another implementer needs, and does not have to guess

1. **Where the lookup runs.** A new function beside `createTrip` — `deriveCurrency(place)` — returning one of the six states. `createTrip` keeps its current behaviour; the modal calls the same function on the city field's `change`, and `createTrip` reuses the answer if it is already in hand for the same string.
2. **State 3 must write a notice.** `createTrip`'s `if (currency) {…}` needs an `else` that sets `locationNotice` to the located-but-unpriced string.
3. **`updateTrip` must derive currency** on a resolved city change, and must **not** overwrite a non-empty `currencyCode` — the offer in §6.2 is a render off `(derivedCode !== trip.currencyCode)`, not a write.
4. **Provenance needs one stored field.** `trip.currencyFrom`: `'city'` | `'user'` | `'joined'` | `''`. Written at creation, on manual save of the MONEY card, and in `joinTrip`. This is the only data-shape addition in this design, and it is what §6.1 renders. Without it, provenance would be guessed from whether `locationName` is non-empty, which is wrong for any trip whose city was set after the fact.
5. **The `|| '¥'` fallbacks come out** in `shop.js`, `spend.js`, `dest.js` (×2), `trips.js` (×2) and `store.js` `dayChips()`, replaced by "no symbol when `currencyCode` is empty". The `|| 'RM'` home-code and `|| 1` rate fallbacks come out with them (§7.2).
6. **`shareSnapshot()` already carries currency** — no change. `joinTrip()` already adopts it — no change beyond writing `currencyFrom: 'joined'`.
7. Nothing in this design needs a new CSS class, a new colour or a new control.

---

## 13. Status

| Item | Status |
|---|---|
| Guess shown in the modal before Create | **DESIGNED — awaiting sign-off.** Narrows the brief's `input.guessed` recommendation to a derived line; §8A states why. |
| Lookup on the city field's `change`, not on Create | DESIGNED — awaiting sign-off |
| Create never gated on currency | DESIGNED — awaiting sign-off |
| Six states of the derived line + exact copy | DESIGNED — awaiting sign-off |
| Failure reported in the modal, and on Paste when it raced Create | DESIGNED — awaiting sign-off |
| Located-but-unpriced (outcome 3) treated as a real state | **NEW — no prior design. Awaiting sign-off** |
| No currency → no symbol; summaries say so; chips omitted | **DESIGNED — awaiting sign-off. Highest-consequence item here** (it is the difference between "unset" and "silently yen") |
| No rate → no conversion row | DESIGNED — awaiting sign-off |
| Trip settings provenance line (`currencyFrom`) | DESIGNED — awaiting sign-off |
| Re-derive on a city change, as an offer that never overwrites | DESIGNED — awaiting sign-off |
| Rewritten `locationNotice` strings | DESIGNED — awaiting sign-off |
| Whether the forced jump to Paste is right | **DEFERRED** — existing P1, unaffected either way |
| Automatic retry of a failed lookup in the background | **DEFERRED** — deliberately not designed; retry is the user changing the city |
| An ISO currency picker | **REJECTED** (§8E) |

**One OPEN DECISION for the product owner** (in the review pack as **C-1**): *§7.1 — when a trip has no currency, do money figures show a bare number, or should the app refuse to show money at all until one is set?* Bare numbers is the recommendation (a number with no symbol is still true; hiding the shopping estimates punishes the user for a failed lookup). The alternative is defensible only if unlabelled money is considered worse than absent money. Everything else above is a UX/copy call and is made.

---

## IMPLEMENTED — `e81b439`, 5 Sep 2026

**Appended only. Nothing above this line was changed.**

Batch 2 of `transition-audit.md` §6 implemented this document in full.

**Nine sites, not eight.** The readiness map counted seven `|| '¥'` fallbacks
plus `itemEditor`'s default parameter. The ninth is `util.js`'s
`money(amount, symbol = '¥')`, which no document named: all 24 callers pass a
symbol today, so it was dormant, and removing the seven without it would have
left a trap that silently re-prices a trip in yen the first time a caller
omits the argument. All nine are gone and `test/currency.mjs` greps the
deployed source of seven modules for any return.

§4's six states of the derived line ship with the exact copy in §9 and the
colours §4 specifies, each driven through the real modal with the geocode
intercepted. **State 3 was new behaviour, as §4 says** — a city that resolves
to a country with no known currency previously wrote no notice at all. Create
is never gated (§2.3), asserted mid-lookup and offline. §5's raced-failure
report now lands on Paste, the screen the app actually moves to; all three
failure strings previously went to Trip settings, which the app never sends
anyone to after Create. §6.1's provenance line and §6.2's re-derivation offer
ship, and the offer never overwrites. §7.1's rule and §7.2's removal of the
parity conversion ship.

**Verified locally:** 55 checks at 390 × 844, 0 page errors, CJK measured.
**Verified in the emulator:** `two-phones.mjs` 65/65, including a city the
geocoder cannot find leaving currency and coordinates unset.

**One defect found while building, not in this document or the map:**
`updateTrip()` wrote the trip and updated `state.trip` but never touched
`state.trips`, the array My trips renders from. Editing a trip's name, dates
or currency left the card behind it stale until an unrelated action refreshed
the list. It has always been wrong; it matters now because §7.1 makes the
money chip's *presence* depend on the currency. Fixed in the store, one line.

**Supporting change:** `geocode()` now also returns `city`, `country` and a
short `place` ("Kyoto, Japan"). Every provenance line in §9 is written against
that short form; `display_name` is Nominatim's full administrative chain and
is far too long for a hint under a field.
