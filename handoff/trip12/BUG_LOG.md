# Trip 12 — known bugs, logged and not yet fixed

The bugs in this file are **real and reproduced**, deliberately not fixed in the commit that
found them, so that an unrelated change does not carry a behaviour fix nobody reviewed. Each
entry says what is wrong, what a user sees, and what the fix is, so it can be picked up cold.

The 29 manual-testing bugs are not here — Bucket A's 20 are fixed and deployed, and B/C/D are
tracked against the Design sections that gate them (`BRIEF_CLAUDE_DESIGN.md`).

---

## 1. `spend.js` renders purchase categories through the wrong enum

**Where** `web/js/screens/spend.js:313`

```js
<span class="chip">${store.categoryLabel(item.category)}</span>
```

**What is wrong** There are two unrelated category enums in this app and this line crosses them.

| enum | values | lives in |
|---|---|---|
| `PlaceCategory` (`CATEGORY_LABELS`) | `food` `cosme` `cloth` `shopping` `sight` `rest` `service` | `data.js` |
| `SHOP_CATEGORIES` | `food` `clothing` `souvenir` `beauty` `other` | `data.js:291` |

A purchase's `item.category` is a **`SHOP_CATEGORIES`** id — that is the list `shop.js:251` and
`shop.js:286` write from, and the list `spend.js:164` groups by. But `store.categoryLabel` looks
its argument up in `CATEGORY_LABELS`, and falls through to the raw id when it misses:

```js
export const categoryLabel = (category) => seed.CATEGORY_LABELS[category] || category;
```

**What a user sees** Four of the five shop categories only ever match by accident:

| purchase category | chip shows | correct |
|---|---|---|
| `food` | "Food" | ✅ by coincidence — the id exists in both enums |
| `clothing` | "clothing" | ❌ should be "Clothing" |
| `souvenir` | "souvenir" | ❌ should be "Souvenir" |
| `beauty` | "beauty" | ❌ should be "Health & beauty" |
| `other` | "other" | ❌ should be "Other" |

So the Spend report shows a lowercase raw id where every other chip in the app shows a label,
and "Health & beauty" is lost entirely. It is cosmetic — nothing is stored wrong, and the
grouping at `spend.js:164` is correct because it groups by id.

**The fix** One line, plus a helper next to `categoryLabel` so the two enums stop being
interchangeable at call sites:

```js
export const shopCategoryLabel = (id) =>
  (seed.SHOP_CATEGORIES.find((c) => c.id === id) || {}).label || id;
```

then `spend.js:313` calls `store.shopCategoryLabel(item.category)`.

**Why it was left** Found while adding the `service` value to `CATEGORY_LABELS` (7 Sep 2026).
Adding `service` does not make this worse — `service` is not a shop category and cannot appear
here — but it is what made the collision visible. Held out of that commit at the user's
instruction so a data/schema change does not also change the Spend screen.

**Status** open · cosmetic · no data risk · fix is ~3 lines and one test assertion
