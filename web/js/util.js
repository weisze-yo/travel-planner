// Small helpers shared by every screen. No framework: screens render an HTML
// string and then bind their own handlers.

/** Escapes text for safe interpolation into markup. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/**
 * Tagged template that escapes every interpolation, so a place name typed with
 * an angle bracket can never break the markup. Wrap trusted markup in `raw()`
 * to opt out; arrays are joined.
 */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    out += render(values[i]) + strings[i + 1];
  }
  return raw(out);
}

function render(value) {
  if (value == null || value === false) return '';
  if (Array.isArray(value)) return value.map(render).join('');
  if (value instanceof Raw) return value.value;
  return esc(value);
}

class Raw {
  constructor(value) { this.value = String(value ?? ''); }
  toString() { return this.value; }
}

/** Marks a string as already-safe markup. */
export function raw(value) {
  return value instanceof Raw ? value : new Raw(value);
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * Click delegation. `root.on('[data-act="x"]', fn)` fires with the matched
 * element, so re-rendering never leaves stale listeners behind.
 */
export function delegate(root, selector, handler, event = 'click') {
  root.addEventListener(event, (e) => {
    const hit = e.target.closest(selector);
    if (hit && root.contains(hit)) handler(hit, e);
  });
}

/** "13:45" from minutes past midnight. */
export function clock(minutes) {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}

/** Minutes past midnight from "13:45". Returns null when unparseable. */
export function parseClock(text) {
  const hit = /^\s*(\d{1,2})\s*[:.]?\s*(\d{2})\s*$/.exec(String(text ?? ''));
  if (!hit) return null;
  const h = Number(hit[1]);
  const m = Number(hit[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

/** "1h 20m" / "45 min", matching the prototype's phrasing. */
export function duration(minutes) {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h ${rest}m` : `${h}h`;
}

/**
 * Minutes from the durations people actually type: "45", "45m", "1h",
 * "2h15", "2h 15m", "1.5h", "90 min", "1 小时". Returns null when there is
 * nothing to read, so "no duration set" stays different from "zero minutes".
 */
export function parseDuration(text) {
  const input = String(text ?? '').trim().toLowerCase();
  if (!input) return null;

  // "2h15" / "1h 30m" / "2 hrs" — hours with optional minutes.
  const hm = /^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours|小时|時間)\s*(\d{1,2})?\s*(?:m|min|mins|minute|minutes|分)?$/.exec(input);
  if (hm) return Math.round(Number(hm[1]) * 60) + (hm[2] ? Number(hm[2]) : 0);

  // "45m" / "45 min" / "45 分钟" / a bare "45".
  const m = /^(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes|分钟|分鐘|分)?$/.exec(input);
  if (m) return Math.round(Number(m[1]));

  return null;
}

/** Keeps a typed number inside a range that formatting can handle. */
export function boundedNumber(value, max = 1e9) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(n, 0), max);
}

/** "¥5,000" */
export function money(amount, symbol = '¥') {
  return symbol + Math.round(boundedNumber(amount, 1e12)).toLocaleString('en-US');
}

/** Strips everything but digits and a decimal point out of typed input. */
export function numeric(text) {
  const cleaned = String(text ?? '').replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? boundedNumber(n) : null;
}

export function dateStamp(date = new Date()) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export const uid = (prefix = 'x') => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Moves an item within an array by id, dropping it in front of `beforeId`. */
export function reorder(list, movedId, beforeId) {
  const from = list.indexOf(movedId);
  const to = list.indexOf(beforeId);
  if (from < 0 || to < 0 || from === to) return list.slice();
  const next = list.slice();
  next.splice(from, 1);
  next.splice(next.indexOf(beforeId) + (from < to ? 1 : 0), 0, movedId);
  return next;
}

// ------------------------------------------------------------------- icons

export const icon = {
  back: '<svg width="11" height="18" viewBox="0 0 11 18"><path d="M9 1L2 9l7 8" stroke="#14201C" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close: '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 2l12 12M14 2L2 14" stroke="#14201C" stroke-width="2" stroke-linecap="round"/></svg>',
  chevron: '<svg width="7" height="12" viewBox="0 0 7 12"><path d="M1 1l5 5-5 5" stroke="#98A5A0" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
  caret: '<svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="#6B7A74" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
  pencil: (color = '#fff', size = 19) => `<svg width="${size}" height="${size}" viewBox="0 0 14 14"><path d="M9.5 1.5l3 3L5 12H2v-3z" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  grip: '<svg width="16" height="12" viewBox="0 0 16 12"><g stroke="#98A5A0" stroke-width="2" stroke-linecap="round"><path d="M2 2h12M2 6h12M2 10h12"/></g></svg>',
  tick: (color = '#fff', w = 11) => `<svg width="${w}" height="${w * 0.82}" viewBox="0 0 11 9"><path d="M1 4.5L4 7.5 10 1" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  sort: (color = '#3D4C46') => `<svg width="15" height="15" viewBox="0 0 15 15"><g stroke="${color}" stroke-width="1.8" stroke-linecap="round"><path d="M2 4h11M2 7.5h7M2 11h4"/></g></svg>`,
  gear: '<svg width="17" height="17" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2.6" stroke="#14201C" stroke-width="1.6"/><path d="M9 1.8v1.6M9 14.6v1.6M2.9 9H1.3M16.7 9h-1.6M4.7 4.7L3.5 3.5M14.5 14.5l-1.2-1.2M13.3 4.7l1.2-1.2M3.5 14.5l1.2-1.2" stroke="#14201C" stroke-width="1.6" stroke-linecap="round"/></svg>',
  bin: '<svg width="15" height="16" viewBox="0 0 15 16" fill="none"><path d="M2 4h11M6 2h3M5.5 4v9M9.5 4v9M3 4l.7 10h7.6L12 4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  pin: '<svg width="11" height="13" viewBox="0 0 11 13"><path d="M5.5 1C3 1 1 3 1 5.5C1 9 5.5 12 5.5 12S10 9 10 5.5C10 3 8 1 5.5 1z" fill="none" stroke="#98A5A0" stroke-width="1.4"/></svg>',
  tabMap: (c) => `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 18s6-5.2 6-10A6 6 0 0 0 4 8c0 4.8 6 10 6 10z" stroke="${c}" stroke-width="1.7" stroke-linejoin="round"/><circle cx="10" cy="8" r="2.2" stroke="${c}" stroke-width="1.7"/></svg>`,
  tabPlan: (c) => `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><g stroke="${c}" stroke-width="1.7" stroke-linecap="round"><path d="M3 5.5h14M3 10h14M3 14.5h9"/></g></svg>`,
  tabShop: (c) => `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4.5 6.5h11l-1 10h-9l-1-10z" stroke="${c}" stroke-width="1.7" stroke-linejoin="round"/><path d="M7.5 6.5V5a2.5 2.5 0 0 1 5 0v1.5" stroke="${c}" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  tabPrep: (c) => `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3.5" y="6" width="13" height="10.5" rx="2" stroke="${c}" stroke-width="1.7"/><path d="M7.5 6V4.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V6" stroke="${c}" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  tabLog: (c) => `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M13 3.5l3.5 3.5L7 16.5H3.5V13z" stroke="${c}" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
};
