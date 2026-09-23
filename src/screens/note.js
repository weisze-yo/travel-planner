// Screen 2j — one note.
//
// Opened from a place, so the place and the day are already answered and
// shown as a line you can change rather than a list you must re-pick. The
// time defaults to now, because a note is written where you are standing.

import { html, raw, icon, delegate, clock, parseClock } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go, back } from '../nav.js';
import { attachPhoto } from '../store.js';

let draft = {
  noteID: null, dayNumber: null, time: '', placeLabel: null, placeID: null,
  text: '', photos: [], loadedFor: null,
};
let photoNotice = '';
/**
 * The photo label's own pending state (P0-5 R1, #14). `photoNotice` keeps its
 * existing job — the storage notice and the error — where it already is.
 */
let addingPhotos = false;
let picking = false;

const nowClock = () => {
  const d = new Date();
  return clock(d.getHours() * 60 + d.getMinutes());
};

export default {
  id: 'note',
  tab: 'log',

  render(params = {}) {
    load(params);

    const dayNumber = draft.dayNumber ?? state.selectedDay;
    const day = store.day(dayNumber);
    const already = store.noteTimesAt(draft.placeID, dayNumber).filter((t) => t !== draft.time);
    const stop = whereLine(dayNumber);

    return html`
      <section class="screen">
        <div class="head">
          <div class="head-row center">
            <button class="iconbtn" data-act="close" aria-label="Close">${raw(icon.close)}</button>
            <div class="grow" style="font-size:18px;font-weight:700">
              ${draft.noteID ? 'Edit note' : 'New note'}
            </div>
            <button class="btn sm jade" data-act="save">Save</button>
          </div>
        </div>

        <div class="scroll" style="padding:14px 16px 24px">
          <div class="note-where">
            <div class="note-where-mark">${raw(icon.pin)}</div>
            <div class="grow">
              <div class="f135 w650">${draft.placeLabel || 'Not about a place'}</div>
              <div class="f115 muted mt2">${day?.dateLabel || `Day ${dayNumber}`}${stop ? ` · ${stop}` : ''}</div>
            </div>
            <button class="btn sm ghost" data-act="pick">${picking ? 'Done' : 'Change'}</button>
          </div>

          ${picking ? picker(dayNumber) : ''}

          <div class="row g8 mt12">
            <label class="none" style="width:120px">
              <div class="eyebrow">TIME</div>
              <input id="note-time" class="mt4" style="width:100%" value="${draft.time}" inputmode="numeric">
            </label>
            ${already.length ? html`
              <div class="grow">
                <div class="eyebrow">ALREADY HERE TODAY</div>
                <div class="row g6 wrap mt8">
                  ${already.map((t) => html`<span class="pick-chip">${t}</span>`)}
                </div>
              </div>` : ''}
          </div>

          <div class="eyebrow mt18">NOTE</div>
          <textarea id="note-text" class="note-area mt8"
                    placeholder="What happened, what to remember next time…">${draft.text}</textarea>

          ${draft.photos.length ? html`
            <div class="row g6 wrap mt10">
              ${draft.photos.map((src, i) => html`
                <div class="photo-thumb">
                  <img src="${src}" alt="Photo ${i + 1}">
                  <button class="photo-remove" data-remove-photo="${i}"
                          aria-label="Remove photo ${i + 1}">✕</button>
                </div>`)}
            </div>` : ''}

          <!-- A file label is not a <button>, so the same two properties go
               on it directly (P0-5 §4). -->
          <label class="photo-drop mt10" style="${addingPhotos ? 'opacity:.45;pointer-events:none' : ''}"${
            addingPhotos ? raw(' aria-busy="true"') : ''}>
            ${addingPhotos ? 'Adding photos…' : '+ Photos'}
            <input type="file" id="note-photos" accept="image/*" multiple hidden>
          </label>

          ${photoNotice ? html`<div class="f11 amber-note mt8">${photoNotice}</div>` : ''}

          <div class="f11 soft lh145 mt12">
            Saved against the place, not the day — so this one sits with the others
            ${draft.placeLabel ? `at ${draft.placeLabel}` : 'on this day'}, and the day just
            counts them.
          </div>
        </div>
      </section>`;
  },

  mount(root) {
    delegate(root, '[data-act="close"]', () => { reset(); back(); });
    delegate(root, '[data-act="pick"]', () => {
      keep(root);
      picking = !picking;
      store.selectDay(draft.dayNumber ?? state.selectedDay);
    });

    delegate(root, '[data-pick-day]', (el) => {
      const next = Number(el.dataset.pickDay);
      if (next === draft.dayNumber) return;
      keep(root);
      draft.dayNumber = next;
      // A different day means a different set of places.
      draft.placeID = null;
      draft.placeLabel = null;
      store.selectDay(next);
    });
    delegate(root, '[data-pick-place]', (el) => {
      keep(root);
      draft.placeID = el.dataset.pickPlace || null;
      draft.placeLabel = el.dataset.placeName || null;
      picking = false;
      store.selectDay(draft.dayNumber ?? state.selectedDay);
    });

    const timeBox = root.querySelector('#note-time');
    timeBox?.addEventListener('change', () => {
      const at = parseClock(timeBox.value.trim());
      if (at == null) timeBox.value = draft.time;
      else draft.time = clock(at);
    });

    // Track every keystroke: a repaint (a sync from another device, say)
    // would otherwise re-render the textarea from a stale draft.
    const textarea = root.querySelector('#note-text');
    textarea?.addEventListener('input', () => { draft.text = textarea.value; });
    textarea?.addEventListener('change', () => { draft.text = textarea.value; });

    const picker = root.querySelector('#note-photos');
    picker?.addEventListener('change', async () => {
      keep(root);
      const day = draft.dayNumber ?? state.selectedDay;
      let inlined = false;
      addingPhotos = true;
      photoNotice = '';
      store.selectDay(day);

      for (const file of Array.from(picker.files || [])) {
        try {
          const result = await attachPhoto(file, `log/${day}/${Date.now()}-${file.name}`, draft.photos);
          draft.photos = [...draft.photos, result.url];
          if (result.stored === 'inline') inlined = true;
        } catch (error) {
          addingPhotos = false;
          photoNotice = error.message || 'That photo could not be added';
          store.selectDay(day);
          return;
        }
      }

      addingPhotos = false;
      photoNotice = !inlined ? '' : (state.mode === 'firebase'
        ? 'Kept as thumbnails, because Cloud Storage is not enabled on your Firebase project. Enable Storage for full-resolution photos — everything else already syncs.'
        : 'Kept as thumbnails on this device, because Firebase is not configured yet.');
      store.selectDay(day);
    });

    delegate(root, '[data-remove-photo]', (el) => {
      keep(root);
      const at = Number(el.dataset.removePhoto);
      const url = draft.photos[at];
      draft.photos = draft.photos.filter((_, i) => i !== at);
      const existing = draft.noteID ? store.noteByID(draft.noteID) : null;
      if (existing && (existing.photoPaths || []).includes(url)) {
        store.deleteLogPhoto(existing.id, url);
      }
      photoNotice = '';
      store.selectDay(draft.dayNumber ?? state.selectedDay);
    });

    delegate(root, '[data-act="save"]', () => {
      keep(root);
      store.saveNote({
        id: draft.noteID,
        dayNumber: draft.dayNumber ?? state.selectedDay,
        time: draft.time,
        placeID: draft.placeID,
        placeLabel: draft.placeLabel || '',
        text: draft.text,
        photoPaths: draft.photos,
      });
      reset();
      go('log', {}, { replace: true });
    });
  },
};

