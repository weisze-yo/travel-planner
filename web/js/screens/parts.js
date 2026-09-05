// Fragments shared by more than one screen.

import { html, raw, icon, delegate, esc } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { initialFor } from '../share.js';

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

/**
 * Tier 3 of the empty-state system: somebody else's side. Used wherever an
 * empty container's cause is `store.isSharedEmptyKind()` — the copy you were
 * handed has this empty, not you. Never ink; at most one ghost/amber action,
 * and only for something that is yours to do meanwhile (§2.4.5).
 *
 * The third cause of emptiness — nothing has arrived at all yet — gets the
 * join context line instead of the two body sentences; both read off
 * `store.sharedEmptyContext()` rather than being decided here, so a screen
 * cannot silently demote a tier-3 surface to tier 1 by guessing wrong.
 */
export function emptyShared({ title, action = null }) {
  const ctx = store.sharedEmptyContext();
  if (!ctx) return '';
  return html`
    <div class="empty-shared">
      <div class="eyebrow jade">SHARED WITH YOU</div>
      <div class="empty-shared-t">${title}</div>
      ${ctx.justJoined ? html`
        <div class="empty-shared-ctx">
          <span class="who-mark sm" aria-hidden="true">${initialFor(ctx.ownerName)}</span>
          <span class="grow">joined ${ctx.joinedAgo} · no updates yet</span>
        </div>` : html`
        <div class="empty-shared-b">
          Anything ${ctx.ownerName} adds arrives with the next update. Nothing changes on your
          side until you have looked through it.
        </div>`}
      ${action ? html`
        <button class="btn amber mt10" data-act="${action.act}"${action.attrs ? raw(` ${action.attrs}`) : ''}>
          ${action.label}
        </button>` : ''}
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

      // Decide whether this is a horizontal swipe or a vertical scroll, so
      // scrolling a long list never peels rows open. A real finger almost
      // never moves in a perfectly straight line from the first sample —
      // especially right here, where the row often sits below the fold and
      // the touch that reaches it carries a little vertical motion left over
      // from scrolling down to it a moment before. Judging direction from a
      // single early sample with a bare dy-vs-dx tie-break locks in a wrong
      // "that's a scroll" call from one unlucky pixel and never revisits it
      // (`dragging` stays false for the rest of the gesture) — so this waits
      // for the vertical lean to be a clear majority, not just a narrow one,
      // before giving up on the swipe, and otherwise keeps sampling rather
      // than committing early either way.
      if (!decided) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        if (Math.abs(dy) > Math.abs(dx) * 1.4) {
          decided = true;
          dragging = false;
          return;
        }
        if (Math.abs(dx) < 12) return;
        decided = true;
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
      // Keeps the gesture reporting to this row even if the finger drifts
      // off it mid-drag, the way bindDragReorder's handle already does —
      // without it a fast real touch can be handed off to whatever the OS
      // decides is underneath, mid-swipe.
      row.setPointerCapture?.(event.pointerId);
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

/**
 * A sheet you can pull up and down over the map.
 *
 * Three heights rather than free dragging: a phone is not precise enough for
 * a continuous handle, and the three that matter are "show me the map",
 * "show me both" and "show me the list". The drag follows your finger and
 * settles on whichever of the three you released nearest, so it still feels
 * continuous; the handle is also a plain button, because a drag-only control
 * is invisible to anyone who cannot drag.
 *
 * The chosen height is remembered per sheet for the session — you set it once
 * on the coach and it stays that way for the day.
 */
const DETENTS = [0.3, 0.5, 0.82];
const heights = new Map();

export function draggableSheet(sheet, { key = 'sheet', onOpen = null } = {}) {
  if (!sheet) return () => {};
  const screen = sheet.closest('.screen') || sheet.parentElement;
  const grab = sheet.querySelector('.sheet-grab');
  let at = heights.get(key) ?? 1;

  const apply = (fraction) => {
    sheet.style.maxHeight = `${Math.round(fraction * 100)}%`;
    sheet.style.height = `${Math.round(fraction * 100)}%`;
  };
  const settle = (index) => {
    at = Math.max(0, Math.min(DETENTS.length - 1, index));
    heights.set(key, at);
    sheet.classList.add('settling');
    apply(DETENTS[at]);
    grab?.setAttribute('aria-label', at === DETENTS.length - 1
      ? 'Shrink the list to see the map'
      : 'Pull the list up');
  };
  settle(at);

  if (!grab) return () => {};

  let startY = null;
  let startFraction = DETENTS[at];
  let moved = 0;

  const down = (event) => {
    startY = event.clientY;
    startFraction = DETENTS[at];
    moved = 0;
    sheet.classList.remove('settling');
    grab.setPointerCapture?.(event.pointerId);
  };

  const move = (event) => {
    if (startY === null) return;
    moved = startY - event.clientY;
    const span = screen?.clientHeight || window.innerHeight;
    const next = Math.max(0.18, Math.min(0.9, startFraction + moved / span));
    apply(next);
  };

  const up = () => {
    if (startY === null) return;
    startY = null;
    const span = screen?.clientHeight || window.innerHeight;
    const landed = startFraction + moved / span;
    // A tap is not a drag: it steps up, and steps back down from the top.
    if (Math.abs(moved) < 6) {
      settle(at === DETENTS.length - 1 ? 0 : at + 1);
      if (at === 0 && onOpen) onOpen();
      return;
    }
    let best = 0;
    for (let i = 1; i < DETENTS.length; i++) {
      if (Math.abs(DETENTS[i] - landed) < Math.abs(DETENTS[best] - landed)) best = i;
    }
    settle(best);
  };

  grab.addEventListener('pointerdown', down);
  grab.addEventListener('pointermove', move);
  grab.addEventListener('pointerup', up);
  grab.addEventListener('pointercancel', up);
  return () => settle(at);
}

/**
 * Correcting a shopping item, wherever you are looking at it.
 *
 * You write the list at home from a guess and correct it in the shop: the
 * name was wrong, it is 1,200 not 5,000, you want three of them, and it
 * turns out to be sold at the other market. All four are one sheet rather
 * than four different places, and it is the same sheet on the trip's list
 * and on a place's Shop tab, because it is the same correction.
 */
export function itemEditor(item, { symbol = '¥' } = {}) {
  if (!item) return '';
  const places = store.shoppingPlaceChoices();
  return html`
    <div class="scrim" data-act="item-cancel"></div>
    <div class="modal">
      <div class="form">
        <div class="form-title">Correct this item</div>
        <label class="f11 soft block">What it is</label>
        <input id="edit-name" value="${esc(item.name || '')}" placeholder="Kitchen knife">
        <label class="f11 soft block">Where in the shop, or anything to remember</label>
        <input id="edit-detail" value="${esc(item.detail || '')}" placeholder="Middle aisle, stall 44">
        <div class="row g8">
          <div class="grow">
            <label class="f11 soft block">What you expect to pay (${esc(symbol)})</label>
            <input id="edit-estimate" type="number" inputmode="numeric" min="0"
                   value="${item.estimate ?? ''}" placeholder="—">
          </div>
          <div style="width:96px">
            <label class="f11 soft block">How many</label>
            <input id="edit-quantity" type="number" inputmode="numeric" min="1" max="99"
                   value="${item.quantity || 1}">
          </div>
        </div>
        <label class="f11 soft block">Bought at</label>
        <select id="edit-place">
          ${places.map((name) => html`
            <option value="${esc(name)}"${name === item.placeLabel ? ' selected' : ''}>${name}</option>`)}
          ${places.includes(item.placeLabel) ? '' : html`
            <option value="${esc(item.placeLabel || '')}" selected>${item.placeLabel || 'Unplanned'}</option>`}
        </select>
        <div class="form-actions">
          <button class="btn jade grow" data-act="item-save">Save</button>
          <button class="btn ghost" style="width:96px" data-act="item-cancel">Cancel</button>
        </div>
        <div class="form-hint">
          The estimate is what the spend report measures your actual spending against. Moving
          it to another place moves it into that place's group on the list.
        </div>
      </div>
    </div>`;
}

/** Reads the editor back. Returns null when the name has been emptied. */
export function readItemEditor(root) {
  const name = root.querySelector('#edit-name')?.value.trim();
  if (!name) return null;
  return {
    name,
    detail: root.querySelector('#edit-detail')?.value ?? '',
    estimate: root.querySelector('#edit-estimate')?.value ?? '',
    quantity: root.querySelector('#edit-quantity')?.value ?? 1,
    placeLabel: root.querySelector('#edit-place')?.value ?? undefined,
  };
}

/**
 * A must-see spot, yours or one that shipped with the trip.
 *
 * The reference picture is optional and stays on the phone as a thumbnail —
 * the same route a Log photo takes — because a shot you cannot picture is
 * just a sentence you will not read again.
 */
export function shotEditor(shot, { placeName = 'this stop' } = {}) {
  const made = Boolean(shot?.id);
  return html`
    <div class="scrim" data-act="shot-cancel"></div>
    <div class="modal">
      <div class="form">
        <div class="form-title">${made ? 'Edit this spot' : `A shot worth getting at ${placeName}`}</div>
        <label class="f11 soft block">What the shot is</label>
        <input id="shot-title" value="${esc(shot?.title || '')}" placeholder="Red lantern run, north gate">
        <label class="f11 soft block">Where to stand</label>
        <input id="shot-where" value="${esc(shot?.whereToFind || '')}" placeholder="20 m inside the north gate">
        <label class="f11 soft block">Anything else worth knowing</label>
        <textarea id="shot-summary" rows="2"
                  placeholder="Best an hour before sunset — the west side is empty.">${esc(shot?.summary || '')}</textarea>
        <label class="f11 soft block">Tag</label>
        <input id="shot-tag" value="${esc(shot?.tag || 'YOURS')}" maxlength="12" placeholder="ICONIC">
        <div class="row g8 center">
          <label class="btn ghost sm grow" style="cursor:pointer">
            ${shot?.imagePath ? 'Change the picture' : 'Add a reference picture'}
            <input id="shot-photo" type="file" accept="image/*" hidden>
          </label>
          ${shot?.imagePath ? html`
            <button class="btn ghost sm none" style="width:82px" data-act="shot-photo-clear">Remove</button>` : ''}
        </div>
        ${shot?.imagePath ? html`
          <div class="photo-thumb mt8" style="width:100%;height:120px">
            <img src="${shot.imagePath}" alt=""></div>` : ''}
        <div class="form-actions">
          <button class="btn jade grow" data-act="shot-save">${made ? 'Save' : 'Add it'}</button>
          <button class="btn ghost" style="width:96px" data-act="shot-cancel">Cancel</button>
        </div>
      </div>
    </div>`;
}

export function readShotEditor(root) {
  const title = root.querySelector('#shot-title')?.value.trim();
  if (!title) return null;
  return {
    title,
    whereToFind: root.querySelector('#shot-where')?.value ?? '',
    summary: root.querySelector('#shot-summary')?.value ?? '',
    tag: root.querySelector('#shot-tag')?.value ?? 'YOURS',
  };
}

/**
 * What the app knows about a place, typed by you.
 *
 * OpenStreetMap fills what it has and leaves the rest empty, so on your own
 * places the table stands blank. These are the five rows worth typing; an
 * empty one is simply not kept, so the table never shows a label with
 * nothing under it.
 */
export function factsEditor(place) {
  const held = new Map((place?.essentials || []).map((row) => [row.key, row]));
  const rows = store.PLACE_FACTS.map((fact) => ({ ...fact, ...held.get(fact.key) }));
  const extra = (place?.essentials || []).filter((row) => !store.PLACE_FACTS.some((f) => f.key === row.key));

  return html`
    <div class="scrim" data-act="facts-cancel"></div>
    <div class="modal">
      <div class="form">
        <div class="form-title">What to remember about ${esc(place?.name || 'this place')}</div>
        ${[...rows, ...extra].map((row, at) => html`
          <label class="f11 soft block">${row.key}</label>
          <input data-fact="${at}" data-fact-key="${esc(row.key)}"
                 value="${esc(row.value || '')}" placeholder="${esc(row.hint || '')}">`)}
        <div class="form-actions">
          <button class="btn jade grow" data-act="facts-save">Save</button>
          <button class="btn ghost" style="width:96px" data-act="facts-cancel">Cancel</button>
        </div>
        <div class="form-hint">
          Leave a row empty and it is not kept. Anything a map link already found is filled in
          here and can be corrected like the rest.
        </div>
      </div>
    </div>`;
}

export function readFactsEditor(root) {
  return [...root.querySelectorAll('[data-fact]')].map((input) => ({
    key: input.dataset.factKey,
    value: input.value,
    detail: '',
  }));
}

// -------------------------------------------------------------- signing in
//
// One sheet, in two places: at the end of joining someone's trip, and on the
// trips home for anyone who arrived without a link. It is late on purpose —
// nothing here is asked for until it buys something, and what it buys is the
// trip surviving the phone.
//
// Two ways in, and no password anywhere: Google, or a link sent to an email
// address. A password is one more thing to lose on the device that is already
// the second factor, and a link that works once is less to explain.
//
// Apple is not here. Sign in with Apple on the web needs a Services ID and a
// signing key, and both come from the Apple Developer Program at $99 a year.
// The rule this app has held for seven rounds is that nothing costs money.

export function signInPanel({ title = 'Who are you?', sub = '' } = {}) {
  const waiting = store.awaitingEmail();
  const notice = state.signInNotice;

  if (waiting) {
    return html`
      <div class="eyebrow jade mb8">CHECK YOUR MAIL</div>
      <div class="f14 w800" style="color:var(--ink)">A link is on its way to ${waiting}.</div>
      <div class="f12 soft lh145 mt6">
        Open it on this phone and you are in — nothing to type and nothing to remember.
        It works once, and it expires.
      </div>
      ${notice ? html`<div class="amber-note mt12">${notice}</div>` : ''}
      <button class="btn ghost mt14" style="width:100%" data-act="sign-cancel">
        Use a different address
      </button>`;
  }

  return html`
    <div class="f16 w800 mb6" style="color:var(--ink);font-size:17px">${title}</div>
    ${sub ? html`<div class="f12 soft lh145 mb14">${sub}</div>` : ''}
    ${notice ? html`<div class="amber-note mb12">${notice}</div>` : ''}

    <label class="f11 soft block mb6">The name other travellers see</label>
    <input class="paid-input mb12" style="width:100%" data-field="name"
           value="${esc(store.me().name === 'You' ? '' : store.me().name)}" placeholder="Ana Lim">
    <button class="sign-btn" data-provider="google">Continue with Google</button>

    <div class="eyebrow mt14 mb8">Or a link to my email</div>
    <input class="paid-input mb9" style="width:100%" data-field="email" type="email"
           inputmode="email" autocomplete="email" placeholder="you@example.com">
    <button class="sign-btn" data-provider="email">Send me a link</button>

    <div class="f11 soft lh145 mt10">
      There is no password. The link in the mail is the sign-in, and it only works once.
      Apple sign-in needs a paid Apple Developer account, so it is not offered.
    </div>`;
}

/**
 * The handlers behind that sheet. `onDone` runs only when somebody is
 * actually signed in — an emailed link is not finished until it is opened,
 * which happens on a later launch entirely.
 */
export function mountSignIn(root, { onDone = () => {} } = {}) {
  delegate(root, '[data-act="sign-cancel"]', () => store.cancelEmailSignIn());

  delegate(root, '[data-provider]', async (el) => {
    const provider = el.dataset.provider;
    const name = root.querySelector('[data-field="name"]')?.value?.trim() || '';
    const email = root.querySelector('[data-field="email"]')?.value?.trim() || '';

    if (provider === 'email' && !email.includes('@')) {
      store.noteSignIn('That does not look like an email address.');
      return;
    }
    store.noteSignIn(provider === 'google' ? 'Opening Google…' : `Sending a link to ${email}…`);

    const result = await store.signIn({ provider, name, email });
    if (result.ok) {
      store.noteSignIn('');
      onDone(result);
    } else if (result.sent) {
      store.noteSignIn('');
    }
    // Anything else has already put its own words in `state.signInNotice`.
  });
}
