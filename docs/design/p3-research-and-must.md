# P3 — Research and the Must layer: one taxonomy, four families

**Date:** 29 Sep 2026 · **Verified against** the working tree on `claude/intelligent-pasteur-ebuo53`, read this session
**Status:** design, for review. **Nothing implemented. No application code changed.**
**Artboard:** *Harbour Garden* rev 5, plates 03 (Map) and 06 (Pocket — Must).
**Canonical:** this document for the taxonomy, the Must screen and the research pipeline's contract.
**Depends on:** `p3-information-architecture.md` — D-12 (Must pins on Map), D-13 (one shared place card), D-16 (Pocket hub).

**Source read this session:** `src/data.js` `CATEGORY_LABELS` 253–290, `SHOP_CATEGORIES` 292–298, the clash note 441–452, `PLACE_CATEGORY_IDS` 451, `SHOP_CATEGORY_IDS` 452, `STOP_SUMMARY_LINES` and the field whitelist 403–420 · `src/store.js` `stopSummaryRows` 2531–2560 · `src/screens/dest.js` 29 · `src/screens/nearby.js`, `src/screens/shop.js` · `research/trip12/validate_research.py`, `fetch_images.py` · the 2026-09-23 backup: 618 places, `shopping.category` 103 of 104 `souvenir`, `mustSee.tag` used as day labels.

**Fixed foundations, not reopened:** every stop is a place · no paid APIs — places and geocoding are OpenStreetMap, photos are Wikimedia Commons · no stock photos and no invented positions · it must work offline.

**Out of scope, deliberately:** a paid places API · user reviews or ratings from third parties · the Nearby screen's own interaction set, which is settled in `p1-coverage-gaps-design.md`.

---

## 1. What exists today, measured

This is the feature area where the record and the reality diverge most, so the numbers come from the backup rather than from memory.

| Claim | Verified | Verdict |
|---|---|---|
| "Trip 12 has 187 places" | **618.** The 187 figure was quoted in four documents. | **Wrong by a factor of three.** |
| "The app has one category system" | **Two, and they clash.** `CATEGORY_LABELS` (places) and `SHOP_CATEGORIES` (shopping) share exactly one key, `food`. `data.js:441–452` already flags it as a live trap and splits the two id lists so a check can assert each field against its own. | **Wrong. The clash is known and documented in source.** |
| "The 'Must' idea exists once" | **Three times.** `mustSee` records; the five-line `stopSummary{do,eat,snack,buy,see}` on a plan row (`store.js:2531`); and the shopping list. | **Wrong. Unifying three half-features is the actual work.** |
| "Shopping categories are meaningfully used" | **103 of 104 items are `souvenir`.** | **Effectively unused — which makes migration nearly free.** |
| "`mustSee.tag` is a tag" | It holds **day labels**. | **Abused, and it must be migrated, not preserved.** |
| "There is no photo pipeline" | `research/trip12/fetch_images.py` fetches from `commons.wikimedia.org`; 2 places and 24 mustSee records already carry real photos with credits. | **Wrong. Free, credited photography already works.** |

**The last line is the most important fact in this document.** The design leans on real photography throughout, and it costs nothing because it already exists.

---

## 2. The principle

> **Four families, sub-categories underneath, and one list of ids that everything uses.**

**D-1. The four families are `buy`, `eat`, `see`, `do`.** They already exist in the CSS as `--sum-do / --sum-eat / --sum-see / --sum-buy`, which already pass contrast, and in `stopSummary` as four of its five lines. This is not a new idea being introduced; it is an existing idea being made the only one.

**D-2. `snack` is folded into `eat` as a sub-category.** The fifth `stopSummary` line becomes `eat/snack`. Five families where four would do is how the clash started.

**D-3. One taxonomy replaces both enums.** `CATEGORY_LABELS` and `SHOP_CATEGORIES` are deleted. Every place, every shopping item, every mustSee record and every Must entry carries `family` and `subcategory` from the same table.

```
TAXONOMY = {
  buy: ['souvenir', 'food-gift', 'clothing', 'beauty', 'craft', 'duty-free', 'other'],
  eat: ['street-food', 'seafood', 'noodles', 'cafe', 'sweets', 'late-night',
        'local-speciality', 'restaurant', 'snack'],
  see: ['view', 'temple-shrine', 'museum', 'garden-park', 'architecture',
        'market', 'neighbourhood', 'seasonal'],
  do:  ['walk', 'onsen-spa', 'experience', 'festival', 'transport-ride',
        'shopping-street', 'photo-spot'],
}
```

**D-4. A record has exactly one family and at most one sub-category.** Not tags, not many-to-many. A thing that is genuinely two things is two entries, and that is rarer than it sounds. Multi-select filtering over a single-valued field is simple and fast; over a tag array it is neither.

**D-5. `other` exists in every family and is not a failure.** The airport batch taught this: roughly a third of what is genuinely useful at an airport — an ATM, a coach kerb, a meeting point — is neither a sight nor a rest. A taxonomy without an escape hatch pushes that into the wrong bucket instead of an honest one.

---

## 3. Migration

This is the highest-risk change in the whole programme — 618 real places — which is why the Phase 0 backup exists and why this runs in the emulator against the restored backup before it goes near production.

| From | To | Risk |
|---|---|---|
| `shopping.category: souvenir` ×103 | `buy/souvenir` | **none** — one value, one target |
| `shopping.category: other` ×1 | `buy/other` | none |
| `CATEGORY_LABELS.food` | `eat/restaurant` unless the name says otherwise | **low** |
| `.cosme` | `buy/beauty` | none |
| `.cloth` | `buy/clothing` | none |
| `.shopping` | `buy/souvenir` | low |
| `.sight` | `see/view` | **medium** — some are temples, museums or neighbourhoods |
| `.rest` | `do/other` | medium |
| the airport keys | `do/other` and `see/other` | low |
| `mustSee.tag` (day labels) | **`dayNumber`**, then cleared | **medium** — it is being read as something it is not |