/** The day and the place, as a list — only while you are changing them. */
function picker(dayNumber) {
  const stops = pickableStops(dayNumber);
  return html`
    <div class="form mt10">
      <div class="eyebrow">WHICH DAY</div>
      <div class="row g6 wrap">
        ${Array.from({ length: state.trip?.dayCount || 6 }, (_, i) => i + 1).map((n) => html`
          <button class="note-day${n === dayNumber ? ' on' : ''}" data-pick-day="${n}">D${n}</button>`)}
      </div>

      <div class="eyebrow mt8">WHICH PLACE</div>
      <div class="col g6">
        ${stops.map((stop) => html`
          <button class="note-dest${stop.placeID === draft.placeID ? ' on' : ''}"
                  data-pick-place="${stop.placeID}" data-place-name="${stop.label}">
            <span class="radio${stop.placeID === draft.placeID ? ' on' : ''}"></span>
            <span class="note-dest-name">${stop.label}</span>
            <span class="note-dest-time">${stop.time}</span>
          </button>`)}
        <button class="note-dest${draft.placeID ? '' : ' on'}" data-pick-place="" data-place-name="">
          <span class="radio${draft.placeID ? '' : ' on'}"></span>
          <span class="note-dest-name">Not about a place</span>
          <span class="note-dest-time">the day itself</span>
        </button>
      </div>
    </div>`;
}

