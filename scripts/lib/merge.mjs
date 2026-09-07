// Builds the whole Trip 12 snapshot in memory, from the research bundle.
//
// Nothing in this file touches Firestore, or imports anything that can. That
// is deliberate: it is what lets `--dry-run` be a real dry run rather than a
// promise. The importer takes the object this returns and writes it; the dry
// run takes the same object and prints it.
//
// The merge is FIELD-WISE, not document-replacing, and that is not a stylistic
// choice. 51 of the seed's shopping ids are re-emitted by later batches with no
// `category` key. A document-level replace would drop `souvenir` from 95 of the
// 96 shopping items, and because `SHOP_CATEGORIES` filters on that field they
// would vanish from the shop screen with no error at all.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { PREP_CATEGORY_ORDER, PREP_ASSIGNMENTS } from './prep-categories.mjs';

export const TRIP_ID = 'vitrox-trip12-tohoku';

/**
 * The id convention (decision B2).
 *
 * The seed's stop ids were content-hashed from (day, name) by `to_app_seed.py`,
 * which did not ship with the bundle and could not be reproduced. So this is a
 * NEW convention matching the old shape — 12 lowercase hex — declared here and
 * frozen. Ids are data from here on, never recomputed at import time: a rename
 * that silently re-hashes is exactly what orphaned 20 places when four hotels
 * changed on 4 September.
 */
export const sid = (kind, ...parts) => createHash('sha256')
  .update([kind, ...parts].map((p) => String(p).normalize('NFC').trim()).join('|'))
  .digest('hex')
  .slice(0, 12);

/** The four superseded hotels, and Ginza. Frozen — see PHASE_LOG.md B2. */
export const NEW_STOPS = [
  {
    id: 'a71e35e75317', day: 2, name: 'Ooedo Onsen Monogatari Naruko Onsen Kounkaku',
    time: '18:30', windowLabel: '', subtitle: 'Night 2 · Naruko Onsen',
    latitude: 38.748074, longitude: 140.726532, replaces: 'Hotel Kameya, Naruko Onsen',
  },
  {
    id: '7d9bf6b4f593', day: 3, name: 'Mercure Miyagi Zao Resort & Spa',
    time: '17:15', windowLabel: '', subtitle: 'Night 3 · Zao, Miyagi',
    latitude: 38.13185, longitude: 140.56068, replaces: 'Okuiizaka Anabara Onsen Yoshikawaya',
  },
  {
    id: 'b0e04f3c52d4', day: 4, name: 'Kinugawa Onsen Hana no Yado Matsuya',
    time: '18:20', windowLabel: '', subtitle: 'Night 4 · Kinugawa Onsen',
    latitude: 36.840755, longitude: 139.721939, replaces: 'Ooedo Onsen Monogatari Premium Kinugawa Kanko Hotel',
  },
  {
    // Decision A6: a main stop, not a backup. The 13:45 start deliberately
    // overlaps Shisui's 14:30 and that overlap IS the signal — the owner
    // resolves it by editing the plan. No chip (decision B8): `PlanItem.chips`
    // is never read by the web client anyway, and inventing a label for a
    // schedule the timeline already shows would be a second, weaker signal.
    id: '03776664f553', day: 7, name: 'Ginza',
    time: '13:45', windowLabel: '13:45 – 16:15', subtitle: 'Day 7 · alternative to Shisui',
    latitude: 35.669445, longitude: 139.763351, replaces: null,
  },
];

/**
 * The outbound and return travel, which the itinerary batches never covered.
 *
 * The research holds these only as prose — `trip.x.flights` and each day's
 * `x.summary` — so the days rendered as if the trip began at Haneda at 21:55
 * and ended at an untimed Narita. Every flight number and time here is copied
 * from `trip.x.flights` and cross-checks against the day summaries:
 *
 *   out   SQ131 PEN 10:15 -> SIN 11:45     SQ634 SIN 13:55 -> HND 21:55
 *   home  SQ637 NRT 10:55 -> SIN 16:55     SQ142 SIN 19:10 -> PEN 20:35
 *
 * `kind` stays `main` because they are on the main route; what marks them as
 * travel rather than sightseeing is `x.stopKind`, which the seed already uses
 * with exactly these values (`airport`, `transit`, `hotel`, `sight`).
 */
export const TRAVEL_LEGS = [
  // ---- Day 1, outbound. The existing Haneda T3 stop at 21:55 is the arrival,
  // so it is not repeated here; only the coach transfer after it is added.
  { day: 1, time: '07:00', name: 'Assembly · Penang International Airport',
    durationLabel: 'assemble', stopKind: 'airport',
    latitude: 5.2971, longitude: 100.2769,
    note: 'Check-in counter by 07:00. Baggage 25 kg checked, 7 kg hand-carry, one piece. '
        + 'Register on Visit Japan Web before flying — Malaysian ePassport holders are visa-free for 90 days.' },
  { day: 1, time: '10:15', name: 'SQ131 · Penang (PEN) → Singapore (SIN)',
    durationLabel: 'flight', stopKind: 'transit',
    latitude: 5.2971, longitude: 100.2769, note: 'Departs 10:15, lands Singapore 11:45.' },
  { day: 1, time: '11:45', name: 'Arrive Singapore Changi — connection to SQ634',
    durationLabel: 'connection', stopKind: 'airport',
    latitude: 1.3644, longitude: 103.9915,
    note: 'A 55-minute connection before SQ634. Stay airside.' },
  { day: 1, time: '13:55', name: 'SQ634 · Singapore (SIN) → Tokyo Haneda (HND)',
    durationLabel: 'flight', stopKind: 'transit',
    latitude: 1.3644, longitude: 103.9915,
    note: 'Departs 13:55, lands Haneda 21:55. About 20h 20m door to door from Penang.' },
  // Shares 21:55 with the Haneda arrival on purpose: the coach leaves once the
  // group is through the terminal, and no source gives that clock time. The
  // sort is stable, so it stays directly after the arrival it belongs to.
  { day: 1, time: '21:55', name: 'Tour bus to Hotel Metropolitan Tokyo Haneda',
    durationLabel: '~5 min', stopKind: 'transit',
    latitude: 35.549298, longitude: 139.754715,
    note: 'After immigration and baggage reclaim. The hotel is inside Haneda Innovation City, about five minutes by coach.' },

  // ---- Day 8, home.
  { day: 8, time: '06:30', name: 'Depart International Resort Hotel Yurakujo for Narita',
    durationLabel: 'coach', stopKind: 'transit',
    latitude: 35.74406, longitude: 140.34459, note: 'Breakfast at 06:30, then a short coach to Narita.' },
  { day: 8, time: '10:55', name: 'SQ637 · Tokyo Narita (NRT) → Singapore (SIN)',
    durationLabel: 'flight', stopKind: 'transit',
    latitude: 35.7725, longitude: 140.3862,
    note: 'Departs Narita Terminal 1 at 10:55, lands Singapore 16:55.' },
  { day: 8, time: '16:55', name: 'Arrive Singapore Changi — connection to SQ142',
    durationLabel: 'connection', stopKind: 'airport',
    latitude: 1.3644, longitude: 103.9915, note: 'A 2h15 connection before SQ142.' },
  { day: 8, time: '19:10', name: 'SQ142 · Singapore (SIN) → Penang (PEN)',
    durationLabel: 'flight', stopKind: 'transit',
    latitude: 1.3644, longitude: 103.9915, note: 'Departs 19:10, lands Penang 20:35.' },
  { day: 8, time: '20:35', name: 'Arrive Penang International (PEN)',
    durationLabel: 'arrive', stopKind: 'airport',
    latitude: 5.2971, longitude: 100.2769, note: 'Welcome back to Penang.' },
];

