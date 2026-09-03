// Screen 2j — Note composer. One note: the day, the place it is about, the
// text and the photos. Reached from a stop, from a note in the Log, or from
// the Log's + button.
//
// Item 04: this used to edit "the day's note", which meant writing about a
// second place overwrote the first. It now edits one note — a new one unless
// it was opened on an existing one — so a day can carry as many as you wrote.

import { html, raw, icon, delegate, money } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go, back } from '../nav.js';
import { attachPhoto } from '../store.js';

let draft = { noteID: null, dayNumber: null, placeLabel: null, placeID: null, text: '', photos: [], loadedFor: null };
let photoNotice = '';

export default {
  id: 'note',
  tab: 'log',

  render(params = {}) {
    load(params);

    const dayNumber = draft.dayNumber ?? state.selectedDay;
    const day = store.day(dayNumber);
    const stops = pickableStops(dayNumber);
    const spend = store.spendTotals();
    const symbol = state.trip?.currencySymbol || '¥';
    const others = store.notesForDay(dayNumber).filter((n) => n.id !== draft.noteID);

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
          <div class="eyebrow">WHICH DAY</div>
          <div class="row g6 wrap mt8">
            ${Array.from({ length: state.trip?.dayCount || 6 }, (_, i) => i + 1).map((n) => html`
              <button class="note-day${n === dayNumber ? ' on' : ''}" data-pick-day="${n}">D${n}</button>`)}
          </div>
          <div class="f115 muted mt8">${day?.dateLabel || ''} · ${state.trip?.name?.split(' · ')[0] || ''}</div>

          <div class="eyebrow mt18">WHICH PLACE</div>
          <div class="col g6 mt8">
            ${stops.length ? stops.map((stop) => html`
              <button class="note-dest${stop.placeID && stop.placeID === draft.placeID ? ' on' : ''}"
                      data-pick-place="${stop.label}" data-place-id="${stop.placeID || ''}">
                <span class="radio${stop.placeID && stop.placeID === draft.placeID ? ' on' : ''}"></span>
                <span class="note-dest-name">${stop.label}</span>
                <span class="note-dest-time">${stop.time}</span>
              </button>`) : html`
              <div class="empty" style="padding:14px">No stops on this day yet.</div>`}

            <button class="note-dest${draft.placeID ? '' : ' on'}" data-pick-place="" data-place-id="">
              <span class="radio${draft.placeID ? '' : ' on'}"></span>
              <span class="note-dest-name">The day as a whole</span>
              <span class="note-dest-time">no place</span>
            </button>
          </div>

          ${others.length ? html`
            <div class="f11 soft lh145 mt8">
              ${others.length} other note${others.length === 1 ? '' : 's'} on this day already:
              ${others.map((n) => n.placeLabel || 'the day as a whole').join(', ')}. Saving this one
              adds to them.
            </div>` : ''}

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

          <label class="photo-drop mt10">
            + Photos
            <input type="file" id="note-photos" accept="image/*" multiple hidden>
          </label>

          ${photoNotice ? html`<div class="f11 amber-note mt8">${photoNotice}</div>` : ''}

          <div class="f11 soft lh145 mt10">
            Spend for this day is totalled from your shopping list
            (${money(spend.spent, symbol)} so far), so there is nothing to enter here.
          </div>
        </div>
      </section>`;
  },

  mount(root, params = {}) {
    delegate(root, '[data-act="close"]', () => { reset(); back(); });
    delegate(root, '[data-pick-day]', (el) => {
      const next = Number(el.dataset.pickDay);
      if (next === draft.dayNumber) return;
      keepText(root);
      draft.dayNumber = next;
      // A different day means a different set of places, so a place picked on
      // the old one no longer applies.
      draft.placeID = null;
      draft.placeLabel = null;
      store.selectDay(next);
    });
    delegate(root, '[data-pick-place]', (el) => {
      keepText(root);
      draft.placeLabel = el.dataset.pickPlace || null;
      draft.placeID = el.dataset.placeId || null;
      store.selectDay(draft.dayNumber ?? state.selectedDay);
    });

    // Track every keystroke: a repaint (a sync from another device, say) would
    // otherwise re-render the textarea from a stale draft and lose the typing.
    const textarea = root.querySelector('#note-text');
    textarea?.addEventListener('input', () => { draft.text = textarea.value; });
    textarea?.addEventListener('change', () => { draft.text = textarea.value; });

    const picker = root.querySelector('#note-photos');
    picker?.addEventListener('change', async () => {
      keepText(root);
      const day = draft.dayNumber ?? state.selectedDay;
      let inlined = false;
      photoNotice = 'Adding photos…';
      store.selectDay(day);

      for (const file of Array.from(picker.files || [])) {
        try {
          const result = await attachPhoto(file, `log/${day}/${Date.now()}-${file.name}`, draft.photos);
          draft.photos = [...draft.photos, result.url];
          if (result.stored === 'inline') inlined = true;
        } catch (error) {
          photoNotice = error.message || 'That photo could not be added';
          store.selectDay(day);
          return;
        }
      }

      photoNotice = !inlined ? '' : (state.mode === 'firebase'
        ? 'Kept as thumbnails, because Cloud Storage is not enabled on your Firebase project. Enable Storage for full-resolution photos — everything else already syncs.'
        : 'Kept as thumbnails on this device, because Firebase is not configured yet.');
      store.selectDay(day);
    });

    delegate(root, '[data-remove-photo]', (el) => {
      keepText(root);
      const at = Number(el.dataset.removePhoto);
      const url = draft.photos[at];
      draft.photos = draft.photos.filter((_, i) => i !== at);
      // If it was already saved to the note, take it out of storage too.
      const existing = draft.noteID ? store.noteByID(draft.noteID) : null;
      if (existing && (existing.photoPaths || []).includes(url)) {
        store.deleteLogPhoto(existing.id, url);
      }
      photoNotice = '';
      store.selectDay(draft.dayNumber ?? state.selectedDay);
    });

    delegate(root, '[data-act="save"]', () => {
      keepText(root);
      store.saveNote({
        id: draft.noteID,
        dayNumber: draft.dayNumber ?? state.selectedDay,
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

/**
 * Seeds the form once per opening. A note id edits that note; a place opens a
 * new note about that place; neither opens a blank one on the chosen day.
 */
function load(params) {
  const key = params.noteID || `new:${params.dayNumber ?? state.selectedDay}:${params.placeID || ''}`;
  if (draft.loadedFor === key) return;

  const existing = params.noteID ? store.noteByID(params.noteID) : null;
  draft = {
    noteID: existing?.id || null,
    dayNumber: existing?.dayNumber ?? params.dayNumber ?? state.selectedDay,
    placeLabel: existing?.placeLabel ?? params.placeName ?? null,
    placeID: existing?.placeID ?? params.placeID ?? null,
    text: existing?.text || '',
    photos: existing?.photoPaths || [],
    loadedFor: key,
  };
}

function keepText(root) {
  const textarea = root.querySelector('#note-text');
  if (textarea) draft.text = textarea.value;
}

function reset() {
  draft = { noteID: null, dayNumber: null, placeLabel: null, placeID: null, text: '', photos: [], loadedFor: null };
  photoNotice = '';
}

/** The day's stops plus every place picked into any of its loops. */
function pickableStops(dayNumber) {
  const day = store.day(dayNumber);
  const stops = store.activeItems(day)
    .filter((item) => !item.isSubRouteSummary && item.placeID)
    .map((item) => ({ label: item.name, time: item.time, placeID: item.placeID }));

  for (const stop of store.dayLoopStops(dayNumber)) {
    if (stops.some((s) => s.placeID === stop.place.id)) continue;
    stops.push({
      label: stop.place.name,
      time: `${stop.loop?.name || 'free time'} · ~${store.clock(stop.arrival)}`,
      placeID: stop.place.id,
    });
  }
  return stops;
}
