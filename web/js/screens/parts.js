// Fragments shared by more than one screen.

import { html, raw, icon } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';

export function tripChip() {
  const trip = state.trip;
  return html`
    <div class="trip-chip">
      <div class="trip-mark">${trip?.code || '··'}</div>
      <div class="grow">
        <div class="trip-name">${trip?.name || 'Your trip'}</div>
        <div class="trip-meta">Day ${state.selectedDay} of ${trip?.dayCount || 1} · ${store.day()?.shortDate || ''}</div>
      </div>
      ${raw(icon.caret)}
    </div>`;
}

/** Day selector with that day's forecast icon, as on the map and plan. */
export function dayPills({ small = false } = {}) {
  const count = state.trip?.dayCount || 6;
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const on = n === state.selectedDay;
    const wx = store.weather(n);
    return html`
      <button class="pill${small ? ' small' : ''}${on ? ' on' : ''}" data-day="${n}">
        D${n}<span class="pill-wx">${wx?.icon || ''}</span>
      </button>`;
  });
}

export function emptyDay(weather) {
  return html`
    <div class="empty">
      Nothing planned for this day yet.${weather ? ` Forecast: ${weather.icon} ${weather.high} °C.` : ''}<br>
      Open Plan and press Edit to add a stop.
    </div>`;
}

export function backHeader({ title, sub, action = '' }) {
  return html`
    <div class="head">
      <div class="head-row center">
        <button class="iconbtn" data-act="back" aria-label="Back">${raw(icon.back)}</button>
        <div class="grow">
          <div class="push-title">${title}</div>
          ${sub ? html`<div class="push-sub">${sub}</div>` : ''}
        </div>
        ${raw(action)}
      </div>
    </div>`;
}

export function checkbox(on, { act, id, size = 22 }) {
  return html`
    <button class="box${on ? ' on' : ''}" data-act="${act}" data-id="${id}"
            role="checkbox" aria-checked="${on ? 'true' : 'false'}"
            style="width:${size}px;height:${size}px">
      ${raw(icon.tick('#fff', size === 22 ? 11 : 10))}
    </button>`;
}

export function weatherBanner() {
  const wx = store.weather();
  if (!wx) return '';
  return html`
    <div class="wx-banner">
      <div class="wx-icon">${wx.icon}</div>
      <div class="wx-line">
        Day ${state.selectedDay}: ${wx.summary}, ${wx.high} °C, ${wx.rainChance}% rain. ${wx.low} °C by evening.
        <div class="wx-src">${store.weatherSourceLine()}</div>
      </div>
    </div>`;
}

/** Deep links out to the phone's own map apps, as the brief asked for. */
export const mapsLinks = {
  google: (query, coord) => (coord
    ? `https://www.google.com/maps/search/?api=1&query=${coord.lat},${coord.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`),
  apple: (query, coord) => (coord
    ? `https://maps.apple.com/?ll=${coord.lat},${coord.lng}&q=${encodeURIComponent(query)}`
    : `https://maps.apple.com/?q=${encodeURIComponent(query)}`),
  walk: (points) => {
    if (!points || points.length < 2) return 'https://www.google.com/maps';
    const origin = `${points[0].lat},${points[0].lng}`;
    const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;
    const waypoints = points.slice(1, -1).map((p) => `${p.lat},${p.lng}`).join('|');
    const via = waypoints ? `&waypoints=${waypoints}` : '';
    return `https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${origin}&destination=${destination}${via}`;
  },
};

/**
 * Hold-and-drag reordering that works with both touch and mouse, since the
 * design asks for a grip handle rather than arrow buttons.
 */
export function bindDragReorder(root, { rowSelector, handleSelector, onDrop }) {
  let draggingId = null;
  let overId = null;

  const rowFrom = (target) => target?.closest(rowSelector);
  const clear = () => {
    root.querySelectorAll('.dragging, .drop-into').forEach((el) => {
      el.classList.remove('dragging', 'drop-into');
    });
  };

  const begin = (row) => {
    draggingId = row.dataset.rowId;
    row.classList.add('dragging');
  };

  const moveTo = (point) => {
    const el = document.elementFromPoint(point.clientX, point.clientY);
    const row = rowFrom(el);
    if (!row || row.dataset.rowId === draggingId) return;
    if (overId !== row.dataset.rowId) {
      root.querySelectorAll('.drop-into').forEach((n) => n.classList.remove('drop-into'));
      row.classList.add('drop-into');
      overId = row.dataset.rowId;
    }
  };

  const finish = () => {
    if (draggingId && overId && draggingId !== overId) onDrop(draggingId, overId);
    draggingId = null;
    overId = null;
    clear();
  };

  root.addEventListener('pointerdown', (e) => {
    const handle = e.target.closest(handleSelector);
    const row = rowFrom(handle);
    if (!handle || !row) return;
    e.preventDefault();
    begin(row);
    handle.setPointerCapture?.(e.pointerId);
  });

  root.addEventListener('pointermove', (e) => {
    if (!draggingId) return;
    e.preventDefault();
    moveTo(e);
  });

  root.addEventListener('pointerup', () => { if (draggingId) finish(); });
  root.addEventListener('pointercancel', () => { if (draggingId) { draggingId = null; overId = null; clear(); } });
}