/**
 * Narita has no clock time in the §4.8 manifest — it prints `—`, because
 * before the travel legs existed nothing on Day 8 needed ordering. Now that
 * the day runs 06:30 to 20:35, an untimed stop sorts to the very end, behind
 * the arrival in Penang.
 *
 * 07:20 is not invented: §7.1 puts the landside window at ~07:20–08:40, and
 * 06:30 plus the short coach lands there. Flagged in the phase log as the one
 * time in the trip that is derived rather than printed on the agent's sheet.
 */
export const STOP_TIME_FIXES = {
  '184f9cf0f25a': { time: '07:20', durationLabel: 'departure' },
};

/**
 * Day 1 is a RENAME of one property, not a replacement (decision B7): JR East's
 * official English name, same address, same phone. It keeps its seed id, so
 * nothing has to be re-pointed and there is no retired stop for it.
 */
export const RENAMED_STOPS = [{
  id: 'd93da2ed9772',
  from: 'Hotel Metropolitan Haneda',
  to: 'Hotel Metropolitan Tokyo Haneda',
  reason: "The 4 Sep 2026 agent itinerary prints 'Hotel Metropolitan Tokyo Haneda'. Same property "
        + "— JR East's official English name, same Haneda Innovation City Zone A address and phone. "
        + 'Not a hotel change, so the stop keeps its id and its places stay anchored.',
}];

/**
 * Two stop coordinates that are wrong in `days[].items[]`, which is outside the
 * batch schema — so the batches could correct the places but not these.
 */
export const STOP_COORD_FIXES = {
  // Guide §7.8. The seed geocoded the TOWN polygon 千葉県印旛郡酒々井町, ~2,392 m
  // WNW of the mall. Five independent sources agree on this point within 554 m.
  '21c5d54201ee': { latitude: 35.713812, longitude: 140.294023,
    coordFix: 'Seed pin 35.7222/140.2696 was the Shisui town polygon, ~2,392 m WNW of the outlet mall.' },
  // Guide §7.9, and notes8.md: the same ~600 m easterly error, out over the apron.
  '184f9cf0f25a': { latitude: 35.7725, longitude: 140.3862,
    coordFix: 'Seed longitude 140.3929 sat ~600 m east of the terminal, out over the apron.' },
};

/**
 * The tour agent's clock times, read from the guide's §4.8 stop manifest.
 *
 * They are parsed rather than retyped because the manifest is the ONLY place
 * they exist. `trip12_app_seed.json` carries `time: ''` and `windowLabel: ''`
 * on all 29 of its stops, and nothing in the 17 batches or the stops' own `x`
 * blocks holds a schedule either — so without this a coach tour renders as 30
 * stops with no times, which is most of what a coach tour's plan screen is for.
 *
 * Parsing beats transcription: 33 hand-copied times is 33 chances to be wrong,
 * and if the manifest is ever corrected the import follows it. The caller
 * asserts the row count and that every name resolves, so a table edit that
 * breaks the join fails loudly instead of quietly dropping times.
 */
