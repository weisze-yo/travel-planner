# New Feature Design — empty states, warning strips, Review

**Session:** 4 Sep 2026 · design only, nothing implemented
**Baseline:** `docs/design/existing-ui-audit.md` + `docs/design/existing-ui-visual-reference.md`; where either conflicts with `web/`, the running app wins.
**Artboards:** `New Feature Design.dc.html` — three artboards, all frames 390 × 844, light only, 16px page sides.
> **⚠ RECONCILED 5 Sep 2026 — read `docs/design/p0-3-system-sign-off.md` before implementing anything here.**
> **§3 (the warning strip) is SUPERSEDED IN FULL** by the fact-first structure in `multilingual-warning-strip-design.md`; do not implement it. Frame **1A**'s "arrive by link" action has no destination in the source and becomes a copy line. Frame **1F**'s amber `+ Plan free time here` cannot fire on a stopless day. **§4.5**'s stacked sides are now the default, not an overflow case, and §4 as a whole is extended by `docs/design/p0-4-review-design.md`, which wins where the two disagree. Of the eight open questions in **§7**, six are closed (§7.1 → P0-4; §7.2 corrected — decisions do persist, their *direction* does not; §7.3, §7.5, §7.6, §7.7 → closed from source). Everything else in this document stands as written.

**Source read for this session:** `web/js/screens/review.js`, `web/js/screens/plan.js` (`stopRow`, `emptyDay`), `web/js/store.js` `dayIssues()` (lines ~950–1040), `web/js/screens/parts.js` `emptyDay()`, the `.empty` / `.warn` / `.sides` / `.review-foot` blocks in `web/css/app.css`.

---

## 1. Design goals

1. **Inherit, do not invent.** Every colour, radius, type size, button height and copy habit in these three artboards already exists in `app.css`. No new hue, no gradient, no illustration, no dark mode, no new control family.
2. **Make ownership legible.** The app's whole explanation of itself is jade = given / amber = yours / ink = act / rust = broken. All three artboards are, underneath, the same problem: *whose thing is this?* — an empty day, a name in someone else's script, a change somebody sent.
3. **Never let a generated string decide the layout.** Place names, note text and update payloads are user data in unknown scripts and unknown lengths. The design has to hold when they are 3 characters or 30.
4. **No behaviour change.** Review's mutations, the warning fixes, and the existing empty-state entry points are the behavioural source of truth. Where a proposal needs new data, it is flagged in §7, not assumed.
5. **Fewer screens, one system.** Twelve empty places resolve to three tiers; four warning kinds to one strip; five difference kinds to one row.

---

## 2. Empty-state system

### 2.1 Design principle

> **The surface says whose turn it is. The copy says what will end the emptiness.**

Ownership is carried by the *container*, not by the wording — because wording is the first thing rewritten and the last thing read. Three surfaces, three tiers, and every empty place in the app sorts into one of them by a single question: **can the person looking at this finish it right now?**

### 2.2 The grammar

| | **Tier 1 — yours to fill** | **Tier 2 — fills itself** | **Tier 3 — somebody else's side** |
|---|---|---|---|
| Cause | The container exists; you are the one who fills it | The trip has not happened yet | The shared copy has it empty |
| Surface | Bone page, no card — a centred block | The existing inline `.empty` block (28px/16px, centred, 12.5px `--soft`) inside the card or section it belongs to | Jade card: `#E6EFEB` / 1px `#CFE0D9` / r16 / 14px pad |
| Mark | A **dashed silhouette** of the missing thing (dashed already means "not yet real") | None | None |
| Line 1 | 15px/700 ink, names the missing *thing* | — | 13.5px/700 ink, states what you were sent |
| Line 2 | 12.5px/1.55 `--muted`, ≤290px, teaches the data model | One 12.5px `--soft` sentence naming what will fill it | 12px/1.5 `--jade-fg`, when more arrives + that nothing changes without you |
| Action | One ink `.btn` h42, at most one ghost below it | **No ink button.** A dashed add only where doing it early is legitimate | **Never ink.** At most one ghost/amber action, and only for something that is *yours* to do meanwhile |
| Closing hint | 11px `--soft`, states the consequence | — | A 22px `.who-mark` + "joined 2 days ago · no updates yet" |

### 2.3 Ownership distinction

