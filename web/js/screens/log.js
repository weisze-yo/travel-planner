// Screen 2i — Log. One card per day, and inside it the day's notes stacked
// under the place each was written at.
//
// The place is the heading and the note is the row. A note carries the time
// it was written, because three notes at one market on one afternoon are
// only distinguishable by when — and "not about a place" is a real heading,
// since "feet destroyed, trainers tomorrow" belongs to the day.

import { html, raw, icon, delegate } from '../util.js';
import * as store from '../store.js';
import { otherNames, nameList } from '../share.js';
import { state } from '../store.js';
import { go } from '../nav.js';
import { swipeToDelete } from './parts.js';

export default {
  id: 'log',
  tab: 'log',

  render() {
    const days = store.dayNoteGroups().filter((d) => d.groups.length);
    const noteCount = state.log.length;

    if (!days.length) return emptyLog();

    return html`
      <section class="screen">
        <div class="head">
          <div class="head-row">
            <div class="grow">
              <div class="screen-title">Log</div>
              <div class="screen-sub">
                ${state.trip?.name?.split(' · ')[0] || 'This trip'} ·
                ${noteCount} note${noteCount === 1 ? '' : 's'} across
                ${days.length} day${days.length === 1 ? '' : 's'}
              </div>
            </div>
            <button class="btn sm ink" data-act="new">+ Note</button>
          </div>
        </div>

        <div class="scroll" style="padding:12px 16px 24px">
          ${privacyLine()}
          ${days.map((entry) => dayCard(entry))}

        </div>
      </section>`;
  },

  mount(root) {
    swipeToDelete(root, {
      rowSelector: '[data-note-row]',
      name: () => 'this note',
      label: (el) => (el.dataset.noteName
        ? `Gone from ${el.dataset.noteName} for good`
        : 'Gone from the Log for good'),
      onDelete: (el) => store.deleteLogEntry(el.dataset.noteRow),
    });

    delegate(root, '[data-act="new"]', () => go('note', { dayNumber: state.selectedDay }));
    delegate(root, '[data-open-note]', (el) => {
      go('note', { noteID: el.dataset.openNote, dayNumber: Number(el.dataset.noteDay) });
    });
    delegate(root, '[data-add-to-day]', (el) => go('note', { dayNumber: Number(el.dataset.addToDay) }));
    delegate(root, '[data-add-at]', (el) => go('note', {
      dayNumber: Number(el.dataset.noteDay),
      placeID: el.dataset.addAt || null,
      placeName: el.dataset.placeName || '',
    }));
  },
};

/**
 * On a shared trip the Log is the one thing that is never in the share, and
 * the screen has to say so where it is read rather than in a settings page.
 * It names the other travellers rather than counting them, because "not sent
 * to 3 people" is a statistic and "not sent to Ana" is a promise.
 */
function privacyLine() {
  const others = otherNames(store.sharePeople(), store.me().id);
  if (!others.length) return '';
  return html`
    <div class="f11 soft lh145 mb12">
      Only you can read this, even on a shared trip. Nothing here is sent to
      ${nameList(others)}.
    </div>`;
}

function dayCard(entry) {
  return html`
    <div class="day-card mb12">
      <div class="day-card-head">
        <div class="grow">
          <div class="log-day">${entry.dayLabel}${entry.dateLabel ? ` · ${entry.dateLabel}` : ''}</div>
          <div class="log-meta${entry.live ? ' live' : ''}">${entry.meta}</div>
        </div>
        <button class="btn sm ghost" data-add-to-day="${entry.dayNumber}">+ Note</button>
      </div>

      ${entry.groups.map((group) => html`
        <div class="note-head${group.tone === 'sub' ? ' sub' : ''}${group.key === '__day' ? ' loose' : ''}"
             data-add-at="${group.key === '__day' ? '' : group.key}"
             data-note-day="${entry.dayNumber}" data-place-name="${group.name}">
          <div class="note-head-time">${group.time}</div>
          <div class="grow note-head-name">${group.name}</div>
          ${group.badge ? html`<span class="badge ${group.tone === 'sub' ? 'sub' : 'main'}">${group.badge}</span>` : ''}
        </div>

        ${group.notes.map((note) => noteRow(note, group))}
      `)}

      ${entry.chips.length ? html`
        <div class="row g6 wrap day-card-foot">
          ${entry.chips.map((chip) => html`<span class="chip ${chip.tone}">${chip.label}</span>`)}
        </div>` : ''}
    </div>`;
}

function noteRow(note, group) {
  const photos = note.photoPaths || [];
  const shown = photos.slice(0, 3);
  const extra = photos.length - shown.length;

  return html`
    <div class="swipe-row swipe-flat note-slot" data-note-row="${note.id}" data-note-name="${group.name}">
      <div class="swipe-bin">
        <button class="bin" data-swipe-delete aria-label="Delete this note">${raw(icon.bin)}</button>
      </div>
      <button class="swipe-face note-card" data-open-note="${note.id}" data-note-day="${note.dayNumber}">
        <div class="row g8 center">
          <div class="note-time">${note.time}</div>
          ${photos.length ? html`
            <div class="f11 w650 soft">${photos.length} photo${photos.length === 1 ? '' : 's'}</div>` : ''}
        </div>
        ${note.text
          ? html`<div class="log-text">${note.text}</div>`
          : html`<div class="log-text soft">Nothing written yet — tap to write it.</div>`}
        ${photos.length ? html`
          <div class="log-photos">
            ${shown.map((src) => html`<div class="log-photo"><img src="${src}" alt=""></div>`)}
            ${extra > 0 ? html`<div class="log-more">+${extra}</div>` : ''}
          </div>` : ''}
      </button>
    </div>`;
}

/** One sentence and one button — no day cards before there is anything in them. */
function emptyLog() {
  return html`
    <section class="screen">
      <div class="head">
        <div class="screen-title">Log</div>
        <div class="screen-sub">${state.trip?.name?.split(' · ')[0] || 'This trip'} · no notes yet</div>
      </div>
      <div class="scroll col center" style="padding:12px 16px 24px;justify-content:center;gap:18px">
        <div class="f135 lh16 center-text" style="color:#8A948F;max-width:250px;text-align:center">
          Fills itself in as you write. Nothing to see until there is a first note.
        </div>
        <button class="btn ink" style="padding:0 20px" data-act="new">+ Note</button>
        <div class="f11 soft lh145" style="max-width:250px;text-align:center">
          The day, the place and the time are chosen inside the note. This line goes with the
          first one you write.
        </div>
      </div>
    </section>`;
}
