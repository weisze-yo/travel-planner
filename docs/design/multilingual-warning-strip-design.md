# Multilingual Warning Strip — Design Exploration

**Date:** 4 Sep 2026 · **Artboard:** `Multilingual Warning Strip.dc.html` (one frame, 390 × 844, light only)
**Scope:** design exploration only. No production code was changed.
**Status (5 Sep 2026):** the fact-first structure and its CJK wrapping behaviour are **APPROVED**. This document, including its 4 Sep follow-up, is the canonical strip design; `new-feature-design.md` §3 designed the same strip differently and is superseded. Consolidated status, the four-kind table and the `dayIssues()` split are in `docs/design/p0-3-system-sign-off.md` §2. Two items remain: **S-2** (whether the Latin-first stack applies to place names only or to `body` — recommendation: `body`) and **RTL**, deferred.

Baseline read before designing: `docs/design/existing-ui-audit.md`, `docs/design/existing-ui-visual-reference.md`, and the live source — `web/css/app.css` (`.warn`, `.warn-label`, `.warn-text`, `.warn-fix`, `.plan-card`, `.loop-lane`) and `web/js/screens/plan.js` / `web/js/store.js` (where the warning strings are generated).

---

## Problem

`store.js` builds each warning as one English sentence with the place name interpolated into the middle of it:

```js
text: `Starts ${clock(at)} but sits after ${previous.name} at ${clock(previous.at)}.`
text: `${runningName} runs to ${clock(runningEnd)}, so these two are on top of each other.`
```

The name is the user's own string and can be in any script. Four things break when it is CJK:

1. **The name stops being findable.** In `.warn-text` (11.5px / 400 / `#8A5A08`) the interpolated name has no weight, colour or boundary of its own. In Latin it is at least capitalised; `西市場` in a run of amber body text at 11.5px is just more amber text. The user cannot tell which part of the sentence is *their* stop and which part the app wrote.
2. **Wrapping goes soft.** CJK has no spaces, so the browser may break *inside* the name. `西マーケット` can wrap after `西`, splitting a proper noun across two lines mid-sentence. Latin names never do this.
3. **Grammar around the name reads as machine output.** "Listed after 西市場, which starts at 13:30" mixes an English relative clause with a Chinese noun and an ASCII comma butted against a CJK glyph. It is understandable but visibly generated.
4. **Height creeps.** At 390px the card body is ~325px wide. A three-clause sentence with a long name is 2–3 lines; add two `.warn-fix` buttons and a flagged stop is ~150px tall. Two or three flagged stops fill the fold.

Constraint held throughout: the surrounding copy stays one English string, the user's name is never translated, romanised, shortened or truncated.

---

## Tested examples

| | Stop name | Second name (overlap case) |
|---|---|---|
| English | Nishi Market | Ashgate Shrine |
| Chinese | 西市場 | 灰門神社 |
| Japanese | 西マーケット | 芦門神社 |

Stress-test names in the surrounding itinerary UI (realistic, not padding):

- Day header — 大稻埕・迪化街老屋與布市半日散步
- Plan card — 永樂布業商場二樓・布料選購 · 霞海城隍廟・月老參拜
- Plan card, Japanese — 浅草寺仲見世通り食べ歩きコース
- Sub route card — 寧夏夜市與雙連朝市小吃巡禮

The artboard has a pill row (English / 中文 / 日本語) that swaps the name in all four warning strips at once, so the three scripts are compared in identical layouts.

---

## Tested structures

All four carry the same warning (`OUT OF ORDER`, listed after a stop that starts at 13:30) so the comparison is like-for-like. A fifth instance shows the winner on an `OVERLAPS` sub route.