- **Tier 1 → ink.** Ink means "act now" everywhere in the app; an empty container you own is the only empty state that earns it.
- **Tier 2 → no colour at all.** A log with nothing in it is not a task. Colour here would invent a chore.
- **Tier 3 → jade.** Jade already means "the copy you were given". A shared trip's emptiness *is* the given copy; it is not a warning (amber) and it is not broken (rust). Using amber or rust here would invert the product's one hard rule.
- **Yours-inside-theirs → amber.** On a shared day, the one thing that belongs to you (your own free time) appears in the existing self-planned recipe: `#FFFDF7` paper, 1.5px dashed `#E3CFA3`, `--amber-fg` label.

### 2.4 Action / no-action rules

1. Offer an action **only if it can be completed right now** with what is already on the phone. A button that leads to a wait is a dead end dressed as help.
2. **One ink primary at most.** A second option is ghost. Never three.
3. **The empty state never introduces a control.** It re-uses the action that already exists on that screen, with the same label (`+ Add a stop`, `Paste an itinerary`, `+ Note`, `+ Add`).
4. **No action when the cause is time.** Tier 2 gets a sentence and, where writing early is legitimate, a quiet dashed add.
5. **No action when the cause is another person.** Tier 3 never offers to fix someone else's side; it offers the user's own parallel move, or nothing.
6. **Do not zero a summary.** The shopping footer card is removed when the list is empty rather than showing "¥0 of ¥0" — a number pretending to be information.
7. **Filters stay visible** (at ~45% opacity) rather than disappearing, so the screen keeps its shape and the model stays learnable.

### 2.5 Copy rules

- Name the **missing thing**, never the container: "No trips yet", not "This list is empty".
- Second sentence **teaches the model**. The best existing line in the app is the template: *"Add the stops your agent gave you and the gaps between them become free time by themselves."* — kept verbatim.
- Lower-case after the first word, second person, state the consequence, no exclamation marks, no marketing voice. Unchanged house tone.
- **Shared state, without blame.** Never make a person the subject of a negative verb, and never use machine language:

| Do not | Do |
|---|---|
| "Ana hasn't planned this day yet." | "Day 4 is empty in the copy you were sent." |
| "Waiting for the trip owner." | "Anything Ana adds arrives with the next update." |
| "No data received." | "Nothing changes on your side until you have looked through it." |

  The rule: **the copy is the subject of the first sentence** (so nobody is at fault), and **the person appears only in the second, attached to a positive verb** — what they will do, not what they have not done.

### 2.6 Representative states drawn

| Frame | Case | Tier | What it establishes |
|---|---|---|---|
| **1A** | Trips home, new signed-in account | 1 | The full-page variant. No tab bar, so the block owns the page; dashed trip-card silhouette; two real ways forward (start one / arrive by link); account row stays and keeps stating the trade. |
| **1B** | A day with nothing planned | 1 | The in-screen variant, under the weather banner (a day with no stops still has weather, and that is not empty). Existing `emptyDay()` copy kept; the two actions the copy currently *describes* become the two buttons that already exist in edit mode. |
| **1F** | The same day, in a joined trip | 3 | Drawn deliberately beside 1B: same screen, same date, same emptiness, different owner — readable across the room without reading a word. Jade card replaces the ink CTA; the amber "plan free time here" is the only action; **no ink anywhere**. |
| **1C** | An empty Log | 2 | No hero, no ink in the body. The `.empty` sentence, then the **day scaffold shown anyway** — three real rows teaching the grouping before there is anything to group. Ink only on today's row. Closes with "Days 4 to 6 have not happened yet." |
| **1D** | An empty shopping list | 1 | Filters held at 45%; dashed checkbox-and-line silhouette; footer spend card removed, not zeroed. |
| **1E** | A place — Nearby empty | 1 | The one case with **no centred hero** — a place is never wholly empty (name, time, route badge). The existing inline block + the dashed add that already sits beneath it. |
| **1E2–1E5** | The same place — Info, Must-see, Shop, Notes | 2 / 2 / 1 / 2 | All five tabs drawn, because each has a different owner and a different destination for what you add. Identical geometry, identical `.btn-dashed` treatment (ink label throughout, exactly as `dest.js` renders it today); only the noun and the destination sentence change. The tier difference is carried by the **copy** — "it can wait until the day" — not by the button. |

Cases sharing a pattern are **not** redrawn: Log's per-day rows, Spend before any purchase, Nearby with a filter on, and the three non-Nearby place tabs are all tier-2 inline blocks and appear as variants, not screens.

---

## 3. Warning-strip system

