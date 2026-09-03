// One source of truth for the trip. Screens read derived values off it and
// call mutations; every mutation updates memory, writes through to the
// backend, and notifies subscribers to re-render.

import * as seed from './data.js';
import { createBackend, isConfigured, readActiveTripID, writeActiveTripID, KINDS } from './persist.js';
import { prepare, storedLength } from './photos.js';
import { fetchForecast, forecastCoverage, fetchRate, geocode, online, parseMapLink, placeDetails } from './net.js';
import { clock, duration, money, numeric, parseClock, parseDuration, uid, reorder, dateStamp } from './util.js';

const listeners = new Set();

export const state = {
  ready: false,
  mode: 'local',
  stranded: false,
  /** Null until a trip is chosen — the tabs stay out of reach until then. */
  tripID: null,
  trips: [],
  trip: null,
  days: [],
  places: [],
  subRoutes: [],
  shopping: [],
  mustSee: [],
  prep: [],
  log: [],
  outfits: [],

  // Screen-local UI that should survive navigation.
  selectedDay: 3,
  /** Which of the day's loops the loop screen and Nearby are working on. */
  loopID: null,
  editingPlan: false,
  nearbySort: 'travelTime',
  nearbyCategory: 'all',
  shopDay: 'all',
  shopPlace: 'all',
  spendGroupBy: 'category',
  /** The day the spend report is filtered to, or null for the whole trip. */
  spendDay: null,
  /** The last deletion, for the six seconds it can be taken back. */
  undo: null,
};

let backend = null;
let unsubscribe = null;

function stopListening() {
  if (unsubscribe) unsubscribe();
  unsubscribe = null;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn();
}

// ------------------------------------------------------------------ lifecycle

/**
 * Opens one trip. Called on launch for whichever trip was last open, and again
 * whenever another is chosen from the home screen.
 */
export async function boot(tripID = readActiveTripID() || seed.TRIP_ID) {
  stopListening();
  state.tripID = tripID;

  backend = await createBackend(tripID);
  state.mode = backend.mode;
  // Configured but running on localStorage means writes are stranded in this
  // browser — a different situation from being merely offline, where Firestore
  // queues them and syncs later.
  state.stranded = backend.mode === 'local' && isConfigured();

  let snapshot = await backend.loadAll();
  if (!snapshot || !snapshot.trip) {
    // Only the very first launch gets the demo trip; a trip created by hand
    // is seeded empty by createTrip.
    snapshot = tripID === seed.TRIP_ID ? freshSnapshot() : emptySnapshot(tripID);
    await backend.seed(snapshot);
  }
  apply(snapshot);
  // Order matters: notes take their new shape, places then re-anchor them and
  // everything else, and the windows have to be right before the loops read
  // their budgets off them.
  unifyNotes();
  await unifyPlaces();
  unifyWindows();
  unifyLoops();
  await refreshTrips();

  state.selectedDay = state.trip?.currentDay || 3;
  state.ready = true;

  // A forecast is worth having but never worth blocking the app on.
  refreshWeather().catch(() => {});

  unsubscribe = backend.onRemoteChange((kind, value) => {
    if (kind === 'trip') state.trip = value;
    else state[kind] = value;
    sortAll();
    notify();
  });

  notify();
  return backend;
}

function freshSnapshot() {
  return JSON.parse(JSON.stringify({
    trip: seed.TRIP,
    days: seed.DAYS,
    places: seed.PLACES,
    subRoutes: seed.SUB_ROUTES,
    shopping: seed.SHOPPING,
    mustSee: seed.MUST_SEE,
    prep: seed.PREP,
    log: seed.LOG,
    outfits: [],
  }));
}

/**
 * "Everything is a place." A stop on the itinerary is a *visit* to a place,
 * and a nearby candidate is a place you have not scheduled — the same record
 * either way, so the same screen, the same tabs and the same creation form
 * work for both.
 *
 * This brings older trips up to that shape once: every stop gets a place
 * record, places anchored to a stop id are re-anchored to that stop's place,
 * and shopping items keyed by a typed name are matched to the place they name.
 * It is idempotent, so it costs nothing on a trip that is already converted.
 */
async function unifyPlaces() {
  const byName = new Map(state.places.map((p) => [p.name.toLowerCase(), p]));
  const itemToPlace = new Map();
  let changed = false;

  for (const d of state.days) {
    let dayTouched = false;
    for (const item of d.items || []) {
      if (item.isSubRouteSummary) continue;

      if (item.placeID && state.places.some((p) => p.id === item.placeID)) {
        itemToPlace.set(item.id, item.placeID);
        continue;
      }

      // Reuse a place of the same name before making another.
      const existing = byName.get(item.name.toLowerCase());
      const record = existing || {
        id: uid('place-'),
        anchorPlaceID: null,
        name: item.name,
        category: 'sight',
        priceTier: '—',
        stayMinutes: 45,
        legs: [],
        note: item.subtitle || '',
        isUserAdded: false,
        latitude: item.latitude ?? null,
        longitude: item.longitude ?? null,
        essentials: item.essentials || [],
        isStop: true,
      };

      if (!existing) {
        byName.set(record.name.toLowerCase(), record);
        put('places', record);
      }
      item.placeID = record.id;
      itemToPlace.set(item.id, record.id);
      dayTouched = true;
    }
    if (dayTouched) {
      writeDay(d);
      changed = true;
    }
  }

  // Places that hung off a stop id now hang off that stop's place.
  for (const place of state.places) {
    const moved = itemToPlace.get(place.anchorPlaceID);
    if (moved && moved !== place.anchorPlaceID) {
      place.anchorPlaceID = moved;
      put('places', place);
      changed = true;
    }
  }

  // Sub routes anchor the same way.
  for (const route of state.subRoutes) {
    const moved = itemToPlace.get(route.anchorPlanItemID);
    if (moved && route.anchorPlaceID !== moved) {
      route.anchorPlaceID = moved;
      put('subRoutes', route);
      changed = true;
    }
  }

  // Shopping items carry the place they belong to, not just its name — so
  // renaming a stop no longer orphans them.
  for (const item of state.shopping) {
    if (item.placeID) continue;
    const hit = byName.get((item.placeLabel || '').toLowerCase());
    if (hit) {
      item.placeID = hit.id;
      put('shopping', item);
      changed = true;
    }
  }

  // Shots too.
  for (const shot of state.mustSee) {
    const moved = itemToPlace.get(shot.placeID);
    if (moved && moved !== shot.placeID) {
      shot.placeID = moved;
      put('mustSee', shot);
      changed = true;
    }
  }

  // And notes, item 04. A note written before this round was filed under the
  // stop's id; the stop's place now owns it, and a note whose id points at
  // nothing at all is matched to the place it names.
  for (const note of state.log) {
    const moved = itemToPlace.get(note.placeID);
    const orphaned = note.placeID && !state.places.some((pl) => pl.id === note.placeID);
    const next = moved || ((orphaned || !note.placeID)
      ? byName.get(String(note.placeLabel || '').toLowerCase())?.id
      : null);
    if (next && next !== note.placeID) {
      note.placeID = next;
      put('log', note);
      changed = true;
    }
  }

  if (changed) sortAll();
}

/**
 * A stop used to carry two strings that could disagree — "13:30 – 15:45"
 * and "2h15" — then, for one round, a start and a length. It now carries a
 * start and an end, both of them the traveller's to set, and the length is
 * derived. This reads whichever of the three shapes it finds, once, and
 * leaves a stop that already has `endTime` alone.
 */
function unifyWindows() {
  for (const d of state.days) {
    let touched = false;
    for (const item of d.items || []) {
      if (item.endTime !== undefined) continue;

      let end = null;
      const ends = String(item.windowLabel || '').split(/[–—-]/);
      if (ends.length === 2) {
        const to = parseClock(ends[1]);
        if (to != null) end = to;
      }
      if (end == null) {
        const start = parseClock(item.time);
        const minutes = item.durationMinutes ?? parseDuration(item.durationLabel);
        if (start != null && minutes) end = (start + minutes) % 1440;
      }

      item.endTime = end == null ? '' : clock(end);
      item.windowLabel = '';
      delete item.durationMinutes;
      touched = true;
    }
    if (touched) writeDay(d);
  }
}

/**
 * Free time became a lane rather than a row on the itinerary, so the rows
 * that used to stand for a sub route are taken off the day — the sub route
 * record is the only copy now, and the Plan draws it in the gap its window
 * falls into. Idempotent: a day with no such rows is left alone.
 */
function unifyLoops() {
  for (const route of state.subRoutes) {
    if (!route.name) {
      route.name = 'Free time';
      put('subRoutes', route);
    }
    // A loop that never had its own times takes them off the stop it hung on.
    if (route.departMinutes == null || route.returnByMinutes == null) {
      route.departMinutes = loopStart(route);
      route.returnByMinutes = loopDeadline(route);
      put('subRoutes', route);
    }
  }

  for (const d of state.days) {
    const kept = (d.items || []).filter((i) => !i.isSubRouteSummary);
    if (kept.length !== (d.items || []).length) {
      d.items = kept;
      writeDay(d);
    }
  }
}

/**
 * Item 04's migration. A note used to be the day's single entry, keyed
 * `day-3` and carrying its own copies of the day label, the stop count and a
 * row of chips. It is now one note about one place, and everything that was a
 * fact about the day is worked out at render time instead.
 */
function unifyNotes() {
  const byName = new Map(state.places.map((pl) => [pl.name.toLowerCase(), pl]));
  for (const entry of state.log) {
    if (entry.createdAt && entry.placeID !== undefined && entry.time) continue;

    const label = entry.placeLabel || entry.destinationLabel || '';
    const next = {
      id: entry.id,
      dayNumber: entry.dayNumber,
      placeID: entry.placeID ?? entry.destinationPlaceID ?? byName.get(label.toLowerCase())?.id ?? null,
      placeLabel: label,
      text: String(entry.text || ''),
      photoPaths: entry.photoPaths || [],
      photoCount: (entry.photoPaths || []).length,
      // A note written before this round has no time of its own. Midday is
      // an honest placeholder and it can be corrected in the composer.
      time: entry.time || '12:00',
      createdAt: entry.createdAt || new Date(2000, 0, 1 + entry.dayNumber).toISOString(),
      updatedAt: entry.updatedAt || new Date(2000, 0, 1 + entry.dayNumber).toISOString(),
    };
    put('log', next);
  }
}

