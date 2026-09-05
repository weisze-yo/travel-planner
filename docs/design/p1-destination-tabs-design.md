# P1 — Destination's five panels, and the rule for a form that refuses

**Date:** 5 Sep 2026 · **Verified against** the working tree in this project (`web/**`), read this session
**Status:** design, for review. **Nothing implemented. No application code changed.**
**Artboard:** none. The five panels are built and one 390px frame each would document appearance the app already defines; what they need is the **empty-state tiers** and the **currency rule** applied, both of which are approved and drawn elsewhere. Stated so the omission is a decision. *(If a frame set is wanted later, the five populated panels are the cheapest remaining verification unit in the product — see §8.)*
**Canonical:** this document for the five panels, the three editors, and **the silent-refusal rule** in §6, which is canonical app-wide.

**Source read this session:** `web/js/screens/dest.js` (whole — `subject`, `render`, `mount`, `panel`, `infoPanel`, `nearbyPanel`, `shotsPanel`, `shopPanel`, `logPanel`, `sheetMarkup`) · `web/js/screens/parts.js` `itemEditor` (493) / `readItemEditor` (537) / `shotEditor` (556) / `readShotEditor` (591) / `factsEditor` (610) / `readFactsEditor` (636) · `web/js/store.js` `nearbyPlaces` · `shotsFor` · `notesForPlace` · `PLACE_FACTS` · `loopSchedule` · `subSummaryLine` · `toggleSubRoutePlace` · `updatePlaceFacts` · `web/css/app.css` `.dest-*` (669–705) · `.essential` (707) · `.nearby-*` (744–754) · `.shot-*` · `.item-*` · `.empty` (419) · `.tab-count` (692–703).

**Fixed foundations, not reopened:** the **three-tier empty-state system** and its shared-kinds limit (P0-3 §1.2 / §1.4 — tier 3 is available only to `days`, `places`, `subRoutes`, `mustSee`) · **P0-2 §7.1** (no currency, no symbol; do not zero or mislabel a summary) · **P0-5** (pending on the control; `.amber-note` for outcomes) · **P0-1** (a joined copy is fully editable; never make a person the subject of a negative verb) · `p1-absence-and-removal-design.md` §3–4 (the no-subject branch and the no-position treatment) · the semantic colour contract · one ink primary per screen · 390 × 844.

---

## 1. Reconciliation RC-18 — the four "unseen tab bodies" are built

`p1-coverage-gaps-design.md` §8 and `overnight-p1-review-pack.md` §8 both defer *"Destination's four unseen tab bodies (Nearby / Must-see / Shop / Notes) — four screens, not four states … a batch of their own."*

**They are not four screens and they are not unwritten.** `dest.js` renders **five** panels behind one underline tab row, each with its own populated body, its own empty sentence, and its own add control. `counts` is computed for all five and rendered as a `.tab-count` bubble that turns jade when its tab is active. Every panel was read this session; **none of them needs designing.** What they need is three things applied, and all three are already approved:

| Panel | Populated body | Empty sentence today | What it needs |
|---|---|---|---|
| **Info** | `.card-list` of `.essential` key/value rows (80px uppercase key column) + ghost `Correct or add to this` | a `.card.pad` with `NEED TO KNOW`, a two-sentence teaching paragraph and a ghost `Write what to remember` — **already a tier-1 in-card treatment** | nothing |
| **Nearby** | `.nearby-card` rows (56px hatched thumb, name, price tier, `category · 12 min away`, a 34px `+`/`✓`) + `.btn-dashed` + the loop dock | `.empty`: `Nothing saved around this stop yet.` | tier check; the `No position` chip (absence doc §4.2) |
| **Must-see** | full swipe-rows: a photo block with a corner tick, title, tag, description, `where to find`, ghost `Edit this spot` | `.empty`: `No must-see spots noted for this stop yet.` | tier check |
| **Shop** | `.card-list` of `.item` swipe-rows (22px box, name, detail, estimate/paid) + a summary line + two buttons | `.empty`: `Nothing on your shopping list for this stop.` | **the currency rule** (§4) |
| **Notes** | a head row with a count and `+ Note`, then `.card` rows per note (time, day, text, photo thumbs), then a closing explanation | `.empty`: `Nothing logged about this place yet.` | tier check |

