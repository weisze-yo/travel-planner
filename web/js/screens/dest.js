// Screen 2c — Destination. Need-to-know as a label/value table rather than
// icon soup, both map handoffs above it, and doorways into the things that
// hang off this stop: nearby, must-see, shopping, and the day's note.

import { html, raw, icon, delegate, money } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go, back } from '../nav.js';
import { mapsLinks } from './parts.js';

const TABS = [
  { id: 'info', label: 'Info' },
  { id: 'nearby', label: 'Nearby' },
  { id: 'mustsee', label: 'Must-see' },
  { id: 'shop', label: 'Shop' },
  { id: 'log', label: 'Log' },
];

/** Which panel is showing. Point 7: the tabs stay on this screen. */
let tab = 'info';

/** Resolves whichever handle the caller had: a plan row, or a nearby place. */
export function subject(params = {}) {
  if (params.itemID) {
    const hit = store.planItem(params.itemID);
    if (hit) {
      return {
        kind: 'item',
        id: hit.item.id,
        name: hit.item.name,
        subtitle: hit.item.subtitle,
        summary: hit.item.summary || hit.item.note,
        window: hit.item.windowLabel,
        essentials: hit.item.essentials?.length
          ? hit.item.essentials
          : (store.place(hit.item.placeID)?.essentials || []),
        placeID: hit.item.placeID,
        // A stop is a visit to a place, so everything hangs off the place.
        anchorID: hit.item.placeID,
        number: store.mainStopNumbers(store.day(hit.dayNumber))[hit.item.id],
        coord: hit.item.latitude ? { lat: hit.item.latitude, lng: hit.item.longitude } : null,
      };
    }
  }
  if (params.placeID) {
    const p = store.place(params.placeID);
    if (p) {
      return {
        kind: 'place',
        id: p.id,
        name: p.name,
        subtitle: `${store.categoryLabel(p.category)} · ${p.priceTier}`,
        summary: p.note,
        window: '',
        essentials: p.essentials || [],
        placeID: p.id,
        // Every place is its own thing: its Nearby list, its shots, its
        // shopping — exactly what a stop shows, because a stop is one of these.
        anchorID: p.id,
        number: null,
        coord: p.latitude ? { lat: p.latitude, lng: p.longitude } : null,
      };
    }
  }
  // Default to the stop the sub route hangs off — the one with slack.
  const day = store.day();
  const anchorID = store.subRoute()?.anchorPlanItemID;
  const fallback = store.activeItems(day).find((i) => i.id === anchorID)
    || store.activeItems(day).find((i) => i.kind === 'main');
  return fallback ? subject({ itemID: fallback.id }) : null;
}