**A — Inline sentence** (today's shape)
`OUT OF ORDER` / "Listed after 西市場, which starts at 13:30." — name inline, unstyled.

**B — Name on its own line**
`OUT OF ORDER` / "Listed after" / **西市場** (13px/700 ink) / "which starts at 13:30." Sentence grammar preserved, broken across three lines.

**C — Quoted name**
`OUT OF ORDER` / "Listed after “西市場”, which starts at 13:30."

**D — Fact-first**
`LISTED AFTER` (the existing 10.5/800 label, now carrying the relation) / **西市場** (13px/700 ink) / "Starts 13:30 · this stop 13:25" (11.5px amber, tabular). No sentence.

**Hybrid considered and dropped:** A with the name bolded in place (`<strong>` inside `.warn-text`). It fixes findability and nothing else — the mid-sentence wrap, the CJK/ASCII punctuation collision and the height all remain, and bold-inside-body is a typographic move the product does not otherwise make.

---

## CJK stress-test findings

**Wrapping.** In A and C the CJK name is inside a justified run and breaks anywhere, including between the two glyphs of a two-character name. In B and D the name is its own block, so a break can only fall inside a genuinely long name and reads as a normal second line. `text-wrap: pretty` helps A but cannot forbid the intra-name break.

**Line height.** `.warn-text` at 1.4 is tuned for Latin. CJK glyphs fill the em box, so at 11.5/1.4 consecutive CJK lines look tight against the Latin lines above them. Isolating the name (B, D) lets it take 1.3 at a larger size where the density reads as deliberate.

**Punctuation.** The ASCII comma after `西市場` in A and C sits hard against the glyph with no optical space — the worst detail on the board. Curly quotes in C are worse: `“西市場”` puts Latin-metric quote marks around full-width glyphs and the left quote nearly collides with the preceding space. D has no punctuation touching the name at all; the middle dot in "Starts 13:30 · this stop 13:25" is the product's existing separator and never touches the name.

**Findability.** Ranking, unambiguous: D ≥ B > C > A. In D the name is the only ink-coloured text inside an amber strip — it is found before the sentence is read. In A the Chinese name is genuinely hard to locate on a first pass.

**Height at 390px** (flagged card, two fix buttons, measured on the artboard):

| | English | Chinese | Japanese |
|---|---|---|---|
| A inline | 2 lines | 2 lines | 2–3 lines |
| B own line | 3 lines | 3 lines | 3 lines |
| C quoted | 2–3 lines | 2 lines | 3 lines |
| D fact-first | 3 lines (label / name / facts) | 3 lines | 3 lines |

D is fixed at three short lines and is the only structure whose height does not move with script or name length: the label and fact lines never grow, and only a genuinely long name adds a line. A and C are nominally shorter but unpredictable — they gain a line exactly when the name is long, which is when the warning matters most. B is always the tallest and the extra height buys nothing over D.

**Long names in the surrounding UI.**

- *Day header* — 大稻埕・迪化街老屋與布市半日散步 at 17px/700 fits one line at 358px of content width. At 24px `.screen-title` it would wrap to two; the header keeps the tab-level title as "Plan" and puts the day name at push-title size in the scroll, so it holds. No truncation needed.
- *Plan card* — `.plan-name` at 14.5px/650 takes ~19 CJK glyphs before wrapping. 永樂布業商場二樓・布料選購 fits on one line beside the `MAIN 4` badge because the badge is `flex:none` and the name column `min-width:0`. The Japanese 浅草寺仲見世通り食べ歩きコース wraps to two lines cleanly. Nothing overflows, nothing needs an ellipsis, and the card grows by exactly one line.
- *Sub route card* — the tightest spot. `.loop-lane-name` shares a baseline row with the right-aligned `14:00 – 15:40` window. 寧夏夜市與雙連朝市小吃巡禮 wraps to two lines and the window stays pinned on the first baseline; it looks intentional. Below ~330px of card width the window would be squeezed, so the window must stay `flex:none` and the name must stay `min-width:0` — which is what the current CSS already does.
- *Controls* — `.warn-fix` buttons are `white-space:nowrap` and wrap as a group; with two buttons they stay on one row at 390px in all three scripts. Hit targets are 30px tall inside a 44px-tall touch zone including the strip padding.

**Nothing gives out at 390px.** The existing layout survives long CJK in all three positions. The failure is in the *warning sentence*, not in the cards.

---

## Recommended structure

**D — fact-first, reusing the existing warning label.**

```
┌ amber strip ─────────────────────────────┐
│ LISTED AFTER            10.5/800 #8A5A08 │
│ 西市場                    13/700 #14201C │
│ Starts 13:30 · this stop 13:25           │
│                         11.5/400 #8A5A08 │
│ [ Move it back ] [ Start 14:20 ]         │
└──────────────────────────────────────────┘
```

Three reasons, in the priority order that was set:

1. **Comprehension.** The relation ("listed after", "overlaps", "ends when it starts") is the thing the user needs first, and the product *already* renders it as a label above the sentence. The sentence was restating the label in prose. Removing it loses no meaning — it removes a paraphrase.
2. **Scanability.** The name is the only ink-coloured, bold run inside an amber block, so "which stop is this about" is answered pre-attentively. With three flagged stops on a day, the user reads three labels and three names, not three sentences.
3. **Multilingual robustness by construction.** The name is never inside English grammar, so there is no interpolation point to get wrong. No punctuation touches it, it cannot wrap mid-sentence, and swapping English → Chinese → Japanese changes nothing about the layout or the strip height. The rule "the generated copy and the user's name never share a line" is a rule implementation can actually hold.

It is also the **most consistent with the product** of the four: it reuses `.warn`, `.warn-label`, `.warn-fix` and the `·` separator unchanged, adds one line, and adds no new colour, radius or component. And it is the **most predictable** — three short lines in every script, where A and C swing between two and three depending on the name.

---

## Rejected alternatives

**A — inline sentence.** Rejected. The name is unfindable in CJK, breaks mid-noun, and collides with ASCII punctuation. It is the only option where the user must read the whole strip to learn which stop is meant.

**B — name on its own line, sentence preserved.** Rejected, though it was close. It fixes findability and wrapping, but keeping "Listed after" / "which starts at 13:30" as two orphaned sentence fragments around the name reads worse than either a full sentence or no sentence — the fragments are grammar with nothing to hold on to. It is also the tallest option in every script, for the same information D gives in two lines.

**C — quoted name.** Rejected, and it is actively worse than A for CJK. Latin-metric curly quotes around full-width glyphs sit badly, and Chinese and Japanese conventionally use 「」 or 《》 — using `“ ”` looks like a bug to exactly the users this is meant to help, and switching quote marks by script would be a per-language typographic fork. The quotes also add visual noise inside an already-coloured strip without separating anything a weight change does not separate better.

**Hybrid (A + bold name).** Rejected. Half a fix: findability improves, wrapping, punctuation and height do not.

---

## Implementation implications

Rules a future implementation session must preserve. **Not implemented here.**

1. **The strip is three parts, in this order:** relation label → place name → facts. Optional fix buttons below, unchanged.
2. **The relation label replaces the current kind label** where a relation exists. `OUT OF ORDER` becomes `LISTED AFTER`; `OVERLAPS` stays; `ENDS WHEN IT STARTS` and `NO TIME` have no second party and keep their current label + one fact line, with no name line.
3. **The name line is its own element.** 13px / 700 / `#14201C`, `line-height: 1.3`, `text-wrap: pretty`, no quotes, no ellipsis, no truncation, no `white-space: nowrap`. It may wrap to as many lines as the name needs.
4. **Generated copy and the user's name never occupy the same line.** No template may interpolate a name into a sentence. This is the load-bearing rule.
5. **The fact line is short, tabular and separator-joined:** `Starts 13:30 · this stop 13:25`, `Runs to 14:30 · this starts 14:00`. 11.5px / `#8A5A08`, `font-variant-numeric: tabular-nums`. Use the product's `·`, never a comma.
6. **Semantics are unchanged.** The same warnings fire on the same conditions with the same fixes; only presentation changes.
7. **Colour contract unchanged.** Amber surface `#FBF1DE`, amber text `#8A5A08`, ink only on the name line. No new token.
8. **Geometry unchanged.** `.warn` keeps `margin-top:10px`, `padding:9px 10px`, `radius:10px`. The name line adds `margin-top:3px`; the fact line `margin-top:3px`.
9. **Card layout must keep `min-width:0` on the name column and `flex:none` on the badge / window** — this is what stops long CJK from pushing controls off a 390px card. It is already correct in `app.css`; do not lose it.
10. **No per-language copy.** One English string set, any script in the name slot. No romanisation, no shortening.
11. **The existing markup defect in Plan's edit mode** (quoted values in quoted attributes, audit §12.16) is untouched and out of scope.

## Follow-up: how each warning kind behaves (4 Sep 2026)

Two of the three open questions are now closed. The approved fact-first structure is unchanged; this only settles how the existing warning kinds map onto it.

### The general rule

Three slots, and a slot is omitted rather than filled with a substitute:

| Slot | Holds | Omitted when |
|---|---|---|
| **Label** — 10.5/800 uppercase amber | the relation, in words only | never |
| **Name line** — 13/700 ink | the *other* party's name, verbatim | there is no other party |
| **Fact line** — 11.5 amber, tabular | the numbers, other-then-self | there are no numbers |

The scan path is the same every time: *what relation → whose → their number → my number.* The fact line reads in the same order as the name line above it, so the first number always belongs to the name the user just read.

**The presence of the ink line is itself the signal.** Ink line = another stop is involved. No ink line = this row only. That invariant is worth more than filling the slot for visual consistency, and it is why nothing is substituted into an empty slot.

### Q1 — should the label carry the time (`LISTED AFTER · 13:30`)? **No.**

Four reasons, in order of weight:

1. **`LISTED AFTER` has two times, not one.** The whole point is the comparison — 13:30 against 13:25. A label can hold one value; collapsing to one would either hide this stop's time or hide the other's, and the user then cannot see why the order is wrong. Making the label variable by kind (one time for overlap, two for order) is worse than a consistent fact line.
2. **The label family has never held a number.** `.warn-label` is the same 10.5/800/`.04em` uppercase treatment as `.eyebrow` and `.badge`, and none of the four label families in the product carry values. Letterspaced uppercase also defeats `tabular-nums`, so times in a label would not align between stacked warnings — the one place the product is strict.
3. **It puts a growing element above a wrapping one.** The label sits directly above a name line that already wraps. Two variable-width lines stacked is where CJK layouts start looking accidental.
4. **It saves nothing.** The fact line is one 11.5px line, ~16px. The label would grow to two lines on the order case anyway.

**Keep the fact line. The label stays words-only in every kind.**

### Q2 — `ENDS WHEN IT STARTS` has no second party. **Label + fact line, no ink name line.**

```
ENDS WHEN IT STARTS
Starts and ends 16:10
[ Leave the end open ]
```

The rejected alternative was echoing *this* stop's own name into the ink line to keep all three kinds visually identical. That is wrong twice: the card's title is already 40px above it, and — more seriously — it would break the ink-line invariant. Once the ink line sometimes means "this stop", the user has to read it to know which, and the pre-attentive read that justified fact-first in the first place is gone.

Two lines instead of three is correct here: it is a smaller problem about one row, and it looks like one. Shown on the artboard as stop 8 (迪化街２０７博物館), directly under the sub route, so the presence and absence of the ink line are comparable in one glance.

`NO TIME` follows the same shape with no numbers either — `NO TIME` / `No start time yet.` One line of fact, no ink line.

### The three kinds, resolved

| Kind | Label | Name line | Fact line |
|---|---|---|---|
| `order` | `LISTED AFTER` | the earlier-listed stop | `Starts 13:30 · this stop 13:25` |
| `overlap` | `OVERLAPS` | the stop still running | `Runs to 14:30 · this starts 14:00` |
| `reversed` | `ENDS WHEN IT STARTS` | — | `Starts and ends 16:10` |
| `notime` | `NO TIME` | — | `No start time yet.` |

Both two-party fact lines use the product's `·` separator and `tabular-nums`; neither uses a comma. `OVERLAPS` drops its current trailing explanation ("so these two are on top of each other") — the label says it.

### One asymmetry, accepted

`OVERLAPS` names a problem; `LISTED AFTER` names only a relation. Under the old copy the label was `OUT OF ORDER`, which alarmed. It is still the right trade: the amber surface, the amber gutter clock and the flagged card border already carry "something is wrong", and under fact-first the label's job is to say *which* relation, not to repeat the alarm three ways. `OUT OF ORDER · AFTER` was considered and dropped as noise.

### Still open

- **Bidirectional scripts** (Arabic, Hebrew) untested. The isolated name line should behave, but no RTL claim is made until it has been seen.

## Earlier open questions (superseded above)

- Should the relation label carry the *other* stop's time (`LISTED AFTER · 13:30`) and drop the fact line to one value? Tighter, but it puts a number in a label family that has never held one.
- `ENDS WHEN IT STARTS` has no second party. Confirmed as label + one fact line here, but it has not been seen next to the new shape on a real day with several warnings.
- Bidirectional scripts (Arabic, Hebrew) were not tested. The isolated name line should behave, but it needs a pass before any RTL claim is made.
