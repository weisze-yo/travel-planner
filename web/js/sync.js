// Whether your changes are saved, and what to do when they are not.
//
// Three states, and the design's rule is that only the third deserves to be
// loud:
//
//   saving / saved   a hollow ring while a write is in flight, then a solid
//                    green dot and no words. This is most of the time.
//   queued           amber dot and one line: everything you typed is already
//                    on the phone, this is only about the copy in the cloud,
//                    and it clears itself the moment signal returns.
//   stuck            a change older than a day, or a failure that will not
//                    fix itself — signed out, the trip taken away, storage
//                    full. That one gets the strip, because silence there is
//                    dangerous.
//
// The ledger lives in localStorage so "stuck for three days" can be true
// across launches. It records what is outstanding, never the data itself:
// the data is already in the store, and duplicating it here would be a
// second thing to keep in step.

const LEDGER = 'travel-planner:pending';
const listeners = new Set();

let ledger = read();
let inFlight = 0;

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(LEDGER) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

/**
 * Writes the ledger back, merged with whatever is already there.
 *
 * Two tabs of the app are one account, and each holds its own copy of this
 * array in memory. Writing the copy wholesale would let the second tab
 * forget the first tab's outstanding changes, and "everything is saved" is
 * the one thing this file must never say wrongly. So the merge is by key,
 * keeping the older timestamp and the higher try count.
 */
function write() {
  try {
    const onDisk = read();
    const merged = new Map();
    for (const entry of onDisk) merged.set(entry.key, entry);
    for (const entry of ledger) {
      const had = merged.get(entry.key);
      merged.set(entry.key, had
        ? {
          ...entry,
          at: had.at < entry.at ? had.at : entry.at,
          tries: Math.max(had.tries || 0, entry.tries || 0),
          error: entry.error || had.error || '',
        }
        : entry);
    }
    // Anything this tab has just sent is gone from its own copy, so it has
    // to be taken out of the merge too.
    for (const key of [...merged.keys()]) {
      const mine = ledger.some((e) => e.key === key);
      const theirs = onDisk.some((e) => e.key === key);
      if (!mine && theirs && sent.has(key)) merged.delete(key);
    }
    ledger = [...merged.values()].slice(-400);
    localStorage.setItem(LEDGER, JSON.stringify(ledger));
  } catch {
    // Private browsing. The ledger then lives for this session only, which
    // is still better than pretending everything is saved.
  }
}

/** Keys this tab has successfully sent, so a merge does not resurrect them. */
const sent = new Set();

function notify() {
  for (const fn of listeners) fn();
}

/**
 * Re-reads the ledger from disk.
 *
 * Another tab of the same app writes the same key, and `write()` already
 * merges rather than clobbering — but nothing re-read it, so this tab could
 * hold a stale count until its own next write. Cheap enough to call on a
 * storage event or before asking what state we are in.
 */