export default {
  id: 'dest',
  tab: 'map',

  render(params) {
    const it = subject(params);
    if (!it) {
      return html`<section class="screen"><div class="empty">This stop is no longer on your plan.</div></section>`;
    }

    // Everything on this screen is scoped to this one stop.
    const shopHere = state.shopping.filter((row) => (
      row.placeID ? row.placeID === it.placeID : row.placeLabel === it.name
    ));
    const shots = store.shotsFor(it.anchorID);
    const places = store.nearbyPlaces(it.anchorID);
    // Item 04: every note about this place, whichever day it was written on.
    const notes = store.notesForPlace(it.placeID, { name: it.name });
    const counts = {
      info: 0,
      nearby: places.length,
      mustsee: shots.length,
      shop: shopHere.length,
      log: notes.length,
    };

    return html`
      <section class="screen">
        <div class="scroll">
          <div class="hero placeholder-hatch">
            <button class="hero-back" data-act="back" aria-label="Back">${raw(icon.back)}</button>
            <span class="hero-tag">Photo placeholder</span>
            <div class="hero-badges">
              ${it.number ? html`<span class="hero-badge">MAIN ROUTE · STOP ${it.number}</span>` : ''}
              ${it.window ? html`<span class="hero-badge light">${it.window}</span>` : ''}
            </div>
          </div>

          <div class="dest-body">
            <div class="dest-name">${it.name}</div>
            ${it.subtitle ? html`<div class="dest-sub">${it.subtitle}</div>` : ''}
            ${it.summary ? html`<div class="dest-desc">${it.summary}</div>` : ''}

            <div class="row g8 mt14">
              <a class="btn ink grow" href="${mapsLinks.google(it.name, it.coord)}" target="_blank" rel="noopener">Google Maps</a>
              <a class="btn ghost grow" href="${mapsLinks.apple(it.name, it.coord)}" target="_blank" rel="noopener">Apple Maps</a>
            </div>

            <div class="dest-tabs">
              ${TABS.map((entry) => html`
                <button class="dest-tab${entry.id === tab ? ' on' : ''}" data-panel="${entry.id}">
                  ${entry.label}${counts[entry.id] ? html` <span class="tab-count">${counts[entry.id]}</span>` : ''}
                </button>
              `)}
            </div>
          </div>

          <div style="padding:14px 16px 24px">
            ${panel(tab, it, { shopHere, shots, places, notes })}
          </div>
        </div>
      </section>`;
  },

  mount(root, params) {
    const it = subject(params);
    delegate(root, '[data-act="back"]', () => back());
    delegate(root, '[data-panel]', (el) => {
      tab = el.dataset.panel;
      // Repaint through the store so the whole screen re-renders once.
      store.selectDay(state.selectedDay);
    });

    // Panels that lead somewhere still can.
    delegate(root, '[data-act="arrange"]', () => go('sub', { loopID: store.activeLoop()?.id }));
    delegate(root, '[data-act="all-nearby"]', () => go('nearby', {
      anchorID: it?.anchorID, anchorName: it?.name, placeID: it?.placeID,
    }));
    delegate(root, '[data-act="all-shop"]', () => go('shop'));
    delegate(root, '[data-act="all-shots"]', () => go('mustsee', {
      anchorID: it?.anchorID, anchorName: it?.name,
    }));
    delegate(root, '[data-act="note"]', () => go('note', {
      dayNumber: state.selectedDay, placeID: it?.placeID, placeName: it?.name,
    }));
    delegate(root, '[data-edit-note]', (el) => go('note', {
      noteID: el.dataset.editNote, dayNumber: Number(el.dataset.noteDay),
    }));
    delegate(root, '[data-act="tick-shot"]', (el) => store.toggleShot(el.dataset.id));
    delegate(root, '[data-act="tick-item"]', (el) => store.toggleBought(el.dataset.id));
    // Point: the "+" works from inside a stop too, not only on the Nearby screen.
    delegate(root, '[data-pick]', (el) => store.toggleSubRoutePlace(el.dataset.pick, store.activeLoop()));
    delegate(root, '[data-open-place]', (el) => go('dest', { placeID: el.dataset.openPlace }));
  },
};

// ------------------------------------------------------------------ panels

function panel(which, it, { shopHere, shots, places, notes }) {
  if (which === 'nearby') return nearbyPanel(it, places);
  if (which === 'mustsee') return shotsPanel(it, shots);
  if (which === 'shop') return shopPanel(it, shopHere);
  if (which === 'log') return logPanel(it, notes);
  return infoPanel(it);
}

function infoPanel(it) {
  if (!it.essentials.length) {
    return html`
      <div class="card pad">
        <div class="eyebrow">NEED TO KNOW</div>
        <div class="f125 muted lh145 mt6">
          Nothing saved for this stop yet. Paste a map link when you add a place and
          anything OpenStreetMap knows — hours, phone, website — lands here.
        </div>
      </div>`;
  }
  return html`
    <div class="card-list">
      ${it.essentials.map((row) => html`
        <div class="essential">
          <div class="essential-k">${row.key}</div>
          <div class="grow">
            <div class="essential-v">${row.value}</div>
            ${row.detail ? html`<div class="essential-d">${row.detail}</div>` : ''}
          </div>
        </div>`)}
    </div>`;
}

function nearbyPanel(it, places) {
  const loop = store.activeLoop();
  const schedule = store.loopSchedule(loop);
  return html`
    ${places.length ? html`
      <div class="col g8">
        ${places.map((place) => {
          const picked = store.isInSubRoute(place.id, store.activeLoop());
          const travel = (place.legs || []).reduce((sum, leg) => sum + leg.minutes, 0);
          return html`
            <div class="nearby-card${picked ? ' picked' : ''}">
              <button class="nearby-thumb" data-open-place="${place.id}" aria-label="Open ${place.name}"></button>
              <div class="grow">
                <div class="row g6" style="align-items:baseline">
                  <button class="nearby-name" style="text-align:left" data-open-place="${place.id}">${place.name}</button>
                  <span class="nearby-price">${place.priceTier}</span>
                </div>
                <div class="nearby-note">
                  ${store.categoryLabel(place.category)} · ${store.duration(travel)} away${place.latitude ? '' : ' · no location'}
                </div>
              </div>
              <button class="nearby-add${picked ? ' on' : ''}" data-pick="${place.id}"
                      aria-label="${picked
                        ? `Take ${place.name} out of ${loop?.name || 'the loop'}`
                        : `Add ${place.name} to ${loop?.name || 'a new stretch of free time'}`}">
                ${picked ? '✓' : '+'}
              </button>
            </div>`;
        })}
      </div>
      ${schedule.stops.length ? html`
        <button class="linkrow mt10" data-act="arrange">
          <div class="linkrow-mark">↩</div>
          <div class="grow">
            <div class="linkrow-t">${loop.name} · ${schedule.stops.length} stops</div>
            <div class="linkrow-s">${store.subSummaryLine(loop)}</div>
          </div>
          ${raw(icon.chevron)}
        </button>` : ''}
    ` : html`
      <div class="empty">Nothing saved around this stop yet.</div>`}

    <button class="btn-dashed mt10" data-act="all-nearby">
      ${places.length ? 'Manage places for this stop' : '+ Add a place here'}
    </button>`;
}

