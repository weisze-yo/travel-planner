// Screen 2c — Destination. Need-to-know as a label/value table rather than
// icon soup, both map handoffs above it, and doorways into the things that
// hang off this stop: nearby, must-see, shopping, and the day's note.

import { html, raw, icon, delegate } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go, back } from '../nav.js';
import { mapsLinks } from './parts.js';

const TABS = [
  { id: 'info', label: 'Info' },
  { id: 'nearby', label: 'Nearby' },
  { id: 'mustsee', label: 'Must-see' },
  { id: 'shop', label: 'Shop' },
  { id: 'note', label: 'Log' },
];

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
        essentials: hit.item.essentials || [],
        placeID: hit.item.placeID,
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
        essentials: [],
        placeID: p.id,
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

    const shopHere = state.shopping.filter((s) => s.placeLabel === it.name);
    const shots = state.mustSee.filter((s) => !it.placeID || s.placeID === it.placeID);
    const nearbyCount = store.nearbyPlacesFor(it.placeID).length;

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
              ${TABS.map((tab) => html`
                <button class="dest-tab${tab.id === 'info' ? ' on' : ''}" data-tab-to="${tab.id}">${tab.label}</button>
              `)}
            </div>
          </div>

          <div style="padding:14px 16px 24px">
            ${it.essentials.length ? html`
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
            ` : html`
              <div class="card pad">
                <div class="eyebrow">NEED TO KNOW</div>
                <div class="f125 muted lh145 mt6">
                  No opening hours or transport saved for this stop yet. Anything you add on the
                  Nearby screen shows up here.
                </div>
              </div>`}

            <div class="row g10 mt12">
              <button class="doorway amber" data-tab-to="nearby">
                <div class="doorway-h" style="color:var(--amber-fg)">NEARBY</div>
                <div class="doorway-v">${nearbyCount} places</div>
                <div class="doorway-s" style="color:var(--amber-fg)">Sorted by travel time</div>
              </button>
              <button class="doorway jade" data-tab-to="mustsee">
                <div class="doorway-h" style="color:var(--jade)">MUST-SEE</div>
                <div class="doorway-v">${shots.length} spots</div>
                <div class="doorway-s" style="color:var(--jade)">Known shots at this stop</div>
              </button>
            </div>

            <button class="linkrow mt10" data-tab-to="shop">
              <div class="linkrow-mark" style="font-size:15px;font-weight:700">袋</div>
              <div class="grow">
                <div class="linkrow-t">${shopHere.length ? `${shopHere.length} items on your list here` : 'Shopping list'}</div>
                <div class="linkrow-s">${shopHere.length ? shopHere.map((s) => s.name).join(', ') : 'Nothing listed for this stop yet'}</div>
              </div>
              ${raw(icon.chevron)}
            </button>

            <button class="linkrow mt10" data-tab-to="note">
              <div class="linkrow-mark">${raw(icon.pencil('#3D4C46', 15))}</div>
              <div class="grow">
                <div class="linkrow-t">Add a note</div>
                <div class="linkrow-s">Log what happened at this stop</div>
              </div>
              ${raw(icon.chevron)}
            </button>
          </div>
        </div>
      </section>`;
  },

  mount(root, params) {
    const it = subject(params);
    delegate(root, '[data-act="back"]', () => back());
    delegate(root, '[data-tab-to]', (el) => {
      const target = el.dataset.tabTo;
      if (target === 'info') return;
      if (target === 'note') {
        go('note', { dayNumber: state.selectedDay, placeID: it?.placeID, placeName: it?.name });
        return;
      }
      go(target, { placeID: it?.placeID, anchorName: it?.name, itemID: it?.kind === 'item' ? it.id : undefined });
    });
  },
};