function emptySnapshot(tripID) {
  return {
    trip: { ...JSON.parse(JSON.stringify(seed.TRIP)), id: tripID, name: 'New trip', weather: [] },
    days: [], places: [], subRoutes: [], shopping: [],
    mustSee: [], prep: [], log: [], outfits: [],
  };
}

/**
 * A trip is running, coming up or finished, and each wants a different card.
 * Worked out from the dates rather than stored, so it is never stale.
 */
export function tripState(trip) {
  if (!trip?.startDate) return 'upcoming';
  const start = new Date(trip.startDate);
  if (Number.isNaN(start.getTime())) return 'upcoming';
  const today = new Date();
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const from = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const days = Math.round((midnight - from) / 86400000);
  if (days < 0) return 'upcoming';
  if (days < Math.max(1, trip.dayCount || 1)) return 'running';
  return 'finished';
}

/** Whole days until a trip starts, or since it ended. */
export function tripDayGap(trip) {
  if (!trip?.startDate) return null;
  const start = new Date(trip.startDate);
  if (Number.isNaN(start.getTime())) return null;
  const today = new Date();
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const from = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  return Math.round((from - midnight) / 86400000);
}

/** Which day of a running trip today is. */
export function tripCurrentDay(trip) {
  const gap = tripDayGap(trip);
  if (gap == null) return trip?.currentDay || 1;
  return Math.min(Math.max(1, 1 - gap), trip.dayCount || 1);
}

/**
 * The trips home, as a status board rather than a list: on now, coming up,
 * finished, in that order.
 */
export function tripGroups() {
  const groups = { running: [], upcoming: [], finished: [] };
  for (const trip of state.trips) groups[tripState(trip)].push(trip);
  groups.upcoming.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
  groups.finished.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
  return groups;
}

/**
 * What the running trip's card says: where you are in the day, and the next
 * thing on it. Only available for the trip that is actually open, because
 * the other trips' days are not in memory.
 */
export function runningCard(trip) {
  if (trip.id !== state.tripID) return null;
  const n = tripCurrentDay(trip);
  const d = day(n);
  const items = activeItems(d);
  const now = new Date().getHours() * 60 + new Date().getMinutes();

  const next = items.find((item) => (parseClock(item.time) ?? 0) >= now) || items[items.length - 1] || null;
  const window = next ? itemWindow(next) : null;
  const minutesAway = window?.start != null ? window.start - now : null;

  const buying = state.shopping.filter((i) => !i.bought && itemDay(i) === n).length;
  const spent = state.shopping
    .filter((i) => i.bought)
    .reduce((sum, i) => sum + (i.paidAmount ?? i.estimate ?? 0), 0);

  return {
    dayNumber: n,
    dayLabel: d?.dateLabel || `Day ${n}`,
    stops: items.length,
    next: next ? {
      time: window.startLabel,
      name: next.name,
      // What the row underneath says: where the day goes after this.
      after: window.end != null ? `back at the coach ${window.endLabel}` : 'no end set',
      away: minutesAway != null && minutesAway > 0 && minutesAway < 240
        ? `IN ${duration(minutesAway).toUpperCase()}`
        : (minutesAway != null && minutesAway <= 0 ? 'NOW' : ''),
    } : null,
    buying,
    spent,
  };
}

/**
 * How ready an upcoming trip is: three counts you can act on rather than one
 * score, because a score tells you nothing about what to do next.
 */
export function tripReadiness(trip) {
  if (trip.id !== state.tripID) return null;
  const emptyDays = state.days.filter((d) => !activeItems(d).length).length;
  const packed = state.prep.filter((i) => i.packed).length;
  const planned = state.shopping.reduce((sum, i) => sum + (i.estimate || 0), 0);
  return {
    emptyDays,
    packed,
    prep: state.prep.length,
    planned,
  };
}

/** What a finished trip came to. */
export function tripRecap(trip) {
  if (trip.id !== state.tripID) return null;
  const stops = state.days.reduce((n, d) => n + activeItems(d).length, 0);
  const spent = state.shopping
    .filter((i) => i.bought)
    .reduce((sum, i) => sum + (i.paidAmount ?? i.estimate ?? 0), 0);
  return { stops, spent, notes: state.log.length };
}

/** The four tints a coverless trip can wear. */
export const COVER_TINTS = [
  { id: 'jade', bg: '#E6EFEB', fg: '#1F6F5C' },
  { id: 'amber', bg: '#EDE4D2', fg: '#8A5A08' },
  { id: 'stone', bg: '#DCE3DE', fg: '#3D4C46' },
  { id: 'ink', bg: '#14201C', fg: '#ffffff' },
];

export const coverTint = (trip) => COVER_TINTS.find((t) => t.id === trip?.coverTint) || COVER_TINTS[0];

/** Photos already attached to a note, which is the only source of a cover. */
export function coverCandidates() {
  const out = [];
  for (const note of state.log) {
    for (const src of note.photoPaths || []) out.push({ src, note: note.id });
  }
  return out;
}

export async function setTripCover({ photo, tint }) {
  if (!state.trip) return;
  const next = { ...state.trip };
  if (photo !== undefined) next.coverPhoto = photo || '';
  if (tint !== undefined) next.coverTint = tint || '';
  putTrip(next);
}

export async function refreshTrips() {
  try {
    state.trips = (await backend.listTrips()).sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
  } catch {
    state.trips = state.trip ? [state.trip] : [];
  }
  notify();
}

/** Builds a trip from the home screen's form and opens it. */
export async function createTrip({ name, startDate, dayCount, locationName }) {
  const label = String(name || '').trim() || 'New trip';
  const id = uid('trip-');
  const days = Math.max(1, Math.min(60, Number(dayCount) || 1));

  const trip = {
    ...JSON.parse(JSON.stringify(seed.TRIP)),
    id,
    name: label,
    code: label.replace(/[^A-Za-z\u4e00-\u9fff]/g, '').slice(0, 2).toUpperCase() || 'TR',
    dateRange: '',
    dayCount: days,
    currentDay: 1,
    startDate: startDate || null,
    locationName: String(locationName || '').trim(),
    weather: [],
    weatherUpdatedAt: null,
    prepCategories: [],
  };

  if (trip.locationName && online()) {
    try {
      const hit = await geocode(trip.locationName);
      if (hit) {
        trip.latitude = hit.latitude;
        trip.longitude = hit.longitude;
      }
    } catch { /* keep the default centre */ }
  }

  await backend.createTrip(trip);
  await openTrip(id);

  // Day rows for the dates just chosen.
  await updateTrip({ startDate: trip.startDate, dayCount: days });
  state.selectedDay = 1;
  notify();
  return id;
}

/** Opens a trip and remembers it, so a relaunch comes back here. */
export async function openTrip(tripID) {
  writeActiveTripID(tripID);
  await boot(tripID);
}

export async function switchTrip(tripID) {
  if (!tripID) return;
  if (tripID === state.tripID) {
    // Already loaded — just claim it as the active one.
    writeActiveTripID(tripID);
    notify();
    return;
  }
  state.ready = false;
  notify();
  await openTrip(tripID);
}

export async function deleteTrip(tripID) {
  await backend.deleteTrip(tripID);
  if (tripID === state.tripID) {
    writeActiveTripID(null);
    state.tripID = null;
    state.trip = null;
    for (const kind of KINDS) state[kind] = [];
  }
  await refreshTrips();
}

/** Leaves the trip, sending the app back to the home screen. */
export function closeTrip() {
  writeActiveTripID(null);
  state.tripID = null;
  notify();
}

function apply(snapshot) {
  state.trip = snapshot.trip;
  for (const kind of KINDS) state[kind] = snapshot[kind] || [];
  sortAll();
}

function sortAll() {
  state.days.sort((a, b) => a.dayNumber - b.dayNumber);
  state.mustSee.sort((a, b) => a.order - b.order);
  state.log.sort((a, b) => (
    (a.dayNumber - b.dayNumber)
    || ((parseClock(a.time) ?? 0) - (parseClock(b.time) ?? 0))
    || String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
  ));
  state.shopping.sort((a, b) => (a.groupOrder - b.groupOrder) || (a.order - b.order));
  state.prep.sort((a, b) => (a.categoryOrder - b.categoryOrder) || (a.order - b.order));
}

// --------------------------------------------------------------- write-though

function put(kind, row) {
  const list = state[kind];
  const at = list.findIndex((r) => r.id === row.id);
  if (at >= 0) list[at] = row; else list.push(row);
  backend?.put(kind, row);
  sortAll();
  notify();
}

function remove(kind, id) {
  state[kind] = state[kind].filter((r) => r.id !== id);
  backend?.del(kind, id);
  notify();
}

// -------------------------------------------------------------------- undo

let undoTimer = null;

/**
 * Deleting is permanent, but not instantly. The row goes, a line appears
 * above the tab bar, and for six seconds it can come back — which is what
 * makes a swipe a safe gesture rather than a scary one. Offline this is
 * unchanged: the deletion is queued like any other edit and the undo just
 * queues the opposite.
 */
export function rememberUndo(label, restore) {
  if (undoTimer) clearTimeout(undoTimer);
  state.undo = { label, restore, at: Date.now() };
  notify();
  undoTimer = setTimeout(() => {
    state.undo = null;
    notify();
  }, 6000);
}

export function undoLast() {
  const hit = state.undo;
  if (!hit) return;
  if (undoTimer) clearTimeout(undoTimer);
  state.undo = null;
  hit.restore();
  notify();
}

export function clearUndo() {
  if (undoTimer) clearTimeout(undoTimer);
  state.undo = null;
  notify();
}

/** Removes one row and keeps it long enough to put back. */
export function removeWithUndo(kind, id, label) {
  const row = state[kind].find((r) => r.id === id);
  if (!row) return;
  const copy = JSON.parse(JSON.stringify(row));
  remove(kind, id);
  rememberUndo(label, () => put(kind, copy));
}

function putTrip(trip) {
  state.trip = trip;
  backend?.putTrip(trip);
  notify();
}

/** Firestore allows 1 MiB per document; leave room for the note itself. */
const PHOTO_BUDGET_BYTES = 600_000;

/**
 * Attaches a photo to a note. Cloud Storage needs a billing account, so when
 * it is unavailable the photo is kept as a small thumbnail inside the note
 * document instead — lower quality, but it works on the free plan. Enabling
 * Storage later needs no code change; the next photo goes to the bucket.
 */