function shotsPanel(it, shots) {
  return html`
    ${shots.length ? html`
      <div class="col g10">
        ${shots.map((shot) => html`
          <div class="card" style="overflow:hidden">
            <div class="row g10" style="padding:12px">
              <button class="box${shot.captured ? ' on' : ''}" data-act="tick-shot" data-id="${shot.id}"
                      role="checkbox" aria-checked="${shot.captured ? 'true' : 'false'}"
                      aria-label="Mark ${shot.title} as taken">
                ${raw(icon.tick('#fff', 11))}
              </button>
              <div class="grow">
                <div class="f13 w700">${shot.title}</div>
                <div class="f115 muted lh145 mt2">${shot.summary}</div>
                <div class="shot-where">${raw(icon.pin)}${shot.whereToFind}</div>
              </div>
              <span class="shot-tag">${shot.tag}</span>
            </div>
          </div>`)}
      </div>
      <button class="btn-dashed mt10" data-act="all-shots">Open the full cards</button>
    ` : html`
      <div class="empty">
        No must-see spots noted for this stop.<br>
        Adding your own is still to come.
      </div>`}`;
}

function shopPanel(it, items) {
  const symbol = state.trip?.currencySymbol || '¥';
  const spent = items.filter((i) => i.bought)
    .reduce((sum, i) => sum + (i.paidAmount ?? i.estimate ?? 0), 0);
  return html`
    ${items.length ? html`
      <div class="card-list">
        ${items.map((item) => html`
          <div class="item">
            <div class="item-top">
              <button class="box${item.bought ? ' on' : ''}" data-act="tick-item" data-id="${item.id}"
                      role="checkbox" aria-checked="${item.bought ? 'true' : 'false'}"
                      aria-label="Mark ${item.name} as bought">
                ${raw(icon.tick('#fff', 11))}
              </button>
              <div class="grow">
                <div class="item-name${item.bought ? ' done' : ''}">${item.name}</div>
                ${item.detail ? html`<div class="item-sub">${item.detail}</div>` : ''}
              </div>
              <div class="right none">
                <div class="item-est">${money(item.paidAmount ?? item.estimate ?? 0, symbol)}</div>
                <div class="item-est-cap">${item.paidAmount != null ? 'paid' : 'est.'}</div>
              </div>
            </div>
          </div>`)}
      </div>
      <div class="f115 muted mt8">
        ${items.filter((i) => i.bought).length} of ${items.length} bought · ${money(spent, symbol)} spent here
      </div>
    ` : html`
      <div class="empty">Nothing on your shopping list for this stop.</div>`}

    <button class="btn-dashed mt10" data-act="all-shop">Open the whole shopping list</button>`;
}

/**
 * Item 04, from this side. A place's Log tab used to be able to show only the
 * day's single note, and only if that note happened to be filed here — which
 * was honest and useless. It now shows every note about this place, with the
 * day each one belongs to, and adding another does not overwrite the last.
 */
function logPanel(it, notes) {
  return html`
    ${notes.length ? html`
      <div class="col g8">
        ${notes.map((note) => html`
          <div class="card pad">
            <div class="row between g8" style="align-items:baseline">
              <div class="f13 w700">Day ${note.dayNumber} · ${store.day(note.dayNumber)?.shortDate || ''}</div>
              <button class="f11 w650" style="color:var(--jade)" data-edit-note="${note.id}"
                      data-note-day="${note.dayNumber}">Edit</button>
            </div>
            <div class="log-text">${note.text || 'Nothing written yet.'}</div>
            ${note.photoPaths?.length ? html`
              <div class="row g6 wrap mt10">
                ${note.photoPaths.map((src) => html`
                  <div class="photo-thumb"><img src="${src}" alt=""></div>`)}
              </div>` : ''}
          </div>`)}
      </div>
    ` : html`
      <div class="empty">Nothing logged about this place yet.</div>`}

    <button class="btn-dashed mt10" data-act="note">+ Add a note about this place</button>

    <div class="f11 soft lh145 mt10">
      A note belongs to this place on one day, so a week of visits keeps a week of notes.
      Day ${state.selectedDay} is the one it will be filed under; the composer can change that.
    </div>`;
}