export function reload() {
  ledger = read();
  notify();
  return ledger.length;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** A short human name for what a row is, for "what would be lost". */
const KIND_NAMES = {
  days: ['stop change', 'stop changes'],
  places: ['place', 'places'],
  subRoutes: ['sub route', 'sub routes'],
  shopping: ['purchase', 'purchases'],
  mustSee: ['must-see shot', 'must-see shots'],
  prep: ['packing change', 'packing changes'],
  log: ['note', 'notes'],
  outfits: ['outfit', 'outfits'],
  trip: ['trip setting', 'trip settings'],
};

export const kindName = (kind, n) => (KIND_NAMES[kind] || ['change', 'changes'])[n === 1 ? 0 : 1];

/**
 * Wraps one write. The row is recorded as outstanding, the write is tried,
 * and it is only forgotten once the server has it — which is what lets the
 * app tell "saved" from "saved on this phone only".
 */
export async function track({ kind, id, label, run }) {
  // One entry per row: ten edits to the same note are one thing to send.
  const key = `${kind}:${id}`;
  const existing = ledger.find((e) => e.key === key);
  if (!existing) {
    ledger.push({ key, kind, id, label, at: new Date().toISOString(), tries: 0, error: '' });
  }
  write();

  inFlight += 1;
  notify();

  try {
    await run();
    ledger = ledger.filter((e) => e.key !== key);
    sent.add(key);
    write();
    return true;
  } catch (error) {
    const entry = ledger.find((e) => e.key === key);
    if (entry) {
      entry.tries += 1;
      entry.error = String(error?.code || error?.message || error).slice(0, 120);
    }
    write();
    return false;
  } finally {
    inFlight -= 1;
    notify();
  }
}

/** Why the cloud is refusing, in words, when the reason will not fix itself. */
const HARD = [
  [/unauthenticated/i, 'Your sign-in expired. The app kept working and kept everything, but it cannot prove who you are, so the cloud is refusing it.'],
  [/not-found/i, 'This trip is no longer on your account — it may have been removed from you.'],
  [/quota|resource-exhausted|storage/i, 'There is no room left in the cloud for this account.'],
  [/invalid-argument|failed-precondition/i, 'The cloud rejected these changes as malformed. That is a bug, not something you did.'],
];

/**
 * Why the cloud is refusing, in words.
 *
 * `permission-denied` is the awkward one: Firestore returns it both when
 * nobody is signed in and when the rules refuse an account it can see. The
 * two need opposite things done about them — sign in, or go and publish the
 * app's rules — so telling someone the wrong one sends them round in
 * circles. Whether anyone is signed in is the thing that separates them, and
 * only the caller knows it.
 */
function hardReason({ signedIn = false } = {}) {
  for (const entry of ledger) {
    const error = entry.error || '';
    if (/permission-denied|insufficient/i.test(error)) {
      return signedIn
        ? 'The cloud can see who you are and is refusing anyway, which means its security '
          + 'rules are not the ones this app needs. In the Firebase console: Firestore '
          + 'Database → Rules, paste firebase/firestore.rules, Publish. Nothing is lost '
          + 'meanwhile — it is all here on the phone.'
        : 'The cloud will not take these until you are signed in. Nothing is lost meanwhile; '
          + 'they are all here on the phone.';
    }
    for (const [pattern, text] of HARD) {
      if (pattern.test(error)) return text;
    }
  }
  return '';
}

const online = () => (typeof navigator === 'undefined' ? true : navigator.onLine !== false);
const DAY = 86400000;

/**
 * What the dot in the trip bar should say, and whether the strip should
 * speak at all.
 */
export function syncState({ stranded = false, configured = true, signedIn = false } = {}) {
  const count = ledger.length;
  const oldest = count ? ledger.reduce((a, b) => (a.at < b.at ? a : b)) : null;
  const ageDays = oldest ? Math.floor((Date.now() - new Date(oldest.at).getTime()) / DAY) : 0;
  const reason = hardReason({ signedIn });

  if (!configured) {
    return { kind: 'local', count: 0, line: '', ageDays: 0, reason: '' };
  }
  if (count && (ageDays >= 1 || reason || stranded)) {
    return {
      kind: 'stuck',
      count,
      ageDays,
      reason: reason || (stranded
        ? 'This browser cannot reach the cloud at all. Everything is safe here, but it has never left the phone.'
        : 'Every attempt so far has been refused.'),
      line: ageDays >= 1
        ? `${count} change${count === 1 ? '' : 's'} ${count === 1 ? 'has' : 'have'} been stuck for ${ageDays} day${ageDays === 1 ? '' : 's'}`
        : `${count} change${count === 1 ? '' : 's'} cannot be sent`,
      oldest: oldest?.at || null,
    };
  }
  if (count) {
    return {
      kind: online() ? 'saving' : 'queued',
      count,
      ageDays,
      reason: '',
      line: online()
        ? 'Saving…'
        : `${count} change${count === 1 ? '' : 's'} waiting for signal`,
      oldest: oldest?.at || null,
    };
  }
  return {
    kind: inFlight ? 'saving' : 'saved',
    count: 0,
    ageDays: 0,
    reason: '',
    line: inFlight ? 'Saving…' : '',
  };
}

/** What is outstanding, grouped, for the "what would be lost" list. */
export function pendingSummary() {
  const groups = [];
  for (const entry of ledger) {
    let group = groups.find((g) => g.kind === entry.kind);
    if (!group) {
      group = { kind: entry.kind, count: 0, from: entry.at, to: entry.at, labels: [] };
      groups.push(group);
    }
    group.count += 1;
    if (entry.at < group.from) group.from = entry.at;
    if (entry.at > group.to) group.to = entry.at;
    if (entry.label && group.labels.length < 3) group.labels.push(entry.label);
  }
  return groups.sort((a, b) => b.count - a.count);
}

export const pendingCount = () => ledger.length;
export const pendingTries = () => ledger.reduce((n, e) => n + e.tries, 0);
export const pendingOldest = () => (ledger.length
  ? ledger.reduce((a, b) => (a.at < b.at ? a : b)).at
  : null);

/** Gives up on the outstanding changes. Only ever offered, never taken. */
export function discardPending() {
  for (const entry of ledger) sent.add(entry.key);
  ledger = [];
  try {
    localStorage.setItem(LEDGER, '[]');
  } catch {
    // Nothing to do; the in-memory ledger is already empty.
  }
  notify();
}

/** Marks everything outstanding as sent, once a retry has actually worked. */
export function clearPending() {
  discardPending();
}
