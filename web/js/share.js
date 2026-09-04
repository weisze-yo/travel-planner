// Sharing a trip: a copy you are handed, not a document you both live in.
//
// This replaces the live-sync model. The rule now is simpler and much
// easier to hold in your head:
//
//   Everything you change stays on your phone. Always. Online or off.
//
// Sharing does not change that. It publishes a *snapshot* of the parts of
// the trip that are worth agreeing on, and whoever has the link takes a copy
// of it. When the owner or an editor changes something and presses Update,
// a new snapshot goes out; the other side is told there is one, and reviews
// it a change at a time — take this, keep mine — rather than having their
// day rewritten under them.
//
// Three consequences worth stating, because they are the whole design:
//
//   - There is no conflict to resolve. Two people editing the same day are
//     editing two different copies, and the review screen is where they
//     meet. Nothing is ever overwritten without someone pressing Take.
//   - Only three things travel: the itinerary (its stops and its sub
//     routes), the places you have saved around them, and the must-see
//     spots. The shopping list, the packing list and the whole Log never
//     leave the phone and are not in a snapshot at all.
//   - A role is now about publishing, not permission. `can edit` means you
//     can send an update to everyone; `can read` means you receive them.
//     Neither stops you doing whatever you like to your own copy.
//
// This file is pure: codes, expiries, roles, and the diff. What it cannot do
// on its own is authenticate anyone or carry a snapshot between two phones;
// see `publishUpdate` in the store, and item 31.

/** The three things a person can be. Owner is not a level — it is you. */
export const ROLES = {
  owner: {
    id: 'owner',
    label: 'Owner',
    badge: 'OWNER',
    can: 'Sends updates, invites people, and deletes the trip',
  },
  edit: {
    id: 'edit',
    label: 'Can send updates',
    badge: '',
    can: 'Can send their changes to everyone else on the trip',
  },
  read: {
    id: 'read',
    label: 'Receives updates',
    badge: '',
    can: 'Gets updates and can do whatever they like to their own copy',
  },
};

/** How long a link lasts, chosen before it exists so it never needs fixing. */
export const EXPIRIES = [
  { id: '24h', label: '24 hours', hours: 24 },
  { id: '7d', label: '7 days', hours: 24 * 7 },
  { id: 'trip', label: 'Until the trip ends', hours: null },
];

/** The only three kinds of thing a snapshot carries. */
export const SHARED_KINDS = ['days', 'places', 'subRoutes', 'mustSee'];

/** And the four it never does, named so the promise can be checked. */
export const PRIVATE_KINDS = ['shopping', 'prep', 'log', 'outfits'];

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

// ----------------------------------------------------- what an update changes

/**
 * A snapshot against your copy, as a list of decisions.
 *
 * Every entry is one thing you can take or leave, and each carries enough to
 * be judged without opening anything: what it is, what yours says, what
 * theirs says, and which day it is on. Nothing here writes; `applyUpdate` in
 * the store does that, one entry at a time.
 *
 * Matching is by id, because both copies descend from the same snapshot. A
 * stop that exists on neither side's id but has the same name and time on the
 * same day is treated as the same stop — otherwise renaming a market on one
 * phone and retiming it on the other produces two markets.
 */
export function diffSnapshot(mine, theirs) {
  const out = [];
  if (!theirs) return out;

  for (const entry of diffStops(mine, theirs)) out.push(entry);
  for (const entry of diffRows(mine, theirs, 'subRoutes', 'sub route', (r) => r.name)) out.push(entry);
  for (const entry of diffRows(mine, theirs, 'places', 'place', (r) => r.name)) out.push(entry);
  for (const entry of diffRows(mine, theirs, 'mustSee', 'must-see spot', (r) => r.title)) out.push(entry);
  return out;
}

const stopKey = (item, dayNumber) => `${dayNumber}|${String(item.name || '').toLowerCase()}|${item.time || ''}`;

function stopIndex(days) {
  const byID = new Map();
  const byShape = new Map();
  for (const day of days || []) {
    for (const item of day.items || []) {
      if (item.archived) continue;
      byID.set(item.id, { item, dayNumber: day.dayNumber });
      byShape.set(stopKey(item, day.dayNumber), { item, dayNumber: day.dayNumber });
    }
  }
  return { byID, byShape };
}

