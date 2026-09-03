// Boot: bring up storage, register screens, show the first one.

import { $ } from './util.js';
import { boot, closeTrip, state } from './store.js';
import { readActiveTripID } from './persist.js';
import { register, start } from './nav.js';
import * as strip from './strip.js';

import map from './screens/map.js';
import plan from './screens/plan.js';
import dest from './screens/dest.js';
import nearby from './screens/nearby.js';
import sub from './screens/sub.js';
import shop from './screens/shop.js';
import mustsee from './screens/mustsee.js';
import prep from './screens/prep.js';
import log from './screens/log.js';
import note from './screens/note.js';
import trip from './screens/trip.js';
import trips from './screens/trips.js';
import spend from './screens/spend.js';
import paste from './screens/paste.js';
import area from './screens/area.js';
import areas from './screens/areas.js';
import stuck from './screens/stuck.js';
import share from './screens/share.js';
import join from './screens/join.js';
import changes from './screens/changes.js';

for (const screen of [map, plan, dest, nearby, sub, shop, mustsee, prep, log, note, trip, trips, spend, paste, area, areas, stuck, share, join, changes]) {
  register(screen);
}

const cover = $('#boot');

async function main() {
  // Whether a trip was open last time decides where the app lands.
  const remembered = readActiveTripID();

  try {
    await boot();
  } catch (error) {
    console.error('[travel-planner] boot failed', error);
    cover.innerHTML = `<div class="boot-error">Could not load your trip.<br>${String(error.message || error)}</div>`;
    return;
  }

  // With no remembered trip the app opens on the trips home; the demo trip is
  // still loaded behind it so the list has something in it on a first run.
  if (!remembered) closeTrip();

  const asked = (location.hash || '').slice(1);
  const insideTrip = ['map', 'plan', 'shop', 'prep', 'log'].includes(asked);
  // An invite link is a path, not a hash: /j/8QK2-M7VD. It lands on the trip
  // rather than on the app, because whoever opened it has never seen this.
  const invited = /\/j\/[A-Z0-9-]+/i.test(location.pathname) || asked === 'join';
  const initial = invited ? 'join' : (remembered ? (insideTrip ? asked : 'map') : 'trips');
  start({ initial });
  strip.start();

  cover.classList.add('gone');
  setTimeout(() => cover.remove(), 300);

  if (state.stranded) {
    console.warn('[travel-planner] Firebase is configured but could not be reached, so changes are being saved to this browser only and will not sync.');
  } else if (state.mode === 'local') {
    console.info('[travel-planner] No Firebase config — saving to this browser only. See web/js/config.js.');
  }

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

main();
