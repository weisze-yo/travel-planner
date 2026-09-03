// Screen 2i — Log. One card per day, and inside it that day's notes stacked
// under the place each one is about.
//
// Item 04: a day used to hold exactly one note, which made the Log a list of
// days and the destination screen's Log tab a shrug. A note now belongs to a
// place, so the day is the heading and the notes are its contents — which is
// also why the day heading is worked out here rather than stored on a note.

import { html, raw, icon, delegate } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go } from '../nav.js';
import { RECAP_TEXT } from '../data.js';
import { swipeToDelete } from './parts.js';

export default {
  id: 'log',
  tab: 'log',

  render() {
    const groups = store.dayNoteGroups().filter((g) => g.notes.length);
    const noteCount = groups.reduce((n, g) => n + g.notes.length, 0);

    return html`
      <section class="screen">
        <div class="head">
          <div class="head-row">
            <div class="grow">
              <div class="screen-title">Log</div>
              <div class="screen-sub">
                ${state.trip?.name?.split(' · ')[0] || 'This trip'} ·
                ${noteCount} note${noteCount === 1 ? '' : 's'} across
                ${groups.length} of ${state.trip?.dayCount || 0} days
              </div>
            </div>
            <button class="btn sm ink" data-act="new">+ Note</button>
          </div>
        </div>

        <div class="scroll" style="padding:12px 16px 24px">
          ${groups.length ? groups.map((group) => dayCard(group)) : html`
            <div class="empty">
              No notes yet.<br>
              Open a stop and press "Add a note", or press <b>+ Note</b> above.
            </div>`}

          <div class="recap">
            <div class="recap-h">AFTER THE TRIP</div>
            <div class="recap-t">Trip recap</div>
            <div class="recap-b">${RECAP_TEXT}</div>
          </div>
        </div>
      </section>`;
  },

  mount(root) {
    swipeToDelete(root, {
      rowSelector: '[data-note-row]',
      label: (el) => `Delete the note about ${el.dataset.noteName}?`,
      onDelete: (el) => store.deleteLogEntry(el.dataset.noteRow),
    });

    delegate(root, '[data-act="new"]', () => go('note', { dayNumber: state.selectedDay }));
    delegate(root, '[data-open-note]', (el) => {
      go('note', { noteID: el.dataset.openNote, dayNumber: Number(el.dataset.noteDay) });
    });
    delegate(root, '[data-add-to-day]', (el) => {
      go('note', { dayNumber: Number(el.dataset.addToDay) });
    });
  },
};

function dayCard(group) {
  return html`
    <div class="day-card mb12">
      <div class="day-card-head">
        <div class="grow">
          <div class="log-day">Day ${group.dayNumber}${group.dateLabel ? ` · ${group.dateLabel}` : ''}</div>
          <div class="log-meta${group.live ? ' live' : ''}">${group.meta}</div>
        </div>
        <button class="day-card-add" data-add-to-day="${group.dayNumber}"
                aria-label="Add a note to day ${group.dayNumber}">+</button>
      </div>

      ${group.notes.map((note) => noteRow(note))}
    </div>`;
}

function noteRow(note) {
  // Only ever render tiles for photos that are actually there — a stored
  // count with no images behind it looked like a failed load.
  const photos = note.photoPaths || [];
  const shown = photos.slice(0, 3);
  const extra = photos.length - shown.length;
  const where = note.placeLabel || 'The day as a whole';

  return html`
    <div class="swipe-row swipe-flat note-slot" data-note-row="${note.id}" data-note-name="${where}">
      <div class="swipe-bin">
        <button class="bin" data-swipe-delete aria-label="Delete the note about ${where}">${raw(icon.bin)}</button>
      </div>
      <button class="swipe-face note-card" data-open-note="${note.id}" data-note-day="${note.dayNumber}">
        <div class="row g8 center">
          <div class="note-place${note.placeID ? '' : ' loose'}">${where}</div>
          ${photos.length ? html`<span class="note-pcount">${photos.length} photo${photos.length === 1 ? '' : 's'}</span>` : ''}
        </div>

        ${photos.length ? html`
          <div class="log-photos">
            ${shown.map((src) => html`<div class="log-photo"><img src="${src}" alt=""></div>`)}
            ${extra > 0 ? html`<div class="log-more">+${extra}</div>` : ''}
          </div>` : ''}

        ${note.text
          ? html`<div class="log-text">${note.text}</div>`
          : html`<div class="log-text soft">Nothing written yet — tap to write it.</div>`}
      </button>
    </div>`;
}
