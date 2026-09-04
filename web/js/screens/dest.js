// Screen 2c — Destination. Need-to-know as a label/value table rather than
// icon soup, both map handoffs above it, and doorways into the things that
// hang off this stop: nearby, must-see, shopping, and the day's note.

import { html, raw, icon, delegate, money } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go, back } from '../nav.js';
import { prepare } from '../photos.js';
import {
  backHeader, mapsLinks, swipeToDelete,
  itemEditor, readItemEditor, shotEditor, readShotEditor, factsEditor, readFactsEditor,
} from './parts.js';

const TABS = [
  { id: 'info', label: 'Info' },
  { id: 'nearby', label: 'Nearby' },
  { id: 'mustsee', label: 'Must-see' },
  { id: 'shop', label: 'Shop' },
  { id: 'log', label: 'Notes' },
];

/** Which panel is showing. Point 7: the tabs stay on this screen. */
let tab = 'info';
/** The stop/place `tab` belongs to, so a genuinely different subject resets it. */
let tabSubject = null;

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
        window: store.itemWindow(hit.item).label,
        // The place owns these; a row only ever holds them before the
        // stop-is-a-place migration has run over it.
        essentials: store.place(hit.item.placeID)?.essentials?.length
          ? store.place(hit.item.placeID).essentials
          : (hit.item.essentials || []),
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

/** Which sheet is open over the panels, if any. */
let sheet = null;
const repaint = () => store.selectDay(state.selectedDay);

