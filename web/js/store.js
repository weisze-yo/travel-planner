// One source of truth for the trip. Screens read derived values off it and
// call mutations; every mutation updates memory, writes through to the
// backend, and notifies subscribers to re-render.

import * as seed from './data.js';
import { createBackend, isConfigured, readActiveTripID, writeActiveTripID, KINDS } from './persist.js';
import { prepare, storedLength } from './photos.js';
import { fetchForecast, forecastCoverage, fetchRate, geocode, online, parseMapLink, placeDetails } from './net.js';
import { clock, duration, money, numeric, parseClock, uid, reorder, dateStamp } from './util.js';

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
  editingPlan: false,
  nearbySort: 'travelTime',
  nearbyCategory: 'all',
  shopDay: 'all',
  shopPlace: 'all',
  spendGroupBy: 'category',
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
  await unifyPlaces();
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

  if (changed) sortAll();
}

function emptySnapshot(tripID) {
  return {
    trip: { ...JSON.parse(JSON.stringify(seed.TRIP)), id: tripID, name: 'New trip', weather: [] },
    days: [], places: [], subRoutes: [], shopping: [],
    mustSee: [], prep: [], log: [], outfits: [],
  };
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
  state.log.sort((a, b) => a.dayNumber - b.dayNumber);
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

export const subRoute = (n = state.selectedDay) => state.subRoutes.find((r) => r.dayNumber === n) || null;

/**
 * Walks the loop: each leg adds travel time, each stop adds its stay, and the
 * journey back is checked against the coach departure.
 */
/**
 * When the loop has to be over. The traveller's own figure wins; otherwise it
 * is read off the itinerary — the end of the anchor stop's window, or the next
 * stop's time — so moving the coach moves the deadline with it.
 */
export function subRouteDeadline(n = state.selectedDay) {
  const route = subRoute(n);
  if (!route) return null;
  if (route.returnByMinutes != null) return route.returnByMinutes;

  const day = state.days.find((d) => d.dayNumber === n);
  const items = (day?.items || []).filter((i) => !i.archived && !i.isSubRouteSummary);
  const anchor = items.find((i) => i.placeID === route.anchorPlaceID || i.id === route.anchorPlanItemID);

  const windowEnd = parseClock(String(anchor?.windowLabel || '').split(/[–-]/)[1]);
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

/** When the loop starts: the traveller's figure, else the itinerary's. */
export function subRouteStart(n = state.selectedDay) {
  const route = subRoute(n);
  if (!route) return null;
  if (route.departMinutes != null) return route.departMinutes;

  const day = state.days.find((d) => d.dayNumber === n);
  const summary = (day?.items || []).find((i) => i.isSubRouteSummary && !i.archived);
  const anchor = (day?.items || []).find((i) => i.placeID === route.anchorPlaceID || i.id === route.anchorPlanItemID);
  return parseClock(summary?.time) ?? parseClock(anchor?.time) ?? route.startMinutes;
}

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
export function subSchedule(n = state.selectedDay) {
  const route = subRoute(n);
  const result = {
    stops: [], travelMinutes: 0, stayEstimate: 0,
    departMinutes: 0, returnByMinutes: 0,
    availableMinutes: 0, spendableMinutes: 0,
    exists: Boolean(route),
    startPlace: null, endPlace: null,
  };
  if (!route) return result;

  const depart = subRouteStart(n) ?? 0;
  const returnBy = subRouteDeadline(n) ?? depart;
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

/** Everywhere the loop could start or end: the day's stops, in order. */
export function loopEndpointOptions(n = state.selectedDay) {
  return activeItems(day(n))
    .filter((item) => !item.isSubRouteSummary && item.placeID)
    .map((item) => ({ id: item.placeID, label: item.name, time: item.time }));
}

export function renameSubRoute(name, n = state.selectedDay) {
  const route = subRoute(n);
  if (!route) return;
  route.name = String(name || '').trim() || 'My sub route';
  put('subRoutes', route);
}

export function setSubRouteEndpoints({ startPlaceID, endPlaceID }, n = state.selectedDay) {
  const route = subRoute(n);
  if (!route) return;
  if (startPlaceID !== undefined) route.startPlaceID = startPlaceID || null;
  if (endPlaceID !== undefined) route.endPlaceID = endPlaceID || null;
  put('subRoutes', route);
}

/** The two times the traveller owns: when they leave and when they must be back. */
export function setSubRouteTimes({ depart, returnBy }, n = state.selectedDay) {
  const route = subRoute(n);
  if (!route) return;
  if (depart !== undefined) route.departMinutes = parseClock(depart);
  if (returnBy !== undefined) route.returnByMinutes = parseClock(returnBy);
  put('subRoutes', route);
}

export function subSummaryLine(n = state.selectedDay) {
  const names = subSchedule(n).stops.map((s) => s.place.name);
  return names.length ? names.join(' → ') : 'Tap + to add places';
}

/** The "My sub route · N stops" row reads live, so editing the loop shows up. */
export function decoratedItem(item, n = state.selectedDay) {
  if (!item.isSubRouteSummary) return item;
  const schedule = subSchedule(n);
  const count = schedule.stops.length;
  const km = ((schedule.travelMinutes * 80) / 1000).toFixed(1);
  return {
    ...item,
    name: (subRoute(n)?.name || 'My sub route') + (count ? ` · ${count} stop${count === 1 ? '' : 's'}` : ''),
    note: count ? `${subSummaryLine(n)}.` : 'No stops picked yet — open Nearby to add some.',
    durationLabel: count ? duration(schedule.availableMinutes) : '',
    chips: count ? [`${km} km walk`] : [],
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
    if (item.isSubRouteSummary) continue;
    const places = nearbyPlaces(item.id);
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

export const isInSubRoute = (placeId, n = state.selectedDay) =>
  (subRoute(n)?.placeIDs || []).includes(placeId);

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
  for (const stop of subSchedule().stops) {
    const label = `${stop.place.name} (sub)`;
    if (!labels.includes(label)) labels.push(label);
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

export const logEntry = (n) => state.log.find((e) => e.dayNumber === n) || null;

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

export function setPlanItemTime(dayNumber, id, text) {
  const d = day(dayNumber);
  const item = d?.items.find((i) => i.id === id);
  if (!item) return;
  item.time = text;
  writeDay(d);
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

export function addPlanItem(dayNumber, { name, time, placeID = null, kind = 'main' }) {
  const d = day(dayNumber);
  if (!d || !name) return;
  const source = placeID ? place(placeID) : null;
  d.items = [...(d.items || []), {
    id: uid('stop-'),
    time: time || '15:00',
    durationLabel: '',
    name,
    subtitle: '',
    note: source?.note || '',
    summary: source?.note || '',
    windowLabel: '',
    chips: [],
    essentials: source?.essentials || [],
    kind: kind === 'sub' ? 'sub' : 'main',
    isSubRouteSummary: false,
    placeID,
    latitude: source?.latitude ?? null,
    longitude: source?.longitude ?? null,
    archived: false,
    movedToDay: null,
  }];
  d.items.sort(byClock);
  writeDay(d);
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
export async function captureStop(dayNumber, { input, time, kind = 'main', placeID = null }) {
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
  });
  return { saved: true, located: record.latitude != null, name: record.name, id: record.id };
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

export function toggleSubRoutePlace(placeId, n = state.selectedDay) {
  let route = subRoute(n);
  if (!route) {
    const anchor = activeItems(day(n)).find((i) => i.kind === 'main' && i.placeID);
    route = {
      id: `day-${n}`,
      dayNumber: n,
      anchorPlanItemID: anchor?.id || 'nishi',
      anchorName: anchor?.name || 'this stop',
      startMinutes: parseClock(anchor?.time) ?? 13 * 60 + 45,
      deadlineMinutes: (parseClock(anchor?.time) ?? 13 * 60 + 45) + 120,
      placeIDs: [],
      returnTarget: 'coach',
      returnMinutes: 8,
      name: 'My sub route',
      startPlaceID: anchor?.placeID || null,
      endPlaceID: anchor?.placeID || null,
      departMinutes: null,
      returnByMinutes: null,
    };
  }
  const ids = route.placeIDs || [];
  route.placeIDs = ids.includes(placeId) ? ids.filter((i) => i !== placeId) : [...ids, placeId];
  put('subRoutes', route);
}

export function reorderSubRoute(movedId, beforeId, n = state.selectedDay) {
  const route = subRoute(n);
  if (!route || movedId === beforeId) return;
  route.placeIDs = reorder(route.placeIDs, movedId, beforeId);
  put('subRoutes', route);
}

export function setReturn({ target, minutes }, n = state.selectedDay) {
  const route = subRoute(n);
  if (!route) return;
  if (target) route.returnTarget = target;
  if (minutes != null) route.returnMinutes = Math.max(0, Math.min(240, Number(minutes) || 0));
  put('subRoutes', route);
}

export function toggleBought(id) {
  const item = state.shopping.find((i) => i.id === id);
  if (!item) return;
  item.bought = !item.bought;
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
  remove('shopping', id);
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
  remove('prep', id);
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
  remove('log', id);
}

export function deleteLogPhoto(entryID, url) {
  const entry = state.log.find((e) => e.id === entryID);
  if (!entry) return;
  entry.photoPaths = (entry.photoPaths || []).filter((p) => p !== url);
  entry.photoCount = entry.photoPaths.length;
  put('log', entry);
}

export function deletePlace(id) {
  // Take it out of any loop before the place itself goes.
  for (const route of state.subRoutes) {
    if ((route.placeIDs || []).includes(id)) {
      route.placeIDs = route.placeIDs.filter((p) => p !== id);
      put('subRoutes', route);
    }
  }
  remove('places', id);
}

/** Deletes a stop outright, as against archiving it. */
export function deletePlanItem(dayNumber, id) {
  const d = day(dayNumber);
  if (!d) return;
  d.items = d.items.filter((i) => i.id !== id);
  put('days', d);
}

export function addPrepCategory(name) {
  const title = String(name || '').trim();
  if (!title || !state.trip) return;
  const existing = state.trip.prepCategories || seed.PREP_CATEGORIES;
  if (existing.includes(title)) return;
  putTrip({ ...state.trip, prepCategories: [...existing, title] });
}

export function saveNote({ dayNumber, destinationLabel, destinationPlaceID, text, photoPaths }) {
  const d = day(dayNumber);
  const existing = logEntry(dayNumber);
  const spend = state.shopping
    .filter((i) => i.bought)
    .reduce((sum, i) => sum + (i.paidAmount ?? i.estimate ?? 0), 0);

  const chips = [];
  const shots = state.mustSee.filter((s) => s.captured).length;
  if (shots) chips.push({ label: `${shots} of ${state.mustSee.length} must-see ✓`, tone: 'jade' });
  if (spend) chips.push({ label: `${money(spend, state.trip?.currencySymbol || '¥')} spent`, tone: 'neutral' });

  put('log', {
    id: `day-${dayNumber}`,
    dayNumber,
    dayLabel: `Day ${dayNumber}`,
    dateLabel: d?.shortDate || existing?.dateLabel || '',
    meta: existing?.metaIsLive ? existing.meta : `${activeItems(d).length} stops`,
    metaIsLive: Boolean(existing?.metaIsLive),
    destinationLabel: destinationLabel || existing?.destinationLabel || '',
    destinationPlaceID: destinationPlaceID || null,
    text: String(text || ''),
    photoCount: (photoPaths || []).length || existing?.photoCount || 0,
    photoPaths: photoPaths || existing?.photoPaths || [],
    chips: chips.length ? chips : (existing?.chips || []),
  });
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
