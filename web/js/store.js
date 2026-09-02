// One source of truth for the trip. Screens read derived values off it and
// call mutations; every mutation updates memory, writes through to the
// backend, and notifies subscribers to re-render.

import * as seed from './data.js';
import { createBackend, KINDS } from './persist.js';
import { clock, duration, money, numeric, parseClock, uid, reorder, dateStamp } from './util.js';

const listeners = new Set();

export const state = {
  ready: false,
  mode: 'local',
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
};

let backend = null;

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn();
}

// ------------------------------------------------------------------ lifecycle

export async function boot() {
  backend = await createBackend();
  state.mode = backend.mode;

  let snapshot = await backend.loadAll();
  if (!snapshot || !snapshot.trip) {
    snapshot = freshSnapshot();
    await backend.seed(snapshot);
  }
  apply(snapshot);

  state.selectedDay = state.trip?.currentDay || 3;
  state.ready = true;

  backend.onRemoteChange((kind, value) => {
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

export function uploadPhoto(file, path) {
  return backend ? backend.uploadPhoto(file, path) : Promise.reject(new Error('no backend'));
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
export function subSchedule(n = state.selectedDay) {
  const route = subRoute(n);
  const result = {
    stops: [], movingMinutes: 0, stayMinutes: 0,
    returnClock: 0, bufferMinutes: 0, startMinutes: 0, exists: Boolean(route),
  };
  if (!route) return result;

  let running = route.startMinutes;
  result.startMinutes = route.startMinutes;

  (route.placeIDs || []).forEach((id, index) => {
    const p = place(id);
    if (!p) return;
    const travel = (p.legs || []).reduce((sum, l) => sum + l.minutes, 0);
    running += travel;
    result.movingMinutes += travel;
    const arrival = running;
    running += p.stayMinutes;
    result.stayMinutes += p.stayMinutes;
    result.stops.push({ index: index + 1, place: p, arrival });
  });

  const back = Number(route.returnMinutes) || 0;
  result.movingMinutes += back;
  result.returnClock = running + back;
  result.bufferMinutes = route.deadlineMinutes - result.returnClock;
  return result;
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
  const km = ((schedule.movingMinutes * 80) / 1000).toFixed(1);
  return {
    ...item,
    name: count ? `My sub route · ${count} stop${count === 1 ? '' : 's'}` : 'My sub route',
    note: count ? `${subSummaryLine(n)}.` : 'No stops picked yet — open Nearby to add some.',
    durationLabel: count ? duration(schedule.movingMinutes + schedule.stayMinutes) : '',
    chips: count ? [`${km} km walk`] : [],
  };
}

export const categoryLabel = (category) => seed.CATEGORY_LABELS[category] || category;

/** Every candidate hanging off one main-route stop. */
export function nearbyPlacesFor(anchorPlaceID) {
  if (!anchorPlaceID) return state.places;
  const anchored = state.places.filter((p) => p.anchorPlaceID === anchorPlaceID);
  // A trip imported without anchors should still show its pool.
  return anchored.length ? anchored : state.places;
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

export function shoppingGroups() {
  const groups = [];
  for (const item of state.shopping) {
    let group = groups.find((g) => g.placeLabel === item.placeLabel);
    if (!group) {
      group = { placeLabel: item.placeLabel, when: item.placeWhen, badge: item.badge, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

export function spendTotals() {
  let spent = 0, planned = 0, bought = 0;
  const byPayment = {};
  for (const p of seed.PAYMENTS) byPayment[p.id] = { count: 0, sum: 0 };

  for (const item of state.shopping) {
    planned += item.estimate || 0;
    if (!item.bought) continue;
    bought += 1;
    // A ticked item with no real price falls back to its estimate.
    const amount = item.paidAmount ?? item.estimate ?? 0;
    spent += amount;
    const bucket = byPayment[item.payment] || byPayment.cash;
    bucket.count += 1;
    bucket.sum += amount;
  }

  const rate = state.trip?.homeCurrencyRate || 1;
  return {
    spent, planned, bought,
    total: state.shopping.length,
    byPayment,
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

export function addPlanItem(dayNumber, { name, time, placeID = null }) {
  const d = day(dayNumber);
  if (!d || !name) return;
  const source = placeID ? place(placeID) : null;
  d.items = [...(d.items || []), {
    id: uid('stop-'),
    time: time || '15:00',
    durationLabel: '',
    name,
    subtitle: '',
    note: 'Added by you',
    summary: source?.note || '',
    windowLabel: '',
    chips: [],
    kind: 'sub',
    isSubRouteSummary: false,
    placeID,
    essentials: [],
    latitude: source?.latitude ?? null,
    longitude: source?.longitude ?? null,
    archived: false,
    movedToDay: null,
  }];
  d.items.sort(byClock);
  writeDay(d);
}

export function addNearbyPlace({ name, category, walkMinutes }) {
  if (!name) return;
  put('places', {
    id: uid('place-'),
    anchorPlaceID: subRoute()?.anchorPlanItemID || 'nishi',
    name,
    category: category || 'food',
    priceTier: '—',
    stayMinutes: 30,
    legs: [{ mode: 'walk', minutes: Number(walkMinutes) || 5 }],
    note: 'Added by you',
    isUserAdded: true,
    latitude: null,
    longitude: null,
  });
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

export function cyclePayment(id) {
  const item = state.shopping.find((i) => i.id === id);
  if (!item) return;
  const ids = seed.PAYMENTS.map((p) => p.id);
  item.payment = ids[(ids.indexOf(item.payment) + 1) % ids.length];
  put('shopping', item);
}

export function addShoppingItem({ name, placeLabel, estimate, payment }) {
  if (!name) return;
  const label = placeLabel || 'Unplanned · added on the trip';
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
    groupOrder,
    order: existing.length,
    estimate: estimate ?? null,
    paidAmount: null,
    payment: payment || 'cash',
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

// Re-exported so screens can format without importing two modules.
export { clock, duration, money };
export const stamp = dateStamp;
