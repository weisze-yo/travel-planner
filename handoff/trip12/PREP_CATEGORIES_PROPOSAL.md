# Proposal — splitting the 85 prep lines

**Nothing here is wired into the importer.** This is the assignment for review; on your word it
becomes `Trip.prepCategories` plus a `category` on each of the 85 records.

## The finding that shapes the proposal

The 85 lines are **two different kinds of thing**, and that is why the current two categories feel
overcrowded rather than merely coarse.

- **`Day bag` (49)** really is a packing list, but a mixed one: documents, cash for cash-only
  venues, clothing, photo kit, toiletries and actual bag contents all in one column.
- **`Leave behind` (36)** is **not a packing list at all.** Only a handful name an object. The rest
  are colours not to wear, behaviours that are forbidden, and expectations that are simply wrong —
  *"Crouching down for a fox-level photo — forbidden, and the reason people get bitten"*,
  *"Expecting nemophila or red kochia"*, *"Planning on the Akechidaira Ropeway — shut for
  renovation until about September 2027"*.

Filing those under Documents or Electronics would be worse than leaving them where they are. So the
proposal splits along **both** axes: a *bring* axis that is a real packing list, and an *avoid* axis
that stays advice.

| | categories | lines |
|---|---|--:|
| **Bring** | Documents · Money · Outfits · Electronics · Photo kit · Health & comfort · Day bag | 49 |
| **Avoid** | Don't wear · Don't do · Don't expect | 36 |

`store.prepGroups()` builds its groups from the items themselves and only appends an ordered
category that has none, so this needs **no UI change** — only the trip's `prepCategories` and the 85
`category` values.

### Two judgement calls worth challenging

1. **`Money` as its own category.** Ten lines are cash for specific cash-only venues — Zao Fox
   Village (¥1,500pp), Nogawa Toufuya (¥250), Toshogu goshuin (¥500), the Hitachi Seaside Train
   (¥600). On a trip where several venues take no card, "did I draw enough yen, and in what
   denominations" is a question worth its own column rather than being buried in a day bag.
2. **`Photo kit` is separate from `Photo missions`.** A9's `Photo missions` names the *shots to
   take*; these five lines are the *equipment* that makes them possible (fill flash, reflector, lens
   cloth, the banner). Merging them would mix a task list with a packing list. If you would rather
   have one column, say so and they fold into `Photo missions`.

---

## Documents  ·  5

- Visit Japan Web QR — screenshot it, do not rely on signal in the arrivals hall  <sub>(was: Day bag)</sub>
- Any medication in hand baggage, in its original box  <sub>(was: Day bag)</sub>
- Passport IN HAND for Shisui — tax-free is granted shop by shop at the till, not at a central desk  <sub>(was: Day bag)</sub>
- Every tax-free receipt, kept per store  <sub>(was: Day bag)</sub>
- Passport out for the shops: exemption is still granted at the till in September 2026  <sub>(was: Day bag)</sub>

## Money  ·  10

- ¥ cash from the money changer — the hotel konbini shuts at 23:00  <sub>(was: Day bag)</sub>
- ¥ coins for the Godaido approach and the Zuiganji goshuin (¥500)  <sub>(was: Day bag)</sub>
- ¥1,500 cash per person for Zao Fox Village — cash only  <sub>(was: Day bag)</sub>
- ¥250 cash for Nogawa Toufuya at Ginzan — also cash only  <sub>(was: Day bag)</sub>
- Cash for Ouchi-juku: Yamagataya is cash only, and several tills close before 16:00  <sub>(was: Day bag)</sub>
- ¥500 coins for Toshogu goshuin, pre-written slips at each office  <sub>(was: Day bag)</sub>
- Cash for Edo Wonderland's street counters  <sub>(was: Day bag)</sub>
- ¥600 for the Hitachi Seaside Train — you cannot walk 215 ha in an hour  <sub>(was: Day bag)</sub>
- Small coins for Kashiya Yokocho's penny-sweet shops  <sub>(was: Day bag)</sub>
- ¥ cash — several Tsukiji stalls are cash-only  <sub>(was: Day bag)</sub>