**One genuine design finding across all five**, and it is worth the pass: **three of the five empty sentences are the wrong tier on a joined copy, and one of them cannot be** (§3). That is the whole of the work here, plus the currency rule, plus a rule about forms that refuse.

---

## 2. What the screen is, recorded

**`subject()` resolves three ways** — a plan row (`itemID`), a saved place (`placeID`), or a fallback to the day's sub-route anchor — and returns one shape either way. The screen's own comment states the model: *"A stop is a visit to a place, so everything hangs off the place."* `anchorID` is the place id in both cases, which is why a stop and a place show the same five panels.

**One consequence worth stating**, because it looks like a bug and is not: **a place opened directly shows the same Shop, Must-see and Notes as the stop that visits it.** They are the same place. The `subtitle` differs (`category · price tier` instead of the stop's own subtitle) and the hero badges differ (`MAIN ROUTE · STOP 2` only for a stop). Everything else is identical by design.

**Tab state is module-level** (`let tab = 'info'`), so it persists across a repaint and resets on a screen change. Verified. Correct: the tab is a lens on one subject, and opening a different stop should start at Info.

**Every panel repaints through the store** (`store.selectDay(state.selectedDay)`), which is why the tab row and the sheets can both re-render from one place. Recorded so nobody replaces it with local re-render.

---

## 3. The empty states, tiered

Four of the five empties are the existing `.empty` block (pad 28·16, centred, 12.5px/1.5 `--soft`) — **tier 2**, which is correct on your own trip: the container is yours, the cause is that you have not filled it, and the add control is directly beneath. The Info panel is already richer, and is already tier 1.

**On a joined copy, three of them change tier and one does not.** P0-3 §1.4 fixed the rule: **tier 3 is available only to the four shared kinds** — `days`, `places`, `subRoutes`, `mustSee`. Applied here:

| Panel | Kind | Joined-copy tier | Sentence |
|---|---|---|---|
| **Info** | the place's `essentials` — part of `places` | **3** | `Ana did not write anything down about this place.` + the existing teaching paragraph, and the ghost action **stays** (writing facts is yours) |
| **Nearby** | `places` | **3** | `Ana saved nothing around this stop.` + `Anything you add here is yours.` |
| **Must-see** | `mustSee` | **3** | `Ana noted no shots here.` + `Anything you add here is yours.` |
| **Shop** | `shopping` — **`PRIVATE_KINDS`** | **stays 2** | unchanged: `Nothing on your shopping list for this stop.` |
| **Notes** | `log` — **`PRIVATE_KINDS`** | **stays 2** | unchanged: `Nothing logged about this place yet.` |

**The last two are the interesting ones**, and they are the reason this section exists rather than being a table of colours. A joined copy's shopping list and Log were never in the snapshot, so *"someone else left this empty"* is not a state the product can reach — saying it would be false. P0-3 §1.4 spelled that out (*"a shared shopping list somebody else keeps is not a state this product can reach"*); this is the first place it is applied to a real screen, and it means **the two private panels look identical on a joined trip and on your own.** That is the promise working: on the two tabs that are yours alone, there is no trace of sharing at all.

**Tier 3's treatment, unchanged from P0-3 §1.1:** the jade card (`--jade-bg` / `--jade-bd` / r16 / 14px pad), **never ink**, at most one ghost or amber action that is *yours*. The three tier-3 sentences above obey P0-1 principle 3 — Ana is the subject of a neutral verb, never of a failure — and each is followed by a sentence that names what the reader can do, which is the tier's whole job.

**One addition, and it is the tier-3 context line P0-3 §1.2 already designed:** on a just-joined copy with nothing waiting, the jade card carries the 22px `.who-mark` + `joined 2 days ago · no updates yet` line. Both halves are derivable with no new data (P0-3 §1.4, closed).

---

## 4. The Shop panel and the currency rule

**Verified:** `shopPanel()` opens `const symbol = state.trip?.currencySymbol || '¥'` — one of the **seven** `|| '¥'` fallbacks P0-2 §12.5 lists for removal — and uses it twice: on every `.item-est` and in the panel's summary line (`3 of 8 bought · ¥4,200 spent here`). `sheetMarkup()` passes the same symbol into `itemEditor`, where it labels a field: `What you expect to pay (¥)`.

**P0-2 §7.1 applied, with no new decision:**

- Item rows show **the bare number**, tabular, no symbol, when `currencyCode` is empty.
- The panel's summary line is a summary, so it takes the approved sentence: `Prices have no currency yet. Set it in Trip settings.` — and the money figure comes out of it rather than being zeroed. It becomes `3 of 8 bought · tap a name to correct it, swipe it left to remove it`, with the spend clause omitted.
- **`itemEditor`'s field label loses its parenthetical** when there is no currency: `What you expect to pay` rather than `What you expect to pay (¥)`. This is the eighth `|| '¥'` site and P0-2 §12.5 does not list it — recorded as **RC-19**, and it takes the same rule for the same reason.

Nothing else about the panel changes. The `paid` / `est.` caption pair, the swipe-to-delete with `Off the whole list, not just this stop`, and the two footer buttons are all correct and are not touched.

---

## 5. The three editors, recorded

All three are `.scrim` + `.modal` + `.form` — the app's one sheet pattern — with a jade `Save` and a 96px ghost `Cancel`, and a `.form-hint` that explains a consequence rather than an instruction. They are the best-written forms in the app and they are **not redesigned.** Recorded because no document has described them:

| Editor | Fields | Its `.form-hint` earns its place by |
|---|---|---|
| **`itemEditor`** — `Correct this item` | what it is · where in the shop · expected price + quantity · `Bought at` (a select of place labels, with the item's own label appended if it is not in the list) | naming what the estimate is *for*: "the spend report measures your actual spending against" it, and that moving a place moves the item's group |
| **`shotEditor`** — `A shot worth getting at Nishi Market` / `Edit this spot` | what the shot is · where to stand · anything else (textarea) · a 12-char `Tag` defaulting to `YOURS` · an optional reference picture, added by file label | — (it has none, and needs none: every field is self-evident) |
| **`factsEditor`** — `What to remember about Nishi Market` | one input per `PLACE_FACTS` row, plus any extra key the place already holds | stating the rule that makes an empty table honest: "Leave a row empty and it is not kept" |

**Two behaviours worth keeping, stated so they survive:**

1. **The photo is saved on `change`, before the sheet is saved.** `shot-photo`'s handler creates the shot if it does not exist yet, so a picture attached to a new spot cannot be lost by a mis-tap on Cancel. `Adding photos…` on the file label is P0-5's treatment for it (§13 of that document, row 14).
2. **`factsEditor` never shows a label with nothing under it** — `readFactsEditor` drops empty rows, and the Info panel's empty state is what that produces. The form and the panel are two halves of one rule.

---

## 6. The silent-refusal rule — canonical, app-wide

### 6.1 Four call sites, one behaviour

`readItemEditor` and `readShotEditor` both `return null` when the name field is empty, and `dest.js` does `if (!patch) return;`. So `Save` on a nameless item does **nothing at all**: no message, no field highlight, no closed sheet. The same shape occurs in four places:

| Where | Guard | Today |
|---|---|---|
| New trip modal | `if (!name) return;` | `Create` does nothing |
| Plan → add a stop | `if (!typed && !placeID) return;` | `Add` does nothing |
| `itemEditor` | `readItemEditor` → `null` | `Save` does nothing |
| `shotEditor` | `readShotEditor` → `null` | `Save` does nothing |

Four primary buttons in four different screens that silently ignore a tap. It reads as a dead app, and it is the one interaction failure this product repeats.

### 6.2 The rule

> **A form that refuses says which field, in that field, and leaves the button alone.**

Three parts, and each one is a choice against an alternative the app does not use:

1. **The message goes in the field's own hint slot, in rust** — the treatment `trip.js` already uses for `locationNotice` (`field(..., warn)` → a rust hint under the input). Not an `.amber-note` at the top: the note slot is for outcomes (P0-5 R4), and a missing name is not an outcome.
2. **The button is never pre-disabled.** The app does not gate primaries on validity anywhere, and a disabled `Save` on an untouched form is a refusal delivered before anything was asked. The button stays live and answers.
3. **One field at a time — the first empty required one.** These forms have exactly one required field each, so this is not a validation framework; it is one sentence in one slot.

### 6.3 The four sentences

Each names the field in the words that field already uses, so the reader's eye lands on the right input:

| Where | Sentence |
|---|---|
| New trip | `A name for the trip — anything you will recognise.` |
| Add a stop | `A name, or a map link.` *(also in `p1-plan-editing-design.md` §7.3)* |
| `itemEditor` | `What is it? One word is enough.` |
| `shotEditor` | `What the shot is — a few words.` |

**No new component, no new colour, no new state machine.** The rust field hint exists, it is used, and it is the app's own answer to "this field is the problem".

---

## 7. Self-audit at 390 × 844

| Case | Behaviour |
|---|---|
| **Five tabs at 390px** | `.dest-tabs` is `display: flex; gap: 16px; overflow-x: auto` with `.dest-tab { white-space: nowrap; flex: none }` — so `Info · Nearby · Must-see · Shop · Notes` plus up to five count bubbles is a horizontal scroller by construction. Verified; nothing to design. |
| **A count of 3 digits** | `.tab-count` is `min-width: 16px` and pads; `120` widens the bubble and the row scrolls. |
| **Long place name** | `.dest-name` is the screen's subject and wraps. `.nearby-name` is `flex: 1; min-width: 0` beside a `flex: none` price tier — the layout the CJK work depends on, already correct. |
| **CJK place name** | Same columns; line-height 1.35 for CJK (P0-3 §2.3), Latin-first stack on `body` (S-2). |
| **A note with 12 photos** | `.photo-thumb` at 78px in a `wrap` row — four per line, the card grows. Existing. |
| **A shot with no picture** | The photo block reads `example photo` — existing placeholder text in the hatched block, and it is honest. Unchanged. |
| **Every panel empty at once** | Five tabs with no count bubbles and one `.empty` behind whichever is open. Correct: the counts row *is* the summary, and a stop with nothing hanging off it is a normal stop. |
| **A joined copy, all five empty** | Three jade tier-3 cards and two tier-2 sentences (§3) — the two private tabs identical to your own trip's. |
| **No currency** | Bare numbers in the rows; the summary line drops its money clause; `itemEditor`'s label drops its parenthetical (§4). |
| **Loading** | Nothing on this screen is async except attaching a photo (`prepare(file)`) → `Adding photos…` on the file label (P0-5 row 14). Everything else — ticking, picking into a loop, saving a sheet — is synchronous and gets **nothing** (P0-5 R10). |
| **Error** | Only the photo path can fail; the existing inline-storage notice covers it, where it already is. The three `Save`s can *refuse* (§6), which is not an error. |
| **Navigation away and back** | `tab` and `sheet` are module state and die with the screen — so returning lands on Info with no sheet open. Correct. |
| **Destructive actions** | Three swipes, each with its own label: `Off the whole list, not just this stop` (shopping) · `Gone from this place for good` (a shot) · `Gone from Nishi Market and the Log for good` (a note). All three are swipe → in-row confirm → 6s undo. **All three labels are exact about scope**, which is the pattern working; none is changed. |
| **Undo** | The app-wide bar, all three deletions. |
| **Focus** | `input:focus` gets a jade border. The tab buttons, the `+`/`✓`, the ticks and the swipe faces are real buttons with no visible focus — the app-wide position, unchanged here. |
| **Accessibility** | Existing and good: `role="checkbox"` + `aria-checked` on both tick controls, a branched `aria-label` on `.nearby-add` that names the loop, `aria-label` on every thumb and bin. Nothing to add. |

---

## 8. What an implementer needs

1. **Three tier-3 empty variants** on Info, Nearby and Must-see, gated on `trip.sharedFrom` — the jade card, the sentences in §9, the context line from P0-3 §1.2.
2. **Shop and Notes keep their tier-2 empties on a joined copy.** This is a rule, not an oversight (§3).
3. **`shopPanel`'s `|| '¥'` comes out** with the other six (P0-2 §12.5), and the summary line drops its money clause when there is no currency.
4. **`itemEditor`'s `symbol` parameter becomes optional in its label** — the eighth `|| '¥'` site (RC-19).
5. **Four refusal sentences** in four existing field-hint slots (§6.3). No new component, no disabled buttons.
6. **Nothing else changes:** not the five panels' populated bodies, not the tab row, not the three editors, not the three swipe labels, not the repaint-through-the-store pattern, not the photo-saves-before-the-sheet behaviour.
7. **New CSS: none.**
8. *(Verification, not design: the five populated panels are the cheapest remaining unseen surface in the product — one screen, five taps, no second account, no emulator, no drag. Worth a capture pass before implementation.)*

---

## 9. Exact copy

**Canonical.**

**Joined-copy empties** *(new — tier 3)*
> `Ana did not write anything down about this place.` + *(the existing NEED TO KNOW paragraph, unchanged)*
> `Ana saved nothing around this stop.` · Anything you add here is yours.
> `Ana noted no shots here.` · Anything you add here is yours.
> `joined 2 days ago · no updates yet` *(P0-3 §1.2's context line)*

**Empties that do not change** *(existing, and the fact that they do not change is the design)*
> `Nothing on your shopping list for this stop.`
> `Nothing logged about this place yet.`
> `Nothing saved around this stop yet.` *(own trip)*
> `No must-see spots noted for this stop yet.` *(own trip)*
> `Nothing here yet. Pasting a map link fills in whatever OpenStreetMap has — hours, phone, website — and the rest is yours to type.` *(own trip, Info)*

**Shop with no currency** *(P0-2 §7.1 applied)*
> `Prices have no currency yet. Set it in Trip settings.`
> `3 of 8 bought · tap a name to correct it, swipe it left to remove it` *(the money clause omitted)*
> `What you expect to pay` *(the parenthetical omitted — RC-19)*

**Forms that refuse** *(new — canonical app-wide, §6)*
> `A name for the trip — anything you will recognise.`
> `A name, or a map link.`
> `What is it? One word is enough.`
> `What the shot is — a few words.`

**Everything else on this screen is existing copy and is unchanged**, including the five panel titles, the three editors' fields and hints, the three swipe labels, and the Notes panel's closing explanation.

---

## 10. Reconciliations and findings

| id | Conflict | Verified | Resolution |
|---|---|---|---|
| **RC-18** | `p1-coverage-gaps-design.md` §8 and the P1 review pack §8: Destination's four tab bodies are "unseen", "four screens, not four states", "a batch of their own". | Five panels, all built, all with populated bodies, empty sentences, add controls and count bubbles. | **They are one screen and five panels, and they are written.** The batch they needed was three approved systems applied (§3, §4) plus one rule (§6) — not a design. **"Unseen" is true and is a verification gap, not a design gap** (§8.8). |
| **RC-19** | P0-2 §12.5 lists **seven** `\|\| '¥'` fallbacks to remove. | There is an **eighth**: `itemEditor`'s price-field label, fed by `dest.js` `sheetMarkup` and by `shop.js`. | The list is one longer. Same rule, same reason; no decision changes. |

**Implementation findings — recorded, not fixed.**

| id | Finding |
|---|---|
| **IF-28** | `readItemEditor` and `readShotEditor` return `null` on an empty name and their callers `return` silently — two of the four silent refusals in §6.1. |
| **IF-29** | `shopPanel`'s per-stop filter falls back to matching `row.placeLabel === it.name` when an item has no `placeID`, so **renaming a place orphans its items from that stop's Shop tab** while leaving them on the whole list. Data-shape, pre-existing, cosmetically invisible until it happens. Recorded. |
| **IF-30** | `dest.js` `mount()` computes `it = subject(params)` a second time, independently of `render()`; if the subject vanished between the two, the handlers bind against `undefined` (guarded with `?.` throughout). Harmless today; recorded because the no-subject branch (absence doc §3) now has a real render path. |

---

## 11. Status

| Item | Status |
|---|---|
| **The five panels are built and are not redesigned** | RECORDED from source — **RC-18** |
| Three tier-3 joined-copy empties | DESIGNED — new copy, existing jade card |
| **Shop and Notes keep tier 2 on a joined copy** | DESIGNED — a deliberate nothing, and it is the private-kinds promise working (§3) |
| The tier-3 context line applied to a real screen | DESIGNED — P0-3 §1.2, first application |
| Currency rule applied to the Shop panel and the item editor | DESIGNED (P0-2 §7.1) — **RC-19** |
| The three editors | RECORDED from source — not redesigned |
| **The silent-refusal rule and its four sentences** | DESIGNED — **canonical app-wide**, §6 |
| An artboard for this document | **REJECTED** — it would document what the app defines; the capture pass is verification (§8.8) |
| Redesigning any populated panel | **REJECTED** — nothing in them is wrong |
| A validation framework | **REJECTED** — one required field per form, one sentence each (§6.2) |

**No OPEN DECISION is raised by this document.**
