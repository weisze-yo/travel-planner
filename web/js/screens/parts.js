// Fragments shared by more than one screen.

import { html, raw, icon, delegate } from '../util.js';
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

/**
 * Point 10: iOS has no public way to open the Weather app from a web page, so
 * the strip opens a detailed hourly forecast for the trip's coordinates in a
 * new tab instead.
 */
export function forecastURL() {
  const trip = state.trip;
  const where = trip?.locationName?.trim();
  // A search lands on the familiar weather panel, with hourly and ten-day —
  // detail the strip in the app cannot hold.
  const query = where
    ? `weather forecast ${where}`
    : `weather forecast ${trip?.latitude ?? 0},${trip?.longitude ?? 0}`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function weatherBanner() {
  const wx = store.weather();
  if (!wx) return '';
  return html`
    <a class="wx-banner" href="${forecastURL()}" target="_blank" rel="noopener">
      <div class="wx-icon">${wx.icon}</div>
      <div class="wx-line">
        Day ${state.selectedDay}: ${wx.summary}, ${wx.high} °C, ${wx.rainChance}% rain. ${wx.low} °C by evening.
        <div class="wx-src">${store.weatherStatus().line} · tap for the hourly forecast</div>
      </div>
      ${raw(icon.chevron)}
    </a>`;
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


/**
 * Swipe a row left to reveal a dustbin; tapping it asks before deleting.
 * One implementation for every list in the app, so the gesture means the same
 * thing everywhere. Works with touch and with a mouse drag.
 *
 *   <div class="swipe-row" data-my-row="id">
 *     <div class="swipe-bin"><button class="bin" data-swipe-delete>…</button></div>
 *     <div class="swipe-face">…the row…</div>
 *   </div>
 *
 * Listeners go on each row rather than on a shared parent: a row is thrown
 * away whenever its screen re-renders, and its listeners go with it, so
 * nothing can accumulate or leak between screens.
 */
export function swipeToDelete(root, { rowSelector, label, onDelete }) {
  const OPEN_AT = 68;   // how far the face slides to expose the bin
  const TRIGGER = 34;   // drag past this and it stays open

  const closeAll = (except) => {
    root.querySelectorAll('.swipe-row.open').forEach((open) => {
      if (open === except) return;
      open.classList.remove('open');
      const face = open.querySelector(':scope > .swipe-face');
      if (face) face.style.transform = '';
    });
  };

  for (const row of root.querySelectorAll(rowSelector)) {
    if (row.dataset.swipeBound) continue;
    row.dataset.swipeBound = '1';

    const face = row.querySelector(':scope > .swipe-face');
    const bin = row.querySelector('[data-swipe-delete]');
    if (!face) continue;

    let startX = 0;
    let startY = 0;
    let dragging = false;
    let decided = false;
    // A drag ends in a click as well — the click that must not be treated as
    // a tap on the row, or it would close what the swipe just opened.
    let swallowClick = false;

    const move = (event) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      // Decide once whether this is a horizontal swipe or a vertical scroll,
      // so scrolling a long list never peels rows open.
      if (!decided) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        decided = true;
        if (Math.abs(dy) > Math.abs(dx)) {
          dragging = false;
          return;
        }
        closeAll(row);
      }

      face.style.transform = `translateX(${Math.max(-OPEN_AT, Math.min(0, dx))}px)`;
      if (event.cancelable) event.preventDefault();
    };

    const stopWatching = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', cancel);
    };

    const end = (event) => {
      stopWatching();
      if (!dragging) return;
      dragging = false;
      swallowClick = decided;

      const open = (event.clientX - startX) < -TRIGGER;
      face.style.transform = open ? `translateX(${-OPEN_AT}px)` : '';
      row.classList.toggle('open', open);
    };

    /** A cancelled pointer is an abandoned gesture, not a short one. */
    const cancel = () => {
      stopWatching();
      dragging = false;
      face.style.transform = '';
      row.classList.remove('open');
    };

    row.addEventListener('pointerdown', (event) => {
      // A swipe can start anywhere on the row, including on the buttons that
      // cover most of it — if the gesture turns into a drag the trailing click
      // is swallowed, so the button is not also activated. Only the bin and
      // the form controls opt out, since dragging those means something else.
      if (event.target.closest('[data-swipe-delete], select, input, textarea')) return;
      startX = event.clientX;
      startY = event.clientY;
      dragging = true;
      decided = false;
      // On the window, so a gesture that leaves the row still completes.
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', cancel);
    });

    // Tapping the row while it is open just closes it again — but the click
    // that ends the swipe itself is not a tap.
    face.addEventListener('click', (event) => {
      if (swallowClick) {
        swallowClick = false;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (!row.classList.contains('open')) return;
      event.preventDefault();
      event.stopPropagation();
      closeAll(null);
    }, true);

    bin?.addEventListener('click', async (event) => {
      event.stopPropagation();
      // eslint-disable-next-line no-alert -- deliberate: deletion is permanent.
      if (!window.confirm(label(row))) {
        closeAll(null);
        return;
      }
      await onDelete(row);
      closeAll(null);
    });
  }
}
