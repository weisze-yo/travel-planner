# P3 — Money and splitting: expenses as their own record

**Date:** 29 Sep 2026 · **Verified against** the working tree on `claude/intelligent-pasteur-ebuo53`, read this session
**Status:** design, for review. **Nothing implemented. No application code changed.**
**Artboard:** *Harbour Garden* rev 5, plate 07 (Pocket — Money).
**Canonical:** this document for the expense record, the split arithmetic and the settle-up hand-off.
**Depends on:** `p3-information-architecture.md` — D-5 (Shop folds into Pocket), D-16 (hub), D-20 (pink is functional) · `p3-people-and-coordination.md` — D-3 (`people` becomes a kind), D-15 (the `handoff` family).

**Source read this session:** `src/store.js` `spendTotals` 2441–2485 (whole), `listedShopping`, `filteredShopping`, `state.trip.homeCurrencyRate` · `src/data.js` `SHOP_CATEGORIES` 292–298, `PAYMENTS` · `src/currency.js` · `src/screens/spend.js`, `src/screens/shop.js` · `src/share.js` `PRIVATE_KINDS` 72.

**Fixed foundations, not reopened:** no paid APIs — rates are the ECB · it must work offline · sharing is snapshot-and-review · your copy is yours · delete is swipe → in-row confirm → 6s undo.

**Out of scope, deliberately:** payments, transfers or any settlement inside the app · bank or card integration · receipt OCR.

---

## 1. What exists today

| Claim | Verified | Verdict |
|---|---|---|
| "The app tracks spending" | `spendTotals()` (`store.js:2441`) sums `paidAmount ?? estimate ?? 0` over **shopping items only**, bucketed by `payment` and `category`. | **Half right.** |
| "A taxi fare can be recorded" | Only by inventing a shopping item and ticking it bought. There is no other money record anywhere. | **Wrong. There is no expense record.** |
| "The app knows who paid" | Nothing anywhere carries a payer. | **Wrong.** |
| "The app handles more than one currency" | One `trip.homeCurrencyRate` (`store.js:2478`), one rate, applied to everything. | **Wrong — one trip, one currency, one rate.** |
| "The Spend report covers the whole trip" | `all: true` bypasses the day and place pills but deliberately still reads `listedShopping()`, not raw state — the comment at 2450 explains why, and it is right. | **Right**, and the reasoning is preserved below. |

**So Money is the feature area with the least existing structure and the most existing *intent*.** `spendTotals` is careful code doing a job it was never given the data for.

---

## 2. The principle

> **A shopping item is a plan. An expense is a fact. The app must not make one pretend to be the other.**

This is the specific failure in the current model: `paidAmount ?? estimate` means a ticked item with no price silently contributes its *guess* to a total labelled "spent". The number is not wrong by accident — it is a category error made in a hurry, and it is why the Spend report cannot be trusted for anything that was not on the shopping list.

**D-1. `expenses` becomes its own kind.** It is not a field on shopping, not a flag, not a second array on the trip.

**D-2. Ticking a shopping item bought *creates* an expense.** The item stays a plan; the expense is the fact. The two are linked by id, so untick removes the expense it created and nothing else.

**D-3. An expense with no amount does not exist.** There is no fallback to an estimate. If you do not know what you paid, you have not recorded an expense — and the total says `3 items ticked with no price` rather than quietly inventing three numbers.

---

## 3. The record

```
expenses/{id} = {
  id, dayNumber, at,              // when
  amount, currency, rate,         // what it cost, in what, at what rate
  homeAmount,                     // derived and stored — see D-6
  category,                       // the unified taxonomy, p3-research-and-must
  payerID,                        // people/{id}
  splitWith: [peopleID],          // who it is shared between
  splitMode: 'even' | 'shares' | 'exact',
  shares: { peopleID: number },   // only for 'shares' and 'exact'
  placeID, shoppingID,            // optional links
  note, payment,                  // payment carried over from today's PAYMENTS
  settled: boolean
}
```

**D-4. Every expense carries its own currency and its own rate.** Not the trip's. A trip through Korea and Japan has two currencies; a trip where the rate moved 4% over eight days has several. One rate per trip was the thing that made multi-country trips unrepresentable.

**D-5. The rate is stamped at the moment of recording and never recalculated.** What you paid in your home currency is a historical fact. A total that changes because the ECB moved overnight is a bug, not a feature.

**D-6. `homeAmount` is stored, not derived on read.** It follows from D-5: if the rate is historical, so is the conversion. Deriving it on read would silently re-float every past expense the first time the rate refreshed.

**D-7. The rate's provenance is always visible:** `≈ RM 592 · rate 0.00318, ECB, today`. The source and the age, on the same line as the number. This is the existing provenance rule (`provenance-derived` harness) applied to money.

---

## 4. Splitting

**D-8. Three split modes, and no more.**

| Mode | Means |
|---|---|
| `even` | divided equally between `splitWith` |
| `shares` | by weight — two adults and a child as 2 : 2 : 1 |
| `exact` | you type each person's amount |

**D-9. `even` is the default and `splitWith` defaults to everyone on the trip.** The common case is one tap.

**D-10. Remainders go to the payer.** ₩10,000 between three is 3,334 / 3,333 / 3,333, and the extra won goes to whoever paid. Stated because "divide by three" has an answer and "divide by three fairly" does not; the payer absorbing the rounding is the convention that never leaves anyone owed a fraction.