## Outfits  ·  11

- A light long-sleeve for cabin aircon on a 7h15 leg  <sub>(was: Day bag)</sub>
- Compression socks — two flights, 8h45 of seat time  <sub>(was: Day bag)</sub>
- A light windproof layer for the 16:00 open cruise deck  <sub>(was: Day bag)</sub>
- Sunglasses — 49° sun off water at the fish market  <sub>(was: Day bag)</sub>
- Long trousers and closed shoes for the fox enclosure  <sub>(was: Day bag)</sub>
- A cap for the unshaded Honmaru lawn and Ouchi-juku's gravel street  <sub>(was: Day bag)</sub>
- Your yukata size for the hotel — tell them in advance, not at 18:20  <sub>(was: Day bag)</sub>
- A light long-sleeve or packable shell for Kegon — the one genuinely cool hour of the week  <sub>(was: Day bag)</sub>
- Comfortable shoes — gravel at Toshogu, then 49.5 ha at Edo Wonderland  <sub>(was: Day bag)</sub>
- A hat with a chin strap — the Hitachi coast will take a brimmed hat off your head  <sub>(was: Day bag)</sub>
- Closed shoes you do not mind getting wet and fishy  <sub>(was: Day bag)</sub>

## Electronics  ·  1

- Power banks in the cabin — maximum two, each under 20,000 mAh  <sub>(was: Day bag)</sub>

## Photo kit  ·  5

- A lens cloth for cruise-deck spray  <sub>(was: Day bag)</sub>
- The banner and a spare pair of hands for its corners — the bridge catches a cross-breeze  <sub>(was: Day bag)</sub>
- Fill flash or a reflector for the 09:35 group shot  <sub>(was: Day bag)</sub>
- Fill flash for the back-lit keep  <sub>(was: Day bag)</sub>
- A lens cloth: the falls throw spray 150 m  <sub>(was: Day bag)</sub>

## Health & comfort  ·  10

- Refillable bottle: fill it airside, the coach ride is long  <sub>(was: Day bag)</sub>
- A hand towel: many Japanese public toilets have no dryer  <sub>(was: Day bag)</sub>
- Hand sanitiser and wet wipes for after the foxes  <sub>(was: Day bag)</sub>
- Insect repellent — Goshikinuma still has mosquitoes and horseflies at 820 m in September  <sub>(was: Day bag)</sub>
- Water, filled before the castle: no shade and a 50° sun  <sub>(was: Day bag)</sub>
- A small towel — you will be sweating right before the main group photo  <sub>(was: Day bag)</sub>
- Sunscreen: 48° sun, no shade, an hour on an open hill  <sub>(was: Day bag)</sub>
- A cooling towel or fan for Kawagoe's asphalt at 30–31°C  <sub>(was: Day bag)</sub>
- A refillable bottle: two long coach legs today  <sub>(was: Day bag)</sub>
- Wet wipes for Tsukiji  <sub>(was: Day bag)</sub>

## Day bag  ·  7

- The ekiben you bought at Tokyo Station, for the Shinkansen  <sub>(was: Day bag)</sub>
- A bag that CLOSES: foxes will nose into an open tote  <sub>(was: Day bag)</sub>
- Something to buy natto with at tomorrow's breakfast in Ibaraki  <sub>(was: Day bag)</sub>
- A foldable bag for outlet purchases, and keep each store's receipt separate to clear ¥5,000 per shop  <sub>(was: Day bag)</sub>
- A small cross-body bag, not a backpack, for the market lanes  <sub>(was: Day bag)</sub>
- ROYCE' nama chocolate in HAND baggage with its ice pack — it is refrigerated and must not go in the hold  <sub>(was: Day bag)</sub>
- A foldable bag for the 4F landside omiyage run, which is far better stocked than airside  <sub>(was: Day bag)</sub>

## Don't wear  ·  19

