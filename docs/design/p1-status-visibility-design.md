# P1 — Status visibility: the dot, the strip, the bar and the blank map

**Date:** 5 Sep 2026 · **Verified against** the working tree in this project (`web/**`), read this session
**Status:** design, for review. **Nothing implemented. No application code changed.**
**Artboard:** `P1 Status Visibility.dc.html` — the five sync states side by side at real size, the strip's rank order, the undo bar, and the blank map. This is the one area in the batch where a frame set is the deliverable: the argument is about 8px of colour.
**Canonical:** this document. §8 is the only source of copy.

**Source read this session:** `web/js/sync.js` `syncState` (198–240) and its header comment (6–20) · `web/js/screens/parts.js` `tripChip` (13) / `syncDot` (31) / `undoBar` (385) / `bindUndo` (396) · `web/js/store.js` `syncState` (1834) · `strandedReason` (3104–3120) · `rememberUndo` / `undoLast` / `clearUndo` (858–882) · `state.stranded` / `state.strandedError` (220–224) · `web/js/strip.js` (whole) · `web/js/remind.js` `loopReminder` (77–129) / `strip` (135–147) / `isHushed` (57–62) and the header comment (1–20) · `web/js/screens/map.js` (the `.map-top` column, `.stranded`, the legend) · `web/js/tiles.js` · `web/css/app.css` `.sync-dot` / `.sync-ring` / `.trip-meta.warn` (1818–1834) · `.trip-chip` / `.trip-mark` / `.trip-name` / `.trip-meta` (481–504) · `.stranded` (522–531) · `.undo-slot` / `.undo-bar` / `.undo-go` (1731–1750) · `.strip` family.