**D-11. Every split sums to the total, exactly, in minor units.** Arithmetic is integer in the currency's smallest unit — won, yen and rupiah have none, so they are integers already; ringgit and euro are in cents. **No floating-point money anywhere.** This is a test obligation, not a hope (§7).

**D-12. An expense may be split with people who are not on the trip.** A friend met in Busan who paid for dinner is a person with a name and no role. `people` already tolerates this once it is a kind.

---

## 5. Settle up

**D-13. Settle-up is a computed summary, handed off. It is not a ledger and it is not synced.**

This is the decision the plan flagged as the hard one, and it is settled here: **expenses stay private.**

`PRIVATE_KINDS` (`share.js:72`) gains `expenses`. Reasoning:

- "Your copy is yours" is a founding promise. A synced ledger makes one person's edit change another person's numbers, which is exactly what snapshot-and-review exists to prevent.
- A split is agreed between people, not computed for them. The app's job is to make the agreement easy to state, not to enforce it.
- The alternative — syncing expenses — needs conflict resolution, permissions and a server, and the no-server rule yields only where a feature *cannot* exist without one. This one can.

**D-14. The settle-up summary is minimised before it is shown.** Four people with six debts between them settle in at most three payments. The app does that reduction, because doing it by hand is the actual pain.

**D-15. The summary is handed to WhatsApp as plain text:**

```
Seoul → Busan, days 1–4

Ravi → Wei Sze   ₩55,800
Mei  → Wei Sze   ₩59,800

(₩186,400 total · 12 expenses)
```

Aligned, countable, and readable by someone who does not have the app. No link, no branding — the same rule as the gather message.

**D-16. `settled` is a local tick with no outward effect.** Marking a debt settled records that *you* consider it settled. It does not notify, does not sync, and does not claim the other person agrees. The honesty rule again.

---

## 6. The screen

Pocket → Money. One screen, three parts, in this order:

1. **Today's total**, with the home-currency line and the rate's provenance underneath.
2. **The day's expenses**, each showing what, who paid, and how it was split, in that order. `KTX 101 × 3 / You paid · split evenly / ₩179,400`.
3. **Settle up**, in a blush panel, with the minimised debts and the hand-off button.

**D-17. The default view is today, not the whole trip.** A trip total is a thing you look at once; today's spending is a thing you check. A chip switches to `Whole trip`, which is where `spendTotals({ all: true })` and its careful `listedShopping()` reasoning survive unchanged.

**D-18. Adding an expense is two fields and a tap.** Amount and what it was. Payer defaults to you, split defaults to even with everyone, currency defaults to the trip's, date defaults to today. Everything else is behind `More`. An expense you cannot record in ten seconds standing at a counter is an expense that does not get recorded.

**D-19. The Shop screen keeps its own identity inside Pocket.** It is the *planning* list — what to buy, estimates, packed location. It gains one line per ticked item showing the expense it created, and nothing else changes. Two screens, two jobs, one link between them.

---

## 7. Test obligations

1. **Split arithmetic to the minor unit.** ₩10,000 ÷ 3; RM 100 ÷ 7; a 2:2:1 share split of ¥8,888; an exact split that does not sum, which must refuse. Every case asserted on integers.
2. **Settle-up minimisation.** Six debts between four people reduce to at most three payments, and the payments sum to zero.
3. **Multi-currency totals.** Two currencies in one day, each with its own stamped rate, summing correctly in the home currency.
4. **A rate change does not alter a past expense.** Record, change `homeCurrencyRate`, re-read: `homeAmount` is unmoved.
5. **An expense with no amount is refused**, and the total reports the count of priceless ticks rather than absorbing them.
6. **`expenses` does not appear in a share snapshot** — asserted against the published envelope.
7. **Untick removes exactly the expense that tick created**, and no other.
8. **`currency.js` gets its first unit tests**, being one of the four zero-coverage modules named in `test/BASELINE.md`.

---

## 8. Decisions

1. **D-1** `expenses` becomes its own kind.
2. **D-2** Ticking a shopping item bought creates a linked expense; the item stays a plan.
3. **D-3** An expense with no amount does not exist; no fallback to an estimate.
4. **D-4** Every expense carries its own currency and rate.
5. **D-5** The rate is stamped at recording and never recalculated.
6. **D-6** `homeAmount` is stored, not derived on read.
7. **D-7** The rate's source and age are always shown beside the converted figure.
8. **D-8** Three split modes: even, shares, exact.
9. **D-9** Even, with everyone, is the default.
10. **D-10** Remainders go to the payer.
11. **D-11** All money arithmetic is integer, in minor units.
12. **D-12** An expense may involve people who are not on the trip.
13. **D-13** Expenses are private and never travel in a share.
14. **D-14** The settle-up summary is minimised to the fewest payments.
15. **D-15** It hands off to WhatsApp as plain aligned text, with no branding.
16. **D-16** `settled` is a local tick that claims nothing about the other person.
17. **D-17** The Money screen defaults to today; a chip switches to the whole trip.
18. **D-18** Adding an expense is two fields and a tap.
19. **D-19** Shop stays the planning list and gains one line per ticked item.
