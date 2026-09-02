// Screen 2j — Note composer. Day, date, place and description; reached from a
// stop or by tapping a day in Log. The day's spend is totalled from the
// shopping list, so there is nothing to enter here.

import { html, raw, icon, delegate, money } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go, back } from '../nav.js';
import { attachPhoto } from '../store.js';

let draft = { dayNumber: null, placeLabel: null, placeID: null, text: '', photos: [], loadedFor: null };
let photoNotice = '';

export default {
  id: 'note',
  tab: 'log',

  render(params = {}) {
    const dayNumber = draft.dayNumber ?? params.dayNumber ?? state.selectedDay;
    load(dayNumber, params);

    const day = store.day(dayNumber);
    const stops = pickableStops(dayNumber);
    const spend = store.spendTotals();
    const symbol = state.trip?.currencySymbol || '¥';

    return html`
      <section class="screen">
        <div class="head">
          <div class="head-row center">
            <button class="iconbtn" data-act="close" aria-label="Close">${raw(icon.close)}</button>
            <div class="grow" style="font-size:18px;font-weight:700">
              ${store.logEntry(dayNumber)?.text ? 'Edit note' : 'New note'}
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
              <button class="note-dest${stop.label === draft.placeLabel ? ' on' : ''}"
                      data-pick-place="${stop.label}" data-place-id="${stop.placeID || ''}">
                <span class="radio${stop.label === draft.placeLabel ? ' on' : ''}"></span>
                <span class="note-dest-name">${stop.label}</span>
                <span class="note-dest-time">${stop.time}</span>
              </button>`) : html`
              <div class="empty" style="padding:14px">No stops on this day yet.</div>`}
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
    const dayNumber = draft.dayNumber ?? params.dayNumber ?? state.selectedDay;

    delegate(root, '[data-act="close"]', () => { reset(); back(); });
    delegate(root, '[data-pick-day="' + dayNumber + '"]', () => {});
    delegate(root, '[data-pick-day]', (el) => {
      const next = Number(el.dataset.pickDay);
      if (next === draft.dayNumber) return;
      keepText(root);
      draft.dayNumber = next;
      draft.loadedFor = null;   // pull that day's existing note instead
      store.selectDay(next);
    });
    delegate(root, '[data-pick-place]', (el) => {
      keepText(root);
      draft.placeLabel = el.dataset.pickPlace;
      draft.placeID = el.dataset.placeId || null;
      store.selectDay(draft.dayNumber ?? dayNumber);
    });

    // Track every keystroke: a repaint (a sync from another device, say) would
    // otherwise re-render the textarea from a stale draft and lose the typing.
    const textarea = root.querySelector('#note-text');
    textarea?.addEventListener('input', () => { draft.text = textarea.value; });
    textarea?.addEventListener('change', () => { draft.text = textarea.value; });

    const picker = root.querySelector('#note-photos');
    picker?.addEventListener('change', async () => {
      keepText(root);
      const day = draft.dayNumber ?? dayNumber;
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
      const existing = store.logEntry(draft.dayNumber ?? dayNumber);
      if (existing && (existing.photoPaths || []).includes(url)) {
        store.deleteLogPhoto(existing.id, url);
      }
      photoNotice = '';
      store.selectDay(draft.dayNumber ?? dayNumber);
    });

    delegate(root, '[data-act="save"]', () => {
      keepText(root);
      store.saveNote({
        dayNumber: draft.dayNumber ?? dayNumber,
        destinationLabel: draft.placeLabel || '',
        destinationPlaceID: draft.placeID,
        text: draft.text,
        photoPaths: draft.photos,
      });
      reset();
      go('log', {}, { replace: true });
    });
  },
};

/** Seeds the form from an existing note the first time a day is shown. */
function load(dayNumber, params) {
  if (draft.loadedFor === dayNumber) return;
  const existing = store.logEntry(dayNumber);
  draft = {
    dayNumber,
    placeLabel: params.placeName || existing?.destinationLabel || null,
    placeID: params.placeID || existing?.destinationPlaceID || null,
    text: existing?.text || '',
    photos: existing?.photoPaths || [],
    loadedFor: dayNumber,
  };
}

function keepText(root) {
  const textarea = root.querySelector('#note-text');
  if (textarea) draft.text = textarea.value;
}

function reset() {
  draft = { dayNumber: null, placeLabel: null, placeID: null, text: '', photos: [], loadedFor: null };
  photoNotice = '';
}

/** Main-route stops plus this day's sub-route picks. */
function pickableStops(dayNumber) {
  const day = store.day(dayNumber);
  const stops = store.activeItems(day)
    .filter((item) => !item.isSubRouteSummary)
    .map((item) => ({ label: item.name, time: item.time, placeID: item.placeID }));
  for (const stop of store.subSchedule(dayNumber).stops) {
    stops.push({
      label: `${stop.place.name} (sub)`,
      time: store.clock(stop.arrival),
      placeID: stop.place.id,
    });
  }
  return stops;
}
