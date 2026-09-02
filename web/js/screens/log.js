// Screen 2i — Log. Days seed themselves from what you actually did; tap one to
// open its note.

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
    const recorded = state.log.filter((e) => e.text).length;

    return html`
      <section class="screen">
        <div class="head">
          <div class="screen-title">Log</div>
          <div class="screen-sub">
            ${state.trip?.name?.split(' · ')[0] || 'This trip'} · ${recorded} of ${state.trip?.dayCount || 0} days recorded
          </div>
        </div>

        <div class="scroll" style="padding:12px 16px 24px">
          ${state.log.length ? state.log.map((entry) => card(entry)) : html`
            <div class="empty">No notes yet. Open a stop and press "Add a note".</div>`}

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
      rowSelector: '[data-log-row]',
      label: (row) => `Delete the note for ${row.dataset.logName}?`,
      onDelete: (row) => store.deleteLogEntry(row.dataset.logRow),
    });

    delegate(root, '[data-day-note]', (el) => {
      go('note', { dayNumber: Number(el.dataset.dayNote) });
    });
  },
};

function card(entry) {
  // Only ever render tiles for photos that are actually there — a stored count
  // with no images behind it looked like a failed load.
  const photos = entry.photoPaths || [];
  const shown = photos.slice(0, 3);
  const extra = photos.length - shown.length;
  return html`
    <div class="swipe-row mb12" data-log-row="${entry.id}" data-log-name="${entry.dayLabel}">
      <div class="swipe-bin"><button class="bin" data-swipe-delete aria-label="Delete the note for ${entry.dayLabel}">${raw(icon.bin)}</button></div>
      <button class="swipe-face log-card" data-day-note="${entry.dayNumber}">
      <div class="row between g8" style="align-items:baseline">
        <div class="log-day">${entry.dayLabel} · ${entry.dateLabel}</div>
        <div class="log-meta${entry.metaIsLive ? ' live' : ''}">${entry.meta}</div>
      </div>
      ${entry.destinationLabel ? html`<div class="log-dest">${entry.destinationLabel}</div>` : ''}

      ${photos.length ? html`
        <div class="log-photos">
          ${shown.map((src) => html`<div class="log-photo"><img src="${src}" alt=""></div>`)}
          ${extra > 0 ? html`<div class="log-more">+${extra}</div>` : ''}
        </div>` : ''}

      ${entry.text ? html`<div class="log-text">${entry.text}</div>` : ''}

      ${entry.chips?.length ? html`
        <div class="row g6 wrap mt10">
          ${entry.chips.map((chip) => html`
            <span class="chip ${chip.tone === 'jade' ? 'jade' : chip.tone === 'amber' ? 'amber' : ''}">${chip.label}</span>`)}
        </div>` : ''}
      </button>
    </div>`;
}
