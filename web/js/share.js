// Sharing a trip: the link, the roles, and what changed since you looked.
//
// The rule the whole thing hangs on is one sentence: the plan is ours, what
// I've done about it is mine. Everything here serves that split.
//
//   syncs, last edit wins   stops, times, order, places, Nearby, Must-see,
//                           and who is on the trip.
//   copied once             the shopping list, at the moment sharing is
//                           turned on. After that both lists live their own
//                           lives, and the owner can only ever add to yours.
//   never leaves the phone  bought, packed, the whole Log, the photos.
//                           Packing is not in the share at all.
//
// There is no resolver and no locking. Two people on the same day are
// resolved by catching up: the day you open tells you what moved and who
// moved it, and each row it names keeps a mark until you have seen it.
//
// This file is deliberately pure — codes, expiries, roles and the shape of
// the change feed — so it can be reasoned about without a backend. What it
// cannot do on its own is authenticate anyone; see `signIn` in the store.

/** The three things a person can be. Owner is not a level — it is you. */
export const ROLES = {
  owner: { id: 'owner', label: 'Owner', badge: 'OWNER', can: 'everything' },
  edit: { id: 'edit', label: 'Can edit', badge: '', can: 'Add stops, change times, tick the shopping list, write notes' },
  read: { id: 'read', label: 'Can read', badge: '', can: 'See everything, change nothing' },
};

/** How long a link lasts, chosen before it exists so it never needs fixing. */
export const EXPIRIES = [
  { id: '24h', label: '24 hours', hours: 24 },
  { id: '7d', label: '7 days', hours: 24 * 7 },
  { id: 'trip', label: 'Until the trip ends', hours: null },
];

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * A link code in two groups of four. No I, L, O, 0 or 1, because this gets
 * read aloud down a phone at least once per trip.
 */
export function linkCode(random = Math.random) {
  const pick = () => ALPHABET[Math.floor(random() * ALPHABET.length)];
  const group = () => Array.from({ length: 4 }, pick).join('');
  return `${group()}-${group()}`;
}

/** Where a code points. Relative, so it works on whatever host this is on. */
export function linkURL(code, origin = '') {
  return `${origin || 'planner.app'}/j/${code}`;
}

export function expiryAt(expiryID, from = new Date(), tripEndsAt = null) {
  const found = EXPIRIES.find((e) => e.id === expiryID) || EXPIRIES[1];
  if (found.hours == null) return tripEndsAt || null;
  return new Date(from.getTime() + found.hours * 3600_000).toISOString();
}

/**
 * Why a link is not working, in the words the dead-end screen uses. A dead
 * end with no name on it is the worst version of this, so every answer here
 * still knows which trip it was.
 */
export function linkState(link, { now = new Date(), joined = false } = {}) {
  if (joined) return 'joined';
  if (!link || !link.code) return 'missing';
  if (!link.live) return 'off';
  if (link.expiresAt && new Date(link.expiresAt) <= now) return 'expired';
  return 'live';
}

/** "Ana's" but "your", because "You's" is how a screen loses your trust. */
const possessive = (who) => (who === 'You' ? 'Your' : `${who}'s`);

export const LINK_DEAD_LINES = {
  expired: (who, on) => `${possessive(who)} invite stopped working${on ? ` on ${on}` : ''}. `
    + 'Nothing is wrong with your phone and the trip is still there — the link just ran out.',
  off: (who) => (who === 'You'
    ? 'This link is switched off.'
    : `${who} switched this link off.`),
  missing: () => 'This link does not point at a trip any more.',
};

/** The initial that stands in for a face, so 中文 names fit too. */
export function initialFor(name) {
  const clean = String(name || '').trim();
  if (!clean) return '?';
  // A Han or kana name has no useful "first letter", so take the surname
  // character instead of transliterating it.
  const first = [...clean][0];
  return /[　-鿿가-힯]/.test(first) ? first : first.toUpperCase();
}

/** Everyone but you, named, for the sentences that promise them nothing. */
export function otherNames(people, meID) {
  return people.filter((p) => p.id !== meID).map((p) => p.name);
}

/** "Ana, Ravi or 陳美玲" — the Log's promise names them rather than counts them. */
export function nameList(names, joiner = 'or') {
  if (!names.length) return '';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} ${joiner} ${names[names.length - 1]}`;
}

// ------------------------------------------------------ what moved, and who

/**
 * One line of the change feed. `was` is what it used to say, because "moved
 * Nishi Market to 13:00" is only checkable next to "was 13:30 – 15:45".
 */
export function change({ who, verb, what, dayNumber, itemID = null, was = '', at = new Date() }) {
  return {
    id: `c${Math.random().toString(36).slice(2, 9)}`,
    at: at instanceof Date ? at.toISOString() : at,
    who,
    verb,
    what,
    dayNumber,
    itemID,
    was,
  };
}

/** "moved Nishi Market to 13:00, back by 15:30" */
export function changeLine(entry) {
  return `${entry.verb} ${entry.what}`.trim();
}

/**
 * What a day has to tell you when you open it: the changes made by other
 * people since you last looked, newest first, and never your own.
 */
export function unseenChanges(changes, { dayNumber, since, meID }) {
  const from = since ? new Date(since).getTime() : 0;
  return (changes || [])
    .filter((c) => c.dayNumber === dayNumber)
    .filter((c) => c.who !== meID)
    .filter((c) => new Date(c.at).getTime() > from)
    .sort((a, b) => new Date(b.at) - new Date(a.at));
}

/**
 * Which shopping rows the guest has not been sent. Only ever adds: nothing
 * the guest crossed off is taken off their list, so this is a set of ids the
 * owner has never sent, not a diff of two lists.
 */
export function unsentItems(shopping, sentIDs = []) {
  const sent = new Set(sentIDs);
  return (shopping || []).filter((row) => !sent.has(row.id));
}