/** The words a stop changed in, in the order they matter on a day. */
const STOP_FIELDS = [
  { key: 'time', label: 'starts' },
  { key: 'endTime', label: 'ends' },
  { key: 'name', label: 'is called' },
  { key: 'note', label: 'note' },
  { key: 'subtitle', label: 'where it is' },
];

function diffStops(mine, theirs) {
  const ours = stopIndex(mine.days);
  const them = stopIndex(theirs.days);
  const out = [];

  for (const [id, { item, dayNumber }] of them.byID) {
    const match = ours.byID.get(id) || ours.byShape.get(stopKey(item, dayNumber));
    if (!match) {
      out.push({
        id: `stop-add:${id}`, kind: 'stop', verb: 'added', dayNumber,
        title: item.name, mineText: 'not on your copy',
        theirsText: `${item.time || 'no time'}${item.endTime ? ` – ${item.endTime}` : ''}`,
        payload: { dayNumber, item },
      });
      continue;
    }
    const changed = STOP_FIELDS
      .filter((f) => String(match.item[f.key] || '') !== String(item[f.key] || ''))
      .map((f) => f.label);
    if (changed.length) {
      out.push({
        id: `stop-edit:${id}`, kind: 'stop', verb: 'changed', dayNumber,
        title: item.name,
        detail: changed.join(', '),
        mineText: describeStop(match.item),
        theirsText: describeStop(item),
        payload: { dayNumber, item, replaces: match.item.id, wasDay: match.dayNumber },
      });
    }
  }

  for (const [id, { item, dayNumber }] of ours.byID) {
    if (them.byID.has(id) || them.byShape.has(stopKey(item, dayNumber))) continue;
    out.push({
      id: `stop-drop:${id}`, kind: 'stop', verb: 'removed', dayNumber,
      title: item.name,
      mineText: describeStop(item), theirsText: 'not on theirs',
      payload: { dayNumber, removes: id },
    });
  }
  return out;
}

const describeStop = (item) => [
  item.time || 'no time',
  item.endTime ? `– ${item.endTime}` : '',
  item.name,
].filter(Boolean).join(' ');

/** Places, sub routes and shots all diff the same way: by id, on a whole row. */
function diffRows(mine, theirs, kind, noun, nameOf) {
  const ours = new Map((mine[kind] || []).map((r) => [r.id, r]));
  const them = new Map((theirs[kind] || []).map((r) => [r.id, r]));
  const out = [];

  for (const [id, row] of them) {
    const match = ours.get(id);
    if (!match) {
      out.push({
        id: `${kind}-add:${id}`, kind, verb: 'added', noun,
        title: nameOf(row), mineText: `no ${noun} of yours`, theirsText: nameOf(row),
        payload: { kind, row },
      });
      continue;
    }
    if (JSON.stringify(strip(match)) !== JSON.stringify(strip(row))) {
      out.push({
        id: `${kind}-edit:${id}`, kind, verb: 'changed', noun,
        title: nameOf(row),
        mineText: nameOf(match), theirsText: nameOf(row),
        payload: { kind, row, replaces: id },
      });
    }
  }

  for (const [id, row] of ours) {
    if (them.has(id)) continue;
    out.push({
      id: `${kind}-drop:${id}`, kind, verb: 'removed', noun,
      title: nameOf(row), mineText: nameOf(row), theirsText: `not on theirs`,
      payload: { kind, removes: id },
    });
  }
  return out;
}

/**
 * Fields that are yours alone even on a shared row. A shot you have ticked
 * as taken should not read as a difference just because they have not.
 */
const MINE_ALONE = ['captured', 'bought', 'boughtOn', 'paidAmount', 'packed'];
function strip(row) {
  const copy = { ...row };
  for (const key of MINE_ALONE) delete copy[key];
  return copy;
}

/** "3 changes to the itinerary, 1 place" — the line the banner leads with. */
export function summarise(entries) {
  const counts = new Map();
  for (const entry of entries) {
    const noun = entry.kind === 'stop' ? 'stop'
      : entry.kind === 'subRoutes' ? 'sub route'
        : entry.kind === 'places' ? 'place' : 'must-see spot';
    counts.set(noun, (counts.get(noun) || 0) + 1);
  }
  return [...counts].map(([noun, n]) => `${n} ${noun}${n === 1 ? '' : 's'}`).join(' · ');
}
