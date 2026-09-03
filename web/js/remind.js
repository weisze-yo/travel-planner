// The one strip above the tab bar, and the rules that keep it quiet.
//
// Reminders, the offline-map warning and the unsent-changes warning all
// speak in the same slot, one at a time, ranked: leave now beats outside
// your saved area beats changes stuck on this phone. Nothing appears there
// that you cannot act on in one tap, and when the strip is empty the screen
// looks exactly as it did before this existed.
//
// Not nagging comes from three rules:
//
//   one warning per deadline
//   no repeat unless the number gets materially worse (ten minutes)
//   it stops on its own once the reason has gone
//
// Dismissing silences that deadline, not the feature.
//
// What it counts with is the sub route you already set — the return-by time
// and the walking minutes — so the whole thing works with no signal and no
// paid routing. If the walk was never estimated it says "about 20 min back"
// and marks that as its own guess rather than pretending to know.

const HUSH = 'travel-planner:hushed';

function hushed() {
  try {
    return JSON.parse(localStorage.getItem(HUSH) || '{}');
  } catch {
    return {};
  }
}

function writeHush(map) {
  try {
    localStorage.setItem(HUSH, JSON.stringify(map));
  } catch {
    // Private browsing; the hush then lasts for this session.
  }
}

/**
 * Silences one deadline at the walk length it had when you dismissed it.
 * It comes back only if that walk gets ten minutes longer.
 */
export function hush(key, walkMinutes) {
  const map = hushed();
  map[key] = { at: Date.now(), walk: Math.round(walkMinutes || 0) };
  writeHush(map);
}

export function clearHush(key) {
  const map = hushed();
  delete map[key];
  writeHush(map);
}

/** Whether a deadline is still silenced at this walk length. */
function isHushed(key, walkMinutes) {
  const entry = hushed()[key];
  if (!entry) return false;
  // Materially worse is ten minutes. Anything less is the same warning.
  return Math.round(walkMinutes || 0) < entry.walk + 10;
}

const MATERIAL = 10;
/** Under this much left and the amber warning speaks. */
const TIGHT = 15;

/**
 * The reminder for one sub route, or null. Pure, so it can be reasoned about
 * and tested without a clock or a screen.
 *
 * @param {object} loop     the sub route
 * @param {object} schedule its worked-out schedule
 * @param {number} now      minutes past midnight
 * @param {boolean} onThisDay whether today really is this sub route's day
 */
export function loopReminder({ loop, schedule, now, onThisDay = true }) {
  if (!loop || !onThisDay || !schedule?.stops?.length) return null;

  const back = schedule.returnMinutes || 0;
  const estimated = !schedule.returnMinutes;
  const walk = estimated ? 20 : back;
  const deadline = schedule.returnByMinutes;
  if (deadline == null) return null;

  // Nothing to say before you have left, or once you are past the deadline:
  // a warning about a coach that has gone is not a warning.
  if (now < schedule.departMinutes - 5) return null;
  if (now > deadline + 15) return null;

  const leaveAt = deadline - walk;
  const spare = leaveAt - now;
  const key = `${loop.id}:${deadline}`;

  const last = schedule.stops[schedule.stops.length - 1];
  const target = schedule.endPlace?.name || loop.anchorName || 'the coach';

  if (spare <= 0) {
    if (isHushed(key, walk)) return null;
    return {
      key,
      tone: 'red',
      title: `Leave now — ${target} at ${clockOf(deadline)} is in ${Math.max(0, deadline - now)} minutes`,
      body: `That is exactly the walk back${estimated ? ', about' : ''} ${walk} min.`
        + (last ? ` ${last.place.name} will have to wait for another day.` : ''),
      walk,
      estimated,
      dismiss: 'Not going back',
      deadline,
    };
  }

  if (spare < TIGHT) {
    if (isHushed(key, walk)) return null;
    return {
      key,
      tone: 'amber',
      title: `Leave in ${spare} minute${spare === 1 ? '' : 's'} for ${target}`,
      body: `${estimated ? 'About ' : ''}${walk} min back on foot. ${target} at ${clockOf(deadline)}`
        + `, and you are ${schedule.stops.length} stop${schedule.stops.length === 1 ? '' : 's'} into your own loop.`,
      walk,
      estimated,
      dismiss: 'Got it',
      deadline,
    };
  }

  return null;
}

/**
 * What the strip should say right now, out of everything competing for it.
 * Ranked, and only ever one.
 */
export function strip({ reminders = [], outsideArea = null, stuck = null, queued = null }) {
  const red = reminders.find((r) => r.tone === 'red');
  if (red) return { ...red, sort: 'reminder' };

  if (stuck) return { ...stuck, sort: 'stuck', tone: 'red' };

  const amber = reminders.find((r) => r.tone === 'amber');
  if (amber) return { ...amber, sort: 'reminder' };

  if (outsideArea) return { ...outsideArea, sort: 'area', tone: 'amber' };
  if (queued) return { ...queued, sort: 'queued', tone: 'amber' };
  return null;
}

/** Minutes past midnight, from a Date. */
export const minutesNow = (date = new Date()) => date.getHours() * 60 + date.getMinutes();

function clockOf(minutes) {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