**Fixed foundations, not reopened:** **P0-5** (the sync dot is the app's **only** animated indicator and pending work must never render into the trip chip; work the user did not start gets no indicator) · **P0-1** principle 5 (the `from Ana` marker yields to sync warnings) · "a warning always names the tap that fixes it" — **and its contrapositive, which does most of the work here: where there is no tap, it is not a warning** · the semantic colour contract · one animated vocabulary · 390 × 844.

**Out of scope, deliberately:** the stuck-changes screen (`p1-coverage-gaps-design.md` §2) · tile downloading (same, §1) · the warning strip's four *sources*, which are settled — only their **order** is corrected here · cross-tab sync, which is designed to say nothing (same, §4).

---

## 1. The sync dot — the P1 "visual decision" mostly dissolves

### 1.1 Four corrections before anything is designed

The coverage matrix's row reads: *"five sync states in one 6px dot, no label, in a 44px chip."* Read against source, **all four of its claims are wrong or incomplete.**

| Claim | Verified | Correction |
|---|---|---|
| "6px" | `.sync-dot { width: 8px; height: 8px }`; `.sync-ring` is **10px** | **8px, and the animated state is 10px** (RC-14) |
| "no label" | `syncDot()` sets `aria-label` on **every one of the five**: `Saving` · `Waiting for signal` · `Changes are stuck` · `Saved on this device only` · `Saved` | **All five are labelled to a screen reader** (RC-15) |
| "five states in one dot" | `tripChip()` computes `words = kind === 'queued' \|\| kind === 'stuck' ? sync.line : ''` and renders them in `.trip-meta.warn` (`--amber-fg`, 650) | **Two of the five carry a visible sentence**, in place of the day/date line (RC-15) |
| "in a 44px chip" | **True, and I briefly recorded it as false.** `.trip-chip` is `height: 44px`, `padding: 0 12px`, `gap: 9px`, r14, white, `0 2px 10px rgba(20,32,28,.12)`, `flex: 1; min-width: 0` — a **fixed-height** control (RC-20) |

**A fifth correction, and it is mine.** An earlier draft of this section asserted that `.trip-chip` "is not a 44px control — it is `flex: 1` sizing to two lines of text". **The 44px is real and the height is fixed**, which matters more than the original claim did: see §5's overflow row and IF-32.

So the real question is much narrower: **three states are wordless — `saving`, `saved`, `local` — and is that right?**

Two of the three answer themselves against the house rule. `saving` is a ring that spins for a moment and resolves; there is no tap and nothing to decide. `saved` is the resting state of a working app; a permanent "everything is fine" line is the definition of noise. Both are also stated in `sync.js`'s own header comment, which is the design being audited: *"a hollow ring while a write is in flight, then a solid green dot and no words. This is most of the time."*

### 1.2 The one real problem

**`saved` and `local` are the same shape, the same size and the same silence, and they mean opposite things.**

| Kind | When | Dot | Means |
|---|---|---|---|
| `saved` | nothing queued, nothing in flight | 8px `--jade` | everything you have done has reached the cloud |
| `local` | `!configured` — there is **no cloud at all** | 8px `--faint` #B4BEB9 | nothing has ever left this phone, and nothing ever will |

Distinguished by hue alone, at 8px, with no visible label, on the most permanent chrome in the app. Jade against `#B4BEB9` is a real contrast difference — but it is the *only* difference, so the pair fails greyscale, fails at a glance, and fails for anyone who reads the jade dot as "fine" and the grey dot as "also fine, probably".

And the two are not equally important. `local` is the state in which **the whole sharing model is unavailable** — no link can be created, no update can arrive, the trip exists on one phone and dies with it. That is worth being legible.

### 1.3 Designed — one rule of CSS, no words, no new colour

> **`local` becomes a hollow dot: 8px, transparent, a 1.5px `--faint` ring.**

An unfilled dot means there is nowhere for anything to go. It differs from `saved` by **shape as well as hue**, so it survives greyscale and reads at a glance; it differs from the 10px animated `.sync-ring` by size, stroke and — decisively — motion.

**And it still says nothing**, because there is nothing to tap. `local` is `!isConfigured()` — a deployment fact, not a user's problem, and the app's position is that everything works without a cloud. A warning would be a warning about the app's own configuration, addressed to someone who cannot act on it.

**The two words that *are* warranted already exist**, one screen away: when the app *is* configured and still cannot reach the cloud, `state.stranded` is true and Map draws the `.stranded` card with `strandedReason()` — three branches, each naming its own cause (rules-refused / unreachable / other). That is the case with a fix, and it has a sentence. The dot is not asked to carry it.

**Rejected:** a fifth colour (the palette has four semantics and grey is not one of them); a label under the dot (it would be permanent, on Map only, and duplicate the aria-label); a numeral in the dot (`queued` already has a sentence); making the dot bigger (it is on `.map-top` over a live map, and 8px is a deliberate quietness).

### 1.4 The five states, recorded as the visual baseline

| Kind | Indicator | Visible words in `.trip-meta` | `aria-label` |
|---|---|---|---|
| `saving` | 10px `.sync-ring` — `border: 2px solid #C9D0CB` with `border-top-color: var(--jade)`, `animation: sync-spin 1s linear infinite`; `animation: none` under `prefers-reduced-motion` | none — the day/date line stays | `Saving` |
| `saved` | 8px solid `--jade` | none | `Saved` |
| `queued` | 8px solid `--amber` | `3 changes waiting for signal` in `--amber-fg`/650 | `Waiting for signal` |
| `stuck` | 8px solid `#9B4B4B` | `3 changes cannot be sent`, or `3 changes have been stuck for 2 days` | `Changes are stuck` |
| `local` | 8px hollow, 1.5px `--faint` ← **new** | none | `Saved on this device only` |

`syncState()`'s `line` for `saving` is `'Saving…'` and **is never rendered** — `tripChip` gates words on `queued`/`stuck`. Correct (the ring says it) and recorded so nobody wires it up (P0-5 R3: one animated vocabulary, and pending must never enter this chip).

---

## 2. The warning strip's rank order — a correction to an approved document

### 2.1 The conflict

`p1-coverage-gaps-design.md` §5 states the order as:

> **rust stuck › outside a kept area › queued › loop reminder**

`remind.js` `strip()` reads, in order:

```js
const red = reminders.find(r => r.tone === 'red');   if (red)         return …;  // 1
if (stuck)                                                            return …;  // 2
const amber = reminders.find(r => r.tone === 'amber'); if (amber)     return …;  // 3
if (outsideArea)                                                      return …;  // 4
if (queued)                                                           return …;  // 5
```

**The loop reminder is split by tone, and its red half outranks everything, including stuck.** The written order has the reminder last, which is exactly backwards for its most urgent case.

And `remind.js`'s **own header comment** says a third thing: *"leave now beats outside your saved area beats changes stuck on this phone"* — which puts `outsideArea` above `stuck`, contradicting its own code five lines down.

So three orderings exist: the code, the module's comment, and an approved design document. **Recorded as RC-16.**

### 2.2 The resolution

**The code is right and both prose statements are corrected.** The design decision — *keep the source's rank order, and write it down* — is unchanged; only the writing-down was wrong. Canonical order, five slots:

> **1 · a loop reminder you will miss (red)** › **2 · changes that cannot be sent (rust)** › **3 · a loop reminder getting tight (amber)** › **4 · outside a kept area (amber)** › **5 · changes waiting for signal (amber)**

**And it is the right order**, which is why it is kept rather than renegotiated: 1 is time-bound and unrecoverable — a coach leaves whether or not the outbox drains. 2 is a standing risk to work already done. 3 is the same clock, further away. 4 and 5 are both "something is missing and the plan still works", which is the app's cheapest kind of problem.

**Two rules restated, both already approved:**

1. **The `from Ana` marker yields to all five** (P0-1 principle 5).
2. **Only the loop reminder is dismissible.** `hush(key, walk)` silences one deadline and `isHushed` returns it *"only if the walk gets 10 minutes longer"*. The other four are conditions, not messages: they leave when the condition leaves.

### 2.3 One gap, and it stays a gap deliberately

**The `queued` strip has no action.** `strip.js` renders `strip-go` only when `showing.href` or `showing.action` is set; the `queued` source in `strip.js` `gather()` sets neither. So slot 5 is a title and a body with nothing to tap — an apparent breach of "a warning always names the tap that fixes it".

**It is not a breach, and it is not fixed.** Its body already says why: *"Everything you have typed is already on the phone. This is only about the copy in the cloud, and it clears itself the moment signal returns."* There is no tap because there is no action — the condition resolves itself — and the sentence spends its whole length saying so. Adding a `Try sending them now` here would be a button whose honest label is "wait faster".

Recorded as a **knowing exception**, with the rule it satisfies instead: *a condition with no fix states that it needs none, in the body, in the same breath.* That is the second knowing exception in the product (the first is P0-1 §4.4's `read` send block), and both are the same shape: no tap exists, so the thing is a fact rather than a warning.

---

## 3. The undo bar

**Verified.** One app-wide bar in a global slot: `.undo-slot` (`z-index: 8`, `flex: none`, `padding: 0 12px 8px`, `--bone`) above the tab bar, holding `.undo-bar` — ink fill, r16, pad 13·14, `0 8px 24px rgba(20,32,28,.24)`, a 13px/650 label and a `.undo-go` at 12.5px/800 in `#8FB3A6`. `rememberUndo(label, restore)` replaces whatever was there, clears the old timer, and sets a fresh 6s one. `undoLast()` runs `restore()`. Six users today: place delete, stop delete, sub-route delete, area remove, person remove, trip delete — and, under P0-4, Review decisions.

**Three states are worth stating; none is a redesign.**

| Case | Behaviour |
|---|---|
| **Two deletions inside six seconds** | `rememberUndo` **replaces** the first. Verified, and it is correct: one bar, one label, the most recent thing. Designed addition: **nothing.** A stacked or plural bar ("2 things removed · Undo both") would make the bar a list, and the second deletion's own row is still on screen. |
| **Navigating away mid-countdown** | The bar is in `nav.js`'s global slot and `state.undo` is store state, so **it survives the screen change** and stays for its six seconds. Verified, and it is right — the six seconds belong to the deletion, not to the screen. |
| **The undo of an offline deletion** | `rememberUndo`'s own comment: the deletion is queued like any other edit and the undo queues the opposite. Nothing special, and nothing said. |

**One addition, and it is a rule rather than an element:** **the label always names the thing, never the act alone.** Existing labels do (`Removed Skyline Deck`), P0-4's do (`Took theirs for Lumen Crossing`), and the rule is written here because the bar is app-wide and the next person to call `rememberUndo` will be writing a label with no document to check. A bar reading `Deleted` is unusable when it has survived a screen change.

**`clearUndo()` is exported and called by nothing** — recorded as IF-25. Harmless; the timer does the job.

---

## 4. The map with no picture

### 4.1 The gap, narrowed

The coverage matrix says *"offline map and failed map look identical (`#E9EAE6`); only the Map screen carries the `.stranded` banner."* Two corrections and one real gap:

- **`.stranded` is not about tiles at all.** It is `state.stranded` — the app is configured for a cloud and is running on the local backend anyway — and `strandedReason()`'s three sentences are all about *saving*, not about the map. So it never explains a blank map, and a reader who assumed it did would be misled.
- **The warning strip already covers the common blank-map case.** `strip.js` `outside()` fires when areas are kept, the day has positioned stops, and **all** of them fall outside every kept area: *"No map here, but the plan still works"* + `Keep this area too`. That is a complete, actionable answer.
- **The real gap is precisely one condition:** **no kept areas at all, and no tiles arriving.** `outside()` returns `null` on its first line (`if (!store.mapAreas().length) return null`), so a phone with no offline areas and no signal shows a grey canvas with numbered pins on it and says nothing at all — which is the state a first-time user offline is *most* likely to be in.

### 4.2 Designed — one line, on the canvas, no new component

When no tile has drawn and no kept area exists, one centred line over the grey, in the same `.stranded`-shaped card `.map-top` already stacks (`padding: 8px 11px`, r11, 11.5px/650) but in **amber, not rust** — nothing is broken:

> `NO MAP PICTURE` · `Distances, order and walking times are all worked out on the phone. Only the streets are missing.` · `Keep an area for offline`

Amber because the plan works and the missing thing is a picture; the action is the same destination `outside()` already names, so there is one route to the same screen from both states. The sentence deliberately reuses `outside()`'s clause verbatim — *"Distances, order and walking times are all worked out on the phone; only the picture of the streets is missing"* — so the two versions of this message are the same message.

**It appears once and does not repeat**, on the same terms as the strip: it is a condition, so it leaves when a tile draws.

**What is deliberately not designed:** distinguishing "the tile server refused" from "you have no signal". The user's action is identical in both cases, the app cannot reliably tell them apart (`tiles.js` reports per-tile failures, not causes), and a sentence that guesses wrong about someone's connection is worse than one that does not guess. Recorded as **OD-7** only because "should the app try to say why?" is arguably a product call; the recommendation is no.

---

## 5. Self-audit at 390 × 844

| Case | Behaviour |
|---|---|
| **The hollow `local` dot beside a long trip name** | `.trip-name` is `nowrap` + ellipsis and the dot is `flex: none` — the dot never moves. Verified in `app.css` 503, 1818. |
| **`stuck` words with a long count** | **`.trip-chip` is a fixed `height: 44px`, so the chip cannot grow.** The name line (13px/1.15 ≈ 15px) plus one meta line (11px/1.3 ≈ 14px) fits; a **second** meta line would not. So the constraint is one line, and the longest reachable string — `3 changes have been stuck for 14 days` at 11px — measures ≈205px against the ≈250px the `grow` column has beside a 26px mark and an 8px dot with two 9px gaps. It fits. **Nothing longer may be added to this line** (IF-32). |
| **CJK trip name + `stuck` words** | The name line is unaffected (own line, ellipsis); the warn line is fixed English. |
| **`saving` under `prefers-reduced-motion`** | `.sync-ring { animation: none }` already — the ring is static, and it is still distinguishable from both dots by being a 10px ring. Verified in `app.css` 1833. |
| **All five dots in greyscale** | jade solid / amber solid / rust solid / hollow / (ring). Four distinct lightnesses plus two distinct shapes. `saved` and `stuck` are the closest pair in greyscale and `stuck` carries a sentence. |
| **The strip with two red reminders** | `reminders.find` takes the first; the second is not queued for later. Existing, and correct — two coaches at once is not a state, and the strip is one line. |
| **The strip while stuck AND outside an area AND queued** | One line: stuck. The other two are conditions and return when it clears. |
| **A dismissed reminder that gets worse** | Returns at +10 minutes of walk (`isHushed`). Unchanged. |
| **The undo bar over the tab bar** | `.undo-slot` is `flex: none` in the app column above `#tabbar`, so it **pushes the content up rather than covering the bar** — verified, and it is why the slot has its own padding and bone background. Nothing is ever hidden behind it. |
| **The undo bar with a long label** | 13px/650 in a `grow` column beside a `flex: none` `Undo`; wraps to two lines, bar grows. |
| **The blank-map line with pins on top of it** | The card sits in `.map-top`'s column, above the legend, in the same stack the `.stranded` card uses — so it is over the map but never over a pin cluster, which is centred. |
| **Loading** | Nothing here is a control that starts work. The tile fetch is background (P0-5 R5) and gets no indicator beyond the map itself. |
| **Error** | `strandedReason()`'s three branches, unchanged. `syncState().reason`, unchanged. Neither is touched. |
| **Navigation away and back** | Every state here is derived — `syncState()`, `strip.js`'s one-minute tick, `state.undo` — so all of it survives a screen change and none of it is module state. This is the one area of the app with no module state at all. |
| **Destructive actions** | None here. The bar is the *counterweight* to destructive actions elsewhere. |
| **Focus** | `.undo-go` and the two strip buttons are real `<button>`s. The dot is a `<span>` with an `aria-label` and no hit target — correct: it is not a control, and tapping the chip opens My trips (P0-1 §9.7). |
| **Accessibility** | Five existing `aria-label`s kept verbatim. The blank-map card is static text plus one button. **The dot must not gain a second announcement** — P0-1 §11.4 already rules that the `from Ana` marker is `aria-hidden` for exactly this reason. |

---

## 6. Visual treatment

| Element | Treatment |
|---|---|
| `.trip-chip` | existing — `flex: 1; min-width: 0`, **`height: 44px`**, `display: flex; align-items: center`, `gap: 9px`, `padding: 0 12px`, `#fff`, r14, `box-shadow: 0 2px 10px rgba(20,32,28,.12)`. **Fixed height — see §5** |
| `.trip-mark` | existing — 26×26, r8, **`--jade` fill with `#fff` text**, 11px/700, `flex: none`, grid-centred. (It is the *trip's* mark and it is jade; the *person* mark `.who-mark` is the light bone chip. They are different components and must not be drawn alike) |
| `.trip-name` / `.trip-meta` | existing — 13px/600/lh 1.15 with `nowrap` + ellipsis; 11px `--muted`/lh 1.3 |
| `.sync-dot` | existing — 8px, `border-radius: 50%`, `flex: none`; `.jade` `--jade`, `.amber` `--amber`, `.red` `#9B4B4B`, `.grey` `--faint` |
| `.sync-dot.grey` | **changed** — `background: transparent; box-shadow: inset 0 0 0 1.5px var(--faint)`. The one CSS change in this document |
| `.sync-ring` | existing — **10px, `border-radius: 50%`, `border: 2px solid #C9D0CB` with `border-top-color: var(--jade)`**, `flex: none`, `animation: sync-spin 1s linear infinite`, and `animation: none` under `prefers-reduced-motion`. **Untouched.** The 2px `#C9D0CB` ring against a jade top edge is what makes it read as motion rather than as a state — and it is the reason a *static* hollow dot (§1.3) cannot be confused with it at 8px |
| Map pins, where a frame shows them | existing `.map-pin` — 32px circle, `--jade`, `#fff` 13px/700, `box-shadow: 0 2px 8px rgba(20,32,28,.35)`, `border: 0`. Variants: `.slack` 40px ink at 15px · `.sub` 18px white with a 2.5px amber border and transparent text · `.sub-num` 28px amber at 12px/800. **Not touched by this design; recorded because the blank-map frame draws two of them** |
| `.trip-meta.warn` | existing — `--amber-fg`, weight 650, replacing the day/date line |
| The strip | existing `.strip` / `.strip-top` / `.strip-mark` / `.strip-title` / `.strip-body` / `.strip-acts` / `.strip-go` / `.strip-quiet` / `.strip-fine`, amber and red variants. **Untouched** — only the documented order changes |
| `.undo-slot` / `.undo-bar` / `.undo-go` | existing — untouched |
| Blank-map card | the existing `.stranded` geometry (pad 8·11, r11, 11.5px/650, `0 2px 10px rgba(20,32,28,.1)`) with `--amber-bg` fill, `--amber-fg` text, plus an `.eyebrow.amber` and one `.strip-go`-shaped button. **One new rule** if it is not composed from `.amber-note` + `.warn-fix`, which is the preferred route: both exist and both fit |

**Net new CSS: one property change (`.sync-dot.grey`) and zero new classes** if the blank-map card is built from `.amber-note` + `.warn-fix.first`.

---

## 7. What an implementer needs

1. **`.sync-dot.grey` becomes hollow.** One rule. Nothing in `syncDot()` changes — the class name still describes the state, not the colour.
2. **`p1-coverage-gaps-design.md` §5's order is superseded** by §2.2 here. `remind.js`'s **header comment is also wrong** and should be corrected when that file is next opened (IF-24) — but the code must not be reordered to match either piece of prose.
3. **`strip.js` `outside()` gains a second branch**: no kept areas and no tiles → the §4.2 card. Its existing branch is unchanged.
4. **The undo label rule** (§3) applies to every future `rememberUndo` caller, including P0-4's four.
5. **Nothing else changes.** Not the ring, not the five aria-labels, not the two states that carry words, not `strip()`'s order, not the undo timing, not `.stranded`.

---

## 8. Exact copy

**Canonical.** The artboard may show these strings and no others; trip names, counts and dates on it are illustrative data.

**The sync dot** — no visible strings except the two states that already have them:
> `3 changes waiting for signal` *(existing, `queued`)*
> `3 changes cannot be sent` · `3 changes have been stuck for 2 days` *(existing, `stuck`)*
> aria-labels, unchanged: `Saving` · `Saved` · `Waiting for signal` · `Changes are stuck` · `Saved on this device only`

**The strip** — every string existing and unchanged. The order is documentation, not copy:
> **1** a loop reminder you will miss › **2** changes that cannot be sent › **3** a loop reminder getting tight › **4** outside a kept area › **5** changes waiting for signal **(corrected order — RC-16)**
> `Said once. It comes back only if the walk gets 10 minutes longer.` *(existing fine print, reminders only)*
> `No map here, but the plan still works` · `Keep this area too` *(existing, `outside()`)*

**The blank map, with no kept areas** *(new)*
> `NO MAP PICTURE`
> Distances, order and walking times are all worked out on the phone. Only the streets are missing.
> `Keep an area for offline`

**The undo bar** — the bar has no copy of its own; every label comes from its caller:
> `Undo` *(existing)*
> Rule: a label names the thing, never the act alone. **(new — a rule, not a string)**

---

## 9. Reconciliations and findings

| id | Conflict | Verified | Resolution |
|---|---|---|---|
| **RC-14** | Coverage §2B / §3B.11: "five sync states in one **6px** dot". | `.sync-dot` is **8px**; `.sync-ring` is **10px**. | Corrected. Immaterial to the design, material to the credibility of a visual claim. |
| **RC-15** | Same rows: "**no label**". | All five carry an `aria-label`; **two of the five carry a visible sentence** in `.trip-meta.warn`. | Corrected. The genuine question is only about the three wordless states, and two of those answer themselves (§1.1). |
| **RC-16** | `p1-coverage-gaps-design.md` §5 states the strip's order as **stuck › outside › queued › reminder**. `remind.js`'s own header comment states **reminder › outside › stuck**. | `strip()` is **red reminder › stuck › amber reminder › outside › queued**. | **The code is right; both prose statements are wrong and both are corrected.** The approved *decision* (keep the source's order) is unchanged — §2.2. |
| **RC-17** | Coverage §2C / §3B.12: "offline map and failed map are the same grey canvas; only the Map screen carries the `.stranded` banner", implying `.stranded` is the map's explanation. | `.stranded` is about the **backend**, not tiles; the strip's `outside()` already handles the kept-area case. | The gap is one uncovered condition — no kept areas, no tiles — and it is designed in §4.2. `.stranded` is not the map's explanation and never was. |
| **RC-20** | An earlier draft of §1.1 "corrected" the matrix's *"44px chip"* to *"not a 44px control"*, and the board drew `.trip-mark` as a bone chip with charcoal text. | `.trip-chip` is **`height: 44px`** and fixed; `.trip-mark` is **jade-filled with white 11px/700 text**. | **The matrix was right and I was wrong.** Both are corrected in §6, and the fixed height produces a real constraint (§5) and a finding (IF-32). The mark error is the same class as the previous batch's inverted `.who-mark`: **the trip's mark is jade, the person's mark is bone, and they are different components.** |
| **RC-21** | §1.4 and §6 asserted "10px `.sync-ring`, spinning" and gave **no border spec**, so neither the document nor the artboard could be checked against the other; the board drew the ring at `2px solid #CFE0D9` (that is `--jade-bd`). And the blank-map frame's two numbered pins were drawn at 28px/12px/800 with no shadow — which is `.map-pin.sub-num`, the **amber sub-route** pin, not the jade main-route one. | `.sync-ring`'s border is **`2px solid #C9D0CB`** with a jade top edge. `.map-pin` is **32px, jade, 13px/700, `0 2px 8px rgba(20,32,28,.35)`**. | Both corrected in §6 and in the artboard. **The ring is one of the five states this board exists to compare**, and the pins were a hybrid of two real components — the same error class as RC-20, one level further out: not a component drawn from memory, but a component drawn from *another component's* memory. |

**Implementation findings — recorded, not fixed.**

| id | Finding |
|---|---|
| **IF-24** | `remind.js`'s header comment states a rank order its own `strip()` does not implement. |
| **IF-25** | `clearUndo()` is exported and called by nothing. |
| **IF-26** | `syncState()` returns `line: 'Saving…'` for the `saving` kind, and `tripChip()` never renders it. Correct; recorded so it is not "connected up". |
| **IF-27** | The `queued` strip renders no action, by omission rather than by an explicit decision in `strip.js` `gather()`. §2.3 makes it a decision. |
| **IF-31** | **`.trip-meta.warn` is one class for both worded states**, so a `stuck` trip chip renders a **rust dot beside an amber sentence**. Verified: `syncDot()` branches on kind, `tripChip()` does not. Cosmetically mild and semantically loose; **recorded, not designed** — splitting it would add a rust variant of a line that is already the most serious thing the chip can say, and the strip above the tab bar carries the rust treatment for this condition. |
| **IF-32** | **`.trip-chip` has a fixed `height: 44px` and `.trip-meta` has no overflow rule**, so a worded sync state that wraps to two lines overflows the chip rather than growing it. No reachable string does today (§5), which is why this is a finding rather than a defect — but it is a one-line trap for anyone lengthening the `queued` or `stuck` sentence. |

---

## 10. Status

| Item | Status |
|---|---|
| **`local` becomes a hollow dot; the other four unchanged** | DESIGNED — one CSS property, the whole of the sync-dot decision |
| The five states recorded as the visual baseline | RECORDED from source — **RC-14 / RC-15** |
| `local` stays wordless; `stranded` keeps the sentence | DESIGNED — a deliberate nothing, with its reason |
| **The strip's rank order corrected** | RECORDED from source — **RC-16**, correcting an approved document and a source comment |
| The `queued` strip's missing action | RECORDED as a **knowing exception**, with the rule it satisfies instead (§2.3) |
| Only the loop reminder is dismissible | RECORDED from source |
| The undo bar's three states; replace-not-stack; survives navigation | RECORDED from source |
| The undo-label rule | DESIGNED — a rule for future callers |
| **The blank map with no kept areas** | DESIGNED — new copy, one card, composed from existing classes |
| Saying *why* the map is blank | **OD-7** — recommendation: no (§4.2) |
| A fifth colour, a label under the dot, a numeral in the dot, a bigger dot | **REJECTED** with reasons (§1.3) |
| A stacked or plural undo bar | **REJECTED** — the bar is one label about one thing (§3) |
| Wiring `saving`'s `line` into the chip | **REJECTED** — P0-5 R3, and IF-26 |

**One OPEN DECISION is raised: OD-7** — *should a blank map try to say why it is blank?* Recommendation: no. Everything else above is a UX call and is made.