**D-6. The migration is idempotent and runs twice in the test.** Every existing migration in the app is idempotent by construction; this one must be too, and unlike the existing four it must be *asserted* to be — the second pass changes nothing.

**D-7. Nothing is deleted in the migration.** The original value is written to `legacyCategory` and left there. A migration that loses the evidence cannot be audited, and 618 records is too many to re-derive by hand.

**D-8. `mustSee.tag` becomes `dayNumber` and the field is cleared.** It was a day label wearing a tag's name; leaving it would guarantee the next session reads it as a tag again.

---

## 4. The Must screen

Pocket → Must.

**D-9. Two rows of chips: families across the top, sub-categories underneath.** The sub-category row shows only the sub-categories of the selected family, so it is never long and never irrelevant.

**D-10. Each entry shows a thumbnail, a name, one line of why, and its state.**

```
[photo]  Ssiat hotteok
         Seed-stuffed pancake · BIFF Square · ₩2,000
         [STREET FOOD] [6 min away]
```

**D-11. The state tag is the most useful thing on the row**, and there are four: `6 min away`, `on today's plan`, `tomorrow`, or nothing. A list of 61 things you might do is a chore; a list that says which are near you and which are already planned is a tool.

**D-12. Every Must entry is also a pin on Map**, and tapping either opens the same place card (IA D-13). This is the answer to the market review's "it cannot suggest anywhere" that needs no paid API: the data exists, it just has nowhere to be seen.

**D-13. `Add to day N` is the primary action on the card**, and it creates a stop at that place — never a copy of it. The standing rule holds.

---

## 5. The research pipeline

**D-14. Research stays in Python, in `tools/`, and never ships to a phone.** It runs on the owner's machine and produces committed JSON. This is the settled language decision and this document does not reopen it.

**D-15. Every researched entry carries provenance, and the validator gates it.**

| Field | Required |
|---|---|
| `source` | yes — a URL or a named source |
| `confidence` | yes — `high` / `medium` / `low` |
| `nameLocal` | yes where the language is not Latin-script |
| `coord` | no — but if absent, it is absent, never guessed |
| `photo` | no — Wikimedia Commons with its credit, or nothing |

**D-16. A batch that fails validation is not imported.** `research/trip12/validate_research.py` already does this job for one trip; it moves to `tools/` and becomes the gate for any destination.

**D-17. No invented positions and no stock photography.** Both are on the permanent rejection list, and the pipeline is where the temptation lives. An entry with no coordinate renders without a pin rather than with a plausible one.

**D-18. `confidence: low` is shown, not hidden.** The row carries a quiet marker. The app's habit of reporting what it observed rather than what it assumes applies to research as much as to sync.

---

## 6. What this fixes, and what it costs

**Fixes:** the two-enum clash flagged in source since 7 Sep; three overlapping Must features; a Nearby screen with no sub-category filter; and the app's inability to suggest anywhere.

**Costs:** one migration over 618 real records, one taxonomy table replacing two enums in every screen that filters, and `stopSummary`'s five lines collapsing to four families. `dest.js`, `nearby.js`, `shop.js` and `plan.js` all read one of the two enums today.

**D-19. The migration ships on its own, before the Must screen.** Taxonomy first, screen second. Two risky things in one deploy is how a 618-record migration becomes unattributable.

---

## 7. Test obligations

1. **The taxonomy migration loses no record and no category**, run against the restored Trip 12 backup in the emulator. Counts before and after must match, per family.
2. **The migration is idempotent** — run twice, second pass changes nothing.
3. **`legacyCategory` is preserved on every migrated record.**
4. **`mustSee.tag` becomes `dayNumber` correctly** for all 34 records, and the field is cleared.
5. **Every taxonomy id used by any screen exists in the table** — the assertion `data.js:441–452` already wants, made total.
6. **A research batch missing `source` or `confidence` is refused** by the `tools/` validator, with a test in `pytest`.
7. **A place with no coordinate renders with no pin**, not a default one.
8. **`Add to day N` creates a stop at the place**, and does not copy the place's fields.

---

## 8. Decisions

1. **D-1** The four families are `buy`, `eat`, `see`, `do`.
2. **D-2** `snack` is a sub-category of `eat`.
3. **D-3** One taxonomy table replaces `CATEGORY_LABELS` and `SHOP_CATEGORIES`.
4. **D-4** One family and at most one sub-category per record; not tags.
5. **D-5** `other` exists in every family and is an honest answer.
6. **D-6** The migration is idempotent and asserted to be.
7. **D-7** Original values are kept in `legacyCategory`.
8. **D-8** `mustSee.tag` becomes `dayNumber` and is cleared.
9. **D-9** Must shows families across the top, sub-categories underneath.
10. **D-10** Each row: thumbnail, name, one line of why, state.
11. **D-11** The state tag is the row's most useful element.
12. **D-12** Every Must entry is a pin on Map, sharing one place card.
13. **D-13** `Add to day N` creates a stop at the place, never a copy.
14. **D-14** Research stays in Python, in `tools/`, and never ships.
15. **D-15** Every entry carries `source`, `confidence` and `nameLocal` where relevant.
16. **D-16** A batch failing validation is not imported.
17. **D-17** No invented positions, no stock photography.
18. **D-18** `confidence: low` is shown, not hidden.
19. **D-19** The migration ships before the Must screen, on its own.