export async function attachPhoto(file, path, existing = []) {
  if (!backend) throw new Error('Storage is not ready yet');

  const { upload, thumbnail } = await prepare(file);

  try {
    if (!backend.hasBucket) throw new Error('No bucket configured');
    const url = await backend.uploadPhoto(upload || file, path);
    return { url, stored: 'bucket' };
  } catch (error) {
    const used = existing.reduce((sum, url) => sum + storedLength(url), 0);
    if (used + storedLength(thumbnail) > PHOTO_BUDGET_BYTES) {
      throw new Error('That is as many photos as fit without Cloud Storage enabled');
    }
    return { url: thumbnail, stored: 'inline' };
  }
}

// ------------------------------------------------------------------- reading

export const day = (n = state.selectedDay) => state.days.find((d) => d.dayNumber === n) || null;
export const place = (id) => state.places.find((p) => p.id === id) || null;
export const weather = (n = state.selectedDay) => (state.trip?.weather || []).find((w) => w.dayNumber === n) || null;

export function planItem(id) {
  for (const d of state.days) {
    const hit = (d.items || []).find((i) => i.id === id);
    if (hit) return { item: hit, dayNumber: d.dayNumber };
  }
  return null;
}

export const activeItems = (d) => (d?.items || []).filter((i) => !i.archived);
export const archivedItems = (d) => (d?.items || []).filter((i) => i.archived);

/** Numbers the agent's stops in order, which is what makes Nishi stop 5. */
export function mainStopNumbers(d) {
  const numbers = {};
  let n = 0;
  for (const item of activeItems(d)) {
    if (item.kind === 'main') numbers[item.id] = ++n;
  }
  return numbers;
}

/**
 * A stop's window: two times, both of them yours.
 *
 * The alternative was a start plus a length, with the end worked out. The
 * reason it lost is the sub route: its deadline is a clock time — 15:45 at
 * the coach door — and if the stop only stores a length, that clock time
 * becomes arithmetic you redo in your head on every edit. The number you
 * most need to protect would be the one number never written down. So the
 * stop stores both times and the length is the derived, greyed-out one.
 *
 * An end is optional. "Open end" is a real answer for the last stop of a
 * day, not a missing value to nag about.
 */
export function itemWindow(item) {
  const start = parseClock(item?.time);
  const end = parseClock(item?.endTime);
  // A window that crosses midnight is a night market, not an error.
  const minutes = start != null && end != null
    ? (end >= start ? end - start : (end + 1440) - start)
    : null;
  return {
    start,
    end,
    minutes,
    openEnd: end == null,
    reversed: start != null && end != null && end === start,
    startLabel: start != null ? clock(start) : String(item?.time || ''),
    endLabel: end != null ? clock(end) : '',
    label: end != null ? `${clock(start)} – ${clock(end)}` : (start != null ? clock(start) : ''),
    durationLabel: minutes ? duration(minutes) : 'open end',
  };
}

/**
 * What is wrong with the day's clock — as a strip on the row, never as a
 * refused drag. Three kinds, and each carries the one tap that fixes it,
 * because a warning you cannot act on is just a telling-off.
 *
 * Loops are left out: a loop happens *inside* another stop's window on
 * purpose, so flagging it as an overlap would cry wolf every time.
 */
export function dayIssues(n = state.selectedDay) {
  const items = activeItems(day(n)).filter((i) => !i.isSubRouteSummary);
  const issues = new Map();
  const add = (id, issue) => {
    if (!issues.has(id)) issues.set(id, []);
    issues.get(id).push(issue);
  };

  // Ends before it starts. Its own kind, because it is a typo rather than a
  // disagreement with anything else.
  for (const item of items) {
    const w = itemWindow(item);
    if (w.start != null && w.end != null && w.minutes === 0) {
      add(item.id, {
        kind: 'reversed',
        label: 'ENDS WHEN IT STARTS',
        text: `Starts and ends at ${w.startLabel}.`,
        fixes: [{ act: 'clear-end', label: 'Leave the end open' }],
      });
    }
  }

  // Out of order: the list says one thing and the clock another.
  let previous = null;
  for (const item of items) {
    const at = parseClock(item.time);
    if (at == null) {
      add(item.id, { kind: 'notime', label: 'NO TIME', text: 'This stop has no start time.', fixes: [] });
      continue;
    }
    if (previous && at < previous.at) {
      add(item.id, {
        kind: 'order',
        label: 'OUT OF ORDER',
        text: `Starts ${clock(at)} but sits after ${previous.name} at ${clock(previous.at)}.`,
        // The earliest time this stop could start and still be in order: the
        // one above it ends then. A stop above with an open end has only its
        // start to go on, which is still better than offering nothing.
        fixes: (() => {
          const after = previous.end ?? previous.at;
          const mine = itemWindow(item).minutes;
          return [
            { act: 'move-back', label: 'Move it back' },
            {
              act: 'retime',
              label: `Set ${clock(after)}${mine ? ` – ${clock(after + mine)}` : ''}`,
              start: clock(after),
              end: mine ? clock(after + mine) : '',
            },
          ];
        })(),
      });
    }
    const w = itemWindow(item);
    previous = { at, name: item.name, end: w.end };
  }

  // Overlaps, judged on the clock rather than on list order, so a day that is
  // out of order is still told about the collision.
  const timed = items
    .map((item) => ({ item, window: itemWindow(item) }))
    .filter((row) => row.window.start != null)
    .sort((a, b) => a.window.start - b.window.start);

  let runningEnd = null;
  let runningName = '';
  for (const row of timed) {
    if (runningEnd != null && row.window.start < runningEnd) {
      add(row.item.id, {
        kind: 'overlap',
        label: 'OVERLAPS',
        text: `${runningName} runs to ${clock(runningEnd)}, so these two are on top of each other.`,
        fixes: [{
          act: 'retime',
          label: `Start ${clock(runningEnd)}`,
          start: clock(runningEnd),
          end: row.window.minutes ? clock(runningEnd + row.window.minutes) : '',
        }],
      });
    }
    if (row.window.end != null && (runningEnd == null || row.window.end > runningEnd)) {
      runningEnd = row.window.end;
      runningName = row.item.name;
    }
  }
  return issues;
}

/** "2 things to look at", for under the date. */
export function dayIssueCount(n = state.selectedDay) {
  return dayIssues(n).size;
}

/**
 * The day as stops and lanes.
 *
 * Free time is a slot, not a stop: one lane follows each stop, and a sub
 * route lives inside a lane. That is what lets a day hold two or three of
 * them without their windows ever competing for one anchor.
 *
 * A lane normally runs from where its stop ends to where the next one
 * starts. The exception is a long stop — the market you are released into
 * for two hours *is* the free time — so a stop of 90 minutes or more opens
 * its lane at its own start rather than at its end.
 */
export function dayTimeline(n = state.selectedDay) {
  const stops = activeItems(day(n)).map((item) => ({ item, window: itemWindow(item) }));
  const loops = subRoutesFor(n);
  const claimed = new Set();
  const rows = [];

  const timed = stops
    .filter((s) => s.window.start != null)
    .sort((a, b) => a.window.start - b.window.start);

  stops.forEach((row) => {
    rows.push({ kind: 'stop', item: row.item, window: row.window });
    if (row.window.start == null) return;

    // Where this stop's lane begins, and where the next stop takes over.
    const longStop = (row.window.minutes || 0) >= SELF_LANE_MINUTES;
    const from = longStop ? row.window.start : (row.window.end ?? row.window.start);
    const next = timed.find((other) => other.window.start > row.window.start);
    const to = next ? next.window.start : DAY_ENDS_AT;
    if (to <= from) return;

    const mine = loops.filter((r) => {
      if (claimed.has(r.id)) return false;
      const at = loopStart(r);
      return at != null && at >= from && at < to;
    });
    for (const r of mine) claimed.add(r.id);

    // An empty lane is worth drawing only if there is really time in it; a
    // lane holding a sub route is always drawn.
    if (!mine.length && to - from < MIN_LANE_MINUTES) return;

    rows.push({
      kind: 'lane',
      from,
      to,
      label: next ? `between ${row.item.name} and ${next.item.name}` : `after ${row.item.name}`,
      inside: row.item,
      loops: mine,
    });
  });

  // A loop whose window matches no lane still has to be reachable.
  const orphans = loops.filter((r) => !claimed.has(r.id));
  if (orphans.length) {
    rows.push({
      kind: 'lane',
      from: loopStart(orphans[0]) ?? DAY_STARTS_AT,
      to: loopDeadline(orphans[0]) ?? DAY_ENDS_AT,
      label: 'free time',
      inside: null,
      loops: orphans,
      orphan: true,
    });
  }

  // A day with no stops at all still offers somewhere to put free time,
  // but only once it has stops for a sub route to sit between.
  return rows;
}

/** A gap shorter than this is not worth offering a sub route in. */
const MIN_LANE_MINUTES = 45;
/** A stop at least this long is itself free time. */
const SELF_LANE_MINUTES = 90;
const DAY_STARTS_AT = 6 * 60;
const DAY_ENDS_AT = 23 * 60;

/** Kept for the screens that only want the gaps, biggest first. */
export function dayGaps(n = state.selectedDay) {
  return dayTimeline(n)
    .filter((row) => row.kind === 'lane' && !row.loops.length)
    .map((row) => ({ from: row.from, to: row.to, during: row.inside, label: row.label }))
    .sort((a, b) => (b.to - b.from) - (a.to - a.from));
}

// ------------------------------------------------------------------- loops

/**
 * Item 05: a day can hold as many loops as it has gaps. Each one is its own
 * record with its own name, ends and times, and each one shows on the Plan as
 * its own dashed amber row.
 */
export function subRoutesFor(n = state.selectedDay) {
  return state.subRoutes
    .filter((r) => r.dayNumber === n)
    .sort((a, b) => (loopStart(a) ?? 0) - (loopStart(b) ?? 0));
}

export const subRouteByID = (id) => state.subRoutes.find((r) => r.id === id) || null;

/** The loop the screens are working on: the chosen one, else the day's first. */
export function activeLoop(n = state.selectedDay) {
  const chosen = subRouteByID(state.loopID);
  if (chosen && chosen.dayNumber === n) return chosen;
  return subRoutesFor(n)[0] || null;
}

export function selectLoop(id) {
  state.loopID = id;
  notify();
}

/** Accepts a loop, a loop id, or nothing at all — then falls back sensibly. */
function resolveLoop(handle) {
  if (handle && typeof handle === 'object') return handle;
  if (typeof handle === 'string') return subRouteByID(handle);
  if (typeof handle === 'number') return activeLoop(handle);
  return activeLoop();
}

export const subRoute = (n = state.selectedDay) => activeLoop(n);

/**
 * Walks the loop: each leg adds travel time, each stop adds its stay, and the
 * journey back is checked against the coach departure.
 */