> **⚠ SUPERSEDED (5 Sep 2026).** This section designs the strip as a relation word + name + time on one flex row. The approved design is **fact-first**: the relation becomes the label, the name owns its own 13px/700 ink line, and the numbers sit on a `·`-separated fact line with no consequence sentence. See `multilingual-warning-strip-design.md` and `p0-3-system-sign-off.md` §2. The CJK findings in §3.4 and the wrapping rules in §3.5 remain valid and are carried forward; only the structure in §3.3 is replaced.

### 3.1 Current problem

`store.js` `dayIssues()` builds four English sentences and injects a place name into the middle of each:

```
OUT OF ORDER          Starts 13:45 but sits after Nishi Market at 13:30.
OVERLAPS              Nishi Market runs to 14:30, so these two are on top of each other.
NO TIME               This stop has no start time.
ENDS WHEN IT STARTS   Starts and ends at 13:30.
```

The last two carry no name and are fine. The first two are the problem, and it is not a translation problem — the surrounding copy stays English. It is that **the one value guaranteed not to be English is being used as an English noun phrase**.

### 3.2 What was tested (three structures × three scripts, at the real 290px strip width)

**S1 — inline, as built today.** Rejected. Three separate failures: (a) CJK has no capitalisation, so the proper noun has nothing to distinguish it from the words around it — the eye cannot find *which* stop is meant; (b) CJK has no spaces, so the browser breaks inside the name, splitting one word across two lines; (c) once the name is long, the English verb ("runs to") is pushed so far from its subject that the clause stops parsing.

**S2 — inline, name at 700 ink and `white-space: nowrap`.** Rejected. Emphasis fixes findability and nowrap stops the split — but only by forcing an early line break, leaving a half-empty line above a long name. Worse, it makes the strip's height depend on the length of a place name, so two strips on one card have different heights for no reason the user can see.

**S3 — the name lifted out of the grammar. CHOSEN.** The name stops being a word in a sentence and becomes a **labelled value**, and labelled values are script-neutral.

### 3.3 Chosen layout

```
┌ .warn  (unchanged: #FBF1DE, r11, 9px 10px, on the row it concerns) ─┐
│ OVERLAPS                              10.5/800/.06em  --amber-fg     │
│ WITH   芦ヶ谷神社                to 14:30    ← flex row, gap 8px      │
│ These two are on top of each other.   11.5/1.4        --amber-fg     │
│ [ Start 14:30 ]                       .warn-fix h30, first ink       │
└──────────────────────────────────────────────────────────────────────┘
```

| Line | Spec |
|---|---|
| 1 · kind | 10.5/800/.06em `--amber-fg`. Unchanged: `OVERLAPS`, `OUT OF ORDER`, `NO TIME`, `ENDS WHEN IT STARTS`. |
| 2 · subject | Flex row, `gap: 8px`, `align-items: baseline`. **Relation word** 10/800/.04em `#B99A5E` (amber at eyebrow strength) — `WITH` for an overlap, `AFTER` for an ordering issue · **name** 13px/700 ink, `flex: 1; min-width: 0` · **time** 11.5/700 `--amber-fg`, `flex: none`, `tabular-nums`. |
| 3 · consequence | 11.5/1.4 `--amber-fg`. Refers to the subject as "it" / "these two" — **never repeats the name**, which is what keeps it to one line. |
| 4 · fixes | Existing `.warn-fix` row, h30, first ink-filled. Untouched, still names the tap. |

Copy, final:

- `OVERLAPS` · `WITH ‹name›` · `to HH:MM` · "These two are on top of each other."
- `OUT OF ORDER` · `AFTER ‹name›` · `HH:MM` · "This one starts earlier, at HH:MM."
- `NO TIME` and `ENDS WHEN IT STARTS` carry no name, so they keep lines 1, 3 and 4 only — the subject line is simply absent. Same component, one fewer line.

### 3.4 CJK typography findings

1. **Public Sans has no CJK glyphs.** Every CJK name in the app is *already* rendering from an accidental system fallback. Make the stack explicit and Latin-first, so digits, times and badges keep coming from Public Sans:
   `'Public Sans','Hiragino Sans','Hiragino Kaku Gothic ProN','Yu Gothic','PingFang SC','Microsoft YaHei','Noto Sans CJK JP',system-ui,sans-serif`
