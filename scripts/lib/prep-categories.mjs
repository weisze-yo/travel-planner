// The prep categories, and which of the 85 lines belongs to each.
//
// Approved from handoff/trip12/PREP_CATEGORIES_PROPOSAL.md. That file is the
// human-readable record and this is the machine-readable one; they were written
// from the same table, so a change to one without the other is a drift worth
// catching — buildSnapshot asserts every line matches exactly one rule and that
// no rule goes unused.
//
// Ten categories rather than one flat list because the 85 lines are two
// different KINDS of thing. Documents through Day bag are a packing list:
// things to carry. Don't wear / Don't do / Don't expect are advice — colours
// that vanish against a backdrop, behaviour the operator forbids, expectations
// that are simply wrong. Filing "Crouching down for a fox-level photo —
// forbidden, and the reason people get bitten" under Documents would read worse
// than leaving it where it was.
//
// `store.prepGroups()` builds its groups from the items themselves and only
// appends an ordered category that has none, so this needs no UI change: the
// trip's `prepCategories` sets the order, and each record carries its own
// `category` and `categoryOrder`.

export const PREP_CATEGORY_ORDER = [
  // what to bring
  'Documents', 'Money', 'Outfits', 'Electronics', 'Photo kit', 'Health & comfort', 'Day bag',
  // and what not to
  "Don't wear", "Don't do", "Don't expect",
];

/**
 * Matched against the line's own text — a distinctive fragment, not a fuzzy
 * guess. Order is irrelevant: every fragment must match exactly one line, and
 * every line exactly one fragment.
 */
export const PREP_ASSIGNMENTS = [
  // ---- Documents ---------------------------------------------------------
  ['Visit Japan Web QR', 'Documents'],
  ['Any medication in hand baggage', 'Documents'],
  ['Passport IN HAND for Shisui', 'Documents'],
  ['Every tax-free receipt', 'Documents'],
  ['Passport out for the shops', 'Documents'],

  // ---- Money -------------------------------------------------------------
  // Its own column because several venues on this trip take no card at all:
  // "did I draw enough yen, and in what coins" is a question in its own right.
  ['¥ coins for the Godaido', 'Money'],
  ['¥1,500 cash per person for Zao', 'Money'],
  ['¥250 cash for Nogawa', 'Money'],
  ['Cash for Ouchi-juku', 'Money'],
  ['¥500 coins for Toshogu', 'Money'],
  ["Cash for Edo Wonderland's street", 'Money'],
  ['¥ cash from the money changer', 'Money'],
  ['¥600 for the Hitachi Seaside Train', 'Money'],
  ['Small coins for Kashiya Yokocho', 'Money'],
  ['¥ cash — several Tsukiji stalls', 'Money'],

  // ---- Outfits -----------------------------------------------------------
  ['A light long-sleeve for cabin aircon', 'Outfits'],
  ['Sunglasses', 'Outfits'],
  ['Long trousers and closed shoes for the fox', 'Outfits'],
  ['Compression socks', 'Outfits'],
  ['A cap for the unshaded Honmaru', 'Outfits'],
  ['A light long-sleeve or packable shell for Kegon', 'Outfits'],
  ['Comfortable shoes — gravel at Toshogu', 'Outfits'],
  ['A hat with a chin strap', 'Outfits'],
  ['Closed shoes you do not mind getting wet', 'Outfits'],
  ['A light windproof layer', 'Outfits'],
  ['Your yukata size for the hotel', 'Outfits'],

  // ---- Electronics -------------------------------------------------------
  ['Power banks in the cabin', 'Electronics'],

  // ---- Photo kit ---------------------------------------------------------
  // Deliberately NOT merged into A9's "Photo missions": that names the shots to
  // take, these are the equipment that makes them possible.
  ['A lens cloth for cruise-deck spray', 'Photo kit'],
  ['The banner and a spare pair of hands', 'Photo kit'],
  ['Fill flash or a reflector for the 09:35', 'Photo kit'],
  ['Fill flash for the back-lit keep', 'Photo kit'],
  ['A lens cloth: the falls throw spray', 'Photo kit'],

  // ---- Health & comfort --------------------------------------------------
  ['A hand towel', 'Health & comfort'],
  ['Hand sanitiser and wet wipes', 'Health & comfort'],
  ['Insect repellent', 'Health & comfort'],
  ['Water, filled before the castle', 'Health & comfort'],
  ['A small towel — you will be sweating', 'Health & comfort'],
  ['Sunscreen', 'Health & comfort'],
  ['A cooling towel or fan', 'Health & comfort'],
  ['Wet wipes for Tsukiji', 'Health & comfort'],
  ['Refillable bottle: fill it airside', 'Health & comfort'],
  ['A refillable bottle: two long coach legs', 'Health & comfort'],

  // ---- Day bag -----------------------------------------------------------
  ['The ekiben you bought at Tokyo Station', 'Day bag'],
  ['A bag that CLOSES', 'Day bag'],
  ['Something to buy natto with', 'Day bag'],
  ['A foldable bag for outlet purchases', 'Day bag'],
  ['A small cross-body bag', 'Day bag'],
  ["ROYCE' nama chocolate", 'Day bag'],
  ['A foldable bag for the 4F landside', 'Day bag'],

  // ---- Don't wear --------------------------------------------------------
  ['Heels or open-toe shoes', "Don't wear"],
  ['A heavy jacket', "Don't wear"],
  ['Anything pale you would mind smelling of fish', "Don't wear"],
  ['Green, olive, beige or brown at Ginzan', "Don't wear"],
  ['Open-toe shoes in the fox enclosure', "Don't wear"],
  ['Red or maroon at Tsuruga Castle', "Don't wear"],
  ['Dark green: you disappear into the Honmaru', "Don't wear"],
  ['Heels or smooth soles for the Miharashidai', "Don't wear"],
  ['White at Toshogu', "Don't wear"],
  ['Black at Toshogu', "Don't wear"],
  ['A heavy coat: the afternoon reaches 29', "Don't wear"],
  ['GREEN at Hitachi', "Don't wear"],
  ['Black or charcoal at Kawagoe', "Don't wear"],
  ['An unstrapped wide-brim hat', "Don't wear"],
  ['Heels at Shibuya Crossing', "Don't wear"],
  ['Lace-up boots you have to unpick', "Don't wear"],
  ['Orange or red at Tokyo Tower', "Don't wear"],
  ['Open-toe or fabric shoes at Tsukiji', "Don't wear"],
  ['Dangling lanyards', "Don't wear"],

  // ---- Don't do ----------------------------------------------------------
  ['Buying raw seafood to carry', "Don't do"],
  ['Crouching down for a fox-level photo', "Don't do"],
  ['Anything you would mind smelling of fox', "Don't do"],
  ['Awamanju as a souvenir', "Don't do"],
  ['Leaving the yukata to chance', "Don't do"],
  ['Power banks in checked baggage', "Don't do"],
  ['A large backpack in the market lanes', "Don't do"],
  ['Carrying raw fish onto the coach', "Don't do"],
  ['Framing the Sangedatsumon gate', "Don't do"],
  ['Doing your shopping airside', "Don't do"],
  ['More than 1 litre of alcohol', "Don't do"],
  ['Chilled sweets in checked baggage', "Don't do"],

  // ---- Don't expect ------------------------------------------------------
  ['Planning on the Akechidaira Ropeway', "Don't expect"],
  ['Assuming Tsukuba has an evening', "Don't expect"],
  ['Expecting nemophila or red kochia', "Don't expect"],
  ['Counting on a meal after landing', "Don't expect"],
  ['Counting on breakfast if you skip', "Don't expect"],
];