/**
 * When the loop has to be over. The traveller's own figure wins; otherwise it
 * is read off the itinerary — the end of the anchor stop's window, or the next
 * stop's time — so moving the coach moves the deadline with it.
 */
export function loopDeadline(handle) {
  const route = resolveLoop(handle);
  if (!route) return null;
  if (route.returnByMinutes != null) return route.returnByMinutes;

  const d = state.days.find((row) => row.dayNumber === route.dayNumber);
  const items = (d?.items || []).filter((i) => !i.archived && !i.isSubRouteSummary);
  const anchor = items.find((i) => i.placeID === route.anchorPlaceID || i.id === route.anchorPlanItemID);

  // The anchor stop's own window is the natural deadline, and it is now
  // derived from the stop's duration rather than read out of a fixed string.
  const windowEnd = itemWindow(anchor).end;
  if (windowEnd != null) return windowEnd;

  const anchorAt = parseClock(anchor?.time);
  if (anchorAt != null) {
    const next = items
      .map((i) => parseClock(i.time))
      .filter((t) => t != null && t > anchorAt)
      .sort((a, b) => a - b)[0];
    if (next != null) return next;
  }
  return route.deadlineMinutes;
}

export const subRouteDeadline = (n = state.selectedDay) => loopDeadline(activeLoop(n));

/** When the loop starts: the traveller's figure, else the itinerary's. */
export function loopStart(handle) {
  const route = resolveLoop(handle);
  if (!route) return null;
  if (route.departMinutes != null) return route.departMinutes;

  const d = state.days.find((row) => row.dayNumber === route.dayNumber);
  const anchor = (d?.items || []).find((i) => i.placeID === route.anchorPlaceID || i.id === route.anchorPlanItemID);
  return parseClock(anchor?.time) ?? route.startMinutes;
}

export const subRouteStart = (n = state.selectedDay) => loopStart(activeLoop(n));

/**
 * The loop as a time budget rather than a timetable.
 *
 * Travel between stops is the part the app can estimate; how long you linger
 * is not, and pretending otherwise produced arrival times nobody could keep.
 * So: you set when you leave and when you must be back, the app subtracts the
 * travelling, and what remains is yours to spread across the stops however you
 * like. Arrival times are still shown, from the stay estimates, but they are
 * advisory — the figure that matters is how much is left to spend.
 */
export function loopSchedule(handle) {
  const route = resolveLoop(handle);
  const result = {
    stops: [], travelMinutes: 0, stayEstimate: 0,
    departMinutes: 0, returnByMinutes: 0,
    availableMinutes: 0, spendableMinutes: 0,
    exists: Boolean(route),
    loop: route,
    startPlace: null, endPlace: null,
  };
  if (!route) return result;

  const depart = loopStart(route) ?? 0;
  const returnBy = loopDeadline(route) ?? depart;
  result.departMinutes = depart;
  result.returnByMinutes = returnBy;
  result.availableMinutes = Math.max(0, returnBy - depart);

  result.startPlace = place(route.startPlaceID) || place(route.anchorPlaceID) || null;
  result.endPlace = place(route.endPlaceID) || result.startPlace;

  let running = depart;
  (route.placeIDs || []).forEach((id, index) => {
    const p = place(id);
    if (!p) return;
    const travel = (p.legs || []).reduce((sum, l) => sum + l.minutes, 0);
    running += travel;
    result.travelMinutes += travel;
    const arrival = running;
    running += p.stayMinutes;
    result.stayEstimate += p.stayMinutes;
    result.stops.push({ index: index + 1, place: p, arrival, travel });
  });

  // Getting back to wherever the loop ends.
  const back = Number(route.returnMinutes) || 0;
  result.travelMinutes += back;
  result.returnMinutes = back;
  result.spendableMinutes = result.availableMinutes - result.travelMinutes;
  return result;
}

/** Kept day-scoped for the screens that only care about the loop in hand. */
export const subSchedule = (n = state.selectedDay) => loopSchedule(activeLoop(n));

/** Every loop on the day, each with its schedule worked out. */
export const dayLoops = (n = state.selectedDay) => subRoutesFor(n).map((loop) => loopSchedule(loop));

/** Every place picked into any of the day's loops, for the pickers. */
export function dayLoopStops(n = state.selectedDay) {
  const stops = [];
  for (const schedule of dayLoops(n)) {
    for (const stop of schedule.stops) stops.push({ ...stop, loop: schedule.loop });
  }
  return stops;
}

/** Everywhere the loop could start or end: the day's stops, in order. */
export function loopEndpointOptions(handle) {
  const route = resolveLoop(handle);
  return activeItems(day(route?.dayNumber ?? state.selectedDay))
    .filter((item) => !item.isSubRouteSummary && item.placeID)
    .map((item) => ({ id: item.placeID, label: item.name, time: item.time }));
}

export function renameSubRoute(name, handle) {
  const route = resolveLoop(handle);
  if (!route) return;
  route.name = String(name || '').trim() || 'Free time';
  put('subRoutes', route);
}

export function setSubRouteEndpoints({ startPlaceID, endPlaceID }, handle) {
  const route = resolveLoop(handle);
  if (!route) return;
  if (startPlaceID !== undefined) route.startPlaceID = startPlaceID || null;
  if (endPlaceID !== undefined) route.endPlaceID = endPlaceID || null;
  put('subRoutes', route);
}

/** The two times the traveller owns: when they leave and when they must be back. */
export function setSubRouteTimes({ depart, returnBy }, handle) {
  const route = resolveLoop(handle);
  if (!route) return;
  if (depart !== undefined) route.departMinutes = parseClock(depart);
  if (returnBy !== undefined) route.returnByMinutes = parseClock(returnBy);
  put('subRoutes', route);
}

export function subSummaryLine(handle) {
  const names = loopSchedule(handle).stops.map((s) => s.place.name);
  return names.length ? names.join(' → ') : 'Tap + to add places';
}

/** How a loop names the part of the day it belongs to, now there can be two. */
export function loopPart(handle) {
  const start = loopStart(resolveLoop(handle));
  if (start == null) return '';
  return start < 12 * 60 ? 'morning' : start < 17 * 60 ? 'afternoon' : 'evening';
}

export function loopWhen(handle) {
  const route = resolveLoop(handle);
  if (!route) return '';
  const start = loopStart(route);
  if (start == null) return `Day ${route.dayNumber}`;
  return `Day ${route.dayNumber} ${loopPart(route)} · ${clock(start)} – ${clock(loopDeadline(route) ?? start)}`;
}

/**
 * How a sub route reads on the Plan: its name, its window, the walk, and
 * whether what you picked actually fits. The over/spare figure is on the
 * Plan card as well as inside the sub route, because the Plan is where you
 * will be when you drag something.
 */
export function loopCard(handle) {
  const route = resolveLoop(handle);
  if (!route) return null;
  const schedule = loopSchedule(route);
  const count = schedule.stops.length;
  const over = schedule.spendableMinutes < 0 ? -schedule.spendableMinutes : 0;
  return {
    id: route.id,
    name: route.name || 'Free time',
    window: `${clock(schedule.departMinutes)} – ${clock(schedule.returnByMinutes)}`,
    line: count
      ? `${count} stop${count === 1 ? '' : 's'} · ${schedule.stops.map((s) => s.place.name).join(' → ')}`
      : 'No places picked yet',
    over,
    spare: over ? 0 : schedule.spendableMinutes,
    km: ((schedule.travelMinutes * 80) / 1000).toFixed(1),
    notes: state.log.filter((entry) => (
      entry.dayNumber === route.dayNumber
      && (route.placeIDs || []).includes(entry.placeID)
    )).length,
  };
}

export const categoryLabel = (category) => seed.CATEGORY_LABELS[category] || category;

/**
 * Every candidate hanging off one stop. Only that stop's places: showing the
 * whole trip's pool made a market half an hour away look like a 4-minute walk
 * from wherever you were standing.
 */
export function nearbyPlacesFor(anchorPlaceID) {
  // No anchor means no answer. Returning every place here was the bug: a stop
  // with nothing saved around it borrowed another stop's list.
  if (!anchorPlaceID) return [];
  return state.places.filter((p) => p.anchorPlaceID === anchorPlaceID);
}