2. **CJK reads larger at the same px and still resolves worse** — strokes, not the em box, are the limit. 11.5px is below the floor. The name therefore moves to **13px** and onto its own line, where it is the only thing at that size. Latin body copy stays 11.5px.
3. **Line-height must rise.** CJK fills its em box; 1.4 looks cramped. Name line **1.35**, up to **1.45** when it wraps. Plan-card titles rise from 1.25 to **1.35** for the same reason — this applies beyond the warning.
4. **Never italicise, never letter-space CJK.** No true italic exists in any fallback; emphasis is carried by weight and position, which is already the app's rule.
5. **Full-width punctuation** (`・（）／`) carries a full em of built-in side bearing. Because the name now owns its column, that padding lands in empty space instead of colliding with an English preposition.
6. **The Latin/CJK boundary is spaced by layout, not by a character.** The gap between the relation word and the name is a flex `gap: 8px`, so the browser is never asked to size a space between two scripts (`text-autospace` is not reliably available).
7. **Mixed Latin + CJK is the common case, not the exotic one** — "AEON MALL 幕張新都心" is one name in two scripts, handled by the single Latin-first stack in one 13/700 line.

### 3.5 Wrapping behaviour

- Only the **name column** wraps, and it wraps within itself. `line-break: strict` so a wrapped CJK line never begins with `。、）`; `overflow-wrap: anywhere` so a 30-character name cannot push the time off the strip.
- The **time never wraps away from its name** — it is a `flex: none` sibling, always on the first line, always right.
- Two lines is the practical cap on a 290px strip; beyond that the strip simply grows. **Nothing is truncated** — a warning must never hide the thing it is warning about.
- The fix row does not move relative to the text; the strip grows by exactly one line height.

### 3.6 Rationale

The strip is still the same component: same amber surface, same radius, same padding, same position on the row, same "a warning always names the tap that fixes it" rule, same `.warn-fix` ladder. Only the middle line's structure changed — from prose to a labelled value. It reads *better* in English too, because scanning a day for "which stop is this about" is now a vertical scan of one column instead of reading three sentences.

---

## 4. Review screen

### 4.1 Information hierarchy

The screen must answer four questions in order. Today all four sit at roughly the same weight.

| Rank | Question | Carried by |
|---|---|---|
| 1st | **What changed** | Row title, 13.5/700 ink — the heaviest thing on the card. It names the **subject** (the place, the item), never the verb: people scan for places they care about. |
| 2nd | **What kind of change** | The existing badge, `THEY ADDED` (jade) · `THEY CHANGED` (amber) · `THEY REMOVED` (rust), plus an 11px noun beside it ("a time", "a stop", "the day it is on"). Scannable down the left edge. |
| 3rd | **What do I have vs what are they proposing** | The existing `.sides` pair, unchanged in colour: yours = `#FAFBFA`/`#EDEFEC` quiet box, theirs = `--jade-bg`/`--jade-bd`. |
| 4th | **What am I deciding** | Ghost "Keep mine" + jade "Take theirs", h38, equal width. **Deliberately the lightest thing on the card** — both answers are fine and the app never pre-selects one. |

**Why theirs is jade and not amber.** Amber means "yours or guessed" everywhere else; using it for the incoming side would invert the product's one hard rule. Jade means *given*, and an update is the given copy arriving again. This is what `.side.theirs` already does — it is kept, not changed. And it is deliberately **not** red-vs-green: nothing in this list is wrong.

### 4.2 Difference-row structure

```
badge  ·  noun  ·  [conflict badge, right]
Title — the subject, 13.5/700 ink, line-height 1.25 (1.35 for CJK)
Context line — 11px --soft ("stop 2 of 6", "you have 1 note on it")
┌ YOURS ────────┐ ┌ THEIRS ───────┐      side by side, gap 8
└───────────────┘ └───────────────┘
        [ 45 min later ]                  delta chip, only for clock pairs
[ Keep mine ]      [ Take theirs ]        h38, ghost + jade
```

Grouped under a **day eyebrow** (`DAY 3 · FRI 14 MAR · 3 THINGS`). Grouping is presentation only — entry ids, entry order within a day, and the mutations are untouched.

### 4.3 Yours / theirs treatment

