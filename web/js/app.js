// Boot: bring up storage, register screens, show the first one.

import { $ } from './util.js';
import { boot, state } from './store.js';
import { register, start } from './nav.js';

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

for (const screen of [map, plan, dest, nearby, sub, shop, mustsee, prep, log, note, trip]) {
  register(screen);
}

const cover = $('#boot');

async function main() {
  try {
    await boot();
  } catch (error) {
    console.error('[travel-planner] boot failed', error);
    cover.innerHTML = `<div class="boot-error">Could not load your trip.<br>${String(error.message || error)}</div>`;
    return;
  }

  const initial = (location.hash || '#map').slice(1);
  start({ initial: ['map', 'plan', 'shop', 'prep', 'log'].includes(initial) ? initial : 'map' });

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
