// What map is kept on this phone, in Trip settings.
//
// One card per area, what it covers, and the honest count of what it does
// not: naming the stops that fall outside every area is the only version of
// that warning you can act on.

import { html, raw, icon, delegate } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { back, go } from '../nav.js';
import { swipeToDelete } from './parts.js';
import * as tiles from '../tiles.js';

let held = null;

export default {
  id: 'areas',
  tab: 'map',

  render() {
    const areas = store.mapAreas();
    const outside = store.stopsOutsideAreas();
    const totalBytes = areas.reduce((n, a) => n + (a.bytes || 0), 0);

    return html`
      <section class="screen">
        <div class="head">
          <div class="head-row center">
            <button class="iconbtn" data-act="back" aria-label="Back">${raw(icon.back)}</button>
            <div class="grow">
              <div class="push-title">Map kept on this phone</div>
              <div class="push-sub">${state.trip?.name || 'This trip'}</div>
            </div>
          </div>
        </div>

        <div class="scroll" style="padding:14px 16px 24px">
          ${areas.length ? areas.map((area) => card(area)) : html`
            <div class="empty">
              No map kept yet. Everything else works offline; only the picture of the streets
              needs the network.
            </div>`}

          <button class="btn-dashed mt10" data-act="draw">
            ${areas.length ? '+ Keep another area' : '+ Keep an area'}
          </button>

          ${outside.stops.length ? html`
            <div class="caveat mt12">
              <div class="f125 w800">
                ${outside.stops.length} stop${outside.stops.length === 1 ? '' : 's'}
                ${outside.stops.length === 1 ? 'is' : 'are'} outside every kept area
              </div>
              <div class="f115 w650 lh145 mt4">
                ${outside.stops.slice(0, 4).map((s) => s.name).join(', ')}${outside.stops.length > 4 ? ' and more' : ''}.
                ${outside.days.length === 1
                  ? `Day ${outside.days[0]} is affected.`
                  : `Days ${outside.days.join(', ')} are affected.`}
              </div>
              <button class="btn ink mt11" style="width:100%;height:38px" data-act="draw-around">
                Draw an area around them
              </button>
            </div>` : (areas.length ? html`
            <div class="hint-jade mt12">
              Every stop with a position is inside an area you have kept.
            </div>` : '')}

          <div class="card pad mt12">
            <div class="eyebrow">STORAGE</div>
            <div class="row g8 mt6" style="align-items:baseline">
              <div class="f18 w700 tnum">${tiles.size(totalBytes)}</div>
              <div class="f115 w650 muted">of map${held ? ` · ${tiles.size(held.bytes)} actually on disk` : ''}</div>
            </div>
            <div class="f115 muted lh145 mt8">
              Kept areas are deleted with the trip. Swipe an area left to remove it on its own.
              ${outside.located
                ? `${outside.covered} of ${outside.located} stops with a position are covered.`
                : 'No stops have a position yet, so there is nothing to check against.'}
            </div>
          </div>

          <div class="f11 soft lh145 mt12">
            Tiles come from OpenStreetMap and are downloaded once per area, two at a time, and
            only when you ask. A box big enough to be a bulk download is refused rather than
            throttled, because those servers are a volunteer's.
          </div>
        </div>
      </section>`;
  },

  mount(root) {
    delegate(root, '[data-act="back"]', () => back());
    delegate(root, '[data-act="draw"]', () => go('area'));
    delegate(root, '[data-act="draw-around"]', () => {
      // A box around exactly the stops that are not covered yet.
      const outside = store.stopsOutsideAreas();
      const points = [];
      for (const d of state.days) {
        for (const item of store.activeItems(d)) {
          if (item.latitude == null) continue;
          if (!outside.stops.some((s) => s.name === item.name)) continue;
          points.push([item.latitude, item.longitude]);
        }
      }
      if (!points.length) {
        go('area');
        return;
      }
      const lats = points.map((p) => p[0]);
      const lngs = points.map((p) => p[1]);
      const pad = 0.012;
      go('area', {
        bbox: [
          Math.min(...lngs) - pad, Math.min(...lats) - pad,
          Math.max(...lngs) + pad, Math.max(...lats) + pad,
        ],
      });
    });
    delegate(root, '[data-resize]', (el) => {
      const area = store.mapAreas().find((a) => a.id === el.dataset.resize);
      if (area) go('area', { bbox: area.bbox });
    });
    delegate(root, '[data-refresh]', async (el) => {
      const area = store.mapAreas().find((a) => a.id === el.dataset.refresh);
      if (area) go('area', { bbox: area.bbox });
    });

    swipeToDelete(root, {
      rowSelector: '[data-area-row]',
      name: (el) => el.dataset.areaName,
      label: () => 'Its tiles go; the trip and its stops stay',
      onDelete: async (el) => {
        const id = el.dataset.areaRow;
        const area = store.mapAreas().find((a) => a.id === id);
        store.deleteMapArea(id);
        if (area) {
          // Tiles another area still needs are not this one's to delete.
          await tiles.forget(area.bbox, area.zoomTo, store.mapAreas());
        }
      },
    });

    // How much is really on disk, as against what the areas claim.
    tiles.kept().then((k) => {
      if (k.count === held?.count) return;
      held = k;
      store.selectDay(state.selectedDay);
    });
  },
};

function card(area) {
  const box = tiles.span(area.bbox);
  const inside = coverage(area);
  const detail = tiles.DETAIL.find((d) => d.zoomTo === area.zoomTo);
  const when = new Date(area.savedAt);

  return html`
    <div class="swipe-row mb10" data-area-row="${area.id}" data-area-name="${area.name}">
      <div class="swipe-bin">
        <button class="bin" data-swipe-delete aria-label="Remove ${area.name}">${raw(icon.bin)}</button>
      </div>
      <div class="swipe-face card pad" style="border-radius:16px">
        <div class="row g10" style="align-items:flex-start">
          <div class="area-thumb"><span></span></div>
          <div class="grow">
            <div class="f14 w700">${area.name}</div>
            <div class="f115 muted mt2">
              ${tiles.size(area.bytes)} · ${detail ? detail.note : `to zoom ${area.zoomTo}`} ·
              kept ${when.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </div>
            <div class="f115 w700 mt4" style="color:var(--jade)">
              ${box.width.toFixed(1)} × ${box.height.toFixed(1)} km${inside.total ? ` · covers ${inside.count} of ${inside.total} stops` : ''}
            </div>
          </div>
        </div>
        <div class="row g8 mt12">
          <button class="btn ghost grow" style="height:38px" data-refresh="${area.id}">Refresh</button>
          <button class="btn ghost grow" style="height:38px" data-resize="${area.id}">Resize on map</button>
        </div>
      </div>
    </div>`;
}

function coverage(area) {
  let total = 0;
  let count = 0;
  for (const d of state.days) {
    for (const item of store.activeItems(d)) {
      if (item.latitude == null) continue;
      total += 1;
      if (tiles.inside(area.bbox, item.latitude, item.longitude)) count += 1;
    }
  }
  return { total, count };
}