/** Every saved place in the trip, for pickers that are not stop-specific. */
export function allPlaces() {
  return state.places.slice().sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Point 4: every place saved against any stop on one day, grouped by that
 * stop and in itinerary order — what the Map's "Nearby" button should show,
 * as against one stop's list.
 */
export function placesByStopForDay(dayNumber = state.selectedDay) {
  const d = day(dayNumber);
  const groups = [];
  for (const item of activeItems(d)) {
    if (item.isSubRouteSummary || !item.placeID) continue;
    // Places hang off the stop's *place*, not off the itinerary row — so this
    // has to ask by placeID or the whole day comes back empty.
    const places = nearbyPlaces(item.placeID);
    if (places.length) groups.push({ stop: item, places });
  }
  return groups;
}

export function nearbyPlaces(anchorPlaceID = null) {
  const list = nearbyPlacesFor(anchorPlaceID).filter(
    (p) => state.nearbyCategory === 'all' || p.category === state.nearbyCategory
  );
  const travel = (p) => (p.legs || []).reduce((sum, l) => sum + l.minutes, 0);
  return list.slice().sort((a, b) => (
    state.nearbySort === 'stayTime' ? a.stayMinutes - b.stayMinutes : travel(a) - travel(b)
  ));
}

export const isInSubRoute = (placeId, handle) =>
  (resolveLoop(handle)?.placeIDs || []).includes(placeId);

/** Which of the day's loops a place is already in — the picker needs to say. */
export const loopsHolding = (placeId, n = state.selectedDay) =>
  subRoutesFor(n).filter((r) => (r.placeIDs || []).includes(placeId));

export function setShopFilter({ day, place }) {
  if (day !== undefined) state.shopDay = day;
  if (place !== undefined) state.shopPlace = place;
  notify();
}

export function setSpendGroupBy(mode) {
  state.spendGroupBy = mode;
  notify();
}

/** Which day a shopping item belongs to, read off its "Day 3 · …" stamp. */
export function itemDay(item) {
  const hit = /Day\s+(\d+)/i.exec(item.placeWhen || '');
  return hit ? Number(hit[1]) : null;
}

export function shopDayOptions() {
  const days = new Set();
  for (const item of state.shopping) {
    const n = itemDay(item);
    if (n) days.add(n);
  }
  return [...days].sort((a, b) => a - b);
}

export function shopPlaceOptions() {
  return [...new Set(state.shopping.map((i) => i.placeLabel))];
}

export function filteredShopping() {
  return state.shopping.filter((item) => {
    if (state.shopPlace !== 'all' && item.placeLabel !== state.shopPlace) return false;
    if (state.shopDay !== 'all' && itemDay(item) !== Number(state.shopDay)) return false;
    return true;
  });
}

export function shoppingGroups() {
  const groups = [];
  for (const item of filteredShopping()) {
    let group = groups.find((g) => g.placeLabel === item.placeLabel);
    if (!group) {
      group = { placeLabel: item.placeLabel, when: item.placeWhen, badge: item.badge, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

/**
 * The shape of the trip's money, which a total and a category bar cannot
 * say: how it moved across the days, and how close the estimates were.
 * Those are the two questions you actually ask when you get home.
 */
export function spendByDay() {
  const count = state.trip?.dayCount || 1;
  const rows = Array.from({ length: count }, (_, i) => ({ dayNumber: i + 1, sum: 0, count: 0 }));
  for (const item of state.shopping) {
    if (!item.bought) continue;
    const n = item.boughtDay || itemDay(item);
    const row = rows.find((r) => r.dayNumber === n);
    if (!row) continue;
    row.sum += item.paidAmount ?? item.estimate ?? 0;
    row.count += 1;
  }
  const peak = Math.max(1, ...rows.map((r) => r.sum));
  const biggest = rows.reduce((best, r) => (r.sum > (best?.sum || 0) ? r : best), null);
  return { rows, peak, biggest: biggest?.sum ? biggest : null };
}

/**
 * Guessed against paid. Items with no estimate only count on the paid side,
 * which the screen has to say out loud or the two bars look wrong.
 */
export function spendAccuracy() {
  const bought = state.shopping.filter((i) => i.bought);
  let estimated = 0;
  let paid = 0;
  let noEstimate = 0;
  let over = null;
  let under = null;

  for (const item of bought) {
    const actual = item.paidAmount ?? item.estimate ?? 0;
    paid += actual;
    if (item.estimate == null) {
      noEstimate += 1;
      continue;
    }
    estimated += item.estimate;
    const gap = actual - item.estimate;
    if (gap > 0 && (!over || gap > over.gap)) over = { name: item.name, gap };
    if (gap < 0 && (!under || gap < under.gap)) under = { name: item.name, gap: -gap };
  }

  return {
    estimated,
    paid,
    noEstimate,
    total: bought.length,
    difference: estimated - paid,
    over,
    under,
    // The paid bar is drawn against the larger of the two, so neither
    // overflows its track.
    peak: Math.max(1, estimated, paid),
  };
}

/** Every purchase, newest day first, grouped by the day it happened on. */
export function purchasesByDay() {
  const groups = [];
  for (const item of state.shopping) {
    if (!item.bought) continue;
    const n = item.boughtDay || itemDay(item) || 0;
    let group = groups.find((g) => g.dayNumber === n);
    if (!group) {
      group = { dayNumber: n, dateLabel: day(n)?.shortDate || '', sum: 0, items: [] };
      groups.push(group);
    }
    group.sum += item.paidAmount ?? item.estimate ?? 0;
    group.items.push(item);
  }
  for (const group of groups) {
    group.items.sort((a, b) => String(b.boughtAt || '').localeCompare(String(a.boughtAt || '')));
  }
  return groups.sort((a, b) => b.dayNumber - a.dayNumber);
}

/** Which day the report is filtered to, if any. */
export function setSpendDay(n) {
  state.spendDay = state.spendDay === n ? null : n;
  notify();
}

export function spendTotals({ all = false } = {}) {
  let spent = 0, planned = 0, bought = 0;
  const byPayment = {};
  const byCategory = {};
  for (const p of seed.PAYMENTS) byPayment[p.id] = { count: 0, sum: 0 };
  for (const c of seed.SHOP_CATEGORIES) byCategory[c.id] = { count: 0, sum: 0 };

  const source = all ? state.shopping : filteredShopping();
  for (const item of source) {
    planned += item.estimate || 0;
    if (!item.bought) continue;
    bought += 1;
    // A ticked item with no real price falls back to its estimate.
    const amount = item.paidAmount ?? item.estimate ?? 0;
    spent += amount;
    const bucket = byPayment[item.payment] || byPayment.cash;
    bucket.count += 1;
    bucket.sum += amount;

    const catBucket = byCategory[item.category] || byCategory.other;
    catBucket.count += 1;
    catBucket.sum += amount;
  }

  const rate = state.trip?.homeCurrencyRate || 1;
  return {
    spent, planned, bought,
    total: source.length,
    byPayment,
    byCategory,
    percent: planned > 0 ? Math.min(100, Math.round((spent / planned) * 100)) : 0,
    homeLabel: Math.round(spent / rate).toLocaleString('en-US'),
  };
}

/** Every stop you could buy something at, for the shopping dropdown. */
export function placeOptions() {
  const labels = [];
  for (const d of state.days) {
    for (const item of activeItems(d)) {
      if (item.isSubRouteSummary) continue;
      if (!labels.includes(item.name)) labels.push(item.name);
    }
  }
  for (const d of state.days) {
    for (const stop of dayLoopStops(d.dayNumber)) {
      const label = `${stop.place.name} (sub)`;
      if (!labels.includes(label)) labels.push(label);
    }
  }
  labels.push('Airport, before security');
  return labels;
}

export function prepGroups() {
  const order = state.trip?.prepCategories || seed.PREP_CATEGORIES;
  const groups = [];
  for (const item of state.prep) {
    let group = groups.find((g) => g.title === item.category);
    if (!group) {
      group = { title: item.category, categoryOrder: item.categoryOrder, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  for (const title of order) {
    if (!groups.some((g) => g.title === title)) {
      groups.push({ title, categoryOrder: order.indexOf(title), items: [] });
    }
  }
  return groups.sort((a, b) => a.categoryOrder - b.categoryOrder);
}

export function prepProgress() {
  const packed = state.prep.filter((i) => i.packed).length;
  const total = state.prep.length;
  return { packed, total, percent: total ? Math.round((packed / total) * 100) : 0 };
}

/** Shots belong to one itinerary row, matched the way places are. */
export function shotsFor(anchorID) {
  if (!anchorID) return [];
  return state.mustSee
    .filter((shot) => shot.placeID === anchorID)
    .sort((a, b) => a.order - b.order);
}

export const outfitFor = (n = state.selectedDay) =>
  state.outfits.find((o) => o.dayNumber === n) || null;

// ------------------------------------------------------------------- notes

/**
 * A note belongs to a place and a time. The day still totals them but no
 * longer owns them, which is what lets three notes at one market on one
 * afternoon all survive.
 *
 * A note need not be pinned to anywhere: "feet destroyed, trainers
 * tomorrow" is about the day, not about a place, and sits under the day
 * itself.
 */
export const noteByID = (id) => state.log.find((e) => e.id === id) || null;

const byNoteTime = (a, b) => (parseClock(b.time) ?? 0) - (parseClock(a.time) ?? 0);

/** The day's notes, newest first — which is the order you wrote them in. */
export function notesForDay(n = state.selectedDay) {
  return state.log.filter((entry) => entry.dayNumber === n).sort(byNoteTime);
}

/** Every note about one place, whichever day it was written on. */
export function notesForPlace(placeID, { name = '' } = {}) {
  if (!placeID && !name) return [];
  return state.log
    .filter((entry) => (placeID && entry.placeID === placeID)
      || (!entry.placeID && name && entry.placeLabel === name))
    .sort((a, b) => (b.dayNumber - a.dayNumber) || byNoteTime(a, b));
}

/**
 * The day's notes grouped under the place they were written at, in the
 * order the places come on the itinerary — which is what the Log's day card
 * shows. Notes pinned to nowhere sit last, under the day itself.
 */
export function noteGroupsForDay(n = state.selectedDay) {
  const notes = notesForDay(n);
  if (!notes.length) return [];

  const groups = [];
  const bucket = (key, head) => {
    let hit = groups.find((g) => g.key === key);
    if (!hit) {
      hit = { key, ...head, notes: [] };
      groups.push(hit);
    }
    return hit;
  };

  // Where each place sits on this day, and under whose name.
  const order = new Map();
  activeItems(day(n)).forEach((item, index) => {
    if (item.placeID && !order.has(item.placeID)) {
      order.set(item.placeID, { at: index, time: item.time, badge: 'MAIN', tone: 'main' });
    }
  });
  subRoutesFor(n).forEach((route, loopIndex) => {
    for (const stop of loopSchedule(route).stops) {
      if (order.has(stop.place.id)) continue;
      order.set(stop.place.id, {
        at: 100 + loopIndex,
        time: clock(stop.arrival),
        badge: (route.name || 'free time').toUpperCase(),
        tone: 'sub',
      });
    }
  });

  for (const note of notes) {
    if (!note.placeID && !note.placeLabel) {
      bucket('__day', { name: 'Not about a place', time: '', badge: '', tone: 'none', at: 999 }).notes.push(note);
      continue;
    }
    const where = order.get(note.placeID);
    const label = note.placeLabel || place(note.placeID)?.name || 'A place';
    bucket(note.placeID || label, {
      name: label,
      time: where?.time || '',
      badge: where?.badge || '',
      tone: where?.tone || 'none',
      at: where?.at ?? 500,
    }).notes.push(note);
  }

  for (const group of groups) group.notes.sort((a, b) => (parseClock(a.time) ?? 0) - (parseClock(b.time) ?? 0));
  return groups.sort((a, b) => a.at - b.at);
}

/** What a day's card says above its notes, worked out rather than stored. */
export function dayNoteSummary(n) {
  const d = day(n);
  const notes = notesForDay(n);
  const loops = subRoutesFor(n);
  const walked = loops.filter((r) => (r.placeIDs || []).length).length;
  const spent = state.shopping
    .filter((i) => i.bought && itemDay(i) === n)
    .reduce((sum, i) => sum + (i.paidAmount ?? i.estimate ?? 0), 0);

  // Must-see counts for *this* day: the shots at the places it visits, not
  // the trip's whole tally, which would read the same on every card.
  const here = new Set(activeItems(d).map((i) => i.placeID).filter(Boolean));
  for (const route of loops) for (const id of route.placeIDs || []) here.add(id);
  const dayShots = state.mustSee.filter((sh) => here.has(sh.placeID));
  const got = dayShots.filter((sh) => sh.captured).length;

  const meta = [`${notes.length} note${notes.length === 1 ? '' : 's'}`];
  if (loops.length) meta.push(`${loops.length} sub route${loops.length === 1 ? '' : 's'}`);

  const chips = [];
  if (dayShots.length) chips.push({ label: `${got} of ${dayShots.length} must-see ✓`, tone: 'jade' });
  if (spent) chips.push({ label: `${money(spent, state.trip?.currencySymbol || '¥')} spent`, tone: '' });
  if (loops.length) chips.push({ label: `${walked} of ${loops.length} sub route${loops.length === 1 ? '' : 's'} walked`, tone: '' });

  const today = n === state.trip?.currentDay;
  return {
    dayNumber: n,
    dayLabel: today ? `Day ${n} · Today` : `Day ${n}`,
    dateLabel: d?.shortDate || '',
    meta: today ? `in progress · ${meta.join(' · ')}` : meta.join(' · '),
    live: today,
    chips,
  };
}

/** Days that have at least one note, newest day first. */
export function dayNoteGroups() {
  const days = [...new Set(state.log.map((e) => e.dayNumber))].sort((a, b) => b - a);
  return days.map((n) => ({ ...dayNoteSummary(n), groups: noteGroupsForDay(n) }));
}

/** Times already written at this place today, so the composer can offer them. */
export function noteTimesAt(placeID, n = state.selectedDay) {
  return state.log
    .filter((e) => e.dayNumber === n && e.placeID === placeID)
    .map((e) => e.time)
    .filter(Boolean)
    .sort();
}

export function weatherSourceLine() {
  const stamp = state.trip?.weatherUpdatedAt;
  if (!stamp) return 'Forecast';
  const hours = Math.floor((Date.now() - new Date(stamp).getTime()) / 3600000);
  return hours < 1 ? 'Forecast, updated just now' : `Forecast, updated ${hours} h ago`;
}

// ----------------------------------------------------------------- mutations

export function selectDay(n) {
  state.selectedDay = n;
  notify();
}

export function setEditingPlan(on) {
  state.editingPlan = on;
  notify();
}

export function setNearbySort(sort) {
  state.nearbySort = sort;
  notify();
}

export function setNearbyCategory(category) {
  state.nearbyCategory = category;
  notify();
}

function writeDay(d) {
  put('days', d);
}

export function movePlanItem(dayNumber, movedId, beforeId) {
  const d = day(dayNumber);
  if (!d || movedId === beforeId) return;
  const ids = d.items.map((i) => i.id);
  const next = reorder(ids, movedId, beforeId);
  d.items = next.map((id) => d.items.find((i) => i.id === id));
  writeDay(d);
}

/**
 * A stop's two times. Either can be set on its own, and clearing the end is
 * a real edit rather than a mistake — the last stop of a day genuinely has
 * no end.
 */
export function setPlanItemWindow(dayNumber, id, { start, end } = {}) {
  const d = day(dayNumber);
  const item = d?.items.find((i) => i.id === id);
  if (!item) return;

  if (start !== undefined) {
    const at = parseClock(start);
    if (at == null) return;
    item.time = clock(at);
  }
  if (end !== undefined) {
    if (end === null || end === '' || end === '—') {
      item.endTime = '';
    } else {
      const at = parseClock(end);
      if (at == null) return;
      item.endTime = clock(at);
    }
  }
  // The old fixed string is not a second source of truth any more.
  item.windowLabel = '';
  writeDay(d);
}

export function setPlanItemTime(dayNumber, id, text) {
  setPlanItemWindow(dayNumber, id, { start: text });
}

/** The one-tap fixes the warning strips offer. */
export function applyIssueFix(dayNumber, id, fix) {
  if (!fix) return;
  if (fix.act === 'clear-end') {
    setPlanItemWindow(dayNumber, id, { end: null });
    return;
  }
  if (fix.act === 'retime') {
    setPlanItemWindow(dayNumber, id, { start: fix.start, end: fix.end || null });
    return;
  }
  if (fix.act === 'move-back') {
    // Put the row where its own clock says it belongs.
    const d = day(dayNumber);
    if (!d) return;
    d.items = [...d.items].sort(byClock);
    writeDay(d);
  }
}

export function archivePlanItem(dayNumber, id) {
  const d = day(dayNumber);
  const item = d?.items.find((i) => i.id === id);
  if (!item) return;
  item.archived = true;
  item.movedToDay = null;
  writeDay(d);
}

export function restorePlanItem(dayNumber, id) {
  const d = day(dayNumber);
  const item = d?.items.find((i) => i.id === id);
  if (!item) return;
  item.archived = false;
  item.movedToDay = null;
  writeDay(d);
}

/** Moving a removed stop to another day actually relocates the row. */
export function movePlanItemToDay(fromDay, id, toDay) {
  const source = day(fromDay);
  const item = source?.items.find((i) => i.id === id);
  const target = day(toDay);
  if (!item || !target || fromDay === toDay) return;

  source.items = source.items.filter((i) => i.id !== id);
  target.items = [...(target.items || []), { ...item, archived: false, movedToDay: null }];
  target.items.sort(byClock);
  writeDay(source);
  writeDay(target);
}

const byClock = (a, b) => (parseClock(a.time) ?? 9999) - (parseClock(b.time) ?? 9999);

export function addPlanItem(dayNumber, { name, time, endTime = '', placeID = null, kind = 'main', note = '' }) {
  const d = day(dayNumber);
  if (!d || !name) return null;
  const source = placeID ? place(placeID) : null;
  const start = parseClock(time) ?? 15 * 60;
  const end = parseClock(endTime);
  const row = {
    id: uid('stop-'),
    time: clock(start),
    endTime: end != null ? clock(end) : '',
    durationLabel: '',
    name,
    subtitle: '',
    note: note || source?.note || '',
    summary: note || source?.note || '',
    windowLabel: '',
    chips: [],
    essentials: source?.essentials || [],
    kind: kind === 'sub' ? 'sub' : 'main',
    placeID,
    latitude: source?.latitude ?? null,
    longitude: source?.longitude ?? null,
    archived: false,
    movedToDay: null,
  };
  d.items = [...(d.items || []), row];
  d.items.sort(byClock);
  writeDay(d);
  return row;
}

/**
 * Adds a place to one stop's pool. The name is looked up on OpenStreetMap so
 * the place lands on the map and in the walking route; if the lookup finds
 * nothing — or there is no signal — it is saved without a location and says
 * so, rather than being silently left off the map.
 */
/**
 * Adds a place from either a typed name or a pasted map link. A full Google or
 * Apple Maps URL already carries the name and the coordinates, so that case
 * needs no network at all; anything OpenStreetMap knows on top — opening
 * hours, a phone number, a website — is fetched when there is a connection.
 */
/**
 * Works out what a typed name or a pasted map link refers to. Shared by both
 * ways of creating something, so a stop and a nearby place are captured
 * identically — the only difference is what they are saved as.
 */
export async function resolvePlaceInput(input) {
  const text = String(input || '').trim();
  if (!text) return { ok: false, reason: 'Nothing to add' };

  const link = parseMapLink(text);
  if (link?.kind === 'short') {
    return {
      ok: false,
      reason: 'Short links like maps.app.goo.gl cannot be read in a browser. '
        + 'Open it once in Safari and copy the full address from the bar, or just type the name.',
    };
  }

  const fromLink = link?.kind === 'link' ? link : null;
  const name = fromLink?.name || (fromLink ? 'Saved from a link' : text);

  let latitude = fromLink?.latitude ?? null;
  let longitude = fromLink?.longitude ?? null;
  let essentials = [];

  if (online()) {
    try {
      const city = state.trip?.locationName ? `, ${state.trip.locationName}` : '';
      const detail = await placeDetails(
        latitude != null ? { latitude, longitude } : { query: name + city }
      );
      if (detail) {
        if (latitude == null && detail.latitude != null) {
          latitude = detail.latitude;
          longitude = detail.longitude;
        }
        essentials = [
          detail.openingHours && { key: 'Hours', value: detail.openingHours, detail: 'From OpenStreetMap' },
          detail.phone && { key: 'Phone', value: detail.phone, detail: '' },
          detail.website && { key: 'Website', value: detail.website, detail: '' },
          detail.address && { key: 'Address', value: detail.address, detail: '' },
        ].filter(Boolean);
      }
    } catch {
      // Offline, or nothing known. It still saves.
    }
  }

  return {
    ok: true,
    name,
    latitude,
    longitude,
    essentials,
    fromLink: Boolean(fromLink),
    sourceLink: fromLink ? text : '',
  };
}

/** Saves a resolved input as a place record. */
function savePlaceRecord(resolved, { category, walkMinutes, stayMinutes, anchorPlaceID, isStop }) {
  const record = {
    id: uid('place-'),
    anchorPlaceID: anchorPlaceID || null,
    name: resolved.name,
    category: category || (isStop ? 'sight' : 'food'),
    priceTier: '—',
    stayMinutes: Number(stayMinutes) || (isStop ? 45 : 30),
    legs: isStop ? [] : [{ mode: 'walk', minutes: Number(walkMinutes) || 5 }],
    note: resolved.fromLink ? 'Added from a map link' : 'Added by you',
    isUserAdded: true,
    latitude: resolved.latitude,
    longitude: resolved.longitude,
    essentials: resolved.essentials,
    sourceLink: resolved.sourceLink,
    isStop: Boolean(isStop),
  };
  put('places', record);
  return record;
}

/** Adds a place to one stop's nearby list. */
export async function capturePlace({ input, category, walkMinutes, stayMinutes, anchorPlaceID }) {
  const resolved = await resolvePlaceInput(input);
  if (!resolved.ok) return { saved: false, reason: resolved.reason };

  const record = savePlaceRecord(resolved, { category, walkMinutes, stayMinutes, anchorPlaceID });
  return {
    saved: true,
    located: record.latitude != null,
    enriched: record.essentials.length > 0,
    name: record.name,
    id: record.id,
  };
}

/**
 * Adds a place to the itinerary as a stop. Same input, same lookup — the only
 * difference from capturePlace is that this one also creates the visit.
 */
export async function captureStop(dayNumber, { input, time, endTime = '', kind = 'main', placeID = null }) {
  // Picking something already saved skips the lookup entirely.
  const existing = placeID ? place(placeID) : null;
  const record = existing || await (async () => {
    const resolved = await resolvePlaceInput(input);
    if (!resolved.ok) return { error: resolved.reason };
    return savePlaceRecord(resolved, { isStop: true });
  })();

  if (record.error) return { saved: false, reason: record.error };

  addPlanItem(dayNumber, {
    name: record.name,
    time,
    placeID: record.id,
    kind,
    endTime,
  });
  return { saved: true, located: record.latitude != null, name: record.name, id: record.id };
}

/**
 * Item 01: lands a confirmed set of pasted rows on the itinerary.
 *
 * Nothing here touches the network. Typing six days of stops on a phone is
 * the thing worth avoiding, and a name plus a time is enough to be useful —
 * the position, the hours and the phone number can be filled in later by
 * opening the stop and pasting its map link, one at a time, and only for the
 * stops that turn out to matter. So this stays offline, and says so.
 */
/** A candidate's length, for seeding the place's stay estimate. */
function rowMinutes(row) {
  const from = parseClock(row.time);
  const to = parseClock(row.endTime);
  if (from == null || to == null) return 0;
  return to >= from ? to - from : (to + 1440) - from;
}

export async function importItinerary(rows, { sourceText = '' } = {}) {
  const wanted = (rows || []).filter((row) => row.include && String(row.name || '').trim());
  if (!wanted.length) return { added: 0, placesMade: 0, reused: 0, lengthened: 0 };

  // An itinerary longer than the trip lengthens the trip rather than losing
  // its last days.
  const longest = wanted.reduce((n, row) => Math.max(n, Number(row.dayNumber) || 1), 1);
  let lengthened = 0;
  if (state.trip && longest > (state.trip.dayCount || 0)) {
    lengthened = longest - (state.trip.dayCount || 0);
    await updateTrip({ dayCount: longest });
  }

  const byName = new Map(state.places.map((pl) => [pl.name.toLowerCase(), pl]));
  let added = 0;
  let placesMade = 0;
  let reused = 0;

  for (const row of wanted) {
    const name = String(row.name).trim();
    const key = name.toLowerCase();
    let record = byName.get(key);

    if (record) {
      reused += 1;
    } else {
      // A map link pasted on the row is the one thing that can give a stop a
      // position, and reading one needs no network at all.
      const link = row.link ? parseMapLink(String(row.link)) : null;
      const located = link?.kind === 'link' ? link : null;

      record = {
        id: uid('place-'),
        anchorPlaceID: null,
        name,
        category: 'sight',
        priceTier: '—',
        stayMinutes: rowMinutes(row) || 45,
        legs: [],
        note: String(row.note || '').trim() || 'Added from a pasted itinerary',
        isUserAdded: true,
        latitude: located?.latitude ?? null,
        longitude: located?.longitude ?? null,
        essentials: [],
        sourceLink: located ? String(row.link) : '',
        isStop: true,
      };
      put('places', record);
      byName.set(key, record);
      placesMade += 1;
    }

    const landed = addPlanItem(Number(row.dayNumber) || 1, {
      name: record.name,
      time: row.time || '',
      placeID: record.id,
      kind: row.kind === 'sub' ? 'sub' : 'main',
      endTime: row.endTime || '',
      note: String(row.note || '').trim(),
    });
    if (landed) added += 1;
  }

  // The pasted text stays with the trip, so a bad import can be re-read
  // rather than retyped.
  if (state.trip && sourceText) {
    putTrip({ ...state.trip, importedText: String(sourceText).slice(0, 20000), importedAt: new Date().toISOString() });
  }

  const unlocated = wanted.filter((row) => {
    const hit = byName.get(String(row.name).trim().toLowerCase());
    return hit && hit.latitude == null;
  }).length;

  return { added, placesMade, reused, lengthened, unlocated };
}

export async function addNearbyPlace({ name, category, walkMinutes, stayMinutes, anchorPlaceID }) {
  const label = String(name || '').trim();
  if (!label) return { saved: false };

  const anchor = anchorPlaceID || subRoute()?.anchorPlanItemID || null;
  const record = {
    id: uid('place-'),
    anchorPlaceID: anchor,
    name: label,
    category: category || 'food',
    priceTier: '—',
    stayMinutes: Number(stayMinutes) || 30,
    legs: [{ mode: 'walk', minutes: Number(walkMinutes) || 5 }],
    note: 'Added by you',
    isUserAdded: true,
    latitude: null,
    longitude: null,
  };

  let located = false;
  if (online()) {
    try {
      const city = state.trip?.locationName ? `, ${state.trip.locationName}` : '';
      const hit = await geocode(label + city, {
        latitude: state.trip?.latitude,
        longitude: state.trip?.longitude,
      });
      if (hit) {
        record.latitude = hit.latitude;
        record.longitude = hit.longitude;
        located = true;
      }
    } catch {
      // Offline or the lookup service is unreachable; saved without a pin.
    }
  }

  put('places', record);
  return { saved: true, located, id: record.id };
}

/**
 * Starts a sub route inside one lane. The window comes pre-filled from the
 * gap that was tapped and stays editable; the name is the only thing you
 * have to give it, and it can wait.
 */
export function addSubRoute(n = state.selectedDay, { name, depart, returnBy, startPlaceID, endPlaceID } = {}) {
  const from = parseClock(depart) ?? dayGaps(n)[0]?.from ?? 13 * 60 + 45;
  const to = parseClock(returnBy) ?? dayGaps(n)[0]?.to ?? from + 120;
  const part = from < 12 * 60 ? 'Morning' : from < 17 * 60 ? 'Afternoon' : 'Evening';

  // Both ends come from the day's stops, and they need not match.
  const stops = activeItems(day(n)).filter((i) => i.placeID);
  const before = [...stops].reverse().find((i) => (parseClock(i.time) ?? 0) <= from);
  const anchor = before || stops[0] || null;

  const route = {
    id: uid('loop-'),
    dayNumber: n,
    name: String(name || '').trim() || `${part} free time`,
    anchorPlanItemID: anchor?.id || null,
    anchorPlaceID: anchor?.placeID || null,
    anchorName: anchor?.name || 'this stop',
    startMinutes: from,
    deadlineMinutes: to,
    placeIDs: [],
    returnTarget: 'coach',
    returnMinutes: 8,
    startPlaceID: startPlaceID || anchor?.placeID || null,
    endPlaceID: endPlaceID || startPlaceID || anchor?.placeID || null,
    departMinutes: from,
    returnByMinutes: to,
  };
  put('subRoutes', route);
  state.loopID = route.id;
  notify();
  return route;
}

export function deleteSubRoute(id) {
  const route = subRouteByID(id);
  if (!route) return;
  if (state.loopID === id) state.loopID = null;
  removeWithUndo('subRoutes', id, `${route.name} deleted`);
}

export function toggleSubRoutePlace(placeId, handle) {
  const route = resolveLoop(handle) || addSubRoute(state.selectedDay);
  const ids = route.placeIDs || [];
  route.placeIDs = ids.includes(placeId) ? ids.filter((i) => i !== placeId) : [...ids, placeId];
  put('subRoutes', route);
}

export function reorderSubRoute(movedId, beforeId, handle) {
  const route = resolveLoop(handle);
  if (!route || movedId === beforeId) return;
  route.placeIDs = reorder(route.placeIDs, movedId, beforeId);
  put('subRoutes', route);
}

export function setReturn({ target, minutes }, handle) {
  const route = resolveLoop(handle);
  if (!route) return;
  if (target) route.returnTarget = target;
  if (minutes != null) route.returnMinutes = Math.max(0, Math.min(240, Number(minutes) || 0));
  put('subRoutes', route);
}

export function toggleBought(id) {
  const item = state.shopping.find((i) => i.id === id);
  if (!item) return;
  item.bought = !item.bought;
  // When and on which day, so the report can say "Aoi Camera Alley · 14:40"
  // and group the purchase under the day it actually happened on.
  if (item.bought) {
    const now = new Date();
    item.boughtAt = clock(now.getHours() * 60 + now.getMinutes());
    item.boughtDay = state.selectedDay;
  } else {
    item.boughtAt = null;
    item.boughtDay = null;
  }
  // Ticking stamps the purchase date; unticking clears it.
  item.boughtOn = item.bought ? new Date().toISOString().slice(0, 10) : null;
  put('shopping', item);
}

export function setPaid(id, text) {
  const item = state.shopping.find((i) => i.id === id);
  if (!item) return;
  item.paidAmount = numeric(text);
  put('shopping', item);
}

export function setPayment(id, method) {
  const item = state.shopping.find((i) => i.id === id);
  if (!item || !seed.PAYMENTS.some((p) => p.id === method)) return;
  item.payment = method;
  put('shopping', item);
}

export function setShoppingCategory(id, category) {
  const item = state.shopping.find((i) => i.id === id);
  if (!item || !seed.SHOP_CATEGORIES.some((c) => c.id === category)) return;
  item.category = category;
  put('shopping', item);
}

export function deleteShoppingItem(id) {
  const item = state.shopping.find((i) => i.id === id);
  removeWithUndo('shopping', id, item ? `${item.name} deleted` : 'Item deleted');
}

export function addShoppingItem({ name, placeLabel, estimate, payment, category, placeID }) {
  if (!name) return;
  const label = placeLabel || 'Unplanned · added on the trip';
  // Bind to the place when we can name one, so renaming it keeps the item.
  const bound = placeID
    || state.places.find((p) => p.name === label)?.id
    || null;
  const existing = state.shopping.filter((i) => i.placeLabel === label);
  const groupOrder = existing.length
    ? existing[0].groupOrder
    : Math.max(-1, ...state.shopping.map((i) => i.groupOrder)) + 1;
  put('shopping', {
    id: uid('item-'),
    name,
    detail: placeLabel ? '' : 'Added while travelling',
    placeLabel: label,
    placeWhen: placeLabel ? '' : 'Added while travelling',
    badge: 'none',
    placeID: bound,
    groupOrder,
    order: existing.length,
    estimate: estimate ?? null,
    paidAmount: null,
    payment: payment || 'cash',
    category: category || 'other',
    bought: false,
    boughtOn: null,
    isUnplanned: !placeLabel,
  });
}

export function toggleShot(id) {
  const shot = state.mustSee.find((s) => s.id === id);
  if (!shot) return;
  shot.captured = !shot.captured;
  put('mustSee', shot);
}

export function setShotImage(id, url) {
  const shot = state.mustSee.find((s) => s.id === id);
  if (!shot) return;
  shot.imagePath = url;
  put('mustSee', shot);
}

function outfitRecord(n) {
  return outfitFor(n) || { id: `day-${n}`, dayNumber: n, pieces: [] };
}

export function addOutfitPiece(piece, n = state.selectedDay) {
  const text = String(piece || '').trim();
  if (!text) return;
  const record = outfitRecord(n);
  if (record.pieces.includes(text)) return;
  record.pieces = [...record.pieces, text];
  put('outfits', record);
}

export function removeOutfitPiece(piece, n = state.selectedDay) {
  const record = outfitRecord(n);
  record.pieces = record.pieces.filter((p) => p !== piece);
  put('outfits', record);
}

export function togglePrepItem(id) {
  const item = state.prep.find((i) => i.id === id);
  if (!item) return;
  item.packed = !item.packed;
  put('prep', item);
}

export function cyclePackedIn(id) {
  const item = state.prep.find((i) => i.id === id);
  if (!item) return;
  const ids = seed.PACKED_LOCATIONS.map((l) => l.id);
  item.packedIn = ids[(ids.indexOf(item.packedIn) + 1) % ids.length];
  put('prep', item);
}

export function addPrepItem(category, name) {
  const text = String(name || '').trim();
  if (!text) return;
  const siblings = state.prep.filter((i) => i.category === category);
  put('prep', {
    id: uid('prep-'),
    category,
    categoryOrder: siblings[0]?.categoryOrder
      ?? Math.max(-1, ...state.prep.map((i) => i.categoryOrder)) + 1,
    order: siblings.length,
    name: text,
    why: '',
    packed: false,
    packedIn: 'notPacked',
  });
}

export function deletePrepItem(id) {
  const item = state.prep.find((i) => i.id === id);
  removeWithUndo('prep', id, item ? `${item.name} deleted` : 'Item deleted');
}

/** Removes a category and everything filed under it. */
export function deletePrepCategory(title) {
  for (const item of state.prep.filter((i) => i.category === title)) {
    remove('prep', item.id);
  }
  if (state.trip) {
    const kept = (state.trip.prepCategories || []).filter((c) => c !== title);
    putTrip({ ...state.trip, prepCategories: kept });
  }
}

export function deleteLogEntry(id) {
  const note = noteByID(id);
  removeWithUndo('log', id, note?.placeLabel ? `Note about ${note.placeLabel} deleted` : 'Note deleted');
}

export function deleteLogPhoto(entryID, url) {
  const entry = state.log.find((e) => e.id === entryID);
  if (!entry) return;
  entry.photoPaths = (entry.photoPaths || []).filter((p) => p !== url);
  entry.photoCount = entry.photoPaths.length;
  put('log', entry);
}

export function deletePlace(id) {
  const record = state.places.find((p) => p.id === id);
  // Take it out of any loop before the place itself goes — and remember
  // which loops held it, so undo puts it back where it was.
  const heldBy = [];
  for (const route of state.subRoutes) {
    if ((route.placeIDs || []).includes(id)) {
      heldBy.push(route.id);
      route.placeIDs = route.placeIDs.filter((p) => p !== id);
      put('subRoutes', route);
    }
  }
  const copy = record ? JSON.parse(JSON.stringify(record)) : null;
  remove('places', id);
  rememberUndo(record ? `${record.name} deleted` : 'Place deleted', () => {
    if (copy) put('places', copy);
    for (const routeID of heldBy) {
      const route = subRouteByID(routeID);
      if (route && !route.placeIDs.includes(id)) {
        route.placeIDs = [...route.placeIDs, id];
        put('subRoutes', route);
      }
    }
  });
}

/** Deletes a stop outright, as against archiving it. */
export function deletePlanItem(dayNumber, id) {
  const d = day(dayNumber);
  if (!d) return;
  const at = d.items.findIndex((i) => i.id === id);
  if (at < 0) return;
  const copy = JSON.parse(JSON.stringify(d.items[at]));
  d.items = d.items.filter((i) => i.id !== id);
  put('days', d);
  rememberUndo(`${copy.name} deleted`, () => {
    const back = day(dayNumber);
    if (!back) return;
    back.items = [...back.items.slice(0, at), copy, ...back.items.slice(at)];
    put('days', back);
  });
}

export function addPrepCategory(name) {
  const title = String(name || '').trim();
  if (!title || !state.trip) return;
  const existing = state.trip.prepCategories || seed.PREP_CATEGORIES;
  if (existing.includes(title)) return;
  putTrip({ ...state.trip, prepCategories: [...existing, title] });
}

/**
 * Writes one note. An id edits that note; without one a new note is made,
 * so a second note about the same place ten minutes later is a second note.
 */
export function saveNote({ id, dayNumber, time, placeID, placeLabel, text, photoPaths }) {
  const existing = id ? noteByID(id) : null;
  const now = new Date().toISOString();
  const photos = photoPaths || existing?.photoPaths || [];
  const at = parseClock(time);
  const record = {
    id: existing?.id || uid('note-'),
    dayNumber: dayNumber ?? existing?.dayNumber ?? state.selectedDay,
    time: at != null ? clock(at) : (existing?.time || clock(new Date().getHours() * 60 + new Date().getMinutes())),
    placeID: placeID === undefined ? (existing?.placeID ?? null) : (placeID || null),
    placeLabel: placeLabel !== undefined
      ? placeLabel
      : (placeID ? place(placeID)?.name : '') || existing?.placeLabel || '',
    text: String(text || ''),
    photoPaths: photos,
    photoCount: photos.length,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  put('log', record);
  return record;
}

// ------------------------------------------------------- trip and weather

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dayLabels(startDate, dayNumber) {
  const start = startDate ? new Date(startDate) : null;
  if (!start || Number.isNaN(start.getTime())) {
    return { dateLabel: `Day ${dayNumber}`, shortDate: `Day ${dayNumber}` };
  }
  const date = new Date(start);
  date.setDate(date.getDate() + dayNumber - 1);
  const short = `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  return { dateLabel: `${short} · ${DAY_NAMES[date.getDay()]}`, shortDate: short };
}

/** How the forecast strip should describe itself right now. */
export function weatherStatus() {
  const trip = state.trip;
  const coverage = forecastCoverage(trip?.startDate, trip?.dayCount || 0);
  if (coverage.covered) {
    return { live: true, line: weatherSourceLine() };
  }
  return {
    live: false,
    line: trip?.weatherUpdatedAt
      ? `Last forecast ${weatherSourceLine().replace('Forecast, updated ', '')} · ${coverage.reason}`
      : `No live forecast — ${coverage.reason}`,
  };
}

/**
 * Replaces the stored forecast with a real one when the trip is close enough
 * for a forecast to exist. Offline, or for a trip months away, the stored
 * figures stay and `weatherStatus` explains why.
 */
export async function refreshWeather({ force = false } = {}) {
  const trip = state.trip;
  if (!trip || !online()) return false;
  if (!forecastCoverage(trip.startDate, trip.dayCount).covered) return false;

  const age = trip.weatherUpdatedAt ? Date.now() - new Date(trip.weatherUpdatedAt).getTime() : Infinity;
  if (!force && age < 3 * 3600 * 1000) return false;

  try {
    const forecast = await fetchForecast({
      latitude: trip.latitude,
      longitude: trip.longitude,
      startDate: trip.startDate,
      dayCount: trip.dayCount,
    });
    if (!forecast.length) return false;
    putTrip({ ...state.trip, weather: forecast, weatherUpdatedAt: new Date().toISOString() });
    return true;
  } catch {
    return false;
  }
}

/** Pulls today's ECB rate for the trip's currency pair. */
export async function refreshRate() {
  const trip = state.trip;
  if (!trip || !online()) return { ok: false, reason: 'No connection' };
  try {
    const hit = await fetchRate(trip.currencyCode, trip.homeCurrencyCode);
    if (!hit) return { ok: false, reason: 'Set both currencies first' };
    putTrip({
      ...state.trip,
      homeCurrencyRate: hit.rate,
      rateUpdatedAt: new Date().toISOString(),
      rateSource: `ECB ${hit.date}`,
    });
    return { ok: true, rate: hit.rate };
  } catch (error) {
    return { ok: false, reason: error.message || 'That rate could not be fetched' };
  }
}

export function rateLine() {
  const trip = state.trip;
  if (!trip) return '';
  const pair = `1 ${trip.homeCurrencyCode} = ${trip.homeCurrencyRate} ${trip.currencyCode}`;
  return trip.rateSource ? `${pair} · ${trip.rateSource}` : `${pair} · rate you entered`;
}

/**
 * Trip settings. Changing the dates or the length rebuilds the day rows,
 * keeping whatever is already planned on the days that still exist.
 */
export async function updateTrip(patch) {
  if (!state.trip) return;
  const next = { ...state.trip, ...patch };
  const datesChanged = patch.startDate !== undefined || patch.dayCount !== undefined;

  if (patch.locationName && patch.locationName !== state.trip.locationName && online()) {
    try {
      const hit = await geocode(patch.locationName);
      if (hit) {
        next.latitude = hit.latitude;
        next.longitude = hit.longitude;
      }
    } catch {
      // Keep the old coordinates; the map still works.
    }
  }

  if (datesChanged) {
    next.dayCount = Math.max(1, Math.min(60, Number(next.dayCount) || 1));
    // Dates moved, so the stored forecast no longer describes these days.
    next.weather = [];
    next.weatherUpdatedAt = null;
    syncDays(next);
    if (state.selectedDay > next.dayCount) state.selectedDay = next.dayCount;
  }

  putTrip(next);
  if (datesChanged) refreshWeather({ force: true }).catch(() => {});
}

/** Adds, removes and re-labels day rows to match the trip's dates. */
function syncDays(trip) {
  for (let n = 1; n <= trip.dayCount; n++) {
    const labels = dayLabels(trip.startDate, n);
    const existing = state.days.find((d) => d.dayNumber === n);
    put('days', existing
      ? { ...existing, ...labels }
      : { id: `day-${n}`, dayNumber: n, ...labels, areaSpan: '', items: [] });
  }
  for (const day of state.days.filter((d) => d.dayNumber > trip.dayCount)) {
    remove('days', day.id);
  }
}

/**
 * Empties the trip of content but keeps its settings — the way to turn the
 * demo trip that ships with the app into your own. Everything it deletes is
 * listed on the button, because none of it comes back.
 */
export function clearTripContent() {
  for (const kind of ['places', 'subRoutes', 'shopping', 'mustSee', 'prep', 'log', 'outfits']) {
    for (const row of [...state[kind]]) remove(kind, row.id);
  }
  for (const day of [...state.days]) {
    put('days', { ...day, areaSpan: '', items: [] });
  }
  if (state.trip) putTrip({ ...state.trip, prepCategories: [] });
}

// Re-exported so screens can format without importing two modules.
export { clock, duration, money };
export const stamp = dateStamp;