- Both boxes keep the existing recipe: r10, 8px 9px pad, 9.5/800/.05em key, 12px/1.4 value.
- **An absent side is written, not blank.** An addition has no "yours"; today that renders an empty box. It now reads `not on your day` in `--faint`, so the two sides still align. A removal's "theirs" reads `off the day` in `--jade-fg`.
- **Verb-matched buttons where the generic pair is wrong.** An addition offers `Leave it out` / `Add it` rather than `Keep mine` / `Take theirs` — same two mutations, honest labels.
- **A delta chip for clock pairs.** When both sides are times, the difference is shown once as an amber chip (`45 min later`) so nobody does arithmetic on two 12px numbers.
- **Timestamp on the YOURS key** where your side was edited after the shared base: `YOURS · edited 2 days ago`.

### 4.4 Decision interaction

Unchanged from `review.js`: nothing happens to your day until a button on a row is pressed; a decided row leaves the list; whatever you skip is not asked about again; `takeChange` / `keepMine` write through the same mutations the Plan uses, so an accepted change is indistinguishable from one you made.

Presentation changes only:

- **Progress in the push sub** — "5 things · 2 decided · 20 min ago" replaces the bare count, so the header does the counting that the disappearing rows imply.
- **Bulk actions become a sticky foot.** `.review-foot` already exists in `app.css` (fixed, 1px top line) and is what the audit describes; the current screen renders the two buttons inline at the end of the scroll, where five cards hide them.
- **The three-sentence preamble moves** to one line of fine print under the sticky buttons — same words, out of the way of the first row.

### 4.5 Edge cases (frame 3B)

| Case | Treatment |
|---|---|
| **Long text** | Above roughly 60 characters on either side, the two boxes go **full width, stacked**, one above the other. Same boxes, same colours, one axis turned — a sentence is never set in a 150px column. |
| **CJK title / values** | Same 13.5/700, line-height lifted to 1.35, same Latin-first stack as artboard 2. |
| **Conflict** | A rust `YOU EDITED THIS TOO` badge at the right of the badge row + the edited timestamp on the YOURS key, so the one row where "keep mine" actually costs something says so. **Needs a product answer — see §7.** |
| **Day / place move** | Rendered as a normal changed row with `Day 4 · 19:00` vs `Day 5 · 19:30`; the noun line reads "moves out of this day". |
| **Multiple days** | A second eyebrow, not a second screen. |
| **Scrolling** | One scroller between fixed head and sticky foot; the list is shown mid-row at the fold, honestly. |

### 4.6 Completion state (frame 3C)

The existing "Nothing to review" copy, given a body:

1. A jade **receipt card** — `UPDATE DEALT WITH` with a jade tick, "5 things decided — 3 taken, 2 left as yours.", then the existing sentence about the copy being yours again.
2. **The receipt list** — every decision with its outcome written as a fact about your day ("Day 3 · now 14:15 – 16:30", "Day 3 · still on your day"), tagged `TAKEN` (jade) or `KEPT` (bone). This is where the disappearing rows come back, once, so the work can be checked before leaving.
3. Jade `Back to the day`, then the fine print about where the next update appears.

The **first-visit variant** ("Their copy and yours say the same thing") uses the same shell with the receipt list absent.

---

## 5. Existing components reused

Reused as-is, not re-created:

| Pattern | Used in |
|---|---|
| `.empty` block (28px/16px, centred, 12.5px soft) | every tier-2 empty state |
| `emptyDay()` copy, verbatim | 1B |
| `.lane-stub` (2px dashed `#DCE2DE`) | 1B, 1F as the tier-1 mark |
| `.btn` ladder — ink act / jade save / ghost alternative / `.btn-dashed` add | all artboards |
| Self-planned recipe `#FFFDF7` + 1.5px dashed `#E3CFA3` | 1F's amber action |
| `.acct` row | 1A |
| `dayPills()` | 1B, 1F |
| `weatherBanner()` (jade) | 1B |
| `.card-list` r16 + 1px `#F0F2F0` row hairlines | 1C, 1E variants, 3C receipt |
| Hatched hero placeholder | 1E |
| `.dest-tab` underline tabs with count bubbles | 1E |
| `.warn` / `.warn-label` / `.warn-text` / `.warn-fix` (+ `.first` ink) | artboard 2 — surface, radius, padding, position and fix ladder unchanged |
| `.plan-gutter` 56px / `.plan-spine` 20px / `.plan-card` r14, and the flagged state (rust clock, rust dot, amber border) | artboard 2 |
| `.badge` family incl. `.badge.jade` / `.badge.rust` and `VERBS` labels from `review.js` | artboard 3 |
| `.sides` / `.side` / `.side.theirs` / `.side-k` / `.side-v`, colours unchanged | artboard 3 |
| `.review-foot` (already in `app.css`, currently unused by the screen) | 3A, 3B |
| `backHeader()` shape (back chevron + 17px push title + 11.5px push sub) | artboard 3 |
| `.who-mark` initial chip | 1F, 3A, 3B |
| `.eyebrow` 10.5/800/.06em | day groups, section heads everywhere |
| Tab bar, 78px, bone active pill, `util.js` tab icons | every trip-level frame |
| `tabular-nums` on every time | everywhere |