- Lace-up boots you have to unpick at security twice  <sub>(was: Leave behind)</sub>
- Heels or open-toe shoes — Godaido's lattice bridges  <sub>(was: Leave behind)</sub>
- A heavy jacket: it is 29°C by early afternoon  <sub>(was: Leave behind)</sub>
- Anything pale you would mind smelling of fish at the market  <sub>(was: Leave behind)</sub>
- Dangling lanyards, camera straps, bag charms, drawstrings or ribbons at Fox Village — the rule is enforced and the foxes grab  <sub>(was: Leave behind)</sub>
- Green, olive, beige or brown at Ginzan: you vanish into September foliage  <sub>(was: Leave behind)</sub>
- Open-toe shoes in the fox enclosure  <sub>(was: Leave behind)</sub>
- Red or maroon at Tsuruga Castle — it fights the red akagawara roof  <sub>(was: Leave behind)</sub>
- Dark green: you disappear into the Honmaru lawn  <sub>(was: Leave behind)</sub>
- Heels or smooth soles for the Miharashidai steps  <sub>(was: Leave behind)</sub>
- White at Toshogu — it blows out against gold in the sunlit gaps  <sub>(was: Leave behind)</sub>
- Black at Toshogu — it dies in the cedar shade  <sub>(was: Leave behind)</sub>
- A heavy coat: the afternoon reaches 29°C down at Tsukuba  <sub>(was: Leave behind)</sub>
- GREEN at Hitachi — you become kochia  <sub>(was: Leave behind)</sub>
- Black or charcoal at Kawagoe: you disappear into the black-plastered walls  <sub>(was: Leave behind)</sub>
- An unstrapped wide-brim hat on the coast  <sub>(was: Leave behind)</sub>
- Heels at Shibuya Crossing  <sub>(was: Leave behind)</sub>
- Orange or red at Tokyo Tower — it fights the tower in every frame  <sub>(was: Leave behind)</sub>
- Open-toe or fabric shoes at Tsukiji  <sub>(was: Leave behind)</sub>

## Don't do  ·  12

- Power banks in checked baggage — cabin only, maximum two, each under 20,000 mAh  <sub>(was: Leave behind)</sub>
- Buying raw seafood to carry — eat it on the spot  <sub>(was: Leave behind)</sub>
- Crouching down for a fox-level photo — forbidden, and the reason people get bitten  <sub>(was: Leave behind)</sub>
- Anything you would mind smelling of fox for the rest of the trip  <sub>(was: Leave behind)</sub>
- Awamanju as a souvenir — two-day shelf life, eat it here  <sub>(was: Leave behind)</sub>
- Leaving the yukata to chance: they are collected from a lobby rack, not found in the room  <sub>(was: Leave behind)</sub>
- A large backpack in the market lanes  <sub>(was: Leave behind)</sub>
- Carrying raw fish onto the coach  <sub>(was: Leave behind)</sub>
- Framing the Sangedatsumon gate at Zojoji — it is inside a restoration shed until around 2032; frame the Daiden instead  <sub>(was: Leave behind)</sub>
- Doing your shopping airside — clear security by about 09:45 and buy on 4F landside first  <sub>(was: Leave behind)</sub>
- More than 1 litre of alcohol per adult: that is the Malaysian customs allowance  <sub>(was: Leave behind)</sub>
- Chilled sweets in checked baggage  <sub>(was: Leave behind)</sub>

## Don't expect  ·  5

- Counting on a meal after landing — the terminal restaurants are shut by 22:00  <sub>(was: Leave behind)</sub>
- Planning on the Akechidaira Ropeway — shut for renovation until about September 2027  <sub>(was: Leave behind)</sub>
- Assuming Tsukuba has an evening: the mall shuts at 20:00 and the hotel has no shop  <sub>(was: Leave behind)</sub>
- Expecting nemophila or red kochia — the app's own summary is wrong; nemophila is an April flower and the kochia turns red in mid-October  <sub>(was: Leave behind)</sub>
- Counting on breakfast if you skip the 06:30 sitting — nothing else is open  <sub>(was: Leave behind)</sub>

