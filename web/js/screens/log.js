// Screen 2i — Log. Days seed themselves from what you actually did; tap one to
// open its note.

import { html, delegate } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go } from '../nav.js';
import { RECAP_TEXT } from '../data.js';

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
    delegate(root, '[data-day-note]', (el) => {
      go('note', { dayNumber: Number(el.dataset.dayNote) });
    });
  },
};

function card(entry) {
  const shown = (entry.photoPaths || []).slice(0, 3);
  const extra = (entry.photoCount || 0) - shown.length;
  return html`
    <button class="log-card mb12" data-day-note="${entry.dayNumber}">
      <div class="row between g8" style="align-items:baseline">
        <div class="log-day">${entry.dayLabel} · ${entry.dateLabel}</div>
        <div class="log-meta${entry.metaIsLive ? ' live' : ''}">${entry.meta}</div>
      </div>
      ${entry.destinationLabel ? html`<div class="log-dest">${entry.destinationLabel}</div>` : ''}

      ${entry.photoCount ? html`
        <div class="log-photos">
          ${shown.map((src) => html`<div class="log-photo"><img src="${src}" alt=""></div>`)}
          ${Array.from({ length: Math.max(0, 3 - shown.length) }, () => html`<div class="log-photo"></div>`)}
          ${extra > 0 ? html`<div class="log-more">+${extra}</div>` : ''}
        </div>` : ''}

      ${entry.text ? html`<div class="log-text">${entry.text}</div>` : ''}

      ${entry.chips?.length ? html`
        <div class="row g6 wrap mt10">
          ${entry.chips.map((chip) => html`
            <span class="chip ${chip.tone === 'jade' ? 'jade' : chip.tone === 'amber' ? 'amber' : ''}">${chip.label}</span>`)}
        </div>` : ''}
    </button>`;
}