No new component was created for any of the three artboards.

---

## 6. New design decisions

Genuinely new, and only these:

1. **The three-tier empty-state grammar** (§2.2) — surface carries ownership; copy carries the resolution. New as a *system*; each individual surface already existed.
2. **Tier-3 jade empty card** — a new *composition* of existing tokens (`--jade-bg` / `--jade-bd` / `--jade-fg` / `.who-mark`), for shared-copy emptiness. No ink action on a tier-3 screen, ever.
3. **The tier-1 dashed silhouette** — a dashed outline of the missing object (trip card, list item, lane), extending the existing "dashed = not yet real" rule to empty states.
4. **The warning strip's subject line** — relation word + name + time as a flex row, replacing the inline noun phrase. The strip is otherwise untouched.
5. **Latin-first CJK font stack, declared** — plus 13px/1.35 for names and 1.35 line-height on CJK plan-card titles.
6. **Review: day grouping, progress in the sub, written absent sides, verb-matched buttons on additions, the time delta chip, stacked sides for long values, and `.review-foot` actually used.**
7. **The Review receipt list** on completion — a new use of `.card-list`, not a new component.
8. **Filters held at 45% instead of hidden** when a list is empty.
9. **Summary cards are removed, not zeroed**, when their data does not exist.

Explicitly *not* changed: colour semantics, the four label families, radii, button heights, the delete gesture, sheet detents, modal docking, the absence of hover/focus styling, and every inconsistency recorded in audit §12.

---

## 7. Open questions

1. **Conflict detection.** `review.js` does not distinguish "you changed this too" from "you never touched it". The `YOU EDITED THIS TOO` badge and the `YOURS · edited 2 days ago` key are drawn so the decision can be made; both are safe to omit at implementation time. Does `store.pendingUpdate()` have, or can it cheaply derive, a base-vs-mine comparison?
2. **Settled rows vs disappearing rows.** Today a decided entry is removed from `waiting.entries` and vanishes. A settled in-place row (tick + outcome + undo) would match the app's "undo, not confirm" principle better, but changes behaviour. The receipt list in 3C is the non-breaking compromise. Which is wanted?
3. **Relation words.** `WITH` and `AFTER` are the two needed by `dayIssues()` today. If more issue kinds land, each needs a one-word relation — is a fixed vocabulary acceptable?
4. **Where does the Latin-first stack apply?** This session scopes it to place names in warnings, plan-card titles and Review values. It arguably belongs on `body`. That is a global CSS change and out of scope here.
5. **Tier-3 breadth.** Only the joined-trip case is drawn. Do "a shared shopping list somebody else keeps" or "a place the sender has not filled in" exist as real states, or is the day the only one?
6. **`+ Plan free time here` on a shared day** — does the current sub-route model allow a loop on a day with no stops, or does it need at least one stop to anchor a lane? (`dayTimeline()` builds lanes from stops.)
7. **Joined-trip context line** ("joined 2 days ago · no updates yet") — is the join timestamp available client-side from the `published/{code}` envelope?
8. **Copy sign-off** on the three tier-3 sentences, which are the only place the product names another person.

---

## 8. Hand-off to implementation

Read in this order: this document → `New Feature Design.dc.html` (three artboards) → the existing audit and visual reference.

- **No new CSS file, no build step.** Additions go at the **end** of `app.css` per audit §15.10. Expected new rules: `.warn-subject` (flex row, gap 8), `.warn-rel`, `.warn-name`, `.warn-when`; `.empty-block` (tier 1) and `.empty-shared` (tier 3); `.side.stacked`; `.review-group`. Everything else is existing classes.
- **Screens touched:** `plan.js` (`emptyDay`, `stopRow`'s warn block), `parts.js` (`emptyDay`), `trips.js`, `log.js`, `shop.js`, `dest.js`, `review.js`. `store.js` `dayIssues()` needs its `text` split into `{ relation, name, when, consequence }` — the only data-shape change proposed, and it is presentational.
- **Do not** standardise the existing inconsistencies while in these files.
