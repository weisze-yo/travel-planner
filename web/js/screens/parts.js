// Fragments shared by more than one screen.

import { html, raw, icon, delegate, esc } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';

/**
 * The trip bar, with the sync dot in it. A hollow ring while a write is in
 * flight, a solid green dot when everything is sent, an amber dot when
 * changes are waiting for signal — and words only in that last case, because
 * the other two need no explaining.
 */
export function tripChip() {
  const trip = state.trip;
  const sync = store.syncState();
  const words = sync.kind === 'queued' || sync.kind === 'stuck' ? sync.line : '';

  return html`
    <div class="trip-chip">
      <div class="trip-mark">${trip?.code || '··'}</div>
      <div class="grow">
        <div class="trip-name">${trip?.name || 'Your trip'}</div>
        <div class="trip-meta${words ? ' warn' : ''}">
          ${words || `Day ${state.selectedDay} of ${trip?.dayCount || 1} · ${store.day()?.shortDate || ''}`}
        </div>
      </div>
      ${syncDot(sync)}
    </div>`;
}

export function syncDot(sync = store.syncState()) {
  if (sync.kind === 'saving') return html`<span class="sync-ring" aria-label="Saving"></span>`;
  if (sync.kind === 'queued') return html`<span class="sync-dot amber" aria-label="Waiting for signal"></span>`;
  if (sync.kind === 'stuck') return html`<span class="sync-dot red" aria-label="Changes are stuck"></span>`;
  if (sync.kind === 'local') return html`<span class="sync-dot grey" aria-label="Saved on this device only"></span>`;
  return html`<span class="sync-dot jade" aria-label="Saved"></span>`;
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
      Press the pencil to add a stop, or to paste the itinerary in.
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
 * Swipe a row left to delete it. One implementation for every list in the
 * app, so the gesture means the same thing everywhere.
 *
 * Five positions, from the artboards:
 *
 *   at rest      nothing showing
 *   dragging     red fills the track behind the finger; the dustbin sits
 *                20px in from the row's right edge and stays there, so it
 *                never floats in the middle of a widening gap
 *   latched      at 88px — a 44px target with room either side — and the
 *                word DELETE appears. Let go before that and it springs back
 *   confirming   in the row itself, not a dialogue on top of the list.
 *                Reached by tapping the dustbin, or by a decisive swipe past
 *                60% of the row's width, which never lands on delete itself
 *   gone         six seconds to change your mind, above the tab bar
 *
 * Markup:
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
export function swipeToDelete(root, { rowSelector, label, onDelete, name }) {
  const LATCH = 88;      // where the bin holds, and the word appears
  const DECISIVE = 0.6;  // fraction of the row that skips straight to confirm

  const closeAll = (except) => {
    root.querySelectorAll('.swipe-row.open, .swipe-row.confirming').forEach((open) => {
      if (open === except) return;
      open.classList.remove('open', 'confirming');
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

    /** Turns the row itself into the confirmation. */
    const askInRow = () => {
      closeAll(row);
      row.classList.add('confirming');
      face.style.transform = '';
      if (row.querySelector(':scope > .swipe-ask')) return;

      const what = name ? name(row) : (row.dataset.swipeName || 'this');
      const ask = document.createElement('div');
      ask.className = 'swipe-ask';
      ask.innerHTML = `
        <div class="grow">
          <div class="swipe-ask-t">Delete ${esc(what)}?</div>
          <div class="swipe-ask-s">${esc(label(row))}</div>
        </div>
        <button class="swipe-ask-no">Cancel</button>
        <button class="swipe-ask-yes">Delete</button>`;
      row.appendChild(ask);

      ask.querySelector('.swipe-ask-no').addEventListener('click', (event) => {
        event.stopPropagation();
        row.classList.remove('confirming');
        ask.remove();
      });
      ask.querySelector('.swipe-ask-yes').addEventListener('click', async (event) => {
        event.stopPropagation();
        ask.remove();
        row.classList.remove('confirming');
        await onDelete(row);
      });
    };

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
        row.classList.add('dragging-open');
      }

      const width = row.getBoundingClientRect().width || 320;
      const pulled = Math.max(-width, Math.min(0, dx));
      face.style.transform = `translateX(${pulled}px)`;
      // The word only appears once the bin has room for it.
      row.classList.toggle('latched', -pulled >= LATCH);
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
      row.classList.remove('dragging-open');

      const width = row.getBoundingClientRect().width || 320;
      const pulled = startX - event.clientX;

      if (pulled > width * DECISIVE) {
        // A decisive swipe skips the tap and lands on the question, never on
        // the delete itself.
        row.classList.remove('open', 'latched');
        askInRow();
        return;
      }
      const open = pulled >= LATCH;
      face.style.transform = open ? `translateX(${-LATCH}px)` : '';
      row.classList.toggle('open', open);
      row.classList.toggle('latched', open);
    };

    /** A cancelled pointer is an abandoned gesture, not a short one. */
    const cancel = () => {
      stopWatching();
      dragging = false;
      face.style.transform = '';
      row.classList.remove('open', 'latched', 'dragging-open');
    };

    row.addEventListener('pointerdown', (event) => {
      // A swipe can start anywhere on the row, including on the buttons that
      // cover most of it — if the gesture turns into a drag the trailing
      // click is swallowed, so the button is not also activated. Only the
      // bin, the confirmation and the form controls opt out.
      if (event.target.closest('[data-swipe-delete], .swipe-ask, select, input, textarea')) return;
      if (row.classList.contains('confirming')) return;
      startX = event.clientX;
      startY = event.clientY;
      dragging = true;
      decided = false;
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

    // The dustbin asks in the row rather than deleting.
    bin?.addEventListener('click', (event) => {
      event.stopPropagation();
      askInRow();
    });
  }
}

/**
 * The line that appears above the tab bar for the six seconds a deletion can
 * be taken back. One at a time, and it does not block the list.
 */
export function undoBar() {
  const hit = state.undo;
  if (!hit) return '';
  return html`
    <div class="undo-bar">
      <div class="grow f13 w650">${hit.label}</div>
      <button class="undo-go" data-act="undo">Undo</button>
    </div>`;
}

/** Binds the Undo button wherever the bar is rendered. */
export function bindUndo(root) {
  delegate(root, '[data-act="undo"]', () => store.undoLast());
}