export default {
  id: 'dest',
  tab: 'map',

  render(params) {
    const it = subject(params);
    if (!it) {
      return html`<section class="screen"><div class="empty">This stop is no longer on your plan.</div></section>`;
    }

    // A different stop/place is a different subject: land back on Info
    // rather than carrying over whichever tab the last one was left on.
    if (it.anchorID !== tabSubject) {
      tabSubject = it.anchorID;
      tab = 'info';
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

        ${sheetMarkup(it, shopHere, shots)}
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

    // --- the three sheets: a shopping item, a must-see spot, and the table.
    delegate(root, '[data-edit-item]', (el) => { sheet = { kind: 'item', id: el.dataset.editItem }; repaint(); });
    delegate(root, '[data-act="add-item"]', () => { sheet = { kind: 'item', id: null }; repaint(); });
    delegate(root, '[data-act="item-cancel"]', () => { sheet = null; repaint(); });
    delegate(root, '[data-act="item-save"]', () => {
      const patch = readItemEditor(root);
      if (!patch) return;
      if (sheet.id) store.updateShoppingItem(sheet.id, patch);
      else store.addShoppingItem({ ...patch, placeID: it?.placeID, placeLabel: patch.placeLabel || it?.name });
      sheet = null;
    });

    delegate(root, '[data-edit-shot]', (el) => { sheet = { kind: 'shot', id: el.dataset.editShot }; repaint(); });
    delegate(root, '[data-act="add-shot"]', () => { sheet = { kind: 'shot', id: null }; repaint(); });
    delegate(root, '[data-act="shot-cancel"]', () => { sheet = null; repaint(); });
    delegate(root, '[data-act="shot-photo-clear"]', () => {
      if (sheet?.id) store.updateShot(sheet.id, { imagePath: null });
      repaint();
    });
    root.querySelector('#shot-photo')?.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file || !sheet) return;
      // The reference picture is a thumbnail on the phone, the same route a
      // Log photo takes when there is no Storage bucket to put it in.
      const { thumbnail } = await prepare(file);
      if (!sheet.id) {
        const made = store.addShot({ placeID: it?.placeID, ...readShotEditor(root), imagePath: thumbnail });
        sheet = made ? { kind: 'shot', id: made.id } : sheet;
      } else {
        store.updateShot(sheet.id, { imagePath: thumbnail });
      }
      repaint();
    });
    delegate(root, '[data-act="shot-save"]', () => {
      const patch = readShotEditor(root);
      if (!patch) return;
      if (sheet.id) store.updateShot(sheet.id, patch);
      else store.addShot({ placeID: it?.placeID, ...patch });
      sheet = null;
    });

    delegate(root, '[data-act="edit-facts"]', () => { sheet = { kind: 'facts' }; repaint(); });
    delegate(root, '[data-act="facts-cancel"]', () => { sheet = null; repaint(); });
    delegate(root, '[data-act="facts-save"]', () => {
      store.updatePlaceFacts(it?.placeID, readFactsEditor(root));
      sheet = null;
    });

    swipeToDelete(root, {
      rowSelector: '[data-shop-row]',
      name: (el) => el.dataset.shopName,
      label: () => 'Off the whole list, not just this stop',
      onDelete: (el) => store.deleteShoppingItem(el.dataset.shopRow),
    });
    swipeToDelete(root, {
      rowSelector: '[data-shot-row]',
      name: (el) => el.dataset.shotName,
      label: () => 'Gone from this place for good',
      onDelete: (el) => store.deleteShot(el.dataset.shotRow),
    });
    delegate(root, '[data-act="note"]', () => go('note', {
      dayNumber: state.selectedDay, placeID: it?.placeID, placeName: it?.name,
    }));
    delegate(root, '[data-edit-note]', (el) => go('note', {
      noteID: el.dataset.editNote, dayNumber: Number(el.dataset.noteDay),
    }));
    swipeToDelete(root, {
      rowSelector: '[data-pnote-row]',
      name: () => 'this note',
      label: () => `Gone from ${it?.name || 'this place'} and the Log for good`,
      onDelete: (el) => store.deleteLogEntry(el.dataset.pnoteRow),
    });
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
          Nothing here yet. Pasting a map link fills in whatever OpenStreetMap has — hours,
          phone, website — and the rest is yours to type.
        </div>
        <button class="btn ghost wide mt12" data-act="edit-facts">Write what to remember</button>
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
    </div>
    <button class="btn ghost wide mt10" data-act="edit-facts">Correct or add to this</button>`;
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
    ` : html`
      <div class="empty">Nothing saved around this stop yet.</div>`}

    <button class="btn-dashed mt10" data-act="all-nearby">
      ${places.length ? 'Manage places for this stop' : '+ Add a place here'}
    </button>

    ${schedule.stops.length ? html`
      <div class="dock-note">
        <button class="linkrow" data-act="arrange">
          <div class="linkrow-mark">↩</div>
          <div class="grow">
            <div class="linkrow-t">${loop.name} · ${schedule.stops.length} stops</div>
            <div class="linkrow-s">${store.subSummaryLine(loop)}</div>
          </div>
          ${raw(icon.chevron)}
        </button>
      </div>` : ''}`;
}

/**
 * The full card, here, rather than a summary and a screen behind it. A
 * must-see spot is mostly a picture and a sentence about where to stand —
 * summarising that to one line and hiding the rest behind a button removed
 * the only part of it you actually use while standing there.
 */
function shotsPanel(it, shots) {
  return html`
    ${shots.length ? html`
      <div class="col g12">
        ${shots.map((shot) => html`
          <div class="swipe-row" data-shot-row="${shot.id}" data-shot-name="${shot.title}">
            <div class="swipe-bin">
              <button class="bin" data-swipe-delete aria-label="Delete ${shot.title}">${raw(icon.bin)}</button>
            </div>
            <div class="swipe-face card" style="overflow:hidden;border-radius:16px">
              <div class="shot-img">
                ${shot.imagePath
                  ? html`<img src="${shot.imagePath}" alt="${shot.title}">`
                  : 'example photo'}
                <button class="shot-tick${shot.captured ? ' on' : ''}" data-act="tick-shot" data-id="${shot.id}"
                        role="checkbox" aria-checked="${shot.captured ? 'true' : 'false'}"
                        aria-label="Mark ${shot.title} as taken">
                  ${raw(icon.tick(shot.captured ? '#fff' : '#B4BEB9', 13))}
                </button>
              </div>
              <div style="padding:12px 14px">
                <div class="row g8" style="align-items:baseline">
                  <div class="shot-title grow">${shot.title}</div>
                  <div class="shot-tag">${shot.tag}</div>
                </div>
                ${shot.summary ? html`<div class="shot-desc">${shot.summary}</div>` : ''}
                ${shot.whereToFind ? html`<div class="shot-where">${raw(icon.pin)}${shot.whereToFind}</div>` : ''}
                <button class="btn ghost sm wide mt10" data-edit-shot="${shot.id}">Edit this spot</button>
              </div>
            </div>
          </div>`)}
      </div>
    ` : html`
      <div class="empty">No must-see spots noted for this stop yet.</div>`}

    <button class="btn-dashed mt12" data-act="add-shot">+ A shot worth getting here</button>`;
}

function shopPanel(it, items) {
  const symbol = state.trip?.currencySymbol || '¥';
  const spent = items.filter((i) => i.bought)
    .reduce((sum, i) => sum + (i.paidAmount ?? i.estimate ?? 0), 0);
  return html`
    ${items.length ? html`
      <div class="card-list">
        ${items.map((item) => html`
          <div class="swipe-row swipe-flat" data-shop-row="${item.id}" data-shop-name="${item.name}">
            <div class="swipe-bin">
              <button class="bin" data-swipe-delete aria-label="Delete ${item.name}">${raw(icon.bin)}</button>
            </div>
            <div class="swipe-face item">
              <div class="item-top">
                <button class="box${item.bought ? ' on' : ''}" data-act="tick-item" data-id="${item.id}"
                        role="checkbox" aria-checked="${item.bought ? 'true' : 'false'}"
                        aria-label="Mark ${item.name} as bought">
                  ${raw(icon.tick('#fff', 11))}
                </button>
                <button class="grow" style="text-align:left" data-edit-item="${item.id}"
                        aria-label="Correct ${item.name}">
                  <div class="item-name${item.bought ? ' done' : ''}">
                    ${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}
                  </div>
                  ${item.detail ? html`<div class="item-sub">${item.detail}</div>` : ''}
                </button>
                <div class="right none">
                  <div class="item-est">${money(item.paidAmount ?? item.estimate ?? 0, symbol)}</div>
                  <div class="item-est-cap">${item.paidAmount != null ? 'paid' : 'est.'}</div>
                </div>
              </div>
            </div>
          </div>`)}
      </div>
      <div class="f115 muted mt8">
        ${items.filter((i) => i.bought).length} of ${items.length} bought · ${money(spent, symbol)} spent here ·
        tap a name to correct it, swipe it left to remove it
      </div>
    ` : html`
      <div class="empty">Nothing on your shopping list for this stop.</div>`}

    <button class="btn-dashed mt10" data-act="add-item">+ Something to buy here</button>
    <button class="btn ghost wide mt8" data-act="all-shop">Open the whole shopping list</button>`;
}

/**
 * A place's notes. Newest first, each with the time it was written, and the
 * tab count is notes rather than days — three notes at one market on one
 * afternoon are three rows here, not one.
 */
function logPanel(it, notes) {
  const today = notes.filter((n) => n.dayNumber === state.selectedDay).length;
  return html`
    <div class="row g8 center mb10">
      <div class="grow f115 w700 muted">
        ${notes.length
          ? `${notes.length} note${notes.length === 1 ? '' : 's'} here${today ? ` · ${today} on day ${state.selectedDay}` : ''}`
          : 'No notes here yet'}
      </div>
      <button class="btn sm ink" data-act="note">+ Note</button>
    </div>

    ${notes.length ? html`
      <div class="col g10" id="place-notes">
        ${notes.map((note) => html`
          <div class="swipe-row" data-pnote-row="${note.id}">
            <div class="swipe-bin">
              <button class="bin" data-swipe-delete aria-label="Delete this note">${raw(icon.bin)}</button>
            </div>
            <button class="swipe-face card pad" style="border-radius:16px"
                    data-edit-note="${note.id}" data-note-day="${note.dayNumber}">
              <div class="row between g8" style="align-items:baseline">
                <div class="f12 w800 tnum">${note.time}</div>
                <div class="f11 w650 soft">Day ${note.dayNumber} · ${store.day(note.dayNumber)?.shortDate || ''}</div>
              </div>
              <div class="log-text">${note.text || 'Nothing written yet.'}</div>
              ${note.photoPaths?.length ? html`
                <div class="row g6 wrap mt10">
                  ${note.photoPaths.map((src) => html`
                    <div class="photo-thumb"><img src="${src}" alt=""></div>`)}
                </div>` : ''}
            </button>
          </div>`)}
      </div>
    ` : html`
      <div class="empty">Nothing logged about this place yet.</div>`}

    <div class="f11 soft lh145 mt12">
      Notes belong to this place, so they stay here across days. The Log shows the same ones
      under ${it.name} on the day each was written.
    </div>`;
}

/** Whichever sheet is open, over the panels. */
function sheetMarkup(it, shopHere, shots) {
  if (!sheet) return '';
  const symbol = state.trip?.currencySymbol || '¥';
  if (sheet.kind === 'item') {
    const item = sheet.id
      ? shopHere.find((i) => i.id === sheet.id)
      : { name: '', detail: '', estimate: null, quantity: 1, placeLabel: it?.name || '' };
    return itemEditor(item, { symbol });
  }
  if (sheet.kind === 'shot') {
    return shotEditor(sheet.id ? shots.find((sh) => sh.id === sheet.id) : null, { placeName: it?.name });
  }
  if (sheet.kind === 'facts') return factsEditor(store.place(it?.placeID));
  return '';
}