export function readStopSchedule(guidePath) {
  const md = readFileSync(guidePath, 'utf8');
  const re = /^\|\s*([1-8])\s*\|\s*`([^`]+)`\s*\|\s*([^|]*?)\s*\|\s*`([^`]+)`\s*\|\s*(\w+)\s*\|/gm;
  const rows = [];
  let m;
  while ((m = re.exec(md))) {
    rows.push({ day: Number(m[1]), time: m[2], durationLabel: m[3], name: m[4], state: m[5] });
  }
  return rows;
}

/** "1 h 30" / "50 min" / "2 h" to minutes; anything else (overnight, arrive) to null. */
export function durationMinutes(label) {
  const s = String(label || '').trim();
  const hm = /^(\d+)\s*h(?:\s*(\d+))?$/.exec(s);
  if (hm) return Number(hm[1]) * 60 + Number(hm[2] || 0);
  const mm = /^(\d+)\s*min$/.exec(s);
  if (mm) return Number(mm[1]);
  return null;
}

/** Every batch, in the one order that is not optional: top-ups last (§4.1). */
export function batchOrder(dir) {
  const all = readdirSync(dir).filter((f) => f.endsWith('.json'));
  const pick = (re) => all.filter((f) => re.test(f)).sort();
  return [
    ...pick(/^day\d/), 'new-hotels.json', ...pick(/^expand-/), ...pick(/^topup-/),
  ].filter((f) => all.includes(f));
}

const read = (dir, f) => JSON.parse(readFileSync(join(dir, f), 'utf8'));

const COLLECTIONS = ['places', 'mustSee', 'shopping', 'subRoutes'];

/** Days of the week, in the order a person reads a grid. */
const DAYS_OF_WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABEL = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

/**
 * A weekday grid as one line, collapsing runs of identical days, so that
 * `EssentialRow.value` says something a person can read at a glance. `null`
 * means closed, and closed days are named rather than left out — "Closed Wed"
 * is the single most useful thing an hours row can say.
 */
export function hoursLine(hours) {
  if (!hours || typeof hours !== 'object') return '';
  const span = (d) => {
    const v = hours[d];
    if (v === null) return 'closed';
    if (!Array.isArray(v) || !v.length) return '';
    return v.map((s) => `${s[0]}–${s[1]}`).join(', ');
  };
  const runs = [];
  for (const d of DAYS_OF_WEEK) {
    const s = span(d);
    if (!s) continue;
    const last = runs[runs.length - 1];
    if (last && last.text === s) last.days.push(d);
    else runs.push({ text: s, days: [d] });
  }
  if (!runs.length) return '';
  if (runs.length === 1) return `Daily ${runs[0].text}`;
  return runs
    .map((r) => {
      const label = r.days.length === 1
        ? DAY_LABEL[r.days[0]]
        : `${DAY_LABEL[r.days[0]]}–${DAY_LABEL[r.days[r.days.length - 1]]}`;
      return `${label} ${r.text}`;
    })
    .join(' · ');
}

/**
 * Projects a structured essentials block into the flat `[EssentialRow]` the
 * Info panel already renders, WITHOUT throwing the structure away — the
 * structured fields stay on the PlanItem, because a closing-day check cannot
 * be run against a sentence.
 */
export function projectEssentials(e) {
  if (!e) return [];
  const rows = [];
  const add = (key, value, detail = '') => {
    if (value === null || value === undefined || value === '') return;
    rows.push({ key, value: String(value), detail: detail ? String(detail) : '' });
  };
  add('Hours', hoursLine(e.hours), e.closedNote);
  add('Last admission', e.lastAdmission, e.lastAdmissionNote);
  const season = [e.seasonFrom, e.seasonTo].filter(Boolean).join(' – ');
  add('Season', season, e.seasonNote);
  add('Tickets', e.tickets);
  add('Group rate', e.groupRate);
  add('Phone', e.phone, e.phoneNote);
  add('Website', e.website);
  add('Transport', e.transport);
  add('Confidence', e.confidence, e.confidenceNote);
  add('Source', e.source);
  return rows;
}

/**
 * Firestore cannot store an array inside an array, and two shapes in the
 * research bundle are exactly that:
 *
 *   hours.mon      [["09:00","17:00"]]   ->  [{open:"09:00", close:"17:00"}]
 *   x.legs[].coords [[lat,lng], ...]     ->  [{lat, lng}, ...]
 *
 * Converting is better than flattening to a string: the whole reason the
 * research collected structured hours was so a closing-day check could run
 * against them, and `{open, close}` keeps that possible while `"09:00–17:00"`
 * would not. `null` still means closed that day and stays `null`.
 *
 * The source JSON in `research/trip12/` is untouched and stays the record; this
 * is only the shape that goes over the wire.
 */
export function toFirestoreShape(snapshot) {
  const converted = { hours: 0, coords: 0 };

  for (const day of snapshot.days) {
    for (const item of day.items) {
      if (item.hours && typeof item.hours === 'object') {
        const next = {};
        for (const d of DAYS_OF_WEEK) {
          const v = item.hours[d];
          if (v === null || v === undefined) { next[d] = null; continue; }
          next[d] = (Array.isArray(v) ? v : []).map((span) =>
            (Array.isArray(span) ? { open: span[0] ?? null, close: span[1] ?? null } : span));
        }
        item.hours = next;
        converted.hours += 1;
      }
    }
    for (const leg of day.x?.legs || []) {
      if (Array.isArray(leg.coords)) {
        leg.coords = leg.coords.map((c) => (Array.isArray(c) ? { lat: c[0], lng: c[1] } : c));
        converted.coords += 1;
      }
    }
  }
  return converted;
}

/**
 * Firestore rejects `undefined` outright. The alternative — the SDK's
 * `ignoreUndefinedProperties` — drops those fields silently, which is the
 * wrong trade here: a field that vanishes without a word is the same class of
 * failure as the shopping categories. So strip them deliberately and count
 * what was stripped.
 *
 * An absent optional field and one explicitly set to `undefined` mean the same
 * thing, so removing the key loses nothing. `null` is left alone — in this data
 * it is meaningful, and `hours.tue: null` means closed on Tuesday.
 */
export function pruneUndefined(value) {
  let removed = 0;
  const walk = (v) => {
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (!v || typeof v !== 'object') return;
    for (const [k, x] of Object.entries(v)) {
      if (x === undefined) { delete v[k]; removed += 1; } else walk(x);
    }
  };
  walk(value);
  return removed;
}

/**
 * Firestore rejects a nested array with `INVALID_ARGUMENT: Cannot convert an
 * array value in an array value` and names nothing — not the document, not the
 * field. So find them here, where the path can be printed, rather than letting
 * a batch of 400 fail anonymously.
 */
export function findNestedArrays(snapshot) {
  const hits = [];
  const walk = (v, path, inArray) => {
    if (Array.isArray(v)) {
      if (inArray) hits.push(path);
      v.forEach((x, i) => walk(x, `${path}[${i}]`, true));
    } else if (v && typeof v === 'object') {
      for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`, false);
    }
  };
  for (const [k, val] of Object.entries(snapshot)) walk(val, k, false);
  return hits;
}

/** "30 min" · "1 h 30" — the register the stop rows already use. */
const stayLabel = (m) => {
  if (!Number.isFinite(m) || m <= 0) return '';
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60}` : ''}`;
};

const TIME_WINDOW_LABEL = {
  day: 'Daytime',
  night: 'After dark',
  dawn: 'Before dawn',
  '24h': 'Any hour',
};

/**
 * The Info tab of a NEARBY place, built from what the research already knows
 * about it.
 *
 * Every one of the 532 places carries a note, and 73% of those notes state the
 * opening hours in prose — that text already renders as the description. What
 * was empty was the Info panel itself, because `Place.essentials` was never
 * set, so opening a place showed "Nothing here yet. Pasting a map link fills in
 * whatever OpenStreetMap has."  That reads as missing data on a record that is
 * in fact fully researched.
 *
 * So this projects the fields that ARE there into the same `[EssentialRow]`
 * shape the stops use. It invents nothing: no hours, no phone, no website —
 * those genuinely do not exist per place, and claiming them would be worse
 * than an empty panel.
 *
 * `Position` earns its row because two coordinates in this dataset were once
 * marked verified and were wrong, one by 260 km. Whether a pin was confirmed
 * or inferred is worth saying out loud.
 */
export function projectPlaceEssentials(p) {
  const rows = [];
  const add = (key, value, detail = '') => {
    if (value === null || value === undefined || value === '') return;
    rows.push({ key, value: String(value), detail: detail ? String(detail) : '' });
  };

  add('Price', p.priceTier);
  add('Time needed', stayLabel(p.stayMinutes));

  const legs = Array.isArray(p.legs) ? p.legs : [];
  if (legs.length) {
    const total = legs.reduce((n, l) => n + (l.minutes || 0), 0);
    add('Getting there',
      legs.map((l) => `${l.mode} ${l.minutes} min`).join(' · '),
      total ? `${total} minutes from the stop, one way` : '');
  }

  add('Best time', TIME_WINDOW_LABEL[p.timeWindow]);
  // A confidence below `high` always carries a note saying what is uncertain —
  // the validator enforces it — so the doubt travels with the fact.
  add('Confidence', p.confidence, p.confidenceNote);
  add('Position', p.coordPrecision === 'verified' ? 'Verified' : 'Approximate', p.coordFix);
  add('Source', p.source);
  return rows;
}

/**
 * Reads the bundle and returns the finished snapshot plus a report of every
 * decision the merge made. The report is the dry run's output, and the same
 * numbers are what §14 accepts against.
 */
export function buildSnapshot(researchDir, guidePath) {
  const seed = read(researchDir, 'trip12_app_seed.json');
  const order = batchOrder(researchDir);
  const report = {
    batches: order,
    perCollection: {},
    anchorChanges: [],
    duplicateMerges: [],
    stopRenames: [],
    stopReplacements: [],
    coordFixes: [],
    categoryProblems: [],
    dangling: [],
    unmappable: [],
    fieldWiseRescues: 0,
    warnings: [],
  };

  // ---- 1. every collection, keyed by id, field-wise, batches last ----------
  const coll = {};
  const fromSeed = {};
  for (const k of COLLECTIONS) {
    coll[k] = new Map();
    fromSeed[k] = new Set();
    for (const r of seed[k] || []) {
      coll[k].set(r.id, { ...r });
      fromSeed[k].add(r.id);
    }
  }

  const anchorSeen = new Map();
  for (const file of order) {
    const batch = read(researchDir, file);
    for (const k of COLLECTIONS) {
      for (const r of batch[k] || []) {
        const prior = coll[k].get(r.id);
        // Field-wise: the batch wins on the keys it carries, and keys it does
        // not carry survive. See the note at the top of this file.
        if (prior) {
          for (const key of Object.keys(prior)) {
            if (!(key in r) && prior[key] !== undefined) report.fieldWiseRescues += 1;
          }
        }
        coll[k].set(r.id, { ...(prior || {}), ...r });
        if (k === 'places' && r.anchorStop) {
          const seenList = anchorSeen.get(r.id) || [];
          seenList.push({ file, anchorStop: r.anchorStop });
          anchorSeen.set(r.id, seenList);
        }
      }
    }
  }

  for (const [id, seenList] of anchorSeen) {
    const distinct = [...new Set(seenList.map((s) => s.anchorStop))];
    if (distinct.length > 1) {
      report.anchorChanges.push({
        id, name: coll.places.get(id)?.name, from: distinct[0], to: distinct[distinct.length - 1],
      });
    }
  }

  // ---- 2. the 20 duplicate venue pairs ------------------------------------
  // One real venue stored twice under two content-hashed ids: once anchored to
  // a stop, once as a night/dawn spot. Importing both puts two pins on one
  // place. The three `coLocated` pairs are NOT duplicates — genuinely different
  // venues in one building — and both of each are kept.
  const dupDoc = read(researchDir, 'seed_duplicates.json');
  for (const pair of dupDoc.duplicatePairs) {
    const keep = coll.places.get(pair.keep);
    const dup = coll.places.get(pair.duplicate);
    if (!keep || !dup) {
      report.unmappable.push({ what: 'duplicate pair', pair, reason: !keep ? 'keep id absent' : 'duplicate id absent' });
      continue;
    }
    const dx = dup.x || {};
    const kx = { ...(keep.x || {}) };
    // Fold across only what the night/dawn copy knows and the kept one does not.
    for (const f of ['timeWindow', 'hoursText', 'hotelKm']) {
      if (kx[f] === undefined && dx[f] !== undefined) kx[f] = dx[f];
    }
    if (keep.timeWindow === undefined && dup.timeWindow !== undefined) keep.timeWindow = dup.timeWindow;
    keep.x = kx;
    keep.mergedFrom = [...(keep.mergedFrom || []), pair.duplicate];
    coll.places.set(pair.keep, keep);
    coll.places.delete(pair.duplicate);
    report.duplicateMerges.push({ keep: pair.keep, keepName: pair.keepName, dropped: pair.duplicate });
  }
  report.coLocatedKept = dupDoc.coLocated.length;

  // ---- 3. the stop summaries, 33 stops x 5 lines --------------------------
  const summaries = {};
  for (const f of ['summaries-d14.json', 'summaries-d58.json']) {
    for (const [stop, block] of Object.entries(read(researchDir, f).stopSummary || {})) {
      if (summaries[stop]) report.warnings.push(`stopSummary defined twice: ${stop}`);
      summaries[stop] = block;
    }
  }

  // ---- 4. essentials + the removed-stop manifests, by stop name -----------
  const essentials = {};
  const removedManifests = {};
  for (const file of order) {
    const batch = read(researchDir, file);
    for (const [stop, block] of Object.entries(batch.essentials || {})) essentials[stop] = block;
    for (const [stop, block] of Object.entries(batch.removedFromDay || {})) removedManifests[stop] = block;
  }

  // ---- 5. the days, and their stops ---------------------------------------
  const days = (seed.days || []).map((d) => ({ ...d, items: (d.items || []).map((i) => ({ ...i })) }));
  const dayOf = (n) => days.find((d) => d.dayNumber === n);

  for (const ren of RENAMED_STOPS) {
    const item = days.flatMap((d) => d.items).find((i) => i.id === ren.id);
    if (!item) { report.unmappable.push({ what: 'rename', id: ren.id }); continue; }
    item.name = ren.to;
    item.renamedFrom = { name: ren.from, reason: ren.reason, renamedOn: '2026-09-04' };
    report.stopRenames.push({ id: ren.id, from: ren.from, to: ren.to, keptId: true });
  }

  for (const spec of NEW_STOPS) {
    const day = dayOf(spec.day);
    if (!day) { report.unmappable.push({ what: 'new stop', spec }); continue; }

    if (spec.replaces) {
      const old = day.items.find((i) => i.name === spec.replaces);
      if (!old) {
        report.unmappable.push({ what: 'retired stop not found', name: spec.replaces });
      } else {
        // `archived` is the existing mechanism and it already does the right
        // thing: plan.js renders archived items under a "REMOVED FROM THIS DAY"
        // eyebrow as tappable cards, and store.js leaves them out of the stop
        // count. The stop stays viewable and stops being scheduled.
        old.archived = true;
        old.retired = true;
        old.retiredReplacedBy = spec.name;
        old.removedFromDay = removedManifests[spec.replaces] || null;
        if (!old.removedFromDay) report.warnings.push(`no removedFromDay manifest for ${spec.replaces}`);
        report.stopReplacements.push({ day: spec.day, retired: old.id, retiredName: old.name, added: spec.id, addedName: spec.name });
      }
    }

    day.items.push({
      id: spec.id,
      time: spec.time,
      endTime: '',
      durationLabel: '',
      name: spec.name,
      subtitle: spec.subtitle,
      note: '',
      summary: '',
      windowLabel: spec.windowLabel,
      chips: spec.chips || [],
      kind: 'main',
      isSubRouteSummary: false,
      placeID: null,
      essentials: [],
      latitude: spec.latitude,
      longitude: spec.longitude,
      archived: false,
      movedToDay: null,
      x: {},
    });
    if (!spec.replaces) report.stopReplacements.push({ day: spec.day, retired: null, added: spec.id, addedName: spec.name });
  }

  const clock = (t) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || ''));
    return m ? Number(m[1]) * 60 + Number(m[2]) : Number.MAX_SAFE_INTEGER;
  };

  // ---- 5b. the outbound and return travel -------------------------------
  report.travelLegs = [];
  for (const leg of TRAVEL_LEGS) {
    const d = dayOf(leg.day);
    if (!d) { report.unmappable.push({ what: 'travel leg', leg }); continue; }
    const id = sid('stop', leg.day, leg.name);
    d.items.push({
      id,
      time: leg.time,
      endTime: '',
      durationLabel: leg.durationLabel,
      name: leg.name,
      subtitle: '',
      note: leg.note,
      summary: leg.note,
      windowLabel: '',
      chips: [],
      kind: 'main',
      isSubRouteSummary: false,
      placeID: null,
      essentials: [],
      latitude: leg.latitude ?? null,
      longitude: leg.longitude ?? null,
      archived: false,
      movedToDay: null,
      // What marks these as travel rather than sightseeing, using the values
      // the seed already uses. `travelLeg` keeps them countable separately
      // from the 30 researched stops.
      travelLeg: true,
      x: { stopKind: leg.stopKind },
    });
    report.travelLegs.push({ day: leg.day, id, time: leg.time, name: leg.name });
  }

  for (const [id, fix] of Object.entries(STOP_TIME_FIXES)) {
    const item = days.flatMap((d) => d.items).find((i) => i.id === id);
    if (!item) { report.unmappable.push({ what: 'stop time fix', id }); continue; }
    report.timeFixes = [...(report.timeFixes || []),
      { id, name: item.name, from: item.time || '(none)', to: fix.time }];
    item.time = fix.time;
    if (fix.durationLabel) item.durationLabel = fix.durationLabel;
  }

  // The schedule, from the guide's §4.8 manifest — the only source there is.
  const schedule = new Map();
  if (guidePath) {
    const rows = readStopSchedule(guidePath);
    report.schedule = { rows: rows.length, applied: 0, unmatched: [] };
    if (rows.length !== 33) {
      report.warnings.push(`§4.8 manifest parsed ${rows.length} rows, expected 33 — times may be incomplete`);
    }
    for (const r of rows) schedule.set(r.name, r);
  }

  // Coordinate fixes, stop summaries and essentials onto every stop.
  const stopByName = new Map();
  for (const d of days) {
    for (const item of d.items) {
      stopByName.set(item.name, { item, dayNumber: d.dayNumber });

      const fix = STOP_COORD_FIXES[item.id];
      if (fix) {
        report.coordFixes.push({
          id: item.id, name: item.name,
          from: [item.latitude, item.longitude], to: [fix.latitude, fix.longitude],
        });
        item.latitude = fix.latitude;
        item.longitude = fix.longitude;
        item.coordFix = fix.coordFix;
        item.coordPrecision = 'verified';
      }

      const block = essentials[item.name];
      if (block) {
        // Both shapes: the structured object stays for the closing-day check,
        // and the flat projection feeds the Info panel unchanged.
        for (const f of ['hours', 'closedNote', 'lastAdmission', 'seasonFrom', 'seasonTo',
          'groupRate', 'phone', 'website']) {
          if (block[f] !== undefined) item[f] = block[f];
        }
        item.essentials = projectEssentials(block);
      }

      const summary = summaries[item.name];
      if (summary) item.stopSummary = summary;
      else if (!item.travelLeg) report.warnings.push(`no stopSummary for stop: ${item.name}`);

      const sched = schedule.get(item.name);
      if (sched) {
        // "—" is the manifest's way of saying there is no clock time: an
        // overnight, a departure, a stop the agent removed. Leave it empty
        // rather than inventing one.
        if (sched.time && sched.time !== '—') item.time = sched.time;
        item.durationLabel = sched.durationLabel || '';
        const mins = durationMinutes(sched.durationLabel);
        if (item.time && mins != null) {
          const start = clock(item.time);
          const end = start + mins;
          item.endTime = `${String(Math.floor(end / 60) % 24).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;
          item.windowLabel = `${item.time} – ${item.endTime}`;
        }
        report.schedule.applied += 1;
      } else if (guidePath && !item.travelLeg) {
        // Travel legs carry their own times from `trip.x.flights`; the §4.8
        // manifest only covers the 33 researched stops.
        report.schedule.unmatched.push(item.name);
      }
    }
  }

  // Now that every stop knows its time, put each day in clock order. A stop
  // with no clock time — an overnight, the Narita departure — keeps its
  // position at the end of the day rather than being given a fake one.
  //
  // Ginza's 13:45 deliberately precedes Shisui's 14:30 and overlaps it. That
  // is accepted and intentional (A6): the overlap on the timeline IS the
  // signal, and the owner resolves it by removing one in plan editing (B8).
  // Do not re-time or reorder either stop to tidy it away.
  for (const d of days) d.items.sort((a, b) => clock(a.time) - clock(b.time));

  // ---- 6. retirement is DERIVED from the final anchor, never inherited ----
  //
  // The batches set `retired: true` only on records anchored to one of the
  // three superseded hotels — that is the whole rule, and it is why the flag
  // must be recomputed rather than merged. `topup-naruko.json` moves three
  // Naruko town records off Hotel Kameya onto the live Kounkaku and simply
  // omits `retired`; a field-wise merge would otherwise carry the stale `true`
  // forward and mark three live records dead. A record is retired if and only
  // if the stop it finally belongs to is retired.
  const retiredStopNames = new Map();
  for (const d of days) {
    for (const item of d.items) {
      if (item.archived) retiredStopNames.set(item.name, item.retiredReplacedBy || null);
    }
  }
  report.retirementDerived = { cleared: [], set: 0 };
  for (const k of ['places', 'mustSee', 'shopping']) {
    for (const [id, r] of coll[k]) {
      const anchor = r.anchorStop || r.x?.anchorStop
        || [...stopByName.values()].find((s) => s.item.id === r.anchorPlaceID)?.item.name;
      const isRetired = anchor ? retiredStopNames.has(anchor) : false;
      if (isRetired) {
        r.retired = true;
        r.retiredReplacedBy = retiredStopNames.get(anchor) || undefined;
        r.retiredReason = removedManifests[anchor]?.reason;
        report.retirementDerived.set += 1;
      } else if (r.retired) {
        // Carried a stale flag from an earlier batch. It moved; it is alive.
        delete r.retired;
        delete r.retiredReplacedBy;
        delete r.retiredReason;
        report.retirementDerived.cleared.push({ collection: k, id, name: r.name, nowAnchoredTo: anchor });
      }
    }
  }

  // ---- 7. places: resolve anchorStop (a name) to a stop id ----------------
  for (const [id, p] of coll.places) {
    const name = p.anchorStop || p.x?.anchorStop;
    if (name) {
      const hit = stopByName.get(name);
      if (hit) p.anchorPlaceID = hit.item.id;
      else report.unmappable.push({ what: 'place anchorStop', id, name: p.name, anchorStop: name });
    }
    // A place anchored to nothing is the night/dawn pool, which is legitimate;
    // a place anchored to an id no stop has is not.
    if (p.anchorPlaceID && !stopByName.has(p.name) ) {
      const known = [...stopByName.values()].some((s) => s.item.id === p.anchorPlaceID);
      if (!known) report.dangling.push({ id, name: p.name, anchorPlaceID: p.anchorPlaceID });
    }
  }

  // ---- 7b. a stop IS a place, in this client ------------------------------
  //
  // `store.unifyPlaces()` runs on every load and enforces that model: any stop
  // without a `placeID` gets a brand-new place record minted with a random
  // `uid('place-')`, its `essentials` are moved onto that place and deleted
  // from the item, and everything anchored to the stop's item id is re-pointed
  // at the place. Then `dest.js` reads `anchorID = item.placeID` and every
  // panel hangs off it.
  //
  // So importing stops with `placeID: null` does not fail — it defers. The
  // first person to open the trip triggers 33 place inserts, hundreds of
  // re-anchor writes and eight day rewrites, under their own credentials, with
  // ids that differ on every device that gets there first. Re-running the
  // importer would then fight the migration it caused.
  //
  // Doing it here instead makes the stop places deterministic and the import
  // idempotent, and leaves `unifyPlaces()` with nothing to change.
  const STOP_KIND_CATEGORY = { airport: 'rest', hotel: 'rest', transit: 'rest', sight: 'sight' };
  const stopPlaceOf = new Map();
  for (const d of days) {
    for (const item of d.items) {
      if (item.isSubRouteSummary) continue;
      const placeId = sid('place', d.dayNumber, item.name);
      stopPlaceOf.set(item.id, placeId);
      coll.places.set(placeId, {
        id: placeId,
        anchorPlaceID: null,
        name: item.name,
        nameJp: item.stopSummary?.nameJp,
        category: STOP_KIND_CATEGORY[item.x?.stopKind] || 'sight',
        priceTier: '—',
        stayMinutes: durationMinutes(item.durationLabel) ?? 45,
        legs: [],
        note: item.subtitle || '',
        isUserAdded: false,
        latitude: item.latitude ?? null,
        longitude: item.longitude ?? null,
        // The place owns the essentials, which is what dest.js prefers and what
        // unifyPlaces() would otherwise move here itself.
        essentials: item.essentials || [],
        isStop: true,
        retired: item.archived ? true : undefined,
      });
      item.placeID = placeId;
      item.essentials = [];
      report.stopPlaces = (report.stopPlaces || 0) + 1;
    }
  }

  // Everything that pointed at a stop's ITEM id now points at that stop's
  // place, which is the shape the client reads.
  for (const [, p] of coll.places) {
    if (p.isStop) continue;
    const moved = stopPlaceOf.get(p.anchorPlaceID);
    if (moved) p.anchorPlaceID = moved;
  }
  const stopPlaceByName = new Map();
  for (const [itemId, placeId] of stopPlaceOf) {
    const entry = [...stopByName.entries()].find(([, s]) => s.item.id === itemId);
    if (entry) stopPlaceByName.set(entry[0], placeId);
  }
  // MustSeeShot.placeID and ShoppingItem.placeID are what shotsFor() and
  // dest.js's shopHere filter on. The seed leaves both empty and the batches
  // carry only `anchorStop`, so without this every must-see shot and every
  // shopping row is present, correct, and attached to nothing.
  report.linked = { mustSee: 0, shopping: 0 };
  for (const [, m] of coll.mustSee) {
    const placeId = stopPlaceByName.get(m.anchorStop || m.x?.anchorStop);
    if (placeId) { m.placeID = placeId; report.linked.mustSee += 1; }
  }
  for (const [, s] of coll.shopping) {
    const anchor = s.anchorStop || s.x?.anchorStop;
    const placeId = stopPlaceByName.get(anchor);
    if (placeId) { s.placeID = placeId; report.linked.shopping += 1; }

    // The Shop screen ALREADY has a day filter — `shopDayOptions()` builds it
    // and `shop.js` renders "All days" plus a button per day. It was inert for
    // this trip because `itemDay()` reads the day out of `placeWhen` as text,
    // and the batches never set that field: every item answered `null`, so the
    // filter offered nothing to filter by. Writing it makes the existing
    // feature work with no UI change at all.
    // Overwrite when the existing value cannot answer the question: the seed
    // writes things like "Tue 8 Sep", which reads fine but carries no "Day N"
    // for `itemDay()` to find, so the filter stayed empty.
    const hit = anchor ? stopByName.get(anchor) : null;
    if (hit && !/Day\s+\d+/i.test(s.placeWhen || '')) {
      const w = hit.item.windowLabel || hit.item.time || '';
      s.placeWhen = `Day ${hit.dayNumber} · ${anchor}${w ? `, ${w}` : ''}`;
      report.placeWhenSet = (report.placeWhenSet || 0) + 1;
    }
  }

  // ---- 7c. the Info tab on every nearby place -----------------------------
  report.placeEssentials = { filled: 0, rows: 0 };
  for (const [, p] of coll.places) {
    if (p.isStop) continue;          // a stop's Info comes from its own essentials block
    if (p.essentials?.length) continue;
    const rows = projectPlaceEssentials(p);
    if (!rows.length) continue;
    p.essentials = rows;
    report.placeEssentials.filled += 1;
    report.placeEssentials.rows += rows.length;
  }

  // ---- 8. subRoutes: the mapping gap in §4.7 ------------------------------
  for (const [id, sr] of coll.subRoutes) {
    const hit = stopByName.get(sr.anchorStop);
    if (!hit) { report.unmappable.push({ what: 'subRoute anchorStop', id, anchorStop: sr.anchorStop }); continue; }
    sr.anchorPlanItemID = hit.item.id;
    // store.js matches a loop to its stop by EITHER key, so set both.
    sr.anchorPlaceID = stopPlaceOf.get(hit.item.id) ?? null;
    sr.anchorName = sr.anchorStop;
    sr.dayNumber = hit.dayNumber;
    // Every one of the 17 is a coach tour loop whose deadline is the coach
    // leaving, so there is one honest answer for all of them.
    sr.returnTarget = 'coach';
    sr.returnMinutes = Math.max(0, (sr.deadlineMinutes ?? 0) - (sr.startMinutes ?? 0));
    // store.js renders `route.name` everywhere and, on load, rewrites a loop
    // that has none to "Free time" — so 16 of the 17 would have lost their
    // titles on first open. The batches carry `title`; only one carries
    // `name`. Keep both, with `name` as the one the client reads.
    sr.name = sr.name || sr.title;
    sr.title = sr.title || sr.name;
    // Set explicitly so the client does not backfill them on load (store.js
    // does exactly that, which would rewrite every loop on first open).
    sr.departMinutes = sr.departMinutes ?? sr.startMinutes ?? null;
    sr.returnByMinutes = sr.returnByMinutes ?? sr.deadlineMinutes ?? null;
    sr.startPlaceID = sr.startPlaceID ?? null;
    sr.endPlaceID = sr.endPlaceID ?? null;
  }

  // ---- 9. the two category enums, kept apart (§4.2c) ---------------------
  const PLACE_CATEGORIES = new Set(['food', 'cosme', 'cloth', 'shopping', 'sight', 'rest']);
  const SHOP_CATEGORIES = new Set(['food', 'clothing', 'souvenir', 'beauty', 'other']);
  for (const [id, p] of coll.places) {
    if (p.category !== undefined && !PLACE_CATEGORIES.has(p.category)) {
      report.categoryProblems.push({ collection: 'places', id, name: p.name, value: p.category, fix: null });
    }
  }
  for (const [id, s] of coll.shopping) {
    if (s.category === undefined || s.category === null || s.category === '') {
      // §16.3: backfill anything with no category rather than let it drop out
      // of the shop filter. `souvenir` is what the seed's own 49 items carry.
      s.category = 'souvenir';
      report.categoryProblems.push({ collection: 'shopping', id, name: s.name, value: '(absent)', fix: 'souvenir' });
    } else if (!SHOP_CATEGORIES.has(s.category)) {
      // A PlaceCategory value on a ShoppingItem. The two enums share only
      // `food`, which is what makes this silent rather than loud.
      const was = s.category;
      s.category = 'other';
      report.categoryProblems.push({ collection: 'shopping', id, name: s.name, value: was, fix: 'other', crossWired: true });
    }
  }

  // ---- 9a2. ITEM 4: the researched items start LOCAL ---------------------
  //
  // Owner decision, 7 Sep 2026. All 96 researched shopping items are noted
  // at a place rather than chosen by the traveller, so they begin local to
  // the stop they belong to: the main Shop screen starts empty of them, and
  // each arrives on the list only when it is ticked bought or added from its
  // own place's Shop tab.
  //
  // Written EXPLICITLY as `onList: false` rather than left to a default. The
  // app reads an absent flag as "on the list", which is what protects every
  // record written before the flag existed — so the importer has to say what
  // it means instead of relying on that.
  for (const [, s2] of coll.shopping) {
    s2.onList = false;
    report.startedLocal = (report.startedLocal || 0) + 1;
  }

  // ---- 9b. the prep lines, recategorised ---------------------------------
  //
  // Every line must match exactly one rule and every rule exactly one line —
  // a fragment that stops matching because the prose was edited would
  // otherwise leave that line silently in a category nobody chose.
  const prep = (seed.prep || []).map((r) => ({ ...r }));
  report.prep = { assigned: 0, unmatched: [], unusedRules: [], ambiguous: [] };
  const ruleUse = new Map(PREP_ASSIGNMENTS.map(([frag]) => [frag, 0]));
  for (const item of prep) {
    const hits = PREP_ASSIGNMENTS.filter(([frag]) => item.name.includes(frag));
    if (hits.length === 0) { report.prep.unmatched.push(item.name); continue; }
    if (hits.length > 1) report.prep.ambiguous.push({ name: item.name, rules: hits.map((h) => h[0]) });
    const [frag, category] = hits[0];
    ruleUse.set(frag, ruleUse.get(frag) + 1);
    item.category = category;
    item.categoryOrder = PREP_CATEGORY_ORDER.indexOf(category);
    report.prep.assigned += 1;
  }
  for (const [frag, n] of ruleUse) if (n === 0) report.prep.unusedRules.push(frag);
  for (const w of report.prep.unmatched) report.warnings.push(`prep line matched no category rule: ${w}`);
  for (const w of report.prep.unusedRules) report.warnings.push(`prep category rule matched nothing: ${w}`);
  for (const a of report.prep.ambiguous) report.warnings.push(`prep line matched ${a.rules.length} rules: ${a.name}`);

  // ---- 10. the trip document ---------------------------------------------
  const trip = {
    ...seed.trip,
    id: TRIP_ID,
    name: 'ViTrox Japan Tohoku · Trip 12',
    code: 'T12',
    dateRange: '8–15 Sep 2026 · agent itinerary · 8 days',
    dayCount: 8,
    currentDay: 1,
    // A STRING, not a Timestamp. store.tripState() and tripDayGap() call
    // new Date(trip.startDate) and tripGroups() localeCompares it raw; a
    // Timestamp object breaks all three, and the trip would sort and label
    // wrongly. The guide contradicts itself here — §4.2d's corrected text is
    // right, §12 and §14 are not.
    startDate: '2026-09-08',
    currencySymbol: '¥',
    currencyCode: 'JPY',
    homeCurrencyCode: 'MYR',
    homeCurrencyRate: 33.7,
    // A5: seeded, user-editable, and stamped so a stale rate is visible rather
    // than silent. The trip settings screen already edits all three.
    rateUpdatedAt: '2026-09-04T00:00:00.000Z',
    rateSource: 'seeded from research, 4 Sep 2026',
    locationName: 'Tohoku and Kanto, Japan',
    hotelName: 'Hotel Metropolitan Tokyo Haneda',
    stationName: 'Penang International Airport (assemble 07:00)',
    latitude: 37.5,
    longitude: 140.0,
    // Decision B1: A9's six, plus the seventh the 85 prep lines actually use.
    // Approved from PREP_CATEGORIES_PROPOSAL.md — seven "bring" columns and
    // three "avoid" ones, because the 85 lines are two different kinds of thing.
    prepCategories: [...PREP_CATEGORY_ORDER],
  };
  delete trip.departsInDays; // display-only, never stored (A1)

  const snapshot = {
    trip,
    days,
    places: [...coll.places.values()],
    subRoutes: [...coll.subRoutes.values()],
    shopping: [...coll.shopping.values()],
    mustSee: [...coll.mustSee.values()],
    prep,
    log: [],
    outfits: (seed.outfits || []).map((r) => ({ ...r })),
  };

  for (const k of COLLECTIONS) {
    const ids = new Set(coll[k].keys());
    report.perCollection[k] = {
      total: ids.size,
      update: [...ids].filter((i) => fromSeed[k].has(i)).length,
      insert: [...ids].filter((i) => !fromSeed[k].has(i)).length,
    };
  }
  report.perCollection.prep = { total: snapshot.prep.length, update: snapshot.prep.length, insert: 0 };
  report.perCollection.outfits = { total: snapshot.outfits.length, update: snapshot.outfits.length, insert: 0 };
  report.perCollection.days = { total: days.length, update: days.length, insert: 0 };

  const active = days.flatMap((d) => d.items).filter((i) => !i.archived);
  const retired = days.flatMap((d) => d.items).filter((i) => i.archived);
  report.stops = {
    active: active.length,
    researched: active.filter((i) => !i.travelLeg).length,
    travel: active.filter((i) => i.travelLeg).length,
    retired: retired.length,
    withData: active.length + retired.length,
    withSummary: [...active, ...retired].filter((i) => i.stopSummary).length,
    summaryLines: [...active, ...retired]
      .reduce((n, i) => n + ['do', 'eat', 'snack', 'buy', 'see'].filter((f) => i.stopSummary?.[f]).length, 0),
    corrections: [...active, ...retired]
      .reduce((n, i) => n + (i.stopSummary?.correctedFromSeed?.length || 0), 0),
    withHours: [...active, ...retired].filter((i) => i.hours).length,
    day7: days.find((d) => d.dayNumber === 7)?.items.filter((i) => !i.archived).length,
  };
  // The 33 stop places are a client-model artifact, not research records, so
  // the searchable total counts research places only — that is the figure the
  // acceptance criteria are about.
  const researchPlaces = [...coll.places.values()].filter((p) => !p.isStop).length;
  report.perCollection.places.researchRecords = researchPlaces;
  report.perCollection.places.stopPlaces = report.stopPlaces || 0;
  report.searchable = researchPlaces
    + report.perCollection.mustSee.total + report.perCollection.shopping.total;
  report.totals = {
    update: COLLECTIONS.reduce((n, k) => n + report.perCollection[k].update, 0),
    insert: COLLECTIONS.reduce((n, k) => n + report.perCollection[k].insert, 0),
  };
  report.nameJp = ['places', 'mustSee', 'shopping'].reduce((n, k) =>
    n + [...coll[k].values()].filter((r) => !r.isStop && (r.nameJp || r.x?.nameJp)).length, 0);
  report.retiredRecords = ['places', 'mustSee', 'shopping'].reduce((n, k) =>
    n + [...coll[k].values()].filter((r) => !r.isStop && r.retired).length, 0);

  // Two stops sharing a name is not cosmetic: `stopByName` here is keyed by
  // name, and so is `unifyPlaces()` in the client, which reuses a place of the
  // same name — so a duplicate silently merges two different stops into one.
  const nameCount = new Map();
  for (const d of days) for (const i of d.items) nameCount.set(i.name, (nameCount.get(i.name) || 0) + 1);
  report.duplicateStopNames = [...nameCount].filter(([, n]) => n > 1).map(([n]) => n);
  for (const n of report.duplicateStopNames) report.warnings.push(`two stops share the name "${n}"`);

  // Firestore-safe shapes, then prove it: a nested array that survives here
  // fails a 400-document batch with an error that names no field at all.
  report.shapeConversions = toFirestoreShape(snapshot);
  report.undefinedPruned = pruneUndefined(snapshot);
  const nested = findNestedArrays(snapshot);
  report.nestedArrays = nested;
  if (nested.length) {
    report.warnings.push(`${nested.length} nested array(s) Firestore will reject, first: ${nested[0]}`);
  }

  // Duplicate ids inside one collection are impossible by construction (a Map),
  // but a record appearing in two collections is not, and would be a real bug.
  const seenIds = new Map();
  for (const k of COLLECTIONS) {
    for (const id of coll[k].keys()) {
      if (seenIds.has(id)) report.warnings.push(`id ${id} appears in both ${seenIds.get(id)} and ${k}`);
      else seenIds.set(id, k);
    }
  }

  return { snapshot, report };
}