/** "main route stop 5", or which sub route this place belongs to. */
function whereLine(dayNumber) {
  if (!draft.placeID) return '';
  const day = store.day(dayNumber);
  const numbers = store.mainStopNumbers(day);
  const hit = store.activeItems(day).find((i) => i.placeID === draft.placeID);
  if (hit) return `main route stop ${numbers[hit.id] ?? '—'}`;
  for (const route of store.subRoutesFor(dayNumber)) {
    if ((route.placeIDs || []).includes(draft.placeID)) return route.name;
  }
  return 'a place you saved';
}

/** Seeds the form once per opening. */
function load(params) {
  const key = params.noteID || `new:${params.dayNumber ?? state.selectedDay}:${params.placeID || ''}`;
  if (draft.loadedFor === key) return;

  const existing = params.noteID ? store.noteByID(params.noteID) : null;
  const placeID = existing?.placeID ?? params.placeID ?? null;
  draft = {
    noteID: existing?.id || null,
    dayNumber: existing?.dayNumber ?? params.dayNumber ?? state.selectedDay,
    time: existing?.time || nowClock(),
    placeLabel: existing?.placeLabel ?? params.placeName ?? (placeID ? store.place(placeID)?.name : null) ?? null,
    placeID,
    text: existing?.text || '',
    photos: existing?.photoPaths || [],
    loadedFor: key,
  };
  picking = false;
}

function keep(root) {
  const textarea = root.querySelector('#note-text');
  if (textarea) draft.text = textarea.value;
  const timeBox = root.querySelector('#note-time');
  if (timeBox && parseClock(timeBox.value) != null) draft.time = clock(parseClock(timeBox.value));
}

function reset() {
  draft = {
    noteID: null, dayNumber: null, time: '', placeLabel: null, placeID: null,
    text: '', photos: [], loadedFor: null,
  };
  photoNotice = '';
  addingPhotos = false;
  picking = false;
}

/** The day's stops plus every place picked into any of its sub routes. */
function pickableStops(dayNumber) {
  const day = store.day(dayNumber);
  const stops = store.activeItems(day)
    .filter((item) => item.placeID)
    .map((item) => ({ label: item.name, time: item.time, placeID: item.placeID }));

  for (const route of store.subRoutesFor(dayNumber)) {
    for (const stop of store.loopSchedule(route).stops) {
      if (stops.some((s) => s.placeID === stop.place.id)) continue;
      stops.push({
        label: stop.place.name,
        time: `${route.name} · ~${store.clock(stop.arrival)}`,
        placeID: stop.place.id,
      });
    }
  }
  return stops;
}
