// The one strip above the tab bar.
//
// It is empty nearly all day, which is the point: reminders, the
// offline-map warning and the unsent-changes warning all share this slot,
// one at a time, ranked. Nothing appears in it that cannot be acted on in
// one tap, and when it is empty the screen looks exactly as it did before
// this existed.
//
// It is redrawn on a one-minute tick as well as on every store change,
// because the thing it is mostly watching is the clock.

import { $, esc } from './util.js';
import * as store from './store.js';
import { state } from './store.js';
import { loopReminder, strip as rank, hush, minutesNow } from './remind.js';
import { go } from './nav.js';
import { mapsLinks } from './screens/parts.js';

let slot = null;
let ticker = null;
/** What is showing, so the buttons know what they are acting on. */
let showing = null;

export function start() {
  slot = $('#strip');
  if (!slot) return;

  slot.addEventListener('click', (event) => {
    const act = event.target.closest('[data-strip]')?.dataset.strip;
    if (!act || !showing) return;

    if (act === 'dismiss') {
      hush(showing.key, showing.walk);
      paint();
      return;
    }
    if (act === 'open') {
      go(showing.to || 'map', showing.params || {});
      return;
    }
    if (act === 'walk') {
      window.open(showing.href, '_blank', 'noopener');
    }
  });

  store.subscribe(paint);
  // A minute is fine: the smallest thing it says is "leave in 8 minutes".
  ticker = setInterval(paint, 60_000);
  paint();
}

export function stop() {
  if (ticker) clearInterval(ticker);
  ticker = null;
}

/** What every source of a warning has to say right now. */
function gather() {
  if (!state.tripID || !state.ready) return null;

  const now = minutesNow();
  const today = state.trip ? store.tripCurrentDay(state.trip) : null;
  const onThisDay = store.tripState(state.trip) === 'running';

  const reminders = [];
  if (onThisDay && today != null) {
    for (const loop of store.subRoutesFor(today)) {
      const schedule = store.loopSchedule(loop);
      const hit = loopReminder({ loop, schedule, now, onThisDay });
      if (hit) {
        reminders.push({
          ...hit,
          href: walkHome(schedule),
          to: 'sub',
          params: { loopID: loop.id },
        });
      }
    }
  }

  const sync = store.syncState();
  const stuck = sync.kind === 'stuck' ? {
    key: 'stuck',
    title: sync.line,
    body: 'They are safe on this phone, but they have never reached the cloud. '
      + 'If you lose the phone, you lose them.',
    action: 'See what is stuck',
    to: 'stuck',
  } : null;

  const queued = sync.kind === 'queued' ? {
    key: 'queued',
    title: sync.line,
    body: 'Everything you have typed is already on the phone. This is only about the copy in '
      + 'the cloud, and it clears itself the moment signal returns.',
  } : null;

  const outsideArea = outside();
  return rank({ reminders, outsideArea, stuck, queued });
}

/**
 * Only worth saying when the map you are looking at really has no tiles: on
 * the Map screen, with an area kept somewhere else, and the day's stops
 * outside all of them.
 */
function outside() {
  if (!store.mapAreas().length) return null;
  const day = store.day();
  const stops = store.activeItems(day).filter((i) => i.latitude != null);
  if (!stops.length) return null;
  const uncovered = stops.filter((i) => !store.areaFor(i.latitude, i.longitude));
  if (uncovered.length < stops.length) return null;

  return {
    key: `area:${day?.dayNumber}`,
    title: 'No map here, but the plan still works',
    body: 'You are outside the area you kept. Distances, order and walking times are all '
      + 'worked out on the phone; only the picture of the streets is missing.',
    action: 'Keep this area too',
    to: 'area',
  };
}

function walkHome(schedule) {
  const points = [];
  for (const stop of schedule.stops) {
    if (stop.place.latitude) points.push({ lat: stop.place.latitude, lng: stop.place.longitude });
  }
  if (schedule.endPlace?.latitude) {
    points.push({ lat: schedule.endPlace.latitude, lng: schedule.endPlace.longitude });
  }
  return mapsLinks.walk(points);
}

function paint() {
  if (!slot) return;
  showing = gather();

  if (!showing) {
    slot.hidden = true;
    slot.innerHTML = '';
    return;
  }

  const red = showing.tone === 'red';
  const buttons = [];
  if (showing.href) {
    buttons.push(`<button class="strip-go${red ? ' light' : ''}" data-strip="walk">Walk back in Maps</button>`);
  } else if (showing.action) {
    buttons.push(`<button class="strip-go${red ? ' light' : ''}" data-strip="open">${esc(showing.action)}</button>`);
  }
  if (showing.dismiss) {
    buttons.push(`<button class="strip-quiet" data-strip="dismiss">${esc(showing.dismiss)}</button>`);
  }

  slot.innerHTML = `
    <div class="strip ${red ? 'red' : 'amber'}">
      <div class="strip-top">
        <div class="strip-mark">${red ? '!' : clockGlyph()}</div>
        <div class="grow">
          <div class="strip-title">${esc(showing.title)}</div>
          <div class="strip-body">${esc(showing.body)}</div>
        </div>
      </div>
      ${buttons.length ? `<div class="strip-acts">${buttons.join('')}</div>` : ''}
      ${showing.sort === 'reminder' ? `<div class="strip-fine">${
        showing.estimated
          ? 'The walk back was never measured, so that is the app’s own guess. '
          : ''
      }Said once. It comes back only if the walk gets 10 minutes longer.</div>` : ''}
    </div>`;
  slot.hidden = false;
}

const clockGlyph = () => (
  '<svg width="15" height="15" viewBox="0 0 16 16" fill="none">'
  + '<circle cx="8" cy="8" r="6.4" stroke="currentColor" stroke-width="1.7"/>'
  + '<path d="M8 4.4V8l2.4 1.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>'
);
