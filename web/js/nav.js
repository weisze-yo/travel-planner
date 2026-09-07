// Screen registry and routing. Screens are plain objects: `render()` returns
// markup, `mount(root)` binds handlers. Re-render replaces the whole screen,
// so handlers never go stale — which is why text fields commit on `change`
// (fired as focus leaves) rather than on every keystroke.

import { $, icon, bindRoleButtons } from './util.js';
import { state, subscribe, undoLast } from './store.js';
import * as search from './search.js';

const registry = new Map();
let host = null;
let tabbar = null;
let undoSlot = null;
let current = { id: 'map', params: {} };
let pending = false;
let painted = null;

export const TABS = [
  { id: 'map', label: 'Map', icon: icon.tabMap },
  { id: 'plan', label: 'Plan', icon: icon.tabPlan },
  { id: 'shop', label: 'Shop', icon: icon.tabShop },
  { id: 'prep', label: 'Prep', icon: icon.tabPrep },
  { id: 'log', label: 'Log', icon: icon.tabLog },
];

export function register(screen) {
  registry.set(screen.id, screen);
}

export function start({ hostSelector = '#screen', tabbarSelector = '#tabbar', initial = 'map' } = {}) {
  host = $(hostSelector);
  tabbar = $(tabbarSelector);
  undoSlot = $('#undo');

  // Enter and Space on the cards that wear role="button". Once, on the
  // document, because the screen host is replaced on every paint.
  bindRoleButtons();

  // §3.4 · search, mounted once. Every screen's header contributes only the
  // magnifier; the panel and its state belong to the app.
  search.mount($('#search'));
  host.parentElement?.addEventListener('click', (e) => {
    if (e.target.closest('[data-act="search-open"]')) search.openPanel();
  });

  // One undo line for the whole app, so a deletion on any screen can be
  // taken back from the same place.
  undoSlot?.addEventListener('click', (e) => {
    if (e.target.closest('[data-act="undo"]')) undoLast();
  });

  tabbar.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (tab) go(tab.dataset.tab);
  });

  // Back/forward and the iOS swipe-back gesture.
  window.addEventListener('popstate', (e) => {
    const target = e.state && registry.has(e.state.id) ? e.state : { id: initial, params: {} };
    current = { id: target.id, params: target.params || {} };
    paint();
  });

  subscribe(schedule);
  current = { id: initial, params: {} };
  history.replaceState(current, '', location.hash || '#map');
  paint();
}

export function go(id, params = {}, { replace = false } = {}) {
  if (!registry.has(id)) return;
  // Point 9: edit mode is a mode of the Plan screen, not of the app.
  if (id !== 'plan' && state.editingPlan) state.editingPlan = false;
  current = { id, params };
  const entry = { id, params };
  const url = `#${id}`;
  if (replace) history.replaceState(entry, '', url);
  else history.pushState(entry, '', url);
  paint();
  host.scrollTop = 0;
}

export const back = () => history.back();

export const currentScreen = () => current;

/** Coalesces bursts of store writes into one paint. */
function schedule() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    paint();
  });
}

function paint() {
  if (!host) return;
  const screen = registry.get(current.id);
  if (!screen) return;

  // §3.6 · the tab bar is a sibling of the screen host, so a screen cannot
  // reach it. It is chrome, so the chrome owns the reset: cleared on every
  // paint, and re-set by whichever screen still wants it in its own mount.
  document.body.classList.remove('front-form');

  // Only a re-render of the same screen should keep its scroll position;
  // carrying it into a different screen leaves the new one part-scrolled.
  const scrollers = painted === current.id ? captureScroll() : [];

  // Screens bind handlers with event delegation on their root. Replacing the
  // host with a fresh clone throws those listeners away with the old node —
  // otherwise every screen's handlers pile up and fire on later screens.
  const fresh = host.cloneNode(false);
  fresh.innerHTML = String(screen.render(current.params) ?? '');
  host.replaceWith(fresh);
  host = fresh;

  screen.mount?.(host, current.params);
  restoreScroll(scrollers);
  // §3.4 · the search flash is a property of the app, not of the screen that
  // happens to be drawing, so it is re-applied here: the host node is
  // replaced on every paint and a class added to a row goes with the old one.
  search.restoreFlash();
  painted = current.id;
  // The invite and the sign-in are a web page an outsider opened, not the
  // app: they get no tab bar at all. Every other screen keeps it, including
  // the ones that highlight no tab.
  paintTabs(screen.chrome === false ? null : (screen.tab || current.id));
  paintUndo();
}

/** Keeps list position across a re-render, so ticking row 12 does not jump. */
function captureScroll() {
  return Array.from(host.querySelectorAll('.scroll')).map((el) => el.scrollTop);
}


function restoreScroll(values) {
  const scrollers = host.querySelectorAll('.scroll');
  values.forEach((top, i) => {
    if (scrollers[i] && top) scrollers[i].scrollTop = top;
  });
}

/** The six seconds a deletion can be taken back. */
function paintUndo() {
  if (!undoSlot) return;
  const hit = state.undo;
  if (!hit) {
    undoSlot.hidden = true;
    undoSlot.innerHTML = '';
    return;
  }
  undoSlot.innerHTML = `<div class="undo-bar">
    <div class="grow">${hit.label}</div>
    <button class="undo-go" data-act="undo">Undo</button>
  </div>`;
  undoSlot.hidden = false;
}

function paintTabs(activeTab) {
  if (!tabbar) return;
  // The five tabs only mean something inside a trip.
  if (!state.tripID || activeTab === null) {
    tabbar.hidden = true;
    tabbar.innerHTML = '';
    return;
  }
  tabbar.innerHTML = TABS.map((tab) => {
    const on = tab.id === activeTab;
    const colour = on ? '#14201C' : '#9AA6A1';
    return `<button class="tab${on ? ' on' : ''}" data-tab="${tab.id}" aria-label="${tab.label}"${on ? ' aria-current="page"' : ''}>
      ${tab.icon(colour)}<span class="tab-label">${tab.label}</span>
    </button>`;
  }).join('');
  tabbar.hidden = false;
}
